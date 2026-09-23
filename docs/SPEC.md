# The Train Isn't Full — Project Specification

Quantifying berth fragmentation in railway reservations using order theory and graph colouring.

This document is the single source of truth for the project. It is written to be read by Claude Code (via `CLAUDE.md`) and by you. Every definition, algorithm, file, test, experiment and build phase is specified here.

---

## 0. How to use this document with Claude Code

1. Create an empty folder `train-isnt-full/`, put `CLAUDE.md` in its root and this file at `docs/SPEC.md`.
2. `CLAUDE.md` imports this spec with `@docs/SPEC.md`, so Claude Code loads it at the start of every session.
3. Build **one phase at a time** (Section 16). Each phase has a ready-to-paste prompt and acceptance criteria.
4. Do not start a phase until the previous phase's tests pass.
5. If Claude Code proposes changing a definition in Section 3, stop and check it against this document first. The maths is the part examiners and reviewers will test.

---

## 1. Project summary

**Problem.** Indian Railways passengers are often waitlisted while berths sit empty on parts of the route: one berth is free Mumbai→Surat, another Surat→Delhi, but no single berth is free end to end. The train isn't full; it's fragmented. The cost of this fragmentation depends on how berths are allocated, and it is neither visible nor quantified.

**Goal.** Given a train with fixed berths and a stream of booking requests over route segments:
1. decide whether each rejection is **forced** (the train is genuinely full on some segment) or **strategy-induced** (caused by how berths were assigned);
2. measure how much capacity each allocation strategy loses relative to the theoretical optimum.

**Research question.** On real Indian Railways routes, how much capacity do allocation policies lose to fragmentation relative to the Dilworth bound, and how much does deferring berth assignment until charting recover?

**Deliverables.**
1. A pure-TypeScript simulation engine with every algorithm implemented from scratch.
2. An interactive web app: coach grid, strategy comparison, proof panel, charting animation.
3. An experiments pipeline producing the data and figures for a research paper.

**Syllabus coverage.**

| Module | Concept | Where it appears |
|---|---|---|
| 3 Relations | "overlaps with" relation on bookings | `interval.ts`, interval graph |
| 4 Posets | interval order, chains, antichains, Dilworth's theorem | `load.ts`, `estRepack.ts`, proofs |
| 5 Functions, pigeonhole | berth assignment as a function; pigeonhole certificates | `certify.ts` |
| 6 Graphs | interval graphs, colouring, cliques | all strategies |

---

## 2. Scope and assumptions

In scope:
- One coach at a time (default: 72-berth sleeper coach; a 16-berth "mini" coach for demos).
- Berths are interchangeable (no lower-berth preference). Berth types are shown in the UI only.
- RAC modelled as shared side-lower berths (Section 5).
- First-come-first-served acceptance for online strategies.
- Synthetic demand over real route structures.

Out of scope (state these as limitations in the paper):
- Real booking data (not public).
- IRCTC's actual allocation algorithm (unpublished). We compare *policies*, not Indian Railways' real system.
- Quotas other than RAC (tatkal is modelled only as a late demand surge, not a reserved quota).
- Fares, berth preferences, gender/senior-citizen rules.

Stretch goals (only after all core phases pass): cancellations and RAC promotion; passenger-km weighted optimum; the Kierstead–Trotter online algorithm in unbounded mode.

Optional last phase: **Phase 9 — a backend route data service** (Section 20). It is built only after Phases 0–8 are complete, and the app must keep working without it.

---

## 3. Mathematical model

All definitions here are normative. Code, tests and the paper must match them exactly.

### 3.1 Route and segments

- A route has stations `s_0, s_1, …, s_n` (so `n + 1` stations).
- There are `n` **segments**; segment `j` (for `0 ≤ j < n`) runs from `s_j` to `s_{j+1}`.

### 3.2 Bookings as half-open intervals

- A booking `b` has integers `from < to`, with `0 ≤ from < to ≤ n`.
- It occupies the **half-open interval** `[from, to)`, i.e. segments `from, from+1, …, to−1`.
- Length `len(b) = to − from` (number of segments).
- A passenger alighting at station `j` and another boarding at station `j` **do not overlap**. This is why intervals are half-open.

### 3.3 Overlap relation (Module 3)

`b₁` overlaps `b₂` iff `b₁.from < b₂.to  AND  b₂.from < b₁.to`.

The overlap relation is reflexive and symmetric but not transitive. Its graph (vertices = bookings, edges = overlaps) is the **interval graph** `G`.

### 3.4 Berth assignment = graph colouring (Module 6)

A berth assignment for capacity `k` is a function `f : B → {0, …, k−1}` such that overlapping bookings get different berths. This is exactly a proper `k`-colouring of `G`.

### 3.5 Segment load and peak load

- `load(j) = |{ b ∈ B : b.from ≤ j < b.to }|` — passengers on segment `j`.
- `L(B) = max_j load(j)` — the **peak load**, the load on the busiest segment.

### 3.6 Interval order, chains, antichains (Module 4)

Define the strict partial order `b₁ ≺ b₂` iff `b₁.to ≤ b₂.from` ("`b₁` gets off before `b₂` boards"). It is irreflexive (since `from < to`) and transitive.

- A **chain** is a set of pairwise comparable bookings = pairwise non-overlapping bookings. The passengers of one berth form a chain.
- An **antichain** is a set of pairwise incomparable bookings = pairwise overlapping bookings.

**Lemma 1 (Helly property on a line).** A set of pairwise overlapping bookings shares a common segment.
*Proof.* Let `m = max(from)` over the set and `M = min(to)`. For any two bookings `x, y` in the set, `x.from < y.to`; taking the maximiser of `from` and the minimiser of `to` gives `m < M`, so segment `m` lies in every booking. ∎

**Corollary.** The largest antichain has size exactly `L(B)`: any antichain shares a segment so has size `≤ L(B)`, and the bookings on the busiest segment form an antichain of size `L(B)`.

### 3.7 The feasibility theorem (Dilworth)

**Theorem 1.** A set of bookings `B` can be assigned to `k` berths **iff** `L(B) ≤ k`.

*Proof.* (⇒) Pigeonhole: if some segment carries more than `k` passengers, two of them share a berth while overlapping, which is impossible. (⇐) By Dilworth's theorem, the minimum number of chains covering a poset equals the size of its largest antichain, which is `L(B)` by the Corollary. Each chain can occupy one berth. Constructively, Algorithm EST (Section 4.2) achieves this. ∎

**Consequence (the proof panel).** Every rejection is exactly one of:
- **Forced:** accepting it would push some segment above capacity. No strategy could seat it.
- **Strategy-induced:** every segment on its route still has room (`max load < k`), so a valid seating including it exists (Theorem 1), but the strategy's earlier berth choices prevented it.

---

## 4. Algorithms

All algorithms are implemented from scratch. **No graph, colouring or optimisation libraries.**

### 4.1 The three tiers

| Tier | Name | Acceptance | Berth assignment | Knows future? |
|---|---|---|---|---|
| 1 | Online, immediate assignment | at request time | at request time, permanent | no |
| 2 | Online acceptance, deferred assignment | at request time (capacity check) | at charting, all at once | no |
| 3 | Offline optimum | all requests known in advance | after selection | yes (clairvoyant) |

Interpretation:
- **Tier 2 − Tier 1** (in expectation) = capacity lost to **fragmentation** (assigning berth numbers too early).
- **Tier 3 − Tier 2** = capacity lost to **first-come-first-served** acceptance (not knowing future demand). Always `≥ 0`.

