// Occupancy grid for one pool (SPEC 4.3) and berth labels (SPEC 13.3).
import type { Booking } from './types';
import { validateBooking } from './interval';

/** `capacity` rows (berths, or RAC slots) × n segments; each cell holds a booking id or null. */
export class OccupancyGrid {
  private readonly occ: (number | null)[][];

  constructor(readonly capacity: number, readonly n: number) {
    if (!Number.isInteger(capacity) || capacity < 0) throw new Error(`Capacity must be an integer ≥ 0, got ${capacity}`);
    if (!Number.isInteger(n) || n < 1) throw new Error(`A route needs at least 1 segment, got ${n}`);
    this.occ = Array.from({ length: capacity }, () => new Array<number | null>(n).fill(null));
  }

  /** True if row `index` is empty on every segment of b. */
  isFree(index: number, b: Booking): boolean {
    const row = this.row(index);
    validateBooking(b, this.n);
    for (let j = b.from; j < b.to; j++) if (row[j] !== null) return false;
    return true;
  }

  /** Throws if the row is not free for b. */
  place(index: number, b: Booking): void {
    if (!this.isFree(index, b)) throw new Error(`Row ${index} is not free for booking ${b.id}`);
    const row = this.row(index);
    for (let j = b.from; j < b.to; j++) row[j] = b.id;
  }

  private row(index: number): (number | null)[] {
    if (!Number.isInteger(index) || index < 0 || index >= this.capacity) {
      throw new Error(`Row ${index} is outside [0, ${this.capacity})`);
    }
    return this.occ[index];
  }
}

// Sleeper-coach bay: 6 main berths then 2 side berths (display only; SPEC 13.3).
const BAY = ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'];

/** Display label for a 0-based berth index, e.g. 0 -> "1 LB", 6 -> "7 SL". */
export function berthLabel(index: number): string {
  if (!Number.isInteger(index) || index < 0) throw new Error(`Berth index must be an integer ≥ 0, got ${index}`);
  return `${index + 1} ${BAY[index % BAY.length]}`;
}
