import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Policy,
  PolicyAdminView,
  PolicyCategory,
  PolicyCreateInput,
  PolicyListQuery,
  PolicyPublicView,
  PolicyStatus,
  PolicyUpdateInput,
} from '../../domain/entities/policy.entity';
import { PolicyRepository } from '../../domain/repositories/policy.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  AdminAuditService,
  type AdminAuditContext,
} from './admin-audit.service';

const ALLOWED_CATEGORIES: PolicyCategory[] = [
  'GENERAL',
  'SHIPMENT',
  'DELIVERY',
  'PROHIBITED_GOODS',
  'COMPENSATION',
  'RETURN',
  'CUSTOMER_RESPONSIBILITY',
  'COMPANY_RESPONSIBILITY',
];

const ALLOWED_STATUSES: PolicyStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

@Injectable()
export class PoliciesService {
  constructor(
    @Inject(PolicyRepository)
    private readonly policyRepository: PolicyRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  // ==========================================
  // 1. PUBLIC API (Customer-facing)
  // ==========================================
  async listPublic(category?: string): Promise<PolicyPublicView[]> {
    const normalizedCategory = category ? this.normalizeCategory(category) : undefined;
    const policies = await this.policyRepository.listPublic(normalizedCategory);
    return policies.map((p) => this.toPublicView(p));
  }

  async getPublicBySlug(slug: string): Promise<PolicyPublicView> {
    const normalizedSlug = slug.trim().toLowerCase();
    const policy = await this.policyRepository.findPublicBySlug(normalizedSlug);

    if (!policy) {
      throw new NotFoundException(`Policy "${slug}" was not found.`);
    }

    return this.toPublicView(policy);
  }

  // ==========================================
  // 2. ADMIN API (CRUD & Lifecycle)
  // ==========================================
  async listAdmin(query: PolicyListQuery = {}): Promise<{ items: PolicyAdminView[]; total: number }> {
    const result = await this.policyRepository.listAdmin(query);
    return {
      items: result.items.map((p) => this.toAdminView(p)),
      total: result.total,
    };
  }

  async getAdminById(id: string): Promise<PolicyAdminView> {
    const policy = await this.policyRepository.findById(id);

    if (!policy) {
      throw new NotFoundException(`Policy "${id}" was not found.`);
    }

    return this.toAdminView(policy);
  }

  async create(
    input: PolicyCreateInput,
    auditContext?: AdminAuditContext,
  ): Promise<PolicyAdminView> {
    const normalizedInput = this.validateAndNormalizeCreateInput(input);

    const existingSlug = await this.policyRepository.findBySlug(normalizedInput.slug!);
    if (existingSlug) {
      throw new ConflictException(
        `Đường dẫn (slug) "${normalizedInput.slug}" đã tồn tại. Vui lòng chọn tiêu đề hoặc slug khác.`,
      );
    }

    const actorUsername = auditContext?.actorUsername || 'SYSTEM_ADMIN';
    const policy = await this.policyRepository.create(normalizedInput, actorUsername);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'policy',
      policy.id,
      {
        action: 'created',
        entity: 'policy',
        record: this.toPublicView(policy),
      },
    );

    await this.adminAuditService.record({
      context: auditContext,
      action: 'POLICY_CREATED',
      targetType: 'POLICY',
      targetId: policy.id,
      before: null,
      after: policy,
    });

    return this.toAdminView(policy);
  }

  async update(
    id: string,
    input: PolicyUpdateInput,
    auditContext?: AdminAuditContext,
  ): Promise<PolicyAdminView> {
    const current = await this.policyRepository.findById(id);
    if (!current) {
      throw new NotFoundException(`Policy "${id}" was not found.`);
    }

    const normalizedInput = this.validateAndNormalizeUpdateInput(input, current);

    if (normalizedInput.slug && normalizedInput.slug !== current.slug) {
      const existingSlug = await this.policyRepository.findBySlug(normalizedInput.slug);
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(
          `Đường dẫn (slug) "${normalizedInput.slug}" đã tồn tại. Vui lòng chọn slug khác.`,
        );
      }
    }

