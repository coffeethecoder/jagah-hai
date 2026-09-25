// Synthetic demand generator (SPEC 8).
import type { Booking, CoachConfig, DemandConfig, Route } from './types';
import { createRng, deriveSeed } from './rng';
import { segmentCount } from './route';

type Profile = 'short' | 'long' | 'uniform';
const SCENARIOS: DemandConfig['scenario'][] = ['short', 'long', 'mixed', 'uniform'];

/** Sub-stream of the run seed used for demand; random-fit uses the run seed itself. */
export const DEMAND_STREAM = 1;

/** Weights for trip length ℓ = 1 … lMax (index ℓ - 1) under a length profile (SPEC 8.2 step 3). */
export function lengthWeights(profile: Profile, lMax: number): number[] {
  return Array.from({ length: lMax }, (_, i) => {
    const l = i + 1;
    if (profile === 'short') return (lMax - l + 1) ** 2;
    if (profile === 'long') return l ** 2;
    return 1;
  });
}

/**
 * Requests in arrival order: shuffled base requests, then the tatkal burst (SPEC 8.2).
 * Volume: base requests until their passenger-segments reach (1 - f)·ρ·k·n, then tatkal requests until
 * theirs reach f·ρ·k·n, where f is the tatkal fraction (0 when disabled). See docs/DECISIONS.md.
 */
export function generateDemand(route: Route, coach: CoachConfig, cfg: DemandConfig): Booking[] {
  if (!SCENARIOS.includes(cfg.scenario)) throw new Error(`Unknown scenario ${String(cfg.scenario)}`);
  if (!Number.isFinite(cfg.demandFactor) || cfg.demandFactor < 0) throw new Error(`Demand factor must be ≥ 0, got ${cfg.demandFactor}`);
  if (!(cfg.tatkal.fraction >= 0 && cfg.tatkal.fraction <= 1)) throw new Error(`Tatkal fraction must be in [0, 1], got ${cfg.tatkal.fraction}`);
  if (!Number.isInteger(coach.berths) || coach.berths < 1) throw new Error(`Coach needs at least 1 berth, got ${coach.berths}`);
  if (!Number.isInteger(cfg.seed)) throw new Error(`Seed must be an integer, got ${cfg.seed}`);

  const n = segmentCount(route);
  const rng = createRng(deriveSeed(cfg.seed, DEMAND_STREAM));
  const originWeights = route.stations.slice(0, n).map((s) => s.weight ?? 1);
  const volume = cfg.demandFactor * coach.berths * n;
  const tatkalShare = cfg.tatkal.enabled ? cfg.tatkal.fraction : 0;

  const draw = (scenario: DemandConfig['scenario']) => {
    const from = rng.weighted(originWeights);
    const profile: Profile = scenario === 'mixed' ? (rng.next() < 0.5 ? 'short' : 'long') : scenario;
    return { from, to: from + 1 + rng.weighted(lengthWeights(profile, n - from)) };
  };
  // Keep drawing until the passenger-segments reach the target; the crossing request is included.
  const until = (target: number, scenario: DemandConfig['scenario']) => {
    const out: { from: number; to: number }[] = [];
    for (let sum = 0; sum < target;) {
      const t = draw(scenario);
      out.push(t);
      sum += t.to - t.from;
    }
    return out;
  };

  const base = rng.shuffle(until((1 - tatkalShare) * volume, cfg.scenario));
  const tatkal = until(tatkalShare * volume, 'long');
  return [
    ...base.map((t) => ({ ...t, isTatkal: false })),
    ...tatkal.map((t) => ({ ...t, isTatkal: true })),
  ].map((t, i) => ({ id: i, from: t.from, to: t.to, arrival: i, isTatkal: t.isTatkal }));
}
