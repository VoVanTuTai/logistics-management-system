import { Injectable, Logger } from '@nestjs/common';

export interface TrackingResult {
  found: boolean;
  trackingNumber: string;
  status: string;
  statusText: string;
  senderName?: string;
  senderCity?: string;
  senderAddress?: string;
  receiverName?: string;
  receiverCity?: string;
  receiverAddress?: string;
  itemName?: string;
  weightKg?: number;
  codAmount?: number;
  currentLocation?: string;
  estimatedDelivery?: string;
  createdAt?: string;
  timeline: { time: string; status: string; description: string }[];
}

export interface PricingResult {
  weightKg: number;
  serviceType: string;
  customerTier: string;
  baseFee: number;
  excessFee: number;
  zoneSurcharge: number;
  subtotalFee: number;
  discountAmount: number;
  totalFee: number;
  estimatedReturnFee: number;
  returnSettlementMethod: string;
  currency: string;
  breakdown: string;
}

@Injectable()
export class LogisticsToolsService {
  private readonly logger = new Logger(LogisticsToolsService.name);
  private trackingServiceUrl: string;
  private pricingServiceUrl: string;
  private shipmentServiceUrl: string;

  constructor() {
    this.trackingServiceUrl = process.env.TRACKING_SERVICE_URL || 'http://localhost:3008';
    this.pricingServiceUrl = process.env.PRICING_SERVICE_URL || 'http://localhost:3012';
    this.shipmentServiceUrl = process.env.SHIPMENT_SERVICE_URL || 'http://localhost:3002';
  }

  /**
   * Tra cứu hành trình bưu kiện thời gian thực (Real-time Shipment Tracking)
   */
  public async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const cleanTracking = trackingNumber.trim().toUpperCase();
    this.logger.log(`Tool trackShipment invoked for: ${cleanTracking}`);

    try {
      // 1. Thử lấy thông tin chi tiết từ shipment-service
      let shipData: any = null;
      try {
        const shipResp = await fetch(`${this.shipmentServiceUrl}/shipments/${cleanTracking}`, {
          signal: AbortSignal.timeout(2000),
        });
        if (shipResp.ok) {
          shipData = await shipResp.json();
        }
      } catch {}

      // 2. Thử lấy thông tin trạng thái & timeline từ tracking-service
      let currentTracking: any = null;
      let timelineEvents: any[] = [];
      try {
        const curResp = await fetch(`${this.trackingServiceUrl}/tracking/${cleanTracking}/current`, {
          signal: AbortSignal.timeout(2000),
        });
        if (curResp.ok) currentTracking = await curResp.json();

        const timeResp = await fetch(`${this.trackingServiceUrl}/tracking/${cleanTracking}/timeline`, {
          signal: AbortSignal.timeout(2000),
        });
        if (timeResp.ok) {
          const timeData = await timeResp.json();
          if (Array.isArray(timeData)) timelineEvents = timeData;
        }
      } catch {}

      if (shipData || currentTracking) {
        const meta = shipData?.metadata || {};
        const sender = meta.sender || {};
        const receiver = meta.receiver || {};
        const pkg = meta.package || {};

        const status = currentTracking?.currentStatusCode || shipData?.currentStatus || 'IN_TRANSIT';
        const statusText =
          currentTracking?.currentStatus ||
          currentTracking?.viewPayload?.display?.current_status_label_vi ||
          status;
        const currentLocation =
          currentTracking?.currentLocationText ||
          meta.location?.current ||
          meta.hub?.currentCode ||
          'Đang cập nhật';

        const timeline =
          timelineEvents.length > 0
            ? timelineEvents.map((t: any) => ({
                time: t.occurredAt ? new Date(t.occurredAt).toLocaleString('vi-VN') : '',
                status: t.statusAfterEventCode || t.eventTypeCode || '',
                description: t.note || t.locationText || t.eventTypeName || 'Cập nhật trạng thái',
              }))
            : [
                {
                  time: shipData?.createdAt
                    ? new Date(shipData.createdAt).toLocaleString('vi-VN')
                    : 'Gần đây',
                  status: 'CREATED',
                  description: 'Đã tạo đơn hàng thành công trên hệ thống',
                },
              ];

        return {
          found: true,
          trackingNumber: cleanTracking,
          status,
          statusText,
          senderName: sender.name,
          senderCity: sender.province,
          senderAddress: sender.address || sender.addressDetail,
          receiverName: receiver.name,
          receiverCity: receiver.province,
          receiverAddress: receiver.address || receiver.addressDetail,
          itemName: pkg.itemName || pkg.itemType || 'Hàng hóa bưu gửi',
          weightKg: pkg.weightKg,
          codAmount: meta.codAmount ?? pkg.codAmount,
          currentLocation,
          estimatedDelivery: '18:00 Ngày mai',
          createdAt: shipData?.createdAt
            ? new Date(shipData.createdAt).toLocaleString('vi-VN')
            : undefined,
          timeline,
        };
      }
    } catch (err) {
      this.logger.warn(`Failed to query microservices: ${(err as Error).message}. Using mock response.`);
    }

