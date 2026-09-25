// CLI: config -> results/<name>/runs.csv + meta.json (SPEC 15). The runner may read the clock; the engine may not.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  firstFitBerthsNeeded, generateDemand, parseRoute, peakLoad, runOfflineOptimum, runOnline, segmentCount,
  type DemandConfig, type Route, type StrategyId,
} from '../src/engine';

export interface ExperimentConfig {
  name: string;
  routes: string[];
  berths: number[];
  racBerths: number[];
  scenarios: DemandConfig['scenario'][];
  tatkal: boolean[];
  tatkalFraction: number;
  demandFactors: number[];
  seeds: { from: number; to: number };
  strategies: StrategyId[];
  unbounded: boolean;
}

export const RUN_COLUMNS = [
  'route', 'berths', 'racBerths', 'scenario', 'tatkal', 'rho', 'seed', 'strategy', 'tier',
  'requested', 'confirmed', 'rac', 'seated', 'rejected', 'forced', 'strategyInduced',
  'passengerSegmentsSeated', 'utilization', 'idleBerthSegments', 'epr', 'ffBerthsNeeded', 'omega',
] as const;

const STRATEGIES: StrategyId[] = ['first-fit', 'best-fit', 'random-fit', 'deferred', 'offline-optimum'];
const SCENARIOS: DemandConfig['scenario'][] = ['short', 'long', 'mixed', 'uniform'];
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Validates an experiment config file's contents. Throws naming the bad field. */
export function parseConfig(raw: unknown): ExperimentConfig {
  const c = raw as Partial<Record<keyof ExperimentConfig, unknown>>;
  const fail = (field: string, want: string): never => { throw new Error(`Config field "${field}" must be ${want}`); };
  const list = <T>(field: keyof ExperimentConfig, ok: (x: unknown) => x is T, want: string): T[] => {
    const v = c[field];
    return Array.isArray(v) && v.length > 0 && v.every(ok) ? v : fail(field, `a non-empty array of ${want}`);
  };
  const isInt = (min: number) => (x: unknown): x is number => Number.isInteger(x) && (x as number) >= min;

  if (typeof raw !== 'object' || raw === null) throw new Error('Config must be a JSON object');
  if (typeof c.name !== 'string' || !/^[\w-]+$/.test(c.name)) fail('name', 'letters, digits, - or _');
  if (typeof c.tatkalFraction !== 'number' || !(c.tatkalFraction >= 0 && c.tatkalFraction <= 1)) fail('tatkalFraction', 'a number in [0, 1]');
  const seeds = c.seeds as { from?: unknown; to?: unknown } | undefined;
  if (!seeds || !Number.isInteger(seeds.from) || !Number.isInteger(seeds.to) || (seeds.from as number) > (seeds.to as number)) {
    fail('seeds', '{ from, to } integers with from ≤ to');
  }
  if (typeof c.unbounded !== 'boolean') fail('unbounded', 'true or false');

  return {
    name: c.name as string,
    routes: list('routes', (x): x is string => typeof x === 'string' && /^[\w-]+$/.test(x), 'route ids'),
    berths: list('berths', isInt(1), 'integers ≥ 1'),
    racBerths: list('racBerths', isInt(0), 'integers ≥ 0'),
    scenarios: list('scenarios', (x): x is DemandConfig['scenario'] => SCENARIOS.includes(x as DemandConfig['scenario']), SCENARIOS.join(' | ')),
    tatkal: list('tatkal', (x): x is boolean => typeof x === 'boolean', 'booleans'),
    tatkalFraction: c.tatkalFraction as number,
    demandFactors: list('demandFactors', (x): x is number => typeof x === 'number' && x >= 0, 'numbers ≥ 0'),
    seeds: { from: seeds!.from as number, to: seeds!.to as number },
    strategies: list('strategies', (x): x is StrategyId => STRATEGIES.includes(x as StrategyId), STRATEGIES.join(' | ')),
    unbounded: c.unbounded as boolean,
  };
}

