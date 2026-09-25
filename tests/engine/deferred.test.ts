import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { LoadProfile } from '../../src/engine/load';
import { canAccept } from '../../src/engine/strategies/deferred';
import { runOnline } from '../../src/engine/simulate';
import type { Booking } from '../../src/engine/types';
import { arbInstance, lineRoute, toBookings } from '../helpers/generators';

const bk = (from: number, to: number, id = 0): Booking => ({ id, from, to, arrival: id, isTatkal: false });

describe('deferred', () => {
  it('accepts iff range load < k', () => {
    const load = new LoadProfile(4);
    load.add(bk(0, 2, 0));
    load.add(bk(1, 3, 1));          // load: 1 2 1 0
    expect(canAccept(bk(1, 2), load, 2)).toBe(false);
    expect(canAccept(bk(0, 4), load, 2)).toBe(false);
    expect(canAccept(bk(2, 4), load, 2)).toBe(true);
    expect(canAccept(bk(0, 1), load, 2)).toBe(true);
    expect(canAccept(bk(1, 2), load, 3)).toBe(true);
  });

  it('bookings stay pending until charting, then all get berths', () => {
    const requests = toBookings([{ from: 2, to: 3 }, { from: 1, to: 3 }, { from: 0, to: 1 }, { from: 0, to: 2 }]);
    const run = runOnline('deferred', requests, lineRoute(3), { berths: 2, racBerths: 0 }, 1);
    expect(run.tier).toBe(2);
    expect(run.events.map((e) => e.outcome.kind)).toEqual(['pending', 'pending', 'pending', 'pending']);
    expect(Object.keys(run.assignment.confirmed).length).toBe(4);
  });

  it('charting always succeeds and there are zero strategy-induced rejections', () => {
    fc.assert(fc.property(arbInstance, ({ n, capacity, bookings }) => {
      const run = runOnline('deferred', bookings, lineRoute(n), { berths: capacity, racBerths: 0 }, 1);
      const pending = run.events.filter((e) => e.outcome.kind === 'pending').map((e) => e.booking.id);
      expect(Object.keys(run.assignment.confirmed).map(Number).sort((a, b) => a - b)).toEqual(pending);
      expect(run.metrics.strategyInduced).toBe(0);
      expect(run.metrics.forced).toBe(run.metrics.rejected);
    }), { numRuns: 200 });
  });

  it('Tier 1 can seat more than Tier 2 on a single instance (SPEC 4.1)', () => {
    // FF rejects [2,4) (strategy-induced), which leaves room for [2,3) and [3,4).
    // Deferred accepts [2,4), filling segments 2 and 3, and then must reject both.
    const requests = toBookings([
      { from: 3, to: 4 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 4 }, { from: 2, to: 3 }, { from: 3, to: 4 },
    ]);
    const coach = { berths: 2, racBerths: 0 };
    expect(runOnline('first-fit', requests, lineRoute(4), coach, 1).metrics.seated).toBe(5);
    expect(runOnline('deferred', requests, lineRoute(4), coach, 1).metrics.seated).toBe(4);
  });
});
