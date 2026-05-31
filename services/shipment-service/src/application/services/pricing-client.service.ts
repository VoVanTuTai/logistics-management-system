import { BadGatewayException, Injectable } from '@nestjs/common';

import type {
  CreateShipmentInput,
  JsonValue,
} from '../../domain/entities/shipment.entity';

type JsonRecord = Record<string, JsonValue>;

interface PricingQuoteResponse {
  quoteId: string;
  quoteVersion: string;
  currency: string;
  serviceType: string;
  zone: string;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  totalFee: number;
  validUntil: string;
  breakdown: JsonValue;
}

@Injectable()
export class PricingClientService {
  private readonly pricingServiceUrl =
    process.env.PRICING_SERVICE_URL ?? 'http://localhost:3012';

  async applyQuote(input: CreateShipmentInput): Promise<CreateShipmentInput> {
    const metadata = asRecord(input.metadata);

    if (!metadata) {
      return input;
    }

    const quoteRequest = this.buildQuoteRequest(metadata);
    const quote = await this.requestQuote(quoteRequest);

    return {
      ...input,
      metadata: {
        ...metadata,
        estimatedFee: quote.totalFee,
        currency: quote.currency,
        pricing: {
          quoteId: quote.quoteId,
          quoteVersion: quote.quoteVersion,
          currency: quote.currency,
          totalFee: quote.totalFee,
          validUntil: quote.validUntil,
          serviceType: quote.serviceType,
          zone: quote.zone,
          actualWeightKg: quote.actualWeightKg,
          volumetricWeightKg: quote.volumetricWeightKg,
          chargeableWeightKg: quote.chargeableWeightKg,
          breakdown: quote.breakdown,
          source: 'pricing-service',
        },
      } as JsonValue,
    };
  }

  private buildQuoteRequest(metadata: JsonRecord): JsonRecord {
    const sender = asRecord(metadata.sender);
    const receiver = asRecord(metadata.receiver);
    const packageInfo = asRecord(metadata.package);
    const dimensions = asRecord(packageInfo?.dimensionsCm);
    const service = asRecord(metadata.service);

    return {
      serviceType: readString(service?.type) ?? readString(metadata.serviceType) ?? 'STANDARD',
      sender: {
        province: readString(sender?.province),
        hubCode: readString(sender?.hubCode),
      },
      receiver: {
        province: readString(receiver?.province) ?? readString(receiver?.region),
        region: readString(receiver?.region),
        hubCode: readString(receiver?.hubCode),
      },
      package: {
        weightKg: readNumber(packageInfo?.weightKg),
        dimensionsCm: {
          length: readNumber(dimensions?.length),
          width: readNumber(dimensions?.width),
          height: readNumber(dimensions?.height),
        },
        declaredValue: readNumber(packageInfo?.declaredValue),
      },
      codAmount: readNumber(metadata.codAmount),
      currency: readString(metadata.currency) ?? 'VND',
    };
  }

  private async requestQuote(payload: JsonRecord): Promise<PricingQuoteResponse> {
    const target = new URL('quotes', normalizeBaseUrl(this.pricingServiceUrl));

    try {
      const response = await fetch(target, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`pricing-service responded ${response.status}`);
      }

      const body = (await response.json()) as PricingQuoteResponse;

      if (!Number.isFinite(body.totalFee)) {
        throw new Error('pricing-service returned invalid totalFee');
      }

      return body;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';

      throw new BadGatewayException(
        `Unable to calculate shipment pricing via pricing-service: ${message}`,
      );
    }
  }
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function asRecord(value: JsonValue | undefined): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function readString(value: JsonValue | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: JsonValue | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}
