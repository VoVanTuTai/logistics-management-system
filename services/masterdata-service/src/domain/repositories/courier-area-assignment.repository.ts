import {
  CourierAreaAssignment,
  CourierAreaAssignmentListFilters,
  CourierAreaAssignmentWriteInput,
} from '../entities/courier-area-assignment.entity';

export abstract class CourierAreaAssignmentRepository {
  abstract list(filters?: CourierAreaAssignmentListFilters): Promise<CourierAreaAssignment[]>;
  abstract findById(id: string): Promise<CourierAreaAssignment | null>;
  abstract findByUniqueKey(courierId: string, province: string, district: string, ward: string): Promise<CourierAreaAssignment | null>;
  abstract create(input: CourierAreaAssignmentWriteInput): Promise<CourierAreaAssignment>;
  abstract update(id: string, input: Partial<CourierAreaAssignmentWriteInput>): Promise<CourierAreaAssignment>;
  abstract delete(id: string): Promise<boolean>;
}
