import { Injectable } from '@nestjs/common';
import type {
  Policy as PrismaPolicyRecord,
  PolicyVersion as PrismaPolicyVersionRecord,
  Prisma,
} from '@prisma/client';

import {
  Policy,
  PolicyCreateInput,
  PolicyListQuery,
  PolicyStatus,
  PolicyUpdateInput,
  PolicyVersion,
} from '../../domain/entities/policy.entity';
import { PolicyRepository } from '../../domain/repositories/policy.repository';
import { PrismaService } from './prisma.service';

type PolicyWithVersions = PrismaPolicyRecord & {
  versions?: PrismaPolicyVersionRecord[];
};

@Injectable()
export class PolicyPrismaRepository extends PolicyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listPublic(category?: string): Promise<Policy[]> {
    const where: Prisma.PolicyWhereInput = {
      status: 'PUBLISHED',
    };

    if (category) {
      where.category = category as any;
    }

    const records = await this.prisma.policy.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return records.map((record) => this.toEntity(record));
  }

  async findPublicBySlug(slug: string): Promise<Policy | null> {
    const record = await this.prisma.policy.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: 'insensitive',
        },
        status: 'PUBLISHED',
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async listAdmin(query: PolicyListQuery = {}): Promise<{ items: Policy[]; total: number }> {
    const where: Prisma.PolicyWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.q && query.q.trim()) {
      const keyword = query.q.trim();
      where.OR = [
        {
          title: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          summary: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    const total = await this.prisma.policy.count({ where });

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const records = await this.prisma.policy.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { updatedAt: 'desc' }],
      skip,
      take: limit,
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    return {
      items: records.map((record) => this.toEntity(record)),
      total,
    };
  }

  async findById(id: string): Promise<Policy | null> {
    const record = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async findBySlug(slug: string): Promise<Policy | null> {
    const record = await this.prisma.policy.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: 'insensitive',
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    return record ? this.toEntity(record) : null;
  }

  async create(input: PolicyCreateInput, actorUsername?: string | null): Promise<Policy> {
    const slug = input.slug || this.generateSlug(input.title);
    const status = input.status || 'DRAFT';
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const record = await this.prisma.policy.create({
      data: {
        title: input.title.trim(),
        slug,
        category: input.category || 'GENERAL',
        summary: input.summary?.trim() || null,
        content: input.content,
        status,
        version: 1,
        displayOrder: input.displayOrder ?? 0,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        publishedAt,
        createdBy: actorUsername || null,
        updatedBy: actorUsername || null,
        versions: {
          create: {
            version: 1,
            title: input.title.trim(),
            category: input.category || 'GENERAL',
            summary: input.summary?.trim() || null,
            content: input.content,
            status,
            changeNote: 'Khởi tạo phiên bản đầu tiên',
            createdBy: actorUsername || null,
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    return this.toEntity(record);
  }

  async update(
    id: string,
    input: PolicyUpdateInput,
    actorUsername?: string | null,
  ): Promise<Policy> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Policy with id ${id} not found.`);
    }

    const isPublished = existing.status === 'PUBLISHED';
    const shouldCreateNewVersion = Boolean(input.createNewVersion ?? isPublished);
    const nextVersion = shouldCreateNewVersion ? existing.version + 1 : existing.version;

    const nextTitle = input.title !== undefined ? input.title.trim() : existing.title;
    const nextSlug = input.slug !== undefined ? input.slug.trim() : existing.slug;
    const nextCategory = input.category !== undefined ? input.category : existing.category;
    const nextSummary = input.summary !== undefined ? (input.summary?.trim() || null) : existing.summary;
    const nextContent = input.content !== undefined ? input.content : existing.content;
    const nextStatus = input.status !== undefined ? input.status : existing.status;
    const nextDisplayOrder = input.displayOrder !== undefined ? input.displayOrder : existing.displayOrder;
    const nextEffectiveDate =
      input.effectiveDate !== undefined
        ? input.effectiveDate
          ? new Date(input.effectiveDate)
          : null
        : existing.effectiveDate;
    const nextMetadata =
      input.metadata !== undefined
        ? (input.metadata as Prisma.InputJsonValue)
        : (existing.metadata as Prisma.InputJsonValue);

    const record = await this.prisma.$transaction(async (tx) => {
      if (shouldCreateNewVersion) {
        await tx.policyVersion.create({
          data: {
            policyId: id,
            version: nextVersion,
            title: nextTitle,
            category: nextCategory,
            summary: nextSummary,
            content: nextContent,
            status: nextStatus,
            changeNote: input.changeNote?.trim() || `Cập nhật phiên bản v${nextVersion}`,
            createdBy: actorUsername || null,
          },
        });
      }

      return tx.policy.update({
        where: { id },
        data: {
          title: nextTitle,
          slug: nextSlug,
          category: nextCategory,
          summary: nextSummary,
          content: nextContent,
          status: nextStatus,
          version: nextVersion,
          displayOrder: nextDisplayOrder,
          effectiveDate: nextEffectiveDate,
          metadata: nextMetadata,
          updatedBy: actorUsername || null,
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
          },
        },
      });
    });

    return this.toEntity(record);
  }

  async updateStatus(
    id: string,
    status: PolicyStatus,
    actorUsername?: string | null,
  ): Promise<Policy> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Policy with id ${id} not found.`);
    }

    const data: Prisma.PolicyUpdateInput = {
      status,
      updatedBy: actorUsername || null,
    };

    if (status === 'PUBLISHED' && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    const record = await this.prisma.policy.update({
      where: { id },
      data,
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    });

    return this.toEntity(record);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.policy.deleteMany({
      where: { id },
    });

    return result.count > 0;
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private toEntity(record: PolicyWithVersions): Policy {
    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      category: record.category as any,
      summary: record.summary,
      content: record.content,
      status: record.status as any,
      version: record.version,
      displayOrder: record.displayOrder,
      metadata: (record.metadata as Record<string, unknown>) || null,
      effectiveDate: record.effectiveDate,
      publishedAt: record.publishedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      versions: record.versions?.map((v) => this.toVersionEntity(v)),
    };
  }

  private toVersionEntity(record: PrismaPolicyVersionRecord): PolicyVersion {
    return {
      id: record.id,
      policyId: record.policyId,
      version: record.version,
      title: record.title,
      category: record.category as any,
      summary: record.summary,
      content: record.content,
      status: record.status as any,
      changeNote: record.changeNote,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
    };
  }
}
