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

## 2026-09-25 — Phase 7 choices (RAC)
- **Tier 3 confirmed/RAC split changed (user decision).** SPEC 5.1 said: choose the set with Algorithm 4.5 at capacity k + 2r, then run 4.5 again at capacity k to pick confirmed passengers, the rest RAC. That rest can exceed 2r on a segment: 4,929 of 400,000 random instances. Smallest case: k = 1, r = 1, n = 4, requests `[3,4) [2,4) [1,4) [0,2) [1,3)` (all five fit 3 places; 4.5 at k = 1 confirms [0,2) and [3,4), leaving three passengers on segment 2 for 2 slots). A brute-force search also found instances where *no* valid split reaches the confirmed count 4.5 aims for (3 in 60,000). Chosen fix: seat the chosen set with EST on k + 2r places; places 0 … k−1 are confirmed berths, the rest RAC slots. Always valid; total seated (the primary metric) is unchanged; the confirmed count is sometimes lower than the best valid split (about 9% of instances, by about 1). SPEC 5.1 amended. `rac.test.ts` pins the counterexample.
- **Forced certificate with RAC names the confirmed pool.** SPEC 6: forced iff the confirmed pool is full on the range and (r > 0) the RAC pool is too. The `Certificate` type holds one pool, so it names the confirmed pool's full segment and occupants; the RAC pool's fullness is checked by the property test and shown by the UI from the event's `racLoad`.
- **Strategy-induced with RAC:** the witness is in the first pool that had room on every segment: confirmed if it did, otherwise RAC (confirmed is always tried first, SPEC 5.1).
- **r = 0 reproduces the pre-RAC engine byte for byte.** `rac.test.ts` pins a SHA-256 of 300 generated instances × 5 strategies computed before RAC was added; the Phase 4 smoke `runs.csv` also hashes identically.
- **Test changed:** `simulate.test.ts` had asserted that r > 0 throws ("RAC arrives in Phase 7"). Phase 7 removes that limitation, so the assertion now checks that a negative or fractional r throws.
- **UI:** RAC berths sit below the confirmed berths as 22 px rows split by a dashed divider into two half-height slots (labels RAC 1 … RAC r, slots a/b). A second load profile shows RAC load against 2r. Metrics strip, ticker, proof panel and tier table name RAC where it applies.

## 2026-09-26 — Phase 7: real routes
- **Two real trains added:** 12137 Punjab Mail (CSMT → FZR, 54 stops) and 22503 Vivek Express (CAPE → DBRG, 60 stops). Primary source indianrail.gov.in; stop order verified the same day against NTES by comparing station codes in order (identical for both). Raw copies of both sources are kept in `data/routes/raw/`.
- **Row types:** "Via Station" (passes without stopping) and "Deleted" (halt withdrawn) are not stops. "Diverted" rows are kept as the regular route: on 2026-09-26 Punjab Mail stops BHS … RKM were marked diverted on indianrail but listed as normal stops on NTES.
- **km** is taken from indianrail; NTES is up to 10 km (Punjab Mail) and 33 km (Vivek Express) lower. The engine never uses km, so results do not depend on it.
- **Station names** are the source's names in mechanical title case; abbreviations are not expanded.
- **Weights (modelling assumption):** 3 for terminals, large cities and main junctions (lists in `data/routes/README.md`), 1 otherwise. Proposed by Claude; accepted by the user on 2026-09-26.
- **`main.json`** now runs demo-line and both real routes.
- A test checks every file in `data/routes/` passes `parseRoute` and is named after its id. Both real routes stay under 5000 grid cells at 72 berths (3816 and 4248), so the SVG grid needs no canvas fallback.
- **Third train: 26101 Vande Bharat (PUNE → AJNI, 12 stops).** Verified the same way (indianrail + NTES, same 12 stations in order; ANK Ankai is a pass-through). The first NTES paste was the return train 26102, which does not verify 26101; the matching NTES copy of 26101 was then used. Chair car only (EC, CC), so the real train has no berths and no RAC. Included in `main.json` with the same 72-berth coach and RAC settings as the other routes (user decision, 2026-09-26): it models the route structure, not the train's real chair-car coach; the paper states this.

## 2026-09-26 — Phase 8 choices (results and proofs)
- **Main run:** 192,000 runs (4 routes × 2 RAC × 4 scenarios × 2 tatkal × 6 ρ × 100 seeds × 5 strategies) in 101 s. This run's `meta.json` has `gitDirty: true` (Phase 7 uncommitted); the run for the paper must be repeated on a clean commit so `meta.json` names it.
- **Figure slice:** unless a figure says otherwise, 72 berths, no RAC, no tatkal. F3 (EPR boxes) uses ρ = 1.4, where strategies differ most. F4 decomposes the loss for First-fit. F6 uses mixed trips. The tatkal arm is in `summary.csv` and T1_all_scenarios.csv but not plotted.
- **Colours:** strategies use slots 1–4 of the dataviz reference palette (validated: all hard checks pass; aqua and yellow warn on contrast, so each strategy also has its own marker and T1 gives the numbers). The optimum is a neutral dashed reference line. F4's two losses use violet and a neutral; F5 tells scenarios apart by marker and dash in one ink, so no hue competes with the strategy colours. The app's signal colours (green, amber, red) are not reused in figures.
- **T1** is written as CSV (all scenarios), Markdown and LaTeX (mixed), by hand rather than with `pandas.to_markdown` / `to_latex`, which would add `tabulate` / `jinja2` as dependencies.
- **MATH.md:** proofs of Lemma 1, Theorem 1, EST correctness (with Proposition 2.1: First-fit on start-sorted input uses exactly ω), optimality of Algorithm 4.5, Lemma 2 and Corollary 2.1 (RAC, with the amended EST split), and the Tier 2 / certificate / upper-bound consequences. The optimality proof uses the invariant "some optimal set avoids every evicted booking"; the simpler "agrees with the kept set" invariant is false (counterexample in the remark).
- **Findings to report (from this run):** on the long real routes First-fit turns away 10–15% of requests as strategy-induced at ρ ≥ 1, yet Deferred seats only about 1–3 more passengers than First-fit, while the optimum seats 7–32 more than Deferred. The strategy-induced rate overstates the capacity lost to fragmentation (freed capacity is mostly reused by later passengers); first-come-first-served costs far more. Random-fit often has the highest EPR while using the least berth capacity, because EPR counts heads and random-fit turns away long journeys: report utilization beside seated.

