import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_SEED_CODES = [
  'SHP1001',
  'SHP1002',
  'SHP1003',
  'SHP1004',
  '101000000001',
  '101000000002',
  '111000000001',
  '111000000002',
  '222000000001',
  '333000000001',
  '333000000002',
];

const taskStatusPattern = [
  'CREATED',
  'CREATED',
  'CREATED',
  'ASSIGNED',
  'ASSIGNED',
  'ASSIGNED',
  'COMPLETED',
  'COMPLETED',
  'CANCELLED',
  'CANCELLED',
] as const;

const hubFixtures = [
  {
    key: 'hn',
    hubCode: '001A001',
    hubName: 'Hub Hà Nội',
    city: 'Hà Nội',
    routeCode: '001A00101',
    merchants: [
      {
        code: '41100001',
        name: 'Shop Minh Anh Hà Nội',
        phone: '0900003001',
        address: '15 Nguyễn Văn Lộc, Mộ Lao, Hà Đông, Hà Nội',
      },
      {
        code: '41100002',
        name: 'Thời trang Bảo Ngọc Hà Nội',
        phone: '0900003002',
        address: '88 Trần Duy Hưng, Trung Hòa, Cầu Giấy, Hà Nội',
      },
    ],
    receivers: [
      'Nguyễn Minh Tâm',
      'Trần Hoài An',
      'Phạm Thanh Huyền',
      'Lê Quốc Việt',
      'Nguyễn Thị Đào',
      'Đỗ Minh Quân',
      'Bùi Hà Phương',
      'Vũ Hải Nam',
      'Đặng Hoàng Linh',
      'Phan Anh Tú',
    ],
    receiverAddress: '12 Tố Hữu, La Khê, Hà Đông, Hà Nội',
  },
  {
    key: 'hcm',
    hubCode: '003A001',
    hubName: 'Hub Hồ Chí Minh',
    city: 'Thành phố Hồ Chí Minh',
    routeCode: '003A00101',
    merchants: [
      {
        code: '41100003',
        name: 'Shop Sài Gòn Fresh',
        phone: '0900003003',
        address: '24 Lê Lợi, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
      },
      {
        code: '41100004',
        name: 'Mỹ phẩm An Nhiên HCM',
        phone: '0900003004',
        address: '70 Nguyễn Trãi, Bến Thành, Quận 1, Thành phố Hồ Chí Minh',
      },
    ],
    receivers: [
      'Võ Minh Đức',
      'Nguyễn Hồng Ngọc',
      'Trần Gia Bảo',
      'Lê Phương Uyên',
      'Hoàng Tuấn Kiệt',
      'Mai Thanh Trúc',
      'Đinh Khánh Linh',
      'Phạm Quốc Dũng',
      'Lâm Nhật Minh',
      'Cao Bảo Châu',
    ],
    receiverAddress: '18 Cộng Hòa, Phường 4, Tân Bình, Thành phố Hồ Chí Minh',
  },
] as const;

type TaskSeedStatus = (typeof taskStatusPattern)[number];

function buildShipmentCode(
  hubCode: string,
  flow: 'delivery' | 'pickup',
  index: number,
): string {
  const hubSegment = hubCode.slice(0, 3);
  const flowSegment = flow === 'delivery' ? '10' : '20';
  return `101${hubSegment}${flowSegment}${String(index).padStart(4, '0')}`;
}

function mapDeliveryStatus(status: TaskSeedStatus, index: number) {
  if (status === 'CREATED') {
    return 'SCAN_INBOUND' as const;
  }

  if (status === 'ASSIGNED') {
    return 'TASK_ASSIGNED' as const;
  }

  if (status === 'COMPLETED') {
    return 'DELIVERED' as const;
  }

  return index % 2 === 0 ? ('DELIVERY_FAILED' as const) : ('CANCELLED' as const);
}

function mapPickupStatus(status: TaskSeedStatus) {
  if (status === 'CREATED') {
    return 'CREATED' as const;
  }

  if (status === 'ASSIGNED') {
    return 'TASK_ASSIGNED' as const;
  }

  if (status === 'COMPLETED') {
    return 'PICKUP_COMPLETED' as const;
  }

  return 'CANCELLED' as const;
}

