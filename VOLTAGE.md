# The Voltage star

What the code says about each voltage level, what data we hold for it, what GB literature says it is, and which NESO open-licence datasets speak of it. Only voltages the code touches; only properties that serve the purpose. Updated 2026-09-13T22:59:04.618Z. No model.

| kV | role in GB (NESO Grid Code / ETYS) | mentions | files | repos | atlas layer | NESO connection sites |
|---|---|---|---|---|---|---|
| **400** | transmission (E&W, GB backbone) | 10662 | 1004 | 23 | 4106 features | 355 |
| **275** | transmission (E&W) | 2629 | 550 | 18 | 2935 features | 261 |
| **220** | not a GB standard level — check the code: interconnector or continental data? | 638 | 55 | 13 | 126 features | 32 |
| **132** | transmission in Scotland; distribution (DNO) in England & Wales | 12779 | 3283 | 23 | 6227 features | 575 |
| **66** | distribution (DNO, some EHV networks) | 2054 | 151 | 21 | 1171 features | 31 |
| **33** | distribution (DNO, EHV) | 5070 | 297 | 19 | — | 343 |
| **11** | distribution (DNO, HV) | 420 | 108 | 15 | — | 37 |

Connection sites read from `data-grid-gb.connection-points.v3` (886 sites; NESO-published, minimum 132 kV).

## Where the code speaks of each voltage (first lines)
### 400 kV
- `cable-trench-or-drill/DEVELOPMENT-PLAN.md:10` These are planned stages. The baseline includes existing visual geometry and indicative trench/bend calculations only; i
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:98` | 16:32 | `3ce1b8b` | Added GRID proximity over 66-400 kV: radius search, sorting, indicative connection GeoJSON, and a 
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:48` | grid_400kv | 4,106 | 869,466 | 14.6 | at the line |
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:63` | grid_400kv | 1,469,779 | 869,466 | 1.69× | 0.59 |
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:110` 5. `preload: false` unless the layer is on the critical path. Only `grid_400kv` is.
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:169` | **desktop** | `navigator.deviceMemory >= 8` or no signal and viewport ≥ 1024 wide | full static GeoJSON; PMTiles for t
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:170` | **tablet** | viewport 768–1023, or `deviceMemory` 4–7 | static GeoJSON ≤ 2 MB; PMTiles for anything heavier | DuckDB o
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/1-proposed-068-dcgb-osm-way-1545372119.md:40` | nearest transmission circuit | 1.24 km at 400 kV |

### 275 kV
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:66` | grid_275kv | 1,022,298 | 604,554 | 1.69× | 0.41 |
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/1-proposed-056-dcgb-osm-way-324811964.md:40` | nearest transmission circuit | 2.97 km at 275 kV |
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/1-proposed-056-dcgb-osm-way-324811964.md:45` Within 2.97 km of a 275 kV circuit - a workable connection distance for a load of this kind.
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/1-proposed-077-dcgb-osm-way-326884636.md:40` | nearest transmission circuit | 0.57 km at 275 kV |
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/1-proposed-077-dcgb-osm-way-326884636.md:45` Sitting within 2 km of a 275 kV circuit. For a data centre that is the difference between a
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/1-proposed-077-dcgb-osm-way-37867853.md:40` | nearest transmission circuit | 0.40 km at 275 kV |
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/1-proposed-077-dcgb-osm-way-37867853.md:45` Sitting within 2 km of a 275 kV circuit. For a data centre that is the difference between a
- `chatgpt-audits/202608310033-study/DATACENTRE-STUDIES/3-built-026-dcgb-osm-way-43126267.md:40` | nearest transmission circuit | 3.44 km at 275 kV |

