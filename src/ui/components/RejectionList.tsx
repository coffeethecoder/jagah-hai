import type { Route, StepEvent } from '../../engine';
import { journey } from '../lib/format';
import s from '../styles/ui.module.css';

interface Props { route: Route; rejections: StepEvent[]; selected: number | null; onSelect: (bookingId: number) => void }

export function RejectionList({ route, rejections, selected, onSelect }: Props) {
  const forced = rejections.filter((e) => e.outcome.kind === 'rejected' && e.outcome.certificate.kind === 'forced').length;
  const assignment = rejections.length - forced;

  return (
    <div className={s.section}>
      <h2>Waitlist Manifest (WL)</h2>
      {rejections.length === 0 ? (
        <p className={s.muted}>No passengers waitlisted yet on this train run.</p>
      ) : (
        <>
          <p className={s.num} style={{ fontSize: '0.8125rem' }}>
            <strong>{rejections.length} Turned Away:</strong>{' '}
            <span className={`${s.statBadge} ${s.badgeRed}`}>{forced} FULL</span>{' '}
            <span className={`${s.statBadge} ${s.badgeAmber}`}>{assignment} PACKING LOSS</span>
          </p>
          <div className={s.chips} role="region" aria-label="Waitlisted reservation list">
            {rejections.map((e) => {
              if (e.outcome.kind !== 'rejected') return null;
              const isForced = e.outcome.certificate.kind === 'forced';
              const label = isForced ? 'Train Full' : 'Fragmented';
              return (
                <button
                  key={e.booking.id}
                  type="button"
                  className={`${s.rejChip} ${isForced ? s.rejRed : s.rejAmber}`}
                  aria-pressed={selected === e.booking.id}
                  aria-label={`Booking ${e.booking.id}, ${journey(route, e.booking)}, ${label}`}
                  title={`#${e.booking.id}: ${journey(route, e.booking)} [${label}]`}
                  onClick={() => onSelect(e.booking.id)}
                >
                  #{e.booking.id}
                </button>
              );
            })}
          </div>
          <p className={s.hint}>Select any waitlisted passenger to inspect their allocation proof.</p>
        </>
      )}
    </div>
  );
}
