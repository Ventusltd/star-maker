// THE RANDOM STAR — picks links on probability alone, no defined logic. It takes every node the
// other stars have drawn and joins pairs at random, with a random kind. Nothing here is a
// finding; it is serendipity, offered to Claude + VIK-AI in case an accident is an insight.
// Seeded by the date, so today's randomness can be reproduced tomorrow (a star with a seed).
//
//   node random.mjs [n]  → star-maker/random/graph.json, RANDOM.md
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const OUT = path.join(SKY, 'random'); await mkdir(OUT, { recursive: true });
const N = Number(process.argv[2] || 150);
const seedStr = new Date().toISOString().slice(0, 10);
let s = [...seedStr].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) || 1;
const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };   // xorshift32
const pool = [];
for (const g of ['soul', 'electron', 'chemistry', 'vedic', 'magnetar']) { try { for (const n of JSON.parse(await readFile(path.join(SKY, g, 'graph.json'), 'utf8')).nodes) pool.push({ ...n, star: g }); } catch {} }
const KINDS = ['MIGHT_TOUCH', 'RHYMES_WITH', 'COULD_REPLACE', 'REMINDS_OF', 'WHAT_IF', 'ENTANGLED_MAYBE'];
const edges = [], used = new Map();
for (let i = 0; i < N && pool.length > 1; i++) { const a = pool[Math.floor(rnd() * pool.length)], b = pool[Math.floor(rnd() * pool.length)]; if (a === b) continue; edges.push({ from: a.label, to: b.label, kind: KINDS[Math.floor(rnd() * KINDS.length)], p: Math.round(rnd() * 1000) / 1000 }); used.set(a.label, a); used.set(b.label, b); }
const nodes = [...used.values()].map(n => ({ label: n.label, type: n.star, rag: 'green', reason: `from the ${n.star} star · ${(n.reason || '').slice(0, 80)}` }));
await writeFile(path.join(OUT, 'graph.json'), JSON.stringify({ schema: 'random-graph.v1', label: 'The Random star', seed: seedStr, generated_utc: new Date().toISOString(), note: 'Links chosen by probability alone. Not findings. Serendipity for Claude + VIK-AI.', focus_default: nodes[0]?.label, nodes, edges }, null, 2));
const md = `# The Random star — ${edges.length} links by chance, seed \`${seedStr}\`

No logic. Pairs drawn at random from every node the other stars drew (${pool.length} in the pool), joined with a random kind and a random weight. None of it is a finding. It exists because a mind that only follows evidence never trips over anything, and sometimes tripping is how a wire is found. Regenerated with the same seed, it gives the same links; a new day, new chance.

${edges.slice(0, 40).map(e => `- ${e.from} —${e.kind} (${e.p})→ ${e.to}`).join('\n')}

## For the Spider
\`random/graph.json\` — ${nodes.length} nodes, ${edges.length} edges. Fly it when you want to get lost on purpose.
`;
await writeFile(path.join(SKY, 'RANDOM.md'), md);
console.log(`random: ${edges.length} links from ${pool.length} nodes, seed ${seedStr}`);
