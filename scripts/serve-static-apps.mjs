/**
 * Ultra-Lean Multi-App Static Web Server
 * Serves all compiled production web apps using pure Node.js native HTTP.
 * Memory footprint: ~15MB total for all 5 web apps combined.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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
    // CORS headers
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

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

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

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 [Static App] ${name.padEnd(16)} -> http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ [${name}] Cổng ${port} đang bị chiếm dụng. Vui lòng đóng ứng dụng đang dùng cổng này.`);
    } else {
      console.error(`❌ [${name}] Lỗi máy chủ:`, err.message);
    }
  });

  return server;
}

console.log('================================================================');
console.log('🌐 KHỞI ĐỘNG CỤM MÁY CHỦ WEB TĨNH SIÊU NHẸ (PURE NODE.JS)');
console.log('================================================================');

for (const app of APPS_CONFIG) {
  createStaticAppServer(app);
}
