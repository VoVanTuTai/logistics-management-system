import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  ClaimStatus,
  CompensationClaim,
  HubClaimSummary,
  IncidentType,
  MonthlyLossTrendItem,
  ResponsiblePartyType,
  RootCauseCategory,
  RootCauseStatsItem,
} from './claims.types';

const CLAIMS_STORAGE_KEY = 'ops.claims.compensation.v2';

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  DAMAGED: 'Bể vỡ / Hư hỏng',
  LOST_IN_TRANSIT: 'Thất lạc / Mất kiện',
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING_INSPECTION: 'Chờ giám định',
  LIABILITY_DETERMINED: 'Đã quy trách nhiệm',
  APPROVED_COMPENSATION: 'Đã duyệt bồi thường',
  SETTLED: 'Đã khấu trừ & Hoàn tất',
  REJECTED: 'Từ chối đền bù',
};

export const RESPONSIBLE_PARTY_LABELS: Record<ResponsiblePartyType, string> = {
  ORIGIN_HUB: '🏢 Bưu cục gửi (Origin Hub)',
  LINEHAUL_FLEET: '🚛 Xe tuyến & Lái xe (Linehaul)',
  TRANSIT_HUB: '🏬 Hub trung chuyển (Sorting Hub)',
  DELIVERY_HUB: '🛵 Bưu cục phát & Shipper',
  INSURANCE_FORCE_MAJEURE: '🛡️ Bảo hiểm / Bất khả kháng',
  UNASSIGNED: '⏳ Chưa phân định',
};

export const ROOT_CAUSE_LABELS: Record<RootCauseCategory, string> = {
  PACKAGING_SOP_VIOLATION: 'Đóng gói sai quy chuẩn SOP (Thiếu xốp/chống sốc)',
  ROUGH_HANDLING_STACKING: 'Xếp dỡ va đập / Chèn lót ẩu trên xe',
  TRUCK_SEAL_BREACH: 'Đứt kẹp chì Seal / Rách bao tải dọc đường',
  WAREHOUSE_INVENTORY_LOSS: 'Thất lạc trong kho trung chuyển',
  COURIER_TRANSIT_DROP: 'Bưu tá đánh rơi / va quệt lúc đi phát',
  FORCE_MAJEURE_ACCIDENT: 'Tai nạn giao thông / Thiên tai bất khả kháng',
};

