#!/usr/bin/env node

const config = {
  gatewayUrl: process.env.GATEWAY_URL ?? 'http://localhost:3000',
  merchantUsername: process.env.MERCHANT_USERNAME ?? '41100001',
  merchantPassword: process.env.MERCHANT_PASSWORD ?? 'password',
  merchantPasswordFallback: process.env.MERCHANT_PASSWORD_FALLBACK ?? 'merchant123456',
  opsUsername: process.env.OPS_USERNAME ?? '20000001',
  opsPassword: process.env.OPS_PASSWORD ?? 'password',
  courierUsername: '30000001',
  hubCode: '001A001',
  receiverHubCode: '001B001',
};

const runId = new Date().toISOString().replace(/\D/g, '').slice(2, 14);

async function main() {
  console.log(`Starting to seed 10 COD deliveries for courier ${config.courierUsername}`);

  const merchant = await loginWithFallback('merchant', config.merchantUsername, [
    config.merchantPassword,
    config.merchantPasswordFallback,
  ]);
  const ops = await loginWithFallback('ops', config.opsUsername, [config.opsPassword]);

  for (let i = 1; i <= 10; i++) {
    const shipmentCode = `COD${runId}${i.toString().padStart(2, '0')}`;
    
    await api('/merchant/shipment/shipments', {
      method: 'POST',
      token: merchant.accessToken,
      body: {
        code: shipmentCode,
        metadata: {
          sender: {
            name: 'Shop Test COD',
            phone: '0900003001',
            address: 'So 1 Tran Phu',
            hubCode: config.hubCode,
          },
          receiver: {
            name: `Khach Hang ${i}`,
            phone: '0912345678',
            address: `Nha so ${i} Cau Giay`,
            hubCode: config.receiverHubCode,
          },
          package: {
            itemType: 'TEST',
            weightKg: 1,
            dimensionsCm: { length: 10, width: 10, height: 10 },
            declaredValue: 50000,
          },
          service: { type: 'STANDARD' },
          codAmount: 10000,
          deliveryNote: 'Giao trong ngày',
        },
      },
    });
    
    console.log(`[${i}/10] Created shipment ${shipmentCode} with COD 10000`);

    const taskCode = `TD${runId}${i.toString().padStart(2, '0')}`;
    const task = await api('/ops/dispatch/tasks', {
      method: 'POST',
      token: ops.accessToken,
      body: {
        taskCode: taskCode,
        taskType: 'DELIVERY',
        shipmentCode: shipmentCode,
        note: `Test delivery COD task ${i}`,
      },
    });

    await api(`/ops/dispatch/tasks/${encodeURIComponent(task.id)}/assign`, {
      method: 'POST',
      token: ops.accessToken,
      body: { courierId: config.courierUsername },
    });

    console.log(`[${i}/10] Created & assigned delivery task ${task.taskCode} to ${config.courierUsername}`);
  }

  console.log('Seeding completed successfully!');
}

async function loginWithFallback(group, username, passwords) {
  const candidates = Array.from(new Set(passwords.filter(Boolean)));
  let lastError = null;

  for (const password of candidates) {
    try {
      const session = await api(`/${group}/auth/auth/login`, {
        method: 'POST',
        body: { username, password },
      });
      return { user: session.user, accessToken: session.tokens.accessToken };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`Unable to login ${group} ${username}`);
}

async function api(path, options = {}) {
  const url = new URL(path.replace(/^\//, ''), config.gatewayUrl).toString();
  const headers = new Headers(options.headers ?? {});
  headers.set('Accept', 'application/json');

  let body;
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(url, { method: options.method ?? 'GET', headers, body });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

main().catch((err) => {
  console.error('Error:', err);
  process.exitCode = 1;
});
