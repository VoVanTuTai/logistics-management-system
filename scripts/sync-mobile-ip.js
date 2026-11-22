const os = require('os');
const fs = require('fs');
const path = require('path');

function isValidLanAddress(addressInfo) {
  if (!addressInfo || addressInfo.family !== 'IPv4' || addressInfo.internal) return false;
  if (!addressInfo.address || addressInfo.address.startsWith('169.254.')) return false;
  return true;
}

function priorityOfInterface(name) {
  const n = name.toLowerCase();
  if (n === 'en0' || n.includes('wi-fi') || n.includes('wifi') || n.startsWith('wlan')) return 0;
  if (n === 'en1' || n.includes('ethernet') || n.startsWith('eth')) return 1;
  if (n.startsWith('en')) return 2;
  return 10;
}

function resolveLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const [name, records] of Object.entries(interfaces)) {
    if (!records) continue;
    for (const record of records) {
      if (isValidLanAddress(record)) {
        candidates.push({ ip: record.address, score: priorityOfInterface(name) });
      }
    }
  }
  if (candidates.length === 0) return '127.0.0.1';
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0].ip;
}

// Support explicit CLI argument: node scripts/sync-mobile-ip.js --ip=192.168.1.50
let targetIp = null;
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--ip=')) targetIp = arg.slice(5).trim();
}
if (!targetIp) targetIp = resolveLanIp();

const gatewayPort = 3000;
const gatewayUrl = `http://${targetIp}:${gatewayPort}`;
const rootDir = path.resolve(__dirname, '..');

console.log(`[sync-mobile-ip] Detected local server IP: ${targetIp}`);
console.log(`[sync-mobile-ip] Target Gateway URL:     ${gatewayUrl}`);

function updateEnv(filePath, updates) {
  let content = '';
  if (fs.existsSync(filePath)) content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const seen = new Set();
  const newLines = [];
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=/);
    if (match && updates.hasOwnProperty(match[1])) {
      const key = match[1];
      if (!seen.has(key)) {
        newLines.push(`${key}=${updates[key]}`);
        seen.add(key);
      }
    } else {
      newLines.push(line);
    }
  }
  for (const [key, val] of Object.entries(updates)) {
    if (!seen.has(key)) newLines.push(`${key}=${val}`);
  }
  fs.writeFileSync(filePath, newLines.join('\n').trim() + '\n', 'utf8');
  console.log(`[sync-mobile-ip] Updated: ${path.relative(rootDir, filePath)}`);
}

function updateEasJson(filePath, newGatewayUrl) {
  if (!fs.existsSync(filePath)) return;
  try {
    const eas = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (eas.build) {
      for (const profile of Object.values(eas.build)) {
        if (profile.env && profile.env.EXPO_PUBLIC_GATEWAY_BASE_URL) {
          profile.env.EXPO_PUBLIC_GATEWAY_BASE_URL = newGatewayUrl;
        }
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(eas, null, 2) + '\n', 'utf8');
    console.log(`[sync-mobile-ip] Updated: ${path.relative(rootDir, filePath)}`);
  } catch (err) {
    console.error(`[sync-mobile-ip] Error updating ${filePath}:`, err.message);
  }
}

// 1. Courier Mobile
updateEnv(path.join(rootDir, 'apps/courier-mobile/.env'), {
  EXPO_PUBLIC_GATEWAY_BASE_URL: gatewayUrl,
  EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS: `http://localhost:${gatewayPort},http://10.0.2.2:${gatewayPort},http://127.0.0.1:${gatewayPort},https://ops.nexus-ex.site`,
});
updateEasJson(path.join(rootDir, 'apps/courier-mobile/eas.json'), gatewayUrl);

// 2. Customer Mobile
updateEnv(path.join(rootDir, 'apps/customer-mobile/.env'), {
  EXPO_PUBLIC_GATEWAY_BASE_URL: gatewayUrl,
  EXPO_PUBLIC_GATEWAY_FALLBACK_BASE_URLS: `http://localhost:${gatewayPort},http://10.0.2.2:${gatewayPort},http://127.0.0.1:${gatewayPort},https://customer.nexus-ex.site`,
});
updateEasJson(path.join(rootDir, 'apps/customer-mobile/eas.json'), gatewayUrl);

console.log(`[sync-mobile-ip] Successfully synchronized both mobile apps to local server: ${gatewayUrl}`);
