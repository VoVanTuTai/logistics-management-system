#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICES=(
  "auth-service"
  "shipment-service"
  "pickup-service"
  "dispatch-service"
  "manifest-service"
  "scan-service"
  "delivery-service"
  "tracking-service"
  "reporting-service"
)

for service in "${SERVICES[@]}"; do
  echo "[seed] ${service}"
  (
    cd "${ROOT_DIR}/services/${service}"
    npm run seed
  )
done

echo "seed-all completed"
