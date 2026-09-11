import type { ResponsiblePartyType, RootCauseCategory } from '../claims/claims.types';
import { readClaims, writeClaims } from '../claims/claims.data';
import type { CompensationClaim } from '../claims/claims.types';
import type {
  BreakPointType,
  DisputeEvidence,
  InvestigationAuditScan,
  InvestigationCase,
  InvestigationStatus,
  PreliminaryReport,
} from './investigation.types';

const INVESTIGATION_STORAGE_KEY = 'ops.investigations.stray.v1';

export const BREAK_POINT_LABELS: Record<BreakPointType, string> = {
  WAREHOUSE_STALE_LOSS: 'Tồn kho mất tích tại Hub (>48h không xuất)',
  LINEHAUL_IN_TRANSIT_LOSS: 'Thất lạc trên xe tuyến (Hụt cân / Đứt seal)',
  MISROUTED_SORTING: 'Phân loại nhầm luồng / Sai tuyến đích',
  LAST_MILE_UNACCOUNTED: 'Mất tích sau khi xuất giao cho Shipper',
};

export const INVESTIGATION_STATUS_LABELS: Record<InvestigationStatus, string> = {
  ANALYZING: 'Đang phân tích log',
  PRELIMINARY_REPORT: 'Báo cáo sơ bộ',
  IN_HEARING: 'Thời hạn giải trình 24h',
  RESOLVED_FOUND: 'Đã tìm thấy hàng (Hoàn kho)',
  ESCALATED_TO_CLAIM: 'Đã chuyển hồ sơ bồi thường',
};

