import { randomBytes } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CancelShipmentInput,
  ApproveShipmentInput,
  CreateShipmentInput,
  JsonValue,
  ReviewShipmentInput,
  Shipment,
  ShipmentActionResult,
  ShipmentListFilters,
  ShipmentListPage,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';
import type { ShipmentConsumedEventType } from '../../domain/entities/shipment-status.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentStateMachine } from '../../domain/state-machine/shipment-state-machine';
import { ShipmentOutboxService } from '../../messaging/outbox/shipment-outbox.service';
import { PricingClientService } from './pricing-client.service';

const SHIPMENT_CODE_PREFIX = 'SHP';
const MAX_CODE_RETRY = 20;

@Injectable()
export class ShipmentsService {
  constructor(
    @Inject(ShipmentRepository)
    private readonly shipmentRepository: ShipmentRepository,
    private readonly shipmentStateMachine: ShipmentStateMachine,
    private readonly shipmentOutboxService: ShipmentOutboxService,
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

  async cancel(code: string, input: CancelShipmentInput): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode);

    if (!this.shipmentStateMachine.canCancel(shipment.currentStatus)) {
      throw new ConflictException(
        `Shipment "${normalizedCode}" cannot be cancelled from status "${shipment.currentStatus}".`,
      );
    }

    return this.shipmentRepository.cancel(
      normalizedCode,
      input.reason ?? null,
    );
  }

  async review(
    code: string,
    input: ReviewShipmentInput,
  ): Promise<ShipmentActionResult> {
    const shipment = await this.recordOpsAction(code, 'review', input.note);

    return {
      action: 'review',
      shipment,
    };
  }

  async approve(
    code: string,
    input: ApproveShipmentInput,
  ): Promise<ShipmentActionResult> {
    const shipment = await this.recordOpsAction(code, 'approve', input.note);

    return {
      action: 'approve',
      shipment,
    };
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
      return this.shipmentRepository.updateCurrentStatusAndLock(
        normalizedCode,
        nextStatus,
        true,
      );
    }

    return this.shipmentRepository.updateCurrentStatus(
      normalizedCode,
      nextStatus,
    );
  }

  private async recordOpsAction(
    code: string,
    action: ShipmentActionResult['action'],
    note: string | null | undefined,
  ): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    const shipment = await this.getByCode(normalizedCode);
    const metadata = this.mergeOpsActionMetadata(shipment.metadata, action, note);

    return this.shipmentRepository.updateMetadata(normalizedCode, metadata);
  }

  private mergeOpsActionMetadata(
    value: JsonValue | null,
    action: ShipmentActionResult['action'],
    note: string | null | undefined,
  ): JsonValue {
    const metadata = isJsonRecord(value) ? { ...value } : {};
    const opsActions = isJsonRecord(metadata.opsActions)
      ? { ...metadata.opsActions }
      : {};

    opsActions[action] = {
      note: normalizeOptionalText(note),
      actedAt: new Date().toISOString(),
    };
    metadata.opsActions = opsActions;

    return metadata;
  }

  private async createWithRequestedCode(
    input: CreateShipmentInput,
    requestedCode: string,
  ): Promise<Shipment> {
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
    for (let attempt = 0; attempt < MAX_CODE_RETRY; attempt += 1) {
      const generatedCode = this.generateShipmentCode();

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

  private normalizeRequiredCode(code: string): string {
    const normalizedCode = this.normalizeCode(code);

    if (!normalizedCode) {
      throw new BadRequestException('Shipment code is required.');
    }

    return normalizedCode;
  }

  private generateShipmentCode(): string {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = randomBytes(3).toString('hex').toUpperCase();

    return `${SHIPMENT_CODE_PREFIX}${datePart}${randomPart}`;
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function isJsonRecord(value: JsonValue | undefined | null): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
