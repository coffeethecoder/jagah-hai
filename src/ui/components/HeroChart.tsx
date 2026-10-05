// Hero backdrop: a real reservation chart from the engine (Punjab Mail, random-fit), not an illustration.
import { generateDemand, runOnline } from '../../engine';
import { ROUTES } from '../state/useSimulation';
import c from '../styles/site.module.css';

const BERTHS = 26;
const SEED = 11;
const route = ROUTES.find((r) => r.id === '12137-punjab-mail') ?? ROUTES[0];
const n = route.stations.length - 1;
const coach = { berths: BERTHS, racBerths: 0 };
const requests = generateDemand(route, coach, { scenario: 'mixed', demandFactor: 1.2, tatkal: { enabled: false, fraction: 0.2 }, seed: SEED });
const run = runOnline('random-fit', requests, route, coach, SEED);
const seated = run.events.flatMap((e) => (e.outcome.kind === 'placed' ? [{ b: e.booking, berth: e.outcome.index }] : []));
// A few passengers turned away although every segment had room: drawn above the chart, with nowhere to sit.
const stranded = run.events
  .filter((e) => e.outcome.kind === 'rejected' && e.outcome.certificate.kind === 'strategy-induced')
  .slice(0, 3)
  .map((e) => e.booking);

const COL = 24, ROW = 22, TOP = 3 * ROW + 14;

export function HeroChart() {
  return (
    <div className={c.heroArt} aria-hidden>
      <svg viewBox={`0 0 ${n * COL} ${TOP + BERTHS * ROW}`} preserveAspectRatio="xMaxYMin slice">
        {stranded.map((b, i) => (
          <rect key={b.id} x={b.from * COL + 2} y={i * ROW + 4} width={(b.to - b.from) * COL - 4} height={ROW - 8} rx={4}
            fill="none" stroke="var(--amber-bright)" strokeWidth={1.5} strokeDasharray="6 4" />
        ))}
        {seated.map(({ b, berth }, i) => (
          <rect key={b.id} className={c.heroBar} style={{ ['--i' as string]: i }}
            x={b.from * COL + 2} y={TOP + berth * ROW + 3} width={(b.to - b.from) * COL - 4} height={ROW - 6} rx={4}
            fill="var(--green-bright)" fillOpacity={0.55 + 0.35 * ((b.id * 7) % 5) / 4} />
        ))}
      </svg>
    </div>
  );
}
