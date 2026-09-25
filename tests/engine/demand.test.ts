import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { generateDemand, lengthWeights } from '../../src/engine/demand';
import { validateBooking } from '../../src/engine/interval';
import { parseRoute } from '../../src/engine/route';
import type { DemandConfig } from '../../src/engine/types';
import demo from '../../data/routes/demo-line.json';

const route = parseRoute(demo);
const n = 9;
const coach = { berths: 72, racBerths: 0 };
const cfg = (over: Partial<DemandConfig> = {}): DemandConfig => ({
  scenario: 'mixed', demandFactor: 1, tatkal: { enabled: false, fraction: 0.2 }, seed: 1, ...over,
});
const volume = (bs: { from: number; to: number }[]) => bs.reduce((s, b) => s + b.to - b.from, 0);
const meanLength = (bs: { from: number; to: number }[]) => volume(bs) / bs.length;
const arbCfg = fc.record({
  scenario: fc.constantFrom('short', 'long', 'mixed', 'uniform' as const),
  demandFactor: fc.double({ min: 0.1, max: 2, noNaN: true }),
  tatkal: fc.record({ enabled: fc.boolean(), fraction: fc.double({ min: 0, max: 0.5, noNaN: true }) }),
  seed: fc.integer(),
});

describe('demand', () => {
  it('produces valid bookings with id = arrival = index', () => {
    fc.assert(fc.property(arbCfg, (c) => {
      generateDemand(route, coach, c).forEach((b, i) => {
        expect(() => validateBooking(b, n)).not.toThrow();
        expect(b.id).toBe(i);
        expect(b.arrival).toBe(i);
      });
    }), { numRuns: 100 });
  });

  it('meets the volume threshold, including the crossing request and no more', () => {
    fc.assert(fc.property(arbCfg, (c) => {
      const f = c.tatkal.enabled ? c.tatkal.fraction : 0;
      const target = c.demandFactor * coach.berths * n;
      const bs = generateDemand(route, coach, c);
      const base = bs.filter((b) => !b.isTatkal);
      const tatkal = bs.filter((b) => b.isTatkal);
      for (const [part, share] of [[base, 1 - f], [tatkal, f]] as const) {
        expect(volume(part)).toBeGreaterThanOrEqual(share * target);
        // Base is shuffled, so the crossing request is unknown; removing any one request falls short.
        if (part.length > 0) expect(volume(part) - Math.max(...part.map((b) => b.to - b.from))).toBeLessThan(share * target);
      }
    }), { numRuns: 100 });
  });

  it('tatkal block is at the end', () => {
    const bs = generateDemand(route, coach, cfg({ tatkal: { enabled: true, fraction: 0.2 } }));
    const first = bs.findIndex((b) => b.isTatkal);
    expect(first).toBeGreaterThan(0);
    expect(bs.slice(0, first).every((b) => !b.isTatkal)).toBe(true);
    expect(bs.slice(first).every((b) => b.isTatkal)).toBe(true);
    expect(generateDemand(route, coach, cfg()).some((b) => b.isTatkal)).toBe(false);
  });

  it('deterministic by seed', () => {
    fc.assert(fc.property(arbCfg, (c) => {
      expect(generateDemand(route, coach, c)).toEqual(generateDemand(route, coach, c));
    }), { numRuns: 100 });
    expect(generateDemand(route, coach, cfg({ seed: 1 }))).not.toEqual(generateDemand(route, coach, cfg({ seed: 2 })));
  });

  it('output is stable across versions (experiments depend on it)', () => {
    // Pinned: demo-line, k = 72, mixed, ρ = 1, seed 1. If this changes, every published run changes.
    expect(generateDemand(route, coach, cfg()).slice(0, 5).map((b) => [b.from, b.to])).toEqual(PINNED);
  });

  it('length profiles: exact weights and ordering of mean trip length', () => {
    expect(lengthWeights('short', 3)).toEqual([9, 4, 1]);
    expect(lengthWeights('long', 3)).toEqual([1, 4, 9]);
    expect(lengthWeights('uniform', 3)).toEqual([1, 1, 1]);
    const mean = (scenario: DemandConfig['scenario']) => meanLength(generateDemand(route, coach, cfg({ scenario, demandFactor: 20 })));
    expect(mean('short')).toBeLessThan(mean('uniform'));
    expect(mean('uniform')).toBeLessThan(mean('long'));
    expect(mean('mixed')).toBeGreaterThan(mean('short'));
    expect(mean('mixed')).toBeLessThan(mean('long'));
  });

  it('origins follow station weights; the last station is never an origin', () => {
    const bs = generateDemand(route, coach, cfg({ scenario: 'uniform', demandFactor: 40 }));
    const count = (from: number) => bs.filter((b) => b.from === from).length;
    expect(count(0) / count(1)).toBeCloseTo(3, 0);      // AAA weight 3, BBB weight 1
    expect(count(4) / count(3)).toBeCloseTo(3, 0);      // EEE weight 3, DDD weight 1
    expect(bs.every((b) => b.from < n)).toBe(true);
  });

  it('zero-weight stations are never origins; missing weight counts as 1', () => {
    const r = parseRoute({ ...demo, stations: demo.stations.map((s, i) => (i === 2 ? { ...s, weight: 0 } : { code: s.code, name: s.name })) });
    const bs = generateDemand(r, coach, cfg({ demandFactor: 5 }));
    expect(bs.some((b) => b.from === 2)).toBe(false);
    expect(bs.some((b) => b.from === 1)).toBe(true);
  });

  it('ρ = 0 gives no requests; bad config throws', () => {
    expect(generateDemand(route, coach, cfg({ demandFactor: 0 }))).toEqual([]);
    expect(() => generateDemand(route, coach, cfg({ demandFactor: -1 }))).toThrow();
    expect(() => generateDemand(route, coach, cfg({ seed: 1.5 }))).toThrow();
    expect(() => generateDemand(route, coach, cfg({ tatkal: { enabled: true, fraction: 1.5 } }))).toThrow();
    expect(() => generateDemand(route, { berths: 0, racBerths: 0 }, cfg())).toThrow();
    expect(() => generateDemand(route, coach, { ...cfg(), scenario: 'busy' as DemandConfig['scenario'] })).toThrow();
  });
});

const PINNED = [[4, 9], [0, 3], [0, 5], [8, 9], [3, 8]];
