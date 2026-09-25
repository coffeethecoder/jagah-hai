// Run metrics (SPEC 7).
import type { Booking, CoachConfig, Metrics, RunResult } from './types';

/**
 * `requests` is needed because Tier 3 has no event log and the assignment holds only ids.
 * Deviation from SPEC 12.2's signature; see docs/DECISIONS.md.
 */
export function computeMetrics(result: Omit<RunResult, 'metrics'>, requests: Booking[], coach: CoachConfig, n: number): Metrics {
  const byId = new Map(requests.map((b) => [b.id, b]));
  const segmentsOf = (ids: Record<number, number>) =>
    Object.keys(ids).reduce((sum, id) => {
      const b = byId.get(Number(id));
      if (!b) throw new Error(`Assignment holds unknown booking ${id}`);
      return sum + (b.to - b.from);
    }, 0);

  const confirmed = Object.keys(result.assignment.confirmed).length;
  const rac = Object.keys(result.assignment.rac).length;
  const seated = confirmed + rac;
  const confirmedSegments = segmentsOf(result.assignment.confirmed);
  const certificates = result.events.flatMap((e) => (e.outcome.kind === 'rejected' ? [e.outcome.certificate] : []));
  const capacitySegments = coach.berths * n;

  return {
    requested: requests.length,
    confirmed,
    rac,
    seated,
    rejected: requests.length - seated,
    forced: certificates.filter((c) => c.kind === 'forced').length,
    strategyInduced: certificates.filter((c) => c.kind === 'strategy-induced').length,
    passengerSegmentsSeated: confirmedSegments + segmentsOf(result.assignment.rac),
    utilization: confirmedSegments / capacitySegments,
    idleBerthSegments: capacitySegments - confirmedSegments,
  };
}
