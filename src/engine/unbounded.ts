// Unbounded mode: berths First-fit needs vs ω (SPEC 4.6).
import type { Booking } from './types';
import { OccupancyGrid } from './coach';
import { validateBooking } from './interval';
import { firstFit } from './strategies/firstFit';

/**
 * Berths First-fit opens when it must seat every request, in arrival order, with no capacity limit.
 * Compare with ω = peakLoad(requests, n), the minimum possible (Theorem 1).
 */
export function firstFitBerthsNeeded(requests: Booking[], n: number): number {
  // One row per request is always enough, so First-fit never runs out; it opens row i only when rows 0 … i-1 are busy.
  const grid = new OccupancyGrid(requests.length, n);
  let opened = 0;
  for (const b of requests) {
    validateBooking(b, n);
    const i = firstFit(b, grid)!;
    grid.place(i, b);
    opened = Math.max(opened, i + 1);
  }
  return opened;
}
