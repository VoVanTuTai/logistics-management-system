export interface CurrentLocation {
  id: string;
  shipmentCode: string;
  locationCode: string | null;
  lastScanType: 'PICKUP' | 'INBOUND' | 'OUTBOUND' | null;
  lastScanEventId: string | null;
  lastScannedAt: Date | null;
  manifestCode: string | null;
  courierId: string | null;
  taskId: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: Date | null;
  source: LocationSource;
  createdAt: Date;
  updatedAt: Date;
}

export type LocationSource = 'GPS' | 'MANUAL' | 'SCAN';

export interface CurrentLocationSnapshot {
  id: string;
  shipmentCode: string;
  locationCode: string | null;
  lastScanType: 'PICKUP' | 'INBOUND' | 'OUTBOUND' | null;
  lastScanEventId: string | null;
  lastScannedAt: string | null;
  manifestCode: string | null;
  courierId: string | null;
  taskId: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: string | null;
  source: LocationSource;
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

export interface CourierCurrentLocation {
  id: string;
  courierId: string;
  taskId: string | null;
  shipmentCode: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: Date;
  source: LocationSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourierCurrentLocationSnapshot {
  id: string;
  courierId: string;
  taskId: string | null;
  shipmentCode: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
  source: LocationSource;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCourierLocationInput {
  courierId: string;
  taskId?: string | null;
  shipmentCode?: string | null;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  capturedAt: Date;
  source: LocationSource;
}

export interface CourierLocationHistory {
  id: string;
  courierId: string;
  taskId: string | null;
  shipmentCode: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: Date;
  source: LocationSource;
  createdAt: Date;
}

export interface CourierLocationHistorySnapshot {
  id: string;
  courierId: string;
  taskId: string | null;
  shipmentCode: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
  source: LocationSource;
  createdAt: string;
}

