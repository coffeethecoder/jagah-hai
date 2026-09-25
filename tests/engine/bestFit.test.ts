import { describe, expect, it } from 'vitest';
import { OccupancyGrid } from '../../src/engine/coach';
import { bestFit, gap } from '../../src/engine/strategies/bestFit';
import { runOnline } from '../../src/engine/simulate';
import type { Booking } from '../../src/engine/types';
import { lineRoute, toBookings } from '../helpers/generators';

const bk = (from: number, to: number, id = 0): Booking => ({ id, from, to, arrival: id, isTatkal: false });

describe('bestFit', () => {
  it('gap computation', () => {
    // n = 8. Berth 0: [0,2) and [6,8). Berth 1: empty.
    const g = new OccupancyGrid(2, 8);
    g.place(0, bk(0, 2, 0));
    g.place(0, bk(6, 8, 1));
    expect(gap(bk(3, 5), g, 0)).toBe((3 - 2) + (6 - 5)); // prevEnd 2, nextStart 6
    expect(gap(bk(2, 6), g, 0)).toBe(0);                 // exact fit
    expect(gap(bk(3, 5), g, 1)).toBe((3 - 0) + (8 - 5)); // empty berth: prevEnd 0, nextStart n
  });

  it('prefers the tighter berth', () => {
    const g = new OccupancyGrid(2, 8);
    g.place(1, bk(0, 2, 0));
    expect(bestFit(bk(2, 4), g)).toBe(1);
  });

  it('tie goes to the lowest index', () => {
    const g = new OccupancyGrid(3, 4);
    expect(bestFit(bk(1, 2), g)).toBe(0);
    g.place(1, bk(0, 1, 0));
    g.place(2, bk(0, 1, 1));
    expect(bestFit(bk(1, 4), g)).toBe(1); // berths 1 and 2 both have gap 0
  });

  it('returns null when no berth is free', () => {
    const g = new OccupancyGrid(1, 3);
    g.place(0, bk(0, 3, 0));
    expect(bestFit(bk(1, 2), g)).toBeNull();
  });

  it('succeeds where first-fit fails', () => {
    // Same stream as the first-fit fragmentation example. BF puts [0,1) on berth 1 (gap 0), leaving
    // berth 0 free on [0,2).
    const requests = toBookings([{ from: 2, to: 3 }, { from: 1, to: 3 }, { from: 0, to: 1 }, { from: 0, to: 2 }]);
    const coach = { berths: 2, racBerths: 0 };
    const bf = runOnline('best-fit', requests, lineRoute(3), coach, 1);
    const ff = runOnline('first-fit', requests, lineRoute(3), coach, 1);
    expect(bf.assignment.confirmed).toEqual({ 0: 0, 1: 1, 2: 1, 3: 0 });
    expect(bf.metrics.seated).toBe(4);
    expect(ff.metrics.seated).toBe(3);
  });
});
