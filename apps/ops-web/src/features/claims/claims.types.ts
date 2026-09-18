export type IncidentType = 'DAMAGED' | 'LOST_IN_TRANSIT';

export type ClaimStatus =
  | 'DRAFT'
  | 'PENDING_INSPECTION'
  | 'LIABILITY_DETERMINED'
  | 'APPROVED_COMPENSATION'
  | 'SETTLED'
  | 'REJECTED';

export type ResponsiblePartyType =
  | 'ORIGIN_HUB'
  | 'LINEHAUL_FLEET'
  | 'TRANSIT_HUB'
  | 'DELIVERY_HUB'
  | 'INSURANCE_FORCE_MAJEURE'
  | 'UNASSIGNED';

export type RootCauseCategory =
  | 'PACKAGING_SOP_VIOLATION'
  | 'ROUGH_HANDLING_STACKING'
  | 'TRUCK_SEAL_BREACH'
  | 'WAREHOUSE_INVENTORY_LOSS'
  | 'COURIER_TRANSIT_DROP'
  | 'FORCE_MAJEURE_ACCIDENT';

export interface ClaimEvidencePhoto {
  id: string;
  label: string;
  url: string;
  takenAt: string;
  takenBy: string;
}

export interface ClaimAuditScan {
  timestamp: string;
  locationCode: string;
  locationName: string;
  action: string;
  operator: string;
  note?: string;
}

export interface CompensationClaim {
  id: string;
  claimCode: string; // e.g. CLM-202609-001
  shipmentCode: string;
  customerName: string;
  customerPhone: string;
  originHubCode: string;
  destinationHubCode: string;
  incidentType: IncidentType;
  incidentDate: string;
  reportedAt: string;
  reportedBy: string;
  
  // Financials
  declaredValue: number; // Giá trị khai giá
  codAmount: number;
  claimRequestedAmount: number; // Tiền khách yêu cầu
  approvedCompensationAmount: number; // Tiền bồi thường duyệt chi
  penaltyAmount: number; // Tiền phạt đơn vị gây lỗi
  
  // Status & Workflow
  status: ClaimStatus;
  
  // Liability Determination (Ma trận trách nhiệm)
  responsibleParty: ResponsiblePartyType;
  responsibleEntityCode: string; // Mã Hub hoặc biển số xe hoặc mã NV
  responsibleEntityName: string; // Tên Hub / Đội xe / Nhân viên
  liabilityRatioPercent: number; // Tỷ lệ chịu trách nhiệm (thường 100%, 70%, 50%)
  rootCause: RootCauseCategory;
  adjudicationNotes?: string;
  adjudicatedAt?: string;
  adjudicatedBy?: string;
  
  // Intake metadata (from BranchBusinessOrderCreatePage)
  isFragile?: boolean;
  insuranceTier?: 'NONE' | 'COMPREHENSIVE_100';
  insuranceFee?: number;
  packagingWaiver?: boolean;
  shippingFee?: number; // Cước vận chuyển, dùng để tính trần "4x cước"

  // Physical Inspection & Evidence
  declaredWeightKg: number;
  arrivalWeightKg?: number;
  weightDiscrepancyKg?: number;
  packageDescription: string;
  damageDescription?: string;
  evidencePhotos: ClaimEvidencePhoto[];
  auditTrail: ClaimAuditScan[];
  
  // Settlement & Payment
  merchantPaidAt?: string;
  hubDeductedAt?: string;
  updatedAt: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface HubClaimSummary {
  hubCode: string;
  hubName: string;
  zoneCode: string;
  totalShipmentsHandled: number;
  damagedCount: number;
  lostCount: number;
  totalIncidentCount: number;
  totalCompensationCost: number;
  penaltyAssignedAmount: number;
  penaltyRecoveredAmount: number;
  lossAndDamageRate: number; // Tỷ lệ % (mục tiêu < 0.05%)
  riskLevel: RiskLevel;
  topRootCause: string;
}

export interface RootCauseStatsItem {
  category: RootCauseCategory;
  label: string;
  count: number;
  totalCost: number;
  percentage: number;
  color: string;
}

export interface MonthlyLossTrendItem {
  month: string;
  damagedCount: number;
  lostCount: number;
  totalCompensationCost: number;
  lossRate: number;
}
