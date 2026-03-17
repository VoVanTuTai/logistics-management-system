import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.ndrCase.deleteMany({
    where: {
      shipmentCode: {
        in: ['SHP1002', 'SHP1003'],
      },
    },
  });

  await prisma.ndrCase.createMany({
    data: [
      {
        shipmentCode: 'SHP1002',
        reasonCode: 'NO_ANSWER',
        note: 'Seed NDR case created',
        status: 'CREATED',
      },
      {
        shipmentCode: 'SHP1003',
        reasonCode: 'CUSTOMER_RESCHEDULE',
        note: 'Seed NDR case rescheduled',
        status: 'RESCHEDULED',
        rescheduleAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.returnCase.deleteMany({
    where: {
      shipmentCode: 'SHP1003',
    },
  });

  await prisma.returnCase.create({
    data: {
      shipmentCode: 'SHP1003',
      note: 'Seed return started',
      status: 'STARTED',
      startedAt: new Date(),
    },
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
