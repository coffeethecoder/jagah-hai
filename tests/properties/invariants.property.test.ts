import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { estRepack } from '../../src/engine/estRepack';
import { overlaps } from '../../src/engine/interval';
import { peakLoad } from '../../src/engine/load';
import { createRng } from '../../src/engine/rng';
import { runOfflineOptimum, runOnline } from '../../src/engine/simulate';
import type { RunResult } from '../../src/engine/types';
import { bruteForceMaxSeated } from '../helpers/bruteForce';
import { arbInstance, lineRoute, type Instance } from '../helpers/generators';

fc.configureGlobal({ numRuns: 500 });

const ONLINE = ['first-fit', 'best-fit', 'random-fit', 'deferred'] as const;

/** Every strategy on the same stream (paired design). */
function runAll({ n, capacity, bookings }: Instance, seed: number): RunResult[] {
  const coach = { berths: capacity, racBerths: 0 };
  return [...ONLINE.map((s) => runOnline(s, bookings, lineRoute(n), coach, seed)), runOfflineOptimum(bookings, lineRoute(n), coach)];
}

describe('invariants (fast-check, >= 500 runs each)', () => {
  it('1. no double-booking in any final assignment', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), (inst, seed) => {
      for (const run of runAll(inst, seed)) {
        const a = run.assignment.confirmed;
        const seated = inst.bookings.filter((b) => b.id in a);
        expect(seated.length).toBe(Object.keys(a).length); // no unknown ids
        for (const b of seated) {
          expect(a[b.id]).toBeGreaterThanOrEqual(0);
          expect(a[b.id]).toBeLessThan(inst.capacity);
        }
        for (const x of seated) for (const y of seated) {
          if (x.id < y.id && overlaps(x, y)) expect(a[x.id]).not.toBe(a[y.id]);
        }
      }
    }));
  });

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

  it('3. offline optimum seated equals brute force', () => {
    fc.assert(fc.property(arbInstance, ({ n, capacity, bookings }) => {
      const run = runOfflineOptimum(bookings, lineRoute(n), { berths: capacity, racBerths: 0 });
      expect(run.metrics.seated).toBe(bruteForceMaxSeated(bookings, capacity, n));
    }));
  });

  it('4. Tier 3 seated >= every Tier 1 strategy and Tier 2', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), (inst, seed) => {
      const runs = runAll(inst, seed);
      const optimum = runs[runs.length - 1].metrics.seated;
      for (const run of runs) expect(optimum).toBeGreaterThanOrEqual(run.metrics.seated);
    }));
  });

  it('5. Tier 2 has zero strategy-induced rejections', () => {
    fc.assert(fc.property(arbInstance, ({ n, capacity, bookings }) => {
      const run = runOnline('deferred', bookings, lineRoute(n), { berths: capacity, racBerths: 0 }, 1);
      expect(run.metrics.strategyInduced).toBe(0);
    }));
  });

  it('6. certificates are sound', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), ({ n, capacity, bookings }, seed) => {
      for (const s of ONLINE) {
        const run = runOnline(s, bookings, lineRoute(n), { berths: capacity, racBerths: 0 }, seed);
        const pool: typeof bookings = [];   // placed (Tier 1) or pending (Tier 2) before this step
        for (const { booking: b, outcome } of run.events) {
          if (outcome.kind !== 'rejected') { pool.push(b); continue; }
          const c = outcome.certificate;
          const onSegment = (j: number) => pool.filter((x) => x.from <= j && j < x.to);
          const rangeMax = Math.max(...Array.from({ length: b.to - b.from }, (_, i) => onSegment(b.from + i).length));
          if (c.kind === 'forced') {
            expect(c.segment).toBeGreaterThanOrEqual(b.from);
            expect(c.segment).toBeLessThan(b.to);
            expect(c.occupants.slice().sort((x, y) => x - y)).toEqual(onSegment(c.segment).map((x) => x.id));
            expect(c.occupants.length).toBe(capacity);
          } else {
            expect(c.maxLoadOnRange).toBe(rangeMax);
            expect(rangeMax).toBeLessThan(capacity);
            const all = [...pool, b];
            expect(Object.keys(c.witness).length).toBe(all.length);
            for (const x of all) {
              expect(c.witness[x.id]).toBeGreaterThanOrEqual(0);
              expect(c.witness[x.id]).toBeLessThan(capacity);
            }
            for (const x of all) for (const y of all) {
              if (x.id < y.id && overlaps(x, y)) expect(c.witness[x.id]).not.toBe(c.witness[y.id]);
            }
          }
        }
      }
    }));
  });

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
  it('7. determinism: identical inputs and seed give identical RunResult', () => {
    fc.assert(fc.property(arbInstance, fc.integer(), (inst, seed) => {
      expect(runAll(inst, seed)).toEqual(runAll(inst, seed));
    }));
  });
});
