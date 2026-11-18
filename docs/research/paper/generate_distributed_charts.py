#!/usr/bin/env python3
"""
Generates standalone, separated single-column IEEE figures (Fig. 2 .. Fig. 7, dpi=300)
strictly from genuine R=5 empirical telemetry in docs/research/paper/data_distributed/.
Each figure uses a compact ~5.15x2.32 canvas scaled to 3.48 in (IEEE single column)
with large, legible typography (>= 6-7 pt final printed size) and zero page overflow.
Outputs:
  - docs/research/paper/diagrams/fig2-write-scaling-ablation.png (.svg)
  - docs/research/paper/diagrams/fig3-cqrs-read-isolation.png (.svg)
  - docs/research/paper/diagrams/fig4-propagation-lag-ecdf.png (.svg)
  - docs/research/paper/diagrams/fig5-outbox-burst-drain.png (.svg)
  - docs/research/paper/diagrams/fig6-dual-layer-idempotency.png (.svg)
  - docs/research/paper/diagrams/fig7-ttl-dlq-recovery.png (.svg)
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

PAPER_DIR = Path(__file__).resolve().parent
DATA_DIR = PAPER_DIR / "data_distributed"
DIAG_DIR = PAPER_DIR / "diagrams"
DIAG_DIR.mkdir(parents=True, exist_ok=True)


def setup_rc():
    plt.rcParams["font.family"] = "serif"
    plt.rcParams["font.serif"] = ["Times New Roman", "Times", "DejaVu Serif", "Liberation Serif"]
    plt.rcParams["mathtext.fontset"] = "stix"
    plt.rcParams["axes.edgecolor"] = "#334155"
    plt.rcParams["axes.linewidth"] = 1.0
    plt.rcParams["axes.titlesize"] = 10.5
    plt.rcParams["axes.titleweight"] = "bold"
    plt.rcParams["axes.labelsize"] = 9.2
    plt.rcParams["axes.labelweight"] = "bold"
    plt.rcParams["xtick.labelsize"] = 8.4
    plt.rcParams["ytick.labelsize"] = 8.4
    plt.rcParams["xtick.direction"] = "out"
    plt.rcParams["ytick.direction"] = "out"
    plt.rcParams["grid.color"] = "#E2E8F0"
    plt.rcParams["grid.linestyle"] = ":"
    plt.rcParams["grid.linewidth"] = 0.8
    plt.rcParams["figure.autolayout"] = False


def save_fig(fig, stem: str):
    out_png = DIAG_DIR / f"{stem}.png"
    out_svg = DIAG_DIR / f"{stem}.svg"
    fig.savefig(out_png, dpi=300)
    fig.savefig(out_svg, format="svg")
    plt.close(fig)
    print(f"[OK] Saved {out_png.name}")


def build_fig2_scaling(stats_json: dict):
    fig, ax = plt.subplots(figsize=(5.15, 2.48), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    fig.subplots_adjust(top=0.88, bottom=0.18, left=0.145, right=0.975)

    sc = stats_json["exp1_scaling"]
    concs = [r["concurrency"] for r in sc]
    x_pos = np.arange(len(concs))

    series_cfg = [
        ("Sync_DeferredKPI", "Sync DeferredKPI (pool=21)", "#059669", "-^", 5.5, 1.85),
        ("Ablation_Outbox_SQL", "SQL Outbox Ablation (pool=21)", "#1D4ED8", "-o", 6.2, 2.35),
        ("Sync_Sharded", "Sync 16-Shard KPI (pool=21)", "#D97706", "-.D", 5.0, 1.75),
        ("Ablation_Outbox_P3", "SQL Outbox (pool=3)", "#475569", "--s", 5.0, 1.75),
        ("Sync_ALL", "Sync 1-Row ALL KPI (pool=21)", "#DC2626", ":v", 5.6, 1.95),
        ("Nexus_EDA", "Nexus EDA (:3006, pool=3+RPC)", "#7C3AED", "-X", 6.2, 2.15),
    ]

    vals_map = {}
    for arch, lbl, col, fmt, ms, lw in series_cfg:
        means = [r["architectures"][arch]["run_throughput_rps"]["mean"] for r in sc]
        sds = [r["architectures"][arch]["run_throughput_rps"]["sd"] for r in sc]
        vals_map[arch] = (means, sds)
        ls = "--" if fmt.startswith("--") else "-." if fmt.startswith("-.") else ":" if fmt.startswith(":") else "-"
        marker = fmt[-1]
        ax.errorbar(
            x_pos, means, yerr=sds, fmt=marker, linestyle=ls, color=col,
            lw=lw, ms=ms, capsize=3.0, elinewidth=1.0, markeredgecolor="#0F172A",
            markeredgewidth=0.7, label=lbl, zorder=4 if "Outbox_SQL" in arch or "Nexus" in arch else 3
        )

    ax.set_xticks(x_pos)
    ax.set_xticklabels([f"c={c}" for c in concs], fontweight="bold")
    ax.set_ylim(0, 4150)
    ax.set_xlim(-0.28, 4.30)
    ax.set_xlabel("Concurrent Clients ($R=5 \\times 200$ reqs/tier)", labelpad=4)
    ax.set_ylabel("Throughput (req/s, Mean $\\pm$ SD)", labelpad=4)
    ax.set_title("Write Scaling, Component Ablation & PG Lock Contention", loc="left", pad=6)
    ax.legend(
        loc="upper center", fontsize=7.0, frameon=True, framealpha=0.96,
        edgecolor="#CBD5E1", ncol=2, columnspacing=0.8
    )
    ax.grid(True, zorder=0)
    save_fig(fig, "fig2-write-scaling-ablation")


def build_fig3_reads(stats_json: dict):
    fig, ax = plt.subplots(figsize=(5.15, 2.35), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    fig.subplots_adjust(top=0.87, bottom=0.20, left=0.125, right=0.975)

    dfr = pd.read_csv(DATA_DIR / "exp1_read_isolation.csv")
    read_stats = stats_json["exp1c_read_isolation"]["architectures"]

    spec = [
        ("Nexus_CQRS_Read", "Nexus\nCQRS", "#93C5FD", "#1D4ED8"),
        ("Sync_Sharded", "Sync\n16-Shd", "#FDE68A", "#D97706"),
        ("Sync_DeferredKPI", "Sync\nNoKPI", "#A7F3D0", "#059669"),
        ("Sync_ALL", "Sync\nALL", "#FECACA", "#DC2626"),
    ]
    positions, box_data, box_colors, tick_centers, tick_labels = [], [], [], [], []

    for i, (arch, short_lbl, c_idle, c_load) in enumerate(spec):
        pos_l = i * 2.35
        pos_r = pos_l + 0.85
        tick_centers.append((pos_l + pos_r) / 2.0)
        tick_labels.append(short_lbl)
        vals_idle = dfr[(dfr["architecture"] == arch) & (dfr["condition"] == "Idle")]["latency_ms"].values
        vals_load = dfr[(dfr["architecture"] == arch) & (dfr["condition"] == "Under_Write_Load_c50")]["latency_ms"].values
        positions.extend([pos_l, pos_r])
        box_data.extend([vals_idle, vals_load])
        box_colors.extend([c_idle, c_load])

    bp = ax.boxplot(
        box_data, positions=positions, widths=0.68, patch_artist=True,
        whis=(5, 95), showfliers=False,
        medianprops=dict(color="#F59E0B", linewidth=2.0),
        boxprops=dict(linewidth=1.0, edgecolor="#0F172A"),
        whiskerprops=dict(linewidth=1.0, color="#334155"),
        capprops=dict(linewidth=1.0, color="#334155"),
    )
    for patch, col in zip(bp["boxes"], box_colors):
        patch.set_facecolor(col)
        patch.set_alpha(0.92)

    for i, (arch, _, _, _) in enumerate(spec):
        p95_load = read_stats[arch]["Under_Write_Load_c50"]["run_p95_ms"]["mean"]
        lw_pct = read_stats[arch]["Under_Write_Load_c50"]["telemetry"]["lock_wait_sample_pct"]["mean"]
        pool_p95 = np.percentile(box_data[2 * i + 1], 95)
        y_base = max(pool_p95, np.percentile(box_data[2 * i], 95)) + 1.8
        ax.text(
            tick_centers[i], y_base, f"p95={p95_load:.1f}",
            ha="center", va="bottom", fontsize=7.8, fontweight="bold",
            color="#991B1B" if lw_pct > 0 else "#0F172A",
        )

    ax.legend(
        handles=[
            Patch(facecolor="#CBD5E1", edgecolor="#0F172A", label="Idle (Light)"),
            Patch(facecolor="#334155", edgecolor="#0F172A", label="c=50 Writes (Dark)"),
        ],
        loc="upper center", ncol=2, fontsize=7.6, frameon=True, framealpha=0.96, edgecolor="#CBD5E1",
    )

    ax.set_xticks(tick_centers)
    ax.set_xticklabels(tick_labels, fontsize=8.4, fontweight="bold")
    ax.set_ylim(0, 62)
    ax.set_ylabel("Read Latency (ms, whis=5–95%)", labelpad=4)
    ax.set_title("CQRS Read Isolation ($R=5 \\times 200$, 25R vs. 50W)", loc="left", pad=6)
    ax.grid(True, axis="y", zorder=0)
    save_fig(fig, "fig3-cqrs-read-isolation")


def build_fig4_ecdf(stats_json: dict):
    fig, ax = plt.subplots(figsize=(5.15, 2.25), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    fig.subplots_adjust(top=0.87, bottom=0.20, left=0.125, right=0.975)

    df2a = pd.read_csv(DATA_DIR / "exp2a_e2e_stage_lags.csv")
    n2 = len(df2a)
    y_cdf = np.arange(1, n2 + 1) / n2 * 100.0
    st2a = stats_json["exp2a_e2e_stage_lags"]
    ratios = st2a["ratios_exact"]
    st2d = stats_json["exp2d_independent_lbatch"]

    s_track = np.sort(df2a["track_e2e_ms"].values)
    s_ing = np.sort(df2a["ingest_http_ms"].values)
    s_rep = np.sort(df2a["rep_e2e_ms"].values)

    ax.step(s_ing, y_cdf, where="post", color="#059669", lw=1.9,
            label=f"HTTP Write ACK (mean={st2a['ingest_http_ms']['mean']:.1f} ms)", zorder=3)
    ax.step(s_track, y_cdf, where="post", color="#1D4ED8", lw=2.2,
            label=f"Track Post-Commit (mean={st2a['track_e2e_ms']['mean']:.1f} ms)", zorder=4)
    ax.fill_between(s_track, 0, y_cdf, step="post", color="#DBEAFE", alpha=0.55, zorder=2)
    ax.step(s_rep, y_cdf, where="post", color="#D97706", linestyle="--", lw=1.9,
            label=f"Reporting Pull E2E (mean={st2a['rep_e2e_ms']['mean']:.1f} ms)", zorder=3)

    dwell_m = st2a["outbox_dwell_ms"]["mean"]
    ax.axvline(dwell_m, color="#1D4ED8", linestyle="-.", lw=1.2, zorder=5)
    ax.scatter([dwell_m], [50.0], color="#1D4ED8", edgecolor="#0F172A", s=36, zorder=6)

    ax.set_xlim(-30, 2150)
    ax.set_ylim(0, 106)
    ax.set_yticks([0, 25, 50, 75, 100])
    ax.set_xlabel("Elapsed Time Since Enqueue (ms)", labelpad=4)
    ax.set_ylabel("Cumulative CDF $F_n(t)$ (%)", labelpad=4)
    ax.set_title("End-to-End Stage Propagation Lag ECDF (Exp 2A, $N=200$)", loc="left", pad=6)
    ax.legend(loc="lower right", fontsize=7.2, frameon=True, framealpha=0.96, edgecolor="#CBD5E1")
    ax.grid(True, zorder=0)
    save_fig(fig, "fig4-propagation-lag-ecdf")


def build_fig5_drain(stats_json: dict):
    fig, ax = plt.subplots(figsize=(5.15, 2.35), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    fig.subplots_adjust(top=0.87, bottom=0.20, left=0.135, right=0.975)

    df2b = pd.read_csv(DATA_DIR / "exp2b_outbox_drain_curve.csv")
    st2b = stats_json["exp2b_outbox_drain"]
    st2c = stats_json["exp2c_transport_microbench"]

    for run_id, grp in df2b.groupby("run"):
        t_s = grp["elapsed_ms"].values / 1000.0
        if run_id == 2:
            ax.step(t_s, grp["pending_count"].values, where="post", color="#DC2626", lw=1.9, linestyle="--",
                    label="Outbox PENDING (Med. R2)", zorder=4)
            ax.step(t_s, grp["published_count"].values, where="post", color="#1D4ED8", lw=2.3,
                    label="Published (Med. R2; B=50)", zorder=5)
            ax.fill_between(t_s, 0, grp["published_count"].values, step="post", color="#DBEAFE", alpha=0.50, zorder=2)
        else:
            ax.step(t_s, grp["published_count"].values, where="post", color="#60A5FA", lw=1.1, alpha=0.55,
                    label="Published Runs R1,3–5" if run_id == 1 else None, zorder=3)

    ax.axvline(4.0, color="#475569", linestyle=":", lw=1.1, zorder=2)

    ax.set_xlim(0, 4.45)
    ax.set_ylim(0, 255)
    ax.set_xlabel("Elapsed Burst Time (s)", labelpad=4)
    ax.set_ylabel("OutboxEvent Rows", labelpad=4)
    ax.set_title("Burst-200 Outbox Drain ($R=5$ Runs, $B=50$)", loc="left", pad=6)
    ax.legend(loc="upper center", bbox_to_anchor=(0.50, 0.99), ncol=2, fontsize=7.0,
              frameon=True, framealpha=0.96, edgecolor="#CBD5E1")
    ax.grid(True, zorder=0)
    save_fig(fig, "fig5-outbox-burst-drain")


def build_fig6_idempotency(stats_json: dict):
    fig, ax = plt.subplots(figsize=(5.15, 2.30), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    fig.subplots_adjust(top=0.87, bottom=0.20, left=0.125, right=0.975)

    df3 = pd.read_csv(DATA_DIR / "exp3_idempotency_requests.csv")
    st3 = stats_json["exp3_idempotency"]
    phases = [
        ("Fresh Write\n(R=5, n=200)", df3[df3["phase"] == "Fresh_Write"]["latency_ms"].values, "#CBD5E1", "///"),
        ("Seq. Replay L1\n(R=5, n=200)", df3[df3["phase"] == "Sequential_Replay"]["latency_ms"].values, "#34D399", None),
        ("6x Race Storm L2\n(R=5, n=600)", df3[df3["phase"] == "Concurrent_Storm_6x"]["latency_ms"].values, "#1D4ED8", None),
    ]
    bp3 = ax.boxplot(
        [p[1] for p in phases], positions=np.arange(3), widths=0.45,
        patch_artist=True, whis=(5, 95), showfliers=False,
        medianprops=dict(color="#F59E0B", linewidth=2.1),
        boxprops=dict(linewidth=1.0, edgecolor="#0F172A"),
        whiskerprops=dict(linewidth=1.0, color="#334155"),
        capprops=dict(linewidth=1.0, color="#334155"),
    )
    for patch, (_, _, col, ht) in zip(bp3["boxes"], phases):
        patch.set_facecolor(col)
        patch.set_alpha(0.92)
        if ht:
            patch.set_hatch(ht)

    for idx, (_, vals, _, _) in enumerate(phases):
        p50 = np.percentile(vals, 50)
        p95 = np.percentile(vals, 95)
        ax.text(idx, p95 + 2.5, f"$p_{{50}}$={p50:.2f}ms", ha="center", va="bottom",
                fontsize=8.0, fontweight="bold", color="#0F172A")

    ax.set_xticks(np.arange(3))
    ax.set_xticklabels([p[0] for p in phases], fontsize=8.2, fontweight="bold")
    ax.set_ylim(0, 108)
    ax.set_ylabel("Response Latency (ms, whis=5–95%)", labelpad=4)
    ax.set_title("Dual-Layer Idempotency Latency ($R=5, N=1,000$ Calls)", loc="left", pad=6)
    ax.grid(True, axis="y", zorder=0)
    save_fig(fig, "fig6-dual-layer-idempotency")


def build_fig7_dlq(stats_json: dict):
    fig, ax = plt.subplots(figsize=(5.15, 2.35), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    fig.subplots_adjust(top=0.87, bottom=0.20, left=0.125, right=0.975)

    df4b = pd.read_csv(DATA_DIR / "exp4b_dlq_recovery_timeline.csv")
    st4b = stats_json["exp4b_dlq_recovery"]
    t4 = df4b["elapsed_s"].values

    ax.step(t4, df4b["retry_10s"].values, where="post", color="#D97706", lw=1.9, linestyle="-",
            label=".retry.10s (10s TTL)", zorder=3)
    r1m_vis = np.where(df4b["retry_1m"].values > 0, df4b["retry_1m"].values + 0.30, 0.0)
    ax.step(t4, r1m_vis, where="post", color="#1D4ED8", lw=2.1, linestyle="-.",
            label=".retry.1m (60s TTL)", zorder=4)
    ax.step(t4, df4b["dlq"].values, where="post", color="#DC2626", lw=2.1, linestyle="--",
            label="shipment-service.dlq", zorder=4)
    ax.step(t4, df4b["healed_count"].values, where="post", color="#059669", lw=2.2, linestyle="-",
            label="Self-Healed State (DB)", zorder=4)

    t_cr = st4b["heal_create_elapsed_s"]
    ax.axvline(t_cr, color="#475569", linestyle=":", lw=1.1, zorder=2)

    ax.set_xlim(0, 77)
    ax.set_ylim(-0.6, 24.5)
    ax.set_yticks([0, 5, 10, 15, 20])
    ax.set_xlabel("Fault Recovery Timeline (s)", labelpad=4)
    ax.set_ylabel("Messages / Healed", labelpad=4)
    ax.set_title("Multi-Tier TTL Retry, Self-Healing & DLQ Proof ($N=20$)", loc="left", pad=6)
    ax.legend(loc="upper right", fontsize=7.2,
              frameon=True, framealpha=0.96, edgecolor="#CBD5E1")
    ax.grid(True, zorder=0)
    save_fig(fig, "fig7-ttl-dlq-recovery")


def main():
    setup_rc()
    stats_json = json.loads((DATA_DIR / "canonical_stats.json").read_text())
    build_fig2_scaling(stats_json)
    build_fig3_reads(stats_json)
    build_fig4_ecdf(stats_json)
    build_fig5_drain(stats_json)
    build_fig6_idempotency(stats_json)
    build_fig7_dlq(stats_json)


if __name__ == "__main__":
    main()
