import { createHash } from 'crypto';

import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';

import { ServiceRegistryClient } from '../../../infrastructure/clients/service-registry.client';
import type {
  JsonObject,
  MarketplaceCreateOrderRequest,
  PickupResponse,
  ShipmentResponse,
  ShopMapping,
} from './merchant-integrations.types';

interface CreateOrderResult {
  statusCode: number;
  body: JsonObject;
}

interface ErrorDetail {
  field?: string;
  reason: string;
}

interface NormalizedCreateOrderInput {
  external: {
    platform: string;
    shopId: string;
    externalOrderId: string;
    externalOrderCode?: string;
    orderCreatedAt?: string;
    orderStatus?: string;
  };
  merchant: {
    merchantId: string;
    shopName?: string;
  };
  sender: {
    name?: string;
    phone: string;
    address: string;
    ward?: string;
    district?: string;
    province?: string;
    hubCode?: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    ward?: string;
    district?: string;
    province?: string;
    note?: string;
  };
  parcel: {
    items: Array<{
      sku?: string;
      name?: string;
      quantity?: number;
      unitPrice?: number;
    }>;
    weightGram: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    declaredValue: number;
  };
  service: {
    serviceType: string;
    pickupType: string;
    expectedPickupAt?: string;
  };
  payment: {
    codAmount: number;
    shippingFee: number;
    payer: string;
    codIncludesShippingFee: boolean;
  };
  options: {
    autoCreatePickup: boolean;
    printLabelFormat: string;
  };
}

interface HubRecord {
  code: string;
  name: string;
  level?: number;
  district?: string | null;
  ward?: string | null;
  zoneCode?: string | null;
  address?: string | null;
  isActive?: boolean;
}

interface HubAddressPayload {
  province: string;
  district: string;
  ward: string;
  type: string;
  serviceAreas: string[];
  coverageProvinceNames: string[];
}

interface ResolvedHubRoute {
  senderHub: HubRecord;
  receiverHub: HubRecord;
}

const HUB_CODE_ALIASES: Record<string, string> = {
  'HCM-001': '003079B001',
  'HUB_HCM': '003079B001',
  'HUB-HCM-001': '003079B001',
  'HN-001': '001001B001',
  'HUB_HN': '001001B001',
  'HUB-HN-001': '001001B001',
  'HUB_HANOI': '001001B001',
  'DN-001': '002048B001',
  'HUB_DN': '002048B001',
  'HUB-DN-001': '002048B001',
  'HUB_DANANG': '002048B001',
  'CB-001': '001004B001',
  'HUB_CAOBANG': '001004B001',
};

const SERVICE_TYPES = new Set(['STANDARD', 'EXPRESS', 'SAME_DAY']);
const PICKUP_TYPES = new Set(['PICKUP', 'DROP_OFF']);
const DEFAULT_PARCEL = {
  weightGram: 500,
  lengthCm: 20,
  widthCm: 15,
  heightCm: 10,
};

@Injectable()
export class MarketplaceIntegrationsService {
  constructor(private readonly serviceRegistryClient: ServiceRegistryClient) {}

