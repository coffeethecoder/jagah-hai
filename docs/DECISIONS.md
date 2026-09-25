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

## 2026-09-24 — Phase 2 choices
- **`certify.ts` and `metrics.ts` implemented in Phase 2, not Phase 3.** Phase 2's property tests need `metrics.seated` and `metrics.strategyInduced`, and the `Outcome` type requires a certificate on every rejection. Phase 3 still adds their dedicated unit tests and property test 6.
- **`computeMetrics` takes `requests`:** `computeMetrics(result, requests, coach, n)` instead of SPEC 12.2's `(result, coach, n)`. Tier 3 has no event log and an `Assignment` holds only ids, so without the requests neither `requested` nor passenger-segments can be computed.
- **Tier 2 rejections also carry a certificate.** They are always `forced` (a Tier 2 rejection means some segment is at capacity); the Tier 2 invariant is tested, not assumed.
- **Tier 2 events** record `pending` at request time; the final `assignment` is the EST chart.
- **`runOnline` / `runOfflineOptimum` throw if `racBerths > 0`** until RAC is built in Phase 7.
- **Random-fit draws no random number when no berth is free**, so the RNG stream advances only on placements.
- **`OccupancyGrid.occupant(index, j)`** added so best-fit can compute `prevEnd` / `nextStart` from the grid.
- **SPEC 4.1 example recorded as a test** (`deferred.test.ts`): k = 2, n = 4, stream `[3,4) [1,2) [1,3) [2,4) [2,3) [3,4)`. First-fit seats 5, Deferred seats 4. Found by random search. An exhaustive search found no First-fit example with ≤ 5 requests for n ≤ 4, k ≤ 3.

## 2026-09-25 — Phase 3 choices
- **`firstFitBerthsNeeded` reuses `firstFit` on an `OccupancyGrid` with one row per request.** That many rows can never run out, and First-fit opens row i only when rows 0 … i-1 are busy, so the highest row used + 1 is FF(B).
- **Forced certificates name the first full segment** on the booking's range (lowest index), via `argmaxOnRange`.
- **Coverage threshold on:** `vitest.config.ts` fails `npm run coverage` below 90% line coverage of `src/engine`.
- **Extra test file** not in SPEC 11: `metrics.test.ts`.
