// Config + playback state machine. Calls the engine; components only render what this returns.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  generateDemand, parseRoute, runOfflineOptimum, runOnline, selectOptimum,
  type Booking, type DemandConfig, type Route, type RunResult, type StepEvent,
} from '../../engine';

export type OnlineStrategy = 'first-fit' | 'best-fit' | 'random-fit' | 'deferred';
export const ONLINE: OnlineStrategy[] = ['first-fit', 'best-fit', 'random-fit', 'deferred'];

export const STRATEGY_NAME: Record<RunResult['strategy'], string> = {
  'first-fit': 'First-fit', 'best-fit': 'Best-fit', 'random-fit': 'Random-fit', deferred: 'Deferred', 'offline-optimum': 'Optimum',
};

export interface SimConfig {
  routeId: string;
  berths: number;
  scenario: DemandConfig['scenario'];
  tatkal: boolean;
  tatkalFraction: number;
  demandFactor: number;
  seed: number;
  strategy: OnlineStrategy;
  compare: boolean;
  compareWith: OnlineStrategy;
}

export interface SimView {
  strategy: OnlineStrategy;
  step: number;                        // requests decided so far
  total: number;
  current: StepEvent | null;           // the request decided at this step
  seated: { booking: Booking; berth: number }[];
  pending: Booking[];                  // Tier 2: accepted, no berth yet
  charting: boolean;                   // Tier 2: "Prepare chart" pressed, placement under way or done
  charted: boolean;                    // Tier 2: every accepted booking has a berth
  load: number[];
  rejections: StepEvent[];             // in arrival order
  counts: { seated: number; waitlisted: number; forced: number; strategyInduced: number };
  /** Seated so far ÷ the most any seating could fit for the requests so far (Tier 3 on the prefix). */
  ratio: number | null;
}

const files = import.meta.glob<{ default: unknown }>('../../../data/routes/*.json', { eager: true });
export const ROUTES: Route[] = Object.values(files).map((m) => parseRoute(m.default)).sort((a, b) => a.name.localeCompare(b.name));

const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHART_MS = 2000;

const DEFAULT_CONFIG: SimConfig = {
  routeId: ROUTES.find((r) => r.id === 'demo-line')?.id ?? ROUTES[0].id,
  berths: narrow ? 16 : 72,
  scenario: 'mixed',
  tatkal: false,
  tatkalFraction: 0.2,
  demandFactor: 1,
  seed: 1,
  strategy: 'first-fit',
  compare: false,
  compareWith: 'deferred',
};

const byStart = (a: Booking, b: Booking) => a.from - b.from || a.to - b.to || a.id - b.id;

/** Deferred bookings in the order charting places them: EST order, earliest boarding first. */
export const chartOrder = (run: RunResult, step: number) =>
  run.events.slice(0, step).filter((e) => e.outcome.kind === 'pending').map((e) => e.booking).sort(byStart);

/** `best`: the most any seating could fit for the first `step` requests (Tier 3 on the prefix). */
function buildView(run: RunResult, strategy: OnlineStrategy, requests: Booking[], step: number, best: number, n: number, chartPlaced: number | null): SimView {
  const events = run.events.slice(0, step);
  const total = requests.length;
  const rejections = events.filter((e) => e.outcome.kind === 'rejected');

  let seated: SimView['seated'];
  let pending: Booking[] = [];
  const charting = run.tier === 2 && step === total && chartPlaced !== null;
  if (run.tier === 2) {
    const order = chartOrder(run, step);
    const placed = charting ? Math.min(chartPlaced, order.length) : 0;
    seated = order.slice(0, placed).map((b) => ({ booking: b, berth: run.assignment.confirmed[b.id] }));
    pending = order.slice(placed).sort((a, b) => a.id - b.id);
  } else {
    seated = events.flatMap((e) => (e.outcome.kind === 'placed' ? [{ booking: e.booking, berth: e.outcome.index }] : []));
  }

  const forced = rejections.filter((e) => e.outcome.kind === 'rejected' && e.outcome.certificate.kind === 'forced').length;
  const counts = {
    seated: step - rejections.length, // Tier 2 acceptances are guaranteed a berth at charting (Theorem 1)
    waitlisted: rejections.length,
    forced,
    strategyInduced: rejections.length - forced,
  };

  return {
    strategy, step, total,
    current: events[step - 1] ?? null,
    seated, pending, charting,
    charted: run.tier === 2 && charting && pending.length === 0,
    load: events[step - 1]?.confirmedLoad ?? new Array<number>(n).fill(0),
    rejections, counts,
    ratio: best > 0 ? counts.seated / best : null,
  };
}

