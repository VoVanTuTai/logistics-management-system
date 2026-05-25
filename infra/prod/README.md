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

The deploy script builds both backend and frontend images. The web apps are
served by Nginx runtime containers:

```text
nexus/ops-web:local
nexus/merchant-web:local
nexus/admin-web:local
nexus/public-tracking:local
```

For HTTPS domain deployment, use HTTPS public URLs in these values:

```dotenv
PUBLIC_HOST=103.179.172.53
OPS_PUBLIC_URL=https://ops.nexus-ex.site
MERCHANT_PUBLIC_URL=https://merchant.nexus-ex.site
ADMIN_PUBLIC_URL=https://admin.nexus-ex.site
PUBLIC_TRACKING_PUBLIC_URL=https://tracking.nexus-ex.site
GATEWAY_PUBLIC_URL=https://ops.nexus-ex.site
MINIO_PUBLIC_ENDPOINT=https://minio.nexus-ex.site
CORS_ORIGINS=https://ops.nexus-ex.site,https://merchant.nexus-ex.site,https://admin.nexus-ex.site,https://tracking.nexus-ex.site
```

Do not build an HTTPS frontend with `GATEWAY_PUBLIC_URL=http://...`.
Vite embeds this value into the generated JavaScript. A page served from
`https://ops.nexus-ex.site` calling `http://103.179.172.53:3000` will be blocked
by the browser as mixed content and will surface as `Failed to fetch`.

The host-level Nginx template for these domains is:

```bash
sudo cp infra/prod/nginx-domain-proxy.conf /etc/nginx/sites-available/nexus-ex.conf
sudo ln -sf /etc/nginx/sites-available/nexus-ex.conf /etc/nginx/sites-enabled/nexus-ex.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx \
  -d ops.nexus-ex.site \
  -d merchant.nexus-ex.site \
  -d admin.nexus-ex.site \
  -d tracking.nexus-ex.site
```

Change the default passwords before running:

```dotenv
POSTGRES_PASSWORD=...
RABBITMQ_DEFAULT_PASS=...
MINIO_ROOT_PASSWORD=...
```

## URLs

```text
gateway API:      https://ops.nexus-ex.site/health
ops-web:          https://ops.nexus-ex.site
merchant-web:     https://merchant.nexus-ex.site
admin-web:        https://admin.nexus-ex.site
public-tracking:  https://tracking.nexus-ex.site
minio API:        https://minio.nexus-ex.site
```

## Operations

```bash
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml ps
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml logs -f gateway-bff
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml up -d --build
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml down
```
