import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { estRepack } from '../../src/engine/estRepack';
import { overlaps } from '../../src/engine/interval';
import { peakLoad } from '../../src/engine/load';
import { createRng } from '../../src/engine/rng';
import { arbInstance } from '../helpers/generators';

fc.configureGlobal({ numRuns: 500 });

describe('invariants (fast-check, >= 500 runs each)', () => {
  it.todo('1. no double-booking in any final assignment');

  it('2. Theorem 1: estRepack succeeds iff peakLoad <= k, using exactly L berths', () => {
    fc.assert(fc.property(arbInstance, ({ n, capacity, bookings }) => {
      const L = peakLoad(bookings, n);
      if (L > capacity) {
        expect(() => estRepack(bookings, capacity)).toThrow();
        return;
      }
      const a = estRepack(bookings, capacity);
      for (const b of bookings) {
        expect(a[b.id]).toBeGreaterThanOrEqual(0);
        expect(a[b.id]).toBeLessThan(capacity);
      }
      for (const x of bookings) for (const y of bookings) {
        if (x.id < y.id && overlaps(x, y)) expect(a[x.id]).not.toBe(a[y.id]);
      }
      // Dilworth: exactly L chains, and EST's lowest-index rule keeps them in berths 0 … L-1.
      expect(new Set(Object.values(a))).toEqual(new Set(Array.from({ length: L }, (_, i) => i)));
    }));
  });

  it.todo('3. offline optimum seated equals brute force');
  it.todo('4. Tier 3 seated >= every Tier 1 strategy and Tier 2');
  it.todo('5. Tier 2 has zero strategy-induced rejections');
  it.todo('6. certificates are sound');

  it('7. determinism: rng sequences and estRepack', () => {
    fc.assert(fc.property(fc.integer(), (seed) => {
      const run = () => {
        const rng = createRng(seed);
        return [rng.next(), rng.int(10), rng.pick(['a', 'b', 'c']), rng.shuffle([1, 2, 3, 4, 5]), rng.weighted([1, 0, 2])];
      };
      expect(run()).toEqual(run());
    }));
    // EST sorts its input, so the arrival order of the same bookings does not change the result.
    fc.assert(fc.property(arbInstance, fc.integer(), ({ n, bookings }, seed) => {
      const L = peakLoad(bookings, n);
      expect(estRepack(createRng(seed).shuffle(bookings), L)).toEqual(estRepack(bookings, L));
    }));
  });
  it.todo('7. determinism: identical inputs and seed give identical RunResult (Phase 2)');
});
