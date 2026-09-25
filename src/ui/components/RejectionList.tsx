import type { Route, StepEvent } from '../../engine';
import { journey } from '../lib/format';
import s from '../styles/ui.module.css';

interface Props { route: Route; rejections: StepEvent[]; selected: number | null; onSelect: (bookingId: number) => void }

export function RejectionList({ route, rejections, selected, onSelect }: Props) {
  const forced = rejections.filter((e) => e.outcome.kind === 'rejected' && e.outcome.certificate.kind === 'forced').length;
  return (
    <div className={s.section}>
      <h2>Waitlisted passengers</h2>
      {rejections.length === 0 ? (
        <p className={s.muted}>No one has been waitlisted yet.</p>
      ) : (
        <>
          <p className={s.num}>
            {rejections.length} waitlisted: {forced} full here, {rejections.length - forced} assignment. Choose one to see why.
          </p>
          <div className={s.chips}>
            {rejections.map((e) => {
              if (e.outcome.kind !== 'rejected') return null;
              const isForced = e.outcome.certificate.kind === 'forced';
              const label = isForced ? 'Full here' : 'Assignment';
              return (
                <button key={e.booking.id} type="button" className={s.rejChip}
                  style={{ background: isForced ? 'var(--signal-red)' : 'var(--signal-amber)' }}
                  aria-pressed={selected === e.booking.id}
                  aria-label={`Booking ${e.booking.id}, ${journey(route, e.booking)}, ${label.toLowerCase()}`}
                  title={journey(route, e.booking)}
                  onClick={() => onSelect(e.booking.id)}>
                  {e.booking.id} {label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
