#!/usr/bin/env python3
"""
run-holdout-sop.py
Evaluates the Hybrid RAG engine (VectorStoreService mirror) on:
  1) Original 39 SOP_KNOWLEDGE benchmark queries (with exact Clopper-Pearson 95% CIs & McNemar p-values)
  2) Freshly authored 12 paraphrased held-out SOP queries (not used when authoring the 13-key SYNONYMS map),
     embedded live via Google `models/gemini-embedding-001` (3,072-d).

Outputs:
  docs/research/paper/data/sop_holdout_embeddings.json
  docs/research/paper/data/rag_ablation_and_stats.json
"""

import json
import math
import re
import time
import urllib.request
from pathlib import Path
from typing import Dict, List, Tuple
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / "services" / "chatbot-service" / ".env"
VECTOR_INDEX_PATH = ROOT / "docs" / "knowledge-base" / "vector-index.json"
BENCHMARK_PATH = ROOT / "docs" / "graduation-thesis" / "evaluation" / "benchmark-dataset.json"
BENCH_EMB_PATH = ROOT / "docs" / "research" / "paper" / "data" / "sop_query_embeddings.json"
HOLDOUT_PATH = ROOT / "docs" / "research" / "paper" / "data" / "sop_holdout_queries.json"
HOLDOUT_EMB_PATH = ROOT / "docs" / "research" / "paper" / "data" / "sop_holdout_embeddings.json"
OUT_STATS_PATH = ROOT / "docs" / "research" / "paper" / "data" / "rag_ablation_and_stats.json"

spec = importlib.util.spec_from_file_location("rag_eval", str(ROOT / "docs" / "research" / "paper" / "evaluate_rag_real.py"))
rag_eval = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rag_eval)


