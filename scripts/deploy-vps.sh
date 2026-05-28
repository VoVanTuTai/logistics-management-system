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

APP_DATABASES=(
  auth_db
  masterdata_db
  shipment_db
  pickup_db
  dispatch_db
  manifest_db
  scan_db
  delivery_db
  tracking_db
  reporting_db
  payment_db
  chat_db
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

append_missing_env_example_values() {
  local line
  local key

  if [[ ! -f "$ENV_EXAMPLE" ]]; then
    return
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"

    if [[ "$line" =~ ^[[:space:]]*$ || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi

    key="${line%%=*}"
    if [[ -n "$key" && "$line" == *=* ]] && ! grep -q "^${key}=" "$ENV_FILE"; then
      printf '%s\n' "$line" >>"$ENV_FILE"
    fi
  done <"$ENV_EXAMPLE"
}

load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "Created $ENV_FILE from example." >&2
    echo "Edit secrets in $ENV_FILE, then run this script again." >&2
    exit 1
  fi

  append_missing_env_example_values

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
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
  local service_path

  network_name="$(compose_network)"
  service_path="${dir#$ROOT_DIR/}"

  echo "[node] $name"
  docker run --rm \
    --network "$network_name" \
    -v "$ROOT_DIR:/workspace" \
    -w "/workspace/$service_path" \
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

ensure_databases() {
  local db_name
  local exists

  for db_name in "${APP_DATABASES[@]}"; do
    exists="$(
      compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname = '${db_name}'" \
        2>/dev/null || true
    )"

    if [[ "$exists" == "1" ]]; then
      echo "[db] exists $db_name"
    else
      echo "[db] create $db_name"
      compose exec -T postgres createdb -U "$POSTGRES_USER" "$db_name"
    fi
  done
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
  local dir="$ROOT_DIR/services/auth-service"
  local database_url="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/auth_db"

  if [[ "${SEED_DEMO_DATA:-0}" != "1" ]]; then
    echo "[seed] skipped"
    return
  fi

  echo "[seed] auth demo users"
  run_node_service_command \
    "$dir" \
    "auth-service seed" \
    "$database_url" \
    "pnpm exec ts-node --transpile-only prisma/seed.ts" \
    "node node_modules/ts-node/dist/bin.js --transpile-only prisma/seed.ts"
}

print_urls() {
  echo
  echo "=== VPS URLS ==="
  echo "gateway API:      ${GATEWAY_PUBLIC_URL}/health"
  echo "ops-web:          ${OPS_PUBLIC_URL:-http://${PUBLIC_HOST}:${OPS_WEB_PORT}}"
  echo "merchant-web:     ${MERCHANT_PUBLIC_URL:-http://${PUBLIC_HOST}:${MERCHANT_WEB_PORT}}"
  echo "admin-web:        ${ADMIN_PUBLIC_URL:-http://${PUBLIC_HOST}:${ADMIN_WEB_PORT}}"
  echo "public-tracking:  ${PUBLIC_TRACKING_PUBLIC_URL:-http://${PUBLIC_HOST}:${PUBLIC_TRACKING_PORT}}"
  echo "minio API:        ${MINIO_PUBLIC_ENDPOINT}"
  echo
}

main() {
  require_command docker
  require_command curl

  load_env

  echo "[docker] build application images"
  compose build

  echo "[infra] start postgres/rabbitmq/minio"
  compose up -d postgres rabbitmq minio minio-create-bucket
  wait_compose_service postgres 180
  wait_compose_service rabbitmq 180
  wait_compose_service minio 180

  ensure_databases
  prepare_databases
  seed_auth_demo_data

  echo "[compose] start full stack"
  compose up -d --build --remove-orphans
  wait_http_health "${GATEWAY_PUBLIC_URL}/health" 180

  compose ps
  print_urls
}

main "$@"
