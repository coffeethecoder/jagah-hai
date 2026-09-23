// Tier 1 Random-fit (SPEC 4.3).
import type { Booking } from '../types';
import type { OccupancyGrid } from '../coach';
import type { Rng } from '../rng';

/** Uniformly random free berth for b, or null if none is free. */
export function randomFit(b: Booking, grid: OccupancyGrid, rng: Rng): number | null {
  throw new Error('not implemented');
}
