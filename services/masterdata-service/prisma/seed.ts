import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const zones = [
    { code: 'ZONE_HCM', name: 'Ho Chi Minh', parentCode: null },
    { code: 'ZONE_HCM_Q1', name: 'Ho Chi Minh - District 1', parentCode: 'ZONE_HCM' },
    { code: 'ZONE_HN', name: 'Ha Noi', parentCode: null },
  ] as const;

  for (const zone of zones) {
    await prisma.zone.upsert({
      where: { code: zone.code },
      update: {
        name: zone.name,
        parentCode: zone.parentCode,
        isActive: true,
      },
      create: {
        code: zone.code,
        name: zone.name,
        parentCode: zone.parentCode,
        isActive: true,
      },
    });
  }

  const hubs = [
    {
      code: 'HUB_HCM_01',
      name: 'HCM Central Hub',
      zoneCode: 'ZONE_HCM',
      address: 'District 1, Ho Chi Minh City',
    },
    {
      code: 'HUB_HN_01',
      name: 'HN Central Hub',
      zoneCode: 'ZONE_HN',
      address: 'Cau Giay, Ha Noi',
    },
  ] as const;

  for (const hub of hubs) {
    await prisma.hub.upsert({
      where: { code: hub.code },
      update: {
        name: hub.name,
        zoneCode: hub.zoneCode,
        address: hub.address,
        isActive: true,
      },
      create: {
        code: hub.code,
        name: hub.name,
        zoneCode: hub.zoneCode,
        address: hub.address,
        isActive: true,
      },
    });
  }

  const ndrReasons = [
    { code: 'CUSTOMER_NOT_HOME', description: 'Customer not at home' },
    { code: 'WRONG_ADDRESS', description: 'Wrong or incomplete address' },
    { code: 'CUSTOMER_REFUSED', description: 'Customer refused shipment' },
  ] as const;

  for (const ndrReason of ndrReasons) {
    await prisma.ndrReason.upsert({
      where: { code: ndrReason.code },
      update: {
        description: ndrReason.description,
        isActive: true,
      },
      create: {
        code: ndrReason.code,
        description: ndrReason.description,
        isActive: true,
      },
    });
  }

  const configs = [
    {
      key: 'pricing.base_fee',
      value: { vn: 15000 },
      scope: 'shipping',
      description: 'Default base shipping fee in VND',
    },
    {
      key: 'pickup.cutoff_hour',
      value: 17,
      scope: 'pickup',
      description: 'Cutoff hour for same-day pickup request',
    },
    {
      key: 'delivery.max_attempts',
      value: 3,
      scope: 'delivery',
      description: 'Maximum delivery attempts before NDR escalation',
    },
  ] as const;

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        scope: config.scope,
        description: config.description,
      },
      create: {
        key: config.key,
        value: config.value,
        scope: config.scope,
        description: config.description,
      },
    });
  }

  console.log('masterdata-service seed completed');
}

main()
  .catch((error) => {
    console.error('masterdata-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
