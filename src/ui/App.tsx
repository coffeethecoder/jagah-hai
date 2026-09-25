// Layout (SPEC 13.3). Phase 6 adds the rejection list, proof panel, charting view and comparisons.
import { useEffect, useRef, useState } from 'react';
import { ROUTES, useSimulation } from './state/useSimulation';
import { ControlPanel } from './components/ControlPanel';
import { Playback } from './components/Playback';
import { MetricsStrip } from './components/MetricsStrip';
import { RequestTicker } from './components/RequestTicker';
import { CoachGrid, columnWidth } from './components/CoachGrid';
import { LoadProfile } from './components/LoadProfile';
import s from './styles/ui.module.css';

const SCENARIO_WORDS = { mixed: 'mixed trips', short: 'mostly short trips', long: 'mostly long trips', uniform: 'uniform trip lengths' };

export function App() {
  const { config, setConfig, route, view, playback } = useSimulation();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const colW = columnWidth(chartWidth, route.stations.length - 1);
  const first = route.stations[0];
  const last = route.stations[route.stations.length - 1];

  return (
    <div className={s.app}>
      <header className={s.header}>
        <h1>{route.name}</h1>
        <p>{first.code} {first.name} → {last.code} {last.name}</p>
        <p className={s.muted}>
          {config.berths} berths, {SCENARIO_WORDS[config.scenario]}, demand {config.demandFactor.toFixed(1)} times capacity
          {config.tatkal ? `, tatkal surge ${Math.round(config.tatkalFraction * 100)}%` : ''}, seed {config.seed}
        </p>
      </header>

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
          <CoachGrid route={route} berths={config.berths} colW={colW} seated={view.seated} current={view.current} />
          <LoadProfile route={route} load={view.load} capacity={config.berths} colW={colW} />
        </div>
      </main>
    </div>
  );
}
