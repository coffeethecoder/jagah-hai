import type { Route, StepEvent } from '../../engine';
import { journey } from '../lib/format';
import s from '../styles/ui.module.css';

interface Props {
  route: Route; rejections: StepEvent[]; selected: number | null; onSelect: (bookingId: number) => void;
  recovered?: Set<number> | null;   // re-chart: waitlisted passengers who now have a place
}

export function RejectionList({ route, rejections, selected, onSelect, recovered = null }: Props) {
  const forced = rejections.filter((e) => e.outcome.kind === 'rejected' && e.outcome.certificate.kind === 'forced').length;
  const assignment = rejections.length - forced;

  return (
    <div className={s.section}>
      <h2>Waitlisted passengers</h2>
      {rejections.length === 0 ? (
        <p className={s.muted}>No passengers waitlisted yet on this train run.</p>
      ) : (
        <>
          <p className={s.num} style={{ fontSize: '0.8125rem' }}>
            <strong>{rejections.length} Turned Away:</strong>{' '}
            <span className={`${s.statBadge} ${s.badgeRed}`}>{forced} FULL HERE</span>{' '}
            <span className={`${s.statBadge} ${s.badgeAmber}`}>{assignment} FRAGMENTED</span>
            {recovered && <>{' '}<span className={`${s.statBadge} ${s.badgeGreen}`}>{recovered.size} SEATED BY RE-CHART</span></>}
          </p>
          <div className={s.chips} role="region" aria-label="Waitlisted reservation list">
            {rejections.map((e) => {
              if (e.outcome.kind !== 'rejected') return null;
              const isForced = e.outcome.certificate.kind === 'forced';
              const back = recovered?.has(e.booking.id) ?? false;
              const label = back ? 'Seated by re-chart' : isForced ? 'Full here' : 'Fragmented';
              return (
                <button
                  key={e.booking.id}
                  type="button"
                  className={`${s.rejChip} ${back ? s.rejGreen : isForced ? s.rejRed : s.rejAmber}`}
                  aria-pressed={selected === e.booking.id}
                  aria-label={`Booking ${e.booking.id}, ${journey(route, e.booking)}, ${label}`}
                  title={`#${e.booking.id}: ${journey(route, e.booking)} [${label}]`}
                  onClick={() => onSelect(e.booking.id)}
                >
                  {back ? '✓' : '#'}{e.booking.id}
                </button>
              );
            })}
          </div>
          <p className={s.hint}>Click a booking number to see why that passenger was waitlisted.</p>
        </>
      )}
    </div>
  );
}
