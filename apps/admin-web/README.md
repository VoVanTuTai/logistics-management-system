# admin-web

Admin-only frontend for masterdata governance.

## Scope

- Admin login with role check (`SYSTEM_ADMIN`)
- Masterdata screens:
  - Hubs
  - Zones
  - NDR Reasons
  - Configs

## Run

```bash
cd apps/admin-web
npm install
npm run dev
```

Default dev URL: `http://127.0.0.1:5175`

## Admin account

Use a real `SYSTEM_ADMIN` account that already exists in auth-service.

For local demo seed data, use:

- Username: `10000001`
- Password: `password`

## E2E

Admin E2E uses Playwright against the real gateway/backend and a seeded database. It does not mock API calls.

1. Start infrastructure and backend services.
2. Prepare and seed auth/masterdata data:

```bash
cd services/auth-service
npm run db:prepare
npm run db:seed

cd ../masterdata-service
npm run db:prepare
npm run db:seed
```

3. Run E2E from admin-web:

```bash
cd apps/admin-web
npm run test:e2e
```

Defaults:

- Admin web URL: `http://127.0.0.1:5175`
- Gateway URL: `http://127.0.0.1:3000`
- Admin username/password: `10000001` / `password`

Overrides:

```bash
E2E_GATEWAY_URL=http://127.0.0.1:3000 \
E2E_ADMIN_USERNAME=10000001 \
E2E_ADMIN_PASSWORD=password \
npm run test:e2e
```

If the gateway is not reachable or seed data is missing, the E2E test fails during preflight with a message pointing to the missing backend/seed step.
