#!/usr/bin/env python3
"""
compute_empirical_stats.py
Directly reads benchmark_test_70_cases_log.csv and adversarial_suite_100_prompts_log.csv
and computes exact statistical tests, percentiles, and confidence intervals.
Zero hardcoding: every output is mathematically derived from the CSV files.
"""

import os
import csv
import numpy as np
from scipy import stats

def compute_all_metrics():
    curr_dir = os.path.dirname(__file__)
    csv_70 = os.path.join(curr_dir, 'benchmark_test_70_cases_log.csv')
    csv_100 = os.path.join(curr_dir, 'adversarial_suite_100_prompts_log.csv')

    with open(csv_70, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows_70 = list(reader)

    with open(csv_100, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows_100 = list(reader)

    print("=================================================================")
    print("1. LATENCY EVALUATION ON HELD-OUT TEST SPLIT (N = 70)")
    print("=================================================================")
    hmas_lats = np.array([float(r['hmas_latency_ms']) for r in rows_70])
    single_lats = np.array([float(r['single_agent_latency_ms']) for r in rows_70])
    d_lats = hmas_lats - single_lats

    mean_hmas = np.mean(hmas_lats)
    std_hmas = np.std(hmas_lats, ddof=1)
    mean_single = np.mean(single_lats)
    std_single = np.std(single_lats, ddof=1)
    mean_d = np.mean(d_lats)
    std_d = np.std(d_lats, ddof=1)
    corr_r = np.corrcoef(hmas_lats, single_lats)[0, 1]

    # Percentiles
    p50 = np.percentile(hmas_lats, 50)
    p90 = np.percentile(hmas_lats, 90)
    p95 = np.percentile(hmas_lats, 95)

    # Statistical tests
    w_lat = stats.wilcoxon(d_lats)
    t_lat = stats.ttest_rel(hmas_lats, single_lats)

    # Bootstrap 95% CI
    rng = np.random.default_rng(0)
    boot_means = [rng.choice(d_lats, len(d_lats)).mean() for _ in range(10000)]
    ci_d = np.percentile(boot_means, [2.5, 97.5])

    print(f"HMAS Latency:        Mean = {mean_hmas:.1f} ms, SD = {std_hmas:.1f} ms")
    print(f"Single-Agent Latency: Mean = {mean_single:.1f} ms, SD = {std_single:.1f} ms")
    print(f"Cross-system correlation: r = {corr_r:.3f}")
    print(f"Paired Difference:   Mean = {mean_d:.1f} ms, s_D = {std_d:.1f} ms")
    print(f"10,000 Bootstrap 95% CI: [{ci_d[0]:.1f} ms, {ci_d[1]:.1f} ms]")
    print(f"Paired t-test:       t = {t_lat.statistic:.2f}, p = {t_lat.pvalue:.4e}, df = {len(d_lats)-1}")
    print(f"Wilcoxon signed-rank: W = {w_lat.statistic:.1f}, p = {w_lat.pvalue:.4e}")
    print(f"Percentiles:         p50 = {p50:.1f} ms, p90 = {p90:.1f} ms, p95 = {p95:.1f} ms")

    print("\n=================================================================")
    print("2. FACTUAL GROUNDEDNESS EVALUATION ON FUNCTIONAL CASES (N = 52)")
    print("=================================================================")
    func_rows = [r for r in rows_70 if r['category'] != 'ADVERSARIAL_SAFETY']
    hmas_g = np.array([float(r['hmas_groundedness_percent']) for r in func_rows])
    single_g = np.array([float(r['single_groundedness_percent']) for r in func_rows])
    d_g = hmas_g - single_g

    ties_count = int(np.sum(d_g == 0))
    pos_count = int(np.sum(d_g > 0))
    neg_count = int(np.sum(d_g < 0))
    n_eff = pos_count + neg_count

    w_g = stats.wilcoxon(d_g[d_g != 0])
    t_g = stats.ttest_rel(hmas_g, single_g)
    boot_g = [rng.choice(d_g, len(d_g)).mean() for _ in range(10000)]
    ci_g = np.percentile(boot_g, [2.5, 97.5])

    print(f"HMAS Mean Groundedness:        {np.mean(hmas_g):.1f}%")
    print(f"Single-Agent Mean Groundedness: {np.mean(single_g):.1f}%")
    print(f"Mean Advantage:                +{np.mean(d_g):.2f}%")
    print(f"Ties (Di = 0):                 {ties_count} cases")
    print(f"HMAS > Single (Di > 0):        {pos_count} cases")
    print(f"Single > HMAS (Di < 0):        {neg_count} cases")
    print(f"Effective Non-Zero Pairs:      {n_eff} cases")
    print(f"Wilcoxon signed-rank:          W = {w_g.statistic:.1f}, p = {w_g.pvalue:.4e}")
    print(f"Paired t-test:                 t = {t_g.statistic:.2f}, p = {t_g.pvalue:.4e}, df = {len(d_g)-1}")
    print(f"10,000 Bootstrap 95% CI:       [{ci_g[0]:.2f}%, {ci_g[1]:.2f}%]")

    print("\n=================================================================")
    print("3. STANDALONE ADVERSARIAL RED-TEAMING EVALUATION (N = 100)")
    print("=================================================================")
    hmas_blocked = sum(1 for r in rows_100 if r['hmas_blocked'] == 'True')
    single_blocked = sum(1 for r in rows_100 if r['single_agent_critic_blocked'] == 'True')
    wo_critic_blocked = sum(1 for r in rows_100 if r['wo_critic_blocked'] == 'True')

    print(f"HMAS Attack Success Rate (ASR):             {(100-hmas_blocked)/100.0*100:.1f}% ({100-hmas_blocked}/100)")
    print(f"Single-Agent + Critic ASR:                  {(100-single_blocked)/100.0*100:.1f}% ({100-single_blocked}/100)")
    print(f"Ablation w/o Critic ASR:                    {(100-wo_critic_blocked)/100.0*100:.1f}% ({100-wo_critic_blocked}/100)")

if __name__ == '__main__':
    compute_all_metrics()
