#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"

echo "[infra] starting local postgres + rabbitmq"
docker compose -f infra/dev/docker-compose.yml up -d

echo "[db] applying schema"
bash scripts/migrate-all.sh

echo "[db] seeding test data"
bash scripts/seed-all.sh

echo "dev-up completed"
echo "Now start services with npm run start:dev in each service you need."
