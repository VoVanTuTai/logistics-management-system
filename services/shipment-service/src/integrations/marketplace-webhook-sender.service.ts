import { createHash, createHmac, randomUUID } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import type { JsonValue, Shipment } from '../domain/entities/shipment.entity';
import type { ShipmentConsumedEventType } from '../domain/entities/shipment-status.entity';

type PartnerShipmentStatus =
  | 'AWB_CREATED'
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED';

type MarketplaceWebhookEventType =
  | 'shipment.status_changed'
  | 'shipment.delivered'
  | 'shipment.cancelled'
  | 'shipment.returned'
  | 'shipment.delivery_failed';

const PARTNER_STATUS_BY_NEXUS_STATUS: Record<string, PartnerShipmentStatus> = {
  CREATED: 'AWB_CREATED',
  UPDATED: 'PENDING',
  TASK_ASSIGNED: 'PENDING',
  PICKUP_COMPLETED: 'PICKED_UP',
  MANIFEST_SEALED: 'IN_TRANSIT',
  MANIFEST_RECEIVED: 'IN_TRANSIT',
  MANIFEST_UNSEALED: 'IN_TRANSIT',
  SEND_GOODS: 'IN_TRANSIT',
  IN_TRANSIT: 'IN_TRANSIT',
  INVENTORY_CHECK: 'IN_TRANSIT',
  SCAN_INBOUND: 'IN_TRANSIT',
  SCAN_OUTBOUND: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  DELIVERY_FAILED: 'FAILED',
  NDR_CREATED: 'FAILED',
  EXCEPTION: 'FAILED',
  RETURN_STARTED: 'RETURNED',
  RETURN_COMPLETED: 'RETURNED',
  CANCELLED: 'CANCELLED',
};

const STATUS_DESCRIPTION_BY_PARTNER_STATUS: Record<PartnerShipmentStatus, string> = {
  AWB_CREATED: 'Da tao van don',
  PENDING: 'Dang cho xu ly',
  PICKED_UP: 'Da lay hang thanh cong',
  IN_TRANSIT: 'Dang van chuyen',
  OUT_FOR_DELIVERY: 'Dang giao hang',
  DELIVERED: 'Giao thanh cong',
  CANCELLED: 'Da huy',
  FAILED: 'Giao that bai',
  RETURNED: 'Da hoan hang',
};

interface MarketplaceWebhookPayload {
  eventId: string;
  eventType: MarketplaceWebhookEventType;
  occurredAt: string;
  partnerCode: string;
  shipmentCode: string;
  status: PartnerShipmentStatus;
  nexusStatus: string;
  external: Record<string, unknown> | null;
  merchant: Record<string, unknown> | null;
  trackingUrl: string;
  data: {
    platform: string | null;
    shopId: string | null;
    externalOrderId: string | null;
    externalOrderCode: string | null;
    shipmentCode: string;
    currentStatus: string;
    partnerStatus: PartnerShipmentStatus;
    statusDescription: string;
    location: {
      hubCode: string | null;
      hubName: string | null;
    } | null;
    reason: string | null;
    trackingUrl: string;
    deliveredAt?: string;
    shipment: {
      code: string;
      currentStatus: string;
      partnerStatus: PartnerShipmentStatus;
      cancellationReason: string | null;
      createdAt: string;
      updatedAt: string;
    };
  };
}

@Injectable()
export class MarketplaceWebhookSenderService {
  private readonly logger = new Logger(MarketplaceWebhookSenderService.name);

  async notifyStatusChanged(
    shipment: Shipment,
    sourceEventType?: ShipmentConsumedEventType,
  ): Promise<void> {
    if (!this.shouldSendWebhook(shipment.metadata)) {
      return;
    }

    const eventTypes = this.resolveEventTypes(shipment.currentStatus);

    for (const eventType of eventTypes) {
      await this.send(eventType, shipment, sourceEventType);
    }
  }

  private resolveEventTypes(status: string): MarketplaceWebhookEventType[] {
    const eventTypes: MarketplaceWebhookEventType[] = ['shipment.status_changed'];

    if (status === 'DELIVERED') {
      eventTypes.push('shipment.delivered');
    }

    if (status === 'CANCELLED') {
      eventTypes.push('shipment.cancelled');
    }

    if (status === 'RETURN_COMPLETED') {
      eventTypes.push('shipment.returned');
    }

    if (status === 'DELIVERY_FAILED') {
      eventTypes.push('shipment.delivery_failed');
    }

    return eventTypes;
  }

