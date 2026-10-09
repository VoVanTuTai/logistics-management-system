/**
 * Ultra-Lean Multi-App Static Web Server & API Reverse Proxy
 * - Serves all compiled production web apps using pure Node.js native HTTP.
 * - Proxies API calls (/ops/*, /admin/*, /merchant/*, /public/*, /api/*, /chat/*, /ws/*) directly to Gateway BFF (port 3000).
 * Memory footprint: ~15MB total for all 5 web apps combined.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_PORT = 3000;

const API_PREFIXES = [
  '/ops/',
  '/admin/',
  '/merchant/',
  '/public/',
  '/api/',
  '/chat/',
  '/tasks/',
  '/locations/',
  '/health',
  '/metrics',
  '/ws/',
];

function isApiRequest(pathname) {
  return (
    API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === '/health' ||
    pathname === '/metrics'
  );
}

function proxyToGateway(req, res) {
  const options = {
    hostname: GATEWAY_HOST,
    port: GATEWAY_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${GATEWAY_HOST}:${GATEWAY_PORT}`,
      'x-forwarded-for': req.socket.remoteAddress || '127.0.0.1',
      'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[Proxy Error] ${req.method} ${req.url} -> Gateway BFF:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Gateway BFF is unreachable', error: 'Bad Gateway' }));
    }
  });

  req.pipe(proxyReq);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

const APPS_CONFIG = [
  { name: 'ops-web', port: 5173, dist: path.join(ROOT_DIR, 'apps/ops-web/dist') },
  { name: 'merchant-web', port: 5174, dist: path.join(ROOT_DIR, 'apps/merchant-web/dist') },
  { name: 'admin-web', port: 5175, dist: path.join(ROOT_DIR, 'apps/admin-web/dist') },
  { name: 'guest-web', port: 5177, dist: path.join(ROOT_DIR, 'apps/guest-web/dist') },
  { name: 'customer-mobile', port: 5176, dist: path.join(ROOT_DIR, 'apps/customer-mobile/dist') },
];

function createStaticAppServer(appConfig) {
  const { name, port, dist } = appConfig;

  if (!fs.existsSync(dist)) {
    console.warn(`⚠️ [${name}] Thư mục dist chưa tồn tại tại: ${dist}. Vui lòng build trước bằng: npm run build`);
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. API Reverse Proxy check: Route all API prefixes to Gateway BFF
    if (isApiRequest(pathname)) {
      proxyToGateway(req, res);
      return;
    }

    // 2. CORS headers for static assets
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    // Prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(dist, safePath);

    // If directory, look for index.html
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } catch {
      // Fallback
    }

    // Check if requested file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Cache headers for hashed assets vs HTML
      if (ext === '.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }

      res.writeHead(200, { 'Content-Type': contentType });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA Fallback: if route doesn't match a static file, serve index.html
    const indexPath = path.join(dist, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(indexPath).pipe(res);
      return;
    }

    // 404 if no index.html found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${name} dist is not built yet.`);
  });

  // Handle WebSocket upgrades
  server.on('upgrade', (req, socket, head) => {
    const proxyReq = http.request({
      hostname: GATEWAY_HOST,
      port: GATEWAY_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${GATEWAY_HOST}:${GATEWAY_PORT}`,
      },
    });

    proxyReq.on('upgrade', (proxyRes, proxySocket) => {
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n` +
          Object.entries(proxyRes.headers)
            .map(([k, v]) => `${k}: ${v}\r\n`)
            .join('') +
          '\r\n',
      );
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on('error', () => {
      socket.destroy();
    });

    proxyReq.end();
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 [Static App + API Proxy] ${name.padEnd(16)} -> http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ [${name}] Cổng ${port} đang bị chiếm dụng.`);
    } else {
      console.error(`❌ [${name}] Lỗi máy chủ:`, err.message);
    }
  });

  return server;
}

console.log('================================================================');
console.log('🌐 KHỞI ĐỘNG CỤM MÁY CHỦ WEB TĨNH & API REVERSE PROXY');
console.log('================================================================');

for (const app of APPS_CONFIG) {
  createStaticAppServer(app);
}
