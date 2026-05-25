#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.tmp/service-logs"
PID_DIR="$ROOT_DIR/.tmp/pids"
MOBILE_MODE="${1:-lan}"
BACKEND_MODE="${BACKEND_MODE:-container}"

SERVICE_IMAGES=(
  nexus/auth-service:local
  nexus/masterdata-service:local
  nexus/shipment-service:local
  nexus/pickup-service:local
  nexus/dispatch-service:local
  nexus/manifest-service:local
  nexus/scan-service:local
  nexus/delivery-service:local
  nexus/tracking-service:local
  nexus/reporting-service:local
  nexus/payment-service:local
  nexus/pricing-service:local
  nexus/gateway-bff:local
)

BACKEND_SERVICES=(
  masterdata-service
  shipment-service
  pickup-service
  dispatch-service
  manifest-service
  scan-service
  delivery-service
  tracking-service
  reporting-service
  auth-service
  payment-service
  pricing-service
  gateway-bff
)

BACKEND_PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012)

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

wait_http_health() {
  local name="$1"
  local url="$2"
  local timeout="${3:-120}"
  local elapsed=0
  while [[ "$elapsed" -lt "$timeout" ]]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "[ready] $name health=$url"
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo "[down] $name health=$url" >&2
  return 1
}

wait_container_healthy() {
  local container="$1"
  local timeout="${2:-120}"
  local elapsed=0
  local status
  while [[ "$elapsed" -lt "$timeout" ]]; do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"
    if [[ "$status" == "healthy" || "$status" == "running" ]]; then
      echo "[ready] container=$container status=$status"
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo "[down] container=$container status=${status:-missing}" >&2
  return 1
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

ensure_service_images() {
  local missing=()
  local image

  if [[ "${BUILD_IMAGES:-0}" == "1" ]]; then
    "$ROOT_DIR/scripts/build-service-images.sh"
    return
  fi

  for image in "${SERVICE_IMAGES[@]}"; do
    if ! docker image inspect "$image" >/dev/null 2>&1; then
      missing+=("$image")
    fi
  done

  if [[ "${#missing[@]}" -gt 0 ]]; then
    echo "[docker] missing service images:"
    printf '  %s\n' "${missing[@]}"
    "$ROOT_DIR/scripts/build-service-images.sh"
  else
    echo "[docker] service images are ready"
  fi
}

stop_known_backend_pids() {
  local name
  local pid_file
  local pid

  for name in "${BACKEND_SERVICES[@]}"; do
    pid_file="$PID_DIR/$name.pid"
    [[ -f "$pid_file" ]] || continue
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "[stop] local $name pid=$pid"
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  done
}

stop_non_docker_port() {
  local port="$1"
  local pids
  local pid
  local command_name

  pids="$(lsof -ti ":$port" -sTCP:LISTEN 2>/dev/null || true)"
  [[ -n "$pids" ]] || return 0

  for pid in $pids; do
    command_name="$(ps -p "$pid" -o comm= 2>/dev/null || true)"
    if [[ "$command_name" == *Docker* || "$command_name" == *docker* || "$command_name" == *com.docker* ]]; then
      echo "[keep] port $port owned by docker pid=$pid"
      continue
    fi
    echo "[stop] port $port pid=$pid command=${command_name:-unknown}"
    kill "$pid" 2>/dev/null || true
  done
}

stop_local_backend_ports() {
  local port
  stop_known_backend_pids
  sleep 1
  for port in "${BACKEND_PORTS[@]}"; do
    stop_non_docker_port "$port"
  done
}

prepare_service_database() {
  local name="$1"
  local rel_path="$2"
  local db_name="$3"
  local dir="$ROOT_DIR/$rel_path"

  if [[ ! -f "$dir/prisma/schema.prisma" ]]; then
    return
  fi

  install_deps_if_needed "$dir" "$name"
  echo "[db] prepare $name db=$db_name"
  (
    cd "$dir"
    DATABASE_URL="postgresql://postgres:postgres@localhost:15432/$db_name" \
      node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma
    DATABASE_URL="postgresql://postgres:postgres@localhost:15432/$db_name" \
      node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma
  )
}

prepare_service_databases() {
  prepare_service_database masterdata-service services/masterdata-service masterdata_db
  prepare_service_database shipment-service services/shipment-service shipment_db
  prepare_service_database pickup-service services/pickup-service pickup_db
  prepare_service_database dispatch-service services/dispatch-service dispatch_db
  prepare_service_database manifest-service services/manifest-service manifest_db
  prepare_service_database scan-service services/scan-service scan_db
  prepare_service_database delivery-service services/delivery-service delivery_db
  prepare_service_database tracking-service services/tracking-service tracking_db
  prepare_service_database reporting-service services/reporting-service reporting_db
  prepare_service_database auth-service services/auth-service auth_db
  prepare_service_database payment-service services/payment-service payment_db
}

seed_auth_demo_users() {
  local dir="$ROOT_DIR/services/auth-service"

  install_deps_if_needed "$dir" "auth-service"
  echo "[seed] auth demo users"
  (
    cd "$dir"
    DATABASE_URL="postgresql://postgres:postgres@localhost:15432/auth_db" \
      node node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts
  )
}

start_container_backend() {
  echo "[backend] mode=container"
  ensure_service_images
  stop_local_backend_ports

  echo "[infra] starting docker dependencies"
  docker compose -f "$ROOT_DIR/infra/dev/docker-compose.yml" up -d --remove-orphans
  wait_container_healthy NEXUS-dev-postgres 120
  wait_container_healthy NEXUS-dev-rabbitmq 120
  wait_container_healthy NEXUS-dev-minio 120

  prepare_service_databases
  seed_auth_demo_users

  echo "[backend] starting service containers"
  docker compose \
    -f "$ROOT_DIR/infra/dev/docker-compose.yml" \
    -f "$ROOT_DIR/infra/dev/docker-compose.services.yml" \
    up -d --remove-orphans

  wait_http_health gateway-bff http://localhost:3000/health 120
  wait_http_health masterdata-service http://localhost:3001/health 90
  wait_http_health pricing-service http://localhost:3012/health 90
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
  local log_id
  local runner
  local out_log="$LOG_DIR/courier-mobile.out.log"
  local err_log="$LOG_DIR/courier-mobile.err.log"
  local terminal_command

  if [[ "$MOBILE_MODE" == "emulator" ]]; then
    host_mode="localhost"
  fi

  install_deps_if_needed "$dir" "courier-mobile"
  stop_port 8081

  log_id="$(date +%Y%m%d-%H%M%S)"
  runner="$LOG_DIR/courier-mobile-$log_id.mac-run.sh"

  {
    echo '#!/usr/bin/env bash'
    echo 'set -euo pipefail'
    printf 'exec > >(tee -a %q) 2> >(tee -a %q >&2)\n' "$out_log" "$err_log"
    printf 'printf "\\033]0;%s\\007"\n' "courier-mobile Expo"
    printf 'echo $$ > %q\n' "$PID_DIR/courier-mobile.pid"
    printf 'cd %q\n' "$dir"
    printf 'export EXPO_PUBLIC_GATEWAY_BASE_URL=%q\n' "$MOBILE_GATEWAY_URL"
    printf 'echo "[expo] gateway=%s"\n' "$MOBILE_GATEWAY_URL"
    printf 'echo "[expo] host=%s port=8081"\n' "$host_mode"
    echo 'echo "[expo] QR will appear below. Scan it with Expo Go."'
    printf 'exec npm run start -- --host %q --port 8081\n' "$host_mode"
  } > "$runner"
  chmod +x "$runner"

  if [[ "${EXPO_TERMINAL:-1}" == "1" ]] && command -v osascript >/dev/null 2>&1; then
    terminal_command="$(printf '%q' "$runner")"
    osascript \
      -e 'tell application "Terminal"' \
      -e 'activate' \
      -e "do script \"$terminal_command\"" \
      -e 'end tell' >/dev/null
    echo "[start] courier-mobile Terminal opened port=8081 mode=$MOBILE_MODE logs=$out_log"
  else
    nohup "$runner" >/dev/null 2>&1 < /dev/null &
    echo "$!" > "$PID_DIR/courier-mobile.pid"
    echo "[start] courier-mobile pid=$(cat "$PID_DIR/courier-mobile.pid") port=8081 mode=$MOBILE_MODE logs=$out_log"
    echo "[hint] Set EXPO_TERMINAL=1 on macOS to show the Expo QR in Terminal."
  fi
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
set_env_value "$ROOT_DIR/services/gateway-bff/.env" MASTERDATA_SERVICE_URL "http://localhost:3001"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" PICKUP_SERVICE_URL "http://localhost:3003"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" REPORTING_SERVICE_URL "http://localhost:3009"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" SCAN_SERVICE_URL "http://localhost:3006"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" SHIPMENT_SERVICE_URL "http://localhost:3002"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" TRACKING_SERVICE_URL "http://localhost:3008"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" PAYMENT_SERVICE_URL "http://localhost:3011"
set_env_value "$ROOT_DIR/services/gateway-bff/.env" PRICING_SERVICE_URL "http://localhost:3012"
set_env_value "$ROOT_DIR/services/shipment-service/.env" PRICING_SERVICE_URL "http://localhost:3012"
set_env_value "$ROOT_DIR/apps/ops-web/.env" VITE_GATEWAY_BFF_URL "http://localhost:3000"

if [[ "$BACKEND_MODE" == "container" ]]; then
  start_container_backend
elif [[ "$BACKEND_MODE" == "local" ]]; then
  echo "[backend] mode=local"
  echo "[infra] starting docker dependencies"
  docker compose -f "$ROOT_DIR/infra/dev/docker-compose.yml" up -d --remove-orphans

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

  seed_auth_demo_users

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

  start_service gateway-bff services/gateway-bff 3000
  wait_port gateway-bff 3000
else
  echo "Unsupported BACKEND_MODE=$BACKEND_MODE. Use container or local." >&2
  exit 1
fi

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
