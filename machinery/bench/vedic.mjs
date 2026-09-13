// THE VEDIC STAR — guided by the Upanishads. Brahman: the one behind all forms; Atman: the self
// that is that one (tat tvam asi — every incarnation IS its soul); the five elements, pancha
// bhuta, in which every form exists; neti neti — "not this, not this" — the way to what is real
// by removing what is not; rita — the order that holds the cosmos together.
// Applied, plainly: (1) sort every element and soul into the five bhutas — prithvi/earth = data
// that sits (layers, files), apas/water = data that flows (streams, parquet, fetch), agni/fire =
// transformation (engines, calculations), vayu/air = movement between (deep links, events,
// messages), akasha/ether = the space that holds all (shells, manifests, contracts, registries);
// (2) neti neti — what is not stated, not called, not tested, not composed: the list a mind may
// release (moksha) without loss; (3) rita — the declared order of the composition and whether
// every star kept it (the loader honours cartridge_order; stars prove the order held). No model.
//
//   node vedic.mjs  → star-maker/vedic/{bhuta.json, graph.json}, VEDIC.md
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const SKY = process.env.SKY_DIR || 'C:/Users/vikra/Documents/GitHub/star-maker';
const OUT = path.join(SKY, 'vedic'); await mkdir(OUT, { recursive: true });
const table = JSON.parse(await readFile(path.join(SKY, 'elements', 'table.json'), 'utf8')).elements;
const atoms = JSON.parse(await readFile(path.join(SKY, 'electron', 'atoms.json'), 'utf8'));
const soulSummary = JSON.parse(await readFile(path.join(SKY, 'soul', 'summary.json'), 'utf8'));
const BHUTA = [
  ['akasha (ether)', /shell|manifest|contract|registry|schema|composition|current|loader|kernel/i],
  ['vayu (air)',     /deeplink|deep-link|link|event|dispatch|message|emit|route|flyto|arrival|search|gazetteer/i],
  ['agni (fire)',    /engine|calc|compute|distance|fault|rating|power|flow|topology|estimate|demand|capacity|economics|drop|factor|envelope|geodesy|haversine|area|shape/i],
  ['apas (water)',   /stream|parquet|bridge|fetch|duckdb|feed|pipeline|flow|sync|crawl|survey/i],
  ['prithvi (earth)',/layer|geojson|data|substation|grid_|railway|airport|datacentre|plant|offtaker|csv|json|file|store/i],
];
const bhutaOf = s => (BHUTA.find(([, rx]) => rx.test(s)) || ['prithvi (earth)'])[0];
const forms = [...table.map(e => ({ kind: 'element', name: e.symbol + ' ' + e.name, bhuta: bhutaOf(e.name + ' ' + e.family), state: e.state })),
               ...atoms.top.map(a => ({ kind: 'soul', name: `#${a.number} ${a.name}`, bhuta: bhutaOf(a.name), class: a.class, spin: a.spin }))];
const counts = Object.fromEntries(BHUTA.map(([b]) => [b, forms.filter(f => f.bhuta === b).length]));
// neti neti: not stated, not called, not tested — from the soul summary and the electron atoms
const neti = atoms.top.filter(a => a.class === 'inert-unused' || (a.spin === 'unpaired' && a.valence === 0 && !a.purpose)).slice(0, 60);
// rita: did every star keep the declared order? (loaded order must be a subsequence of the live order)
let kept = 0, broke = 0; const live = ['streaming-parquet-bridge', 'uk-gazetteer-flyto', 'substation-intelligence', 'sld-sandbox'];
try { const { readdirSync } = await import('node:fs'); for (const f of readdirSync(path.join(SKY, 'stars')).slice(0, 4000)) { const s = JSON.parse(await readFile(path.join(SKY, 'stars', f), 'utf8')); const idx = (s.loaded || []).map(id => live.indexOf(id)); (idx.every((v, i) => i === 0 || v > idx[i - 1]) ? kept++ : broke++); } } catch {}
await writeFile(path.join(OUT, 'bhuta.json'), JSON.stringify({ generated_utc: new Date().toISOString(), counts, forms: forms.slice(0, 800), neti_neti: neti, rita: { kept, broke } }, null, 2));
const nodes = BHUTA.map(([b]) => ({ label: b, type: 'bhuta', rag: 'green', reason: `${counts[b]} forms` }));
const edges = [];
for (const f of forms.slice(0, 300)) { nodes.push({ label: f.name, type: f.kind, rag: f.state === 'UNSETTLED' || f.class === 'inert-unused' ? 'amber' : 'green', reason: `${f.kind} · ${f.bhuta}` }); edges.push({ from: f.bhuta, to: f.name, kind: 'IS_MADE_OF' }); }
await writeFile(path.join(OUT, 'graph.json'), JSON.stringify({ schema: 'vedic-graph.v1', label: 'The Vedic star', generated_utc: new Date().toISOString(), note: 'The five bhutas and the forms that exist in each; neti neti in the report.', focus_default: 'agni (fire)', nodes, edges }, null, 2));
const md = `# The Vedic star

*Tat tvam asi* — every incarnation is its soul: ${soulSummary.souls.toLocaleString()} souls behind ${soulSummary.incarnations.toLocaleString()} forms. Below, the forms sorted into the five bhutas, what neti neti would release, and whether rita — the declared order — held. Updated ${new Date().toISOString()}. No model.

## Pancha bhuta — in which element does each form exist?
| bhuta | meaning here | forms |
|---|---|---|
${BHUTA.map(([b]) => `| **${b}** | ${{ 'akasha (ether)': 'the space that holds all: shells, manifests, contracts, registries', 'vayu (air)': 'movement between: deep links, events, routes, arrivals', 'agni (fire)': 'transformation: engines, calculations, the maths', 'apas (water)': 'data that flows: streams, parquet, feeds, crawls', 'prithvi (earth)': 'data that sits: layers, files, substations, circuits' }[b]} | ${counts[b]} |`).join('\n')}

## Neti neti — not stated, not called, not tested: what may be released without loss
${neti.slice(0, 40).map(a => `- **#${a.number} ${a.name}** · ${a.lines} lines · home ${a.homes.join('/')} · ${a.class}`).join('\n') || '- nothing: everything is held by something'}

## Rita — did the declared order hold?
Of ${kept + broke} stars read, **${kept}** loaded their cartridges in the declared order and **${broke}** did not.${broke ? ' A star that broke the order is a finding.' : ' The loader keeps rita; the cracks are in the parts, not the order.'}

## For the Spider
\`vedic/graph.json\` — ${nodes.length} nodes, ${edges.length} IS_MADE_OF edges: fly from a bhuta into its forms.
`;
await writeFile(path.join(SKY, 'VEDIC.md'), md);
console.log(`vedic: ${Object.entries(counts).map(([b, n]) => `${b.split(' ')[0]} ${n}`).join(' · ')} · neti ${neti.length} · rita ${kept}/${kept + broke}`);
