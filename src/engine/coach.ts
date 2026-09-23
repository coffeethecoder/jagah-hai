// Occupancy grid for one pool (SPEC 4.3) and berth labels (SPEC 13.3).
import type { Booking } from './types';

/** `capacity` rows (berths, or RAC slots) × n segments. */
export class OccupancyGrid {
  constructor(capacity: number, n: number) {
    throw new Error('not implemented');
  }
  /** True if row `index` is empty on every segment of b. */
  isFree(index: number, b: Booking): boolean {
    throw new Error('not implemented');
  }
  place(index: number, b: Booking): void {
    throw new Error('not implemented');
  }
}

/** Display label for a 0-based berth index, e.g. 0 -> "1 LB", 6 -> "7 SL". */
export function berthLabel(index: number): string {
  throw new Error('not implemented');
}
