// Why a passenger was waitlisted: the certificate from the engine (SPEC 6), in words.
import { useState } from 'react';
import type { Booking, CoachConfig, Route, StepEvent } from '../../engine';
import { CoachGrid } from './CoachGrid';
import { journey, plural, segmentName } from '../lib/format';
import s from '../styles/ui.module.css';

interface Props { route: Route; coach: CoachConfig; event: StepEvent | null; requests: Booking[]; colW: number }

export function ProofPanel(props: Props) {
  // Remount per rejection so "Show a seating" starts closed each time.
  return <ProofBody key={props.event?.booking.id ?? 'none'} {...props} />;
}

function ProofBody({ route, coach, event, requests, colW }: Props) {
  const berths = coach.berths;
  const slots = 2 * coach.racBerths;
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
    // With RAC, forced means both pools were full on this journey (SPEC 6); the certificate names the confirmed one.
    const racFull = slots > 0 ? Array.from({ length: b.to - b.from }, (_, i) => b.from + i).find((j) => event.racLoad[j] === slots) ?? null : null;
    return (
      <div className={s.section}>
        <h2>Why they were waitlisted</h2>
        {title}
        <p>
          <span className={s.chip} style={{ background: 'var(--signal-red)' }}>Full here</span>{' '}
          Segment {segmentName(route, c.segment)} already carried {c.occupants.length} passengers on {berths} berths.
          {racFull !== null && <> The {slots} RAC places were full too, on segment {segmentName(route, racFull)}.</>}
          {' '}No seating could fit one more.
        </p>
        <p className={s.hint}>The full segment is tinted red on the chart, and its passengers are outlined. They are:</p>
        <ul className={s.occupants}>
          {c.occupants.map((id) => <li key={id}>Booking {id} ({journey(route, requests[id])})</li>)}
        </ul>
      </div>
    );
  }

  // The witness lives in one pool: confirmed berths, or RAC places when confirmed was full on part of the journey.
  const rac = c.pool === 'rac';
  const capacity = rac ? slots : berths;
  const place = rac ? 'RAC place' : 'berth';
  const loads = Array.from({ length: b.to - b.from }, (_, i) => b.from + i).map((j) => ({ j, load: (rac ? event.racLoad : event.confirmedLoad)[j] }));
  const everyone = Object.entries(c.witness).map(([id, index]) => ({ booking: requests[Number(id)], pool: c.pool, index }));
  return (
    <div className={s.section}>
      <h2>Why they were waitlisted</h2>
      {title}
      <p>
        <span className={s.chip} style={{ background: 'var(--signal-amber)' }}>Assignment</span>{' '}
        {rac && 'Confirmed berths were full on part of this journey, but RAC was not. '}
        Every segment of this journey still had a free {place}. The busiest carried {c.maxLoadOnRange} of {capacity}.
        Earlier choices left no single {place} free end to end.
      </p>
      <div className={s.tableWrap}><table className={s.table}>
        <thead><tr><th>Segment</th><th className={s.n}>Passengers</th><th className={s.n}>Free {place}s</th></tr></thead>
        <tbody>
          {loads.map(({ j, load }) => (
            <tr key={j}><td>{segmentName(route, j)}</td><td className={s.n}>{load}</td><td className={s.n}>{capacity - load}</td></tr>
          ))}
        </tbody>
      </table></div>
      {!showWitness ? (
        <div><button type="button" className={s.button} onClick={() => setShowWitness(true)}>Show a seating that fits everyone</button></div>
      ) : (
        <>
          <p>
            Here is a seating that fits everyone, including this passenger (amber): all {everyone.length} bookings on {capacity} {place}s.
            It moves some earlier passengers to other {place}s, which is exactly what immediate assignment cannot do.
          </p>
          <div className={s.chartScroll} style={{ maxHeight: 480, overflowY: 'auto' }}>
            <CoachGrid route={route} berths={rac ? 0 : berths} racBerths={rac ? coach.racBerths : 0} colW={colW} ghostRow={false}
              seated={everyone.filter((e) => e.booking.id !== b.id)}
              rejected={{ booking: b, pool: c.pool, index: c.witness[b.id] }} />
          </div>
        </>
      )}
    </div>
  );
}
