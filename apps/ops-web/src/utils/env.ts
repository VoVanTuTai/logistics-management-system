const gatewayBaseUrl = import.meta.env.VITE_GATEWAY_BFF_URL ?? '';
const requestTimeoutMs = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? '15000');
const enableFullOpsModules =
  (import.meta.env.VITE_ENABLE_FULL_OPS_MODULES ?? 'true') !== 'false';
const dispatchTasksWsUrl = resolveDispatchTasksWsUrl();
const chatWsUrl = resolveChatWsUrl();

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

function resolveChatWsUrl(): string {
  const configuredUrl = import.meta.env.VITE_CHAT_WS_URL ?? '';
  if (configuredUrl.trim()) {
    return configuredUrl.trim();
  }

  if (gatewayBaseUrl.trim()) {
    try {
      const gatewayUrl = new URL(gatewayBaseUrl);
      gatewayUrl.protocol = gatewayUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      gatewayUrl.pathname = '/ws/chat';
      gatewayUrl.search = '';
      gatewayUrl.hash = '';
      return gatewayUrl.toString();
    } catch {
      // Fall through to same-origin websocket for relative gateway configs.
    }
  }

  if (typeof window === 'undefined') {
    return 'ws://127.0.0.1:5173/ws/chat';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws/chat`;
}

export const appEnv = {
  gatewayBaseUrl,
  requestTimeoutMs,
  enableFullOpsModules,
  dispatchTasksWsUrl,
  chatWsUrl,
} as const;
