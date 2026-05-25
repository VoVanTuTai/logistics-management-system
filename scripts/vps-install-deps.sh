#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root on the VPS." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git ufw nginx certbot python3-certbot-nginx docker.io docker-compose-plugin nodejs npm

systemctl enable --now docker

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable || npm install -g corepack
  corepack prepare pnpm@9.15.9 --activate
fi

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 3000/tcp
ufw allow 5173/tcp
ufw allow 5174/tcp
ufw allow 5175/tcp
ufw allow 5176/tcp
ufw allow 9000/tcp
ufw --force enable

echo "VPS dependencies are ready."
