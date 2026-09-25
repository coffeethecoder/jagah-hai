// Tier 3 offline optimum (SPEC 4.5).
import type { Booking } from '../types';

const byStart = (a: Booking, b: Booking) => a.from - b.from || a.to - b.to || a.id - b.id;

/**
 * Maximum-size subset of bookings with peak load ≤ capacity (Algorithm 4.5).
 * Returned in (from, to, id) order. Arrival order is ignored.
 */
export function selectOptimum(bookings: Booking[], capacity: number): Booking[] {
  if (!Number.isInteger(capacity) || capacity < 0) throw new Error(`Capacity must be an integer ≥ 0, got ${capacity}`);
  const kept: Booking[] = [];
  for (const b of bookings.slice().sort(byStart)) {
    kept.push(b);
    const active = kept.filter((x) => x.from <= b.from && b.from < x.to); // passengers on segment b.from
    if (active.length > capacity) {
      // Drop the one ending last (ties: largest id). One drop suffices: load rose by exactly 1.
      const drop = active.reduce((w, x) => (x.to > w.to || (x.to === w.to && x.id > w.id) ? x : w));
      kept.splice(kept.indexOf(drop), 1);
    }
  }
  return kept;
}
