import { describe, expect, it } from 'vitest';
import { parseRoute, segmentCount } from '../../src/engine/route';
import demo from '../../data/routes/demo-line.json';

const base = () => ({
  id: 'r', name: 'R', trainNumber: null, source: 'test',
  stations: [{ code: 'A', name: 'A', km: 0 }, { code: 'B', name: 'B', km: 10 }] as Record<string, unknown>[],
});

describe('route', () => {
  it('demo-line parses with 10 stations and 9 segments', () => {
    const route = parseRoute(demo);
    expect(route.stations.map((s) => s.code)).toEqual(['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH', 'III', 'JJJ']);
    expect(segmentCount(route)).toBe(9);
    expect(route.stations.filter((s) => s.weight === 3).map((s) => s.code)).toEqual(['AAA', 'EEE', 'JJJ']);
  });

  it('km and weight are optional', () => {
    const r = base();
    r.stations = [{ code: 'A', name: 'A' }, { code: 'B', name: 'B' }];
    expect(parseRoute(r).stations).toEqual([{ code: 'A', name: 'A' }, { code: 'B', name: 'B' }]);
  });

  it('drops unknown fields', () => {
    expect(parseRoute({ ...base(), extra: 1 })).toEqual(base());
  });

  it.each([
    ['not an object', () => 'x'],
    ['empty id', () => ({ ...base(), id: '' })],
    ['name missing', () => ({ ...base(), name: undefined })],
    ['numeric trainNumber', () => ({ ...base(), trainNumber: 12105 })],
    ['source missing', () => ({ ...base(), source: undefined })],
    ['one station', () => ({ ...base(), stations: [{ code: 'A', name: 'A' }] })],
    ['station not an object', () => ({ ...base(), stations: ['A', 'B'] })],
    ['empty code', () => ({ ...base(), stations: [{ code: '', name: 'A' }, { code: 'B', name: 'B' }] })],
    ['station name missing', () => ({ ...base(), stations: [{ code: 'A' }, { code: 'B', name: 'B' }] })],
    ['duplicate code', () => ({ ...base(), stations: [{ code: 'A', name: 'A' }, { code: 'A', name: 'A' }] })],
    ['decreasing km', () => ({ ...base(), stations: [{ code: 'A', name: 'A', km: 5 }, { code: 'B', name: 'B', km: 1 }] })],
    ['non-numeric km', () => ({ ...base(), stations: [{ code: 'A', name: 'A', km: '0' }, { code: 'B', name: 'B' }] })],
    ['negative weight', () => ({ ...base(), stations: [{ code: 'A', name: 'A', weight: -1 }, { code: 'B', name: 'B' }] })],
  ])('rejects: %s', (_, make) => {
    expect(() => parseRoute(make())).toThrow();
  });
});
