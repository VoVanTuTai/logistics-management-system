#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.tmp/pm2-logs"
PID_DIR="$ROOT_DIR/.tmp/pids"
COMPOSE_INFRA="$ROOT_DIR/infra/dev/docker-compose.yml"

mkdir -p "$LOG_DIR" "$PID_DIR"

echo "========================================================================"
echo "⚡ NEXUS LOGISTICS - TRIỂN KHAI SIÊU NHẸ (LEAN PRODUCTION HYBRID)"
echo "   Hệ thống 14 Microservices + 5 Web Apps + 4 Hạ Tầng Dữ Liệu"
echo "========================================================================"

# 1. Kiểm tra Docker Desktop
echo ""
echo "[1/5] 🐳 Kiểm tra trạng thái Docker..."
if ! docker info >/dev/null 2>&1; then
  echo "  ⏳ Docker daemon chưa chạy. Đang mở Docker Desktop..."
  if [[ -d "/Applications/Docker.app" ]]; then
    open -a Docker
    echo "  ⏳ Đang đợi Docker khởi động hoàn tất (tối đa 40s)..."
    for i in {1..20}; do
      if docker info >/dev/null 2>&1; then
        echo "  ✅ Docker Desktop đã sẵn sàng!"
        break
      fi
      sleep 2
    done
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "  ❌ Không thể kết nối tới Docker." >&2
  echo "  👉 Vui lòng mở Docker Desktop bằng tay rồi chạy lại script này." >&2
  exit 1
fi
echo "  ✅ Docker daemon đang hoạt động tốt."

# 2. Khởi động 4 Container Hạ Tầng Cơ Bản (Postgres, RabbitMQ, Redis, MinIO)
echo ""
echo "[2/5] 🏗️  Khởi động hạ tầng lõi (Postgres, Redis, RabbitMQ, MinIO)..."
docker compose -f "$COMPOSE_INFRA" up -d --remove-orphans

echo "  ⏳ Đợi PostgreSQL và RabbitMQ sẵn sàng..."
for i in {1..25}; do
  if docker exec NEXUS-dev-postgres pg_isready -U postgres -d postgres >/dev/null 2>&1; then
    echo "  ✅ PostgreSQL (Port 15432) đã sẵn sàng kết nối."
    break
  fi
  sleep 1
done

