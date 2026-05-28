#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/infra/prod/.env}"
ENV_EXAMPLE="$ROOT_DIR/infra/prod/.env.example"
COMPOSE_FILE="$ROOT_DIR/infra/prod/docker-compose.yml"
NGINX_SOURCE="$ROOT_DIR/infra/prod/nginx-domain-proxy.conf"
NGINX_TARGET="/etc/nginx/sites-available/nexus-public.conf"
NGINX_LINK="/etc/nginx/sites-enabled/nexus-public.conf"

OPS_DOMAIN="${OPS_DOMAIN:-ops.nexus-ex.site}"
MERCHANT_DOMAIN="${MERCHANT_DOMAIN:-merchant.nexus-ex.site}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.nexus-ex.site}"
TRACKING_DOMAIN="${TRACKING_DOMAIN:-tracking.nexus-ex.site}"
MINIO_DOMAIN="${MINIO_DOMAIN:-minio.nexus-ex.site}"

export DOCKER_BUILDKIT=1

PRISMA_SERVICES=(
  masterdata-service:masterdata_db
  shipment-service:shipment_db
  pickup-service:pickup_db
  dispatch-service:dispatch_db
  manifest-service:manifest_db
  scan-service:scan_db
  delivery-service:delivery_db
  tracking-service:tracking_db
  reporting-service:reporting_db
  auth-service:auth_db
  payment-service:payment_db
)

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

sudo_cmd() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing command: $command_name" >&2
    exit 1
  fi
}

compose_network() {
  local container_id
  local network_name

  container_id="$(compose ps -q postgres 2>/dev/null || true)"
  if [[ -z "$container_id" ]]; then
    echo "Cannot resolve compose network because postgres is not running." >&2
    exit 1
  fi

  network_name="$(
    docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$container_id" \
      | head -n 1
  )"

  if [[ -z "$network_name" ]]; then
    echo "Cannot resolve compose network for postgres container." >&2
    exit 1
  fi

  printf '%s' "$network_name"
}

run_node_service_command() {
  local dir="$1"
  local name="$2"
  local database_url="$3"
  local pnpm_command="$4"
  local npm_command="$5"
  local network_name

  network_name="$(compose_network)"

  echo "[node] $name"
  docker run --rm \
    --network "$network_name" \
    -v "$dir:/app" \
    -v "$ROOT_DIR/infra:/infra:ro" \
    -w /app \
    -e DATABASE_URL="$database_url" \
    -e PNPM_COMMAND="$pnpm_command" \
    -e NPM_COMMAND="$npm_command" \
    node:20-alpine \
    sh -lc '
      set -e
      if [ -f package-lock.json ]; then
        npm ci
        eval "$NPM_COMMAND"
      elif [ -f pnpm-lock.yaml ]; then
        corepack enable >/dev/null 2>&1
        corepack prepare pnpm@9.15.9 --activate >/dev/null 2>&1
        pnpm install --frozen-lockfile
        eval "$PNPM_COMMAND"
      else
        npm install
        eval "$NPM_COMMAND"
      fi
    '
}

set_env_value() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
  fi
}

get_env_value() {
  local key="$1"
  local fallback="${2:-}"
  local value

  value="$(
    awk -v key="$key" '
      BEGIN { FS = "=" }
      $0 !~ /^[[:space:]]*(#|$)/ && $1 == key {
        sub(/^[^=]*=/, "")
        print
        exit
      }
    ' "$ENV_FILE"
  )"
  value="${value%$'\r'}"

  if [[ -z "$value" ]]; then
    value="$fallback"
  fi

  printf '%s' "$value"
}