const SEED_CLAIMS: CompensationClaim[] = [
  {
    // Ô Ma trận: Bể vỡ + Đóng gói đạt SOP + Không BH → Đền 4x cước
    id: 'clm-001',
    claimCode: 'CLM-202609-001',
    shipmentCode: 'NXS000108',
    customerName: 'Gốm Sứ Mỹ Nghệ Bát Tràng',
    customerPhone: '0912345678',
    originHubCode: 'HN01',
    destinationHubCode: 'HCM01',
    incidentType: 'DAMAGED',
    incidentDate: '2026-09-08',
    reportedAt: '2026-09-08T14:20:00Z',
    reportedBy: 'Phạm Văn Nam (Thủ kho HCM01)',
    declaredValue: 2800000,
    codAmount: 2800000,
    claimRequestedAmount: 2800000,
    approvedCompensationAmount: 2800000,
    penaltyAmount: 2800000,
    status: 'SETTLED',
    responsibleParty: 'ORIGIN_HUB',
    responsibleEntityCode: 'HN01',
    responsibleEntityName: 'Bưu cục Hà Nội 01 (Hoàn Kiếm)',
    liabilityRatioPercent: 100,
    rootCause: 'PACKAGING_SOP_VIOLATION',
    adjudicationNotes:
      'Gốm sứ vỡ vụn khi mở bao. Kiểm tra ảnh nhận hàng tại quầy HN01: Nhân viên nhận hàng chỉ bọc 1 lớp màng co PE mỏng, không có xốp khí nổ Bubble Wrap 5 lớp theo SOP đóng gói dễ vỡ. Quy lỗi bưu cục gửi HN01 chịu 100%.',
    adjudicatedAt: '2026-09-09T09:15:00Z',
    adjudicatedBy: 'Trần Minh Tuấn (QA Lead)',
    isFragile: true,
    insuranceTier: 'NONE',
    insuranceFee: 0,
    packagingWaiver: false,
    shippingFee: 30000,
    declaredWeightKg: 1.8,
    arrivalWeightKg: 1.8,
    weightDiscrepancyKg: 0,
    packageDescription: 'Bộ ấm chén men hỏa biến cao cấp',
    damageDescription: 'Bình trà và 4 chén nứt vỡ toàn bộ thành nhiều mảnh',
    evidencePhotos: [
      {
        id: 'p1',
        label: 'Ngoại quan thùng khi dỡ bao',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-08T14:10:00Z',
        takenBy: 'Phạm Văn Nam',
      },
      {
        id: 'p2',
        label: 'Sản phẩm gốm sứ vỡ vụn bên trong',
        url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-08T14:12:00Z',
        takenBy: 'Phạm Văn Nam',
      },
      {
        id: 'p3',
        label: 'Tem vận đơn và nhãn bao tải',
        url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-08T14:15:00Z',
        takenBy: 'Phạm Văn Nam',
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-09-06T10:00:00Z',
        locationCode: 'HN01',
        locationName: 'Bưu cục Hà Nội 01',
        action: 'Tạo đơn và nhận hàng tại quầy',
        operator: 'Nguyễn Thu Trang (NV Quầy)',
        note: 'Đóng gói túi PE',
      },
      {
        timestamp: '2026-09-06T19:30:00Z',
        locationCode: 'HN01',
        locationName: 'Bưu cục Hà Nội 01',
        action: 'Đóng bao tải BAG-HN-SGN-014',
        operator: 'Vũ Đức Mạnh',
        note: 'Niêm phong kẹp chì seal S-9921',
      },
      {
        timestamp: '2026-09-08T14:05:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub Hồ Chí Minh 01',
        action: 'Mở bao tải kiểm hàng đến',
        operator: 'Phạm Văn Nam',
        note: 'Phát hiện tiếng lạo xạo, hộp móp, bên trong vỡ hoàn toàn',
      },
    ],
    merchantPaidAt: '2026-09-09T16:00:00Z',
    hubDeductedAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-09-10T11:00:00Z',
  },
  {
    // Ô Ma trận: Thất lạc + Có BH 100% → Đền 100% giá trị thực tế
    id: 'clm-002',
    claimCode: 'CLM-202609-002',
    shipmentCode: 'NXS000214',
    customerName: 'Thế Giới Công Nghệ Số HCMC',
    customerPhone: '0988776655',
    originHubCode: 'HCM01',
    destinationHubCode: 'HN01',
    incidentType: 'LOST_IN_TRANSIT',
    incidentDate: '2026-09-07',
    reportedAt: '2026-09-07T18:45:00Z',
    reportedBy: 'Lê Hoàng Long (Điều phối HN01)',
    declaredValue: 24500000,
    codAmount: 0,
    claimRequestedAmount: 24500000,
    approvedCompensationAmount: 24500000,
    penaltyAmount: 24500000,
    status: 'APPROVED_COMPENSATION',
    responsibleParty: 'LINEHAUL_FLEET',
    responsibleEntityCode: 'TRIP-LINEHAUL-29H88219',
    responsibleEntityName: 'Xe Tuyến Bắc Nam 29H-882.19 (Tài xế Đỗ Quốc Hùng)',
    liabilityRatioPercent: 100,
    rootCause: 'TRUCK_SEAL_BREACH',
    adjudicationNotes:
      'Đơn hàng điện thoại iPhone 15 Pro Max. Khi xe tải 29H-882.19 đến Hub Hà Nội 01, phát hiện kẹp chì Seal sau thùng xe bị đứt và nối lại bằng kẽm, bạt xe góc trái có vết rạch. Đối chiếu cân nặng bao BAG-SGN-HAN-088 hụt 0.45kg so với lúc xuất bến. Lập biên bản công an giao thông & quy lỗi đội xe tuyến Linehaul chịu 100%.',
    adjudicatedAt: '2026-09-08T10:30:00Z',
    adjudicatedBy: 'Hoàng Minh Châu (Trưởng Ban Giám Sát HQ)',
    isFragile: false,
    insuranceTier: 'COMPREHENSIVE_100',
    insuranceFee: 122500,
    packagingWaiver: false,
    shippingFee: 35000,
    declaredWeightKg: 0.55,
    arrivalWeightKg: 0.1,
    weightDiscrepancyKg: 0.45,
    packageDescription: 'Hộp điện thoại iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    damageDescription: 'Hộp rỗng ruột, chỉ còn lại sách hướng dẫn và que chọc sim',
    evidencePhotos: [
      {
        id: 'p4',
        label: 'Mã kẹp chì seal xe tải bị cắt nối lại',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-07T18:30:00Z',
        takenBy: 'Lê Hoàng Long',
      },
      {
        id: 'p5',
        label: 'Hộp điện thoại bị bóc seal rỗng ruột',
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-07T18:35:00Z',
        takenBy: 'Lê Hoàng Long',
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-09-05T15:20:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Quét nhận kiện hàng có khai giá cao',
        operator: 'Trần Văn Kiên',
        note: 'Cân nặng 0.55kg, dán tem niêm phong đỏ',
      },
      {
        timestamp: '2026-09-05T21:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Bàn giao xe tải 29H-882.19',
        operator: 'Đỗ Quốc Hùng (Lái xe)',
        note: 'Niêm phong kẹp chì xe SEAL-HCM-4820',
      },
      {
        timestamp: '2026-09-07T18:25:00Z',
        locationCode: 'HN01',
        locationName: 'Hub Hà Nội 01',
        action: 'Xe đến, phát hiện seal đứt kẽm nối',
        operator: 'Lê Hoàng Long',
        note: 'Mở bao phát hiện hộp rỗng 0.1kg',
      },
    ],
    merchantPaidAt: '2026-09-08T15:00:00Z',
    updatedAt: '2026-09-08T15:00:00Z',
  },
  {
    // Ô Ma trận: Bể vỡ + Đóng gói đạt SOP + Có BH 100% → Đền 100%
    id: 'clm-003',
    claimCode: 'CLM-202609-003',
    shipmentCode: 'NXS000305',
    customerName: 'Gia Dụng Thông Minh Sunhouse',
    customerPhone: '0977112233',
    originHubCode: 'HP01',
    destinationHubCode: 'HCM01',
    incidentType: 'DAMAGED',
    incidentDate: '2026-09-09',
    reportedAt: '2026-09-09T11:15:00Z',
    reportedBy: 'Đặng Tuấn Anh (Kho HCM01)',
    declaredValue: 1850000,
    codAmount: 1850000,
    claimRequestedAmount: 1850000,
    approvedCompensationAmount: 1850000,
    penaltyAmount: 1850000,
    status: 'LIABILITY_DETERMINED',
    responsibleParty: 'LINEHAUL_FLEET',
    responsibleEntityCode: 'FLEET-LINEHAUL-CENTRAL',
    responsibleEntityName: 'Đội Xếp Dỡ Trung Chuyển Xe Tuyến HP-HCM',
    liabilityRatioPercent: 100,
    rootCause: 'ROUGH_HANDLING_STACKING',
    adjudicationNotes:
      'Nồi chiên không dầu bị đè bẹp móp méo vỏ kim loại và gãy tay cầm. Đóng gói thùng carton xốp chuẩn của hãng. Kiểm tra thùng xe phát hiện kiện hàng bị xếp ở tầng đáy dưới 3 thùng phụ tùng máy bơm nặng 40kg. Quy lỗi đội bốc xếp xe tuyến vi phạm quy tắc chèn lót hàng.',
    adjudicatedAt: '2026-09-10T08:30:00Z',
    adjudicatedBy: 'Trần Minh Tuấn (QA Lead)',
    isFragile: true,
    insuranceTier: 'COMPREHENSIVE_100',
    insuranceFee: 9250,
    packagingWaiver: false,
    shippingFee: 28000,
    declaredWeightKg: 5.5,
    arrivalWeightKg: 5.5,
    weightDiscrepancyKg: 0,
    packageDescription: 'Nồi chiên không dầu điện tử 6L',
    damageDescription: 'Thùng móp nát, vỏ nồi kim loại biến dạng, gãy bảng điều khiển',
    evidencePhotos: [
      {
        id: 'p6',
        label: 'Thùng carton bị đè bẹp dúm',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-09T11:10:00Z',
        takenBy: 'Đặng Tuấn Anh',
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-09-07T09:00:00Z',
        locationCode: 'HP01',
        locationName: 'Bưu cục Hải Phòng 01',
        action: 'Tiếp nhận kiện hàng nguyên vẹn',
        operator: 'Nguyễn Văn Đạt',
      },
      {
        timestamp: '2026-09-09T11:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Dỡ hàng từ thùng xe tải',
        operator: 'Đặng Tuấn Anh',
        note: 'Kiện hàng nằm dưới chân các kiện máy bơm nặng',
      },
    ],
    updatedAt: '2026-09-10T08:30:00Z',
  },
  {
    // Ô Ma trận: Thất lạc + Không BH → Đền 4x cước
    id: 'clm-004',
    claimCode: 'CLM-202609-004',
    shipmentCode: 'NXS000412',
    customerName: 'Thời Trang Nam Aristino',
    customerPhone: '0903456789',
    originHubCode: 'HN01',
    destinationHubCode: 'CT01',
    incidentType: 'LOST_IN_TRANSIT',
    incidentDate: '2026-09-06',
    reportedAt: '2026-09-08T16:00:00Z',
    reportedBy: 'Hồ Trọng Nghĩa (CS Lead)',
    declaredValue: 3200000,
    codAmount: 3200000,
    claimRequestedAmount: 3200000,
    approvedCompensationAmount: 3200000,
    penaltyAmount: 3200000,
    status: 'SETTLED',
    responsibleParty: 'TRANSIT_HUB',
    responsibleEntityCode: 'DN01',
    responsibleEntityName: 'Hub Trung Chuyển Đà Nẵng (DN01)',
    liabilityRatioPercent: 100,
    rootCause: 'WAREHOUSE_INVENTORY_LOSS',
    adjudicationNotes:
      'Đơn hàng thời trang. Đã quét SCAN_INBOUND nhận kiện tại Hub Trung Chuyển Đà Nẵng lúc 02:15 ngày 06/09. Sau đó lưu kho quá 72 giờ không có vết quét xuất SCAN_OUTBOUND đi Cần Thơ. Đã rà soát camera không thấy trên băng tải. Quy lỗi Hub Trung Chuyển Đà Nẵng làm thất lạc hàng lưu kho.',
    adjudicatedAt: '2026-09-09T11:00:00Z',
    adjudicatedBy: 'Hoàng Minh Châu (Trưởng Ban Giám Sát HQ)',
    isFragile: false,
    insuranceTier: 'NONE',
    insuranceFee: 0,
    packagingWaiver: false,
    shippingFee: 32000,
    declaredWeightKg: 1.2,
    packageDescription: 'Kiện hàng 2 áo măng tô dạ nam cao cấp',
    damageDescription: 'Thất lạc hoàn toàn không tìm thấy dấu vết kiện hàng',
    evidencePhotos: [],
    auditTrail: [
      {
        timestamp: '2026-09-05T16:00:00Z',
        locationCode: 'HN01',
        locationName: 'Hub Hà Nội 01',
        action: 'Quét gửi hàng đi Cần Thơ',
        operator: 'Trần Văn Cường',
      },
      {
        timestamp: '2026-09-06T02:15:00Z',
        locationCode: 'DN01',
        locationName: 'Hub Trung Chuyển Đà Nẵng',
        action: 'Quét nhận hàng đến trung chuyển (SCAN_INBOUND)',
        operator: 'Nguyễn Tấn Dũng (Thủ kho ca đêm)',
        note: 'Vết quét hệ thống cuối cùng ghi nhận tại cửa nhập số 3',
      },
    ],
    merchantPaidAt: '2026-09-09T17:00:00Z',
    hubDeductedAt: '2026-09-10T09:00:00Z',
    updatedAt: '2026-09-10T09:00:00Z',
  },
  {
    // Ô Ma trận: Bể vỡ + Có BH 100% + Đóng gói SOP → Đền 100%
    id: 'clm-005',
    claimCode: 'CLM-202609-005',
    shipmentCode: 'NXS000520',
    customerName: 'Đồng Hồ Chính Hãng Seiko VN',
    customerPhone: '0944556677',
    originHubCode: 'HCM01',
    destinationHubCode: 'HCM01',
    incidentType: 'DAMAGED',
    incidentDate: '2026-09-10',
    reportedAt: '2026-09-10T15:30:00Z',
    reportedBy: 'Bùi Văn Hùng (Trưởng BC Bình Thạnh)',
    declaredValue: 5600000,
    codAmount: 5600000,
    claimRequestedAmount: 5600000,
    approvedCompensationAmount: 5600000,
    penaltyAmount: 5600000,
    status: 'LIABILITY_DETERMINED',
    responsibleParty: 'DELIVERY_HUB',
    responsibleEntityCode: 'COURIER-SGN-042',
    responsibleEntityName: 'Shipper Nguyễn Văn Lộc (Bưu cục HCM 01)',
    liabilityRatioPercent: 100,
    rootCause: 'COURIER_TRANSIT_DROP',
    adjudicationNotes:
      'Bưu tá Lộc đi giao hàng gặp trời mưa trượt ngã xe máy, thùng hàng rơi xuống đường va đập mạnh làm nứt vỡ kính đồng hồ Seiko. Shipper đã thành khẩn nhận lỗi và lập biên bản sự cố. Bưu cục phát HCM 01 và Shipper chịu 100% chi phí bồi thường.',
    adjudicatedAt: '2026-09-11T09:00:00Z',
    adjudicatedBy: 'Trần Minh Tuấn (QA Lead)',
    isFragile: true,
    insuranceTier: 'COMPREHENSIVE_100',
    insuranceFee: 28000,
    packagingWaiver: false,
    shippingFee: 25000,
    declaredWeightKg: 0.4,
    arrivalWeightKg: 0.4,
    weightDiscrepancyKg: 0,
    packageDescription: 'Đồng hồ cơ nam Seiko Presage kính Sapphire',
    damageDescription: 'Vỡ nát mặt kính, xước niềng kim loại',
    evidencePhotos: [
      {
        id: 'p7',
        label: 'Mặt kính đồng hồ bị nứt rạn',
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-10T15:20:00Z',
        takenBy: 'Bùi Văn Hùng',
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-09-10T08:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Xuất kho giao cho bưu tá Lộc',
        operator: 'Nguyễn Văn Lộc (Shipper)',
        note: 'Hàng nguyên vẹn',
      },
      {
        timestamp: '2026-09-10T14:45:00Z',
        locationCode: 'HCM01',
        locationName: 'Tuyến phát Phường 25 Bình Thạnh',
        action: 'Phát sinh sự cố trượt ngã xe',
        operator: 'Nguyễn Văn Lộc',
        note: 'Khách từ chối nhận vì hàng vỡ',
      },
    ],
    updatedAt: '2026-09-11T09:00:00Z',
  },
  {
    // Ô Ma trận: Bể vỡ + Miễn trừ đóng gói (packagingWaiver) → TỪ CHỐI BỒI THƯỜNG
    id: 'clm-006',
    claimCode: 'CLM-202609-006',
    shipmentCode: 'NXS000631',
    customerName: 'Linh Kiện Máy Tính Phong Vũ',
    customerPhone: '0933221100',
    originHubCode: 'HCM01',
    destinationHubCode: 'DN01',
    incidentType: 'DAMAGED',
    incidentDate: '2026-09-11',
    reportedAt: '2026-09-11T10:00:00Z',
    reportedBy: 'Mai Quốc Bảo (Kiểm hàng DN01)',
    declaredValue: 12000000,
    codAmount: 12000000,
    claimRequestedAmount: 12000000,
    approvedCompensationAmount: 0,
    penaltyAmount: 0,
    status: 'PENDING_INSPECTION',
    responsibleParty: 'UNASSIGNED',
    responsibleEntityCode: '',
    responsibleEntityName: 'Đang xác minh đối chiếu camera bàn dỡ',
    liabilityRatioPercent: 0,
    rootCause: 'ROUGH_HANDLING_STACKING',
    isFragile: true,
    insuranceTier: 'NONE',
    insuranceFee: 0,
    packagingWaiver: true,
    shippingFee: 45000,
    declaredWeightKg: 6.8,
    packageDescription: 'Màn hình máy tính đồ họa Dell Ultrasharp 27 inch',
    damageDescription: 'Thùng carton nứt góc, cắm điện màn hình chảy mực sọc ngang',
    evidencePhotos: [
      {
        id: 'p8',
        label: 'Màn hình cắm điện bị sọc chảy mực',
        url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        takenAt: '2026-09-11T10:05:00Z',
        takenBy: 'Mai Quốc Bảo',
      },
    ],
    auditTrail: [
      {
        timestamp: '2026-09-09T18:00:00Z',
        locationCode: 'HCM01',
        locationName: 'Hub HCM 01',
        action: 'Quét nhận kiện hàng dễ vỡ',
        operator: 'Vũ Đình Toàn',
      },
      {
        timestamp: '2026-09-11T09:50:00Z',
        locationCode: 'DN01',
        locationName: 'Hub Đà Nẵng',
        action: 'Mở bao dỡ hàng phát hiện cấn góc',
        operator: 'Mai Quốc Bảo',
      },
    ],
    updatedAt: '2026-09-11T10:00:00Z',
  },
];

