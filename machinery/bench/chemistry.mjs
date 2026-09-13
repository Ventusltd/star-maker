// THE CHEMISTRY STAR — computes compounds from the elements. Every star in the sky is a
// molecule: the elements (cartridge versions, the deep-link contract, the shell) it was composed
// from. Its verdict is the compound's stability. Across thousands of stars the reactions emerge:
// which element pairs are stable, which decay, and what the decay product is (the exception).
// All of it is written as a graph the Spider can load. No model — arithmetic over the sky.
//
//   node chemistry.mjs   → star-maker/chemistry/{compounds.json, graph.json}, CHEMISTRY.md
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const OUT = path.join(SKY, 'chemistry');
await mkdir(OUT, { recursive: true });
const table = JSON.parse(await readFile(path.join(SKY, 'elements', 'table.json'), 'utf8')).elements;
const symbolOf = new Map(table.filter(e => e.family === 'cartridge').map(e => [e.name, e.symbol]));
const contractSym = table.find(e => e.key === 'contract:deeplink')?.symbol || 'Dl';

const files = (await readdir(path.join(SKY, 'stars'))).filter(f => f.endsWith('.json'));
const stars = [];
for (const f of files) { try { stars.push(JSON.parse(await readFile(path.join(SKY, 'stars', f), 'utf8'))); } catch {} }

// formula: one term per element present. A cartridge term is Symbol(version stamp); absence = shell original in that slot.
const term = (id, sel) => `${symbolOf.get(id) || id}${sel ? '(' + String(sel).slice(0, 12) + ')' : ''}`;
const formulaOf = s => {
  const on = (s.loaded || []).map(id => term(id, s.seed.choice.selected?.[id]));
  if (s.seed.kind === 'deeplink') on.push(contractSym);
  return on.sort().join('·') || 'Shell';
};
const decayOf = s => (s.findings || []).filter(f => f.level === 'exception' || f.level === 'arrival').map(f => `${f.part}: ${f.text}`.slice(0, 120));

const compounds = new Map();
for (const s of stars) {
  const formula = formulaOf(s);
  const c = compounds.get(formula) || compounds.set(formula, { formula, kind: s.seed.kind, stars: 0, green: 0, amber: 0, red: 0, decays: new Map(), ids: [] }).get(formula);
  c.stars++; c[s.verdict.toLowerCase()] = (c[s.verdict.toLowerCase()] || 0) + 1; if (c.ids.length < 5) c.ids.push(s.id);
  for (const d of decayOf(s)) c.decays.set(d, (c.decays.get(d) || 0) + 1);
}
const list = [...compounds.values()].map(c => ({ ...c, stability: c.stars ? c.green / c.stars : 0, decays: [...c.decays].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([text, n]) => ({ text, n })) }))
  .sort((a, b) => a.stability - b.stability || b.stars - a.stars);

// reactions between element versions: for constellation stars, which pair decays and why
const pairs = new Map();
for (const s of stars.filter(s => s.seed.kind === 'constellation' || s.seed.kind === 'unplug')) {
  const key = s.seed.kind === 'unplug' ? `without ${Object.keys(s.seed.choice.enabled).map(id => symbolOf.get(id) || id).sort().join('+')}` : formulaOf(s);
  const p = pairs.get(key) || pairs.set(key, { key, kind: s.seed.kind, stars: 0, red: 0, decays: new Map() }).get(key);
  p.stars++; if (s.verdict === 'RED') p.red++;
  for (const d of decayOf(s)) p.decays.set(d, (p.decays.get(d) || 0) + 1);
}
// element-level rules: for each cartridge version (element term), how often does it appear in a RED compound?
const termStats = new Map();
for (const s of stars) for (const t of formulaOf(s).split('·')) { const x = termStats.get(t) || termStats.set(t, { term: t, stars: 0, red: 0, decays: new Map() }).get(t); x.stars++; if (s.verdict === 'RED') { x.red++; for (const d of decayOf(s)) x.decays.set(d, (x.decays.get(d) || 0) + 1); } }
const unstableTerms = [...termStats.values()].filter(x => x.stars >= 3 && x.red / x.stars >= 0.9).sort((a, b) => b.stars - a.stars);
const nobleTerms = [...termStats.values()].filter(x => x.stars >= 3 && x.red === 0).sort((a, b) => b.stars - a.stars);

