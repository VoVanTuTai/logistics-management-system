#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/infra/prod/.env}"
ENV_EXAMPLE="$ROOT_DIR/infra/prod/.env.example"
COMPOSE_FILE="$ROOT_DIR/infra/prod/docker-compose.yml"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

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

export DOCKER_BUILDKIT=1

echo "[compose] build and start backend + frontend"
compose up -d --build --remove-orphans

echo
echo "[compose] status"
compose ps

echo
echo "Health checks:"
echo "  gateway: curl -I http://127.0.0.1:${GATEWAY_PORT:-3000}/health"
echo "  ops-web: curl -I http://127.0.0.1:${OPS_WEB_PORT:-5173}/"