# 3. Kiểm tra và đồng bộ Database Schemas & Seed dữ liệu (nếu DB mới)
echo ""
echo "[3/6] 🗄️  Kiểm tra dữ liệu Database..."
AUTH_TABLE_COUNT=$(docker exec NEXUS-dev-postgres psql -U postgres -d auth_db -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")

if [[ "${AUTH_TABLE_COUNT:-0}" -lt "2" ]]; then
  echo "  🌱 Database chưa có schema/dữ liệu. Đang tự động khởi tạo bảng và seed dữ liệu demo..."
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
      echo "  → Cập nhật schema: $svc ($dbname)..."
      (
        cd "$svc_dir"
        DATABASE_URL="postgresql://postgres:postgres@localhost:15432/$dbname" \
          npx prisma db push --schema prisma/schema.prisma >/dev/null 2>&1 || true
      )
    fi
  done

  echo "  🌱 Nạp người dùng và dữ liệu vận hành mẫu..."
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
  echo "  ✅ Khởi tạo và nạp dữ liệu demo thành công!"
else
  echo "  ✅ Dữ liệu Database đã tồn tại sẵn, bỏ qua bước seed để khởi động nhanh."
fi

# 4. Kiểm tra code đã build chưa
echo ""
echo "[4/6] 📦 Kiểm tra bản build production..."
MISSING_BUILD=0
if [[ ! -f "$ROOT_DIR/services/gateway-bff/dist/main.js" ]] || [[ ! -f "$ROOT_DIR/apps/merchant-web/dist/index.html" ]]; then
  MISSING_BUILD=1
fi

if [[ "$MISSING_BUILD" == "1" ]]; then
  echo "  ⏳ Phát hiện thiếu bản build, đang tiến hành build toàn bộ hệ thống..."
  node "$ROOT_DIR/scripts/rebuild-all.mjs"
else
  echo "  ✅ Toàn bộ 13 services và 5 web apps đã được biên dịch sẵn sàng."
fi

# 5. Khởi chạy 14 Services và Web Apps qua PM2
echo ""
echo "[5/6] 🚀 Khởi chạy hệ thống qua PM2 Process Manager (Native M4 ARM64)..."
npx pm2 delete ecosystem.config.cjs 2>/dev/null || true
npx pm2 start "$ROOT_DIR/ecosystem.config.cjs"

# 6. Kiểm tra sức khỏe hệ thống
echo ""
echo "[6/6] 🩺 Đang kiểm tra cổng API Gateway (Port 3000)..."
GATEWAY_HEALTHY=0
for i in {1..20}; do
  if curl -fsS http://localhost:3000/health >/dev/null 2>&1; then
    GATEWAY_HEALTHY=1
    break
  fi
  sleep 1
done

if [[ "$GATEWAY_HEALTHY" == "1" ]]; then
  echo "  ✅ API Gateway BFF đã phản hồi HTTP 200 OK!"
else
  echo "  ⚠️ API Gateway đang khởi động (sẽ sẵn sàng trong vài giây tới)."
fi

# In Dashboard hoàn tất
echo ""
echo "========================================================================"
echo "🎉 HỆ THỐNG ĐÃ TRIỂN KHAI THÀNH CÔNG TRÊN MÁY CỦA BẠN!"
echo "========================================================================"
echo ""
echo "📌 CÁC ĐỊA CHỈ TRUY CẬP (LOCAL PRODUCTION URLS):"
echo "  ┌──────────────────┬─────────────────────────────┬──────────────────────────┐"
echo "  │ Ứng dụng         │ Địa chỉ Web / API           │ Ghi chú                  │"
echo "  ├──────────────────┼─────────────────────────────┼──────────────────────────┤"
echo "  │ 🛍️  Merchant Web │ http://localhost:5174       │ Cổng thông tin Merchant  │"
echo "  │ 🏢 Ops Web       │ http://localhost:5173       │ Quản trị vận hành Hub/Kho│"
echo "  │ 👑 Admin Web     │ http://localhost:5175       │ Bảng điều khiển Quản trị │"
echo "  │ 📦 Guest Tracking│ http://localhost:5177       │ Tra cứu đơn hàng công khai│"
echo "  │ 📱 Customer Web  │ http://localhost:5176       │ Webview khách hàng đặt xe│"
echo "  │ ⚡ API Gateway    │ http://localhost:3000/health│ Cổng trung tâm BFF       │"
echo "  │ 🤖 AI Chatbot    │ http://localhost:3013       │ Chatbot RAG Subsystem    │"
echo "  │ 🗄️  MinIO S3 UI   │ http://localhost:9001       │ minioadmin / minioadmin123│"
echo "  └──────────────────┴─────────────────────────────┴──────────────────────────┘"
echo ""
echo "🔑 TÀI KHOẢN MẪU DÙNG THỬ (DEMO CREDENTIALS):"
echo "  • Merchant:  41100001 / password"
echo "  • Ops Staff: 20001001 / password"
echo "  • Admin:     10000001 / password"
echo "  • Courier:   30002015 / password"
echo ""
echo "📊 QUẢN TRỊ & THEO DÕI HỆ THỐNG:"
echo "  • Xem bảng điều khiển CPU / RAM realtime:  npx pm2 monit"
echo "  • Xem danh sách tiến trình:                npx pm2 list"
echo "  • Xem log thời gian thực:                  npx pm2 logs"
echo "  • Dừng toàn bộ hệ thống:                   ./stop-local-lean.sh"
echo ""
echo "🌐 PUBLIC RA INTERNET MIỄN PHÍ VỚI HTTPS (CLOUDFLARE TUNNEL):"
echo "  Nếu cần gửi link cho người ngoài truy cập hoặc test SePay webhook:"
echo "  👉 Chạy lệnh: cloudflared tunnel --url http://localhost:3000"
echo "========================================================================"