export function readClaims(): CompensationClaim[] {
  if (typeof window === 'undefined') {
    return SEED_CLAIMS;
  }
  try {
    const raw = window.localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(SEED_CLAIMS));
      return SEED_CLAIMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_CLAIMS;
  } catch {
    return SEED_CLAIMS;
  }
}

export function writeClaims(claims: CompensationClaim[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
  } catch (error) {
    console.error('Failed to save claims to localStorage', error);
  }
}

export function adjudicateClaim(
  claimId: string,
  input: {
    responsibleParty: ResponsiblePartyType;
    responsibleEntityCode: string;
    responsibleEntityName: string;
    liabilityRatioPercent: number;
    rootCause: RootCauseCategory;
    approvedCompensationAmount: number;
    penaltyAmount: number;
    adjudicationNotes: string;
    adjudicatedBy: string;
  },
): CompensationClaim[] {
  const list = readClaims();
  const index = list.findIndex((c) => c.id === claimId);
  if (index === -1) {
    return list;
  }

  const updated: CompensationClaim = {
    ...list[index],
    responsibleParty: input.responsibleParty,
    responsibleEntityCode: input.responsibleEntityCode,
    responsibleEntityName: input.responsibleEntityName,
    liabilityRatioPercent: input.liabilityRatioPercent,
    rootCause: input.rootCause,
    approvedCompensationAmount: input.approvedCompensationAmount,
    penaltyAmount: input.penaltyAmount,
    adjudicationNotes: input.adjudicationNotes,
    adjudicatedBy: input.adjudicatedBy,
    adjudicatedAt: new Date().toISOString(),
    status: 'LIABILITY_DETERMINED',
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;
  writeClaims(list);
  return list;
}

export function approveCompensationPayment(claimId: string): CompensationClaim[] {
  const list = readClaims();
  const index = list.findIndex((c) => c.id === claimId);
  if (index === -1) {
    return list;
  }

  list[index] = {
    ...list[index],
    status: 'APPROVED_COMPENSATION',
    merchantPaidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeClaims(list);
  return list;
}

export function settleClaimDeduction(claimId: string): CompensationClaim[] {
  const list = readClaims();
  const index = list.findIndex((c) => c.id === claimId);
  if (index === -1) {
    return list;
  }

  list[index] = {
    ...list[index],
    status: 'SETTLED',
    hubDeductedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeClaims(list);
  return list;
}

export function calculateHubStatistics(claims: CompensationClaim[]): HubClaimSummary[] {
  const hubs = [
    { code: 'HN01', name: 'Hub Hà Nội 01 (Hoàn Kiếm)', zone: 'ZONE_NORTH', volume: 18450 },
    { code: 'HN02', name: 'Hub Hà Đông (Hà Nội)', zone: 'ZONE_NORTH', volume: 14200 },
    { code: 'HCM01', name: 'Hub Hồ Chí Minh 01 (Quận 1)', zone: 'ZONE_SOUTH', volume: 24800 },
    { code: 'HCM02', name: 'Hub Tân Bình (TP.HCM)', zone: 'ZONE_SOUTH', volume: 21500 },
    { code: 'DN01', name: 'Hub Đà Nẵng (Hải Châu)', zone: 'ZONE_CENTRAL', volume: 12600 },
    { code: 'HP01', name: 'Hub Hải Phòng (Lê Chân)', zone: 'ZONE_NORTH', volume: 9800 },
    { code: 'CT01', name: 'Hub Cần Thơ (Ninh Kiều)', zone: 'ZONE_SOUTH', volume: 8500 },
  ];

  return hubs.map((h) => {
    // Count incidents where this hub is origin or responsible
    const hubClaims = claims.filter(
      (c) => c.originHubCode === h.code || c.responsibleEntityCode === h.code,
    );

    const damagedCount = hubClaims.filter((c) => c.incidentType === 'DAMAGED').length;
    const lostCount = hubClaims.filter((c) => c.incidentType === 'LOST_IN_TRANSIT').length;
    const totalIncidentCount = damagedCount + lostCount;
    const totalCompensationCost = hubClaims.reduce(
      (sum, c) => sum + (c.approvedCompensationAmount || c.claimRequestedAmount || 0),
      0,
    );
    const penaltyAssignedAmount = hubClaims.reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);
    const penaltyRecoveredAmount = hubClaims
      .filter((c) => Boolean(c.hubDeductedAt))
      .reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);

    const rate = h.volume > 0 ? (totalIncidentCount / h.volume) * 100 : 0;
    const lossAndDamageRate = Number(rate.toFixed(3));

    let riskLevel: HubClaimSummary['riskLevel'] = 'LOW';
    if (lossAndDamageRate > 0.04 || totalCompensationCost > 10000000) {
      riskLevel = 'CRITICAL';
    } else if (lossAndDamageRate > 0.02 || totalCompensationCost > 5000000) {
      riskLevel = 'HIGH';
    } else if (lossAndDamageRate > 0.01) {
      riskLevel = 'MEDIUM';
    }

    // Determine top root cause for this hub
    const causeCounts: Record<string, number> = {};
    for (const c of hubClaims) {
      causeCounts[c.rootCause] = (causeCounts[c.rootCause] || 0) + 1;
    }
    const topCauseEntry = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0];
    const topRootCause = topCauseEntry
      ? ROOT_CAUSE_LABELS[topCauseEntry[0] as RootCauseCategory] || 'Hàng vỡ / thất lạc'
      : 'Không phát sinh';

    return {
      hubCode: h.code,
      hubName: h.name,
      zoneCode: h.zone,
      totalShipmentsHandled: h.volume,
      damagedCount,
      lostCount,
      totalIncidentCount,
      totalCompensationCost,
      penaltyAssignedAmount,
      penaltyRecoveredAmount,
      lossAndDamageRate,
      riskLevel,
      topRootCause,
    };
  });
}

