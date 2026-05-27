import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  AddShipmentsInput,
  CreateManifestInput,
  GenerateBagCodesInput,
  Manifest,
  ReceiveManifestInput,
  RemoveShipmentsInput,
  SealManifestInput,
  UpdateManifestInput,
} from '../../domain/entities/manifest.entity';
import { ManifestRepository } from '../../domain/repositories/manifest.repository';
import { ManifestStateMachine } from '../../domain/state-machine/manifest-state-machine';
import { ManifestOutboxService } from '../../messaging/outbox/manifest-outbox.service';
import {
  OpsAuditService,
  type OpsAuditContext,
} from './ops-audit.service';

@Injectable()
export class ManifestsService {
  constructor(
    @Inject(ManifestRepository)
    private readonly manifestRepository: ManifestRepository,
    private readonly manifestStateMachine: ManifestStateMachine,
    private readonly manifestOutboxService: ManifestOutboxService,
    private readonly opsAuditService: OpsAuditService,
  ) {}

  list(): Promise<Manifest[]> {
    return this.manifestRepository.list();
  }

  async getById(id: string): Promise<Manifest> {
    const manifest = await this.manifestRepository.findById(id);

    if (!manifest) {
      throw new NotFoundException(`Manifest "${id}" was not found.`);
    }

    return manifest;
  }

  async getByManifestCode(manifestCodeInput: string): Promise<Manifest> {
    const manifestCode = this.normalizeManifestCode(manifestCodeInput);
    const manifest = await this.manifestRepository.findByManifestCode(manifestCode);

    if (!manifest) {
      throw new NotFoundException(`Manifest "${manifestCode}" was not found.`);
    }

    return manifest;
  }

  async create(input: CreateManifestInput): Promise<Manifest> {
    const manifestCode = this.normalizeManifestCode(input.manifestCode);
    const shipmentCodes = this.normalizeShipmentCodes(input.shipmentCodes);

    if (!manifestCode) {
      throw new BadRequestException('manifestCode is required.');
    }

    await this.ensureShipmentCodesAssignable(shipmentCodes);

    const manifest = await this.manifestRepository.create({
      ...input,
      manifestCode,
      shipmentCodes,
    });

    return manifest;
  }

  async generateBagCodes(input: GenerateBagCodesInput): Promise<Manifest[]> {
    const destinationHubCode = this.normalizeHubCode(input.destinationHubCode);
    const originHubCode = this.normalizeHubCode(input.originHubCode);
    const quantity = this.normalizeQuantity(input.quantity);

    if (!destinationHubCode) {
      throw new BadRequestException('destinationHubCode is required.');
    }

    if (quantity < 1 || quantity > 200) {
      throw new BadRequestException('quantity must be between 1 and 200.');
    }

    if (originHubCode && originHubCode === destinationHubCode) {
      throw new BadRequestException(
        'originHubCode must be different from destinationHubCode.',
      );
    }

    const createdBags: Manifest[] = [];
    const generatedCodes = new Set<string>();
    const prefix = this.buildBagCodePrefix(originHubCode, destinationHubCode);
    const note = input.note?.trim() || 'EMPTY_BAG';

    for (let index = 0; index < quantity; index += 1) {
      const manifestCode = this.generateBagCode(prefix, index + 1, generatedCodes);
      const manifest = await this.manifestRepository.create({
        manifestCode,
        originHubCode: originHubCode || null,
        destinationHubCode,
        note,
        shipmentCodes: [],
      });
      createdBags.push(manifest);
    }

    return createdBags;
  }

  async update(id: string, input: UpdateManifestInput): Promise<Manifest> {
    const currentManifest = await this.getById(id);
    let manifest = currentManifest;

    const addShipmentCodes = this.normalizeShipmentCodes(input.addShipmentCodes);
    const removeShipmentCodes = this.normalizeShipmentCodes(
      input.removeShipmentCodes,
    );
    const hasShipmentMutation =
      addShipmentCodes.length > 0 || removeShipmentCodes.length > 0;
    const hasMetadataMutation =
      input.originHubCode !== undefined ||
      input.destinationHubCode !== undefined ||
      input.note !== undefined;

    if (hasShipmentMutation && !this.manifestStateMachine.canEdit(manifest.status)) {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" is ${manifest.status} and cannot change shipments.`,
      );
    }

