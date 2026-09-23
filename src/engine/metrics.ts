// Run metrics (SPEC 7).
import type { CoachConfig, Metrics, RunResult } from './types';

export function computeMetrics(result: Omit<RunResult, 'metrics'>, coach: CoachConfig, n: number): Metrics {
  throw new Error('not implemented');
}
