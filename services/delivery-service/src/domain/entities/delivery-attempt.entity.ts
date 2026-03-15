import type { NdrCase, NdrCaseSnapshot } from './ndr-case.entity';
import type { OtpRecord, OtpRecordSnapshot } from './otp-record.entity';
import type { Pod, PodSnapshot } from './pod.entity';
import type { ReturnCase, ReturnCaseSnapshot } from './return-case.entity';

export type DeliveryAttemptStatus = 'ATTEMPTED' | 'DELIVERED' | 'FAILED';

export interface DeliveryAttempt {
  id: string;
  shipmentCode: string;
  taskId: string | null;
  courierId: string | null;
  locationCode: string | null;
  actor: string | null;
  note: string | null;
  status: DeliveryAttemptStatus;
  failReasonCode: string | null;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAttemptSnapshot {
  id: string;
  shipmentCode: string;
  taskId: string | null;
  courierId: string | null;
  locationCode: string | null;
  actor: string | null;
  note: string | null;
  status: DeliveryAttemptStatus;
  failReasonCode: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordDeliveryAttemptInput {
  shipmentCode: string;
  taskId?: string | null;
  courierId?: string | null;
  locationCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt?: string | null;
  sendOtp?: boolean;
  otpCode?: string | null;
}

export interface CreateDeliveryAttemptInput {
  shipmentCode: string;
  taskId?: string | null;
  courierId?: string | null;
  locationCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt: Date;
  status: DeliveryAttemptStatus;
  failReasonCode?: string | null;
}

export interface MarkDeliverySuccessInput {
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

export interface MarkDeliveryFailInput {
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

export interface UpdateDeliveredAttemptInput {
  locationCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt: Date;
}

export interface UpdateFailedAttemptInput {
  locationCode?: string | null;
  actor?: string | null;
  note?: string | null;
  occurredAt: Date;
  failReasonCode?: string | null;
}

export interface AttemptDeliveryResult {
  deliveryAttempt: DeliveryAttempt;
  otpRecord: OtpRecord | null;
}

export interface AttemptDeliveryResultSnapshot {
  deliveryAttempt: DeliveryAttemptSnapshot;
  otpRecord: OtpRecordSnapshot | null;
}

export interface DeliverySuccessResult {
  kind: 'success';
  deliveryAttempt: DeliveryAttempt;
  pod: Pod | null;
  otpRecord: OtpRecord | null;
}

export interface DeliverySuccessResultSnapshot {
  kind: 'success';
  deliveryAttempt: DeliveryAttemptSnapshot;
  pod: PodSnapshot | null;
  otpRecord: OtpRecordSnapshot | null;
}

export interface DeliveryFailResult {
  kind: 'fail';
  deliveryAttempt: DeliveryAttempt;
  ndrCase: NdrCase | null;
  returnCase: ReturnCase | null;
}

export interface DeliveryFailResultSnapshot {
  kind: 'fail';
  deliveryAttempt: DeliveryAttemptSnapshot;
  ndrCase: NdrCaseSnapshot | null;
  returnCase: ReturnCaseSnapshot | null;
}
