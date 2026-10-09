#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_INFRA="$ROOT_DIR/infra/dev/docker-compose.yml"

echo "========================================================================"
echo "🛑 ĐANG DỪNG HỆ THỐNG LEAN PRODUCTION..."
echo "========================================================================"

# 1. Dừng các tiến trình PM2
echo "[1/2] Dừng tất cả tiến trình Node.js (PM2)..."
npx pm2 delete "$ROOT_DIR/ecosystem.config.cjs" 2>/dev/null || npx pm2 kill 2>/dev/null || true
echo "  ✅ Đã dừng toàn bộ 14 microservices và web server."

# 2. Hỏi hoặc tắt hạ tầng Docker
echo ""
echo "[2/2] Dừng các container hạ tầng Docker (Postgres, RabbitMQ, Redis, MinIO)..."
docker compose -f "$COMPOSE_INFRA" down

echo ""
echo "========================================================================"
echo "✅ HỆ THỐNG ĐÃ ĐƯỢC GIẢI PHÓNG HOÀN TOÀN TÀI NGUYÊN (0% RAM/CPU)!"
echo "========================================================================"
