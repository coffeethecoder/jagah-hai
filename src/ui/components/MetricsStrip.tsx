import type { SimView } from '../state/useSimulation';
import { ratio } from '../lib/format';
import s from '../styles/ui.module.css';

export function MetricsStrip({ view, racBerths }: { view: SimView; racBerths: number }) {
  const { counts } = view;

  return (
    <div className={s.strip} aria-live="off" role="region" aria-label="Occupancy and reservation status">
      <div className={s.stat} title="Passengers with a berth (or, for Deferred, guaranteed one at charting)">
        <span className={s.statValue}>{counts.seated}</span>
        <span className={s.statLabel}>
          <span className={`${s.statBadge} ${s.badgeGreen}`}>CNF</span>
          Seated
        </span>
      </div>

      {racBerths > 0 && (
        <div className={s.stat} title="Seated in RAC places, two passengers to a side-lower berth">
          <span className={s.statValue}>{counts.rac}</span>
          <span className={s.statLabel}>
            <span className={`${s.statBadge} ${s.badgeGreen}`}>RAC</span>
            Places
          </span>
        </div>
      )}

      <div className={s.stat} title="Total reservation requests turned away so far">
        <span className={s.statValue}>{counts.waitlisted}</span>
        <span className={s.statLabel}>
          <span className={`${s.statBadge} ${s.badgeBlue}`}>WL</span>
          Waitlisted
        </span>
      </div>

      <div className={s.stat} title="Turned away because some segment of the journey was full: no seating could fit them">
        <span className={s.statValue}>{counts.forced}</span>
        <span className={s.statLabel}>
          <span className={`${s.statBadge} ${s.badgeRed}`}>REGRET</span>
          Full here
        </span>
      </div>

      <div className={s.stat} title="Turned away although every segment had room: earlier berth choices blocked them">
        <span className={s.statValue}>{counts.strategyInduced}</span>
        <span className={s.statLabel}>
          <span className={`${s.statBadge} ${s.badgeAmber}`}>FRAG</span>
          Assignment
        </span>
      </div>

      <div className={s.stat} title="Seated so far divided by the most any seating could fit for the requests so far">
        <span className={s.statValue}>{ratio(view.ratio)}</span>
        <span className={s.statLabel}>
          <span className={`${s.statBadge} ${s.badgeBlue}`}>RATIO</span>
          Packing Eff.
        </span>
      </div>
    </div>
  );
}
