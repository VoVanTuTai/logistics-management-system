import { describe, expect, it } from 'vitest';

import {
  getLinehaulTripStatus,
  getLinehaulTripStatusLabel,
  parseTripFromManifest,
  type LinehaulTrip,
} from '../pages/function-groups/operations-platform/linehaul/linehaulTrips';
import type { ManifestListItemDto } from '../features/manifests/manifests.types';

describe('Linehaul Trip Driver & Vehicle Status Resolution', () => {
  const baseTrip: LinehaulTrip = {
    id: 'trip-101',
    tripCode: 'LH-HN01-HCM01-001',
    originHubCode: 'HN01',
    destinationHubCode: 'HCM01',
    tripType: 'DELIVERY',
    plannedStartAt: '2026-11-21T08:00:00Z',
    plannedEndAt: '2026-11-22T08:00:00Z',
    createdAt: '2026-11-21T07:30:00Z',
  };

  it('returns PLANNED and "Chờ bổ sung tài xế/xe" when neither driver nor vehicle is assigned', () => {
    const trip: LinehaulTrip = { ...baseTrip };
    const status = getLinehaulTripStatus(trip);

    expect(status).toBe('PLANNED');
    expect(getLinehaulTripStatusLabel(status, trip)).toBe('Chờ bổ sung tài xế/xe');
  });

  it('returns PLANNED with specific hint when only driver is assigned', () => {
    const trip: LinehaulTrip = {
      ...baseTrip,
      driverName: 'Nguyễn Văn Tuấn',
      driverPhone: '0908123456',
    };
    const status = getLinehaulTripStatus(trip);

    expect(status).toBe('PLANNED');
    expect(getLinehaulTripStatusLabel(status, trip)).toBe('Đã có tài xế (Chờ bổ sung xe)');
  });

  it('returns PLANNED with specific hint when only vehicle is assigned', () => {
    const trip: LinehaulTrip = {
      ...baseTrip,
      vehiclePlate: '29C-882.14',
    };
    const status = getLinehaulTripStatus(trip);

    expect(status).toBe('PLANNED');
    expect(getLinehaulTripStatusLabel(status, trip)).toBe('Đã có xe (Chờ bổ sung tài xế)');
  });

  it('returns ASSIGNED and "Đã có tài xế/xe (Chờ in tem)" when driver & vehicle are assigned', () => {
    const trip: LinehaulTrip = {
      ...baseTrip,
      driverName: 'Nguyễn Văn Tuấn',
      driverPhone: '0908123456',
      vehiclePlate: '29C-882.14',
    };
    const status = getLinehaulTripStatus(trip);

    expect(status).toBe('ASSIGNED');
    expect(getLinehaulTripStatusLabel(status, trip)).toBe('Đã có tài xế/xe (Chờ in tem)');
  });

  it('returns PRINTED and "Sẵn sàng xuất bến (Đã in tem)" when trip label is printed', () => {
    const trip: LinehaulTrip = {
      ...baseTrip,
      driverName: 'Nguyễn Văn Tuấn',
      vehiclePlate: '29C-882.14',
      printedAt: '2026-11-21T09:00:00Z',
    };
    const status = getLinehaulTripStatus(trip);

    expect(status).toBe('PRINTED');
    expect(getLinehaulTripStatusLabel(status, trip)).toBe('Sẵn sàng xuất bến (Đã in tem)');
  });

  it('returns SEALED and "Đang vận chuyển (Đã kẹp chì)" when sealed', () => {
    const trip: LinehaulTrip = {
      ...baseTrip,
      driverName: 'Nguyễn Văn Tuấn',
      vehiclePlate: '29C-882.14',
      printedAt: '2026-11-21T09:00:00Z',
      sealedAt: '2026-11-21T09:30:00Z',
      sealCode: 'SL-998822',
    };
    const status = getLinehaulTripStatus(trip);

    expect(status).toBe('SEALED');
    expect(getLinehaulTripStatusLabel(status, trip)).toBe('Đang vận chuyển (Đã kẹp chì)');
  });

  it('returns RECEIVED and "Đã tiếp nhận tại Hub đích" when received', () => {
    const trip: LinehaulTrip = {
      ...baseTrip,
      driverName: 'Nguyễn Văn Tuấn',
      vehiclePlate: '29C-882.14',
      printedAt: '2026-11-21T09:00:00Z',
      sealedAt: '2026-11-21T09:30:00Z',
      receivedAt: '2026-11-22T07:45:00Z',
    };
    const status = getLinehaulTripStatus(trip);

    expect(status).toBe('RECEIVED');
    expect(getLinehaulTripStatusLabel(status, trip)).toBe('Đã tiếp nhận tại Hub đích');
  });

  it('parses driver, vehicle, and printedAt correctly from manifest note', () => {
    const manifestDto: ManifestListItemDto = {
      id: 'm-123',
      manifestCode: 'LH-HN-HCM-001',
      originHubCode: 'HN01',
      destinationHubCode: 'HCM01',
      status: 'OPEN',
      note: 'LINEHAUL_TRIP|tripType=DELIVERY|driverName=Nguyễn Văn Tuấn|driverPhone=0908123456|vehiclePlate=29C-882.14|printedAt=2026-11-21T10:00:00Z|shipmentCount=45',
      shipmentCount: 45,
      sealedAt: null,
      createdAt: '2026-11-21T08:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z',
    };

    const parsedTrip = parseTripFromManifest(manifestDto);
    expect(parsedTrip.driverName).toBe('Nguyễn Văn Tuấn');
    expect(parsedTrip.driverPhone).toBe('0908123456');
    expect(parsedTrip.vehiclePlate).toBe('29C-882.14');
    expect(parsedTrip.printedAt).toBe('2026-11-21T10:00:00Z');
    expect(parsedTrip.shipmentCount).toBe(45);
    expect(getLinehaulTripStatus(parsedTrip)).toBe('PRINTED');
  });
});
