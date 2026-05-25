#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/infra/prod/.env}"
ENV_EXAMPLE="$ROOT_DIR/infra/prod/.env.example"
COMPOSE_FILE="$ROOT_DIR/infra/prod/docker-compose.yml"
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

WEB_APPS=(
  ops-web
  merchant-web
  admin-web
  public-tracking
)

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing command: $command_name" >&2
    exit 1
  fi
}

load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Created $ENV_FILE from example." >&2
    echo "Edit secrets in $ENV_FILE, then run this script again." >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
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
    if [[ -f pnpm-lock.yaml ]]; then
      pnpm install --frozen-lockfile
    else
      npm ci
    fi
  )
}

run_package_script() {
  local dir="$1"
  local script="$2"

  (
    cd "$dir"
    if [[ -f pnpm-lock.yaml ]]; then
      pnpm run "$script"
    else
      npm run "$script"
    fi
  )
}

run_prisma() {
  local dir="$1"
  shift

  (
    cd "$dir"
    if [[ -f pnpm-lock.yaml ]]; then
      pnpm exec prisma "$@"
    else
      npx prisma "$@"
    fi
  )
}

wait_compose_service() {
  local service="$1"
  local timeout="${2:-120}"
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
  local timeout="${2:-120}"
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
    database_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:15432/${db_name}"

    install_deps_if_needed "$dir" "$service"
    echo "[db] prepare $service db=$db_name"
    DATABASE_URL="$database_url" run_prisma "$dir" generate --schema prisma/schema.prisma
    DATABASE_URL="$database_url" run_prisma "$dir" db push --schema prisma/schema.prisma
  done
}

seed_auth_demo_data() {
  local dir="$ROOT_DIR/services/auth-service"
  local database_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:15432/auth_db"

  if [[ "${SEED_DEMO_DATA:-0}" != "1" ]]; then
    echo "[seed] skipped"
    return
  fi

  install_deps_if_needed "$dir" "auth-service"
  echo "[seed] auth demo users"
  (
    cd "$dir"
    DATABASE_URL="$database_url" node node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts
  )
}

write_web_env() {
  local app="$1"
  local dir="$ROOT_DIR/apps/$app"
  local env_file="$dir/.env.production"

  case "$app" in
    ops-web)
      {
        printf 'VITE_GATEWAY_BFF_URL=%s\n' "$GATEWAY_PUBLIC_URL"
        printf 'VITE_ENABLE_FULL_OPS_MODULES=true\n'
      } > "$env_file"
      ;;
    admin-web)
      {
        printf 'VITE_GATEWAY_BFF_URL=%s\n' "$GATEWAY_PUBLIC_URL"
        printf 'VITE_REQUEST_TIMEOUT_MS=15000\n'
        printf 'VITE_ALLOW_PERMISSION_PROTOTYPE_FALLBACK=false\n'
      } > "$env_file"
      ;;
    merchant-web|public-tracking)
      printf 'VITE_GATEWAY_BFF_URL=%s\n' "$GATEWAY_PUBLIC_URL" > "$env_file"
      ;;
  esac
}

build_web_apps() {
  local app
  local dir

  for app in "${WEB_APPS[@]}"; do
    dir="$ROOT_DIR/apps/$app"
    write_web_env "$app"
    install_deps_if_needed "$dir" "$app"
    echo "[build] $app"
    run_package_script "$dir" build
  done
}

print_urls() {
  echo
  echo "=== VPS URLS ==="
  echo "gateway API:      ${GATEWAY_PUBLIC_URL}/health"
  echo "ops-web:          http://${PUBLIC_HOST}:${OPS_WEB_PORT}"
  echo "merchant-web:     http://${PUBLIC_HOST}:${MERCHANT_WEB_PORT}"
  echo "admin-web:        http://${PUBLIC_HOST}:${ADMIN_WEB_PORT}"
  echo "public-tracking:  http://${PUBLIC_HOST}:${PUBLIC_TRACKING_PORT}"
  echo "minio API:        ${MINIO_PUBLIC_ENDPOINT}"
  echo
}

main() {
  require_command docker
  require_command node
  require_command npm
  require_command curl

  if ! command -v pnpm >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@9.15.9 --activate
  fi

  load_env

  echo "[docker] build backend service images"
  "$ROOT_DIR/scripts/build-service-images.sh"

  echo "[infra] start postgres/rabbitmq/minio"
  compose up -d postgres rabbitmq minio minio-create-bucket
  wait_compose_service postgres 180
  wait_compose_service rabbitmq 180
  wait_compose_service minio 180

  prepare_databases
  seed_auth_demo_data
  build_web_apps

  echo "[compose] start full stack"
  compose up -d --remove-orphans
  wait_http_health "${GATEWAY_PUBLIC_URL}/health" 180

  compose ps
  print_urls
}

main "$@"
