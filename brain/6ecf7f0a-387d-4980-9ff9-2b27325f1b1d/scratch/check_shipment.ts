import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shipment = await prisma.shipment.findUnique({
    where: { code: 'SHP260504C6ADB2' },
  });
  console.log(JSON.stringify(shipment, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