export function loadRoute(id: string): Route {
  return parseRoute(JSON.parse(readFileSync(resolve(ROOT, 'data/routes', `${id}.json`), 'utf8')));
}

/**
 * One row per (route, k, r, scenario, tatkal, ρ, seed, strategy). Every strategy runs on the same request
 * stream for a seed (paired design); EPR divides by the offline optimum on that stream.
 */
export function runGrid(cfg: ExperimentConfig, routes: Record<string, Route>, onStream?: (done: number, total: number) => void): string[][] {
  const rows: string[][] = [];
  const total = cfg.routes.length * cfg.berths.length * cfg.racBerths.length * cfg.scenarios.length
    * cfg.tatkal.length * cfg.demandFactors.length * (cfg.seeds.to - cfg.seeds.from + 1);
  let done = 0;

  for (const routeId of cfg.routes) {
    const route = routes[routeId];
    const n = segmentCount(route);
    for (const berths of cfg.berths) for (const racBerths of cfg.racBerths) for (const scenario of cfg.scenarios)
    for (const tatkal of cfg.tatkal) for (const rho of cfg.demandFactors) for (let seed = cfg.seeds.from; seed <= cfg.seeds.to; seed++) {
      const coach = { berths, racBerths };
      const requests = generateDemand(route, coach, { scenario, demandFactor: rho, tatkal: { enabled: tatkal, fraction: cfg.tatkalFraction }, seed });
      const optimum = runOfflineOptimum(requests, route, coach);
      const ff = cfg.unbounded ? String(firstFitBerthsNeeded(requests, n)) : '';
      const omega = cfg.unbounded ? String(peakLoad(requests, n)) : '';

      for (const strategy of cfg.strategies) {
        const r = strategy === 'offline-optimum' ? optimum : runOnline(strategy, requests, route, coach, seed);
        const m = r.metrics;
        const epr = optimum.metrics.seated > 0 ? String(m.seated / optimum.metrics.seated) : '';
        rows.push([
          routeId, berths, racBerths, scenario, tatkal, rho, seed, strategy, r.tier,
          m.requested, m.confirmed, m.rac, m.seated, m.rejected, m.forced, m.strategyInduced,
          m.passengerSegmentsSeated, m.utilization, m.idleBerthSegments, epr, ff, omega,
        ].map(String));
      }
      onStream?.(++done, total);
    }
  }
  return rows;
}

export const toCsv = (header: readonly string[], rows: string[][]) => [header, ...rows].map((r) => r.join(',')).join('\n') + '\n';

function gitInfo(): { commit: string | null; dirty: boolean | null } {
  try {
    const commit = execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execSync('git status --porcelain', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() !== '';
    return { commit, dirty };
  } catch {
    return { commit: null, dirty: null };
  }
}

function main() {
  const { values } = parseArgs({ options: { config: { type: 'string' } } });
  if (!values.config) throw new Error('Usage: npm run experiment -- --config experiments/configs/<name>.json');
  const cfg = parseConfig(JSON.parse(readFileSync(values.config, 'utf8')));
  const routes = Object.fromEntries(cfg.routes.map((id) => [id, loadRoute(id)]));

  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const rows = runGrid(cfg, routes, (done, total) => {
    if (done === total || done % 100 === 0) process.stdout.write(`\r${done}/${total} streams`);
  });
  const finishedAt = new Date().toISOString();

  const outDir = resolve(ROOT, 'experiments/results', cfg.name);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'runs.csv'), toCsv(RUN_COLUMNS, rows));
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { version: string };
  const git = gitInfo();
  writeFileSync(resolve(outDir, 'meta.json'), JSON.stringify({
    config: cfg, engineVersion: pkg.version, gitCommit: git.commit, gitDirty: git.dirty,
    startedAt, finishedAt, runs: rows.length,
  }, null, 2) + '\n');
  console.log(`\n${rows.length} runs in ${((performance.now() - t0) / 1000).toFixed(1)} s -> ${outDir}/runs.csv`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
