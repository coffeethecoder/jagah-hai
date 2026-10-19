// Re-charting the waitlist: the most waitlisted bookings that fit beside everyone already seated (docs/MATH.md, Section 7).
import type { Assignment, Booking, CoachConfig, Pool } from './types';
import { LoadProfile } from './load';
import { estRepack } from './estRepack';
import { poolCapacity } from './rac';

/**
 * The largest subset of `waitlisted` that can join `seated` on `capacity` places with nobody dropped.
 * By Theorem 1 the union is seatable iff no segment carries more than `capacity`, so EST then seats it.
 * Greedy: earliest alighting first, accept if every segment of the journey still has room (optimal: Proposition 7).
 */
export function recoverWaitlist(seated: Booking[], waitlisted: Booking[], capacity: number, n: number): Booking[] {
  const load = new LoadProfile(n);
  for (const b of seated) load.add(b);
  const out: Booking[] = [];
  for (const b of waitlisted.slice().sort((x, y) => x.to - y.to || x.id - y.id)) {
    if (load.maxOnRange(b.from, b.to) >= capacity) continue;
    load.add(b);
    out.push(b);
  }
  return out;
}

/**
 * Re-chart a Tier 1 coach once booking has closed. Everyone seated keeps a place in their own pool (some move),
 * and the waitlist fills what is left: confirmed berths first, then RAC places. With RAC this is a valid seating
 * but not claimed to be the joint maximum over both pools (docs/MATH.md Section 7, remark iii).
 */
export function rechart(seated: Record<Pool, Booking[]>, waitlisted: Booking[], coach: CoachConfig, n: number): { assignment: Assignment; added: Booking[] } {
  const assignment: Assignment = { confirmed: {}, rac: {} };
  const added: Booking[] = [];
  let left = waitlisted;
  for (const pool of ['confirmed', 'rac'] as const) {
    const capacity = poolCapacity(coach, pool);
    const more = capacity > 0 ? recoverWaitlist(seated[pool], left, capacity, n) : [];
    left = left.filter((b) => !more.includes(b));
    added.push(...more);
    assignment[pool] = estRepack([...seated[pool], ...more], capacity);
  }
  return { assignment, added };
}
