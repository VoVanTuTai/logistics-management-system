import type {
  CreateScanEventInput,
  PersistedScanEventResult,
  ScanEvent,
} from '../entities/scan-event.entity';

export abstract class ScanEventRepository {
  abstract findById(id: string): Promise<ScanEvent | null>;

  abstract findByIdempotencyKey(idempotencyKey: string): Promise<ScanEvent | null>;

  abstract createIfAbsent(
    input: CreateScanEventInput,
  ): Promise<PersistedScanEventResult>;
}