export function calculateRootCauseBreakdown(claims: CompensationClaim[]): RootCauseStatsItem[] {
  const causes: Array<{ category: RootCauseCategory; label: string; color: string }> = [
    {
      category: 'PACKAGING_SOP_VIOLATION',
      label: 'Đóng gói sai quy chuẩn SOP',
      color: '#f43f5e',
    },
    {
      category: 'ROUGH_HANDLING_STACKING',
      label: 'Xếp dỡ va đập / Chèn lót ẩu',
      color: '#f59e0b',
    },
    {
      category: 'TRUCK_SEAL_BREACH',
      label: 'Đứt kẹp chì Seal / Mất trộm xe tải',
      color: '#ef4444',
    },
    {
      category: 'WAREHOUSE_INVENTORY_LOSS',
      label: 'Thất lạc kho trung chuyển',
      color: '#6366f1',
    },
    {
      category: 'COURIER_TRANSIT_DROP',
      label: 'Bưu tá đánh rơi lúc đi phát',
      color: '#0ea5e9',
    },
    {
      category: 'FORCE_MAJEURE_ACCIDENT',
      label: 'Bất khả kháng / Tai nạn',
      color: '#10b981',
    },
  ];

  const totalClaims = claims.length || 1;

  return causes.map((item) => {
    const matching = claims.filter((c) => c.rootCause === item.category);
    const count = matching.length;
    const totalCost = matching.reduce(
      (sum, c) => sum + (c.approvedCompensationAmount || c.claimRequestedAmount || 0),
      0,
    );
    const percentage = Number(((count / totalClaims) * 100).toFixed(1));

    return {
      category: item.category,
      label: item.label,
      count,
      totalCost,
      percentage,
      color: item.color,
    };
  });
}

