# Night log

## Watch 1 · 2026-09-13 23:11 local · Claude

- Stars: 341 (GREEN 213 · AMBER 0 · RED 128) of ~4,300 seeds on generation 202609080850
- Rate: ~50 stars/min at concurrency 12 (was ~15/min at 4). Pass ETA ~80 min.
- Headroom: GPU 15 %, 1917 MiB, 49 · CPU 4 % · RAM free 14.3 GB · sandbox 0.17 GB of 100 GB ceiling, overflow D: not in use
- Restarts: Bench + star-maker restarted 22:07 for concurrency 12 + storage law (idempotent, nothing lost)
- Reds so far, by cause:
  - 106 × Error: sld-sandbox requires the sld-styles module
  - 14 × SyntaxError: Invalid or unexpected token
  - 8 × Error: grid-scope requires the geodesy module
- Hidden wires (unplug seeds that went red): without substation-intelligence; without streaming-parquet-bridge + uk-gazetteer-flyto + substation-intelligence; without uk-gazetteer-flyto + substation-intelligence; without streaming-parquet-bridge + substation-intelligence

ANNOYING AGENT · 2026-09-13T22:09:00Z · 3 minutes
IN SCOPE   : star generation running; verdicts and findings per star; hidden wires in SKY.md; pushes idempotent; three processes alive
OUT OF SCOPE: nothing found
DRIFT      : sky/NIGHT-LOG.md not created although RUNBOOK §7 requires it — evidence made, not recorded
ASK HIM    : start the night log now? (Claude: started it in this watch; no decision needed)

