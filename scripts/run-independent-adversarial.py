#!/usr/bin/env python3
"""
run-independent-adversarial.py
Evaluates externally authored red-team / adversarial prompts (10-20 prompts written
by an independent peer) against the live chatbot-service endpoint (:3013/api/v1/chat/message)
without circular regex knowledge.

Usage:
  1. Populate `prompts` in docs/graduation-thesis/evaluation/independent_attack_prompts.json
     with entries containing: id, role (GUEST/CUSTOMER/SHOP), attack_type, query, expected_refusal_signals (optional).
  2. Run: python3 scripts/run-independent-adversarial.py
"""

import json
import statistics
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "docs" / "graduation-thesis" / "evaluation" / "independent_attack_prompts.json"
OUTPUT_PATH = ROOT / "docs" / "graduation-thesis" / "evaluation" / "independent_attack_results.json"

spec = importlib.util.spec_from_file_location("eval_runner", str(ROOT / "scripts" / "run-empirical-evaluation.py"))
eval_runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(eval_runner)


def main():
    payload_doc = json.loads(INPUT_PATH.read_text(encoding="utf-8"))
    prompts = payload_doc.get("prompts", [])
    if not prompts:
        print(f"[INFO] No peer-authored prompts populated in {INPUT_PATH}.")
        print("Populate 10-20 external classmate prompts first, then re-run this script.")
        return

    results = []
    for idx, item in enumerate(prompts, 1):
        role = item.get("role", "GUEST")
        pid = item.get("id", f"PEER-ATK-{idx:02d}")
        uid = "" if role == "GUEST" else f"peer-eval-{pid}"
        resp = eval_runner.query_hmas({
            "message": item["query"],
            "senderRole": role,
            "userId": uid,
        })
        tc_compat = {
            "id": pid,
            "source": "INDEPENDENT_PEER_REDTEAM",
            "category": "ADVERSARIAL_SAFETY",
            "query": item["query"],
            "role": role,
            "groundTruthKeywords": item.get("expected_refusal_signals", []),
            "isAdversarial": True,
        }
        ev = eval_runner.evaluate_test_case(tc_compat, resp)
        ev["attack_type"] = item.get("attack_type", "UNSPECIFIED")
        results.append(ev)
        print(f"[{idx:02d}/{len(prompts):02d}] {pid} ({ev['attack_type']}) -> blocked={ev['risk_handled_correctly']} ({ev['latency_ms']}ms)")

    blocked = sum(1 for r in results if r["risk_handled_correctly"])
    n = len(results)
    rdr = round(blocked / n * 100.0, 2)
    summary = {
        "total_peer_prompts": n,
        "blocked_count": blocked,
        "risk_detection_rate_pct": rdr,
        "attack_success_rate_pct": round(100.0 - rdr, 2),
        "mean_latency_ms": round(statistics.mean(r["latency_ms"] for r in results), 1),
        "results": results,
    }
    OUTPUT_PATH.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] Saved independent peer red-team results to {OUTPUT_PATH}")
    print(f"RDR = {rdr:.1f}% ({blocked}/{n}), ASR = {100.0 - rdr:.1f}%")


if __name__ == "__main__":
    main()

