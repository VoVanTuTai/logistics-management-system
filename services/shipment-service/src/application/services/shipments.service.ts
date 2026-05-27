import { randomInt } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CancelShipmentInput,
  ConfirmLabelReprintInput,
  CreateShipmentInput,
  JsonValue,
  Shipment,
  ShipmentListFilters,
  ShipmentListPage,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';
import type { ShipmentConsumedEventType } from '../../domain/entities/shipment-status.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentStateMachine } from '../../domain/state-machine/shipment-state-machine';
import { MarketplaceWebhookSenderService } from '../../integrations/marketplace-webhook-sender.service';
import { ShipmentOutboxService } from '../../messaging/outbox/shipment-outbox.service';
import { PricingClientService } from './pricing-client.service';

const MAX_CODE_RETRY = 20;
const SHIPMENT_CODE_RULE = /^(111|101|222|333)[0-9]{9}$/;
const SHIPMENT_CODE_SEQUENCE_SIZE = 1_000_000_000;

@Injectable()
export class ShipmentsService {
  constructor(
    @Inject(ShipmentRepository)
    private readonly shipmentRepository: ShipmentRepository,
    private readonly shipmentStateMachine: ShipmentStateMachine,
    private readonly shipmentOutboxService: ShipmentOutboxService,
    private readonly marketplaceWebhookSenderService: MarketplaceWebhookSenderService,
    private readonly pricingClientService: PricingClientService,
  ) {}

  list(filters: ShipmentListFilters = {}): Promise<Shipment[] | ShipmentListPage> {
    if (filters.limit !== undefined || filters.offset !== undefined) {
      return this.shipmentRepository.listPage(filters);
    }

    return this.shipmentRepository.list(filters);
  }

  async getByCode(code: string): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.shipmentRepository.findByCode(normalizedCode);

    if (!shipment) {
      throw new NotFoundException(`Shipment "${normalizedCode}" was not found.`);
    }