load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Created $ENV_FILE from example." >&2
  fi

  set_env_value OPS_PUBLIC_URL "https://${OPS_DOMAIN}"
  set_env_value MERCHANT_PUBLIC_URL "https://${MERCHANT_DOMAIN}"
  set_env_value ADMIN_PUBLIC_URL "https://${ADMIN_DOMAIN}"
  set_env_value PUBLIC_TRACKING_PUBLIC_URL "https://${TRACKING_DOMAIN}"
  set_env_value GATEWAY_PUBLIC_URL "https://${OPS_DOMAIN}"
  set_env_value MINIO_PUBLIC_ENDPOINT "https://${MINIO_DOMAIN}"
  set_env_value CORS_ORIGINS "https://${OPS_DOMAIN},https://${MERCHANT_DOMAIN},https://${ADMIN_DOMAIN},https://${TRACKING_DOMAIN}"
  set_env_value OPS_WEB_PORT "5173"
  set_env_value MERCHANT_WEB_PORT "5174"
  set_env_value ADMIN_WEB_PORT "5175"
  set_env_value PUBLIC_TRACKING_PORT "5176"
  set_env_value GATEWAY_PORT "13000"
  set_env_value MINIO_API_PORT "19000"

  POSTGRES_USER="$(get_env_value POSTGRES_USER postgres)"
  POSTGRES_PASSWORD="$(get_env_value POSTGRES_PASSWORD)"
  SEED_DEMO_DATA="$(get_env_value SEED_DEMO_DATA 0)"

  export POSTGRES_USER POSTGRES_PASSWORD SEED_DEMO_DATA

  if [[ -z "$POSTGRES_PASSWORD" ]]; then
    echo "POSTGRES_PASSWORD is required in $ENV_FILE" >&2
    exit 1
  fi
}

wait_compose_service() {
  local service="$1"
  local timeout="${2:-180}"
  local elapsed=0
  local container_id
  local status

  while [[ "$elapsed" -lt "$timeout" ]]; do
    container_id="$(compose ps -q "$service" 2>/dev/null || true)"
    if [[ -n "$container_id" ]]; then
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
      if [[ "$status" == "healthy" || "$status" == "running" ]]; then
        echo "[ready] $service status=$status"
        return 0
      fi
    fi

    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "[down] $service status=${status:-missing}" >&2
  return 1
}

wait_http_health() {
  local url="$1"
  local timeout="${2:-180}"
  local elapsed=0

  while [[ "$elapsed" -lt "$timeout" ]]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "[ready] $url"
      return 0
    fi

    sleep 2
    elapsed=$((elapsed + 2))
  done

  echo "[down] $url" >&2
  return 1
}

stop_known_conflicts() {
  if docker ps --format '{{.Names}}' | grep -qx 'NEXUS-dev-postgres'; then
    echo "[docker] stop conflicting NEXUS-dev-postgres"
    docker stop NEXUS-dev-postgres >/dev/null
  fi
}

reset_compose_stack() {
  local down_args=(down --remove-orphans)

  if [[ "${RESET_VOLUMES:-0}" == "1" ]]; then
    echo "[warn] RESET_VOLUMES=1: compose volumes will be deleted"
    down_args+=(-v)
  fi

  echo "[compose] ${down_args[*]}"
  compose "${down_args[@]}" || true

  echo "[docker] remove nexus/*:local images"
  docker images --format '{{.Repository}}:{{.Tag}}' \
    | awk '/^nexus\/.*:local$/ { print }' \
    | xargs -r docker rmi -f
}

install_nginx_config() {
  if [[ "${CONFIGURE_NGINX:-1}" != "1" ]]; then
    echo "[nginx] skipped"
    return
  fi

  if [[ ! -f "$NGINX_SOURCE" ]]; then
    echo "Missing Nginx template: $NGINX_SOURCE" >&2
    exit 1
  fi

  echo "[nginx] install $NGINX_TARGET"
  sudo_cmd cp "$NGINX_SOURCE" "$NGINX_TARGET"
  sudo_cmd ln -sf "$NGINX_TARGET" "$NGINX_LINK"

  if [[ "${DISABLE_CONFLICTING_NGINX:-1}" == "1" && -d /etc/nginx/sites-enabled ]]; then
    local disabled_dir="/etc/nginx/sites-disabled/nexus-reset-$(date +%Y%m%d%H%M%S)"
    local file
    sudo_cmd mkdir -p "$disabled_dir"

    while IFS= read -r file; do
      if [[ "$file" == "$NGINX_LINK" ]]; then
        continue
      fi

      echo "[nginx] disable conflicting site $file"
      sudo_cmd mv "$file" "$disabled_dir/"
    done < <(
      grep -RIlE "server_name .*(${OPS_DOMAIN}|${MERCHANT_DOMAIN}|${ADMIN_DOMAIN}|${TRACKING_DOMAIN}|${MINIO_DOMAIN})" \
        /etc/nginx/sites-enabled 2>/dev/null || true
    )
  fi

  sudo_cmd nginx -t
  sudo_cmd systemctl reload nginx
}

