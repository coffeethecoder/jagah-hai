import { berthLabel, racSlotLabel, type CoachConfig, type Route } from '../../engine';
import type { SimView } from '../state/useSimulation';
import { journey, plural, segmentName } from '../lib/format';
import s from '../styles/ui.module.css';

export function RequestTicker({ route, view, coach }: { route: Route; view: SimView; coach: CoachConfig }) {
  const e = view.current;
  if (!e) return <p className={s.ticker}>Choose a scenario and press Play to start booking.</p>;

  const b = e.booking;
  const request = (
    <strong>Booking {b.id}{b.isTatkal ? ' (tatkal)' : ''}: {journey(route, b)} ({plural(b.to - b.from, 'segment')}).</strong>
  );
  let outcome: React.ReactNode;
  if (e.outcome.kind === 'placed') {
    outcome = e.outcome.pool === 'confirmed'
      ? <>Seated on berth {berthLabel(e.outcome.index)}.</>
      : <>No berth was free, so RAC: place {racSlotLabel(e.outcome.index)}, sharing a side-lower berth.</>;
  } else if (e.outcome.kind === 'pending') {
    outcome = e.outcome.pool === 'confirmed'
      ? <>Accepted. The berth is assigned when the chart is prepared.</>
      : <>Accepted for RAC, since confirmed berths are full on this journey. The place is assigned when the chart is prepared.</>;
  } else if (e.outcome.certificate.kind === 'forced') {
    outcome = (
      <><span className={s.chip} style={{ background: 'var(--signal-red)' }}>Full here</span>{' '}
        Waitlisted: segment {segmentName(route, e.outcome.certificate.segment)} already carried {coach.berths} passengers
        {coach.racBerths > 0 ? `, and the ${2 * coach.racBerths} RAC places were taken too` : ''}.</>
    );
  } else {
    const where = e.outcome.certificate.pool === 'confirmed' ? 'berth' : 'RAC place';
    outcome = (
      <><span className={s.chip} style={{ background: 'var(--signal-amber)' }}>Assignment</span>{' '}
        Waitlisted, although every segment of this journey had a free {where}. No single {where} was free end to end.</>
    );
  }

  return (
    <p className={s.ticker} aria-live="polite">
      {request} {outcome}
      {view.charted && <><br />Chart prepared: all {view.counts.seated} accepted bookings now have places.</>}
      {!view.charting && view.pending.length > 0 && (
        <><br /><span className={s.muted}>
          {view.step === view.total
            ? `Booking has closed. ${plural(view.pending.length, 'booking')} wait for the chart: press Prepare chart under the grid.`
            : `${plural(view.pending.length, 'booking')} waiting for charting.`}
        </span></>
      )}
    </p>
  );
}
