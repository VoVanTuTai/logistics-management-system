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
      badgeLabel: 'Bưu tá phát hàng',
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

  // 2. IN-TRANSIT PHASE
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

  // 3. PICKUP PHASE
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
      badgeLabel: 'Bưu tá lấy hàng',
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
