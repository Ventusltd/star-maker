// STAR-MAKER — runs all night on the MSI. Every composition of GridAtlas is a seed; every drive
// on the GPU is a star; the star-maker repo is the sky.
//
// Pass:    enumerate seeds (live · every unplug subset · every shelf version), drive the ones not
//          yet in the sky, N at a time (GPU headroom), write stars/<id>.json (+ shots/ for non-green).
// Survey:  hourly, the eyes rig over every published page → sky/survey-<stamp>.json.
// Loop:    push after each pass/survey; new pass only when the live atlas generation changes.
//
//   node starmaker.mjs          (Bench server.mjs must be running on :8790)
import { readFile, readdir, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const BENCH_URL = 'http://127.0.0.1:8790';
const BENCH = path.dirname(fileURLToPath(import.meta.url));
const EYES = path.resolve(BENCH, '..', 'eyes');
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const ATLAS_REPO = process.env.ATLAS_REPO || 'C:/Users/vikra/Documents/GitHub/gridatlas';
const HOST_NAME = process.env.STAR_HOST || 'MSI · RTX 5070 Ti';
const ORDER = process.env.STAR_ORDER || 'forward';   // a second machine runs 'reverse' so the two meet in the middle
const CONCURRENCY = Number(process.env.STAR_CONCURRENCY || 12);  // measured at 4: GPU 9 %, VRAM 1.6 GB, CPU 2 % — a drive is 12 s of waiting, so breadth is the lever
// Live control: state/star-control.json {"concurrency": N} is re-read every few seconds, so the
// watch can turn the dial without a restart. Workers above the dial idle; below it, they work.
const MAX_WORKERS = 16;
const CONTROL_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'state', 'star-control.json');
let dial = CONCURRENCY;
async function readDial() { try { const c = JSON.parse(await readFile(CONTROL_FILE, 'utf8')); if (Number.isFinite(c.concurrency)) dial = Math.max(1, Math.min(MAX_WORKERS, c.concurrency)); } catch {} }
const SURVEY_EVERY_MS = 60 * 60 * 1000;
const IDLE_MS = 30 * 60 * 1000;
const MAX_STARS_PER_PASS = Number(process.env.STAR_MAX || 6000);
const PUSH_EVERY = 100;  // stars between pushes during a long pass, so the sky grows while the pass runs
// Log to a file directly: stdout redirected by a parent shell dies with that shell overnight.
import { appendFileSync } from 'node:fs';
const LOG_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'state', 'starmaker.log');
const log = m => { const line = `${new Date().toISOString()}  ${m}\n`; try { appendFileSync(LOG_FILE, line); } catch {} try { process.stdout.write(line); } catch {} };
const git = (...a) => run('git', ['-C', SKY, ...a], { maxBuffer: 1 << 24 });
const stampNow = () => new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
const exists = p => access(p).then(() => true, () => false);
const api = (p, body) => fetch(BENCH_URL + p, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}).then(r => { if (!r.ok) throw new Error(`${p} HTTP ${r.status}`); return r.json(); });

for (const d of ['stars', 'shots', 'sky']) await mkdir(path.join(SKY, d), { recursive: true });

function seeds(parts) {
  const ids = parts.cartridges.map(c => c.id);
  const out = [{ kind: 'live', label: 'live composition as published', choice: { enabled: {}, selected: {} } }];
  for (let mask = 1; mask < (1 << ids.length); mask++) {
    const off = ids.filter((_, i) => mask & (1 << i));
    out.push({ kind: 'unplug', label: `without ${off.join(' + ')}`, choice: { enabled: Object.fromEntries(off.map(id => [id, false])), selected: {} } });
  }
  for (const c of parts.cartridges) for (const v of c.versions) if (!v.live)
    out.push({ kind: 'version', label: `${c.id} ⇄ ${v.file}`, choice: { enabled: {}, selected: { [c.id]: v.file } } });
  // Phase 2 — constellations: every pair of versions of the two big cartridges, newest first.
  // This is the overnight work: version-interaction faults live here, not in single swaps.
  const [a, b] = parts.cartridges.filter(c => c.versions.length > 10).sort((x, y) => y.versions.length - x.versions.length);
  if (a && b) for (const va of a.versions) for (const vb of b.versions) if (!(va.live && vb.live))
    out.push({ kind: 'constellation', label: `${a.id} ⇄ ${va.stamp} × ${b.id} ⇄ ${vb.stamp}`, choice: { enabled: {}, selected: { [a.id]: va.file, [b.id]: vb.file } } });
  return out;
}

