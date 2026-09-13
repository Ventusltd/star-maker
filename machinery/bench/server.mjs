// VENTUS OS · THE BENCH — GridAtlas on the lift.
//
// Serves the real GridAtlas app read-only from the gridatlas repo, but answers
// /atlas/current.json from the bench's own composition, so cartridges can be
// unplugged or swapped to any version in cartridges/ without touching the repo.
// A test drive loads the composed app in Chrome on the GPU and reports health
// per part: exceptions and console errors are attributed to the cartridge whose
// blob URL raised them. Nothing here writes to the repo.
//
//   node server.mjs            → http://127.0.0.1:8790/   (bench UI)
//                                http://127.0.0.1:8790/atlas/   (the composed car, open in your own Chrome)
import http from 'node:http';
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = Number(process.env.BENCH_PORT || 8790);
const ATLAS_DIR = process.env.ATLAS_DIR || 'C:/Users/vikra/Documents/GitHub/gridatlas/atlas';
// The shell's canonical deep link fetches /uk_renewables_pipeline/v9/... (served on the live
// site by the globalgrid2050 repo). Serve the same bytes here so deep-link stars arrive for real.
const GG_DIR = process.env.GG_DIR || 'C:/Users/vikra/Documents/GitHub/globalgrid2050';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BENCH = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(BENCH, 'state', 'choice.json');
const RUNS = path.join(BENCH, 'runs');
// Storage law: the sandbox may use at most CEILING on the local SSD; beyond that, runs go to
// the external SSD. Size is re-measured every 200 runs (a full walk is cheap at this scale).
const SANDBOX_ROOT = path.resolve(BENCH, '..');
const OVERFLOW_RUNS = process.env.BENCH_OVERFLOW_DIR || 'D:/Claude-Sandbox-MSI/bench-runs';
const CEILING_BYTES = Number(process.env.BENCH_CEILING_GB || 100) * 1024 ** 3;
await mkdir(path.dirname(STATE_FILE), { recursive: true });
await mkdir(RUNS, { recursive: true });
let sandboxBytes = 0, runsSinceMeasure = 200;
async function dirBytes(dir) {
  let total = 0;
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') total += await dirBytes(p); }
    else total += (await stat(p).catch(() => ({ size: 0 }))).size;
  }
  return total;
}
async function runsDir() {
  if (++runsSinceMeasure >= 200) { sandboxBytes = await dirBytes(SANDBOX_ROOT); runsSinceMeasure = 0; }
  if (sandboxBytes < CEILING_BYTES) return RUNS;
  await mkdir(OVERFLOW_RUNS, { recursive: true }).catch(() => {});
  return OVERFLOW_RUNS;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.geojson': 'application/geo+json', '.parquet': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm', '.txt': 'text/plain', '.csv': 'text/csv', '.pbf': 'application/x-protobuf', '.ico': 'image/x-icon' };

// ---------- parts: what is on the shelf ----------
const shaCache = new Map();
async function sha256File(file) {
  if (!shaCache.has(file)) shaCache.set(file, createHash('sha256').update(await readFile(file)).digest('hex'));
  return shaCache.get(file);
}
const family = f => f.replace(/^\d{12}-/, '').replace(/-v\d+-\d+\.js$/, '').replace(/\.js$/, '');

async function liveManifest() { return JSON.parse(await readFile(path.join(ATLAS_DIR, 'current.json'), 'utf8')); }

async function parts() {
  const live = await liveManifest();
  const files = (await readdir(path.join(ATLAS_DIR, 'cartridges'))).filter(f => f.endsWith('.js'));
  const shellIndex = await readFile(path.join(ATLAS_DIR, live.shell.index), 'utf8');
  const shellScripts = [...shellIndex.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]);
  const cartridges = await Promise.all(live.cartridge_order.map(async id => {
    const c = live.cartridges.find(x => x.id === id);
    const current = path.basename(c.path);
    const fam = family(current);
    const versions = await Promise.all(files.filter(f => family(f) === fam).sort().reverse().map(async f => ({
      file: f, stamp: f.slice(0, 12), contract: (f.match(/-v(\d+)-(\d+)\.js$/) || ['', '?', '?']).slice(1).join('.'),
      bytes: (await stat(path.join(ATLAS_DIR, 'cartridges', f))).size, live: f === current,
    })));
    return { id, live_version: c.version, live_generation: c.generation, replace_script: c.replace_script,
      family: fam, capabilities: c.capabilities || [], contract: c.contract || null, live_file: current, versions };
  }));
  return { generation: live.generation, release_id: live.release_id, shell: live.shell, shell_scripts: shellScripts, cartridges };
}

