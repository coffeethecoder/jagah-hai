import { describe, expect, it } from 'vitest';
import { RUN_COLUMNS, loadRoute, parseConfig, runGrid, toCsv } from '../../experiments/run';
import { SUMMARY_COLUMNS, parseRuns, stats, summarize } from '../../experiments/aggregate';
import smoke from '../../experiments/configs/smoke.json';
import main from '../../experiments/configs/main.json';

const col = (name: string) => SUMMARY_COLUMNS.indexOf(name);

describe('experiments', () => {
  it('both shipped configs are valid', () => {
    expect(parseConfig(smoke).name).toBe('smoke');
    expect(parseConfig(main).seeds).toEqual({ from: 1, to: 100 });
  });

  it.each([
    ['name', { name: '../x' }],
    ['strategies', { strategies: ['greedy'] }],
    ['berths', { berths: [0] }],
    ['seeds', { seeds: { from: 5, to: 1 } }],
    ['tatkalFraction', { tatkalFraction: 2 }],
    ['routes', { routes: [] }],
  ])('rejects a bad %s', (field, over) => {
    expect(() => parseConfig({ ...smoke, ...over })).toThrow(field);
  });

  it('smoke grid: one row per stream × strategy, paired on the same requests', () => {
    const cfg = parseConfig(smoke);
    const rows = runGrid(cfg, { 'demo-line': loadRoute('demo-line') });
    expect(rows.length).toBe(2 * 3 * 5);
    expect(rows.every((r) => r.length === RUN_COLUMNS.length)).toBe(true);
    const at = (r: string[], c: (typeof RUN_COLUMNS)[number]) => r[RUN_COLUMNS.indexOf(c)];
    for (let i = 0; i < rows.length; i += 5) {
      const stream = rows.slice(i, i + 5);
      expect(new Set(stream.map((r) => at(r, 'requested'))).size).toBe(1);
      expect(at(stream[4], 'strategy')).toBe('offline-optimum');
      expect(at(stream[4], 'epr')).toBe('1');
      for (const r of stream) expect(Number(at(r, 'epr'))).toBeLessThanOrEqual(1);
    }
    // Round trip through CSV.
    expect(parseRuns(toCsv(RUN_COLUMNS, rows)).length).toBe(rows.length);
  });

  it('stats: mean, sample sd and 95% CI', () => {
    const s = stats([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(s.mean).toBe(5);
    expect(s.sd).toBeCloseTo(Math.sqrt(32 / 7), 12);
    expect(s.hi! - s.mean!).toBeCloseTo((1.96 * Math.sqrt(32 / 7)) / Math.sqrt(8), 12);
    expect(stats([3])).toEqual({ n: 1, mean: 3 });
    expect(stats([])).toEqual({ n: 0 });
  });

  it('summary: groups by strategy, pairs differences by seed', () => {
    const base = { route: 'r', berths: '2', racBerths: '0', scenario: 'mixed', tatkal: 'false', rho: '1', tier: '1',
      confirmed: '0', rac: '0', rejected: '0', forced: '0', passengerSegmentsSeated: '0', idleBerthSegments: '0',
      utilization: '0.5', epr: '', ffBerthsNeeded: '3', omega: '2' };
    const row = (seed: number, strategy: string, seated: number, strategyInduced = 0) =>
      ({ ...base, seed: String(seed), strategy, seated: String(seated), requested: '10', strategyInduced: String(strategyInduced) });
    const rows = [
      row(1, 'first-fit', 6, 2), row(1, 'deferred', 8), row(1, 'offline-optimum', 9),
      row(2, 'first-fit', 7, 1), row(2, 'deferred', 7), row(2, 'offline-optimum', 9),
    ];
    const [ff, deferred, optimum] = summarize(rows);
    expect(ff[col('strategy')]).toBe('first-fit');
    expect(ff[col('runs')]).toBe('2');
    expect(Number(ff[col('seated_mean')])).toBe(6.5);
    expect(Number(ff[col('fragRate_mean')])).toBeCloseTo(0.15, 12);
    expect(Number(ff[col('seatedMinusDeferred_mean')])).toBe(-1);   // (6-8 + 7-7) / 2
    expect(Number(ff[col('seatedMinusOptimum_mean')])).toBe(-2.5);  // (6-9 + 7-9) / 2
    expect(Number(ff[col('ffOverOmega_mean')])).toBe(1.5);
    expect(ff[col('epr_mean')]).toBe('');                           // no EPR values given
    expect(Number(deferred[col('seatedMinusDeferred_mean')])).toBe(0);
    expect(Number(optimum[col('seatedMinusOptimum_sd')])).toBe(0);
  });

  it('parseRuns rejects a file with missing columns or ragged lines', () => {
    expect(() => parseRuns('route,seed\nx,1\n')).toThrow('missing columns');
    expect(() => parseRuns(`${RUN_COLUMNS.join(',')}\na,b\n`)).toThrow('cells');
  });
});
