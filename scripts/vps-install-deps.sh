#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root on the VPS." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git ufw nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
  echo "[vps] Installing Docker Engine & Docker Compose via official Docker script..."
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 5173/tcp
ufw allow 5174/tcp
ufw allow 5175/tcp
ufw allow 5176/tcp
ufw allow 5177/tcp
ufw allow 5178/tcp
ufw allow 13000/tcp
ufw allow 19000/tcp
ufw --force enable

echo "VPS dependencies are ready."
