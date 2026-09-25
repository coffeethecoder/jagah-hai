import type { Route } from '../../engine';
import type { OnlineStrategy, SimConfig } from '../state/useSimulation';
import s from '../styles/ui.module.css';

const SCENARIOS: { value: SimConfig['scenario']; label: string }[] = [
  { value: 'mixed', label: 'Mixed short and long trips' },
  { value: 'short', label: 'Mostly short trips' },
  { value: 'long', label: 'Mostly long trips' },
  { value: 'uniform', label: 'Any length equally likely' },
];

const STRATEGIES: { value: OnlineStrategy; label: string }[] = [
  { value: 'first-fit', label: 'First-fit (lowest free berth)' },
  { value: 'best-fit', label: 'Best-fit (tightest gap)' },
  { value: 'random-fit', label: 'Random-fit (any free berth)' },
  { value: 'deferred', label: 'Deferred (berths at charting)' },
];

interface Props { config: SimConfig; routes: Route[]; onChange: (patch: Partial<SimConfig>) => void }

export function ControlPanel({ config, routes, onChange }: Props) {
  return (
    <section className={s.section} aria-labelledby="setup-heading">
      <h2 id="setup-heading">Setup</h2>

      <label className={s.field}>
        Route
        <select value={config.routeId} onChange={(e) => onChange({ routeId: e.target.value })}>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>

      <label className={s.field}>
        Berths
        <select value={config.berths} onChange={(e) => onChange({ berths: Number(e.target.value) })}>
          <option value={72}>72 (sleeper coach)</option>
          <option value={16}>16 (mini coach)</option>
        </select>
      </label>

      <label className={s.field}>
        RAC berths (two passengers share each)
        <select value={config.racBerths} onChange={(e) => onChange({ racBerths: Number(e.target.value) })}>
          {Array.from({ length: 10 }, (_, r) => <option key={r} value={r}>{r === 0 ? 'None' : `${r} (${2 * r} places)`}</option>)}
        </select>
      </label>

      <label className={s.field}>
        Scenario
        <select value={config.scenario} onChange={(e) => onChange({ scenario: e.target.value as SimConfig['scenario'] })}>
          {SCENARIOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <div className={s.row}>
        <label className={`${s.field} ${s.inline}`}>
          <input type="checkbox" checked={config.tatkal} onChange={(e) => onChange({ tatkal: e.target.checked })} />
          Tatkal surge at the end
        </label>
        {config.tatkal && (
          <label className={s.field}>
            Share of demand
            <input
              type="number" min={0.05} max={0.5} step={0.05} value={config.tatkalFraction}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 0.05 && v <= 0.5) onChange({ tatkalFraction: v });
              }}
            />
          </label>
        )}
      </div>

      <label className={s.field}>
        <span>Demand <span className={s.num}>{config.demandFactor.toFixed(1)}</span> times capacity</span>
        <input
          type="range" min={0.4} max={2} step={0.1} value={config.demandFactor}
          onChange={(e) => onChange({ demandFactor: Number(e.target.value) })}
        />
      </label>

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
        <button type="button" className={s.button} style={{ alignSelf: 'flex-end' }}
          onClick={() => onChange({ seed: 1 + Math.floor(Math.random() * 999_999) })}>
          New seed
        </button>
      </div>

      <label className={s.field}>
        Strategy
        <select value={config.strategy} onChange={(e) => {
          const strategy = e.target.value as OnlineStrategy;
          // Keep the comparison on a different strategy (default pairing: First-fit vs Deferred).
          const compareWith = strategy !== config.compareWith ? config.compareWith : strategy === 'deferred' ? 'first-fit' : 'deferred';
          onChange({ strategy, compareWith });
        }}>
          {STRATEGIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>

      <label className={`${s.field} ${s.inline}`}>
        <input type="checkbox" checked={config.compare} onChange={(e) => onChange({ compare: e.target.checked })} />
        Compare with another strategy
      </label>
      {config.compare && (
        <label className={s.field}>
          Compare with
          <select value={config.compareWith} onChange={(e) => onChange({ compareWith: e.target.value as OnlineStrategy })}>
            {STRATEGIES.filter((o) => o.value !== config.strategy).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      )}
    </section>
  );
}
