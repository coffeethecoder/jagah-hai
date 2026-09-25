// The reservation chart: berths down the side, boarding stations across the top, journeys as bars.
import { useId } from 'react';
import { berthLabel, type Booking, type Route, type StepEvent } from '../../engine';
import { journey } from '../lib/format';
import s from '../styles/ui.module.css';

/** Column geometry shared with LoadProfile so the two line up; the column width follows the container. */
export const LABEL_W = 64;
/** Grid x-coordinate of segment j (or the terminus, j = n). */
export const segmentAt = (colW: number) => (j: number) => LABEL_W + j * colW;
/** Column width that fills `available` pixels, within limits that keep codes and bars legible. */
export const columnWidth = (available: number, n: number) => Math.max(40, Math.min(120, Math.floor((available - LABEL_W - 1) / n)));

const HEADER_H = 22;
const GHOST_H = 26;
const BAY = 8; // berths per bay (SPEC 13.3)

const GHOST: Record<string, { fill: 'green' | 'hatch' | 'red' | 'amber'; label: string }> = {
  placed: { fill: 'green', label: 'Seated' },
  pending: { fill: 'hatch', label: 'Pending' },
  forced: { fill: 'red', label: 'Full here' },
  'strategy-induced': { fill: 'amber', label: 'Assignment' },
};

export const tooltip = (route: Route, b: Booking) =>
  `Booking ${b.id}: ${journey(route, b)}\nArrived ${b.arrival === 0 ? 'first' : `as request ${b.arrival + 1}`}${b.isTatkal ? '\nTatkal' : ''}`;

/** Hatched fill for pending bookings; `id` must be unique on the page. */
export function HatchPattern({ id }: { id: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" style={{ fill: 'color-mix(in srgb, var(--coach-blue) 12%, white)' }} />
      <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--coach-blue)', strokeWidth: 2 }} />
    </pattern>
  );
}

interface Props {
  route: Route;
  berths: number;
  colW: number;
  seated: { booking: Booking; berth: number }[];
  current?: StepEvent | null;
  ghostRow?: boolean;                                  // row above the grid for the request just decided
  highlightSegment?: number | null;                    // proof panel: the full segment, tinted red
  emphasis?: Set<number> | null;                       // proof panel: outline these bookings, fade the rest
  rejected?: { booking: Booking; berth: number } | null; // witness: the rejected passenger, in amber
  animateEntry?: boolean;                              // charting: bars grow in as they are placed
}

// ponytail: SVG only; SPEC 13.4's canvas fallback above 5000 cells is not needed for demo-line (648 cells). Add with long real routes.
export function CoachGrid({
  route, berths, colW, seated, current = null, ghostRow = true, highlightSegment = null, emphasis = null, rejected = null, animateEntry = false,
}: Props) {
  const hatchId = useId();
  const n = route.stations.length - 1;
  const x = segmentAt(colW);
  const rowH = berths > 32 ? 14 : 22;
  const top = HEADER_H + (ghostRow ? GHOST_H : 0);
  const width = x(n) + 1;
  const height = top + berths * rowH + 1;
  const rowY = (i: number) => top + i * rowH;
  const ghost = current && GHOST[current.outcome.kind === 'rejected' ? current.outcome.certificate.kind : current.outcome.kind];
  const fill = (f: 'green' | 'hatch' | 'red' | 'amber') => (f === 'hatch' ? `url(#${hatchId})` : `var(--signal-${f})`);
  const bar = (b: Booking, berth: number) => ({ x: x(b.from) + 2, y: rowY(berth) + 1.5, width: (b.to - b.from) * colW - 4, height: rowH - 3, rx: 2 });

  return (
    <svg width={width} height={height} role="img" aria-label={`Reservation chart: ${berths} berths across ${n} segments, ${seated.length} journeys seated`}
      style={{ fontFamily: 'var(--font)', fontSize: 11 }}>
      <defs><HatchPattern id={hatchId} /></defs>

      {/* Boarding station codes; the terminus closes the last column. */}
      {route.stations.map((st, j) => (
        <text key={st.code} x={x(j) + (j === n ? -3 : 3)} y={14} textAnchor={j === n ? 'end' : 'start'}
          style={{ fill: 'var(--coach-blue)', fontWeight: 800 }}>{st.code}</text>
      ))}

      {/* Ghost bar: the request just decided, labelled with its outcome. */}
      {ghostRow && <text x={0} y={HEADER_H + 16} style={{ fill: 'var(--ink)', fontWeight: 600 }}>{ghost ? ghost.label : 'Next'}</text>}
      {ghostRow && current && ghost && (
        <rect x={x(current.booking.from) + 1} y={HEADER_H + 4} width={(current.booking.to - current.booking.from) * colW - 2} height={GHOST_H - 10} rx={3}
          style={{ fill: fill(ghost.fill), stroke: 'var(--ink)', strokeWidth: 1, strokeDasharray: '4 2' }}>
          <title>{tooltip(route, current.booking)}</title>
        </rect>
      )}

      {highlightSegment !== null && (
        <rect x={x(highlightSegment)} y={top} width={colW} height={berths * rowH}
          style={{ fill: 'var(--signal-red)', fillOpacity: 0.14, stroke: 'var(--signal-red)', strokeWidth: 2 }} />
      )}

      {/* Grid: berth rows, bay separators every 8, segment columns. */}
      {Array.from({ length: berths }, (_, i) => (
        <g key={i}>
          <text x={0} y={rowY(i) + rowH - (rowH >= 20 ? 7 : 2)} style={{ fill: 'var(--ink)', fontSize: rowH >= 20 ? 11 : 10 }}>{berthLabel(i)}</text>
          <line x1={LABEL_W} x2={width} y1={rowY(i)} y2={rowY(i)}
            style={{ stroke: 'var(--coach-blue)', strokeOpacity: i % BAY === 0 ? 0.45 : 0.12 }} />
        </g>
      ))}
      <line x1={LABEL_W} x2={width} y1={rowY(berths)} y2={rowY(berths)} style={{ stroke: 'var(--coach-blue)', strokeOpacity: 0.45 }} />
      {Array.from({ length: n + 1 }, (_, j) => (
        <line key={j} x1={x(j)} x2={x(j)} y1={top} y2={rowY(berths)} style={{ stroke: 'var(--coach-blue)', strokeOpacity: 0.2 }} />
      ))}

      {/* Seated journeys. The one placed at this step, or named by the proof panel, gets an ink outline. */}
      {seated.map(({ booking: b, berth }) => {
        const outlined = emphasis ? emphasis.has(b.id) : current?.booking.id === b.id && current.outcome.kind === 'placed';
        return (
          <rect key={b.id} {...bar(b, berth)} className={animateEntry ? s.grow : undefined}
            style={{ fill: 'var(--signal-green)', fillOpacity: emphasis && !outlined ? 0.3 : 1, stroke: outlined ? 'var(--ink)' : 'none', strokeWidth: 2 }}>
            <title>{tooltip(route, b)}</title>
          </rect>
        );
      })}

      {rejected && (
        <rect {...bar(rejected.booking, rejected.berth)} style={{ fill: 'var(--signal-amber)', stroke: 'var(--ink)', strokeWidth: 2 }}>
          <title>{`${tooltip(route, rejected.booking)}\nWaitlisted by the strategy; seated here`}</title>
        </rect>
      )}
    </svg>
  );
}
