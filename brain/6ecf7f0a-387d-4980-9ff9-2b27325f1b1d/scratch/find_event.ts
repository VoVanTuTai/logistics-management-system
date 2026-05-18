import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const code = 'SHP260504C6ADB2';
  const events = await prisma.outboxEvent.findMany();
  const matched = events.filter(e => (e.payload as any)?.shipment_code === code);
  
  console.log(`Found ${matched.length} events for ${code}`);
  if (matched.length > 0) {
    console.log(JSON.stringify(matched, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
