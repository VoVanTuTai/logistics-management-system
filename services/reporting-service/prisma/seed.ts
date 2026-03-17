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

async function main(): Promise<void> {
  const today = toUtcDateAtMidnight(new Date());
  const monthKey = toMonthKey(today);

  await upsertDaily(today, 'ALL', 'ALL', 'ALL', {
    shipmentsCreated: 18,
    pickupsCompleted: 11,
    deliveriesDelivered: 9,
    deliveriesFailed: 2,
    ndrCreated: 3,
    scansInbound: 15,
    scansOutbound: 12,
  });

  await upsertDaily(today, 'CR001', 'HN-01', 'NORTH', {
    shipmentsCreated: 8,
    pickupsCompleted: 5,
    deliveriesDelivered: 4,
    deliveriesFailed: 1,
    ndrCreated: 1,
    scansInbound: 6,
    scansOutbound: 5,
  });

  await upsertDaily(today, 'CR002', 'SG-01', 'SOUTH', {
    shipmentsCreated: 10,
    pickupsCompleted: 6,
    deliveriesDelivered: 5,
    deliveriesFailed: 1,
    ndrCreated: 2,
    scansInbound: 9,
    scansOutbound: 7,
  });

  await upsertMonthly(monthKey, 'ALL', 'ALL', 'ALL', {
    shipmentsCreated: 420,
    pickupsCompleted: 310,
    deliveriesDelivered: 270,
    deliveriesFailed: 35,
    ndrCreated: 58,
    scansInbound: 390,
    scansOutbound: 360,
  });

  await upsertMonthly(monthKey, 'CR001', 'HN-01', 'NORTH', {
    shipmentsCreated: 180,
    pickupsCompleted: 140,
    deliveriesDelivered: 120,
    deliveriesFailed: 16,
    ndrCreated: 24,
    scansInbound: 170,
    scansOutbound: 155,
  });

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
