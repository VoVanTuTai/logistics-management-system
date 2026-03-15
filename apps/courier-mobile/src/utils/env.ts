export const appEnv = {
  gatewayBaseUrl:
    process.env.EXPO_PUBLIC_GATEWAY_BASE_URL ??
    process.env.GATEWAY_BASE_URL ??
    'http://localhost:3000',
  requestTimeoutMs: Number(
    process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS ??
      process.env.REQUEST_TIMEOUT_MS ??
      15000,
  ),
  courierId:
    process.env.EXPO_PUBLIC_COURIER_ID ??
    process.env.COURIER_ID ??
    'TODO_COURIER_ID',
} as const;
