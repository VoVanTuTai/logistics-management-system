import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();

  const manifests = [
    {
      manifestCode: 'MB0010000001',
      status: 'RECEIVED' as const,
      originHubCode: '002A001',
      destinationHubCode: '001A001',
      note: 'Bao Đà Nẵng -> Hà Đông đã nhận.',
      sealedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      receivedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      shipmentCodes: ['111000000001'],
      sealRecord: {
        sealedBy: '20000003',
        note: 'Đóng bao đi miền Bắc.',
        sealedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      },
      receiveRecord: {
        receivedBy: '20000001',
        note: 'BC Hà Đông đã nhận bao.',
        receivedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    },
    {
      manifestCode: 'MB0010000002',
      status: 'SEALED' as const,
      originHubCode: '001A001',
      destinationHubCode: '001B001',
      note: 'Bao Hà Đông -> Cầu Giấy, đích chưa nhận.',
      sealedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      receivedAt: null,
      shipmentCodes: ['101000000002'],
      sealRecord: {
        sealedBy: '20000001',
        note: 'Quét gửi sang BC Cầu Giấy.',
        sealedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      receiveRecord: null,
    },
    {
      manifestCode: 'MB0030000001',
      status: 'CREATED' as const,
      originHubCode: '003A001',
      destinationHubCode: '002A001',
      note: 'Bao Quận 1 -> Đà Nẵng đang tạo.',
      sealedAt: null,
      receivedAt: null,
      shipmentCodes: ['333000000002'],
      sealRecord: null,
      receiveRecord: null,
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

    if (manifest.receiveRecord) {
      await prisma.receiveRecord.upsert({
        where: { manifestId: record.id },
        update: {
          receivedBy: manifest.receiveRecord.receivedBy,
          note: manifest.receiveRecord.note,
          receivedAt: manifest.receiveRecord.receivedAt,
        },
        create: {
          manifestId: record.id,
          receivedBy: manifest.receiveRecord.receivedBy,
          note: manifest.receiveRecord.note,
          receivedAt: manifest.receiveRecord.receivedAt,
        },
      });
    } else {
      await prisma.receiveRecord.deleteMany({ where: { manifestId: record.id } });
    }
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
