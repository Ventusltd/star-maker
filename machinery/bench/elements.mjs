// THE PERIODIC TABLE — stars make elements. An element is a primitive with a fixed identity that
// any surface can compose with: the Spider graphically, a terminal by symbol, Claude by name.
// Families: physics constants, vocabularies, engines, cartridges, data layers, contracts.
// Atomic numbers are persisted and only ever appended, so a symbol means the same thing forever.
//
//   node elements.mjs   → star-maker/elements/table.json + PERIODIC-TABLE.md
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const ENGINE = process.env.ENGINE_DIR || 'C:/Users/vikra/Documents/GitHub/ventus-grid-engine';
const ATLAS = process.env.ATLAS_DIR || 'C:/Users/vikra/Documents/GitHub/gridatlas/atlas';
const TABLE = path.join(SKY, 'elements', 'table.json');
const sha = s => createHash('sha1').update(s).digest('hex').slice(0, 12);
const readJson = async p => JSON.parse(await readFile(p, 'utf8'));

let table = { schema: 'ventus.periodic-table.v1', elements: [] };
try { table = await readJson(TABLE); } catch {}
const byKey = new Map(table.elements.map(e => [e.key, e]));
const used = new Set(table.elements.map(e => e.symbol));
function symbolFor(name) {                       // two or three letters, unique, from the name's shape
  const parts = name.replace(/\.(js|mjs)$/, '').split(/[^A-Za-z0-9]+/).filter(Boolean);
  const cands = [parts.map(p => p[0]).join('').slice(0, 2), parts[0].slice(0, 2), parts.map(p => p[0]).join('').slice(0, 3), parts[0].slice(0, 3), parts[0][0] + (parts[1] || parts[0]).slice(-1)];
  for (let c of cands) { c = c[0].toUpperCase() + c.slice(1).toLowerCase(); if (c && !used.has(c)) { used.add(c); return c; } }
  for (let i = 1; i < 999; i++) { const c = cands[0][0].toUpperCase() + i; if (!used.has(c)) { used.add(c); return c; } }
}
function upsert(key, fields) {
  let e = byKey.get(key);
  if (!e) { e = { number: table.elements.length + 1, symbol: symbolFor(fields.name), key, discovered: new Date().toISOString().slice(0, 10) }; table.elements.push(e); byKey.set(key, e); }
  Object.assign(e, fields, { identity: sha(key + JSON.stringify(fields.value ?? fields.contract ?? fields.name)) });
  return e;
}

// physics + vocabularies: from the logic stars (constants that exist across the estate)
const logicDir = path.join(SKY, 'logic');
for (const f of (await readdir(logicDir).catch(() => [])).filter(f => f.endsWith('.json'))) {
  const s = await readJson(path.join(logicDir, f));
  if (s.kind === 'constant-drift' && !/^(R_|EARTH|KV|MVA|MW|VOLT|FREQ|TECH|BUCKET|LAYER|REPD)/.test(s.name)) continue;
  upsert(`const:${s.name}`, { family: s.kind === 'vocabulary-drift' ? 'vocabulary' : 'physics', name: s.name,
    state: 'UNSETTLED', candidates: s.values.map(v => ({ value: v.value, files: v.files.length })), repos: s.repos,
    note: `${s.distinct_values} values in the wild; Claude + VIK-AI must settle which is true`, evidence: `logic/${s.name}.json` });
}
// engines: the engine's own population graph
try {
  const g = await readJson(path.join(ENGINE, 'genome', 'engine-graph.json'));
  for (const n of g.nodes || []) if (/^engine\//.test(n.label) && n.type === 'canonical')
    upsert(`engine:${n.label}`, { family: 'engine', name: n.label.replace(/^engine\//, ''), state: n.rag === 'green' ? 'SETTLED' : 'UNSETTLED', note: n.reason, source: n.gh });
} catch {}
// cartridges + data layers + contract: from the live atlas composition and the deep-link contract
try {
  const cur = await readJson(path.join(ATLAS, 'current.json'));
  for (const c of cur.cartridges) upsert(`cartridge:${c.id}`, { family: 'cartridge', name: c.id, state: 'SETTLED', value: c.sha256, version: c.version, generation: c.generation, gives: c.capabilities?.length || 0, note: `replaces ${c.replace_script}` });
  const dataDir = path.join(ATLAS, cur.shell.base, 'data');
  for (const f of (await readdir(dataDir).catch(() => [])).filter(f => f.endsWith('.geojson')))
    upsert(`layer:${f}`, { family: 'data-layer', name: f.replace('.geojson', ''), state: 'SETTLED', note: `atlas layer ${f}` });
} catch {}
try {
  const src = await readFile(path.join(ENGINE, 'deeplink', 'contract.js'), 'utf8');
  const params = [...src.matchAll(/^\s{4}(\w+):\s*\{\s*type:\s*'(\w+)',\s*required:\s*(true|false)/gm)].map(m => ({ name: m[1], type: m[2], required: m[3] === 'true' }));
  upsert('contract:deeplink', { family: 'contract', name: 'deeplink (the MAP button)', state: 'SETTLED', contract: params, note: 'identity = repd_ref; technology is a BUCKET, not a layer id' });
} catch {}

await mkdir(path.dirname(TABLE), { recursive: true });
await writeFile(TABLE, JSON.stringify(table, null, 2));
const fams = ['physics', 'vocabulary', 'engine', 'cartridge', 'data-layer', 'contract'];
const md = `# The periodic table — ${table.elements.length} elements

Stars make elements. An element is a primitive with a fixed identity (atomic number and symbol never change; the identity hash changes only when the thing itself changes) that any surface composes with: the Spider graphically, a terminal by symbol (\`ventus.ps1 element Ek\`), Claude by name. **UNSETTLED** elements exist in the estate in more than one form and wait for Claude + VIK-AI to settle which is true. Updated ${new Date().toISOString()}.

${fams.map(fam => {
  const es = table.elements.filter(e => e.family === fam);
  return `## ${fam} (${es.length})\n\n| # | symbol | name | state | note |\n|---|---|---|---|---|\n` + es.map(e => `| ${e.number} | **${e.symbol}** | ${e.name} | ${e.state === 'SETTLED' ? '🟢 settled' : '🟡 unsettled: ' + (e.candidates || []).map(c => `\`${String(c.value).slice(0, 24)}\``).join(' / ')} | ${(e.note || '').slice(0, 90)} |`).join('\n');
}).join('\n\n')}
`;
await writeFile(path.join(SKY, 'PERIODIC-TABLE.md'), md);
console.log(`periodic table: ${table.elements.length} elements (${fams.map(f => f + ' ' + table.elements.filter(e => e.family === f).length).join(', ')})`);
