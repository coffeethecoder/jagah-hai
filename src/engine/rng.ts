// Seeded RNG (mulberry32) and helpers. The only source of randomness in the engine.

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  pick<T>(xs: T[]): T;
  /** Fisher–Yates shuffle of a copy; the input is not modified. */
  shuffle<T>(xs: T[]): T[];
  /** Index i chosen with probability weights[i] / sum. Zero weights are never chosen. */
  weighted(weights: number[]): number;
}

/**
 * A separate integer seed for a numbered sub-stream (e.g. demand vs random-fit), so one run seed
 * never feeds two consumers the same sequence. Integer hash mix (murmur3 finaliser).
 */
export function deriveSeed(seed: number, stream: number): number {
  if (!Number.isInteger(seed) || !Number.isInteger(stream)) throw new Error(`deriveSeed needs integers, got ${seed}, ${stream}`);
  let h = Math.imul(seed ^ Math.imul(stream + 1, 0x9e3779b9), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h | 0;
}

export function createRng(seed: number): Rng {
  if (!Number.isInteger(seed)) throw new Error(`Seed must be an integer, got ${seed}`);
  let a = seed | 0;

  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (maxExclusive: number): number => {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
      throw new Error(`int() needs a positive integer bound, got ${maxExclusive}`);
    }
    return Math.floor(next() * maxExclusive);
  };

  return {
    next,
    int,
    pick<T>(xs: T[]): T {
      if (xs.length === 0) throw new Error('pick() from an empty array');
      return xs[int(xs.length)];
    },
    shuffle<T>(xs: T[]): T[] {
      const out = xs.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    weighted(weights: number[]): number {
      let total = 0;
      for (const w of weights) {
        if (!Number.isFinite(w) || w < 0) throw new Error(`Weights must be finite and ≥ 0, got ${w}`);
        total += w;
      }
      if (total <= 0) throw new Error('weighted() needs at least one positive weight');
      const r = next() * total;
      let cum = 0;
      let lastPositive = -1;
      for (let i = 0; i < weights.length; i++) {
        if (weights[i] === 0) continue;
        cum += weights[i];
        lastPositive = i;
        if (r < cum) return i;
      }
      return lastPositive; // floating-point rounding left r at the very top of the range
    },
  };
}
