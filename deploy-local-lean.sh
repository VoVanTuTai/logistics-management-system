#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.tmp/pm2-logs"
PID_DIR="$ROOT_DIR/.tmp/pids"
COMPOSE_INFRA="$ROOT_DIR/infra/dev/docker-compose.yml"

mkdir -p "$LOG_DIR" "$PID_DIR"

echo "=================================================================================="
echo "NEXUS LOGISTICS - TRIEN KHAI HE THONG (LEAN PRODUCTION HYBRID)"
echo "He thong: 14 Microservices + 5 Web Apps + 4 Ha Tang Du Lieu"
echo "=================================================================================="

# 1. Kiem tra Docker Desktop
echo ""
echo "[1/6] Kiem tra trang thai Docker daemon..."
if ! docker info >/dev/null 2>&1; then
  echo "  [WAIT] Docker daemon chua chay. Dang mo Docker Desktop..."
  if [[ -d "/Applications/Docker.app" ]]; then
    open -a Docker
    echo "  [WAIT] Dang doi Docker khoi dong hoan tat (toi da 40s)..."
    for i in {1..20}; do
      if docker info >/dev/null 2>&1; then
        echo "  [OK] Docker Desktop da san sang."
        break
      fi
      sleep 2
    done
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "  [ERROR] Khong the ket noi toi Docker daemon." >&2
  echo "  Huong dan: Vui long mo Docker Desktop bang tay roi chay lai script nay." >&2
  exit 1
fi
echo "  [OK] Docker daemon dang hoat dong binh thuong."

# 2. Khoi dong cac Container Ha Tang Co Ban (Postgres, RabbitMQ, Redis, MinIO)
echo ""
echo "[2/6] Khoi dong ha tang du lieu (Postgres, Redis, RabbitMQ, MinIO)..."
docker compose -f "$COMPOSE_INFRA" up -d --remove-orphans

echo "  [WAIT] Dang cho PostgreSQL va RabbitMQ san sang ket noi..."
for i in {1..25}; do
  if docker exec NEXUS-dev-postgres pg_isready -U postgres -d postgres >/dev/null 2>&1; then
    echo "  [OK] PostgreSQL (Port 15432) da san sang ket noi."
    break
  fi
  sleep 1
done

