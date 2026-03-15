import type {
  CurrentLocation,
  CurrentLocationSnapshot,
} from './current-location.entity';

export type ScanType = 'PICKUP' | 'INBOUND' | 'OUTBOUND';

export interface ScanEvent {
  id: string;
  shipmentCode: string;
  scanType: ScanType;
  locationCode: string | null;
  manifestCode: string | null;
  actor: string | null;
  note: string | null;
  idempotencyKey: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanEventSnapshot {
  id: string;
  shipmentCode: string;
  scanType: ScanType;
  locationCode: string | null;
  manifestCode: string | null;
  actor: string | null;
  note: string | null;
  idempotencyKey: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordScanInput {
  shipmentCode: string;
  locationCode?: string | null;
  manifestCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  idempotencyKey: string;
}

export interface RecordPickupScanInput extends RecordScanInput {}

export interface RecordInboundScanInput extends RecordScanInput {}

export interface RecordOutboundScanInput extends RecordScanInput {}

export interface CreateScanEventInput {
  shipmentCode: string;
  scanType: ScanType;
  locationCode: string | null;
  manifestCode: string | null;
  actor: string | null;
  note: string | null;
  occurredAt: Date;
  idempotencyKey: string;
}

export interface PersistedScanEventResult {
  scanEvent: ScanEvent;
  created: boolean;
}

export interface RecordScanResult {
  scanEvent: ScanEvent;
  currentLocation: CurrentLocation;
}

export interface RecordScanResultSnapshot {
  scanEvent: ScanEventSnapshot;
  currentLocation: CurrentLocationSnapshot;
}
