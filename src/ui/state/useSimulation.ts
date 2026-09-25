// Config + playback state machine. Calls the engine; components only render what this returns.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  generateDemand, parseRoute, runOnline, selectOptimum,
  type Booking, type DemandConfig, type Route, type RunResult, type StepEvent,
} from '../../engine';

export type OnlineStrategy = 'first-fit' | 'best-fit' | 'random-fit' | 'deferred';

export interface SimConfig {
  routeId: string;
  berths: number;
  scenario: DemandConfig['scenario'];
  tatkal: boolean;
  tatkalFraction: number;
  demandFactor: number;
  seed: number;
  strategy: OnlineStrategy;
}

export interface SimView {
  step: number;                        // requests decided so far
  total: number;
  current: StepEvent | null;           // the request decided at this step
  seated: { booking: Booking; berth: number }[];
  pending: number;                     // Tier 2 bookings accepted but not yet charted
  charted: boolean;                    // Tier 2 chart prepared (end of stream)
  load: number[];
  counts: { seated: number; waitlisted: number; forced: number; strategyInduced: number };
  /** Seated so far ÷ the most any seating could fit for the requests so far (Tier 3 on the prefix). */
  ratio: number | null;
}

const files = import.meta.glob<{ default: unknown }>('../../../data/routes/*.json', { eager: true });
export const ROUTES: Route[] = Object.values(files).map((m) => parseRoute(m.default)).sort((a, b) => a.name.localeCompare(b.name));

const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

const DEFAULT_CONFIG: SimConfig = {
  routeId: ROUTES.find((r) => r.id === 'demo-line')?.id ?? ROUTES[0].id,
  berths: narrow ? 16 : 72,
  scenario: 'mixed',
  tatkal: false,
  tatkalFraction: 0.2,
  demandFactor: 1,
  seed: 1,
  strategy: 'first-fit',
};

function buildView(run: RunResult, requests: Booking[], step: number, berths: number, n: number): SimView {
  const events = run.events.slice(0, step);
  const total = requests.length;
  const charted = run.tier === 2 && step === total && total > 0;
  const byId = new Map(requests.map((b) => [b.id, b]));

  const seated = charted
    ? Object.entries(run.assignment.confirmed).map(([id, berth]) => ({ booking: byId.get(Number(id))!, berth }))
    : events.flatMap((e) => (e.outcome.kind === 'placed' ? [{ booking: e.booking, berth: e.outcome.index }] : []));

  const counts = { seated: 0, waitlisted: 0, forced: 0, strategyInduced: 0 };
  for (const e of events) {
    if (e.outcome.kind === 'rejected') {
      counts.waitlisted++;
      if (e.outcome.certificate.kind === 'forced') counts.forced++;
      else counts.strategyInduced++;
    } else {
      counts.seated++; // Tier 2 acceptances are guaranteed a berth at charting (Theorem 1)
    }
  }
  const best = selectOptimum(requests.slice(0, step), berths).length;

  return {
    step,
    total,
    current: events[step - 1] ?? null,
    seated,
    pending: run.tier === 2 && !charted ? counts.seated : 0,
    charted,
    load: events[step - 1]?.confirmedLoad ?? new Array<number>(n).fill(0),
    counts,
    ratio: best > 0 ? counts.seated / best : null,
  };
}

export function useSimulation() {
  const [config, setConfigState] = useState<SimConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10); // requests per second

  const route = ROUTES.find((r) => r.id === config.routeId) ?? ROUTES[0];
  const n = route.stations.length - 1;

  const requests = useMemo(() => generateDemand(route, { berths: config.berths, racBerths: 0 }, {
    scenario: config.scenario,
    demandFactor: config.demandFactor,
    tatkal: { enabled: config.tatkal, fraction: config.tatkalFraction },
    seed: config.seed,
  }), [route, config.berths, config.scenario, config.demandFactor, config.tatkal, config.tatkalFraction, config.seed]);

  // Same seed for demand and strategy, as in experiments/run.ts, so counters match runs.csv.
  const run = useMemo(
    () => runOnline(config.strategy, requests, route, { berths: config.berths, racBerths: 0 }, config.seed),
    [config.strategy, requests, route, config.berths, config.seed],
  );
  const total = requests.length;
  const view = useMemo(() => buildView(run, requests, step, config.berths, n), [run, requests, step, config.berths, n]);

  const setConfig = useCallback((patch: Partial<SimConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }));
    setStep(0);
    setPlaying(false);
  }, []);

  const stepForward = useCallback(() => { setPlaying(false); setStep((s) => Math.min(s + 1, total)); }, [total]);
  const reset = useCallback(() => { setPlaying(false); setStep(0); }, []);
  const jumpToEnd = useCallback(() => { setPlaying(false); setStep(total); }, [total]);
  const togglePlay = useCallback(() => {
    if (!playing && step >= total) setStep(0); // play again from the start
    setPlaying(!playing);
  }, [playing, step, total]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, total)), 1000 / speed);
    return () => clearInterval(id);
  }, [playing, speed, total]);

  useEffect(() => {
    if (playing && step >= total) setPlaying(false);
  }, [playing, step, total]);

  // Keyboard: Space = play/pause, → = step, R = reset. Form controls keep their own keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ') {
        if (target.closest('button')) return; // the focused button handles Space itself
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'r' || e.key === 'R') {
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, stepForward, reset]);

  return {
    config, setConfig, route, requests, run, view,
    playback: { playing, speed, setSpeed, stepForward, reset, jumpToEnd, togglePlay },
  };
}
