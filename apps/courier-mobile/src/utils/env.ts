import { NativeModules, Platform } from 'react-native';

const DEFAULT_GATEWAY_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_COURIER_ID = 'CR001';
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOOPBACK_FALLBACKS = [
  `http://10.0.2.2:${DEFAULT_GATEWAY_PORT}`,
  `http://localhost:${DEFAULT_GATEWAY_PORT}`,
];

function resolveHostFromScriptUrl(scriptUrl: string): string | null {
  if (!scriptUrl) {
    return null;
  }

  const hostMatch = scriptUrl.match(/^[a-z][a-z0-9+\-.]*:\/\/([^/:?#]+)/i);

  return hostMatch?.[1] ?? null;
}

function normalizeHostForRuntime(host: string): string {
  if (!LOCALHOST_HOSTS.has(host)) {
    return host;
  }

  if (Platform.OS === 'android') {
    // Android emulator cannot reach host machine via localhost.
    return '10.0.2.2';
  }

  return '127.0.0.1';
}

function appendUnique(target: string[], value: string): void {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function resolveGatewayBaseUrls(): string[] {
  const gatewayBaseUrls: string[] = [];
  const configuredBaseUrl =
    process.env.EXPO_PUBLIC_GATEWAY_BASE_URL ?? process.env.GATEWAY_BASE_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
    appendUnique(gatewayBaseUrls, configuredBaseUrl.replace(/\/+$/, ''));
  }

  // Fallback cho Expo dev runtime: lay host tu JS bundle URL.
  const sourceCode = NativeModules.SourceCode as { scriptURL?: string } | undefined;
  const scriptUrl = sourceCode?.scriptURL ?? '';
  const host = resolveHostFromScriptUrl(scriptUrl);
  if (host) {
    appendUnique(
      gatewayBaseUrls,
      `http://${normalizeHostForRuntime(host)}:${DEFAULT_GATEWAY_PORT}`,
    );
  }

  for (const fallbackBaseUrl of LOOPBACK_FALLBACKS) {
    if (Platform.OS === 'android' || !fallbackBaseUrl.includes('10.0.2.2')) {
      appendUnique(gatewayBaseUrls, fallbackBaseUrl);
    }
  }

  return gatewayBaseUrls;
}

const resolvedGatewayBaseUrls = resolveGatewayBaseUrls();

export const appEnv = {
  gatewayBaseUrl: resolvedGatewayBaseUrls[0] ?? `http://localhost:${DEFAULT_GATEWAY_PORT}`,
  gatewayFallbackBaseUrls: resolvedGatewayBaseUrls.slice(1),
  requestTimeoutMs: Number(
    process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS ??
      process.env.REQUEST_TIMEOUT_MS ??
      DEFAULT_TIMEOUT_MS,
  ),
  courierId:
    process.env.EXPO_PUBLIC_COURIER_ID ??
    process.env.COURIER_ID ??
    DEFAULT_COURIER_ID,
} as const;
