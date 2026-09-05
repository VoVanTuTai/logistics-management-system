import type { ShipmentResponse } from '../services/api/shipment.api';
import type { TimelineEventResponse, UnifiedTrackingResponse } from '../services/api/tracking.api';
import type { OrderModel, ShipmentStatus, TrackingEvent } from '../types';
import { resolveHubFullAddress } from './hubResolver';

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
 * Clean internal noise (mã bao MB..., MB..., MANIFEST-..., Mã NV..., Biển xe..., URLs)
 * from notes so customer sees clean real notes without Ops operational noise.
 */
export function cleanCustomerNote(note?: string | null): string | undefined {
  if (!note) return undefined;
  let cleaned = note.trim();

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s"'<>()]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Minh chứng:\s*Xem ảnh/gi, '');
  cleaned = cleaned.replace(/\|?\s*Minh chứng:\s*/gi, '');

  // Strip raw internal codes (MB..., MANIFEST-..., Mã NV..., Biển xe...)
  cleaned = cleaned.replace(/\|?\s*MB[0-9]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*MANIFEST-[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Mã\s+NV\s*:\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Mã\s+NV\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Biển\s+xe\s*:\s*[A-Z0-9_-]+/gi, '');
  cleaned = cleaned.replace(/\|?\s*Courier\s+Bưu\s+cục[^\s|]+/gi, '');

  // Trim separators
  cleaned = cleaned.replace(/^\s*[-|•,]\s*/, '').replace(/\s*[-|•,]\s*$/, '').trim();

  // If note was purely internal dispatch log ("điều phối từ màn..."), filter it out
  if (
    cleaned.toLowerCase().includes('màn điều phối') ||
    cleaned.toLowerCase().includes('phân vùng shipper')
  ) {
    return undefined;
  }

  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Helper to extract Courier Name & Phone if assigned in event actor / metadata
 */
function extractCourierInfo(ev: TimelineEventResponse): string | null {
  const actorStr = ev.actor || '';
  const noteStr = ev.note || '';

  // Look for phone pattern (0[3|5|7|8|9][0-9]{8})
  const phoneMatch = (actorStr + ' ' + noteStr).match(/0[3|5|7|8|9][0-9]{8}/);

  // Look for courier name
  const nameMatch = actorStr.match(/Courier\s+([^\s|-]+(?:\s+[^\s|-]+)*)/i) ||
                    actorStr.match(/Nhân\s+viên\s+([^\s|-]+(?:\s+[^\s|-]+)*)/i);

  if (nameMatch || phoneMatch) {
    const name = nameMatch ? nameMatch[1].trim() : 'Nguyễn Văn A';
    const phone = phoneMatch ? phoneMatch[0] : '0987654321';
    return `${name} - SĐT: ${phone}`;
  }

  return null;
}

/**
 * Map real tracking events from API into Sender Perspective Messages:
 * 1. Hide employee IDs, names, internal ops codes (mã bao, biển xe, mã NV).
 * 2. Look up Hub ID/code in database to get the REAL FULL HUB ADDRESS.
 * 3. Format boldPrefix + addressSuffix for customer mobile UI:
 *    - Created: boldPrefix = "Đơn hàng đã được tạo thành công trên hệ thống."
 *    - Waiting for Pickup: boldPrefix = "Đơn hàng đang chờ nhân viên giao nhận lấy tại ", addressSuffix = "[Địa chỉ người gửi]"
 *    - Pickup Completed: boldPrefix = "Đơn vị vận chuyển của chúng tôi đã tiếp nhận đơn hàng tại ", addressSuffix = "[Địa chỉ Hub gửi]"
 *    - Departed: boldPrefix = "Đơn hàng đã rời ", addressSuffix = "[Địa chỉ Hub gửi]"
 *    - Inbound: boldPrefix = "Đơn hàng đã đến trung tâm phân loại ", addressSuffix = "[Địa chỉ Hub đến]"
 *    - Out for delivery: boldPrefix = "Đơn hàng đang trên đường giao. ", addressSuffix = "[Thông tin Courier]"
 *    - Delivered: boldPrefix = "Đơn hàng đã được giao thành công đến người nhận."
 */
export function mapTimelineEventsForCustomer(
  rawEvents: TimelineEventResponse[],
  senderComposedAddr?: string,
  receiverComposedAddr?: string,
  metaPodImageUrl?: string,
): TrackingEvent[] {
  const events = [...rawEvents];
  // Sort ascending by occurredAt
  events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  const total = events.length;

  const mapped: TrackingEvent[] = events.map((ev, index) => {
    const occurredDate = new Date(ev.occurredAt);
    const isValidDate = !isNaN(occurredDate.getTime());

    const timeLabel = isValidDate
      ? occurredDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '';
    const dateLabel = isValidDate
      ? occurredDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
      : '';

    const isFirstInTimeline = index === 0;
    const isLastInTimeline = index === total - 1;

    const evTypeLower = (ev.eventType || '').toLowerCase();
    const evStatusLower = (ev.statusAfterEvent || '').toLowerCase();
    const evStatusCode = (ev.statusAfterEventCode || ev.eventTypeCode || '').toUpperCase();

    // 1. Resolve REAL FULL HUB ADDRESS from DB via locationCode / locationText
    const resolvedHubAddress = resolveHubFullAddress(
      ev.locationCode,
      ev.locationText,
      isFirstInTimeline ? senderComposedAddr : isLastInTimeline ? receiverComposedAddr : undefined,
    );

    // Sender pickup address (for Created and Waiting for Pickup events)
    const pickupAddress = senderComposedAddr || resolvedHubAddress;
    const deliveryAddress = receiverComposedAddr || resolvedHubAddress;

    let title = ev.eventType || ev.statusAfterEvent || 'Cập nhật hành trình';
    let statusText = ev.statusAfterEvent || undefined;
    let boldPrefix = '';
    let addressSuffix = '';
    let eventLocation = resolvedHubAddress;

    // 2. Map Template Messages by Status (Sender Perspective)
    // A. CREATED (Tạo đơn hàng)
    if (evStatusCode === 'CREATED' || (evTypeLower.includes('tạo') && !evTypeLower.includes('khai thác'))) {
      title = 'Đã tạo đơn hàng';
      statusText = 'Đã tạo';
      eventLocation = pickupAddress;
      boldPrefix = 'Đơn hàng đã được tạo thành công trên hệ thống.';
      addressSuffix = '';
    }
    // B. WAITING FOR PICKUP / PICKUP ASSIGNED (Chờ lấy hàng / Điều phối cho Courier)
    else if (
      evStatusLower.includes('chờ lấy') ||
      evStatusCode.includes('PICKUP_ASSIGNED') ||
      evTypeLower.includes('điều phối') ||
      evStatusCode.includes('REQUESTED')
    ) {
      title = 'Chờ lấy hàng';
      statusText = 'Chờ lấy hàng';
      eventLocation = pickupAddress;
      boldPrefix = 'Đơn hàng đang chờ nhân viên giao nhận lấy tại ';
      addressSuffix = pickupAddress;
    }
    // C. PICKUP COMPLETED (Lấy hàng thành công / Nhận hàng tại Bưu cục gửi)
    else if (
      evTypeLower.includes('lấy hàng') ||
      evTypeLower.includes('nhận hàng') ||
      evStatusLower.includes('đã nhận hàng') ||
      evStatusLower.includes('đã lấy hàng') ||
      evStatusCode.includes('PICKUP_COMPLETED')
    ) {
      title = 'Lấy hàng thành công';
      statusText = 'Đã nhận hàng';
      eventLocation = resolvedHubAddress;
      boldPrefix = 'Đơn vị vận chuyển của chúng tôi đã tiếp nhận đơn hàng tại ';
      addressSuffix = resolvedHubAddress;
    }
    // D. OUTBOUND / DEPARTED (Gửi hàng / Rời bưu cục)
    else if (
      evTypeLower.includes('gửi hàng') ||
      evTypeLower.includes('rời') ||
      evTypeLower.includes('xuất kho') ||
      evStatusCode.includes('OUTBOUND') ||
      evStatusLower.includes('gửi hàng')
    ) {
      title = 'Đơn hàng đã rời bưu cục gửi';
      statusText = 'Gửi hàng';
      eventLocation = resolvedHubAddress;
      boldPrefix = 'Đơn hàng đã rời ';
      addressSuffix = resolvedHubAddress;
    }
    // E. INBOUND / ARRIVED AT SORTING HUB (Đã đến Hub / Trung tâm phân loại / Đóng bao)
    else if (
      evTypeLower.includes('đến') ||
      evTypeLower.includes('đóng bao') ||
      evStatusLower.includes('đến hub') ||
      evStatusLower.includes('đóng bao') ||
      evStatusCode.includes('INBOUND') ||
      evStatusCode.includes('MANIFEST')
    ) {
      title = 'Đã đến trung tâm phân loại';
      statusText = ev.statusAfterEvent || 'Đã đến Hub';
      eventLocation = resolvedHubAddress;
      boldPrefix = 'Đơn hàng đã đến trung tâm phân loại ';
      addressSuffix = resolvedHubAddress;
    }
    // F. OUT FOR DELIVERY (Phân công Courier đi phát hàng)
    else if (
      evTypeLower.includes('giao') ||
      evTypeLower.includes('phát') ||
      evStatusCode.includes('DELIVERING') ||
      evStatusCode.includes('DELIVERY_ASSIGNED') ||
      evStatusCode.includes('READY_FOR_DELIVERY')
    ) {
      title = 'Đang trên đường giao';
      statusText = 'Đang giao hàng';
      eventLocation = deliveryAddress;
      const courierInfo = extractCourierInfo(ev);
      boldPrefix = 'Đơn hàng đang trên đường giao.';
      addressSuffix = courierInfo
        ? ` Nhân viên giao hàng: ${courierInfo}`
        : ' Đã phân công cho nhân viên giao hàng đến người nhận.';
    }
    // G. DELIVERED (Giao hàng thành công)
    else if (
      evStatusCode === 'DELIVERED' ||
      evTypeLower.includes('thành công') ||
      evStatusLower.includes('đã giao')
    ) {
      title = 'Giao hàng thành công';
      statusText = 'Giao thành công';
      eventLocation = deliveryAddress;
      boldPrefix = 'Đơn hàng đã được giao thành công đến người nhận.';
      addressSuffix = '';
    }
    // H. DEFAULT FALLBACK
    else {
      eventLocation = resolvedHubAddress;
      boldPrefix = 'Đơn hàng đang xử lý tại ';
      addressSuffix = resolvedHubAddress;
    }

    // Extract real proof image if any
    let proofImageUrl: string | undefined = undefined;
    if (ev.metadata?.podImageUrl && typeof ev.metadata.podImageUrl === 'string') {
      proofImageUrl = ev.metadata.podImageUrl;
    } else if (ev.metadata?.proofImageUrl && typeof ev.metadata.proofImageUrl === 'string') {
      proofImageUrl = ev.metadata.proofImageUrl;
    } else if (ev.metadata?.photoUrl && typeof ev.metadata.photoUrl === 'string') {
      proofImageUrl = ev.metadata.photoUrl;
    }

    const noteUrlMatch = (ev.note || '').match(/https?:\/\/[^\s"'<>()]+/i) ||
      (ev.actor || '').match(/https?:\/\/[^\s"'<>()]+/i);
    if (!proofImageUrl && noteUrlMatch) {
      proofImageUrl = noteUrlMatch[0];
    }
    if (!proofImageUrl && isLastInTimeline && metaPodImageUrl) {
      proofImageUrl = metaPodImageUrl;
    }

    proofImageUrl = normalizeMediaPublicUrl(proofImageUrl);

    const fullMessage = `${boldPrefix}${addressSuffix}`;

    return {
      id: ev.id || `ev-${index}`,
      stt: index + 1,
      action: title,
      title,
      statusText,
      scannedAt: isValidDate ? occurredDate.toLocaleString('vi-VN') : ev.occurredAt,
      timestamp: isValidDate ? occurredDate.toLocaleString('vi-VN') : ev.occurredAt,
      timeLabel,
      dateLabel,
      locationText: eventLocation,
      location: eventLocation,
      noteText: fullMessage,
      boldPrefix,
      addressSuffix,
      proofImageUrl,
      completed: true,
      isCurrent: isLastInTimeline,
    };
  });

  // Reverse so newest event is on top for Mobile Layout
  mapped.reverse();
  return mapped;
}

export function mapTrackingToCustomerOrderModel(
  res: UnifiedTrackingResponse,
  shipment?: ShipmentResponse | null,
): OrderModel {
  const currentStatus =
    (res.current?.currentStatusCode as ShipmentStatus) ||
    (shipment?.currentStatus as ShipmentStatus) ||
    'CREATED';

  const meta = (shipment?.metadata as Record<string, any>) || {};
  const sender = meta.sender || {};
  const receiver = meta.receiver || {};
  const pkg = meta.package || {};

  const senderAddressComposed =
    sender.address ||
    [sender.addressDetail, sender.ward, sender.province].filter(Boolean).join(', ') ||
    res.current?.currentLocationText ||
    '';

  const receiverAddressComposed =
    receiver.address ||
    [receiver.addressDetail, receiver.ward, receiver.province].filter(Boolean).join(', ') ||
    '';

  const metaPodImageUrl = normalizeMediaPublicUrl(
    (meta.podImageUrl || meta.proofImageUrl) as string | undefined,
  );

  const mappedTimeline = mapTimelineEventsForCustomer(
    res.timeline || [],
    senderAddressComposed,
    receiverAddressComposed,
    metaPodImageUrl,
  );

  return {
    id: shipment?.id || res.shipmentCode,
    code: res.shipmentCode,
    category: 'SENT',
    orderType: 'REGULAR',
    sender: {
      name: sender.name || 'Người gửi',
      phone: sender.phone || '',
      addressDetail: senderAddressComposed,
      composedAddress: senderAddressComposed,
      ward: sender.ward,
      district: sender.district,
      province: sender.province,
      hubCode: sender.hubCode,
    },
    receiver: {
      name: receiver.name || 'Người nhận',
      phone: receiver.phone || '',
      addressDetail: receiverAddressComposed,
      composedAddress: receiverAddressComposed,
      ward: receiver.ward,
      district: receiver.district,
      province: receiver.province,
      hubCode: receiver.hubCode,
    },
    itemName: pkg.itemName || pkg.itemType || 'Hàng hóa bưu gửi',
    weightKg: Number(pkg.weightKg) || 0.5,
    declaredValueVnd: Number(pkg.declaredValue) || 0,
    codAmountVnd: Number(meta.codAmount || pkg.codAmount) || 0,
    shippingFeeVnd: Number(meta.estimatedFee || meta.shippingFee || meta.service?.fee || meta.pricing?.totalFee) || 22000,
    status: currentStatus,
    createdAt: shipment?.createdAt || res.current?.lastEventAt || new Date().toISOString(),
    updatedAt: shipment?.updatedAt || res.current?.updatedAt || new Date().toISOString(),
    timeline: mappedTimeline.length > 0 ? mappedTimeline : [
      {
        id: 't-1',
        stt: 1,
        action: 'Đã tạo đơn hàng',
        title: 'Đã tạo đơn hàng',
        statusText: 'Đã tạo',
        scannedAt: new Date(shipment?.createdAt || Date.now()).toLocaleString('vi-VN'),
        timestamp: new Date(shipment?.createdAt || Date.now()).toLocaleString('vi-VN'),
        timeLabel: new Date(shipment?.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        dateLabel: new Date(shipment?.createdAt || Date.now()).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' }),
        boldPrefix: 'Đơn hàng đã được tạo thành công trên hệ thống.',
        addressSuffix: '',
        noteText: 'Đơn hàng đã được tạo thành công trên hệ thống.',
        completed: true,
        isCurrent: true,
      },
    ],
  };
}
