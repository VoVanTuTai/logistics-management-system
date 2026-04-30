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
