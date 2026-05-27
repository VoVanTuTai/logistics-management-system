import { createHash } from 'crypto';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

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
    const existingShipment = await this.findShipmentByCode(shipmentCode);

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

    const metadata = this.buildShipmentMetadata(
      normalized,
      partnerCode,
      idempotencyKey,
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
    const shipmentCode = this.buildShipmentCode(
      this.buildIdempotencyKey(platform, shopId, externalOrderId),
    );
    const shipment = await this.getShipmentByCode(shipmentCode);

    return {
      success: true,
      data: {
        shipmentCode: shipment.code,
        externalOrderId,
        platform,
        shopId,
        currentStatus: shipment.currentStatus,
        trackingUrl: this.buildTrackingUrl(shipment.code),
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
    const shipmentCode = this.buildShipmentCode(
      this.buildIdempotencyKey(platform, shopId, externalOrderId),
    );
    await this.getShipmentByCode(shipmentCode);

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
        trackingUrl: this.buildTrackingUrl(shipment.code),
        current,
        timeline: timeline ?? [],
        updatedAt: shipment.updatedAt,
      },
    };
  }

  async getLabel(shipmentCode: string, format = 'A6'): Promise<JsonObject> {
    const normalizedShipmentCode = this.normalizeShipmentCode(shipmentCode);
    const shipment = await this.getShipmentByCode(normalizedShipmentCode);
    const metadata = this.asObject(shipment.metadata);

    return {
      success: true,
      data: {
        shipmentCode: shipment.code,
        format: format.trim().toUpperCase() || 'A6',
        labelUrl: this.buildLabelUrl(shipment.code, format),
        trackingUrl: this.buildTrackingUrl(shipment.code),
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
    return platform.trim().toUpperCase() === 'DT_COMMERCE';
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

  private buildShipmentMetadata(
    input: NormalizedCreateOrderInput,
    partnerCode: string,
    idempotencyKey: string,
  ): JsonObject {
    return {
      source: 'marketplace-integration',
      integration: {
        partnerCode,
        idempotencyKey,
        receivedAt: new Date().toISOString(),
      },
      external: input.external,
      merchant: input.merchant,
      sender: input.sender,
      receiver: input.receiver,
      parcel: input.parcel,
      service: input.service,
      payment: input.payment,
      options: input.options,
      routing: {
        originHubCode: input.sender.hubCode ?? null,
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
    return {
      shipmentCode: shipment.code,
      externalOrderId: input.external.externalOrderId,
      platform: input.external.platform,
      shopId: input.external.shopId,
      status: shipment.currentStatus,
      trackingUrl: this.buildTrackingUrl(shipment.code),
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

  private buildTrackingUrl(shipmentCode: string): string {
    const baseUrl = process.env.PUBLIC_TRACKING_PUBLIC_URL ?? 'https://tracking.nexus-ex.site';
    return `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(shipmentCode)}`;
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
