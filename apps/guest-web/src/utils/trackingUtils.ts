/**
 * Normalizes any MinIO image URL (including internal docker aliases or IP hosts)
 * to the configured public MinIO endpoint (https://minio.nexus-ex.site).
 */
export function normalizeMediaPublicUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('https://minio.nexus-ex.site')) {
    return trimmed;
  }

  return trimmed
    .replace(/^http:\/\/minio:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/localhost:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/127\.0\.0\.1:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/103\.82\.20\.51:19000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/103\.82\.20\.51:9000\/?/i, 'https://minio.nexus-ex.site/')
    .replace(/^http:\/\/minio\.nexus-ex\.site\/?/i, 'https://minio.nexus-ex.site/');
}

/**
 * Clean internal noise from notes so customers see only relevant, public-safe delivery notes:
 * - Strips operator & staff names (Điều hành viên..., Người thao tác..., Mã NV...)
 * - Strips courier/shipper internal usernames/IDs (Shipper: courier-..., Courier...)
 * - Strips internal system dispatch tags (🤖 [Hệ thống tự động điều phối], 👤 [Điều hành viên...])
 * - Strips geofence/routing technical logs (Tọa độ..., Tuyến [...], Dải toạ độ...)
 * - Strips internal tracking codes (MB..., MANIFEST-..., Biển xe...)
 * - Preserves customer-facing notes (e.g. "Hàng dễ vỡ xin nhẹ tay", "Giao buổi chiều")
 */
