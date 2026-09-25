// Passengers on each segment, with the capacity line at k. Columns line up with CoachGrid.
import type { Route } from '../../engine';
import { LABEL_W, segmentAt } from './CoachGrid';
import { segmentName } from '../lib/format';

const H = 88;   // bar area height
const TOP = 18; // room for the capacity label and values

export function LoadProfile({ route, load, capacity, colW }: { route: Route; load: number[]; capacity: number; colW: number }) {
  const n = load.length;
  const x = segmentAt(colW);
  const width = x(n) + 1;
  const barH = (v: number) => (v / capacity) * H;

  return (
    <svg width={width} height={TOP + H + 20} role="img" aria-label={`Load per segment, capacity ${capacity}`}
      style={{ fontFamily: 'var(--font)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
      <text x={0} y={TOP + 4} style={{ fill: 'var(--ink)', fontWeight: 600 }}>Load</text>
      <text x={0} y={TOP + 17} style={{ fill: 'var(--ink)' }}>of {capacity}</text>

      {load.map((v, j) => {
        const full = v >= capacity;
        const inside = barH(v) > H - 14; // near the capacity line: write the value inside the bar
        return (
          <g key={j}>
            <rect x={x(j) + 8} y={TOP + H - barH(v)} width={colW - 16} height={barH(v)}
              style={{ fill: full ? 'var(--signal-red)' : 'var(--coach-blue)', fillOpacity: full ? 1 : 0.55 }}>
              <title>{`${segmentName(route, j)}: ${v} of ${capacity} berths in use${full ? ' (full)' : ''}`}</title>
            </rect>
            <text x={x(j) + colW / 2} y={inside ? TOP + H - barH(v) + 13 : TOP + H - barH(v) - 4} textAnchor="middle"
              style={{ fill: inside ? 'white' : 'var(--ink)', fontWeight: full ? 800 : 400 }}>{full && colW >= 64 ? `${v} full` : v}</text>
          </g>
        );
      })}

      <line x1={LABEL_W} x2={width} y1={TOP} y2={TOP} style={{ stroke: 'var(--ink)', strokeDasharray: '5 3' }} />
      <line x1={LABEL_W} x2={width} y1={TOP + H} y2={TOP + H} style={{ stroke: 'var(--coach-blue)', strokeOpacity: 0.45 }} />
      {route.stations.map((st, j) => (
        <text key={st.code} x={x(j) + (j === n ? -3 : 3)} y={TOP + H + 15} textAnchor={j === n ? 'end' : 'start'}
          style={{ fill: 'var(--coach-blue)', fontWeight: 800 }}>{st.code}</text>
      ))}
    </svg>
  );
}
