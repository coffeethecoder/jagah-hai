// A small reservation chart for explanations: stations across the top, one row per berth or request.
import c from '../styles/site.module.css';

export interface DiagramBar { from: number; to: number; text: string; kind: 'seated' | 'free' | 'request' }
export interface DiagramRow { label: string; bars: DiagramBar[] }

const KIND = { seated: c.barSeated, free: c.barFree, request: c.barRequest };

export function Diagram({ stations, rows, caption }: { stations: string[]; rows: DiagramRow[]; caption?: string }) {
  const segments = stations.length - 1;
  return (
    <figure className={c.diagram} style={{ margin: 0 }}>
      <div className={c.diagramGrid} style={{ gridTemplateColumns: `max-content repeat(${segments}, minmax(0, 1fr))` }}>
        <span />
        {stations.slice(0, -1).map((name, j) => (
          <span key={name} className={c.station} style={{ display: 'flex', justifyContent: 'space-between', padding: '0 3px' }}>
            {name}{j === segments - 1 && <span>{stations[segments]}</span>}
          </span>
        ))}
        {rows.map((row, i) => <Row key={row.label} row={row} gridRow={i + 2} />)}
      </div>
      {caption && <figcaption className={c.caption}>{caption}</figcaption>}
    </figure>
  );
}

/** Each row is pinned to its own grid row, so bars never wrap onto another line. */
function Row({ row, gridRow }: { row: DiagramRow; gridRow: number }) {
  return (
    <>
      <span className={c.rowLabel} style={{ gridColumn: 1, gridRow }}>{row.label}</span>
      {row.bars.map((b) => (
        <span key={`${b.from}-${b.to}`} className={`${c.bar} ${KIND[b.kind]}`} style={{ gridColumn: `${b.from + 2} / ${b.to + 2}`, gridRow }}>{b.text}</span>
      ))}
    </>
  );
}
