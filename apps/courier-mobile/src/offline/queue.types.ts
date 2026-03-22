import type {
  QueueableActionPayloadMap,
  QueueableActionType,
} from '../features/offline/offline.types';

export type OfflineQueueActionType = QueueableActionType;
export type OfflineQueueStatus = 'QUEUED' | 'PROCESSING' | 'FAILED';

export interface OfflineQueueItem<
  TActionType extends OfflineQueueActionType = OfflineQueueActionType,
> {
  id: string;
  actionType: TActionType;
  endpoint: string;
  method: 'POST';
  payload: QueueableActionPayloadMap[TActionType];
  idempotencyKey: string;
  status: OfflineQueueStatus;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  lastError: string | null;
}

export interface OfflineQueueStats {
  total: number;
  queued: number;
  processing: number;
  failed: number;
}

export interface OfflineQueueSnapshot {
  items: OfflineQueueItem[];
  stats: OfflineQueueStats;
}

export interface OfflineQueuePreviewItem {
  id: string;
  actionType: OfflineQueueActionType;
  status: OfflineQueueStatus;
  attemptCount: number;
  lastError: string | null;
}

// Backward-compatible aliases for existing feature helpers.
export type OfflineJob<TPayload = OfflineQueueItem['payload']> = Omit<
  OfflineQueueItem,
  'payload'
> & { payload: TPayload };
export type OfflineJobType = OfflineQueueActionType;
