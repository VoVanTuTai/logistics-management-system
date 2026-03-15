import { z } from 'zod';

export interface CurrentLocationDto {
  shipmentCode: string;
  locationCode: string | null;
  updatedAt: string;
}

export interface ScanEventDto {
  id: string;
  shipmentCode: string;
  scanType: 'PICKUP' | 'INBOUND' | 'OUTBOUND';
  locationCode: string | null;
  manifestCode: string | null;
  actor: string | null;
  note: string | null;
  idempotencyKey: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordScanPayload {
  shipmentCode: string;
  locationCode?: string | null;
  manifestCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  idempotencyKey: string;
}

export interface RecordScanResultDto {
  scanEvent: ScanEventDto;
  currentLocation: CurrentLocationDto;
}

export const pickupScanSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string().optional().default(''),
  note: z.string().optional().default(''),
});

export const hubScanSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string().min(1, 'Location code is required.'),
  manifestCode: z.string().optional().default(''),
  note: z.string().optional().default(''),
});

export type PickupScanFormValues = z.infer<typeof pickupScanSchema>;
export type HubScanFormValues = z.infer<typeof hubScanSchema>;
