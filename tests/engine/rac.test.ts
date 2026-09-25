import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createHash } from 'node:crypto';
import { OccupancyGrid } from '../../src/engine/coach';
import { overlaps } from '../../src/engine/interval';
import { peakLoad } from '../../src/engine/load';
import { offlineAssignment, poolCapacity } from '../../src/engine/rac';
import { selectOptimum } from '../../src/engine/strategies/offlineOptimum';
import { runOfflineOptimum, runOnline } from '../../src/engine/simulate';
import type { Booking, CoachConfig, Pool, RunResult } from '../../src/engine/types';
import { bruteForceMaxSeated } from '../helpers/bruteForce';
import { arbInstance, lineRoute, toBookings } from '../helpers/generators';

const ONLINE = ['first-fit', 'best-fit', 'random-fit', 'deferred'] as const;
const arbRac = fc.tuple(arbInstance, fc.integer({ min: 0, max: 2 }), fc.integer());
const POOLS: Pool[] = ['confirmed', 'rac'];

function runAll(n: number, bookings: Booking[], coach: CoachConfig, seed: number): RunResult[] {
  return [...ONLINE.map((s) => runOnline(s, bookings, lineRoute(n), coach, seed)), runOfflineOptimum(bookings, lineRoute(n), coach)];
}

/** Every booking in `ids` has an index below capacity and no two overlapping bookings share one. */
function expectValidPool(bookings: Booking[], ids: Record<number, number>, capacity: number) {
  const members = bookings.filter((b) => b.id in ids);
  expect(members.length).toBe(Object.keys(ids).length);
  for (const b of members) {
    expect(ids[b.id]).toBeGreaterThanOrEqual(0);
    expect(ids[b.id]).toBeLessThan(capacity);
  }
  for (const x of members) for (const y of members) {
    if (x.id < y.id && overlaps(x, y)) expect(ids[x.id]).not.toBe(ids[y.id]);
  }
}

const maxOn = (load: number[], b: Booking) => Math.max(...load.slice(b.from, b.to));