## 2026-10-05 — UI layout rearranged (user request: "the UI can be made a lot better")
Deviation from the layout diagram in SPEC 13.3. Problems seen in use: the waitlist and proof panels sat below a chart about 1,000 px tall, so a proof and the chart it refers to were never visible together; Play was at the bottom of the sidebar; the counters scrolled away; the start screen was a blank grid with no legend.
- **Three columns on wide windows (≥ 1400 px):** setup | chart | waitlist, proof, tier comparison and unbounded panel. The left and right columns stay in view while the chart scrolls. Below 1400 px, and in compare mode (two charts need the width), the right column moves under the chart as before. Below 1024 px everything stacks and nothing is pinned.
- **Counters, playback and the current request are pinned** to the top of the chart column while it scrolls.
- **Playback is a toolbar above the chart** (Play, Step, Jump to end, Reset, a progress bar, speed) instead of a sidebar section. The key hint moved to the bottom of Setup; buttons carry their key as a tooltip.
- **The chart sits on a sheet** with a heading, a one-line explanation of rows, columns and bars, and a legend (seated, seated at this step, pending, RAC, full segment in a proof). An empty grid shows a help line ("Press Play to watch booking requests arrive", or the pending count for Deferred).
- **Header** gained the project name and its one-line question.
- **Tier table** headers shortened to fit the narrower column: "Ratio" and "Lost seats", both explained in the note under the table.
- Unchanged: tokens (SPEC 13.2), colours and their meanings, every component's behaviour, and the engine.

## 2026-10-05 — Full UI redesign (user request)
The user asked for the interface to be rebuilt to the standard of a commercial product: "a hero with an appropriate background, different pages for different functions". This supersedes the visual direction, tokens and layout in SPEC 13.1–13.3 (component behaviour in 13.4 and the copy rules in 13.5 still hold). The engine is unchanged.
- **Four pages, hash-routed, still a static site** (`src/ui/lib/router.tsx`, no router library): Overview (`#/`), Simulator (`#/simulator`), Findings (`#/findings`), Method (`#/method`). `App.tsx` is now the shell; the simulator moved to `src/ui/pages/Simulator.tsx`.
- **Design system** (`tokens.css`): Instrument Serif for display type, Inter for the interface; navy, a brand blue for actions, white cards on a cool grey page. Green, amber and red keep their meanings (seated, waitlisted by assignment, waitlisted because full) and are not used as decoration. Strategies keep the validated chart colours used in the paper figures.
- **Hero background is real output:** `HeroChart.tsx` runs the engine (Punjab Mail, random-fit, fixed seed) and draws that chart, with three stranded passengers in amber. Headline numbers on Overview and Findings are read from data, not typed in.
- **`src/ui/data/findings.json`** carries the published numbers into the app, because `experiments/results/` is gitignored. It is written by `npm run export-findings -- --run experiments/results/main` (`experiments/exportFindings.ts`) and must be re-exported whenever the main experiment is re-run.
- **Findings charts** are hand-drawn SVG (`Charts.tsx`): line and stacked-bar charts with a hover readout, a legend, and a "Show the numbers" table under each.
- **Simulator:** setup is a card with grouped sections, a segmented coach toggle and one card per strategy (showing its tier); counters are stat tiles; playback and the current request share one bar; waitlist, proof and comparison are cards in the right column.
- **Chart fixes found on long routes:** the berth-label column now stays in place while the chart scrolls sideways (each chart is a sticky label SVG plus a plot SVG, `ChartFrame`), and the terminus code is drawn after the last column so it no longer overlaps the code before it.
- Amber chips and callouts now use dark text on a lighter amber; white on the old amber was below 3:1 contrast.

## 2026-10-05 — Redesign, second pass (user feedback on the first)
Feedback: headings looked cramped; the three "how it works" cards looked lonely; the colours were ordinary; too many text-filled rectangles. Changes:
- **Display type: Newsreader** (roomy, Times-like proportions, optical sizes) replaces Instrument Serif, which is a condensed face and was the cause of the cramped look. Inter stays for the interface.
- **Palette: deep aubergine, warm ivory, violet for actions,** cream for the primary button on dark surfaces. Chosen because violet does not sit near green, amber or red, which keep their meanings. `--navy` became `--night`; `--coach-blue` (chart structure) is now a plum slate but keeps its name for the chart components.
- **Show, don't tell.** Explanatory paragraphs in cards were cut to a heading and a few words, and the rectangle was replaced where a picture says it better:
  - Overview, "How the study works": a **route line** with four numbered stations and a dashed track (it runs down the page on phones).
  - Method, the four syllabus concepts: a **drawn glyph** each (overlapping bars, a chain, bookings mapped to berth numbers, a small graph); a swipeable row on phones.
  - Method, the three tiers: a **flow** whose connectors carry the seats gained at each step, read from the experiment data, with a bar showing their relative size.
  - Method, RAC and verification: a strip of **facts led by a number**.
  - Method, limits: **sticky notes**, one caveat each.
- Copy across Overview and Method was shortened; no finding or caveat was dropped, only its wording.
