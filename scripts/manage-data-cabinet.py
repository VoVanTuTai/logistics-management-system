#!/usr/bin/env python3
"""
manage-data-cabinet.py
Bộ Quản trị Kho Dữ liệu Đa tầng (Hierarchical Data Cabinet Lakehouse Manager)
Đề tài: Hệ thống Quản trị & Vận hành Logistics Đa kênh Nexus (Nexus HMAS Architecture)

Các chức năng:
1. status: Xem tổng quan tình trạng các ngăn tủ, số lượng mẫu và nguồn gốc xuất xứ.
2. sync-live-db: Quét cơ sở dữ liệu thật (shipment-service :3002) và tự động làm mới Ngăn 3.
3. crawl-feed: Bổ sung dữ liệu thời sự / bão lũ / giao thông vào Ngăn 6.
4. sample: Thử nghiệm bốc mẫu phân tầng (Stratified Sampling) đa nguồn.
"""

import os
import sys
import json
import time
import random
import re
import hashlib
import urllib.request
import xml.etree.ElementTree as ET
import argparse
from typing import Dict, Any, List, Optional

CABINET_DIR = "docs/graduation-thesis/evaluation/data-cabinet"
SHIPMENT_SERVICE_URL = "http://localhost:3002"

def get_compartment_files() -> List[str]:
    if not os.path.exists(CABINET_DIR):
        return []
    files = [os.path.join(CABINET_DIR, f) for f in sorted(os.listdir(CABINET_DIR)) if f.endswith(".json")]
    return files

def load_cabinet() -> List[Dict[str, Any]]:
    files = get_compartment_files()
    cabinet = []
    for f in files:
        try:
            with open(f, "r", encoding="utf-8") as fp:
                cabinet.append(json.load(fp))
        except Exception as e:
            print(f"[WARN] Loi doc {f}: {e}")
    return cabinet

def cmd_status():
    cabinet = load_cabinet()
    print("=" * 85)
    print("NEXUS LOGISTICS DATA CABINET - TONG QUAN TINH TRANG KHO DU LIEU DA TANG")
    print(f"Thu muc luu tru: {CABINET_DIR}")
    print("=" * 85)
    print(f"{'Ma Ngan':<9} | {'Ten Ngan Tu':<35} | {'So Ca':<6} | {'Nguon Xuat Xu (Provenance)':<26}")
    print("-" * 85)
    
    total_cases = 0
    for comp in cabinet:
        cid = comp.get("compartment_id", "N/A")
        name = comp.get("compartment_name", "N/A").split("(")[0].strip()
        count = len(comp.get("items", []))
        total_cases += count
        src = comp.get("source_description", "")[:26] + "..." if len(comp.get("source_description", "")) > 26 else comp.get("source_description", "")
        print(f"{cid:<9} | {name:<35} | {count:<6} | {src:<26}")

    print("-" * 85)
    print(f"TONG CONG: {len(cabinet)} ngan tu voi {total_cases} kich ban kiem thu da nguon co nhan xuat xu ro rang.")
    print("=" * 85)