// Phase 4 — deep-link stars: the MAP button, for real projects, from the same canonical
// partitions the shell reads. A star arrives if the project's name is on the page afterwards.
const GG_DIR = process.env.GG_DIR || 'C:/Users/vikra/Documents/GitHub/globalgrid2050';
const DEEPLINK_MAX = Number(process.env.STAR_DEEPLINKS || 3000);
async function deeplinkSeeds() {
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(GG_DIR, 'uk_renewables_pipeline/v9/data/v9.1/build_manifest.json'), 'utf8')); } catch { return []; }
  const feats = [];
  for (const part of manifest.atlas_partitions || []) {
    try {
      const g = JSON.parse(await readFile(path.join(GG_DIR, 'uk_renewables_pipeline/v9', part.path), 'utf8'));
      for (const f of g.features || []) if (f.geometry?.type === 'Point' && f.properties?.repd_ref && f.properties?.name)
        feats.push({ ref: String(f.properties.repd_ref), tech: part.technology, name: String(f.properties.name), lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] });
    } catch {}
  }
  // deterministic spread across technologies: order by hash of the ref, not by file order
  feats.sort((a, b) => createHash('sha1').update(a.ref).digest('hex') < createHash('sha1').update(b.ref).digest('hex') ? -1 : 1);
  return feats.slice(0, DEEPLINK_MAX).map(f => ({
    kind: 'deeplink', label: `MAP → ${f.name} (${f.tech}, REPD ${f.ref})`, choice: { enabled: {}, selected: {} },
    query: `repd_ref=${encodeURIComponent(f.ref)}&technology=${f.tech}&latitude=${f.lat}&longitude=${f.lon}&zoom=12`, expect: f.name,
  }));
}
const starId = (gen, choice, query = '') => createHash('sha1').update(gen + JSON.stringify(choice) + query).digest('hex').slice(0, 12);

async function makeStar(gen, seed, replayOf = null) {
  const id = replayOf || starId(gen, seed.choice, seed.query || '');
  const file = path.join(SKY, 'stars', `${id}.json`);
  if (!replayOf && await exists(file)) return null;
  const r = await api('/api/testdrive', { choice: seed.choice, query: seed.query || '', expect: seed.expect || null });
  let verdict = r.verdict;
  const findings = r.findings.filter(f => f.part !== 'noise').slice(0, 25).map(f => ({ level: f.level, part: f.part, text: f.text, line: f.line }));
  if (seed.expect && r.arrival && !r.arrival.arrived) { verdict = 'RED'; findings.unshift({ level: 'arrival', part: 'shell', text: `did not arrive at "${seed.expect}"${r.arrival.failed[0] ? ' — ' + r.arrival.failed[0] : ''}` }); }
  if (replayOf) {
    const prev = JSON.parse(await readFile(file, 'utf8'));
    const same = prev.verdict === verdict && JSON.stringify(prev.findings.filter(f => f.level === 'exception').map(f => f.text)) === JSON.stringify(findings.filter(f => f.level === 'exception').map(f => f.text));
    prev.replays = [...(prev.replays || []), { at: new Date().toISOString(), host: HOST_NAME, verdict, same, findings: same ? undefined : findings.slice(0, 5) }];
    await writeFile(file, JSON.stringify(prev, null, 2));
    return { ...prev, verdict: same ? 'SAME' : 'DIFF', id };
  }
  const star = {
    id, seed: { source_generation: gen, kind: seed.kind, label: seed.label, choice: seed.choice, query: seed.query || undefined, expect: seed.expect || undefined },
    verdict, arrival: r.arrival || undefined, loadMs: r.loadMs, router: r.probe.router, layers: r.probe.layers, canvases: r.probe.canvases,
    loaded: r.composition.order, health: r.health,
    findings, banners: r.probe.banners, bench_run: r.stamp, made_at: new Date().toISOString(), host: HOST_NAME,
  };
  if (verdict !== 'GREEN') { await copyFile(r.screenshot_path || path.join(BENCH, r.screenshot), path.join(SKY, 'shots', `${id}.jpg`)); star.shot = `shots/${id}.jpg`; }
  await writeFile(file, JSON.stringify(star, null, 2));
  return star;
}

