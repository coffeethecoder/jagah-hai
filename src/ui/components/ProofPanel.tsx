// Why a passenger was waitlisted: the certificate from the engine (SPEC 6), in words.
import { useState } from 'react';
import type { Booking, Route, StepEvent } from '../../engine';
import { CoachGrid } from './CoachGrid';
import { journey, plural, segmentName } from '../lib/format';
import s from '../styles/ui.module.css';

interface Props { route: Route; berths: number; event: StepEvent | null; requests: Booking[]; colW: number }

export function ProofPanel(props: Props) {
  // Remount per rejection so "Show a seating" starts closed each time.
  return <ProofBody key={props.event?.booking.id ?? 'none'} {...props} />;
}

function ProofBody({ route, berths, event, requests, colW }: Props) {
  const [showWitness, setShowWitness] = useState(false);
  if (!event || event.outcome.kind !== 'rejected') {
    return (
      <div className={s.section}>
        <h2>Why they were waitlisted</h2>
        <p className={s.muted}>Choose a waitlisted passenger to see the proof.</p>
      </div>
    );
  }
  const b = event.booking;
  const c = event.outcome.certificate;
  const title = <h3>Booking {b.id}: {journey(route, b)} ({plural(b.to - b.from, 'segment')})</h3>;

  if (c.kind === 'forced') {
    return (
      <div className={s.section}>
        <h2>Why they were waitlisted</h2>
        {title}
        <p>
          <span className={s.chip} style={{ background: 'var(--signal-red)' }}>Full here</span>{' '}
          Segment {segmentName(route, c.segment)} already carried {c.occupants.length} passengers on {berths} berths.
          No seating could fit one more.
        </p>
        <p className={s.hint}>The full segment is tinted red on the chart, and its passengers are outlined. They are:</p>
        <ul className={s.occupants}>
          {c.occupants.map((id) => <li key={id}>Booking {id} ({journey(route, requests[id])})</li>)}
        </ul>
      </div>
    );
  }

  const loads = Array.from({ length: b.to - b.from }, (_, i) => b.from + i).map((j) => ({ j, load: event.confirmedLoad[j] }));
  const everyone = Object.entries(c.witness).map(([id, berth]) => ({ booking: requests[Number(id)], berth }));
  return (
    <div className={s.section}>
      <h2>Why they were waitlisted</h2>
      {title}
      <p>
        <span className={s.chip} style={{ background: 'var(--signal-amber)' }}>Assignment</span>{' '}
        Every segment of this journey still had a free berth. The busiest carried {c.maxLoadOnRange} of {berths}.
        Earlier berth choices left no single berth free end to end.
      </p>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Segment</th><th className={s.n}>Passengers</th><th className={s.n}>Free berths</th></tr></thead>
        <tbody>
          {loads.map(({ j, load }) => (
            <tr key={j}><td>{segmentName(route, j)}</td><td className={s.n}>{load}</td><td className={s.n}>{berths - load}</td></tr>
          ))}
        </tbody>
      </table></div>
      {!showWitness ? (
        <div><button type="button" className={s.button} onClick={() => setShowWitness(true)}>Show a seating that fits everyone</button></div>
      ) : (
        <>
          <p>
            Here is a seating that fits everyone, including this passenger (amber): all {everyone.length} bookings on {berths} berths.
            It moves some earlier passengers to other berths, which is exactly what immediate assignment cannot do.
          </p>
          <div className={s.chartScroll} style={{ maxHeight: 480, overflowY: 'auto' }}>
            <CoachGrid route={route} berths={berths} colW={colW} ghostRow={false}
              seated={everyone.filter((e) => e.booking.id !== b.id)}
              rejected={{ booking: b, berth: c.witness[b.id] }} />
          </div>
        </>
      )}
    </div>
  );
}
