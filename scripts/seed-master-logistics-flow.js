const path = require('path');
const { PrismaClient: ShipmentPrisma } = require(path.resolve(__dirname, '../services/shipment-service/node_modules/@prisma/client'));
const { PrismaClient: TrackingPrisma } = require(path.resolve(__dirname, '../services/tracking-service/node_modules/@prisma/client'));
const { PrismaClient: DispatchPrisma } = require(path.resolve(__dirname, '../services/dispatch-service/node_modules/@prisma/client'));
const { PrismaClient: ManifestPrisma } = require(path.resolve(__dirname, '../services/manifest-service/node_modules/@prisma/client'));

const shipmentDb = new ShipmentPrisma({
  datasources: { db: { url: process.env.SHIPMENT_DB_URL ?? 'postgresql://postgres:postgres@localhost:15432/shipment_db' } },
});

const trackingDb = new TrackingPrisma({
  datasources: { db: { url: process.env.TRACKING_DB_URL ?? 'postgresql://postgres:postgres@localhost:15432/tracking_db' } },
});

const dispatchDb = new DispatchPrisma({
  datasources: { db: { url: process.env.DISPATCH_DB_URL ?? 'postgresql://postgres:postgres@localhost:15432/dispatch_db' } },
});

const manifestDb = new ManifestPrisma({
  datasources: { db: { url: process.env.MANIFEST_DB_URL ?? 'postgresql://postgres:postgres@localhost:15432/manifest_db' } },
});