function buildShipments() {
  return hubFixtures.flatMap((hub) => {
    const deliveryShipments = taskStatusPattern.map((taskStatus, itemIndex) => {
      const merchant = hub.merchants[itemIndex % hub.merchants.length];
      const index = itemIndex + 1;

      return {
        code: buildShipmentCode(hub.hubCode, 'delivery', index),
        currentStatus: mapDeliveryStatus(taskStatus, index),
        metadata: {
          sourceType: 'SHOP',
          flow: 'DELIVERY',
          seedHub: hub.key,
          merchantCode: merchant.code,
          merchantName: merchant.name,
          senderName: merchant.name,
          senderPhone: merchant.phone,
          senderAddress: merchant.address,
          receiverName: hub.receivers[itemIndex],
          receiverPhone: `091${String(itemIndex + 1).padStart(7, '0')}`,
          receiverAddress: hub.receiverAddress,
          receiverRegion: hub.city,
          platform: 'Merchant Portal',
          serviceType: 'Giao hàng tiêu chuẩn',
          originHubCode: hub.hubCode,
          destinationHubCode: hub.hubCode,
          currentHubCode: hub.hubCode,
          currentLocation: hub.hubCode,
          routeCode: hub.routeCode,
          taskSeedStatus: taskStatus,
          note: `Seed ${hub.hubName}: đơn giao ${index} trạng thái ${taskStatus}.`,
        },
        cancellationReason:
          taskStatus === 'CANCELLED' ? 'Seed test: khách hủy đơn giao' : null,
      };
    });

    const pickupShipments = taskStatusPattern.map((taskStatus, itemIndex) => {
      const merchant = hub.merchants[itemIndex % hub.merchants.length];
      const index = itemIndex + 1;

      return {
        code: buildShipmentCode(hub.hubCode, 'pickup', index),
        currentStatus: mapPickupStatus(taskStatus),
        metadata: {
          sourceType: 'SHOP',
          flow: 'PICKUP',
          seedHub: hub.key,
          merchantCode: merchant.code,
          merchantName: merchant.name,
          senderName: merchant.name,
          senderPhone: merchant.phone,
          senderAddress: merchant.address,
          receiverName: hub.receivers[(itemIndex + 3) % hub.receivers.length],
          receiverPhone: `092${String(itemIndex + 1).padStart(7, '0')}`,
          receiverAddress: hub.receiverAddress,
          receiverRegion: hub.city,
          platform: 'Merchant Portal',
          serviceType: 'Lấy hàng tại nhà',
          originHubCode: hub.hubCode,
          destinationHubCode: hub.hubCode,
          currentHubCode: hub.hubCode,
          currentLocation: hub.hubCode,
          routeCode: hub.routeCode,
          pickupRequestId: `seed-pickup-${hub.key}-${String(index).padStart(2, '0')}`,
          taskSeedStatus: taskStatus,
          note: `Seed ${hub.hubName}: đơn lấy ${index} trạng thái ${taskStatus}.`,
        },
        cancellationReason:
          taskStatus === 'CANCELLED' ? 'Seed test: lấy hàng thất bại' : null,
      };
    });

    return [...deliveryShipments, ...pickupShipments];
  });
}

async function main(): Promise<void> {
  await prisma.changeRequest.deleteMany({
    where: { shipmentCode: { in: LEGACY_SEED_CODES } },
  });
  await prisma.shipment.deleteMany({
    where: { code: { in: LEGACY_SEED_CODES } },
  });

  const shipments = buildShipments();

  for (const shipment of shipments) {
    await prisma.shipment.upsert({
      where: { code: shipment.code },
      update: {
        currentStatus: shipment.currentStatus,
        metadata: shipment.metadata,
        cancellationReason: shipment.cancellationReason,
      },
      create: {
        code: shipment.code,
        currentStatus: shipment.currentStatus,
        metadata: shipment.metadata,
        cancellationReason: shipment.cancellationReason,
      },
    });
  }

  console.log(`shipment-service seed completed: ${shipments.length} shipments`);
}

main()
  .catch((error) => {
    console.error('shipment-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
