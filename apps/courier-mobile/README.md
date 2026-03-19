# courier-mobile

Scaffold toi thieu cho app shipper/courier trong monorepo `jms-logistics`.

## Scope

- Login qua `gateway-bff`
- Xem task list va task detail
- Scan pickup
- Scan hub inbound/outbound
- Delivery success voi POD/OTP placeholder
- Delivery fail voi NDR/next action flag
- Offline queue retry cho scan va delivery actions co `idempotencyKey`

## Architecture

App duoc scaffold theo huong feature-first, tach ro:

- `src/app`: app entry va provider bootstrap
- `src/navigation`: auth flow + main tab/stack
- `src/screens`: UI skeleton theo use case
- `src/features`: auth/tasks/scan/delivery/offline facade
- `src/services/api`: HTTP client va endpoint map
- `src/store`: Zustand app store + TanStack Query client
- `src/offline`: queue storage/worker
- `src/types`, `src/utils`: type chung va helper

## API Boundary

- Mobile chi goi `gateway-bff`
- Prefix client-facing la `/courier`
- Khong goi truc tiep `scan-service`, `delivery-service`, `dispatch-service`
- Mobile khong tu suy dien `current_status` hay `current_location`
- Scan/delivery actions tu tao `idempotencyKey` o client de ho tro replay an toan

## Contract Notes

- Gateway path raw hien tai su dung:
  - `/courier/auth/auth/*`
  - `/courier/dispatch/tasks`
  - `/courier/scan/scans/*`
  - `/courier/delivery/deliveries/*`
  - `/courier/delivery/ndr`
- `courierId` de query task chua duoc suy ra chac chan tu auth contract.
  Hien tai app dung `EXPO_PUBLIC_COURIER_ID` placeholder.
- POD upload contract chua ro. Hien tai UI chi gui `podImageUrl` string placeholder.
- `delivery attempts` chua dua vao offline queue vi contract hien tai chua co `idempotencyKey`.

## Offline Queue

- Storage: `AsyncStorage`
- Queueable actions:
  - `SCAN_PICKUP`
  - `SCAN_INBOUND`
  - `SCAN_OUTBOUND`
  - `DELIVERY_SUCCESS`
  - `DELIVERY_FAIL`
- Retry giu nguyen `idempotencyKey`
- Khi goi gateway cho scan/delivery, app gui ca payload `idempotencyKey` va header `Idempotency-Key`
- Queue worker khong tu orchestration workflow, chi resend command len gateway

## Env

Sao chep `.env.example` thanh `.env` hoac env file phu hop voi runtime:

```env
EXPO_PUBLIC_GATEWAY_BASE_URL=http://localhost:3000
EXPO_PUBLIC_REQUEST_TIMEOUT_MS=15000
EXPO_PUBLIC_COURIER_ID=TODO_COURIER_ID
```

## Run Notes

- Scaffold nay chua dong goi `package.json`/native wiring vi yeu cau hien tai chi cho phep tao cac file trong `src/*`, `README.md`, `.env.example`.
- Sau khi package manager/runtime duoc bo sung, can cai toi thieu:
  - `react-navigation`
  - `zustand`
  - `@tanstack/react-query`
  - `react-hook-form`
  - `zod`
  - `@react-native-async-storage/async-storage`

## Next Safe Steps

- Chot BFF contract rieng cho courier mobile thay vi proxy raw path
- Bo sung upload adapter cho POD
- Bo sung refresh-token flow va online/offline listener
- Viet unit test cho `api client`, `offline queue`, `auth session`
