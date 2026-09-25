// Exhaustive max-seatable subset for small inputs (m ≤ 14) (SPEC 14.2). Independent of the engine.
import type { Booking } from '../../src/engine/types';

/** Largest subset with load ≤ capacity on every segment, by trying all 2^m subsets. */
export function bruteForceMaxSeated(bookings: Booking[], capacity: number, n: number): number {
  const m = bookings.length;
  if (m > 14) throw new Error(`Brute force is limited to 14 bookings, got ${m}`);
  // covering[j] = bitmask of bookings on segment j.
  const covering = Array.from({ length: n }, (_, j) =>
    bookings.reduce((mask, b, i) => (b.from <= j && j < b.to ? mask | (1 << i) : mask), 0));
  const popcount = (x: number) => { let c = 0; for (; x; x &= x - 1) c++; return c; };

  let best = 0;
  for (let subset = 0; subset < 1 << m; subset++) {
    const size = popcount(subset);
    if (size > best && covering.every((mask) => popcount(subset & mask) <= capacity)) best = size;
  }
  return best;
}
