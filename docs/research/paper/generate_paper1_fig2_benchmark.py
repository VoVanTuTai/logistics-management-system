#!/usr/bin/env python3
"""
generate_paper1_fig2_benchmark.py
Generates Figure 2 (3x1 stacked single-column panel for 3.48 in IEEE column) directly from genuine thesis empirical telemetry:
  - docs/research/paper/data/e2e_ablation_results.json (4 systems x N=100)
  - docs/graduation-thesis/evaluation/results_raw_before_routing_fix.csv (N=100)
  - docs/graduation-thesis/evaluation/results_raw_after_routing_fix.csv  (N=100)
  - docs/research/paper/data/rag_ablation_and_stats.json (n=39 + n=12 held-out SOP)
Zero synthetic/interpolated chart values.
"""

import csv
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[3]
EVAL_DIR = ROOT / "docs" / "graduation-thesis" / "evaluation"
DATA_DIR = Path(__file__).resolve().parent / "data"
CSV_BEFORE = EVAL_DIR / "results_raw_before_routing_fix.csv"
CSV_AFTER = EVAL_DIR / "results_raw_after_routing_fix.csv"
ABL_PATH = DATA_DIR / "e2e_ablation_results.json"
RAG_PATH = DATA_DIR / "rag_ablation_and_stats.json"
OUT_DIR = Path(__file__).resolve().parent / "diagrams"
PNG_OUT = OUT_DIR / "fig2-empirical-benchmark-and-rag.png"
SVG_OUT = OUT_DIR / "fig2-empirical-benchmark-and-rag.svg"


