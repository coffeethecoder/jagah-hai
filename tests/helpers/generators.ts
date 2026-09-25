// fast-check arbitraries for bookings (SPEC 14.2): n ∈ [2, 8] segments, m ∈ [1, 12] bookings, capacity ∈ [1, 4].
import fc from 'fast-check';
import type { Booking, Route } from '../../src/engine/types';

/** A plain route with n segments: stations S0 … Sn. */
export const lineRoute = (n: number): Route => ({
  id: `line-${n}`, name: `Line ${n}`, trainNumber: null, source: 'test',
  stations: Array.from({ length: n + 1 }, (_, i) => ({ code: `S${i}`, name: `S${i}` })),
});

export interface Instance { n: number; capacity: number; bookings: Booking[] }

/** A valid interval [from, to) with 0 ≤ from < to ≤ n. */
export const arbInterval = (n: number): fc.Arbitrary<{ from: number; to: number }> =>
  fc.integer({ min: 0, max: n - 1 }).chain((from) => fc.integer({ min: from + 1, max: n }).map((to) => ({ from, to })));

/** Bookings get id = arrival = array index. */
export const toBookings = (intervals: { from: number; to: number }[]): Booking[] =>
  intervals.map(({ from, to }, i) => ({ id: i, from, to, arrival: i, isTatkal: false }));

export const arbInstance: fc.Arbitrary<Instance> = fc.integer({ min: 2, max: 8 }).chain((n) =>
  fc.record({
    n: fc.constant(n),
    capacity: fc.integer({ min: 1, max: 4 }),
    bookings: fc.array(arbInterval(n), { minLength: 1, maxLength: 12 }).map(toBookings),
  }),
);