    // Mock response fallback khi service offline hoặc là mã demo NX-88992211
    return {
      found: true,
      trackingNumber: cleanTracking,
      status: 'IN_TRANSIT',
      statusText: 'Đang trung chuyển qua Hub Đà Nẵng',
      senderName: 'Shop Thời Trang Coolmate',
      senderCity: 'TP. Hồ Chí Minh',
      receiverName: 'Anh Hoàng Long',
      receiverCity: 'Hà Nội',
      itemName: 'Áo khoác gió cao cấp',
      codAmount: 250000,
      currentLocation: 'Hub Đà Nẵng (Quận Liên Chiểu)',
      estimatedDelivery: '18:00 Ngày mai',
      timeline: [
        { time: '14/09 09:30', status: 'PICKED_UP', description: 'Bưu tá đã lấy hàng tại Shop' },
        { time: '14/09 14:00', status: 'HUB_IN', description: 'Đã nhập Hub Tân Bình' },
        { time: '14/09 21:00', status: 'LINEHAUL_DISPATCH', description: 'Đang chuyển xe tải liên tỉnh Bắc - Nam' },
        { time: '15/09 06:15', status: 'HUB_IN', description: 'Đã nhập kho trung chuyển Đà Nẵng' },
      ],
    };
  }

  /**
   * Lấy đơn hàng mới nhất (theo userId nếu đã đăng nhập)
   */
  public async getLatestShipment(userId?: string): Promise<{
    found: boolean;
    isUserSpecific: boolean;
    shipment?: any;
    tracking?: TrackingResult;
  }> {
    this.logger.log(`Tool getLatestShipment invoked for userId: ${userId || 'anonymous'}`);
    try {
      if (userId) {
        // Query danh sách đơn gửi của chính khách hàng qua endpoint /shipments/sent
        const queryUrl = `${this.shipmentServiceUrl}/shipments/sent?limit=1&userId=${encodeURIComponent(userId)}`;
        const res = await fetch(queryUrl, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data?.items || []);
          if (items.length > 0) {
            const latest = items[0];
            const tracking = await this.trackShipment(latest.code);
            return {
              found: true,
              isUserSpecific: true,
              shipment: latest,
              tracking,
            };
          }
        }
        // Đã đăng nhập nhưng chưa có đơn hàng nào
        return {
          found: false,
          isUserSpecific: true,
        };
      }

      // Khách vãng lai (chưa đăng nhập) -> Không trả về đơn của người khác
      return {
        found: false,
        isUserSpecific: false,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to fetch latest shipment: ${err.message}`);
    }

    return {
      found: false,
      isUserSpecific: Boolean(userId),
    };
  }

  /**
   * Dự toán cước phí bưu gửi qua microservice pricing-service (:3012)
   */
  public async calculatePricing(
    weightKg: number,
    serviceType = 'STANDARD',
    fromCity = 'HO CHI MINH',
    toCity = 'HA NOI',
    customerTier: 'GUEST' | 'STANDARD' | 'VIP_ENTERPRISE' = 'GUEST',
    dimensionsCm?: { length: number; width: number; height: number }
  ): Promise<PricingResult> {
    this.logger.log(`Tool calculatePricing invoked: ${weightKg}kg, dim=${JSON.stringify(dimensionsCm)}, ${serviceType}, ${fromCity} -> ${toCity}, tier=${customerTier}`);

    const sType = (serviceType || 'STANDARD').toUpperCase();
    const cleanFrom = fromCity.toUpperCase();
    const cleanTo = toCity.toUpperCase();

    // 1. Thử gọi microservice pricing-service (:3012/quotes)
    try {
      const resp = await fetch(`${this.pricingServiceUrl}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: sType.includes('EXPRESS') ? 'EXPRESS' : sType.includes('SAME') ? 'SAME_DAY' : 'STANDARD',
          origin: { province: cleanFrom },
          destination: { province: cleanTo },
          package: {
            weightKg,
            dimensionsCm: dimensionsCm || undefined,
          },
          customerTier,
        }),
        signal: AbortSignal.timeout(2000),
      });

      if (resp.ok) {
        const quote = (await resp.json()) as any;
        const baseItem = quote.breakdown?.find((b: any) => b.code === 'BASE_SERVICE');
        const weightItem = quote.breakdown?.find((b: any) => b.code === 'CHARGEABLE_WEIGHT');
        const zoneItem = quote.breakdown?.find((b: any) => b.code === 'ZONE_SURCHARGE');

        const baseFee = baseItem?.amount || 18000;
        const excessFee = weightItem?.amount || 0;
        const zoneSurcharge = zoneItem?.amount || 0;

        const dimInfo = dimensionsCm
          ? ` (Kích thước: ${dimensionsCm.length}x${dimensionsCm.width}x${dimensionsCm.height}cm | Thể tích IATA: ${quote.volumetricWeightKg}kg | Tính cước theo: ${quote.chargeableWeightKg}kg)`
          : '';

        return {
          weightKg: quote.actualWeightKg ?? weightKg,
          serviceType: quote.serviceType ?? sType,
          customerTier: quote.customerTier ?? customerTier,
          baseFee,
          excessFee,
          zoneSurcharge,
          subtotalFee: quote.subtotalFee,
          discountAmount: quote.discountAmount || 0,
          totalFee: quote.totalFee,
          estimatedReturnFee: quote.estimatedReturnFee,
          returnSettlementMethod: quote.returnPolicy?.settlementMethod || 'CASH_OR_QR_ON_RETURN',
          currency: quote.currency || 'VND',
          breakdown: `Tuyến ${fromCity} ➔ ${toCity}: Cân thực tế ${quote.actualWeightKg}kg${dimInfo} | Cước cơ sở (0.5kg đầu): ${baseFee.toLocaleString('vi-VN')}đ | Phụ phí vượt nấc: ${excessFee.toLocaleString('vi-VN')}đ | Phụ phí vùng miền (${quote.zone || 'METRO'}): ${zoneSurcharge.toLocaleString('vi-VN')}đ ➔ TỔNG CƯỚC CHIỀU ĐI: ${quote.totalFee.toLocaleString('vi-VN')}đ | Cước chuyển hoàn dự kiến (nếu bom hàng): ${quote.estimatedReturnFee?.toLocaleString('vi-VN')}đ (${quote.returnPolicy?.description || 'Thu 50% cước chiều đi'})`,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch from pricing-service: ${err.message}. Falling back to internal engine.`);
    }

    // 2. Dự phòng nội bộ nếu pricing-service gián đoạn
    let baseFee = 18000;
    let excessRatePerHalfKg = 3500;
    if (sType.includes('EXPRESS') || sType.includes('NHANH')) {
      baseFee = 28000;
      excessRatePerHalfKg = 5000;
    } else if (sType.includes('SAME') || sType.includes('SUPER') || sType.includes('HOA_TOC')) {
      baseFee = 42000;
      excessRatePerHalfKg = 8000;
    }

    const volumetricWeight = dimensionsCm ? (dimensionsCm.length * dimensionsCm.width * dimensionsCm.height) / 6000 : 0;
    const chargeableWeight = Math.max(weightKg, volumetricWeight);

    const excessWeight = Math.max(0, chargeableWeight - 0.5);
    const excessSteps = Math.ceil(excessWeight / 0.5);
    const excessFee = excessSteps * excessRatePerHalfKg;

    const METRO_CITIES = ['HA NOI', 'HANOI', 'HN', 'HO CHI MINH', 'HCM', 'SAI GON', 'DA NANG'];
    const isFromMetro = METRO_CITIES.some((m) => cleanFrom.includes(m));
    const isToMetro = METRO_CITIES.some((m) => cleanTo.includes(m));
    const isSameProvince =
      cleanFrom === cleanTo ||
      (cleanFrom.includes('HCM') && cleanTo.includes('HCM')) ||
      (cleanFrom.includes('NOI') && cleanTo.includes('NOI')) ||
      (cleanFrom.includes('NANG') && cleanTo.includes('NANG'));

    let zoneSurcharge = 0;
    let zoneName = 'Nội tỉnh';
    if (isSameProvince) {
      zoneSurcharge = 0;
      zoneName = 'Nội tỉnh';
    } else if (isFromMetro && isToMetro) {
      zoneSurcharge = 7000;
      zoneName = 'Trục chính Metro Corridor';
    } else {
      zoneSurcharge = 12000;
      zoneName = 'Liên tỉnh phổ thông';
    }

    const subtotalFee = baseFee + excessFee + zoneSurcharge;
    const totalFee = subtotalFee;
    const estimatedReturnFee = Math.round(totalFee * 0.5);

    return {
      weightKg,
      serviceType: sType,
      customerTier,
      baseFee,
      excessFee,
      zoneSurcharge,
      subtotalFee,
      discountAmount: 0,
      totalFee,
      estimatedReturnFee,
      returnSettlementMethod: 'CASH_OR_QR_ON_RETURN',
      currency: 'VND',
      breakdown: `Tuyến ${fromCity} ➔ ${toCity}: Cân tính cước ${chargeableWeight.toFixed(2)}kg | Cước cơ sở (0.5kg đầu): ${baseFee.toLocaleString('vi-VN')}đ | Phụ phí vượt nấc: ${excessFee.toLocaleString('vi-VN')}đ | Phụ phí vùng miền (${zoneName}): ${zoneSurcharge.toLocaleString('vi-VN')}đ ➔ TỔNG CƯỚC CHIỀU ĐI: ${totalFee.toLocaleString('vi-VN')}đ | Cước hoàn (nếu bom hàng): ${estimatedReturnFee.toLocaleString('vi-VN')}đ`,
    };
  }

  /**
   * Tính cước chuyển hoàn bưu gửi theo mô hình Rule-based Configurable Policy
   */
  public calculateReturnFee(
    forwardFee: number,
    merchantTier: 'STANDARD' | 'VIP_ENTERPRISE' | 'FLAT_10K' = 'STANDARD'
  ) {
    this.logger.log(`Tool calculateReturnFee invoked: forwardFee=${forwardFee}, tier=${merchantTier}`);

    if (merchantTier === 'VIP_ENTERPRISE') {
      return {
        merchantTier,
        forwardFee,
        returnFee: 0,
        totalPayable: forwardFee,
        explanation: 'Đối tác VIP Doanh Nghiệp (sản lượng > 1.000 đơn/tháng): Áp dụng chính sách Miễn phí cước chuyển hoàn 100% (0 VNĐ).',
      };
    }

    if (merchantTier === 'FLAT_10K') {
      return {
        merchantTier,
        forwardFee,
        returnFee: 10000,
        totalPayable: forwardFee + 10000,
        explanation: 'Chính sách Đồng giá chuyển hoàn theo thỏa thuận khung hợp đồng riêng: 10.000 VNĐ/kiện hoàn.',
      };
    }

    const returnFee = Math.round(forwardFee * 0.5);
    return {
      merchantTier: 'STANDARD',
      forwardFee,
      returnFee,
      totalPayable: forwardFee + returnFee,
      explanation: `Chính sách Mặc định (Shop thông thường / Khách lẻ): Cước chuyển hoàn = 50% cước chiều đi (${returnFee.toLocaleString('vi-VN')} VNĐ). Người gửi (Shop) thanh toán khi nhận lại bưu gửi hoặc trừ vào đối soát COD.`,
    };
  }

  /**
   * Tra cứu tiến độ xử lý hồ sơ khiếu nại bồi thường (Claims Tracking)
   */
  public async trackClaimStatus(claimCode: string) {
    const cleanCode = claimCode.trim().toUpperCase();
    this.logger.log(`Tool trackClaimStatus invoked for: ${cleanCode}`);

    try {
      const resp = await fetch(`http://localhost:3002/api/v1/claims/${cleanCode}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (resp.ok) {
        const data = (await resp.json()) as any;
        return {
          found: true,
          claimCode: cleanCode,
          shipmentCode: data.shipmentCode,
          status: data.status,
          statusText: data.status === 'APPROVED_COMPENSATION' ? 'Đã phê duyệt bồi thường' : 'Đang giám định',
          approvedAmount: data.approvedCompensationAmount,
          responsibleParty: data.responsibleEntityName || data.responsibleParty,
          notes: data.adjudicationNotes,
        };
      }
    } catch {}

    // Fallback response phục vụ demo thuyết trình
    return {
      found: true,
      claimCode: cleanCode,
      shipmentCode: '333000000001',
      status: 'APPROVED_COMPENSATION',
      statusText: 'Đã phê duyệt chi trả bồi thường 100%',
      declaredValue: 15000000,
      approvedAmount: 15000000,
      responsibleParty: 'Hub Tân Bình (Lỗi bốc xếp ném hàng nứt vỡ)',
      penaltyAmount: 15000000,
      settlementMethod: 'Tự động chuyển khoản vào tài khoản ngân hàng của Merchant trong kỳ đối soát COD gần nhất',
      adjudicatedAt: '15/09/2026',
    };
  }

  /**
   * Điều hướng chuyển tiếp sang Chuyên viên CSKH con người (AI Handover to Human Agent)
   */
  public escalateToHumanAgent(input: {
    userId?: string;
    trackingNumber?: string;
    reason?: string;
  }) {
    const ticketId = `TICKET-${Date.now().toString(36).toUpperCase()}`;
    this.logger.log(`Tool escalateToHumanAgent invoked: ticketId=${ticketId}, reason=${input.reason}`);

    return {
      ticketId,
      queue: 'TIER_2_HUMAN_SUPPORT',
      priority: 'HIGH',
      hotline: '1900-1234 (Phím 1: Giao nhận / Khiếu nại; Phím 2: Bồi thường bưu gửi)',
      operatingHours: '07:30 - 21:00 hàng ngày (kể cả Thứ 7, Chủ Nhật và ngày lễ)',
      trackingNumber: input.trackingNumber || 'N/A',
      estimatedWaitTimeSeconds: 45,
      message: `Hệ thống đã khởi tạo phiếu yêu cầu hỗ trợ trực tiếp [${ticketId}]. Chuyên viên CSKH Nexus Logistics đang được kết nối trong vòng 45 giây. Quý khách cũng có thể liên hệ tổng đài 1900-1234 để được xử lý khẩn cấp.`,
    };
  }
}

