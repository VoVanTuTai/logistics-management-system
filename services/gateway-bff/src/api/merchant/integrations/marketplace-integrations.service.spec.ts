import { test } from 'node:test';
const assert = require('node:assert');

import { MarketplaceIntegrationsService } from './marketplace-integrations.service';
import type { ServiceRegistryClient } from '../../../infrastructure/clients/service-registry.client';

test('MarketplaceIntegrationsService hub resolution & address formatting', async (t) => {
  const dummyRegistryClient = {
    resolveServiceUrl: () => 'http://localhost:3000',
  } as unknown as ServiceRegistryClient;

  const service = new MarketplaceIntegrationsService(dummyRegistryClient);

  const mockHubs = [
    // Ward hubs in HCM (Level 3)
    {
      code: '07912W001',
      name: 'Bưu cục Phường An Phú Đông - Quận 12',
      level: 3,
      district: 'Quận 12',
      ward: 'Phường An Phú Đông',
      address: JSON.stringify({
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 12',
        ward: 'Phường An Phú Đông',
        type: 'BRANCH',
        coverageProvinceNames: ['Thành phố Hồ Chí Minh'],
      }),
      isActive: true,
    },
    {
      code: '07901W001',
      name: 'Bưu cục Phường Bến Thành',
      level: 3,
      district: 'Quận 1',
      ward: 'Phường Bến Thành',
      address: JSON.stringify({
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Thành',
        type: 'BRANCH',
        coverageProvinceNames: ['Thành phố Hồ Chí Minh'],
      }),
      isActive: true,
    },
    // Provincial Central Hub HCM (Level 2)
    {
      code: '003079B001',
      name: 'Hub TP Hồ Chí Minh',
      level: 2,
      district: '',
      ward: '',
      address: JSON.stringify({
        province: 'Thành phố Hồ Chí Minh',
        type: 'BRANCH',
        addressLine: 'Trung tâm khai thác Hồ Chí Minh',
        coverageProvinceNames: ['Thành phố Hồ Chí Minh'],
      }),
      isActive: true,
    },
    // Provincial Central Hub Ha Noi (Level 2)
    {
      code: '001001B001',
      name: 'Hub Hà Nội',
      level: 2,
      district: '',
      ward: '',
      address: JSON.stringify({
        province: 'Thành phố Hà Nội',
        type: 'BRANCH',
        addressLine: 'Trung tâm khai thác Hà Nội',
        coverageProvinceNames: ['Thành phố Hà Nội', 'Hà Nội'],
      }),
      isActive: true,
    },
  ];

  await t.test('resolves Level 2 Provincial Hub when no specific ward is matched (NOT random An Phú Đông)', () => {
    // Calling private method via bracket syntax for unit testing
    const resolveHubForAddress = (service as any).resolveHubForAddress.bind(service);

    const resolved = resolveHubForAddress(
      mockHubs,
      {
        address: '123 Nguyễn Huệ',
        province: 'Hồ Chí Minh',
      },
      'sender',
    );

    assert.equal(resolved.code, '003079B001', 'Should resolve to Level 2 Hub HCM, not 07912W001');
  });

  await t.test('resolves exact Ward Hub when ward matches', () => {
    const resolveHubForAddress = (service as any).resolveHubForAddress.bind(service);

    const resolved = resolveHubForAddress(
      mockHubs,
      {
        address: '456 Lê Lợi',
        ward: 'Phường Bến Thành',
        district: 'Quận 1',
        province: 'Hồ Chí Minh',
      },
      'receiver',
    );

    assert.equal(resolved.code, '07901W001', 'Should resolve to Bưu cục Phường Bến Thành');
  });

  await t.test('resolves explicit hub code and alias (e.g. HCM-001 -> 003079B001)', () => {
    const resolveHubForAddress = (service as any).resolveHubForAddress.bind(service);

    const resolved = resolveHubForAddress(
      mockHubs,
      {
        address: '123 Đường Bất Kỳ',
        province: 'Hồ Chí Minh',
        hubCode: 'HCM-001',
      },
      'sender',
    );

    assert.equal(resolved.code, '003079B001', 'Should resolve HCM-001 alias to 003079B001');
  });

  await t.test('recognizes dtcomerge, dtcommerce, DT_COMMERCE platform variations', () => {
    const isDtCommerce = (service as any).isDtCommercePlatform.bind(service);

    assert.equal(isDtCommerce('DT_COMMERCE'), true);
    assert.equal(isDtCommerce('dtcommerce'), true);
    assert.equal(isDtCommerce('dt-commerce'), true);
    assert.equal(isDtCommerce('dtcomerge'), true);
    assert.equal(isDtCommerce('DTCOMERGE'), true);
    assert.equal(isDtCommerce('SHOPEE'), false);
  });

  await t.test('builds complete metadata with full addresses and platform tag', () => {
    const buildShipmentMetadata = (service as any).buildShipmentMetadata.bind(service);

    const input = {
      external: {
        platform: 'DT_COMMERCE',
        shopId: 'shop-1',
        externalOrderId: 'ord-1',
      },
      merchant: {
        merchantId: '41100000',
      },
      sender: {
        phone: '0901111111',
        address: 'Số 10 Lê Lợi',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1',
        province: 'Hồ Chí Minh',
      },
      receiver: {
        name: 'Nguyễn Văn B',
        phone: '0902222222',
        address: 'Số 20 Tràng Tiền',
        ward: 'Phường Tràng Tiền',
        district: 'Hoàn Kiếm',
        province: 'Hà Nội',
      },
      parcel: {
        items: [{ name: 'Sách', quantity: 1, unitPrice: 50000 }],
        weightGram: 300,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 5,
        declaredValue: 50000,
      },
      service: {
        serviceType: 'STANDARD',
        pickupType: 'PICKUP',
      },
      payment: {
        codAmount: 50000,
        shippingFee: 25000,
        payer: 'RECEIVER',
        codIncludesShippingFee: true,
      },
      options: {
        autoCreatePickup: true,
        printLabelFormat: 'A6',
      },
    };

    const route = {
      senderHub: mockHubs[2], // Hub HCM
      receiverHub: mockHubs[3], // Hub HN
    };

    const meta = buildShipmentMetadata(input, 'DT_COMMERCE', 'idemp-1', route);

    assert.equal(meta.platform, 'DT_COMMERCE');
    assert.equal(meta.senderAddress, 'Số 10 Lê Lợi, Phường Bến Nghé, Quận 1, Hồ Chí Minh');
    assert.equal(meta.receiverAddress, 'Số 20 Tràng Tiền, Phường Tràng Tiền, Hoàn Kiếm, Hà Nội');
    assert.equal(meta.senderHubCode, '003079B001');
    assert.equal(meta.receiverHubCode, '001001B001');
  });

  await t.test('builds tracking URL with /track/ and phone param for delivery and return orders', () => {
    const buildTrackingUrl = (service as any).buildTrackingUrl.bind(service);
    const resolveTrackingPhone = (service as any).resolveTrackingPhone.bind(service);

    // 1. Delivery order: uses receiver phone
    const deliveryShipment = {
      code: '111380807640',
      currentStatus: 'CREATED',
      metadata: {
        sender: { phone: '0901111111' },
        receiver: { phone: '0902222222' },
      },
    };
    const deliveryPhone = resolveTrackingPhone(deliveryShipment);
    assert.equal(deliveryPhone, '0902222222');
    const deliveryUrl = buildTrackingUrl(deliveryShipment.code, deliveryPhone);
    assert.equal(
      deliveryUrl,
      'https://tracking.nexus-ex.site/track/111380807640?phone=0902222222',
    );

    // 2. Return order (returning status): receiver is shop so uses shop/sender phone
    const returnShipment = {
      code: '111380807641',
      currentStatus: 'RETURN_STARTED',
      metadata: {
        sender: { phone: '0901111111' },
        receiver: { phone: '0902222222' },
      },
    };
    const returnPhone = resolveTrackingPhone(returnShipment);
    assert.equal(returnPhone, '0901111111');
    const returnUrl = buildTrackingUrl(returnShipment.code, returnPhone);
    assert.equal(
      returnUrl,
      'https://tracking.nexus-ex.site/track/111380807641?phone=0901111111',
    );

    // 3. Return order created directly by DT_COMMERCE where receiver is shop
    const dtCommerceReturnShipment = {
      code: '111380807642',
      currentStatus: 'CREATED',
      metadata: {
        isReturn: true,
        sender: { phone: '0902222222' },
        receiver: { phone: '0901111111' },
      },
    };
    const dtReturnPhone = resolveTrackingPhone(dtCommerceReturnShipment);
    assert.equal(dtReturnPhone, '0901111111');
    const dtReturnUrl = buildTrackingUrl(dtCommerceReturnShipment.code, dtReturnPhone);
    assert.equal(
      dtReturnUrl,
      'https://tracking.nexus-ex.site/track/111380807642?phone=0901111111',
    );

    // 4. Fallback without phone
    const fallbackUrl = buildTrackingUrl('111380807643', null);
    assert.equal(fallbackUrl, 'https://tracking.nexus-ex.site/track/111380807643');
  });
});
