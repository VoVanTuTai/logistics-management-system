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
  baseFee: number;
  excessFee: number;
  zoneSurcharge: number;
  totalFee: number;
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
    const cleanNumber = trackingNumber.trim().toUpperCase();
    this.logger.log(`Tool trackShipment invoked for: ${cleanNumber}`);

    // Thử gọi microservice tracking-service thực tế
    try {
      const resp = await fetch(`${this.trackingServiceUrl}/api/v1/tracking/${cleanNumber}`, {
        signal: AbortSignal.timeout(2000),
      });

      if (resp.ok) {
        const data = (await resp.json()) as any;
        return {
          found: true,
          trackingNumber: cleanNumber,
          status: data.status || 'IN_TRANSIT',
          statusText: 'Đang vận chuyển',
          currentLocation: data.currentHub || 'Hub Trung Chuyển Tân Bình',
          estimatedDelivery: data.estimatedDelivery || 'Hôm nay trước 18:00',
          timeline: data.events || [],
        };
      }
    } catch (err) {
      // Khi tracking-service chưa bật, dùng dữ liệu giả lập có kiểm soát cho demo
      this.logger.debug(`Tracking service offline at ${this.trackingServiceUrl}, using fallback demo response.`);
    }

    // Fallback response phục vụ demo
    return {
      found: true,
      trackingNumber: cleanNumber,
      status: 'IN_TRANSIT',
      statusText: 'Đang luân chuyển liên tỉnh',
      senderCity: 'Hà Nội (Hub Long Biên)',
      receiverCity: 'TP. Hồ Chí Minh (Hub Tân Bình)',
      currentLocation: 'Kho trung chuyển Đà Nẵng - Đang bốc xếp lên xe tải tuyến Bắc-Nam',
      estimatedDelivery: 'Dự kiến phát ngày mai trước 12:00',
      timeline: [
        { time: '14/09 09:30', status: 'PICKED_UP', description: 'Shipper đã lấy hàng thành công tại kho Merchant' },
        { time: '14/09 18:00', status: 'OUT_BOUND', description: 'Xuất kho Hub Long Biên đi Đà Nẵng' },
        { time: '15/09 06:15', status: 'HUB_IN', description: 'Đã nhập kho trung chuyển Đà Nẵng' },
      ],
    };
  }

  /**
   * Dự toán cước phí bưu gửi theo quy chuẩn Nexus Logistics & IATA
   */
  public calculatePricing(
    weightKg: number,
    serviceType = 'STANDARD',
    fromCity = 'TP.HCM',
    toCity = 'Hà Nội'
  ): PricingResult {
    this.logger.log(`Tool calculatePricing invoked: ${weightKg}kg, ${serviceType}, ${fromCity} -> ${toCity}`);

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

    const totalFee = baseFee + excessFee + zoneSurcharge;

    return {
      weightKg,
      serviceType: sType,
      baseFee,
      excessFee,
      zoneSurcharge,
      totalFee,
      currency: 'VND',
      breakdown: `Cước cơ sở (${baseWeight}kg đầu): ${baseFee.toLocaleString('vi-VN')}đ + Cước vượt cân (${excessWeight}kg): ${excessFee.toLocaleString('vi-VN')}đ + Phụ phí liên miền: ${zoneSurcharge.toLocaleString('vi-VN')}đ = Tổng: ${totalFee.toLocaleString('vi-VN')}đ`,
    };
  }
}
