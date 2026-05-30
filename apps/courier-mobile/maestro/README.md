# Courier Mobile Maestro Smoke

This flow verifies the shortest real UI path on an installed Android APK:

- login as a courier
- open the `Quét mã` tab
- dispatch one delivery shipment
- create one issue/NDR
- register return from that issue

## Prerequisites

Build/install the preview APK with a gateway URL reachable from the device.
Do not use `localhost` for a physical device.

Example `.env` before building:

```env
EXPO_PUBLIC_GATEWAY_BASE_URL=http://YOUR_LAN_OR_PUBLIC_GATEWAY:3000
EXPO_PUBLIC_REQUEST_TIMEOUT_MS=15000
EXPO_PUBLIC_COURIER_ID=30009991
```

Seed deterministic test data without consuming the workflow:

```bash
node scripts/courier-mobile-e2e.js --seed-only
```

Then run Maestro:

```bash
COURIER_E2E_USERNAME=30009991 \
COURIER_E2E_PASSWORD=password \
maestro test apps/courier-mobile/maestro/courier-mobile-smoke.yaml
```

If running against a remote gateway, set `COURIER_E2E_GATEWAY_URL` or
`GATEWAY_URL` before seed so the seeded users/hubs match the backend used by
the APK.
