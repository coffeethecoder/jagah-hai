// Forced / strategy-induced certificates for rejections (SPEC 6).
import type { Booking, Certificate, Pool } from './types';

export function certify(b: Booking, pool: Pool, poolBookings: Booking[], capacity: number, n: number): Certificate {
  throw new Error('not implemented');
}
