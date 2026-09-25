import { berthLabel, type Route } from '../../engine';
import type { SimView } from '../state/useSimulation';
import { journey, plural, segmentName } from '../lib/format';
import s from '../styles/ui.module.css';

export function RequestTicker({ route, view, berths }: { route: Route; view: SimView; berths: number }) {
  const e = view.current;
  if (!e) return <p className={s.ticker}>Choose a scenario and press Play to start booking.</p>;

  const b = e.booking;
  const request = (
    <strong>Booking {b.id}{b.isTatkal ? ' (tatkal)' : ''}: {journey(route, b)} ({plural(b.to - b.from, 'segment')}).</strong>
  );
  let outcome: React.ReactNode;
  if (e.outcome.kind === 'placed') {
    outcome = <>Seated on berth {berthLabel(e.outcome.index)}.</>;
  } else if (e.outcome.kind === 'pending') {
    outcome = <>Accepted. The berth is assigned when the chart is prepared.</>;
  } else if (e.outcome.certificate.kind === 'forced') {
    outcome = (
      <><span className={s.chip} style={{ background: 'var(--signal-red)' }}>Full here</span>{' '}
        Waitlisted: segment {segmentName(route, e.outcome.certificate.segment)} already carried {berths} passengers.</>
    );
  } else {
    outcome = (
      <><span className={s.chip} style={{ background: 'var(--signal-amber)' }}>Assignment</span>{' '}
        Waitlisted, although every segment of this journey had a free berth. No single berth was free end to end.</>
    );
  }

  return (
    <p className={s.ticker} aria-live="polite">
      {request} {outcome}
      {view.charted && <><br />Chart prepared: all {view.counts.seated} accepted bookings now have berths.</>}
      {view.pending > 0 && <><br /><span className={s.muted}>{plural(view.pending, 'booking')} waiting for charting. Jump to the end to prepare the chart.</span></>}
    </p>
  );
}
