#!/usr/bin/env python3
"""
evaluate_rag_real.py
Exact Python mirror of services/chatbot-service/src/rag/vector-store.service.ts
measuring Dense-only (VectorStoreService.search), Keyword/Synonym-only, and
Hybrid (VectorStoreService.hybridSearch) retrieval over the real 59-chunk
Knowledge Base (docs/knowledge-base/vector-index.json) and real 3,072-dim
Gemini embeddings (models/gemini-embedding-001) across all 39 SOP_KNOWLEDGE
queries in docs/graduation-thesis/evaluation/benchmark-dataset.json.

Outputs:
  docs/research/paper/data/rag_ablation_real.json
"""

import json
import math
import re
import unicodedata
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[3]
VECTOR_INDEX_PATH = ROOT / "docs" / "knowledge-base" / "vector-index.json"
BENCHMARK_PATH = ROOT / "docs" / "graduation-thesis" / "evaluation" / "benchmark-dataset.json"
QUERY_EMB_PATH = ROOT / "docs" / "research" / "paper" / "data" / "sop_query_embeddings.json"
OUT_JSON_PATH = ROOT / "docs" / "research" / "paper" / "data" / "rag_ablation_real.json"

STOPWORDS = {"cho", "cua", "nay", "voi", "khi", "duoc", "trong", "thi", "sao", "la", "nhu"}

# Exact SYNONYMS thesaurus from vector-store.service.ts (lines 121-135)
SYNONYMS: Dict[str, List[str]] = {
    "hong": ["hu hong", "be vo", "mop meo", "thiet hai", "boi thuong", "den bu", "dong kiem", "bien ban bat thuong", "bao hiem", "irregularity"],
    "hu": ["hu hong", "be vo", "mop meo", "thiet hai", "boi thuong", "den bu"],
    "vo": ["be vo", "hu hong", "hang de vo", "fragile", "dong goi", "xop hoi", "5cm", "boi thuong", "bien ban"],
    "be": ["be vo", "hu hong", "dong kiem", "boi thuong", "bien ban"],
    "mop": ["mop meo", "be vo", "hu hong", "bien ban bat thuong"],
    "mat": ["that lac", "mat hang", "lost", "mat tich", "den bu 100%"],
    "lac": ["that lac", "mat hang", "lost"],
    "bom": ["tu choi nhan", "chuyen hoan", "cuoc hoan", "bom hang", "ndr"],
    "den": ["boi thuong", "den bu", "han muc", "100%", "30 trieu", "4 lan cuoc", "clm"],
    "cuoc": ["cuoc phi", "bang gia", "tinh cuoc", "du toan", "iata"],
    "kho": ["luu kho", "ton kho", "qua han", "vo chu", "dieu 18", "dieu 28"],
    "cod": ["tien thu ho", "doi soat", "tran no", "15 trieu", "khoa app"],
    "bao": ["bao hiem", "khai gia", "toan dien", "0.5%", "1.0%", "30 trieu"],
}