export function calculateMonthlyTrend(): MonthlyLossTrendItem[] {
  return [
    { month: '04/2026', damagedCount: 14, lostCount: 5, totalCompensationCost: 38200000, lossRate: 0.048 },
    { month: '05/2026', damagedCount: 18, lostCount: 7, totalCompensationCost: 49500000, lossRate: 0.052 },
    { month: '06/2026', damagedCount: 12, lostCount: 4, totalCompensationCost: 31000000, lossRate: 0.039 },
    { month: '07/2026', damagedCount: 16, lostCount: 6, totalCompensationCost: 44200000, lossRate: 0.044 },
    { month: '08/2026', damagedCount: 11, lostCount: 3, totalCompensationCost: 28800000, lossRate: 0.035 },
    { month: '09/2026', damagedCount: 8, lostCount: 2, totalCompensationCost: 21600000, lossRate: 0.029 },
  ];
}

// -------------------------------------------------------------
// Real Backend API Client Functions (Gateway BFF -> shipment-service)
// -------------------------------------------------------------

export async function fetchClaimsApi(filters?: {
  search?: string;
  status?: string;
  incidentType?: string;
  responsibleParty?: string;
}): Promise<CompensationClaim[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.incidentType && filters.incidentType !== 'ALL') params.append('incidentType', filters.incidentType);
    if (filters?.responsibleParty && filters.responsibleParty !== 'ALL') params.append('responsibleParty', filters.responsibleParty);

    const queryString = params.toString();
    const url = queryString ? `${opsEndpoints.claims.list}?${queryString}` : opsEndpoints.claims.list;
    const items = await opsApiClient.request<CompensationClaim[]>(url);
    if (Array.isArray(items) && items.length > 0) {
      writeClaims(items);
      return items;
    }
  } catch (err) {
    console.warn('[claimsApi] fetchClaims failed, using local cache fallback', err);
  }
  return readClaims();
}

