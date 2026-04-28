import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_SEED_CODES = ['SHP1001', 'SHP1002', 'SHP1003', 'SHP1004'];

async function main(): Promise<void> {
  await prisma.changeRequest.deleteMany({
    where: { shipmentCode: { in: LEGACY_SEED_CODES } },
  });
  await prisma.shipment.deleteMany({
    where: { code: { in: LEGACY_SEED_CODES } },
  });

  const shipments = [
    {
      code: '101000000001',
      currentStatus: 'PICKUP_COMPLETED' as const,
      metadata: {
        sourceType: 'SHOP',
        merchantCode: '41100001',
        merchantName: 'Shop Minh Anh',
        senderName: 'Shop Minh Anh',
        senderPhone: '0900003001',
        senderAddress: '15 Nguyễn Văn Lộc, Mộ Lao, Hà Đông, Hà Nội',
        receiverName: 'Nguyễn Minh Tâm',
        receiverPhone: '0903123241',
        receiverAddress: '88 Trần Phú, Văn Quán, Hà Đông, Hà Nội',
        originHubCode: '001A001',
        destinationHubCode: '001A001',
        routeCode: '001A00101',
        note: 'Đã nhận tại bưu cục, chưa quét gửi ra khỏi bưu cục.',
      },
      cancellationReason: null,
    },
    {
      code: '111000000001',
      currentStatus: 'SCAN_INBOUND' as const,
      metadata: {
        sourceType: 'MARKETPLACE',
        merchantCode: '41100002',
        merchantName: 'TikTok Pte. Ltd.',
        senderName: 'TikTok Pte. Ltd.',
        senderPhone: '0900003002',
        senderAddress: 'Hải Châu, Đà Nẵng',
        receiverName: 'Trần Hoài An',
        receiverPhone: '0912775775',
        receiverAddress: 'KĐT Geleximco, Dương Nội, Hà Đông, Hà Nội',
        originHubCode: '002A001',
        destinationHubCode: '001A001',
        routeCode: '001A00102',
        bagCode: 'MB0010000001',
        note: 'Đã quét hàng đến bưu cục đích.',
      },
      cancellationReason: null,
    },
    {
      code: '101000000002',
      currentStatus: 'SCAN_OUTBOUND' as const,
      metadata: {
        sourceType: 'SHOP',
        merchantCode: '41100001',
        merchantName: 'Shop Minh Anh',
        senderName: 'Shop Minh Anh',
        senderPhone: '0900003001',
        senderAddress: '15 Nguyễn Văn Lộc, Mộ Lao, Hà Đông, Hà Nội',
        receiverName: 'Phạm Thanh Huyền',
        receiverPhone: '0986103103',
        receiverAddress: '88 Trần Duy Hưng, Trung Hòa, Cầu Giấy, Hà Nội',
        originHubCode: '001A001',
        destinationHubCode: '001B001',
        routeCode: '001B00101',
        bagCode: 'MB0010000002',
        note: 'Đã quét gửi, bưu cục đích chưa quét hàng nhận.',
      },
      cancellationReason: null,
    },
    {
      code: '333000000001',
      currentStatus: 'SCAN_INBOUND' as const,
      metadata: {
        sourceType: 'WALK_IN',
        senderName: 'Khách lẻ Lê Quốc Việt',
        senderPhone: '0968520520',
        senderAddress: '12 Tố Hữu, La Khê, Hà Đông, Hà Nội',
        receiverName: 'Lê Quốc Việt',
        receiverPhone: '0968520520',
        receiverAddress: '12 Tố Hữu, La Khê, Hà Đông, Hà Nội',
        originHubCode: '001A001',
        destinationHubCode: '001A001',
        routeCode: '001A00103',
        codAmount: 180000,
        note: 'Đơn khách lẻ đang chờ phát tại bưu cục.',
      },
      cancellationReason: null,
    },
    {
      code: '222000000001',
      currentStatus: 'RETURN_STARTED' as const,
      metadata: {
        sourceType: 'RETURN_PICKUP',
        merchantCode: '41100003',
        merchantName: 'Kho trả hàng Shopee',
        senderName: 'Người mua trả hàng',
        senderPhone: '0908123456',
        senderAddress: 'Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
        receiverName: 'Kho trả hàng Shopee',
        receiverPhone: '0900003003',
        receiverAddress: 'Hàm Nghi, Nam Từ Liêm, Hà Nội',
        originHubCode: '001C001',
        destinationHubCode: '001B001',
        routeCode: '001B00102',
        note: 'Đơn thu hồi từ khách trả hàng, đã bắt đầu chuyển hoàn.',
      },
      cancellationReason: null,
    },
    {
      code: '111000000002',
      currentStatus: 'NDR_CREATED' as const,
      metadata: {
        sourceType: 'MARKETPLACE',
        merchantCode: '41100002',
        merchantName: 'TikTok Pte. Ltd.',
        senderName: 'TikTok Pte. Ltd.',
        senderPhone: '0900003002',
        senderAddress: 'Hải Châu, Đà Nẵng',
        receiverName: 'Nguyễn Thị Đào',
        receiverPhone: '0909988776',
        receiverAddress: 'Mộ Lao, Hà Đông, Hà Nội',
        originHubCode: '002A001',
        destinationHubCode: '001A001',
        routeCode: '001A00104',
        note: 'Phát thất bại, đã tạo NDR.',
      },
      cancellationReason: null,
    },
    {
      code: '333000000002',
      currentStatus: 'DELIVERED' as const,
      metadata: {
        sourceType: 'WALK_IN',
        senderName: 'Khách lẻ Đỗ Minh',
        senderPhone: '0911222333',
        senderAddress: 'Quận 1, Thành phố Hồ Chí Minh',
        receiverName: 'Võ Minh Đức',
        receiverPhone: '0904555666',
        receiverAddress: 'Hải Châu, Đà Nẵng',
        originHubCode: '003A001',
        destinationHubCode: '002A001',
        routeCode: '002A00101',
        note: 'Đơn khách lẻ đã phát thành công.',
      },
      cancellationReason: null,
    },
  ] as const;

  for (const shipment of shipments) {
    await prisma.shipment.upsert({
      where: { code: shipment.code },
      update: {
        currentStatus: shipment.currentStatus,
        metadata: shipment.metadata,
        cancellationReason: shipment.cancellationReason,
      },
      create: {
        code: shipment.code,
        currentStatus: shipment.currentStatus,
        metadata: shipment.metadata,
        cancellationReason: shipment.cancellationReason,
      },
    });
  }

  await prisma.changeRequest.upsert({
    where: { id: 'seed-change-222000000001-return-address' },
    update: {
      shipmentCode: '222000000001',
      requestType: 'RETURN_ADDRESS_CHANGE',
      payload: {
        reason: 'Người gửi yêu cầu chuyển hoàn',
        destinationHubCode: '001B001',
      },
      status: 'PENDING',
      requestedBy: '20000001',
    },
    create: {
      id: 'seed-change-222000000001-return-address',
      shipmentCode: '222000000001',
      requestType: 'RETURN_ADDRESS_CHANGE',
      payload: {
        reason: 'Người gửi yêu cầu chuyển hoàn',
        destinationHubCode: '001B001',
      },
      status: 'PENDING',
      requestedBy: '20000001',
    },
  });

  console.log('shipment-service seed completed');
}

main()
  .catch((error) => {
    console.error('shipment-service seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
