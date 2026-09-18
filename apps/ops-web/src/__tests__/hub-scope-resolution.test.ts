import { describe, expect, it } from 'vitest';
import type { HubDto } from '../features/masterdata/masterdata.types';
import type { ShipmentListItemDto } from '../features/shipments/shipments.types';
import {
  groupShipmentsByChildHubs,
  isShipmentInHubScope,
  resolveHubScope,
} from '../utils/hubScopeResolver';

const MOCK_HUBS: HubDto[] = [
  // Level 0: HQ
  {
    id: 'hq-1',
    code: '000HQ001',
    name: 'Trụ sở NEXUS Toàn Quốc',
    level: 0,
    parentCode: null,
    zoneCode: '000',
    address: 'Hà Nội',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  // Level 1: Regional
  {
    id: 'reg-north',
    code: '001N001',
    name: 'Hub Miền Bắc',
    level: 1,
    parentCode: '000HQ001',
    zoneCode: '001',
    address: 'Hà Nội',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'reg-central',
    code: '002C001',
    name: 'Hub Miền Trung',
    level: 1,
    parentCode: '000HQ001',
    zoneCode: '002',
    address: 'Đà Nẵng',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'reg-south',
    code: '003S001',
    name: 'Hub Miền Nam',
    level: 1,
    parentCode: '000HQ001',
    zoneCode: '003',
    address: 'TP.HCM',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  // Level 2: Provincial under North
  {
    id: 'prov-hn',
    code: '001001B001',
    name: 'Bưu cục TP. Hà Nội',
    level: 2,
    parentCode: '001N001',
    zoneCode: '001',
    address: 'Hà Nội',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'prov-bn',
    code: '001024B001',
    name: 'Bưu cục Tỉnh Bắc Ninh',
    level: 2,
    parentCode: '001N001',
    zoneCode: '001',
    address: 'Bắc Ninh',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  // Level 3: Ward under Hanoi
  {
    id: 'ward-hb',
    code: '00101W001',
    name: 'Bưu cục Phường Hàng Bài',
    level: 3,
    parentCode: '001001B001',
    zoneCode: '001',
    address: 'Hoàn Kiếm, Hà Nội',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'ward-km',
    code: '00102W001',
    name: 'Bưu cục Phường Kim Mã',
    level: 3,
    parentCode: '001001B001',
    zoneCode: '001',
    address: 'Ba Đình, Hà Nội',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  },
];

function createMockShipment(
  code: string,
  senderHub: string,
  receiverHub: string,
  status = 'DELIVERED',
): ShipmentListItemDto {
  return {
    id: `shipment-${code}`,
    shipmentCode: code,
    currentStatus: status,
    currentLocation: senderHub,
    parcelType: 'PARCEL',
    shippingFee: 30000,
    receiverRegion: 'Miền Bắc',
    senderWard: null,
    senderDistrict: null,
    senderProvince: null,
    senderHubCode: senderHub,
    receiverHubCode: receiverHub,
    originHubCode: senderHub,
    destinationHubCode: receiverHub,
    senderName: 'Shop A',
    senderPhone: '0901234567',
    senderAddress: 'HN',
    receiverName: 'Khách B',
    receiverPhone: '0912345678',
    receiverAddress: 'HN',
    platform: 'WEB',
    serviceType: 'STANDARD',
    codAmount: 100000,
    deliveryNote: null,
    requiresLabelReprint: false,
    labelReprintReason: null,
    isOperationLocked: false,
    operationLockReason: null,
    createdAt: '2026-09-11T10:00:00.000Z',
    updatedAt: '2026-09-11T10:00:00.000Z',
  };
}

describe('Hub Scope Resolver & Statistics Scoping', () => {
  it('resolves HQ Level 0 with unrestricted scope and 3 regional children', () => {
    const scope = resolveHubScope(MOCK_HUBS, ['000HQ001'], 'HQ_OPS', ['HQ_OPS']);
    expect(scope.hubLevel).toBe(0);
    expect(scope.isAllSystem).toBe(true);
    expect(scope.scopedHubCodes).toEqual([]);
    expect(scope.childHubs.map((h) => h.code)).toEqual(['001N001', '002C001', '003S001']);
  });

  it('resolves Regional Level 1 with provincial children and descendant ward hubs', () => {
    const scope = resolveHubScope(MOCK_HUBS, ['001N001'], 'REGIONAL_OPS', ['OPS_ADMIN']);
    expect(scope.hubLevel).toBe(1);
    expect(scope.isAllSystem).toBe(false);
    expect(scope.primaryHub?.code).toBe('001N001');
    expect(scope.childHubs.map((h) => h.code)).toEqual(['001001B001', '001024B001']);
    // Scoped hub codes include regional + provincial + ward
    expect(scope.scopedHubCodes).toContain('001N001');
    expect(scope.scopedHubCodes).toContain('001001B001');
    expect(scope.scopedHubCodes).toContain('001024B001');
    expect(scope.scopedHubCodes).toContain('00101W001');
    expect(scope.scopedHubCodes).toContain('00102W001');
  });

  it('resolves Provincial Level 2 with ward children only', () => {
    const scope = resolveHubScope(MOCK_HUBS, ['001001B001'], 'PROVINCIAL_OPS', ['PROVINCIAL_OPS']);
    expect(scope.hubLevel).toBe(2);
    expect(scope.isAllSystem).toBe(false);
    expect(scope.primaryHub?.code).toBe('001001B001');
    expect(scope.childHubs.map((h) => h.code)).toEqual(['00101W001', '00102W001']);
    expect(scope.scopedHubCodes).toContain('001001B001');
    expect(scope.scopedHubCodes).toContain('00101W001');
    expect(scope.scopedHubCodes).toContain('00102W001');
    // Does NOT contain other provinces
    expect(scope.scopedHubCodes).not.toContain('001024B001');
  });

  it('resolves Ward Level 3 with single hub scope and no children', () => {
    const scope = resolveHubScope(MOCK_HUBS, ['00101W001'], 'HUB_OPS', ['HUB_STAFF']);
    expect(scope.hubLevel).toBe(3);
    expect(scope.isAllSystem).toBe(false);
    expect(scope.primaryHub?.code).toBe('00101W001');
    expect(scope.childHubs).toEqual([]);
    expect(scope.scopedHubCodes).toEqual(['00101W001']);
  });

  it('correctly filters shipments within hub scope', () => {
    const shipmentHangBai = createMockShipment('SMP01', '00101W001', '00101W001');
    const shipmentKimMa = createMockShipment('SMP02', '00102W001', '00102W001');

    // Ward Hub Hang Bai only sees Hang Bai
    expect(isShipmentInHubScope(shipmentHangBai, ['00101W001'])).toBe(true);
    expect(isShipmentInHubScope(shipmentKimMa, ['00101W001'])).toBe(false);

    // Provincial Hub Hanoi sees both Hang Bai and Kim Ma
    expect(isShipmentInHubScope(shipmentHangBai, ['001001B001', '00101W001', '00102W001'])).toBe(true);
    expect(isShipmentInHubScope(shipmentKimMa, ['001001B001', '00101W001', '00102W001'])).toBe(true);

    // HQ (empty scope) sees all
    expect(isShipmentInHubScope(shipmentHangBai, [])).toBe(true);
    expect(isShipmentInHubScope(shipmentKimMa, [])).toBe(true);
  });

  it('aggregates child hub breakdown statistics accurately', () => {
    const s1 = createMockShipment('S1', '00101W001', '00101W001', 'DELIVERED');
    const s2 = createMockShipment('S2', '00101W001', '00101W001', 'IN_TRANSIT');
    const s3 = createMockShipment('S3', '00102W001', '00102W001', 'DELIVERED');

    const provincialScope = resolveHubScope(MOCK_HUBS, ['001001B001'], 'PROVINCIAL_OPS');
    const breakdowns = groupShipmentsByChildHubs([s1, s2, s3], provincialScope.childHubs, MOCK_HUBS);

    expect(breakdowns).toHaveLength(2);
    const hangBai = breakdowns.find((b) => b.hubCode === '00101W001');
    const kimMa = breakdowns.find((b) => b.hubCode === '00102W001');

    expect(hangBai?.totalShipments).toBe(2);
    expect(hangBai?.deliveredCount).toBe(1);
    expect(hangBai?.inTransitCount).toBe(1);

    expect(kimMa?.totalShipments).toBe(1);
    expect(kimMa?.deliveredCount).toBe(1);
    expect(kimMa?.inTransitCount).toBe(0);
  });
});
