// Segment load and peak load (SPEC 3.5).
import type { Booking } from './types';
import { validateBooking } from './interval';

export class LoadProfile {
  private readonly counts: number[];

  constructor(readonly n: number) {
    if (!Number.isInteger(n) || n < 1) throw new Error(`A route needs at least 1 segment, got ${n}`);
    this.counts = new Array<number>(n).fill(0);
  }

  add(b: Booking): void {
    validateBooking(b, this.n);
    for (let j = b.from; j < b.to; j++) this.counts[j]++;
  }

  /** Throws if b was not added (some segment would go negative); the profile is left unchanged. */
  remove(b: Booking): void {
    validateBooking(b, this.n);
    for (let j = b.from; j < b.to; j++) {
      if (this.counts[j] === 0) throw new Error(`Booking ${b.id} is not in this load profile`);
    }
    for (let j = b.from; j < b.to; j++) this.counts[j]--;
  }

  at(j: number): number {
    this.checkRange(j, j + 1);
    return this.counts[j];
  }

  /** Max load over segments [from, to). */
  maxOnRange(from: number, to: number): number {
    return this.counts[this.argmaxOnRange(from, to)];
  }

  /** Segment in [from, to) with the highest load; ties go to the lowest index. */
  argmaxOnRange(from: number, to: number): number {
    this.checkRange(from, to);
    let best = from;
    for (let j = from + 1; j < to; j++) if (this.counts[j] > this.counts[best]) best = j;
    return best;
  }

  peak(): number {
    return this.maxOnRange(0, this.n);
  }

  toArray(): number[] {
    return this.counts.slice();
  }

  private checkRange(from: number, to: number): void {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= to || to > this.n) {
      throw new Error(`Segment range [${from}, ${to}) is outside [0, ${this.n})`);
    }
  }
}

export function peakLoad(bookings: Booking[], n: number): number {
  const profile = new LoadProfile(n);
  for (const b of bookings) profile.add(b);
  return profile.peak();
}
