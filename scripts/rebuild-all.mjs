/**
 * Script Rebuild Toàn Bộ Hệ Thống Logistics Management System:
 * - 13 Backend Microservices
 * - 4 Frontend Web Applications
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

const SERVICES = [
  'auth-service',
  'masterdata-service',
  'dispatch-service',
  'shipment-service',
  'pickup-service',
  'manifest-service',
  'scan-service',
  'delivery-service',
  'tracking-service',
  'reporting-service',
  'payment-service',
  'pricing-service',
  'gateway-bff',
];

const APPS = [
  'ops-web',
  'admin-web',
  'merchant-web',
  'guest-web',
];

console.log('================================================================');
console.log('🔨 BẮT ĐẦU REBUILD TOÀN BỘ HỆ THỐNG (SERVICES & APPS)');
console.log('================================================================\n');

const results = {
  servicesPassed: [],
  servicesFailed: [],
  appsPassed: [],
  appsFailed: [],
};

// 1. Rebuild Backend Services
console.log('--- [1/2] REBUILD 13 BACKEND MICROSERVICES ---');
for (const service of SERVICES) {
  const serviceDir = path.join(ROOT_DIR, 'services', service);
  if (!fs.existsSync(serviceDir)) {
    console.log(`  [SKIP] Không tìm thấy thư mục services/${service}`);
    continue;
  }

  process.stdout.write(`  ⏳ Building ${service}... `);
  const start = Date.now();
  try {
    execSync('npm run build', {
      cwd: serviceDir,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' },
    });
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ [OK] (${duration}s)`);
    results.servicesPassed.push(service);
  } catch (error) {
    console.log(`❌ [FAILED]`);
    console.error(error.stderr?.toString() || error.message);
    results.servicesFailed.push(service);
  }
}

// 2. Rebuild Frontend Web Apps
console.log('\n--- [2/2] REBUILD 4 FRONTEND WEB APPLICATIONS ---');
for (const app of APPS) {
  const appDir = path.join(ROOT_DIR, 'apps', app);
  if (!fs.existsSync(appDir)) {
    console.log(`  [SKIP] Không tìm thấy thư mục apps/${app}`);
    continue;
  }

  process.stdout.write(`  ⏳ Building ${app}... `);
  const start = Date.now();
  try {
    execSync('npm run build', {
      cwd: appDir,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ [OK] (${duration}s)`);
    results.appsPassed.push(app);
  } catch (error) {
    console.log(`❌ [FAILED]`);
    console.error(error.stderr?.toString() || error.message);
    results.appsFailed.push(app);
  }
}

console.log('\n================================================================');
console.log('📊 KẾT QUẢ REBUILD TOÀN BỘ HỆ THỐNG');
console.log('================================================================');
console.log(`  Services: ${results.servicesPassed.length}/${SERVICES.length} PASSED`);
if (results.servicesFailed.length > 0) {
  console.log(`  ❌ Failed Services: ${results.servicesFailed.join(', ')}`);
}
console.log(`  Web Apps: ${results.appsPassed.length}/${APPS.length} PASSED`);
if (results.appsFailed.length > 0) {
  console.log(`  ❌ Failed Apps: ${results.appsFailed.join(', ')}`);
}

if (results.servicesFailed.length === 0 && results.appsFailed.length === 0) {
  console.log('\n🎉 TẤT CẢ CÁC THÀNH PHẦN HỆ THỐNG ĐÃ ĐƯỢC BUILD HOÀN TẤT VÀ SẴN SÀNG KHỞI ĐỘNG!');
} else {
  process.exit(1);
}
