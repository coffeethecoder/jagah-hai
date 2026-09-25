// Seated by every tier on the same stream, with the two losses (SPEC 4.1, 7).
import type { RunResult } from '../../engine';
import { ONLINE, STRATEGY_NAME, type OnlineStrategy } from '../state/useSimulation';
import { ratio } from '../lib/format';
import s from '../styles/ui.module.css';

interface Props { runs: Record<OnlineStrategy | 'offline-optimum', RunResult>; current: OnlineStrategy; total: number }

export function TierComparison({ runs, current, total }: Props) {
  const optimum = runs['offline-optimum'].metrics.seated;
  const deferred = runs.deferred.metrics.seated;
  const rows = [...ONLINE, 'offline-optimum' as const].map((id) => ({ id, run: runs[id] }));
  const negative = (['first-fit', 'best-fit', 'random-fit'] as const).filter((id) => deferred - runs[id].metrics.seated < 0);

  return (
    <div className={s.section}>
      <h2>All strategies on this stream</h2>
      <p className={s.hint}>Whole stream, all {total} requests, whatever the playback position.</p>
      <div className={s.tableWrap}><table className={s.table}>
        <thead>
          <tr>
            <th>Strategy</th><th className={s.n}>Tier</th><th className={s.n}>Seated</th><th className={s.n}>Assignment</th>
            <th className={s.n}>Performance ratio</th><th className={s.n}>Lost to fragmentation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, run }) => (
            <tr key={id} className={id === current ? s.current : undefined}>
              <td>{STRATEGY_NAME[id]}</td>
              <td className={s.n}>{run.tier}</td>
              <td className={s.n}>{run.metrics.seated}</td>
              <td className={s.n}>{run.tier === 3 ? '' : run.metrics.strategyInduced}</td>
              <td className={s.n}>{ratio(optimum > 0 ? run.metrics.seated / optimum : null)}</td>
              <td className={s.n}>{run.tier === 1 ? deferred - run.metrics.seated : ''}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className={s.num}>
        Lost to first-come-first-served (optimum minus deferred): {optimum - deferred}.
      </p>
      <p className={s.hint}>
        Lost to fragmentation is deferred minus that strategy: what assigning berths at booking time cost.
        {negative.length > 0 && ` It is negative for ${negative.map((id) => STRATEGY_NAME[id]).join(' and ')} here: early waitlisting left room for more passengers later, which can happen on a single stream.`}
      </p>
    </div>
  );
}
