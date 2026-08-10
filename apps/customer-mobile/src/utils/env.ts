import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_GATEWAY_PORT = 3000;
const DEFAULT_PUBLIC_GATEWAY_BASE_URL = 'http://222.255.181.210:13000';
const DEFAULT_TIMEOUT_MS = 15000;
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
  if (!trimmedValue) return null;

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
  if (host) {
    appendUnique(target, host);
  }
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
    if (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) {
      try {
        const parsedJson = JSON.parse(trimmedValue) as unknown;
        scanHostHintsFromUnknown(parsedJson, target, visited, depth + 1);
      } catch {
        // Ignore malformed JSON
      }
    }
    return;
  }

  if (typeof value !== 'object') return;
  if (visited.has(value)) return;
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

  // Extract from Expo Constants (Expo Go host IP)
  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.debuggerHost || (Constants.manifest2 as any)?.extra?.expoGo?.developer?.tool;
  if (hostUri) {
    appendHostHint(runtimeHosts, hostUri);
  }

  const sourceCodeModule = NativeModules.SourceCode as { scriptURL?: string } | undefined;
  if (sourceCodeModule?.scriptURL) {
    appendHostHint(runtimeHosts, sourceCodeModule.scriptURL);
  }

  const nativeModulesRecord = NativeModules as Record<string, unknown>;
  const expoConstantsModule = nativeModulesRecord.ExpoConstants ?? nativeModulesRecord.ExponentConstants;
  if (expoConstantsModule) {
    scanHostHintsFromUnknown(expoConstantsModule, runtimeHosts, new Set<unknown>(), 0);
  }

  return runtimeHosts;
}

function appendGatewayCandidatesFromHost(target: string[], host: string): void {
  if (!LOCALHOST_HOSTS.has(host)) {
    appendUnique(target, `http://${host}:${DEFAULT_GATEWAY_PORT}`);
    return;
  }

  if (Platform.OS === 'android') {
    appendUnique(target, `http://10.0.2.2:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(target, `http://10.0.3.2:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(target, `http://127.0.0.1:${DEFAULT_GATEWAY_PORT}`);
    appendUnique(target, `http://localhost:${DEFAULT_GATEWAY_PORT}`);
    return;
  }

  appendUnique(target, `http://127.0.0.1:${DEFAULT_GATEWAY_PORT}`);
  appendUnique(target, `http://localhost:${DEFAULT_GATEWAY_PORT}`);
}

function resolveGatewayBaseUrls(): string[] {
  const gatewayBaseUrls: string[] = [];
  const configuredBaseUrl = process.env.EXPO_PUBLIC_GATEWAY_BASE_URL ?? process.env.GATEWAY_BASE_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim().length > 0) {
    appendUnique(gatewayBaseUrls, normalizeBaseUrl(configuredBaseUrl));
  }

  const runtimeHosts = collectRuntimeHosts();
  const nonLoopbackRuntimeHosts = runtimeHosts.filter((host) => !LOCALHOST_HOSTS.has(host));
  const loopbackRuntimeHosts = runtimeHosts.filter((host) => LOCALHOST_HOSTS.has(host));

  for (const host of nonLoopbackRuntimeHosts) {
    appendGatewayCandidatesFromHost(gatewayBaseUrls, host);
  }

  for (const host of loopbackRuntimeHosts) {
    appendGatewayCandidatesFromHost(gatewayBaseUrls, host);
  }

  appendUnique(gatewayBaseUrls, DEFAULT_PUBLIC_GATEWAY_BASE_URL);

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
  gatewayBaseUrl: resolvedGatewayBaseUrls[0] ?? DEFAULT_PUBLIC_GATEWAY_BASE_URL,
  gatewayFallbackBaseUrls: resolvedGatewayBaseUrls.slice(1),
  requestTimeoutMs: Number(
    process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS ??
    process.env.REQUEST_TIMEOUT_MS ??
    DEFAULT_TIMEOUT_MS,
  ),
} as const;
