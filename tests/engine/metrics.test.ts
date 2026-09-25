import { describe, expect, it } from 'vitest';
import { computeMetrics } from '../../src/engine/metrics';
import { toBookings } from '../helpers/generators';
import type { Booking, StepEvent } from '../../src/engine/types';

describe('metrics', () => {
  // n = 4, k = 2. Requests: [0,4) [1,3) [0,1) [2,3).
  const requests = toBookings([{ from: 0, to: 4 }, { from: 1, to: 3 }, { from: 0, to: 1 }, { from: 2, to: 3 }]);
  const rejected = (b: Booking, kind: 'forced' | 'strategy-induced'): StepEvent => ({
    booking: b, confirmedLoad: [], racLoad: [],
    outcome: {
      kind: 'rejected',
      certificate: kind === 'forced'
        ? { kind, pool: 'confirmed', segment: 2, occupants: [0, 1] }
        : { kind, pool: 'confirmed', maxLoadOnRange: 1, witness: {} },
    },
  });

  it('counts, passenger-segments, utilization and idle berth-segments', () => {
    const m = computeMetrics({
      strategy: 'first-fit', tier: 1,
      events: [rejected(requests[2], 'strategy-induced'), rejected(requests[3], 'forced')],
      assignment: { confirmed: { 0: 0, 1: 1 }, rac: {} },
    }, requests, { berths: 2, racBerths: 0 }, 4);
    expect(m).toEqual({
      requested: 4, confirmed: 2, rac: 0, seated: 2, rejected: 2, forced: 1, strategyInduced: 1,
      passengerSegmentsSeated: 6, utilization: 6 / 8, idleBerthSegments: 2,
    });
  });

  it('RAC passengers count as seated but not towards berth utilization', () => {
    const m = computeMetrics({
      strategy: 'first-fit', tier: 1, events: [], assignment: { confirmed: { 0: 0 }, rac: { 2: 0 } },
    }, requests, { berths: 2, racBerths: 1 }, 4);
    expect(m).toMatchObject({ confirmed: 1, rac: 1, seated: 2, passengerSegmentsSeated: 5, utilization: 4 / 8, idleBerthSegments: 4 });
  });

  it('throws on an assignment id that is not a request', () => {
    expect(() => computeMetrics({
      strategy: 'first-fit', tier: 1, events: [], assignment: { confirmed: { 99: 0 }, rac: {} },
    }, requests, { berths: 2, racBerths: 0 }, 4)).toThrow();
  });
});