# Authoritative ground-truth chunk mapping (G_q) verified directly from the 59 chunks
# in docs/knowledge-base/vector-index.json for all 39 SOP_KNOWLEDGE queries.
GOLD_CHUNKS: Dict[str, List[str]] = {
    "TC-REAL-01": [
        "03-prohibited-and-restricted-goods.md#chunk-2",
        "06-packaging-and-fragile-goods.md#chunk-3",
        "06-packaging-and-fragile-goods.md#chunk-5",
        "06-packaging-and-fragile-goods.md#chunk-7",
    ],
    "TC-REAL-02": [
        "06-packaging-and-fragile-goods.md#chunk-5",
        "02-insurance-and-claim-policy.md#chunk-2",
        "03-prohibited-and-restricted-goods.md#chunk-4",
    ],
    "TC-REAL-03": ["02-insurance-and-claim-policy.md#chunk-3"],
    "TC-REAL-04": [
        "02-insurance-and-claim-policy.md#chunk-4",
        "02-insurance-and-claim-policy.md#chunk-3",
    ],
    "TC-REAL-05": ["02-insurance-and-claim-policy.md#chunk-2"],
    "TC-REAL-06": ["02-insurance-and-claim-policy.md#chunk-5"],
    "TC-REAL-07": ["04-delivery-process-and-faq.md#chunk-2"],
    "TC-REAL-08": [
        "09-negative-exceptions-and-incident-handling.md#chunk-3",
        "04-delivery-process-and-faq.md#chunk-5",
    ],
    "TC-REAL-09": [
        "04-delivery-process-and-faq.md#chunk-5",
        "01-pricing-and-iata-weight.md#chunk-5",
    ],
    "TC-REAL-10": [
        "01-pricing-and-iata-weight.md#chunk-6",
        "04-delivery-process-and-faq.md#chunk-5",
    ],
    "TC-REAL-11": ["03-prohibited-and-restricted-goods.md#chunk-1"],
    "TC-REAL-12": [
        "07-special-delivery-services.md#chunk-1",
        "07-special-delivery-services.md#chunk-2",
        "03-prohibited-and-restricted-goods.md#chunk-3",
    ],
    "TC-REAL-14": [
        "06-packaging-and-fragile-goods.md#chunk-6",
        "03-prohibited-and-restricted-goods.md#chunk-4",
    ],
    "TC-REAL-15": ["01-pricing-and-iata-weight.md#chunk-7"],
    "TC-REAL-16": ["07-special-delivery-services.md#chunk-3"],
    "TC-REAL-17": ["05-cod-policy-and-finance.md#chunk-3"],
    "TC-REAL-18": ["05-cod-policy-and-finance.md#chunk-6"],
    "TC-REAL-21": [
        "01-pricing-and-iata-weight.md#chunk-4",
        "05-cod-policy-and-finance.md#chunk-5",
    ],
    "TC-REAL-22": [
        "01-pricing-and-iata-weight.md#chunk-4",
        "05-cod-policy-and-finance.md#chunk-5",
    ],
    "TC-REAL-23": ["04-delivery-process-and-faq.md#chunk-7"],
    "TC-REAL-24": [
        "04-delivery-process-and-faq.md#chunk-1",
        "09-negative-exceptions-and-incident-handling.md#chunk-2",
    ],
    "TC-REAL-25": [
        "06-packaging-and-fragile-goods.md#chunk-1",
        "06-packaging-and-fragile-goods.md#chunk-2",
        "06-packaging-and-fragile-goods.md#chunk-4",
    ],
    "TC-REAL-26": [
        "06-packaging-and-fragile-goods.md#chunk-3",
        "06-packaging-and-fragile-goods.md#chunk-6",
    ],
    "TC-REAL-27": ["01-pricing-and-iata-weight.md#chunk-7"],
    "TC-REAL-28": ["02-insurance-and-claim-policy.md#chunk-4"],
    "TC-REAL-30": ["02-insurance-and-claim-policy.md#chunk-5"],
    "TC-REAL-31": ["02-insurance-and-claim-policy.md#chunk-2"],
    "TC-REAL-32": [
        "03-prohibited-and-restricted-goods.md#chunk-3",
        "07-special-delivery-services.md#chunk-1",
    ],
    "TC-REAL-33": ["03-prohibited-and-restricted-goods.md#chunk-2"],
    "TC-REAL-35": ["03-prohibited-and-restricted-goods.md#chunk-3"],
    "TC-REAL-37": [
        "03-prohibited-and-restricted-goods.md#chunk-2",
        "08-transit-time-and-network-sla.md#chunk-2",
    ],
    "TC-REAL-38": ["08-transit-time-and-network-sla.md#chunk-4"],
    "TC-REAL-39": [
        "05-cod-policy-and-finance.md#chunk-2",
        "09-negative-exceptions-and-incident-handling.md#chunk-11",
    ],
    "TC-REAL-41": ["01-pricing-and-iata-weight.md#chunk-9"],
    "TC-REAL-44": ["03-prohibited-and-restricted-goods.md#chunk-2"],
    "TC-REAL-45": ["03-prohibited-and-restricted-goods.md#chunk-2"],
    "TC-REAL-46": [
        "03-prohibited-and-restricted-goods.md#chunk-3",
        "07-special-delivery-services.md#chunk-1",
    ],
    "TC-REAL-48": [
        "09-negative-exceptions-and-incident-handling.md#chunk-9",
        "03-prohibited-and-restricted-goods.md#chunk-4",
    ],
    "TC-REAL-50": ["09-negative-exceptions-and-incident-handling.md#chunk-10"],
}


