// Formatting for station codes, journeys and numbers.
import type { Booking, Route } from '../../engine';

export const code = (route: Route, i: number) => route.stations[i].code;

/** "KYN → NGP" */
export const journey = (route: Route, b: Pick<Booking, 'from' | 'to'>) => `${code(route, b.from)} → ${code(route, b.to)}`;

/** Segment j runs from station j to j + 1: "CCC → DDD". */
export const segmentName = (route: Route, j: number) => `${code(route, j)} → ${code(route, j + 1)}`;

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const ratio = (x: number | null) => (x === null ? 'n/a' : x.toFixed(3));