async function runSeed() {
  console.log('🚀 Starting Master Logistics Demo Data Seed Generation...');

  // 1. Clean existing demo shipments
  console.log('🧹 Cleaning existing demo shipments...');
  await shipmentDb.shipment.deleteMany({
    where: {
      OR: [
        { code: { startsWith: '101' } },
        { code: { startsWith: '111' } },
        { code: { startsWith: '222' } },
        { code: { startsWith: '333' } },
      ],
    },
  });

  await trackingDb.timelineEvent.deleteMany({
    where: {
      OR: [
        { shipmentCode: { startsWith: '101' } },
        { shipmentCode: { startsWith: '111' } },
        { shipmentCode: { startsWith: '222' } },
        { shipmentCode: { startsWith: '333' } },
      ],
    },
  });

  await trackingDb.trackingCurrent.deleteMany({
    where: {
      OR: [
        { shipmentCode: { startsWith: '101' } },
        { shipmentCode: { startsWith: '111' } },
        { shipmentCode: { startsWith: '222' } },
        { shipmentCode: { startsWith: '333' } },
      ],
    },
  });

  await dispatchDb.taskAssignment.deleteMany({
    where: {
      task: {
        OR: [
          { shipmentCode: { startsWith: '101' } },
          { shipmentCode: { startsWith: '111' } },
          { shipmentCode: { startsWith: '222' } },
          { shipmentCode: { startsWith: '333' } },
        ],
      },
    },
  });

  await dispatchDb.task.deleteMany({
    where: {
      OR: [
        { shipmentCode: { startsWith: '101' } },
        { shipmentCode: { startsWith: '111' } },
        { shipmentCode: { startsWith: '222' } },
        { shipmentCode: { startsWith: '333' } },
      ],
    },
  });

  const senders = [
    { name: 'Shop Thời Trang Phố Huế', phone: '0988111222', address: '15 Phố Huế, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội', hubCode: '001001B001', hubName: 'Bưu cục Hà Nội' },
    { name: 'Shop Điện Máy Cầu Giấy', phone: '0977333444', address: '234 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội', hubCode: '001001B001', hubName: 'Bưu cục Hà Nội' },
    { name: 'Tổng Kho Sách Đống Đa', phone: '0966555666', address: '88 Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội', hubCode: '001001B001', hubName: 'Bưu cục Hà Nội' },
    { name: 'Shop Mỹ Phẩm Sài Gòn', phone: '0911888999', address: '456 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh', hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh' },
    { name: 'Tổng Kho Giày Tân Bình', phone: '0922444555', address: '789 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh', hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh' },
  ];

  const receivers = [
    { name: 'Nguyễn Văn Anh', phone: '0912345678', address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh', hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh' },
    { name: 'Trần Thị Bình', phone: '0923456789', address: '45 Lê Văn Sỹ, Phường 13, Quận 3, TP. Hồ Chí Minh', hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh' },
    { name: 'Lê Hoàng Cường', phone: '0934567890', address: '88 Võ Văn Ngân, Phường Bình Thọ, Thành phố Thủ Đức, TP. Hồ Chí Minh', hubCode: '003079B001', hubName: 'Bưu cục Hồ Chí Minh' },
    { name: 'Phạm Minh Dung', phone: '0945678901', address: '12 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu, Thành phố Đà Nẵng', hubCode: '002048B001', hubName: 'Bưu cục Đà Nẵng' },
    { name: 'Đỗ Quốc Dung', phone: '0956789012', address: '56 Kim Mã, Phường Kim Mã, Quận Ba Đình, Hà Nội', hubCode: '001001B001', hubName: 'Bưu cục Hà Nội' },
  ];

  const ndrReasons = [
    'Khách không nghe máy (Gọi 3 lần)',
    'Khách hẹn lại ngày giao (Đi công tác)',
    'Địa chỉ không rõ ràng / Sai số nhà',
    'Khách từ chối nhận (Muốn kiểm tra hàng trước)',
  ];

  const demoShipments = [];
  let shipmentIndex = 1;

  // 1. Stage 1: CREATED (15 shipments)
  for (let i = 0; i < 15; i++) {
    const code = `101${String(shipmentIndex).padStart(9, '0')}`;
    const s = senders[i % senders.length];
    const r = receivers[i % receivers.length];
    demoShipments.push({
      code,
      senderName: s.name,
      senderPhone: s.phone,
      senderAddress: s.address,
      originHubCode: s.hubCode,
      originHubName: s.hubName,
      receiverName: r.name,
      receiverPhone: r.phone,
      receiverAddress: r.address,
      receiverHubCode: r.hubCode,
      receiverHubName: r.hubName,
      currentLocation: s.hubCode,
      currentStatus: 'CREATED',
      weightKg: Number((0.5 + (i * 0.3) % 4).toFixed(1)),
      codAmount: 150000 + (i * 50000),
      serviceType: 'STANDARD',
      dayOffset: Math.floor(i / 3),
      stage: 'CREATED',
    });
    shipmentIndex++;
  }

  // 2. Stage 2: INBOUND_HUB (20 shipments)
  for (let i = 0; i < 20; i++) {
    const code = `101${String(shipmentIndex).padStart(9, '0')}`;
    const s = senders[i % senders.length];
    const r = receivers[i % receivers.length];
    demoShipments.push({
      code,
      senderName: s.name,
      senderPhone: s.phone,
      senderAddress: s.address,
      originHubCode: s.hubCode,
      originHubName: s.hubName,
      receiverName: r.name,
      receiverPhone: r.phone,
      receiverAddress: r.address,
      receiverHubCode: r.hubCode,
      receiverHubName: r.hubName,
      currentLocation: s.hubCode,
      currentStatus: 'SCAN_INBOUND',
      weightKg: Number((0.8 + (i * 0.4) % 5).toFixed(1)),
      codAmount: 200000 + (i * 75000),
      serviceType: 'FAST',
      dayOffset: Math.floor(i / 3) + 1,
      stage: 'INBOUND_HUB',
      courierId: '30000004',
    });
    shipmentIndex++;
  }

  // 3. Stage 3: IN_TRANSIT Linehaul (25 shipments)
  for (let i = 0; i < 25; i++) {
    const code = `111${String(shipmentIndex).padStart(9, '0')}`;
    const s = senders[i % senders.length];
    const r = receivers[i % receivers.length];
    demoShipments.push({
      code,
      senderName: s.name,
      senderPhone: s.phone,
      senderAddress: s.address,
      originHubCode: '001001B001',
      originHubName: 'Bưu cục Hà Nội',
      receiverName: r.name,
      receiverPhone: r.phone,
      receiverAddress: r.address,
      receiverHubCode: '003079B001',
      receiverHubName: 'Bưu cục Hồ Chí Minh',
      currentLocation: '001N001',
      currentStatus: 'IN_TRANSIT',
      weightKg: Number((1.2 + (i * 0.5) % 6).toFixed(1)),
      codAmount: 350000 + (i * 100000),
      serviceType: 'EXPRESS',
      dayOffset: Math.floor(i / 4) + 2,
      stage: 'IN_TRANSIT',
    });
    shipmentIndex++;
  }

  // 4. Stage 4: OUT_FOR_DELIVERY (25 shipments)
  for (let i = 0; i < 25; i++) {
    const code = `111${String(shipmentIndex).padStart(9, '0')}`;
    const s = senders[i % senders.length];
    const r = receivers[i % receivers.length];
    demoShipments.push({
      code,
      senderName: s.name,
      senderPhone: s.phone,
      senderAddress: s.address,
      originHubCode: '001001B001',
      originHubName: 'Bưu cục Hà Nội',
      receiverName: r.name,
      receiverPhone: r.phone,
      receiverAddress: r.address,
      receiverHubCode: '003079B001',
      receiverHubName: 'Bưu cục Hồ Chí Minh',
      currentLocation: '003079B001',
      currentStatus: 'OUT_FOR_DELIVERY',
      weightKg: Number((0.6 + (i * 0.2) % 3).toFixed(1)),
      codAmount: 280000 + (i * 60000),
      serviceType: 'STANDARD',
      dayOffset: Math.floor(i / 4) + 3,
      stage: 'OUT_FOR_DELIVERY',
      courierId: '30000001',
    });
    shipmentIndex++;
  }

  // 5. Stage 5: NDR_CASE (15 shipments)
  for (let i = 0; i < 15; i++) {
    const code = `222${String(shipmentIndex).padStart(9, '0')}`;
    const s = senders[i % senders.length];
    const r = receivers[i % receivers.length];
    demoShipments.push({
      code,
      senderName: s.name,
      senderPhone: s.phone,
      senderAddress: s.address,
      originHubCode: s.hubCode,
      originHubName: s.hubName,
      receiverName: r.name,
      receiverPhone: r.phone,
      receiverAddress: r.address,
      receiverHubCode: '003079B001',
      receiverHubName: 'Bưu cục Hồ Chí Minh',
      currentLocation: '003079B001',
      currentStatus: 'NDR_CREATED',
      weightKg: 1.5,
      codAmount: 450000,
      serviceType: 'STANDARD',
      dayOffset: Math.floor(i / 3) + 4,
      stage: 'NDR_CASE',
      ndrReason: ndrReasons[i % ndrReasons.length],
      courierId: '30000001',
    });
    shipmentIndex++;
  }

  // 6. Stage 6: DELIVERED (30 shipments)
  for (let i = 0; i < 30; i++) {
    const code = `333${String(shipmentIndex).padStart(9, '0')}`;
    const s = senders[i % senders.length];
    const r = receivers[i % receivers.length];
    demoShipments.push({
      code,
      senderName: s.name,
      senderPhone: s.phone,
      senderAddress: s.address,
      originHubCode: s.hubCode,
      originHubName: s.hubName,
      receiverName: r.name,
      receiverPhone: r.phone,
      receiverAddress: r.address,
      receiverHubCode: '003079B001',
      receiverHubName: 'Bưu cục Hồ Chí Minh',
      currentLocation: '003079B001',
      currentStatus: 'DELIVERED',
      weightKg: Number((0.5 + (i * 0.3) % 4).toFixed(1)),
      codAmount: 180000 + (i * 40000),
      serviceType: 'FAST',
      dayOffset: Math.floor(i / 5) + 1,
      stage: 'DELIVERED',
      courierId: '30000001',
    });
    shipmentIndex++;
  }

  console.log(`📦 Inserting ${demoShipments.length} Master Operational Demo Shipments...`);

function toShipmentEnumStatus(status) {
  switch (status) {
    case 'CREATED': return 'CREATED';
    case 'INBOUND_HUB': return 'SCAN_INBOUND';
    case 'SCAN_INBOUND': return 'SCAN_INBOUND';
    case 'IN_TRANSIT': return 'IN_TRANSIT';
    case 'OUT_FOR_DELIVERY': return 'TASK_ASSIGNED';
    case 'DELIVERY_FAILED': return 'DELIVERY_FAILED';
    case 'NDR_CREATED': return 'NDR_CREATED';
    case 'DELIVERED': return 'DELIVERED';
    default: return 'CREATED';
  }
}

  for (const item of demoShipments) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - item.dayOffset);

    const t1 = new Date(baseDate.getTime());
    const t2 = new Date(baseDate.getTime() + 2 * 3600 * 1000);
    const t3 = new Date(baseDate.getTime() + 5 * 3600 * 1000);
    const t4 = new Date(baseDate.getTime() + 10 * 3600 * 1000);
    const t5 = new Date(baseDate.getTime() + 20 * 3600 * 1000);
    const t6 = new Date(baseDate.getTime() + 24 * 3600 * 1000);

    const metadata = {
      shipmentCode: item.code,
      senderName: item.senderName,
      senderPhone: item.senderPhone,
      senderAddress: item.senderAddress,
      originHubCode: item.originHubCode,
      originHubName: item.originHubName,
      receiverName: item.receiverName,
      receiverPhone: item.receiverPhone,
      receiverAddress: item.receiverAddress,
      receiverHubCode: item.receiverHubCode,
      receiverHubName: item.receiverHubName,
      currentLocation: item.currentLocation,
      currentStatus: item.currentStatus,
      weightKg: item.weightKg,
      codAmount: item.codAmount,
      serviceType: item.serviceType,
      ndrReason: item.ndrReason,
    };

    const enumStatus = toShipmentEnumStatus(item.currentStatus);

    // Insert Shipment in shipment_db
    await shipmentDb.shipment.upsert({
      where: { code: item.code },
      create: {
        id: `ship_${item.code}`,
        code: item.code,
        currentStatus: enumStatus,
        metadata,
        createdAt: t1,
        updatedAt: t6,
      },
      update: {
        currentStatus: enumStatus,
        metadata,
        updatedAt: t6,
      },
    });

    // Build timeline events for tracking_db
    const events = [
      { type: 'ORDER_CREATED', time: t1, location: item.originHubName, actor: 'Merchant Shop', desc: `Tạo vận đơn ${item.code} thành công` },
    ];

    if (item.stage !== 'CREATED') {
      events.push({ type: 'PICKUP_ASSIGNED', time: t2, location: item.originHubName, actor: 'Ops Hà Nội', desc: 'Đã phân công Courier đến shop nhận kiện hàng' });
      events.push({ type: 'PICKED_UP', time: t3, location: item.senderAddress, actor: `Courier ${item.courierId ?? '30000004'}`, desc: 'Courier đã lấy hàng thành công tại shop' });
      events.push({ type: 'SCAN_INBOUND', time: t4, location: item.originHubName, actor: 'Nhân viên Kho', desc: `Quét nhập kho tại ${item.originHubName}` });
    }

    if (item.stage === 'IN_TRANSIT' || item.stage === 'OUT_FOR_DELIVERY' || item.stage === 'NDR_CASE' || item.stage === 'DELIVERED') {
      events.push({ type: 'MANIFEST_SEALED', time: t5, location: 'Hub miền Bắc (001N001)', actor: 'Điều phối Linehaul', desc: 'Đóng bao MB001001001 niêm phong tem xe XT001003001' });
      events.push({ type: 'IN_TRANSIT', time: t5, location: 'Tuyến xe Linehaul Bắc - Nam', actor: 'Tài xế Linehaul', desc: 'Chuyến xe XT001003001 đang vận chuyển liên miền' });
    }

    if (item.stage === 'OUT_FOR_DELIVERY' || item.stage === 'NDR_CASE' || item.stage === 'DELIVERED') {
      events.push({ type: 'MANIFEST_UNSEALED', time: t5, location: item.receiverHubName, actor: 'Bưu cục Đích', desc: `Bắt bao và dỡ kiện hàng tại ${item.receiverHubName}` });
      events.push({ type: 'OUT_FOR_DELIVERY', time: t6, location: item.receiverAddress, actor: `Courier ${item.courierId ?? '30000001'}`, desc: 'Courier xuất phát đi phát hàng' });
    }

    if (item.stage === 'NDR_CASE') {
      events.push({ type: 'DELIVERY_FAILED', time: t6, location: item.receiverAddress, actor: `Courier ${item.courierId ?? '30000001'}`, desc: `Giao hàng thất bại: ${item.ndrReason}` });
      events.push({ type: 'NDR_CREATED', time: t6, location: item.receiverHubName, actor: 'Hệ thống CS', desc: 'Khởi tạo ca xử lý NDR giao lại' });
    }

    if (item.stage === 'DELIVERED') {
      events.push({ type: 'DELIVERED', time: t6, location: item.receiverAddress, actor: `Courier ${item.courierId ?? '30000001'}`, desc: `Giao hàng thành công. Ký nhận POD. Thu hộ COD ${item.codAmount.toLocaleString('vi-VN')}đ` });
    }

    // Insert timeline events in tracking_db
    for (const evt of events) {
      const eventId = `evt_${item.code}_${evt.type}`;
      try {
        await trackingDb.timelineEvent.upsert({
          where: { eventId },
          create: {
            id: `id_${eventId}`,
            eventId,
            eventType: evt.type,
            shipmentCode: item.code,
            actor: evt.actor,
            locationCode: evt.location,
            payload: { description: evt.desc, status: evt.type },
            occurredAt: evt.time,
            createdAt: evt.time,
            updatedAt: evt.time,
          },
          update: {},
        });
      } catch (err) {
        // Ignore duplicate timeline events if any
      }
    }

    // Insert TrackingCurrent snapshot in tracking_db
    const lastEvt = events[events.length - 1];
    await trackingDb.trackingCurrent.upsert({
      where: { shipmentCode: item.code },
      create: {
        id: `cur_${item.code}`,
        shipmentCode: item.code,
        currentStatus: item.currentStatus,
        currentLocationCode: item.currentLocation,
        lastEventId: `evt_${item.code}_${lastEvt.type}`,
        lastEventType: lastEvt.type,
        lastEventAt: lastEvt.time,
        viewPayload: { ...metadata, timeline: events },
        createdAt: lastEvt.time,
        updatedAt: lastEvt.time,
      },
      update: {
        currentStatus: item.currentStatus,
        currentLocationCode: item.currentLocation,
        lastEventAt: lastEvt.time,
        viewPayload: { ...metadata, timeline: events },
        updatedAt: lastEvt.time,
      },
    });

    // Insert Task in dispatch_db if courier assigned
    if (item.courierId) {
      const taskCode = `TASK_${item.code}`;
      const taskType = item.stage === 'INBOUND_HUB' ? 'PICKUP' : 'DELIVERY';
      const taskStatus = item.stage === 'DELIVERED' ? 'COMPLETED' : 'ASSIGNED';

      const taskObj = await dispatchDb.task.upsert({
        where: { taskCode },
        create: {
          id: `task_${item.code}`,
          taskCode,
          taskType,
          status: taskStatus,
          shipmentCode: item.code,
          note: 'Task demo cho bưu cục',
          createdAt: t6,
          updatedAt: t6,
        },
        update: {
          status: taskStatus,
          updatedAt: t6,
        },
      });

      try {
        await dispatchDb.taskAssignment.create({
          data: {
            id: `asg_${item.code}`,
            taskId: taskObj.id,
            courierId: item.courierId,
            assignedAt: t6,
            createdAt: t6,
            updatedAt: t6,
          },
        });
      } catch (err) {
        // Ignore assignment duplicates if any
      }
    }
  }

  console.log('✅ Successfully Seeded 125 Master Logistics Demo Shipments with Complete Step-by-Step Timelines!');

  await shipmentDb.$disconnect();
  await trackingDb.$disconnect();
  await dispatchDb.$disconnect();
  await manifestDb.$disconnect();

  console.log('🎉 Seed Execution Completed Cleanly!');
}

runSeed().catch((err) => {
  console.error('❌ Master Logistics Seed Error:', err);
  process.exit(1);
});
