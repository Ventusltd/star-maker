// LOGIC STARS — our own reasoning, no model, no Meta. Read every constant in every repo and find
// the ones that disagree with themselves: one NAME, several VALUES, across files. Those are the
// things a mind can reason with: a voltage that is 33 here and 66 there, a technology list that
// has wind_onshore in one place and wind in another, an earth radius with three decimals.
//
//   node logic.mjs      → star-maker/logic/<name>.json + LOGIC.md
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.env.ESTATE_DIR || 'C:/Users/vikra/Documents/GitHub';
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const SKIP = /[\\/](\.git|node_modules|dist|build|vendor|\.venv|homepage_versions|restore_points|site_versions)[\\/]/;
const EXT = new Set(['.js', '.mjs', '.cjs', '.py', '.ts']);
const lineage = p => p.replace(/\d{12}[-_]?/g, '').replace(/[\\/]/g, '/');   // collapse timestamped copies

// NAME = literal   (js const/let/var, py module-level); literal = number, string, array, new Set([...])
const RX = /(?:^|\n)[ \t]*(?:(?:export\s+)?(?:const|let|var)\s+)?([A-Z][A-Z0-9_]{2,})\s*(?::\s*[\w<>\[\]]+)?\s*=\s*(-?\d+(?:\.\d+)?(?:e-?\d+)?|'[^'\n]*'|"[^"\n]*"|\[[^\]\n]{0,400}\]|new Set\(\[[^\]\n]{0,400}\]\)|Object\.freeze\(\[[^\]\n]{0,400}\]\))\s*[;,\n]/g;
const norm = v => v.startsWith('new Set(') ? 'set' + v.slice(7, -1) : v.startsWith('Object.freeze(') ? v.slice(14, -1) : v;
const canon = v => { const n = norm(v); if (/^[\[s]/.test(n)) { const items = (n.match(/'[^']*'|"[^"]*"|-?\d+(?:\.\d+)?/g) || []).map(x => x.replace(/^["']|["']$/g, '')); return (n.startsWith('set') ? 'set' : 'list') + JSON.stringify(items.slice().sort()); } return n.replace(/^["']|["']$/g, ''); };

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (SKIP.test(p + (e.isDirectory() ? '/' : ''))) continue;
    if (e.isDirectory()) yield* walk(p); else if (EXT.has(path.extname(e.name)) && (await stat(p)).size < 3_000_000) yield p;
  }
}

const byName = new Map();  // name → Map(canonValue → Set(lineage file))
let files = 0, hits = 0;
for await (const f of walk(ROOT)) {
  files++;
  const text = await readFile(f, 'utf8').catch(() => '');
  const rel = lineage(path.relative(ROOT, f));
  for (const m of text.matchAll(RX)) {
    const name = m[1], value = canon(m[2]);
    if (/^(TRUE|FALSE|NULL|NONE|__[A-Z_]+__)$/.test(name)) continue;
    hits++;
    if (!byName.has(name)) byName.set(name, new Map());
    const vals = byName.get(name);
    if (!vals.has(value)) vals.set(value, new Set());
    vals.get(value).add(rel);
  }
}

const stars = [];
for (const [name, vals] of byName) {
  if (vals.size < 2) continue;
  const values = [...vals].map(([value, fs]) => ({ value, files: [...fs].sort() }));
  const repos = new Set(values.flatMap(v => v.files.map(f => f.split('/')[0])));
  const kind = /TECH|BUCKET|LAYER|IDS|TYPES|VOCAB|STATUS/.test(name) && values.some(v => /^(list|set)/.test(v.value)) ? 'vocabulary-drift'
             : /^R_|RADIUS|EARTH|KM|KV|MVA|MW|VOLT|FREQ|HZ|TOL|EPS|LIMIT|MAX|MIN|THRESH/.test(name) ? 'physics-drift' : 'constant-drift';
  stars.push({ name, kind, distinct_values: values.length, repos: [...repos].sort(), files: values.reduce((n, v) => n + v.files.length, 0), values,
    reason: `${name} is defined ${values.length} different ways across ${repos.size} repo(s); a reader of one file cannot know which is true.` });
}
stars.sort((a, b) => (b.repos.length * b.distinct_values) - (a.repos.length * a.distinct_values) || b.files - a.files);

await mkdir(path.join(SKY, 'logic'), { recursive: true });
for (const s of stars) await writeFile(path.join(SKY, 'logic', `${s.name}.json`), JSON.stringify(s, null, 2));
const md = `# Logic stars — ${stars.length} constants that disagree with themselves

Scanned ${files} code files across the estate (timestamped copies collapsed to one lineage), ${hits} constant definitions read. No model was used; this is a regular-expression reading of \`NAME = literal\` and a comparison of the literals. A logic star is one NAME with two or more distinct VALUES. Updated ${new Date().toISOString()}.

| kind | stars |
|---|---|
| physics-drift | ${stars.filter(s => s.kind === 'physics-drift').length} |
| vocabulary-drift | ${stars.filter(s => s.kind === 'vocabulary-drift').length} |
| constant-drift | ${stars.filter(s => s.kind === 'constant-drift').length} |

## Physics — reason with these first
${stars.filter(s => s.kind === 'physics-drift').slice(0, 40).map(s => `- **${s.name}** — ${s.distinct_values} values across ${s.repos.join(', ')}: ${s.values.map(v => `\`${v.value.slice(0, 40)}\` (${v.files.length})`).join(' · ')}`).join('\n') || '- none'}

## Vocabularies that drift (a list of technologies, layers, ids that is not the same list everywhere)
${stars.filter(s => s.kind === 'vocabulary-drift').slice(0, 40).map(s => `- **${s.name}** — ${s.distinct_values} versions across ${s.repos.join(', ')}`).join('\n') || '- none'}

## Everything else, most-spread first
${stars.filter(s => s.kind === 'constant-drift').slice(0, 60).map(s => `- **${s.name}** — ${s.distinct_values} values, ${s.files} files, ${s.repos.join(', ')}`).join('\n') || '- none'}
`;
await writeFile(path.join(SKY, 'LOGIC.md'), md);
console.log(`logic: ${files} files, ${hits} constants, ${stars.length} logic stars → ${path.join(SKY, 'LOGIC.md')}`);
