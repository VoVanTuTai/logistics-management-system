import { z } from 'zod';

export interface DeliveryAttemptDto {
  id: string;
  shipmentCode: string;
  taskId: string | null;
  courierId: string | null;
  locationCode: string | null;
  actor: string | null;
  note: string | null;
  status: 'ATTEMPTED' | 'DELIVERED' | 'FAILED';
  failReasonCode: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverySuccessPayload {
  deliveryAttemptId?: string | null;
  shipmentCode: string;
  taskId?: string | null;
  courierId?: string | null;
  locationCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  idempotencyKey: string;
  podImageUrl?: string | null;
  podNote?: string | null;
  podCapturedBy?: string | null;
  otpCode?: string | null;
}

export interface DeliveryFailPayload {
  deliveryAttemptId?: string | null;
  shipmentCode: string;
  taskId?: string | null;
  courierId?: string | null;
  locationCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  idempotencyKey: string;
  failReasonCode?: string | null;
  createNdr?: boolean;
  startReturn?: boolean;
}

export interface DeliverySuccessResultDto {
  kind: 'success';
  deliveryAttempt: DeliveryAttemptDto;
  pod: unknown | null;
  otpRecord: unknown | null;
}

export interface DeliveryFailResultDto {
  kind: 'fail';
  deliveryAttempt: DeliveryAttemptDto;
  ndrCase: unknown | null;
  returnCase: unknown | null;
}

export const deliverySuccessSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string().optional().default(''),
  podImageUrl: z.string().optional().default(''),
  podNote: z.string().optional().default(''),
  otpCode: z.string().optional().default(''),
  note: z.string().optional().default(''),
});

export const deliveryFailSchema = z.object({
  shipmentCode: z.string().min(1, 'Shipment code is required.'),
  locationCode: z.string().optional().default(''),
  failReasonCode: z.string().optional().default(''),
  note: z.string().optional().default(''),
  createNdr: z.boolean(),
  startReturn: z.boolean(),
});

export type DeliverySuccessFormValues = z.infer<typeof deliverySuccessSchema>;
export type DeliveryFailFormValues = z.infer<typeof deliveryFailSchema>;
