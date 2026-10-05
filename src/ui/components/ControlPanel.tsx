import type { Route } from '../../engine';
import type { OnlineStrategy, SimConfig } from '../state/useSimulation';
import s from '../styles/ui.module.css';

const SCENARIOS: { value: SimConfig['scenario']; label: string }[] = [
  { value: 'mixed', label: 'Mixed short and long trips' },
  { value: 'short', label: 'Mostly short trips' },
  { value: 'long', label: 'Mostly long trips' },
  { value: 'uniform', label: 'Any length equally likely' },
];

const STRATEGIES: { value: OnlineStrategy; name: string; hint: string; tier: 1 | 2 }[] = [
  { value: 'first-fit', name: 'First-fit', hint: 'The lowest-numbered free berth', tier: 1 },
  { value: 'best-fit', name: 'Best-fit', hint: 'The berth that leaves the smallest gap', tier: 1 },
  { value: 'random-fit', name: 'Random-fit', hint: 'Any free berth, as a baseline', tier: 1 },
  { value: 'deferred', name: 'Deferred', hint: 'Accept now, assign berths at charting', tier: 2 },
];

interface Props { config: SimConfig; routes: Route[]; onChange: (patch: Partial<SimConfig>) => void }

export function ControlPanel({ config, routes, onChange }: Props) {
  const pickStrategy = (strategy: OnlineStrategy) => {
    // Keep the comparison on a different strategy (default pairing: First-fit vs Deferred).
    const compareWith = strategy !== config.compareWith ? config.compareWith : strategy === 'deferred' ? 'first-fit' : 'deferred';
    onChange({ strategy, compareWith });
  };

  return (
    <section className={s.card} aria-label="Setup">
      <div className={s.group}>
        <h2 className={s.groupTitle}>Train</h2>
        <label className={s.field}>
          Route
          <select value={config.routeId} onChange={(e) => onChange({ routeId: e.target.value })}>
            {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <div className={s.field}>
          <span id="berths-label">Coach</span>
          <div className={s.seg} role="group" aria-labelledby="berths-label">
            <button type="button" aria-pressed={config.berths === 72} onClick={() => onChange({ berths: 72 })}>Sleeper, 72</button>
            <button type="button" aria-pressed={config.berths === 16} onClick={() => onChange({ berths: 16 })}>Mini, 16</button>
          </div>
        </div>
        <label className={s.field}>
          RAC berths (two passengers share each)
          <select value={config.racBerths} onChange={(e) => onChange({ racBerths: Number(e.target.value) })}>
            {Array.from({ length: 10 }, (_, r) => <option key={r} value={r}>{r === 0 ? 'None' : `${r} (${2 * r} places)`}</option>)}
          </select>
        </label>
      </div>

      <div className={s.group}>
        <h2 className={s.groupTitle}>Demand</h2>
        <label className={s.field}>
          Trip lengths
          <select value={config.scenario} onChange={(e) => onChange({ scenario: e.target.value as SimConfig['scenario'] })}>
            {SCENARIOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className={s.field}>
          <span>Demand: <span className={s.value}>{config.demandFactor.toFixed(1)}</span> times capacity</span>
          <input
            type="range" min={0.4} max={2} step={0.1} value={config.demandFactor}
            onChange={(e) => onChange({ demandFactor: Number(e.target.value) })}
          />
        </label>
        <label className={`${s.field} ${s.inline}`}>
          <input type="checkbox" checked={config.tatkal} onChange={(e) => onChange({ tatkal: e.target.checked })} />
          Tatkal surge at the end
        </label>
        {config.tatkal && (
          <label className={s.field}>
            Tatkal share of demand
            <input
              type="number" min={0.05} max={0.5} step={0.05} value={config.tatkalFraction}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 0.05 && v <= 0.5) onChange({ tatkalFraction: v });
              }}
            />
          </label>
        )}
        <div className={s.row}>
          <label className={s.field}>
            Seed
            <input
              type="number" step={1} value={config.seed}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isInteger(v)) onChange({ seed: v });
              }}
            />
          </label>
          <button type="button" className={s.button} style={{ height: 38 }}
            onClick={() => onChange({ seed: 1 + Math.floor(Math.random() * 999_999) })}>
            New seed
          </button>
        </div>
        <p className={s.hint}>The seed fixes the stream of requests: the same seed always gives the same passengers.</p>
      </div>

      <div className={s.group}>
        <fieldset className={s.options}>
          <legend className={s.groupTitle} style={{ padding: 0, marginBottom: 12 }}>Strategy</legend>
          {STRATEGIES.map((o) => (
            <label key={o.value} className={s.option}>
              <input type="radio" name="strategy" value={o.value} checked={config.strategy === o.value} onChange={() => pickStrategy(o.value)} />
              <span className={s.optionName}>{o.name}<span className={s.tier}>Tier {o.tier}</span></span>
              <span className={s.optionHint}>{o.hint}</span>
            </label>
          ))}
        </fieldset>
        <label className={`${s.field} ${s.inline}`}>
          <input type="checkbox" checked={config.compare} onChange={(e) => onChange({ compare: e.target.checked })} />
          Compare with another strategy
        </label>
        {config.compare && (
          <label className={s.field}>
            Compare with
            <select value={config.compareWith} onChange={(e) => onChange({ compareWith: e.target.value as OnlineStrategy })}>
              {STRATEGIES.filter((o) => o.value !== config.strategy).map((o) => <option key={o.value} value={o.value}>{o.name}: {o.hint.toLowerCase()}</option>)}
            </select>
          </label>
        )}
      </div>

      <p className={s.hint}>Keys: Space plays or pauses, the right arrow steps, R resets.</p>
    </section>
  );
}
