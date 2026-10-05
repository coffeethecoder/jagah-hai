// Typed access to src/ui/data/findings.json (written by `npm run export-findings` from the main experiment).
import raw from '../data/findings.json';

export type StrategyKey = 'first-fit' | 'best-fit' | 'random-fit' | 'deferred' | 'offline-optimum';
export type Metric = 'seated' | 'frag' | 'epr' | 'util' | 'vsDeferred' | 'vsOptimum';
export type Scenario = 'mixed' | 'short' | 'long' | 'uniform';

interface Findings {
  meta: { runs: number; seeds: number; berths: number; commit: string | null; clean: boolean; finishedAt: string };
  rho: number[];
  routes: { id: string; name: string; stops: number }[];
  series: Record<string, Record<StrategyKey, Record<Metric, (number | null)[]>>>;
  ffOverOmega: Record<string, (number | null)[]>;
}

export const findings = raw as unknown as Findings;

/** Fixed identity per strategy, the same in every chart (validated categorical slots; the optimum is a neutral reference). */
export const STRATEGY: Record<StrategyKey, { label: string; color: string; dashed?: boolean }> = {
  'first-fit': { label: 'First-fit', color: '#2a78d6' },
  'best-fit': { label: 'Best-fit', color: '#eb6834' },
  'random-fit': { label: 'Random-fit', color: '#1baf7a' },
  deferred: { label: 'Deferred', color: '#eda100' },
  'offline-optimum': { label: 'Optimum', color: '#52514e', dashed: true },
};

export const values = (route: string, scenario: Scenario, strategy: StrategyKey, metric: Metric, rac = 0) =>
  findings.series[`${route}|${scenario}|${rac}`][strategy][metric];

/** One value at a demand level (default 1.4 times capacity, the level the headline numbers use). */
export function at(route: string, scenario: Scenario, strategy: StrategyKey, metric: Metric, rho = 1.4, rac = 0): number {
  const v = values(route, scenario, strategy, metric, rac)[findings.rho.indexOf(rho)];
  if (v === null || v === undefined) throw new Error(`No ${metric} for ${strategy} on ${route}, ${scenario}, ρ=${rho}`);
  return v;
}

export const percent = (v: number, digits = 1) => `${(100 * v).toFixed(digits)}%`;
/** A signed-safe one-decimal number: tiny negatives print as 0.0, not −0.0. */
export const seats = (v: number) => (Math.abs(v) < 0.05 ? '0.0' : v.toFixed(1).replace('-', '−'));
