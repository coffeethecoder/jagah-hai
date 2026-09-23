// Tier 2 deferred assignment (SPEC 4.4).
import type { Booking } from '../types';
import type { LoadProfile } from '../load';

/** Accept iff load(j) < capacity for every j in [b.from, b.to). */
export function canAccept(b: Booking, load: LoadProfile, capacity: number): boolean {
  throw new Error('not implemented');
}

/** Charting: assign all accepted bookings with EST. */
export function chart(accepted: Booking[], capacity: number): Record<number, number> {
  throw new Error('not implemented');
}
