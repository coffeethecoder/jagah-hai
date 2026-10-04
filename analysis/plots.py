"""Figures F1-F6 and table T1 for the paper (SPEC 15.4).

Usage:  python analysis/plots.py experiments/results/main/summary.csv
Reads summary.csv and runs.csv from that folder; writes PDFs and T1 to analysis/figures/.

Baseline slice for every figure unless stated: 72 berths, no RAC, no tatkal.
"""
import json
import pathlib
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "analysis" / "figures"

ONLINE = ["first-fit", "best-fit", "random-fit", "deferred"]
TIER1 = ["first-fit", "best-fit", "random-fit"]
ALL = ONLINE + ["offline-optimum"]
NAME = {"first-fit": "First-fit", "best-fit": "Best-fit", "random-fit": "Random-fit",
        "deferred": "Deferred", "offline-optimum": "Optimum"}
SHORT = {"first-fit": "FF", "best-fit": "BF", "random-fit": "RF", "deferred": "Def"}
SCENARIOS = ["short", "long", "mixed", "uniform"]
SCENARIO_NAME = {"short": "Mostly short trips", "long": "Mostly long trips", "mixed": "Mixed", "uniform": "Uniform"}

# Strategy identity: validated categorical slots 1-4 (dataviz reference palette, light), fixed per strategy
# in every figure. The optimum is a neutral dashed reference line, not a fifth hue. Aqua and yellow sit below
# 3:1 contrast, so every series also has its own marker, and T1 gives the numbers.
COLOR = {"first-fit": "#2a78d6", "best-fit": "#eb6834", "random-fit": "#1baf7a", "deferred": "#eda100",
         "offline-optimum": "#52514e"}
MARKER = {"first-fit": "o", "best-fit": "s", "random-fit": "^", "deferred": "D", "offline-optimum": None}
LOSS_COLOR = {"fragmentation": "#4a3aa7", "fcfs": "#b5b3ab"}  # F4 components: violet and a mid neutral
INK, INK_2, GRID = "#0b0b0b", "#52514e", "#e6e5e0"

plt.rcParams.update({
    "font.family": "sans-serif", "font.size": 8, "axes.titlesize": 8, "axes.labelsize": 8,
    "xtick.labelsize": 7, "ytick.labelsize": 7, "legend.fontsize": 7,
    "text.color": INK, "axes.labelcolor": INK_2, "xtick.color": INK_2, "ytick.color": INK_2,
    "axes.edgecolor": INK_2, "axes.linewidth": 0.6, "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "axes.grid.axis": "y", "grid.color": GRID, "grid.linewidth": 0.6,
    "lines.linewidth": 1.5, "lines.markersize": 4, "figure.dpi": 150, "savefig.bbox": "tight",
    "pdf.fonttype": 42,
})


def route_names(ids):
    names = {}
    for rid in ids:
        path = ROOT / "data" / "routes" / f"{rid}.json"
        names[rid] = json.loads(path.read_text())["name"] if path.exists() else rid
    return names


def panel_title(name):
    return name.replace(" (", "\n(")


def baseline(df, **extra):
    q = df[(df.berths == 72) & (df.racBerths == 0) & (~df.tatkal)]
    for k, v in extra.items():
        q = q[q[k] == v]
    return q


def grid(routes, names, ncols=4, title=None):
    """Rows = routes, columns = scenarios. Each row shares its y-axis (routes differ in scale)."""
    fig, axes = plt.subplots(len(routes), ncols, figsize=(7.2, 1.55 * len(routes) + 0.5), sharex=True, sharey="row", squeeze=False)
    for i, rid in enumerate(routes):
        axes[i][0].set_ylabel(names[rid], rotation=0, ha="right", va="center", color=INK, fontsize=7.5)
    for j, sc in enumerate(SCENARIOS[:ncols]):
        axes[0][j].set_title(SCENARIO_NAME[sc], color=INK)
    if title:
        fig.suptitle(title, x=0.01, ha="left", fontsize=9, color=INK)
    return fig, axes