### 220 kV
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:70` | grid_220kv | 62,038 | 36,941 | 1.68× | 0.02 |
- `claude/sessions/202609030120-codex-audit/00-baseline.md:91` `SGRX` is the partial exception: `SGRO` SEAGREEN ONE 220KV ONSHORE also exists and
- `claude/sessions/202609030120-codex-audit/00-baseline.md:136` `MORAY EAST ONSHORE`, 400 vs 220 kV), where only one is located.
- `data-federation-map-for-globalgrid2050-all-repos/every-drop-is-the-ocean/Gemini-Ventus Global-Grid-2050-Repository-Federation-for-an-Electrified-Future.md:77` ￼ ⁠220kV⁠
- `data-gridatlas/atman/202608291015-verify-v8-transplant.py:39` "grid_220kv": (150, 93), "grid_132kv": (7218, 4342), "grid_66kv": (1353, 828),
- `data-gridatlas/compiler/202608291015-build-v8-transplant.py:47` "grid_220kv": (150, 93),
- `data-interconnectors/research/interconnectors-research-with-claude-ai-opus-4-8.md:54` Russia’s grid is the historical proof that a single synchronous/interconnected system can span a continent. It descends 
- `globalgrid2050/backup270326_ repd_atlas_grid_model.md:180` "<span style='color: #ff9900; font-weight: bold;'>220kV Cables</span>": grid220Layer,

### 132 kV
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:34` * Anchored on: Utility 66kV (300,400mm²), Utility 132kV (300,630,1000,1200,1600mm²),
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:53` // 132kV (Uo=76)
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:352` "132": { label: "132 kV (76/132 kV) ★",  Uo: 76,  mbr_factor: 15, cores: ["single"] },
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/index.html:58` <option value="ehv">132kV AC</option>
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/index.html:126` <option value="132">132 kV (76/132 kV) ★</option>
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/index.html:228` <li>Primary source for LV to 132kV burial depth guidance in this tool is <a href="https://g81.ukpowernetworks.co.uk/libr
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/index.html:228` <li>Primary source for LV to 132kV burial depth guidance in this tool is <a href="https://g81.ukpowernetworks.co.uk/libr
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/index.html:228` <li>Primary source for LV to 132kV burial depth guidance in this tool is <a href="https://g81.ukpowernetworks.co.uk/libr

### 66 kV
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:34` * Anchored on: Utility 66kV (300,400mm²), Utility 132kV (300,630,1000,1200,1600mm²),
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:38` * Lower voltages from catalogue; 66kV+ single-core only —
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:39` * three-core cables do not exist at 66 kV and above.
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:50` // 66kV (Uo=38)
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:350` "66":  { label: "66 kV (38/66 kV) ★",   Uo: 38,  mbr_factor: 15, cores: ["single"] },
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/index.html:124` <option value="66">66 kV (38/66 kV) ★</option>
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/ui.js:116` noteEl.innerHTML = "<strong>Three-core cables are not used at 66 kV and above.</strong> " +
- `chatgpt-audits/202608310033-study/DATA-DELIVERY-PLAN.md:67` | grid_66kv | 597,395 | 319,120 | 1.87× | 0.24 |

### 33 kV
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/calculations.js:152` reviewPoints.push("33kV trefoil group spacing is tight. Check separation against the relevant rating and installation st
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:35` * Manufacturer 110kV (630mm²), Catalogue 33kV full series.
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:36` * Three-core Al: Catalogue direct values (33kV unarmoured Al).
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:37` * Three-core Cu: Catalogue direct values (33kV unarmoured Cu).
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:61` // 33kV single core (Uo=18) — catalogue values
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:74` // 33kV three core ALUMINIUM unarmoured (Uo=18) — catalogue values
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:85` // 33kV three core COPPER unarmoured (Uo=18) — Power Cable Catalogue
- `cable-trench-or-drill/releases/202609051921/solar-bess-topology-v7/cable-geometry-visualiser/data.js:348` "33":  { label: "33 kV (19/33 kV) — Al", Uo: 18, mbr_factor: 15, cores: ["single","three"] },

### 11 kV
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:15` 33 kV distribution, separately labelled estimated UKPN 11 kV points, and separate transmission and
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:101` | 17:11 | `92a69ad` | Added 104,557 33 kV segments, capped estimated UKPN 11 kV points at 15 km, and split transmission 
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:119` | Estimated UKPN 11 kV result within 15 km | 966 | 657 |
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:183` the 253,897-segment, 33 kV, estimated-11 kV, and transmission/distribution claims.
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:315` > 33 kV and 11 kV distribution, where most sub-50 MW schemes connect
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:319` distance for every row. Estimated 11 kV is also modelled separately for 966 rows, although it is not
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:323` set and that 11 kV is a separately labelled, UKPN-only estimated point layer with a 15 km cap.
- `chatgpt-audits/202608310033-study/202608311735-pipelinenews-grid-distance-maths-audit.md:364` - Separate confirmed network layers from estimated UKPN 11 kV data.

