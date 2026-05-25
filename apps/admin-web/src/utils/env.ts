const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';
const requestTimeoutMs = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? '15000');
const allowPermissionPrototypeFallback =
  import.meta.env.VITE_ALLOW_PERMISSION_PROTOTYPE_FALLBACK === 'true';

export const appEnv = {
  gatewayBaseUrl,
  requestTimeoutMs,
  allowPermissionPrototypeFallback,
} as const;