def cmd_sync_live_db():
    print(f"[INFO] Dang ket noi toi PostgreSQL qua shipment-service ({SHIPMENT_SERVICE_URL}/shipments)...")
    url = f"{SHIPMENT_SERVICE_URL}/shipments?limit=10"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            items = data.get("items", [])
            if not items:
                print("[WARN] Khong tim thay don hang nao trong DB.")
                return

            live_cases = []
            for it in items:
                code = it.get("code")
                status = it.get("currentStatus", "IN_TRANSIT")
                cod = it.get("payment", {}).get("codAmount", 0)
                
                live_cases.append({
                    "id": f"LIVE-TRACK-{code}",
                    "compartment": "COMP-03",
                    "provenance": f"PostgreSQL Record: Table shipments, code={code}, status={status}",
                    "category": "OPERATIONAL_TOOLS",
                    "role": "CUSTOMER",
                    "query": f"Tra cuu hanh trinh don hang {code}",
                    "ground_truth_keywords": [code, status],
                    "expected_tool": "trackShipment",
                    "expected_risk_blocked": False,
                    "expected_citations": []
                })

            comp3_path = os.path.join(CABINET_DIR, "compartment-03-live-db.json")
            comp3_data = {
                "compartment_id": "COMP-03",
                "compartment_name": "Du lieu Song tu Production (Live Production Database)",
                "source_description": f"Trich xuat tu dong tu PostgreSQL shipment-service (:3002) luc {time.strftime('%Y-%m-%d %H:%M:%S')}",
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "items": live_cases
            }
            with open(comp3_path, "w", encoding="utf-8") as fp:
                json.dump(comp3_data, fp, ensure_ascii=False, indent=2)

            print(f"[SUCCESS] Da dong bo thanh cong {len(live_cases)} van don that vao Ngan 3: {comp3_path}")
    except Exception as e:
        print(f"[ERROR] Loi dong bo live DB: {e}")

def clean_html(raw_html: str) -> str:
    clean = re.sub(r'<[^<]+?>', '', raw_html or '')
    return clean.strip()

DEFAULT_RSS_FEEDS = {
    "vnexpress_thoisu": {
        "name": "VnExpress Thời sự (Giao thông & Bão lũ)",
        "url": "https://vnexpress.net/rss/thoi-su.rss"
    },
    "vnexpress_kinhdoanh": {
        "name": "VnExpress Kinh doanh (Xăng dầu & Logistics)",
        "url": "https://vnexpress.net/rss/kinh-doanh.rss"
    },
    "tuoitre_thoisu": {
        "name": "Tuổi Trẻ Thời sự (Hạ tầng & Vận tải)",
        "url": "https://tuoitre.vn/rss/thoi-su.rss"
    }
}

LOGISTICS_RULES = [
    {
        "type": "WEATHER_FORCE_MAJEURE",
        "keywords": ["mưa bão", "bão lũ", "lũ quét", "lũ lụt", "sạt lở", "ngập lụt", "ngập úng", "áp thấp nhiệt đới", "triều cường", "thiên tai", "bão số"],
        "category": "SOP_KNOWLEDGE",
        "role": "CUSTOMER",
        "query_template": "Theo quy chuẩn bưu chính, nếu chuyến xe chở hàng bị chậm trễ do ảnh hưởng thời sự: '{title}' thì bưu cục có được miễn trừ trách nhiệm thời gian cam kết do bất khả kháng không?",
        "ground_truth_keywords": ["bất khả kháng", "thiên tai", "miễn trừ", "chậm trễ", "thời tiết"],
        "expected_citations": ["Điều khoản miễn trừ trách nhiệm bất khả kháng Carrier SOP"]
    },
    {
        "type": "FUEL_PRICING",
        "keywords": ["giá xăng", "giá dầu", "xăng dầu", "nhiên liệu", "phụ phí xăng dầu"],
        "category": "SOP_KNOWLEDGE",
        "role": "MERCHANT",
        "query_template": "Khi thị trường xuất hiện thông tin biến động '{title}', phụ phí nhiên liệu trong bảng giá chuyển phát bưu cục được điều chỉnh như thế nào?",
        "ground_truth_keywords": ["phụ phí", "nhiên liệu", "xăng dầu", "cước"],
        "expected_citations": ["Quy chế Điều chỉnh Phụ phí Nhiên liệu Vận tải"]
    },
    {
        "type": "TRAFFIC_ROUTING",
        "keywords": ["xe tải", "xe container", "xe đầu kéo", "cao tốc", "quốc lộ", "cấm đường", "cấm xe tải", "phân luồng", "ùn tắc", "ách tắc", "sập cầu", "kho bãi", "cảng biển"],
        "category": "SOP_KNOWLEDGE",
        "role": "MERCHANT",
        "query_template": "Thông tin hạ tầng/giao thông mới nhất '{title}' có ảnh hưởng gì đến luồng xe tải trung chuyển hoặc thời gian kết nối giữa các bưu cục không?",
        "ground_truth_keywords": ["xe tải", "phân luồng", "hạ tầng", "vận chuyển"],
        "expected_citations": ["Quy định Phân luồng Vận tải Đô thị"]
    }
]

