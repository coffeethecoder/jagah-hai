# Decisions

Dated log of design decisions and deviations from `docs/SPEC.md`.

## 2026-09-23 — Commits are done by the user
Section 16 said to commit after each phase. Changed so that the user makes every commit and Claude Code never commits or runs git. Reason: the user wants control of the git history. Rule added to `CLAUDE.md`.

## 2026-09-23 — Phase 1 choices not fixed by the spec
- **APIs for modules Section 12 leaves open.** `route.ts`: `parseRoute(raw)`, `segmentCount(route)`. `coach.ts`: `OccupancyGrid(capacity, n)` with `isFree`, `place`; `berthLabel(index)`. Strategy files export one function each (`firstFit`, `bestFit`, `randomFit`, `canAccept`/`chart`, `selectOptimum`).
- **Route validation** also rejects duplicate station codes and decreasing `km`. These match the ingest rules in SPEC 20.3.2. Missing `weight` is left undefined; demand generation treats it as 1.
- **Seeds must be integers** (`createRng` throws otherwise), so two different seeds can never silently map to the same stream.
- **mulberry32 output is pinned** in `rng.test.ts` (seed 1, first 3 values, checked against the reference implementation). Changing the RNG would change every published run.
- **Property test 7** covers `rng` and `estRepack` now. The `RunResult` part is added in Phase 2 when `simulate.ts` exists.
- **Extra test files** not in SPEC 11: `route.test.ts`, `coach.test.ts` (coverage), `purity.test.ts` (enforces the engine-purity and no-`any` rules).
- **Coverage threshold** (≥ 90% of `src/engine`) is not enforced in `vitest.config.ts` until the stubbed modules are implemented; it is added at the end of Phase 3.
