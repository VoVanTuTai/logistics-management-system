import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@localhost:15432/shipment_db?schema=public'
      }
    }
  });

  console.log('Checking shipments...');
  const shipments = await prisma.shipment.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  console.log('Recent shipments:');
  console.table(shipments.map(s => ({
    code: s.code,
    status: s.currentStatus,
    createdAt: s.createdAt
  })));

  const inboundCount = await prisma.shipment.count({
    where: { currentStatus: 'SCAN_INBOUND' }
  });
  console.log('Total SCAN_INBOUND shipments:', inboundCount);

  await prisma.$disconnect();
}

main().catch(console.error);
