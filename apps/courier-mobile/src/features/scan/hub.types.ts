import { z } from 'zod';

import type { RecordScanResultDto } from './scan.types';

export type HubScanMode = 'INBOUND' | 'OUTBOUND';

export const hubScanFormSchema = z.object({
  mode: z.enum(['INBOUND', 'OUTBOUND']),
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string().min(1, 'Location code is required.'),
  manifestCode: z.string(),
  note: z.string(),
  idempotencyKey: z.string(),
});

export type HubScanFormValues = z.infer<typeof hubScanFormSchema>;

export interface HubScanCommand {
  mode: HubScanMode;
  shipmentCode: string;
  locationCode: string;
  manifestCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  idempotencyKey: string;
}

export interface HubScanMutationResult {
  result: RecordScanResultDto;
  source: 'LIVE' | 'DUPLICATE_REPLAY';
}