    return shipment;
  }

  async create(input: CreateShipmentInput): Promise<Shipment> {
    const pricedInput = await this.pricingClientService.applyQuote(input);
    const normalizedCode = this.normalizeCode(pricedInput.code ?? null);
    const shipment = normalizedCode
      ? await this.createWithRequestedCode(pricedInput, normalizedCode)
      : await this.createWithGeneratedCode(pricedInput);

    await this.shipmentOutboxService.enqueueShipmentCreated(shipment);

    return shipment;
  }

  async update(code: string, input: UpdateShipmentInput): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    await this.getByCode(normalizedCode);

    return this.shipmentRepository.update(normalizedCode, input);
  }

  async confirmLabelReprint(
    code: string,
    input: ConfirmLabelReprintInput = {},
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode);
    const metadata = asJsonRecord(shipment.metadata);
    const deliveryInfoChange = asJsonRecord(metadata.deliveryInfoChange);
    const returnWorkflow = asJsonRecord(metadata.returnWorkflow);
    const printedAt = new Date().toISOString();
    const shouldStayLocked = returnWorkflow.blocksOps === true;

    return this.shipmentRepository.updateMetadataAndLock(
      normalizedCode,
      {
        ...metadata,
        deliveryInfoChange: {
          ...deliveryInfoChange,
          requiresLabelReprint: false,
          labelReprintedAt: printedAt,
          labelReprintedBy: input.printedBy?.trim() || null,
        },
      },
      shouldStayLocked,
    );
  }

  async cancel(code: string, input: CancelShipmentInput): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode);

    if (!this.shipmentStateMachine.canCancel(shipment.currentStatus)) {
      throw new ConflictException(
        `Shipment "${normalizedCode}" cannot be cancelled from status "${shipment.currentStatus}".`,
      );
    }

    const cancelledShipment = await this.shipmentRepository.cancel(
      normalizedCode,
      input.reason ?? null,
    );

    await this.marketplaceWebhookSenderService.notifyStatusChanged(cancelledShipment);

    return cancelledShipment;
  }

  async applyExternalEvent(
    code: string,
    eventType: ShipmentConsumedEventType,
    data: Record<string, unknown> = {},
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode);
    const nextStatus = this.shipmentStateMachine.resolveNextStatus(
      shipment.currentStatus,
      eventType,
      data,
    );

    if (nextStatus === 'EXCEPTION') {
      const updatedShipment = await this.shipmentRepository.updateCurrentStatusAndLock(
        normalizedCode,
        nextStatus,
        true,
      );

      await this.marketplaceWebhookSenderService.notifyStatusChanged(
        updatedShipment,
        eventType,
      );

      return updatedShipment;
    }

    if (eventType === 'return.started') {
      const updatedShipment = await this.shipmentRepository.updateCurrentStatusMetadataAndLock(
        normalizedCode,
        nextStatus,
        this.buildReturnWorkflowMetadata(shipment.metadata, data, true),
        true,
      );

      await this.marketplaceWebhookSenderService.notifyStatusChanged(
        updatedShipment,
        eventType,
      );

      return updatedShipment;
    }

    if (eventType === 'return.completed') {
      const updatedShipment = await this.shipmentRepository.updateCurrentStatusMetadataAndLock(
        normalizedCode,
        nextStatus,
        this.buildReturnWorkflowMetadata(shipment.metadata, data, false),
        false,
      );

      await this.marketplaceWebhookSenderService.notifyStatusChanged(
        updatedShipment,
        eventType,
      );

      return updatedShipment;
    }

    const updatedShipment = await this.shipmentRepository.updateCurrentStatus(
      normalizedCode,
      nextStatus,
    );

    await this.marketplaceWebhookSenderService.notifyStatusChanged(
      updatedShipment,
      eventType,
    );

    return updatedShipment;
  }

  private async createWithRequestedCode(
    input: CreateShipmentInput,
    requestedCode: string,
  ): Promise<Shipment> {
    this.assertWaybillCode(requestedCode);

    const existedShipment = await this.shipmentRepository.findByCode(requestedCode);

    if (existedShipment) {
      throw new ConflictException(
        `Shipment code "${requestedCode}" already exists.`,
      );
    }

    return this.shipmentRepository.create({
      ...input,
      code: requestedCode,
    });
  }

  private async createWithGeneratedCode(
    input: CreateShipmentInput,
  ): Promise<Shipment> {
    const prefix = this.resolveGeneratedCodePrefix(input.metadata);

    for (let attempt = 0; attempt < MAX_CODE_RETRY; attempt += 1) {
      const generatedCode = this.generateShipmentCode(prefix);

      try {
        return await this.shipmentRepository.create({
          ...input,
          code: generatedCode,
        });
      } catch (error) {
        if (error instanceof ConflictException) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Unable to generate unique shipment code. Please retry.',
    );
  }

  private normalizeCode(code: string | null): string | null {
    if (!code) {
      return null;
    }

    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode.length === 0) {
      return null;
    }

    if (!/^[A-Z0-9-]{6,32}$/.test(normalizedCode)) {
      throw new BadRequestException(
        'code must match /^[A-Z0-9-]{6,32}$/ after normalization.',
      );
    }

    return normalizedCode;
  }

  private assertWaybillCode(code: string): void {
    if (!SHIPMENT_CODE_RULE.test(code)) {
      throw new BadRequestException(
        'code must be a 12-digit waybill matching /^(111|101|222|333)[0-9]{9}$/.',
      );
    }
  }

  private normalizeRequiredCode(code: string): string {
    const normalizedCode = this.normalizeCode(code);

    if (!normalizedCode) {
      throw new BadRequestException('Shipment code is required.');
    }

    return normalizedCode;
  }

  private generateShipmentCode(prefix: '111' | '101' | '222' | '333'): string {
    const sequence = randomInt(SHIPMENT_CODE_SEQUENCE_SIZE);

    return `${prefix}${String(sequence).padStart(9, '0')}`;
  }

  private resolveGeneratedCodePrefix(metadata: JsonValue | null | undefined): '111' | '101' | '222' | '333' {
    const metadataRecord = asJsonRecord(metadata);
    const platform = readString(metadataRecord.platform)?.toUpperCase() ?? '';
    const source = readString(metadataRecord.source)?.toUpperCase() ?? '';
    const integration = asJsonRecord(metadataRecord.integration);
    const integrationPlatform = readString(integration.platform)?.toUpperCase() ?? '';
    const returnWorkflow = asJsonRecord(metadataRecord.returnWorkflow);

    if (
      source.includes('RETURN') ||
      platform.includes('RETURN') ||
      returnWorkflow.blocksOps === true
    ) {
      return '222';
    }

    if (
      source.includes('MARKETPLACE') ||
      platform.includes('MARKETPLACE') ||
      platform.includes('TMDT') ||
      platform.includes('TMĐT') ||
      integrationPlatform.length > 0
    ) {
      return '111';
    }

    if (source.includes('MERCHANT') || platform.includes('MERCHANT')) {
      return '101';
    }

    return '333';
  }

  private buildReturnWorkflowMetadata(
    currentMetadata: JsonValue | null,
    eventData: Record<string, unknown>,
    blocksOps: boolean,
  ): JsonValue {
    const metadata = asJsonRecord(currentMetadata);
    const returnCase = asJsonRecord(eventData.returnCase);
    const now = new Date().toISOString();

    return {
      ...metadata,
      returnWorkflow: {
        ...asJsonRecord(metadata.returnWorkflow),
        returnCaseId: readString(returnCase.id) ?? null,
        reason: readString(returnCase.note) ?? null,
        status: blocksOps ? 'STARTED' : 'COMPLETED',
        blocksOps,
        approvedAt: readString(returnCase.startedAt) ?? now,
        completedAt: blocksOps ? null : readString(returnCase.completedAt) ?? now,
      },
    };
  }
}

function asJsonRecord(value: unknown): Record<string, JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, JsonValue>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
