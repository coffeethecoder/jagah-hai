// Forced / strategy-induced certificates for rejections (SPEC 6).
import type { Booking, Certificate, Pool } from './types';
import { LoadProfile } from './load';
import { estRepack } from './estRepack';

/**
 * Certificate for rejecting b from one pool holding poolBookings.
 * Forced if the pool is full on some segment of b; otherwise strategy-induced, with an EST witness
 * that seats poolBookings ∪ {b} (Theorem 1).
 */
export function certify(b: Booking, pool: Pool, poolBookings: Booking[], capacity: number, n: number): Certificate {
  const load = new LoadProfile(n);
  for (const x of poolBookings) load.add(x);
  const segment = load.argmaxOnRange(b.from, b.to);
  const maxLoadOnRange = load.at(segment);

  if (maxLoadOnRange > capacity) throw new Error(`Pool ${pool} is over capacity ${capacity} at segment ${segment}`);
  if (maxLoadOnRange === capacity) {
    const occupants = poolBookings.filter((x) => x.from <= segment && segment < x.to).map((x) => x.id);
    return { kind: 'forced', pool, segment, occupants };
  }
  return { kind: 'strategy-induced', pool, maxLoadOnRange, witness: estRepack([...poolBookings, b], capacity) };
}
