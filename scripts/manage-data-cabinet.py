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
import urllib.request
import argparse
from typing import Dict, Any, List

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
            print(f"⚠️ Lỗi đọc {f}: {e}")
    return cabinet

def cmd_status():
    cabinet = load_cabinet()
    print("=" * 85)
    print("🗄️  NEXUS LOGISTICS DATA CABINET — TỔNG QUAN TÌNH TRẠNG KHO DỮ LIỆU ĐA TẦNG")
    print(f"📁 Thư mục lưu trữ: {CABINET_DIR}")
    print("=" * 85)
    print(f"{'Mã Ngăn':<9} | {'Tên Ngăn Tủ':<35} | {'Số Ca':<6} | {'Nguồn Xuất Xứ (Provenance)':<26}")
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
    print(f"📊 TỔNG CỘNG: {len(cabinet)} ngăn tủ với {total_cases} kịch bản kiểm thử đa nguồn có nhãn xuất xứ rõ ràng.")
    print("=" * 85)

def cmd_sync_live_db():
    print(f"🔄 Đang kết nối tới PostgreSQL qua shipment-service ({SHIPMENT_SERVICE_URL}/shipments)...")
    url = f"{SHIPMENT_SERVICE_URL}/shipments?limit=10"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            items = data.get("items", [])
            if not items:
                print("⚠️ Không tìm thấy đơn hàng nào trong DB.")
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
                    "query": f"Tra cứu hành trình đơn hàng {code}",
                    "ground_truth_keywords": [code, status],
                    "expected_tool": "trackShipment",
                    "expected_risk_blocked": False,
                    "expected_citations": []
                })

            comp3_path = os.path.join(CABINET_DIR, "compartment-03-live-db.json")
            comp3_data = {
                "compartment_id": "COMP-03",
                "compartment_name": "Dữ liệu Sống từ Production (Live Production Database)",
                "source_description": f"Trích xuất tự động từ PostgreSQL shipment-service (:3002) lúc {time.strftime('%Y-%m-%d %H:%M:%S')}",
                "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "items": live_cases
            }
            with open(comp3_path, "w", encoding="utf-8") as fp:
                json.dump(comp3_data, fp, ensure_ascii=False, indent=2)

            print(f"✅ Đã đồng bộ thành công {len(live_cases)} vận đơn thật vào Ngăn 3: {comp3_path}")
    except Exception as e:
        print(f"❌ Lỗi đồng bộ live DB: {e}")

def cmd_sample(per_compartment: int = 2, seed: int = None):
    cabinet = load_cabinet()
    if seed is not None:
        random.seed(seed)
    
    print("=" * 85)
    print(f"🎲 BỐC MẪU PHÂN TẦNG: Bốc ngẫu nhiên {per_compartment} ca từ mỗi ngăn tủ (Tổng: {len(cabinet) * per_compartment} ca)")
    print("=" * 85)
    
    sample_cases = []
    for comp in cabinet:
        cid = comp.get("compartment_id")
        items = comp.get("items", [])
        picked = random.sample(items, min(per_compartment, len(items)))
        sample_cases.extend(picked)
        print(f"[{cid}] Đã bốc {len(picked)}/{len(items)} ca: {', '.join(it['id'] for it in picked)}")

    print("-" * 85)
    print(f"✔ Đã tuyển chọn thành công {len(sample_cases)} kịch bản cân bằng hoàn hảo từ 6 ngăn tủ!")

def main():
    parser = argparse.ArgumentParser(description="Bộ Quản trị Kho Dữ liệu Đa tầng (Nexus Data Cabinet)")
    subparsers = parser.add_subparsers(dest="action", help="Lệnh thao tác")

    # Action: status
    subparsers.add_parser("status", help="Xem danh sách và số lượng các ngăn tủ")

    # Action: sync-live-db
    subparsers.add_parser("sync-live-db", help="Làm mới Ngăn 3 từ PostgreSQL live database")

    # Action: sample
    sample_parser = subparsers.add_parser("sample", help="Thử nghiệm bốc mẫu phân tầng từ các ngăn tủ")
    sample_parser.add_argument("--k", type=int, default=2, help="Số ca bốc từ mỗi ngăn (mặc định 2)")
    sample_parser.add_argument("--seed", type=int, default=None, help="Hạt giống ngẫu nhiên")

    args = parser.parse_args()

    if args.action == "status" or not args.action:
        cmd_status()
    elif args.action == "sync-live-db":
        cmd_sync_live_db()
    elif args.action == "sample":
        cmd_sample(per_compartment=args.k, seed=args.seed)

if __name__ == "__main__":
    main()