build_and_start_stack() {
  echo "[docker] build no-cache"
  compose build --no-cache

  echo "[compose] start infra"
  compose up -d postgres rabbitmq minio minio-create-bucket
  wait_compose_service postgres 180
  wait_compose_service rabbitmq 180
  wait_compose_service minio 180

  echo "[compose] start stack"
  compose up -d --remove-orphans
}

prepare_databases() {
  local item
  local service
  local db_name
  local dir
  local database_url

  for item in "${PRISMA_SERVICES[@]}"; do
    service="${item%%:*}"
    db_name="${item##*:}"
    dir="$ROOT_DIR/services/$service"
    database_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${db_name}"

    echo "[db] prepare $service db=$db_name"
    run_node_service_command \
      "$dir" \
      "$service" \
      "$database_url" \
      "pnpm exec prisma generate --schema prisma/schema.prisma && pnpm exec prisma db push --schema prisma/schema.prisma" \
      "npx prisma generate --schema prisma/schema.prisma && npx prisma db push --schema prisma/schema.prisma"
  done
}

seed_auth_demo_data() {
  if [[ "${SEED_DEMO_DATA:-0}" != "1" ]]; then
    echo "[seed] skipped because SEED_DEMO_DATA is not 1"
    return
  fi

  local dir="$ROOT_DIR/services/auth-service"
  local database_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/auth_db"

  echo "[seed] auth demo users"
  run_node_service_command \
    "$dir" \
    "auth-service seed" \
    "$database_url" \
    "pnpm exec ts-node --transpile-only prisma/seed.ts" \
    "node node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts"
}

verify_public_routes() {
  echo "[verify] public health"
  wait_http_health "https://${OPS_DOMAIN}/health" 180

  echo "[verify] auth preflight"
  curl -fsSI -X OPTIONS "https://${OPS_DOMAIN}/ops/auth/auth/login" \
    -H "Origin: https://${OPS_DOMAIN}" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: content-type" >/dev/null

  echo "[verify] ops API preflight"
  curl -fsSI -X OPTIONS "https://${OPS_DOMAIN}/ops/shipment/shipments" \
    -H "Origin: https://${OPS_DOMAIN}" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization,content-type" >/dev/null

  echo "[verify] frontend bundle does not reference old IP gateway"
  if curl -fsS "https://${OPS_DOMAIN}/login" \
    | grep -o '/assets/[^"]*\.js' \
    | head -n 1 \
    | xargs -r -I '{}' curl -fsS "https://${OPS_DOMAIN}{}" \
    | grep -q '103\.179\.172\.53:3000'; then
    echo "Frontend bundle still references http://103.179.172.53:3000" >&2
    exit 1
  fi
}

print_summary() {
  echo
  echo "=== Public deployment ready ==="
  echo "gateway API:      https://${OPS_DOMAIN}/health"
  echo "ops-web:          https://${OPS_DOMAIN}"
  echo "merchant-web:     https://${MERCHANT_DOMAIN}"
  echo "admin-web:        https://${ADMIN_DOMAIN}"
  echo "public-tracking:  https://${TRACKING_DOMAIN}"
  echo
  echo "Demo ops login: username=20000001 password=password"
}

main() {
  if [[ "${FORCE_RESET:-0}" != "1" ]]; then
    echo "This script stops/removes nexus-prod containers and nexus/*:local images." >&2
    echo "Run with FORCE_RESET=1 to continue." >&2
    echo "Set RESET_VOLUMES=1 only if you also want to delete compose volumes/database data." >&2
    exit 1
  fi

  require_command docker
  require_command curl
  load_env
  stop_known_conflicts
  reset_compose_stack
  install_nginx_config
  build_and_start_stack
  prepare_databases
  seed_auth_demo_data
  compose restart auth-service masterdata-service shipment-service pickup-service dispatch-service manifest-service scan-service delivery-service tracking-service reporting-service payment-service gateway-bff
  verify_public_routes
  compose ps
  print_summary
}

main "$@"
