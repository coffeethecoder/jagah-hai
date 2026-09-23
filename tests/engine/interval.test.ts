import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { overlaps, segmentsOf, validateBooking } from '../../src/engine/interval';
import type { Booking } from '../../src/engine/types';
import { arbInterval, toBookings } from '../helpers/generators';

const bk = (from: number, to: number, id = 0): Booking => ({ id, from, to, arrival: id, isTatkal: false });

describe('interval', () => {
  it('touching bookings [0,2) and [2,4) do not overlap', () => {
    expect(overlaps(bk(0, 2), bk(2, 4))).toBe(false);
    expect(overlaps(bk(2, 4), bk(0, 2))).toBe(false);
  });

  it('nested and partial overlaps overlap', () => {
    expect(overlaps(bk(0, 5), bk(1, 3))).toBe(true); // nested
    expect(overlaps(bk(1, 3), bk(0, 5))).toBe(true);
    expect(overlaps(bk(0, 3), bk(2, 5))).toBe(true); // partial
    expect(overlaps(bk(2, 5), bk(0, 3))).toBe(true);
    expect(overlaps(bk(1, 2), bk(1, 2))).toBe(true); // identical
  });

  it('disjoint bookings do not overlap', () => {
    expect(overlaps(bk(0, 1), bk(3, 4))).toBe(false);
  });

  it('overlap is reflexive, symmetric, and matches "share a segment"', () => {
    fc.assert(fc.property(fc.array(arbInterval(8), { minLength: 2, maxLength: 2 }), (ivs) => {
      const [a, b] = toBookings(ivs);
      expect(overlaps(a, a)).toBe(true);
      expect(overlaps(a, b)).toBe(overlaps(b, a));
      const shared = segmentsOf(a).some((j) => segmentsOf(b).includes(j));
      expect(overlaps(a, b)).toBe(shared);
    }));
  });

  it('segmentsOf lists from … to-1', () => {
    expect(segmentsOf(bk(2, 5))).toEqual([2, 3, 4]);
    expect(segmentsOf(bk(0, 1))).toEqual([0]);
  });

  it('from >= to throws', () => {
    expect(() => validateBooking(bk(3, 3), 5)).toThrow();
    expect(() => validateBooking(bk(4, 2), 5)).toThrow();
  });

  it('out-of-route and non-integer bookings throw', () => {
    expect(() => validateBooking(bk(-1, 2), 5)).toThrow();
    expect(() => validateBooking(bk(0, 6), 5)).toThrow();
    expect(() => validateBooking(bk(0.5, 2), 5)).toThrow();
  });

  it('valid bookings pass, including the full route', () => {
    expect(() => validateBooking(bk(0, 5), 5)).not.toThrow();
    expect(() => validateBooking(bk(4, 5), 5)).not.toThrow();
  });
});
