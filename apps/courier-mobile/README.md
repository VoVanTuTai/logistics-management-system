# courier-mobile

Scaffold toi thieu cho app shipper/courier trong monorepo `NEXUS-logistics`.

## Scope

- Login qua `gateway-bff`
- Xem task list va task detail
- Scan pickup
- Scan hub inbound/outbound
- Delivery success voi POD upload qua gateway media endpoint va OTP field
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

- Mobile chi gọi `gateway-bff`
- Prefix client-facing la `/courier`
- Khong gọi truc tiep `scan-service`, `delivery-service`, `dispatch-service`
- Mobile khong tu suy dien `current_status` hay `current_location`
- Scan/delivery actions tu tao `idempotencyKey` o client de ho tro replay an toan

## Contract Notes

- Gateway path raw hien tai su dung:
  - `/courier/auth/auth/*`
  - `/courier/dispatch/tasks`
  - `/courier/scan/scans/*`
  - `/courier/delivery/deliveries/*`
  - `/courier/delivery/ndr`
- `courierId` de query task uu tien username dang nhap. `EXPO_PUBLIC_COURIER_ID`
  chi la fallback dev/test khi chua co session. Backend seed dung ma nhan vien
  8 so, vi du `30000001`.
- POD upload di qua `GET /courier/media/upload-url`, sau do app PUT anh len object storage va gui public URL vao delivery success.
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
- Khi gọi gateway cho scan/delivery, app gui ca payload `idempotencyKey` va header `Idempotency-Key`
- Queue worker khong tu orchestration workflow, chi resend command len gateway

## Env

Sao chep `.env.example` thanh `.env` hoac env file phu hop voi runtime:

```env
EXPO_PUBLIC_GATEWAY_BASE_URL=http://103.179.172.53:13000
EXPO_PUBLIC_REQUEST_TIMEOUT_MS=15000
EXPO_PUBLIC_COURIER_ID=30000001
```

Neu bo trong `EXPO_PUBLIC_GATEWAY_BASE_URL`, app se tu detect host tu `scriptURL`
(`exp://...`, `http://...`, `https://...`) va gan vao `:3000`.

Khuyen nghi van set ro `EXPO_PUBLIC_GATEWAY_BASE_URL` thanh LAN IP/server URL
de tranh sai host tren runtime khac nhau:

```env
EXPO_PUBLIC_GATEWAY_BASE_URL=http://103.179.172.53:13000
```

Luu y:
- Thiet bi that khong truy cap duoc `localhost` cua may dev.
- Android emulator can backend local qua `http://10.0.2.2:3000`.

## Accounts

Dung tai khoan courier that da ton tai trong auth-service.

## Run Notes

- Scaffold nay chua dong gọi `package.json`/native wiring vi yeu cau hien tai chi cho phep tao cac file trong `src/*`, `README.md`, `.env.example`.
- Sau khi package manager/runtime duoc bo sung, can cai toi thieu:
  - `react-navigation`
  - `zustand`
  - `@tanstack/react-query`
  - `react-hook-form`
  - `zod`
  - `@react-native-async-storage/async-storage`

## Build APK de cai tren dien thoai Android

Project da co `eas.json` voi profile `preview` de xuat file `.apk`.

1. Cai dependency neu may chua co:

```bash
cd apps/courier-mobile
npm install
```

2. Tao file `.env` tu `.env.example` va doi gateway sang IP public/domain ma dien thoai truy cap duoc:

```env
EXPO_PUBLIC_GATEWAY_BASE_URL=http://103.179.172.53:13000
EXPO_PUBLIC_REQUEST_TIMEOUT_MS=15000
EXPO_PUBLIC_COURIER_ID=30000001
```

Khong dung `localhost` khi cai APK len dien thoai that, vi `localhost` luc do la chinh dien thoai.
Neu dung URL `http://...` thay vi HTTPS, app Android can `usesCleartextTraffic`
trong `app.json`.

3. Dang nhap Expo va link project EAS lan dau:

```bash
npx eas-cli login
npx eas-cli build:configure
```

Neu EAS hoi tao project moi, chon yes. Lenh nay co the them `extra.eas.projectId`
vao `app.json`.

4. Build APK:

```bash
npx eas-cli build --platform android --profile preview
```

Khi build xong, EAS se hien link download. Mo link do tren dien thoai Android,
tai file `.apk`, cho phep cai app tu trinh duyet/file manager neu may hoi, roi cai dat.

Neu muon cai qua USB:

```bash
adb install path/to/courier-mobile.apk
```

Build de day Google Play nen dung profile `production`, mac dinh xuat `.aab`:

```bash
npx eas-cli build --platform android --profile production
```

## Next Safe Steps

- Chot BFF contract rieng cho courier mobile thay vi proxy raw path
- Bo sung upload adapter cho POD
- Bo sung refresh-token flow va online/offline listener
- Viet unit test cho `api client`, `offline queue`, `auth session`