async function pass() {
  const parts = await api('/api/parts');
  const gen = parts.generation;
  const queue = [...seeds(parts), ...await deeplinkSeeds()].slice(0, MAX_STARS_PER_PASS);
  if (ORDER === 'reverse') queue.reverse();
  await readDial();
  log(`pass on generation ${gen}: ${queue.length} seeds, dial ${dial} (max ${MAX_WORKERS})`);
  let made = 0, skipped = 0, failed = 0; const t0 = Date.now();
  const dialWatcher = setInterval(async () => { const before = dial; await readDial(); if (dial !== before) log(`dial ${before} → ${dial}`); }, 5000);
  const worker = async (i) => {
    while (queue.length) {
      if (i >= dial) { await new Promise(r => setTimeout(r, 5000)); continue; }
      const seed = queue.shift();
      try { const s = await makeStar(gen, seed); if (s) { made++; log(`  ${s.verdict.padEnd(5)} ${s.id} ${seed.label}`); if (made % PUSH_EVERY === 0) await push(`stars: +${PUSH_EVERY} (${made} this pass) on ${gen}`).catch(e => log('mid-pass push: ' + e.message)); } else skipped++; }
      catch (e) { failed++; log(`  ERROR ${seed.label}: ${e.message}`); }
    }
  };
  await Promise.all(Array.from({ length: MAX_WORKERS }, (_, i) => worker(i)));
  clearInterval(dialWatcher);
  log(`pass done: ${made} new stars, ${skipped} already in the sky, ${failed} failed, ${Math.round((Date.now() - t0) / 1000)} s`);
  return { gen, made, skipped, failed };
}

async function survey() {
  const stamp = stampNow();
  const targets = path.join(EYES, 'targets.json');
  await run('node', ['eyes.mjs', targets, '--failures-only', '--concurrency', String(CONCURRENCY)], { cwd: EYES, maxBuffer: 1 << 24 }).catch(e => log('survey error: ' + e.message.slice(0, 200)));
  const runs = (await readdir(path.join(EYES, 'runs'))).sort().reverse();
  if (runs[0]) await copyFile(path.join(EYES, 'runs', runs[0], 'report.json'), path.join(SKY, 'sky', `survey-${stamp}.json`));
  log(`survey ${stamp} written`);
}

async function index() {
  const files = (await readdir(path.join(SKY, 'stars'))).filter(f => f.endsWith('.json'));
  const stars = await Promise.all(files.map(async f => JSON.parse(await readFile(path.join(SKY, 'stars', f), 'utf8'))));
  const by = v => stars.filter(s => s.verdict === v);
  const gens = [...new Set(stars.map(s => s.seed.source_generation))].sort();
  const md = `# The sky — ${stars.length} stars

Generated on the MSI (RTX 5070 Ti) by star-maker. A star is one composition of GridAtlas driven on the GPU. Updated ${new Date().toISOString()}.

| verdict | stars |
|---|---|
| 🟢 GREEN | ${by('GREEN').length} |
| 🟡 AMBER | ${by('AMBER').length} |
| 🔴 RED | ${by('RED').length} |

Source generations: ${gens.join(', ')}

## Red stars (supernovae)
${by('RED').map(s => `- \`${s.id}\` ${s.seed.label} — ${s.findings.filter(f => f.level === 'exception').map(f => `**${f.part}**: ${f.text}`).slice(0, 2).join('; ')}${s.shot ? ` ([shot](${s.shot}))` : ''}`).join('\n') || '- none'}

