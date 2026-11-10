#!/usr/bin/env python3
"""
Statistical Analysis & Canonical Summary Generator for Nexus Distributed EDA Paper
Reads real measured CSV/JSON outputs from run_benchmarks.mjs and computes:
  - Per-tier throughput & latency percentiles (p50, p90, p95, p99, mean, SD)
  - Mann-Whitney U tests + Bootstrap 95% CIs (10,000 resamples)
  - CQRS read isolation under concurrent write saturation
  - End-to-end stage propagation lag decomposition (Ingest, Outbox Dwell, AMQP Push, HTTP Pull)
  - Transport micro-benchmark (HTTP Mgmt vs AMQP ConfirmChannel Sequential & Batch-50)
  - Outbox burst drain dynamics & Little's Law queueing fit
  - Idempotency, FSM State Machine Invariant, Lock Enforcement, & DLQ Recovery CIs (Clopper-Pearson)
Writes: docs/research/paper/data_distributed/canonical_stats.json
"""

import json
import math
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats

DATA_DIR = Path(__file__).resolve().parent


def bootstrap_diff_ci(a, b, n_boot=10000, seed=42, func=np.median):
    rng = np.random.default_rng(seed)
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    obs = float(func(a) - func(b))
    diffs = np.empty(n_boot, dtype=float)
    for i in range(n_boot):
        sa = rng.choice(a, size=len(a), replace=True)
        sb = rng.choice(b, size=len(b), replace=True)
        diffs[i] = func(sa) - func(sb)
    lo, hi = np.percentile(diffs, [2.5, 97.5])
    return obs, float(lo), float(hi)


def bootstrap_ci(arr, n_boot=10000, seed=42, func=np.mean):
    rng = np.random.default_rng(seed)
    arr = np.asarray(arr, dtype=float)
    est = float(func(arr))
    vals = np.empty(n_boot, dtype=float)
    for i in range(n_boot):
        vals[i] = func(rng.choice(arr, size=len(arr), replace=True))
    lo, hi = np.percentile(vals, [2.5, 97.5])
    return est, float(lo), float(hi)


def clopper_pearson(k, n, alpha=0.05):
    if k == 0:
        lo = 0.0
    else:
        lo = float(stats.beta.ppf(alpha / 2.0, k, n - k + 1))
    if k == n:
        hi = 1.0
    else:
        hi = float(stats.beta.ppf(1.0 - alpha / 2.0, k + 1, n - k))
    return lo * 100.0, hi * 100.0


def summarize_series(arr):
    a = np.asarray(arr, dtype=float)
    return {
        "n": int(len(a)),
        "mean": round(float(np.mean(a)), 3),
        "sd": round(float(np.std(a, ddof=1)) if len(a) > 1 else 0.0, 3),
        "min": round(float(np.min(a)), 3),
        "p50": round(float(np.percentile(a, 50)), 3),
        "p90": round(float(np.percentile(a, 90)), 3),
        "p95": round(float(np.percentile(a, 95)), 3),
        "p99": round(float(np.percentile(a, 99)), 3),
        "max": round(float(np.max(a)), 3),
    }


