#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_INFRA="$ROOT_DIR/infra/dev/docker-compose.yml"

echo "=================================================================================="
echo "NEXUS LOGISTICS - DUNG HE THONG (LEAN PRODUCTION)"
echo "=================================================================================="

# 1. Dung cac tien trinh PM2
echo "[1/2] Dung tat ca tien trinh Node.js (PM2)..."
npx pm2 delete "$ROOT_DIR/ecosystem.config.cjs" 2>/dev/null || npx pm2 kill 2>/dev/null || true
echo "  [OK] Da dung toan bo microservices va web servers."

# 2. Tat ha tang Docker
echo ""
echo "[2/2] Dung cac container ha tang (Postgres, RabbitMQ, Redis, MinIO)..."
docker compose -f "$COMPOSE_INFRA" down

echo ""
echo "=================================================================================="
echo "HE THONG DA DUOC DUNG VA GIAI PHONG HOAN TOAN TAI NGUYEN (0% CPU/RAM)"
echo "=================================================================================="