def read_env() -> Dict[str, str]:
    env: Dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def embed_text_gemini(api_key: str, text: str) -> List[float]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
    payload = json.dumps({
        "model": "models/gemini-embedding-001",
        "content": {"parts": [{"text": text}]},
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["embedding"]["values"]


def binom_cdf_leq(k: int, n: int, p: float) -> float:
    return sum(math.comb(n, i) * (p ** i) * ((1.0 - p) ** (n - i)) for i in range(0, k + 1))


def binom_cdf_geq(k: int, n: int, p: float) -> float:
    return sum(math.comb(n, i) * (p ** i) * ((1.0 - p) ** (n - i)) for i in range(k, n + 1))


def clopper_pearson_ci(k: int, n: int, alpha: float = 0.05) -> Tuple[float, float]:
    """Exact two-sided 95% Clopper-Pearson confidence interval in [0, 1]."""
    if n == 0:
        return (0.0, 1.0)
    if k == 0:
        low = 0.0
    else:
        lo, hi = 0.0, 1.0
        for _ in range(80):
            mid = (lo + hi) / 2.0
            if binom_cdf_geq(k, n, mid) > alpha / 2.0:
                hi = mid
            else:
                lo = mid
        low = (lo + hi) / 2.0
    if k == n:
        high = 1.0
    else:
        lo, hi = 0.0, 1.0
        for _ in range(80):
            mid = (lo + hi) / 2.0
            if binom_cdf_leq(k, n, mid) > alpha / 2.0:
                lo = mid
            else:
                hi = mid
        high = (lo + hi) / 2.0
    return (round(low * 100.0, 1), round(high * 100.0, 1))


def exact_mcnemar_p(a_hits: List[bool], b_hits: List[bool]) -> Dict[str, float]:
    """Exact two-sided McNemar binomial test on paired boolean outcomes."""
    b_only = sum(1 for a, b in zip(a_hits, b_hits) if a and not b)
    c_only = sum(1 for a, b in zip(a_hits, b_hits) if not a and b)
    discordant = b_only + c_only
    if discordant == 0:
        return {"b": b_only, "c": c_only, "discordant": 0, "p_value": 1.0}
    m = min(b_only, c_only)
    tail = sum(math.comb(discordant, i) for i in range(0, m + 1)) * (0.5 ** discordant)
    return {"b": b_only, "c": c_only, "discordant": discordant, "p_value": round(min(1.0, 2.0 * tail), 6)}


def eval_slice(queries: List[dict], q_embs: Dict[str, List[float]], gold_map: Dict[str, List[str]], chunks: List[dict]):
    modes = ["keyword", "dense", "hybrid"]
    summary = {}
    hit1_vectors: Dict[str, List[bool]] = {}
    per_query = []

    for mode in modes:
        hits1_vec = []
        hits1 = hits3 = hits5 = 0
        recalls5 = []
        mrrs5 = []
        for q in queries:
            qid = q["id"]
            gold = set(gold_map[qid])
            ranked = rag_eval.rank_chunks(q["query"], q_embs[qid], chunks, mode, top_k=5)
            top_ids = [cid for cid, _ in ranked]
            h1 = bool(top_ids and top_ids[0] in gold)
            h3 = any(cid in gold for cid in top_ids[:3])
            h5 = any(cid in gold for cid in top_ids[:5])
            rec5 = len(gold.intersection(top_ids[:5])) / len(gold)
            rr = 0.0
            for idx, cid in enumerate(top_ids[:5], start=1):
                if cid in gold:
                    rr = 1.0 / idx
                    break
            hits1_vec.append(h1)
            hits1 += int(h1)
            hits3 += int(h3)
            hits5 += int(h5)
            recalls5.append(rec5)
            mrrs5.append(rr)

        n = len(queries)
        ci_lo, ci_hi = clopper_pearson_ci(hits1, n)
        hit1_vectors[mode] = hits1_vec
        summary[mode] = {
            "n_queries": n,
            "hit_at_1_count": f"{hits1}/{n}",
            "hit_at_1": round(hits1 / n * 100.0, 1),
            "hit_at_1_ci95_low": ci_lo,
            "hit_at_1_ci95_high": ci_hi,
            "hit_at_3": round(hits3 / n * 100.0, 1),
            "hit_at_5": round(hits5 / n * 100.0, 1),
            "recall_at_5": round(sum(recalls5) / n * 100.0, 1),
            "mrr_at_5": round(sum(mrrs5) / n, 4),
        }

    for q in queries:
        qid = q["id"]
        gold = gold_map[qid]
        d1 = rag_eval.rank_chunks(q["query"], q_embs[qid], chunks, "dense", 3)
        k1 = rag_eval.rank_chunks(q["query"], q_embs[qid], chunks, "keyword", 3)
        h1 = rag_eval.rank_chunks(q["query"], q_embs[qid], chunks, "hybrid", 3)
        per_query.append({
            "id": qid,
            "query": q["query"],
            "gold": gold,
            "dense_top1": d1[0][0] if d1 else None,
            "keyword_top1": k1[0][0] if k1 else None,
            "hybrid_top1": h1[0][0] if h1 else None,
            "dense_hit1": bool(d1 and d1[0][0] in gold),
            "keyword_hit1": bool(k1 and k1[0][0] in gold),
            "hybrid_hit1": bool(h1 and h1[0][0] in gold),
        })

    stats = {
        "mcnemar_hybrid_vs_dense": exact_mcnemar_p(hit1_vectors["hybrid"], hit1_vectors["dense"]),
        "mcnemar_hybrid_vs_keyword": exact_mcnemar_p(hit1_vectors["hybrid"], hit1_vectors["keyword"]),
    }
    return {"summary": summary, "stats": stats, "per_query": per_query}


def main():
    env = read_env()
    api_key = env["GEMINI_API_KEY"]

    vi = json.loads(VECTOR_INDEX_PATH.read_text(encoding="utf-8"))
    chunks = vi["chunks"]
    chunk_ids = {c["id"] for c in chunks}

    bd = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    sop_queries = [q for q in bd if q.get("category") == "SOP_KNOWLEDGE"]
    bench_embs = {item["id"]: item["embedding"] for item in json.loads(BENCH_EMB_PATH.read_text(encoding="utf-8"))}

    holdout_queries = json.loads(HOLDOUT_PATH.read_text(encoding="utf-8"))
    for hq in holdout_queries:
        for gid in hq["gold_chunks"]:
            assert gid in chunk_ids, f"Invalid holdout gold chunk: {gid}"

    if HOLDOUT_EMB_PATH.exists():
        cached = {item["id"]: item for item in json.loads(HOLDOUT_EMB_PATH.read_text(encoding="utf-8"))}
    else:
        cached = {}

    holdout_emb_records = []
    holdout_embs = {}
    for idx, hq in enumerate(holdout_queries, 1):
        hid = hq["id"]
        if hid in cached and cached[hid].get("query") == hq["query"] and len(cached[hid].get("embedding", [])) == 3072:
            emb = cached[hid]["embedding"]
        else:
            emb = embed_text_gemini(api_key, hq["query"])
            time.sleep(0.15)
        assert len(emb) == 3072, f"Expected 3072d embedding, got {len(emb)}"
        holdout_embs[hid] = emb
        holdout_emb_records.append({"id": hid, "query": hq["query"], "embedding": emb})
        print(f"[EMBED {idx:02d}/{len(holdout_queries):02d}] {hid}: dim={len(emb)}")

    HOLDOUT_EMB_PATH.write_text(json.dumps(holdout_emb_records, ensure_ascii=False), encoding="utf-8")

    bench_res = eval_slice(sop_queries, bench_embs, rag_eval.GOLD_CHUNKS, chunks)
    holdout_gold = {hq["id"]: hq["gold_chunks"] for hq in holdout_queries}
    holdout_res = eval_slice(holdout_queries, holdout_embs, holdout_gold, chunks)

    combined_queries = sop_queries + holdout_queries
    combined_embs = {**bench_embs, **holdout_embs}
    combined_gold = {**rag_eval.GOLD_CHUNKS, **holdout_gold}
    combined_res = eval_slice(combined_queries, combined_embs, combined_gold, chunks)

    out = {
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "embedding_model": "models/gemini-embedding-001",
        "dimensions": 3072,
        "benchmark_39": bench_res,
        "holdout_12": holdout_res,
        "combined_51": combined_res,
    }
    OUT_STATS_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print("\n=== BENCHMARK SOP (n=39) ===")
    print(json.dumps(bench_res["summary"], indent=2))
    print("McNemar:", bench_res["stats"])
    print("\n=== HELD-OUT PARAPHRASED SOP (n=12) ===")
    print(json.dumps(holdout_res["summary"], indent=2))
    print("McNemar:", holdout_res["stats"])
    print("\n=== COMBINED SOP (n=51) ===")
    print(json.dumps(combined_res["summary"], indent=2))
    print("McNemar:", combined_res["stats"])


if __name__ == "__main__":
    main()