def main():
    rows_b = list(csv.DictReader(CSV_BEFORE.open("r", encoding="utf-8")))
    rows_a = list(csv.DictReader(CSV_AFTER.open("r", encoding="utf-8")))
    abl = json.loads(ABL_PATH.read_text(encoding="utf-8"))["conditions"]
    rag_all = json.loads(RAG_PATH.read_text(encoding="utf-8"))
    rag = rag_all["benchmark_39"]["summary"]
    rag_comb = rag_all["combined_51"]["summary"]

    plt.rcParams["font.family"] = "serif"
    plt.rcParams["font.serif"] = ["Times New Roman", "Times", "DejaVu Serif", "Liberation Serif"]
    plt.rcParams["mathtext.fontset"] = "stix"
    plt.rcParams["axes.edgecolor"] = "#334155"
    plt.rcParams["axes.linewidth"] = 0.9
    plt.rcParams["axes.titlesize"] = 10.6
    plt.rcParams["axes.titleweight"] = "bold"
    plt.rcParams["axes.labelsize"] = 9.4
    plt.rcParams["axes.labelweight"] = "bold"
    plt.rcParams["xtick.labelsize"] = 8.6
    plt.rcParams["ytick.labelsize"] = 8.6
    plt.rcParams["grid.color"] = "#E2E8F0"
    plt.rcParams["grid.linestyle"] = ":"
    plt.rcParams["grid.linewidth"] = 0.7

    fig, axes = plt.subplots(3, 1, figsize=(5.20, 5.55), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    fig.subplots_adjust(top=0.952, bottom=0.062, left=0.128, right=0.978, hspace=0.45)

    # Panel (a): End-to-End Ablation & Before/After (Overall Pass % & Safety RDR %)
    ax = axes[0]
    systems = [
        ("Vanilla LLM", "vanilla_llm"),
        ("No Stage 0 Guards", "no_stage0_guards"),
        ("Full Agent (Before)", "full_agent_before_fix"),
        ("Full Agent (After)", "full_agent_after_fix"),
    ]
    pass_v, pass_lo, pass_hi = [], [], []
    rdr_v, rdr_lo, rdr_hi = [], [], []
    for _, key in systems:
        c = abl[key]
        pv = c["pass_rate"]
        rv = c["rdr"]
        pass_v.append(pv)
        pass_lo.append(max(0.0, pv - c["pass_rate_ci95"][0]))
        pass_hi.append(max(0.0, c["pass_rate_ci95"][1] - pv))
        rdr_v.append(rv)
        rdr_lo.append(max(0.0, rv - c["rdr_ci95"][0]))
        rdr_hi.append(max(0.0, c["rdr_ci95"][1] - rv))

    x_a = np.arange(len(systems))
    bw = 0.34
    b_p = ax.bar(
        x_a - 0.18, pass_v, bw,
        yerr=[pass_lo, pass_hi], capsize=2.5, error_kw={"elinewidth": 1.0, "ecolor": "#0F172A"},
        label="Overall Pass % (N=100, 95% CI)", color="#1D4ED8", edgecolor="#0F172A", linewidth=0.85, zorder=3
    )
    b_r = ax.bar(
        x_a + 0.18, rdr_v, bw,
        yerr=[rdr_lo, rdr_hi], capsize=2.5, error_kw={"elinewidth": 1.0, "ecolor": "#065F46"},
        label="Risk Interception RDR % (n=29)", color="#34D399", edgecolor="#065F46", linewidth=0.85, hatch="///", zorder=3
    )
    for b, hi in zip(b_p, pass_hi):
        ax.text(
            b.get_x() + b.get_width() / 2.0 - 0.01, b.get_height() + hi + 2.2,
            f"{b.get_height():.1f}%", ha="center", va="bottom", fontsize=7.8, fontweight="bold", color="#1E3A8A"
        )
    for idx_b, (b, hi) in enumerate(zip(b_r, rdr_hi)):
        txt = f"{b.get_height():.0f}%*" if idx_b == 2 else f"{b.get_height():.1f}%"
        ax.text(
            b.get_x() + b.get_width() / 2.0 + 0.01, b.get_height() + hi + 2.2,
            txt, ha="center", va="bottom", fontsize=7.8, fontweight="bold", color="#065F46"
        )
    ax.set_xticks(x_a)
    ax.set_xticklabels([l for l, _ in systems])
    ax.set_ylim(0, 140)
    ax.set_yticks([0, 25, 50, 75, 100])
    ax.set_ylabel("Rate (%)", labelpad=4)
    ax.set_title("(a) Live E2E Ablation & Routing Remediation (N = 100)", loc="left", pad=6)
    ax.legend(loc="upper center", ncol=2, fontsize=7.6, frameon=True, framealpha=0.96, edgecolor="#CBD5E1", columnspacing=0.9)
    ax.grid(True, axis="y", zorder=0)

    # Panel (b): Automated 5-Tier Rubric Distribution (Before-Fix vs After-Fix, N = 100)
    ax = axes[1]
    tier_defs = [
        (5, "Tier 5 (>=\u200990)"),
        (4, "Tier 4 (75\u201389)"),
        (3, "Tier 3 (60\u201374)"),
        (2, "Tier 2 (40\u201359)"),
        (1, "Tier 1 (<40)"),
    ]
    cnt_b = [sum(1 for r in rows_b if int(r["tier_level"]) == t) for t, _ in tier_defs]
    cnt_a = [sum(1 for r in rows_a if int(r["tier_level"]) == t) for t, _ in tier_defs]
    x_b = np.arange(len(tier_defs))
    bw_b = 0.35
    bars_bb = ax.bar(x_b - 0.18, cnt_b, bw_b, label="Before-Fix (Mean 4.19/5)", color="#CBD5E1", edgecolor="#334155", linewidth=0.85, hatch="///", zorder=3)
    bars_ba = ax.bar(x_b + 0.18, cnt_a, bw_b, label="After-Fix (Mean 4.44/5)", color="#1D4ED8", edgecolor="#0F172A", linewidth=0.85, zorder=3)

    for b in bars_bb:
        ax.text(b.get_x() + b.get_width() / 2.0, b.get_height() + 1.2, f"{int(b.get_height())}", ha="center", va="bottom", fontsize=8.0, fontweight="bold", color="#334155")
    for b in bars_ba:
        ax.text(b.get_x() + b.get_width() / 2.0, b.get_height() + 1.2, f"{int(b.get_height())}", ha="center", va="bottom", fontsize=8.2, fontweight="bold", color="#0F172A")

    ax.axvline(2.5, color="#475569", linestyle="-.", linewidth=1.05, zorder=2)
    ax.set_xticks(x_b)
    ax.set_xticklabels([l for _, l in tier_defs])
    ax.set_ylim(0, 72)
    ax.set_yticks([0, 20, 40, 60])
    ax.set_ylabel("Cases (Count)", labelpad=4)
    ax.set_title("(b) Automated 5-Tier Rubric Distribution (Before vs. After)", loc="left", pad=6)
    ax.legend(loc="upper right", fontsize=7.8, frameon=True, framealpha=0.96, edgecolor="#CBD5E1")
    ax.grid(True, axis="y", zorder=0)

    # Panel (c): Genuine Retrieval Ablation on Real 59-Chunk Vector Index (n = 39 + n = 12 Held-Out)
    ax = axes[2]
    metrics = ["Hit@1 (%)", "Hit@5 (%)", "Recall@5 (%)", "MRR@5 (\u00d7100)"]
    kw_vals = [rag["keyword"]["hit_at_1"], rag["keyword"]["hit_at_5"], rag["keyword"]["recall_at_5"], rag["keyword"]["mrr_at_5"] * 100.0]
    dn_vals = [rag["dense"]["hit_at_1"], rag["dense"]["hit_at_5"], rag["dense"]["recall_at_5"], rag["dense"]["mrr_at_5"] * 100.0]
    hy_vals = [rag["hybrid"]["hit_at_1"], rag["hybrid"]["hit_at_5"], rag["hybrid"]["recall_at_5"], rag["hybrid"]["mrr_at_5"] * 100.0]

    x_c = np.arange(len(metrics))
    bw = 0.25
    b1 = ax.bar(x_c - bw, kw_vals, bw, label="Keyword + 13 Syn.", color="#CBD5E1", edgecolor="#334155", linewidth=0.8, hatch="///", zorder=3)
    b2 = ax.bar(x_c, dn_vals, bw, label="Dense (3,072-d)", color="#93C5FD", edgecolor="#1E3A8A", linewidth=0.8, zorder=3)
    b3 = ax.bar(x_c + bw, hy_vals, bw, label="Hybrid RAG", color="#1D4ED8", edgecolor="#0F172A", linewidth=0.85, zorder=3)

    for bars, col in [(b1, "#334155"), (b2, "#1E40AF"), (b3, "#0F172A")]:
        for b in bars:
            h = b.get_height()
            lbl = "100" if h >= 99.95 else f"{h:.1f}"
            ax.text(
                b.get_x() + b.get_width() / 2.0,
                h + 1.6,
                lbl,
                ha="center",
                va="bottom",
                fontsize=7.6,
                fontweight="bold",
                color=col,
            )

    ax.set_xticks(x_c)
    ax.set_xticklabels(metrics)
    ax.set_ylim(0, 142)
    ax.set_yticks([0, 25, 50, 75, 100])
    ax.set_ylabel("Retrieval (%)", labelpad=4)
    ax.set_title("(c) SOP Retrieval Ablation (59 Chunks, n = 39)", loc="left", pad=6)
    ax.legend(loc="upper center", ncol=3, fontsize=7.5, frameon=True, framealpha=0.96, edgecolor="#CBD5E1", columnspacing=0.8)
    ax.grid(True, axis="y", zorder=0)

    fig.savefig(PNG_OUT, dpi=300)
    fig.savefig(SVG_OUT)
    plt.close(fig)
    print(f"[OK] Saved Figure 2 to {PNG_OUT} and {SVG_OUT}")


if __name__ == "__main__":
    main()
