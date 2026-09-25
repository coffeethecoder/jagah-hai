// Tier 1 Best-fit (SPEC 4.3).
import type { Booking } from '../types';
import type { OccupancyGrid } from '../coach';

/**
 * Wasted gap around b on a berth that is free for b:
 * (b.from - prevEnd) + (nextStart - b.to), where prevEnd is the latest `to` ≤ b.from on the berth (0 if none)
 * and nextStart is the earliest `from` ≥ b.to (n if none).
 */
export function gap(b: Booking, grid: OccupancyGrid, index: number): number {
  let prevEnd = 0;
  for (let j = b.from - 1; j >= 0; j--) {
    if (grid.occupant(index, j) !== null) { prevEnd = j + 1; break; }
  }
  let nextStart = grid.n;
  for (let j = b.to; j < grid.n; j++) {
    if (grid.occupant(index, j) !== null) { nextStart = j; break; }
  }
  return (b.from - prevEnd) + (nextStart - b.to);
}

/** Free berth with the smallest gap around b (ties -> lowest index), or null if none is free. */
export function bestFit(b: Booking, grid: OccupancyGrid): number | null {
  let best: number | null = null;
  let bestGap = Infinity;
  for (let i = 0; i < grid.capacity; i++) {
    if (!grid.isFree(i, b)) continue;
    const g = gap(b, grid, i);
    if (g < bestGap) { best = i; bestGap = g; }
  }
  return best;
}
