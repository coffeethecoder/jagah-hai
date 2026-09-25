// Layout (SPEC 13.3).
import { useEffect, useRef, useState } from 'react';
import type { Route } from '../engine';
import { ROUTES, STRATEGY_NAME, chartOrder, useSimulation, type SimView } from './state/useSimulation';
import { ControlPanel } from './components/ControlPanel';
import { Playback } from './components/Playback';
import { MetricsStrip } from './components/MetricsStrip';
import { RequestTicker } from './components/RequestTicker';
import { CoachGrid, columnWidth } from './components/CoachGrid';
import { LoadProfile } from './components/LoadProfile';
import { ChartingView } from './components/ChartingView';
import { RejectionList } from './components/RejectionList';
import { ProofPanel } from './components/ProofPanel';
import { TierComparison } from './components/TierComparison';
import { UnboundedPanel } from './components/UnboundedPanel';
import s from './styles/ui.module.css';

const SCENARIO_WORDS = { mixed: 'mixed trips', short: 'mostly short trips', long: 'mostly long trips', uniform: 'uniform trip lengths' };

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export function App() {
  const sim = useSimulation();
  const { config, setConfig, route, requests, runs, view, compareView, selected, playback } = sim;
  const [chartRef, chartWidth] = useWidth();
  const [proofRef, proofWidth] = useWidth();
  const n = route.stations.length - 1;
  const boards = compareView ? [view, compareView] : [view];
  const colW = columnWidth(compareView ? (chartWidth - 24) / 2 : chartWidth, n);
  const first = route.stations[0];
  const last = route.stations[route.stations.length - 1];
  const forced = selected?.outcome.kind === 'rejected' && selected.outcome.certificate.kind === 'forced' ? selected.outcome.certificate : null;

  const board = (v: SimView, isPrimary: boolean) => (
    <div className={s.board} key={v.strategy}>
      {compareView && (
        <h3 className={s.num}>
          {STRATEGY_NAME[v.strategy]}: {v.counts.seated} seated, {v.counts.waitlisted} waitlisted ({v.counts.strategyInduced} assignment)
        </h3>
      )}
      <CoachGrid route={route} berths={config.berths} colW={colW} seated={v.seated} current={v.current}
        animateEntry={v.charting}
        highlightSegment={isPrimary && forced ? forced.segment : null}
        emphasis={isPrimary && forced ? new Set(forced.occupants) : null} />
      <LoadProfile route={route} load={v.load} capacity={config.berths} colW={colW} />
      {/* Below the chart, so grids line up row for row in compare mode. */}
      {v.strategy === 'deferred' && (
        <ChartingView route={route} colW={colW} accepted={chartOrder(runs.deferred, v.step)} pending={v.pending}
          bookingClosed={v.step === v.total} charting={v.charting} onPrepare={sim.prepareChart} />
      )}
    </div>
  );

  return (
    <div className={s.app}>
      <Header route={route} first={first} last={last}>
        {config.berths} berths, {SCENARIO_WORDS[config.scenario]}, demand {config.demandFactor.toFixed(1)} times capacity
        {config.tatkal ? `, tatkal surge ${Math.round(config.tatkalFraction * 100)}%` : ''}, seed {config.seed}
      </Header>

      <aside className={s.sidebar}>
        <ControlPanel config={config} routes={ROUTES} onChange={setConfig} />
        <Playback
          step={view.step} total={view.total} playing={playback.playing} speed={playback.speed}
          onStep={playback.stepForward} onTogglePlay={playback.togglePlay} onReset={playback.reset}
          onJumpToEnd={playback.jumpToEnd} onSpeed={playback.setSpeed}
        />
      </aside>

      <main className={s.main}>
        <MetricsStrip view={view} />
        <RequestTicker route={route} view={view} berths={config.berths} />
        <div className={s.chartScroll} ref={chartRef}>
          <div className={s.boards}>{boards.map((v, i) => board(v, i === 0))}</div>
        </div>
      </main>

      <div className={s.bottom}>
        <div className={s.panel} ref={proofRef}>
          <RejectionList route={route} rejections={view.rejections} selected={selected?.booking.id ?? null} onSelect={sim.select} />
          <ProofPanel route={route} berths={config.berths} event={selected} requests={requests} colW={columnWidth(proofWidth, n)} />
        </div>
        <div className={s.panel}>
          <TierComparison runs={runs} current={config.strategy} total={view.total} />
          <UnboundedPanel requests={requests} n={n} berths={config.berths} />
        </div>
      </div>
    </div>
  );
}

function Header({ route, first, last, children }: { route: Route; first: Route['stations'][number]; last: Route['stations'][number]; children: React.ReactNode }) {
  return (
    <header className={s.header}>
      <h1>{route.name}</h1>
      <p>{first.code} {first.name} → {last.code} {last.name}</p>
      <p className={s.muted}>{children}</p>
    </header>
  );
}
