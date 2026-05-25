# VPS deployment

Production-ish single VPS deployment for the logistics stack.

## First run on the VPS

```bash
cd /opt/logistics-management-system
chmod +x scripts/vps-install-deps.sh scripts/deploy-vps.sh
./scripts/vps-install-deps.sh
cp infra/prod/.env.example infra/prod/.env
nano infra/prod/.env
./scripts/deploy-vps.sh
```

Use the VPS public IP in these values:

```dotenv
PUBLIC_HOST=103.179.172.53
GATEWAY_PUBLIC_URL=http://103.179.172.53:3000
MINIO_PUBLIC_ENDPOINT=http://103.179.172.53:9000
```

Change the default passwords before running:

```dotenv
POSTGRES_PASSWORD=...
RABBITMQ_DEFAULT_PASS=...
MINIO_ROOT_PASSWORD=...
```

## URLs

```text
gateway API:      http://103.179.172.53:3000/health
ops-web:          http://103.179.172.53:5173
merchant-web:     http://103.179.172.53:5174
admin-web:        http://103.179.172.53:5175
public-tracking:  http://103.179.172.53:5176
minio API:        http://103.179.172.53:9000
```

## Operations

```bash
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml ps
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml logs -f gateway-bff
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml down
```

