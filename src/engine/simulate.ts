// Runs a request stream through a strategy and records the event log.
import type { Assignment, Booking, CoachConfig, Outcome, Route, RunResult, StepEvent } from './types';
import { segmentCount } from './route';
import { validateBooking } from './interval';
import { LoadProfile } from './load';
import { OccupancyGrid } from './coach';
import { createRng } from './rng';
import { certify } from './certify';
import { computeMetrics } from './metrics';
import { STRATEGY_TIER, TIER1_CHOOSERS } from './strategies';
import { canAccept, chart } from './strategies/deferred';
import { selectOptimum } from './strategies/offlineOptimum';
import { estRepack } from './estRepack';

function setup(requests: Booking[], route: Route, coach: CoachConfig): number {
  if (!Number.isInteger(coach.berths) || coach.berths < 1) throw new Error(`Coach needs at least 1 berth, got ${coach.berths}`);
  // ponytail: RAC pool arrives in Phase 7 (SPEC 5); until then only r = 0 runs.
  if (coach.racBerths !== 0) throw new Error('RAC berths are not supported until Phase 7');
  const n = segmentCount(route);
  const ids = new Set<number>();
  for (const b of requests) {
    validateBooking(b, n);
    if (ids.has(b.id)) throw new Error(`Duplicate booking id ${b.id}`);
    ids.add(b.id);
  }
  return n;
}

export function runOnline(strategy: 'first-fit' | 'best-fit' | 'random-fit' | 'deferred',
  requests: Booking[], route: Route, coach: CoachConfig, seed: number): RunResult {
  const n = setup(requests, route, coach);
  const k = coach.berths;
  const rng = createRng(seed);
  const grid = new OccupancyGrid(k, n);
  const load = new LoadProfile(n);
  const inPool: Booking[] = [];   // seated (Tier 1) or pending (Tier 2) in the confirmed pool
  const assignment: Assignment = { confirmed: {}, rac: {} };
  const events: StepEvent[] = [];
  const noRac = new Array<number>(n).fill(0);

  for (const b of requests) {
    let outcome: Outcome;
    if (strategy === 'deferred') {
      outcome = canAccept(b, load, k)
        ? { kind: 'pending', pool: 'confirmed' }
        : { kind: 'rejected', certificate: certify(b, 'confirmed', inPool, k, n) };
    } else {
      const index = TIER1_CHOOSERS[strategy](b, grid, rng);
      if (index === null) {
        outcome = { kind: 'rejected', certificate: certify(b, 'confirmed', inPool, k, n) };
      } else {
        grid.place(index, b);
        assignment.confirmed[b.id] = index;
        outcome = { kind: 'placed', pool: 'confirmed', index };
      }
    }
    if (outcome.kind !== 'rejected') {
      load.add(b);
      inPool.push(b);
    }
    events.push({ booking: b, outcome, confirmedLoad: load.toArray(), racLoad: noRac.slice() });
  }

  if (strategy === 'deferred') assignment.confirmed = chart(inPool, k);

  const partial = { strategy, tier: STRATEGY_TIER[strategy], events, assignment };
  return { ...partial, metrics: computeMetrics(partial, requests, coach, n) };
}

export function runOfflineOptimum(requests: Booking[], route: Route, coach: CoachConfig): RunResult {
  const n = setup(requests, route, coach);
  const assignment: Assignment = { confirmed: estRepack(selectOptimum(requests, coach.berths), coach.berths), rac: {} };
  const partial = { strategy: 'offline-optimum' as const, tier: 3 as const, events: [], assignment };
  return { ...partial, metrics: computeMetrics(partial, requests, coach, n) };
}
