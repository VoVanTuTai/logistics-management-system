const http = require('http');
const net = require('net');
const os = require('os');
const { spawn } = require('child_process');

const DEFAULT_PORT = 8081;
const DEFAULT_GATEWAY_BASE_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = '15000';
const DEFAULT_COURIER_ID = '30000001';
const DEFAULT_NODE_MAX_OLD_SPACE_MB = 4096;

function parseArgs(argv) {
  const lanIp = resolveLanIp();
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
      continue;
    }

    if (arg.startsWith('--courier-id=')) {
      options.courierId = arg.slice('--courier-id='.length).trim() || options.courierId;
    }
  }

  if (!options.gateway) {
    options.gateway =
      options.mode === 'native' && options.lanIp
        ? `http://${options.lanIp}:3000`
        : DEFAULT_GATEWAY_BASE_URL;
  }

  options.gateway = normalizeBaseUrl(options.gateway);
  return options;
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

  if (normalizedName.includes('wi-fi') || normalizedName.includes('wifi')) {
    return 0;
  }

  if (normalizedName.includes('ethernet') || normalizedName.startsWith('eth')) {
    return 1;
  }

  if (
    normalizedName.includes('virtual') ||
    normalizedName.includes('vethernet') ||
    normalizedName.includes('hyper-v') ||
    normalizedName.includes('wsl')
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
  process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS = [
    process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS,
    options.lanIp ? `http://${options.lanIp}:3000` : null,
    'http://10.0.2.2:3000',
    'http://10.0.3.2:3000',
    'http://localhost:3000',
  ]
    .filter(Boolean)
    .join(',');
  process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS =
    process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS;
  process.env.EXPO_PUBLIC_COURIER_ID = options.courierId;
  process.env.EXPO_PUBLIC_ALLOW_ALL_COURIER_MOBILE_PERMISSIONS_FOR_TESTING =
    process.env.EXPO_PUBLIC_ALLOW_ALL_COURIER_MOBILE_PERMISSIONS_FOR_TESTING || 'true';
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
  const options = parseArgs(process.argv.slice(2));
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

  if (options.mode === 'native' && options.host !== 'tunnel' && await checkTcpPort(options.port)) {
    console.log(`[courier-test] Port ${options.port} is already in use.`);
    console.log('[courier-test] Stop the old Metro session or pass a different port:');
    console.log(`  lsof -tiTCP:${options.port} -sTCP:LISTEN | xargs kill`);
    console.log(`  pnpm --dir apps/courier-mobile run test:qr -- --port=8082 --clear`);
    return;
  }

  if (options.mode === 'web' && await checkHttpServer(localUrl)) {
    console.log(`[courier-test] Courier mobile is already running: ${localUrl}`);
    console.log(`[courier-test] Gateway: ${process.env.EXPO_PUBLIC_GATEWAY_BASE_URL}`);
    if (options.open) {
      openUrl(localUrl);
    }
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
    console.log('[courier-test] Scan the QR with Expo Go on the same network.');
    if (options.host === 'lan') {
      console.log(`[courier-test] Metro LAN host: ${options.lanIp ?? 'not found'}`);
    }
    if (options.host === 'tunnel') {
      console.log('[courier-test] Metro host: Expo tunnel');
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
