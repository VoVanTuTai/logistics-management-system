const rawGatewayBaseUrl = (import.meta.env.VITE_GATEWAY_BFF_URL ?? '').trim();
const gatewayBaseUrl = resolveGatewayBaseUrl();

function resolveGatewayBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'admin.nexus-ex.site') {
      return '';
    }
    if (window.location.protocol === 'https:' && rawGatewayBaseUrl.startsWith('http://')) {
      return '';
    }
  }
  return rawGatewayBaseUrl;
}
const requestTimeoutMs = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? '15000');
const allowPermissionPrototypeFallback =
  import.meta.env.VITE_ALLOW_PERMISSION_PROTOTYPE_FALLBACK === 'true';

export const appEnv = {
  gatewayBaseUrl,
  requestTimeoutMs,
  allowPermissionPrototypeFallback,
} as const;
