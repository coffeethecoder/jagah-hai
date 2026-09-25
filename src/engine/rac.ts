// Confirmed + RAC pool logic (SPEC 5, 6). The RAC pool is 2r unit slots; slots 2i and 2i+1 share RAC berth i.
import type { Assignment, Booking, Certificate, CoachConfig, Pool } from './types';
import { certify } from './certify';
import { estRepack } from './estRepack';
import { selectOptimum } from './strategies/offlineOptimum';

/** Capacity of a pool: k berths for confirmed, 2r slots for RAC. */
export function poolCapacity(coach: CoachConfig, pool: Pool): number {
  return pool === 'confirmed' ? coach.berths : 2 * coach.racBerths;
}

/**
 * SPEC 6 with RAC: forced iff every pool the booking could use is full somewhere on its range.
 * Otherwise strategy-induced, with a witness in the first pool that had room (confirmed, then RAC).
 * When both pools are full the certificate names the confirmed pool; the RAC pool's full segment
 * is in the event's racLoad. With r = 0 this is exactly `certify` on the confirmed pool.
 */
export function certifyPools(b: Booking, confirmed: Booking[], rac: Booking[], coach: CoachConfig, n: number): Certificate {
  const c = certify(b, 'confirmed', confirmed, coach.berths, n);
  if (c.kind === 'strategy-induced' || coach.racBerths === 0) return c;
  const r = certify(b, 'rac', rac, poolCapacity(coach, 'rac'), n);
  return r.kind === 'strategy-induced' ? r : c;
}

/**
 * Tier 3 with RAC: the most passengers that fit k + 2r places (Algorithm 4.5), seated with EST on all
 * k + 2r places; places 0 … k-1 are confirmed berths, the rest RAC slots. Always a valid split (each part
 * is a set of EST chains). Deviation from SPEC 5.1's split, which can overfill RAC: see docs/DECISIONS.md.
 */
export function offlineAssignment(requests: Booking[], coach: CoachConfig): Assignment {
  const k = coach.berths;
  const places = k + poolCapacity(coach, 'rac');
  const out: Assignment = { confirmed: {}, rac: {} };
  for (const [id, place] of Object.entries(estRepack(selectOptimum(requests, places), places))) {
    if (place < k) out.confirmed[Number(id)] = place;
    else out.rac[Number(id)] = place - k;
  }
  return out;
}
