import { describe, expect, it } from 'vitest';
import { OccupancyGrid } from '../../src/engine/coach';
import { firstFit } from '../../src/engine/strategies/firstFit';
import { runOnline } from '../../src/engine/simulate';
import type { Booking } from '../../src/engine/types';
import { lineRoute, toBookings } from '../helpers/generators';

const bk = (from: number, to: number, id = 0): Booking => ({ id, from, to, arrival: id, isTatkal: false });

describe('firstFit', () => {
  it('chooses the lowest free berth', () => {
    const g = new OccupancyGrid(3, 4);
    expect(firstFit(bk(0, 2), g)).toBe(0);
    g.place(0, bk(0, 2, 0));
    expect(firstFit(bk(1, 3), g)).toBe(1);
    expect(firstFit(bk(2, 4), g)).toBe(0); // touching the booking on berth 0
  });

  it('returns null when no berth is free', () => {
    const g = new OccupancyGrid(1, 3);
    g.place(0, bk(0, 3, 0));
    expect(firstFit(bk(1, 2), g)).toBeNull();
  });

  it('rejects a request that fits (strategy-induced fragmentation example)', () => {
    // k = 2, n = 3. FF: [2,3) -> 0, [1,3) -> 1, [0,1) -> 0. Then [0,2) finds berth 0 busy on
    // segment 0 and berth 1 busy on segment 1, although each of those segments carries only 1 passenger.
    const requests = toBookings([{ from: 2, to: 3 }, { from: 1, to: 3 }, { from: 0, to: 1 }, { from: 0, to: 2 }]);
    const run = runOnline('first-fit', requests, lineRoute(3), { berths: 2, racBerths: 0 }, 1);
    expect(run.assignment.confirmed).toEqual({ 0: 0, 1: 1, 2: 0 });
    const last = run.events[3].outcome;
    expect(last.kind).toBe('rejected');
    if (last.kind === 'rejected') {
      expect(last.certificate).toMatchObject({ kind: 'strategy-induced', pool: 'confirmed', maxLoadOnRange: 1 });
    }
    expect(run.metrics).toMatchObject({ seated: 3, rejected: 1, forced: 0, strategyInduced: 1 });
  });
});
