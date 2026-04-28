import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function toUtcDateAtMidnight(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function toMonthKey(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function upsertDaily(
  metricDate: Date,
  courierCode: string,
  hubCode: string,
  zoneCode: string,
  values: {
    shipmentsCreated: number;
    pickupsCompleted: number;
    deliveriesDelivered: number;
    deliveriesFailed: number;
    ndrCreated: number;
    scansInbound: number;
    scansOutbound: number;
  },
): Promise<void> {
  await prisma.kpiDaily.upsert({
    where: {
      daily_dimension_unique: {
        metricDate,
        courierCode,
        hubCode,
        zoneCode,
      },
    },
    update: values,
    create: {
      metricDate,
      courierCode,
      hubCode,
      zoneCode,
      ...values,
    },
  });
}

async function upsertMonthly(
  monthKey: string,
  courierCode: string,
  hubCode: string,
  zoneCode: string,
  values: {
    shipmentsCreated: number;
    pickupsCompleted: number;
    deliveriesDelivered: number;
    deliveriesFailed: number;
    ndrCreated: number;
    scansInbound: number;
    scansOutbound: number;
  },
): Promise<void> {
  await prisma.kpiMonthly.upsert({
    where: {
      monthly_dimension_unique: {
        monthKey,
        courierCode,
        hubCode,
        zoneCode,
      },
    },
    update: values,
    create: {
      monthKey,
      courierCode,
      hubCode,
      zoneCode,
      ...values,
    },
  });
}

async function upsertShipmentStatusProjection(input: {
  shipmentCode: string;
  currentStatus: string;
  lastEventType: string;
  lastEventAt: Date;
  courierCode?: string | null;
  hubCode?: string | null;
  zoneCode?: string | null;
}): Promise<void> {
  await prisma.shipmentStatusProjection.upsert({
    where: {
      shipmentCode: input.shipmentCode,
    },
    update: {
      currentStatus: input.currentStatus,
      lastEventType: input.lastEventType,
      lastEventAt: input.lastEventAt,
      courierCode: input.courierCode ?? null,
      hubCode: input.hubCode ?? null,
      zoneCode: input.zoneCode ?? null,
    },
    create: {
      shipmentCode: input.shipmentCode,
      currentStatus: input.currentStatus,
      lastEventType: input.lastEventType,
      lastEventAt: input.lastEventAt,
      courierCode: input.courierCode ?? null,
      hubCode: input.hubCode ?? null,
      zoneCode: input.zoneCode ?? null,
    },
  });
}

async function main(): Promise<void> {
  const today = toUtcDateAtMidnight(new Date());
  const monthKey = toMonthKey(today);

  const allValues = {
    shipmentsCreated: 7,
    pickupsCompleted: 2,
    deliveriesDelivered: 1,
    deliveriesFailed: 1,
    ndrCreated: 1,
    scansInbound: 5,
    scansOutbound: 3,
  };

  await upsertDaily(today, 'ALL', 'ALL', 'ALL', allValues);
  await upsertDaily(today, 'ALL', '001A001', '001', {
    shipmentsCreated: 4,
    pickupsCompleted: 1,
    deliveriesDelivered: 0,
    deliveriesFailed: 1,
    ndrCreated: 1,
    scansInbound: 3,
    scansOutbound: 1,
  });
  await upsertDaily(today, '30000001', '001A001', '001', {
    shipmentsCreated: 0,
    pickupsCompleted: 1,
    deliveriesDelivered: 0,
    deliveriesFailed: 1,
    ndrCreated: 1,
    scansInbound: 0,
    scansOutbound: 0,
  });
  await upsertDaily(today, '30000002', '001A001', '001', {
    shipmentsCreated: 0,
    pickupsCompleted: 0,
    deliveriesDelivered: 0,
    deliveriesFailed: 0,
    ndrCreated: 0,
    scansInbound: 0,
    scansOutbound: 0,
  });
  await upsertDaily(today, '30000004', '002A001', '002', {
    shipmentsCreated: 1,
    pickupsCompleted: 0,
    deliveriesDelivered: 1,
    deliveriesFailed: 0,
    ndrCreated: 0,
    scansInbound: 1,
    scansOutbound: 0,
  });

  await upsertMonthly(monthKey, 'ALL', 'ALL', 'ALL', {
    shipmentsCreated: 210,
    pickupsCompleted: 96,
    deliveriesDelivered: 78,
    deliveriesFailed: 12,
    ndrCreated: 18,
    scansInbound: 145,
    scansOutbound: 122,
  });
  await upsertMonthly(monthKey, 'ALL', '001A001', '001', {
    shipmentsCreated: 126,
    pickupsCompleted: 58,
    deliveriesDelivered: 44,
    deliveriesFailed: 8,
    ndrCreated: 12,
    scansInbound: 86,
    scansOutbound: 70,
  });

  const now = new Date();
  const projections = [
    {
      shipmentCode: '101000000001',
      currentStatus: 'PICKUP_COMPLETED',
      lastEventType: 'scan.pickup',
      courierCode: '30000001',
      hubCode: '001A001',
      zoneCode: '001',
    },
    {
      shipmentCode: '101000000002',
      currentStatus: 'SCAN_OUTBOUND',
      lastEventType: 'scan.outbound',
      courierCode: null,
      hubCode: '001A001',
      zoneCode: '001',
    },
    {
      shipmentCode: '111000000001',
      currentStatus: 'SCAN_INBOUND',
      lastEventType: 'scan.inbound',
      courierCode: null,
      hubCode: '001A001',
      zoneCode: '001',
    },
    {
      shipmentCode: '333000000001',
      currentStatus: 'SCAN_INBOUND',
      lastEventType: 'scan.inbound',
      courierCode: '30000002',
      hubCode: '001A001',
      zoneCode: '001',
    },
    {
      shipmentCode: '222000000001',
      currentStatus: 'RETURN_STARTED',
      lastEventType: 'return.started',
      courierCode: '30000003',
      hubCode: '001C001',
      zoneCode: '001',
    },
    {
      shipmentCode: '111000000002',
      currentStatus: 'NDR_CREATED',
      lastEventType: 'ndr.created',
      courierCode: '30000001',
      hubCode: '001A001',
      zoneCode: '001',
    },
    {
      shipmentCode: '333000000002',
      currentStatus: 'DELIVERED',
      lastEventType: 'delivery.delivered',
      courierCode: '30000004',
      hubCode: '002A001',
      zoneCode: '002',
    },
  ] as const;

  for (const projection of projections) {
    await upsertShipmentStatusProjection({
      ...projection,
      lastEventAt: now,
    });
  }

  console.log('reporting-service seed completed');
}

main()
  .catch((error) => {
    console.error('reporting-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
