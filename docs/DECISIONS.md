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

## 2026-09-25 — Phase 4 choices
- **Tatkal share is by volume, not by count.** SPEC 8.2 calls `fraction` a share of "total requests", but the total is only known once the volume target is met, and tatkal uses a different length profile. So base requests are drawn until their passenger-segments reach (1 − f)·ρ·k·n, and tatkal requests until theirs reach f·ρ·k·n. Total volume stays ≈ ρ·k·n with tatkal on or off, so ρ means the same thing in both arms.
- **Demand uses its own RNG sub-stream:** `createRng(deriveSeed(seed, 1))`. Experiments pass the same seed to demand and to random-fit; without this, random-fit's berth picks would replay the exact draws that chose the first requests' origins. `deriveSeed` (murmur3 finaliser) is in `rng.ts`.
- **RNG draw order per request:** origin, then (for `mixed`) the short/long coin, then trip length. Base requests are generated, then shuffled, then the tatkal block is generated.
- **Demand output is pinned** in `demand.test.ts` (demo-line, k = 72, mixed, ρ = 1, seed 1, first 5 requests).
- **EPR is blank** in `runs.csv` when the optimum seats nobody (only possible with no requests).
- **`summary.csv` extras:** `ffOverOmega` (for figure F5). Paired differences are named `seatedMinusDeferred` and `seatedMinusOptimum` (strategy minus reference, same seed), so fragLoss = −seatedMinusDeferred for Tier 1 rows and fcfsLoss = −seatedMinusOptimum for the Deferred row. sd and CI are blank when N < 2.
- **`meta.json` also records `gitDirty`** (uncommitted changes when the run started) and the run count.
- **Extra test file** not in SPEC 11: `tests/experiments/experiments.test.ts`. `run.ts` and `aggregate.ts` export their logic and only run the CLI when invoked directly.
- **`main.json` cannot run until Phase 7:** it includes `racBerths: 9`, and the engine rejects r > 0 until RAC is built.

## 2026-09-25 — Phase 5 choices (UI core)
- **Strategy select lists the four online strategies only.** The offline optimum has no event log to play; it appears in TierComparison (Phase 6).
- **Controls left for later phases:** RAC berths `r` (Phase 7; the engine rejects r > 0 until then) and the Compare toggle (Phase 6).
- **Berths control is a select (72 sleeper, 16 mini)**, not a free number.
- **Deferred during playback:** acceptances count as Seated (charting always succeeds, Theorem 1). The grid stays empty with a pending count until the last request, then shows the EST chart. The hatched pending pool and the charting animation are ChartingView (Phase 6).
- **Performance ratio during playback** = seated so far ÷ offline optimum on the requests so far (Tier 3 on the prefix). At the end it equals EPR.
- **Same seed for demand and strategy**, as in `experiments/run.ts`, so the UI's final counters equal the matching `runs.csv` row.
- **Ghost bar** shows the request decided at the current step, labelled with its outcome (Seated / Pending / Full here / Assignment), since playback moves in whole steps.
- **Column width follows the container** (40–120 px per segment); the chart scrolls sideways inside its own box, never the page. SVG only; the canvas fallback above 5000 cells waits for long real routes.
- **One shared CSS module** (`src/ui/styles/ui.module.css`) instead of one per component.

## 2026-09-25 — Phase 6 choices (proofs, charting, comparison)
- **Proof panel highlights the live chart, without rewinding playback.** Tier 1 never moves or removes a passenger, so a forced certificate's occupants are still on the chart at every later step: the full segment is tinted red, its occupants outlined, everyone else faded.
- **Strategy-induced proof** shows per-segment load at the moment of rejection (from the event's load profile) and, on request, the EST witness in a second grid with the rejected passenger in amber. The copy says the witness moves earlier passengers, which Tier 1 cannot do.
- **Charting starts only when the user presses "Prepare chart"**, and only after the last request (booking has closed). Bookings are placed in EST order (earliest boarding first); each bar grows in from its boarding station. Duration is fixed at about 2 s by the clock, not by frame count, so heavy frames or a background tab do not slow it. With `prefers-reduced-motion`, all bookings are placed at once and the CSS animation is off.
- **Pending pool lanes are display only:** arrival order, first lane where the booking fits. They carry no berth meaning, and the pool sits below the grid so compare-mode grids line up row for row.
- **Compare mode** shows the selected strategy and one other (default Deferred; First-fit when Deferred is selected) at the same playback step, each with its own load profile. The proof panel and metrics strip follow the selected strategy.
- **TierComparison covers the whole stream**, whatever the playback position. "Lost to fragmentation" = Deferred minus that Tier 1 strategy (can be negative on one stream; the panel says so when it is). "Lost to first-come-first-served" = Optimum minus Deferred.
- **Prefix optimum for the performance ratio is memoised on the step alone**, so charting frames do not recompute it.
