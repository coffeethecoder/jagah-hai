// Algorithm EST: earliest-start greedy repack (SPEC 4.2).
import type { Booking } from './types';

/**
 * Returns bookingId -> berth index in [0, capacity).
 * Throws if peakLoad > capacity: by Theorem 1, EST fails exactly when no assignment exists.
 */
export function estRepack(bookings: Booking[], capacity: number): Record<number, number> {
  if (!Number.isInteger(capacity) || capacity < 0) throw new Error(`Capacity must be an integer ≥ 0, got ${capacity}`);

  const sorted = bookings.slice().sort((a, b) => a.from - b.from || a.to - b.to || a.id - b.id);
  const lastEnd = new Array<number>(capacity).fill(0);
  const out: Record<number, number> = {};

  for (const b of sorted) {
    if (b.id in out) throw new Error(`Duplicate booking id ${b.id}`);
    const i = lastEnd.findIndex((end) => end <= b.from);
    if (i === -1) throw new Error(`Peak load exceeds capacity ${capacity} at segment ${b.from}`);
    out[b.id] = i;
    lastEnd[i] = b.to;
  }
  return out;
}