**Important:** on an individual instance, Tier 1 can seat *more* than Tier 2 (a Tier-1 fragmentation rejection early on can leave room for two later bookings that Tier 2 must reject). So `S₂ − S₁` is reported as a distribution over seeds, never asserted per instance. The clean per-instance fragmentation measure is the count of **strategy-induced rejections** in Tier 1.

### 4.2 Algorithm EST — earliest-start greedy repack (used by Tier 2 and by witnesses)

Input: bookings `B` with `L(B) ≤ k`. Output: valid assignment into berths `0…k−1`.

```
sort B by (from ascending, to ascending, id ascending)
lastEnd[0..k-1] = 0
for b in sorted B:
    choose the lowest-index berth i with lastEnd[i] <= b.from
    assign b -> i ; lastEnd[i] = b.to
```

**Correctness.** When `b` is processed, every already-assigned booking still occupying segment `b.from` also covers that segment, as does `b`, so at most `L(B) − 1 ≤ k − 1` berths are busy there. A berth whose last booking ended at or before `b.from` therefore exists. On each berth, bookings are placed in start order and never overlap, so `lastEnd` is that berth's true latest end. ∎

### 4.3 Tier 1 strategies (immediate, permanent assignment)

The coach keeps an occupancy grid `occ[berth][segment]`. A berth is **free for `b`** if `occ[berth][j]` is empty for every `j ∈ [b.from, b.to)`. If no berth is free, the request is rejected.

**First-fit (FF).** Assign the lowest-index free berth.

**Best-fit (BF).** Among free berths, minimise the wasted gap around the booking:
```
prevEnd(i)   = max { to of bookings on berth i with to   <= b.from }, or 0 if none
nextStart(i) = min { from of bookings on berth i with from >= b.to }, or n if none
gap(i)       = (b.from - prevEnd(i)) + (nextStart(i) - b.to)
choose free berth with minimum gap; ties -> lowest index
```

**Random-fit (RF).** Choose uniformly at random among free berths, using the seeded RNG. This is a baseline showing what "no strategy" costs.

### 4.4 Tier 2 strategy: deferred assignment

At request time: accept iff `load(j) < k` for every `j ∈ [b.from, b.to)` over the currently accepted set (i.e. accepting keeps `L ≤ k`). Accepted bookings are **pending** (no berth number).
At charting: assign all accepted bookings with Algorithm EST. By Theorem 1 this always succeeds.
**Invariant:** Tier 2 never produces a strategy-induced rejection.

### 4.5 Tier 3: offline optimum (maximum seatable passengers)

Find a maximum-size subset `B* ⊆ B` with `L(B*) ≤ k`. By Theorem 1 this is the maximum `k`-colourable subgraph of an interval graph, which is solvable greedily:

```
sort B by (from ascending, to ascending, id ascending)
kept = empty
for b in sorted B:
    add b to kept
    active = { x in kept : x.from <= b.from < x.to }   # passengers on segment b.from
    if |active| > k:
        remove from kept the x in active with the largest `to`
        (ties: largest id)
return kept, then assign berths with Algorithm EST
```

**Why checking only at `b.from` suffices:** load at a segment only rises when a booking starting there is added, and bookings are processed in start order; the booking with the latest start among those covering any segment was checked at its own start when all of them were active.

**Why it is optimal:** standard exchange argument — among bookings competing for the overloaded segment, the one ending last blocks the most future bookings. (Reference to verify during literature review: Carlisle & Lloyd 1995, "On the k-coloring of intervals"; Faigle & Nawijn 1995.) **Regardless of the reference, correctness is enforced by a brute-force cross-check in the test suite (Section 14).** If the cross-check ever fails, stop and report; do not "fix" the test.

Tier 3 ignores arrival order entirely.

### 4.6 Unbounded mode (berths needed)

A secondary experiment with unlimited berths:
- Run First-fit over the full request stream in arrival order with no capacity limit; record the number of berths it opens, `FF(B)`.
- Compute `ω(B) = L(B)`, the minimum possible (Theorem 1; interval graphs are perfect so the clique number equals the chromatic number).
- Report `FF(B) / ω(B)`.

Known theory to cite (verify exact current bounds during the literature review): First-fit on interval graphs uses at most a constant multiple of `ω`; the Kierstead–Trotter online algorithm uses at most `3ω − 2` and is optimal among online algorithms.

**Sanity property:** if requests arrive sorted by `from`, First-fit uses exactly `ω` berths. This is a test.

---

## 5. RAC model

RAC (Reservation Against Cancellation): two passengers share one side-lower berth.

### 5.1 Model

- Coach has `k` confirmed berths and `r` RAC berths.
- Each RAC berth provides **2 unit-capacity slots**, so the RAC pool has `2r` slots. Slot `2i` and `2i+1` belong to RAC berth `i`.
- A booking is placed in the confirmed pool if possible, otherwise in the RAC pool, otherwise rejected (waitlisted).
- No downgrades or cross-pool rearrangement: a confirmed passenger is never moved to RAC to make room.

Per tier:
- **Tier 1:** apply the strategy's rule (FF/BF/RF) to the confirmed pool; if no berth is free, apply the same rule to the RAC slots.
- **Tier 2:** accept as confirmed if confirmed load stays `≤ k` on the range; else as RAC if RAC load stays `≤ 2r`; else reject. At charting, run EST separately on each pool (`k` berths, `2r` slots).
- **Tier 3:** maximise total seated with combined capacity `k + 2r` (Algorithm 4.5 with capacity `k + 2r`); then, within the chosen set, run Algorithm 4.5 again with capacity `k` to pick the confirmed passengers; the rest are RAC. Report the total as the primary metric; the confirmed/RAC split is secondary.

### 5.2 Lemma 2 (RAC reduction) — for the paper

Treating each RAC berth as two unit-capacity slots reduces RAC allocation to ordinary interval-graph colouring with `2r` extra colours. Hence a set fits the RAC pool iff its peak load is `≤ 2r`, Algorithm EST remains optimal offline, and RAC does **not** change the polynomial-time complexity of the offline problem. (Write this proof in full in `docs/MATH.md` during Phase 8.)

With `r = 0`, every RAC code path must reduce exactly to the no-RAC behaviour. This is a test.

---

## 6. Certifying rejections (the proof panel)

For every rejection in Tier 1, compute a certificate against the pool(s) the booking could have used.

**Forced** iff for the confirmed pool, `max_{j ∈ [from,to)} confirmedLoad(j) = k`, **and** (if `r > 0`) for the RAC pool, `max_{j ∈ [from,to)} racLoad(j) = 2r`.

Certificate for forced:
```
{ kind: 'forced', pool: 'confirmed' | 'rac',
  segment: j,                 // a segment in [from,to) where the pool is full
  occupants: bookingId[] }    // the k (or 2r) passengers on that segment
```
Plain-language rendering: "Segment NK→MMR already carried 72 passengers on 72 berths. No seating could fit one more."

