// Tier 2 deferred assignment (SPEC 4.4).
import type { Booking } from '../types';
import type { LoadProfile } from '../load';
import { estRepack } from '../estRepack';

/** Accept iff load(j) < capacity for every j in [b.from, b.to), i.e. accepting keeps L ≤ capacity. */
export function canAccept(b: Booking, load: LoadProfile, capacity: number): boolean {
  return load.maxOnRange(b.from, b.to) < capacity;
}

/** Charting: assign all accepted bookings with EST. Always succeeds by Theorem 1. */
export function chart(accepted: Booking[], capacity: number): Record<number, number> {
  return estRepack(accepted, capacity);
}
