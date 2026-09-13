// EYES: load pages in real Chrome on the GPU, in parallel, wait for them to settle,
// capture console errors / failed requests / screenshot. Screenshots stay in RAM and
// are only written as small JPEGs (or only for failing pages with --failures-only).
//
// node eyes.mjs targets.json [--concurrency 8] [--failures-only] [--headed]
import puppeteer from 'puppeteer-core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); return i < 0 ? dflt : (args[i + 1] ?? true); };
const targetsFile = args.find(a => a.endsWith('.json')) ?? 'targets.json';
const concurrency = Number(flag('--concurrency', 8));
const failuresOnly = args.includes('--failures-only');
const headed = args.includes('--headed');

const targets = JSON.parse((await readFile(targetsFile, 'utf8')).replace(/^﻿/, ''));
const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13);
const runDir = path.join('runs', stamp);
await mkdir(runDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: !headed,
  userDataDir: path.join(tmpdir(), 'eyes-chrome-profile'),
  defaultViewport: { width: 1600, height: 1000 },
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
         '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});

const gpu = await (async () => {
  const p = await browser.newPage();
  const info = await p.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return gl ? gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) : 'NO WEBGL';
  });
  await p.close();
  return info;
})();
console.log(`GPU: ${gpu}\nTargets: ${targets.length}  concurrency: ${concurrency}\n`);

async function inspect(t) {
  const page = await browser.newPage();
  const consoleErrors = [], pageErrors = [], failed = [];
  page.on('console', m => { if (['error', 'warn'].includes(m.type())) consoleErrors.push(`[${m.type()}] ${m.text()}`.slice(0, 400)); });
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 400)));
  page.on('requestfailed', r => failed.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 300)));
  page.on('response', r => { if (r.status() >= 400) failed.push(`HTTP ${r.status()} ${r.url()}`.slice(0, 300)); });

  const t0 = Date.now();
  let status = null, navError = null;
  try {
    const resp = await page.goto(t.url, { waitUntil: 'networkidle2', timeout: (t.timeoutSec ?? 60) * 1000 });
    status = resp?.status() ?? null;
  } catch (e) { navError = e.message.slice(0, 200); }
  await new Promise(r => setTimeout(r, (t.settleSec ?? 4) * 1000));
  for (const text of t.clickText ?? []) {
    const clicked = await page.evaluate(txt => {
      const el = [...document.querySelectorAll('button, a, [role=button], label, li, div, span')]
        .find(e => e.offsetParent && e.textContent.trim() === txt);
      if (el) el.click();
      return !!el;
    }, text);
    if (!clicked) consoleErrors.push(`[eyes] could not find clickable "${text}"`);
    await new Promise(r => setTimeout(r, 2500));
  }
  const loadMs = Date.now() - t0;

  const probe = await page.evaluate(() => ({
    title: document.title,
    textChars: document.body?.innerText.length ?? 0,
    canvases: [...document.querySelectorAll('canvas')].map(c => `${c.width}x${c.height}`),
    visibleErrorBanners: [...document.querySelectorAll('body *')]
      .filter(el => el.children.length === 0 && /error|failed|not installed|mismatch|nothing to/i.test(el.textContent) && el.offsetParent)
      .slice(0, 5).map(el => el.textContent.trim().slice(0, 200)),
  })).catch(e => ({ probeError: e.message }));

  const shot = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: !!t.fullPage });
  const problems = pageErrors.length + consoleErrors.filter(e => e.startsWith('[error]')).length
                 + (navError ? 1 : 0) + (status && status >= 400 ? 1 : 0) + (probe.visibleErrorBanners?.length ?? 0);
  const verdict = problems ? 'RED' : 'GREEN';
  if (!failuresOnly || verdict === 'RED') await writeFile(path.join(runDir, `${t.id}.jpg`), shot);
  await page.close();

  const r = { id: t.id, url: t.url, verdict, status, loadMs, navError, ...probe, pageErrors, consoleErrors: consoleErrors.slice(0, 15), failedRequests: failed.slice(0, 15) };
  console.log(`${verdict === 'RED' ? '🔴' : '🟢'} ${t.id.padEnd(24)} ${String(status).padEnd(4)} ${String(loadMs).padStart(6)} ms  errors:${pageErrors.length}/${consoleErrors.length}  failedReq:${failed.length}`);
  return r;
}

const queue = [...targets], results = [];
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
  while (queue.length) results.push(await inspect(queue.shift()));
}));
await browser.close();

results.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(path.join(runDir, 'report.json'), JSON.stringify({ gpu, stamp, results }, null, 2));
console.log(`\nReport: ${path.resolve(runDir, 'report.json')}`);
