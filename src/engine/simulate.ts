// Runs a request stream through a strategy and records the event log.
import type { Booking, CoachConfig, Route, RunResult } from './types';

export function runOnline(strategy: 'first-fit' | 'best-fit' | 'random-fit' | 'deferred',
  requests: Booking[], route: Route, coach: CoachConfig, seed: number): RunResult {
  throw new Error('not implemented');
}

export function runOfflineOptimum(requests: Booking[], route: Route, coach: CoachConfig): RunResult {
  throw new Error('not implemented');
}
