const os = require('os');
const { spawn } = require('child_process');

const DEFAULT_GATEWAY_PORT = 3000;
const DEFAULT_EXPO_PORT = 8081;
const DEFAULT_NODE_MAX_OLD_SPACE_MB = 4096;

function isValidLanAddress(addressInfo) {
  if (!addressInfo) {
    return false;
  }

  if (addressInfo.family !== 'IPv4') {
    return false;
  }

  if (addressInfo.internal) {
    return false;
  }

  if (!addressInfo.address || addressInfo.address.startsWith('169.254.')) {
    return false;
  }

  return true;
}

function priorityOfInterface(interfaceName) {
  const normalizedName = interfaceName.toLowerCase();

  if (normalizedName.includes('wi-fi') || normalizedName.includes('wifi')) {
    return 0;
  }

  if (normalizedName.includes('ethernet') || normalizedName.startsWith('eth')) {
    return 1;
  }

  if (
    normalizedName.includes('vethernet') ||
    normalizedName.includes('virtual') ||
    normalizedName.includes('hyper-v') ||
    normalizedName.includes('wsl')
  ) {
    return 99;
  }

  return 10;
}

function resolveLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [interfaceName, records] of Object.entries(interfaces)) {
    if (!records || records.length === 0) {
      continue;
    }

    for (const record of records) {
      if (!isValidLanAddress(record)) {
        continue;
      }

      candidates.push({
        ip: record.address,
        score: priorityOfInterface(interfaceName),
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.score - b.score);
  return candidates[0].ip;
}

function normalizeBaseUrl(rawUrl) {
  return rawUrl.trim().replace(/\/+$/, '');
}

function resolveGatewayBaseUrl() {
  const explicitBaseUrl =
    process.env.EXPO_PUBLIC_GATEWAY_BASE_URL || process.env.GATEWAY_BASE_URL;

  if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
    return normalizeBaseUrl(explicitBaseUrl);
  }

  const lanIp = resolveLanIp();
  if (!lanIp) {
    return null;
  }

  return `http://${lanIp}:${DEFAULT_GATEWAY_PORT}`;
}

function run() {
  const gatewayBaseUrl = resolveGatewayBaseUrl();
  if (gatewayBaseUrl) {
    process.env.EXPO_PUBLIC_GATEWAY_BASE_URL = gatewayBaseUrl;
  }

  // Avoid blocking `expo start` when the CLI cannot reach Expo version endpoints
  // (common in restricted networks / unstable DNS / campus Wi-Fi).
  if (!process.env.EXPO_NO_DEPENDENCY_VALIDATION) {
    process.env.EXPO_NO_DEPENDENCY_VALIDATION = '1';
  }
  if (!process.env.EXPO_NO_DOCTOR) {
    process.env.EXPO_NO_DOCTOR = '1';
  }

  // Keep Metro scoped to this app; workspace-root mode can watch the whole monorepo
  // and trigger unstable watcher/OOM failures on Windows.
  if (!process.env.EXPO_NO_METRO_WORKSPACE_ROOT) {
    process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';
  }

  // Increase Node heap for Metro to reduce "process out of memory" crashes.
  const nodeOptions = process.env.NODE_OPTIONS ?? '';
  if (!/--max-old-space-size=\d+/i.test(nodeOptions)) {
    const separator = nodeOptions.trim().length > 0 ? ' ' : '';
    process.env.NODE_OPTIONS =
      `${nodeOptions}${separator}--max-old-space-size=${DEFAULT_NODE_MAX_OLD_SPACE_MB}`.trim();
  }

  const extraArgs = process.argv.slice(2);
  const hasHostArg = extraArgs.some(
    (arg) => arg === '--host' || arg.startsWith('--host='),
  );
  const hasPortArg = extraArgs.some(
    (arg) => arg === '--port' || arg.startsWith('--port='),
  );

  const expoArgs = [
    'expo',
    'start',
    ...(hasHostArg ? [] : ['--host', 'lan']),
    ...(hasPortArg ? [] : ['--port', String(DEFAULT_EXPO_PORT)]),
    ...extraArgs,
  ];

  if (extraArgs.includes('--print-config')) {
    console.log(
      JSON.stringify(
        {
          gatewayBaseUrl: process.env.EXPO_PUBLIC_GATEWAY_BASE_URL || null,
          nodeOptions: process.env.NODE_OPTIONS || null,
          noDoctor: process.env.EXPO_NO_DOCTOR || null,
          noDependencyValidation:
            process.env.EXPO_NO_DEPENDENCY_VALIDATION || null,
          noMetroWorkspaceRoot:
            process.env.EXPO_NO_METRO_WORKSPACE_ROOT || null,
          expoArgs,
        },
        null,
        2,
      ),
    );
    return;
  }

  const child = spawn('npx', expoArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[courier-mobile] Failed to start Expo:', error);
    process.exit(1);
  });
}

run();
