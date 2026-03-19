const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';
const requestTimeoutMs = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? '15000');

export const appEnv = {
  gatewayBaseUrl,
  requestTimeoutMs,
} as const;
