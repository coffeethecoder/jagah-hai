// The simulator: setup | chart | proofs and comparisons.
import { ROUTES, STRATEGY_NAME, chartOrder, useSimulation, type SimView } from '../state/useSimulation';
import { ControlPanel } from '../components/ControlPanel';
import { Playback } from '../components/Playback';
import { MetricsStrip } from '../components/MetricsStrip';
import { RequestTicker } from '../components/RequestTicker';
import { CoachGrid, columnWidth } from '../components/CoachGrid';
import { LoadProfile } from '../components/LoadProfile';
import { ChartingView, PrepareChart } from '../components/ChartingView';
import { RejectionList } from '../components/RejectionList';
import { ProofPanel } from '../components/ProofPanel';
import { TierComparison } from '../components/TierComparison';
import { UnboundedPanel } from '../components/UnboundedPanel';
import { plural } from '../lib/format';
import { useWidth } from '../lib/useWidth';
import s from '../styles/ui.module.css';

const SCENARIO_WORDS = { mixed: 'Mixed trips', short: 'Mostly short trips', long: 'Mostly long trips', uniform: 'Uniform trip lengths' };

/** What an empty grid should say, if anything. */
function placeholderFor(v: SimView): string | null {
  if (v.step === 0) return 'Press Play to watch booking requests arrive';
  if (v.strategy === 'deferred' && !v.charting && v.pending.length > 0) {
    return `${plural(v.pending.length, 'booking')} accepted. Berths are assigned at charting.`;
  }
  return null;
}

export function Simulator() {
  const sim = useSimulation();
  const { config, setConfig, route, requests, runs, view, compareView, selected, playback } = sim;
  const [chartRef, chartWidth] = useWidth();
  const [proofRef, proofWidth] = useWidth();
  const n = route.stations.length - 1;
  const boards = compareView ? [view, compareView] : [view];
  const colW = columnWidth(compareView ? (chartWidth - 24) / 2 : chartWidth, n);
  const first = route.stations[0];
  const last = route.stations[route.stations.length - 1];
  const coach = { berths: config.berths, racBerths: config.racBerths };
  const forced = selected?.outcome.kind === 'rejected' && selected.outcome.certificate.kind === 'forced' ? selected.outcome.certificate : null;

  const deferredView = boards.find((v) => v.strategy === 'deferred');
  const accepted = deferredView ? chartOrder(runs.deferred, deferredView.step).map((x) => x.booking) : [];

  const board = (v: SimView, isPrimary: boolean) => (
    <div className={s.board} key={v.strategy}>
      {compareView && (
        <h3 className={s.num}>
          {STRATEGY_NAME[v.strategy]}: {v.counts.seated} seated, {v.counts.waitlisted} waitlisted ({v.counts.strategyInduced} assignment)
        </h3>
      )}
      {/* Above the chart, so it needs no scrolling. The other board gets a hidden copy so grids line up row for row in compare mode. */}
      {deferredView && (
        <div style={v === deferredView ? undefined : { visibility: 'hidden' }} aria-hidden={v !== deferredView}>
          <PrepareChart accepted={accepted.length} pending={deferredView.pending.length} bookingClosed={v.step === v.total}
            charting={deferredView.charting} onPrepare={sim.prepareChart} />
        </div>
      )}
      <CoachGrid route={route} berths={config.berths} racBerths={config.racBerths} colW={colW} seated={v.seated} current={v.current}
        animateEntry={v.charting} placeholder={placeholderFor(v)}
        highlightSegment={isPrimary && forced ? forced.segment : null}
        emphasis={isPrimary && forced ? new Set(forced.occupants) : null} />
      <LoadProfile route={route} load={v.load} capacity={config.berths} colW={colW} />
      {config.racBerths > 0 && <LoadProfile route={route} load={v.racLoad} capacity={2 * config.racBerths} colW={colW} label="RAC" />}
      {v === deferredView && <ChartingView route={route} colW={colW} accepted={accepted} pending={v.pending} />}
    </div>
  );

  return (
    <div className={`${s.app} ${compareView ? s.wide : ''}`}>
      <header className={s.header}>
        <p className={s.eyebrow}>Simulator</p>
        <div className={s.headline}>
          <h1>{route.name}</h1>
          <p>{first.name} ({first.code}) to {last.name} ({last.code}), {route.stations.length} stops</p>
        </div>
        <ul className={s.tags} aria-label="Current setup">
          <li>{config.berths} berths{config.racBerths > 0 ? ` + ${config.racBerths} RAC` : ''}</li>
          <li>{SCENARIO_WORDS[config.scenario]}</li>
          <li>Demand {config.demandFactor.toFixed(1)} times capacity</li>
          {config.tatkal && <li>Tatkal surge {Math.round(config.tatkalFraction * 100)}%</li>}
          <li>Seed {config.seed}</li>
          <li>{requests.length} requests</li>
        </ul>
      </header>

      <aside className={s.sidebar}>
        <ControlPanel config={config} routes={ROUTES} onChange={setConfig} />
      </aside>

      <main className={s.main}>
        <div className={s.pinned}>
          <MetricsStrip view={view} racBerths={config.racBerths} />
          <div className={s.transport}>
            <Playback
              step={view.step} total={view.total} playing={playback.playing} speed={playback.speed}
              onStep={playback.stepForward} onTogglePlay={playback.togglePlay} onReset={playback.reset}
              onJumpToEnd={playback.jumpToEnd} onSpeed={playback.setSpeed}
            />
            <RequestTicker route={route} view={view} coach={coach} />
          </div>
        </div>

        <section className={s.sheet} aria-labelledby="chart-heading">
          <div className={s.sheetHead}>
            <h2 id="chart-heading">Reservation chart</h2>
            <p>{config.berths} berths down, {n} segments across. Each bar is one passenger's journey.</p>
          </div>
          <ul className={s.legend}>
            <li><span className={`${s.key} ${s.keySeated}`} aria-hidden />Seated</li>
            <li><span className={`${s.key} ${s.keyCurrent}`} aria-hidden />Seated at this step</li>
            {boards.some((v) => v.strategy === 'deferred') && <li><span className={`${s.key} ${s.keyPending}`} aria-hidden />Pending, no berth yet</li>}
            {config.racBerths > 0 && <li><span className={`${s.key} ${s.keyRac}`} aria-hidden />RAC, half a shared berth</li>}
            {forced && <li><span className={`${s.key} ${s.keyFull}`} aria-hidden />Full segment in the proof</li>}
          </ul>
          <div className={s.chartScroll} ref={chartRef}>
            <div className={s.boards}>{boards.map((v, i) => board(v, i === 0))}</div>
          </div>
        </section>
      </main>

      <div className={s.side}>
        <div className={s.panel} ref={proofRef} style={{ ['--chart-bg' as string]: 'var(--surface)' }}>
          <RejectionList route={route} rejections={view.rejections} selected={selected?.booking.id ?? null} onSelect={sim.select} />
          <ProofPanel route={route} coach={coach} event={selected} requests={requests} colW={columnWidth(proofWidth - 48, n)} />
        </div>
        <div className={s.panel}>
          <TierComparison runs={runs} current={config.strategy} total={view.total} racBerths={config.racBerths} />
          <UnboundedPanel requests={requests} n={n} berths={config.berths} />
        </div>
      </div>
    </div>
  );
}
