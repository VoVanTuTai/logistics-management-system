#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Sửa lỗi Prisma Engines cho tất cả các services ==="

# Danh sách tất cả services có dùng Prisma
SERVICES=(
  auth-service
  masterdata-service
  shipment-service
  pickup-service
  dispatch-service
  manifest-service
  scan-service
  delivery-service
  tracking-service
  payment-service
  reporting-service
)

for svc in "${SERVICES[@]}"; do
  svc_dir="$ROOT_DIR/services/$svc"
  if [[ ! -d "$svc_dir" ]]; then
    echo "[skip] $svc — thư mục không tồn tại"
    continue
  fi

  echo ""
  echo "──────────────────────────────────────"
  echo "[fix] $svc"
  echo "──────────────────────────────────────"

  # 1. Xóa node_modules cũ bị lỗi
  echo "  → Xóa node_modules cũ..."
  rm -rf "$svc_dir/node_modules"

  # 2. Xóa pnpm-lock.yaml riêng của service (dùng lockfile mới khi cài lại)
  rm -f "$svc_dir/pnpm-lock.yaml"

  # 3. Cài lại dependencies bằng npm (thay vì pnpm) để bỏ qua vấn đề pnpm v11 chặn build scripts
  echo "  → Cài đặt lại bằng npm install..."
  cd "$svc_dir"
  npm install --legacy-peer-deps 2>&1 | tail -3
  
  echo "  ✓ $svc hoàn tất"
done

echo ""
echo "=== Hoàn tất sửa lỗi tất cả services ==="
echo "Bây giờ bạn có thể chạy: ./run-all-mac.sh"
