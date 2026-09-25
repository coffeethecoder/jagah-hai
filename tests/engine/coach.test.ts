import { describe, expect, it } from 'vitest';
import { OccupancyGrid, berthLabel } from '../../src/engine/coach';
import type { Booking } from '../../src/engine/types';

const bk = (from: number, to: number, id = 0): Booking => ({ id, from, to, arrival: id, isTatkal: false });

describe('coach', () => {
  it('a berth is free for touching bookings but not overlapping ones', () => {
    const g = new OccupancyGrid(2, 5);
    g.place(0, bk(1, 3, 0));
    expect(g.isFree(0, bk(0, 1))).toBe(true);
    expect(g.isFree(0, bk(3, 5))).toBe(true);
    expect(g.isFree(0, bk(2, 4))).toBe(false);
    expect(g.isFree(0, bk(0, 5))).toBe(false);
    expect(g.isFree(1, bk(0, 5))).toBe(true);
  });

  it('placing on an occupied berth throws and leaves it unchanged', () => {
    const g = new OccupancyGrid(1, 4);
    g.place(0, bk(0, 2, 0));
    expect(() => g.place(0, bk(1, 3, 1))).toThrow();
    expect(g.isFree(0, bk(2, 4))).toBe(true);
  });

  it('rejects rows outside the pool and bad sizes', () => {
    const g = new OccupancyGrid(2, 4);
    expect(() => g.isFree(2, bk(0, 1))).toThrow();
    expect(() => g.isFree(-1, bk(0, 1))).toThrow();
    expect(() => g.isFree(0, bk(0, 5))).toThrow();
    expect(() => g.occupant(0, 4)).toThrow();
    expect(g.occupant(0, 3)).toBeNull();
    expect(() => new OccupancyGrid(-1, 4)).toThrow();
    expect(() => new OccupancyGrid(2, 0)).toThrow();
  });

  it('a zero-capacity pool (r = 0) has no rows', () => {
    const g = new OccupancyGrid(0, 4);
    expect(() => g.isFree(0, bk(0, 1))).toThrow();
  });

  it('berth labels repeat the 8-berth bay pattern', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(berthLabel)).toEqual(['1 LB', '2 MB', '3 UB', '4 LB', '5 MB', '6 UB', '7 SL', '8 SU']);
    expect(berthLabel(8)).toBe('9 LB');
    expect(berthLabel(71)).toBe('72 SU');
    expect(() => berthLabel(-1)).toThrow();
  });
});
