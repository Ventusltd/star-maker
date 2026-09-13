// THE ELECTRON STAR — electron physics applied to code, where the physics actually holds.
// nucleus = a soul (a unit of code) · electrons = its callers · shells K/L/M = same directory /
// same repo / other repo, filled inner-first · valence = the M shell, which decides bonding ·
// noble = full outer shell, inert (no external caller) · alkali = one lone valence electron
// (one external caller — reactive, fragile) · conduction band = free electrons across many
// repos (the estate's wiring) · spin pairing = a caller in a test/proof file · tunnelling = a
// caller in a repo that holds no copy of the soul (the hidden wire). No model.
//
//   node electron.mjs  → star-maker/electron/{atoms.json, graph.json}, ELECTRON.md   (reads bench/state/soul/souls.jsonl)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BENCH = path.dirname(fileURLToPath(import.meta.url));
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const OUT = path.join(SKY, 'electron');
await mkdir(OUT, { recursive: true });
const rows = (await readFile(path.join(BENCH, 'state', 'soul', 'souls.jsonl'), 'utf8')).split('\n').filter(Boolean).map(l => JSON.parse(l));
const BUILTIN = /^(slice|round|open|has|get|set|add|next|range|len|print|int|str|list|dict|main|init|run|render|update|log|load|save|build|parse|draw|fetch|then|end|write|read|close|start|stop|send|on|off|once|error|warn|info|debug|format|now|time|sleep|exit|entries|keys|values|contains|closest|failed|code|head|calc)$/;

// one atom per soul: all incarnations pooled (copper is deep; on the table it is just copper)
const atoms = new Map();
for (const u of rows) {
  if (u.kind === 'method' || BUILTIN.test(u.name) || u.name.length < 4) continue;
  const a = atoms.get(u.soul) || atoms.set(u.soul, { soul: u.soul, number: u.number, name: u.name, kind: u.kind, lines: u.lines, purpose: u.purpose, homes: new Set(), files: new Set(), K: new Set(), L: new Set(), M: new Set(), paired: false, incarnations: 0 }).get(u.soul);
  a.incarnations++; a.homes.add(u.repo); a.files.add(u.file);
  const dir = path.posix.dirname(u.file);
  for (const c of u.caller_files || []) {
    const crepo = c.split('/')[0];
    if (path.posix.dirname(c) === dir) a.K.add(c); else if (crepo === u.repo) a.L.add(c); else a.M.add(c);
    if (/test|proof|spec|selftest|check/i.test(c)) a.paired = true;
  }
}
const list = [...atoms.values()].map(a => {
  const mRepos = [...new Set([...a.M].map(c => c.split('/')[0]))].filter(r => !a.homes.has(r));   // callers in repos with no copy = tunnelling
  const valence = mRepos.length;
  const cls = valence === 0 ? (a.K.size + a.L.size ? 'noble' : 'inert-unused') : valence === 1 ? 'alkali' : valence <= 3 ? 'halogen' : 'conductor';
  return { soul: a.soul, number: a.number, name: a.name, kind: a.kind, lines: a.lines, purpose: a.purpose, incarnations: a.incarnations, homes: [...a.homes].sort(),
    shells: { K: a.K.size, L: a.L.size, M: a.M.size }, valence, valence_repos: mRepos.sort(), class: cls, spin: a.paired ? 'paired' : 'unpaired', tunnelling: mRepos.length > 0 };
});
list.sort((a, b) => b.valence - a.valence || (b.shells.K + b.shells.L + b.shells.M) - (a.shells.K + a.shells.L + a.shells.M));
await writeFile(path.join(OUT, 'atoms.json'), JSON.stringify({ generated_utc: new Date().toISOString(), atoms: list.length, classes: Object.fromEntries(['conductor', 'halogen', 'alkali', 'noble', 'inert-unused'].map(c => [c, list.filter(a => a.class === c).length])), unpaired: list.filter(a => a.spin === 'unpaired' && a.valence > 0).length, top: list.slice(0, 500) }, null, 2));

