// Quick smoke script to create a shipment in HCM, create & assign a PICKUP task,
// and mark it completed. Designed to exercise merchant → OPS → courier flow
// without clicking through the UIs. Requires Node 18+ (fetch available).
//
// Usage:
//   node scripts/flow-pickup-smoke.js
//
// Optional env overrides:
//   SHIPMENTS_URL   (default http://localhost:3002)  # shipment-service
//   DISPATCH_URL    (default http://localhost:3004)  # dispatch-service
//   COURIER_ID      (pick a specific courier id; otherwise first in list)
//
// After running, check:
//   - OPS web: shipment + pickup task should appear in HCM scope
//   - Courier app: assigned task should be visible (and already completed if you keep the final step)

const SHIPMENTS_URL = process.env.SHIPMENTS_URL || 'http://localhost:3002';
const DISPATCH_URL = process.env.DISPATCH_URL || 'http://localhost:3004';
const EXPLICIT_COURIER_ID = process.env.COURIER_ID || null;

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${url} -> ${res.status} ${res.statusText} ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function main() {
  const now = Date.now();
  const shipmentCode = `SMK-${now}`;
  const taskCode = `TASK-${now}`;

  console.log(`Creating shipment ${shipmentCode}...`);
  const shipment = await request('POST', `${SHIPMENTS_URL}/shipments`, {
    code: shipmentCode,
    metadata: {
      platform: 'SMOKE',
      region: 'HCM',
      senderName: 'Merchant HCM',
      senderAddress: '01 Nguyen Hue, HCM',
      senderPhone: '0900000000',
      receiverName: 'Customer HCM',
      receiverAddress: '02 Le Loi, HCM',
      receiverPhone: '0911111111',
      serviceType: 'STANDARD',
      declaredValue: 100000,
      codAmount: 0,
    },
  });
  console.log('Shipment created:', shipment);

  console.log('Fetching courier list...');
  const couriers = await request('GET', `${DISPATCH_URL}/tasks/couriers`);
  if (!Array.isArray(couriers) || couriers.length === 0) {
    throw new Error('No couriers available from dispatch-service /tasks/couriers');
  }

  if (EXPLICIT_COURIER_ID && !couriers.includes(EXPLICIT_COURIER_ID)) {
    throw new Error(
      `COURIER_ID=${EXPLICIT_COURIER_ID} not found. Available: ${couriers.join(', ')}`,
    );
  }

  const courierId = EXPLICIT_COURIER_ID || couriers[0];
  console.log(`Using courierId=${courierId} (available: ${couriers.join(', ')})`);

  console.log(`Creating PICKUP task ${taskCode} for ${shipmentCode}...`);
  const task = await request('POST', `${DISPATCH_URL}/tasks`, {
    taskCode,
    taskType: 'PICKUP',
    shipmentCode,
    note: 'auto smoke test',
  });
  console.log('Task created:', task);

  console.log('Assigning task to courier...');
  const assigned = await request('POST', `${DISPATCH_URL}/tasks/${task.id}/assign`, {
    courierId,
  });
  console.log('Task assigned:', assigned);

  console.log('Marking task completed (simulate courier pickup scan)...');
  const completed = await request('PATCH', `${DISPATCH_URL}/tasks/${task.id}/status`, {
    status: 'COMPLETED',
  });
  console.log('Task completed:', completed);

  console.log('\nDone. Check UIs:');
  console.log(`- Shipment code: ${shipmentCode}`);
  console.log(`- Task code: ${taskCode}`);
  console.log(`- Courier ID: ${courierId}`);
}

main().catch((err) => {
  console.error('Smoke flow failed:', err.message);
  process.exitCode = 1;
});
