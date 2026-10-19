import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { rechart, recoverWaitlist } from '../../src/engine/recover';
import { estRepack } from '../../src/engine/estRepack';
import { peakLoad } from '../../src/engine/load';
import { arbInstance, toBookings } from '../helpers/generators';
import type { Booking } from '../../src/engine/types';

const ids = (xs: { id: number }[]) => xs.map((x) => x.id).sort((a, b) => a - b);

/** Largest T ⊆ waitlisted with load(seated ∪ T) ≤ capacity everywhere, by trying every subset. Independent of the engine. */
function bruteForce(seated: Booking[], waitlisted: Booking[], capacity: number, n: number): number {
  const base = new Array<number>(n).fill(0);
  for (const b of seated) for (let j = b.from; j < b.to; j++) base[j]++;
  let best = 0;
  for (let subset = 0; subset < 1 << waitlisted.length; subset++) {
    const load = base.slice();
    let size = 0;
    waitlisted.forEach((b, i) => { if (subset & (1 << i)) { size++; for (let j = b.from; j < b.to; j++) load[j]++; } });
    if (size > best && load.every((x) => x <= capacity)) best = size;
  }
  return best;
}

describe('recoverWaitlist', () => {
  it('seats the passenger First-fit turned away in the smallest example', () => {
    // k = 2. Berth 1: [0,1), [2,3). Berth 2: [1,3). Waitlisted: [0,2), which fits once [0,1) and [1,3) share a berth.
    const [a, b, c, w] = toBookings([{ from: 0, to: 1 }, { from: 2, to: 3 }, { from: 1, to: 3 }, { from: 0, to: 2 }]);
    expect(ids(recoverWaitlist([a, b, c], [w], 2, 3))).toEqual([3]);
    expect(() => estRepack([a, b, c, w], 2)).not.toThrow();
  });

  it('leaves a passenger whose journey crosses a full segment', () => {
    const [a, b, w] = toBookings([{ from: 0, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 2 }]);
    expect(recoverWaitlist([a, b], [w], 2, 3)).toEqual([]);
  });

  it('prefers two short journeys to the long one that blocks them', () => {
    // k = 1, nobody seated. [0,4) alone, or [0,2) + [2,4).
    const w = toBookings([{ from: 0, to: 4 }, { from: 0, to: 2 }, { from: 2, to: 4 }]);
    expect(ids(recoverWaitlist([], w, 1, 4))).toEqual([1, 2]);
  });

  it('recovers nobody when there is no waitlist', () => {
    expect(recoverWaitlist(toBookings([{ from: 0, to: 1 }]), [], 1, 2)).toEqual([]);
  });

  it('equals brute force over every subset of the waitlist, and the result is seatable', () => {
    // Split a random instance: a booking is seated if the coin says so and it still fits; everyone else is waitlisted.
    const arb = arbInstance.chain((inst) => fc.array(fc.boolean(), { minLength: inst.bookings.length, maxLength: inst.bookings.length }).map((coins) => ({ ...inst, coins })));
    fc.assert(fc.property(arb, ({ n, capacity, bookings, coins }) => {
      const seated: Booking[] = [];
      const waitlisted: Booking[] = [];
      bookings.forEach((b, i) => (coins[i] && peakLoad([...seated, b], n) <= capacity ? seated : waitlisted).push(b));

      const recovered = recoverWaitlist(seated, waitlisted, capacity, n);
      expect(recovered.length).toBe(bruteForce(seated, waitlisted, capacity, n));
      expect(recovered.every((b) => waitlisted.includes(b))).toBe(true);
      expect(new Set(ids(recovered)).size).toBe(recovered.length);
      expect(() => estRepack([...seated, ...recovered], capacity)).not.toThrow();
    }), { numRuns: 500 });
  });

  it('re-charts pool by pool: nobody changes pool, nobody shares a place with an overlapping trip', () => {
    const arb = arbInstance.chain((inst) => fc.array(fc.integer({ min: 0, max: 2 }), { minLength: inst.bookings.length, maxLength: inst.bookings.length })
      .map((where) => ({ ...inst, where })));
    fc.assert(fc.property(arb, fc.integer({ min: 0, max: 1 }), ({ n, capacity, bookings, where }, r) => {
      const coach = { berths: capacity, racBerths: r };
      const seated: Record<'confirmed' | 'rac', Booking[]> = { confirmed: [], rac: [] };
      const waitlisted: Booking[] = [];
      bookings.forEach((b, i) => {
        const pool = where[i] === 0 ? 'confirmed' : where[i] === 1 && r > 0 ? 'rac' : null;
        const cap = pool === 'confirmed' ? capacity : 2 * r;
        (pool && peakLoad([...seated[pool], b], n) <= cap ? seated[pool] : waitlisted).push(b);
      });

      const { assignment, added } = rechart(seated, waitlisted, coach, n);
      for (const pool of ['confirmed', 'rac'] as const) {
        for (const b of seated[pool]) expect(assignment[pool]).toHaveProperty(String(b.id));
        const placed = bookings.filter((b) => b.id in assignment[pool]);
        for (const a of placed) for (const b of placed) {
          if (a.id < b.id && assignment[pool][a.id] === assignment[pool][b.id]) expect(a.to <= b.from || b.to <= a.from).toBe(true);
        }
      }
      expect(added.every((b) => waitlisted.includes(b))).toBe(true);
      if (r === 0) expect(added.length).toBe(bruteForce(seated.confirmed, waitlisted, capacity, n));
    }), { numRuns: 500 });
  });
});
