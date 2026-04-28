import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TimelineSeed {
  eventId: string;
  eventType: string;
  shipmentCode: string;
  actor: string;
  locationCode: string;
  payload: Prisma.InputJsonValue;
  occurredAt: Date;
}

async function upsertTimeline(event: TimelineSeed): Promise<void> {
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
    create: event,
  });
}

async function upsertCurrent(input: {
  shipmentCode: string;
  currentStatus: string;
  currentLocationCode: string;
  lastEventId: string;
  lastEventType: string;
  lastEventAt: Date;
  viewPayload: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.trackingCurrent.upsert({
    where: { shipmentCode: input.shipmentCode },
    update: {
      currentStatus: input.currentStatus,
      currentLocationCode: input.currentLocationCode,
      lastEventId: input.lastEventId,
      lastEventType: input.lastEventType,
      lastEventAt: input.lastEventAt,
      viewPayload: input.viewPayload,
    },
    create: input,
  });

  await prisma.trackingIndex.upsert({
    where: { shipmentCode: input.shipmentCode },
    update: {
      latestEventType: input.lastEventType,
      latestEventAt: input.lastEventAt,
    },
    create: {
      shipmentCode: input.shipmentCode,
      latestEventType: input.lastEventType,
      latestEventAt: input.lastEventAt,
    },
  });
}

async function main(): Promise<void> {
  const now = new Date();

  const events: TimelineSeed[] = [
    {
      eventId: 'seed-track-101000000001-pickup',
      eventType: 'scan.pickup',
      shipmentCode: '101000000001',
      actor: '20000001',
      locationCode: '001A001',
      payload: { statusAfterEvent: 'PICKUP_COMPLETED', note: 'Đã nhận, chưa quét gửi.' },
      occurredAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-101000000002-pickup',
      eventType: 'scan.pickup',
      shipmentCode: '101000000002',
      actor: '20000001',
      locationCode: '001A001',
      payload: { statusAfterEvent: 'PICKUP_COMPLETED' },
      occurredAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-101000000002-outbound',
      eventType: 'scan.outbound',
      shipmentCode: '101000000002',
      actor: '20000001',
      locationCode: '001A001',
      payload: {
        statusAfterEvent: 'SCAN_OUTBOUND',
        manifestCode: 'MB0010000002',
        destinationHubCode: '001B001',
      },
      occurredAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-111000000001-outbound',
      eventType: 'scan.outbound',
      shipmentCode: '111000000001',
      actor: '20000003',
      locationCode: '002A001',
      payload: { statusAfterEvent: 'SCAN_OUTBOUND', manifestCode: 'MB0010000001' },
      occurredAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-111000000001-inbound',
      eventType: 'scan.inbound',
      shipmentCode: '111000000001',
      actor: '20000001',
      locationCode: '001A001',
      payload: { statusAfterEvent: 'SCAN_INBOUND', manifestCode: 'MB0010000001' },
      occurredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-333000000001-inbound',
      eventType: 'scan.inbound',
      shipmentCode: '333000000001',
      actor: '20000001',
      locationCode: '001A001',
      payload: { statusAfterEvent: 'SCAN_INBOUND', note: 'Chờ phát hàng.' },
      occurredAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
    {
      eventId: 'seed-track-222000000001-return-started',
      eventType: 'return.started',
      shipmentCode: '222000000001',
      actor: '20000002',
      locationCode: '001C001',
      payload: { statusAfterEvent: 'RETURN_STARTED', reason: 'Người gửi yêu cầu chuyển hoàn' },
      occurredAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
    {
      eventId: 'seed-track-111000000002-ndr-created',
      eventType: 'ndr.created',
      shipmentCode: '111000000002',
      actor: 'delivery-service',
      locationCode: '001A001',
      payload: { statusAfterEvent: 'NDR_CREATED', reasonCode: 'NO_ANSWER' },
      occurredAt: new Date(now.getTime() - 70 * 60 * 1000),
    },
    {
      eventId: 'seed-track-333000000002-delivered',
      eventType: 'delivery.delivered',
      shipmentCode: '333000000002',
      actor: '30000004',
      locationCode: '002A001',
      payload: { statusAfterEvent: 'DELIVERED' },
      occurredAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
  ];

  for (const event of events) {
    await upsertTimeline(event);
  }

  const currentStates = [
    {
      shipmentCode: '101000000001',
      currentStatus: 'PICKUP_COMPLETED',
      currentLocationCode: '001A001',
      lastEventId: 'seed-track-101000000001-pickup',
      lastEventType: 'scan.pickup',
      lastEventAt: events[0].occurredAt,
      viewPayload: { flow: 'received_not_outbound' },
    },
    {
      shipmentCode: '101000000002',
      currentStatus: 'SCAN_OUTBOUND',
      currentLocationCode: '001A001',
      lastEventId: 'seed-track-101000000002-outbound',
      lastEventType: 'scan.outbound',
      lastEventAt: events[2].occurredAt,
      viewPayload: { flow: 'outbound_destination_not_received', destinationHubCode: '001B001' },
    },
    {
      shipmentCode: '111000000001',
      currentStatus: 'SCAN_INBOUND',
      currentLocationCode: '001A001',
      lastEventId: 'seed-track-111000000001-inbound',
      lastEventType: 'scan.inbound',
      lastEventAt: events[4].occurredAt,
      viewPayload: { flow: 'inbound_at_destination' },
    },
    {
      shipmentCode: '333000000001',
      currentStatus: 'SCAN_INBOUND',
      currentLocationCode: '001A001',
      lastEventId: 'seed-track-333000000001-inbound',
      lastEventType: 'scan.inbound',
      lastEventAt: events[5].occurredAt,
      viewPayload: { flow: 'waiting_delivery' },
    },
    {
      shipmentCode: '222000000001',
      currentStatus: 'RETURN_STARTED',
      currentLocationCode: '001C001',
      lastEventId: 'seed-track-222000000001-return-started',
      lastEventType: 'return.started',
      lastEventAt: events[6].occurredAt,
      viewPayload: { flow: 'return_started' },
    },
    {
      shipmentCode: '111000000002',
      currentStatus: 'NDR_CREATED',
      currentLocationCode: '001A001',
      lastEventId: 'seed-track-111000000002-ndr-created',
      lastEventType: 'ndr.created',
      lastEventAt: events[7].occurredAt,
      viewPayload: { flow: 'ndr_created' },
    },
    {
      shipmentCode: '333000000002',
      currentStatus: 'DELIVERED',
      currentLocationCode: '002A001',
      lastEventId: 'seed-track-333000000002-delivered',
      lastEventType: 'delivery.delivered',
      lastEventAt: events[8].occurredAt,
      viewPayload: { flow: 'delivered' },
    },
  ] as const;

  for (const current of currentStates) {
    await upsertCurrent(current);
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
