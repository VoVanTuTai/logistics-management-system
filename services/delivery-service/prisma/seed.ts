import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_SHIPMENT_CODES = [
  '333000000001',
  '333000000002',
  '111000000002',
  '222000000001',
] as const;

async function main(): Promise<void> {
  const now = new Date();

  await prisma.pod.deleteMany({
    where: {
      deliveryAttempt: {
        shipmentCode: { in: [...SEED_SHIPMENT_CODES] },
      },
    },
  });
  await prisma.ndrCase.deleteMany({ where: { shipmentCode: { in: [...SEED_SHIPMENT_CODES] } } });
  await prisma.returnCase.deleteMany({ where: { shipmentCode: { in: [...SEED_SHIPMENT_CODES] } } });
  await prisma.deliveryAttempt.deleteMany({
    where: { shipmentCode: { in: [...SEED_SHIPMENT_CODES] } },
  });
  await prisma.otpRecord.deleteMany({ where: { shipmentCode: { in: [...SEED_SHIPMENT_CODES] } } });

  const deliveredAttempt = await prisma.deliveryAttempt.create({
    data: {
      id: 'seed-attempt-333000000002-delivered',
      shipmentCode: '333000000002',
      taskId: 'TASK002A001001',
      courierId: '30000004',
      locationCode: '002A001',
      actor: '30000004',
      note: 'Seed phát thành công.',
      status: 'DELIVERED',
      occurredAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
  });

  await prisma.pod.create({
    data: {
      deliveryAttemptId: deliveredAttempt.id,
      imageUrl: 'https://example.test/pod/333000000002.jpg',
      note: 'Khách đã nhận hàng.',
      capturedBy: '30000004',
      capturedAt: new Date(now.getTime() - 43 * 60 * 1000),
    },
  });

  await prisma.deliveryAttempt.create({
    data: {
      shipmentCode: '333000000001',
      taskId: 'TASK001A001002',
      courierId: '30000002',
      locationCode: '001A001',
      actor: '30000002',
      note: 'Đang phát hàng, chưa hoàn tất.',
      status: 'ATTEMPTED',
      occurredAt: new Date(now.getTime() - 25 * 60 * 1000),
    },
  });

  const failedAttempt = await prisma.deliveryAttempt.create({
    data: {
      id: 'seed-attempt-111000000002-failed',
      shipmentCode: '111000000002',
      taskId: null,
      courierId: '30000001',
      locationCode: '001A001',
      actor: '30000001',
      note: 'Không liên lạc được với khách hàng.',
      status: 'FAILED',
      failReasonCode: 'NO_ANSWER',
      occurredAt: new Date(now.getTime() - 70 * 60 * 1000),
    },
  });

  await prisma.ndrCase.create({
    data: {
      shipmentCode: '111000000002',
      deliveryAttemptId: failedAttempt.id,
      reasonCode: 'NO_ANSWER',
      note: 'Seed NDR: không liên lạc được với khách hàng.',
      status: 'CREATED',
    },
  });

  await prisma.returnCase.create({
    data: {
      shipmentCode: '222000000001',
      note: 'Seed chuyển hoàn do người gửi yêu cầu.',
      status: 'STARTED',
      startedAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
  });

  await prisma.otpRecord.createMany({
    data: [
      {
        shipmentCode: '333000000002',
        otpCode: '123456',
        status: 'VERIFIED',
        sentBy: '30000004',
        verifiedBy: '30000004',
        sentAt: new Date(now.getTime() - 50 * 60 * 1000),
        verifiedAt: new Date(now.getTime() - 44 * 60 * 1000),
      },
      {
        shipmentCode: '333000000001',
        otpCode: '654321',
        status: 'SENT',
        sentBy: '30000002',
        sentAt: new Date(now.getTime() - 20 * 60 * 1000),
      },
    ],
  });

  console.log('delivery-service seed completed');
}

main()
  .catch((error) => {
    console.error('delivery-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
