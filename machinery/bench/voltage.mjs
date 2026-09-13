// THE VOLTAGE STAR — reads everything the code does about 400 / 275 / 220 / 132 / 66 / 33 / 11 kV,
// joins each voltage to the data we actually hold, and — only where it needs help — asks the
// NESO open-data API (CKAN, api.neso.energy) for datasets under an open licence that match those
// voltages. Rule from the architect: use a property only when it has relevance to our purpose
// and our code. So: no dumping of catalogues; every line here is a voltage the code touches.
//
//   node voltage.mjs  → star-maker/voltage/{voltages.json, graph.json}, VOLTAGE.md
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
const ROOT = process.env.ESTATE_DIR || 'C:/Users/vikra/Documents/GitHub';
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const ATLAS_DATA = process.env.ATLAS_DATA || 'C:/Users/vikra/Documents/GitHub/gridatlas/atlas/releases/202608300453-atlas-v9/data';
const CONNECTION_POINTS = process.env.CONNECTION_POINTS || 'C:/Users/vikra/Documents/GitHub/data-grid-gb/derived/connection-points.v3.json';
const OUT = path.join(SKY, 'voltage'); await mkdir(OUT, { recursive: true });
const KV = [400, 275, 220, 132, 66, 33, 11];
const SKIP = /[\\/](\.git|node_modules|dist|build|vendor|homepage_versions|restore_points|site_versions|star-maker[\\/](stars|shots))[\\/]/;
const EXT = new Set(['.js', '.mjs', '.py', '.html', '.md']);
// What GB literature says each level is (open sources; stated once, plainly, no numbers invented):
// NESO Grid Code and ETYS: the transmission system in England & Wales is 400 kV and 275 kV; in Scotland 132 kV
// is also transmission; below that the distribution networks (DNOs) run 132 / 66 / 33 / 11 kV. Sources:
// https://www.neso.energy/industry-information/codes/grid-code · https://www.neso.energy/publications/electricity-ten-year-statement-etys
const ROLE = { 400: 'transmission (E&W, GB backbone)', 275: 'transmission (E&W)', 220: 'not a GB standard level — check the code: interconnector or continental data?', 132: 'transmission in Scotland; distribution (DNO) in England & Wales', 66: 'distribution (DNO, some EHV networks)', 33: 'distribution (DNO, EHV)', 11: 'distribution (DNO, HV)' };