    const actorUsername = auditContext?.actorUsername || 'SYSTEM_ADMIN';
    const updated = await this.policyRepository.update(id, normalizedInput, actorUsername);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'policy',
      updated.id,
      {
        action: 'updated',
        entity: 'policy',
        record: this.toPublicView(updated),
      },
    );

    await this.adminAuditService.record({
      context: auditContext,
      action: 'POLICY_UPDATED',
      targetType: 'POLICY',
      targetId: updated.id,
      before: current,
      after: updated,
    });

    return this.toAdminView(updated);
  }

  async publish(
    id: string,
    auditContext?: AdminAuditContext,
  ): Promise<PolicyAdminView> {
    const current = await this.policyRepository.findById(id);
    if (!current) {
      throw new NotFoundException(`Policy "${id}" was not found.`);
    }

    if (current.status === 'PUBLISHED') {
      return this.toAdminView(current);
    }

    const actorUsername = auditContext?.actorUsername || 'SYSTEM_ADMIN';
    const updated = await this.policyRepository.updateStatus(id, 'PUBLISHED', actorUsername);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'policy',
      updated.id,
      {
        action: 'published',
        entity: 'policy',
        record: this.toPublicView(updated),
      },
    );

    await this.adminAuditService.record({
      context: auditContext,
      action: 'POLICY_PUBLISHED',
      targetType: 'POLICY',
      targetId: updated.id,
      before: current,
      after: updated,
    });

    return this.toAdminView(updated);
  }

  async archive(
    id: string,
    auditContext?: AdminAuditContext,
  ): Promise<PolicyAdminView> {
    const current = await this.policyRepository.findById(id);
    if (!current) {
      throw new NotFoundException(`Policy "${id}" was not found.`);
    }

    if (current.status === 'ARCHIVED') {
      return this.toAdminView(current);
    }

    const actorUsername = auditContext?.actorUsername || 'SYSTEM_ADMIN';
    const updated = await this.policyRepository.updateStatus(id, 'ARCHIVED', actorUsername);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'policy',
      updated.id,
      {
        action: 'archived',
        entity: 'policy',
        record: this.toPublicView(updated),
      },
    );

    await this.adminAuditService.record({
      context: auditContext,
      action: 'POLICY_ARCHIVED',
      targetType: 'POLICY',
      targetId: updated.id,
      before: current,
      after: updated,
    });

    return this.toAdminView(updated);
  }

  async restore(
    id: string,
    auditContext?: AdminAuditContext,
  ): Promise<PolicyAdminView> {
    const current = await this.policyRepository.findById(id);
    if (!current) {
      throw new NotFoundException(`Policy "${id}" was not found.`);
    }

    const actorUsername = auditContext?.actorUsername || 'SYSTEM_ADMIN';
    const updated = await this.policyRepository.updateStatus(id, 'DRAFT', actorUsername);

    await this.adminAuditService.record({
      context: auditContext,
      action: 'POLICY_RESTORED',
      targetType: 'POLICY',
      targetId: updated.id,
      before: current,
      after: updated,
    });

    return this.toAdminView(updated);
  }

  async remove(
    id: string,
    auditContext?: AdminAuditContext,
  ): Promise<{ deleted: boolean; policyId: string | null }> {
    const current = await this.policyRepository.findById(id);
    if (!current) {
      throw new NotFoundException(`Policy "${id}" was not found.`);
    }

    const deleted = await this.policyRepository.delete(id);

    if (deleted) {
      await this.masterdataOutboxService.enqueueMasterdataUpdated(
        'policy',
        current.id,
        {
          action: 'deleted',
          entity: 'policy',
          record: { id: current.id, slug: current.slug },
        },
      );

      await this.adminAuditService.record({
        context: auditContext,
        action: 'POLICY_DELETED',
        targetType: 'POLICY',
        targetId: current.id,
        before: current,
        after: null,
      });
    }

    return {
      deleted,
      policyId: deleted ? current.id : null,
    };
  }

  // ==========================================
  // 3. PRIVATE VALIDATORS & VIEW MAPPERS
  // ==========================================
  private validateAndNormalizeCreateInput(input: PolicyCreateInput): PolicyCreateInput {
    if (!input.title || !input.title.trim()) {
      throw new BadRequestException('Tiêu đề điều khoản (title) là bắt buộc.');
    }

    if (!input.content || !input.content.trim()) {
      throw new BadRequestException('Nội dung điều khoản (content) không được để trống.');
    }

    const title = input.title.trim();
    const slug = input.slug?.trim() ? this.normalizeSlug(input.slug) : this.generateSlug(title);
    const category = input.category ? this.normalizeCategory(input.category) : 'GENERAL';
    const status = input.status ? this.normalizeStatus(input.status) : 'DRAFT';
    const displayOrder = typeof input.displayOrder === 'number' ? input.displayOrder : 0;

    return {
      title,
      slug,
      category,
      summary: input.summary?.trim() || null,
      content: input.content.trim(),
      status,
      displayOrder,
      effectiveDate: input.effectiveDate || null,
      metadata: input.metadata || null,
    };
  }

  private validateAndNormalizeUpdateInput(
    input: PolicyUpdateInput,
    current: Policy,
  ): PolicyUpdateInput {
    const normalized: PolicyUpdateInput = {};

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        throw new BadRequestException('Tiêu đề điều khoản (title) không được để trống.');
      }
      normalized.title = input.title.trim();
    }

    if (input.slug !== undefined) {
      if (!input.slug.trim()) {
        throw new BadRequestException('Đường dẫn (slug) không được để trống.');
      }
      normalized.slug = this.normalizeSlug(input.slug);
    }

    if (input.category !== undefined) {
      normalized.category = this.normalizeCategory(input.category);
    }

    if (input.content !== undefined) {
      if (!input.content.trim()) {
        throw new BadRequestException('Nội dung điều khoản (content) không được để trống.');
      }
      normalized.content = input.content.trim();
    }

    if (input.summary !== undefined) {
      normalized.summary = input.summary ? input.summary.trim() : null;
    }

    if (input.status !== undefined) {
      normalized.status = this.normalizeStatus(input.status);
    }

    if (input.displayOrder !== undefined) {
      normalized.displayOrder = typeof input.displayOrder === 'number' ? input.displayOrder : current.displayOrder;
    }

    if (input.effectiveDate !== undefined) {
      normalized.effectiveDate = input.effectiveDate || null;
    }

    if (input.metadata !== undefined) {
      normalized.metadata = input.metadata || null;
    }

    if (input.changeNote !== undefined) {
      normalized.changeNote = input.changeNote?.trim() || null;
    }

    if (input.createNewVersion !== undefined) {
      normalized.createNewVersion = Boolean(input.createNewVersion);
    }

    return normalized;
  }

  private normalizeCategory(category: unknown): PolicyCategory {
    if (typeof category !== 'string') {
      throw new BadRequestException(`Category must be a string.`);
    }

    const uppercase = category.trim().toUpperCase() as PolicyCategory;
    if (!ALLOWED_CATEGORIES.includes(uppercase)) {
      throw new BadRequestException(
        `Category không hợp lệ. Danh sách hợp lệ: ${ALLOWED_CATEGORIES.join(', ')}.`,
      );
    }

    return uppercase;
  }

  private normalizeStatus(status: unknown): PolicyStatus {
    if (typeof status !== 'string') {
      throw new BadRequestException(`Status must be a string.`);
    }

    const uppercase = status.trim().toUpperCase() as PolicyStatus;
    if (!ALLOWED_STATUSES.includes(uppercase)) {
      throw new BadRequestException(
        `Status không hợp lệ. Danh sách hợp lệ: ${ALLOWED_STATUSES.join(', ')}.`,
      );
    }

    return uppercase;
  }

  private normalizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private generateSlug(text: string): string {
    return this.normalizeSlug(text);
  }

  private toPublicView(policy: Policy): PolicyPublicView {
    return {
      id: policy.id,
      title: policy.title,
      slug: policy.slug,
      category: policy.category,
      summary: policy.summary,
      content: policy.content,
      version: policy.version,
      displayOrder: policy.displayOrder,
      effectiveDate: policy.effectiveDate ? policy.effectiveDate.toISOString() : null,
      publishedAt: policy.publishedAt ? policy.publishedAt.toISOString() : null,
      updatedAt: policy.updatedAt.toISOString(),
    };
  }

  private toAdminView(policy: Policy): PolicyAdminView {
    return {
      id: policy.id,
      title: policy.title,
      slug: policy.slug,
      category: policy.category,
      summary: policy.summary,
      content: policy.content,
      status: policy.status,
      version: policy.version,
      displayOrder: policy.displayOrder,
      metadata: policy.metadata,
      effectiveDate: policy.effectiveDate ? policy.effectiveDate.toISOString() : null,
      publishedAt: policy.publishedAt ? policy.publishedAt.toISOString() : null,
      createdBy: policy.createdBy,
      updatedBy: policy.updatedBy,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
      versions: policy.versions?.map((v) => ({
        id: v.id,
        version: v.version,
        title: v.title,
        category: v.category,
        summary: v.summary,
        status: v.status,
        changeNote: v.changeNote,
        createdBy: v.createdBy,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  }
}
