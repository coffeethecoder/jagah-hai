// Bookings as half-open intervals [from, to) (SPEC 3.2, 3.3).
import type { Booking } from './types';

/** Touching bookings (a.to === b.from) do not overlap. */
export function overlaps(a: Booking, b: Booking): boolean {
  return a.from < b.to && b.from < a.to;
}

/** Segment indices occupied by b: from … to-1. */
export function segmentsOf(b: Booking): number[] {
  const out: number[] = [];
  for (let j = b.from; j < b.to; j++) out.push(j);
  return out;
}

/** Throws unless from and to are integers with 0 ≤ from < to ≤ n. */
export function validateBooking(b: Booking, n: number): void {
  if (!Number.isInteger(b.from) || !Number.isInteger(b.to)) {
    throw new Error(`Booking ${b.id}: from and to must be integers, got [${b.from}, ${b.to})`);
  }
  if (!(0 <= b.from && b.from < b.to && b.to <= n)) {
    throw new Error(`Booking ${b.id}: need 0 ≤ from < to ≤ ${n}, got [${b.from}, ${b.to})`);
  }
}