def strategy_legend(fig, strategies):
    handles = [plt.Line2D([], [], color=COLOR[s], marker=MARKER[s], linestyle="--" if s == "offline-optimum" else "-")
               for s in strategies]
    fig.legend(handles, [NAME[s] for s in strategies], loc="lower center", ncol=len(strategies), frameon=False,
               bbox_to_anchor=(0.5, -0.02))


def line(ax, d, strategy, col, band=True, **kw):
    d = d.sort_values("rho")
    style = dict(color=COLOR[strategy], marker=MARKER[strategy], linestyle="--" if strategy == "offline-optimum" else "-")
    style.update(kw)
    ax.plot(d.rho, d[f"{col}_mean"], **style)
    if band and d[f"{col}_ci95Low"].notna().all():
        ax.fill_between(d.rho, d[f"{col}_ci95Low"], d[f"{col}_ci95High"], color=COLOR[strategy], alpha=0.15, linewidth=0)


def save(fig, name):
    fig.savefig(OUT / f"{name}.pdf")
    plt.close(fig)
    print(f"wrote analysis/figures/{name}.pdf")


def f1_seated(s, routes, names):
    fig, axes = grid(routes, names, title="F1. Passengers seated vs demand (mean, 95% CI)")
    for i, rid in enumerate(routes):
        for j, sc in enumerate(SCENARIOS):
            for st in ALL:
                line(axes[i][j], baseline(s, route=rid, scenario=sc, strategy=st), st, "seated")
    for ax in axes[-1]:
        ax.set_xlabel("Demand factor ρ")
    strategy_legend(fig, ALL)
    save(fig, "F1_seated_vs_rho")


def f2_fragrate(s, routes, names):
    fig, axes = grid(routes, names, title="F2. Strategy-induced rejections per request vs demand (mean, 95% CI)")
    for i, rid in enumerate(routes):
        for j, sc in enumerate(SCENARIOS):
            for st in ONLINE:  # Deferred is included as the zero line it must be (SPEC 4.4)
                line(axes[i][j], baseline(s, route=rid, scenario=sc, strategy=st), st, "fragRate")
            axes[i][j].yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=0))
    for ax in axes[-1]:
        ax.set_xlabel("Demand factor ρ")
    strategy_legend(fig, ONLINE)
    save(fig, "F2_fragrate_vs_rho")


def f3_epr(runs, routes, names, rho=1.4):
    fig, axes = grid(routes, names, title=f"F3. Empirical performance ratio by strategy (ρ = {rho}, one box per 100 seeds)")
    for i, rid in enumerate(routes):
        for j, sc in enumerate(SCENARIOS):
            ax = axes[i][j]
            d = baseline(runs, route=rid, scenario=sc)
            d = d[d.rho == rho]
            data = [d[d.strategy == st].epr.dropna().values for st in ONLINE]
            box = ax.boxplot(data, widths=0.55, patch_artist=True, showfliers=True,
                             medianprops=dict(color=INK, linewidth=1), whiskerprops=dict(color=INK_2, linewidth=0.8),
                             capprops=dict(color=INK_2, linewidth=0.8),
                             flierprops=dict(marker=".", markersize=2, markeredgecolor=INK_2))
            for patch, st in zip(box["boxes"], ONLINE):
                patch.set(facecolor=COLOR[st], alpha=0.55, edgecolor=COLOR[st])
            ax.set_xticks(range(1, len(ONLINE) + 1), [SHORT[st] for st in ONLINE])
    handles = [plt.Rectangle((0, 0), 1, 1, color=COLOR[st], alpha=0.55) for st in ONLINE]
    fig.legend(handles, [f"{SHORT[st]} = {NAME[st]}" for st in ONLINE], loc="lower center", ncol=4, frameon=False, bbox_to_anchor=(0.5, -0.02))
    save(fig, "F3_epr_boxplots")


