# star-maker — runbook

Every composition of GridAtlas is a seed. Every drive of a seed on the MSI's GPU is a star.
This repository is the sky. Started 2026-09-13 22:xx by Claude; sustained by Codex and the
architect. Read `SKY.md` for the current state of the sky.

## What runs where (all on the MSI, all in `C:\Users\vikra\Desktop\Claude-Sandbox-MSI\bench`)

| process | command | job |
|---|---|---|
| Bench | `node server.mjs` | http://127.0.0.1:8790 — serves GridAtlas read-only from the gridatlas repo; `/u/<id>/atlas/` is a parallel universe with its own composition; `POST /api/testdrive {choice}` drives one on the GPU |
| star-maker | `node starmaker.mjs` | enumerates seeds, drives the ones not yet in the sky (3 at a time — GPU headroom), writes `stars/`, `shots/` (non-green only), `sky/` surveys hourly, pushes here |
| pad watcher | `node controlpad.mjs` | reads `Ventusltd/control-pad` inbox every 20 s; `order: drive` → Bench; results to its outbox |

Logs: `bench\state\server.out.log`, `bench\state\starmaker.log`, `bench\state\controlpad.log`.

## Seeds

- `live` — the composition as published in `gridatlas/atlas/current.json`
- `unplug` — every non-empty subset of the four cartridges switched off (15); the shell's original script returns in each slot
- `version` — each cartridge swapped to each file on its shelf in `atlas/cartridges/` (~131)

Star id = sha1(source generation + choice)[:12]. Same seed → same star. A pass is idempotent: a
star already in `stars/` is not driven again. A new gridatlas generation (new `current.json`)
starts a new pass automatically.

## Reading a star

`stars/<id>.json`: `seed` (generation, kind, label, choice), `verdict` GREEN/AMBER/RED, `health`
per part (each cartridge, shell, loader, vendor), `findings` attributed to the part whose blob
URL raised them, `layers` OK/WAIT/FAIL counts, `bench_run`. RED with `kind: unplug` = a **hidden
wire**: the part named in the finding depends on the unplugged part without declaring it.

## Sustaining the run (Codex, tomorrow)

1. Check the three processes are alive: `Get-Process node`. If not, start them from the bench
   folder in that order (Bench first). Nothing else needs starting.
2. Check `bench\state\starmaker.log` for `pass done` and `pushed`. If it is looping on errors,
   read the error, fix in the sandbox, restart only that process.
3. GPU headroom: `nvidia-smi` — star-maker uses one Chrome with 3 pages; VRAM should stay well
   under 8 GB. Raise `STAR_CONCURRENCY` (env) only if VRAM < 50 % and CPU < 60 %.
4. Do not push anything to `control-pad` that is not ready. This repo is for generated stars only.
5. Do not touch the gridatlas repo from here. star-maker only reads it (`git pull --ff-only`).

## Laws

- Stars are evidence, never edited by hand. A wrong star is superseded by a new generation, not rewritten.
- Screenshots are kept only for non-green stars, JPEG q60, to keep the sky small.
- The live site is never touched by anything in this repository.
