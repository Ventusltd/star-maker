# Logic stars — 105 constants that disagree with themselves

Scanned 10317 code files across the estate (timestamped copies collapsed to one lineage), 33680 constant definitions read. No model was used; this is a regular-expression reading of `NAME = literal` and a comparison of the literals. A logic star is one NAME with two or more distinct VALUES. Updated 2026-09-13T22:32:57.242Z.

| kind | stars |
|---|---|
| physics-drift | 7 |
| vocabulary-drift | 4 |
| constant-drift | 94 |

## Physics — reason with these first
- **MAX_TRIES** — 2 values across globalgrid2050, gridatlas, teleprinter, testcode: `160` (6) · `80` (3)
- **MAX_RESOURCES** — 2 values across globalgrid2050, gridatlas, teleprinter, testcode: `1500` (3) · `400` (3)
- **HIT_RADIUS_VERTEX_PX** — 2 values across globalgrid2050, gridatlas, testcode: `18` (11) · `22` (4)
- **HIT_RADIUS_EDGE_PX** — 2 values across globalgrid2050, gridatlas, testcode: `22` (11) · `16` (4)
- **LIMIT** — 2 values across gridatlas, solar-electrical-topology-analysis-engine-text-based: `Screening only: not solved power flow, a` (1) · `100` (1)
- **SOLAR_MIN_EXCLUSIVE** — 2 values across globalgrid2050: `49.0` (1) · `1.0` (1)
- **EARTH_KM** — 2 values across gridatlas: `6371.0088` (1) · `6378.137` (1)

## Vocabularies that drift (a list of technologies, layers, ids that is not the same list everywhere)
- **TECHNOLOGIES** — 4 versions across globalgrid2050, gridatlas, pipelinenews, testcode, ventus-grid-engine
- **ALLOWED_TECHNOLOGIES** — 3 versions across globalgrid2050, pipelinenews, testcode
- **REPD_IDS** — 2 versions across globalgrid2050, gridatlas, testcode, ventus-grid-engine
- **STATUSES** — 2 versions across globalgrid2050, pipelinenews