async function* walk(dir) { for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) { const p = path.join(dir, e.name); if (SKIP.test(p + (e.isDirectory() ? '/' : ''))) continue; if (e.isDirectory()) yield* walk(p); else if (EXT.has(path.extname(e.name)) && (await stat(p)).size < 2_000_000) yield p; } }
const v = Object.fromEntries(KV.map(k => [k, { kv: k, role: ROLE[k], mentions: 0, repos: new Set(), lineages: new Set(), context: [] }]));
const rx = new RegExp(`(?<![\\d.])(${KV.join('|')})\\s?[kK][vV]\\b|grid_(${KV.join('|')})kv|\\b(${KV.join('|')})KV\\b`, 'g');
for await (const f of walk(ROOT)) {
  const text = await readFile(f, 'utf8').catch(() => ''); if (!text || (text.length > 20000 && text.split('\n').some(l => l.length > 3000))) continue;
  const rel = path.relative(ROOT, f).replace(/\\/g, '/'); const repo = rel.split('/')[0]; const lin = rel.replace(/\d{12}[-_]?/g, '');
  const lines = text.split('\n');
  lines.forEach((line, i) => { for (const m of line.matchAll(rx)) { const k = Number(m[1] || m[2] || m[3]); const e = v[k]; if (!e) continue; e.mentions++; e.repos.add(repo); e.lineages.add(lin); if (e.context.length < 400 && !e.context.some(c => c.lineage === lin && c.text === line.trim())) e.context.push({ file: rel, lineage: lin, line: i + 1, text: line.trim().slice(0, 160) }); } });
}
// the data we hold per voltage
for (const k of KV) { try { const g = JSON.parse(await readFile(path.join(ATLAS_DATA, `grid_${k}kv.geojson`), 'utf8')); v[k].atlas_layer = { file: `grid_${k}kv.geojson`, features: g.features?.length || 0 }; } catch { v[k].atlas_layer = null; } }
try { const cp = JSON.parse(await readFile(CONNECTION_POINTS, 'utf8')); for (const k of KV) v[k].neso_connection_points = cp.connection_points.filter(s => (s.voltages_kv || []).includes(k)).length; v.source_connection_points = { schema: cp.schema, source: cp.source, sites: cp.connection_points.length }; } catch {}
// ask NESO's open-data API only for what matches our voltages and our purpose
const neso = [];
try {
  for (const q of ['transmission network voltage', 'substation', 'connection capacity headroom', 'constraint']) {
    const r = await fetch(`https://api.neso.energy/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=10`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) continue; const j = await r.json();
    for (const p of j.result?.results || []) if (/kv|transmission|substation|network|connection|constraint|headroom|capacity|circuit|etys/i.test(p.title + ' ' + (p.notes || '').slice(0, 300)) && !neso.some(x => x.name === p.name))
      neso.push({ name: p.name, title: p.title, licence: p.license_title || p.license_id || 'unstated', url: `https://www.neso.energy/data-portal/${p.name}`, resources: (p.resources || []).length, matched: q });
  }
} catch (e) { neso.push({ error: String(e.message).slice(0, 120) }); }
const open = neso.filter(d => /open|ogl|cc|creative/i.test(d.licence || ''));
const out = { generated_utc: new Date().toISOString(), voltages: KV.map(k => ({ ...v[k], repos: [...v[k].repos].sort(), lineages: v[k].lineages.size, context: v[k].context.slice(0, 60) })), source_connection_points: v.source_connection_points || null, neso_open_datasets: open, neso_other: neso.filter(d => !open.includes(d)).slice(0, 10) };
await writeFile(path.join(OUT, 'voltages.json'), JSON.stringify(out, null, 2));
const nodes = KV.map(k => ({ label: `${k} kV`, type: 'voltage', rag: k === 220 && v[k].mentions ? 'amber' : v[k].mentions ? 'green' : 'amber', reason: `${v[k].role} · ${v[k].mentions} mentions in ${v[k].lineages.size} files · atlas ${v[k].atlas_layer ? v[k].atlas_layer.features + ' features' : 'no layer'} · NESO sites ${v[k].neso_connection_points ?? '?'}` }));
const edges = []; const fileNodes = new Map();
for (const k of KV) for (const c of v[k].context.slice(0, 25)) { const lab = c.lineage.split('/').slice(0, 3).join('/'); if (!fileNodes.has(lab)) fileNodes.set(lab, { label: lab, type: 'code', rag: 'green', reason: c.text.slice(0, 100) }); if (!edges.some(e => e.from === lab && e.to === `${k} kV`)) edges.push({ from: lab, to: `${k} kV`, kind: 'SPEAKS_OF' }); }
for (const d of open.slice(0, 20)) { fileNodes.set(d.title, { label: d.title, type: 'neso-open-data', rag: 'green', reason: `${d.licence} · ${d.url}` }); for (const k of KV) if (new RegExp(`\\b${k}\\s?kV`, 'i').test(d.title)) edges.push({ from: d.title, to: `${k} kV`, kind: 'OPEN_DATA_FOR' }); }
await writeFile(path.join(OUT, 'graph.json'), JSON.stringify({ schema: 'voltage-graph.v1', label: 'The Voltage star', generated_utc: new Date().toISOString(), note: 'Voltage levels the code speaks of, the code that speaks of them, the data we hold, and NESO open datasets that match.', focus_default: '400 kV', nodes: [...nodes, ...fileNodes.values()], edges }, null, 2));
const md = `# The Voltage star

What the code says about each voltage level, what data we hold for it, what GB literature says it is, and which NESO open-licence datasets speak of it. Only voltages the code touches; only properties that serve the purpose. Updated ${new Date().toISOString()}. No model.

| kV | role in GB (NESO Grid Code / ETYS) | mentions | files | repos | atlas layer | NESO connection sites |
|---|---|---|---|---|---|---|
${KV.map(k => `| **${k}** | ${v[k].role} | ${v[k].mentions} | ${v[k].lineages.size} | ${[...v[k].repos].length} | ${v[k].atlas_layer ? v[k].atlas_layer.features + ' features' : '—'} | ${v[k].neso_connection_points ?? '—'} |`).join('\n')}

Connection sites read from \`${v.source_connection_points?.schema || 'data-grid-gb/derived/connection-points.v3.json'}\` (${v.source_connection_points?.sites ?? '?'} sites; NESO-published, minimum 132 kV).

## Where the code speaks of each voltage (first lines)
${KV.map(k => `### ${k} kV\n${v[k].context.slice(0, 8).map(c => `- \`${c.file}:${c.line}\` ${c.text.slice(0, 120)}`).join('\n') || '- nothing'}`).join('\n\n')}

## NESO open-licence datasets that match our voltages and purpose
${open.length ? open.slice(0, 20).map(d => `- **${d.title}** — ${d.licence} · ${d.resources} resources · ${d.url} · matched "${d.matched}"`).join('\n') : '- the API returned nothing matching (or was unreachable): ' + JSON.stringify(neso.slice(0, 2))}
${neso.some(d => d.error) ? '\nAPI note: ' + neso.find(d => d.error).error : ''}

## Questions the star raises (for Claude + VIK-AI)
- 220 kV: ${v[220].mentions ? `the code mentions it ${v[220].mentions} times and the atlas has a \`grid_220kv\` layer with ${v[220].atlas_layer?.features ?? 0} features — 220 kV is not a GB standard level; whose lines are these (interconnector landfall, imported data)?` : 'not mentioned'}
- 11 kV: ${v[11].mentions} mentions but ${v[11].atlas_layer ? '' : 'no atlas layer — '}the UKPN 11 kV layer showed [WAIT] in every drive tonight; is its source reachable?
- Every voltage the code names should map to one element on the periodic table; today none do.

## For the Spider
\`voltage/graph.json\` — ${nodes.length + fileNodes.size} nodes, ${edges.length} edges (SPEAKS_OF, OPEN_DATA_FOR).
`;
await writeFile(path.join(SKY, 'VOLTAGE.md'), md);
console.log(`voltage: ${KV.map(k => `${k}kV ${v[k].mentions}`).join(' · ')} · NESO open datasets ${open.length}`);