export function useSimulation() {
  const [config, setConfigState] = useState<SimConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10); // requests per second
  const [chartPlaced, setChartPlaced] = useState<number | null>(null); // Tier 2 bookings placed by the chart
  const [selected, setSelected] = useState<number | null>(null);       // booking id of the rejection in the proof panel

  const route = ROUTES.find((r) => r.id === config.routeId) ?? ROUTES[0];
  const n = route.stations.length - 1;
  const coach = useMemo(() => ({ berths: config.berths, racBerths: 0 }), [config.berths]);

  const requests = useMemo(() => generateDemand(route, coach, {
    scenario: config.scenario,
    demandFactor: config.demandFactor,
    tatkal: { enabled: config.tatkal, fraction: config.tatkalFraction },
    seed: config.seed,
  }), [route, coach, config.scenario, config.demandFactor, config.tatkal, config.tatkalFraction, config.seed]);

  // Every strategy on the same stream (paired, as in experiments). Same seed for demand and strategy,
  // as in experiments/run.ts, so final counters equal the matching runs.csv row.
  const runs = useMemo(() => {
    const online = Object.fromEntries(ONLINE.map((s) => [s, runOnline(s, requests, route, coach, config.seed)])) as Record<OnlineStrategy, RunResult>;
    return { ...online, 'offline-optimum': runOfflineOptimum(requests, route, coach) };
  }, [requests, route, coach, config.seed]);

  const total = requests.length;
  const compareWith = config.compareWith === config.strategy ? ONLINE.find((s) => s !== config.strategy)! : config.compareWith;
  // O(step²); kept apart from the views so charting frames do not recompute it.
  const best = useMemo(() => selectOptimum(requests.slice(0, step), config.berths).length, [requests, step, config.berths]);
  const view = useMemo(
    () => buildView(runs[config.strategy], config.strategy, requests, step, best, n, chartPlaced),
    [runs, config.strategy, requests, step, best, n, chartPlaced],
  );
  const compareView = useMemo(
    () => (config.compare ? buildView(runs[compareWith], compareWith, requests, step, best, n, chartPlaced) : null),
    [config.compare, runs, compareWith, requests, step, best, n, chartPlaced],
  );

  const goTo = useCallback((next: number | ((s: number) => number)) => {
    setStep(next);
    setChartPlaced(null);
  }, []);

  const setConfig = useCallback((patch: Partial<SimConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }));
    goTo(0);
    setPlaying(false);
    setSelected(null);
  }, [goTo]);

  const stepForward = useCallback(() => { setPlaying(false); goTo((s) => Math.min(s + 1, total)); }, [goTo, total]);
  const reset = useCallback(() => { setPlaying(false); goTo(0); setSelected(null); }, [goTo]);
  const jumpToEnd = useCallback(() => { setPlaying(false); goTo(total); }, [goTo, total]);
  const togglePlay = useCallback(() => {
    if (!playing && step >= total) goTo(0); // play again from the start
    setPlaying(!playing);
  }, [playing, step, total, goTo]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => goTo((s) => Math.min(s + 1, total)), 1000 / speed);
    return () => clearInterval(id);
  }, [playing, speed, total, goTo]);

  useEffect(() => {
    if (playing && step >= total) setPlaying(false);
  }, [playing, step, total]);

  // Charting: the single orchestrated animation. EST order, paced by the clock so it takes CHART_MS however heavy a frame is.
  const toChart = step === total ? chartOrder(runs.deferred, step).length : 0;
  const [chartStart, setChartStart] = useState<number | null>(null);
  const prepareChart = useCallback(() => {
    setPlaying(false);
    if (reducedMotion()) {
      setChartPlaced(toChart);
    } else {
      setChartPlaced(0);
      setChartStart(performance.now());
    }
  }, [toChart]);
  useEffect(() => {
    if (chartPlaced === null || chartStart === null || chartPlaced >= toChart) return;
    // A timer rather than requestAnimationFrame: it keeps going (throttled, then catching up) in a background tab.
    const id = setTimeout(() => setChartPlaced(Math.min(toChart, Math.ceil((toChart * (performance.now() - chartStart)) / CHART_MS))), 16);
    return () => clearTimeout(id);
  }, [chartPlaced, chartStart, toChart]);

  // A selection disappears if playback moves back before that rejection.
  const selectedEvent = view.rejections.find((e) => e.booking.id === selected) ?? null;

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
    config, setConfig, route, requests, runs, view, compareView,
    selected: selectedEvent, select: setSelected,
    prepareChart,
    playback: { playing, speed, setSpeed, stepForward, reset, jumpToEnd, togglePlay },
  };
}
