// The simulator: setup | chart | proofs and comparisons.
import { useState } from 'react';
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
  if (v.step === 0) return 'Press Dispatch to watch booking requests arrive';
  if (v.strategy === 'deferred' && !v.charting && v.pending.length > 0) {
    return `${plural(v.pending.length, 'booking')} accepted. Berths are assigned at charting.`;
  }
  return null;
}

export function Simulator() {
  const sim = useSimulation();
  const { config, setConfig, route, requests, runs, view, selected, playback } = sim;
  // Simple view (default): the story only. "Show all options" reveals everything marked advanced, and compare mode.
  const [simple, setSimple] = useState(true);
  const compareView = simple ? null : sim.compareView;
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

  const board = (v: SimView, isPrimary: boolean) => {
    // Re-chart: only on a single board, so the two grids in compare mode stay aligned.
    const offer = isPrimary && !compareView && sim.recovery && sim.recovery.waitlisted > 0 ? sim.recovery : null;
    const re = offer && sim.recharted ? offer : null;
    const place = config.racBerths > 0 ? 'place' : 'berth';
    return (
    <div className={s.board} key={v.strategy}>
      {compareView && (
        <h3 className={s.num}>
          {STRATEGY_NAME[v.strategy]}: {v.counts.seated} seated, {v.counts.waitlisted} waitlisted ({v.counts.strategyInduced} fragmented)
        </h3>
      )}
      {/* Above the chart, so it needs no scrolling. The other board gets a hidden copy so grids line up row for row in compare mode. */}
      {deferredView && (
        <div style={v === deferredView ? undefined : { visibility: 'hidden' }} aria-hidden={v !== deferredView}>
          <PrepareChart accepted={accepted.length} pending={deferredView.pending.length} bookingClosed={v.step === v.total}
            charting={deferredView.charting} onPrepare={sim.prepareChart} />
        </div>
      )}
      {offer && (
        <div className={s.row} style={{ alignItems: 'center' }}>
          <button type="button" className={`${s.button} ${s.primary}`} onClick={sim.toggleRechart}>
            {re ? 'Show original chart' : 'Re-chart waitlist'}
          </button>
          <span className={`${s.hint} ${s.num}`}>
            {!re && 'Booking has closed. Re-charting keeps everyone who is seated and fits in as many waitlisted passengers as it can.'}
            {re && re.added.size === 0 && `None of the ${re.waitlisted} waitlisted passengers can be added: each one crosses a full stretch.`}
            {re && re.added.size > 0 && `Re-charted: ${re.added.size} of ${re.waitlisted} waitlisted passengers now have a ${place} (amber). Nobody already seated lost theirs; some moved. Seated ${v.counts.seated} → ${v.counts.seated + re.added.size}.`}
          </span>
        </div>
      )}
      <CoachGrid route={route} berths={config.berths} racBerths={config.racBerths} colW={colW} seated={re ? re.seats : v.seated} current={v.current}
        added={re?.added} animateEntry={v.charting || !!re} placeholder={placeholderFor(v)}
        highlightSegment={isPrimary && forced ? forced.segment : null}
        emphasis={isPrimary && forced ? new Set(forced.occupants) : null} />
      <div className={s.advanced}>
        <LoadProfile route={route} load={re ? re.load.confirmed : v.load} capacity={config.berths} colW={colW} />
        {config.racBerths > 0 && <LoadProfile route={route} load={re ? re.load.rac : v.racLoad} capacity={2 * config.racBerths} colW={colW} label="RAC" />}
      </div>
      {v === deferredView && <ChartingView route={route} colW={colW} accepted={accepted} pending={v.pending} />}
    </div>
    );
  };

  return (
    <div className={`${s.app} ${compareView ? s.wide : ''} ${simple ? s.simple : ''}`}>
      <header className={s.header}>
        <div className={s.trainBoard}>
          <div className={s.headline}>
            {route.trainNumber ? (
              <span className={s.trainBadge}>{route.trainNumber}</span>
            ) : (
              <span className={s.trainBadge}>EXP</span>
            )}
            <h1>{route.name}</h1>
            <div className={s.routeTag}>
              <span>{first.code}</span>
              <span className={s.routeArrow}>➔</span>
              <span>{last.code}</span>
              <span className={s.routeStops}>({route.stations.length} stops)</span>
            </div>
          </div>
          <button type="button" className={`${s.button} ${s.viewToggle}`} aria-pressed={!simple} onClick={() => setSimple(!simple)}>
            {simple ? 'Show all options' : 'Simple view'}
          </button>
        </div>
        <div className={s.manifestStrip} aria-label="Train & simulation manifest">
          <span className={s.manifestChip}><strong>COACH:</strong> Sleeper ({config.berths}B{config.racBerths > 0 ? ` + ${config.racBerths} RAC` : ''})</span>
          <span className={s.manifestChip}><strong>TRAFFIC:</strong> {SCENARIO_WORDS[config.scenario]}</span>
          <span className={s.manifestChip}><strong>LOAD:</strong> {config.demandFactor.toFixed(1)}× Capacity</span>
          {config.tatkal && <span className={s.manifestChip}><strong>TATKAL:</strong> +{Math.round(config.tatkalFraction * 100)}%</span>}
          <span className={s.manifestChip}><strong>SEED:</strong> #{config.seed}</span>
          <span className={s.manifestChip}><strong>STREAM:</strong> {requests.length} Requests</span>
        </div>
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
            <div className={s.advanced}><RequestTicker route={route} view={view} coach={coach} /></div>
          </div>
        </div>

        <section className={s.sheet} aria-labelledby="chart-heading">
          <div className={s.sheetHead}>
            <h2 id="chart-heading">Reservation chart</h2>
            <p>{config.berths} berths down, {n} stretches across. Each bar is one passenger's trip.</p>
          </div>
          <ul className={s.legend}>
            <li><span className={`${s.key} ${s.keySeated}`} aria-hidden />Seated</li>
            <li><span className={`${s.key} ${s.keyCurrent}`} aria-hidden />Just decided</li>
            {boards.some((v) => v.strategy === 'deferred') && <li><span className={`${s.key} ${s.keyPending}`} aria-hidden />Waiting for charting</li>}
            {config.racBerths > 0 && <li><span className={`${s.key} ${s.keyRac}`} aria-hidden />RAC, half a shared berth</li>}
            {forced && <li><span className={`${s.key} ${s.keyFull}`} aria-hidden />Full stretch in the proof</li>}
            {sim.recharted && !compareView && <li><span className={`${s.key} ${s.keyAdded}`} aria-hidden />Seated by re-chart</li>}
          </ul>
          <div className={s.chartScroll} ref={chartRef}>
            <div className={s.boards}>{boards.map((v, i) => board(v, i === 0))}</div>
          </div>
        </section>
      </main>

      <div className={s.side}>
        <div className={s.panel} ref={proofRef} style={{ ['--chart-bg' as string]: 'var(--surface)' }}>
          <RejectionList route={route} rejections={view.rejections} selected={selected?.booking.id ?? null} onSelect={sim.select}
            recovered={sim.recharted && !compareView ? sim.recovery?.added : null} />
          <ProofPanel route={route} coach={coach} event={selected} requests={requests} colW={columnWidth(proofWidth - 48, n)} />
        </div>
        <div className={`${s.panel} ${s.simpleOnly}`}>
          <div className={s.section}>
            <h2>Same passengers, other rules</h2>
            <table className={s.table}><tbody>
              <tr><td>First-fit: berth at booking</td><td className={s.n}>{runs['first-fit'].metrics.seated}</td></tr>
              <tr><td>Deferred: berth at charting</td><td className={s.n}>{runs.deferred.metrics.seated}</td></tr>
              <tr><td>Best possible: knows every request</td><td className={s.n}>{runs['offline-optimum'].metrics.seated}</td></tr>
            </tbody></table>
            <p className={s.hint}>Passengers seated out of {view.total} requests. Show all options for every strategy.</p>
          </div>
        </div>
        <div className={`${s.panel} ${s.advanced}`}>
          <TierComparison runs={runs} current={config.strategy} total={view.total} racBerths={config.racBerths} />
          <UnboundedPanel requests={requests} n={n} berths={config.berths} />
        </div>
      </div>
    </div>
  );
}
