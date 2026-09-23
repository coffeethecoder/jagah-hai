# The Train Isn't Full

Simulation engine + web app + experiments quantifying berth fragmentation in railway reservations.
The full specification is in @docs/SPEC.md. Read the relevant sections before every task.

## Non-negotiable rules

- `src/engine/` is pure TypeScript: no React, no DOM, no `Date.now()`, no `Math.random()`.
  All randomness goes through `src/engine/rng.ts` with an explicit seed.
- Implement every algorithm from scratch. Do not add graph, colouring or optimisation libraries.
- Bookings are half-open intervals `[from, to)` over station indices; a booking occupies segments `from … to-1`.
  Touching bookings (one ends where the other starts) do NOT overlap.
- Do not change any definition in SPEC.md Section 3 without asking me first.
- Never weaken or delete a failing test to make it pass. If the brute-force cross-check fails, stop and show me the smallest failing case.
- Never assert per instance that Tier 2 seats at least as many as Tier 1 (SPEC 4.1).
- Call the measured ratio "empirical performance ratio", never "competitive ratio".
- TypeScript `strict`, no `any`.
- Phase 9 backend (`server/`) is optional and built last. It imports the engine via `@engine/*` and never
  re-implements an algorithm. The frontend must work fully when the server is down (SPEC 20.7).
- Never guess dataset column names; inspect the file and record the mapping in `docs/DECISIONS.md`.

## Workflow

- Work one phase at a time (SPEC Section 16). Stop at the end of each phase and summarise what was built and tested.
- After any change in `src/engine/`, run `npm test` and fix failures before continuing.
- Record any deviation from the spec, with the date and reason, in `docs/DECISIONS.md`.
- Never commit, push or run `git init`. I handle all git myself.

## Commands

- `npm run dev` — start the app
- `npm test` — unit + property tests
- `npm run coverage` — coverage report (target ≥ 90% for src/engine)
- `npm run experiment -- --config experiments/configs/smoke.json`
- `npm run aggregate -- --run experiments/results/<name>`

Phase 9 only:
- `npm run ingest` — build `server/data/railways.sqlite` from `server/data/raw/`
- `npm run server:dev` — start the API locally
- `npm run verify-train -- <number> --note "<how it was checked>"`
