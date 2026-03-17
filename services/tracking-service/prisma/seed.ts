import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();

  const shipmentCurrents = [
    {
      shipmentCode: 'SHP1001',
      currentStatus: 'SCAN_INBOUND',
      currentLocationCode: 'HN-01',
      lastEventId: 'seed-track-shp1001-scan-inbound',
      lastEventType: 'scan.inbound',
      lastEventAt: now,
      viewPayload: {
        source: 'seed',
      },
    },
    {
      shipmentCode: 'SHP1002',
      currentStatus: 'NDR_CREATED',
      currentLocationCode: 'SG-01',
      lastEventId: 'seed-track-shp1002-ndr-created',
      lastEventType: 'ndr.created',
      lastEventAt: now,
      viewPayload: {
        source: 'seed',
      },
    },
  ] as const;

  for (const current of shipmentCurrents) {
    await prisma.trackingCurrent.upsert({
      where: { shipmentCode: current.shipmentCode },
      update: {
        currentStatus: current.currentStatus,
        currentLocationCode: current.currentLocationCode,
        lastEventId: current.lastEventId,
        lastEventType: current.lastEventType,
        lastEventAt: current.lastEventAt,
        viewPayload: current.viewPayload,
      },
      create: {
        shipmentCode: current.shipmentCode,
        currentStatus: current.currentStatus,
        currentLocationCode: current.currentLocationCode,
        lastEventId: current.lastEventId,
        lastEventType: current.lastEventType,
        lastEventAt: current.lastEventAt,
        viewPayload: current.viewPayload,
      },
    });

    await prisma.trackingIndex.upsert({
      where: { shipmentCode: current.shipmentCode },
      update: {
        latestEventType: current.lastEventType,
        latestEventAt: current.lastEventAt,
      },
      create: {
        shipmentCode: current.shipmentCode,
        latestEventType: current.lastEventType,
        latestEventAt: current.lastEventAt,
      },
    });
  }

  const timelineEvents = [
    {
      eventId: 'seed-track-shp1001-created',
      eventType: 'shipment.created',
      shipmentCode: 'SHP1001',
      actor: 'system',
      locationCode: 'HN-01',
      payload: { statusAfterEvent: 'CREATED' },
      occurredAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-shp1001-scan-inbound',
      eventType: 'scan.inbound',
      shipmentCode: 'SHP1001',
      actor: 'ops.admin',
      locationCode: 'HN-01',
      payload: { statusAfterEvent: 'SCAN_INBOUND' },
      occurredAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-shp1002-created',
      eventType: 'shipment.created',
      shipmentCode: 'SHP1002',
      actor: 'system',
      locationCode: 'SG-01',
      payload: { statusAfterEvent: 'CREATED' },
      occurredAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-shp1002-ndr-created',
      eventType: 'ndr.created',
      shipmentCode: 'SHP1002',
      actor: 'delivery-service',
      locationCode: 'SG-01',
      payload: { statusAfterEvent: 'NDR_CREATED' },
      occurredAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
  ] as const;

  for (const event of timelineEvents) {
    await prisma.timelineEvent.upsert({
      where: { eventId: event.eventId },
      update: {
        eventType: event.eventType,
        shipmentCode: event.shipmentCode,
        actor: event.actor,
        locationCode: event.locationCode,
        payload: event.payload,
        occurredAt: event.occurredAt,
      },
      create: {
        eventId: event.eventId,
        eventType: event.eventType,
        shipmentCode: event.shipmentCode,
        actor: event.actor,
        locationCode: event.locationCode,
        payload: event.payload,
        occurredAt: event.occurredAt,
      },
    });
  }

  console.log('tracking-service seed completed');
}

main()
  .catch((error) => {
    console.error('tracking-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
