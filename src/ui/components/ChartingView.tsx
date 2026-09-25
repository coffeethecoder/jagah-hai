// Tier 2: the pending pool (hatched, no berth numbers) and "Prepare chart", which places it with EST.
import { useId, useMemo } from 'react';
import type { Booking, Route } from '../../engine';
import { HatchPattern, segmentAt, tooltip } from './CoachGrid';
import { plural } from '../lib/format';
import s from '../styles/ui.module.css';

interface Props {
  route: Route;
  colW: number;
  accepted: Booking[];   // every accepted booking so far (fixes each one's lane in the pool)
  pending: Booking[];    // those not yet placed by the chart
  bookingClosed: boolean;
  charting: boolean;
  onPrepare: () => void;
}

/** Display lanes for the pool: arrival order, first lane where the booking fits. Positions carry no berth meaning. */
function poolLanes(accepted: Booking[], n: number): Map<number, number> {
  const lanes: boolean[][] = [];
  const out = new Map<number, number>();
  for (const b of [...accepted].sort((x, y) => x.id - y.id)) {
    let lane = lanes.findIndex((row) => row.slice(b.from, b.to).every((busy) => !busy));
    if (lane === -1) lane = lanes.push(new Array<boolean>(n).fill(false)) - 1;
    for (let j = b.from; j < b.to; j++) lanes[lane][j] = true;
    out.set(b.id, lane);
  }
  return out;
}

export function ChartingView({ route, colW, accepted, pending, bookingClosed, charting, onPrepare }: Props) {
  const hatchId = useId();
  const n = route.stations.length - 1;
  const x = segmentAt(colW);
  const lanes = useMemo(() => poolLanes(accepted, n), [accepted, n]);
  const laneCount = Math.max(0, ...lanes.values()) + 1;
  const laneH = laneCount > 24 ? 5 : 10;
  const placed = accepted.length - pending.length;

  return (
    <div className={s.section}>
      <div className={s.row}>
        <button type="button" className={`${s.button} ${s.primary}`} onClick={onPrepare} disabled={!bookingClosed || charting || accepted.length === 0}>
          Prepare chart
        </button>
        <span className={`${s.hint} ${s.num}`}>
          {!bookingClosed && 'Charting happens after the last request. Jump to the end to prepare the chart.'}
          {bookingClosed && !charting && `${plural(pending.length, 'accepted booking')} wait in the pending pool with no berth number.`}
          {charting && pending.length > 0 && `Placing earliest boarding first: ${placed} of ${accepted.length}.`}
          {charting && pending.length === 0 && `Chart prepared: all ${accepted.length} accepted bookings have berths.`}
        </span>
      </div>
      {pending.length > 0 && (
        <svg width={x(n) + 1} height={laneCount * laneH + 4} role="img"
          aria-label={`Pending pool: ${pending.length} bookings without berth numbers`}>
          <defs><HatchPattern id={hatchId} /></defs>
          <text x={0} y={12} style={{ fill: 'var(--ink)', fontWeight: 600, fontSize: 11, fontFamily: 'var(--font)' }}>Pending</text>
          {pending.map((b) => (
            <rect key={b.id} x={x(b.from) + 2} y={lanes.get(b.id)! * laneH + 2} width={(b.to - b.from) * colW - 4} height={laneH - 1}
              style={{ fill: `url(#${hatchId})`, stroke: 'var(--coach-blue)', strokeWidth: 0.5 }}>
              <title>{tooltip(route, b)}</title>
            </rect>
          ))}
        </svg>
      )}
    </div>
  );
}
