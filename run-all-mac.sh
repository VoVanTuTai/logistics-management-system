#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.tmp/service-logs"
PID_DIR="$ROOT_DIR/.tmp/pids"
MOBILE_MODE="${1:-lan}"

mkdir -p "$LOG_DIR" "$PID_DIR"

resolve_lan_ip() {
  local ip
  ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  if [[ -z "$ip" ]]; then
    ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  fi
  if [[ -z "$ip" ]]; then
    ip="$(ifconfig | awk '/inet / && $2 !~ /^127\\./ && $2 !~ /^169\\.254/ { print $2; exit }')"
  fi
  if [[ -z "$ip" ]]; then
    echo "Cannot resolve LAN IPv4 address." >&2
    exit 1
  fi
  echo "$ip"
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  touch "$file"
  if grep -qE "^[[:space:]]*${key}[[:space:]]*=" "$file"; then
    sed -i '' -E "s|^[[:space:]]*${key}[[:space:]]*=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti ":$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "[stop] port $port pid(s): $pids"
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

wait_port() {
  local name="$1"
  local port="$2"
  local timeout="${3:-90}"
  local elapsed=0
  while [[ "$elapsed" -lt "$timeout" ]]; do
    if lsof -ti ":$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[ready] $name port=$port"
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo "[down] $name port=$port" >&2
  return 1
}

ensure_database() {
  local db_name="$1"
  if docker exec NEXUS-dev-postgres psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${db_name}'" | grep -q 1; then
    return
  fi
  echo "[db] create $db_name"
  docker exec NEXUS-dev-postgres createdb -U postgres "$db_name"
}

install_deps_if_needed() {
  local dir="$1"
  local name="$2"
  if [[ -d "$dir/node_modules" ]]; then
    return
  fi
  echo "[install] $name"
  (
    cd "$dir"
    if [[ -f pnpm-lock.yaml ]] && command -v pnpm >/dev/null 2>&1; then
      pnpm install --ignore-scripts
    else
      npm install --ignore-scripts
    fi
  )
}

start_service() {
  local name="$1"
  local rel_path="$2"
  local port="$3"
  local db_name="${4:-}"
  local dir="$ROOT_DIR/$rel_path"
  local log_id
  local runner
  local out_log
  local err_log

  log_id="$(date +%Y%m%d-%H%M%S)"
  runner="$LOG_DIR/$name-$log_id.mac-run.sh"
  out_log="$LOG_DIR/$name-$log_id.out.log"
  err_log="$LOG_DIR/$name-$log_id.err.log"

  install_deps_if_needed "$dir" "$name"
  stop_port "$port"

  {
    echo '#!/usr/bin/env bash'
    echo 'set -euo pipefail'
    printf 'cd %q\n' "$dir"
    printf 'export PORT=%q\n' "$port"
    echo 'export RABBITMQ_URL="${RABBITMQ_URL:-amqp://guest:guest@localhost:5672}"'
    echo 'export DOMAIN_EVENTS_EXCHANGE="${DOMAIN_EVENTS_EXCHANGE:-domain.events}"'
    echo 'export PRICING_SERVICE_URL="${PRICING_SERVICE_URL:-http://localhost:3012}"'
    if [[ -n "$db_name" ]]; then
      printf 'export DATABASE_URL=%q\n' "postgresql://postgres:postgres@localhost:15432/$db_name"
      echo 'if [[ -f prisma/schema.prisma ]]; then'
      echo '  node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma'
      echo '  node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma'
      echo 'fi'
    fi
    echo 'exec node node_modules/ts-node/dist/bin.js src/main.ts'
  } > "$runner"
  chmod +x "$runner"

  nohup "$runner" > "$out_log" 2> "$err_log" < /dev/null &
  echo "$!" > "$PID_DIR/$name.pid"
  echo "[start] $name pid=$(cat "$PID_DIR/$name.pid") port=$port logs=$out_log"
}

start_web_app() {
  local name="$1"
  local rel_path="$2"
  local port="$3"
  local dir="$ROOT_DIR/$rel_path"
  local out_log="$LOG_DIR/$name-web.out.log"
  local err_log="$LOG_DIR/$name-web.err.log"

  install_deps_if_needed "$dir" "$name"
  stop_port "$port"
  (
    cd "$dir"
    nohup npm run dev -- --host 0.0.0.0 --port "$port" > "$out_log" 2> "$err_log" < /dev/null &
    echo "$!" > "$PID_DIR/$name.pid"
  )
  echo "[start] $name pid=$(cat "$PID_DIR/$name.pid") port=$port"
}

start_mobile_app() {
  local dir="$ROOT_DIR/apps/courier-mobile"
  local host_mode="lan"
  local out_log="$LOG_DIR/courier-mobile.out.log"
  local err_log="$LOG_DIR/courier-mobile.err.log"

  if [[ "$MOBILE_MODE" == "emulator" ]]; then
    host_mode="localhost"
  fi

  install_deps_if_needed "$dir" "courier-mobile"
  stop_port 8081
  (
    cd "$dir"
    EXPO_PUBLIC_GATEWAY_BASE_URL="$MOBILE_GATEWAY_URL" \
      nohup npm run start -- --host "$host_mode" --port 8081 > "$out_log" 2> "$err_log" < /dev/null &
    echo "$!" > "$PID_DIR/courier-mobile.pid"
  )
  echo "[start] courier-mobile pid=$(cat "$PID_DIR/courier-mobile.pid") port=8081 mode=$MOBILE_MODE"
}

echo "[env] updating local Mac env"
LAN_IP="$(resolve_lan_ip)"
if [[ "$MOBILE_MODE" == "emulator" ]]; then
  MOBILE_GATEWAY_URL="http://10.0.2.2:3000"
  S3_ENDPOINT="http://10.0.2.2:9000"
else
  MOBILE_GATEWAY_URL="http://$LAN_IP:3000"
  S3_ENDPOINT="http://$LAN_IP:9000"
fi

set_env_value "$ROOT_DIR/apps/courier-mobile/.env" EXPO_PUBLIC_GATEWAY_BASE_URL "$MOBILE_GATEWAY_URL"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" S3_ENDPOINT "$S3_ENDPOINT"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" AUTH_SERVICE_URL "http://localhost:3010"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" DELIVERY_SERVICE_URL "http://localhost:3007"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" DISPATCH_SERVICE_URL "http://localhost:3004"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" MANIFEST_SERVICE_URL "http://localhost:3005"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" LINEHAUL_SERVICE_URL "http://localhost:3013"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" MASTERDATA_SERVICE_URL "http://localhost:3001"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" PICKUP_SERVICE_URL "http://localhost:3003"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" REPORTING_SERVICE_URL "http://localhost:3009"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" SCAN_SERVICE_URL "http://localhost:3006"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" SHIPMENT_SERVICE_URL "http://localhost:3002"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" TRACKING_SERVICE_URL "http://localhost:3008"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" PAYMENT_SERVICE_URL "http://localhost:3011"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" PRICING_SERVICE_URL "http://localhost:3012"
set_env_value "$ROOT_DIR/services/shipment-service/.env" PRICING_SERVICE_URL "http://localhost:3012"

echo "[infra] starting docker dependencies"
docker compose -f "$ROOT_DIR/infra/dev/docker-compose.yml" up -d --remove-orphans
ensure_database linehaul_db

start_service masterdata-service services/masterdata-service 3001 masterdata_db
start_service shipment-service services/shipment-service 3002 shipment_db
start_service pickup-service services/pickup-service 3003 pickup_db
start_service dispatch-service services/dispatch-service 3004 dispatch_db
start_service manifest-service services/manifest-service 3005 manifest_db
start_service scan-service services/scan-service 3006 scan_db
start_service delivery-service services/delivery-service 3007 delivery_db
start_service tracking-service services/tracking-service 3008 tracking_db
start_service reporting-service services/reporting-service 3009 reporting_db
start_service auth-service services/auth-service 3010 auth_db
start_service payment-service services/payment-service 3011 payment_db
start_service pricing-service services/pricing-service 3012
start_service linehaul-service services/linehaul-service 3013 linehaul_db

echo "[seed] auth demo users"
(
  cd "$ROOT_DIR/services/auth-service"
  DATABASE_URL="postgresql://postgres:postgres@localhost:15432/auth_db" \
    node node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts
)

echo "[wait] backend ports"
wait_port masterdata-service 3001
wait_port shipment-service 3002
wait_port pickup-service 3003
wait_port dispatch-service 3004
wait_port manifest-service 3005
wait_port scan-service 3006
wait_port delivery-service 3007
wait_port tracking-service 3008
wait_port reporting-service 3009
wait_port auth-service 3010
wait_port payment-service 3011
wait_port pricing-service 3012
wait_port linehaul-service 3013

start_service gateway-bff services/gateway-bff 3000
wait_port gateway-bff 3000

start_web_app ops-web apps/ops-web 5173
start_web_app merchant-web apps/merchant-web 5174
start_web_app admin-web apps/admin-web 5175
start_web_app public-tracking apps/public-tracking 5176
start_mobile_app

echo "[wait] UI ports"
wait_port ops-web 5173 30
wait_port merchant-web 5174 30
wait_port admin-web 5175 30
wait_port public-tracking 5176 30

echo
echo "=== OPEN URLS ==="
echo "gateway API:      http://localhost:3000/health"
echo "postgres UI:      http://localhost:5050  (admin@nexus.dev / admin)"
echo "merchant-web:    http://localhost:5174"
echo "ops-web:         http://localhost:5173"
echo "admin-web:       http://localhost:5175"
echo "public-tracking: http://localhost:5176"
echo "courier-mobile:  http://localhost:8081"
echo
echo "Demo login: merchant 41100001 / password"
