// control-pad watcher — the steering wheel for the Ventus OS Bench.
//
// Every POLL_MS: git pull the pad, find inbox notes not yet seen, execute orders against the
// Bench API (drive / reset), queue prose for agents, write outbox results + STATE.md, push.
// Runs beside server.mjs (the Bench) on the MSI.  node controlpad.mjs
import { readFile, readdir, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const PAD = process.env.PAD_DIR || 'C:/Users/vikra/Documents/GitHub/control-pad';
const BENCH_URL = 'http://127.0.0.1:8790';
const BENCH = path.dirname(fileURLToPath(import.meta.url));
const SEEN_FILE = path.join(BENCH, 'state', 'controlpad-seen.json');
const POLL_MS = Number(process.env.PAD_POLL_MS || 20000);
const HOST = 'MSI · RTX 5070 Ti';

const git = (...a) => run('git', ['-C', PAD, ...a], { maxBuffer: 1 << 24 });
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/T/, '-').slice(0, 15);
const log = m => console.log(`${new Date().toISOString()}  ${m}`);

let seen = {};
try { seen = JSON.parse(await readFile(SEEN_FILE, 'utf8')); } catch {}
const saveSeen = () => writeFile(SEEN_FILE, JSON.stringify(seen, null, 2));

// tiny front-matter parser: `key: value` and `key:` with indented `sub: value` lines
function parseNote(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { order: null, meta: {}, body: text.trim() };
  const meta = {}; let cur = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const top = raw.match(/^(\w[\w-]*):\s*(.*)$/), sub = raw.match(/^\s+([\w.\-]+):\s*(.*)$/);
    if (top) { cur = top[1]; meta[cur] = top[2] === '' ? {} : coerce(top[2]); }
    else if (sub && cur && typeof meta[cur] === 'object') meta[cur][sub[1]] = coerce(sub[2]);
  }
  return { order: meta.order || null, meta, body: m[2].trim() };
}
const coerce = v => v === 'true' ? true : v === 'false' ? false : v.replace(/^["']|["']$/g, '');

async function bench(pathname, body) {
  const r = await fetch(BENCH_URL + pathname, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  if (!r.ok) throw new Error(`bench ${pathname} HTTP ${r.status}`);
  return r.json();
}

async function execute(note) {
  const { order, meta, body } = parseNote(note.text);
  const slug = note.name.replace(/^\d{12}-/, '').replace(/\.md$/, '');
  if (!order) {
    await appendFile(path.join(PAD, 'outbox', 'QUEUE-FOR-AGENTS.md'), `\n## ${note.name}\n\n${body}\n`);
    return { kind: 'prose', summary: 'queued for agents' };
  }
  if (order === 'reset') { await bench('/api/reset'); return { kind: 'reset', summary: 'bench reset to live composition' }; }
  if (order === 'drive') {
    await bench('/api/choice', { enabled: meta.enabled || {}, selected: meta.selected || {} });
    const r = await bench('/api/testdrive', {});
    const out = `${stamp()}-drive-${slug}`;
    await copyFile(path.join(BENCH, r.screenshot), path.join(PAD, 'outbox', `${out}.jpg`));
    const parts = Object.entries(r.health).filter(([, h]) => h.findings || ['red', 'amber'].includes(h.colour));
    const md = `# ${r.verdict} · drive · ${slug}

Order: \`inbox/${note.name}\` — *${body.split('\n')[0] || '(no text)'}*
Composition: \`${r.composition.generation}\` · loaded: ${r.composition.order.join(', ') || 'shell only'}
${r.composition.cartridges.filter(c => c.swapped_from).map(c => `Swapped: **${c.id}** → \`${c.file}\` (was \`${c.swapped_from}\`)`).join('\n')}
Load ${r.loadMs} ms · router ${r.probe.router} · layers ${r.probe.layers?.ok ?? '?'} OK / ${r.probe.layers?.wait ?? '?'} WAIT · canvases ${r.probe.canvases ?? '?'}

## Health
${Object.entries(r.health).map(([id, h]) => `- ${h.colour === 'red' ? '🔴' : h.colour === 'amber' ? '🟡' : '🟢'} **${id}** (${h.findings})`).join('\n')}

## Findings
${r.findings.length ? r.findings.slice(0, 20).map(f => `- [${f.level}] **${f.part}**: ${f.text}${f.line != null ? ` (L${f.line})` : ''}`).join('\n') : '- none'}
${r.probe.banners?.length ? '\n## Banners\n' + r.probe.banners.map(b => `- ${b}`).join('\n') : ''}

![screenshot](./${out}.jpg)

_${HOST} · bench run ${r.stamp}_
`;
    await writeFile(path.join(PAD, 'outbox', `${out}.md`), md);
    return { kind: 'drive', summary: `${r.verdict} — ${r.findings.length} findings → outbox/${out}.md`, verdict: r.verdict };
  }
  if (order === 'promote') {
    await appendFile(path.join(PAD, 'outbox', 'QUEUE-FOR-AGENTS.md'), `\n## ${note.name} — PROMOTE requested, needs the architect's explicit go in a session\n\n${body}\n`);
    return { kind: 'promote', summary: 'promotion never runs unattended — queued for a session' };
  }
  return { kind: 'unknown', summary: `unknown order "${order}" — queued for agents` };
}

async function appendFile(file, text) { let cur = ''; try { cur = await readFile(file, 'utf8'); } catch {} await writeFile(file, cur + text); }

async function writeState(recent) {
  let alive = false, runs = [];
  try { runs = await bench('/api/runs'); alive = true; } catch {}
  const md = `# STATE — written by the machine, do not edit

Host: ${HOST} · Bench: ${alive ? 'ALIVE at ' + BENCH_URL : 'NOT RUNNING'} · updated ${new Date().toISOString()}

## Last notes handled
${recent.length ? recent.map(r => `- \`${r.name}\` → ${r.summary}`).join('\n') : '- none this cycle'}