export async function createClaimApi(input: {
  shipmentCode: string;
  customerName?: string;
  customerPhone?: string;
  originHubCode: string;
  destinationHubCode: string;
  incidentType: IncidentType;
  declaredValue?: number;
  codAmount?: number;
  claimRequestedAmount?: number;
  reportedBy: string;
  declaredWeightKg?: number;
  packageDescription: string;
  damageDescription?: string;
}): Promise<CompensationClaim> {
  try {
    const created = await opsApiClient.request<CompensationClaim>(opsEndpoints.claims.create, {
      method: 'POST',
      body: input,
    });
    const current = readClaims();
    writeClaims([created, ...current]);
    return created;
  } catch (err) {
    console.warn('[claimsApi] createClaim failed, falling back to local', err);
    const local = readClaims();
    const newClaim = {
      id: `clm-${Date.now()}`,
      claimCode: `CLM-202609-${String(Date.now()).slice(-3)}`,
      ...input,
      reportedAt: new Date().toISOString(),
      approvedCompensationAmount: 0,
      penaltyAmount: 0,
      status: 'PENDING_INSPECTION' as const,
      responsibleParty: 'UNASSIGNED' as const,
      responsibleEntityCode: '',
      responsibleEntityName: 'Chờ phân định giám định',
      liabilityRatioPercent: 0,
      rootCause: 'PACKAGING_SOP_VIOLATION' as const,
      evidencePhotos: [],
      auditTrail: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as CompensationClaim;
    writeClaims([newClaim, ...local]);
    return newClaim;
  }
}

export async function adjudicateClaimApi(
  id: string,
  input: {
    responsibleParty: ResponsiblePartyType;
    responsibleEntityCode?: string;
    responsibleEntityName?: string;
    liabilityRatioPercent: number;
    rootCause: RootCauseCategory;
    approvedCompensationAmount: number;
    penaltyAmount: number;
    adjudicationNotes?: string;
    adjudicatedBy: string;
  },
): Promise<CompensationClaim> {
  try {
    const updated = await opsApiClient.request<CompensationClaim>(opsEndpoints.claims.adjudicate(id), {
      method: 'POST',
      body: input,
    });
    const current = readClaims();
    writeClaims(current.map((c) => (c.id === id ? updated : c)));
    return updated;
  } catch (err) {
    console.warn('[claimsApi] adjudicateClaim failed, falling back to local', err);
    adjudicateClaim(id, {
      ...input,
      responsibleEntityCode: input.responsibleEntityCode || '',
      responsibleEntityName: input.responsibleEntityName || '',
      adjudicationNotes: input.adjudicationNotes || '',
    });
    const item = readClaims().find((c) => c.id === id);
    if (!item) throw err;
    return item;
  }
}

export async function approveCompensationApi(id: string): Promise<CompensationClaim> {
  try {
    const updated = await opsApiClient.request<CompensationClaim>(opsEndpoints.claims.approvePayment(id), {
      method: 'POST',
    });
    const current = readClaims();
    writeClaims(current.map((c) => (c.id === id ? updated : c)));
    return updated;
  } catch (err) {
    console.warn('[claimsApi] approveCompensation failed, falling back to local', err);
    approveCompensationPayment(id);
    const item = readClaims().find((c) => c.id === id);
    if (!item) throw err;
    return item;
  }
}

export async function settleDeductionApi(id: string): Promise<CompensationClaim> {
  try {
    const updated = await opsApiClient.request<CompensationClaim>(opsEndpoints.claims.settleDeduction(id), {
      method: 'POST',
    });
    const current = readClaims();
    writeClaims(current.map((c) => (c.id === id ? updated : c)));
    return updated;
  } catch (err) {
    console.warn('[claimsApi] settleDeduction failed, falling back to local', err);
    settleClaimDeduction(id);
    const item = readClaims().find((c) => c.id === id);
    if (!item) throw err;
    return item;
  }
}

