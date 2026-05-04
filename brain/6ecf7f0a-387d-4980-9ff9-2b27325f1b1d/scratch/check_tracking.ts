import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const code = 'SHP260504C6ADB2';
  const current = await prisma.trackingCurrent.findUnique({
    where: { shipmentCode: code },
  });
  const timeline = await prisma.timelineEvent.findMany({
    where: { shipmentCode: code },
    orderBy: { occurredAt: 'desc' },
  });
  
  console.log('Current Tracking:');
  console.log(JSON.stringify(current, null, 2));
  console.log('\nTimeline Events:');
  console.log(JSON.stringify(timeline, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
