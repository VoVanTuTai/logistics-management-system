import { z } from 'zod';

import type { DeliverySuccessResultDto } from './delivery.types';

export const deliverySuccessFormSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string(),
  otpCode: z.string(),
  podImageUrl: z.string(),
  podNote: z.string(),
  note: z.string(),
  idempotencyKey: z.string(),
});

export type DeliverySuccessFormValues = z.infer<typeof deliverySuccessFormSchema>;

export interface DeliverySuccessMapperContext {
  taskId?: string;
  actor: string | null;
  idempotencyKey: string;
  occurredAt: string;
}

export interface DeliverySuccessMutationResult {
  result: DeliverySuccessResultDto;
  source: 'LIVE' | 'DUPLICATE_REPLAY';
}

export type DeliverySuccessSubmitState =
  | 'IDLE'
  | 'SUBMITTING'
  | 'SUCCESS'
  | 'FAILED';