const SEED_INVESTIGATIONS: InvestigationCase[] = [
  {
    id: 'inv-001',
    investigationCode: 'INV-202609-001',
    shipmentCode: 'NXS000789',
    customerName: 'Cửa Hàng Apple Care Authorized',
    customerPhone: '0918889999',
    originHubCode: 'HN01',
    originHubName: 'Hub Hà Nội 01 (Hoàn Kiếm)',
    destinationHubCode: 'CT01',
    destinationHubName: 'Hub Cần Thơ (Ninh Kiều)',
    declaredValue: 18500000,
    declaredWeightKg: 0.85,
    packageDescription: 'Máy tính bảng iPad Air M2 11-inch 128GB Wifi',
    status: 'IN_HEARING',
    priority: 'CRITICAL',
    openedAt: '2026-09-10T08:00:00Z',
    hearingDeadlineAt: '2026-09-12T08:00:00Z', // Còn trong hạn giải trình
    breakPointType: 'WAREHOUSE_STALE_LOSS',
    preliminaryReport: {
      generatedAt: '2026-09-10T08:30:00Z',
      breakPointType: 'WAREHOUSE_STALE_LOSS',
      breakPointDescription:
        'Đơn hàng có vết quét SCAN_INBOUND nhận kiện tại Hub Trung Chuyển Đà Nẵng lúc 02:15 ngày 07/09. Sau hơn 72 giờ không phát sinh bất kỳ vết quét xuất Outbound, không được đóng vào bao tải nào để chuyển tiếp đi Cần Thơ.',
      suspectPartyType: 'TRANSIT_HUB',
      suspectPartyCode: 'DN01',
      suspectPartyName: 'Hub Trung Chuyển Đà Nẵng (DN01)',
      confidenceScorePercent: 92,
      suggestedRootCause: 'WAREHOUSE_INVENTORY_LOSS',
      suggestedCompensationAmount: 18500000,
      supportingEvidences: [
        'Vết quét Inbound cửa nhập số 2 ghi nhận lúc 02:15 07/09 (Thủ kho Nguyễn Tấn Dũng).',
        'Biên bản bàn giao xe tuyến 29C-441.20 đã xác nhận đủ 45 bao tải.',
        'Hệ thống WMS không ghi nhận vị trí ô kệ lưu kho sau khi qua băng chuyền.',
      ],
    },
    auditTrail: [
      {
        id: 's1',
        timestamp: '2026-09-06T10:00:00Z',
        locationCode: 'HN01',
        locationName: 'Hub Hà Nội 01',
        action: 'Tạo đơn & Cân kiện khai giá cao',
        operator: 'Nguyễn Thu Trang',
        recordedWeightKg: 0.85,
      },
      {
        id: 's2',
        timestamp: '2026-09-06T19:30:00Z',
        locationCode: 'HN01',
        locationName: 'Hub Hà Nội 01',
        action: 'Đóng bao tải liên tỉnh',
        operator: 'Vũ Đức Mạnh',
        bagCode: 'BAG-HN-SGN-110',
        sealNumber: 'SEAL-HN-9921',
      },
      {
        id: 's3',
        timestamp: '2026-09-07T02:15:00Z',
        locationCode: 'DN01',
        locationName: 'Hub Trung Chuyển Đà Nẵng',
        action: 'Quét nhận kiện tại cửa dỡ (SCAN_INBOUND)',
        operator: 'Nguyễn Tấn Dũng',
        bagCode: 'BAG-HN-SGN-110',
        recordedWeightKg: 0.85,
        isBreakPoint: true,
        anomalyNote: 'Vết quét hệ thống cuối cùng ghi nhận tại đây. Lưu kho >72h không có Outbound.',
      },
    ],
    disputeEvidences: [],
    updatedAt: '2026-09-11T10:00:00Z',
  },
  {
    id: 'inv-002',
    investigationCode: 'INV-202609-002',
    shipmentCode: 'NXS000842',
    customerName: 'TechZone Garmin Vietnam',
    customerPhone: '0977223344',
    originHubCode: 'HCM01',
    originHubName: 'Hub Hồ Chí Minh 01 (Quận 1)',
    destinationHubCode: 'HN01',
    destinationHubName: 'Hub Hà Nội 01 (Hoàn Kiếm)',
    declaredValue: 14200000,
    declaredWeightKg: 0.65,
    packageDescription: 'Đồng hồ thông minh thể thao Garmin Fenix 7 Pro Sapphire Solar',
    status: 'IN_HEARING',
    priority: 'CRITICAL',
    openedAt: '2026-09-10T14:00:00Z',
    hearingDeadlineAt: '2026-09-11T20:00:00Z', // Gần hết hạn
    breakPointType: 'LINEHAUL_IN_TRANSIT_LOSS',
    preliminaryReport: {
      generatedAt: '2026-09-10T14:45:00Z',
      breakPointType: 'LINEHAUL_IN_TRANSIT_LOSS',
      breakPointDescription:
        'Kiện hàng đóng trong bao tải BAG-SGN-HAN-092. Khi xe tải 29H-882.19 đến Hub HN01, kiểm tra đối chiếu trọng lượng bao tải hụt 0.55kg so với lúc xuất bến tại HCM. Dây chì seal sau thùng xe có vết cắt nối lại bằng dây kẽm.',
      suspectPartyType: 'LINEHAUL_FLEET',
      suspectPartyCode: 'TRIP-LINEHAUL-29H88219',
      suspectPartyName: 'Xe Tuyến Bắc Nam 29H-882.19 (Lái xe Đỗ Quốc Hùng)',
      confidenceScorePercent: 88,
      suggestedRootCause: 'TRUCK_SEAL_BREACH',
      suggestedCompensationAmount: 14200000,
      supportingEvidences: [
        'Biên bản bàn giao tại HCM01: Cân nặng bao tải 24.5kg, seal số S-8812 nguyên vẹn.',
        'Biên bản mở bao tại HN01: Cân nặng bao tải thực tế 23.95kg (hụt 0.55kg).',
        'Ảnh chụp seal cửa xe bị biến dạng có dấu vết can thiệp vật lý.',
      ],
    },
    auditTrail: [
      {
        id: 's4',
        timestamp: '2026-09-08T15:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Quét nhận kiện và niêm phong túi khí',
        operator: 'Trần Văn Kiên',
        recordedWeightKg: 0.65,
      },
      {
        id: 's5',
        timestamp: '2026-09-08T20:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Đóng bao tải và bàn giao xe tải 29H-882.19',
        operator: 'Đỗ Quốc Hùng (Lái xe)',
        bagCode: 'BAG-SGN-HAN-092',
        sealNumber: 'SEAL-HCM-4820',
        recordedWeightKg: 24.5,
      },
      {
        id: 's6',
        timestamp: '2026-09-10T13:30:00Z',
        locationCode: 'HN01',
        locationName: 'Hub Hà Nội 01',
        action: 'Dỡ hàng phát hiện seal đứt kẽm & hụt cân bao',
        operator: 'Lê Hoàng Long',
        bagCode: 'BAG-SGN-HAN-092',
        recordedWeightKg: 23.95,
        weightDeltaKg: 0.55,
        isBreakPoint: true,
        anomalyNote: 'Bao tải rạch góc, hụt 0.55kg. Mở bao thiếu kiện Garmin.',
      },
    ],
    disputeEvidences: [
      {
        id: 'dsp-01',
        submittedAt: '2026-09-11T09:00:00Z',
        submittedBy: 'Đỗ Quốc Hùng (Tài xế)',
        partyCode: 'TRIP-LINEHAUL-29H88219',
        partyName: 'Đội Xe Tuyến Bắc Nam',
        cctvVideoUrl: 'https://drive.google.com/file/d/demo-dashcam-fleet-29h/view',
        cctvTimestampRange: 'Đoạn đường đèo Hải Vân 03:00 - 04:30 ngày 09/09',
        notes:
          'Tài xế Hùng gửi camera hành trình xe tải: Xe chạy suốt tuyến không dừng đỗ trái phép, có qua trạm cân tải trọng hợp lệ. Nghi ngờ bao tải bị rách từ khâu quăng quật tại sàn kho HCM.',
        status: 'PENDING_REVIEW',
      },
    ],
    updatedAt: '2026-09-11T09:00:00Z',
  },
  {
    id: 'inv-003',
    investigationCode: 'INV-202609-003',
    shipmentCode: 'NXS000915',
    customerName: 'Sneaker Authentic Store',
    customerPhone: '0909112233',
    originHubCode: 'HCM01',
    originHubName: 'Hub Hồ Chí Minh 01 (Quận 1)',
    destinationHubCode: 'CT01',
    destinationHubName: 'Hub Cần Thơ (Ninh Kiều)',
    declaredValue: 6800000,
    declaredWeightKg: 1.4,
    packageDescription: 'Giày thể thao Nike Air Jordan 1 Retro High OG size 42',
    status: 'PRELIMINARY_REPORT',
    priority: 'HIGH',
    openedAt: '2026-09-11T07:30:00Z',
    hearingDeadlineAt: '2026-09-12T07:30:00Z',
    breakPointType: 'MISROUTED_SORTING',
    preliminaryReport: {
      generatedAt: '2026-09-11T08:00:00Z',
      breakPointType: 'MISROUTED_SORTING',
      breakPointDescription:
        'Đơn hàng phát sinh từ TP.HCM đi Cần Thơ (tuyến Miền Tây). Tuy nhiên tại sàn phân loại Hub Tân Bình HCM02, kiện hàng bị bắn mã nhầm vào máng trượt đi Hải Phòng (HP01). Vết quét SCAN_INBOUND cuối cùng phát hiện tại bưu cục Hải Phòng.',
      suspectPartyType: 'TRANSIT_HUB',
      suspectPartyCode: 'HCM02',
      suspectPartyName: 'Hub Trung Chuyển Tân Bình (HCM02)',
      confidenceScorePercent: 96,
      suggestedRootCause: 'ROUGH_HANDLING_STACKING',
      suggestedCompensationAmount: 6800000,
      supportingEvidences: [
        'Vết quét Inbound lúc 22:00 ngày 10/09 tại sàn tự động HCM02.',
        'Mã bao gán trên hệ thống nhầm sang BAG-SGN-HPH-012.',
        'Kiện hàng quét xuất hiện tại HP01 lúc 06:45 sáng nay cách 1.800km.',
      ],
    },
    auditTrail: [
      {
        id: 's7',
        timestamp: '2026-09-10T16:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Nhận kiện gửi đi Cần Thơ',
        operator: 'Phan Thị Mai',
        recordedWeightKg: 1.4,
      },
      {
        id: 's8',
        timestamp: '2026-09-10T22:00:00Z',
        locationCode: 'HCM02',
        locationName: 'Hub Tân Bình (TP.HCM)',
        action: 'Phân loại tự động trên băng tải',
        operator: 'Hệ thống DWS Matrix 02',
        isBreakPoint: true,
        anomalyNote: 'Phân loại sai máng trượt: Đơn Cần Thơ bị bắn nhầm vào bao tải Hải Phòng.',
      },
      {
        id: 's9',
        timestamp: '2026-09-11T06:45:00Z',
        locationCode: 'HP01',
        locationName: 'Hub Hải Phòng 01',
        action: 'Mở bao dỡ hàng phát hiện đơn lạc tuyến',
        operator: 'Nguyễn Văn Đạt',
        bagCode: 'BAG-SGN-HPH-012',
      },
    ],
    disputeEvidences: [],
    updatedAt: '2026-09-11T08:00:00Z',
  },
  {
    id: 'inv-004',
    investigationCode: 'INV-202609-004',
    shipmentCode: 'NXS001024',
    customerName: 'Sulwhasoo Vietnam Flagship',
    customerPhone: '0933557799',
    originHubCode: 'HN01',
    originHubName: 'Hub Hà Nội 01',
    destinationHubCode: 'HN02',
    destinationHubName: 'Bưu cục Hà Đông (Hà Nội)',
    declaredValue: 5200000,
    declaredWeightKg: 0.9,
    packageDescription: 'Bộ tinh chất dưỡng da chống lão hóa Sulwhasoo First Care',
    status: 'IN_HEARING',
    priority: 'HIGH',
    openedAt: '2026-09-11T09:00:00Z',
    hearingDeadlineAt: '2026-09-12T09:00:00Z',
    breakPointType: 'LAST_MILE_UNACCOUNTED',
    preliminaryReport: {
      generatedAt: '2026-09-11T09:30:00Z',
      breakPointType: 'LAST_MILE_UNACCOUNTED',
      breakPointDescription:
        'Kiện hàng đã xuất kho giao cho bưu tá Vũ Trọng Phụng lúc 08:30 sáng. Hết ca phát 18:30 không có ghi nhận giao thành công, không có cập nhật lý do thất bại (NDR), không bàn giao trả lại hàng về kho bưu cục.',
      suspectPartyType: 'DELIVERY_HUB',
      suspectPartyCode: 'COURIER-HN-088',
      suspectPartyName: 'Bưu cục Hà Đông - Shipper Vũ Trọng Phụng',
      confidenceScorePercent: 90,
      suggestedRootCause: 'COURIER_TRANSIT_DROP',
      suggestedCompensationAmount: 5200000,
      supportingEvidences: [
        'Vết quét SCAN_ASSIGN_COURIER lúc 08:30 ngày 10/09 (NV Điều phối Đặng Tiến).',
        'Bưu tá Phụng đã bấm ký nhận trên App Mobile với 32 đơn trong ca.',
        'Hết ca kiểm kê 18:30 thủ kho xác nhận thiếu kiện này trên bàn hoàn.',
      ],
    },
    auditTrail: [
      {
        id: 's10',
        timestamp: '2026-09-10T07:15:00Z',
        locationCode: 'HN02',
        locationName: 'Bưu cục Hà Đông',
        action: 'Nhận hàng đến từ Hub trung tâm',
        operator: 'Hoàng Văn Bách',
        recordedWeightKg: 0.9,
      },
      {
        id: 's11',
        timestamp: '2026-09-10T08:30:00Z',
        locationCode: 'HN02',
        locationName: 'Bưu cục Hà Đông',
        action: 'Xuất kho giao bưu tá đi phát',
        operator: 'Vũ Trọng Phụng (Shipper)',
        isBreakPoint: true,
        anomalyNote: 'Đơn hàng bàn giao cho shipper nhưng hết ca không giao và không hoàn kho.',
      },
    ],
    disputeEvidences: [],
    updatedAt: '2026-09-11T09:30:00Z',
  },
  {
    id: 'inv-005',
    investigationCode: 'INV-202609-005',
    shipmentCode: 'NXS001150',
    customerName: 'Camera Pro Shop Danang',
    customerPhone: '0944668800',
    originHubCode: 'DN01',
    originHubName: 'Hub Đà Nẵng',
    destinationHubCode: 'HCM01',
    destinationHubName: 'Hub HCM 01',
    declaredValue: 22000000,
    declaredWeightKg: 1.8,
    packageDescription: 'Body máy ảnh Canon EOS R6 Mark II',
    status: 'RESOLVED_FOUND',
    priority: 'CRITICAL',
    openedAt: '2026-09-09T10:00:00Z',
    closedAt: '2026-09-10T15:00:00Z',
    breakPointType: 'WAREHOUSE_STALE_LOSS',
    preliminaryReport: {
      generatedAt: '2026-09-09T10:30:00Z',
      breakPointType: 'WAREHOUSE_STALE_LOSS',
      breakPointDescription:
        'Kiện hàng quét Inbound lúc 18:00 ngày 08/09 tại HCM01 nhưng sau 24h không thấy trên xe phát.',
      suspectPartyType: 'DELIVERY_HUB',
      suspectPartyCode: 'HCM01',
      suspectPartyName: 'Hub Hồ Chí Minh 01',
      confidenceScorePercent: 85,
      suggestedRootCause: 'WAREHOUSE_INVENTORY_LOSS',
      suggestedCompensationAmount: 22000000,
      supportingEvidences: [
        'Vết quét Inbound cửa số 3 ghi nhận 18:00 08/09.',
      ],
    },
    auditTrail: [
      {
        id: 's12',
        timestamp: '2026-09-08T18:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Quét nhận hàng đến (SCAN_INBOUND)',
        operator: 'Vũ Đình Toàn',
        recordedWeightKg: 1.8,
      },
      {
        id: 's13',
        timestamp: '2026-09-10T14:45:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Trích xuất CCTV và tìm thấy kiện rơi sau kệ Pallet số 4',
        operator: 'Phạm Văn Nam (Thủ kho Trưởng)',
        anomalyNote: 'Đã tìm thấy hàng nguyên seal, tiếp tục xuất tuyến giao cho khách.',
      },
    ],
    disputeEvidences: [],
    foundLocation: 'Sau chân kệ Pallet Khu vực E4 (Hub HCM 01)',
    resolutionNote:
      'Đã trích xuất camera bàn phân loại lúc 18:12 ngày 08/09: phát hiện kiện trượt rơi xuống kẽ hở chân pallet. Đã thu hồi hàng nguyên vẹn 100%, hủy cảnh báo thất lạc, tiết kiệm 22.000.000 đ tiền bồi hoàn.',
    updatedAt: '2026-09-10T15:00:00Z',
  },
];

