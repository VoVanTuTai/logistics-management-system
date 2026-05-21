#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$ROOT_DIR/.tmp/pids"
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 5173 5174 5175 5176 8081)

echo "[stop] known pid files"
if [[ -d "$PID_DIR" ]]; then
  for pid_file in "$PID_DIR"/*.pid; do
    [[ -e "$pid_file" ]] || continue
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "  kill $(basename "$pid_file" .pid) pid=$pid"
      kill "$pid" 2>/dev/null || true
    fi
  done
fi

sleep 1

echo "[stop] ports"
for port in "${PORTS[@]}"; do
  pids="$(lsof -ti ":$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "  port $port pid(s): $pids"
    kill $pids 2>/dev/null || true
  fi
done

echo "[stop] done"
