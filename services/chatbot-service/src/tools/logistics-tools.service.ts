import { Injectable, Logger } from '@nestjs/common';

export interface TrackingResult {
  found: boolean;
  trackingNumber: string;
  status: string;
  statusText: string;
  senderCity?: string;
  receiverCity?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
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

  constructor() {
    this.trackingServiceUrl = process.env.TRACKING_SERVICE_URL || 'http://localhost:3008';
    this.pricingServiceUrl = process.env.PRICING_SERVICE_URL || 'http://localhost:3012';
  }

  /**
   * Tra cứu hành trình bưu kiện thời gian thực (Real-time Shipment Tracking)
   */
  public async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const cleanTracking = trackingNumber.trim().toUpperCase();
    this.logger.log(`Tool trackShipment invoked for: ${cleanTracking}`);

    try {
      const response = await fetch(`${this.trackingServiceUrl}/tracking/public/${cleanTracking}`);
      if (response.ok) {
        const data = await response.json();
        return {
          found: true,
          trackingNumber: cleanTracking,
          status: data.currentStatus || 'IN_TRANSIT',
          statusText: data.statusDescription || 'Đang vận chuyển',
          senderCity: data.senderCity,
          receiverCity: data.receiverCity,
          currentLocation: data.currentLocation,
          estimatedDelivery: data.estimatedDelivery,
          timeline: data.checkpoints || [],
        };
      }
    } catch (err) {
      this.logger.warn(`Failed to query tracking service: ${(err as Error).message}. Using mock response.`);
    }

    // Mock response fallback khi service offline
    return {
      found: true,
      trackingNumber: cleanTracking,
      status: 'IN_TRANSIT',
      statusText: 'Đang trung chuyển qua Hub Đà Nẵng',
      senderCity: 'TP. Hồ Chí Minh',
      receiverCity: 'Hà Nội',
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
   * Dự toán cước phí bưu gửi theo quy chuẩn Nexus Logistics & IATA (Phân tầng 3-Tier)
   */
  public calculatePricing(
    weightKg: number,
    serviceType = 'STANDARD',
    fromCity = 'TP.HCM',
    toCity = 'Hà Nội',
    customerTier: 'GUEST' | 'STANDARD' | 'VIP_ENTERPRISE' = 'GUEST'
  ): PricingResult {
    this.logger.log(`Tool calculatePricing invoked: ${weightKg}kg, ${serviceType}, ${fromCity} -> ${toCity}, tier=${customerTier}`);

    const sType = serviceType.toUpperCase();
    let baseFee = 18000;
    let excessRatePerHalfKg = 5000;

    if (sType.includes('EXPRESS') || sType.includes('HOA_TOC') || sType.includes('NHANH')) {
      baseFee = 28000;
      excessRatePerHalfKg = 8000;
    } else if (sType.includes('SAME') || sType.includes('TRONG_NGAY')) {
      baseFee = 42000;
      excessRatePerHalfKg = 12000;
    }

    // Phụ phí vượt nấc 0.5kg
    const baseWeight = 0.5;
    const excessWeight = Math.max(0, weightKg - baseWeight);
    const excessSteps = Math.ceil(excessWeight / 0.5);
    const excessFee = excessSteps * excessRatePerHalfKg;

    // Phụ phí vùng miền liên miền Bắc - Nam
    const isInterZone =
      (fromCity.toLowerCase().includes('hà nội') && toCity.toLowerCase().includes('hcm')) ||
      (fromCity.toLowerCase().includes('hcm') && toCity.toLowerCase().includes('hà nội'));
    const zoneSurcharge = isInterZone ? 10000 : 0;

    const subtotalFee = baseFee + excessFee + zoneSurcharge;

    // Chiết khấu theo Customer Tier
    let discountAmount = 0;
    let discountLabel = '';
    if (customerTier === 'STANDARD') {
      discountAmount = Math.round((subtotalFee * 0.05) / 100) * 100; // 5%
      discountLabel = ' (Đã trừ 5% ưu đãi Shop)';
    } else if (customerTier === 'VIP_ENTERPRISE') {
      discountAmount = Math.round((subtotalFee * 0.15) / 100) * 100; // 15%
      discountLabel = ' (Đã trừ 15% chiết khấu Hợp đồng VIP)';
    }

    const totalFee = subtotalFee - discountAmount;

    // Cước hoàn ước tính
    let estimatedReturnFee = Math.round((totalFee * 0.5) / 100) * 100;
    let returnSettlementMethod = 'CASH_OR_QR_ON_RETURN';
    if (customerTier === 'VIP_ENTERPRISE') {
      estimatedReturnFee = 0;
      returnSettlementMethod = 'WAIVED (Miễn phí 100%)';
    } else if (customerTier === 'STANDARD') {
      returnSettlementMethod = 'COD_SETTLEMENT_DEDUCTION (Tự động trừ đối soát COD)';
    }

    return {
      weightKg,
      serviceType: sType,
      customerTier,
      baseFee,
      excessFee,
      zoneSurcharge,
      subtotalFee,
      discountAmount,
      totalFee,
      estimatedReturnFee,
      returnSettlementMethod,
      currency: 'VND',
      breakdown: `Tạm tính: ${subtotalFee.toLocaleString('vi-VN')}đ${discountLabel} -> Tổng cước chiều đi: ${totalFee.toLocaleString('vi-VN')}đ | Cước hoàn dự kiến (nếu bom hàng): ${estimatedReturnFee.toLocaleString('vi-VN')}đ (${returnSettlementMethod})`,
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
}