// ---------- composition: what is bolted on right now ----------
async function readChoice() {
  try { return JSON.parse(await readFile(STATE_FILE, 'utf8')); } catch { return { enabled: {}, selected: {} }; }
}
async function writeChoice(choice) { await writeFile(STATE_FILE, JSON.stringify(choice, null, 2)); }

// Parallel universes: /u/<id>/atlas/ serves the same atlas with its own composition, so many
// compositions can be driven at once without sharing state. A universe id is the hash of its
// choice — the same seed always addresses the same star.
const universes = new Map();
function universeId(choice) { return createHash('sha1').update(JSON.stringify(choice)).digest('hex').slice(0, 12); }

async function composedManifest(choiceOverride) {
  const live = await liveManifest();
  const choice = choiceOverride || await readChoice();
  const m = structuredClone(live);
  m.previous_generation = live.generation;
  m.generation = 'bench-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  m.bench = { source_generation: live.generation, choice };
  m.cartridge_order = live.cartridge_order.filter(id => choice.enabled[id] !== false);
  m.cartridges = await Promise.all(live.cartridges.filter(c => m.cartridge_order.includes(c.id)).map(async c => {
    const f = choice.selected[c.id];
    if (!f || f === path.basename(c.path)) return c;
    return { ...c, path: './cartridges/' + f, sha256: await sha256File(path.join(ATLAS_DIR, 'cartridges', f)),
      generation: f.slice(0, 12), bench_swapped_from: path.basename(c.path) };
  }));
  return m;
}

