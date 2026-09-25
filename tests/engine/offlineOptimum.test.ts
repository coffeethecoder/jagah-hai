import { describe, expect, it } from 'vitest';
import { selectOptimum } from '../../src/engine/strategies/offlineOptimum';
import { runOfflineOptimum } from '../../src/engine/simulate';
import { peakLoad } from '../../src/engine/load';
import { bruteForceMaxSeated } from '../helpers/bruteForce';
import { lineRoute, toBookings } from '../helpers/generators';

const ids = (xs: { id: number }[]) => xs.map((x) => x.id).sort((a, b) => a - b);

describe('offlineOptimum', () => {
  it('drops the long booking that blocks two short ones', () => {
    // k = 1: [0,4) alone, or [0,2) + [2,4). The optimum keeps the two short ones.
    const b = toBookings([{ from: 0, to: 4 }, { from: 0, to: 2 }, { from: 2, to: 4 }]);
    expect(ids(selectOptimum(b, 1))).toEqual([1, 2]);
  });

  it('ties on end drop the largest id', () => {
    const b = toBookings([{ from: 0, to: 2 }, { from: 0, to: 2 }, { from: 0, to: 2 }]);
    expect(ids(selectOptimum(b, 2))).toEqual([0, 1]);
  });

  it('keeps everything when it already fits', () => {
    const b = toBookings([{ from: 0, to: 3 }, { from: 1, to: 2 }, { from: 2, to: 4 }]);
    expect(selectOptimum(b, 2).length).toBe(3);
  });

  it('capacity 0 keeps nothing; bad capacity throws', () => {
    expect(selectOptimum(toBookings([{ from: 0, to: 1 }]), 0)).toEqual([]);
    expect(() => selectOptimum([], -1)).toThrow();
  });

  it('ignores arrival order and matches brute force on a hand example', () => {
    // n = 5, k = 2.
    const b = toBookings([
      { from: 0, to: 5 }, { from: 0, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 5 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 1, to: 4 },
    ]);
    const kept = selectOptimum(b, 2);
    expect(peakLoad(kept, 5)).toBeLessThanOrEqual(2);
    expect(kept.length).toBe(bruteForceMaxSeated(b, 2, 5));
    expect(ids(selectOptimum(b.slice().reverse(), 2))).toEqual(ids(kept));
  });

  it('runOfflineOptimum seats the selected set with EST and has no event log', () => {
    const b = toBookings([{ from: 0, to: 4 }, { from: 0, to: 2 }, { from: 2, to: 4 }]);
    const run = runOfflineOptimum(b, lineRoute(4), { berths: 1, racBerths: 0 });
    expect(run).toMatchObject({ strategy: 'offline-optimum', tier: 3, events: [] });
    expect(run.assignment.confirmed).toEqual({ 1: 0, 2: 0 });
    expect(run.metrics).toMatchObject({ requested: 3, seated: 2, rejected: 1, forced: 0, strategyInduced: 0 });
  });
});
