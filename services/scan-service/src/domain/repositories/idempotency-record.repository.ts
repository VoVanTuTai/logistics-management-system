import type {
  CreateIdempotencyRecordInput,
  IdempotencyRecord,
} from '../entities/idempotency-record.entity';

export abstract class IdempotencyRecordRepository {
  abstract findByKey(idempotencyKey: string): Promise<IdempotencyRecord | null>;

  abstract createIfAbsent(
    input: CreateIdempotencyRecordInput,
  ): Promise<IdempotencyRecord>;
}
