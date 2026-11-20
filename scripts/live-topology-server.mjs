#!/usr/bin/env node
/**
 * Nexus Express — Real-time Service Topology Monitor Server
 * Monitors 24 services (14 microservices + 5 web apps + 4 Docker infra + 1 gateway)
 * Serves an interactive visual topology diagram with live health checks & SSE streaming.
 * Port: 4321 (http://localhost:4321)
 */

import http from 'node:http';
import net from 'node:net';
import url from 'node:url';

const PORT = 4321;

// Full list of 24 monitored services in Nexus Express
const SERVICES = [
  // Tier 1: Clients & Web Applications
  { id: 'ops-web', name: 'Ops Web Portal', tier: 'client', port: 5173, protocol: 'http', path: '/', type: 'Web SPA (Vite)', desc: 'Trung tâm Vận hành Hub & Bưu cục' },
  { id: 'merchant-web', name: 'Merchant Web Portal', tier: 'client', port: 5174, protocol: 'http', path: '/', type: 'Web SPA (Vite)', desc: 'Cổng Quản lý Đơn hàng Chủ shop' },
  { id: 'admin-web', name: 'Admin Web Portal', tier: 'client', port: 5175, protocol: 'http', path: '/', type: 'Web SPA (Vite)', desc: 'Bảng điều khiển Quản trị Cấu hình' },
  { id: 'customer-mobile', name: 'Customer Mobile Web', tier: 'client', port: 5176, protocol: 'http', path: '/metadata.json', type: 'Expo Web Build', desc: 'Web Khách hàng Tra cứu & Tạo đơn' },
  { id: 'guest-tracking', name: 'Guest Tracking Portal', tier: 'client', port: 5177, protocol: 'http', path: '/', type: 'Web SPA (Vite)', desc: 'Tra cứu Hành trình Vận đơn Công khai' },

  // Tier 2: Edge & API Gateway BFF
  { id: 'gateway-bff', name: 'API Gateway BFF', tier: 'gateway', port: 3000, protocol: 'http', path: '/health', type: 'NestJS Gateway', desc: 'Cổng Trung tâm, JWT Guard & Reverse Proxy' },

  // Tier 3: Core Logistics Microservices (Operations)
  { id: 'shipment-service', name: 'Shipment Service', tier: 'microservice', group: 'ops', port: 3002, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Quản lý Đơn hàng, Phân loại Mặt hàng & Cân nặng' },
  { id: 'pickup-service', name: 'Pickup Service', tier: 'microservice', group: 'ops', port: 3003, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Điều phối Lấy hàng Tận nơi' },
  { id: 'dispatch-service', name: 'Dispatch Service', tier: 'microservice', group: 'ops', port: 3004, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Lập lệnh Xuất xe & Điều phối Tuyến' },
  { id: 'manifest-service', name: 'Manifest Service', tier: 'microservice', group: 'ops', port: 3005, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Bảng kê Đóng bao & Niêm phong Seal' },
  { id: 'scan-service', name: 'Scan Service', tier: 'microservice', group: 'ops', port: 3006, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Ghi nhận Vết quét Inbound/Outbound' },
  { id: 'delivery-service', name: 'Delivery Service', tier: 'microservice', group: 'ops', port: 3007, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Phát hàng Cuối (Last-mile) & Chữ ký POD' },

  // Tier 3: Foundation & Finance
  { id: 'auth-service', name: 'Auth Service', tier: 'microservice', group: 'core', port: 3010, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Xác thực, Phân quyền RBAC & Khóa Brute-force' },
  { id: 'masterdata-service', name: 'Masterdata Service', tier: 'microservice', group: 'core', port: 3001, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Quản lý Bưu cục, Hub, Tuyến đường & Địa giới' },
  { id: 'payment-service', name: 'Payment & COD Service', tier: 'microservice', group: 'core', port: 3011, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Thu hộ COD, Đối soát Ví & Xuất ERP MISA/SAP' },
  { id: 'pricing-service', name: 'Pricing Service', tier: 'microservice', group: 'core', port: 3012, protocol: 'http', path: '/health', type: 'NestJS · Stateless', desc: 'Tính Cước phí IATA 3D, Bảo hiểm & Phụ phí' },

  // Tier 3: Analytics, Tracking & AI RAG
  { id: 'tracking-service', name: 'Tracking Service', tier: 'microservice', group: 'ai_data', port: 3008, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Read-model Dòng thời gian Vận đơn CQRS' },
  { id: 'reporting-service', name: 'Reporting Service', tier: 'microservice', group: 'ai_data', port: 3009, protocol: 'http', path: '/health', type: 'NestJS · Microservice', desc: 'Báo cáo Vận hành, KPI Giao nhận & Đối soát' },
  { id: 'chatbot-service', name: 'AI Chatbot RAG Subsystem', tier: 'microservice', group: 'ai_data', port: 3013, protocol: 'http', path: '/health', type: 'NestJS · AI RAG Engine', desc: 'Multi-Agent HMAS, Gemini 2.5 Flash & pgvector 3072-D' },

  // Tier 4: Storage, Event Streaming & Infrastructure
  { id: 'postgres-db', name: 'PostgreSQL 16 Cluster', tier: 'infra', port: 15432, protocol: 'tcp', type: 'Docker Database', desc: '12 CSDL Độc lập (Database-per-Service)' },
  { id: 'rabbitmq-amqp', name: 'RabbitMQ Event Bus (AMQP)', tier: 'infra', port: 5672, protocol: 'tcp', type: 'Docker Broker', desc: 'Exchange domain.events & Streaming DLQs' },
  { id: 'rabbitmq-mgmt', name: 'RabbitMQ Management Web', tier: 'infra', port: 15672, protocol: 'http', path: '/', type: 'Web Console', desc: 'Bảng điều khiển Giám sát Hàng đợi & Thông điệp' },
  { id: 'redis-cache', name: 'Redis 7 In-Memory Cache', tier: 'infra', port: 6379, protocol: 'tcp', type: 'Docker Cache', desc: 'Bộ nhớ đệm Phân tán & Session Store' },
  { id: 'minio-s3', name: 'MinIO S3 Object Storage', tier: 'infra', port: 9000, protocol: 'http', path: '/minio/health/live', type: 'Docker S3 Storage', desc: 'Lưu trữ Ảnh POD, Bằng chứng CSKH & Claims Video' },
  { id: 'minio-console', name: 'MinIO Web Console', tier: 'infra', port: 9001, protocol: 'http', path: '/', type: 'Web Console', desc: 'Giao diện Quản trị Bucket S3' }
];

// In-memory status cache
let currentStatus = {
  timestamp: new Date().toISOString(),
  summary: { total: SERVICES.length, online: 0, offline: 0, degraded: 0, avgLatencyMs: 0 },
  services: []
};

// Ping single service
function pingService(svc) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    if (svc.protocol === 'tcp') {
      const socket = new net.Socket();
      socket.setTimeout(1500);

      socket.on('connect', () => {
        const latency = Date.now() - startTime;
        socket.destroy();
        resolve({
          ...svc,
          status: 'online',
          latencyMs: latency,
          details: { tcp: 'connected', host: 'localhost', port: svc.port }
        });
      });

      const onFail = (err) => {
        socket.destroy();
        resolve({
          ...svc,
          status: 'offline',
          latencyMs: null,
          details: { error: err.message || 'Connection refused' }
        });
      };

      socket.on('timeout', () => onFail(new Error('Connection timed out')));
      socket.on('error', onFail);
      socket.connect(svc.port, 'localhost');
    } else {
      // HTTP Ping
      const req = http.get(
        {
          host: 'localhost',
          port: svc.port,
          path: svc.path || '/',
          timeout: 1500,
          headers: { 'User-Agent': 'Nexus-Topology-Monitor/1.0' }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            if (body.length < 1000) body += chunk;
          });
          res.on('end', () => {
            const latency = Date.now() - startTime;
            let parsedBody = null;
            try {
              parsedBody = JSON.parse(body);
            } catch {
              parsedBody = { status: res.statusCode < 400 ? 'ok' : 'error', httpStatus: res.statusCode };
            }
            resolve({
              ...svc,
              status: res.statusCode < 400 ? 'online' : 'degraded',
              latencyMs: latency,
              httpStatus: res.statusCode,
              details: parsedBody
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ...svc,
          status: 'offline',
          latencyMs: null,
          details: { error: 'Request timed out' }
        });
      });

      req.on('error', (err) => {
        resolve({
          ...svc,
          status: 'offline',
          latencyMs: null,
          details: { error: err.message || 'Service down' }
        });
      });
    }
  });
}

// Check all services
async function checkAllServices() {
  const results = await Promise.all(SERVICES.map(pingService));
  const onlineCount = results.filter((s) => s.status === 'online').length;
  const degradedCount = results.filter((s) => s.status === 'degraded').length;
  const offlineCount = results.filter((s) => s.status === 'offline').length;
  const activeLatencies = results.filter((s) => s.latencyMs !== null).map((s) => s.latencyMs);
  const avgLatency = activeLatencies.length
    ? Math.round(activeLatencies.reduce((a, b) => a + b, 0) / activeLatencies.length)
    : 0;

  currentStatus = {
    timestamp: new Date().toISOString(),
    summary: {
      total: SERVICES.length,
      online: onlineCount,
      degraded: degradedCount,
      offline: offlineCount,
      avgLatencyMs: avgLatency
    },
    services: results
  };

  // Broadcast to SSE clients
  broadcastSSE(currentStatus);
}

// SSE Clients
const sseClients = new Set();
function broadcastSSE(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// Periodic check every 2 seconds
setInterval(checkAllServices, 2000);
checkAllServices(); // Initial check

// HTTP Server
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // REST API status
  if (parsed.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(currentStatus, null, 2));
    return;
  }

  // SSE Stream
  if (parsed.pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write(`data: ${JSON.stringify(currentStatus)}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // Main Visual Topology Dashboard UI
  if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDashboardHtml());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[Nexus Topology Monitor] Running live at: http://localhost:${PORT}`);
});

function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus Express — Real-time Service Topology Monitor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace']
          },
          colors: {
            brand: {
              50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a'
            }
          }
        }
      }
    }
  </script>
  <style>
    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 0; }
      100% { transform: scale(0.95); opacity: 0; }
    }
    .pulse-ring {
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes flow-dash {
      to { stroke-dashoffset: -40; }
    }
    .flow-line {
      stroke-dasharray: 6, 6;
      animation: flow-dash 1.2s linear infinite;
    }
    .node-card {
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .node-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4);
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">

  <!-- TOP HEADER -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
        <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-extrabold tracking-tight text-white">NEXUS EXPRESS</h1>
          <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Live Topology</span>
        </div>
        <p class="text-xs text-slate-400">Giám sát Trực quan 24 Microservices, Web Portals & Nền tảng Dữ liệu</p>
      </div>
    </div>

    <!-- LIVE METRICS PILLS -->
    <div class="flex items-center gap-3">
      <div id="statusBadge" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
        <span class="relative flex h-2.5 w-2.5">
          <span class="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span id="statusText">24/24 Online (100%)</span>
      </div>

      <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono">
        <span class="text-slate-400">Ping TB:</span>
        <span id="avgLatency" class="font-bold text-blue-400">-- ms</span>
      </div>

      <div class="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
        <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        <span id="lastUpdated">Syncing...</span>
      </div>

      <button onclick="manualRefresh()" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Làm mới ngay">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- TOPOLOGY FLOW CANVAS CONTAINER -->
  <main class="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-8">

    <!-- TIER 1: CLIENTS & PRESENTATION -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-sky-400">Tier 1: Client Presentation Applications (5 Web SPAs · 1 Mobile)</h2>
        </div>
        <span class="text-[11px] text-slate-400 font-mono">Ports: 5173 - 5177</span>
      </div>
      <div id="tierClients" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <!-- Rendered by JS -->
      </div>
    </section>

    <!-- CONNECTOR ARROWS DOWN TO GATEWAY -->
    <div class="flex items-center justify-center my-1">
      <div class="flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
        <span>HTTPS / WSS / JWT Bearer</span>
        <svg class="w-4 h-4 text-blue-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </div>
    </div>

    <!-- TIER 2: API GATEWAY BFF -->
    <section class="max-w-xl mx-auto w-full">
      <div class="flex items-center justify-center gap-2 mb-2">
        <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
        <h2 class="text-xs font-extrabold uppercase tracking-widest text-blue-400">Tier 2: API Gateway BFF Router</h2>
      </div>
      <div id="tierGateway">
        <!-- Rendered by JS -->
      </div>
    </section>

    <!-- CONNECTOR ARROWS DOWN TO MICROSERVICES -->
    <div class="flex items-center justify-center my-1">
      <div class="flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
        <span>Reverse Proxy Routing & RBAC Guards (Ports 3001 - 3013)</span>
        <svg class="w-4 h-4 text-indigo-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </div>
    </div>

    <!-- TIER 3: MICROSERVICES & AI RAG SUBSYSTEM -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-indigo-400">Tier 3: Core Logistics Microservices & AI RAG Subsystem</h2>
        </div>
        <span class="text-[11px] text-slate-400 font-mono">13 Backend Services · PM2 Managed</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Column 1: Operations Group -->
        <div class="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-xs font-bold text-slate-300">📦 Operations & Delivery Hub</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">6 Services</span>
          </div>
          <div id="groupOps" class="space-y-2.5"></div>
        </div>

        <!-- Column 2: Foundation & Finance -->
        <div class="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-xs font-bold text-slate-300">🔐 Auth, Masterdata & COD Payment</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">4 Services</span>
          </div>
          <div id="groupCore" class="space-y-2.5"></div>
        </div>

        <!-- Column 3: Analytics, CQRS & AI RAG -->
        <div class="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-xs font-bold text-purple-300">🤖 AI RAG Multi-Agent & Analytics</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30">3 Services</span>
          </div>
          <div id="groupAiData" class="space-y-2.5"></div>
        </div>
      </div>
    </section>

    <!-- CONNECTOR ARROWS DOWN TO INFRA -->
    <div class="flex items-center justify-center my-1">
      <div class="flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
        <span>Domain Events (AMQP 5672) · SQL Queries (15432) · S3 Buckets (9000)</span>
        <svg class="w-4 h-4 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </div>
    </div>

    <!-- TIER 4: STORAGE, BROKER & INFRASTRUCTURE -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Tier 4: Storage, Event Bus & Docker Infrastructure</h2>
        </div>
        <span class="text-[11px] text-slate-400 font-mono">Docker Desktop Isolated Runtime</span>
      </div>
      <div id="tierInfra" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <!-- Rendered by JS -->
      </div>
    </section>

  </main>

  <!-- INSPECT MODAL -->
  <div id="inspectModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
      <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div id="modalIcon" class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono"></div>
        <div>
          <h3 id="modalName" class="text-lg font-bold text-white"></h3>
          <p id="modalDesc" class="text-xs text-slate-400"></p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
        <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div class="text-slate-500 text-[10px] uppercase">Port / Protocol</div>
          <div id="modalPort" class="text-slate-200 font-bold mt-0.5"></div>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div class="text-slate-500 text-[10px] uppercase">Response Time</div>
          <div id="modalLatency" class="text-emerald-400 font-bold mt-0.5"></div>
        </div>
      </div>

      <div class="mb-4">
        <div class="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
          <span>Live Health Check Payload</span>
          <span class="text-[10px] text-slate-500">JSON</span>
        </div>
        <pre id="modalJson" class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48"></pre>
      </div>

      <div class="flex items-center justify-end gap-2">
        <a id="modalLink" href="#" target="_blank" class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition">
          <span>Mở Endpoint Trực tiếp</span>
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      </div>
    </div>
  </div>

  <!-- SCRIPT -->
  <script>
    let latestData = null;

    function renderNodeCard(svc, isCompact = false) {
      const isOnline = svc.status === 'online';
      const isDegraded = svc.status === 'degraded';
      const statusColor = isOnline ? 'emerald' : isDegraded ? 'amber' : 'red';
      const statusLabel = isOnline ? 'ONLINE' : isDegraded ? 'SLOW' : 'OFFLINE';

      return \`
        <div onclick='inspectService(\${JSON.stringify(svc.id)})'
             class="node-card cursor-pointer group p-3.5 rounded-xl bg-slate-900/90 border \${isOnline ? 'border-slate-800 hover:border-slate-700' : 'border-red-500/50 bg-red-950/20'} relative overflow-hidden">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="relative flex h-2.5 w-2.5 shrink-0">
                \${isOnline ? '<span class="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>' : ''}
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-\${statusColor}-500"></span>
              </span>
              <span class="text-xs font-bold text-white truncate group-hover:text-blue-400 transition">\${svc.name}</span>
            </div>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">:\${svc.port}</span>
          </div>

          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span class="text-slate-500 truncate text-[10px]">\${svc.type}</span>
            <span class="font-bold \${isOnline ? 'text-emerald-400' : 'text-red-400'} shrink-0">
              \${isOnline ? (svc.latencyMs + ' ms') : 'ERR'}
            </span>
          </div>
        </div>
      \`;
    }

    function renderGatewayCard(svc) {
      const isOnline = svc.status === 'online';
      const statusColor = isOnline ? 'emerald' : 'red';

      return \`
        <div onclick='inspectService(\${JSON.stringify(svc.id)})'
             class="node-card cursor-pointer group p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border \${isOnline ? 'border-blue-500/40 hover:border-blue-400' : 'border-red-500 bg-red-950/30'} shadow-lg shadow-blue-500/10">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono text-xs">
                BFF
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-white group-hover:text-blue-300 transition">\${svc.name}</h3>
                <p class="text-[11px] text-slate-400">\${svc.desc}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="flex items-center justify-end gap-1.5 text-xs font-bold \${isOnline ? 'text-emerald-400' : 'text-red-400'} font-mono">
                <span class="w-2 h-2 rounded-full bg-\${statusColor}-500"></span>
                <span>\${isOnline ? svc.latencyMs + ' ms' : 'OFFLINE'}</span>
              </div>
              <span class="text-[10px] font-mono text-blue-400">Port 3000 (HTTP / WS)</span>
            </div>
          </div>
        </div>
      \`;
    }

    function updateUI(data) {
      latestData = data;
      document.getElementById('statusText').innerText = \`\${data.summary.online}/\${data.summary.total} Online (\${Math.round(data.summary.online/data.summary.total*100)}%)\`;
      document.getElementById('avgLatency').innerText = \`\${data.summary.avgLatencyMs} ms\`;
      document.getElementById('lastUpdated').innerText = new Date(data.timestamp).toLocaleTimeString();

      // Render Clients
      const clients = data.services.filter(s => s.tier === 'client');
      document.getElementById('tierClients').innerHTML = clients.map(s => renderNodeCard(s)).join('');

      // Render Gateway
      const gateway = data.services.find(s => s.tier === 'gateway');
      if (gateway) {
        document.getElementById('tierGateway').innerHTML = renderGatewayCard(gateway);
      }

      // Render Microservices by Group
      const ops = data.services.filter(s => s.group === 'ops');
      document.getElementById('groupOps').innerHTML = ops.map(s => renderNodeCard(s)).join('');

      const core = data.services.filter(s => s.group === 'core');
      document.getElementById('groupCore').innerHTML = core.map(s => renderNodeCard(s)).join('');

      const aiData = data.services.filter(s => s.group === 'ai_data');
      document.getElementById('groupAiData').innerHTML = aiData.map(s => renderNodeCard(s)).join('');

      // Render Infra
      const infra = data.services.filter(s => s.tier === 'infra');
      document.getElementById('tierInfra').innerHTML = infra.map(s => renderNodeCard(s)).join('');
    }

    function inspectService(id) {
      if (!latestData) return;
      const svc = latestData.services.find(s => s.id === id);
      if (!svc) return;

      document.getElementById('modalIcon').innerText = svc.id.slice(0, 3).toUpperCase();
      document.getElementById('modalName').innerText = svc.name;
      document.getElementById('modalDesc').innerText = svc.desc;
      document.getElementById('modalPort').innerText = \`Port \${svc.port} (\${svc.protocol.toUpperCase()})\`;
      document.getElementById('modalLatency').innerText = svc.latencyMs !== null ? \`\${svc.latencyMs} ms\` : 'N/A';
      document.getElementById('modalJson').innerText = JSON.stringify(svc.details || {}, null, 2);

      const linkEl = document.getElementById('modalLink');
      linkEl.href = \`http://localhost:\${svc.port}\${svc.path || ''}\`;

      document.getElementById('inspectModal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('inspectModal').classList.add('hidden');
    }

    function manualRefresh() {
      fetch('/api/status')
        .then(r => r.json())
        .then(updateUI)
        .catch(console.error);
    }

    // Connect to Server-Sent Events (SSE)
    const evtSource = new EventSource('/api/stream');
    evtSource.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        updateUI(data);
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };
  </script>
</body>
</html>`;
}
