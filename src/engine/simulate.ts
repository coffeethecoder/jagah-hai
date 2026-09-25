// Runs a request stream through a strategy and records the event log.
import type { Assignment, Booking, CoachConfig, Outcome, Pool, Route, RunResult, StepEvent } from './types';
import { segmentCount } from './route';
import { validateBooking } from './interval';
import { LoadProfile } from './load';
import { OccupancyGrid } from './coach';
import { createRng } from './rng';
import { computeMetrics } from './metrics';
import { STRATEGY_TIER, TIER1_CHOOSERS } from './strategies';
import { canAccept, chart } from './strategies/deferred';
import { certifyPools, offlineAssignment, poolCapacity } from './rac';

function setup(requests: Booking[], route: Route, coach: CoachConfig): number {
  if (!Number.isInteger(coach.berths) || coach.berths < 1) throw new Error(`Coach needs at least 1 berth, got ${coach.berths}`);
  if (!Number.isInteger(coach.racBerths) || coach.racBerths < 0) throw new Error(`RAC berths must be an integer ≥ 0, got ${coach.racBerths}`);
  const n = segmentCount(route);
  const ids = new Set<number>();
  for (const b of requests) {
    validateBooking(b, n);
    if (ids.has(b.id)) throw new Error(`Duplicate booking id ${b.id}`);
    ids.add(b.id);
  }
  return n;
}

/** Tier 1 and 2 (SPEC 4.3, 4.4, 5.1): confirmed pool first, then RAC, else waitlisted with a certificate. */
export function runOnline(strategy: 'first-fit' | 'best-fit' | 'random-fit' | 'deferred',
  requests: Booking[], route: Route, coach: CoachConfig, seed: number): RunResult {
  const n = setup(requests, route, coach);
  const rng = createRng(seed);
  const pools: Pool[] = coach.racBerths > 0 ? ['confirmed', 'rac'] : ['confirmed'];
  const grid = { confirmed: new OccupancyGrid(coach.berths, n), rac: new OccupancyGrid(poolCapacity(coach, 'rac'), n) };
  const load = { confirmed: new LoadProfile(n), rac: new LoadProfile(n) };
  const inPool: Record<Pool, Booking[]> = { confirmed: [], rac: [] }; // seated (Tier 1) or pending (Tier 2)
  const assignment: Assignment = { confirmed: {}, rac: {} };
  const events: StepEvent[] = [];

  for (const b of requests) {
    let outcome: Outcome | null = null;
    for (const pool of pools) {
      if (strategy === 'deferred') {
        if (canAccept(b, load[pool], poolCapacity(coach, pool))) outcome = { kind: 'pending', pool };
      } else {
        const index = TIER1_CHOOSERS[strategy](b, grid[pool], rng);
        if (index !== null) {
          grid[pool].place(index, b);
          assignment[pool][b.id] = index;
          outcome = { kind: 'placed', pool, index };
        }
      }
      if (outcome) {
        load[pool].add(b);
        inPool[pool].push(b);
        break;
      }
    }
    outcome ??= { kind: 'rejected', certificate: certifyPools(b, inPool.confirmed, inPool.rac, coach, n) };
    events.push({ booking: b, outcome, confirmedLoad: load.confirmed.toArray(), racLoad: load.rac.toArray() });
  }

  if (strategy === 'deferred') {
    assignment.confirmed = chart(inPool.confirmed, coach.berths);
    assignment.rac = chart(inPool.rac, poolCapacity(coach, 'rac'));
  }

  const partial = { strategy, tier: STRATEGY_TIER[strategy], events, assignment };
  return { ...partial, metrics: computeMetrics(partial, requests, coach, n) };
}

/** Tier 3 (SPEC 4.5, 5.1): the most passengers that fit, all known in advance. */
export function runOfflineOptimum(requests: Booking[], route: Route, coach: CoachConfig): RunResult {
  const n = setup(requests, route, coach);
  const partial = { strategy: 'offline-optimum' as const, tier: 3 as const, events: [], assignment: offlineAssignment(requests, coach) };
  return { ...partial, metrics: computeMetrics(partial, requests, coach, n) };
}
