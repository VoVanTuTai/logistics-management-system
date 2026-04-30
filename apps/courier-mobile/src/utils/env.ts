import { NativeModules, Platform } from 'react-native';

const DEFAULT_GATEWAY_PORT = 3000;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_COURIER_ID = '';
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);
const HOST_HINT_KEYS = new Set([
  'scriptURL',
  'bundleUrl',
  'hostUri',
  'debuggerHost',
  'linkingUri',
  'experienceUrl',
]);
const MAX_HOST_HINT_SCAN_DEPTH = 4;

function appendUnique(target: string[], value: string): void {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function resolveHostFromRuntimeValue(rawValue: string): string | null {
  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return null;
  }

  const normalizedInput = /^[a-z][a-z0-9+\-.]*:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `http://${trimmedValue}`;

  try {
    const parsedUrl = new URL(normalizedInput);
    return parsedUrl.hostname || null;
  } catch {
    const hostMatch = trimmedValue.match(/^([^/:?#]+)(?::\d+)?(?:[/?#]|$)/);
    return hostMatch?.[1] ?? null;
  }
}

function appendHostHint(target: string[], rawValue: string): void {
  const host = resolveHostFromRuntimeValue(rawValue);
  if (!host) {
    return;
  }

  appendUnique(target, host);
}

function scanHostHintsFromUnknown(
  value: unknown,
  target: string[],
  visited: Set<unknown>,
  depth: number,
): void {
  if (depth > MAX_HOST_HINT_SCAN_DEPTH || value === null || value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    appendHostHint(target, value);

    const trimmedValue = value.trim();
    if (
      trimmedValue.startsWith('{') &&
      trimmedValue.endsWith('}')
    ) {
      try {
        const parsedJson = JSON.parse(trimmedValue) as unknown;
        scanHostHintsFromUnknown(parsedJson, target, visited, depth + 1);
      } catch {
        // Ignore malformed JSON-like strings from native constants.
      }
    }
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (const child of value) {
      scanHostHintsFromUnknown(child, target, visited, depth + 1);
    }
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    if (HOST_HINT_KEYS.has(key) && typeof child === 'string') {
      appendHostHint(target, child);
    }
    scanHostHintsFromUnknown(child, target, visited, depth + 1);
  }
}

function collectRuntimeHosts(): string[] {
  const runtimeHosts: string[] = [];

  const sourceCodeModule = NativeModules.SourceCode as
    | { scriptURL?: string }
    | undefined;
  if (sourceCodeModule?.scriptURL) {
    appendHostHint(runtimeHosts, sourceCodeModule.scriptURL);
  }

  const nativeModulesRecord = NativeModules as Record<string, unknown>;
  const expoConstantsModule =
    nativeModulesRecord.ExpoConstants ?? nativeModulesRecord.ExponentConstants;
  if (expoConstantsModule) {
    scanHostHintsFromUnknown(
      expoConstantsModule,
      runtimeHosts,
      new Set<unknown>(),
      0,
    );
  }

  return runtimeHosts;
}

function appendGatewayCandidatesFromHost(target: string[], host: string): void {
  if (!LOCALHOST_HOSTS.has(host)) {
    appendUnique(target, `http://${host}:${DEFAULT_GATEWAY_PORT}`);
    return;
  }

  if (Platform.OS === 'android') {
    // Emulator aliases for host machine + local loopback options.
    appendUnique(target, `http://10.0.2.2:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(target, `http://10.0.3.2:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(target, `http://127.0.0.1:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(target, `http://localhost:${DEFAULT_GATEWAY_PORT}`);
    return;
  }

  appendUnique(target, `http://127.0.0.1:${DEFAULT_GATEWAY_PORT}`);
  appendUnique(target, `http://localhost:${DEFAULT_GATEWAY_PORT}`);
}

function appendConfiguredFallbackBaseUrls(target: string[]): void {
  const rawFallbackBaseUrls =
    process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS ??
    process.env.GATEWAY_FALLBACK_BASE_URLS;

  if (!rawFallbackBaseUrls) {
    return;
  }

  const configuredFallbackBaseUrls = rawFallbackBaseUrls.split(',');
  for (const configuredFallbackBaseUrl of configuredFallbackBaseUrls) {
    const normalizedBaseUrl = normalizeBaseUrl(configuredFallbackBaseUrl);
    if (normalizedBaseUrl.length > 0) {
      appendUnique(target, normalizedBaseUrl);
    }
  }
}

function resolveGatewayBaseUrls(): string[] {
  const gatewayBaseUrls: string[] = [];
  const configuredBaseUrl =
    process.env.EXPO_PUBLIC_GATEWAY_BASE_URL ?? process.env.GATEWAY_BASE_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
    appendUnique(gatewayBaseUrls, normalizeBaseUrl(configuredBaseUrl));
  }

  const runtimeHosts = collectRuntimeHosts();
  const nonLoopbackRuntimeHosts = runtimeHosts.filter(
    (host) => !LOCALHOST_HOSTS.has(host),
  );
  const loopbackRuntimeHosts = runtimeHosts.filter((host) =>
    LOCALHOST_HOSTS.has(host),
  );

  for (const host of nonLoopbackRuntimeHosts) {
    appendGatewayCandidatesFromHost(gatewayBaseUrls, host);
  }

  for (const host of loopbackRuntimeHosts) {
    appendGatewayCandidatesFromHost(gatewayBaseUrls, host);
  }

  appendConfiguredFallbackBaseUrls(gatewayBaseUrls);

  if (Platform.OS === 'android') {
    appendUnique(gatewayBaseUrls, `http://10.0.2.2:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(gatewayBaseUrls, `http://10.0.3.2:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(gatewayBaseUrls, `http://127.0.0.1:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(gatewayBaseUrls, `http://localhost:${DEFAULT_GATEWAY_PORT}`);
  } else {
    appendUnique(gatewayBaseUrls, `http://127.0.0.1:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(gatewayBaseUrls, `http://localhost:${DEFAULT_GATEWAY_PORT}`);
  }

  return gatewayBaseUrls;
}

const resolvedGatewayBaseUrls = resolveGatewayBaseUrls();

export const appEnv = {
  gatewayBaseUrl:
    resolvedGatewayBaseUrls[0] ?? `http://localhost:${DEFAULT_GATEWAY_PORT}`,
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
