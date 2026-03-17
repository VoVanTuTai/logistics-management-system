import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const pickupRequests = [
    {
      pickupCode: 'PU1001',
      status: 'REQUESTED' as const,
      requesterName: 'Ops Tester',
      contactPhone: '0900000001',
      pickupAddress: 'Hub HN-01',
      note: 'Seed pickup requested',
      cancellationReason: null,
      completedAt: null,
      items: ['SHP1001', 'SHP1003'],
    },
    {
      pickupCode: 'PU1002',
      status: 'COMPLETED' as const,
      requesterName: 'Ops Tester 2',
      contactPhone: '0900000002',
      pickupAddress: 'Hub SG-01',
      note: 'Seed pickup completed',
      cancellationReason: null,
      completedAt: new Date(),
      items: ['SHP1002'],
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
        cancellationReason: request.cancellationReason,
        completedAt: request.completedAt,
      },
    });

    await prisma.pickupItem.deleteMany({ where: { pickupRequestId: record.id } });
    await prisma.pickupItem.createMany({
      data: request.items.map((shipmentCode) => ({
        pickupRequestId: record.id,
        shipmentCode,
        quantity: 1,
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
