// CLI: experiments/results/<name>/summary.csv -> src/ui/data/findings.json, the slice the Findings page plots.
// experiments/results is gitignored, so this file is how published numbers reach the app.
// Usage: npm run export-findings -- --run experiments/results/main
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadRoute } from './run';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const METRICS = {
  seated: 'seated_mean', frag: 'fragRate_mean', epr: 'epr_mean', util: 'utilization_mean',
  vsDeferred: 'seatedMinusDeferred_mean', vsOptimum: 'seatedMinusOptimum_mean',
} as const;

const { values } = parseArgs({ options: { run: { type: 'string' } } });
if (!values.run) throw new Error('Usage: npm run export-findings -- --run experiments/results/<name>');

const [head, ...lines] = readFileSync(resolve(values.run, 'summary.csv'), 'utf8').trim().split('\n');
const cols = head.split(',');
const rows = lines.map((l) => Object.fromEntries(l.split(',').map((c, i) => [cols[i], c])));
const meta = JSON.parse(readFileSync(resolve(values.run, 'meta.json'), 'utf8')) as { gitCommit: string | null; gitDirty: boolean | null; finishedAt: string; runs: number };

const round = (s: string) => (s === '' ? null : Math.round(Number(s) * 1e4) / 1e4);
const base = rows.filter((r) => r.tatkal === 'false');
const rho = [...new Set(base.map((r) => Number(r.rho)))].sort((a, b) => a - b);
const routeIds = [...new Set(base.map((r) => r.route))];

// series["route|scenario|racBerths"][strategy][metric] = one value per ρ
const series: Record<string, Record<string, Record<string, (number | null)[]>>> = {};
const ffOverOmega: Record<string, (number | null)[]> = {};
for (const r of base) {
  const key = `${r.route}|${r.scenario}|${r.racBerths}`;
  const i = rho.indexOf(Number(r.rho));
  const s = ((series[key] ??= {})[r.strategy] ??= Object.fromEntries(Object.keys(METRICS).map((m) => [m, new Array(rho.length).fill(null)])));
  for (const [m, col] of Object.entries(METRICS)) s[m][i] = round(r[col]);
  if (r.strategy === 'first-fit' && r.racBerths === '0') (ffOverOmega[`${r.route}|${r.scenario}`] ??= new Array(rho.length).fill(null))[i] = round(r.ffOverOmega_mean);
}

const out = {
  meta: {
    runs: meta.runs, seeds: Number(base[0].runs), berths: Number(base[0].berths),
    commit: meta.gitCommit, clean: meta.gitDirty === false, finishedAt: meta.finishedAt,
  },
  rho,
  routes: routeIds.map((id) => { const r = loadRoute(id); return { id, name: r.name, stops: r.stations.length }; }),
  series,
  ffOverOmega,
};
const path = resolve(ROOT, 'src/ui/data/findings.json');
writeFileSync(path, JSON.stringify(out) + '\n');
console.log(`${Object.keys(series).length} slices, ${rho.length} demand levels -> ${path}`);
