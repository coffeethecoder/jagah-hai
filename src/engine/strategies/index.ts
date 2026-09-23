// Strategy registry: id -> tier, and the Tier 1 berth choosers.
import type { Booking, StrategyId, Tier } from '../types';
import type { OccupancyGrid } from '../coach';
import type { Rng } from '../rng';
import { firstFit } from './firstFit';
import { bestFit } from './bestFit';
import { randomFit } from './randomFit';

export const STRATEGY_TIER: Record<StrategyId, Tier> = {
  'first-fit': 1,
  'best-fit': 1,
  'random-fit': 1,
  'deferred': 2,
  'offline-optimum': 3,
};

export type Tier1Id = 'first-fit' | 'best-fit' | 'random-fit';

export const TIER1_CHOOSERS: Record<Tier1Id, (b: Booking, grid: OccupancyGrid, rng: Rng) => number | null> = {
  'first-fit': firstFit,
  'best-fit': bestFit,
  'random-fit': randomFit,
};
