# star-maker — the sky

**Every composition of our software is a seed. Every seed driven on the GPU is a star. This
repository is the sky.**

Ventus builds an open grid platform out of parts — cartridges, engines, data, sandboxes,
teleprints. A *composition* is one way of bolting those parts together. Star-maker takes every
composition it can enumerate, drives it for real in Chrome on the MSI's RTX 5070 Ti, watches what
happens (errors per part, layers loaded, what rendered), and writes the result here as a star.
Green stars are compositions that work. Red stars are supernovae: the exact composition that
breaks, and the part that broke it. Nothing here is typed by hand.

The seed idea is borrowed from No Man's Sky: a world is not stored, it is regenerated from its
seed, and the same seed always gives the same world. Here the seed is
`sha1(source generation + choice)`, so the same composition always has the same star id, a pass
is idempotent, and anyone can regenerate any star by driving its seed again.

## Layout

| path | what |
|---|---|
| `SKY.md` | the index: counts by verdict, red stars, amber stars, hidden wires found. Regenerated on every push. |
| `stars/<id>.json` | one star: seed, verdict, per-part health, findings attributed to the part that raised them, layers OK/WAIT, bench run id |
| `shots/<id>.jpg` | screenshot, kept only for non-green stars |
| `sky/survey-<stamp>.json` | hourly eyes survey of every published page (spiders, GridAtlas, homepage) |
| `RUNBOOK.md` | the processes, commands, laws |

## Seeds — the generators

Today's generator is GridAtlas (`gridatlas/atlas/current.json`, immutable shell + hashed
cartridges). Seeds of the first pass:

| kind | how many | what it asks |
|---|---|---|
| `live` | 1 | does the composition as published work? |
| `unplug` | 15 | every subset of the four cartridges switched off — what secretly needs what? |
| `version` | ~131 | each cartridge swapped to each file on its shelf — which old versions still fit today's shell? |
| `constellation` | ~4,150 | every pair of substation-intelligence × sld-sandbox versions — which combinations fight? |

Every generator we own can be a seed source. The ones to link next, in order: the other
apps with cartridge manifests (Pipeline News), the `seeds/` folders in the repos, the sandboxes
(gis-sld-sandbox, the SLD sandbox cartridge's own scenarios), and the teleprinters (a teleprint is
a full recording of a composition as a browser loaded it — the perfect seed to replay). Adding a
generator means: enumerate its compositions as `{enabled, selected}` choices (or its own choice
shape), give the Bench a way to serve them, and let star-maker drive them.

## Reading a star

```json
{
  "id": "1d09d7966984",
  "seed": { "source_generation": "202609080850", "kind": "unplug",
            "label": "without substation-intelligence", "choice": { "enabled": { "substation-intelligence": false }, "selected": {} } },
  "verdict": "RED",
  "health": { "sld-sandbox": { "colour": "red", "findings": 1 }, "shell": { "colour": "green", "findings": 0 } },
  "findings": [ { "level": "exception", "part": "sld-sandbox", "text": "Error: grid-scope requires the geodesy module" } ],
  "layers": { "ok": 12, "wait": 48, "fail": 0 }
}
```

That star says: unplug `substation-intelligence` and `sld-sandbox` dies, because it borrows a
geodesy module it never declared it needed. That is a **hidden wire**, and `SKY.md` lists every
one found. Each hidden wire becomes a declared NEEDS in the next composition manifest and a cvaa
vaccine, so it cannot come back quietly.

Verdicts: **GREEN** no exceptions, no console errors, no error banners · **AMBER** console
errors or a visible error banner, but the app composed · **RED** an exception, a failed
composition, or navigation failure.

## THE NIGHT WATCH MAN — a job for Codex

**Read `VIK-AI.md` first.** It is the architect in spirit — what he wants, what he hates, how he
decides — so that a decision made at 3 a.m. is one he would have made.

The machine makes stars on its own. The Night Watch Man keeps it making them, all night, and
reads the sky in the morning. Duties, in order, every hour:

1. **Are the lights on?** `Get-Process node` on the MSI must show three: `server.mjs` (the Bench),
   `starmaker.mjs`, `controlpad.mjs`. Start a dead one from
   `C:\Users\vikra\Desktop\Claude-Sandbox-MSI\bench` — Bench first. Never start a second copy.
2. **Is the sky growing?** `bench\state\starmaker.log` — look for `GREEN|AMBER|RED <id> <label>`
   lines with fresh timestamps, `pushed:` lines, and `pass done`. If the same error repeats,
   read it, fix it in the sandbox, restart only star-maker. A pass is idempotent: restarting
   loses nothing.
3. **Headroom.** `nvidia-smi` — VRAM under 8 GB, GPU under 70 %, CPU under 70 %, temperature
   sane. A drive is ~12 s of *waiting* (settle + network), so the GPU idles unless many
   universes run at once: the lever is breadth. Measured: 4 universes → GPU 9 %, VRAM 1.6 GB,
   CPU 2 %. Default is now 12. `STAR_CONCURRENCY` may go to 16 if VRAM < 8 GB and CPU < 70 %;
   never higher tonight. Storage law: the sandbox keeps ≤ 100 GB on C:; beyond that the Bench
   writes runs to `D:\Claude-Sandbox-MSI\bench-runs` (external SSD) automatically — check
   `http://127.0.0.1:8790/api/storage`.
4. **Did it push?** `git -C C:\Users\vikra\Documents\GitHub\star-maker log -1` should be recent;
   if the push failed the log says why (usually the remote moved: `git pull --rebase` then let
   the next push happen). `SKY.md` must match `stars/`.
5. **Read the sky.** Every few hours, open `SKY.md`. New red stars in `unplug` = hidden wires —
   note them in `sky/NIGHT-LOG.md` with the star id and the part named. New red stars in
   `version` = a shelf version that no longer fits the shell — note the earliest stamp that goes
   red; that is where the regression entered. `constellation` reds = two versions that fight.
6. **Pass finished?** When the log says `pass done`, star-maker idles and surveys hourly. Add the
   next generator (see Seeds) only if the architect has agreed it in `control-pad`; otherwise let
   it idle — an idle sky is a finished sky, not a failure.
7. **Write the night log.** `sky/NIGHT-LOG.md`: one block per hour — stars made, reds found,
   anything restarted, headroom numbers. Commit and push it with the stars.

What the Night Watch Man never does: touch the live website; push anything to `control-pad`
that is not a finished result; edit a star by hand; change the gridatlas repo; raise concurrency
past 6; start anything on the architect's second PC.

## Laws

- Stars are evidence, never edited. A wrong star is superseded by a new generation, not rewritten.
- Same seed, same star. If two runs of one seed disagree, that is a finding, not a tie — record both.
- Screenshots only for non-green stars, JPEG q60. The sky stays small enough to clone anywhere.
- The live site is never touched by anything in this repository.

## Where the machinery lives

Everything runs from `C:\Users\vikra\Desktop\Claude-Sandbox-MSI\bench` on the MSI — see
`RUNBOOK.md`. The Bench (`server.mjs`) serves GridAtlas read-only from the gridatlas repo and
overlays a composition per universe at `/u/<id>/atlas/`; `POST /api/testdrive {choice}` drives one
on the GPU and returns the star's raw material. Star-maker is a loop over seeds calling that.
