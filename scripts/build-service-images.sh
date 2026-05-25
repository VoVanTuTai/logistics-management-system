#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_PREFIX="${IMAGE_PREFIX:-nexus}"
IMAGE_TAG="${IMAGE_TAG:-local}"
PUSH="${PUSH:-false}"
PLATFORM="${PLATFORM:-}"

SERVICES=(
  auth-service
  masterdata-service
  shipment-service
  pickup-service
  dispatch-service
  manifest-service
  scan-service
  delivery-service
  tracking-service
  reporting-service
  payment-service
  pricing-service
  gateway-bff
)

echo "[docker] building service images"
echo "[docker] prefix=$IMAGE_PREFIX tag=$IMAGE_TAG push=$PUSH"

for service in "${SERVICES[@]}"; do
  context="$ROOT_DIR/services/$service"
  image="$IMAGE_PREFIX/$service:$IMAGE_TAG"

  if [[ ! -f "$context/Dockerfile" ]]; then
    echo "[skip] $service has no Dockerfile"
    continue
  fi

  echo
  echo "[build] $image"
  if [[ -n "$PLATFORM" ]]; then
    docker build --platform "$PLATFORM" -t "$image" "$context"
  else
    docker build -t "$image" "$context"
  fi

  if [[ "$PUSH" == "true" ]]; then
    echo "[push] $image"
    docker push "$image"
  fi
done

echo
echo "[done] service images are ready"