## Amber stars
${by('AMBER').map(s => `- \`${s.id}\` ${s.seed.label} — ${(s.banners[0] || s.findings[0]?.text || '').slice(0, 120)}`).join('\n') || '- none'}

## Hidden wires found (a part that fails only when another is unplugged)
${stars.filter(s => s.seed.kind === 'unplug' && s.verdict === 'RED').flatMap(s => s.findings.filter(f => f.level === 'exception').map(f => `- **${f.part}** breaks ${s.seed.label}: ${f.text}`)).filter((v, i, a) => a.indexOf(v) === i).join('\n') || '- none yet'}
`;
  await writeFile(path.join(SKY, 'SKY.md'), md);
}

async function push(msg) {
  await index();
  await git('add', '--', 'stars', 'shots', 'sky', 'SKY.md', 'logic', 'LOGIC.md').catch(() => git('add', '--', 'stars', 'shots', 'sky', 'SKY.md'));
  if ((await git('status', '--porcelain')).stdout.trim())
    await git('commit', '-q', '-m', `${msg}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`);
  // Two machines share one sky: take theirs first (their stars then count as "already made"),
  // then push ours. A conflict can only be two hosts writing the same star; ours wins locally
  // and the difference is a finding for the morning, not a failure.
  await git('pull', '--rebase', '--quiet', '-X', 'ours').catch(e => log('pull failed: ' + e.message.slice(0, 200)));
  await git('push', '--quiet').catch(e => log('push failed: ' + e.message.slice(0, 200)));
  log(`pushed: ${msg}`);
}

// Phase 5 — replay: never idle. Re-drive existing stars, oldest-replayed first, and record
// whether the same seed gave the same star. A DIFF is a finding (flakiness, network, time).
async function replayBatch(n = 200) {
  const files = (await readdir(path.join(SKY, 'stars'))).filter(f => f.endsWith('.json'));
  const stars = await Promise.all(files.map(async f => JSON.parse(await readFile(path.join(SKY, 'stars', f), 'utf8'))));
  stars.sort((a, b) => (a.replays?.length || 0) - (b.replays?.length || 0) || (a.made_at < b.made_at ? -1 : 1));
  const queue = stars.slice(0, n);
  await readDial();
  log(`replay batch: ${queue.length} stars, dial ${dial}`);
  let same = 0, diff = 0;
  const worker = async (i) => {
    while (queue.length) {
      if (i >= dial) { await new Promise(r => setTimeout(r, 5000)); continue; }
      const s = queue.shift();
      try { const r = await makeStar(s.seed.source_generation, s.seed, s.id); if (r.verdict === 'SAME') same++; else { diff++; log(`  DIFF  ${s.id} ${s.seed.label}`); } }
      catch (e) { log(`  ERROR replay ${s.id}: ${e.message}`); }
    }
  };
  await Promise.all(Array.from({ length: MAX_WORKERS }, (_, i) => worker(i)));
  log(`replay done: ${same} same, ${diff} diff`);
  return { same, diff };
}

log(`star-maker up · sky at ${SKY} · order ${ORDER}`);
let lastGen = null, lastSurvey = 0;
for (;;) {
  try {
    const parts = await api('/api/parts');
    if (parts.generation !== lastGen) { const r = await pass(); lastGen = r.gen; await push(`stars: ${r.made} new on generation ${r.gen}`); }
    else { const r = await replayBatch(200); await push(`replay: ${r.same} same, ${r.diff} diff`); }
    if (Date.now() - lastSurvey > SURVEY_EVERY_MS) { await survey(); lastSurvey = Date.now(); await push(`sky: survey ${stampNow()}`); }
    await run('git', ['-C', ATLAS_REPO, 'pull', '--ff-only', '--quiet']).catch(() => {});
  } catch (e) { log('loop error: ' + e.message); }
  await new Promise(r => setTimeout(r, 15000));
}
