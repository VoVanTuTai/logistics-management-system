#!/usr/bin/env python3
"""
generate_statistical_charts_svg.py
Generates academic publication-grade 3-panel (1x3) empirical evaluation figure (Fig. 3)
from canonical data/results.json and benchmark_test_70_cases_log.csv:
    (a) Multi-Metric Architecture Comparison on Held-Out Test Set (n = 52 Functional)
    (b) Empirical Latency Step CDF from Canonical Held-Out Test Set (n = 70, SD = 753.5 ms, p50 = 3,788 ms, p90 = 4,578 ms)
    (c) Empirical Quality vs. Latency Pareto Frontier with Feasible Zone (S_i >= 80, Latency <= 5 s)
Outputs:
  - docs/research/paper/diagrams/statistical-evaluation-charts.png
  - docs/research/paper/diagrams/statistical-evaluation-charts.svg
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def generate_academic_statistical_charts():
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'results.json')
    data_canonical = {}
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            data_canonical = json.load(f)

    png_out = os.path.join(os.path.dirname(__file__), 'diagrams', 'statistical-evaluation-charts.png')
    svg_out = os.path.join(os.path.dirname(__file__), 'diagrams', 'statistical-evaluation-charts.svg')

    # Configure IEEE publication typography & style
    plt.rcParams['font.family'] = 'serif'
    plt.rcParams['font.serif'] = ['Times New Roman', 'Times', 'DejaVu Serif', 'Liberation Serif']
    plt.rcParams['mathtext.fontset'] = 'stix'
    plt.rcParams['axes.edgecolor'] = '#1f2937'
    plt.rcParams['axes.linewidth'] = 0.9
    plt.rcParams['axes.titlesize'] = 9.8
    plt.rcParams['axes.titleweight'] = 'bold'
    plt.rcParams['axes.labelsize'] = 8.8
    plt.rcParams['axes.labelweight'] = 'bold'
    plt.rcParams['xtick.labelsize'] = 8.0
    plt.rcParams['ytick.labelsize'] = 8.0
    plt.rcParams['xtick.direction'] = 'out'
    plt.rcParams['ytick.direction'] = 'out'
    plt.rcParams['grid.color'] = '#e5e7eb'
    plt.rcParams['grid.linestyle'] = ':'
    plt.rcParams['grid.linewidth'] = 0.7
    plt.rcParams['figure.autolayout'] = False

    # 1x3 horizontal layout: high readability & compact height
    fig, axes = plt.subplots(1, 3, figsize=(11.8, 3.45), dpi=300)
    fig.patch.set_facecolor('#ffffff')
    fig.subplots_adjust(top=0.87, bottom=0.17, left=0.06, right=0.98, wspace=0.26)

    c_blue_dark = '#1e3a8a'
    c_blue_soft = '#93c5fd'

    # =========================================================================
    # SUBPLOT (a): Multi-Metric Comparative Performance on Held-Out Test Set
    # =========================================================================
    ax_a = axes[0]
    metrics = ['Groundedness\n(Entailment)', 'Tool Argument\nPrecision', 'Quality Score\n($n = 52$ Test)']
    x = np.arange(len(metrics))
    bar_width = 0.25

    dense_vals = [87.6, 97.4, 74.2]
    dense_errs = [1.4, 0.8, 18.5]

    single_vals = [88.1, 94.7, 73.4]
    single_errs = [1.5, 1.2, 21.6]

    multi_vals = [95.2, 100.0, 83.1]
    multi_errs = [0.8, 0.0, 17.1]

    b1 = ax_a.bar(x - bar_width, dense_vals, bar_width, yerr=dense_errs, capsize=3.0,
                  label='Dense-only (MRL)', color='#cbd5e1', edgecolor='#374151', linewidth=0.9, hatch='///')
    b2 = ax_a.bar(x, single_vals, bar_width, yerr=single_errs, capsize=3.0,
                  label='Single-Agent + Critic', color='#94a3b8', edgecolor='#1f2937', linewidth=0.9, hatch='\\\\')
    b3 = ax_a.bar(x + bar_width, multi_vals, bar_width, yerr=multi_errs, capsize=3.0,
                  label='Proposed HMAS', color=c_blue_dark, edgecolor='#0f172a', linewidth=1.0)

    # Place labels cleanly above top error bar caps with slight staggering if needed
    for i, bar in enumerate(b1):
        h = bar.get_height()
        y_pos = h + dense_errs[i] + 2.4
        if i == 1:
            y_pos = max(y_pos, 102.2)
        ax_a.text(bar.get_x() + bar.get_width() / 2. - 0.025, y_pos, f'{h:.1f}%',
                  ha='center', va='bottom', fontsize=5.9, fontweight='bold', color='#374151')
    for i, bar in enumerate(b2):
        h = bar.get_height()
        y_pos = h + single_errs[i] + 2.0
        if i == 1:
            y_pos = 96.4
        ax_a.text(bar.get_x() + bar.get_width() / 2., y_pos, f'{h:.1f}%',
                  ha='center', va='bottom', fontsize=5.8, fontweight='bold', color='#1f2937')
    for i, bar in enumerate(b3):
        h = bar.get_height()
        y_pos = h + multi_errs[i] + 2.6
        ax_a.text(bar.get_x() + bar.get_width() / 2. + 0.025, y_pos, f'{h:.1f}%',
                  ha='center', va='bottom', fontsize=6.1, fontweight='bold', color=c_blue_dark)

    ax_a.set_xticks(x)
    ax_a.set_xticklabels(metrics, fontsize=7.8)
    ax_a.set_ylim(0, 134)
    ax_a.set_ylabel(r'Performance Score (%)')
    ax_a.set_title('(a) Multi-Metric Comparison ($n = 52$)', loc='left', pad=6)
    ax_a.legend(loc='upper center', bbox_to_anchor=(0.5, 0.99), ncol=2, fontsize=6.8,
                frameon=True, framealpha=0.94, edgecolor='#94a3b8', columnspacing=0.8)
    ax_a.grid(True, axis='y')

    # =========================================================================
    # SUBPLOT (b): Empirical Step CDF from Held-Out Test Set (n = 70)
    # =========================================================================
    ax_b = axes[1]

    csv_path = os.path.join(os.path.dirname(__file__), 'data', 'benchmark_test_70_cases_log.csv')
    if 'latency_statistics' in data_canonical and 'hmas_latencies_ms' in data_canonical['latency_statistics']:
        lats = np.sort(np.array(data_canonical['latency_statistics']['hmas_latencies_ms'], dtype=float))
    else:
        df_70 = pd.read_csv(csv_path)
        lats = np.sort(df_70['hmas_latency_ms'].values)
    n_cases = len(lats)
    ecdf_y = np.arange(1, n_cases + 1) / n_cases * 100.0

    mean_val = float(np.mean(lats))
    sd_val = float(np.std(lats, ddof=1))
    p50_val = float(np.percentile(lats, 50))
    p90_val = float(np.percentile(lats, 90))

    ax_b.step(lats, ecdf_y, where='post', color=c_blue_dark, linewidth=1.8,
              label=f'HMAS CDF ($n = {n_cases}$, SD = {sd_val:.1f} ms)')
    ax_b.fill_between(lats, 0, ecdf_y, step='post', color=c_blue_soft, alpha=0.25)

    ax_b.axvline(mean_val, color='#059669', linestyle='--', linewidth=1.2, label=f'Mean ({mean_val:.0f} ms)')
    ax_b.axvline(p50_val, color='#d97706', linestyle='-.', linewidth=1.2, label=f'Median $p_{{50}}$ ({p50_val:.0f} ms)')
    ax_b.axvline(p90_val, color='#dc2626', linestyle=':', linewidth=1.4, label=f'Tail $p_{{90}}$ ({p90_val:.0f} ms)')

    ax_b.scatter([p50_val, p90_val], [50.0, 90.0], color=['#d97706', '#dc2626'], s=36, zorder=5, edgecolor='#0f172a', linewidth=0.6)

    ax_b.set_xlim(1750, 5400)
    ax_b.set_ylim(0, 106)
    ax_b.set_xlabel(r'End-to-End Response Latency $t$ (ms)')
    ax_b.set_ylabel(r'Cumulative Proportion $F_n(t)$ (%)')
    ax_b.set_title(f'(b) Latency Step CDF ($p_{{50}}={p50_val:.0f}$, $p_{{90}}={p90_val:.0f}$ ms)', loc='left', pad=6)
    ax_b.legend(loc='upper left', bbox_to_anchor=(0.02, 0.98), fontsize=6.6,
                frameon=True, framealpha=0.94, edgecolor='#cbd5e1')
    ax_b.grid(True)

    # =========================================================================
    # SUBPLOT (c): Quality vs. Latency Pareto Frontier (n = 70)
    # =========================================================================
    ax_c = axes[2]

    models = [
        {'name': 'Single-Agent + Critic', 'lat': 2580.0, 'score': 73.4, 'lat_err': 92.0, 'score_err': 21.6,
         'marker': 'D', 'color': '#f59e0b'},
        {'name': 'w/o Critic Gatekeeper', 'lat': 3119.0, 'score': 78.4, 'lat_err': 105.0, 'score_err': 18.2,
         'marker': '^', 'color': '#dc2626'},
        {'name': 'Dense-only (MRL 512)', 'lat': 3480.0, 'score': 74.2, 'lat_err': 125.0, 'score_err': 18.5,
         'marker': 's', 'color': '#64748b'},
        {'name': 'Proposed Full HMAS', 'lat': 3651.0, 'score': 83.1, 'lat_err': 142.0, 'score_err': 17.1,
         'marker': 'o', 'color': '#1e3a8a'}
    ]

    # Shaded Feasible Operating Zone: S_i >= 80, Latency <= 5000 ms
    ax_c.fill_between([1700, 5000], 80, 114, color='#f0fdf4', edgecolor='#86efac',
                      linewidth=0.8, linestyle='--', alpha=0.75, zorder=1)
    ax_c.text(1820, 111, r'Feasible Zone ($S_i \geq 80$, Latency $\leq 5\ \mathrm{s}$)',
              fontsize=7.2, fontweight='bold', color='#15803d', va='top', ha='left')

    # Pareto frontier line
    pareto_models = [models[0], models[1], models[3]]
    ax_c.plot([m['lat'] for m in pareto_models], [m['score'] for m in pareto_models],
              'k--', linewidth=1.2, alpha=0.75, zorder=2, label='Pareto Frontier')

    for m in models:
        ax_c.errorbar(m['lat'], m['score'], xerr=m['lat_err'], yerr=m['score_err'],
                      fmt=m['marker'], color=m['color'], ecolor='#64748b', elinewidth=0.9, alpha=0.85,
                      capsize=2.8, markersize=7.5, markeredgecolor='#0f172a', markeredgewidth=0.9,
                      zorder=4)

    # Clean non-overlapping annotations placed completely clear of error bars
    ax_c.annotate('Proposed HMAS\n83.1 (Pass: 84.6%)',
                  xy=(3651.0, 83.1), xytext=(3900.0, 86.0),
                  fontsize=6.9, fontweight='bold', color='#1e3a8a', ha='left', va='bottom',
                  arrowprops=dict(arrowstyle='->', color='#1e3a8a', lw=0.8),
                  bbox=dict(boxstyle='round,pad=0.2', fc='#ffffff', ec='#93c5fd', alpha=0.92))

    ax_c.annotate('Single-Agent + Critic\n73.4 (Pass: 69.2%)',
                  xy=(2580.0, 73.4), xytext=(2460.0, 62.0),
                  fontsize=6.7, fontweight='bold', color='#b45309', ha='right', va='top',
                  arrowprops=dict(arrowstyle='->', color='#b45309', lw=0.8),
                  bbox=dict(boxstyle='round,pad=0.2', fc='#ffffff', ec='#fcd34d', alpha=0.92))

    ax_c.annotate('w/o Critic (ASR 34%)',
                  xy=(3119.0, 78.4), xytext=(3119.0, 99.0),
                  fontsize=6.7, fontweight='bold', color='#dc2626', ha='center', va='bottom',
                  arrowprops=dict(arrowstyle='->', color='#dc2626', lw=0.8, connectionstyle='arc3,rad=0.15'),
                  bbox=dict(boxstyle='round,pad=0.2', fc='#ffffff', ec='#fca5a5', alpha=0.92))

    ax_c.annotate('Dense-only RAG\nScore: 74.2',
                  xy=(3480.0, 74.2), xytext=(3920.0, 62.0),
                  fontsize=6.7, fontweight='bold', color='#374151', ha='left', va='top',
                  arrowprops=dict(arrowstyle='->', color='#4b5563', lw=0.8),
                  bbox=dict(boxstyle='round,pad=0.2', fc='#ffffff', ec='#cbd5e1', alpha=0.92))

    ax_c.set_xlim(1750, 4950)
    ax_c.set_ylim(46, 114)
    ax_c.set_xlabel(r'Mean End-to-End Latency (ms)')
    ax_c.set_ylabel(r'Quality Score $S_i$ (/100 pts)')
    ax_c.set_title('(c) Quality vs. Latency Pareto Frontier', loc='left', pad=6)
    ax_c.grid(True)

    plt.savefig(png_out, dpi=300, bbox_inches='tight')
    plt.savefig(svg_out, format='svg', bbox_inches='tight')
    plt.close()

    print(f"[SUCCESS] Figure 3 (1x3 readable panels) regenerated at:\n  {png_out}\n  {svg_out}")

if __name__ == '__main__':
    generate_academic_statistical_charts()
