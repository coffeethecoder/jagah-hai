import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { runOfflineOptimum, runOnline } from '../../src/engine/simulate';
import { arbInstance, lineRoute, toBookings } from '../helpers/generators';

const ONLINE = ['first-fit', 'best-fit', 'random-fit', 'deferred'] as const;

describe('simulate', () => {
  it('event log length equals requests; counts add up', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), ({ n, capacity, bookings }, seed) => {
      for (const s of ONLINE) {
        const run = runOnline(s, bookings, lineRoute(n), { berths: capacity, racBerths: 0 }, seed);
        expect(run.events.map((e) => e.booking)).toEqual(bookings);
        const m = run.metrics;
        expect(m.requested).toBe(bookings.length);
        expect(m.seated + m.rejected).toBe(m.requested);
        expect(m.forced + m.strategyInduced).toBe(m.rejected);
      }
    }), { numRuns: 200 });
  });

  it('load arrays consistent with placements', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), ({ n, capacity, bookings }, seed) => {
      for (const s of ONLINE) {
        const run = runOnline(s, bookings, lineRoute(n), { berths: capacity, racBerths: 0 }, seed);
        const inPool = run.events.filter((e) => e.outcome.kind !== 'rejected').map((e) => e.booking);
        run.events.forEach((e, step) => {
          const sofar = inPool.filter((b) => b.arrival <= step);
          const expected = Array.from({ length: n }, (_, j) => sofar.filter((b) => b.from <= j && j < b.to).length);
          expect(e.confirmedLoad).toEqual(expected);
          expect(e.racLoad).toEqual(new Array(n).fill(0));
          if (e.outcome.kind === 'placed') expect(run.assignment.confirmed[e.booking.id]).toBe(e.outcome.index);
        });
      }
    }), { numRuns: 200 });
  });

  it('utilization and idle berth-segments', () => {
    // n = 4, k = 2: seat [0,4) and [1,3) -> 6 of 8 berth-segments used.
    const run = runOnline('first-fit', toBookings([{ from: 0, to: 4 }, { from: 1, to: 3 }]), lineRoute(4), { berths: 2, racBerths: 0 }, 1);
    expect(run.metrics).toMatchObject({ passengerSegmentsSeated: 6, utilization: 0.75, idleBerthSegments: 2 });
  });

  it('rejects invalid input', () => {
    const route = lineRoute(3);
    const ok = toBookings([{ from: 0, to: 1 }]);
    expect(() => runOnline('first-fit', toBookings([{ from: 0, to: 4 }]), route, { berths: 1, racBerths: 0 }, 1)).toThrow();
    expect(() => runOnline('first-fit', [...ok, ...ok], route, { berths: 1, racBerths: 0 }, 1)).toThrow();
    expect(() => runOnline('first-fit', ok, route, { berths: 0, racBerths: 0 }, 1)).toThrow();
    expect(() => runOfflineOptimum(ok, route, { berths: 1, racBerths: 2 })).toThrow(); // RAC arrives in Phase 7
  });
});