def remove_accents(text: str) -> str:
    nfd = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn")
    return stripped.replace("đ", "d").replace("Đ", "D").lower()


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    na = math.sqrt(sum(a * a for a in vec_a))
    nb = math.sqrt(sum(b * b for b in vec_b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (na * nb)


def lexical_boost(query: str, chunk: dict) -> float:
    norm_q = remove_accents(query)
    # Match vector-store.service.ts lines 116-146 exactly
    raw_terms = [
        w for w in re.split(r"[^a-z0-9]+", norm_q)
        if len(w) >= 2 and w not in STOPWORDS
    ]
    if not raw_terms:
        return 0.0

    # Preserve insertion order while expanding synonyms via Set semantics
    expanded_terms: List[str] = []
    seen = set()
    for t in raw_terms:
        if t not in seen:
            seen.add(t)
            expanded_terms.append(t)
    for t in raw_terms:
        if t in SYNONYMS:
            for syn in SYNONYMS[t]:
                if syn not in seen:
                    seen.add(syn)
                    expanded_terms.append(syn)

    norm_content = remove_accents(
        chunk["content"] + " " + chunk["sectionTitle"] + " " + chunk["sourceFile"]
    )
    term_hits = sum(1 for term in expanded_terms if term in norm_content)
    return min(0.35, (term_hits / len(expanded_terms)) * 0.35)


def rank_chunks(query: str, q_emb: List[float], chunks: List[dict], mode: str, top_k: int = 5) -> List[Tuple[str, float]]:
    scored: List[Tuple[str, float]] = []
    for c in chunks:
        v_score = max(0.0, cosine_similarity(q_emb, c["embedding"]))
        k_score = lexical_boost(query, c)
        if mode == "dense":
            s = v_score
            min_thresh = 0.15
        elif mode == "keyword":
            s = k_score
            min_thresh = 0.01
        elif mode == "hybrid":
            s = 0.7 * v_score + k_score
            min_thresh = 0.15
        else:
            raise ValueError(mode)
        if s >= min_thresh:
            scored.append((c["id"], s))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


def evaluate():
    vi = json.loads(VECTOR_INDEX_PATH.read_text(encoding="utf-8"))
    chunks = vi["chunks"]
    bd = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    q_emb_list = json.loads(QUERY_EMB_PATH.read_text(encoding="utf-8"))
    q_embs = {item["id"]: item["embedding"] for item in q_emb_list}

    sop_queries = [q for q in bd if q.get("category") == "SOP_KNOWLEDGE"]
    assert len(sop_queries) == 39, f"Expected 39 SOP queries, got {len(sop_queries)}"
    assert set(q["id"] for q in sop_queries) == set(GOLD_CHUNKS.keys()), "Mismatch in GOLD_CHUNKS keys"

    chunk_ids = {c["id"] for c in chunks}
    for qid, gids in GOLD_CHUNKS.items():
        for gid in gids:
            assert gid in chunk_ids, f"Invalid chunk id in GOLD_CHUNKS[{qid}]: {gid}"

    modes = ["dense", "keyword", "hybrid"]
    summary = {}
    per_query = []

    for mode in modes:
        hits_1 = hits_3 = hits_5 = 0
        recalls_5 = []
        mrrs_5 = []
        for q in sop_queries:
            qid = q["id"]
            gold = set(GOLD_CHUNKS[qid])
            ranked = rank_chunks(q["query"], q_embs[qid], chunks, mode, top_k=5)
            top_ids = [cid for cid, _ in ranked]

            h1 = 1 if (len(top_ids) >= 1 and top_ids[0] in gold) else 0
            h3 = 1 if any(cid in gold for cid in top_ids[:3]) else 0
            h5 = 1 if any(cid in gold for cid in top_ids[:5]) else 0
            rec5 = len(gold.intersection(top_ids[:5])) / len(gold)

            rr = 0.0
            for idx, cid in enumerate(top_ids[:5], start=1):
                if cid in gold:
                    rr = 1.0 / idx
                    break

            hits_1 += h1
            hits_3 += h3
            hits_5 += h5
            recalls_5.append(rec5)
            mrrs_5.append(rr)

        n = len(sop_queries)
        summary[mode] = {
            "n_queries": n,
            "hit_at_1": round(hits_1 / n * 100, 2),
            "hit_at_1_count": f"{hits_1}/{n}",
            "hit_at_3": round(hits_3 / n * 100, 2),
            "hit_at_3_count": f"{hits_3}/{n}",
            "hit_at_5": round(hits_5 / n * 100, 2),
            "hit_at_5_count": f"{hits_5}/{n}",
            "recall_at_5": round(sum(recalls_5) / n * 100, 2),
            "mrr_at_5": round(sum(mrrs_5) / n, 4),
        }

    # Capture per-query diffs where modes disagree on rank-1
    for q in sop_queries:
        qid = q["id"]
        gold = GOLD_CHUNKS[qid]
        d_top = rank_chunks(q["query"], q_embs[qid], chunks, "dense", 3)
        k_top = rank_chunks(q["query"], q_embs[qid], chunks, "keyword", 3)
        h_top = rank_chunks(q["query"], q_embs[qid], chunks, "hybrid", 3)
        per_query.append({
            "id": qid,
            "gold": gold,
            "dense_top1": d_top[0][0] if d_top else None,
            "keyword_top1": k_top[0][0] if k_top else None,
            "hybrid_top1": h_top[0][0] if h_top else None,
            "dense_hit1": bool(d_top and d_top[0][0] in gold),
            "keyword_hit1": bool(k_top and k_top[0][0] in gold),
            "hybrid_hit1": bool(h_top and h_top[0][0] in gold),
        })

    out = {
        "corpus": {
            "num_sop_documents": 9,
            "num_chunks": len(chunks),
            "embedding_model": vi.get("embeddingModel"),
            "header_dimensions_field": vi.get("dimensions"),
            "actual_embedding_dimensions": len(chunks[0]["embedding"]),
            "hybrid_weights": "0.7 * cosineSimilarity(q, d) + min(0.35, (termHits / |keyTerms|) * 0.35)",
            "min_score_threshold": 0.15,
            "top_k": 5,
            "synonym_thesaurus_entries": len(SYNONYMS),
        },
        "metrics": summary,
        "per_query": per_query,
    }
    OUT_JSON_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    print("=== REAL RAG RETRIEVAL ABLATION (39 SOP_KNOWLEDGE QUERIES x 59 CHUNKS) ===")
    for mode, m in summary.items():
        print(
            f"{mode:8s} | Hit@1={m['hit_at_1']:5.1f}% ({m['hit_at_1_count']}) "
            f"| Hit@3={m['hit_at_3']:5.1f}% ({m['hit_at_3_count']}) "
            f"| Hit@5={m['hit_at_5']:5.1f}% ({m['hit_at_5_count']}) "
            f"| Recall@5={m['recall_at_5']:5.1f}% | MRR@5={m['mrr_at_5']:.4f}"
        )
    print("\n--- Queries where Dense Hit@1 != Hybrid Hit@1 ---")
    for row in per_query:
        if row["dense_hit1"] != row["hybrid_hit1"]:
            print(f"{row['id']} | dense={row['dense_hit1']} ({row['dense_top1']}) -> hybrid={row['hybrid_hit1']} ({row['hybrid_top1']})")


if __name__ == "__main__":
    evaluate()
