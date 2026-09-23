// Tier 1 Best-fit (SPEC 4.3).
import type { Booking } from '../types';
import type { OccupancyGrid } from '../coach';

/** Free berth with the smallest gap around b (ties -> lowest index), or null if none is free. */
export function bestFit(b: Booking, grid: OccupancyGrid): number | null {
  throw new Error('not implemented');
}