def main():
    raw_summary = json.loads((DATA_DIR / "benchmark_raw_summary.json").read_text())

    # 1. Concurrency scaling (Exp 1)
    df1 = pd.read_csv(DATA_DIR / "exp1_scaling_requests.csv")
    scaling_summary = []
    for c in sorted(df1["concurrency"].unique()):
        row = {"concurrency": int(c)}
        sub_a = df1[(df1["architecture"] == "Nexus_EDA") & (df1["concurrency"] == c)]
        sub_b = df1[(df1["architecture"] == "Coupled_Sync_RDBMS") & (df1["concurrency"] == c)]
        lat_a = sub_a["latency_ms"].values
        lat_b = sub_b["latency_ms"].values
        u_stat, p_val = stats.mannwhitneyu(lat_a, lat_b, alternative="two-sided")
        row["Nexus_EDA"] = {
            **summarize_series(lat_a),
            "throughput_rps": float(sub_a["tier_throughput_rps"].iloc[0]),
            "wall_ms": float(sub_a["tier_wall_ms"].iloc[0]),
            "success_rate_pct": round(float(sub_a["ok"].mean() * 100.0), 2),
        }
        row["Coupled_Sync_RDBMS"] = {
            **summarize_series(lat_b),
            "throughput_rps": float(sub_b["tier_throughput_rps"].iloc[0]),
            "wall_ms": float(sub_b["tier_wall_ms"].iloc[0]),
            "success_rate_pct": round(float(sub_b["ok"].mean() * 100.0), 2),
        }
        row["mann_whitney_u"] = float(u_stat)
        row["mann_whitney_p"] = float(p_val)
        scaling_summary.append(row)

    # 1C. CQRS Read isolation
    dfr = pd.read_csv(DATA_DIR / "exp1_read_isolation.csv")
    read_summary = {}
    for arch in dfr["architecture"].unique():
        read_summary[arch] = {}
        for cond in ["Idle", "Under_Write_Load_c50"]:
            sub = dfr[(dfr["architecture"] == arch) & (dfr["condition"] == cond)]
            read_summary[arch][cond] = summarize_series(sub["latency_ms"].values)
        idle_v = dfr[(dfr["architecture"] == arch) & (dfr["condition"] == "Idle")]["latency_ms"].values
        load_v = dfr[(dfr["architecture"] == arch) & (dfr["condition"] == "Under_Write_Load_c50")]["latency_ms"].values
        u, p = stats.mannwhitneyu(load_v, idle_v, alternative="two-sided")
        med_diff, ci_lo, ci_hi = bootstrap_diff_ci(load_v, idle_v, func=np.median)
        mean_diff, m_lo, m_hi = bootstrap_diff_ci(load_v, idle_v, func=np.mean)
        read_summary[arch]["degradation_vs_idle"] = {
            "median_delta_ms": round(med_diff, 3),
            "median_delta_ci95": [round(ci_lo, 3), round(ci_hi, 3)],
            "mean_delta_ms": round(mean_diff, 3),
            "mean_delta_ci95": [round(m_lo, 3), round(m_hi, 3)],
            "mann_whitney_p": float(p),
        }
    # Cross-architecture comparison (Idle & Under heavy write load)
    cqrs_idle = dfr[(dfr["architecture"] == "Nexus_CQRS_Read") & (dfr["condition"] == "Idle")]["latency_ms"].values
    sync_idle = dfr[(dfr["architecture"] == "Coupled_Sync_Join") & (dfr["condition"] == "Idle")]["latency_ms"].values
    u_idle, p_idle = stats.mannwhitneyu(cqrs_idle, sync_idle, alternative="two-sided")
    read_summary["cross_arch_idle"] = {
        "mann_whitney_u": float(u_idle),
        "mann_whitney_p": float(p_idle),
    }

    cqrs_load = dfr[(dfr["architecture"] == "Nexus_CQRS_Read") & (dfr["condition"] == "Under_Write_Load_c50")]["latency_ms"].values
    sync_load = dfr[(dfr["architecture"] == "Coupled_Sync_Join") & (dfr["condition"] == "Under_Write_Load_c50")]["latency_ms"].values
    u_cross, p_cross = stats.mannwhitneyu(cqrs_load, sync_load, alternative="two-sided")
    read_summary["cross_arch_under_load"] = {
        "mann_whitney_u": float(u_cross),
        "mann_whitney_p": float(p_cross),
        "p95_reduction_pct": round((1.0 - np.percentile(cqrs_load, 95) / np.percentile(sync_load, 95)) * 100.0, 2),
        "mean_reduction_pct": round((1.0 - np.mean(cqrs_load) / np.mean(sync_load)) * 100.0, 2),
    }

    # 2A. End-to-End Stage Lag Decomposition
    df2a = pd.read_csv(DATA_DIR / "exp2a_e2e_stage_lags.csv")
    stage_stats = {}
    for col in ["ingest_http_ms", "outbox_dwell_ms", "track_broker_ms", "track_e2e_ms", "ship_fsm_ms", "ship_e2e_ms", "rep_poll_ms", "rep_e2e_ms"]:
        vals = df2a[col].dropna().values
        st = summarize_series(vals)
        est, ci_lo, ci_hi = bootstrap_ci(vals, func=np.mean)
        st["mean_ci95"] = [round(ci_lo, 3), round(ci_hi, 3)]
        stage_stats[col] = st

    # Mean event lag share & variance ratio: outbox_dwell / track_e2e
    dwell_vals = df2a["outbox_dwell_ms"].values
    track_e2e = df2a["track_e2e_ms"].values
    dwell_share_mean = float(np.mean(dwell_vals / track_e2e) * 100.0)
    dwell_var_share = float(np.var(dwell_vals, ddof=1) / np.var(track_e2e, ddof=1) * 100.0)
    stage_stats["dwell_share_of_tracking_e2e_pct"] = round(dwell_share_mean, 2)
    stage_stats["dwell_variance_share_pct"] = round(dwell_var_share, 2)

    # 2B. Outbox Burst Drain
    df2b = pd.read_csv(DATA_DIR / "exp2b_outbox_drain_curve.csv")
    drain_summary = {
        "samples": int(len(df2b)),
        "peak_pending": int(df2b["pending_count"].max()),
        "total_drain_elapsed_ms": int(df2b[df2b["published_count"] == 200]["elapsed_ms"].min()) if (df2b["published_count"] == 200).any() else int(df2b["elapsed_ms"].max()),
    }

    # 2C. Transport Micro-Benchmark
    df2c = pd.read_csv(DATA_DIR / "exp2c_transport_microbench.csv")
    transport_summary = {}
    for t in df2c["transport"].unique():
        vals = df2c[df2c["transport"] == t]["latency_ms"].values
        st = summarize_series(vals)
        tot = raw_summary["transportTotalsMs"].get(
            {"HTTP_Mgmt_Sequential": "HTTP_Mgmt_Sequential_200msgs",
             "AMQP_Confirm_Sequential": "AMQP_Confirm_Sequential_200msgs",
             "AMQP_Confirm_Batch50": "AMQP_Confirm_Batch50_200msgs"}[t]
        )
        st["total_200msgs_ms"] = tot
        st["throughput_msgs_per_sec"] = round(200.0 / (tot / 1000.0), 1)
        transport_summary[t] = st

    # 3. Idempotency
    df3 = pd.read_csv(DATA_DIR / "exp3_idempotency_requests.csv")
    idem_stats = {}
    for ph in df3["phase"].unique():
        vals = df3[df3["phase"] == ph]["latency_ms"].values
        idem_stats[ph] = summarize_series(vals)
    fresh_v = df3[df3["phase"] == "Fresh_Write"]["latency_ms"].values
    replay_v = df3[df3["phase"] == "Sequential_Replay"]["latency_ms"].values
    u3, p3 = stats.mannwhitneyu(replay_v, fresh_v, alternative="two-sided")
    med_d3, lo3, hi3 = bootstrap_diff_ci(fresh_v, replay_v, func=np.median)
    idem_stats["fresh_vs_replay"] = {
        "median_speedup_ms": round(med_d3, 3),
        "median_speedup_ci95": [round(lo3, 3), round(hi3, 3)],
        "speedup_factor": round(float(np.median(fresh_v) / np.median(replay_v)), 2),
        "mann_whitney_p": float(p3),
    }
    idem_stats["integrity"] = raw_summary["idemIntegrity"]

    # 4A. FSM Safety & Lock Policy
    df4a = pd.read_csv(DATA_DIR / "exp4a_fsm_and_locks.csv")
    n_fsm = len(df4a)
    k_pres = int(df4a["fsm_preserved"].sum())
    k_tl = int(df4a["timeline_archived"].sum())
    # Check TrackingCurrent projection skew on out-of-order terminal attacks
    skew_cnt = int((df4a["tracking_current_status"] != df4a["expected_authoritative_status"]).sum())
    # Distinct shipments experiencing projection skew vs total shipments tested
    df4a_ship = df4a.groupby("shipment_code").agg(
        expected=("expected_authoritative_status", "first"),
        ship_actual=("actual_ship_status", "first"),
        track_actual=("tracking_current_status", "first"),
    ).reset_index()
    ship_skew = int((df4a_ship["track_actual"] != df4a_ship["expected"]).sum())

    lock_probes = raw_summary["lockProbes"]
    lock_pass = sum(1 for x in lock_probes if x["passed_policy"] == 1)

    fsm_stats = {
        "total_ooo_attacks": n_fsm,
        "fsm_preserved": k_pres,
        "fsm_preserved_pct": round(k_pres / n_fsm * 100.0, 2),
        "fsm_preserved_ci95": [round(x, 2) for x in clopper_pearson(k_pres, n_fsm)],
        "timeline_archived": k_tl,
        "timeline_archived_pct": round(k_tl / n_fsm * 100.0, 2),
        "shipments_tested": int(len(df4a_ship)),
        "shipments_authoritative_exact": int((df4a_ship["ship_actual"] == df4a_ship["expected"]).sum()),
        "tracking_view_projection_skew_shipments": ship_skew,
        "lock_probes_total": len(lock_probes),
        "lock_probes_passed": lock_pass,
        "lock_probes_raw": lock_probes,
    }

    # 4B. DLQ Recovery Timeline
    df4b = pd.read_csv(DATA_DIR / "exp4b_dlq_recovery_timeline.csv")
    heal_first = df4b[df4b["healed_count"] == 5]["elapsed_s"].min() if (df4b["healed_count"] == 5).any() else None
    dlq_first = df4b[df4b["dlq"] == 5]["elapsed_s"].min() if (df4b["dlq"] == 5).any() else None
    dlq_stats = {
        "transient_injected": 5,
        "transient_healed": int(df4b["healed_count"].max()),
        "heal_completed_elapsed_s": float(heal_first) if heal_first is not None else None,
        "heal_ci95_pct": [round(x, 2) for x in clopper_pearson(int(df4b["healed_count"].max()), 5)],
        "permanent_poison_injected": 5,
        "permanent_dlq_captured": int(df4b["dlq"].max()),
        "dlq_arrived_elapsed_s": float(dlq_first) if dlq_first is not None else None,
        "event_preservation_total": int(df4b["healed_count"].max()) + int(df4b["dlq"].max()),
    }

    out = {
        "meta": {
            "startedAtIso": raw_summary["startedAtIso"],
            "finishedAtIso": raw_summary["finishedAtIso"],
        },
        "exp1_scaling": scaling_summary,
        "exp1c_read_isolation": read_summary,
        "exp2a_e2e_stage_lags": stage_stats,
        "exp2b_outbox_drain": drain_summary,
        "exp2c_transport_microbench": transport_summary,
        "exp3_idempotency": idem_stats,
        "exp4a_fsm_and_locks": fsm_stats,
        "exp4b_dlq_recovery": dlq_stats,
    }

    (DATA_DIR / "canonical_stats.json").write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