// ---------- test drive: run the composed car on the GPU ----------
// One Chrome for all universes: concurrent callers share a single launch promise, so parallel
// drives never race to start a second Chrome on the same profile.
let browserPromise = null, browserHeaded = null;
async function getBrowser(headed) {
  if (browserPromise && browserHeaded === headed) { const b = await browserPromise.catch(() => null); if (b && b.connected) return b; }
  if (browserPromise) { const old = await browserPromise.catch(() => null); await old?.close().catch(() => {}); }
  browserHeaded = headed;
  browserPromise = puppeteer.launch({ executablePath: CHROME, headless: !headed, defaultViewport: { width: 1600, height: 1000 },
    userDataDir: path.join(BENCH, 'state', 'chrome-profile'),
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling'] });
  return browserPromise;
}

async function testDrive({ headed = false, settleMs = 12000, choice = null, query = '', expect = null } = {}) {
  const manifest = await composedManifest(choice || undefined);
  let uid = null;
  if (choice) { uid = universeId(choice); universes.set(uid, choice); }
  const page = await (await getBrowser(headed)).newPage();
  const cdp = await page.createCDPSession();
  await cdp.send('Runtime.enable');
  const exceptions = [], consoleMsgs = [], failedReq = [];
  cdp.on('Runtime.exceptionThrown', e => {
    const d = e.exceptionDetails;
    exceptions.push({ text: String(d.exception?.description || d.text || '').split('\n')[0].slice(0, 300),
      url: d.url || d.stackTrace?.callFrames?.[0]?.url || '', line: d.lineNumber });
  });
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 300), url: m.location()?.url || '' }); });
  page.on('requestfailed', r => failedReq.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 200)));
  page.on('response', r => { if (r.status() >= 400) failedReq.push(`HTTP ${r.status()} ${r.url()}`.slice(0, 200)); });

  const url = (uid ? `http://127.0.0.1:${PORT}/u/${uid}/atlas/` : `http://127.0.0.1:${PORT}/atlas/`) + (query ? (query.startsWith('?') ? query : '?' + query) : '');
  const t0 = Date.now();
  let navError = null;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => { navError = e.message.slice(0, 200); });
  await new Promise(r => setTimeout(r, settleMs));
  const loadMs = Date.now() - t0;

  const probe = await page.evaluate((expect) => {
    const text = document.body?.innerText || '';
    return {
      arrived: expect ? text.includes(expect) : null,
      km: (text.match(/\b\d+(?:\.\d+)?\s?km\b/g) || []).slice(0, 5),
      router: document.body?.dataset?.gridatlasRouter || (document.documentElement.dataset.gridatlasGeneration ? 'composed' : 'unknown'),
      generation: document.documentElement.dataset.gridatlasGeneration || null,
      loaded: (window.__GRIDATLAS_ATLAS__ || {}).loaded_cartridges || [],
      scripts: [...document.querySelectorAll('script[data-gridatlas-cartridge]')].map(s => ({ id: s.dataset.gridatlasCartridge, src: s.src })),
      loaderText: document.getElementById('gridatlas-loader')?.innerText || '',
      layers: { ok: (text.match(/\[OK\]/g) || []).length, wait: (text.match(/\[WAIT\]/g) || []).length, fail: (text.match(/\[(FAIL|ERR|ERROR)\]/g) || []).length },
      canvases: document.querySelectorAll('canvas').length,
      banners: [...document.querySelectorAll('body *')].filter(el => el.children.length === 0 && el.offsetParent && /not installed|mismatch|failed|error/i.test(el.textContent))
        .slice(0, 6).map(el => el.textContent.trim().slice(0, 200)),
    };
  }, expect).catch(e => ({ router: 'probe-failed', probeError: e.message, loaded: [], scripts: [], layers: {}, banners: [] }));
  const deeplinkFailed = consoleMsgs.filter(m => /DEEP LINK FAILED/.test(m.text)).map(m => m.text.slice(0, 200));

  const byBlob = new Map(probe.scripts.map(s => [s.src, s.id]));
  const attribute = u => byBlob.get(u) || (!u ? 'unattributed' : u.includes('/atlas/releases/') ? 'shell' : /cdn\.|unpkg|jsdelivr/.test(u) ? 'vendor' : u.includes('/atlas/') ? 'loader' : /favicon\.ico/.test(u) ? 'noise' : 'other');
  const findings = [
    ...exceptions.map(e => ({ level: 'exception', part: attribute(e.url), text: e.text, url: e.url, line: e.line })),
    ...consoleMsgs.map(m => ({ level: m.type === 'error' ? 'console-error' : 'warning', part: attribute(m.url), text: m.text, url: m.url })),
  ];
  const partIds = [...manifest.cartridge_order, 'shell', 'loader', 'vendor', 'other', 'unattributed'];
  const health = Object.fromEntries(partIds.map(id => {
    const mine = findings.filter(f => f.part === id);
    const colour = mine.some(f => f.level === 'exception') ? 'red' : mine.some(f => f.level === 'console-error') ? 'amber' : 'green';
    return [id, { colour, findings: mine.length }];
  }));
  const realConsoleErrors = findings.filter(f => f.level === 'console-error' && f.part !== 'noise');
  const verdict = probe.router === 'failed' || navError || exceptions.length ? 'RED' : (realConsoleErrors.length || probe.banners.length) ? 'AMBER' : 'GREEN';

  const shot = await page.screenshot({ type: 'jpeg', quality: 60 });
  await page.close();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  const run = { stamp, universe: uid, verdict, loadMs, navError, query: query || null, arrival: expect ? { expected: expect, arrived: probe.arrived, km: probe.km, failed: deeplinkFailed } : null, composition: { generation: manifest.generation, source_generation: manifest.bench.source_generation, order: manifest.cartridge_order,
      cartridges: manifest.cartridges.map(c => ({ id: c.id, file: path.basename(c.path), swapped_from: c.bench_swapped_from || null })) },
    probe: { ...probe, scripts: undefined }, health, findings, failedRequests: failedReq.slice(0, 30), screenshot: `runs/${stamp}.jpg` };
  const dir = await runsDir();
  run.screenshot_path = path.join(dir, `${stamp}.jpg`);
  run.overflow = dir !== RUNS;
  await writeFile(path.join(dir, `${stamp}.json`), JSON.stringify(run, null, 2));
  await writeFile(run.screenshot_path, shot);
  return run;
}