## Recent bench runs
${runs.slice(0, 10).map(r => `- ${r.stamp} **${r.verdict}** ${r.loadMs} ms · ${r.cartridges.map(c => c.id + (c.swapped_from ? '⇄' : '')).join(', ') || 'shell only'}`).join('\n') || '- none'}
`;
  await writeFile(path.join(PAD, 'STATE.md'), md);
}

async function cycle() {
  await git('pull', '--ff-only', '--quiet').catch(e => log('pull failed: ' + e.message));
  const files = (await readdir(path.join(PAD, 'inbox'))).filter(f => /^\d{12}-.*\.md$/.test(f)).sort();
  const handled = [];
  for (const name of files) {
    const text = await readFile(path.join(PAD, 'inbox', name), 'utf8');
    const sha = createHash('sha1').update(text).digest('hex');
    if (seen[name] === sha) continue;
    log(`note ${name}`);
    let result;
    try { result = await execute({ name, text }); } catch (e) { result = { kind: 'error', summary: 'error: ' + e.message }; }
    seen[name] = sha; await saveSeen();
    handled.push({ name, ...result });
    log(`  → ${result.summary}`);
  }
  if (!handled.length && process.env.PAD_STATE_EVERY_CYCLE !== '1') return;
  await writeState(handled);
  await git('add', '--', 'outbox', 'STATE.md');
  const msg = handled.length ? `pad: ${handled.map(h => `${h.name.replace(/\.md$/, '')} → ${h.kind}${h.verdict ? ' ' + h.verdict : ''}`).join('; ')}` : 'pad: state';
  const status = (await git('status', '--porcelain')).stdout.trim();
  if (!status) return;
  await git('commit', '-q', '-m', msg + '\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>');
  await git('push', '--quiet').catch(e => log('push failed: ' + e.message));
  log(`pushed: ${msg}`);
}

log(`watching ${PAD} every ${POLL_MS / 1000}s`);
for (;;) { try { await cycle(); } catch (e) { log('cycle error: ' + e.message); } await new Promise(r => setTimeout(r, POLL_MS)); }
