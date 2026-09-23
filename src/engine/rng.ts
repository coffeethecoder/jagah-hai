// Seeded RNG (mulberry32) and helpers. The only source of randomness in the engine.

export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(xs: T[]): T;
  shuffle<T>(xs: T[]): T[];
  weighted(weights: number[]): number;
}

export function createRng(seed: number): Rng {
  throw new Error('not implemented');
}
