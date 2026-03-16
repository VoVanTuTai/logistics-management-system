import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();

  const scanEvents = [
    {
      idempotencyKey: 'seed-scan-inbound-shp1001',
      shipmentCode: 'SHP1001',
      scanType: 'INBOUND' as const,
      locationCode: 'HN-01',
      manifestCode: 'MNF1001',
      actor: 'ops.admin',
      note: 'Seed inbound scan',
      occurredAt: now,
    },
    {
      idempotencyKey: 'seed-scan-outbound-shp1002',
      shipmentCode: 'SHP1002',
      scanType: 'OUTBOUND' as const,
      locationCode: 'SG-01',
      manifestCode: 'MNF1002',
      actor: 'ops.admin',
      note: 'Seed outbound scan',
      occurredAt: now,
    },
  ] as const;

  for (const scanEvent of scanEvents) {
    const record = await prisma.scanEvent.upsert({
      where: { idempotencyKey: scanEvent.idempotencyKey },
      update: {
        shipmentCode: scanEvent.shipmentCode,
        scanType: scanEvent.scanType,
        locationCode: scanEvent.locationCode,
        manifestCode: scanEvent.manifestCode,
        actor: scanEvent.actor,
        note: scanEvent.note,
        occurredAt: scanEvent.occurredAt,
      },
      create: {
        idempotencyKey: scanEvent.idempotencyKey,
        shipmentCode: scanEvent.shipmentCode,
        scanType: scanEvent.scanType,
        locationCode: scanEvent.locationCode,
        manifestCode: scanEvent.manifestCode,
        actor: scanEvent.actor,
        note: scanEvent.note,
        occurredAt: scanEvent.occurredAt,
      },
    });

    await prisma.currentLocation.upsert({
      where: { shipmentCode: scanEvent.shipmentCode },
      update: {
        locationCode: scanEvent.locationCode,
        lastScanType: scanEvent.scanType,
        lastScanEventId: record.id,
        lastScannedAt: scanEvent.occurredAt,
        manifestCode: scanEvent.manifestCode,
      },
      create: {
        shipmentCode: scanEvent.shipmentCode,
        locationCode: scanEvent.locationCode,
        lastScanType: scanEvent.scanType,
        lastScanEventId: record.id,
        lastScannedAt: scanEvent.occurredAt,
        manifestCode: scanEvent.manifestCode,
      },
    });
  }

  console.log('scan-service seed completed');
}

main()
  .catch((error) => {
    console.error('scan-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
