import type { SimView } from '../state/useSimulation';
import { ratio } from '../lib/format';
import s from '../styles/ui.module.css';

export function MetricsStrip({ view, racBerths }: { view: SimView; racBerths: number }) {
  const { counts } = view;
  const stat = (label: React.ReactNode, value: string | number, title: string) => (
    <div className={s.stat} title={title}>
      <span className={s.statValue}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
  const swatch = (color: string) => <span className={s.swatch} style={{ background: color }} aria-hidden />;

  return (
    <div className={s.strip} aria-live="off">
      {stat(<>{swatch('var(--signal-green)')}Seated</>, counts.seated, 'Passengers with a berth (or, for Deferred, guaranteed one at charting)')}
      {racBerths > 0 && stat('of which RAC', counts.rac, 'Seated in RAC places, two passengers to a side-lower berth')}
      {stat('Waitlisted', counts.waitlisted, 'Requests turned away so far')}
      {stat(<>{swatch('var(--signal-red)')}Full here</>, counts.forced, 'Turned away because some segment of the journey was full: no seating could fit them')}
      {stat(<>{swatch('var(--signal-amber)')}Assignment</>, counts.strategyInduced, 'Turned away although every segment had room: earlier berth choices blocked them')}
      {stat('Performance ratio', ratio(view.ratio), 'Seated so far divided by the most any seating could fit for the requests so far')}
    </div>
  );
}