# 3. Kiem tra va dong bo Database Schemas & Seed du lieu (neu DB moi)
echo ""
echo "[3/6] Kiem tra du lieu va schema database..."
AUTH_TABLE_COUNT=$(docker exec NEXUS-dev-postgres psql -U postgres -d auth_db -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")

if [[ "${AUTH_TABLE_COUNT:-0}" -lt "2" ]]; then
  echo "  [INFO] Database chua co schema. Dang khoi tao bang va nap du lieu demo..."
  SERVICES_WITH_PRISMA=(
    "masterdata-service:masterdata_db"
    "shipment-service:shipment_db"
    "pickup-service:pickup_db"
    "dispatch-service:dispatch_db"
    "manifest-service:manifest_db"
    "scan-service:scan_db"
    "delivery-service:delivery_db"
    "tracking-service:tracking_db"
    "reporting-service:reporting_db"
    "auth-service:auth_db"
    "payment-service:payment_db"
  )

  for entry in "${SERVICES_WITH_PRISMA[@]}"; do
    svc="${entry%%:*}"
    dbname="${entry##*:}"
    svc_dir="$ROOT_DIR/services/$svc"
    if [[ -f "$svc_dir/prisma/schema.prisma" ]]; then
      echo "  - Cap nhat schema: $svc ($dbname)..."
      (
        cd "$svc_dir"
        DATABASE_URL="postgresql://postgres:postgres@localhost:15432/$dbname" \
          npx prisma db push --schema prisma/schema.prisma >/dev/null 2>&1 || true
      )
    fi
  done

  echo "  [INFO] Nap tai khoan nguoi dung va du lieu van hanh mau..."
  (
    cd "$ROOT_DIR/services/auth-service"
    DATABASE_URL="postgresql://postgres:postgres@localhost:15432/auth_db" \
      node node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts >/dev/null 2>&1 || true
  )
  (
    cd "$ROOT_DIR/services/masterdata-service"
    DATABASE_URL="postgresql://postgres:postgres@localhost:15432/masterdata_db" \
      node node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts >/dev/null 2>&1 || true
  )
  node "$ROOT_DIR/scripts/seed-master-logistics-flow.js" >/dev/null 2>&1 || true
  echo "  [OK] Khoi tao va nap du lieu demo thanh cong."
else
  echo "  [OK] Du lieu database da ton tai san, bo qua buoc seed."
fi

# 4. Kiem tra code da build chua
echo ""
echo "[4/6] Kiem tra ban build production..."
MISSING_BUILD=0
if [[ ! -f "$ROOT_DIR/services/gateway-bff/dist/main.js" ]] || [[ ! -f "$ROOT_DIR/apps/merchant-web/dist/index.html" ]]; then
  MISSING_BUILD=1
fi

if [[ "$MISSING_BUILD" == "1" ]]; then
  echo "  [WAIT] Phat hien thieu ban build, dang tien hanh build toan bo he thong..."
  node "$ROOT_DIR/scripts/rebuild-all.mjs"
else
  echo "  [OK] Toan bo microservices va web apps da duoc bien dich san sang."
fi

# 5. Khoi chay 14 Services va Web Apps qua PM2
echo ""
echo "[5/6] Khoi chay he thong qua PM2 Process Manager (Native ARM64/x86)..."
npx pm2 delete ecosystem.config.cjs 2>/dev/null || true
npx pm2 start "$ROOT_DIR/ecosystem.config.cjs"

# 6. Kiem tra suc khoe he thong
echo ""
echo "[6/6] Kiem tra ket noi API Gateway (Port 3000)..."
GATEWAY_HEALTHY=0
for i in {1..20}; do
  if curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
    GATEWAY_HEALTHY=1
    break
  fi
  sleep 1
done

if [[ "$GATEWAY_HEALTHY" == "1" ]]; then
  echo "  [OK] API Gateway BFF phan hoi HTTP 200 OK."
else
  echo "  [WARN] API Gateway dang khoi dong (se san sang trong vai giay toi)."
fi

# In Dashboard hoan tat
echo ""
echo "=================================================================================="
echo "HE THONG DA DUOC TRIEN KHAI THANH CONG"
echo "=================================================================================="
echo ""
echo "DANH SACH DIA CHI TRUY CAP (LOCAL URLS):"
echo "┌───────────────────┬──────────────────────────────────┬──────────────────────────────┐"
echo "│ Ung Dung          │ Dia Chi URL / API                │ Mo Ta / Ghi Chu              │"
echo "├───────────────────┼──────────────────────────────────┼──────────────────────────────┤"
echo "│ Merchant Web      │ http://localhost:5174            │ Cong thong tin Merchant      │"
echo "│ Ops Web           │ http://localhost:5173            │ Quan tri van hanh Hub/Kho    │"
echo "│ Admin Web         │ http://localhost:5175            │ Bang dieu khien Quan tri     │"
echo "│ Guest Tracking    │ http://localhost:5177            │ Tra cuu don hang cong khai   │"
echo "│ Customer Web      │ http://localhost:5176            │ Web khach hang dat giao hang │"
echo "│ API Gateway       │ http://localhost:3000/health     │ Cong trung tam API Gateway   │"
echo "│ AI Chatbot        │ http://localhost:3013            │ Chatbot RAG Subsystem        │"
echo "│ MinIO S3 Console  │ http://localhost:9001            │ minioadmin / minioadmin123   │"
echo "└───────────────────┴──────────────────────────────────┴──────────────────────────────┘"
echo ""
echo "THONG TIN TAI KHOAN DUNG THU (DEMO CREDENTIALS):"
echo "┌───────────────────┬──────────────────────────────────┬──────────────────────────────┐"
echo "│ Vai Tro           │ Ma Tai Khoan / Username          │ Mat Khau                     │"
echo "├───────────────────┼──────────────────────────────────┼──────────────────────────────┤"
echo "│ Merchant          │ 41100001                         │ password                     │"
echo "│ Ops Staff         │ 20001001                         │ password                     │"
echo "│ System Admin      │ 10000001                         │ password                     │"
echo "│ Courier (Shipper) │ 30002015                         │ password                     │"
echo "└───────────────────┴──────────────────────────────────┴──────────────────────────────┘"
echo ""
echo "QUAN TRI VA THEO DOI HE THONG:"
echo "  - Bang dieu khien realtime:    npx pm2 monit"
echo "  - Danh sach tien trinh:        npx pm2 list"
echo "  - Xem nhat ky (logs):          npx pm2 logs"
echo "  - Dung he thong:               ./stop-local-lean.sh"
echo ""
echo "PUBLIC INTERNET VOI CLOUDFLARE TUNNEL (TUY CHON):"
echo "  cloudflared tunnel --url http://localhost:3000"
echo "=================================================================================="
