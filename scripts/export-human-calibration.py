#!/usr/bin/env python3
"""
export-human-calibration.py
Exports a stratified 30-row calibration sheet from `results_summary_after_routing_fix.json`
covering all 4 task categories and all 5 automated rubric tiers (without fabricating human labels).
Graders should hide trailing `auto_*` columns during blind rating, populate `human_score_1_to_5`
(integers 1..5) and `human_notes`, then run:
  python3 scripts/compute_human_agreement.py
"""

import csv
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IN_JSON = ROOT / "docs" / "graduation-thesis" / "evaluation" / "results_summary_after_routing_fix.json"
OUT_CSV = ROOT / "docs" / "graduation-thesis" / "evaluation" / "human_calibration_sample_30.csv"


def main():
    data = json.loads(IN_JSON.read_text(encoding="utf-8"))
    rows = data["detailed_results"]
    rng = random.Random(20261110)

    selected_ids = set()
    selected = []

    def add_row(r):
        if r["id"] not in selected_ids:
            selected_ids.add(r["id"])
            selected.append(r)

    # 1. Include all FAIL / marginal / critical-fail cases (Tiers 1, 2) and Tier 3 edge cases
    for r in rows:
        if r["tier_level"] in (1, 2, 3):
            add_row(r)

    # 2. Ensure balanced representation across all 4 categories in Tiers 4 and 5
    cats = ("SOP_KNOWLEDGE", "OPERATIONAL_TOOLS", "ADVERSARIAL_SAFETY", "OUT_OF_DOMAIN")
    per_cat_target = 3
    for cat in cats:
        pool = [r for r in rows if r["category"] == cat and r["id"] not in selected_ids]
        rng.shuffle(pool)
        for r in pool[:per_cat_target]:
            add_row(r)
            if len(selected) >= 30:
                break
        if len(selected) >= 30:
            break

    # 3. Fill remaining slots up to 30 proportionally from remaining pool
    remaining = [r for r in rows if r["id"] not in selected_ids]
    rng.shuffle(remaining)
    for r in remaining:
        if len(selected) >= 30:
            break
        add_row(r)

    selected = selected[:30]
    rng.shuffle(selected)  # Randomize presentation order for blind human evaluation

    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "id",
            "source",
            "category",
            "role",
            "query",
            "answer",
            "citations_count",
            "tools_used",
            "human_score_1_to_5",
            "human_notes",
            "auto_score",
            "auto_tier_1_to_5",
        ])
        for r in selected:
            w.writerow([
                r["id"],
                r["source"],
                r["category"],
                r["role"],
                r["query"],
                r["answer"],
                r["citations_count"],
                "; ".join(r.get("tools_used", [])),
                "",
                "",
                r["score"],
                r["tier_level"],
            ])

    tier_dist = {}
    cat_dist = {}
    for r in selected:
        tier_dist[r["tier_level"]] = tier_dist.get(r["tier_level"], 0) + 1
        cat_dist[r["category"]] = cat_dist.get(r["category"], 0) + 1
    print(f"[OK] Exported {len(selected)} stratified rows to {OUT_CSV}")
    print(f"     Tier distribution    : {dict(sorted(tier_dist.items()))}")
    print(f"     Category distribution: {cat_dist}")


if __name__ == "__main__":
    main()