def f4_losses(s, routes, names, strategy="first-fit"):
    """Stacked bars: FCFS loss (optimum - deferred) from 0, fragmentation loss (deferred - first-fit) on top.
    A negative fragmentation loss (Tier 1 seated more on average) is drawn below zero instead."""
    fig, axes = grid(routes, names, title=f"F4. Seats lost vs the optimum: first-come-first-served + fragmentation ({NAME[strategy]})")
    for i, rid in enumerate(routes):
        for j, sc in enumerate(SCENARIOS):
            ax = axes[i][j]
            t1 = baseline(s, route=rid, scenario=sc, strategy=strategy).sort_values("rho")
            t2 = baseline(s, route=rid, scenario=sc, strategy="deferred").sort_values("rho")
            frag = -t1.seatedMinusDeferred_mean.values
            fcfs = -t2.seatedMinusOptimum_mean.values
            x = t1.rho.values
            w = 0.14
            ax.bar(x, fcfs, width=w, color=LOSS_COLOR["fcfs"], edgecolor="white", linewidth=1)
            ax.bar(x, frag, width=w, bottom=[f if v >= 0 else 0 for f, v in zip(fcfs, frag)],
                   color=LOSS_COLOR["fragmentation"], edgecolor="white", linewidth=1)
            ax.axhline(0, color=INK_2, linewidth=0.6)
    for ax in axes[-1]:
        ax.set_xlabel("Demand factor ρ")
    handles = [plt.Rectangle((0, 0), 1, 1, color=LOSS_COLOR[k]) for k in ["fcfs", "fragmentation"]]
    fig.legend(handles, ["First-come-first-served loss (optimum − deferred)", f"Fragmentation loss (deferred − {NAME[strategy].lower()})"],
               loc="lower center", ncol=2, frameon=False, bbox_to_anchor=(0.5, -0.02))
    save(fig, "F4_loss_decomposition")


def f5_ff_omega(s, routes, names):
    """Unbounded mode: FF/ω does not depend on the strategy, so First-fit rows carry it. Scenarios are told
    apart by marker and dash in one neutral ink, so no hue competes with the strategy colours."""
    fig, axes = plt.subplots(1, len(routes), figsize=(7.2, 2.6), sharey=True, squeeze=False)
    styles = {"short": ("o", "-"), "long": ("s", "--"), "mixed": ("^", "-."), "uniform": ("D", ":")}
    for i, rid in enumerate(routes):
        ax = axes[0][i]
        for sc in SCENARIOS:
            d = baseline(s, route=rid, scenario=sc, strategy="first-fit").sort_values("rho")
            m, ls = styles[sc]
            ax.plot(d.rho, d.ffOverOmega_mean, color=INK_2, marker=m, linestyle=ls, label=SCENARIO_NAME[sc])
        ax.set_title(panel_title(names[rid]), color=INK)
        ax.set_xlabel("Demand factor ρ")
    axes[0][0].set_ylabel("First-fit berths ÷ ω")
    fig.subplots_adjust(top=0.74, bottom=0.3, wspace=0.12)
    fig.suptitle("F5. Unbounded mode: berths First-fit opens vs the minimum ω (mean over seeds)", x=0.01, y=0.99, ha="left", fontsize=9, color=INK)
    handles, labels = axes[0][0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", ncol=4, frameon=False, bbox_to_anchor=(0.5, -0.02))
    save(fig, "F5_ff_over_omega")


def f6_rac(s, routes, names, scenario="mixed"):
    """Effect of RAC: solid r = 0, dashed r = 9, same colour per strategy. Top row seated, bottom row fragRate."""
    fig, axes = plt.subplots(2, len(routes), figsize=(7.2, 3.6), sharex=True, squeeze=False)
    for i, rid in enumerate(routes):
        for r, ls in [(0, "-"), (9, "--")]:
            for st in ALL:
                d = s[(s.route == rid) & (s.scenario == scenario) & (~s.tatkal) & (s.berths == 72) & (s.racBerths == r) & (s.strategy == st)]
                line(axes[0][i], d, st, "seated", band=False, linestyle=ls, linewidth=1.2 if st == "offline-optimum" else 1.5)
                if st != "offline-optimum":
                    line(axes[1][i], d, st, "fragRate", band=False, linestyle=ls)
        axes[0][i].set_title(panel_title(names[rid]), color=INK)
        axes[1][i].set_xlabel("Demand factor ρ")
        axes[1][i].yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=None))
    axes[0][0].set_ylabel("Seated")
    axes[1][0].set_ylabel("Strategy-induced\nper request")
    fig.suptitle(f"F6. Effect of RAC ({SCENARIO_NAME[scenario].lower()} trips): solid = no RAC, dashed = 9 RAC berths",
                 x=0.01, y=0.99, ha="left", fontsize=9, color=INK)
    fig.subplots_adjust(top=0.84, bottom=0.2, wspace=0.28, hspace=0.25)
    handles = [plt.Line2D([], [], color=COLOR[st], marker=MARKER[st]) for st in ALL]
    handles += [plt.Line2D([], [], color=INK_2, linestyle="-"), plt.Line2D([], [], color=INK_2, linestyle="--")]
    fig.legend(handles, [NAME[st] for st in ALL] + ["No RAC", "9 RAC berths"], loc="lower center", ncol=7, frameon=False,
               bbox_to_anchor=(0.5, -0.02), columnspacing=1.2)
    save(fig, "F6_rac_effect")


