#!/usr/bin/env python3
"""
compute_human_agreement.py
Computes inter-rater / human-vs-automated calibration agreement statistics
once human graders fill in `human_score_1_to_5` inside
docs/graduation-thesis/evaluation/human_calibration_sample_30.csv.
"""

import csv
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "graduation-thesis" / "evaluation" / "human_calibration_sample_30.csv"


def rankdata(vals):
    indexed = sorted(enumerate(vals), key=lambda x: x[1])
    ranks = [0.0] * len(vals)
    i = 0
    while i < len(vals):
        j = i
        while j + 1 < len(vals) and indexed[j + 1][1] == indexed[i][1]:
            j += 1
        avg = (i + j + 2) / 2.0
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg
        i = j + 1
    return ranks


def spearman_rho(x, y):
    rx, ry = rankdata(x), rankdata(y)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den = math.sqrt(sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry))
    return num / den if den > 0 else 0.0


def quadratic_weighted_kappa(y1, y2, min_rating=1, max_rating=5):
    k = max_rating - min_rating + 1
    n = len(y1)
    obs = [[0] * k for _ in range(k)]
    for a, b in zip(y1, y2):
        obs[a - min_rating][b - min_rating] += 1
    hist1 = [sum(obs[i]) for i in range(k)]
    hist2 = [sum(obs[i][j] for i in range(k)) for j in range(k)]
    num = 0.0
    den = 0.0
    for i in range(k):
        for j in range(k):
            w = ((i - j) ** 2) / ((k - 1) ** 2)
            exp = (hist1[i] * hist2[j]) / n
            num += w * obs[i][j]
            den += w * exp
    return 1.0 - (num / den) if den > 0 else 0.0


def main():
    rows = list(csv.DictReader(CSV_PATH.open("r", encoding="utf-8")))
    graded = [r for r in rows if (r.get("human_score_1_to_5") or "").strip().isdigit()]
    if len(graded) < 5:
        print(f"[INFO] Found only {len(graded)}/{len(rows)} graded rows in {CSV_PATH}.")
        print("Fill 'human_score_1_to_5' (integers 1..5) for all 30 stratified rows, then re-run.")
        return

    auto_tiers = [int(r["auto_tier_1_to_5"]) for r in graded]
    human_tiers = [int(r["human_score_1_to_5"]) for r in graded]
    exact = sum(1 for a, b in zip(auto_tiers, human_tiers) if a == b)
    within1 = sum(1 for a, b in zip(auto_tiers, human_tiers) if abs(a - b) <= 1)
    rho = spearman_rho(auto_tiers, human_tiers)
    qwk = quadratic_weighted_kappa(auto_tiers, human_tiers)

    print(f"Graded rows          : {len(graded)} / {len(rows)}")
    print(f"Exact tier agreement : {exact}/{len(graded)} ({exact/len(graded)*100:.1f}%)")
    print(f"Within +/-1 agreement: {within1}/{len(graded)} ({within1/len(graded)*100:.1f}%)")
    print(f"Spearman rho         : {rho:.4f}")
    print(f"Quadratic Weighted k : {qwk:.4f}")


if __name__ == "__main__":
    main()

