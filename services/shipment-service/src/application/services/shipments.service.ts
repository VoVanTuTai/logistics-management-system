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
  CreateShipmentInput,
  Shipment,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';
import type { ShipmentConsumedEventType } from '../../domain/entities/shipment-status.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { ShipmentStateMachine } from '../../domain/state-machine/shipment-state-machine';
import { ShipmentOutboxService } from '../../messaging/outbox/shipment-outbox.service';

const SHIPMENT_CODE_PREFIX = 'SHP';
const MAX_CODE_RETRY = 20;

@Injectable()
export class ShipmentsService {
  constructor(
    @Inject(ShipmentRepository)
    private readonly shipmentRepository: ShipmentRepository,
    private readonly shipmentStateMachine: ShipmentStateMachine,
    private readonly shipmentOutboxService: ShipmentOutboxService,
  ) {}

  list(): Promise<Shipment[]> {
    return this.shipmentRepository.list();
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
    const normalizedCode = this.normalizeCode(input.code ?? null);
    const shipment = normalizedCode
      ? await this.createWithRequestedCode(input, normalizedCode)
      : await this.createWithGeneratedCode(input);

    await this.shipmentOutboxService.enqueueShipmentCreated(shipment);

    return shipment;
  }

  async update(code: string, input: UpdateShipmentInput): Promise<Shipment> {
    const normalizedCode = this.normalizeRequiredCode(code);
    await this.getByCode(normalizedCode);

    const shipment = await this.shipmentRepository.update(normalizedCode, input);

    await this.shipmentOutboxService.enqueueShipmentUpdated(shipment, {
      source: 'api',
    });

    return shipment;
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

    await this.shipmentOutboxService.enqueueShipmentCancelled(cancelledShipment, {
      reason: input.reason ?? null,
    });

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
    );
    const updatedShipment = await this.shipmentRepository.updateCurrentStatus(
      normalizedCode,
      nextStatus,
    );

    await this.shipmentOutboxService.enqueueShipmentUpdated(updatedShipment, {
      source_event: eventType,
      payload: data,
    });

    return updatedShipment;
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