// ---------- http ----------
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
async function serveFile(res, root, rel) {
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(path.normalize(root))) return json(res, 403, { error: 'forbidden' });
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch { json(res, 404, { error: 'not found', file: rel }); }
}
const body = req => new Promise(r => { let s = ''; req.on('data', c => s += c); req.on('end', () => r(s ? JSON.parse(s) : {})); });

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  try {
    const um = u.pathname.match(/^\/u\/([a-f0-9]{12})\/atlas\/(.*)$/);
    if (um) {
      const choice = universes.get(um[1]); if (!choice) return json(res, 404, { error: 'unknown universe' });
      if (um[2] === 'current.json') return json(res, 200, await composedManifest(choice));
      const rel = decodeURIComponent(um[2]) || 'index.html'; return serveFile(res, ATLAS_DIR, rel.endsWith('/') || rel === '' ? rel + 'index.html' : rel);
    }
    if (u.pathname.startsWith('/uk_renewables_pipeline/')) return serveFile(res, path.join(GG_DIR, 'uk_renewables_pipeline'), decodeURIComponent(u.pathname.slice(24)));
    if (u.pathname === '/atlas/current.json') return json(res, 200, await composedManifest());
    if (u.pathname.startsWith('/atlas/')) { const rel = decodeURIComponent(u.pathname.slice(7)) || 'index.html'; return serveFile(res, ATLAS_DIR, rel.endsWith('/') || rel === '' ? rel + 'index.html' : rel); }
    if (u.pathname === '/api/parts') return json(res, 200, await parts());
    if (u.pathname === '/api/choice' && req.method === 'GET') return json(res, 200, await readChoice());
    if (u.pathname === '/api/choice' && req.method === 'POST') { await writeChoice(await body(req)); return json(res, 200, await composedManifest()); }
    if (u.pathname === '/api/reset') { await writeChoice({ enabled: {}, selected: {} }); return json(res, 200, { ok: true }); }
    if (u.pathname === '/api/manifest') return json(res, 200, await composedManifest());
    if (u.pathname === '/api/testdrive' && req.method === 'POST') { const o = await body(req); return json(res, 200, await testDrive(o)); }
    if (u.pathname === '/api/runs') {
      const files = (await readdir(RUNS)).filter(f => f.endsWith('.json')).sort().reverse().slice(0, 30);
      return json(res, 200, await Promise.all(files.map(async f => { const r = JSON.parse(await readFile(path.join(RUNS, f), 'utf8')); return { stamp: r.stamp, verdict: r.verdict, loadMs: r.loadMs, order: r.composition.order, cartridges: r.composition.cartridges, screenshot: r.screenshot, health: r.health }; })));
    }
    if (u.pathname.startsWith('/runs/')) { const rel = u.pathname.slice(6); return (await stat(path.join(RUNS, rel)).catch(() => null)) ? serveFile(res, RUNS, rel) : serveFile(res, OVERFLOW_RUNS, rel); }
    if (u.pathname === '/api/storage') return json(res, 200, { sandbox_bytes: sandboxBytes, ceiling_bytes: CEILING_BYTES, overflow_dir: OVERFLOW_RUNS, overflowing: sandboxBytes >= CEILING_BYTES });
    if (u.pathname === '/' || u.pathname === '/index.html') return serveFile(res, BENCH, 'index.html');
    json(res, 404, { error: 'no route' });
  } catch (e) { json(res, 500, { error: e.message, stack: e.stack }); }
}).listen(PORT, '127.0.0.1', () => console.log(`BENCH  http://127.0.0.1:${PORT}/   composed atlas → http://127.0.0.1:${PORT}/atlas/`));
