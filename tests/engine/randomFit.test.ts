import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { OccupancyGrid } from '../../src/engine/coach';
import { createRng } from '../../src/engine/rng';
import { randomFit } from '../../src/engine/strategies/randomFit';
import { runOnline } from '../../src/engine/simulate';
import type { Booking } from '../../src/engine/types';
import { arbInstance, lineRoute } from '../helpers/generators';

const bk = (from: number, to: number, id = 0): Booking => ({ id, from, to, arrival: id, isTatkal: false });

describe('randomFit', () => {
  it('deterministic for a seed', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), ({ n, capacity, bookings }, seed) => {
      const coach = { berths: capacity, racBerths: 0 };
      expect(runOnline('random-fit', bookings, lineRoute(n), coach, seed))
        .toEqual(runOnline('random-fit', bookings, lineRoute(n), coach, seed));
    }), { numRuns: 200 });
  });

  it('only picks free berths', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), ({ n, capacity, bookings }, seed) => {
      const g = new OccupancyGrid(capacity, n);
      const rng = createRng(seed);
      for (const b of bookings) {
        const i = randomFit(b, g, rng);
        const anyFree = Array.from({ length: capacity }, (_, j) => g.isFree(j, b)).some(Boolean);
        if (i === null) expect(anyFree).toBe(false);
        else {
          expect(g.isFree(i, b)).toBe(true);
          g.place(i, b);
        }
      }
    }), { numRuns: 200 });
  });

  it('uses every free berth over many draws', () => {
    const g = new OccupancyGrid(4, 2);
    g.place(2, bk(0, 2, 0));
    const rng = createRng(9);
    const seen = new Set<number | null>();
    for (let i = 0; i < 200; i++) seen.add(randomFit(bk(0, 1, 1), g, rng));
    expect(seen).toEqual(new Set([0, 1, 3]));
  });
});
