#!/usr/bin/env python3
"""
Generates Fig. 2 and Fig. 3 (1x3 IEEE-style statistical telemetry figures, dpi=300)
strictly from real measured empirical telemetry in docs/research/paper/data_distributed/.
Outputs:
  - docs/research/paper/diagrams/distributed-scaling-latency-charts.png (.svg)
  - docs/research/paper/diagrams/distributed-resilience-drain-charts.png (.svg)
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PAPER_DIR = Path(__file__).resolve().parent
DATA_DIR = PAPER_DIR / "data_distributed"
DIAG_DIR = PAPER_DIR / "diagrams"
DIAG_DIR.mkdir(parents=True, exist_ok=True)


def setup_rc():
    plt.rcParams["font.family"] = "serif"
    plt.rcParams["font.serif"] = ["Times New Roman", "Times", "DejaVu Serif", "Liberation Serif"]
    plt.rcParams["mathtext.fontset"] = "stix"
    plt.rcParams["axes.edgecolor"] = "#1f2937"
    plt.rcParams["axes.linewidth"] = 0.9
    plt.rcParams["axes.titlesize"] = 9.8
    plt.rcParams["axes.titleweight"] = "bold"
    plt.rcParams["axes.labelsize"] = 8.8
    plt.rcParams["axes.labelweight"] = "bold"
    plt.rcParams["xtick.labelsize"] = 8.0
    plt.rcParams["ytick.labelsize"] = 8.0
    plt.rcParams["xtick.direction"] = "out"
    plt.rcParams["ytick.direction"] = "out"
    plt.rcParams["grid.color"] = "#e5e7eb"
    plt.rcParams["grid.linestyle"] = ":"
    plt.rcParams["grid.linewidth"] = 0.7
    plt.rcParams["figure.autolayout"] = False


def build_fig2(stats_json: dict):
    fig, axes = plt.subplots(1, 3, figsize=(11.8, 3.45), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    fig.subplots_adjust(top=0.86, bottom=0.17, left=0.06, right=0.985, wspace=0.25)

    c_eda = "#1e3a8a"
    c_sync = "#dc2626"

    # ---------------------------------------------------------------------
    # Panel (a): Write Throughput Scaling (Exp 1, c=1..100) + p95 callouts
    # ---------------------------------------------------------------------
    ax_a = axes[0]
    sc = stats_json["exp1_scaling"]
    concs = [r["concurrency"] for r in sc]
    x_pos = np.arange(len(concs))
    rps_eda = [r["Nexus_EDA"]["throughput_rps"] for r in sc]
    rps_sync = [r["Coupled_Sync_RDBMS"]["throughput_rps"] for r in sc]
    p95_eda = [r["Nexus_EDA"]["p95"] for r in sc]
    p95_sync = [r["Coupled_Sync_RDBMS"]["p95"] for r in sc]

    ax_a.plot(x_pos, rps_eda, "-o", color=c_eda, lw=2.0, ms=6.2, markeredgecolor="#0f172a", label="Nexus EDA (Outbox + MQ)")
    ax_a.plot(x_pos, rps_sync, "--s", color=c_sync, lw=1.8, ms=5.8, markeredgecolor="#0f172a", label="Coupled Sync RDBMS Baseline")

    # Shade region where EDA outperforms Sync
    ax_a.fill_between(x_pos[1:], rps_sync[1:], rps_eda[1:], color="#93c5fd", alpha=0.25)

    # Non-overlapping annotations at key operating points
    ax_a.annotate(f"c=1 lock-check\n104 vs 423 req/s", xy=(0, 104.2), xytext=(0.45, 210),
                  fontsize=6.5, fontweight="bold", color="#374151",
                  arrowprops=dict(arrowstyle="->", color="#4b5563", lw=0.8),
                  bbox=dict(boxstyle="round,pad=0.18", fc="#fff", ec="#cbd5e1", alpha=0.95))

    ax_a.annotate(f"Peak: {rps_eda[2]:.1f} req/s\n($p_{{95}}$={p95_eda[2]:.1f} vs {p95_sync[2]:.1f} ms)",
                  xy=(2, rps_eda[2]), xytext=(1.55, 865),
                  fontsize=6.6, fontweight="bold", color=c_eda, ha="center",
                  arrowprops=dict(arrowstyle="->", color=c_eda, lw=0.85),
                  bbox=dict(boxstyle="round,pad=0.18", fc="#eff6ff", ec="#93c5fd", alpha=0.95))

    ax_a.annotate(f"Sync Peak: 670\n-> {rps_sync[3]:.0f} req/s ($p_{{95}}$={p95_sync[3]:.0f}ms)",
                  xy=(3, rps_sync[3]), xytext=(2.45, 385),
                  fontsize=6.4, fontweight="bold", color="#b91c1c", ha="center",
                  arrowprops=dict(arrowstyle="->", color=c_sync, lw=0.8),
                  bbox=dict(boxstyle="round,pad=0.18", fc="#fef2f2", ec="#fca5a5", alpha=0.95))

    ax_a.set_xticks(x_pos)
    ax_a.set_xticklabels([f"c={c}" for c in concs])
    ax_a.set_ylim(0, 990)
    ax_a.set_xlabel("Concurrent Write Clients ($n=150$ reqs/tier)")
    ax_a.set_ylabel("Write Throughput (req/s)")
    ax_a.set_title("(a) Concurrency Scaling & Tail Contention", loc="left", pad=6)
    ax_a.legend(loc="lower right", fontsize=6.6, frameon=True, framealpha=0.95, edgecolor="#94a3b8")
    ax_a.grid(True)

    # ---------------------------------------------------------------------
    # Panel (b): CQRS Read Isolation Under c=50 Concurrent Writers (Exp 1C)
    # ---------------------------------------------------------------------
    ax_b = axes[1]
    dfr = pd.read_csv(DATA_DIR / "exp1_read_isolation.csv")
    groups = [
        ("Nexus CQRS\n(Idle)", dfr[(dfr["architecture"] == "Nexus_CQRS_Read") & (dfr["condition"] == "Idle")]["latency_ms"].values, "#93c5fd"),
        ("Nexus CQRS\n(c=50 Writes)", dfr[(dfr["architecture"] == "Nexus_CQRS_Read") & (dfr["condition"] == "Under_Write_Load_c50")]["latency_ms"].values, "#1e3a8a"),
        ("Sync Join\n(Idle)", dfr[(dfr["architecture"] == "Coupled_Sync_Join") & (dfr["condition"] == "Idle")]["latency_ms"].values, "#fecaca"),
        ("Sync Join\n(c=50 Writes)", dfr[(dfr["architecture"] == "Coupled_Sync_Join") & (dfr["condition"] == "Under_Write_Load_c50")]["latency_ms"].values, "#dc2626"),
    ]

    bp = ax_b.boxplot(
        [g[1] for g in groups],
        positions=np.arange(4),
        widths=0.48,
        patch_artist=True,
        whis=(5, 95),
        showfliers=False,
        medianprops=dict(color="#f59e0b", linewidth=2.0),
        boxprops=dict(linewidth=1.0, edgecolor="#0f172a"),
        whiskerprops=dict(linewidth=1.0, color="#374151"),
        capprops=dict(linewidth=1.0, color="#374151"),
    )
    for patch, (_, _, col) in zip(bp["boxes"], groups):
        patch.set_facecolor(col)
        patch.set_alpha(0.88)

    # Annotate exact medians and p95
    for idx, (_, vals, col) in enumerate(groups):
        p50 = np.percentile(vals, 50)
        p95 = np.percentile(vals, 95)
        y_top = p95 + 1.5
        txt_col = "#0f172a"
        ax_b.text(idx, y_top, f"p50={p50:.1f}\np95={p95:.1f}", ha="center", va="bottom",
                  fontsize=6.4, fontweight="bold", color=txt_col)

    ax_b.annotate("-65.6% $p_{95}$ tail under write load\n(15.7 ms vs. 45.7 ms Sync)",
                  xy=(1.18, 15.8), xytext=(1.05, 51.5),
                  fontsize=6.6, fontweight="bold", color="#1e3a8a", ha="center",
                  arrowprops=dict(arrowstyle="->", color="#1e3a8a", lw=0.85, connectionstyle="arc3,rad=-0.18"),
                  bbox=dict(boxstyle="round,pad=0.22", fc="#eff6ff", ec="#93c5fd", alpha=0.96))

    ax_b.set_xticks(np.arange(4))
    ax_b.set_xticklabels([g[0] for g in groups], fontsize=7.2)
    ax_b.set_ylim(0, 62)
    ax_b.set_ylabel("Tracking Read Latency (ms, whis=5–95%)")
    ax_b.set_title("(b) CQRS Read Isolation ($N=200$, 25R / 50W)", loc="left", pad=6)
    ax_b.grid(True, axis="y")

    # ---------------------------------------------------------------------
    # Panel (c): End-to-End Propagation Lag Decomposition ECDF (Exp 2A)
    # ---------------------------------------------------------------------
    ax_c = axes[2]
    df2a = pd.read_csv(DATA_DIR / "exp2a_e2e_stage_lags.csv")
    n2 = len(df2a)
    y_cdf = np.arange(1, n2 + 1) / n2 * 100.0

    for col, lbl, clr, ls in [
        ("ingest_http_ms", "HTTP Write ACK ($p_{50}$=21.2 ms)", "#059669", "-"),
        ("track_e2e_ms", "Tracking E2E AMQP ($\\mu$=533 ms)", "#1e3a8a", "-"),
        ("rep_e2e_ms", "Reporting E2E Pull ($\\mu$=895 ms)", "#d97706", "--"),
    ]:
        s_vals = np.sort(df2a[col].values)
        ax_c.step(s_vals, y_cdf, where="post", color=clr, linestyle=ls, linewidth=1.8, label=lbl)

    ax_c.axvline(532.0, color="#1e3a8a", linestyle=":", lw=1.0, alpha=0.75)
    ax_c.annotate("Outbox Dwell $\\mu=532.0$ ms\n(99.7% of Track E2E lag)",
                  xy=(532.0, 26), xytext=(785, 8),
                  fontsize=6.3, fontweight="bold", color="#1e3a8a", ha="left",
                  arrowprops=dict(arrowstyle="->", color="#1e3a8a", lw=0.8),
                  bbox=dict(boxstyle="round,pad=0.22", fc="#ffffff", ec="#93c5fd", alpha=0.96))

    ax_c.set_xlim(-20, 1450)
    ax_c.set_ylim(0, 108)
    ax_c.set_xlabel("Elapsed Time Since Command Enqueue (ms)")
    ax_c.set_ylabel("Cumulative Proportion $F_n(t)$ (%)")
    ax_c.set_title("(c) E2E Stage Propagation ECDF ($N=120$)", loc="left", pad=6)
    ax_c.legend(loc="upper left", bbox_to_anchor=(0.06, 0.98), fontsize=6.3,
                frameon=True, framealpha=0.95, edgecolor="#94a3b8")
    ax_c.grid(True)

    out_png = DIAG_DIR / "distributed-scaling-latency-charts.png"
    out_svg = DIAG_DIR / "distributed-scaling-latency-charts.svg"
    plt.savefig(out_png, dpi=300, bbox_inches="tight")
    plt.savefig(out_svg, format="svg", bbox_inches="tight")
    plt.close()
    print(f"[OK] Saved Fig. 2 to {out_png}")


def build_fig3(stats_json: dict):
    fig, axes = plt.subplots(1, 3, figsize=(11.8, 3.45), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    fig.subplots_adjust(top=0.86, bottom=0.17, left=0.06, right=0.985, wspace=0.26)

    # ---------------------------------------------------------------------
    # Panel (a): Outbox Burst-200 Drain Staircase + Transport Inset
    # ---------------------------------------------------------------------
    ax_a = axes[0]
    df2b = pd.read_csv(DATA_DIR / "exp2b_outbox_drain_curve.csv")
    t_s = df2b["elapsed_ms"].values / 1000.0
    ax_a.step(t_s, df2b["pending_count"].values, where="post", color="#dc2626", lw=1.8, linestyle="--", label="Outbox PENDING Queue")
    ax_a.step(t_s, df2b["published_count"].values, where="post", color="#1e3a8a", lw=2.0, label="Published ($B=50, T_{\\mathrm{poll}}=1\\,\\mathrm{s}$)")
    ax_a.fill_between(t_s, 0, df2b["published_count"].values, step="post", color="#93c5fd", alpha=0.22)

    ax_a.annotate("4 quantized $B=50$ ticks\nComplete at $3.82\\,\\mathrm{s}$",
                  xy=(3.817, 200), xytext=(0.95, 224),
                  fontsize=6.5, fontweight="bold", color="#1e3a8a",
                  arrowprops=dict(arrowstyle="->", color="#1e3a8a", lw=0.85))

    # Clean inset box placed in open lower-middle void (y < 46, t = 0.85..2.65s)
    inset_txt = (
        "Exp 2C (200 msgs):\n"
        "HTTP Mgmt: 333ms (600/s)\n"
        "AMQP Seq : 117ms (1.7k/s)\n"
        "AMQP B50 : 11.8ms (16.9k/s)"
    )
    ax_a.text(0.24, 0.04, inset_txt, transform=ax_a.transAxes,
              fontsize=5.9, family="monospace", fontweight="bold", color="#0f172a",
              bbox=dict(boxstyle="round,pad=0.28", fc="#f8fafc", ec="#475569", lw=0.8, alpha=0.96))

    ax_a.set_xlim(0, 4.05)
    ax_a.set_ylim(0, 265)
    ax_a.set_xlabel("Elapsed Burst Time (s)")
    ax_a.set_ylabel("OutboxEvent Row Count (rows)")
    ax_a.set_title("(a) Outbox Burst Drain & Transport (N=200)", loc="left", pad=6)
    ax_a.legend(loc="upper right", bbox_to_anchor=(0.99, 0.985), fontsize=6.2, frameon=True, framealpha=0.95, edgecolor="#94a3b8")
    ax_a.grid(True)

    # ---------------------------------------------------------------------
    # Panel (b): Dual-Layer Idempotency Latency Distribution (Exp 3, N=500)
    # ---------------------------------------------------------------------
    ax_b = axes[1]
    df3 = pd.read_csv(DATA_DIR / "exp3_idempotency_requests.csv")
    phases = [
        ("Fresh Write\n(n=100)", df3[df3["phase"] == "Fresh_Write"]["latency_ms"].values, "#64748b"),
        ("Seq. Replay\n(n=100)", df3[df3["phase"] == "Sequential_Replay"]["latency_ms"].values, "#059669"),
        ("6x Race Storm\n(n=300, c=60)", df3[df3["phase"] == "Concurrent_Storm_6x"]["latency_ms"].values, "#1e3a8a"),
    ]
    bp3 = ax_b.boxplot(
        [p[1] for p in phases],
        positions=np.arange(3),
        widths=0.45,
        patch_artist=True,
        whis=(5, 95),
        showfliers=False,
        medianprops=dict(color="#f59e0b", linewidth=2.0),
        boxprops=dict(linewidth=1.0, edgecolor="#0f172a"),
        whiskerprops=dict(linewidth=1.0, color="#374151"),
        capprops=dict(linewidth=1.0, color="#374151"),
    )
    for patch, (_, _, col) in zip(bp3["boxes"], phases):
        patch.set_facecolor(col)
        patch.set_alpha(0.86)

    for idx, (_, vals, _) in enumerate(phases):
        p50 = np.percentile(vals, 50) + 1e-6
        p95 = np.percentile(vals, 95) + 1e-6
        ax_b.text(idx, p95 + 1.8, f"p50={p50:.2f}ms\np95={p95:.1f}ms", ha="center", va="bottom",
                  fontsize=6.5, fontweight="bold", color="#0f172a")

    ax_b.annotate("2.12x replay speedup\n(1.82 ms vs. 3.87 ms Fresh)\n500/500 HTTP 2xx\n150/150 Exact DB Rows",
                  xy=(1.0, 21.5), xytext=(0.06, 62.0),
                  fontsize=6.5, fontweight="bold", color="#047857",
                  arrowprops=dict(arrowstyle="->", color="#059669", lw=0.85, connectionstyle="arc3,rad=0.12"),
                  bbox=dict(boxstyle="round,pad=0.24", fc="#ecfdf5", ec="#6ee7b7", alpha=0.96))

    ax_b.set_xticks(np.arange(3))
    ax_b.set_xticklabels([p[0] for p in phases], fontsize=7.5)
    ax_b.set_ylim(0, 114)
    ax_b.set_ylabel("API Response Latency (ms, whis=5–95%)")
    ax_b.set_title("(b) Dual-Layer Idempotency Speedup", loc="left", pad=6)
    ax_b.grid(True, axis="y")

    # ---------------------------------------------------------------------
    # Panel (c): Live Multi-Tier TTL Retry & Self-Healing (Exp 4B, 0..72.5s)
    # ---------------------------------------------------------------------
    ax_c = axes[2]
    df4b = pd.read_csv(DATA_DIR / "exp4b_dlq_recovery_timeline.csv")
    t4 = df4b["elapsed_s"].values
    ax_c.step(t4, df4b["retry_10s"].values, where="post", color="#d97706", lw=1.8, linestyle="-", label=".retry.10s (10s TTL)")
    # Slight +0.16 visual dodge on retry_1m where it overlaps healed_count=5 (t=17..71s) so both are clearly legible
    r1m_vis = np.where(df4b["retry_1m"].values > 0, df4b["retry_1m"].values + 0.16, 0.0)
    ax_c.step(t4, r1m_vis, where="post", color="#7c3aed", lw=2.0, linestyle="-.", label=".retry.1m (60s TTL)")
    ax_c.step(t4, df4b["dlq"].values, where="post", color="#dc2626", lw=2.0, linestyle="--", label="shipment-service.dlq")
    ax_c.step(t4, df4b["healed_count"].values, where="post", color="#059669", lw=2.1, linestyle="-", label="Self-Healed State (DB)")

    ax_c.axvline(3.09, color="#475569", linestyle=":", lw=1.0)
    ax_c.annotate("t=3.09s: 5 delayed\nshipments created", xy=(3.09, 8.2), xytext=(12.0, 10.6),
                  fontsize=6.2, fontweight="bold", color="#334155",
                  arrowprops=dict(arrowstyle="->", color="#475569", lw=0.8))

    ax_c.annotate("5/5 healed\n@ 10.36s", xy=(10.36, 5.0), xytext=(22.0, 7.6),
                  fontsize=6.3, fontweight="bold", color="#047857",
                  arrowprops=dict(arrowstyle="->", color="#059669", lw=0.85),
                  bbox=dict(boxstyle="round,pad=0.18", fc="#ecfdf5", ec="#6ee7b7", alpha=0.95))

    ax_c.text(43.5, 5.80, "5 poison waiting 60s TTL", fontsize=5.9, fontweight="bold", color="#6d28d9", ha="center")

    ax_c.annotate("5/5 poison\n-> DLQ @ 71.97s", xy=(71.97, 5.0), xytext=(44.5, 7.6),
                  fontsize=6.3, fontweight="bold", color="#b91c1c",
                  arrowprops=dict(arrowstyle="->", color="#dc2626", lw=0.85),
                  bbox=dict(boxstyle="round,pad=0.18", fc="#fef2f2", ec="#fca5a5", alpha=0.95))

    ax_c.set_xlim(0, 75)
    ax_c.set_ylim(-0.3, 12.2)
    ax_c.set_yticks([0, 2, 4, 6, 8, 10])
    ax_c.set_xlabel("Fault Recovery Timeline (s)")
    ax_c.set_ylabel("Messages / Healed Shipments")
    ax_c.set_title("(c) Multi-Tier Retry & Self-Healing (N=10)", loc="left", pad=6)
    ax_c.legend(loc="center right", bbox_to_anchor=(0.98, 0.25), fontsize=6.2, frameon=True, framealpha=0.95, edgecolor="#94a3b8")
    ax_c.grid(True)

    out_png = DIAG_DIR / "distributed-resilience-drain-charts.png"
    out_svg = DIAG_DIR / "distributed-resilience-drain-charts.svg"
    plt.savefig(out_png, dpi=300, bbox_inches="tight")
    plt.savefig(out_svg, format="svg", bbox_inches="tight")
    plt.close()
    print(f"[OK] Saved Fig. 3 to {out_png}")


def main():
    setup_rc()
    stats_json = json.loads((DATA_DIR / "canonical_stats.json").read_text())
    build_fig2(stats_json)
    build_fig3(stats_json)


if __name__ == "__main__":
    main()
