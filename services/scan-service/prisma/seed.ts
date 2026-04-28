import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();

  const scanEvents = [
    {
      idempotencyKey: 'seed-pickup-101000000001',
      shipmentCode: '101000000001',
      scanType: 'PICKUP' as const,
      locationCode: '001A001',
      manifestCode: null,
      actor: '20000001',
      note: 'Đã nhận hàng shop tại BC Hà Đông, chưa quét gửi.',
      occurredAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-pickup-101000000002',
      shipmentCode: '101000000002',
      scanType: 'PICKUP' as const,
      locationCode: '001A001',
      manifestCode: null,
      actor: '20000001',
      note: 'Đã nhận hàng shop tại BC Hà Đông.',
      occurredAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-outbound-101000000002',
      shipmentCode: '101000000002',
      scanType: 'OUTBOUND' as const,
      locationCode: '001A001',
      manifestCode: 'MB0010000002',
      actor: '20000001',
      note: 'Đã quét gửi sang BC Cầu Giấy, đích chưa quét nhận.',
      occurredAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-outbound-111000000001',
      shipmentCode: '111000000001',
      scanType: 'OUTBOUND' as const,
      locationCode: '002A001',
      manifestCode: 'MB0010000001',
      actor: '20000003',
      note: 'Đã quét gửi từ BC Đà Nẵng.',
      occurredAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-inbound-111000000001',
      shipmentCode: '111000000001',
      scanType: 'INBOUND' as const,
      locationCode: '001A001',
      manifestCode: 'MB0010000001',
      actor: '20000001',
      note: 'Đã quét hàng đến BC Hà Đông.',
      occurredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-inbound-333000000001',
      shipmentCode: '333000000001',
      scanType: 'INBOUND' as const,
      locationCode: '001A001',
      manifestCode: null,
      actor: '20000001',
      note: 'Đơn khách lẻ đang chờ phát tại BC Hà Đông.',
      occurredAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-inbound-222000000001',
      shipmentCode: '222000000001',
      scanType: 'INBOUND' as const,
      locationCode: '001C001',
      manifestCode: null,
      actor: '20000002',
      note: 'Đơn hàng trả đã nhập BC Nam Từ Liêm.',
      occurredAt: new Date(now.getTime() - 80 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-inbound-111000000002',
      shipmentCode: '111000000002',
      scanType: 'INBOUND' as const,
      locationCode: '001A001',
      manifestCode: null,
      actor: '20000001',
      note: 'Đơn đã nhập bưu cục trước khi phát thất bại.',
      occurredAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
    },
    {
      idempotencyKey: 'seed-inbound-333000000002',
      shipmentCode: '333000000002',
      scanType: 'INBOUND' as const,
      locationCode: '002A001',
      manifestCode: null,
      actor: '20000003',
      note: 'Đơn khách lẻ đã nhập BC Đà Nẵng.',
      occurredAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  ] as const;

  for (const scanEvent of scanEvents) {
    await prisma.scanEvent.upsert({
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
  }

  const latestByShipment = new Map<string, (typeof scanEvents)[number]>();
  for (const scanEvent of scanEvents) {
    const current = latestByShipment.get(scanEvent.shipmentCode);
    if (!current || scanEvent.occurredAt > current.occurredAt) {
      latestByShipment.set(scanEvent.shipmentCode, scanEvent);
    }
  }

  for (const scanEvent of latestByShipment.values()) {
    const record = await prisma.scanEvent.findUniqueOrThrow({
      where: { idempotencyKey: scanEvent.idempotencyKey },
      select: { id: true },
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
