# ops-web

Minimal production-oriented scaffold for Ops/Operation Staff in `jms-logistics`.

## Scope

- Shipment operations management
- Pickup request approvals
- Task assign/reassign
- Manifest create/seal/receive
- Hub scan inbound/outbound
- NDR handling, reschedule, return decision
- Operational KPI dashboard
- Internal tracking lookup

## Architecture

- Feature-first structure under `src/features/*`
- Route/page layer under `src/pages/*`
- Shared API client in `src/services/api/*`
- Server state with TanStack Query
- App/UI state with Zustand
- Forms with react-hook-form and zod where validation is needed

## API Boundary

- Frontend calls `gateway-bff` only
- Ops-facing API prefix expected: `/ops/*`
- No direct calls from frontend to shipment/pickup/dispatch/manifest/scan/delivery/tracking/reporting services
- Frontend does not infer `current_status` or `current_location`; values are displayed from API payload

## Auth/Session

- Session is persisted in localStorage (`ops-web.auth-session`)
- `App` hydrates session at bootstrap
- TODO(contract): confirm final auth endpoints exposed by `/ops`

## Notes

- Current repo state has empty `package.json`, `vite.config.ts`, and `tsconfig.json` for `ops-web`.
- This scaffold is intentionally limited to allowed files:
  - `src/app/*`
  - `src/navigation/*`
  - `src/pages/*`
  - `src/features/*`
  - `src/services/api/*`
  - `src/store/*`
  - `src/types/*`
  - `src/utils/*`
  - `README.md`
  - `.env.example`
- Entry wiring from `src/main.tsx` to `src/app/bootstrap.tsx` is still pending.

