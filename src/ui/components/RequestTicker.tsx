import { berthLabel, racSlotLabel, type CoachConfig, type Route } from '../../engine';
import type { SimView } from '../state/useSimulation';
import { journey, plural, segmentName } from '../lib/format';
import s from '../styles/ui.module.css';

export function RequestTicker({ route, view, coach }: { route: Route; view: SimView; coach: CoachConfig }) {
  const e = view.current;
  if (!e) {
    return (
      <div className={s.ticker}>
        <div className={s.tickerTop}>
          <span className={s.ticketPnr}>STATUS // IDLE</span>
          <span className={s.ticketSegments}>Awaiting dispatch. Press Play or Step to process passenger stream.</span>
        </div>
      </div>
    );
  }

  const b = e.booking;
  let statusBadge: React.ReactNode;
  let explanation: React.ReactNode;

  if (e.outcome.kind === 'placed') {
    if (e.outcome.pool === 'confirmed') {
      statusBadge = <span className={`${s.chip} ${s.chipGreen}`}>CNF • BERTH {berthLabel(e.outcome.index)}</span>;
      explanation = <>Berth reserved end-to-end.</>;
    } else {
      statusBadge = <span className={`${s.chip} ${s.chipGreen}`}>RAC • PLACE {racSlotLabel(e.outcome.index)}</span>;
      explanation = <>Confirmed berths full; allocated shared side-lower berth place.</>;
    }
  } else if (e.outcome.kind === 'pending') {
    if (e.outcome.pool === 'confirmed') {
      statusBadge = <span className={`${s.chip} ${s.chipGreen}`}>CONFIRMED (DEFERRED)</span>;
      explanation = <>Berth reservation guaranteed; berth index assigned at final charting.</>;
    } else {
      statusBadge = <span className={`${s.chip} ${s.chipGreen}`}>RAC (DEFERRED)</span>;
      explanation = <>Confirmed pool full; RAC place guaranteed and assigned at charting.</>;
    }
  } else if (e.outcome.certificate.kind === 'forced') {
    statusBadge = <span className={`${s.chip} ${s.chipRed}`}>REGRET • TRAIN FULL</span>;
    explanation = (
      <>
        Segment <strong>{segmentName(route, e.outcome.certificate.segment)}</strong> reached full capacity ({coach.berths} seated
        {coach.racBerths > 0 ? ` + ${2 * coach.racBerths} RAC` : ''}). No algorithm could fit this trip.
      </>
    );
  } else {
    const where = e.outcome.certificate.pool === 'confirmed' ? 'berth' : 'RAC place';
    statusBadge = <span className={`${s.chip} ${s.chipAmber}`}>WL • FRAGMENTED</span>;
    explanation = (
      <>
        Every intermediate segment had an available {where}, but previous assignments left no continuous single {where} open end-to-end.
      </>
    );
  }

  return (
    <div className={s.ticker} aria-live="polite">
      <div className={s.tickerTop}>
        <span className={s.ticketPnr}>PNR #B-{b.id.toString().padStart(3, '0')}</span>
        {b.isTatkal && <span className={`${s.chip} ${s.chipAmber}`}>TATKAL</span>}
        <span className={s.ticketRoute}>{journey(route, b)}</span>
        <span className={s.ticketSegments}>({plural(b.to - b.from, 'segment')})</span>
        {statusBadge}
      </div>
      <div>
        {explanation}
        {view.charted && <> All {view.counts.seated} accepted bookings charted into coach berths.</>}
        {!view.charting && view.pending.length > 0 && (
          <span className={s.muted}>
            {' '}
            {view.step === view.total
              ? `Booking closed. ${plural(view.pending.length, 'booking')} awaiting coach charting: press Prepare Chart.`
              : `${plural(view.pending.length, 'booking')} queued for charting.`}
          </span>
        )}
      </div>
    </div>
  );
}