const label = a => `#${a.number} ${a.name}`;
const nodes = list.slice(0, 250).map(a => ({ label: label(a), type: a.class, rag: a.class === 'alkali' && a.spin === 'unpaired' ? 'red' : a.spin === 'unpaired' && a.valence > 0 ? 'amber' : 'green',
  reason: `${a.kind} · ${a.lines} lines · shells K${a.shells.K} L${a.shells.L} M${a.shells.M} · valence ${a.valence} · spin ${a.spin} · homes ${a.homes.join(',')}${a.purpose ? ' · says: ' + a.purpose.slice(0, 80) : ''}` }));
const edges = [], repoSeen = new Set();
for (const a of list.slice(0, 250)) for (const r of a.valence_repos) { edges.push({ from: `repo ${r}`, to: label(a), kind: 'BONDS_WITH' }); if (!repoSeen.has(r)) { repoSeen.add(r); nodes.push({ label: `repo ${r}`, type: 'repo', rag: 'green', reason: 'holds no copy of the souls it bonds with — every bond is a tunnel' }); } }
await writeFile(path.join(OUT, 'graph.json'), JSON.stringify({ schema: 'electron-graph.v1', label: 'The Electron star', generated_utc: new Date().toISOString(),
  note: 'Souls as atoms; shells K/L/M = callers in the same directory / repo / other repos; BONDS_WITH = a repo that calls the soul without holding a copy (tunnelling).', focus_default: nodes[0]?.label, nodes, edges }, null, 2));

const by = c => list.filter(a => a.class === c);
const md = `# The Electron star — ${list.length.toLocaleString()} atoms

Electron physics applied to code where it holds: **nucleus** = a soul · **electrons** = its callers · **shells K / L / M** = callers in the same directory / the same repo / other repos, filled inner-first · **valence** = the M shell, the callers in repos that hold no copy of the soul — the bonds that decide its chemistry · **spin** paired = a test or proof calls it. Updated ${new Date().toISOString()}. No model.

| class | meaning | atoms |
|---|---|---|
| conductor | valence ≥ 4 repos — free electrons, the estate's wiring | ${by('conductor').length} |
| halogen | valence 2–3 | ${by('halogen').length} |
| **alkali** | valence 1 — one lone external bond, reactive and fragile | **${by('alkali').length}** |
| noble | full outer shell — used only at home, safe to change | ${by('noble').length} |
| inert-unused | no electrons at all — nothing calls it anywhere | ${by('inert-unused').length} |

Unpaired spins with external bonds (**bonded across repos, and no test or proof ever calls them**): **${list.filter(a => a.spin === 'unpaired' && a.valence > 0).length}**

## Conduction band — the souls that carry the estate's current
${by('conductor').slice(0, 25).map(a => `- **#${a.number} ${a.name}** (${a.kind}, ${a.lines} lines, home ${a.homes.join('/')}) · valence ${a.valence}: ${a.valence_repos.join(', ')} · spin ${a.spin}`).join('\n') || '- none'}

## Alkali — one external bond each; if the home changes, the bond breaks
${by('alkali').filter(a => a.spin === 'unpaired').slice(0, 30).map(a => `- **#${a.number} ${a.name}** (home ${a.homes.join('/')}) ⇄ ${a.valence_repos[0]} · ${a.lines} lines · unpaired`).join('\n') || '- none'}

## Tunnelling — every valence bond is a tunnel: a repo calls a soul it does not hold
${list.filter(a => a.tunnelling).slice(0, 25).map(a => `- **#${a.number} ${a.name}** lives in ${a.homes.join('/')} · tunnels to ${a.valence_repos.join(', ')}`).join('\n') || '- none'}

## For the Spider
\`electron/graph.json\` — ${nodes.length} nodes, ${edges.length} BONDS_WITH edges.
`;
await writeFile(path.join(SKY, 'ELECTRON.md'), md);
console.log(`electron: ${list.length} atoms · conductor ${by('conductor').length} · halogen ${by('halogen').length} · alkali ${by('alkali').length} · noble ${by('noble').length} · unused ${by('inert-unused').length} · unpaired-bonded ${list.filter(a => a.spin === 'unpaired' && a.valence > 0).length}`);
