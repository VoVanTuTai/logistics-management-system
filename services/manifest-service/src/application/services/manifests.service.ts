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
  Manifest,
  ReceiveManifestInput,
  RemoveShipmentsInput,
  SealManifestInput,
  UpdateManifestInput,
} from '../../domain/entities/manifest.entity';
import { ManifestRepository } from '../../domain/repositories/manifest.repository';
import { ManifestStateMachine } from '../../domain/state-machine/manifest-state-machine';
import { ManifestOutboxService } from '../../messaging/outbox/manifest-outbox.service';

@Injectable()
export class ManifestsService {
  constructor(
    @Inject(ManifestRepository)
    private readonly manifestRepository: ManifestRepository,
    private readonly manifestStateMachine: ManifestStateMachine,
    private readonly manifestOutboxService: ManifestOutboxService,
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

    await this.manifestOutboxService.enqueueManifestCreated(manifest);

    return manifest;
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

    if (hasMetadataMutation || changedShipmentCodes.length > 0) {
      await this.manifestOutboxService.enqueueManifestUpdated(
        manifest,
        {
          source: 'api',
          add_shipment_codes: addShipmentCodes,
          remove_shipment_codes: removeShipmentCodes,
          changed_shipment_codes: changedShipmentCodes,
        },
        changedShipmentCodes.length > 0 ? changedShipmentCodes : undefined,
      );
    }

    return manifest;
  }

  async addShipments(id: string, input: AddShipmentsInput): Promise<Manifest> {
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

    await this.manifestOutboxService.enqueueManifestUpdated(
      finalizedManifest,
      {
        source: 'api',
        action: 'add_shipments',
        add_shipment_codes: codesToAdd,
      },
      codesToAdd,
    );

    return finalizedManifest;
  }

  async removeShipments(
    id: string,
    input: RemoveShipmentsInput,
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

    await this.manifestOutboxService.enqueueManifestUpdated(
      finalizedManifest,
      {
        source: 'api',
        action: 'remove_shipments',
        remove_shipment_codes: codesToRemove,
      },
      codesToRemove,
    );

    return finalizedManifest;
  }

  async seal(id: string, input: SealManifestInput): Promise<Manifest> {
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

    if (manifest.items.length === 0) {
      throw new BadRequestException('Cannot seal manifest without shipments.');
    }

    const sealedManifest = await this.manifestRepository.seal(id, input);

    await this.manifestOutboxService.enqueueManifestSealed(sealedManifest);

    return sealedManifest;
  }

  async receive(id: string, input: ReceiveManifestInput): Promise<Manifest> {
    const manifest = await this.getById(id);

    if (!this.manifestStateMachine.canReceive(manifest.status)) {
      throw new BadRequestException(
        `Manifest "${manifest.manifestCode}" is ${manifest.status} and cannot be received.`,
      );
    }

    const receivedManifest = await this.manifestRepository.receive(id, input);

    await this.manifestOutboxService.enqueueManifestReceived(receivedManifest);

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
}