export function cleanCustomerNote(note?: string | null): string | undefined {
  if (!note) return undefined;
  let cleaned = note.trim();

  // Remove URLs & POD proof tags
  cleaned = cleaned.replace(/https?:\/\/[^\s"'<>()]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Minh chứng:\s*Xem ảnh/gi, '');
  cleaned = cleaned.replace(/\|?\s*Minh chứng:\s*/gi, '');

  // Strip operator & dispatcher tags
  cleaned = cleaned.replace(/👤\s*\[[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/🤖\s*\[[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[(?:Tự động điều phối|Hệ thống tự động điều phối|Điều hành viên)[^\]]*\]/gi, '');

  // Strip employee & operator mentions
  cleaned = cleaned.replace(/\|?\s*(?:Người|Nhân viên|Điều hành viên)\s*(?:thao tác)?\s*:\s*[^|,;\n]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Mã\s+NV\s*:?\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*NV\s*:?\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Shipper\s*:?\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Courier\s*:?\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Ops\s*\([^)]*\)/gi, '');
  cleaned = cleaned.replace(/\|?\s*Biển\s+xe\s*:?\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*MB[0-9]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*MANIFEST-[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Courier\s+Bưu\s+cục[^\s|]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Hub\s*:\s*[A-Z0-9_-]+/gi, '');

  // Strip technical geofence & dispatch log lines
  cleaned = cleaned.replace(/Tọa độ\s*(?:GPS)?\s*\([^)]*\)[^.,;|\n]*/gi, '');
  cleaned = cleaned.replace(/khớp\s*(?:chính xác)?\s*Tuyến\s*\[[^\]]*\][^.,;|\n]*/gi, '');
  cleaned = cleaned.replace(/Tuyến\s*\[[^\]]*\][^.,;|\n]*/gi, '');
  cleaned = cleaned.replace(/của\s+Shipper\s+[A-Z0-9_-]+[^.,;|\n]*/gi, '');
  cleaned = cleaned.replace(/thuộc\s+(?:Hub|bưu cục)\s+[A-Z0-9_-]+[^.,;|\n]*/gi, '');
  cleaned = cleaned.replace(/theo\s+phân\s+vùng\s*:[^.,;|\n]*/gi, '');

  // Trim separators
  cleaned = cleaned.replace(/^\s*[-|•,;:]\s*/, '').replace(/\s*[-|•,;:]\s*$/, '').trim();

  // If note was purely internal dispatch mechanics, filter it completely
  const lower = cleaned.toLowerCase();
  if (
    lower.includes('màn điều phối') ||
    lower.includes('phân vùng shipper') ||
    lower.includes('tự động điều phối') ||
    lower.includes('điều phối giao hàng') ||
    lower.includes('điều phối lấy hàng') ||
    lower.includes('khớp theo') ||
    lower.includes('khớp chính xác') ||
    lower.includes('khớp dải') ||
    lower.includes('tọa độ') ||
    lower.includes('geofence') ||
    lower.includes('tuyến phường') ||
    lower.length < 2
  ) {
    return undefined;
  }

  return cleaned.length > 0 ? cleaned : undefined;
}

export interface FormattedCustomerEvent {
  title: string;
  defaultDescription?: string;
  stepIndex: number;
  badgeText?: string;
}

/**
 * Maps raw timeline event from backend into clear customer-friendly perspective:
 * - Accurately follows the logistics milestone stages.
 * - Masks internal operator/staff identities.
 * - Formats concise customer-friendly title & action.
 */
export function formatCustomerTimelineEvent(ev: {
  eventTypeCode?: string | null;
  eventType?: string | null;
  statusAfterEventCode?: string | null;
  statusAfterEvent?: string | null;
  locationText?: string | null;
  locationCode?: string | null;
  note?: string | null;
}): FormattedCustomerEvent {
  const code = (ev.eventTypeCode || '').toLowerCase();
  const statusCode = (ev.statusAfterEventCode || '').toUpperCase();
  const typeText = (ev.eventType || '').toLowerCase();
  const statusText = (ev.statusAfterEvent || '').toLowerCase();

  // 1. ORDER CREATED
  if (
    code === 'shipment.created' ||
    statusCode === 'CREATED' ||
    (typeText.includes('tạo đơn') && !typeText.includes('khai thác'))
  ) {
    return {
      title: 'Đã tạo đơn hàng',
      defaultDescription: 'Đơn hàng đã được tạo và tiếp nhận thành công trên hệ thống Nexus.',
      stepIndex: 0,
      badgeText: 'Đã tạo',
    };
  }

  // 2. PICKUP DISPATCHED / WAITING FOR PICKUP
  if (
    code === 'pickup.requested' ||
    code === 'pickup.approved' ||
    statusCode === 'PICKUP_REQUESTED' ||
    statusCode === 'PICKUP_ASSIGNED' ||
    statusCode === 'TASK_ASSIGNED' ||
    typeText.includes('yêu cầu pickup') ||
    typeText.includes('chờ lấy') ||
    statusText.includes('chờ lấy') ||
    (code === 'task.assigned' && !statusCode.includes('DELIVER') && !typeText.includes('đang được giao'))
  ) {
    return {
      title: 'Chờ lấy hàng',
      defaultDescription: 'Đơn hàng đang chờ nhân viên bưu tá đến lấy hàng tại điểm gửi.',
      stepIndex: 0,
      badgeText: 'Chờ lấy',
    };
  }

  // 3. PICKUP COMPLETED
  if (
    code === 'scan.pickup_confirmed' ||
    statusCode === 'PICKED_UP' ||
    statusCode === 'PICKUP_COMPLETED' ||
    statusCode === 'SCAN_PICKUP' ||
    typeText.includes('nhận hàng') ||
    typeText.includes('lấy hàng') ||
    statusText.includes('đã nhận') ||
    statusText.includes('đã lấy')
  ) {
    return {
      title: 'Bưu tá đã lấy hàng',
      defaultDescription: 'Bưu tá đã tiếp nhận bưu gửi thành công từ người gửi.',
      stepIndex: 1,
      badgeText: 'Đã lấy hàng',
    };
  }

  // 4. TRANSIT / OUTBOUND / INBOUND / BAGGED / SORTED
  if (
    code.includes('manifest') ||
    code.includes('scan.outbound') ||
    code.includes('scan.inbound') ||
    statusCode === 'IN_TRANSIT' ||
    statusCode === 'SCAN_INBOUND' ||
    statusCode === 'SCAN_OUTBOUND' ||
    statusCode === 'SORTED' ||
    statusCode === 'BAGGED' ||
    statusCode === 'ARRIVED_HUB' ||
    statusCode === 'ARRIVED_DEST_HUB' ||
    typeText.includes('xe đi') ||
    typeText.includes('xe đến') ||
    typeText.includes('luân chuyển') ||
    typeText.includes('trung chuyển') ||
    typeText.includes('gửi hàng') ||
    typeText.includes('hàng đến') ||
    typeText.includes('đóng bao') ||
    typeText.includes('gỡ bao')
  ) {
    const isDestHubArrival =
      statusCode === 'ARRIVED_DEST_HUB' ||
      typeText.includes('bưu cục phát') ||
      statusText.includes('bưu cục phát');

    return {
      title: isDestHubArrival ? 'Đã đến bưu cục phát' : 'Đang vận chuyển trung chuyển',
      defaultDescription: isDestHubArrival
        ? 'Kiện hàng đã đến bưu cục phát, chuẩn bị bàn giao cho bưu tá giao hàng.'
        : 'Kiện hàng đang được trung chuyển an toàn giữa các trung tâm phân loại.',
      stepIndex: 2,
      badgeText: 'Trung chuyển',
    };
  }

  // 5. OUT FOR DELIVERY
  if (
    statusCode === 'DELIVERING' ||
    statusCode === 'OUT_FOR_DELIVERY' ||
    statusCode === 'READY_FOR_DELIVERY' ||
    typeText.includes('đang được giao') ||
    typeText.includes('phát hàng') ||
    statusText.includes('phát hàng') ||
    statusText.includes('đang giao')
  ) {
    return {
      title: 'Đang giao hàng',
      defaultDescription: 'Bưu tá đang trên đường giao hàng đến địa chỉ người nhận.',
      stepIndex: 3,
      badgeText: 'Đang giao',
    };
  }

  // 6. DELIVERED
  if (
    code === 'delivery.delivered' ||
    statusCode === 'DELIVERED' ||
    statusCode === 'COMPLETED' ||
    typeText.includes('ký nhận') ||
    statusText.includes('ký nhận') ||
    statusText.includes('thành công')
  ) {
    return {
      title: 'Giao hàng thành công',
      defaultDescription: 'Đơn hàng đã được giao và ký nhận thành công.',
      stepIndex: 4,
      badgeText: 'Thành công',
    };
  }

  // 7. DELIVERY FAILED / NDR
  if (
    code === 'delivery.failed' ||
    code === 'ndr.created' ||
    statusCode === 'DELIVERY_FAILED' ||
    statusCode === 'NDR_CREATED'
  ) {
    return {
      title: 'Giao hàng chưa thành công',
      defaultDescription: 'Đơn hàng tạm hoãn giao do sự cố khách hẹn lại hoặc chưa liên hệ được.',
      stepIndex: 3,
      badgeText: 'Sự cố NDR',
    };
  }

  // 8. RETURN
  if (code.includes('return') || statusCode.includes('RETURN')) {
    return {
      title: statusCode === 'RETURNED' || statusCode === 'RETURN_COMPLETED' ? 'Đã chuyển hoàn' : 'Đang chuyển hoàn',
      defaultDescription: 'Đơn hàng đang trong quy trình chuyển hoàn về người gửi.',
      stepIndex: 2,
      badgeText: 'Chuyển hoàn',
    };
  }

  // 9. CANCELLED
  if (statusCode === 'CANCELLED') {
    return {
      title: 'Đã hủy đơn',
      defaultDescription: 'Đơn hàng đã được hủy trên hệ thống.',
      stepIndex: 0,
      badgeText: 'Đã hủy',
    };
  }

  // Default Fallback
  return {
    title: ev.statusAfterEvent || ev.eventType || 'Cập nhật hành trình',
    defaultDescription: undefined,
    stepIndex: 0,
    badgeText: 'Cập nhật',
  };
}

export function formatVnd(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}
