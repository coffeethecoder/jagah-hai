// Unbounded mode (SPEC 4.6): berths First-fit needs to seat everyone vs the minimum possible.
import { useMemo } from 'react';
import { firstFitBerthsNeeded, peakLoad, type Booking } from '../../engine';
import s from '../styles/ui.module.css';

export function UnboundedPanel({ requests, n, berths }: { requests: Booking[]; n: number; berths: number }) {
  const { ff, omega } = useMemo(() => ({ ff: firstFitBerthsNeeded(requests, n), omega: peakLoad(requests, n) }), [requests, n]);
  return (
    <div className={s.section}>
      <h2>With unlimited berths</h2>
      <p className={s.num}>
        Berths First-fit would need to seat everyone: <strong>{ff}</strong>. Minimum possible: <strong>{omega}</strong> (the busiest segment).
        This coach has {berths}.
      </p>
      <p className={`${s.hint} ${s.num}`}>
        {ff === omega ? 'On this stream First-fit needs no extra berths.' : `First-fit needs ${ff - omega} more than the minimum, a ratio of ${(ff / omega).toFixed(3)}.`}
      </p>
    </div>
  );
}
