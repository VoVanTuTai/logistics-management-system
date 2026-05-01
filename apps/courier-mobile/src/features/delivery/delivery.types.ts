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

export interface IssueAttachmentPayload {
  uri?: string | null;
  url?: string | null;
  type?: string | null;
  name?: string | null;
}

export interface ShipmentExceptionPayload {
  shipmentCode: string;
  currentHubCode: string;
  issueType: string;
  issueCategory?: 'PHYSICAL' | 'INFORMATION' | 'SYSTEM' | string | null;
  attachments?: IssueAttachmentPayload[];
  note?: string | null;
  actor?: string | null;
  occurredAt?: string | null;
}

export interface NdrCaseDto {
  id: string;
  shipmentCode: string;
  deliveryAttemptId: string | null;
  reasonCode: string | null;
  issueType?: string | null;
  issueCategory?: string | null;
  attachments?: unknown;
  reportedBy?: string | null;
  reportedHubCode?: string | null;
  note: string | null;
  status: string;
  rescheduleAt: string | null;
  createdAt: string;
  updatedAt: string;
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
