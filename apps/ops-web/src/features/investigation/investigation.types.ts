import type { ResponsiblePartyType, RootCauseCategory } from '../claims/claims.types';

export type InvestigationStatus =
  | 'ANALYZING'           // Đang phân tích log & vết quét
  | 'PRELIMINARY_REPORT'  // Đã có báo cáo sơ bộ, chuẩn bị mở giải trình
  | 'IN_HEARING'          // Đang trong thời hạn giải trình 24h
  | 'RESOLVED_FOUND'      // Đã tìm thấy hàng trong kho (Cứu đơn thành công)
  | 'ESCALATED_TO_CLAIM'; // Quá hạn hoặc xác nhận lỗi -> Chuyển hồ sơ bồi thường

export type BreakPointType =
  | 'WAREHOUSE_STALE_LOSS'       // Tồn kho quá 24h-48h sau Scan Inbound không xuất kho
  | 'LINEHAUL_IN_TRANSIT_LOSS'   // Rơi vỡ / mất kiện trên xe tuyến (đứt seal, rách bạt, hụt cân bao)
  | 'MISROUTED_SORTING'          // Quét nhầm luồng / sai tuyến đích
  | 'LAST_MILE_UNACCOUNTED';     // Bàn giao bưu tá nhưng cuối ca không giao và không hoàn kho

export interface InvestigationAuditScan {
  id: string;
  timestamp: string;
  locationCode: string;
  locationName: string;
  action: string;
  operator: string;
  bagCode?: string;
  sealNumber?: string;
  tripCode?: string;
  recordedWeightKg?: number;
  weightDeltaKg?: number;
  isBreakPoint?: boolean;
  anomalyNote?: string;
}

export interface DisputeEvidence {
  id: string;
  submittedAt: string;
  submittedBy: string;
  partyCode: string;
  partyName: string;
  cctvVideoUrl?: string;
  cctvTimestampRange?: string;
  handoverSlipUrl?: string;
  notes: string;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
}

export interface PreliminaryReport {
  generatedAt: string;
  breakPointType: BreakPointType;
  breakPointDescription: string;
  suspectPartyType: ResponsiblePartyType;
  suspectPartyCode: string;
  suspectPartyName: string;
  confidenceScorePercent: number; // 0 - 100%
  suggestedRootCause: RootCauseCategory;
  suggestedCompensationAmount: number;
  supportingEvidences: string[];
}

export interface InvestigationCase {
  id: string;
  investigationCode: string; // e.g. INV-202609-001
  shipmentCode: string;
  customerName: string;
  customerPhone: string;
  originHubCode: string;
  originHubName: string;
  destinationHubCode: string;
  destinationHubName: string;
  declaredValue: number;
  declaredWeightKg: number;
  packageDescription: string;
  status: InvestigationStatus;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  
  // Investigation timing & hearing
  openedAt: string;
  hearingDeadlineAt?: string; // Thời hạn 24h để Hub bị tình nghi phản biện
  closedAt?: string;
  
  // Results
  breakPointType: BreakPointType;
  preliminaryReport: PreliminaryReport;
  auditTrail: InvestigationAuditScan[];
  disputeEvidences: DisputeEvidence[];
  
  // Resolution details
  resolutionNote?: string;
  linkedClaimCode?: string; // Khi escalate sang hồ sơ bồi thường
  foundLocation?: string;   // Khi tìm thấy hàng hoàn kho
  updatedAt: string;
}