  private async send(
    eventType: MarketplaceWebhookEventType,
    shipment: Shipment,
    sourceEventType?: ShipmentConsumedEventType,
  ): Promise<void> {
    const webhookUrl = process.env.NEXUS_INTEGRATION_WEBHOOK_URL?.trim();
    const webhookSecret =
      process.env.NEXUS_INTEGRATION_WEBHOOK_SECRET?.trim() ??
      process.env.PROD_NEXUS_WEBHOOK_SECRET?.trim();

    if (!webhookUrl || !webhookSecret) {
      this.logger.warn(
        `Skip marketplace webhook for ${shipment.code}: webhook URL/secret is not configured.`,
      );
      return;
    }

    const payload = this.buildPayload(eventType, shipment, sourceEventType);
    const rawBody = JSON.stringify(payload);
    const timestamp = payload.occurredAt;
    const nonce = randomUUID();
    const webhookPath =
      process.env.NEXUS_INTEGRATION_WEBHOOK_PATH?.trim() ||
      '/api/v1/shipments/webhooks/nexus';
    const signature = this.sign(rawBody, timestamp, nonce, webhookSecret, webhookPath);
    const maxAttempts = this.parsePositiveInt(
      process.env.NEXUS_INTEGRATION_WEBHOOK_MAX_ATTEMPTS,
      3,
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Nexus-Partner-Code': payload.partnerCode,
            'X-Nexus-Event-Id': payload.eventId,
            'X-Nexus-Nonce': nonce,
            'X-Nexus-Timestamp': timestamp,
            'X-Nexus-Signature': signature,
          },
          body: rawBody,
        });

        if (response.ok) {
          this.logger.log(
            `Sent marketplace webhook ${eventType} for ${shipment.code} (attempt=${attempt}).`,
          );
          return;
        }

        const responseText = await response.text().catch(() => '');
        this.logger.warn(
          `Marketplace webhook ${eventType} for ${shipment.code} failed (${response.status}) attempt=${attempt}: ${responseText.slice(0, 200)}`,
        );
      } catch (error) {
        this.logger.warn(
          `Marketplace webhook ${eventType} for ${shipment.code} failed attempt=${attempt}: ${this.toErrorMessage(error)}`,
        );
      }

      if (attempt < maxAttempts) {
        await this.delay(this.retryDelayMs(attempt));
      }
    }
  }

  private shouldSendWebhook(metadata: JsonValue | null): boolean {
    if (process.env.NEXUS_INTEGRATION_WEBHOOK_ENABLED === 'false') {
      return false;
    }

    const metadataObject = this.asObject(metadata);
    const integration = this.asObject(metadataObject?.integration);

    return (
      metadataObject?.source === 'marketplace-integration' ||
      typeof integration?.partnerCode === 'string'
    );
  }

  private buildPayload(
    eventType: MarketplaceWebhookEventType,
    shipment: Shipment,
    sourceEventType?: ShipmentConsumedEventType,
  ): MarketplaceWebhookPayload {
    const metadata = this.asObject(shipment.metadata);
    const integration = this.asObject(metadata?.integration);
    const partnerCode =
      this.readString(integration?.partnerCode) ??
      process.env.NEXUS_INTEGRATION_PARTNER_CODE ??
      process.env.PROD_NEXUS_PARTNER_CODE ??
      'DT_COMMERCE';
    const external = this.asObject(metadata?.external);
    const merchant = this.asObject(metadata?.merchant);
    const routing = this.asObject(metadata?.routing);
    const webhookCurrentStatus = this.toWebhookCurrentStatus(
      shipment.currentStatus,
      sourceEventType,
    );
    const partnerStatus = this.toPartnerStatus(webhookCurrentStatus);
    const trackingUrl = this.buildTrackingUrl(shipment.code);
    const deliveredAt =
      eventType === 'shipment.delivered' ? this.nowRfc3339Utc() : undefined;

    return {
      eventId: randomUUID(),
      eventType,
      occurredAt: this.nowRfc3339Utc(),
      partnerCode,
      shipmentCode: shipment.code,
      status: partnerStatus,
      nexusStatus: webhookCurrentStatus,
      external,
      merchant,
      trackingUrl,
      data: {
        platform: this.readString(external?.platform),
        shopId: this.readString(external?.shopId),
        externalOrderId: this.readString(external?.externalOrderId),
        externalOrderCode: this.readString(external?.externalOrderCode),
        shipmentCode: shipment.code,
        currentStatus: webhookCurrentStatus,
        partnerStatus,
        statusDescription: STATUS_DESCRIPTION_BY_PARTNER_STATUS[partnerStatus],
        location: {
          hubCode: this.readString(routing?.originHubCode),
          hubName: null,
        },
        reason: shipment.cancellationReason,
        trackingUrl,
        ...(deliveredAt ? { deliveredAt } : {}),
        shipment: {
          code: shipment.code,
          currentStatus: webhookCurrentStatus,
          partnerStatus,
          cancellationReason: shipment.cancellationReason,
          createdAt: shipment.createdAt.toISOString(),
          updatedAt: shipment.updatedAt.toISOString(),
        },
      },
    };
  }

  private toWebhookCurrentStatus(
    nexusStatus: string,
    sourceEventType?: ShipmentConsumedEventType,
  ): string {
    if (sourceEventType === 'delivery.attempted' && nexusStatus === 'TASK_ASSIGNED') {
      return 'OUT_FOR_DELIVERY';
    }

    return nexusStatus;
  }

  private toPartnerStatus(nexusStatus: string): PartnerShipmentStatus {
    return PARTNER_STATUS_BY_NEXUS_STATUS[nexusStatus] ?? 'PENDING';
  }

  private sign(
    rawBody: string,
    timestamp: string,
    nonce: string,
    webhookSecret: string,
    webhookPath: string,
  ): string {
    const bodyHash = createHash('sha256')
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex');
    const signingPayload = [
      'POST',
      webhookPath,
      timestamp,
      nonce,
      bodyHash,
    ].join('\n');

    return createHmac('sha256', webhookSecret)
      .update(signingPayload)
      .digest('hex');
  }

  private buildTrackingUrl(shipmentCode: string): string {
    const baseUrl =
      process.env.PUBLIC_TRACKING_PUBLIC_URL ?? 'https://tracking.nexus-ex.site';

    return `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(shipmentCode)}`;
  }

  private nowRfc3339Utc(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  private retryDelayMs(attempt: number): number {
    const baseMs = this.parsePositiveInt(
      process.env.NEXUS_INTEGRATION_WEBHOOK_RETRY_DELAY_MS,
      1000,
    );

    return baseMs * attempt;
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private asObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