// graph for the Spider: element-version nodes; UNSTABLE_WITH edges between terms that co-occur in red compounds; DECAYS_TO edges to the exception text
const nodes = [], edges = [], seen = new Set();
const node = (label, type, rag, reason) => { if (!seen.has(label)) { seen.add(label); nodes.push({ label, type, rag, reason }); } };
for (const x of [...unstableTerms.slice(0, 80), ...nobleTerms.slice(0, 40)]) node(x.term, 'element', x.red / x.stars >= 0.9 ? 'red' : 'green', `${x.stars} compounds · ${x.red} red`);
for (const c of list.filter(c => c.red && c.formula.includes('·')).slice(0, 300)) {
  const terms = c.formula.split('·'); const bad = terms.filter(t => termStats.get(t) && termStats.get(t).red / termStats.get(t).stars < 0.9);
  for (const t of terms) node(t, 'element', termStats.get(t).red / termStats.get(t).stars >= 0.9 ? 'red' : 'amber', `${termStats.get(t).stars} compounds · ${termStats.get(t).red} red`);
  for (let i = 0; i < terms.length; i++) for (let j = i + 1; j < terms.length; j++) if (bad.includes(terms[i]) && bad.includes(terms[j])) edges.push({ from: terms[i], to: terms[j], kind: 'UNSTABLE_WITH' });
  for (const d of c.decays.slice(0, 1)) { node(d.text, 'decay', 'red', `${d.n} stars`); for (const t of terms) edges.push({ from: t, to: d.text, kind: 'DECAYS_TO' }); }
}
await writeFile(path.join(OUT, 'compounds.json'), JSON.stringify({ generated_utc: new Date().toISOString(), stars: stars.length, compounds: list }, null, 2));
await writeFile(path.join(OUT, 'graph.json'), JSON.stringify({ schema: 'chemistry-graph.v1', label: 'The Chemistry star', generated_utc: new Date().toISOString(),
  note: 'Elements (cartridge versions, the contract) as nodes; UNSTABLE_WITH between elements that only decay together; DECAYS_TO the exception a compound produces.', focus_default: nodes[0]?.label, nodes, edges }, null, 2));

const md = `# The Chemistry star — ${list.length} compounds from ${stars.length} stars

A compound is a composition of elements (cartridge versions by symbol and stamp; **${contractSym}** = the deep-link contract; **Shell** = nothing bolted on). Stability = share of its stars that were GREEN. Decay = the exception the compound produces. Updated ${new Date().toISOString()}. No model — arithmetic over the sky.

Symbols: ${[...symbolOf].map(([n, s]) => `**${s}** ${n}`).join(' · ')}

## Noble elements (never in a red compound, ≥ 3 compounds)
${nobleTerms.slice(0, 15).map(x => `- **${x.term}** — ${x.stars} compounds, all stable`).join('\n') || '- none yet'}

## Radioactive elements (red in ≥ 90 % of their compounds)
${unstableTerms.slice(0, 25).map(x => `- **${x.term}** — ${x.red}/${x.stars} red · decays to: ${[...x.decays].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => `\`${t.slice(0, 80)}\``).join(' / ')}`).join('\n') || '- none'}

## Reactions that decay (unplug one element, another dies)
${[...pairs.values()].filter(p => p.kind === 'unplug' && p.red).map(p => `- **${p.key}** → ${p.red}/${p.stars} red · ${[...p.decays].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t, n]) => `\`${t.slice(0, 90)}\` ×${n}`).join(' · ')}`).join('\n') || '- none'}

## Least stable compounds
${list.filter(c => c.stars >= 1 && c.red).slice(0, 30).map(c => `- \`${c.formula}\` — ${Math.round(100 * c.stability)} % stable (${c.red} red / ${c.stars}) · ${c.decays[0] ? '`' + c.decays[0].text.slice(0, 90) + '`' : ''}`).join('\n') || '- none'}

## For the Spider
\`chemistry/graph.json\` — ${nodes.length} nodes, ${edges.length} edges, receiver idiom.
`;
await writeFile(path.join(SKY, 'CHEMISTRY.md'), md);
console.log(`chemistry: ${stars.length} stars → ${list.length} compounds · ${nobleTerms.length} noble · ${unstableTerms.length} radioactive · graph ${nodes.length}/${edges.length}`);
