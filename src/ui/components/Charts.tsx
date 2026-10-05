// Hand-drawn SVG charts for the Findings page: a line chart and a stacked bar chart, both with a hover readout,
// a legend, and a table of the numbers behind them.
import { useState, type MouseEvent } from 'react';
import { useWidth } from '../lib/useWidth';
import c from '../styles/site.module.css';

export interface Series { id: string; label: string; color: string; dashed?: boolean; values: (number | null)[] }

const M = { l: 52, r: 18, t: 14, b: 40 };
const AXIS = { fill: 'var(--ink-3)', fontSize: 12 } as const;

/** Round axis limits and ticks covering [min, max]. */
export function niceScale(min: number, max: number, count = 4): { lo: number; hi: number; ticks: number[] } {
  if (max <= min) max = min + 1;
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v / step) * step);
  return { lo, hi, ticks };
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean; block?: boolean }[] }) {
  return (
    <ul className={c.chartLegend}>
      {items.map((it) => (
        <li key={it.label}>
          <i className={it.block ? c.block : it.dashed ? c.dashed : undefined} style={it.block ? { background: it.color } : { borderTopColor: it.color }} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function DataTable({ x, xLabel, series, format }: { x: number[]; xLabel: string; series: Series[]; format: (v: number) => string }) {
  return (
    <details className={c.details}>
      <summary>Show the numbers</summary>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>{xLabel}</th>{series.map((s) => <th key={s.id}>{s.label}</th>)}</tr></thead>
          <tbody>
            {x.map((xv, i) => (
              <tr key={xv}><td>{xv.toFixed(1)}</td>{series.map((s) => <td key={s.id}>{s.values[i] === null ? '' : format(s.values[i] as number)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Index of the x value nearest the pointer. */
function nearest(e: MouseEvent<SVGSVGElement>, x: number[], px: (v: number) => number): number {
  const at = e.clientX - e.currentTarget.getBoundingClientRect().left;
  let best = 0;
  for (let i = 1; i < x.length; i++) if (Math.abs(px(x[i]) - at) < Math.abs(px(x[best]) - at)) best = i;
  return best;
}

function Tooltip({ left, width, title, rows }: { left: number; width: number; title: string; rows: { label: string; color: string; value: string }[] }) {
  const flip = left > width / 2;
  return (
    <div className={c.tooltip} style={flip ? { right: width - left + 12 } : { left: left + 12 }}>
      <b>{title}</b>
      {rows.map((r) => <span key={r.label}><span><i style={{ background: r.color }} />{r.label}</span><span>{r.value}</span></span>)}
    </div>
  );
}

interface LineProps { x: number[]; series: Series[]; format: (v: number) => string; xLabel: string; ariaLabel: string; height?: number }

export function LineChart({ x, series, format, xLabel, ariaLabel, height = 300 }: LineProps) {
  const [ref, width] = useWidth(560);
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const { lo, hi, ticks } = niceScale(Math.min(0, ...all), Math.max(...all));
  const px = (v: number) => M.l + ((v - x[0]) / (x[x.length - 1] - x[0])) * (width - M.l - M.r);
  const py = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * (height - M.t - M.b);

  return (
    <>
      <div className={c.chartWrap} ref={ref}>
        <svg width={width} height={height} role="img" aria-label={ariaLabel}
          onMouseMove={(e) => setHover(nearest(e, x, px))} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={width - M.r} y1={py(t)} y2={py(t)} stroke="var(--line)" strokeWidth={t === 0 ? 1.5 : 1} />
              <text x={M.l - 10} y={py(t) + 4} textAnchor="end" style={AXIS}>{format(t)}</text>
            </g>
          ))}
          {x.map((v) => <text key={v} x={px(v)} y={height - M.b + 20} textAnchor="middle" style={AXIS}>{v.toFixed(1)}</text>)}
          <text x={(M.l + width - M.r) / 2} y={height - 4} textAnchor="middle" style={AXIS}>{xLabel}</text>

          {hover !== null && <line x1={px(x[hover])} x2={px(x[hover])} y1={M.t} y2={height - M.b} stroke="var(--ink-3)" strokeDasharray="3 3" />}

          {series.map((s) => {
            const pts = s.values.map((v, i) => (v === null ? null : [px(x[i]), py(v)] as const)).filter((p) => p !== null);
            return (
              <g key={s.id}>
                <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth={2.5}
                  strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '7 5' : undefined} />
                {!s.dashed && pts.map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r={hover === i ? 5.5 : 4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <Tooltip left={px(x[hover])} width={width} title={`${xLabel} ${x[hover].toFixed(1)}`}
            rows={series.filter((s) => s.values[hover] !== null).map((s) => ({ label: s.label, color: s.color, value: format(s.values[hover] as number) }))} />
        )}
      </div>
      <Legend items={series} />
      <DataTable x={x} xLabel={xLabel} series={series} format={format} />
    </>
  );
}

interface BarProps { x: number[]; base: Series; top: Series; format: (v: number) => string; xLabel: string; ariaLabel: string; height?: number }

/** Two stacked segments per x: `base` from zero, `top` above it (or below zero when negative). */
export function StackedBars({ x, base, top, format, xLabel, ariaLabel, height = 300 }: BarProps) {
  const [ref, width] = useWidth(560);
  const [hover, setHover] = useState<number | null>(null);
  const b = base.values.map((v) => v ?? 0);
  const t = top.values.map((v) => v ?? 0);
  const { lo, hi, ticks } = niceScale(Math.min(0, ...t), Math.max(...b.map((v, i) => v + Math.max(t[i], 0))));
  const band = (width - M.l - M.r) / x.length;
  const bw = Math.min(56, band * 0.55);
  const cx = (i: number) => M.l + band * (i + 0.5);
  const py = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * (height - M.t - M.b);
  const GAP = 2;

  return (
    <>
      <div className={c.chartWrap} ref={ref}>
        <svg width={width} height={height} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
          {ticks.map((tk) => (
            <g key={tk}>
              <line x1={M.l} x2={width - M.r} y1={py(tk)} y2={py(tk)} stroke="var(--line)" strokeWidth={tk === 0 ? 1.5 : 1} />
              <text x={M.l - 10} y={py(tk) + 4} textAnchor="end" style={AXIS}>{format(tk)}</text>
            </g>
          ))}
          {x.map((v, i) => {
            const baseH = py(0) - py(b[i]);
            const topH = Math.abs(py(0) - py(t[i]));
            return (
              <g key={v} onMouseEnter={() => setHover(i)}>
                <rect x={cx(i) - band / 2} y={M.t} width={band} height={height - M.t - M.b} fill="transparent" />
                {baseH > 0.5 && <rect x={cx(i) - bw / 2} y={py(b[i])} width={bw} height={baseH} rx={3} fill={base.color} fillOpacity={hover === null || hover === i ? 1 : 0.55} />}
                {topH > 0.5 && (
                  <rect x={cx(i) - bw / 2} y={t[i] >= 0 ? py(b[i] + t[i]) - GAP : py(0) + GAP} width={bw} height={topH} rx={3}
                    fill={top.color} fillOpacity={hover === null || hover === i ? 1 : 0.55} />
                )}
                <text x={cx(i)} y={height - M.b + 20} textAnchor="middle" style={AXIS}>{v.toFixed(1)}</text>
              </g>
            );
          })}
          <text x={(M.l + width - M.r) / 2} y={height - 4} textAnchor="middle" style={AXIS}>{xLabel}</text>
        </svg>
        {hover !== null && (
          <Tooltip left={cx(hover)} width={width} title={`${xLabel} ${x[hover].toFixed(1)}`}
            rows={[{ label: top.label, color: top.color, value: format(t[hover]) }, { label: base.label, color: base.color, value: format(b[hover]) }]} />
        )}
      </div>
      <Legend items={[{ ...base, block: true }, { ...top, block: true }]} />
      <DataTable x={x} xLabel={xLabel} series={[base, top]} format={format} />
    </>
  );
}
