const os = require('os');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_VPS_GATEWAY_PORT = 13000;
const DEFAULT_LOCAL_GATEWAY_PORT = 3000;
const DEFAULT_PUBLIC_GATEWAY_BASE_URL = 'http://localhost:3000';
const DEFAULT_EXPO_PORT = 8082;
const DEFAULT_PORT_STEP = 2; // Keep even ports (8082, 8084, 8086...) to prevent collision with courier-mobile (8081, 8083, 8085...)
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
    normalizedName.includes('vethernet') ||
    normalizedName.includes('virtual') ||
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

function extractGatewayFromArgs(args) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--gateway' && args[i + 1]) {
      return args[i + 1];
    }
    if (arg.startsWith('--gateway=')) {
      return arg.slice('--gateway='.length);
    }
  }
  return null;
}

function resolveGatewayBaseUrl(lanIp, explicitArg) {
  if (explicitArg && explicitArg.trim().length > 0) {
    return normalizeBaseUrl(explicitArg);
  }

  const envUrl =
    process.env.EXPO_PUBLIC_GATEWAY_BASE_URL || process.env.GATEWAY_BASE_URL;

  if (envUrl && envUrl.trim().length > 0) {
    const normalized = normalizeBaseUrl(envUrl);
    // If it's a remote/public URL (e.g. VPS, staging), keep it.
    if (!isPrivateOrLocalUrl(normalized)) {
      return normalized;
    }

    // If it is private/local, check if it matches the current LAN IP
    if (lanIp) {
      try {
        const parsed = new URL(normalized);
        if (parsed.hostname === lanIp) {
          return normalized;
        }
      } catch {
        // ignore parsing error
      }
      // Stale LAN IP or localhost: auto-update to current active Wi-Fi LAN IP
      return `http://${lanIp}:${DEFAULT_LOCAL_GATEWAY_PORT}`;
    }

    return normalized;
  }

  if (lanIp) {
    return `http://${lanIp}:${DEFAULT_LOCAL_GATEWAY_PORT}`;
  }

  return DEFAULT_PUBLIC_GATEWAY_BASE_URL;
}

function syncEnvFile(envPath, updates) {
  try {
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    const lines = content.split(/\r?\n/);
    const seen = new Set();
    const newLines = [];

    for (const line of lines) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=/);
      if (match) {
        const key = match[1];
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          if (!seen.has(key)) {
            newLines.push(`${key}=${updates[key]}`);
            seen.add(key);
          }
          continue;
        }
      }
      newLines.push(line);
    }

    for (const [key, val] of Object.entries(updates)) {
      if (!seen.has(key)) {
        newLines.push(`${key}=${val}`);
      }
    }

    fs.writeFileSync(envPath, newLines.join('\n').trim() + '\n', 'utf8');
  } catch {
    // Non-critical, ignore write errors
  }
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

async function findAvailablePort(startPort, step = DEFAULT_PORT_STEP, maxAttempts = 30) {
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

function extractPortFromArgs(args) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      const next = args[i + 1];
      if (next && /^\d+$/.test(next)) {
        return Number(next);
      }
    } else if (arg.startsWith('--port=')) {
      const val = arg.slice('--port='.length);
      if (/^\d+$/.test(val)) {
        return Number(val);
      }
    }
  }
  return null;
}

function stripPortArgs(args) {
  const result = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      i++;
      continue;
    }
    if (arg.startsWith('--port=')) {
      continue;
    }
    result.push(arg);
  }
  return result;
}

