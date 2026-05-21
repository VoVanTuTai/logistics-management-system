#!/bin/bash
set -e

# Wait for pgAdmin to be ready
echo "[pgadmin-setup] waiting for pgAdmin to start..."
for i in {1..30}; do
  if curl -s http://localhost:5050/misc/ping >/dev/null 2>&1; then
    echo "[pgadmin-setup] pgAdmin is ready"
    break
  fi
  echo "[pgadmin-setup] waiting... ($i/30)"
  sleep 2
done

# Get authentication token
echo "[pgadmin-setup] getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:5050/api/v1/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexus.dev",
    "password": "admin"
  }' | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "[pgadmin-setup] ERROR: Failed to get authentication token"
  exit 1
fi

echo "[pgadmin-setup] token obtained: ${TOKEN:0:20}..."

# Add PostgreSQL server
echo "[pgadmin-setup] adding Nexus Dev server..."
curl -s -X POST http://localhost:5050/api/v1/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nexus Dev",
    "group_id": 1,
    "host": "postgres",
    "port": 5432,
    "maintenance_db": "postgres",
    "username": "postgres",
    "password": "postgres",
    "ssl_mode": "prefer"
  }' | jq .

echo "[pgadmin-setup] ✓ Server added successfully!"
echo "[pgadmin-setup] Open: http://localhost:5050"
