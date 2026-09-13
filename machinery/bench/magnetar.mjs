// THE MAGNETAR — a neutron star with a field a thousand trillion times the Earth's. Laws used:
// mass bends everything toward it; a dipole has two poles and its field falls with the cube of
// distance; the crust cracks under magnetic stress and the starquake is a flare — a burst you can
// date. Applied: mass of a repo = the callers its souls attract from elsewhere (electrons bound
// to it); the two heaviest repos are the poles; the field at a repo = Σ pole mass / hops³, where
// hops = 1 if the repo bonds to the pole directly, 2 if through another repo, 3 otherwise;
// starquakes = commits that moved many files at once, dated, per repo (git log). No model.
//
//   node magnetar.mjs  → star-maker/magnetar/{field.json, graph.json}, MAGNETAR.md
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const run = promisify(execFile);
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const ROOT = process.env.ESTATE_DIR || 'C:/Users/vikra/Documents/GitHub';
const OUT = path.join(SKY, 'magnetar'); await mkdir(OUT, { recursive: true });
const atoms = JSON.parse(await readFile(path.join(SKY, 'electron', 'atoms.json'), 'utf8')).top;   // top 500 bonded souls

// mass and bonds
const mass = new Map(), bonds = new Map();   // repo → Set(repo it bonds to)
for (const a of atoms) for (const home of a.homes) { mass.set(home, (mass.get(home) || 0) + a.valence); for (const r of a.valence_repos) (bonds.get(r) || bonds.set(r, new Set()).get(r)).add(home); }
const repos = [...new Set([...mass.keys(), ...bonds.keys()])];
const poles = [...mass].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([r, m]) => ({ repo: r, mass: m }));
const hops = (from, to) => from === to ? 0 : bonds.get(from)?.has(to) ? 1 : [...(bonds.get(from) || [])].some(mid => bonds.get(mid)?.has(to)) ? 2 : 3;
const field = repos.map(r => { const f = poles.map(p => ({ pole: p.repo, hops: hops(r, p.repo), strength: r === p.repo ? p.mass : p.mass / Math.pow(hops(r, p.repo), 3) }));
  return { repo: r, mass: mass.get(r) || 0, field: Math.round(f.reduce((s, x) => s + x.strength, 0) * 10) / 10, toward: f.sort((a, b) => b.strength - a.strength)[0].pole, bonds_out: [...(bonds.get(r) || [])].length }; })
  .sort((a, b) => b.field - a.field);

// starquakes: commits in the last 60 days that moved ≥ 40 files
const quakes = [];
for (const r of repos) {
  try {
    const { stdout } = await run('git', ['-C', path.join(ROOT, r), 'log', '--since=60 days ago', '--shortstat', '--format=%h|%ci|%s', '-n', '400'], { maxBuffer: 1 << 24 });
    const lines = stdout.split('\n'); let cur = null;
    for (const l of lines) { if (/^[0-9a-f]{7,}\|/.test(l)) { const [h, d, ...s] = l.split('|'); cur = { repo: r, sha: h, date: d.slice(0, 16), subject: s.join('|').slice(0, 90), files: 0 }; }
      else if (cur && /files? changed/.test(l)) { cur.files = Number((l.match(/(\d+) files? changed/) || [0, 0])[1]); if (cur.files >= 40) quakes.push(cur); cur = null; } }
  } catch {}
}
quakes.sort((a, b) => b.files - a.files);
await writeFile(path.join(OUT, 'field.json'), JSON.stringify({ generated_utc: new Date().toISOString(), poles, field, starquakes: quakes.slice(0, 200) }, null, 2));
const nodes = field.map(f => ({ label: `repo ${f.repo}`, type: poles.some(p => p.repo === f.repo) ? 'pole' : 'body', rag: quakes.some(q => q.repo === f.repo && q.files >= 200) ? 'red' : 'green', reason: `mass ${f.mass} · field ${f.field} · drawn toward ${f.toward} · ${quakes.filter(q => q.repo === f.repo).length} starquakes in 60 days` }));
const edges = field.filter(f => !poles.some(p => p.repo === f.repo)).map(f => ({ from: `repo ${f.repo}`, to: `repo ${f.toward}`, kind: 'FIELD_LINE' }));
await writeFile(path.join(OUT, 'graph.json'), JSON.stringify({ schema: 'magnetar-graph.v1', label: 'The Magnetar', generated_utc: new Date().toISOString(), note: 'Repos as bodies in the field of the two heaviest; FIELD_LINE points where a repo is drawn.', focus_default: nodes[0]?.label, nodes, edges }, null, 2));
const md = `# The Magnetar — two poles, ${repos.length} bodies, ${quakes.length} starquakes in 60 days

Mass = the callers a repo's souls attract from other repos. The two heaviest are the poles; field at a body = Σ pole mass / hops³. A starquake = one commit that moved ≥ 40 files: the crust cracking. Updated ${new Date().toISOString()}. No model.

## Poles
${poles.map(p => `- **${p.repo}** — mass ${p.mass}`).join('\n')}

## The field (who is drawn where)
| body | mass | field | drawn toward | bonds out |
|---|---|---|---|---|
${field.slice(0, 30).map(f => `| ${f.repo} | ${f.mass} | ${f.field} | ${f.toward} | ${f.bonds_out} |`).join('\n')}

## Starquakes (the biggest single commits, dated — where the crust cracked)
${quakes.slice(0, 30).map(q => `- **${q.files} files** · ${q.repo} · ${q.date} · \`${q.sha}\` ${q.subject}`).join('\n') || '- none'}

## For the Spider
\`magnetar/graph.json\` — ${nodes.length} nodes, ${edges.length} FIELD_LINE edges.
`;
await writeFile(path.join(SKY, 'MAGNETAR.md'), md);
console.log(`magnetar: poles ${poles.map(p => p.repo).join(' & ')} · ${repos.length} bodies · ${quakes.length} starquakes`);
