#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Sửa lỗi node_modules cho tất cả apps frontend ==="

APPS=(
  ops-web
  merchant-web
  admin-web
  guest-web
  public-tracking
)

for app in "${APPS[@]}"; do
  app_dir="$ROOT_DIR/apps/$app"
  if [[ ! -d "$app_dir" ]]; then
    echo "[skip] $app — thư mục không tồn tại"
    continue
  fi

  echo ""
  echo "──────────────────────────────────────"
  echo "[fix] $app"
  echo "──────────────────────────────────────"

  echo "  → Xóa node_modules cũ..."
  rm -rf "$app_dir/node_modules"

  echo "  → Cài đặt lại bằng npm install..."
  cd "$app_dir"
  npm install --legacy-peer-deps 2>&1 | tail -3

  echo "  ✓ $app hoàn tất"
done

echo ""
echo "=== Hoàn tất sửa lỗi tất cả apps ==="
echo "Bây giờ bạn có thể chạy: ./run-all-mac.sh"