**Strategy-induced** otherwise. Certificate: a **witness** — run EST on (pool's current passengers ∪ {b}) and return the resulting valid assignment. Theorem 1 guarantees it exists.
```
{ kind: 'strategy-induced', pool: 'confirmed' | 'rac',
  maxLoadOnRange: number,     // < capacity
  witness: Record<bookingId, berthIndex> }
```
Plain-language rendering: "Every segment of this journey still had a free berth. Here is a seating that fits everyone, including this passenger."

Tier 2 must never emit a strategy-induced certificate (invariant). Tier 3 has no rejections in the online sense; it reports `requested − seated` as "not selected".

---

## 7. Metrics

For each run (one route, one configuration, one seed, one strategy):

| Symbol | Name | Definition |
|---|---|---|
| `R` | requested | number of booking requests |
| `C` | confirmed | seated in confirmed pool |
| `A` | rac | seated in RAC pool |
| `S` | seated | `C + A` |
| `W` | rejected | `R − S` |
| `F` | forced | rejections with a forced certificate (Tier 1) |
| `G` | strategyInduced | rejections with a strategy-induced certificate (Tier 1); always 0 for Tier 2 |
| `P` | passengerSegmentsSeated | `Σ len(b)` over seated bookings |
| `U` | utilization | confirmed passenger-segments ÷ `(k · n)` |
| `I` | idleBerthSegments | `k · n − confirmed passenger-segments` |
| `EPR` | empirical performance ratio | `S_strategy ÷ S_tier3` for the same request stream |
| `fragLoss` | fragmentation loss | `S_tier2 − S_tier1` (distribution over seeds; may be negative per instance) |
| `fragRate` | fragmentation rate | `G ÷ R` |
| `fcfsLoss` | FCFS loss | `S_tier3 − S_tier2` (always `≥ 0`) |
| `FF/ω` | unbounded ratio | First-fit berths needed ÷ peak load of all requests (Section 4.6) |

**Terminology rule:** never call `EPR` a "competitive ratio". A competitive ratio is a worst case over all inputs; `EPR` is measured on specific runs.

**Paired design:** all strategies run on the **same** request stream for a given seed, so comparisons are paired. Report paired differences as well as means.

---

## 8. Synthetic demand generator

All randomness goes through `rng.ts` (mulberry32, explicit seed). No `Math.random()` anywhere in the engine.

### 8.1 Parameters

```ts
interface DemandConfig {
  scenario: 'short' | 'long' | 'mixed' | 'uniform';
  demandFactor: number;      // ρ, e.g. 0.6 … 1.6
  tatkal: { enabled: boolean; fraction: number };  // fraction of total requests, default 0.2
  seed: number;
}
```

### 8.2 Generation procedure

1. **Target volume.** Generate requests until requested passenger-segments `Σ len(b) ≥ ρ · k · n`. (`k` = confirmed berths.) The request that crosses the threshold is included.
2. **Origin.** Choose `from` with probability proportional to station weight `w_i` (from route data, default 1), over stations `0 … n−1`.
3. **Trip length.** With `Lmax = n − from`, choose `ℓ ∈ {1 … Lmax}` with weights:
   - `short`: `w(ℓ) = (Lmax − ℓ + 1)²`
   - `long`: `w(ℓ) = ℓ²`
   - `uniform`: `w(ℓ) = 1`
   - `mixed`: pick `short` or `long` with probability ½ each, per request.
   Then `to = from + ℓ`.
4. **Arrival order.** Shuffle the base requests (Fisher–Yates, seeded) to form the booking-window order.
5. **Tatkal surge** (if enabled): the last `fraction` of requests is generated with the `long` length profile and appended after the shuffled base requests, as a late burst. Mark them `isTatkal = true`.
6. Assign `id` = arrival index (0-based) and `arrival` = same index.

**Determinism requirement:** same route, config and seed ⇒ byte-identical request list.

---

## 9. Route data

### 9.1 Schema (`data/routes/*.json`)

```json
{
  "id": "demo-line",
  "name": "Demo Line (fictional)",
  "trainNumber": null,
  "source": "fictional test route",
  "stations": [
    { "code": "AAA", "name": "Alpha Junction", "km": 0,   "weight": 3 },
    { "code": "BBB", "name": "Bravo",          "km": 42,  "weight": 1 }
  ]
}
```

- Station order is the direction of travel.
- `weight` models how many journeys start at that station (major junctions 3, others 1). It is a modelling assumption; document it.

### 9.2 Included and real routes

- Ship `demo-line.json` with 10 fictional stations (codes `AAA`…`JJJ`) for tests and demos.
- For the paper, add 2–3 real long-distance trains. Take stop sequences from Indian Railways' official timetable or public datasets (check data.gov.in and community projects such as DataMeet), and **verify every stop order manually**. Record the source and access date in the `source` field.
- Do not invent real stop sequences. If a stop list cannot be verified, do not include that train.

---

## 10. Tech stack and architecture

| Concern | Choice | Reason |
|---|---|---|
| Language | TypeScript, `strict: true`, no `any` | correctness of the maths |
| App | Vite + React 18 | fast, static, no backend |
| Engine | pure TS module in `src/engine/` | runs identically in browser, tests and CLI |
| Tests | Vitest + fast-check | unit + property-based tests |
| Experiments | Node CLI via `tsx` | reuses the engine; writes CSV |
| Charts in app | hand-drawn SVG (grid, load profile) | full control, small |
| Paper figures | Python + matplotlib (optional) in `analysis/` | publication-quality PDFs |
| Styling | CSS variables + CSS modules | design tokens in one file |
| Deploy | static build to GitHub Pages or Vercel | free, shareable link |
| Backend (Phase 9, optional) | Node + Fastify + SQLite, importing the same engine | searchable real routes, server-side experiment jobs (Section 20) |

**Architecture rule:** the engine never imports from `src/ui/`, never touches the DOM, never reads the clock, never uses `Math.random()`. The UI calls the engine; the engine returns plain data (event logs, assignments, metrics, certificates). This separation is what lets the same code power the demo, the tests and the paper's experiments.

Data flow:
```
route.json + DemandConfig ──► demand.ts ──► Booking[]
Booking[] + CoachConfig + Strategy ──► simulate.ts ──► RunResult { events[], assignment, metrics, certificates }
RunResult ──► UI (grid, proof panel, metrics)   and   ──► experiments/run.ts ──► runs.csv ──► aggregate.ts ──► summary.csv ──► analysis/plots.py
```

---

## 11. File structure

```
train-isnt-full/
├── CLAUDE.md                        # Claude Code memory; imports docs/SPEC.md
├── README.md                        # what it is, how to run, link to demo
├── package.json
├── tsconfig.json                    # strict
├── vite.config.ts
├── vitest.config.ts
├── index.html
├── .gitignore                       # node_modules, dist, experiments/results
│
├── docs/
│   ├── SPEC.md                      # this file
│   ├── MATH.md                      # full proofs for the paper (Phase 8)
│   └── DECISIONS.md                 # dated log of design decisions and deviations
│
├── data/
│   └── routes/
│       ├── demo-line.json           # fictional 10-station route
│       └── README.md                # sources + verification notes for real routes
│
├── src/
│   ├── engine/                      # PURE TypeScript. No React, DOM, clock, Math.random
│   │   ├── index.ts                 # public API re-exports
│   │   ├── types.ts                 # all shared types (Section 12.1)
│   │   ├── rng.ts                   # mulberry32 seeded RNG + helpers (int, pick, shuffle, weighted)
│   │   ├── route.ts                 # load + validate route JSON, n = stations - 1
│   │   ├── interval.ts              # overlaps(), segmentsOf(), validateBooking()
│   │   ├── load.ts                  # LoadProfile: add/remove, maxOnRange(), peakLoad()
│   │   ├── coach.ts                 # occupancy grid per pool, isFree(), place(), berth labels
│   │   ├── estRepack.ts             # Algorithm EST (Section 4.2)
│   │   ├── strategies/
│   │   │   ├── index.ts             # registry: id -> strategy
│   │   │   ├── firstFit.ts          # Tier 1
│   │   │   ├── bestFit.ts           # Tier 1
│   │   │   ├── randomFit.ts         # Tier 1
│   │   │   ├── deferred.ts          # Tier 2 (capacity check + chart())
│   │   │   └── offlineOptimum.ts    # Tier 3 (Algorithm 4.5)
│   │   ├── rac.ts                   # pool logic for confirmed + RAC slots
│   │   ├── certify.ts               # forced / strategy-induced certificates (Section 6)
│   │   ├── unbounded.ts             # FF berths-needed vs ω (Section 4.6)
│   │   ├── demand.ts                # synthetic demand (Section 8)
│   │   ├── simulate.ts              # runs a stream through a strategy; event log
│   │   └── metrics.ts               # Section 7 metrics
│   │
│   └── ui/
│       ├── main.tsx
│       ├── App.tsx                  # layout (Section 13.3)
│       ├── styles/
│       │   ├── tokens.css           # colours, type, spacing (Section 13.2)
│       │   └── global.css
│       ├── state/
│       │   └── useSimulation.ts     # config + playback state machine
│       ├── components/
│       │   ├── ControlPanel.tsx
│       │   ├── Playback.tsx
│       │   ├── RequestTicker.tsx
│       │   ├── MetricsStrip.tsx
│       │   ├── CoachGrid.tsx        # the reservation chart (SVG; canvas if > 5000 cells)
│       │   ├── LoadProfile.tsx
│       │   ├── RejectionList.tsx
│       │   ├── ProofPanel.tsx
│       │   ├── ChartingView.tsx     # pending pool + animated EST repack
│       │   ├── TierComparison.tsx
│       │   └── UnboundedPanel.tsx
│       └── lib/
│           └── format.ts            # station codes, berth labels, numbers
│
├── tests/
│   ├── helpers/
│   │   ├── bruteForce.ts            # exhaustive max-seatable subset for small inputs
│   │   └── generators.ts            # fast-check arbitraries for bookings
│   ├── engine/
│   │   ├── rng.test.ts
│   │   ├── interval.test.ts
│   │   ├── load.test.ts
│   │   ├── estRepack.test.ts
│   │   ├── firstFit.test.ts
│   │   ├── bestFit.test.ts
│   │   ├── randomFit.test.ts
│   │   ├── deferred.test.ts
│   │   ├── offlineOptimum.test.ts
│   │   ├── rac.test.ts
│   │   ├── certify.test.ts
│   │   ├── unbounded.test.ts
│   │   ├── demand.test.ts
│   │   └── simulate.test.ts
│   └── properties/
│       └── invariants.property.test.ts
│
├── experiments/
│   ├── configs/
│   │   ├── smoke.json               # tiny grid, runs in seconds
│   │   └── main.json                # full grid for the paper
│   ├── run.ts                       # CLI: config -> results/<name>/runs.csv + meta.json
│   ├── aggregate.ts                 # runs.csv -> summary.csv (means, sd, 95% CI, paired diffs)
│   └── results/                     # gitignored
│
├── analysis/
│   ├── requirements.txt             # matplotlib, pandas
│   ├── plots.py                     # figures F1–F6 as PDF
│   └── figures/
│
└── server/                          # Phase 9 only (optional backend) — full tree in Section 20.4
```

---

## 12. Core types and module APIs

### 12.1 Types (`src/engine/types.ts`)

```ts
export interface Station { code: string; name: string; km?: number; weight?: number }
export interface Route {
  id: string; name: string; trainNumber: string | null; source: string;
  stations: Station[];                 // n = stations.length - 1 segments
}

export interface Booking {
  id: number;                          // = arrival index
  from: number;                        // station index
  to: number;                          // station index, from < to
  arrival: number;
  isTatkal: boolean;
}

export interface CoachConfig { berths: number; racBerths: number }  // k, r

export type Pool = 'confirmed' | 'rac';
export type StrategyId = 'first-fit' | 'best-fit' | 'random-fit' | 'deferred' | 'offline-optimum';
export type Tier = 1 | 2 | 3;

export type Outcome =
  | { kind: 'placed'; pool: Pool; index: number }   // berth (confirmed) or slot (rac)
  | { kind: 'pending'; pool: Pool }                 // Tier 2 before charting
  | { kind: 'rejected'; certificate: Certificate };

export type Certificate =
  | { kind: 'forced'; pool: Pool; segment: number; occupants: number[] }
  | { kind: 'strategy-induced'; pool: Pool; maxLoadOnRange: number;
      witness: Record<number, number> };

export interface StepEvent {
  booking: Booking;
  outcome: Outcome;
  confirmedLoad: number[];             // load profile after this step (length n)
  racLoad: number[];
}

export type Assignment = { confirmed: Record<number, number>; rac: Record<number, number> };

export interface Metrics {
  requested: number; confirmed: number; rac: number; seated: number; rejected: number;
  forced: number; strategyInduced: number;
  passengerSegmentsSeated: number; utilization: number; idleBerthSegments: number;
}

export interface RunResult {
  strategy: StrategyId; tier: Tier;
  events: StepEvent[];                 // empty for Tier 3
  assignment: Assignment;              // final (after charting for Tier 2)
  metrics: Metrics;
}
```

### 12.2 Module APIs

```ts
// rng.ts
export function createRng(seed: number): Rng;
export interface Rng { next(): number; int(maxExclusive: number): number;
  pick<T>(xs: T[]): T; shuffle<T>(xs: T[]): T[]; weighted(weights: number[]): number }

// interval.ts
export function overlaps(a: Booking, b: Booking): boolean;
export function validateBooking(b: Booking, n: number): void;   // throws on violation

// load.ts
export class LoadProfile {
  constructor(n: number);
  add(b: Booking): void; remove(b: Booking): void;
  at(j: number): number; maxOnRange(from: number, to: number): number;
  argmaxOnRange(from: number, to: number): number; peak(): number; toArray(): number[];
}
export function peakLoad(bookings: Booking[], n: number): number;

// estRepack.ts
export function estRepack(bookings: Booking[], capacity: number): Record<number, number>;
// throws if peakLoad > capacity (must never happen when called correctly)

// strategies
export function runOnline(strategy: 'first-fit' | 'best-fit' | 'random-fit' | 'deferred',
  requests: Booking[], route: Route, coach: CoachConfig, seed: number): RunResult;
export function runOfflineOptimum(requests: Booking[], route: Route, coach: CoachConfig): RunResult;

// certify.ts
export function certify(b: Booking, pool: Pool, poolBookings: Booking[], capacity: number, n: number): Certificate;

// unbounded.ts
export function firstFitBerthsNeeded(requests: Booking[], n: number): number;

// demand.ts
export function generateDemand(route: Route, coach: CoachConfig, cfg: DemandConfig): Booking[];

// metrics.ts
export function computeMetrics(result: Omit<RunResult, 'metrics'>, coach: CoachConfig, n: number): Metrics;
```

---

## 13. UI specification

### 13.1 Design direction: the reservation chart

The subject is the printed reservation chart pasted on a coach door: berth numbers down the side, station codes across the top, a passenger's journey as a line across stations. The coach grid *is* that chart, redrawn so fragmentation becomes visible. It is the one bold element; everything around it stays quiet.

Colour carries meaning, borrowed from railway signals:
- **Green** = seated. **Amber** = rejected because of how berths were assigned (strategy-induced; a caution, fixable). **Red** = rejected because the train was genuinely full (forced; a stop).

### 13.2 Tokens (`src/ui/styles/tokens.css`)

```css
:root {
  --paper:        #F6F8FB;  /* cool chart-paper white (deliberately not cream) */
  --ink:          #14213D;  /* navy ink for text */
  --coach-blue:   #1F4E9A;  /* structure: headers, grid lines at low opacity, pending outlines */
  --signal-green: #1E8449;  /* seated */
  --signal-amber: #D68910;  /* strategy-induced rejection */
  --signal-red:   #B03A2E;  /* forced rejection */

  --font: "Overpass", "Segoe UI", system-ui, sans-serif;  /* signage-derived face, one family */
  --step--1: 0.833rem; --step-0: 1rem; --step-1: 1.2rem; --step-2: 1.44rem; --step-3: 1.728rem;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px;
}
```

- Load Overpass from Google Fonts (weights 400, 600, 800). Use `font-variant-numeric: tabular-nums` for every counter so numbers don't jitter during playback.
- Station codes (e.g. `NGP`) are real uppercase content; do not add any other all-caps labels.
- Avoid: monospace data labels, middle-dot meta strings, identical rounded cards with grey shadows, gradient washes, arrows appended to button text.
- Never rely on colour alone: pending bookings use a hatched fill; RAC slots are half-height bars with a dashed divider; rejection chips carry text ("Full here" / "Assignment").

### 13.3 Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Header: train name   route (first → last station)   scenario summary      │
├─────────────────┬─────────────────────────────────────────────────────────┤
│ ControlPanel    │ MetricsStrip: Seated  Waitlisted  Full-here  Assignment  │
│  route          │               Performance ratio vs optimum               │
│  berths k, RAC r├─────────────────────────────────────────────────────────┤
│  scenario       │ RequestTicker: "Booking 214: KYN → NGP (3 segments)"     │
│  tatkal         ├─────────────────────────────────────────────────────────┤
│  demand ρ       │ CoachGrid (the reservation chart)                        │
│  seed           │   columns: segments, labelled by boarding station code   │
│  strategy       │   rows: berths, labelled "1 LB", "2 MB", …, "7 SL"       │
│  compare mode   │   bars: seated journeys (green); pending (hatched blue)  │
│ Playback        ├─────────────────────────────────────────────────────────┤
│  step / play /  │ LoadProfile: load per segment, capacity line at k        │
│  pause / reset  │                                                          │
├─────────────────┴──────────────────────────────┬──────────────────────────┤
│ RejectionList → ProofPanel (selected rejection) │ TierComparison / Unbounded│
└─────────────────────────────────────────────────┴──────────────────────────┘
```

Left-aligned throughout. Below 1024px width, default to the 16-berth mini coach and stack panels vertically.

Berth labels for a 72-berth sleeper coach follow the repeating pattern 1 LB, 2 MB, 3 UB, 4 LB, 5 MB, 6 UB, 7 SL, 8 SU (display only; confirm against a real coach layout before relying on it in the paper).

### 13.4 Component behaviour

- **ControlPanel:** route select; berths `k` (default 72; "mini" = 16); RAC berths `r` (0–9, default 0); scenario; tatkal toggle + fraction; demand factor slider (0.4–2.0, step 0.1); seed number + "New seed" button; strategy select; "Compare" toggle.
- **Playback:** Step, Play/Pause, Reset, Jump to end; speed slider. Keyboard: Space = play/pause, → = step, R = reset.
- **RequestTicker:** the current request in words, plus its outcome once decided.
- **CoachGrid:** SVG; switch to canvas if `berths × segments > 5000`. Hover a bar → tooltip (booking id, from → to, arrival, tatkal). The current request's route is shown as a ghost bar above the grid while it's being decided.
- **Compare mode:** two grids side by side on the same stream (default First-fit vs Deferred), scrolled together.
- **MetricsStrip:** Section 7 metrics with plain labels: Seated, Waitlisted, Full here (forced), Assignment (strategy-induced), Performance ratio.
- **LoadProfile:** one bar per segment, capacity line at `k`; bars that reach capacity turn red.
- **RejectionList:** chips in arrival order, amber or red; clicking one opens ProofPanel.
- **ProofPanel:**
  - *Forced:* highlight the full segment column on the grid in red tint, list the occupants, and state: "Segment X → Y already carried k passengers on k berths. No seating could fit one more."
  - *Strategy-induced:* show the load on each segment of the journey (all below capacity) and a button "Show a seating that fits everyone", which renders the witness assignment in a mini grid with the rejected passenger highlighted.
- **ChartingView (Tier 2):** before charting, accepted bookings sit in a pending pool (hatched). "Prepare chart" animates the EST repack onto the grid, earliest boarding first. This is the single orchestrated animation in the app. With `prefers-reduced-motion`, place instantly.
- **TierComparison:** for the current stream, seated counts for Tier 1 strategies, Tier 2 and Tier 3, with fragmentation loss and FCFS loss.
- **UnboundedPanel:** "Berths First-fit would need to seat everyone: 81. Minimum possible: 72 (the busiest segment)."

### 13.5 Copy rules

Plain words, sentence case, active voice. Errors say what happened and what to do: "Route file is missing station weights. Default weight 1 was used." Empty state: "Choose a scenario and press Play to start booking."

---

## 14. Testing plan

Run with `npm test`. Target: ≥ 90% line coverage of `src/engine/`. Every phase ends green.

### 14.1 Unit tests (examples, not exhaustive)

| File | Must test |
|---|---|
| `rng.test.ts` | same seed ⇒ same sequence; `int` bounds; `weighted` respects zero weights; `shuffle` is a permutation |
| `interval.test.ts` | touching bookings `[0,2)` and `[2,4)` do **not** overlap; nested and partial overlaps do; invalid `from ≥ to` throws |
| `load.test.ts` | add/remove symmetry; `maxOnRange`; `peak` on hand-made examples |
| `estRepack.test.ts` | hand example fits exactly `L` berths; throws when `peakLoad > capacity`; output has no overlapping pair on a berth |
| `firstFit.test.ts` | chooses lowest free berth; a hand-built fragmentation example where FF rejects a request that fits (strategy-induced) |
| `bestFit.test.ts` | gap computation; tie → lowest index; a case where BF succeeds and FF fails |
| `randomFit.test.ts` | seeded determinism; only ever picks free berths |
| `deferred.test.ts` | accepts iff range load `< k`; charting always succeeds; zero strategy-induced rejections |
| `offlineOptimum.test.ts` | hand examples; matches brute force (see 14.2) |
| `rac.test.ts` | `r = 0` identical to no-RAC; RAC used only when confirmed pool can't fit; slots never overbooked |
| `certify.test.ts` | forced certificate's segment is full and lists exactly `k` occupants; witness is a valid assignment including the rejected booking |
| `unbounded.test.ts` | `FF ≥ ω` always; start-sorted input ⇒ `FF = ω` exactly |
| `demand.test.ts` | valid bookings; volume threshold; tatkal block at the end; determinism by seed |
| `simulate.test.ts` | event log length = requests; load arrays consistent with placements |

### 14.2 Property-based tests (`invariants.property.test.ts`, fast-check, ≥ 500 runs each)

Generators: `n ∈ [2, 8]` segments, `m ∈ [1, 12]` bookings, capacity `∈ [1, 4]`.

1. **No double-booking:** in every strategy's final assignment, no two overlapping bookings share a berth or slot.
2. **Theorem 1:** for any set with `peakLoad ≤ k`, `estRepack` succeeds with `≤ k` berths; for `peakLoad > k`, it throws.
3. **Optimality cross-check:** `runOfflineOptimum(...).metrics.seated === bruteForceMaxSeated(...)`.
4. **Upper bound:** Tier 3 seated `≥` every Tier 1 strategy and `≥` Tier 2, per instance.
5. **Tier 2 invariant:** `strategyInduced === 0`.
6. **Certificate soundness:** every forced certificate names a full segment within the booking's range; every witness is a valid assignment that includes the rejected booking.
7. **Determinism:** identical inputs and seed ⇒ identical `RunResult` (deep equality).

**Do not** assert `S_tier2 ≥ S_tier1` per instance (Section 4.1 explains why it can fail).

`tests/helpers/bruteForce.ts`: enumerate all subsets (m ≤ 14), keep those with `peakLoad ≤ k`, return the maximum size.

---

## 15. Experiments and analysis

### 15.1 Config (`experiments/configs/main.json`)

```json
{
  "name": "main",
  "routes": ["demo-line"],
  "berths": [72],
  "racBerths": [0, 9],
  "scenarios": ["short", "long", "mixed", "uniform"],
  "tatkal": [false, true],
  "tatkalFraction": 0.2,
  "demandFactors": [0.6, 0.8, 1.0, 1.2, 1.4, 1.6],
  "seeds": { "from": 1, "to": 100 },
  "strategies": ["first-fit", "best-fit", "random-fit", "deferred", "offline-optimum"],
  "unbounded": true
}
```
Add real route ids once their data is verified. `smoke.json` uses one route, one scenario, two demand factors, seeds 1–3.

### 15.2 Commands

```
npm run experiment -- --config experiments/configs/smoke.json
npm run experiment -- --config experiments/configs/main.json
npm run aggregate  -- --run experiments/results/main
python analysis/plots.py experiments/results/main/summary.csv
```

### 15.3 Outputs

`experiments/results/<name>/runs.csv` — one row per (route, k, r, scenario, tatkal, ρ, seed, strategy):
```
route,berths,racBerths,scenario,tatkal,rho,seed,strategy,tier,requested,confirmed,rac,seated,rejected,forced,strategyInduced,passengerSegmentsSeated,utilization,idleBerthSegments,epr,ffBerthsNeeded,omega
```
`meta.json` — config, engine version, git commit hash, start/end time (the runner may read the clock; the engine may not).

`summary.csv` — grouped by (route, k, r, scenario, tatkal, ρ, strategy): mean, sd, 95% CI (`mean ± 1.96·sd/√N`) for seated, EPR, fragRate, utilization; plus **paired** differences vs Deferred and vs Optimum (same seed), with 95% CI.

### 15.4 Figures (`analysis/plots.py`)

| ID | Figure | Purpose |
|---|---|---|
| F1 | seated vs demand factor ρ, one line per strategy, per scenario | headline comparison |
| F2 | strategy-induced rejection rate vs ρ | fragmentation, directly |
| F3 | EPR distributions (box plots) per strategy and scenario | variability |
| F4 | stacked bar: fragmentation loss + FCFS loss | decomposition of lost capacity |
| F5 | FF/ω vs ρ in unbounded mode | classic online colouring measure |
| F6 | effect of RAC (`r = 0` vs `r = 9`) on seated and fragmentation | RAC contribution |

Table T1: means ± 95% CI at ρ = 1.0 and 1.4 for every strategy.

---

## 16. Build phases (with Claude Code prompts)

Each phase: paste the prompt, let Claude Code work, check the acceptance criteria yourself, then commit (you do the commits; Claude Code never commits). Log any deviation in `docs/DECISIONS.md`.

### Phase 0 — Scaffold (day 1)
**Prompt:** "Read docs/SPEC.md sections 10 and 11. Scaffold the project exactly as in the file structure: Vite + React 18 + TypeScript strict, Vitest, fast-check, tsx. Create empty modules with the exported signatures from section 12 (throwing 'not implemented'). Add npm scripts: dev, build, test, coverage, experiment, aggregate. Add demo-line.json with 10 fictional stations (codes AAA to JJJ, weights 3 for AAA, EEE, JJJ and 1 otherwise). Stop when `npm test` runs and `npm run dev` shows a placeholder page."
**Done when:** both commands work; structure matches Section 11.

### Phase 1 — Core maths (days 2–4)
**Prompt:** "Implement rng.ts, route.ts, interval.ts, load.ts, coach.ts and estRepack.ts per sections 3, 4.2 and 12. Write the unit tests from section 14.1 for these files and property tests 2 and 7 from 14.2. Implement everything from scratch; do not add libraries. Run npm test and fix until green."
**Done when:** all listed tests pass; half-open overlap test passes.

### Phase 2 — Strategies (days 5–8)
**Prompt:** "Implement the Tier 1 strategies (first-fit, best-fit, random-fit), Tier 2 deferred with chart(), and Tier 3 offlineOptimum per section 4, plus runOnline and runOfflineOptimum in simulate.ts. Implement tests/helpers/bruteForce.ts and property tests 1, 3, 4 and 5. If the brute-force cross-check fails, stop and show me the smallest failing case; do not change the test."
**Done when:** all property tests pass at ≥ 500 runs.

### Phase 3 — Certificates, metrics, unbounded (days 9–10)
**Prompt:** "Implement certify.ts (section 6), metrics.ts (section 7) and unbounded.ts (section 4.6). Attach a certificate to every Tier 1 rejection in the event log. Add property test 6 and the unit tests from 14.1 for these files."
**Done when:** every rejection has a sound certificate; start-sorted FF = ω test passes.

### Phase 4 — Demand and experiments pipeline (days 11–13)
**Prompt:** "Implement demand.ts per section 8, then experiments/run.ts and aggregate.ts per section 15, running all strategies on the same stream per seed. Run the smoke config and show me summary.csv."
**Done when:** smoke run finishes in under a minute; CSV columns match 15.3; rerunning gives identical results.

### Phase 5 — UI core (days 14–18)
**Prompt:** "Build the UI per section 13: tokens.css, layout, ControlPanel, Playback, RequestTicker, MetricsStrip, CoachGrid and LoadProfile, driven by useSimulation.ts which calls the engine. Follow the design direction and avoid-list in 13.1–13.2 exactly."
**Done when:** a full run plays step by step on the demo route with correct counters.

### Phase 6 — UI proofs and comparison (days 19–22)
**Prompt:** "Build RejectionList, ProofPanel, ChartingView (with the single EST repack animation and reduced-motion fallback), Compare mode, TierComparison and UnboundedPanel per section 13.4."
**Done when:** clicking any rejection shows a correct certificate; charting animation places every pending booking.

### Phase 7 — RAC and real routes (days 23–26)
**Prompt:** "Implement rac.ts per section 5 across all tiers, the RAC rendering in CoachGrid, and rac.test.ts. Then add the real route files I provide in data/routes, validating them with route.ts."
**Done when:** `r = 0` equivalence test passes; real routes load and simulate.

### Phase 8 — Results and write-up (days 27–35)
**Prompt:** "Run the main experiment config, aggregate, and generate figures F1–F6 and table T1 with analysis/plots.py. Then draft docs/MATH.md with full proofs of Lemma 1, Theorem 1, EST correctness, Lemma 2 (RAC reduction) and the optimality argument for Algorithm 4.5, matching section 3 notation."
**Done when:** figures exist as PDFs; MATH.md proofs checked by you (and your supervisor).

Deploy after Phase 6 so you have a shareable demo link early.

### Phase 9 — Optional backend (days 36–46)
Built last, only after Phase 8. Four sub-phases (9a–9d) with their own prompts and acceptance criteria are in **Section 20.9**.

---

## 17. Mapping to the research paper

| Paper section | Source |
|---|---|
| Introduction | Section 1; the waitlisted-with-empty-berths example |
| Related work | seat reservation problem (Boyar & Larsen 1999); online interval colouring (Kierstead & Trotter); railway revenue management; Indian Railways context |
| Model | Section 3 (definitions, Lemma 1, Theorem 1) |
| Algorithms | Sections 4 and 5 (tiers, EST, optimum, RAC Lemma 2) |
| Methodology | Sections 8, 9, 15.1 (demand, routes, configuration, paired design) |
| Results | F1–F6, T1 |
| Discussion | what deferred charting would recover; when fragmentation matters most (scenario × ρ) |
| Limitations | Section 18 |

Candidate venues (finalise with your supervisor): the Operational Research Society of India's convention or its journal *OPSEARCH*; the Transportation Research Group of India conference; IEEE ITSC; ACM COMPASS. Check current calls for dates.

---

## 18. Limitations (state these in the paper)

1. Demand is synthetic; results are reported across a sweep of scenarios rather than as a single estimate.
2. IRCTC's real allocation algorithm is unpublished; the study compares policies, not Indian Railways' actual system.
3. Berths are treated as interchangeable; real passengers have berth preferences.
4. Quotas other than RAC, cancellations and RAC promotions are not modelled in the core study.
5. Station weights are a modelling assumption.
6. One coach is simulated at a time.

---

## 19. Glossary

- **Segment:** the stretch between two consecutive stations.
- **Load:** passengers on a segment. **Peak load `L`:** load on the busiest segment.
- **Chain:** bookings that can share one berth (pairwise non-overlapping).
- **Antichain:** bookings that all overlap each other; they need different berths.
- **Dilworth bound:** minimum berths needed = peak load.
- **EST:** earliest-start-time greedy assignment (Algorithm 4.2).
- **Tier 1 / 2 / 3:** immediate assignment / deferred assignment / clairvoyant optimum.
- **Forced rejection:** the train is full on some segment of the journey.
- **Strategy-induced rejection:** room existed on every segment, but earlier berth choices blocked it.
- **EPR:** empirical performance ratio, seated by a strategy ÷ seated by the optimum.
- **Charting:** Indian Railways' final seat allocation before departure.
- **RAC:** Reservation Against Cancellation; two passengers share a side-lower berth.

---

## 20. Phase 9 — Backend: route data service (optional, built last)

### 20.1 Purpose

The core project needs no server (Section 10). The backend exists to do two jobs the static app cannot do well:

1. **Route data service.** A database of real train routes built from open timetable data, so the app can search and simulate *any* train by number instead of 2–3 hand-added files.
2. **Experiment service.** Run large experiment grids on request, report progress, and cache results by configuration.

**Hard rule:** the frontend must keep working if the backend is down or asleep. It falls back to the bundled route files (Section 20.7). The demo must never depend on the server.

### 20.2 Data sources

**Use open datasets for the database. Do not build on unofficial live railway APIs.**

- **Primary:** the Indian Railways train time table published on the Government of India's Open Government Data platform (data.gov.in). It gives train-wise arrival and departure times at stations, plus route, distance, source and destination. The most recent snapshot found during planning is dated 01.11.2017.
- **Secondary / cross-check:** community mirrors of Indian Railways schedule data on Kaggle and GitHub (e.g. a `schedules.json` of train stops with station codes, day and times).

**Caveats to state in the paper:**
- These are **snapshots**, several years old. Train numbers, stops and timings change. They are used only for *route structure* (which stations, in what order), not for anything time-sensitive.
- Every train used in the paper's results must be **manually verified** against Indian Railways' current official schedule enquiry and marked `verified` with a date (Section 20.3).

**Why not a live API:** free Indian Railways APIs found online are unofficial, usually scrape IRCTC or NTES, impose tight rate limits, can disappear without notice, and may conflict with those sites' terms of use. A research result must not depend on one. If you ever add one, plug it in through the `RouteProvider` interface (Section 20.5) as a non-default provider.

**Column names:** do not assume the dataset's column names. During Phase 9a, inspect the downloaded file's header, write an explicit column mapping in `server/scripts/ingest.ts`, and record the mapping and the file's download date in `docs/DECISIONS.md`.

### 20.3 Database schema (SQLite)

SQLite is the right choice: route data is read-only after ingestion, fits in one file, and needs no database server. Use `better-sqlite3`.

```sql
-- server/src/db/schema.sql

CREATE TABLE stations (
  code            TEXT PRIMARY KEY,           -- e.g. 'NGP'
  name            TEXT NOT NULL,
  trains_stopping INTEGER NOT NULL DEFAULT 0, -- computed at ingest
  weight          INTEGER NOT NULL DEFAULT 1  -- demand weight, see 20.3.1
);

CREATE TABLE trains (
  number          TEXT PRIMARY KEY,           -- keep as text: leading zeros matter
  name            TEXT NOT NULL,
  source_station  TEXT REFERENCES stations(code),
  dest_station    TEXT REFERENCES stations(code),
  source          TEXT NOT NULL,              -- dataset name + URL
  snapshot_date   TEXT NOT NULL,              -- date of the dataset snapshot
  verified        INTEGER NOT NULL DEFAULT 0, -- 1 = stop order checked against current official schedule
  verified_on     TEXT,                       -- ISO date of manual verification
  notes           TEXT
);

CREATE TABLE stops (
  train_number    TEXT NOT NULL REFERENCES trains(number),
  seq             INTEGER NOT NULL,           -- 0-based stop order
  station_code    TEXT NOT NULL REFERENCES stations(code),
  km              REAL,                       -- cumulative distance
  arrival         TEXT,
  departure       TEXT,
  day             INTEGER,
  PRIMARY KEY (train_number, seq)
);
CREATE INDEX idx_stops_station ON stops(station_code);

CREATE TABLE experiment_runs (
  id              TEXT PRIMARY KEY,           -- uuid
  config_hash     TEXT NOT NULL,              -- sha256 of canonical config JSON + engine version
  config_json     TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('queued','running','done','failed')),
  progress        REAL NOT NULL DEFAULT 0,    -- 0..1
  created_at      TEXT NOT NULL,
  finished_at     TEXT,
  summary_csv     TEXT,
  error           TEXT
);
CREATE INDEX idx_runs_hash ON experiment_runs(config_hash);
```

#### 20.3.1 Data-driven station weights

Replace the hand-assigned weights with a weight derived from how many trains stop at each station:

`weight = 1 + floor(log2(1 + trains_stopping))`

This is still a modelling assumption (busier stations originate more journeys), but it is reproducible and defensible. Record the formula in the paper's methodology.

#### 20.3.2 Ingestion validation rules

A train is **simulation-eligible** only if all of these hold; otherwise it is stored with a note and excluded from search results:
1. `seq` values are consecutive from 0.
2. No station appears twice in one train's stops.
3. `km` is non-decreasing along `seq` (where present).
4. At least 3 stops.
5. Every `station_code` exists in `stations`.

Ingestion prints a report: trains read, trains eligible, trains excluded (with reason counts).

### 20.4 File structure

```
server/
├── package.json                     # or scripts in the root package.json
├── tsconfig.json                    # path alias "@engine/*" -> "../src/engine/*"
├── src/
│   ├── index.ts                     # starts the server
│   ├── app.ts                       # buildApp(): Fastify instance (used by tests)
│   ├── config.ts                    # env: PORT, DB_PATH, CORS_ORIGIN, limits
│   ├── db/
│   │   ├── schema.sql
│   │   ├── connection.ts            # opens SQLite (read-only for route tables)
│   │   └── queries.ts               # typed prepared statements
│   ├── providers/
│   │   ├── RouteProvider.ts         # interface (20.5)
│   │   ├── sqliteProvider.ts        # default
│   │   └── staticProvider.ts        # reads data/routes/*.json (fallback / tests)
│   ├── api/
│   │   ├── health.ts
│   │   ├── stations.ts
│   │   ├── trains.ts
│   │   ├── simulate.ts
│   │   └── experiments.ts
│   ├── jobs/
│   │   ├── queue.ts                 # in-process queue, 1 job at a time
│   │   └── experimentWorker.ts      # worker_threads: runs the engine grid, reports progress
│   └── validation/
│       └── schemas.ts               # zod schemas for every request body and query
├── scripts/
│   ├── ingest.ts                    # raw CSV/JSON -> railways.sqlite
│   ├── computeWeights.ts            # 20.3.1
│   ├── markVerified.ts              # npm run verify-train -- 12345 --note "checked on NTES"
│   └── exportRoute.ts               # export a train to data/routes/<number>.json for the static app
├── data/
│   ├── raw/                         # downloaded datasets (gitignored)
│   ├── fixtures/timetable-sample.csv# 5–10 trains for tests
│   └── railways.sqlite              # build artifact (gitignored; rebuilt by ingest)
└── tests/
    ├── ingest.test.ts
    ├── api.stations.test.ts
    ├── api.trains.test.ts
    ├── api.simulate.test.ts
    └── api.experiments.test.ts

