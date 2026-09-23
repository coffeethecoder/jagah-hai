import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { LoadProfile, peakLoad } from '../../src/engine/load';
import type { Booking } from '../../src/engine/types';
import { arbInstance } from '../helpers/generators';

const bk = (from: number, to: number, id = 0): Booking => ({ id, from, to, arrival: id, isTatkal: false });

// Straight from the definition: load(j) = |{ b : b.from ≤ j < b.to }|.
const loadByDefinition = (bookings: Booking[], n: number) =>
  Array.from({ length: n }, (_, j) => bookings.filter((b) => b.from <= j && j < b.to).length);

describe('load', () => {
  // seg:        0  1  2  3  4
  // [0,2)       x  x
  // [1,4)          x  x  x
  // [2,5)             x  x  x
  // [3,5)                x  x
  // load:       1  2  2  3  2
  const example = [bk(0, 2, 0), bk(1, 4, 1), bk(2, 5, 2), bk(3, 5, 3)];

  it('peak on a hand-made example', () => {
    const p = new LoadProfile(5);
    example.forEach((b) => p.add(b));
    expect(p.toArray()).toEqual([1, 2, 2, 3, 2]);
    expect(p.peak()).toBe(3);
    expect(p.at(3)).toBe(3);
    expect(peakLoad(example, 5)).toBe(3);
  });

  it('maxOnRange and argmaxOnRange (ties go to the lowest segment)', () => {
    const p = new LoadProfile(5);
    example.forEach((b) => p.add(b));
    expect(p.maxOnRange(0, 1)).toBe(1);
    expect(p.maxOnRange(0, 3)).toBe(2);
    expect(p.maxOnRange(0, 5)).toBe(3);
    expect(p.argmaxOnRange(0, 5)).toBe(3);
    expect(p.argmaxOnRange(1, 3)).toBe(1);
    expect(p.argmaxOnRange(4, 5)).toBe(4);
  });

  it('touching bookings never add up', () => {
    expect(peakLoad([bk(0, 2, 0), bk(2, 4, 1), bk(4, 6, 2)], 6)).toBe(1);
  });

  it('empty profile has peak 0', () => {
    expect(new LoadProfile(3).peak()).toBe(0);
    expect(peakLoad([], 3)).toBe(0);
  });

  it('matches the definition of load and peak', () => {
    fc.assert(fc.property(arbInstance, ({ n, bookings }) => {
      const p = new LoadProfile(n);
      bookings.forEach((b) => p.add(b));
      const expected = loadByDefinition(bookings, n);
      expect(p.toArray()).toEqual(expected);
      expect(peakLoad(bookings, n)).toBe(Math.max(...expected));
    }));
  });

  it('add/remove symmetry', () => {
    fc.assert(fc.property(arbInstance, fc.integer({ min: 0, max: 12 }), ({ n, bookings }, cut) => {
      const p = new LoadProfile(n);
      bookings.forEach((b) => p.add(b));
      bookings.slice(0, cut).forEach((b) => p.remove(b));
      expect(p.toArray()).toEqual(loadByDefinition(bookings.slice(cut), n));
    }));
  });

  it('removing a booking that was never added throws and changes nothing', () => {
    const p = new LoadProfile(4);
    p.add(bk(0, 2));
    expect(() => p.remove(bk(1, 3))).toThrow();
    expect(p.toArray()).toEqual([1, 1, 0, 0]);
  });

  it('rejects bad ranges, bad bookings and bad n', () => {
    const p = new LoadProfile(4);
    expect(() => p.at(4)).toThrow();
    expect(() => p.maxOnRange(2, 2)).toThrow();
    expect(() => p.maxOnRange(0, 5)).toThrow();
    expect(() => p.add(bk(0, 5))).toThrow();
    expect(() => new LoadProfile(0)).toThrow();
  });
});