  getHealth(partnerCode: string): JsonObject {
    return {
      success: true,
      data: {
        service: 'merchant-integrations-adapter',
        status: 'ok',
        partnerCode,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async createOrder(
    input: MarketplaceCreateOrderRequest,
    partnerCode: string,
    idempotencyKeyHeader?: string,
  ): Promise<CreateOrderResult> {
    const normalized = this.normalizeCreateOrderInput(input);
    this.assertMerchantMapping(normalized);

    const idempotencyKey =
      idempotencyKeyHeader?.trim() ||
      this.buildIdempotencyKey(
        normalized.external.platform,
        normalized.external.shopId,
        normalized.external.externalOrderId,
      );
    const shipmentCode = this.buildShipmentCode(idempotencyKey);
    const existingShipment =
      (await this.findShipmentByCode(shipmentCode)) ??
      (await this.findShipmentByCode(this.buildLegacyShipmentCode(idempotencyKey)));

    if (existingShipment) {
      this.assertSameExternalOrder(existingShipment, normalized);

      const pickup = normalized.options.autoCreatePickup
        ? await this.ensurePickup(existingShipment, normalized)
        : null;

      return {
        statusCode: HttpStatus.OK,
        body: {
          success: true,
          data: this.buildCreateOrderData(
            existingShipment,
            normalized,
            pickup,
            true,
          ),
        },
      };
    }

    const resolvedRoute = await this.resolveHubRoute(normalized);
    const metadata = this.buildShipmentMetadata(
      normalized,
      partnerCode,
      idempotencyKey,
      resolvedRoute,
    );
    const shipment = await this.upstreamRequest<ShipmentResponse>(
      'shipment',
      '/shipments',
      {
        method: 'POST',
        body: {
          code: shipmentCode,
          metadata,
        },
      },
    );
    const pickup = normalized.options.autoCreatePickup
      ? await this.ensurePickup(shipment, normalized)
      : null;

    return {
      statusCode: HttpStatus.CREATED,
      body: {
        success: true,
        data: this.buildCreateOrderData(shipment, normalized, pickup, false),
      },
    };
  }

  async queryOrder(
    platform: string,
    shopId: string,
    externalOrderId: string,
  ): Promise<JsonObject> {
    const idempotencyKey = this.buildIdempotencyKey(platform, shopId, externalOrderId);
    const shipment = await this.getShipmentByCodeOrLegacy(idempotencyKey);
    const receiverPhone = this.resolveTrackingPhone(shipment);

    return {
      success: true,
      data: {
        shipmentCode: shipment.code,
        externalOrderId,
        platform,
        shopId,
        currentStatus: shipment.currentStatus,
        trackingUrl: this.buildTrackingUrl(shipment.code, receiverPhone),
        updatedAt: shipment.updatedAt,
      },
    };
  }

  async cancelOrder(
    platform: string,
    shopId: string,
    externalOrderId: string,
    input: { reason?: string | null },
  ): Promise<JsonObject> {
    const idempotencyKey = this.buildIdempotencyKey(platform, shopId, externalOrderId);
    const shipmentToCancel = await this.getShipmentByCodeOrLegacy(idempotencyKey);
    const shipmentCode = shipmentToCancel.code;

    const shipment = await this.upstreamRequest<ShipmentResponse>(
      'shipment',
      `/shipments/${encodeURIComponent(shipmentCode)}/cancel`,
      {
        method: 'POST',
        body: {
          reason: input.reason ?? 'MARKETPLACE_CANCELLED',
        },
      },
      {
        409: 'CANNOT_CANCEL',
      },
    );

    return {
      success: true,
      data: {
        shipmentCode: shipment.code,
        status: shipment.currentStatus,
        cancelledAt: shipment.updatedAt,
      },
    };
  }

  async getTracking(shipmentCode: string): Promise<JsonObject> {
    const normalizedShipmentCode = this.normalizeShipmentCode(shipmentCode);
    const shipment = await this.getShipmentByCode(normalizedShipmentCode);
    const receiverPhone = this.resolveTrackingPhone(shipment);
    const current = await this.tryUpstreamRequest<JsonObject>(
      'tracking',
      `/tracking/${encodeURIComponent(normalizedShipmentCode)}/current`,
      { method: 'GET' },
    );
    const timeline = await this.tryUpstreamRequest<unknown[]>(
      'tracking',
      `/tracking/${encodeURIComponent(normalizedShipmentCode)}/timeline`,
      { method: 'GET' },
    );

    return {
      success: true,
      data: {
        shipmentCode: shipment.code,
        currentStatus: shipment.currentStatus,
        trackingUrl: this.buildTrackingUrl(shipment.code, receiverPhone),
        current,
        timeline: timeline ?? [],
        updatedAt: shipment.updatedAt,
      },
    };
  }

  async getLabel(shipmentCode: string, format = 'A6'): Promise<JsonObject> {
    const normalizedShipmentCode = this.normalizeShipmentCode(shipmentCode);
    const shipment = await this.getShipmentByCode(normalizedShipmentCode);
    const receiverPhone = this.resolveTrackingPhone(shipment);
    const metadata = this.asObject(shipment.metadata);

    return {
      success: true,
      data: {
        shipmentCode: shipment.code,
        format: format.trim().toUpperCase() || 'A6',
        labelUrl: this.buildLabelUrl(shipment.code, format),
        trackingUrl: this.buildTrackingUrl(shipment.code, receiverPhone),
        sender: metadata?.sender ?? null,
        receiver: metadata?.receiver ?? null,
        parcel: metadata?.parcel ?? metadata?.package ?? null,
        service: metadata?.service ?? null,
        payment: metadata?.payment ?? null,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private normalizeCreateOrderInput(input: MarketplaceCreateOrderRequest): NormalizedCreateOrderInput {
    const details: ErrorDetail[] = [];
    const external = input.external ?? {};
    const merchant = input.merchant ?? {};
    const sender = input.sender ?? {};
    const receiver = input.receiver ?? {};
    const parcel = input.parcel ?? {};
    const service = input.service ?? {};
    const payment = input.payment ?? {};
    const options = input.options ?? {};

    this.requireText(external.platform, 'external.platform', details);
    this.requireText(external.shopId, 'external.shopId', details);
    this.requireText(external.externalOrderId, 'external.externalOrderId', details);
    this.requireText(merchant.merchantId, 'merchant.merchantId', details);
    this.requireText(sender.phone, 'sender.phone', details);
    this.requireText(sender.address, 'sender.address', details);
    this.requireText(receiver.name, 'receiver.name', details);
    this.requireText(receiver.phone, 'receiver.phone', details);
    this.requireText(receiver.address, 'receiver.address', details);

    if (!Array.isArray(parcel.items) || parcel.items.length === 0) {
      details.push({ field: 'parcel.items', reason: 'must contain at least one item' });
    }

    const serviceType = (service.serviceType ?? 'STANDARD').trim().toUpperCase();
    const pickupType = (service.pickupType ?? 'PICKUP').trim().toUpperCase();

    if (!SERVICE_TYPES.has(serviceType)) {
      details.push({ field: 'service.serviceType', reason: 'unsupported service type' });
    }

    if (!PICKUP_TYPES.has(pickupType)) {
      details.push({ field: 'service.pickupType', reason: 'unsupported pickup type' });
    }

    if (details.length > 0) {
      this.fail(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'Invalid create order payload.', details);
    }

    return {
      external: {
        platform: this.cleanText(external.platform),
        shopId: this.cleanText(external.shopId),
        externalOrderId: this.cleanText(external.externalOrderId),
        externalOrderCode: this.cleanOptionalText(external.externalOrderCode),
        orderCreatedAt: this.cleanOptionalText(external.orderCreatedAt),
        orderStatus: this.cleanOptionalText(external.orderStatus),
      },
      merchant: {
        merchantId: this.cleanText(merchant.merchantId),
        shopName: this.cleanOptionalText(merchant.shopName),
      },
      sender: {
        name: this.cleanOptionalText(sender.name),
        phone: this.cleanText(sender.phone),
        address: this.cleanText(sender.address),
        ward: this.cleanOptionalText(sender.ward),
        district: this.cleanOptionalText(sender.district),
        province: this.cleanOptionalText(sender.province),
        hubCode: this.cleanOptionalText(sender.hubCode),
      },
      receiver: {
        name: this.cleanText(receiver.name),
        phone: this.cleanText(receiver.phone),
        address: this.cleanText(receiver.address),
        ward: this.cleanOptionalText(receiver.ward),
        district: this.cleanOptionalText(receiver.district),
        province: this.cleanOptionalText(receiver.province),
        note: this.cleanOptionalText(receiver.note),
      },
      parcel: {
        items: parcel.items ?? [],
        weightGram: this.positiveNumber(parcel.weightGram, DEFAULT_PARCEL.weightGram),
        lengthCm: this.positiveNumber(parcel.lengthCm, DEFAULT_PARCEL.lengthCm),
        widthCm: this.positiveNumber(parcel.widthCm, DEFAULT_PARCEL.widthCm),
        heightCm: this.positiveNumber(parcel.heightCm, DEFAULT_PARCEL.heightCm),
        declaredValue: this.nonNegativeNumber(parcel.declaredValue, 0),
      },
      service: {
        serviceType,
        pickupType,
        expectedPickupAt: this.cleanOptionalText(service.expectedPickupAt),
      },
      payment: {
        codAmount: this.nonNegativeNumber(payment.codAmount, 0),
        shippingFee: this.nonNegativeNumber(payment.shippingFee, 0),
        payer: this.cleanOptionalText(payment.payer) ?? 'RECEIVER',
        codIncludesShippingFee: payment.codIncludesShippingFee ?? true,
      },
      options: {
        autoCreatePickup: options.autoCreatePickup === true,
        printLabelFormat: this.cleanOptionalText(options.printLabelFormat) ?? 'A6',
      },
    };
  }

  private assertMerchantMapping(input: NormalizedCreateOrderInput): void {
    const fixedMarketplaceMerchantId = this.resolveFixedMarketplaceMerchantId(input);

    if (fixedMarketplaceMerchantId) {
      if (input.merchant.merchantId !== fixedMarketplaceMerchantId) {
        this.fail(
          HttpStatus.NOT_FOUND,
          'MERCHANT_NOT_FOUND',
          'merchant.merchantId does not match fixed marketplace merchant.',
        );
      }

      return;
    }

    const mappings = this.loadShopMappings();

    if (mappings.length === 0) {
      if (process.env.NEXUS_INTEGRATION_REQUIRE_SHOP_MAPPING === 'true') {
        this.fail(
          HttpStatus.NOT_FOUND,
          'MERCHANT_NOT_FOUND',
          'Shop mapping is required but NEXUS_INTEGRATION_SHOP_MAPPINGS_JSON is empty.',
        );
      }

      return;
    }

    const mapping = mappings.find(
      (item) => item.active !== false && item.shopId === input.external.shopId,
    );

    if (!mapping) {
      this.fail(HttpStatus.NOT_FOUND, 'MERCHANT_NOT_FOUND', 'Shop is not active in Nexus mapping.');
    }

    if (mapping.merchantId !== input.merchant.merchantId) {
      this.fail(
        HttpStatus.NOT_FOUND,
        'MERCHANT_NOT_FOUND',
        'merchant.merchantId does not match active Nexus shop mapping.',
      );
    }
  }

  private resolveFixedMarketplaceMerchantId(input: NormalizedCreateOrderInput): string | null {
    const configuredMerchantId = [
      process.env.NEXUS_INTEGRATION_MARKETPLACE_MERCHANT_ID,
      process.env.NEXUS_DT_COMMERCE_MERCHANT_ID,
    ]
      .map((value) => value?.trim())
      .find((value): value is string => Boolean(value));

    if (configuredMerchantId) {
      return configuredMerchantId;
    }

    return this.isDtCommercePlatform(input.external.platform) ? '41100000' : null;
  }

  private isDtCommercePlatform(platform: string): boolean {
    const normalized = platform.trim().toUpperCase().replace(/[-_\s]/g, '');
    return normalized === 'DTCOMMERCE' || normalized === 'DTCOMERGE' || normalized === 'DTCOMERCE';
  }

  private loadShopMappings(): ShopMapping[] {
    const raw = process.env.NEXUS_INTEGRATION_SHOP_MAPPINGS_JSON?.trim();

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((item): item is ShopMapping => {
        const candidate = this.asObject(item);
        return (
          typeof candidate?.shopId === 'string' &&
          typeof candidate.merchantId === 'string'
        );
      });
    } catch {
      return [];
    }
  }

  private async resolveHubRoute(
    input: NormalizedCreateOrderInput,
  ): Promise<ResolvedHubRoute> {
    const hubs = await this.loadActiveHubs();
    const senderHub = this.resolveHubForAddress(hubs, input.sender, 'sender');
    const receiverHub = this.resolveHubForAddress(hubs, input.receiver, 'receiver');

    return {
      senderHub,
      receiverHub,
    };
  }

  private async loadActiveHubs(): Promise<HubRecord[]> {
    const hubs = await this.upstreamRequest<HubRecord[]>(
      'masterdata',
      '/hubs?isActive=true',
      { method: 'GET' },
    );

    return hubs.filter((hub) => hub.isActive !== false);
  }

  private resolveHubForAddress(
    hubs: HubRecord[],
    addressInput: {
      address: string;
      ward?: string;
      district?: string;
      province?: string;
      hubCode?: string;
    },
    side: 'sender' | 'receiver',
  ): HubRecord {
    // 0. Ưu tiên mã bưu cục rõ ràng nếu đối tác truyền lên (hỗ trợ cả alias mã cũ)
    const rawExplicitHubCode = addressInput.hubCode?.trim().toUpperCase();
    if (rawExplicitHubCode) {
      const canonicalCode = HUB_CODE_ALIASES[rawExplicitHubCode] ?? rawExplicitHubCode;
      const explicitHub = hubs.find(
        (h) => h.code.trim().toUpperCase() === canonicalCode || h.code.trim().toUpperCase() === rawExplicitHubCode,
      );
      if (explicitHub) {
        return explicitHub;
      }
    }

    const addressText = [
      addressInput.address,
      addressInput.ward,
      addressInput.district,
      addressInput.province,
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(', ');

    const explicitProvinceKey = this.normalizeProvinceKey(addressInput.province);
    const addressKey = this.normalizeProvinceKey(addressText);
    const wardKey = this.normalizeLocationKey(addressInput.ward);
    const districtKey = this.normalizeLocationKey(addressInput.district);

    // 1. Lọc tất cả các Hubs hoạt động thuộc tỉnh/thành phố tương ứng
    const provinceHubs = hubs.filter((hub) => {
      const parsed = this.parseHubAddress(hub.address);
      const hubProvinceKey = this.normalizeProvinceKey(parsed.province);
      const hubNameKey = this.normalizeProvinceKey(hub.name);
      const rawAddressKey = this.normalizeProvinceKey(hub.address ?? '');

      if (
        hubProvinceKey &&
        (hubProvinceKey === explicitProvinceKey ||
          (Boolean(addressKey) && addressKey.includes(hubProvinceKey)) ||
          (Boolean(explicitProvinceKey) && hubProvinceKey.includes(explicitProvinceKey)))
      ) {
        return true;
      }

      if (
        parsed.coverageProvinceNames.some((cov) => {
          const covKey = this.normalizeProvinceKey(cov);
          return (
            Boolean(covKey) &&
            (covKey === explicitProvinceKey ||
              (Boolean(addressKey) && addressKey.includes(covKey)))
          );
        })
      ) {
        return true;
      }

      return (
        Boolean(explicitProvinceKey) &&
        (rawAddressKey.includes(explicitProvinceKey) || hubNameKey.includes(explicitProvinceKey))
      );
    });

    if (provinceHubs.length > 0) {
      // 2. Nếu có Phường/Xã (ward): Ưu tiên khớp chính xác bưu cục phụ trách phường đó
      if (wardKey) {
        const coreWard = wardKey.replace(/^(PHUONG|XA|THITRAN)\s*/, '');
        const exactWardMatch = provinceHubs.find((hub) => {
          const parsed = this.parseHubAddress(hub.address);
          const hubWardKey = this.normalizeLocationKey(hub.ward ?? parsed.ward ?? '');
          const hubNameKey = this.normalizeLocationKey(hub.name ?? '');

          if (hubWardKey && (hubWardKey === wardKey || hubWardKey.includes(wardKey) || wardKey.includes(hubWardKey))) {
            return true;
          }
          if (coreWard && (hubWardKey.includes(coreWard) || hubNameKey.includes(coreWard))) {
            return true;
          }
          return parsed.serviceAreas.some((area) => {
            const areaKey = this.normalizeLocationKey(area);
            return areaKey === wardKey || (coreWard && areaKey.includes(coreWard));
          });
        });

        if (exactWardMatch) {
          return exactWardMatch;
        }
      }

      // 3. Nếu có Quận/Huyện rõ ràng: Khớp bưu cục theo quận/huyện
      if (districtKey) {
        const inputCoreDistrict = districtKey.replace(/^(QUAN|HUYEN|THIXA|THANHPHO|TP|Q|H)\s*/, '');
        const districtMatch = provinceHubs.find((hub) => {
          const parsed = this.parseHubAddress(hub.address);
          const hubDistrictKey = this.normalizeLocationKey(hub.district ?? parsed.district ?? '');
          if (!hubDistrictKey) return false;

          const hubCoreDistrict = hubDistrictKey.replace(/^(QUAN|HUYEN|THIXA|THANHPHO|TP|Q|H)\s*/, '');
          return (
            hubDistrictKey === districtKey ||
            (inputCoreDistrict.length > 0 && hubCoreDistrict === inputCoreDistrict)
          );
        });

        if (districtMatch) {
          return districtMatch;
        }
      }

      // Nếu địa chỉ chi tiết có chứa rõ ràng tên quận/huyện (ví dụ "QUAN 12", "QUAN 1", "HUYEN ...")
      if (addressText) {
        const normalizedAddress = ` ${this.normalizeLocationKey(addressText)} `;
        const districtMatch = provinceHubs.find((hub) => {
          const parsed = this.parseHubAddress(hub.address);
          const hubDistrictKey = this.normalizeLocationKey(hub.district ?? parsed.district ?? '');
          if (!hubDistrictKey) return false;

          const hubCoreDistrict = hubDistrictKey.replace(/^(QUAN|HUYEN|THIXA|THANHPHO|TP|Q|H)\s*/, '');
          const patterns = [
            ` ${hubDistrictKey} `,
            ` QUAN ${hubCoreDistrict} `,
            ` Q ${hubCoreDistrict} `,
            ` HUYEN ${hubCoreDistrict} `,
            ` THI XA ${hubCoreDistrict} `,
          ];

          return patterns.some((pat) => normalizedAddress.includes(pat));
        });

        if (districtMatch) {
          return districtMatch;
        }
      }

      // 4. BẮT BUỘC: Nếu không khớp bưu cục riêng cho phường/xã, ưu tiên Hub cấp Tỉnh/Thành phố (Level 2 / B001 / Trung tâm)
      const provincialHub = provinceHubs.find((hub) => {
        const code = hub.code.trim().toUpperCase();
        const name = this.normalizeLocationKey(hub.name ?? '');
        return (
          hub.level === 2 ||
          code.endsWith('B001') ||
          name.startsWith('HUB TP') ||
          name.startsWith('HUB TINH') ||
          name.includes('TRUNG TAM PHAN LOAI') ||
          name.includes('TRUNG TAM KHAI THAC')
        );
      });

      if (provincialHub) {
        return provincialHub;
      }

      // 5. Nếu không có Hub cấp tỉnh rõ ràng, ưu tiên hub cấp cao hơn (level 2 > level 3)
      const sorted = [...provinceHubs].sort((a, b) => {
        const levelA = a.level ?? 3;
        const levelB = b.level ?? 3;
        if (levelA === 2 && levelB !== 2) return -1;
        if (levelB === 2 && levelA !== 2) return 1;
        return 0;
      });

      return sorted[0];
    }

    this.fail(
      HttpStatus.BAD_REQUEST,
      'ADDRESS_HUB_NOT_RESOLVED',
      `${side}.address/province không khớp bưu cục tỉnh active nào trong hệ thống.`,
      [
        {
          field: `${side}.province`,
          reason: 'must match a supported Vietnam province with an active branch hub',
        },
      ],
    );
  }

  private parseHubAddress(address: string | null | undefined): HubAddressPayload {
    if (!address?.trim()) {
      return {
        province: '',
        district: '',
        ward: '',
        type: '',
        serviceAreas: [],
        coverageProvinceNames: [],
      };
    }

    try {
      const payload = JSON.parse(address) as unknown;
      const objectPayload = this.asObject(payload);

      return {
        province: typeof objectPayload?.province === 'string' ? objectPayload.province.trim() : '',
        district: typeof objectPayload?.district === 'string' ? objectPayload.district.trim() : '',
        ward: typeof objectPayload?.ward === 'string' ? objectPayload.ward.trim() : '',
        type: typeof objectPayload?.type === 'string' ? objectPayload.type.trim().toUpperCase() : '',
        serviceAreas: Array.isArray(objectPayload?.serviceAreas)
          ? (objectPayload.serviceAreas as unknown[]).filter((x): x is string => typeof x === 'string')
          : [],
        coverageProvinceNames: Array.isArray(objectPayload?.coverageProvinceNames)
          ? (objectPayload.coverageProvinceNames as unknown[]).filter((x): x is string => typeof x === 'string')
          : [],
      };
    } catch {
      const parts = address.split(',').map((part) => part.trim()).filter(Boolean);

      return {
        province: parts[parts.length - 1] ?? '',
        district: parts.length > 1 ? parts[parts.length - 2] ?? '' : '',
        ward: parts.length > 2 ? parts[parts.length - 3] ?? '' : '',
        type: '',
        serviceAreas: [],
        coverageProvinceNames: [],
      };
    }
  }

  private normalizeLocationKey(value: string | undefined): string {
    if (!value?.trim()) {
      return '';
    }

    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/gi, ' ')
      .trim();
  }

  private normalizeProvinceKey(value: string | undefined): string {
    if (!value?.trim()) {
      return '';
    }

    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\b(TINH|THANH\s*PHO|TP)\b/g, ' ')
      .replace(/DAK\s*LAK/g, 'DAKLAK')
      .replace(/HO\s*CHI\s*MINH|HCM|SAI\s*GON/g, 'HOCHIMINH')
      .replace(/[^A-Z0-9]+/gi, '');

    return normalized;
  }

  private buildShipmentMetadata(
    input: NormalizedCreateOrderInput,
    partnerCode: string,
    idempotencyKey: string,
    route: ResolvedHubRoute,
  ): JsonObject {
    const fullSenderAddress = [
      input.sender.address,
      input.sender.ward,
      input.sender.district,
      input.sender.province,
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(', ');

    const fullReceiverAddress = [
      input.receiver.address,
      input.receiver.ward,
      input.receiver.district,
      input.receiver.province,
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(', ');

    return {
      source: 'marketplace-integration',
      platform: input.external.platform,
      channel: input.external.platform,
      salesChannel: input.external.platform,
      marketplace: input.external.platform,
      integration: {
        partnerCode,
        platform: input.external.platform,
        idempotencyKey,
        receivedAt: new Date().toISOString(),
      },
      external: input.external,
      merchant: input.merchant,
      sender: {
        ...input.sender,
        address: fullSenderAddress || input.sender.address,
        rawAddress: input.sender.address,
        hubCode: route.senderHub.code,
        resolvedHubName: route.senderHub.name,
      },
      receiver: {
        ...input.receiver,
        address: fullReceiverAddress || input.receiver.address,
        rawAddress: input.receiver.address,
        hubCode: route.receiverHub.code,
        resolvedHubName: route.receiverHub.name,
      },
      senderAddress: fullSenderAddress || input.sender.address,
      senderWard: input.sender.ward,
      senderDistrict: input.sender.district,
      senderProvince: input.sender.province,
      receiverAddress: fullReceiverAddress || input.receiver.address,
      receiverWard: input.receiver.ward,
      receiverDistrict: input.receiver.district,
      receiverProvince: input.receiver.province,
      receiverRegion: input.receiver.province,
      senderHubCode: route.senderHub.code,
      receiverHubCode: route.receiverHub.code,
      originHubCode: route.senderHub.code,
      destinationHubCode: route.receiverHub.code,
      parcel: input.parcel,
      service: input.service,
      payment: input.payment,
      options: input.options,
      routing: {
        originHubCode: route.senderHub.code,
        destinationHubCode: route.receiverHub.code,
        resolvedBy: 'address',
      },
      codAmount: input.payment.codAmount,
      estimatedFee: input.payment.shippingFee,
    };
  }

  private buildCreateOrderData(
    shipment: ShipmentResponse,
    input: NormalizedCreateOrderInput,
    pickup: PickupResponse | null,
    idempotent: boolean,
  ): JsonObject {
    const receiverPhone = this.resolveTrackingPhone(shipment, input);
    return {
      shipmentCode: shipment.code,
      externalOrderId: input.external.externalOrderId,
      platform: input.external.platform,
      shopId: input.external.shopId,
      status: shipment.currentStatus,
      trackingUrl: this.buildTrackingUrl(shipment.code, receiverPhone),
      pickup: pickup
        ? {
            pickupCode: pickup.pickupCode,
            status: pickup.status,
          }
        : null,
      label: {
        format: input.options.printLabelFormat,
        url: this.buildLabelUrl(shipment.code, input.options.printLabelFormat),
      },
      idempotent,
      createdAt: shipment.createdAt,
    };
  }

  private assertSameExternalOrder(
    shipment: ShipmentResponse,
    input: NormalizedCreateOrderInput,
  ): void {
    const metadata = this.asObject(shipment.metadata);
    const external = this.asObject(metadata?.external);

    if (
      external &&
      (external.platform !== input.external.platform ||
        external.shopId !== input.external.shopId ||
        external.externalOrderId !== input.external.externalOrderId)
    ) {
      this.fail(
        HttpStatus.CONFLICT,
        'DUPLICATE_ORDER',
        'Idempotency key resolved to a different external order.',
      );
    }
  }

  private async ensurePickup(
    shipment: ShipmentResponse,
    input: NormalizedCreateOrderInput,
  ): Promise<PickupResponse | null> {
    const existingPickup = await this.findPickupByShipmentCode(shipment.code);

    if (existingPickup) {
      return existingPickup;
    }

    const pickupCode = this.buildPickupCode(shipment.code);
    const pickupAddress = [
      input.sender.address,
      input.sender.ward,
      input.sender.district,
      input.sender.province,
    ].filter(Boolean).join(', ');

    try {
      return await this.upstreamRequest<PickupResponse>('pickup', '/pickups', {
        method: 'POST',
        body: {
          pickupCode,
          requesterName: input.sender.name ?? input.merchant.shopName ?? input.merchant.merchantId,
          contactPhone: input.sender.phone,
          pickupAddress,
          note: `Marketplace pickup | ${input.external.platform}:${input.external.shopId}:${input.external.externalOrderId}`,
          items: [
            {
              shipmentCode: shipment.code,
              quantity: 1,
            },
          ],
        },
      });
    } catch (error) {
      const retryPickup = await this.findPickupByShipmentCode(shipment.code);

      if (retryPickup) {
        return retryPickup;
      }

      throw error;
    }
  }

  private async findPickupByShipmentCode(shipmentCode: string): Promise<PickupResponse | null> {
    const pickups = await this.tryUpstreamRequest<PickupResponse[]>(
      'pickup',
      '/pickups',
      { method: 'GET' },
    );

    return (
      pickups?.find((pickup) =>
        pickup.items?.some((item) => item.shipmentCode === shipmentCode),
      ) ?? null
    );
  }

  private async findShipmentByCode(code: string): Promise<ShipmentResponse | null> {
    try {
      return await this.getShipmentByCode(code);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        return null;
      }

      throw error;
    }
  }

  private async getShipmentByCode(code: string): Promise<ShipmentResponse> {
    return this.upstreamRequest<ShipmentResponse>(
      'shipment',
      `/shipments/${encodeURIComponent(code)}`,
      { method: 'GET' },
      {
        404: 'MERCHANT_NOT_FOUND',
      },
    );
  }

  private async getShipmentByCodeOrLegacy(idempotencyKey: string): Promise<ShipmentResponse> {
    const shipmentCode = this.buildShipmentCode(idempotencyKey);
    const shipment =
      (await this.findShipmentByCode(shipmentCode)) ??
      (await this.findShipmentByCode(this.buildLegacyShipmentCode(idempotencyKey)));

    if (!shipment) {
      throw new NotFoundException(`Shipment "${shipmentCode}" was not found.`);
    }

    return shipment;
  }

  private async tryUpstreamRequest<T>(
    serviceName: string,
    path: string,
    options: { method: string; body?: unknown },
  ): Promise<T | null> {
    try {
      return await this.upstreamRequest<T>(serviceName, path, options);
    } catch {
      return null;
    }
  }

  private async upstreamRequest<T>(
    serviceName: string,
    path: string,
    options: { method: string; body?: unknown },
    errorCodeByStatus: Record<number, string> = {},
  ): Promise<T> {
    const baseUrl = this.serviceRegistryClient.resolveServiceUrl(serviceName);
    const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    const response = await fetch(url, {
      method: options.method,
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    const payload = text ? this.parseJson(text) : null;

    if (!response.ok) {
      const message = this.extractUpstreamMessage(payload, response.status);
      const code =
        errorCodeByStatus[response.status] ??
        (response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'VALIDATION_ERROR');

      this.fail(response.status, code, message);
    }

    return payload as T;
  }

  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  private extractUpstreamMessage(payload: unknown, status: number): string {
    const objectPayload = this.asObject(payload);
    const message = objectPayload?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }

    return `Upstream request failed (${status}).`;
  }

  private buildIdempotencyKey(
    platform: string,
    shopId: string,
    externalOrderId: string,
  ): string {
    return `${platform}:${shopId}:${externalOrderId}`;
  }

  private buildShipmentCode(idempotencyKey: string): string {
    return `111${this.hashDigits(idempotencyKey, 9)}`;
  }

  private buildLegacyShipmentCode(idempotencyKey: string): string {
    return `SHP${this.hash(idempotencyKey, 18)}`;
  }

  private buildPickupCode(shipmentCode: string): string {
    return `PU${this.hash(shipmentCode, 14)}`;
  }

  private hash(value: string, size: number): string {
    return createHash('sha256')
      .update(value)
      .digest('hex')
      .slice(0, size)
      .toUpperCase();
  }

  private hashDigits(value: string, size: number): string {
    const hash = createHash('sha256').update(value).digest('hex');
    const numericValue = BigInt(`0x${hash}`) % BigInt(10 ** size);

    return numericValue.toString().padStart(size, '0');
  }

  private buildTrackingUrl(shipmentCode: string, receiverPhone?: string | null): string {
    const baseUrl = process.env.PUBLIC_TRACKING_PUBLIC_URL ?? 'https://tracking.nexus-ex.site';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanCode = encodeURIComponent(shipmentCode.trim());

    if (receiverPhone && receiverPhone.trim()) {
      return `${cleanBaseUrl}/track/${cleanCode}?phone=${encodeURIComponent(receiverPhone.trim())}`;
    }

    return `${cleanBaseUrl}/track/${cleanCode}`;
  }

  private resolveTrackingPhone(
    shipment: ShipmentResponse,
    input?: NormalizedCreateOrderInput,
  ): string | null {
    const metadata = this.asObject(shipment.metadata);
    const external = this.asObject(metadata?.external);
    const sender = this.asObject(metadata?.sender);
    const receiver = this.asObject(metadata?.receiver);
    const merchant = this.asObject(metadata?.merchant);

    const isReturn = this.isReturnOrder(shipment, input, metadata, external);

    if (isReturn) {
      // Đơn hoàn: người nhận là shop nên lấy SĐT của shop
      // 1. Nếu là đơn chuyển sang hoàn (RETURN_STARTED, RETURN_COMPLETED, RETURNING...):
      //    Shop là bên gửi ban đầu (sender.phone / merchant.phone)
      if (
        shipment.currentStatus === 'RETURN_STARTED' ||
        shipment.currentStatus === 'RETURN_COMPLETED' ||
        shipment.currentStatus === 'RETURNING'
      ) {
        return (
          this.readString(sender?.phone) ??
          this.readString(input?.sender?.phone) ??
          this.readString(merchant?.phone) ??
          this.readString(receiver?.phone) ??
          this.readString(input?.receiver?.phone) ??
          null
        );
      }

      // 2. Nếu là đơn hoàn do partner tạo (người nhận là shop):
      //    Lấy receiver.phone (người nhận là shop) hoặc fallback sang sender.phone / merchant.phone
      return (
        this.readString(receiver?.phone) ??
        this.readString(input?.receiver?.phone) ??
        this.readString(sender?.phone) ??
        this.readString(input?.sender?.phone) ??
        this.readString(merchant?.phone) ??
        null
      );
    }

    // Đơn giao: người nhận là khách hàng (receiver.phone)
    return (
      this.readString(receiver?.phone) ??
      this.readString(input?.receiver?.phone) ??
      this.readString(sender?.phone) ??
      null
    );
  }

  private isReturnOrder(
    shipment: ShipmentResponse,
    input?: NormalizedCreateOrderInput,
    metadata?: JsonObject | null,
    external?: JsonObject | null,
  ): boolean {
    if (
      shipment.currentStatus === 'RETURN_STARTED' ||
      shipment.currentStatus === 'RETURN_COMPLETED' ||
      shipment.currentStatus === 'RETURNING'
    ) {
      return true;
    }

    if (metadata?.isReturn === true || external?.isReturn === true) {
      return true;
    }

    const extOrderType = String(external?.orderType ?? external?.type ?? '').toUpperCase();
    if (extOrderType === 'RETURN' || extOrderType === 'RETURN_ORDER') {
      return true;
    }

    const extOrderStatus = String(external?.orderStatus ?? '').toUpperCase();
    if (extOrderStatus.includes('RETURN')) {
      return true;
    }

    if (input) {
      const anyInput = input as any;
      if (anyInput.isReturn === true || anyInput.options?.isReturn === true || anyInput.external?.isReturn === true) {
        return true;
      }
      const inputOrderType = String(anyInput.orderType ?? anyInput.external?.orderType ?? anyInput.external?.type ?? '').toUpperCase();
      if (inputOrderType === 'RETURN' || inputOrderType === 'RETURN_ORDER') {
        return true;
      }
      const inputOrderStatus = String(input.external?.orderStatus ?? '').toUpperCase();
      if (inputOrderStatus.includes('RETURN')) {
        return true;
      }
      const serviceType = String(input.service?.serviceType ?? '').toUpperCase();
      if (serviceType.includes('RETURN')) {
        return true;
      }
    }

    return false;
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private buildLabelUrl(shipmentCode: string, format?: string): string {
    const baseUrl = process.env.OPS_PUBLIC_URL ?? 'https://ops.nexus-ex.site';
    const labelFormat = encodeURIComponent((format ?? 'A6').trim().toUpperCase() || 'A6');
    return `${baseUrl.replace(/\/$/, '')}/merchant/integrations/shipments/${encodeURIComponent(
      shipmentCode,
    )}/label?format=${labelFormat}`;
  }

  private normalizeShipmentCode(shipmentCode: string): string {
    const normalized = shipmentCode.trim().toUpperCase();

    if (!/^[A-Z0-9-]{6,32}$/.test(normalized)) {
      this.fail(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'Invalid shipmentCode.');
    }

    return normalized;
  }

  private requireText(value: unknown, field: string, details: ErrorDetail[]): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      details.push({ field, reason: 'required' });
    }
  }

  private cleanText(value: string | undefined): string {
    return value?.trim() ?? '';
  }

  private cleanOptionalText(value: string | undefined): string | undefined {
    const cleanValue = value?.trim();
    return cleanValue ? cleanValue : undefined;
  }

  private positiveNumber(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? value
      : fallback;
  }

  private nonNegativeNumber(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : fallback;
  }

  private asObject(value: unknown): JsonObject | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as JsonObject;
  }

  private fail(
    status: HttpStatus,
    code: string,
    message: string,
    details: ErrorDetail[] = [],
  ): never {
    throw new HttpException(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
      },
      status,
    );
  }
}
