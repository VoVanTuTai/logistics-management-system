import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma as PrismaNamespace } from '@prisma/client';
import type {
  Prisma,
  Shipment as PrismaShipmentRecord,
  ShipmentCurrentStatus as PrismaShipmentCurrentStatus,
} from '@prisma/client';

import type {
  CreateShipmentInput,
  JsonValue,
  Shipment,
  ShipmentListFilters,
  ShipmentListPage,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';
import type { ShipmentCurrentStatus } from '../../domain/entities/shipment-status.entity';
import { ShipmentRepository } from '../../domain/repositories/shipment.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class ShipmentPrismaRepository extends ShipmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filters: ShipmentListFilters): Promise<Shipment[]> {
    const where = this.buildWhere(filters);

    const records = await this.prisma.shipment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.toEntity(record));
  }

  async listPage(filters: ShipmentListFilters): Promise<ShipmentListPage> {
    const where = this.buildWhere(filters);
    const limit = normalizePaginationNumber(filters.limit, 20, 1, 100);
    const offset = normalizePaginationNumber(filters.offset, 0, 0, 1_000_000);
    const [records, total] = await this.prisma.$transaction([
      this.prisma.shipment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      items: records.map((record) => this.toEntity(record)),
      pageInfo: {
        hasNextPage: offset + records.length < total,
        total,
      },
    };
  }

  async findByCode(code: string): Promise<Shipment | null> {
    const record = await this.prisma.shipment.findUnique({
      where: { code },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: CreateShipmentInput): Promise<Shipment> {
    if (!input.code) {
      throw new Error(
        'Shipment code must be generated or provided before persistence.',
      );
    }

    const data: Prisma.ShipmentCreateInput = {
      code: input.code,
      metadata: (input.metadata ?? null) as unknown as Prisma.InputJsonValue,
      currentStatus: 'CREATED',
    };

    try {
      const record = await this.prisma.shipment.create({ data });

      return this.toEntity(record);
    } catch (error) {
      if (
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Shipment code "${input.code}" already exists.`,
        );
      }

      throw error;
    }
  }

  async update(code: string, input: UpdateShipmentInput): Promise<Shipment> {
    const data: Prisma.ShipmentUpdateInput = {
      currentStatus: 'UPDATED',
    };

    if (input.metadata !== undefined) {
      data.metadata = input.metadata as unknown as Prisma.InputJsonValue;
    }

    const record = await this.prisma.shipment.update({
      where: { code },
      data,
    });

    return this.toEntity(record);
  }

  async updateMetadataAndLock(
    code: string,
    metadata: JsonValue | null | undefined,
    isLocked: boolean,
  ): Promise<Shipment> {
    const record = await this.prisma.shipment.update({
      where: { code },
      data: {
        metadata: (metadata ?? null) as unknown as Prisma.InputJsonValue,
        isLocked,
      },
    });

    return this.toEntity(record);
  }

  async updateCurrentStatus(
    code: string,
    currentStatus: ShipmentCurrentStatus,
  ): Promise<Shipment> {
    const record = await this.prisma.shipment.update({
      where: { code },
      data: {
        currentStatus: currentStatus as PrismaShipmentCurrentStatus,
      },
    });

    return this.toEntity(record);
  }

  async updateCurrentStatusAndLock(
    code: string,
    currentStatus: ShipmentCurrentStatus,
    isLocked: boolean,
  ): Promise<Shipment> {
    const record = await this.prisma.shipment.update({
      where: { code },
      data: {
        currentStatus: currentStatus as PrismaShipmentCurrentStatus,
        isLocked,
      },
    });

    return this.toEntity(record);
  }

  async updateCurrentStatusMetadataAndLock(
    code: string,
    currentStatus: ShipmentCurrentStatus,
    metadata: JsonValue | null | undefined,
    isLocked: boolean,
  ): Promise<Shipment> {
    const record = await this.prisma.shipment.update({
      where: { code },
      data: {
        currentStatus: currentStatus as PrismaShipmentCurrentStatus,
        metadata: (metadata ?? null) as unknown as Prisma.InputJsonValue,
        isLocked,
      },
    });

    return this.toEntity(record);
  }

  async cancel(code: string, reason: string | null): Promise<Shipment> {
    const record = await this.prisma.shipment.update({
      where: { code },
      data: {
        currentStatus: 'CANCELLED',
        cancellationReason: reason,
      },
    });

    return this.toEntity(record);
  }

  private toEntity(record: PrismaShipmentRecord): Shipment {
    return {
      id: record.id,
      code: record.code,
      currentStatus: record.currentStatus as ShipmentCurrentStatus,
      isLocked: record.isLocked,
      metadata: record.metadata as JsonValue | null,
      cancellationReason: record.cancellationReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private buildWhere(filters: ShipmentListFilters): Prisma.ShipmentWhereInput {
    const where: Prisma.ShipmentWhereInput = {};
    const andFilters: Prisma.ShipmentWhereInput[] = [];
    const status = normalizeString(filters.status);
    const keyword = normalizeString(filters.shipmentCode) ?? normalizeString(filters.q);
    const shipmentCodes = normalizeStringList(filters.shipmentCodes);
    const hubCodes = normalizeStringList(filters.hubCodes);
    const createdFrom = normalizeDate(filters.createdFrom);
    const createdTo = normalizeDate(filters.createdTo);

    if (status) {
      where.currentStatus = status as PrismaShipmentCurrentStatus;
    }

    if (shipmentCodes.length > 0) {
      andFilters.push({
        code: {
          in: shipmentCodes,
        },
      });
    } else if (keyword) {
      andFilters.push({
        code: {
          contains: keyword,
          mode: 'insensitive',
        },
      });
    }

    if (createdFrom || createdTo) {
      andFilters.push({
        createdAt: {
          ...(createdFrom ? { gte: createdFrom } : {}),
          ...(createdTo ? { lt: createdTo } : {}),
        },
      });
    }

    if (hubCodes.length > 0) {
      const hubJsonPaths = [
        ['sender', 'hubCode'],
        ['receiver', 'hubCode'],
        ['routing', 'originHubCode'],
        ['routing', 'destinationHubCode'],
        ['senderHubCode'],
        ['receiverHubCode'],
        ['originHubCode'],
        ['destinationHubCode'],
      ];

      andFilters.push({
        OR: hubCodes.flatMap((hubCode) =>
          hubJsonPaths.map((path) => ({
            metadata: {
              path,
              equals: hubCode,
            },
          })),
        ),
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    return where;
  }
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStringList(value: string | string[] | null | undefined): string[] {
  const source = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];

  return Array.from(
    new Set(
      source
        .map((item) => item.trim().toUpperCase())
        .filter((item) => item.length > 0),
    ),
  );
}

function normalizeDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizePaginationNumber(
  value: string | number | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}
