// Load and validate route JSON (SPEC 9.1).
import type { Route } from './types';

/** Validates raw route JSON and returns it as a Route. Throws on invalid input. */
export function parseRoute(raw: unknown): Route {
  throw new Error('not implemented');
}

/** Number of segments n = stations - 1. */
export function segmentCount(route: Route): number {
  throw new Error('not implemented');
}
