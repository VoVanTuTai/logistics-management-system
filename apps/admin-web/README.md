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

## Seeded admin account

- username: `admin.root`
- password: `admin123456`
- roles: `SYSTEM_ADMIN`, `OPS_ADMIN`
