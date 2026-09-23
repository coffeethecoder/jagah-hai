// Tier 1 First-fit (SPEC 4.3).
import type { Booking } from '../types';
import type { OccupancyGrid } from '../coach';

/** Lowest-index free berth for b, or null if none is free. */
export function firstFit(b: Booking, grid: OccupancyGrid): number | null {
  throw new Error('not implemented');
}
