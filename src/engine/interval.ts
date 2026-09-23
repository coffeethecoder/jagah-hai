// Bookings as half-open intervals [from, to) (SPEC 3.2, 3.3).
import type { Booking } from './types';

export function overlaps(a: Booking, b: Booking): boolean {
  throw new Error('not implemented');
}

/** Segment indices occupied by b: from … to-1. */
export function segmentsOf(b: Booking): number[] {
  throw new Error('not implemented');
}

/** Throws unless 0 ≤ from < to ≤ n. */
export function validateBooking(b: Booking, n: number): void {
  throw new Error('not implemented');
}
