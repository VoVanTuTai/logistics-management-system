export interface CourierInfo {
  id: string;
  name: string;
  phone: string;
  hubCode: string;
  hubName: string;
  vehicleType: string;
}

const SEEDED_COURIERS: Record<string, CourierInfo> = {
  '30000000': {
    id: '30000000',
    name: 'Bưu tá Tổng Toàn quốc',
    phone: '0903000000',
    hubCode: '000HQ001',
    hubName: 'Trụ sở Điều hành Toàn quốc',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000001': {
    id: '30000001',
    name: 'Tài xế Xe tải Linehaul Miền Bắc',
    phone: '0903000001',
    hubCode: '001001B001',
    hubName: 'Bưu cục Hà Nội',
    vehicleType: 'Xe tải trung chuyển',
  },
  '30000002': {
    id: '30000002',
    name: 'Tài xế Xe tải Linehaul Miền Trung',
    phone: '0903000002',
    hubCode: '002048B001',
    hubName: 'Bưu cục Đà Nẵng',
    vehicleType: 'Xe tải trung chuyển',
  },
  '30000003': {
    id: '30000003',
    name: 'Tài xế Xe tải Linehaul Miền Nam',
    phone: '0903000003',
    hubCode: '003079B001',
    hubName: 'Bưu cục Hồ Chí Minh',
    vehicleType: 'Xe tải trung chuyển',
  },
  '30000007': {
    id: '30000007',
    name: 'Đội trưởng Giao nhận Hà Nội',
    phone: '0903000007',
    hubCode: '001001B001',
    hubName: 'Bưu cục Hà Nội',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000079': {
    id: '30000079',
    name: 'Đội trưởng Giao nhận TP. Hồ Chí Minh',
    phone: '0903000079',
    hubCode: '003079B001',
    hubName: 'Bưu cục Hồ Chí Minh',
    vehicleType: 'Xe máy giao nhận',
  },
  '30000048': {
    id: '30000048',
    name: 'Đội trưởng Giao nhận Đà Nẵng',
    phone: '0903000048',
    hubCode: '002048B001',
    hubName: 'Bưu cục Đà Nẵng',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002015': {
    id: '30002015',
    name: 'Courier Q1 A - Đông Chợ Bến Thành',
    phone: '0903200015',
    hubCode: '07901W001',
    hubName: 'Bưu cục Phường Bến Thành',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002016': {
    id: '30002016',
    name: 'Courier Q1 B - Tây Chợ Bến Thành',
    phone: '0903200016',
    hubCode: '07901W001',
    hubName: 'Bưu cục Phường Bến Thành',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002017': {
    id: '30002017',
    name: 'Courier Q3 A - Bắc Lê Văn Sỹ',
    phone: '0903200017',
    hubCode: '07903W001',
    hubName: 'Bưu cục Phường 13 - Quận 3',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002018': {
    id: '30002018',
    name: 'Courier Q3 B - Nam Lê Văn Sỹ',
    phone: '0903200018',
    hubCode: '07903W001',
    hubName: 'Bưu cục Phường 13 - Quận 3',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002019': {
    id: '30002019',
    name: 'Courier Tân Bình A - Đông Cộng Hòa',
    phone: '0903200019',
    hubCode: '07913W001',
    hubName: 'Bưu cục Phường 13 - Tân Bình',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002020': {
    id: '30002020',
    name: 'Courier Tân Bình B - Tây Cộng Hòa',
    phone: '0903200020',
    hubCode: '07913W001',
    hubName: 'Bưu cục Phường 13 - Tân Bình',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002021': {
    id: '30002021',
    name: 'Courier Q12 A - Bắc Hà Huy Giáp',
    phone: '0903200021',
    hubCode: '07912W001',
    hubName: 'Bưu cục Phường An Phú Đông - Quận 12',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002022': {
    id: '30002022',
    name: 'Courier Q12 B - Nam Hà Huy Giáp',
    phone: '0903200022',
    hubCode: '07912W001',
    hubName: 'Bưu cục Phường An Phú Đông - Quận 12',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002001': {
    id: '30002001',
    name: 'Courier Hoàn Kiếm A - Bắc Hàng Bài',
    phone: '0903200001',
    hubCode: '00101W001',
    hubName: 'Bưu cục Phường Hàng Bài - Hoàn Kiếm',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002002': {
    id: '30002002',
    name: 'Courier Hoàn Kiếm B - Nam Hàng Bài',
    phone: '0903200002',
    hubCode: '00101W001',
    hubName: 'Bưu cục Phường Hàng Bài - Hoàn Kiếm',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002003': {
    id: '30002003',
    name: 'Courier Ba Đình A - Đông Kim Mã',
    phone: '0903200003',
    hubCode: '00102W001',
    hubName: 'Bưu cục Phường Kim Mã - Ba Đình',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002004': {
    id: '30002004',
    name: 'Courier Ba Đình B - Tây Kim Mã',
    phone: '0903200004',
    hubCode: '00102W001',
    hubName: 'Bưu cục Phường Kim Mã - Ba Đình',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002005': {
    id: '30002005',
    name: 'Courier Cầu Giấy A - Bắc Dịch Vọng',
    phone: '0903200005',
    hubCode: '00103W001',
    hubName: 'Bưu cục Phường Dịch Vọng - Cầu Giấy',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002006': {
    id: '30002006',
    name: 'Courier Cầu Giấy B - Nam Dịch Vọng',
    phone: '0903200006',
    hubCode: '00103W001',
    hubName: 'Bưu cục Phường Dịch Vọng - Cầu Giấy',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002007': {
    id: '30002007',
    name: 'Courier Đống Đa A - Đông Thái Hà',
    phone: '0903200007',
    hubCode: '00104W001',
    hubName: 'Bưu cục Phường Trung Liệt - Đống Đa',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002008': {
    id: '30002008',
    name: 'Courier Đống Đa B - Tây Thái Hà',
    phone: '0903200008',
    hubCode: '00104W001',
    hubName: 'Bưu cục Phường Trung Liệt - Đống Đa',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002009': {
    id: '30002009',
    name: 'Courier Hải Châu A - Bắc Bạch Đằng',
    phone: '0903200009',
    hubCode: '04801W001',
    hubName: 'Bưu cục Phường Thạch Thang - Hải Châu',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002010': {
    id: '30002010',
    name: 'Courier Hải Châu B - Nam Bạch Đằng',
    phone: '0903200010',
    hubCode: '04801W001',
    hubName: 'Bưu cục Phường Thạch Thang - Hải Châu',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002013': {
    id: '30002013',
    name: 'Courier Sơn Trà A - Bắc Sông Hàn',
    phone: '0903200013',
    hubCode: '04802W001',
    hubName: 'Bưu cục Phường An Hải Bắc - Sơn Trà',
    vehicleType: 'Xe máy giao nhận',
  },
  '30002014': {
    id: '30002014',
    name: 'Courier Sơn Trà B - Nam Sông Hàn',
    phone: '0903200014',
    hubCode: '04802W001',
    hubName: 'Bưu cục Phường An Hải Bắc - Sơn Trà',
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
  if (courierId && /^\d+$/.test(courierId)) {
    return {
      id: courierId,
      name: courierName || `Bưu tá ${courierId}`,
      phone: courierPhone || `090${courierId.slice(-7).padStart(7, '0')}`,
      hubCode: receiverHubCode || '000HQ001',
      hubName: 'Bưu cục phụ trách tuyến',
      vehicleType: 'Xe máy giao nhận',
    };
  }

  // 2. Parse from timeline notes (e.g. "Shipper: 30000000", "Shipper 30002015", "Mã NV: 30000007")
  for (const note of timelineNotes) {
    const match = note.match(/(?:Shipper|Bưu tá|Mã NV|courierId|Courier)[:\s#]+(\d{8})/i);
    if (match) {
      const extractedId = match[1];
      if (SEEDED_COURIERS[extractedId]) {
        return SEEDED_COURIERS[extractedId];
      }
      return {
        id: extractedId,
        name: `Bưu tá ${extractedId}`,
        phone: `090${extractedId.slice(-7).padStart(7, '0')}`,
        hubCode: receiverHubCode || '000HQ001',
        hubName: 'Bưu cục phụ trách tuyến',
        vehicleType: 'Xe máy giao nhận',
      };
    }
  }

  // 3. Fallback search by known names or IDs in timeline notes
  for (const note of timelineNotes) {
    for (const [id, c] of Object.entries(SEEDED_COURIERS)) {
      if (note.includes(id) || note.includes(c.name)) {
        return c;
      }
    }
  }

  // 4. If explicit name and phone provided in metadata
  if (courierName && courierPhone) {
    return {
      id: courierId || '30000000',
      name: courierName,
      phone: courierPhone,
      hubCode: receiverHubCode || '000HQ001',
      hubName: 'Bưu cục phát tuyến',
      vehicleType: 'Xe máy giao nhận',
    };
  }

  // 5. Fallback based on Destination / Receiver Hub
  const dest = (receiverHubCode || '').toUpperCase();
  if (dest.includes('HN') || dest.includes('HAN') || dest.includes('LONG_BIEN') || dest.includes('001001B001') || dest.includes('00101W001')) {
    return SEEDED_COURIERS['30002001'];
  }
  if (dest.includes('DAN') || dest.includes('DN') || dest.includes('HAI_CHAU') || dest.includes('002048B001') || dest.includes('04801W001')) {
    return SEEDED_COURIERS['30002009'];
  }
  if (dest.includes('07901W001') || dest.includes('07901W002')) {
    return SEEDED_COURIERS['30002015'];
  }
  if (dest.includes('07912W001')) {
    return SEEDED_COURIERS['30002021'];
  }
  if (dest.includes('07913W001')) {
    return SEEDED_COURIERS['30002019'];
  }

  // Default standard delivery courier (Bưu tá Tổng Toàn quốc)
  return SEEDED_COURIERS['30000000'];
}

export function formatCourierPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  return phone;
}

export type CourierRoleType = 'PICKUP' | 'DELIVERY' | 'IN_TRANSIT' | 'UNASSIGNED';

export interface CourierResolutionResult {
  courier: CourierInfo | null;
  role: CourierRoleType;
  cardTitle: string;
  badgeLabel: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorder: string;
  statusDescription: string;
  hubLabel: string;
  isPickup: boolean;
  isDelivery: boolean;
  isInTransit: boolean;
  isUnassigned: boolean;
}

export function resolveCourierContextForOrder(params: {
  status?: string | null;
  courierId?: string | null;
  courierName?: string | null;
  courierPhone?: string | null;
  pickupCourierId?: string | null;
  deliveryCourierId?: string | null;
  currentTaskType?: string | null;
  senderHubCode?: string | null;
  receiverHubCode?: string | null;
  currentHubCode?: string | null;
  timelineNotes?: string[];
}): CourierResolutionResult {
  const statusUpper = (params.status || '').toUpperCase();
  const taskTypeUpper = (params.currentTaskType || '').toUpperCase();

  const isDeliveryStatus = [
    'OUT_FOR_DELIVERY',
    'DELIVERING',
    'DELIVERED',
    'DELIVERY_FAILED',
    'NDR_CREATED',
  ].includes(statusUpper);

  const isInTransitStatus = [
    'PICKUP_COMPLETED',
    'PICKED_UP',
    'MANIFEST_SEALED',
    'MANIFEST_RECEIVED',
    'MANIFEST_UNSEALED',
    'SCAN_OUTBOUND',
    'SEND_GOODS',
    'IN_TRANSIT',
    'INBOUND_AT_HUB',
    'SCAN_INBOUND',
    'INVENTORY_CHECK',
  ].includes(statusUpper);

  // 1. DELIVERY PHASE
  if (
    isDeliveryStatus ||
    taskTypeUpper === 'DELIVERY' ||
    Boolean(params.deliveryCourierId)
  ) {
    const courier = resolveCourierForOrder({
      courierId: params.deliveryCourierId || params.courierId,
      courierName: params.courierName,
      courierPhone: params.courierPhone,
      receiverHubCode: params.receiverHubCode,
      timelineNotes: params.timelineNotes,
    });

    return {
      courier,
      role: 'DELIVERY',
      cardTitle: 'Bưu tá phát hàng phụ trách',
      badgeLabel: 'Shipper Tuyến Phát',
      badgeBg: '#ECFDF5',
      badgeTextColor: '#065F46',
      badgeBorder: '#A7F3D0',
      statusDescription: 'Bưu tá đang phụ trách tuyến phát hàng đến địa chỉ người nhận.',
      hubLabel: params.receiverHubCode || courier.hubName,
      isPickup: false,
      isDelivery: true,
      isInTransit: false,
      isUnassigned: false,
    };
  }

  // 2. IN-TRANSIT PHASE (hàng đang luân chuyển trên mạng lưới, chưa phát)
  if (isInTransitStatus) {
    return {
      courier: null,
      role: 'IN_TRANSIT',
      cardTitle: 'Vận chuyển trung chuyển',
      badgeLabel: 'Đang chuyển Hub',
      badgeBg: '#EFF6FF',
      badgeTextColor: '#1D4ED8',
      badgeBorder: '#BFDBFE',
      statusDescription:
        'Kiện hàng đang được luân chuyển giữa các bưu cục trên mạng lưới. Bưu tá phát sẽ được phân công tự động khi kiện hàng cập bến bưu cục đích.',
      hubLabel: params.currentHubCode || params.receiverHubCode || 'Bưu cục trung chuyển',
      isPickup: false,
      isDelivery: false,
      isInTransit: true,
      isUnassigned: false,
    };
  }

  // 3. PICKUP PHASE (mới tạo hoặc đang điều phối lấy hàng tại kho gửi)
  const pickupId = params.pickupCourierId || params.courierId;
  if (pickupId) {
    const courier = resolveCourierForOrder({
      courierId: pickupId,
      courierName: params.courierName,
      courierPhone: params.courierPhone,
      receiverHubCode: params.senderHubCode || params.receiverHubCode,
      timelineNotes: params.timelineNotes,
    });

    return {
      courier,
      role: 'PICKUP',
      cardTitle: 'Bưu tá gom lấy hàng',
      badgeLabel: 'Shipper Lấy Hàng',
      badgeBg: '#FEF3C7',
      badgeTextColor: '#92400E',
      badgeBorder: '#FDE68A',
      statusDescription:
        'Bưu tá phụ trách đến kho/địa chỉ người gửi để nhận kiện và vận chuyển về bưu cục.',
      hubLabel: params.senderHubCode || courier.hubName,
      isPickup: true,
      isDelivery: false,
      isInTransit: false,
      isUnassigned: false,
    };
  }

  // 4. UNASSIGNED
  return {
    courier: null,
    role: 'UNASSIGNED',
    cardTitle: 'Chờ điều phối lấy hàng',
    badgeLabel: 'Chờ phân công',
    badgeBg: '#F1F5F9',
    badgeTextColor: '#475569',
    badgeBorder: '#CBD5E1',
    statusDescription:
      'Đơn hàng vừa được tạo trên hệ thống, đang chờ tự động phân bổ bưu tá đến kho gom hàng.',
    hubLabel: params.senderHubCode || 'Bưu cục gửi',
    isPickup: false,
    isDelivery: false,
    isInTransit: false,
    isUnassigned: true,
  };
}
