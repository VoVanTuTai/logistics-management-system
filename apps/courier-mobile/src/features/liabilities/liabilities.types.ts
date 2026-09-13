export type CourierLiabilityStatus =
  | 'PENDING_EXPLANATION' // Chờ bưu tá giải trình / kháng cáo
  | 'APPEAL_SUBMITTED' // Đã nộp đơn kháng cáo, chờ QA phúc khảo
  | 'ADJUDICATED' // Đã có phán quyết cuối cùng
  | 'DEDUCTED' // Đã khấu trừ vào thu nhập
  | 'SETTLED' // Đã tất toán hoàn tất
  | 'APPEAL_REJECTED'; // Kháng cáo bị bác bỏ

export type CourierLiabilityIncidentType = 'DAMAGED' | 'LOST_IN_TRANSIT';

export interface CourierLiabilityEvidencePhoto {
  id: string;
  url: string;
  label: string;
  takenAt: string;
}

export interface CourierLiabilityItem {
  id: string;
  claimCode: string; // VD: CLM-202609-005
  shipmentCode: string; // VD: NXS000520
  incidentType: CourierLiabilityIncidentType;
  incidentDate: string;
  itemDescription: string;
  damageDescription: string;
  qaFinding: string; // Kết luận của QA Lead
  adjudicatedBy: string; // Tên QA Lead
  adjudicatedAt: string;
  penaltyAmount: number; // Số tiền bị phạt khấu trừ
  status: CourierLiabilityStatus;
  evidencePhotos: CourierLiabilityEvidencePhoto[];

  // Dữ liệu khiếu nại / kháng cáo
  appealReason?: string;
  appealNotes?: string;
  appealSubmittedAt?: string;
  appealPhotoUrl?: string;
}

export interface CourierIncomeSummary {
  deliveryCount: number;
  deliveryFeePerOrder: number; // 3.000 VNĐ
  deliveryTotal: number;
  pickupCount: number;
  pickupFeePerOrder: number; // 1.500 VNĐ
  pickupTotal: number;
  grossEarnings: number;
  totalDeductions: number;
  netEarnings: number;
}
