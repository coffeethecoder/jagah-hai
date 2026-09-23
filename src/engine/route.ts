// Load and validate route JSON (SPEC 9.1).
import type { Route, Station } from './types';

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Validates raw route JSON and returns it as a Route. Throws on invalid input. */
export function parseRoute(raw: unknown): Route {
  if (!isObj(raw)) throw new Error('Route must be a JSON object');
  const { id, name, trainNumber, source, stations } = raw;
  const bad = (msg: string) => new Error(`Route ${typeof id === 'string' ? id : '(no id)'}: ${msg}`);

  if (typeof id !== 'string' || id === '') throw bad('id must be a non-empty string');
  if (typeof name !== 'string') throw bad('name must be a string');
  if (trainNumber !== null && typeof trainNumber !== 'string') throw bad('trainNumber must be a string or null');
  if (typeof source !== 'string') throw bad('source must be a string');
  if (!Array.isArray(stations) || stations.length < 2) throw bad('needs at least 2 stations');

  const seen = new Set<string>();
  let prevKm = -Infinity;
  const parsed = stations.map((s: unknown, i): Station => {
    if (!isObj(s)) throw bad(`station ${i} must be an object`);
    const { code, name: stationName, km, weight } = s;
    if (typeof code !== 'string' || code === '') throw bad(`station ${i} needs a non-empty code`);
    if (seen.has(code)) throw bad(`station ${code} appears twice`);
    seen.add(code);
    if (typeof stationName !== 'string') throw bad(`station ${code} needs a name`);

    const station: Station = { code, name: stationName };
    if (km !== undefined) {
      if (typeof km !== 'number' || !Number.isFinite(km)) throw bad(`station ${code}: km must be a number`);
      if (km < prevKm) throw bad(`station ${code}: km decreases along the route`);
      prevKm = station.km = km;
    }
    if (weight !== undefined) {
      if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0) {
        throw bad(`station ${code}: weight must be a number ≥ 0`);
      }
      station.weight = weight;
    }
    return station;
  });

  return { id, name, trainNumber, source, stations: parsed };
}

/** Number of segments n = stations - 1. */
export function segmentCount(route: Route): number {
  return route.stations.length - 1;
}
