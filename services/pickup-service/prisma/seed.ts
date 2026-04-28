import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();

  const pickupRequests = [
    {
      pickupCode: 'PU001A001001',
      status: 'COMPLETED' as const,
      requesterName: 'Shop Minh Anh',
      contactPhone: '0900003001',
      pickupAddress: '15 Nguyễn Văn Lộc, Mộ Lao, Hà Đông, Hà Nội',
      note: 'Lấy hàng shop, tuyến 001A00101.',
      approvedBy: '20000001',
      approvedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      cancellationReason: null,
      completedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      items: [
        { shipmentCode: '101000000001', quantity: 1 },
        { shipmentCode: '101000000002', quantity: 1 },
      ],
    },
    {
      pickupCode: 'PU001C001001',
      status: 'APPROVED' as const,
      requesterName: 'Kho trả hàng Shopee',
      contactPhone: '0900003003',
      pickupAddress: 'Hàm Nghi, Nam Từ Liêm, Hà Nội',
      note: 'Điều phối lấy hàng trả, tuyến 001C00101.',
      approvedBy: '20000002',
      approvedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      cancellationReason: null,
      completedAt: null,
      items: [{ shipmentCode: '222000000001', quantity: 1 }],
    },
    {
      pickupCode: 'PU002A001001',
      status: 'REQUESTED' as const,
      requesterName: 'TikTok Pte. Ltd.',
      contactPhone: '0900003002',
      pickupAddress: 'Hải Châu, Đà Nẵng',
      note: 'Yêu cầu lấy hàng sàn TMDT.',
      approvedBy: null,
      approvedAt: null,
      cancellationReason: null,
      completedAt: null,
      items: [
        { shipmentCode: '111000000001', quantity: 1 },
        { shipmentCode: '111000000002', quantity: 1 },
      ],
    },
  ] as const;

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

  console.log('pickup-service seed completed');
}

main()
  .catch((error) => {
    console.error('pickup-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
