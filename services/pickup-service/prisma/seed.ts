import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    opsUser: '20000001',
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
  },
  {
    key: 'hcm',
    hubCode: '003A001',
    opsUser: '20000002',
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
  },
] as const;

type TaskSeedStatus = (typeof taskStatusPattern)[number];

function buildShipmentCode(hubCode: string, index: number): string {
  const hubSegment = hubCode.slice(0, 3);
  return `101${hubSegment}20${String(index).padStart(4, '0')}`;
}

function mapPickupRequestStatus(status: TaskSeedStatus) {
  if (status === 'CREATED') {
    return 'REQUESTED' as const;
  }

  if (status === 'COMPLETED') {
    return 'COMPLETED' as const;
  }

  if (status === 'CANCELLED') {
    return 'CANCELLED' as const;
  }

  return 'APPROVED' as const;
}

function buildPickupRequests(now: Date) {
  return hubFixtures.flatMap((hub) =>
    taskStatusPattern.map((taskStatus, itemIndex) => {
      const index = itemIndex + 1;
      const merchant = hub.merchants[itemIndex % hub.merchants.length];
      const status = mapPickupRequestStatus(taskStatus);
      const offsetHours = 24 + itemIndex;

      return {
        id: `seed-pickup-${hub.key}-${String(index).padStart(2, '0')}`,
        pickupCode: `PU${hub.hubCode}${String(index).padStart(3, '0')}`,
        status,
        requesterName: merchant.name,
        contactPhone: merchant.phone,
        pickupAddress: merchant.address,
        note:
          status === 'CANCELLED'
            ? `Seed ${hub.hubCode}: lấy hàng thất bại cho ${merchant.code}.`
            : `Seed ${hub.hubCode}: yêu cầu lấy hàng ${index} của ${merchant.code}.`,
        approvedBy: status === 'REQUESTED' ? null : hub.opsUser,
        approvedAt:
          status === 'REQUESTED'
            ? null
            : new Date(now.getTime() - offsetHours * 60 * 60 * 1000),
        cancellationReason:
          status === 'CANCELLED' ? 'Seed test: lấy hàng thất bại' : null,
        completedAt:
          status === 'COMPLETED'
            ? new Date(now.getTime() - (offsetHours - 1) * 60 * 60 * 1000)
            : null,
        items: [{ shipmentCode: buildShipmentCode(hub.hubCode, index), quantity: 1 }],
      };
    }),
  );
}

async function main(): Promise<void> {
  const now = new Date();
  const pickupRequests = buildPickupRequests(now);

  for (const request of pickupRequests) {
    const record = await prisma.pickupRequest.upsert({
      where: { pickupCode: request.pickupCode },
      update: {
        status: request.status,
        requesterName: request.requesterName,
        contactPhone: request.contactPhone,
        pickupAddress: request.pickupAddress,
        note: request.note,
        approvedBy: request.approvedBy,
        approvedAt: request.approvedAt,
        cancellationReason: request.cancellationReason,
        completedAt: request.completedAt,
      },
      create: {
        id: request.id,
        pickupCode: request.pickupCode,
        status: request.status,
        requesterName: request.requesterName,
        contactPhone: request.contactPhone,
        pickupAddress: request.pickupAddress,
        note: request.note,
        approvedBy: request.approvedBy,
        approvedAt: request.approvedAt,
        cancellationReason: request.cancellationReason,
        completedAt: request.completedAt,
      },
    });

    await prisma.pickupItem.deleteMany({ where: { pickupRequestId: record.id } });
    await prisma.pickupItem.createMany({
      data: request.items.map((item) => ({
        pickupRequestId: record.id,
        shipmentCode: item.shipmentCode,
        quantity: item.quantity,
      })),
    });
  }

  console.log(`pickup-service seed completed: ${pickupRequests.length} requests`);
}

main()
  .catch((error) => {
    console.error('pickup-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
