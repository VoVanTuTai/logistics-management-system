import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const manifests = [
    {
      manifestCode: 'MNF1001',
      status: 'CREATED' as const,
      originHubCode: 'HN-01',
      destinationHubCode: 'HN-02',
      note: 'Seed manifest created',
      sealedAt: null,
      receivedAt: null,
      shipmentCodes: ['SHP1001'],
      sealRecord: null,
    },
    {
      manifestCode: 'MNF1002',
      status: 'SEALED' as const,
      originHubCode: 'SG-01',
      destinationHubCode: 'SG-02',
      note: 'Seed manifest sealed',
      sealedAt: new Date(),
      receivedAt: null,
      shipmentCodes: ['SHP1002', 'SHP1003'],
      sealRecord: {
        sealedBy: 'ops.admin',
        note: 'Seed seal',
        sealedAt: new Date(),
      },
    },
  ] as const;

  for (const manifest of manifests) {
    const record = await prisma.manifest.upsert({
      where: { manifestCode: manifest.manifestCode },
      update: {
        status: manifest.status,
        originHubCode: manifest.originHubCode,
        destinationHubCode: manifest.destinationHubCode,
        note: manifest.note,
        sealedAt: manifest.sealedAt,
        receivedAt: manifest.receivedAt,
      },
      create: {
        manifestCode: manifest.manifestCode,
        status: manifest.status,
        originHubCode: manifest.originHubCode,
        destinationHubCode: manifest.destinationHubCode,
        note: manifest.note,
        sealedAt: manifest.sealedAt,
        receivedAt: manifest.receivedAt,
      },
    });

    await prisma.manifestItem.deleteMany({ where: { manifestId: record.id } });
    await prisma.manifestItem.createMany({
      data: manifest.shipmentCodes.map((shipmentCode) => ({
        manifestId: record.id,
        shipmentCode,
      })),
    });

    if (manifest.sealRecord) {
      await prisma.sealRecord.upsert({
        where: { manifestId: record.id },
        update: {
          sealedBy: manifest.sealRecord.sealedBy,
          note: manifest.sealRecord.note,
          sealedAt: manifest.sealRecord.sealedAt,
        },
        create: {
          manifestId: record.id,
          sealedBy: manifest.sealRecord.sealedBy,
          note: manifest.sealRecord.note,
          sealedAt: manifest.sealRecord.sealedAt,
        },
      });
    } else {
      await prisma.sealRecord.deleteMany({ where: { manifestId: record.id } });
    }

    await prisma.receiveRecord.deleteMany({ where: { manifestId: record.id } });
  }

  console.log('manifest-service seed completed');
}

main()
  .catch((error) => {
    console.error('manifest-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
