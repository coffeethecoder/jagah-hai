// Segment load and peak load (SPEC 3.5).
import type { Booking } from './types';

export class LoadProfile {
  constructor(n: number) {
    throw new Error('not implemented');
  }
  add(b: Booking): void {
    throw new Error('not implemented');
  }
  remove(b: Booking): void {
    throw new Error('not implemented');
  }
  at(j: number): number {
    throw new Error('not implemented');
  }
  maxOnRange(from: number, to: number): number {
    throw new Error('not implemented');
  }
  argmaxOnRange(from: number, to: number): number {
    throw new Error('not implemented');
  }
  peak(): number {
    throw new Error('not implemented');
  }
  toArray(): number[] {
    throw new Error('not implemented');
  }
}

export function peakLoad(bookings: Booking[], n: number): number {
  throw new Error('not implemented');
}
