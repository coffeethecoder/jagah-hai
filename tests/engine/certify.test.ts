import { describe, expect, it } from 'vitest';
import { certify } from '../../src/engine/certify';
import { overlaps } from '../../src/engine/interval';
import type { Booking } from '../../src/engine/types';
import { toBookings } from '../helpers/generators';

const bk = (from: number, to: number, id: number): Booking => ({ id, from, to, arrival: id, isTatkal: false });

describe('certify', () => {
  // n = 4, k = 2. Pool load: 1 2 1 0.
  const pool = toBookings([{ from: 0, to: 2 }, { from: 1, to: 3 }]);

  it('forced certificate names a full segment with exactly k occupants', () => {
    const c = certify(bk(0, 4, 9), 'confirmed', pool, 2, 4);
    expect(c).toEqual({ kind: 'forced', pool: 'confirmed', segment: 1, occupants: [0, 1] });
  });

  it('forced picks the first full segment on the range', () => {
    const three = [...pool, bk(2, 4, 2)]; // load: 1 2 2 1
    const c = certify(bk(1, 4, 9), 'confirmed', three, 2, 4);
    expect(c).toMatchObject({ kind: 'forced', segment: 1 });
  });

  it('witness is a valid assignment including the rejected booking', () => {
    // [2,4) sees load 1 0 < 2 on its range: strategy-induced.
    const b = bk(2, 4, 9);
    const c = certify(b, 'confirmed', pool, 2, 4);
    expect(c.kind).toBe('strategy-induced');
    if (c.kind !== 'strategy-induced') return;
    expect(c.maxLoadOnRange).toBe(1);
    const all = [...pool, b];
    expect(Object.keys(c.witness).map(Number).sort()).toEqual(all.map((x) => x.id).sort());
    for (const x of all) for (const y of all) {
      if (x.id < y.id && overlaps(x, y)) expect(c.witness[x.id]).not.toBe(c.witness[y.id]);
    }
    for (const x of all) expect(c.witness[x.id]).toBeLessThan(2);
  });

  it('touching bookings do not make a segment full', () => {
    // Pool full on segment 1 only; [2,3) touches it and is not blocked by it.
    const c = certify(bk(2, 3, 9), 'confirmed', pool, 2, 4);
    expect(c.kind).toBe('strategy-induced');
  });

  it('empty RAC pool (capacity 0) is forced with no occupants', () => {
    expect(certify(bk(0, 1, 9), 'rac', [], 0, 3)).toEqual({ kind: 'forced', pool: 'rac', segment: 0, occupants: [] });
  });

  it('throws on an over-capacity pool', () => {
    expect(() => certify(bk(0, 4, 9), 'confirmed', pool, 1, 4)).toThrow();
  });
});