    const changedShipmentCodes: string[] = [];

    if (hasMetadataMutation) {
      manifest = await this.manifestRepository.update(id, {
        originHubCode: input.originHubCode,
        destinationHubCode: input.destinationHubCode,
        note: input.note,
      });
    }

    if (addShipmentCodes.length > 0) {
      const existingCodes = new Set(manifest.items.map((item) => item.shipmentCode));
      const codesToAdd = addShipmentCodes.filter((code) => !existingCodes.has(code));

      if (codesToAdd.length > 0) {
        await this.ensureShipmentCodesAssignable(codesToAdd, id);
        manifest = await this.manifestRepository.addShipments(id, codesToAdd);
        changedShipmentCodes.push(...codesToAdd);
      } else if (!hasMetadataMutation && removeShipmentCodes.length === 0) {
        throw new BadRequestException('All provided shipment codes already exist in manifest.');
      }
    }

    if (removeShipmentCodes.length > 0) {
      const existingCodes = new Set(manifest.items.map((item) => item.shipmentCode));
      const codesToRemove = removeShipmentCodes.filter((code) =>
        existingCodes.has(code),
      );

      if (codesToRemove.length > 0) {
        manifest = await this.manifestRepository.removeShipments(id, codesToRemove);
        changedShipmentCodes.push(...codesToRemove);
      } else if (!hasMetadataMutation && addShipmentCodes.length === 0) {
        throw new BadRequestException(
          'None of the provided shipment codes exists in manifest.',
        );
      }
    }

