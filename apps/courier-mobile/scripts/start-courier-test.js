const http = require('http');
const net = require('net');
const os = require('os');
const { spawn } = require('child_process');

const DEFAULT_PORT = 8081;
const DEFAULT_GATEWAY_BASE_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = '15000';
const DEFAULT_COURIER_ID = '30000001';
const DEFAULT_NODE_MAX_OLD_SPACE_MB = 4096;

function loadDotEnvFile() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim().replace(/^\uFEFF/, '');
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const lanIp = resolveLanIp();
  let hasExplicitGateway = false;
  const options = {
    port: DEFAULT_PORT,
    host: 'localhost',
    gateway: process.env.EXPO_PUBLIC_GATEWAY_BASE_URL || '',
    courierId: process.env.EXPO_PUBLIC_COURIER_ID || DEFAULT_COURIER_ID,
    mode: 'web',
    open: false,
    clear: false,
    lanIp,
    printConfig: false,
  };

  for (const arg of argv) {
    if (arg === '--qr' || arg === '--native') {
      options.mode = 'native';
      continue;
    }

    if (arg === '--tunnel') {
      options.mode = 'native';
      options.host = 'tunnel';
      continue;
    }

    if (arg === '--web') {
      options.mode = 'web';
      continue;
    }

    if (arg === '--open') {
      options.open = true;
      continue;
    }

    if (arg === '--clear' || arg === '--reset-cache') {
      options.clear = true;
      continue;
    }

    if (arg === '--print-config') {
      options.printConfig = true;
      continue;
    }

    if (arg === '--lan') {
      options.host = 'lan';
      continue;
    }

    if (arg.startsWith('--host=')) {
      options.host = arg.slice('--host='.length).trim() || options.host;
      continue;
    }

    if (arg.startsWith('--port=')) {
      const parsedPort = Number(arg.slice('--port='.length));
      if (Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
        options.port = parsedPort;
      }
      continue;
    }

    if (arg.startsWith('--gateway=')) {
      options.gateway = normalizeBaseUrl(arg.slice('--gateway='.length));
      hasExplicitGateway = true;
      continue;
    }

    if (arg.startsWith('--courier-id=')) {
      options.courierId = arg.slice('--courier-id='.length).trim() || options.courierId;
    }
  }

  if (!hasExplicitGateway && options.lanIp) {
    if (
      !options.gateway ||
      (isPrivateOrLocalUrl(options.gateway) && !options.gateway.includes(options.lanIp))
    ) {
      options.gateway = `http://${options.lanIp}:3000`;
    }
  }

  if (!options.gateway) {
    options.gateway = DEFAULT_GATEWAY_BASE_URL;
  }

  options.gateway = normalizeBaseUrl(options.gateway);
  return options;
}

function isPrivateOrLocalUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
    if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

function isValidLanAddress(addressInfo) {
  return (
    addressInfo &&
    addressInfo.family === 'IPv4' &&
    !addressInfo.internal &&
    addressInfo.address &&
    !addressInfo.address.startsWith('169.254.')
  );
}

function priorityOfInterface(interfaceName) {
  const normalizedName = interfaceName.toLowerCase();

  // Primary Wi-Fi interfaces across OSes (macOS: en0, Linux: wlan0/wlp, Windows: Wi-Fi/wlan)
  if (
    normalizedName === 'en0' ||
    normalizedName.includes('wi-fi') ||
    normalizedName.includes('wifi') ||
    normalizedName.startsWith('wlan') ||
    normalizedName.startsWith('wlp')
  ) {
    return 0;
  }

  // Secondary Wi-Fi or primary Ethernet (macOS: en1, Linux/Windows: eth0, ethernet)
  if (
    normalizedName === 'en1' ||
    normalizedName.includes('ethernet') ||
    normalizedName.startsWith('eth') ||
    normalizedName.startsWith('enp')
  ) {
    return 1;
  }

  if (normalizedName.startsWith('en')) {
    return 2;
  }

  // Virtual / VPN / Docker / WSL / Apple Wireless Direct Link / Tunnel
  if (
    normalizedName.includes('virtual') ||
    normalizedName.includes('vethernet') ||
    normalizedName.includes('hyper-v') ||
    normalizedName.includes('wsl') ||
    normalizedName.includes('docker') ||
    normalizedName.includes('vbox') ||
    normalizedName.includes('vmware') ||
    normalizedName.startsWith('utun') ||
    normalizedName.startsWith('tun') ||
    normalizedName.startsWith('tap') ||
    normalizedName.startsWith('bridge') ||
    normalizedName.startsWith('awdl') ||
    normalizedName.startsWith('llw')
  ) {
    return 99;
  }

  return 10;
}

