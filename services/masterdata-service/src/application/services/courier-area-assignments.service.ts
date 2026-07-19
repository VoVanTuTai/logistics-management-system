import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CourierAreaAssignment,
  CourierAreaAssignmentListFilters,
  CourierAreaAssignmentWriteInput,
} from '../../domain/entities/courier-area-assignment.entity';
import { CourierAreaAssignmentRepository } from '../../domain/repositories/courier-area-assignment.repository';
import { MasterdataOutboxService } from '../../messaging/outbox/masterdata-outbox.service';
import {
  AdminAuditService,
  type AdminAuditContext,
} from './admin-audit.service';
import {
  normalizeRequiredText,
  normalizeOptionalText,
  parseBooleanQuery,
} from './masterdata-normalizers';

interface ListCourierAreaAssignmentsQuery {
  courierId?: string;
  hubCode?: string;
  province?: string;
  district?: string;
  ward?: string;
  isActive?: string;
}

@Injectable()
export class CourierAreaAssignmentsService {
  constructor(
    @Inject(CourierAreaAssignmentRepository)
    private readonly courierAreaAssignmentRepository: CourierAreaAssignmentRepository,
    private readonly masterdataOutboxService: MasterdataOutboxService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  list(query: ListCourierAreaAssignmentsQuery = {}): Promise<CourierAreaAssignment[]> {
    return this.courierAreaAssignmentRepository.list({
      courierId: normalizeOptionalText(query.courierId, 'courierId', 80),
      hubCode: normalizeOptionalText(query.hubCode, 'hubCode', 80),
      province: normalizeOptionalText(query.province, 'province', 120),
      district: normalizeOptionalText(query.district, 'district', 120),
      ward: normalizeOptionalText(query.ward, 'ward', 120),
      isActive: parseBooleanQuery(query.isActive, 'isActive'),
    });
  }

  async getById(id: string): Promise<CourierAreaAssignment> {
    const record = await this.courierAreaAssignmentRepository.findById(id);

    if (!record) {
      throw new NotFoundException(`Courier area assignment "${id}" was not found.`);
    }

    return record;
  }

  async create(
    input: CourierAreaAssignmentWriteInput,
    auditContext?: AdminAuditContext,
  ): Promise<CourierAreaAssignment> {
    const normalizedInput = this.normalizeInput(input);
    const existing = await this.courierAreaAssignmentRepository.findByUniqueKey(
      normalizedInput.courierId,
      normalizedInput.province,
      normalizedInput.district,
      normalizedInput.ward,
    );

    if (existing) {
      throw new ConflictException(
        `Courier area assignment for courier "${normalizedInput.courierId}" at region "${normalizedInput.province}/${normalizedInput.district}/${normalizedInput.ward}" already exists.`,
      );
    }

    const record = await this.courierAreaAssignmentRepository.create(normalizedInput);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'courier_area_assignment',
      record.id,
      {
        action: 'created',
        entity: 'courier_area_assignment',
        record,
      },
    );

    await this.adminAuditService.record({
      context: auditContext,
      action: 'COURIER_AREA_ASSIGNMENT_CREATED',
      targetType: 'COURIER_AREA_ASSIGNMENT',
      targetId: record.id,
      before: null,
      after: record,
    });

    return record;
  }

  async update(
    id: string,
    input: Partial<CourierAreaAssignmentWriteInput>,
    auditContext?: AdminAuditContext,
  ): Promise<CourierAreaAssignment> {
    const current = await this.getById(id);
    const normalizedInput = this.normalizePartialInput(input);

    if (Object.keys(normalizedInput).length === 0) {
      return current;
    }

    // Check unique key collision if keys are changing
    const nextCourierId = normalizedInput.courierId ?? current.courierId;
    const nextProvince = normalizedInput.province ?? current.province;
    const nextDistrict = normalizedInput.district ?? current.district;
    const nextWard = normalizedInput.ward ?? current.ward;

    if (
      nextCourierId !== current.courierId ||
      nextProvince !== current.province ||
      nextDistrict !== current.district ||
      nextWard !== current.ward
    ) {
      const existing = await this.courierAreaAssignmentRepository.findByUniqueKey(
        nextCourierId,
        nextProvince,
        nextDistrict,
        nextWard,
      );

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Courier area assignment for courier "${nextCourierId}" at region "${nextProvince}/${nextDistrict}/${nextWard}" already exists.`,
        );
      }
    }

    const record = await this.courierAreaAssignmentRepository.update(id, normalizedInput);

    await this.masterdataOutboxService.enqueueMasterdataUpdated(
      'courier_area_assignment',
      record.id,
      {
        action: 'updated',
        entity: 'courier_area_assignment',
        record,
      },
    );

    await this.adminAuditService.record({
      context: auditContext,
      action: 'COURIER_AREA_ASSIGNMENT_UPDATED',
      targetType: 'COURIER_AREA_ASSIGNMENT',
      targetId: record.id,
      before: current,
      after: record,
    });

    return record;
  }

  async remove(
    id: string,
    auditContext?: AdminAuditContext,
  ): Promise<{ deleted: boolean; assignmentId: string | null }> {
    const record = await this.getById(id);
    const deleted = await this.courierAreaAssignmentRepository.delete(id);

    if (deleted) {
      await this.masterdataOutboxService.enqueueMasterdataUpdated(
        'courier_area_assignment',
        record.id,
        {
          action: 'deleted',
          entity: 'courier_area_assignment',
          record,
        },
      );

      await this.adminAuditService.record({
        context: auditContext,
        action: 'COURIER_AREA_ASSIGNMENT_DELETED',
        targetType: 'COURIER_AREA_ASSIGNMENT',
        targetId: record.id,
        before: record,
        after: null,
      });
    }

    return {
      deleted,
      assignmentId: deleted ? record.id : null,
    };
  }

  private normalizeInput(input: CourierAreaAssignmentWriteInput): CourierAreaAssignmentWriteInput {
    return {
      courierId: normalizeRequiredText(input.courierId, 'courierId', 80),
      hubCode: normalizeRequiredText(input.hubCode, 'hubCode', 80),
      province: normalizeRequiredText(input.province, 'province', 120),
      district: normalizeRequiredText(input.district, 'district', 120),
      ward: normalizeRequiredText(input.ward, 'ward', 120),
      isActive: this.normalizeIsActive(input.isActive, true),
    };
  }

  private normalizePartialInput(input: Partial<CourierAreaAssignmentWriteInput>): Partial<CourierAreaAssignmentWriteInput> {
    const result: Partial<CourierAreaAssignmentWriteInput> = {};

    if (input.courierId !== undefined) {
      result.courierId = normalizeRequiredText(input.courierId, 'courierId', 80);
    }
    if (input.hubCode !== undefined) {
      result.hubCode = normalizeRequiredText(input.hubCode, 'hubCode', 80);
    }
    if (input.province !== undefined) {
      result.province = normalizeRequiredText(input.province, 'province', 120);
    }
    if (input.district !== undefined) {
      result.district = normalizeRequiredText(input.district, 'district', 120);
    }
    if (input.ward !== undefined) {
      result.ward = normalizeRequiredText(input.ward, 'ward', 120);
    }
    if (input.isActive !== undefined) {
      result.isActive = this.normalizeIsActive(input.isActive, true);
    }

    return result;
  }

  private normalizeIsActive(value: unknown, defaultValue: boolean): boolean {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean.');
    }

    return value;
  }
}
