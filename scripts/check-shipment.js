async function main() {
  const code = '333577082054';
  const opsRes = await fetch('http://localhost:3000/ops/auth/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '10000001', password: 'password' }),
  });
  const opsToken = (await opsRes.json()).accessToken;

  const shipRes = await fetch(`http://localhost:3000/ops/shipment/shipments/${code}`, {
    headers: { Authorization: `Bearer ${opsToken}` },
  });
  console.log('--- SHIPMENT ---');
  const shipment = await shipRes.json();
  console.log(JSON.stringify(shipment, null, 2));

  const tasksRes = await fetch(`http://localhost:3000/ops/dispatch/tasks?shipmentCode=${code}`, {
    headers: { Authorization: `Bearer ${opsToken}` },
  });
  console.log('--- DISPATCH TASKS ---');
  const tasks = await tasksRes.json();
  console.log(JSON.stringify(tasks, null, 2));
}

main().catch(console.error);
