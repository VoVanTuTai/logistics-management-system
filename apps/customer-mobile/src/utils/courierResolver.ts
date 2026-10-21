export interface CourierInfo {
  id: string;
  name: string;
  phone: string;
  hubCode: string;
  hubName: string;
  vehicleType: string;
}

const SEEDED_COURIERS: Record<string, CourierInfo> = {
  '30000001': {
    id: '30000001',
    name: 'Nguyễn Văn Hùng',
    phone: '0903000001',
    hubCode: 'HUB-HCM-001',
    hubName: 'Bưu cục Tân Bình (TP.HCM)',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000002': {
    id: '30000002',
    name: 'Trần Quốc Bảo',
    phone: '0903000002',
    hubCode: 'HUB-DAN-001',
    hubName: 'Bưu cục Hải Châu (Đà Nẵng)',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000003': {
    id: '30000003',
    name: 'Lê Minh Tuấn',
    phone: '0903000003',
    hubCode: 'HUB-HCM-002',
    hubName: 'Bưu cục Quận 1 (TP.HCM)',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000004': {
    id: '30000004',
    name: 'Phạm Quốc Dũng',
    phone: '0903000004',
    hubCode: 'HUB-HAN-002',
    hubName: 'Bưu cục Cầu Giấy (Hà Nội)',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000007': {
    id: '30000007',
    name: 'Nguyễn Văn Minh',
    phone: '0903000007',
    hubCode: 'HUB-HAN-001',
    hubName: 'Bưu cục Long Biên (Hà Nội)',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000079': {
    id: '30000079',
    name: 'Trần Văn Lộc',
    phone: '0903000079',
    hubCode: 'HUB-HCM-001',
    hubName: 'Bưu cục Bình Thạnh (TP.HCM)',
    vehicleType: 'Xe máy giao nhận',
  },
};

/**
 * Resolves courier details (Name, Phone, Hub) for an order or tracking timeline
 */
export function resolveCourierForOrder(params: {
  courierId?: string | null;
  courierName?: string | null;
  courierPhone?: string | null;
  receiverHubCode?: string | null;
  timelineNotes?: string[];
}): CourierInfo {
  const { courierId, courierName, courierPhone, receiverHubCode, timelineNotes = [] } = params;

  // 1. Direct ID match
  if (courierId && SEEDED_COURIERS[courierId]) {
    return SEEDED_COURIERS[courierId];
  }

  // 2. Parse from timeline notes (e.g. "Shipper: 30000001" or "Mã NV: 30000007")
  for (const note of timelineNotes) {
    for (const [id, c] of Object.entries(SEEDED_COURIERS)) {
      if (note.includes(id) || note.includes(c.name)) {
        return c;
      }
    }
  }

  // 3. If explicit name and phone provided in metadata
  if (courierName && courierPhone) {
    return {
      id: courierId || '30000001',
      name: courierName,
      phone: courierPhone,
      hubCode: receiverHubCode || 'HUB-HCM-001',
      hubName: 'Bưu cục phát tuyến',
      vehicleType: 'Xe máy giao nhận',
    };
  }

  // 4. Fallback based on Destination / Receiver Hub
  const dest = (receiverHubCode || '').toUpperCase();
  if (dest.includes('HN') || dest.includes('HAN') || dest.includes('LONG_BIEN')) {
    return SEEDED_COURIERS['30000007'];
  }
  if (dest.includes('DAN') || dest.includes('DN') || dest.includes('HAI_CHAU')) {
    return SEEDED_COURIERS['30000002'];
  }

  // Default standard delivery courier
  return SEEDED_COURIERS['30000001'];
}

export function formatCourierPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  return phone;
}