## NESO open-licence datasets that match our voltages and purpose
- **Transmission Losses** — NESO Open Data Licence · 2 resources · https://www.neso.energy/data-portal/transmission-losses · matched "transmission network voltage"
- **Transmission Network Use of System (TNUoS) Tariffs** — NESO Open Data Licence · 8 resources · https://www.neso.energy/data-portal/transmission-network-use-of-system-tnuos-tariffs · matched "transmission network voltage"
- **Voltage System Costs** — NESO Open Data Licence · 13 resources · https://www.neso.energy/data-portal/outturn-voltage-costs · matched "transmission network voltage"
- **Operational Transparency Forum - Network congestion data** — NESO Open Data Licence · 1 resources · https://www.neso.energy/data-portal/operational-transparency-forum-network-congestion-data · matched "transmission network voltage"
- **Constraint Breakdown Costs and Volume** — NESO Open Data Licence · 10 resources · https://www.neso.energy/data-portal/constraint-breakdown · matched "transmission network voltage"
- **24 Months Ahead Constraint Cost Forecast** — NESO Open Data Licence · 1 resources · https://www.neso.energy/data-portal/24-months-ahead-constraint-cost-forecast · matched "transmission network voltage"
- **Index Linked Contracted Energy Volume** — NESO Open Data Licence · 5 resources · https://www.neso.energy/data-portal/index-linked-contract-volume · matched "transmission network voltage"
- **24 Months Ahead Constraint Limits** — NESO Open Data Licence · 3 resources · https://www.neso.energy/data-portal/24-months-ahead-constraint-limits · matched "transmission network voltage"
- **GIS Boundaries for GB Grid Supply Points** — NESO Open Data Licence · 10 resources · https://www.neso.energy/data-portal/gis-boundaries-for-gb-grid-supply-points · matched "transmission network voltage"
- **Capacity Market Register** — NESO Open Data Licence · 8 resources · https://www.neso.energy/data-portal/capacity-market-register · matched "connection capacity headroom"
- **Transmission Entry Capacity (TEC) register** — NESO Open Data Licence · 1 resources · https://www.neso.energy/data-portal/transmission-entry-capacity-tec-register · matched "connection capacity headroom"
- **ElecLink - NESO's Net Transfer Capacity** — NESO Open Data Licence · 2 resources · https://www.neso.energy/data-portal/eleclink · matched "connection capacity headroom"
- **North Sea Link - NESO's Net Transfer Capacity** — NESO Open Data Licence · 2 resources · https://www.neso.energy/data-portal/nsl · matched "connection capacity headroom"
- **Viking Link - NESO's Net Transfer Capacity** — NESO Open Data Licence · 2 resources · https://www.neso.energy/data-portal/viking · matched "connection capacity headroom"
- **NemoLink - NESO's Net Transfer Capacity** — NESO Open Data Licence · 4 resources · https://www.neso.energy/data-portal/nemolink · matched "connection capacity headroom"
- **Interconnector Register** — NESO Open Data Licence · 1 resources · https://www.neso.energy/data-portal/interconnector-register · matched "connection capacity headroom"
- **IFA2 - NESO's Intraday Transfer Limit** — NESO Open Data Licence · 2 resources · https://www.neso.energy/data-portal/ifa2 · matched "connection capacity headroom"
- **IFA - NESO's Intraday Transfer Limit** — NESO Open Data Licence · 2 resources · https://www.neso.energy/data-portal/ifa · matched "connection capacity headroom"
- **Thermal Constraint Costs** — NESO Open Data Licence · 11 resources · https://www.neso.energy/data-portal/thermal-constraint-costs · matched "constraint"
- **Constraint Management Intertrip Service Information (CMIS)** — NESO Open Data Licence · 5 resources · https://www.neso.energy/data-portal/constraint-management-intertrip-service-information-cmis · matched "constraint"


## Questions the star raises (for Claude + VIK-AI)
- 220 kV: the code mentions it 638 times and the atlas has a `grid_220kv` layer with 126 features — 220 kV is not a GB standard level; whose lines are these (interconnector landfall, imported data)?
- 11 kV: 420 mentions but no atlas layer — the UKPN 11 kV layer showed [WAIT] in every drive tonight; is its source reachable?
- Every voltage the code names should map to one element on the periodic table; today none do.

## For the Spider
`voltage/graph.json` — 50 nodes, 38 edges (SPEAKS_OF, OPEN_DATA_FOR).