async function run() {
  const extraArgs = process.argv.slice(2);
  const explicitGateway = extractGatewayFromArgs(extraArgs);
  const lanIp = resolveLanIp();

  const gatewayBaseUrl = resolveGatewayBaseUrl(lanIp, explicitGateway);
  process.env.EXPO_PUBLIC_GATEWAY_BASE_URL = gatewayBaseUrl;

  const lanFallbacks = lanIp
    ? `http://${lanIp}:${DEFAULT_LOCAL_GATEWAY_PORT},http://${lanIp}:${DEFAULT_VPS_GATEWAY_PORT},`
    : '';

  process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS =
    process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS ||
    `${lanFallbacks}https://ops.nexus-ex.site,http://103.82.20.51:${DEFAULT_VPS_GATEWAY_PORT},http://10.0.2.2:${DEFAULT_LOCAL_GATEWAY_PORT},http://localhost:${DEFAULT_LOCAL_GATEWAY_PORT},http://127.0.0.1:${DEFAULT_LOCAL_GATEWAY_PORT}`;

  if (lanIp) {
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;
  }

  // Sync .env file so Metro bundler and child processes get updated Wi-Fi IP
  const envPath = path.resolve(__dirname, '..', '.env');
  syncEnvFile(envPath, {
    EXPO_PUBLIC_GATEWAY_BASE_URL: gatewayBaseUrl,
    EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS: process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS,
  });

  if (!process.env.EXPO_PUBLIC_BUILD_ID) {
    process.env.EXPO_PUBLIC_BUILD_ID = `build-${Date.now()}`;
  }

  // Avoid blocking `expo start` when the CLI cannot reach Expo version endpoints
  if (!process.env.EXPO_NO_DEPENDENCY_VALIDATION) {
    process.env.EXPO_NO_DEPENDENCY_VALIDATION = '1';
  }
  if (!process.env.EXPO_NO_DOCTOR) {
    process.env.EXPO_NO_DOCTOR = '1';
  }

  // Keep Metro scoped to this app; workspace-root mode can watch the whole monorepo
  if (!process.env.EXPO_NO_METRO_WORKSPACE_ROOT) {
    process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';
  }

  // Increase Node heap for Metro
  const nodeOptions = process.env.NODE_OPTIONS ?? '';
  if (!/--max-old-space-size=\d+/i.test(nodeOptions)) {
    const separator = nodeOptions.trim().length > 0 ? ' ' : '';
    process.env.NODE_OPTIONS =
      `${nodeOptions}${separator}--max-old-space-size=${DEFAULT_NODE_MAX_OLD_SPACE_MB}`.trim();
  }

  // Dynamic Port Check & Auto Switch
  const requestedPort = extractPortFromArgs(extraArgs) ?? DEFAULT_EXPO_PORT;
  let finalPort = requestedPort;
  const isRequestedFree = await isPortFree(requestedPort);

  if (!isRequestedFree) {
    finalPort = await findAvailablePort(requestedPort, DEFAULT_PORT_STEP);
    console.log(
      `[customer-mobile] ⚡ Cổng ${requestedPort} đang bận (hoặc đang dùng bởi app khác). Đã tự động đổi sang cổng khả dụng: ${finalPort}`,
    );
  } else {
    console.log(`[customer-mobile] 🚀 Khởi động Metro Expo trên cổng: ${finalPort}`);
  }

  if (lanIp) {
    console.log(`[customer-mobile] 🌐 Mạng Wi-Fi/LAN: ${lanIp} | Gateway URL: ${gatewayBaseUrl}`);
  } else {
    console.log(`[customer-mobile] 💻 Chế độ Localhost: Gateway URL: ${gatewayBaseUrl}`);
  }

  const cleanedArgs = stripPortArgs(extraArgs);
  const hasHostArg = cleanedArgs.some(
    (arg) => arg === '--host' || arg.startsWith('--host='),
  );
  const hasClearArg = cleanedArgs.some(
    (arg) => arg === '--clear' || arg === '-c',
  );

  const expoArgs = [
    'expo',
    'start',
    ...(hasClearArg ? [] : ['--clear']),
    ...(hasHostArg ? [] : ['--host', 'lan']),
    '--port',
    String(finalPort),
    ...cleanedArgs.filter((arg) => arg !== '--clear' && arg !== '-c'),
  ];

  if (extraArgs.includes('--print-config')) {
    console.log(
      JSON.stringify(
        {
          appName: 'customer-mobile',
          port: finalPort,
          lanIp: lanIp || null,
          gatewayBaseUrl: process.env.EXPO_PUBLIC_GATEWAY_BASE_URL || null,
          gatewayFallbackBaseUrls: process.env.EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS || null,
          reactNativePackagerHostname: process.env.REACT_NATIVE_PACKAGER_HOSTNAME || null,
          nodeOptions: process.env.NODE_OPTIONS || null,
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
    console.error('[customer-mobile] Failed to start Expo:', error);
    process.exit(1);
  });
}

void run();
