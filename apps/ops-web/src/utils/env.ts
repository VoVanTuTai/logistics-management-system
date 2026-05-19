const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';
const requestTimeoutMs = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? '15000');
const enableFullOpsModules =
  (import.meta.env.VITE_ENABLE_FULL_OPS_MODULES ?? 'true') !== 'false';
const dispatchTasksWsUrl = resolveDispatchTasksWsUrl();

function resolveDispatchTasksWsUrl(): string {
  const configuredUrl =
    import.meta.env.VITE_DISPATCH_TASKS_WS_URL ??
    import.meta.env.VITE_DISPATCH_WS_URL ??
    '';
  if (configuredUrl.trim()) {
    return configuredUrl.trim();
  }

  if (typeof window === 'undefined') {
    return 'ws://127.0.0.1:5173/ws/tasks';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws/tasks`;
}

export const appEnv = {
  gatewayBaseUrl,
  requestTimeoutMs,
  enableFullOpsModules,
  dispatchTasksWsUrl,
} as const;
