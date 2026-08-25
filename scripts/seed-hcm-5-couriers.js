const path = require('path');
const { createHash } = require('crypto');
const { PrismaClient: MasterdataPrisma } = require(
  path.resolve(
    __dirname,
    '../services/masterdata-service/node_modules/@prisma/client',
  ),
);
const { PrismaClient: AuthPrisma } = require(
  path.resolve(
    __dirname,
    '../services/auth-service/node_modules/@prisma/client',
  ),
);

const masterdataDb = new MasterdataPrisma({
  datasources: {
    db: {
      url:
        process.env.MASTERDATA_DB_URL ??
        'postgresql://postgres:postgres@localhost:15432/masterdata_db',
    },
  },
});

const authDb = new AuthPrisma({
  datasources: {
    db: {
      url:
        process.env.AUTH_DB_URL ??
        'postgresql://postgres:postgres@localhost:15432/auth_db',
    },
  },
});

const HCM_HUB_CODE = '003079B001';
const PROVINCE = 'Hồ Chí Minh';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'password';
const PASSWORD_HASH = createHash('sha256').update(DEMO_PASSWORD).digest('hex');

const COURIER_ROUTES = [
  {
    courierId: '30000001',
    courierName: 'Courier 01 - Nguyễn Văn An',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    zoneName: 'Tuyến Trung Tâm Chợ Bến Thành - Lê Lai',
    colorHex: '#38bdf8',
    sampleAddress: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    boundaryPolygon: [
      [10.7680, 106.6870],
      [10.7760, 106.6900],
      [10.7780, 106.6960],
      [10.7710, 106.6950],
      [10.7680, 106.6870],
    ],
  },
  {
    courierId: '30000002',
    courierName: 'Courier 02 - Trần Văn Bình',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    zoneName: 'Tuyến Nhà Thờ Đức Bà - Lê Duẩn',
    colorHex: '#f97316',
    sampleAddress: '45 Lê Lợi, P. Bến Nghé, Q.1, TPHCM',
    boundaryPolygon: [
      [10.7730, 106.6985],
      [10.7820, 106.7010],
      [10.7850, 106.7080],
      [10.7750, 106.7070],
      [10.7730, 106.6985],
    ],
  },
  {
    courierId: '30000003',
    courierName: 'Courier 03 - Lê Văn Cường',
    district: 'Quận 3',
    ward: 'Phường 13',
    zoneName: 'Tuyến Phố Thời Trang Lê Văn Sỹ',
    colorHex: '#10b981',
    sampleAddress: '78 Lê Văn Sỹ, Phường 13, Quận 3, TP. Hồ Chí Minh',
    boundaryPolygon: [
      [10.7830, 106.6720],
      [10.7920, 106.6740],
      [10.7930, 106.6820],
      [10.7850, 106.6810],
      [10.7830, 106.6720],
    ],
  },
  {
    courierId: '30000004',
    courierName: 'Courier 04 - Phạm Văn Dũng',
    district: 'Quận 5',
    ward: 'Phường 2',
    zoneName: 'Tuyến Phố Trần Hưng Đạo - Chợ Quán',
    colorHex: '#ec4899',
    sampleAddress: '88 Trần Hưng Đạo, P.02, Q.5, TPHCM',
    boundaryPolygon: [
      [10.7480, 106.6740],
      [10.7570, 106.6750],
      [10.7580, 106.6830],
      [10.7500, 106.6820],
      [10.7480, 106.6740],
    ],
  },
  {
    courierId: '30000005',
    courierName: 'Courier 05 - Hoàng Văn Em',
    district: 'Quận Tân Bình',
    ward: 'Phường 13',
    zoneName: 'Tuyến Trục Đường Cộng Hòa - Hoàng Hoa Thám',
    colorHex: '#8b5cf6',
    sampleAddress: '789 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
    boundaryPolygon: [
      [10.7960, 106.6340],
      [10.8120, 106.6380],
      [10.8100, 106.6520],
      [10.7980, 106.6490],
      [10.7960, 106.6340],
    ],
  },
];

async function runSeed() {
  console.log('🚀 Khởi tạo tài khoản Courier & Tuyến phân công Bưu cục Hồ Chí Minh (003079B001)...');

  try {
    for (const route of COURIER_ROUTES) {
      // 1. Tạo hoặc cập nhật tài khoản Auth cho Courier (30000001 - 30000005)
      await authDb.userAccount.upsert({
        where: { id: route.courierId },
        update: {
          username: route.courierId,
          roles: ['COURIER'],
          displayName: route.courierName,
          hubCodes: [HCM_HUB_CODE],
          status: 'ACTIVE',
        },
        create: {
          id: route.courierId,
          username: route.courierId,
          passwordHash: PASSWORD_HASH,
          roles: ['COURIER'],
          displayName: route.courierName,
          phone: `0903${route.courierId.padStart(6, '0')}`,
          hubCodes: [HCM_HUB_CODE],
          status: 'ACTIVE',
        },
      });

      // 2. Tạo hoặc cập nhật Phân công tuyến cho Courier trong MasterData
      await masterdataDb.courierAreaAssignment.upsert({
        where: {
          courierId_province_district_ward: {
            courierId: route.courierId,
            province: PROVINCE,
            district: route.district,
            ward: route.ward,
          },
        },
        update: {
          hubCode: HCM_HUB_CODE,
          zoneName: route.zoneName,
          colorHex: route.colorHex,
          boundaryPolygon: route.boundaryPolygon,
          isActive: true,
        },
        create: {
          courierId: route.courierId,
          hubCode: HCM_HUB_CODE,
          province: PROVINCE,
          district: route.district,
          ward: route.ward,
          zoneName: route.zoneName,
          colorHex: route.colorHex,
          boundaryPolygon: route.boundaryPolygon,
          isActive: true,
        },
      });

      console.log(
        ` ✅ Đã tạo tài khoản [${route.courierId}] & gán Tuyến [${route.ward}, ${route.district}, ${PROVINCE}]`,
      );
    }

    console.log('\n🎉 Hoàn tất khởi tạo 5 tài khoản Courier (30000001 - 30000005) và tuyến tại HCM!');
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo seed data:', error);
  } finally {
    await masterdataDb.$disconnect();
    await authDb.$disconnect();
  }
}

runSeed();
