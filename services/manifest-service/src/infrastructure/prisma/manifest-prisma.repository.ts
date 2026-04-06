import { Injectable } from '@nestjs/common';
import type {
  Manifest as PrismaManifestRecord,
  ManifestItem as PrismaManifestItemRecord,
  Prisma,
  ReceiveRecord as PrismaReceiveRecord,
  SealRecord as PrismaSealRecord,
} from '@prisma/client';

import type {
  CreateManifestInput,
  Manifest,
  ManifestItem,
  ReceiveManifestInput,
  ReceiveRecord,
  SealManifestInput,
  SealRecord,
  UpdateManifestInput,
} from '../../domain/entities/manifest.entity';
import { ManifestRepository } from '../../domain/repositories/manifest.repository';
import { PrismaService } from './prisma.service';

type ManifestRecordWithRelations = PrismaManifestRecord & {
  items: PrismaManifestItemRecord[];
  sealRecord: PrismaSealRecord | null;
  receiveRecord: PrismaReceiveRecord | null;
};

@Injectable()
export class ManifestPrismaRepository extends ManifestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(): Promise<Manifest[]> {
    const records = await this.prisma.manifest.findMany({
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async findById(id: string): Promise<Manifest | null> {
    const record = await this.prisma.manifest.findUnique({
      where: { id },
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async findByShipmentCode(shipmentCode: string): Promise<Manifest | null> {
    const record = await this.prisma.manifest.findFirst({
      where: {
        items: {
          some: {
            shipmentCode,
          },
        },
      },
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async findActiveByShipmentCode(
    shipmentCode: string,
    excludeManifestId?: string,
  ): Promise<Manifest | null> {
    const record = await this.prisma.manifest.findFirst({
      where: {
        ...(excludeManifestId
          ? {
              id: {
                not: excludeManifestId,
              },
            }
          : {}),
        status: {
          in: ['CREATED', 'SEALED'],
        },
        items: {
          some: {
            shipmentCode,
          },
        },
      },
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateManifestInput): Promise<Manifest> {
    const shipmentCodes = this.normalizeShipmentCodes(input.shipmentCodes);

    const data: Prisma.ManifestCreateInput = {
      manifestCode: input.manifestCode,
      originHubCode: input.originHubCode ?? null,
      destinationHubCode: input.destinationHubCode ?? null,
      note: input.note ?? null,
      items: {
        create: shipmentCodes.map((shipmentCode) => ({
          shipmentCode,
        })),
      },
    };

    const record = await this.prisma.manifest.create({
      data,
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
    });

    return this.toEntity(record);
  }

  async update(id: string, input: UpdateManifestInput): Promise<Manifest> {
    const data: Prisma.ManifestUpdateInput = {};

    if (input.originHubCode !== undefined) {
      data.originHubCode = input.originHubCode;
    }

    if (input.destinationHubCode !== undefined) {
      data.destinationHubCode = input.destinationHubCode;
    }

    if (input.note !== undefined) {
      data.note = input.note;
    }

    const addShipmentCodes = this.normalizeShipmentCodes(input.addShipmentCodes);
    if (addShipmentCodes.length) {
      data.items = {
        ...(data.items ?? {}),
        create: addShipmentCodes.map((shipmentCode) => ({
          shipmentCode,
        })),
      };
    }

    const removeShipmentCodes = this.normalizeShipmentCodes(
      input.removeShipmentCodes,
    );
    if (removeShipmentCodes.length) {
      data.items = {
        ...(data.items ?? {}),
        deleteMany: {
          shipmentCode: {
            in: removeShipmentCodes,
          },
        },
      };
    }

    const record = await this.prisma.manifest.update({
      where: { id },
      data,
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
    });

    return this.toEntity(record);
  }

  async delete(id: string): Promise<Manifest> {
    const record = await this.prisma.$transaction(async (tx) => {
      const manifest = await tx.manifest.findUnique({
        where: { id },
        include: {
          items: true,
          sealRecord: true,
          receiveRecord: true,
        },
      });

      if (!manifest) {
        throw new Error(`Manifest "${id}" was not found.`);
      }

      await tx.manifestItem.deleteMany({
        where: { manifestId: id },
      });

      await tx.sealRecord.deleteMany({
        where: { manifestId: id },
      });

      await tx.receiveRecord.deleteMany({
        where: { manifestId: id },
      });

      await tx.manifest.delete({
        where: { id },
      });

      return manifest;
    });

    return this.toEntity(record);
  }

  async addShipments(id: string, shipmentCodes: string[]): Promise<Manifest> {
    const uniqueCodes = this.normalizeShipmentCodes(shipmentCodes);
    if (uniqueCodes.length === 0) {
      const manifest = await this.findById(id);
      if (!manifest) {
        throw new Error(`Manifest "${id}" was not found.`);
      }

      return manifest;
    }

    const record = await this.prisma.$transaction(async (tx) => {
      const manifest = await tx.manifest.findUnique({
        where: { id },
        include: {
          items: true,
          sealRecord: true,
          receiveRecord: true,
        },
      });

      if (!manifest) {
        throw new Error(`Manifest "${id}" was not found.`);
      }

      const existingCodes = new Set(
        manifest.items.map((item) => item.shipmentCode),
      );
      const codesToCreate = uniqueCodes.filter((code) => !existingCodes.has(code));

      if (codesToCreate.length > 0) {
        await tx.manifestItem.createMany({
          data: codesToCreate.map((shipmentCode) => ({
            manifestId: id,
            shipmentCode,
          })),
        });
      }

      const refreshed = await tx.manifest.findUnique({
        where: { id },
        include: {
          items: true,
          sealRecord: true,
          receiveRecord: true,
        },
      });

      if (!refreshed) {
        throw new Error(`Manifest "${id}" was not found.`);
      }

      return refreshed;
    });

    return this.toEntity(record);
  }

  async removeShipments(id: string, shipmentCodes: string[]): Promise<Manifest> {
    const uniqueCodes = this.normalizeShipmentCodes(shipmentCodes);
    if (uniqueCodes.length === 0) {
      const manifest = await this.findById(id);
      if (!manifest) {
        throw new Error(`Manifest "${id}" was not found.`);
      }

      return manifest;
    }

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.manifestItem.deleteMany({
        where: {
          manifestId: id,
          shipmentCode: {
            in: uniqueCodes,
          },
        },
      });

      const refreshed = await tx.manifest.findUnique({
        where: { id },
        include: {
          items: true,
          sealRecord: true,
          receiveRecord: true,
        },
      });

      if (!refreshed) {
        throw new Error(`Manifest "${id}" was not found.`);
      }

      return refreshed;
    });

    return this.toEntity(record);
  }

  async seal(id: string, input: SealManifestInput): Promise<Manifest> {
    const record = await this.prisma.manifest.update({
      where: { id },
      data: {
        status: 'SEALED',
        sealedAt: new Date(),
        sealRecord: {
          upsert: {
            update: {
              sealedBy: input.sealedBy ?? null,
              note: input.note ?? null,
              sealedAt: new Date(),
            },
            create: {
              sealedBy: input.sealedBy ?? null,
              note: input.note ?? null,
              sealedAt: new Date(),
            },
          },
        },
      },
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
    });

    return this.toEntity(record);
  }

  async receive(id: string, input: ReceiveManifestInput): Promise<Manifest> {
    const record = await this.prisma.manifest.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        receivedAt: new Date(),
        receiveRecord: {
          upsert: {
            update: {
              receivedBy: input.receivedBy ?? null,
              note: input.note ?? null,
              receivedAt: new Date(),
            },
            create: {
              receivedBy: input.receivedBy ?? null,
              note: input.note ?? null,
              receivedAt: new Date(),
            },
          },
        },
      },
      include: {
        items: true,
        sealRecord: true,
        receiveRecord: true,
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: ManifestRecordWithRelations): Manifest {
    return {
      id: record.id,
      manifestCode: record.manifestCode,
      status: record.status,
      originHubCode: record.originHubCode,
      destinationHubCode: record.destinationHubCode,
      note: record.note,
      sealedAt: record.sealedAt,
      receivedAt: record.receivedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items.map((item) => this.toItemEntity(item)),
      sealRecord: record.sealRecord ? this.toSealRecordEntity(record.sealRecord) : null,
      receiveRecord: record.receiveRecord
        ? this.toReceiveRecordEntity(record.receiveRecord)
        : null,
    };
  }

  private normalizeShipmentCodes(
    shipmentCodes: string[] | undefined,
  ): string[] {
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

  private toItemEntity(record: PrismaManifestItemRecord): ManifestItem {
    return {
      id: record.id,
      manifestId: record.manifestId,
      shipmentCode: record.shipmentCode,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toSealRecordEntity(record: PrismaSealRecord): SealRecord {
    return {
      id: record.id,
      manifestId: record.manifestId,
      sealedBy: record.sealedBy,
      note: record.note,
      sealedAt: record.sealedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toReceiveRecordEntity(record: PrismaReceiveRecord): ReceiveRecord {
    return {
      id: record.id,
      manifestId: record.manifestId,
      receivedBy: record.receivedBy,
      note: record.note,
      receivedAt: record.receivedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
