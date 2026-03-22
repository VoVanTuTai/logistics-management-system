import { z } from 'zod';

import type { RecordScanResultDto } from './scan.types';

export const pickupScanFormSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string(),
  note: z.string(),
  idempotencyKey: z.string(),
});

export type PickupScanFormValues = z.infer<typeof pickupScanFormSchema>;

export interface PickupScanCommand {
  shipmentCode: string;
  locationCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  idempotencyKey: string;
}

export interface PickupScanMutationResult {
  result: RecordScanResultDto;
  source: 'LIVE' | 'DUPLICATE_REPLAY';
}