describe('rac', () => {
  it('r = 0 is identical to no-RAC: reproduces the pre-RAC engine byte for byte', () => {
    // Digest of these 300 instances × 5 strategies, computed with the engine before RAC was added (Phase 6).
    const out = fc.sample(arbInstance, { seed: 42, numRuns: 300 })
      .map(({ n, capacity, bookings }, i) => runAll(n, bookings, { berths: capacity, racBerths: 0 }, i));
    expect(createHash('sha256').update(JSON.stringify(out)).digest('hex'))
      .toBe('74972dd851245752af44f7e7027167e91fdd6425eaad7b9a6470a76095cec143');
  });

  it('RAC takes a passenger only when no confirmed berth is free (hand example)', () => {
    // k = 1, r = 1, n = 2. [0,2) takes the berth; [0,1) and [1,2) go to RAC and share slot 0 (they touch).
    const b = toBookings([{ from: 0, to: 2 }, { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 0, to: 2 }, { from: 0, to: 2 }]);
    const run = runOnline('first-fit', b, lineRoute(2), { berths: 1, racBerths: 1 }, 1);
    expect(run.events.map((e) => e.outcome)).toMatchObject([
      { kind: 'placed', pool: 'confirmed', index: 0 },
      { kind: 'placed', pool: 'rac', index: 0 },
      { kind: 'placed', pool: 'rac', index: 0 },
      { kind: 'placed', pool: 'rac', index: 1 },
      { kind: 'rejected', certificate: { kind: 'forced', pool: 'confirmed', segment: 0 } },
    ]);
    expect(run.metrics).toMatchObject({ confirmed: 1, rac: 3, seated: 4, utilization: 1 });
    expect(run.events[4].racLoad).toEqual([2, 2]);
  });

  it('both pools fragmented: the certificate points at the confirmed pool, which is tried first', () => {
    // Random-fit, seed 1, k = 2, r = 1, n = 4. Request 6 [0,3) meets confirmed load ≤ 1 and RAC load ≤ 1
    // on its range, yet no berth or slot is free end to end.
    const b = toBookings([
      { from: 2, to: 4 }, { from: 1, to: 2 }, { from: 3, to: 4 }, { from: 2, to: 4 }, { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 },
    ]);
    const e = runOnline('random-fit', b, lineRoute(4), { berths: 2, racBerths: 1 }, 1).events[6];
    expect(maxOn(e.confirmedLoad, e.booking)).toBeLessThan(2);
    expect(maxOn(e.racLoad, e.booking)).toBeLessThan(2);
    expect(e.outcome).toMatchObject({ kind: 'rejected', certificate: { kind: 'strategy-induced', pool: 'confirmed' } });
  });

  it('pool capacity: k berths, 2r slots', () => {
    expect(poolCapacity({ berths: 72, racBerths: 9 }, 'confirmed')).toBe(72);
    expect(poolCapacity({ berths: 72, racBerths: 9 }, 'rac')).toBe(18);
  });

  it('slots never overbooked; every pool assignment is valid, in every tier', () => {
    fc.assert(fc.property(arbRac, ([{ n, capacity, bookings }, r, seed]) => {
      const coach = { berths: capacity, racBerths: r };
      for (const run of runAll(n, bookings, coach, seed)) {
        for (const pool of POOLS) expectValidPool(bookings, run.assignment[pool], poolCapacity(coach, pool));
        expect(run.metrics.seated).toBe(run.metrics.confirmed + run.metrics.rac);
        // Online: every accepted booking ends in its pool's final assignment (Tier 2: after charting both pools).
        if (run.tier === 3) continue;
        for (const e of run.events) {
          if (e.outcome.kind === 'rejected') continue;
          expect(e.booking.id in run.assignment[e.outcome.pool]).toBe(true);
          if (e.outcome.kind === 'placed') expect(run.assignment[e.outcome.pool][e.booking.id]).toBe(e.outcome.index);
        }
        expect(run.events.filter((e) => e.outcome.kind === 'rejected').length).toBe(run.metrics.rejected);
      }
    }), { numRuns: 500 });
  });

  it('RAC used only when the confirmed pool cannot fit', () => {
    fc.assert(fc.property(arbRac, ([{ n, capacity, bookings }, r, seed]) => {
      const coach = { berths: capacity, racBerths: r };
      for (const s of ONLINE) {
        const run = runOnline(s, bookings, lineRoute(n), coach, seed);
        const confirmed = new OccupancyGrid(capacity, n); // replay of the confirmed pool, Tier 1
        let before = new Array<number>(n).fill(0);        // confirmed load before this step
        for (const e of run.events) {
          if (e.outcome.kind !== 'rejected' && e.outcome.pool === 'rac') {
            if (s === 'deferred') expect(maxOn(before, e.booking)).toBe(capacity);
            else for (let i = 0; i < capacity; i++) expect(confirmed.isFree(i, e.booking)).toBe(false);
          }
          if (e.outcome.kind === 'placed' && e.outcome.pool === 'confirmed') confirmed.place(e.outcome.index, e.booking);
          before = e.confirmedLoad;
        }
      }
    }), { numRuns: 500 });
  });

  it('Tier 2 with RAC: zero strategy-induced rejections', () => {
    fc.assert(fc.property(arbRac, ([{ n, capacity, bookings }, r]) => {
      expect(runOnline('deferred', bookings, lineRoute(n), { berths: capacity, racBerths: r }, 1).metrics.strategyInduced).toBe(0);
    }), { numRuns: 500 });
  });

  it('Tier 3 with RAC seats the brute-force maximum for k + 2r places (Lemma 2), at least every online tier', () => {
    fc.assert(fc.property(arbRac, ([{ n, capacity, bookings }, r, seed]) => {
      const runs = runAll(n, bookings, { berths: capacity, racBerths: r }, seed);
      const optimum = runs[4].metrics.seated;
      expect(optimum).toBe(bruteForceMaxSeated(bookings, capacity + 2 * r, n));
      for (const run of runs) expect(optimum).toBeGreaterThanOrEqual(run.metrics.seated);
    }), { numRuns: 500 });
  });

  it('certificates with RAC are sound', () => {
    fc.assert(fc.property(arbRac, ([{ n, capacity, bookings }, r, seed]) => {
      const coach = { berths: capacity, racBerths: r };
      for (const s of ONLINE) {
        const run = runOnline(s, bookings, lineRoute(n), coach, seed);
        const inPool: Record<Pool, Booking[]> = { confirmed: [], rac: [] };
        for (const e of run.events) {
          const { booking: b, outcome } = e;
          if (outcome.kind !== 'rejected') { inPool[outcome.pool].push(b); continue; }
          const c = outcome.certificate;
          // A rejection leaves the loads unchanged, so the event's loads are the loads it met.
          const confirmedFull = maxOn(e.confirmedLoad, b) === capacity;
          const racFull = r === 0 || maxOn(e.racLoad, b) === 2 * r;
          if (c.kind === 'forced') {
            expect(confirmedFull && racFull).toBe(true);
            expect(c.pool).toBe('confirmed');
            expect(e.confirmedLoad[c.segment]).toBe(capacity);
            expect(c.occupants.slice().sort((x, y) => x - y))
              .toEqual(inPool.confirmed.filter((x) => x.from <= c.segment && c.segment < x.to).map((x) => x.id));
          } else {
            const load = c.pool === 'confirmed' ? e.confirmedLoad : e.racLoad;
            expect(c.maxLoadOnRange).toBe(maxOn(load, b));
            expect(c.maxLoadOnRange).toBeLessThan(poolCapacity(coach, c.pool));
            if (c.pool === 'rac') expect(confirmedFull).toBe(true); // confirmed is tried first
            const all = [...inPool[c.pool], b];
            expectValidPool(all, c.witness, poolCapacity(coach, c.pool));
            expect(b.id in c.witness).toBe(true);
          }
        }
      }
    }), { numRuns: 500 });
  });

  it('Tier 3 split stays valid where SPEC 5.1\'s split would overfill RAC', () => {
    // k = 1, r = 1, n = 4. All five fit 3 places. Algorithm 4.5 with k = 1 on them confirms [0,2) and [3,4),
    // leaving [1,3), [1,4), [2,4) for 2 RAC slots: all three cover segment 2.
    const b = toBookings([{ from: 3, to: 4 }, { from: 2, to: 4 }, { from: 1, to: 4 }, { from: 0, to: 2 }, { from: 1, to: 3 }]);
    const specConfirmed = new Set(selectOptimum(b, 1).map((x) => x.id));
    expect(peakLoad(b.filter((x) => !specConfirmed.has(x.id)), 4)).toBe(3);

    const a = offlineAssignment(b, { berths: 1, racBerths: 1 });
    expect(Object.keys(a.confirmed).length + Object.keys(a.rac).length).toBe(5);
    expectValidPool(b, a.confirmed, 1);
    expectValidPool(b, a.rac, 2);
  });
});
