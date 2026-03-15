import type { QueueableActionPayloadMap } from '../features/offline/offline.types';

export type OfflineJobType = keyof QueueableActionPayloadMap;

export interface OfflineJob<
  TPayload = QueueableActionPayloadMap[OfflineJobType],
> {
  id: string;
  type: OfflineJobType;
  endpoint: string;
  payload: TPayload;
  idempotencyKey: string;
  status: 'PENDING' | 'PROCESSING' | 'FAILED';
  retryCount: number;
  createdAt: string;
  lastAttemptAt: string | null;
  lastError: string | null;
}
