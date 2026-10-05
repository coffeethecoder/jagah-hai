// Findings: the main experiment, explorable by route and trip-length scenario.
import { useState } from 'react';
import { LineChart, StackedBars, type Series } from '../components/Charts';
import { STRATEGY, at, findings, percent, seats, values, type Metric, type Scenario, type StrategyKey } from '../lib/findings';
import c from '../styles/site.module.css';

const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'mixed', label: 'Mixed short and long trips' },
  { value: 'short', label: 'Mostly short trips' },
  { value: 'long', label: 'Mostly long trips' },
  { value: 'uniform', label: 'Any length equally likely' },
];
const ONLINE: StrategyKey[] = ['first-fit', 'best-fit', 'random-fit', 'deferred'];
const ALL: StrategyKey[] = [...ONLINE, 'offline-optimum'];
const X_LABEL = 'Demand, times capacity';

export function Findings() {
  const [route, setRoute] = useState('12137-punjab-mail');
  const [scenario, setScenario] = useState<Scenario>('mixed');
  const { rho, meta, routes } = findings;
  const routeName = routes.find((r) => r.id === route)!.name.replace(/ \(.*\)$/, '');

  const series = (ids: StrategyKey[], metric: Metric): Series[] =>
    ids.map((id) => ({ id, ...STRATEGY[id], values: values(route, scenario, id, metric) }));
  const v = (strategy: StrategyKey, metric: Metric, rac = 0) => at(route, scenario, strategy, metric, 1.4, rac);

  const fcfs: Series = { id: 'fcfs', label: 'First come, first served (optimum minus deferred)', color: '#B5ADBF', values: values(route, scenario, 'deferred', 'vsOptimum').map((x) => (x === null ? null : -x)) };
  const frag: Series = { id: 'frag', label: 'Fragmentation (deferred minus First-fit)', color: '#4a3aa7', values: values(route, scenario, 'first-fit', 'vsDeferred').map((x) => (x === null ? null : -x)) };

  return (
    <>
      <header className={c.pageHead}>
        <div className={`${c.container} ${c.stack}`}>
          <p className={c.kicker}>Findings</p>
          <h1 className={c.h1}>Frequent, but cheap.</h1>
          <p className={c.lead}>
            {meta.runs.toLocaleString('en-US')} simulated runs: {routes.length} routes, 4 trip-length patterns, {rho.length} demand
            levels and {meta.seeds} random streams each, with and without RAC. Every strategy saw exactly the same requests.
          </p>
        </div>
      </header>

      <div className={`${c.container} ${c.page}`}>
        <div className={c.filters}>
          <div className={c.filterLabel}>
            <span id="route-label">Route</span>
            <div className={c.tabs} role="group" aria-labelledby="route-label">
              {routes.map((r) => (
                <button key={r.id} type="button" aria-pressed={route === r.id} onClick={() => setRoute(r.id)}>
                  {r.name.replace(/ \(.*\)$/, '')}<small>{r.stops} stops</small>
                </button>
              ))}
            </div>
          </div>
          <label className={c.filterLabel}>
            Trip lengths
            <select className={c.select} value={scenario} onChange={(e) => setScenario(e.target.value as Scenario)}>
              {SCENARIOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className={c.statTiles}>
          <div className={c.statTile}>
            <b>{percent(v('first-fit', 'frag'))}</b>
            <h3><span className={c.dot} style={{ background: 'var(--signal-amber)' }} />Turned away with room</h3>
            <p>of all requests are waitlisted by First-fit although every stretch of the journey had a free berth.</p>
          </div>
          <div className={c.statTile}>
            <b>{seats(-v('first-fit', 'vsDeferred'))}</b>
            <h3><span className={c.dot} style={{ background: '#4a3aa7' }} />Seats lost to fragmentation</h3>
            <p>per coach: what assigning berth numbers at charting, instead of at booking, would win back.</p>
          </div>
          <div className={c.statTile}>
            <b>{seats(-v('deferred', 'vsOptimum'))}</b>
            <h3><span className={c.dot} style={{ background: '#B5ADBF' }} />Seats lost to arrival order</h3>
            <p>per coach: what a planner who knew every request in advance could still add.</p>
          </div>
        </div>
        <p className={c.caption} style={{ marginTop: 'calc(-1 * var(--space-8))' }}>
          {routeName}, one {meta.berths}-berth coach, no RAC, demand 1.4 times capacity, mean of {meta.seeds} streams. Change the route to see how much it matters.
        </p>

        <div className={c.chartGrid}>
          <section className={c.chartCard}>
            <h3>How often is someone turned away with room to spare?</h3>
            <p>
              At demand 1.4: First-fit {percent(v('first-fit', 'frag'))}, Best-fit {percent(v('best-fit', 'frag'))}, Random-fit {percent(v('random-fit', 'frag'))}.
              Deferred is zero by construction.
            </p>
            <LineChart x={rho} series={series(ONLINE, 'frag')} format={(x) => percent(x, 0)} xLabel={X_LABEL}
              ariaLabel="Share of requests waitlisted although every segment had room, by demand and strategy" />
          </section>

          <section className={c.chartCard}>
            <h3>What does that cost in seats?</h3>
            <p>
              Seats lost per coach against the optimum, for First-fit. At demand 1.4: {seats(-v('deferred', 'vsOptimum'))} to arrival order,
              {' '}{seats(-v('first-fit', 'vsDeferred'))} to fragmentation.
            </p>
            <StackedBars x={rho} base={fcfs} top={frag} format={(x) => x.toFixed(0)} xLabel={X_LABEL}
              ariaLabel="Seats lost against the optimum, split into arrival order and fragmentation, by demand" />
          </section>

          <section className={c.chartCard}>
            <h3>How close does each strategy get to the optimum?</h3>
            <p>
              Passengers seated per coach. At demand 1.4 the optimum seats {seats(v('offline-optimum', 'seated'))}; First-fit {seats(v('first-fit', 'seated'))},
              Deferred {seats(v('deferred', 'seated'))}.
            </p>
            <LineChart x={rho} series={series(ALL, 'seated')} format={(x) => x.toFixed(0)} xLabel={X_LABEL}
              ariaLabel="Passengers seated per coach, by demand and strategy" />
          </section>

          <section className={c.chartCard}>
            <h3>Does counting heads mislead?</h3>
            <p>
              Share of berth capacity actually used.{' '}
              {v('random-fit', 'seated') > v('first-fit', 'seated') && v('random-fit', 'util') < v('first-fit', 'util')
                ? `Here Random-fit seats more people than First-fit (${seats(v('random-fit', 'seated'))} against ${seats(v('first-fit', 'seated'))}) while filling less of the train (${percent(v('random-fit', 'util'))} against ${percent(v('first-fit', 'util'))}): it turns away long journeys.`
                : `At demand 1.4, First-fit fills ${percent(v('first-fit', 'util'))} of berth capacity, Random-fit ${percent(v('random-fit', 'util'))} and the optimum ${percent(v('offline-optimum', 'util'))}. The optimum maximises passengers, not capacity used.`}
            </p>
            <LineChart x={rho} series={series(ALL, 'util')} format={(x) => percent(x, 0)} xLabel={X_LABEL}
              ariaLabel="Share of berth capacity used, by demand and strategy" />
          </section>

          <section className={`${c.chartCard} ${c.spanAll}`}>
            <h3>What do RAC berths add?</h3>
            <p>Nine RAC berths give 18 extra places, two passengers to a side-lower berth. Demand 1.4 times capacity.</p>
            <div style={{ overflowX: 'auto' }}>
              <table className={c.racTable}>
                <thead>
                  <tr><th>Strategy</th><th>Seated, no RAC</th><th>Seated, 9 RAC</th><th>Added</th><th>Turned away with room, no RAC</th><th>With 9 RAC</th></tr>
                </thead>
                <tbody>
                  {ALL.map((id) => (
                    <tr key={id}>
                      <td>{STRATEGY[id].label}</td>
                      <td>{seats(v(id, 'seated'))}</td>
                      <td>{seats(v(id, 'seated', 9))}</td>
                      <td>+{seats(v(id, 'seated', 9) - v(id, 'seated'))}</td>
                      <td>{id === 'offline-optimum' ? '' : percent(v(id, 'frag'))}</td>
                      <td>{id === 'offline-optimum' ? '' : percent(v(id, 'frag', 9))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <p className={c.note}>
          How to read this: demand is simulated, so these are properties of the allocation policies under plausible demand, not
          measurements of real trains. The pattern that holds across every route and scenario is the ordering: fragmentation is common on
          long routes, costs few seats, and is dwarfed by the cost of not knowing future requests.
        </p>
      </div>
    </>
  );
}
