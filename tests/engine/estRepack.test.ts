import { describe, expect, it } from 'vitest';
import { estRepack } from '../../src/engine/estRepack';
import { overlaps } from '../../src/engine/interval';
import type { Booking } from '../../src/engine/types';

const bk = (from: number, to: number, id: number): Booking => ({ id, from, to, arrival: id, isTatkal: false });

/** Throws unless every booking has a berth in [0, capacity) and no berth holds two overlapping bookings. */
function expectValid(bookings: Booking[], assignment: Record<number, number>, capacity: number) {
  expect(Object.keys(assignment).length).toBe(bookings.length);
  for (const b of bookings) {
    expect(assignment[b.id]).toBeGreaterThanOrEqual(0);
    expect(assignment[b.id]).toBeLessThan(capacity);
  }
  for (const a of bookings) for (const b of bookings) {
    if (a.id < b.id && overlaps(a, b)) expect(assignment[a.id]).not.toBe(assignment[b.id]);
  }
}

describe('estRepack', () => {
  // seg:          0  1  2  3  4
  // id 0 [2,5)          x  x  x
  // id 1 [0,2)    x  x
  // id 2 [0,3)    x  x  x
  // id 3 [3,4)             x
  // load:         2  2  2  2  1   -> L = 2
  const example = [bk(2, 5, 0), bk(0, 2, 1), bk(0, 3, 2), bk(3, 4, 3)];

  it('hand example fits exactly L berths, in EST order', () => {
    // Sorted by (from, to, id): 1 [0,2) -> 0, 2 [0,3) -> 1, 0 [2,5) -> 0, 3 [3,4) -> 1.
    const a = estRepack(example, 2);
    expect(a).toEqual({ 0: 0, 1: 0, 2: 1, 3: 1 });
    expectValid(example, a, 2);
  });

  it('extra capacity is not used: only berths below L', () => {
    expect(estRepack(example, 4)).toEqual({ 0: 0, 1: 0, 2: 1, 3: 1 });
  });

  it('throws when peakLoad > capacity', () => {
    expect(() => estRepack(example, 1)).toThrow();
    expect(() => estRepack([bk(0, 1, 0)], 0)).toThrow();
  });

  it('touching bookings share one berth', () => {
    const chain = [bk(4, 6, 0), bk(0, 2, 1), bk(2, 4, 2)];
    expect(estRepack(chain, 1)).toEqual({ 0: 0, 1: 0, 2: 0 });
  });

  it('output has no overlapping pair on a berth', () => {
    const many = [bk(0, 3, 0), bk(1, 4, 1), bk(2, 5, 2), bk(3, 6, 3), bk(0, 1, 4), bk(4, 6, 5), bk(1, 2, 6)];
    expectValid(many, estRepack(many, 3), 3);
  });

  it('empty input gives an empty assignment', () => {
    expect(estRepack([], 0)).toEqual({});
  });

  it('rejects duplicate ids and bad capacity', () => {
    expect(() => estRepack([bk(0, 1, 7), bk(2, 3, 7)], 2)).toThrow();
    expect(() => estRepack([], -1)).toThrow();
  });
});
