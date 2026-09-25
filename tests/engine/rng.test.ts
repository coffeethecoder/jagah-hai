import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, deriveSeed } from '../../src/engine/rng';

const take = (seed: number, count: number) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('rng', () => {
  it('same seed gives the same sequence', () => {
    fc.assert(fc.property(fc.integer(), (seed) => {
      expect(take(seed, 50)).toEqual(take(seed, 50));
    }));
  });

  it('different seeds give different sequences', () => {
    expect(take(1, 10)).not.toEqual(take(2, 10));
  });

  it('sequence is stable across versions (experiments depend on it)', () => {
    // Pinned output of mulberry32 for seed 1. If this changes, every published run changes.
    expect(take(1, 3)).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
  });

  it('next is in [0, 1)', () => {
    for (const x of take(7, 10_000)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('int stays within bounds', () => {
    fc.assert(fc.property(fc.integer(), fc.integer({ min: 1, max: 1000 }), (seed, max) => {
      const rng = createRng(seed);
      for (let i = 0; i < 20; i++) {
        const v = rng.int(max);
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(max);
      }
    }));
  });

  it('int rejects a bound below 1 or a fraction', () => {
    const rng = createRng(1);
    expect(() => rng.int(0)).toThrow();
    expect(() => rng.int(2.5)).toThrow();
  });

  it('deriveSeed gives deterministic, distinct integer sub-stream seeds', () => {
    fc.assert(fc.property(fc.integer(), (seed) => {
      const a = deriveSeed(seed, 1);
      expect(Number.isInteger(a)).toBe(true);
      expect(a).toBe(deriveSeed(seed, 1));
      expect(a).not.toBe(deriveSeed(seed, 2));
      expect(take(a, 3)).not.toEqual(take(seed, 3));
    }));
    expect(() => deriveSeed(1.5, 1)).toThrow();
  });

  it('rejects a non-integer seed', () => {
    expect(() => createRng(1.5)).toThrow();
  });

  it('weighted never picks a zero weight', () => {
    const rng = createRng(3);
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < 20_000; i++) counts[rng.weighted([0, 3, 0, 1, 0])]++;
    expect(counts[0] + counts[2] + counts[4]).toBe(0);
    expect(counts[1] / 20_000).toBeCloseTo(0.75, 1);
  });

  it('weighted rejects negative, non-finite and all-zero weights', () => {
    const rng = createRng(1);
    expect(() => rng.weighted([1, -1])).toThrow();
    expect(() => rng.weighted([1, NaN])).toThrow();
    expect(() => rng.weighted([0, 0])).toThrow();
    expect(() => rng.weighted([])).toThrow();
  });

  it('shuffle returns a permutation and leaves the input alone', () => {
    fc.assert(fc.property(fc.integer(), fc.array(fc.integer()), (seed, xs) => {
      const before = xs.slice();
      const out = createRng(seed).shuffle(xs);
      expect(xs).toEqual(before);
      expect(out.slice().sort((a, b) => a - b)).toEqual(xs.slice().sort((a, b) => a - b));
    }));
  });

  it('pick returns an element and rejects an empty array', () => {
    const rng = createRng(5);
    const xs = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) expect(xs).toContain(rng.pick(xs));
    expect(() => rng.pick([])).toThrow();
  });
});
