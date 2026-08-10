const path = require('path');
const { PrismaClient: MasterdataPrisma } = require(
  path.resolve(
    __dirname,
    '../services/masterdata-service/node_modules/@prisma/client',
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

const HCM_HUB_CODE = '003079B001';
const PROVINCE = 'Hồ Chí Minh';

const COURIER_ROUTES = [
  {
    courierId: 'courier-hcm-01',
    courierName: 'Courier 01 - Nguyễn Văn Tuyến 1',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    sampleAddress: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  },
  {
    courierId: 'courier-hcm-02',
    courierName: 'Courier 02 - Trần Văn Tuyến 2',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    sampleAddress: '45 Lê Lợi, P. Bến Nghé, Q.1, TPHCM',
  },
  {
    courierId: 'courier-hcm-03',
    courierName: 'Courier 03 - Lê Văn Tuyến 3',
    district: 'Quận 3',
    ward: 'Phường 13',
    sampleAddress: '78 Lê Văn Sỹ, Phường 13, Quận 3, TP. Hồ Chí Minh',
  },
  {
    courierId: 'courier-hcm-04',
    courierName: 'Courier 04 - Phạm Văn Tuyến 4',
    district: 'Quận 5',
    ward: 'Phường 2',
    sampleAddress: '88 Trần Hưng Đạo, P.02, Q.5, TPHCM',
  },
  {
    courierId: 'courier-hcm-05',
    courierName: 'Courier 05 - Hoàng Văn Tuyến 5',
    district: 'Quận Tân Bình',
    ward: 'Phường 13',
    sampleAddress: '789 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
  },
];

async function runSeed() {
  console.log('🚀 Khởi tạo dữ liệu Bưu cục Hồ Chí Minh (003079B001) với 5 Courier chia theo tuyến...');

  try {
    for (const route of COURIER_ROUTES) {
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
          isActive: true,
        },
        create: {
          courierId: route.courierId,
          hubCode: HCM_HUB_CODE,
          province: PROVINCE,
          district: route.district,
          ward: route.ward,
          isActive: true,
        },
      });

      console.log(
        ` ✅ Phân công Courier [${route.courierId}] -> Tuyến [${route.ward}, ${route.district}, ${PROVINCE}]`,
      );
    }

    console.log('\n🎉 Đã khởi tạo thành công 5 Courier phân theo 5 tuyến tại Bưu cục Hồ Chí Minh (003079B001)!');
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo seed data:', error);
  } finally {
    await masterdataDb.$disconnect();
  }
}

runSeed();
