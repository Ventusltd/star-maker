# The periodic table — 47 elements

Stars make elements. An element is a primitive with a fixed identity (atomic number and symbol never change; the identity hash changes only when the thing itself changes) that any surface composes with: the Spider graphically, a terminal by symbol (`ventus.ps1 element Ek`), Claude by name. **UNSETTLED** elements exist in the estate in more than one form and wait for Claude + VIK-AI to settle which is true. Updated 2026-09-13T22:41:23.006Z.

## physics (8)

| # | symbol | name | state | note |
|---|---|---|---|---|
| 2 | **Ek** | EARTH_KM | 🟡 unsettled: `6371.0088` / `6378.137` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 3 | **Hr** | HIT_RADIUS_EDGE_PX | 🟡 unsettled: `22` / `16` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 4 | **Hi** | HIT_RADIUS_VERTEX_PX | 🟡 unsettled: `18` / `22` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 5 | **L** | LIMIT | 🟡 unsettled: `Screening only: not solv` / `100` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 6 | **Mr** | MAX_RESOURCES | 🟡 unsettled: `1500` / `400` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 7 | **Mt** | MAX_TRIES | 🟡 unsettled: `160` / `80` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 9 | **Rp** | REPD_PAGE | 🟡 unsettled: `https://www.gov.uk/gover` / `https://www.gov.uk/gover` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 10 | **Sm** | SOLAR_MIN_EXCLUSIVE | 🟡 unsettled: `49.0` / `1.0` | 2 values in the wild; Claude + VIK-AI must settle which is true |

## vocabulary (4)

| # | symbol | name | state | note |
|---|---|---|---|---|
| 1 | **At** | ALLOWED_TECHNOLOGIES | 🟡 unsettled: `set["bess","solar","wind` / `set["all","bess","solar"` / `set["all","bess","interc` | 3 values in the wild; Claude + VIK-AI must settle which is true |
| 8 | **Ri** | REPD_IDS | 🟡 unsettled: `list["act","bess","bess_` / `list["act","bess","bioma` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 11 | **S** | STATUSES | 🟡 unsettled: `set["All","Application S` / `list["All","Application ` | 2 values in the wild; Claude + VIK-AI must settle which is true |
| 12 | **T** | TECHNOLOGIES | 🟡 unsettled: `set["all","bess","solar"` / `list["bess","solar","win` / `list["all","bess","solar` / `set["bess","solar","wind` | 4 values in the wild; Claude + VIK-AI must settle which is true |

## engine (19)

| # | symbol | name | state | note |
|---|---|---|---|---|
| 13 | **Gc** | geo-core.js | 🟢 settled | the one haversine + R_ATLAS/R_UK/R_MEAN, (lon,lat) order |
| 14 | **Ga** | geo-area.js | 🟢 settled | polygonAreaKm2, polylinePerimeterKm, circleCapAreaKm2 |
| 15 | **Gs** | geo-shapes.js | 🟢 settled | destinationCirclePoints, the deduplicated circle generator |
| 16 | **Gg** | geo-geojson.js | 🟢 settled | circleFeatureCollection, GeoJSON shaping kept out of the maths |
| 17 | **Vg** | v9-geodesy.js | 🟢 settled | distanceKm, destinationPoint, initialBearingDeg, voltagesKv, representativePoint |
| 18 | **Vn** | v9-nearest-search.js | 🟢 settled | normalise + index, exhaustive scan, proven free of the ring-search bug |
| 19 | **Nt** | network-topology.js | 🟢 settled | PROMOTED this session: index/at/graph over one site’s published nodes/branches |
| 20 | **Ed** | electrical-distance.js | 🟢 settled | PROMOTED this session: between/within, BFS hop-count over network-topology.graph() |
| 21 | **Re** | rating-envelope.js | 🟢 settled | PROMOTED this session: at(), per-season lowest/highest range, never summed |
| 22 | **Ce** | corridor-estimate.js | 🟢 settled | PROMOTED this session: forCable(), calibrated straight-line-to-corridor multiplier |
| 23 | **Pf** | published-fault-level.js | 🟢 settled | AUTHORED 2026-09-05: record() and quote() for a fault figure that is published, dated and  |
| 24 | **El** | electrification-demand.js | 🟢 settled | AUTHORED 2026-09-06: the arithmetic of the electrification paper made exact — average powe |
| 25 | **Fc** | firm-capacity.js | 🟢 settled | AUTHORED 2026-09-06: N-1 firm capacity, apparent power from a stated power factor, and uti |
| 26 | **Dd** | diversified-demand.js | 🟢 settled | AUTHORED 2026-09-06: After Diversity Maximum Demand, coincidence measured from a group pea |
| 27 | **Cc** | connection-capacity.js | 🟢 settled | AUTHORED 2026-09-06: sizing against a STATED connection cap for developers, EPCs and heavy |
| 28 | **Ro** | route-obstacles.js | 🟢 settled | AUTHORED 2026-09-06: the check a scalar corridor function could not make. corridor-estimat |
| 29 | **Ie** | interconnector-economics.js | 🟢 settled | AUTHORED 2026-09-06: an interconnector as an edge between two systems, priced. Direction f |
| 30 | **Po** | power-factor.js | 🟢 settled | AUTHORED 2026-09-06: the cheapest capacity anybody buys. 1,000 kW at 0.85 draws 1,176 kVA; |
| 31 | **Vd** | voltage-drop.js | 🟢 settled | AUTHORED 2026-09-06: volts and watts along a run, which decides cable size on a long colle |

## cartridge (4)

| # | symbol | name | state | note |
|---|---|---|---|---|
| 32 | **Sp** | streaming-parquet-bridge | 🟢 settled | replaces 202608292311-maplibre-worker-bridge.js |
| 33 | **Ug** | uk-gazetteer-flyto | 🟢 settled | replaces 202608291818-place-postcode-search.js |
| 34 | **Ss** | sld-sandbox | 🟢 settled | replaces 202608292126-pre-snapped-config-adapter.js |
| 35 | **Si** | substation-intelligence | 🟢 settled | replaces ventus-corev8engine.js |

## data-layer (11)

| # | symbol | name | state | note |
|---|---|---|---|---|
| 36 | **A** | airports | 🟢 settled | atlas layer airports.geojson |
| 37 | **D** | datacentres | 🟢 settled | atlas layer datacentres.geojson |
| 38 | **G1** | grid_132kv | 🟢 settled | atlas layer grid_132kv.geojson |
| 39 | **G2** | grid_220kv | 🟢 settled | atlas layer grid_220kv.geojson |
| 40 | **Gr** | grid_275kv | 🟢 settled | atlas layer grid_275kv.geojson |
| 41 | **G4** | grid_400kv | 🟢 settled | atlas layer grid_400kv.geojson |
| 42 | **G6** | grid_66kv | 🟢 settled | atlas layer grid_66kv.geojson |
| 43 | **Gri** | grid_substations | 🟢 settled | atlas layer grid_substations.geojson |
| 44 | **Io** | industrial_offtakers | 🟢 settled | atlas layer industrial_offtakers.geojson |
| 45 | **Pp** | power_plants | 🟢 settled | atlas layer power_plants.geojson |
| 46 | **R** | railways | 🟢 settled | atlas layer railways.geojson |

## contract (1)

| # | symbol | name | state | note |
|---|---|---|---|---|
| 47 | **Dt** | deeplink (the MAP button) | 🟢 settled | identity = repd_ref; technology is a BUCKET, not a layer id |