    return manifest;
  }

  async delete(id: string): Promise<Manifest> {
    const manifest = await this.getById(id);

    if (manifest.status !== 'CREATED') {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" is ${manifest.status} and cannot be deleted.`,
      );
    }

    if (manifest.items.length > 0) {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" has shipments and cannot be deleted.`,
      );
    }

    return this.manifestRepository.delete(id);
  }

  async addShipments(
    id: string,
    input: AddShipmentsInput,
    auditContext?: OpsAuditContext,
  ): Promise<Manifest> {
    const manifest = await this.getById(id);

    if (!this.manifestStateMachine.canEdit(manifest.status)) {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" is ${manifest.status} and cannot change shipments.`,
      );
    }

    const shipmentCodes = this.normalizeShipmentCodes(input.shipmentCodes);
    if (shipmentCodes.length === 0) {
      throw new BadRequestException('shipmentCodes must include at least one code.');
    }

    const existingCodes = new Set(manifest.items.map((item) => item.shipmentCode));
    const codesToAdd = shipmentCodes.filter((code) => !existingCodes.has(code));
    if (codesToAdd.length === 0) {
      throw new BadRequestException('All provided shipment codes already exist in manifest.');
    }

    await this.ensureShipmentCodesAssignable(codesToAdd, id);

    const updatedManifest = await this.manifestRepository.addShipments(id, codesToAdd);
    const finalizedManifest =
      input.note !== undefined
        ? await this.manifestRepository.update(id, { note: input.note })
        : updatedManifest;

    await this.opsAuditService.record({
      context: auditContext,
      action: 'MANIFEST_SHIPMENTS_ADDED',
      targetType: 'MANIFEST',
      targetId: manifest.id,
      before: manifest,
      after: finalizedManifest,
    });

    return finalizedManifest;
  }

  async removeShipments(
    id: string,
    input: RemoveShipmentsInput,
    auditContext?: OpsAuditContext,
  ): Promise<Manifest> {
    const manifest = await this.getById(id);

    if (!this.manifestStateMachine.canRemoveShipments(manifest.status)) {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" is ${manifest.status} and cannot change shipments.`,
      );
    }

    const shipmentCodes = this.normalizeShipmentCodes(input.shipmentCodes);
    if (shipmentCodes.length === 0) {
      throw new BadRequestException('shipmentCodes must include at least one code.');
    }

    const existingCodes = new Set(manifest.items.map((item) => item.shipmentCode));
    const codesToRemove = shipmentCodes.filter((code) => existingCodes.has(code));
    if (codesToRemove.length === 0) {
      throw new BadRequestException(
        'None of the provided shipment codes exists in manifest.',
      );
    }

    const updatedManifest = await this.manifestRepository.removeShipments(
      id,
      codesToRemove,
    );
    const finalizedManifest =
      input.note !== undefined
        ? await this.manifestRepository.update(id, { note: input.note })
        : updatedManifest;

    if (this.shouldPublishManifestUnsealed(manifest.status, input)) {
      await this.manifestOutboxService.enqueueManifestUnsealed(
        finalizedManifest,
        codesToRemove,
        {
          unsealedBy: this.normalizeOptionalText(input.unsealedBy),
          unsealedByName: this.normalizeOptionalText(input.unsealedByName),
          processingHubCode: this.normalizeHubCode(input.processingHubCode),
          note: this.normalizeOptionalText(input.note),
        },
      );
    }

    await this.opsAuditService.record({
      context: auditContext,
      action: 'MANIFEST_SHIPMENTS_REMOVED',
      targetType: 'MANIFEST',
      targetId: manifest.id,
      before: manifest,
      after: finalizedManifest,
    });

    return finalizedManifest;
  }

  async seal(
    id: string,
    input: SealManifestInput,
    auditContext?: OpsAuditContext,
  ): Promise<Manifest> {
    const manifest = await this.getById(id);

    if (!this.manifestStateMachine.canSeal(manifest.status)) {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" is ${manifest.status} and cannot be sealed.`,
      );
    }

    if (!manifest.originHubCode || !manifest.destinationHubCode) {
      throw new BadRequestException(
        'originHubCode and destinationHubCode are required before sealing.',
      );
    }

    if (manifest.originHubCode === manifest.destinationHubCode) {
      throw new BadRequestException(
        'originHubCode must be different from destinationHubCode.',
      );
    }

    // Removed validation to allow sealing empty linehaul vehicle manifests

    for (const item of manifest.items) {
      await this.assertShipmentNotLocked(item.shipmentCode);
    }

    const sealedManifest = await this.manifestRepository.seal(id, input);

    await this.manifestOutboxService.enqueueManifestSealed(sealedManifest, {
      sealedBy: input.sealedBy,
      sealedByName: input.sealedByName,
      processingHubCode: input.processingHubCode,
      note: input.note,
    });

    await this.opsAuditService.record({
      context: auditContext,
      action: 'MANIFEST_SEALED',
      targetType: 'MANIFEST',
      targetId: manifest.id,
      before: manifest,
      after: sealedManifest,
    });

    return sealedManifest;
  }

  async receive(
    id: string,
    input: ReceiveManifestInput,
    auditContext?: OpsAuditContext,
  ): Promise<Manifest> {
    const manifest = await this.getById(id);

    if (!this.manifestStateMachine.canReceive(manifest.status)) {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" is ${manifest.status} and cannot be received.`,
      );
    }

    const receivedManifest = await this.manifestRepository.receive(id, input);

    await this.manifestOutboxService.enqueueManifestReceived(receivedManifest);

    await this.opsAuditService.record({
      context: auditContext,
      action: 'MANIFEST_RECEIVED',
      targetType: 'MANIFEST',
      targetId: manifest.id,
      before: manifest,
      after: receivedManifest,
    });

    return receivedManifest;
  }

  async handleScanOutbound(payload: {
    shipment_code?: string | null;
    data?: Record<string, unknown>;
  }): Promise<Manifest | null> {
    if (!payload.shipment_code) {
      return null;
    }

    const manifest = await this.manifestRepository.findByShipmentCode(
      payload.shipment_code,
    );

    if (!manifest) {
      return null;
    }

    return manifest;
  }

  private normalizeManifestCode(manifestCode: string | undefined): string {
    return manifestCode?.trim() ?? '';
  }

  private normalizeHubCode(hubCode: string | null | undefined): string {
    return hubCode?.trim().toUpperCase() ?? '';
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const normalizedValue = value?.trim() ?? '';
    return normalizedValue.length > 0 ? normalizedValue : null;
  }

  private shouldPublishManifestUnsealed(
    manifestStatus: Manifest['status'],
    input: RemoveShipmentsInput,
  ): boolean {
    if (manifestStatus !== 'CREATED') {
      return true;
    }

    return Boolean(
      this.normalizeOptionalText(input.unsealedBy) ||
        this.normalizeOptionalText(input.unsealedByName) ||
        this.normalizeOptionalText(input.processingHubCode) ||
        input.note?.includes('UNBAGGED'),
    );
  }

  private normalizeQuantity(quantity: number | string | undefined): number {
    const parsed =
      typeof quantity === 'number'
        ? quantity
        : Number.parseInt(String(quantity ?? ''), 10);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getHubTriplet(hubCode: string): string {
    const digits = (hubCode.match(/\d/g) ?? []).join('');
    if (digits.length >= 3) {
      return digits.slice(0, 3);
    }
    return digits.padStart(3, '0');
  }

  private buildBagCodePrefix(
    originHubCode: string,
    destinationHubCode: string,
  ): string {
    const hubTriplet = this.getHubTriplet(destinationHubCode || originHubCode);
    const batchTimestamp = Date.now().toString();
    const timePart = batchTimestamp.slice(-4).padStart(4, '0');
    return `MB${hubTriplet}${timePart}`;
  }

  private generateBagCode(
    prefix: string,
    sequence: number,
    generatedCodes: Set<string>,
  ): string {
    const seq = String(sequence).padStart(3, '0');
    const code = `${prefix}${seq}`;
    if (!generatedCodes.has(code)) {
      generatedCodes.add(code);
      return code;
    }

    const fallbackCode = `${prefix}${String(Math.floor(Math.random() * 900 + 100))}`;
    generatedCodes.add(fallbackCode);
    return fallbackCode;
  }

  private normalizeShipmentCodes(shipmentCodes: string[] | undefined): string[] {
    if (!shipmentCodes?.length) {
      return [];
    }

    return Array.from(
      new Set(
        shipmentCodes
          .map((shipmentCode) => shipmentCode?.trim())
          .filter((shipmentCode): shipmentCode is string => Boolean(shipmentCode)),
      ),
    );
  }

  private async ensureShipmentCodesAssignable(
    shipmentCodes: string[],
    excludeManifestId?: string,
  ): Promise<void> {
    for (const shipmentCode of shipmentCodes) {
      await this.assertShipmentNotLocked(shipmentCode);

      const activeManifest = await this.manifestRepository.findActiveByShipmentCode(
        shipmentCode,
        excludeManifestId,
      );

      if (activeManifest) {
        throw new ConflictException(
          `Shipment "${shipmentCode}" already belongs to active manifest "${activeManifest.manifestCode}".`,
        );
      }
    }
  }

  private async assertShipmentNotLocked(shipmentCode: string): Promise<void> {
    const shipmentServiceUrl =
      process.env.SHIPMENT_SERVICE_URL ?? 'http://localhost:3002';
    const response = await fetch(
      `${shipmentServiceUrl}/shipments/${encodeURIComponent(shipmentCode)}`,
    );

    if (!response.ok) {
      return;
    }

    const shipment = (await response.json()) as {
      isLocked?: boolean;
      currentStatus?: string;
    };

    if (shipment.isLocked) {
      throw new BadRequestException(
        `Block: Shipment "${shipmentCode}" is locked by issue workflow (${shipment.currentStatus ?? 'UNKNOWN'}).`,
      );
    }
  }
}