## Everything else, most-spread first
- **GENERATION** — 51 values, 132 files, chatgpt-audits, data-gridatlas, globalgrid2050, gridatlas, pipelinenews, testcode
- **SCHEMA** — 17 values, 57 files, data-gridatlas, globalgrid2050, gridatlas, pipelinenews, spiders, testcode, ventus-grid-engine
- **API** — 6 values, 10 files, claude, globalgrid2050, gridatlas, pipelinenews, spiders
- **SCHEMA_VERSION** — 7 values, 7 files, globalgrid2050, registry_of_all_content_in_repos_and_dependencies, solar-electrical-topology-analysis-engine-text-based, spiders
- **SOURCE** — 5 values, 5 files, cable-trench-or-drill, data-interconnectors, gis-sld-sandbox, gridatlas, layout-tool
- **RELEASE_URL** — 8 values, 56 files, globalgrid2050, pipelinenews, testcode
- **MANIFEST_URL** — 5 values, 27 files, globalgrid2050, gridatlas, pipelinenews, testcode
- **EXPECTED_CACHE_IDENTITY** — 10 values, 13 files, globalgrid2050, pipelinenews
- **VERSION** — 6 values, 6 files, gridatlas, solar-electrical-topology-analysis-engine-text-based, spiders
- **EXPECTED_COMPILER_METHOD** — 8 values, 11 files, globalgrid2050, pipelinenews
- **METHOD_VERSION** — 5 values, 6 files, data-federation-map-for-globalgrid2050-all-repos, globalgrid2050-homepage, globalgrid2050-hompage
- **NOT_AN_ASSESSMENT** — 3 values, 16 files, globalgrid2050, gridatlas, testcode, ventus-grid-engine
- **BASE** — 3 values, 7 files, claude, gridatlas, testcode, ventus-grid-engine
- **NAME** — 6 values, 6 files, gridatlas, pipelinenews
- **COMPILER_METHOD** — 11 values, 11 files, pipelinenews
- **RELEASE_ID** — 5 values, 14 files, gridatlas, pipelinenews
- **MODULE** — 5 values, 5 files, gridatlas, solar-electrical-topology-analysis-engine-text-based
- **ORDER** — 3 values, 10 files, globalgrid2050, gridatlas, testcode
- **CSS_MARKER** — 9 values, 9 files, globalgrid2050
- **PREFIX** — 3 values, 6 files, cable-trench-or-drill, gis-sld-sandbox, layout-tool
- **REGISTRY_SCHEMA** — 3 values, 5 files, gridatlas, pipelinenews, spiders
- **BASELINE** — 3 values, 3 files, cable-trench-or-drill, gis-sld-sandbox, layout-tool
- **NOT_A_CAPACITY** — 2 values, 14 files, globalgrid2050, gridatlas, testcode, ventus-grid-engine
- **STATUS_ID** — 2 values, 12 files, globalgrid2050, gridatlas, teleprinter, testcode
- **IMPEDANCE_BASIS** — 2 values, 12 files, globalgrid2050, gridatlas, testcode, ventus-grid-engine
- **ACCEPTS** — 2 values, 10 files, globalgrid2050, gridatlas, testcode, ventus-grid-engine
- **ENGINE_GRAPH_URL** — 2 values, 9 files, globalgrid2050, gridatlas, pipelinenews, testcode
- **PAGE** — 2 values, 8 files, globalgrid2050, pipelinenews, pipelinenews-gridatlas-20260906, ventus-grid-engine
- **MARKER** — 8 values, 8 files, globalgrid2050
- **WORKFLOW_NAME** — 8 values, 8 files, globalgrid2050
- **MENUS** — 2 values, 8 files, globalgrid2050, gridatlas, spiders, testcode
- **CAVEAT** — 2 values, 7 files, globalgrid2050, gridatlas, testcode, ventus-grid-engine
- **BAR_ID** — 2 values, 7 files, globalgrid2050, gridatlas, spiders, testcode
- **ROOT** — 4 values, 6 files, claude, gridatlas
- **REGISTRY_URL** — 2 values, 6 files, globalgrid2050, globalgrid2050-homepage, globalgrid2050-hompage, pipelinenews
- **SOURCE_PARENT_COMMIT** — 7 values, 7 files, pipelinenews
- **PAYLOAD_SCHEMA** — 2 values, 22 files, globalgrid2050, pipelinenews, testcode
- **KEY** — 2 values, 21 files, globalgrid2050, gridatlas, testcode
- **CONTRACT_URL** — 2 values, 17 files, globalgrid2050, pipelinenews, testcode
- **CONTRACT_SCHEMA** — 2 values, 17 files, globalgrid2050, pipelinenews, testcode
- **MANIFEST_SHA256** — 2 values, 16 files, globalgrid2050, gridatlas, testcode
- **ACTIVE_TARGET** — 2 values, 9 files, globalgrid2050, pipelinenews, ventus-grid-engine
- **FETCH_TIMEOUT_MS** — 2 values, 8 files, gridatlas, pipelinenews, teleprinter
- **PARENT_GENERATION** — 6 values, 8 files, pipelinenews
- **OFFSHORE_NOTE** — 2 values, 7 files, globalgrid2050, gridatlas, testcode
- **BASE_URL** — 3 values, 5 files, globalgrid2050, pipelinenews
- **OWNER** — 2 values, 3 files, claude, gridatlas, registry_of_all_content_in_repos_and_dependencies
- **CATALOG_URL** — 2 values, 3 files, globalgrid2050, globalgrid2050-homepage, globalgrid2050-hompage
- **USER_AGENT** — 3 values, 3 files, globalgrid2050, gridatlas
- **ANCHOR** — 3 values, 3 files, gridatlas, v11
- **STEM** — 5 values, 5 files, globalgrid2050
- **PROOF** — 5 values, 5 files, gridatlas
- **TIMEOUT** — 2 values, 13 files, claude, globalgrid2050
- **WINDOW_SIZE** — 2 values, 8 files, globalgrid2050, pipelinenews
- **API_URL** — 2 values, 5 files, data-interconnectors, globalgrid2050
- **TOPOLOGY** — 2 values, 5 files, gridatlas, solar-electrical-topology-analysis-engine-text-based
- **WINDOW** — 2 values, 4 files, claude, pipelinenews
- **CSV_URL** — 4 values, 4 files, globalgrid2050
- **DIARY_MARKER** — 4 values, 4 files, globalgrid2050
- **POLICY_ID** — 4 values, 4 files, pipelinenews
