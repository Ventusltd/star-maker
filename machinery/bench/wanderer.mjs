// THE WANDERER — one star that never stops moving. It reads every line of code ever written in
// the estate, numbers every unit (function, method, class, def) once and forever, and asks of
// each: WHY is this here? WHAT does it serve? IS IT A DUPLICATE? No model — our own reading.
// Its answers are evidence: the comment that states a purpose, the callers that prove a use,
// the identical body found elsewhere, the twin with the same name and a different body, the
// rare name two repos both call — an entanglement. It writes a graph the Spider can load, so a
// reader can get lost in the code and the entanglements can reveal themselves.
//
//   node wanderer.mjs            one pass → star-maker/wanderer/{units.jsonl, graph.json}, WANDERER.md
//   node wanderer.mjs --loop     a pass every hour, forever (the speed of light, for a CPU)
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.env.ESTATE_DIR || 'C:/Users/vikra/Documents/GitHub';
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const OUT = path.join(SKY, 'wanderer');
const SKIP = /[\\/](\.git|node_modules|dist|build|vendor|\.venv|homepage_versions|restore_points|site_versions|_codemap|star-maker[\\/]stars)[\\/]/;
const EXT = new Set(['.js', '.mjs', '.cjs', '.py']);
const MINIFIED = t => t.length > 20000 && t.split('\n').some(l => l.length > 3000);
const sha = s => createHash('sha1').update(s).digest('hex').slice(0, 12);
const lineage = p => p.replace(/\d{12}[-_]?/g, '').replace(/\\/g, '/');
const normBody = b => b.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*/g, '').replace(/\s+/g, ' ').trim();

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (SKIP.test(p + (e.isDirectory() ? '/' : ''))) continue;
    if (e.isDirectory()) yield* walk(p); else if (EXT.has(path.extname(e.name)) && (await stat(p)).size < 2_500_000) yield p;
  }
}
// unit finders: [regex, kind]. name in group 1.
const FINDERS = [
  [/(?:^|\n)[ \t]*(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g, 'function'],
  [/(?:^|\n)[ \t]*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g, 'arrow'],
  [/(?:^|\n)[ \t]*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g, 'class'],
  [/(?:^|\n)[ \t]+(?:async\s+)?(?!if|for|while|switch|catch|function|return)([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g, 'method'],
  [/(?:^|\n)[ \t]*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/g, 'def'],
];
function bodyFrom(text, start, py) {
  if (py) { const lines = text.slice(start).split('\n'); const ind = (lines[0].match(/^[ \t]*/) || [''])[0].length; let i = 1; for (; i < lines.length && i < 400; i++) { const l = lines[i]; if (l.trim() && (l.match(/^[ \t]*/) || [''])[0].length <= ind) break; } return lines.slice(0, i).join('\n'); }
  const open = text.indexOf('{', start); if (open < 0) return text.slice(start, start + 200);
  let depth = 0; for (let i = open; i < text.length && i < open + 40000; i++) { const c = text[i]; if (c === '{') depth++; else if (c === '}' && --depth === 0) return text.slice(start, i + 1); }
  return text.slice(start, open + 2000);
}
function purposeBefore(text, start) {
  const before = text.slice(Math.max(0, start - 1200), start);
  const m = before.match(/(\/\*\*?[\s\S]*?\*\/|(?:[ \t]*\/\/[^\n]*\n)+|(?:[ \t]*#[^\n]*\n)+)\s*$/);
  if (!m) return null;
  const s = m[1].replace(/^\s*(\/\*\*?|\*\/|\*|\/\/|#)\s?/gm, '').replace(/\s+/g, ' ').trim();
  return s.length > 8 ? s.slice(0, 220) : null;
}

async function pass() {
  const t0 = Date.now();
  await mkdir(OUT, { recursive: true });
  // persisted numbering: number is assigned once per key and never reused
  const prev = new Map();
  try { for (const l of (await readFile(path.join(OUT, 'units.jsonl'), 'utf8')).split('\n')) if (l) { const u = JSON.parse(l); prev.set(u.key, u.number); } } catch {}
  let nextNumber = prev.size ? Math.max(...prev.values()) + 1 : 1;

  const units = []; const callsByFile = new Map(); const files = []; let totalLines = 0; const uniqueLines = new Set();
  for await (const f of walk(ROOT)) {
    const text = await readFile(f, 'utf8').catch(() => '');
    if (!text || MINIFIED(text)) continue;
    const rel = path.relative(ROOT, f).replace(/\\/g, '/'); const repo = rel.split('/')[0]; const lin = lineage(rel);
    files.push(rel); totalLines += text.split('\n').length;
    for (const l of text.split('\n')) { const n = l.trim(); if (n.length > 3) uniqueLines.add(sha(n)); }
    callsByFile.set(rel, new Set(text.match(/(?<![.\w$])[A-Za-z_$][\w$]*(?=\s*\()/g) || []));   // bare calls only: obj.slice( is not a call of our slice
    const py = f.endsWith('.py'); const seen = new Set();
    for (const [rx, kind] of FINDERS) {
      if (py !== (kind === 'def')) continue;
      for (const m of text.matchAll(rx)) {
        const name = m[1]; const start = m.index + (m[0].startsWith('\n') ? 1 : 0);
        if (seen.has(start)) continue; seen.add(start);
        const body = bodyFrom(text, start, py); const lines = body.split('\n').length;
        if (lines < 2 && kind !== 'arrow') continue;
        const key = `${lin}#${kind}:${name}`;
        units.push({ key, number: prev.get(key) || nextNumber++, name, kind, repo, file: rel, lineage: lin, line: text.slice(0, start).split('\n').length, lines,
          body_hash: sha(normBody(body)), purpose: purposeBefore(text, start) });
      }
    }
  }
  // WHY / WHAT / DUPLICATE — answered from evidence
  const byHash = new Map(), byName = new Map(), defFiles = new Map();
  for (const u of units) {
    (byHash.get(u.body_hash) || byHash.set(u.body_hash, []).get(u.body_hash)).push(u);
    (byName.get(u.name) || byName.set(u.name, []).get(u.name)).push(u);
    (defFiles.get(u.name) || defFiles.set(u.name, new Set()).get(u.name)).add(u.file);
  }
  for (const u of units) {
    const callers = []; for (const [f, calls] of callsByFile) if (f !== u.file && calls.has(u.name)) callers.push(f);
    u.callers = callers.length; u.caller_repos = [...new Set(callers.map(f => f.split('/')[0]))];
    const dups = byHash.get(u.body_hash).filter(o => o !== u && o.lineage !== u.lineage);
    u.duplicates = dups.slice(0, 12).map(o => o.number); u.duplicate_repos = [...new Set(dups.map(o => o.repo))];
    const twins = (byName.get(u.name) || []).filter(o => o !== u && o.repo !== u.repo && o.body_hash !== u.body_hash);
    u.twins = twins.slice(0, 12).map(o => o.number);
    u.why = u.purpose ? 'stated' : callers.length ? 'used' : 'unstated-and-uncalled';
  }
  // entanglements: a name called from ≥2 repos but defined in exactly one file — a hidden dependency by name
  const BUILTIN = new Set(['slice','Number','String','Boolean','Array','Object','round','floor','ceil','abs','min','max','open','has','get','set','add','delete','entries','keys','values','next','range','len','print','int','str','float','list','dict','sorted','function','require','fetch','setTimeout','setInterval','clearTimeout','querySelector','querySelectorAll','createElement','getAttribute','setAttribute','dispatchEvent','addEventListener','contains','closest','assert','assertEqual','expect','describe','it','test','main','init','run','render','update','log','load','save','build','parse','draw','toString','valueOf','constructor','push','pop','map','filter','reduce','forEach','join','split','trim','replace','match','indexOf','includes','find','some','every','sort','concat','then','catch','resolve','reject','end','write','read','close','start','stop','send','emit','on','off','once','error','warn','info','debug','format','stringify','encode','decode','hash','now','date','time','sleep','wait','exit']);
  const entangled = units.filter(u => u.kind !== 'method' && u.name.length >= 4 && !BUILTIN.has(u.name) && !/^[a-z]$/.test(u.name) && defFiles.get(u.name).size === 1 && u.caller_repos.filter(r => r !== u.repo).length >= 1);

  units.sort((a, b) => a.number - b.number);
  await writeFile(path.join(OUT, 'units.jsonl'), units.map(u => JSON.stringify(u)).join('\n') + '\n');

  // a graph the Spider can load (receiver idiom: nodes {label,type,rag,reason,gh}, edges {from,to,kind})
  const score = u => u.duplicates.length * 3 + u.twins.length * 2 + (entangled.includes(u) ? 5 : 0) + (u.why === 'unstated-and-uncalled' ? 1 : 0);
  const top = units.filter(u => score(u) > 0).sort((a, b) => score(b) - score(a)).slice(0, 400);
  const inTop = new Set(top.map(u => u.number)); const byNum = new Map(units.map(u => [u.number, u]));
  const label = u => `#${u.number} ${u.repo}/${u.name}`;
  const nodes = top.map(u => ({ label: label(u), type: u.why === 'unstated-and-uncalled' ? 'orphan' : entangled.includes(u) ? 'entangled' : u.duplicates.length ? 'duplicate' : 'twin',
    rag: u.why === 'unstated-and-uncalled' ? 'red' : u.duplicates.length ? 'amber' : 'green',
    reason: `${u.kind} · ${u.lines} lines · ${u.file}:${u.line} · ${u.purpose ? 'says: ' + u.purpose.slice(0, 120) : 'no stated purpose'} · ${u.callers} callers`,
    gh: `https://github.com/Ventusltd/${u.repo}/blob/main/${u.file.slice(u.repo.length + 1)}#L${u.line}` }));
  const edges = [];
  for (const u of top) {
    for (const n of u.duplicates) if (inTop.has(n)) edges.push({ from: label(u), to: label(byNum.get(n)), kind: 'DUPLICATES' });
    for (const n of u.twins) if (inTop.has(n)) edges.push({ from: label(u), to: label(byNum.get(n)), kind: 'TWIN_OF' });
  }
  for (const u of entangled) if (inTop.has(u.number)) for (const r of u.caller_repos) if (r !== u.repo) edges.push({ from: `repo ${r}`, to: label(u), kind: 'ENTANGLED_WITH' });
  const repoNodes = [...new Set(edges.filter(e => e.from.startsWith('repo ')).map(e => e.from))].map(l => ({ label: l, type: 'repo', rag: 'green', reason: 'calls a unit defined in another repo by name alone', gh: `https://github.com/Ventusltd/${l.slice(5)}` }));
  await writeFile(path.join(OUT, 'graph.json'), JSON.stringify({ schema: 'wanderer-graph.v1', label: 'The Wanderer', generated_utc: new Date().toISOString(),
    note: 'Units of code numbered once and forever; edges are evidence: identical bodies, same-name twins across repos, names called across repos but defined once.',
    focus_default: nodes[0]?.label, nodes: [...nodes, ...repoNodes], edges }, null, 2));

  const orphans = units.filter(u => u.why === 'unstated-and-uncalled'), dups = units.filter(u => u.duplicate_repos.length), stated = units.filter(u => u.purpose);
  const md = `# The Wanderer — ${units.length} units of code, numbered once and forever

Pass at ${new Date().toISOString()} · ${files.length} files · ${totalLines.toLocaleString()} lines read · **${uniqueLines.size.toLocaleString()} unique lines** ever written (trimmed, hashed) · ${Math.round((Date.now() - t0) / 1000)} s. No model; our own reading. A unit's number (\`#n\`) never changes; find it with \`grep '"number":n' wanderer/units.jsonl\`.

| question | answer |
|---|---|
| WHY is it here? — states its purpose in a comment | ${stated.length} (${Math.round(100 * stated.length / units.length)} %) |
| WHAT does it serve? — called from another file | ${units.filter(u => u.callers).length} |
| Unstated **and** uncalled (the wanderer's worry) | **${orphans.length}** |
| IS IT A DUPLICATE? — identical body in another repo | **${dups.length}** |
| Twins — same name, another repo, different body | ${units.filter(u => u.twins.length).length} |
| **Entanglements** — called across repos, defined once | **${entangled.length}** |

## Entanglements (quantum: two repos, one definition, no declared wire)
${entangled.sort((a, b) => b.caller_repos.length - a.caller_repos.length).slice(0, 40).map(u => `- **#${u.number} ${u.name}** defined in \`${u.file}\`, called from ${u.caller_repos.filter(r => r !== u.repo).join(', ')}`).join('\n') || '- none'}

## Duplicates across repos (the same body, copied)
${dups.sort((a, b) => b.duplicate_repos.length - a.duplicate_repos.length).slice(0, 40).map(u => `- **#${u.number} ${u.name}** (${u.lines} lines) in ${u.repo} = also in ${u.duplicate_repos.join(', ')}`).join('\n') || '- none'}

## Unstated and uncalled — why are these here?
${orphans.filter(u => u.lines >= 8).sort((a, b) => b.lines - a.lines).slice(0, 40).map(u => `- **#${u.number} ${u.name}** · ${u.lines} lines · \`${u.file}:${u.line}\``).join('\n') || '- none'}

## For the Spider
\`wanderer/graph.json\` — ${nodes.length + repoNodes.length} nodes, ${edges.length} edges, in the receiver's own idiom. To let a reader get lost in it on https://ventusltd.github.io/ventus-grid-engine/, add a graph entry to \`spider/manifest.json\` pointing at this file's published URL (publishing is the architect's).
`;
  await writeFile(path.join(SKY, 'WANDERER.md'), md);
  console.log(`wanderer: ${units.length} units, ${uniqueLines.size} unique lines, ${orphans.length} orphans, ${dups.length} cross-repo duplicates, ${entangled.length} entanglements, ${Math.round((Date.now() - t0) / 1000)} s`);
}

if (process.argv.includes('--loop')) { for (;;) { try { await pass(); } catch (e) { console.error('wanderer error', e.message); } await new Promise(r => setTimeout(r, 60 * 60 * 1000)); } }
else await pass();
