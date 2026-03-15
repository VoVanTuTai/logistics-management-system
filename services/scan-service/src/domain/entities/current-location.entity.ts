export interface CurrentLocation {
  id: string;
  shipmentCode: string;
  locationCode: string | null;
  lastScanType: 'PICKUP' | 'INBOUND' | 'OUTBOUND' | null;
  lastScanEventId: string | null;
  lastScannedAt: Date | null;
  manifestCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrentLocationSnapshot {
  id: string;
  shipmentCode: string;
  locationCode: string | null;
  lastScanType: 'PICKUP' | 'INBOUND' | 'OUTBOUND' | null;
  lastScanEventId: string | null;
  lastScannedAt: string | null;
  manifestCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCurrentLocationInput {
  shipmentCode: string;
  locationCode: string | null;
  lastScanType: 'PICKUP' | 'INBOUND' | 'OUTBOUND';
  lastScanEventId: string;
  lastScannedAt: Date;
  manifestCode: string | null;
}
