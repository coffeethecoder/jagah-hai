// Tier 1 Random-fit (SPEC 4.3).
import type { Booking } from '../types';
import type { OccupancyGrid } from '../coach';
import type { Rng } from '../rng';

/** Uniformly random free berth for b, or null if none is free (no random number is drawn then). */
export function randomFit(b: Booking, grid: OccupancyGrid, rng: Rng): number | null {
  const free: number[] = [];
  for (let i = 0; i < grid.capacity; i++) if (grid.isFree(i, b)) free.push(i);
  return free.length === 0 ? null : rng.pick(free);
}
