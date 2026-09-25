// CLI: runs.csv -> summary.csv (means, sd, 95% CI, paired diffs) (SPEC 15.3).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { RUN_COLUMNS, toCsv } from './run';

type Row = Record<(typeof RUN_COLUMNS)[number], string>;

const GROUP = ['route', 'berths', 'racBerths', 'scenario', 'tatkal', 'rho', 'strategy'] as const;
const STREAM = ['route', 'berths', 'racBerths', 'scenario', 'tatkal', 'rho', 'seed'] as const;

/** Per-run values summarised for each group; undefined means "not available for this run". */
const MEASURES: Record<string, (r: Row, ref: (strategy: string) => Row | undefined) => number | undefined> = {
  seated: (r) => Number(r.seated),
  epr: (r) => num(r.epr),
  fragRate: (r) => (Number(r.requested) > 0 ? Number(r.strategyInduced) / Number(r.requested) : undefined),
  utilization: (r) => Number(r.utilization),
  ffOverOmega: (r) => { const ff = num(r.ffBerthsNeeded), w = num(r.omega); return ff !== undefined && w ? ff / w : undefined; },
  // Paired differences on the same request stream (same seed).
  seatedMinusDeferred: (r, ref) => diff(r, ref('deferred')),
  seatedMinusOptimum: (r, ref) => diff(r, ref('offline-optimum')),
};

function num(s: string): number | undefined { return s === '' ? undefined : Number(s); }
function diff(r: Row, other: Row | undefined): number | undefined {
  return other ? Number(r.seated) - Number(other.seated) : undefined;
}

/** Mean, sample sd, and 95% CI mean ± 1.96·sd/√N. sd and CI are blank when N < 2. */
export function stats(xs: number[]): { n: number; mean?: number; sd?: number; lo?: number; hi?: number } {
  const n = xs.length;
  if (n === 0) return { n };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { n, mean };
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1));
  const half = (1.96 * sd) / Math.sqrt(n);
  return { n, mean, sd, lo: mean - half, hi: mean + half };
}

export const SUMMARY_COLUMNS = [
  ...GROUP, 'runs',
  ...Object.keys(MEASURES).flatMap((m) => [`${m}_mean`, `${m}_sd`, `${m}_ci95Low`, `${m}_ci95High`]),
];

export function parseRuns(csv: string): Row[] {
  const [head, ...lines] = csv.trim().split('\n');
  const header = head.split(',');
  const missing = RUN_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) throw new Error(`runs.csv is missing columns: ${missing.join(', ')}`);
  return lines.map((line, i) => {
    const cells = line.split(',');
    if (cells.length !== header.length) throw new Error(`runs.csv line ${i + 2} has ${cells.length} cells, expected ${header.length}`);
    return Object.fromEntries(header.map((h, j) => [h, cells[j]])) as Row;
  });
}

/** One summary row per (route, k, r, scenario, tatkal, ρ, strategy), in first-appearance order. */
export function summarize(rows: Row[]): string[][] {
  const key = (r: Row, cols: readonly (keyof Row)[]) => cols.map((c) => r[c]).join('|');
  const byStream = new Map<string, Row>();
  for (const r of rows) byStream.set(`${key(r, STREAM)}|${r.strategy}`, r);
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const g = key(r, GROUP);
    groups.set(g, [...(groups.get(g) ?? []), r]);
  }

  const cell = (x: number | undefined) => (x === undefined ? '' : String(x));
  return [...groups.values()].map((members) => {
    const out = [...GROUP.map((c) => members[0][c]), String(members.length)];
    for (const measure of Object.values(MEASURES)) {
      const xs = members
        .map((r) => measure(r, (s) => byStream.get(`${key(r, STREAM)}|${s}`)))
        .filter((x): x is number => x !== undefined);
      const s = stats(xs);
      out.push(cell(s.mean), cell(s.sd), cell(s.lo), cell(s.hi));
    }
    return out;
  });
}

function main() {
  const { values } = parseArgs({ options: { run: { type: 'string' } } });
  if (!values.run) throw new Error('Usage: npm run aggregate -- --run experiments/results/<name>');
  const rows = parseRuns(readFileSync(resolve(values.run, 'runs.csv'), 'utf8'));
  const out = resolve(values.run, 'summary.csv');
  writeFileSync(out, toCsv(SUMMARY_COLUMNS, summarize(rows)));
  console.log(`${rows.length} runs -> ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
