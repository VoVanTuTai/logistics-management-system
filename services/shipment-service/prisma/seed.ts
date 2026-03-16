import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const shipments = [
    {
      code: 'SHP1001',
      currentStatus: 'SCAN_INBOUND' as const,
      metadata: {
        senderName: 'Alice',
        receiverName: 'Bob',
        note: 'Seed shipment 1',
      },
      cancellationReason: null,
    },
    {
      code: 'SHP1002',
      currentStatus: 'NDR_CREATED' as const,
      metadata: {
        senderName: 'Charlie',
        receiverName: 'David',
        note: 'Seed shipment 2',
      },
      cancellationReason: null,
    },
    {
      code: 'SHP1003',
      currentStatus: 'TASK_ASSIGNED' as const,
      metadata: {
        senderName: 'Eve',
        receiverName: 'Frank',
        note: 'Seed shipment 3',
      },
      cancellationReason: null,
    },
  ] as const;

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

  console.log('shipment-service seed completed');
}

main()
  .catch((error) => {
    console.error('shipment-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
