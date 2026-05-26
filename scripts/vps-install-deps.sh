#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root on the VPS." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git ufw nginx certbot python3-certbot-nginx docker-compose-plugin

if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y docker.io
fi

systemctl enable --now docker

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 5173/tcp
ufw allow 5174/tcp
ufw allow 5175/tcp
ufw allow 5176/tcp
ufw --force enable

echo "VPS dependencies are ready."