export function readInvestigations(): InvestigationCase[] {
  if (typeof window === 'undefined') {
    return SEED_INVESTIGATIONS;
  }
  try {
    const raw = window.localStorage.getItem(INVESTIGATION_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(INVESTIGATION_STORAGE_KEY, JSON.stringify(SEED_INVESTIGATIONS));
      return SEED_INVESTIGATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_INVESTIGATIONS;
  } catch {
    return SEED_INVESTIGATIONS;
  }
}

export function writeInvestigations(cases: InvestigationCase[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(INVESTIGATION_STORAGE_KEY, JSON.stringify(cases));
  } catch (error) {
    console.error('Failed to save investigations to localStorage', error);
  }
}

export function submitDisputeEvidence(
  investigationId: string,
  evidence: {
    submittedBy: string;
    partyCode: string;
    partyName: string;
    cctvVideoUrl?: string;
    cctvTimestampRange?: string;
    handoverSlipUrl?: string;
    notes: string;
  },
): InvestigationCase[] {
  const list = readInvestigations();
  const index = list.findIndex((c) => c.id === investigationId);
  if (index === -1) return list;

  const newEvidence: DisputeEvidence = {
    id: `dsp-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    submittedBy: evidence.submittedBy,
    partyCode: evidence.partyCode,
    partyName: evidence.partyName,
    cctvVideoUrl: evidence.cctvVideoUrl,
    cctvTimestampRange: evidence.cctvTimestampRange,
    handoverSlipUrl: evidence.handoverSlipUrl,
    notes: evidence.notes,
    status: 'PENDING_REVIEW',
  };

  list[index] = {
    ...list[index],
    disputeEvidences: [...list[index].disputeEvidences, newEvidence],
    updatedAt: new Date().toISOString(),
  };

  writeInvestigations(list);
  return list;
}

export function resolveAsFound(
  investigationId: string,
  input: {
    foundLocation: string;
    resolutionNote: string;
    operator: string;
  },
): InvestigationCase[] {
  const list = readInvestigations();
  const index = list.findIndex((c) => c.id === investigationId);
  if (index === -1) return list;

  const target = list[index];
  const now = new Date().toISOString();

  const auditLog: InvestigationAuditScan = {
    id: `found-${Date.now()}`,
    timestamp: now,
    locationCode: target.destinationHubCode || target.originHubCode,
    locationName: target.destinationHubName || target.originHubName,
    action: `Đã tìm thấy hàng thất lạc tại: ${input.foundLocation}`,
    operator: input.operator,
    anomalyNote: input.resolutionNote,
  };

  list[index] = {
    ...target,
    status: 'RESOLVED_FOUND',
    foundLocation: input.foundLocation,
    resolutionNote: input.resolutionNote,
    closedAt: now,
    auditTrail: [...target.auditTrail, auditLog],
    updatedAt: now,
  };

  writeInvestigations(list);
  return list;
}

export function extendHearingDeadline(investigationId: string, hours = 12): InvestigationCase[] {
  const list = readInvestigations();
  const index = list.findIndex((c) => c.id === investigationId);
  if (index === -1) return list;

  const currentDeadline = new Date(list[index].hearingDeadlineAt || Date.now());
  currentDeadline.setHours(currentDeadline.getHours() + hours);

  list[index] = {
    ...list[index],
    hearingDeadlineAt: currentDeadline.toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeInvestigations(list);
  return list;
}

export function escalateToCompensationClaim(
  investigationId: string,
  input: {
    adjudicator: string;
    finalNotes: string;
  },
): { updatedInvestigations: InvestigationCase[]; createdClaim: CompensationClaim } {
  const list = readInvestigations();
  const index = list.findIndex((c) => c.id === investigationId);
  if (index === -1) {
    throw new Error('Investigation case not found');
  }

  const target = list[index];
  const now = new Date().toISOString();
  const claimCode = `CLM-202609-${String(Date.now()).slice(-3)}`;

  // Create corresponding compensation claim in Claims data layer
  const newClaim: CompensationClaim = {
    id: `clm-${Date.now()}`,
    claimCode,
    shipmentCode: target.shipmentCode,
    customerName: target.customerName,
    customerPhone: target.customerPhone,
    originHubCode: target.originHubCode,
    destinationHubCode: target.destinationHubCode,
    incidentType: 'LOST_IN_TRANSIT',
    incidentDate: target.openedAt.slice(0, 10),
    reportedAt: now,
    reportedBy: `${input.adjudicator} (Chuyển tiếp từ Điều tra ${target.investigationCode})`,
    declaredValue: target.declaredValue,
    codAmount: target.declaredValue,
    claimRequestedAmount: target.preliminaryReport.suggestedCompensationAmount,
    approvedCompensationAmount: target.preliminaryReport.suggestedCompensationAmount,
    penaltyAmount: target.preliminaryReport.suggestedCompensationAmount,
    status: 'LIABILITY_DETERMINED',
    responsibleParty: target.preliminaryReport.suspectPartyType,
    responsibleEntityCode: target.preliminaryReport.suspectPartyCode,
    responsibleEntityName: target.preliminaryReport.suspectPartyName,
    liabilityRatioPercent: 100,
    rootCause: target.preliminaryReport.suggestedRootCause,
    adjudicationNotes: `Chuyển tiếp từ kết luận điều tra ${target.investigationCode}. ${target.preliminaryReport.breakPointDescription} Ghi chú phán quyết: ${input.finalNotes}`,
    adjudicatedAt: now,
    adjudicatedBy: input.adjudicator,
    declaredWeightKg: target.declaredWeightKg,
    packageDescription: target.packageDescription,
    damageDescription: 'Kiện hàng thất lạc, kết thúc thời hạn giải trình không tìm thấy.',
    evidencePhotos: [],
    auditTrail: target.auditTrail.map((s) => ({
      timestamp: s.timestamp,
      locationCode: s.locationCode,
      locationName: s.locationName,
      action: s.action,
      operator: s.operator,
      note: s.anomalyNote,
    })),
    updatedAt: now,
  };

  const allClaims = readClaims();
  allClaims.unshift(newClaim);
  writeClaims(allClaims);

  // Update investigation case
  list[index] = {
    ...target,
    status: 'ESCALATED_TO_CLAIM',
    linkedClaimCode: claimCode,
    closedAt: now,
    resolutionNote: `Đã kết luận phán quyết trách nhiệm. Chuyển tiếp sang hồ sơ bồi thường ${claimCode}.`,
    updatedAt: now,
  };

  writeInvestigations(list);
  return { updatedInvestigations: list, createdClaim: newClaim };
}
