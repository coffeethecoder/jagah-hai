import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { firstFitBerthsNeeded } from '../../src/engine/unbounded';
import { peakLoad } from '../../src/engine/load';
import { arbInstance, toBookings } from '../helpers/generators';

describe('unbounded', () => {
  it('FF >= omega always', () => {
    fc.assert(fc.property(arbInstance, ({ n, bookings }) => {
      expect(firstFitBerthsNeeded(bookings, n)).toBeGreaterThanOrEqual(peakLoad(bookings, n));
    }), { numRuns: 500 });
  });

  it('start-sorted input gives FF = omega exactly', () => {
    fc.assert(fc.property(arbInstance, ({ n, bookings }) => {
      const sorted = bookings.slice().sort((a, b) => a.from - b.from);
      expect(firstFitBerthsNeeded(sorted, n)).toBe(peakLoad(bookings, n));
    }), { numRuns: 500 });
  });

  it('FF can need more than omega (the fragmentation example)', () => {
    // [2,3) -> 0, [1,3) -> 1, [0,1) -> 0, then [0,2) finds both busy and opens berth 2. ω = 2.
    const b = toBookings([{ from: 2, to: 3 }, { from: 1, to: 3 }, { from: 0, to: 1 }, { from: 0, to: 2 }]);
    expect(peakLoad(b, 3)).toBe(2);
    expect(firstFitBerthsNeeded(b, 3)).toBe(3);
  });

  it('empty stream needs 0 berths; invalid bookings throw', () => {
    expect(firstFitBerthsNeeded([], 3)).toBe(0);
    expect(() => firstFitBerthsNeeded(toBookings([{ from: 0, to: 4 }]), 3)).toThrow();
  });
});