EXCLUDE_KEYWORDS = ["giá vàng", "bất động sản", "chứng khoán", "ung thư", "tai nạn chết người", "tử vong", "bệnh nhân", "tin tức sáng", "điểm tin", "thất nghiệp"]

def cmd_crawl_feed(limit: int = 5, source: str = "all", dry_run: bool = False, verbose: bool = False):
    print("=" * 85)
    print("NEXUS LOGISTICS CRAWLER - TU DONG THU THAP TIN TUC THOI SU VA CAP NHAT NGAN 6")
    print("=" * 85)

    feeds_to_crawl = {}
    if source == "all":
        feeds_to_crawl = DEFAULT_RSS_FEEDS
    elif source in DEFAULT_RSS_FEEDS:
        feeds_to_crawl = {source: DEFAULT_RSS_FEEDS[source]}
    elif source.startswith("http://") or source.startswith("https://"):
        feeds_to_crawl = {"custom": {"name": "Nguon RSS Tuy bien", "url": source}}
    else:
        print(f"[ERROR] Nguon tin khong hop le: {source}. Chon 'all', 'vnexpress_thoisu', 'vnexpress_kinhdoanh', 'tuoitre_thoisu' hoac URL RSS.")
        return

    comp6_path = os.path.join(CABINET_DIR, "compartment-06-crawled-updates.json")
    comp6_data = {
        "compartment_id": "COMP-06",
        "compartment_name": "Du lieu Crawl Bo sung Dinh ky (Crawled Dynamic Feeds & Real-World Events)",
        "source_description": "Du lieu thu thap dinh ky tu thong cao Cuc Duong bo Viet Nam, bien dong gia xang dau, tin tuc giao thong ha tang",
        "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "items": []
    }

    if os.path.exists(comp6_path):
        try:
            with open(comp6_path, "r", encoding="utf-8") as fp:
                comp6_data = json.load(fp)
        except Exception as e:
            print(f"[WARN] Khong doc duoc {comp6_path}: {e}")

    existing_items = comp6_data.get("items", [])
    existing_fingerprints = set()
    for it in existing_items:
        existing_fingerprints.add(it.get("id"))
        existing_fingerprints.add(it.get("provenance", ""))
        existing_fingerprints.add(it.get("query", ""))

    print(f"[STATUS] Hien trang Ngan 6: {len(existing_items)} ca kiem thu da luu.")
    print(f"[NETWORK] Dang ket noi mang that toi {len(feeds_to_crawl)} may chu tin tuc...")

    crawled_candidates = []

    for fkey, fmeta in feeds_to_crawl.items():
        fname = fmeta["name"]
        furl = fmeta["url"]
        print(f"\n[HTTP GET] Ket noi toi may chu tin tuc: {fname}")
        print(f"   -> URL: {furl}")
        try:
            req = urllib.request.Request(furl, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusCrawler/2.0"})
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=10) as resp:
                latency_ms = (time.time() - t0) * 1000
                xml_data = resp.read()
                status = getattr(resp, "status", 200)
                server = resp.headers.get("server", "CDN/Edge")
                content_type = resp.headers.get("content-type", "xml")
                remote_date = resp.headers.get("date", "N/A")
                payload_kb = len(xml_data) / 1024.0

                print(f"   [HTTP {status} OK] Nhan goi tin tu server: {server}")
                print(f"   -> Do tre mang (Latency): {latency_ms:.1f} ms | Dung luong: {payload_kb:.1f} KB")
                print(f"   -> Timestamp may chu: {remote_date} | MIME: {content_type}")

                root = ET.fromstring(xml_data)
                items = root.findall(".//item")
                print(f"   -> Da phan tich cu phap (XML Parsed): {len(items)} ban tin thoi su moi nhat.")

                scanned_count = 0
                for it in items:
                    scanned_count += 1
                    title = (it.find("title").text or "").strip()
                    desc = clean_html(it.find("description").text or "")
                    link = (it.find("link").text or "").strip()
                    pub_date = (it.find("pubDate").text or "").strip()

                    full_text = f"{title} {desc}".lower()

                    # Loai tru cac tin ngoai pham vi
                    if any(ex in full_text for ex in EXCLUDE_KEYWORDS):
                        continue

                    # Doi soat tu khoa logistics
                    matched_rule = None
                    matched_kw = None
                    for rule in LOGISTICS_RULES:
                        for kw in rule["keywords"]:
                            if kw in full_text:
                                matched_rule = rule
                                matched_kw = kw
                                break
                        if matched_rule:
                            break

                    if not matched_rule:
                        continue

                    # Kiem tra trung lap
                    clean_title = re.sub(r'["\']', '', title)
                    if any(clean_title[:30] in fp for fp in existing_fingerprints):
                        if verbose:
                            print(f"      [SKIP - DA TON TAI] {title[:50]}...")
                        continue

                    h = hashlib.md5(title.encode("utf-8")).hexdigest()[:6].upper()
                    case_id = f"CRAWL-AUTO-{h}"
                    
                    # Tranh trung lap trong dot quet hien tai
                    if any(c["id"] == case_id for c in crawled_candidates):
                        continue

                    if verbose:
                        print(f"      [MATCH - TU KHOA: '{matched_kw}'] {title}")
                        print(f"         Link bai bao: {link}")
                        print(f"         Thoi gian: {pub_date}")

                    new_case = {
                        "id": case_id,
                        "compartment": "COMP-06",
                        "provenance": f"Ban tin RSS ({fname}): '{title}' ({pub_date[:16] if pub_date else 'Hom nay'})",
                        "category": matched_rule["category"],
                        "role": matched_rule["role"],
                        "query": matched_rule["query_template"].format(title=title),
                        "ground_truth_keywords": matched_rule["ground_truth_keywords"],
                        "expected_tool": "none",
                        "expected_risk_blocked": False,
                        "expected_citations": matched_rule["expected_citations"],
                        "_source_link": link,
                        "_matched_keyword": matched_kw,
                        "_pub_date": pub_date
                    }
                    crawled_candidates.append(new_case)
                    existing_fingerprints.add(clean_title[:30])

                    if len(crawled_candidates) >= limit:
                        break
        except Exception as e:
            print(f"   [WARN] Loi cao nguon {fname}: {e}")

        if len(crawled_candidates) >= limit:
            break

    print("\n" + "=" * 85)
    print(f"KET QUA QUET THUC TE: DA BAT DUOC {len(crawled_candidates)} BAN TIN THOI SU MOI TU INTERNET")
    print("=" * 85)

    if not crawled_candidates:
        print("[INFO] Toan bo cac ban tin tren web hien tai da duoc dong bo vao kho tu truoc (Khong co tin moi).")
        return

    for idx, c in enumerate(crawled_candidates, 1):
        print(f"[{idx}] Ma ca sinh: {c['id']} | Tu khoa logistics: '{c['_matched_keyword']}'")
        print(f"    Tieu de: {c['provenance']}")
        print(f"    Link bai bao that: {c['_source_link']}")
        print(f"    Ngay xuat ban: {c['_pub_date']}")
        print(f"    Cau hoi nghiep vu AI sinh ra:")
        print(f"       \"{c['query']}\"")
        print(f"    Tu khoa doi soat (Ground Truth): {c['ground_truth_keywords']}")
        print()

    if dry_run:
        print("[DRY-RUN] Che do xem truoc: Du lieu chua ghi de vao file disk.")
        return

    # Luu vao compartment-06
    cleaned_items = []
    for c in crawled_candidates:
        item_copy = {k: v for k, v in c.items() if not k.startswith("_")}
        cleaned_items.append(item_copy)

    comp6_data["items"].extend(cleaned_items)
    comp6_data["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    comp6_data["source_description"] = f"Du lieu thu thap tu dong tu RSS (VnExpress, Tuoi Tre) luc {time.strftime('%Y-%m-%d %H:%M:%S')} (Tong: {len(comp6_data['items'])} ca)"

    with open(comp6_path, "w", encoding="utf-8") as fp:
        json.dump(comp6_data, fp, ensure_ascii=False, indent=2)

    print("-" * 85)
    print(f"[SUCCESS] DA GHI FILE THUC TE LEN DIA: {comp6_path}")
    print(f"   -> Kich thuoc file hien tai: {os.path.getsize(comp6_path):,} bytes")
    print(f"   -> Tong so ca hien co trong Ngan 6: {len(comp6_data['items'])} ca.")
    print("=" * 85)

def cmd_sample(per_compartment: int = 2, seed: int = None):
    cabinet = load_cabinet()
    if seed is not None:
        random.seed(seed)
    
    print("=" * 85)
    print(f"BOC MAU PHAN TANG: Boc ngau nhien {per_compartment} ca tu moi ngan tu (Tong: {len(cabinet) * per_compartment} ca)")
    print("=" * 85)
    
    sample_cases = []
    for comp in cabinet:
        cid = comp.get("compartment_id")
        items = comp.get("items", [])
        picked = random.sample(items, min(per_compartment, len(items)))
        sample_cases.extend(picked)
        print(f"[{cid}] Da boc {len(picked)}/{len(items)} ca: {', '.join(it['id'] for it in picked)}")

    print("-" * 85)
    print(f"[SUCCESS] Da tuyen chon thanh cong {len(sample_cases)} kich ban can bang hoan hao tu 6 ngan tu!")

def main():
    parser = argparse.ArgumentParser(description="Bộ Quản trị Kho Dữ liệu Đa tầng (Nexus Data Cabinet)")
    subparsers = parser.add_subparsers(dest="action", help="Lệnh thao tác")

    # Action: status
    subparsers.add_parser("status", help="Xem danh sách và số lượng các ngăn tủ")

    # Action: sync-live-db
    subparsers.add_parser("sync-live-db", help="Làm mới Ngăn 3 từ PostgreSQL live database")

    # Action: crawl-feed
    crawl_parser = subparsers.add_parser("crawl-feed", help="Tự động crawl tin tức bão lũ / giao thông / xăng dầu vào Ngăn 6")
    crawl_parser.add_argument("--limit", type=int, default=5, help="Số bản tin tối đa cần cào và thêm vào ngăn (mặc định: 5)")
    crawl_parser.add_argument("--source", type=str, default="all", help="Nguồn tin: 'all', 'vnexpress_thoisu', 'vnexpress_kinhdoanh', 'tuoitre_thoisu' hoặc URL RSS tùy chỉnh")
    crawl_parser.add_argument("--dry-run", action="store_true", help="Chạy thử xem trước kết quả lọc tin mà không ghi đè file disk")
    crawl_parser.add_argument("-v", "--verbose", action="store_true", help="Hiển thị chi tiết toàn bộ vết mạng HTTP, thời gian thực, link bài báo thật")

    # Action: sample
    sample_parser = subparsers.add_parser("sample", help="Thử nghiệm bốc mẫu phân tầng từ các ngăn tủ")
    sample_parser.add_argument("--k", type=int, default=2, help="Số ca bốc từ mỗi ngăn (mặc định 2)")
    sample_parser.add_argument("--seed", type=int, default=None, help="Hạt giống ngẫu nhiên")

    args = parser.parse_args()

    if args.action == "status" or not args.action:
        cmd_status()
    elif args.action == "sync-live-db":
        cmd_sync_live_db()
    elif args.action == "crawl-feed":
        cmd_crawl_feed(limit=args.limit, source=args.source, dry_run=args.dry_run, verbose=args.verbose)
    elif args.action == "sample":
        cmd_sample(per_compartment=args.k, seed=args.seed)

if __name__ == "__main__":
    main()

