export type OtpStatus = 'SENT' | 'VERIFIED';

export interface OtpRecord {
  id: string;
  shipmentCode: string;
  otpCode: string | null;
  status: OtpStatus;
  sentBy: string | null;
  verifiedBy: string | null;
  sentAt: Date | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpRecordSnapshot {
  id: string;
  shipmentCode: string;
  otpCode: string | null;
  status: OtpStatus;
  sentBy: string | null;
  verifiedBy: string | null;
  sentAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendOtpInput {
  shipmentCode: string;
  otpCode?: string | null;
  sentBy?: string | null;
  sentAt?: string | null;
}

export interface VerifyOtpInput {
  shipmentCode: string;
  otpCode?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}
