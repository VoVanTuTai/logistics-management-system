export type HubScanType = 'PICKUP' | 'INBOUND' | 'OUTBOUND';

export interface HubScanInput {
  shipmentCode: string;
  locationCode: string;
  scanType: HubScanType;
  note?: string | null;
  idempotencyKey: string;
}

export interface ScanEventDto {
  id: string;
  shipmentCode: string;
  scanType: HubScanType;
  locationCode: string | null;
  manifestCode: string | null;
  actor: string | null;
  note: string | null;
  idempotencyKey: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentLocationDto {
  id: string;
  shipmentCode: string;
  locationCode: string | null;
  lastScanType: HubScanType | null;
  lastScanEventId: string | null;
  lastScannedAt: string | null;
  manifestCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HubScanResultDto {
  scanEvent: ScanEventDto;
  currentLocation: CurrentLocationDto;
}

