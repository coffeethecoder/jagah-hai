// Confirmed + RAC pool logic (SPEC 5).
import type { CoachConfig, Pool } from './types';

/** Capacity of a pool: k berths for confirmed, 2r slots for RAC. */
export function poolCapacity(coach: CoachConfig, pool: Pool): number {
  throw new Error('not implemented');
}