def t1_table(s, routes, names):
    """Means ± 95% CI half-width at ρ = 1.0 and 1.4, every strategy. Full CSV for all scenarios;
    Markdown and LaTeX for the mixed scenario (the paper's main table)."""
    rows = []
    for rid in routes:
        for sc in SCENARIOS:
            for rho in (1.0, 1.4):
                for st in ALL:
                    d = baseline(s, route=rid, scenario=sc, strategy=st)
                    d = d[d.rho == rho].iloc[0]
                    cell = lambda col, pct=False: (f"{100 * d[f'{col}_mean']:.1f} ± {100 * (d[f'{col}_ci95High'] - d[f'{col}_mean']):.1f}" if pct
                                                   else f"{d[f'{col}_mean']:.3f} ± {d[f'{col}_ci95High'] - d[f'{col}_mean']:.3f}")
                    rows.append({
                        "Route": names[rid], "Scenario": sc, "ρ": rho, "Strategy": NAME[st],
                        "Seated": f"{d.seated_mean:.1f} ± {d.seated_ci95High - d.seated_mean:.1f}",
                        "EPR": cell("epr"),
                        "Strategy-induced (%)": "" if st == "offline-optimum" else cell("fragRate", pct=True),
                        "Utilization (%)": cell("utilization", pct=True),
                    })
    t = pd.DataFrame(rows)
    t.to_csv(OUT / "T1_all_scenarios.csv", index=False)
    mixed = t[t.Scenario == "mixed"].drop(columns="Scenario")
    cols, cells = list(mixed.columns), mixed.astype(str).values.tolist()
    md = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)] + ["| " + " | ".join(r) + " |" for r in cells]
    (OUT / "T1_mixed.md").write_text(
        "T1. Means ± 95% CI half-width (N = seeds), 72 berths, no RAC, no tatkal, mixed trips.\n\n" + "\n".join(md) + "\n")
    tex = lambda x: x.replace("%", r"\%").replace("±", r"$\pm$").replace("ρ", r"$\rho$")
    (OUT / "T1_mixed.tex").write_text(
        "\\begin{tabular}{" + "l" * 3 + "r" * (len(cols) - 3) + "}\n\\hline\n" + " & ".join(map(tex, cols)) + " \\\\\n\\hline\n"
        + "".join(" & ".join(map(tex, r)) + " \\\\\n" for r in cells) + "\\hline\n\\end{tabular}\n")
    print("wrote analysis/figures/T1_all_scenarios.csv, T1_mixed.md, T1_mixed.tex")


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python analysis/plots.py experiments/results/<name>/summary.csv")
    summary_path = pathlib.Path(sys.argv[1])
    s = pd.read_csv(summary_path)
    runs = pd.read_csv(summary_path.parent / "runs.csv", usecols=["route", "berths", "racBerths", "scenario", "tatkal", "rho", "strategy", "epr"])
    OUT.mkdir(parents=True, exist_ok=True)
    routes = list(dict.fromkeys(s.route))  # config order
    names = route_names(routes)
    f1_seated(s, routes, names)
    f2_fragrate(s, routes, names)
    f3_epr(runs, routes, names)
    f4_losses(s, routes, names)
    f5_ff_omega(s, routes, names)
    f6_rac(s, routes, names)
    t1_table(s, routes, names)


if __name__ == "__main__":
    main()
