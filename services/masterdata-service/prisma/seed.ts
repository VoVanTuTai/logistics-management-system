import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureAuxiliaryCodeTables(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS hub_routes (
      id bigserial PRIMARY KEY,
      hub_code text NOT NULL REFERENCES hubs(code) ON DELETE CASCADE,
      route_code text NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT hub_routes_route_code_chk CHECK (route_code ~ '^(0[1-9]|10)$'),
      CONSTRAINT hub_routes_hub_route_unique UNIQUE (hub_code, route_code)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS vehicle_tags (
      id bigserial PRIMARY KEY,
      tag_code text NOT NULL UNIQUE,
      hub_code text NULL REFERENCES hubs(code),
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT vehicle_tags_code_chk CHECK (tag_code ~ '^XT[0-9]{10}$')
    );
  `);
}

async function main(): Promise<void> {
  const zones = [
    { code: '001', name: 'Miền Bắc', parentCode: null },
    { code: '003', name: 'Miền Nam', parentCode: null },
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
      code: '001A001',
      name: 'Hub Hà Nội',
      zoneCode: '001',
      address: 'Số 15 Nguyễn Văn Lộc, Mộ Lao, Hà Đông, Hà Nội',
    },
    {
      code: '003A001',
      name: 'Hub Hồ Chí Minh',
      zoneCode: '003',
      address: 'Số 12 Nguyễn Huệ, Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
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

  await ensureAuxiliaryCodeTables();

  for (const hub of hubs) {
    for (let routeNumber = 1; routeNumber <= 10; routeNumber += 1) {
      const routeCode = String(routeNumber).padStart(2, '0');
      await prisma.$executeRaw`
        INSERT INTO hub_routes (hub_code, route_code)
        VALUES (${hub.code}, ${routeCode})
        ON CONFLICT (hub_code, route_code) DO UPDATE SET
          is_active = true,
          updated_at = now();
      `;
    }
  }

  const vehicleTags = [
    { tagCode: 'XT0010000001', hubCode: '001A001' },
    { tagCode: 'XT0010000002', hubCode: '001A001' },
    { tagCode: 'XT0030000001', hubCode: '003A001' },
    { tagCode: 'XT0030000002', hubCode: '003A001' },
  ] as const;

  for (const vehicleTag of vehicleTags) {
    await prisma.$executeRaw`
      INSERT INTO vehicle_tags (tag_code, hub_code)
      VALUES (${vehicleTag.tagCode}, ${vehicleTag.hubCode})
      ON CONFLICT (tag_code) DO UPDATE SET
        hub_code = EXCLUDED.hub_code,
        is_active = true,
        updated_at = now();
    `;
  }

  const ndrReasons = [
    { code: 'CUSTOMER_NOT_HOME', description: 'Khách không có ở địa chỉ nhận' },
    { code: 'WRONG_ADDRESS', description: 'Sai hoặc thiếu địa chỉ nhận' },
    { code: 'CUSTOMER_REFUSED', description: 'Khách từ chối nhận hàng' },
    { code: 'NO_ANSWER', description: 'Không liên lạc được với khách hàng' },
    { code: 'CUSTOMER_RESCHEDULE', description: 'Khách hẹn lại ngày nhận' },
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
      value: { vnd: 15000 },
      scope: 'shipping',
      description: 'Phí vận chuyển cơ bản mặc định',
    },
    {
      key: 'pickup.cutoff_hour',
      value: 17,
      scope: 'pickup',
      description: 'Giờ chốt yêu cầu lấy hàng trong ngày',
    },
    {
      key: 'delivery.max_attempts',
      value: 3,
      scope: 'delivery',
      description: 'Số lần phát tối đa trước khi tạo NDR',
    },
    {
      key: 'code_rules.version',
      value: {
        hubSegment1: ['001', '002', '003'],
        hubSegment2Pattern: '<segment1><area[A-Z]><3 digits>',
        hubRouteCodes: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
        shipmentPrefixes: {
          marketplace: '111',
          shop: '101',
          returnPickup: '222',
          walkIn: '333',
        },
      },
      scope: 'code-rules',
      description: 'Quy luật mã dùng cho seed API thật',
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
