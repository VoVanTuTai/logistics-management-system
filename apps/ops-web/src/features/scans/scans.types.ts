export type HubScanType = 'INBOUND' | 'OUTBOUND';

export interface HubScanInput {
  shipmentCode: string;
  locationCode: string;
  scanType: HubScanType;
  note?: string | null;
  idempotencyKey: string;
}

export interface HubScanResultDto {
  scanEventId: string;
  shipmentCode: string;
  scanType: HubScanType;
  occurredAt: string;
}