function resolveLanIp() {
  const candidates = [];
  const interfaces = os.networkInterfaces();

  for (const [interfaceName, records] of Object.entries(interfaces)) {
    for (const record of records ?? []) {
      if (!isValidLanAddress(record)) {
        continue;
      }

      candidates.push({
        ip: record.address,
        score: priorityOfInterface(interfaceName),
      });
    }
  }

  candidates.sort((left, right) => left.score - right.score);
  return candidates[0]?.ip ?? null;
}

function normalizeBaseUrl(rawUrl) {
  return rawUrl.trim().replace(/\/+$/, '');
}

function buildLocalUrl(port) {
  return `http://localhost:${port}`;
}

function checkHttpServer(url) {
  return new Promise((resolve) => {
    const request = http.request(url, { method: 'HEAD', timeout: 800 }, (response) => {
      response.resume();
      resolve(response.statusCode && response.statusCode < 500);
    });

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => {
      resolve(false);
    });

    request.end();
  });
}

function checkTcpPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });

    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });
}

function checkPortAvailable(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ port, host, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function isPortFree(port) {
  const freeAll = await checkPortAvailable(port, '0.0.0.0');
  if (!freeAll) return false;
  const freeLocal = await checkPortAvailable(port, '127.0.0.1');
  return freeLocal;
}

async function findAvailablePort(startPort, step = 2, maxAttempts = 30) {
  let port = startPort;
  for (let i = 0; i < maxAttempts; i++) {
    if (await isPortFree(port)) {
      return port;
    }
    port += step;
  }
  for (let p = startPort + 1; p < startPort + maxAttempts; p++) {
    if (await isPortFree(p)) {
      return p;
    }
  }
  return startPort;
}

async function waitForServer(url, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await checkHttpServer(url)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

function openUrl(url) {
  const command =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'cmd'
        : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  child.unref();
}

function applyEnv(options) {
  process.env.EXPO_PUBLIC_GATEWAY_BASE_URL = options.gateway;
  process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS =
    process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS || '';
  process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS =
    process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS;
  process.env.EXPO_PUBLIC_COURIER_ID = options.courierId;
  process.env.EXPO_PUBLIC_ALLOW_ALL_COURIER_MOBILE_PERMISSIONS_FOR_TESTING =
    process.env.EXPO_PUBLIC_ALLOW_ALL_COURIER_MOBILE_PERMISSIONS_FOR_TESTING || 'false';
  process.env.EXPO_NO_DEPENDENCY_VALIDATION =
    process.env.EXPO_NO_DEPENDENCY_VALIDATION || '1';
  process.env.EXPO_NO_DOCTOR = process.env.EXPO_NO_DOCTOR || '1';
  process.env.EXPO_NO_METRO_WORKSPACE_ROOT =
    process.env.EXPO_NO_METRO_WORKSPACE_ROOT || '1';
  process.env.BROWSER = process.env.BROWSER || 'none';

  if (options.mode === 'native' && options.host === 'lan' && options.lanIp) {
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME = options.lanIp;
  }

  const nodeOptions = process.env.NODE_OPTIONS || '';
  if (!/--max-old-space-size=\d+/i.test(nodeOptions)) {
    const separator = nodeOptions.trim().length > 0 ? ' ' : '';
    process.env.NODE_OPTIONS =
      `${nodeOptions}${separator}--max-old-space-size=${DEFAULT_NODE_MAX_OLD_SPACE_MB}`.trim();
  }
}

async function run() {
  loadDotEnvFile();

  const options = parseArgs(process.argv.slice(2));

  if (options.mode === 'native' && options.host !== 'tunnel') {
    const isBusy = !(await isPortFree(options.port));
    if (isBusy) {
      const originalPort = options.port;
      const nextPort = await findAvailablePort(originalPort, 2);
      console.log(`[courier-test] ⚡ Cổng ${originalPort} đang bận.`);
      console.log(`[courier-test] 🔄 Đã tự động chuyển sang cổng khả dụng: ${nextPort}`);
      options.port = nextPort;
    }
  }

  if (options.mode === 'web') {
    const isBusy = !(await isPortFree(options.port));
    if (isBusy) {
      const testUrl = buildLocalUrl(options.port);
      if (await checkHttpServer(testUrl)) {
        console.log(`[courier-test] Courier mobile is already running: ${testUrl}`);
        console.log(`[courier-test] Gateway: ${options.gateway}`);
        if (options.open) {
          openUrl(testUrl);
        }
        return;
      }
      const originalPort = options.port;
      const nextPort = await findAvailablePort(originalPort, 2);
      console.log(`[courier-test] ⚡ Cổng ${originalPort} đang bận bởi dịch vụ khác.`);
      console.log(`[courier-test] 🔄 Đã tự động chuyển sang cổng khả dụng: ${nextPort}`);
      options.port = nextPort;
    }
  }

  const localUrl = buildLocalUrl(options.port);
  applyEnv(options);

  if (options.printConfig) {
    console.log(
      JSON.stringify(
        {
          mode: options.mode,
          host: options.host,
          port: options.port,
          lanIp: options.lanIp,
          metroUrl:
            options.host === 'lan' && options.lanIp
              ? `exp://${options.lanIp}:${options.port}`
              : options.host === 'tunnel'
                ? 'Expo tunnel URL'
              : buildLocalUrl(options.port),
          gatewayBaseUrl: process.env.EXPO_PUBLIC_GATEWAY_BASE_URL,
          gatewayFallbackBaseUrls:
            process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS,
          allowAllCourierMobilePermissionsForTesting:
            process.env.EXPO_PUBLIC_ALLOW_ALL_COURIER_MOBILE_PERMISSIONS_FOR_TESTING,
          reactNativePackagerHostname:
            process.env.REACT_NATIVE_PACKAGER_HOSTNAME ?? null,
        },
        null,
        2,
      ),
    );
    return;
  }

  const expoArgs = [
    'expo',
    'start',
    '--host',
    options.host,
    '--port',
    String(options.port),
  ];

  if (options.mode === 'web') {
    expoArgs.splice(2, 0, '--web');
  }

  if (options.clear) {
    expoArgs.push('--clear');
  }

  if (options.mode === 'web') {
    console.log(`[courier-test] Starting courier mobile web at ${localUrl}`);
  } else {
    console.log('[courier-test] Starting Expo native QR session');
    if (options.host === 'lan') {
      console.log('[courier-test] Scan the QR with Expo Go on the same network.');
      console.log(`[courier-test] Metro LAN host: ${options.lanIp ?? 'not found'}`);
    }
    if (options.host === 'tunnel') {
      console.log('[courier-test] Metro host: Expo tunnel');
      console.log('[courier-test] Scan the QR with Expo Go from any network.');
    }
  }
  console.log(`[courier-test] Gateway: ${process.env.EXPO_PUBLIC_GATEWAY_BASE_URL}`);
  if (options.mode === 'web') {
    console.log('[courier-test] Tip: add --open to open the browser automatically.');
  }

  const child = spawn('npx', expoArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  if (options.mode === 'web' && options.open) {
    void waitForServer(localUrl).then((ready) => {
      if (ready) {
        openUrl(localUrl);
      }
    });
  }

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[courier-test] Failed to start Expo:', error.message);
    process.exit(1);
  });
}

void run();