src/ui/api/
└── client.ts                        # typed fetch wrapper + health check + fallback
```

**Engine reuse rule:** the server imports the engine from `src/engine` (via the `@engine/*` alias, bundled with esbuild or run with tsx). **It never re-implements an algorithm.** One engine, three callers: browser, CLI, server.

### 20.5 RouteProvider interface

```ts
export interface TrainSummary {
  number: string; name: string; from: string; to: string;
  stops: number; verified: boolean;
}

export interface RouteProvider {
  searchTrains(query: string, limit: number): Promise<TrainSummary[]>;
  trainsBetween(fromCode: string, toCode: string, limit: number): Promise<TrainSummary[]>;
  getRoute(trainNumber: string): Promise<Route | null>;   // Route = engine type (Section 12.1)
  searchStations(query: string, limit: number): Promise<{ code: string; name: string }[]>;
}
```

`getRoute` returns exactly the engine's `Route` type, with `source` set to the dataset name and snapshot date (plus "verified on …" when applicable). The engine does not know or care where a route came from.

### 20.6 API

All responses are JSON unless stated. All inputs validated with zod; invalid input returns `400` with a message naming the field.

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/api/health` | liveness + dataset snapshot date | used by the frontend fallback check |
| GET | `/api/stations?q=NAG&limit=10` | station search by code or name | `limit ≤ 50` |
| GET | `/api/trains?q=12105&limit=10` | train search by number or name | eligible trains only |
| GET | `/api/trains/between?from=CSMT&to=NGP` | trains serving both, in that order | eligible trains only |
| GET | `/api/trains/:number` | the `Route` for one train | `404` if unknown or ineligible |
| POST | `/api/simulate` | run strategies on one train, one seed | returns metrics per strategy; event logs only with `?events=true`, capped at 5,000 events |
| POST | `/api/experiments` | submit an experiment grid | returns `{ id, cached }`; identical config hash returns the cached result |
| GET | `/api/experiments/:id` | job status and progress | `queued` / `running` / `done` / `failed` |
| GET | `/api/experiments/:id/summary.csv` | aggregated results | `text/csv` |

`POST /api/simulate` body:
```json
{
  "trainNumber": "12345",
  "coach": { "berths": 72, "racBerths": 0 },
  "demand": { "scenario": "mixed", "demandFactor": 1.2,
              "tatkal": { "enabled": true, "fraction": 0.2 }, "seed": 7 },
  "strategies": ["first-fit", "best-fit", "deferred", "offline-optimum"]
}
```

**Limits (protect the free tier):**
- Rate limit: 60 requests/minute per IP (`@fastify/rate-limit`).
- Experiment grids: at most 20,000 runs per job; at most 1 job running at a time; others queue.
- Request body ≤ 64 KB. CORS restricted to the frontend's origin.

**Determinism requirement:** `POST /api/simulate` must return exactly the same metrics as calling the engine directly in the browser with the same route, coach, demand and seed. This is a test.

### 20.7 Frontend integration and fallback

- `VITE_API_URL` environment variable; if unset, the app runs in static mode (no backend features shown).
- On load, `client.ts` calls `/api/health` with a 2-second timeout.
  - **Reachable:** the route picker gains "Search any train" (by number/name, or between two stations). Unverified trains show a small note: "Stop order not yet verified against the current timetable."
  - **Unreachable or asleep:** silently use the bundled `data/routes/*.json`. Show one quiet line: "Live train search is unavailable; showing built-in routes."
- The simulation itself **always runs in the browser**, even when the route came from the server. The server's `/api/simulate` exists for external use and determinism checks, not for the UI's main loop.
- An "Experiments" page (optional) submits a grid to `/api/experiments`, shows progress, and offers `summary.csv` for download.

### 20.8 Tests

| File | Must test |
|---|---|
| `ingest.test.ts` | the fixture CSV ingests; each validation rule in 20.3.2 excludes a deliberately broken train with the right reason; weights follow the formula |
| `api.stations.test.ts` | search by code and by name; limit enforced; bad limit → 400 |
| `api.trains.test.ts` | search; `between` respects stop order (A before B); `getRoute` returns a valid engine `Route` that `route.ts` validation accepts; ineligible train → 404 |
| `api.simulate.test.ts` | **same metrics as a direct engine call** with the same inputs; invalid strategy → 400; events capped |
| `api.experiments.test.ts` | job lifecycle queued → running → done; identical config returns cached result; oversized grid → 400 |

Use Fastify's `app.inject()` so tests need no network. All engine tests from Section 14 must still pass unchanged.

### 20.9 Sub-phases and Claude Code prompts

**9a — Ingestion and database (days 36–38)**
Prompt: "Read SPEC Section 20. I have put the downloaded timetable file in server/data/raw/. Inspect its header, then implement server/scripts/ingest.ts with an explicit column mapping, the schema in 20.3, the validation rules in 20.3.2, the weights in 20.3.1, and ingest.test.ts using a small fixture. Record the column mapping and download date in docs/DECISIONS.md. Do not guess column names."
Done when: ingestion report prints; fixture tests pass; `railways.sqlite` builds.

**9b — API and providers (days 39–41)**
Prompt: "Implement the RouteProvider interface, sqliteProvider and staticProvider, and the API in 20.6 with zod validation, rate limiting and CORS. The server must import the engine via the @engine alias and must not re-implement any algorithm. Write the tests in 20.8 using app.inject()."
Done when: all server tests pass, including the simulate-determinism test.

**9c — Frontend integration (days 42–43)**
Prompt: "Implement src/ui/api/client.ts and the route-picker search per 20.7, with the 2-second health check and the silent fallback to bundled routes. The simulation must still run in the browser. Show the unverified-train note."
Done when: with the server stopped, the app works exactly as before Phase 9; with it running, any eligible train can be searched and simulated.

**9d — Experiment jobs and deployment (days 44–46)**
Prompt: "Implement the job queue and worker per 20.6 with config-hash caching, and the optional Experiments page. Add a Dockerfile for the server and deployment notes in README.md for a free Node host. Keep the frontend on its static host."
Done when: a smoke experiment runs through the API; a cached resubmission returns instantly; the server is deployed and the frontend's fallback works when it sleeps.

**Hosting note:** free Node hosting tiers change often and typically sleep when idle, so the first request after a pause can be slow. Check current free-tier limits before choosing a host. The fallback in 20.7 is what makes this acceptable.

### 20.10 Definition of done for Phase 9

- The app still works fully with the backend off.
- Every train used in the paper is `verified = 1` with a date.
- The server contains no algorithm code of its own; all results come from `src/engine`.
- Server and browser produce identical metrics for identical inputs.
