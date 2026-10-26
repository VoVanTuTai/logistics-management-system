import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Gavel,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Package,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  UserCheck,
  X,
} from 'lucide-react';

import {
  CLAIM_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  RESPONSIBLE_PARTY_LABELS,
  ROOT_CAUSE_LABELS,
  adjudicateClaimApi,
  approveCompensationApi,
  createClaimApi,
  fetchClaimsApi,
  readClaims,
  settleDeductionApi,
} from '../../../../features/claims/claims.data';
import type {
  ClaimStatus,
  CompensationClaim,
  IncidentType,
  ResponsiblePartyType,
  RootCauseCategory,
} from '../../../../features/claims/claims.types';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { ClaimsLiabilityTable, exportClaimsToExcel } from './ClaimsLiabilityTable';
import { HubCompensationStatisticsPage } from './HubCompensationStatisticsPage';
import './ClaimsLiabilityManagementPage.css';

function formatCurrency(amount: number | null | undefined): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount ?? 0))} đ`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
}

// =============================================
// MA TRẬN PHÂN ĐỊNH TRÁCH NHIỆM BỒI THƯỜNG 4 Ô
// =============================================
type MatrixCell =
  | 'INSURED_LOST'       // Thất lạc + Có BH → Đền 100%
  | 'UNINSURED_LOST'     // Thất lạc + Không BH → Đền 4x cước
  | 'INSURED_DAMAGED_SOP' // Bể vỡ, SOP đạt, Có BH → Đền 100%
  | 'UNINSURED_DAMAGED_SOP' // Bể vỡ, SOP đạt, Không BH → Đền 4x cước
  | 'WAIVER_DAMAGED';     // Bể vỡ + Miễn trừ đóng gói → Từ chối

interface MatrixVerdict {
  verdictLabel: string;
  verdictExplanation: string;
  suggestedAmount: number;
  matrixCell: MatrixCell;
  legalBasis: string;
  isRejected: boolean;
}

const FOUR_X_FREIGHT_CAP = 1000000; // Trần tối đa 4x cước: 1.000.000đ

function computeMatrixVerdict(claim: CompensationClaim): MatrixVerdict {
  const hasInsurance = claim.insuranceTier === 'COMPREHENSIVE_100';
  const hasWaiver = claim.packagingWaiver === true;
  const isDamaged = claim.incidentType === 'DAMAGED';
  const isLost = claim.incidentType === 'LOST_IN_TRANSIT';
  const shippingFee = claim.shippingFee || 30000;
  const fourXFreight = Math.min(shippingFee * 4, FOUR_X_FREIGHT_CAP);

  // Ô 1: Bể vỡ + Có Biên bản miễn trừ → TỪ CHỐI
  if (isDamaged && hasWaiver) {
    return {
      verdictLabel: 'Từ chối bồi thường bể vỡ',
      verdictExplanation:
        'Khách hàng đã ký Biên bản Miễn trừ trách nhiệm bể vỡ do tự đóng gói (packagingWaiver). ' +
        'Thùng ngoài nguyên vẹn, hàng vỡ bên trong thuộc lỗi đóng gói của người gửi.',
      suggestedAmount: 0,
      matrixCell: 'WAIVER_DAMAGED',
      legalBasis: 'Điều 24 Luật Bưu chính 2010 - Miễn trừ trách nhiệm do lỗi người gửi đóng gói không đúng quy chuẩn',
      isRejected: true,
    };
  }

  // Ô 2: Thất lạc/Mất + Có BH → Đền 100%
  if (isLost && hasInsurance) {
    return {
      verdictLabel: 'Đền 100% giá trị thực tế (theo hóa đơn)',
      verdictExplanation:
        'Kiện hàng thất lạc/mất nguyên kiện. Đã tham gia Gói Bảo hiểm Toàn diện 100%. ' +
        'Bồi thường đúng giá trị khai báo, yêu cầu khách xuất trình hóa đơn mua hàng.',
      suggestedAmount: claim.declaredValue,
      matrixCell: 'INSURED_LOST',
      legalBasis: 'Điều 25 Luật Bưu chính 2010 - Bồi thường theo giá trị khai giá đã đóng phí bảo hiểm',
      isRejected: false,
    };
  }

  // Ô 3: Thất lạc + Không BH → Đền 4x cước
  if (isLost && !hasInsurance) {
    return {
      verdictLabel: `Đền 04 lần cước vận chuyển (${formatCurrency(fourXFreight)})`,
      verdictExplanation:
        'Kiện hàng thất lạc/mất. Không tham gia dịch vụ khai giá bảo hiểm. ' +
        `Mức bồi thường tối đa: 4 × ${formatCurrency(shippingFee)} = ${formatCurrency(fourXFreight)}, trần 1.000.000đ.`,
      suggestedAmount: fourXFreight,
      matrixCell: 'UNINSURED_LOST',
      legalBasis: 'Điều 25 Khoản 2 Luật Bưu chính 2010 - Hạn mức luật định cho bưu gửi không khai giá',
      isRejected: false,
    };
  }

  // Ô 4: Bể vỡ + Đóng gói đạt SOP + Có BH → Đền 100%
  if (isDamaged && hasInsurance) {
    return {
      verdictLabel: 'Đền 100% giá trị thực tế (theo hóa đơn)',
      verdictExplanation:
        'Hàng bể vỡ/hư hỏng dù đã đóng gói đạt chuẩn SOP. Đã tham gia Gói Bảo hiểm Toàn diện 100%. ' +
        'Bồi thường theo giá trị thiệt hại thực tế, tối đa bằng giá khai báo.',
      suggestedAmount: claim.declaredValue,
      matrixCell: 'INSURED_DAMAGED_SOP',
      legalBasis: 'Điều 25 Luật Bưu chính 2010 - Bồi thường theo giá trị khai giá đã đóng phí bảo hiểm',
      isRejected: false,
    };
  }

  // Ô 5: Bể vỡ + Đóng gói đạt SOP + Không BH → Đền 4x cước
  return {
    verdictLabel: `Đền 04 lần cước vận chuyển (${formatCurrency(fourXFreight)})`,
    verdictExplanation:
      'Hàng bể vỡ/hư hỏng, đóng gói đạt chuẩn SOP. Không tham gia dịch vụ khai giá bảo hiểm. ' +
      `Mức bồi thường: 4 × ${formatCurrency(shippingFee)} = ${formatCurrency(fourXFreight)}, trần 1.000.000đ.`,
    suggestedAmount: fourXFreight,
    matrixCell: 'UNINSURED_DAMAGED_SOP',
    legalBasis: 'Điều 25 Khoản 2 Luật Bưu chính 2010 - Hạn mức luật định cho bưu gửi không khai giá',
    isRejected: false,
  };
}

type TabType = 'ALL' | 'PENDING' | 'ADJUDICATED' | 'SETTLED';

export function ClaimsLiabilityManagementPage(): React.JSX.Element {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') === 'statistics' ? 'statistics' : 'liability';
    } catch {
      return 'liability';
    }
  });

  const handleSwitchTab = (tab: string) => {
    setCurrentTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Claims state initialized with local cache, updated with real DB via API
  const [claims, setClaims] = useState<CompensationClaim[]>(() => readClaims());
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

  // Toggle for operational workflow explanation banner
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [filterIncident, setFilterIncident] = useState<string>('ALL');
  const [filterParty, setFilterParty] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedClaim, setSelectedClaim] = useState<CompensationClaim | null>(null);
  const [isAdjudicateMode, setIsAdjudicateMode] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Adjudication Form State
  const [adjParty, setAdjParty] = useState<ResponsiblePartyType>('ORIGIN_HUB');
  const [adjEntityCode, setAdjEntityCode] = useState('');
  const [adjEntityName, setAdjEntityName] = useState('');
  const [adjRatio, setAdjRatio] = useState<number>(100);
  const [adjRootCause, setAdjRootCause] = useState<RootCauseCategory>('PACKAGING_SOP_VIOLATION');
  const [adjCompensation, setAdjCompensation] = useState<number>(0);
  const [adjPenalty, setAdjPenalty] = useState<number>(0);
  const [adjNotes, setAdjNotes] = useState('');
  const [isSavingAdj, setIsSavingAdj] = useState(false);

  // New Claim Form State
  const [newShipmentCode, setNewShipmentCode] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newOriginHub, setNewOriginHub] = useState('00101W001');
  const [newDestHub, setNewDestHub] = useState('07901W001');
  const [newIncidentType, setNewIncidentType] = useState<IncidentType>('DAMAGED');
  const [newDeclaredValue, setNewDeclaredValue] = useState<number>(1500000);
  const [newPackageDesc, setNewPackageDesc] = useState('');
  const [newDamageDesc, setNewDamageDesc] = useState('');
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);

  // Load real data from API on mount
  const loadClaimsData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClaimsApi();
      setClaims(data);
    } catch (err) {
      console.warn('Failed to load claims from backend', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaimsData();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = claims.length;
    const pending = claims.filter(
      (c) => c.status === 'PENDING_INSPECTION' || c.status === 'DRAFT',
    ).length;
    const determined = claims.filter(
      (c) => c.status === 'LIABILITY_DETERMINED' || c.status === 'APPROVED_COMPENSATION',
    ).length;
    const settledCount = claims.filter((c) => c.status === 'SETTLED').length;
    const settledAmount = claims
      .filter((c) => c.status === 'SETTLED' || c.status === 'APPROVED_COMPENSATION')
      .reduce((sum, c) => sum + (c.approvedCompensationAmount || 0), 0);

    return { total, pending, determined, settledCount, settledAmount };
  }, [claims]);

  // Tab & Keyword Filtering
  const filteredClaims = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return claims.filter((c) => {
      // Tab filter
      if (activeTab === 'PENDING' && c.status !== 'PENDING_INSPECTION' && c.status !== 'DRAFT') {
        return false;
      }
      if (
        activeTab === 'ADJUDICATED' &&
        c.status !== 'LIABILITY_DETERMINED' &&
        c.status !== 'APPROVED_COMPENSATION'
      ) {
        return false;
      }
      if (activeTab === 'SETTLED' && c.status !== 'SETTLED') {
        return false;
      }

      // Keyword filter
      const matchKeyword =
        !term ||
        c.claimCode.toLowerCase().includes(term) ||
        c.shipmentCode.toLowerCase().includes(term) ||
        (c.customerName && c.customerName.toLowerCase().includes(term)) ||
        (c.responsibleEntityName && c.responsibleEntityName.toLowerCase().includes(term));

      // Dropdown filters
      const matchIncident = filterIncident === 'ALL' || c.incidentType === filterIncident;
      const matchParty = filterParty === 'ALL' || c.responsibleParty === filterParty;

      return matchKeyword && matchIncident && matchParty;
    });
  }, [claims, activeTab, keyword, filterIncident, filterParty]);

  const openInspection = (claim: CompensationClaim, editMode = false) => {
    setSelectedClaim(claim);
    setIsAdjudicateMode(editMode);
    setAdjParty(claim.responsibleParty === 'UNASSIGNED' ? 'ORIGIN_HUB' : claim.responsibleParty);
    setAdjEntityCode(claim.responsibleEntityCode || claim.originHubCode);
    setAdjEntityName(claim.responsibleEntityName || `Hub ${claim.originHubCode}`);
    setAdjRatio(claim.liabilityRatioPercent || 100);
    setAdjRootCause(claim.rootCause || 'PACKAGING_SOP_VIOLATION');
    setAdjCompensation(claim.approvedCompensationAmount || claim.claimRequestedAmount || 0);
    setAdjPenalty(claim.penaltyAmount || claim.claimRequestedAmount || 0);
    setAdjNotes(claim.adjudicationNotes || '');
  };

  const handleSaveAdjudication = async () => {
    if (!selectedClaim) return;
    setIsSavingAdj(true);
    try {
      const updated = await adjudicateClaimApi(selectedClaim.id, {
        responsibleParty: adjParty,
        responsibleEntityCode: adjEntityCode.trim().toUpperCase(),
        responsibleEntityName: adjEntityName.trim(),
        liabilityRatioPercent: adjRatio,
        rootCause: adjRootCause,
        approvedCompensationAmount: adjCompensation,
        penaltyAmount: adjPenalty,
        adjudicationNotes: adjNotes.trim(),
        adjudicatedBy: 'Hoàng Minh Châu (Trưởng Ban Giám Sát HQ)',
      });
      setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedClaim(updated);
      setIsAdjudicateMode(false);
      showFeedback('Đã lưu phán quyết quy trách nhiệm thành công vào cơ sở dữ liệu!');
    } catch (err) {
      alert('Không thể lưu phán quyết: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingAdj(false);
    }
  };

  const handleApprovePayment = async (claimId: string) => {
    try {
      const updated = await approveCompensationApi(claimId);
      setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedClaim?.id === claimId) setSelectedClaim(updated);
      showFeedback('Đã duyệt chi tiền bồi thường cho Shop / Khách gửi!');
    } catch (err) {
      alert('Lỗi duyệt bồi thường: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSettle = async (claimId: string) => {
    try {
      const updated = await settleDeductionApi(claimId);
      setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedClaim?.id === claimId) setSelectedClaim(updated);
      showFeedback('Đã ghi nhận khấu trừ chế tài & hoàn tất hồ sơ!');
    } catch (err) {
      alert('Lỗi khấu trừ: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Batch actions
  const handleBatchApprove = async (claimIds: string[]) => {
    try {
      await Promise.all(claimIds.map((id) => approveCompensationApi(id)));
      await loadClaimsData();
      showFeedback(`Đã duyệt chi tiền bồi thường cho ${claimIds.length} hồ sơ thành công!`);
    } catch (err) {
      alert('Lỗi duyệt chi hàng loạt: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleBatchSettle = async (claimIds: string[]) => {
    try {
      await Promise.all(claimIds.map((id) => settleDeductionApi(id)));
      await loadClaimsData();
      showFeedback(`Đã tất toán khấu trừ chế tài cho ${claimIds.length} hồ sơ thành công!`);
    } catch (err) {
      alert('Lỗi khấu trừ hàng loạt: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCreateNewClaim = async () => {
    if (!newShipmentCode.trim()) {
      alert('Vui lòng nhập mã vận đơn.');
      return;
    }
    setIsCreatingClaim(true);
    try {
      const newClaim = await createClaimApi({
        shipmentCode: newShipmentCode.trim().toUpperCase(),
        customerName: newCustomer.trim() || 'Khách hàng',
        customerPhone: newPhone.trim() || '---',
        originHubCode: newOriginHub,
        destinationHubCode: newDestHub,
        incidentType: newIncidentType,
        declaredValue: newDeclaredValue,
        codAmount: newDeclaredValue,
        claimRequestedAmount: newDeclaredValue,
        reportedBy: 'Điều phối viên ca trực HQ',
        declaredWeightKg: 1.0,
        packageDescription: newPackageDesc || 'Hàng hóa thương mại điện tử',
        damageDescription: newDamageDesc || 'Hàng hỏng móp méo trong trung chuyển',
      });
      setClaims((prev) => [newClaim, ...prev]);
      setIsNewModalOpen(false);
      setNewShipmentCode('');
      setNewCustomer('');
      setNewPhone('');
      setNewPackageDesc('');
      setNewDamageDesc('');
      showFeedback('Đã lập hồ sơ bồi thường mới thành công vào hệ thống!');
    } catch (err) {
      alert('Không thể tạo hồ sơ: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCreatingClaim(false);
    }
  };

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="claims-page">
      {/* Unified Tab Navigation Bar */}
      <div className="ops-unified-sub-tabs" role="tablist">
        <button
          type="button"
          className={`ops-unified-sub-tab-btn ${currentTab === 'liability' ? 'ops-unified-sub-tab-btn--active' : ''}`}
          onClick={() => handleSwitchTab('liability')}
        >
          <Scale size={15} />
          <span>Hồ sơ Bồi thường & Phân định</span>
        </button>
        <button
          type="button"
          className={`ops-unified-sub-tab-btn ${currentTab === 'statistics' ? 'ops-unified-sub-tab-btn--active' : ''}`}
          onClick={() => handleSwitchTab('statistics')}
        >
          <BarChart3 size={15} />
          <span>Thống kê Bồi thường Hub</span>
        </button>
      </div>

      {currentTab === 'statistics' ? (
        <HubCompensationStatisticsPage />
      ) : (
        <>
          {/* Toast Feedback */}
      {actionSuccessMsg && (
        <div className="claims-toast">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{actionSuccessMsg}</span>
          <button type="button" onClick={() => setActionSuccessMsg(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="claims-header">
        <div className="claims-header-left">
          <div className="claims-header-icon">
            <Scale size={20} />
          </div>
          <div>
            <h2 className="claims-header-title">
              Hồ sơ Bồi thường & Phân định Trách nhiệm
            </h2>
            <p className="claims-header-desc">
              Xử lý khiếu nại tổn thất, giám định quy lỗi bưu cục/xe tuyến, duyệt chi bồi thường cho Shop và khấu trừ chế tài theo Luật Bưu chính.
            </p>
          </div>
        </div>
        <div className="claims-header-actions">
          <button
            type="button"
            className="claims-btn claims-btn-subtle"
            onClick={loadClaimsData}
            disabled={isLoading}
            title="Tải lại dữ liệu từ Database"
          >
            <RefreshCw size={13} className={isLoading ? 'claims-spin' : ''} />
            <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          <button
            type="button"
            className="claims-btn claims-btn-primary"
            onClick={() => setIsNewModalOpen(true)}
          >
            <Plus size={14} />
            <span>Lập hồ sơ bồi thường</span>
          </button>
        </div>
      </div>

      {/* Operational Workflow Guide for Non-Specialists */}
      <div className="claims-guide-box">
        <div
          className="claims-guide-header"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          role="button"
          tabIndex={0}
        >
          <div className="claims-guide-header-title">
            <Info size={15} />
            <span>Quy trình xử lý hồ sơ bồi thường bưu gửi (Dành cho nhân viên vận hành)</span>
          </div>
          <button type="button" className="claims-guide-toggle-btn">
            {isGuideOpen ? 'Thu gọn hướng dẫn ▲' : 'Xem hướng dẫn 4 bước ▼'}
          </button>
        </div>

        {isGuideOpen && (
          <div className="claims-guide-content">
            <div className="claims-guide-steps">
              <div className="claims-guide-step-card">
                <span className="claims-guide-step-num">Bước 1: Tiếp nhận</span>
                <span className="claims-guide-step-title">Ghi nhận sự cố tổn thất</span>
                <p className="claims-guide-step-desc">
                  Lập hồ sơ bồi thường khi bưu kiện bị nứt vỡ, móp méo hoặc thất lạc trong quá trình vận chuyển. Kèm ảnh hiện trường và biên bản đồng kiểm.
                </p>
              </div>

              <div className="claims-guide-step-card">
                <span className="claims-guide-step-num">Bước 2: Giám định</span>
                <span className="claims-guide-step-title">Quy lỗi & Xác định trách nhiệm</span>
                <p className="claims-guide-step-desc">
                  Đối soát camera, biên bản bàn giao giữa Hub gửi, Xe tuyến liên tỉnh và Bưu tá phát để chỉ định bên gây lỗi và mức chế tài phạt tương ứng.
                </p>
              </div>

              <div className="claims-guide-step-card">
                <span className="claims-guide-step-num">Bước 3: Duyệt chi</span>
                <span className="claims-guide-step-title">Chi trả tiền bồi thường</span>
                <p className="claims-guide-step-desc">
                  Kế toán phê duyệt thanh toán tiền đền bù vào tài khoản ngân hàng của Khách gửi/Shop để bảo đảm quyền lợi khách hàng không bị chậm trễ.
                </p>
              </div>

              <div className="claims-guide-step-card">
                <span className="claims-guide-step-num">Bước 4: Tất toán</span>
                <span className="claims-guide-step-title">Khấu trừ chế tài đơn vị lỗi</span>
                <p className="claims-guide-step-desc">
                  Cấn trừ số tiền phạt vào kỳ đối soát công nợ tiếp theo của Hub hoặc bưu tá gây lỗi, sau đó đóng và lưu trữ hồ sơ vụ việc hoàn tất.
                </p>
              </div>
            </div>

            <div className="claims-guide-legal-strip">
              <div className="claims-guide-legal-item">
                <span>Căn cứ pháp lý:</span>
                <strong>Luật Bưu chính 2010 (Điều 24 & 25)</strong>
              </div>
              <div className="claims-guide-legal-item">
                <span>• Có bảo hiểm 100%:</span>
                <strong>Đền 100% giá trị khai báo theo hóa đơn mua hàng</strong>
              </div>
              <div className="claims-guide-legal-item">
                <span>• Không mua bảo hiểm:</span>
                <strong>Đền tối đa 04 lần cước gửi (trần 1.000.000đ/kiện)</strong>
              </div>
              <div className="claims-guide-legal-item">
                <span>• Miễn trừ đóng gói:</span>
                <strong>Từ chối đền bù do lỗi người gửi tự đóng gói</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metric Counters Strip */}
      <div className="claims-kpi-strip">
        <div
          className={`claims-kpi-item ${activeTab === 'ALL' ? 'claims-kpi-item--active' : ''}`}
          onClick={() => setActiveTab('ALL')}
          role="button"
          tabIndex={0}
        >
          <div className="claims-kpi-meta">
            <span className="claims-kpi-label">Tổng hồ sơ khiếu nại</span>
            <FileText size={16} className="claims-kpi-icon claims-kpi-icon--slate" />
          </div>
          <div className="claims-kpi-number">{stats.total}</div>
          <div className="claims-kpi-hint">Toàn bộ hồ sơ trên hệ thống</div>
        </div>

        <div
          className={`claims-kpi-item ${activeTab === 'PENDING' ? 'claims-kpi-item--active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
          role="button"
          tabIndex={0}
        >
          <div className="claims-kpi-meta">
            <span className="claims-kpi-label">Chờ giám định & Quy lỗi</span>
            <AlertTriangle size={16} className="claims-kpi-icon claims-kpi-icon--amber" />
          </div>
          <div className="claims-kpi-number claims-text-amber">{stats.pending}</div>
          <div className="claims-kpi-hint">Cần QA kết luận nguyên nhân</div>
        </div>

        <div
          className={`claims-kpi-item ${activeTab === 'ADJUDICATED' ? 'claims-kpi-item--active' : ''}`}
          onClick={() => setActiveTab('ADJUDICATED')}
          role="button"
          tabIndex={0}
        >
          <div className="claims-kpi-meta">
            <span className="claims-kpi-label">Chờ duyệt chi bồi thường</span>
            <Scale size={16} className="claims-kpi-icon claims-kpi-icon--blue" />
          </div>
          <div className="claims-kpi-number claims-text-blue">{stats.determined}</div>
          <div className="claims-kpi-hint">Đã phân định bên chịu trách nhiệm</div>
        </div>

        <div
          className={`claims-kpi-item ${activeTab === 'SETTLED' ? 'claims-kpi-item--active' : ''}`}
          onClick={() => setActiveTab('SETTLED')}
          role="button"
          tabIndex={0}
        >
          <div className="claims-kpi-meta">
            <span className="claims-kpi-label">Tiền đền bù đã duyệt</span>
            <DollarSign size={16} className="claims-kpi-icon claims-kpi-icon--emerald" />
          </div>
          <div className="claims-kpi-number claims-text-emerald">
            {formatCurrency(stats.settledAmount)}
          </div>
          <div className="claims-kpi-hint">Đã chi trả: {stats.settledCount} vụ hoàn tất</div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="claims-card">
        {/* Workflow Tabs */}
        <div className="claims-tabs-bar">
          <div className="claims-tabs-list">
            <button
              type="button"
              className={`claims-tab-btn ${activeTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả vụ việc
              <span className="claims-tab-count">{stats.total}</span>
            </button>
            <button
              type="button"
              className={`claims-tab-btn ${activeTab === 'PENDING' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('PENDING')}
            >
              Chờ giám định
              <span className="claims-tab-count is-amber">{stats.pending}</span>
            </button>
            <button
              type="button"
              className={`claims-tab-btn ${activeTab === 'ADJUDICATED' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('ADJUDICATED')}
            >
              Chờ duyệt bồi thường
              <span className="claims-tab-count is-blue">{stats.determined}</span>
            </button>
            <button
              type="button"
              className={`claims-tab-btn ${activeTab === 'SETTLED' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('SETTLED')}
            >
              Đã tất toán
              <span className="claims-tab-count is-emerald">{stats.settledCount}</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Filters */}
        <div className="claims-toolbar">
          <div className="claims-search-box">
            <Search size={14} className="claims-search-icon" />
            <input
              type="text"
              className="claims-search-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã hồ sơ, mã vận đơn, người gửi, đơn vị chịu lỗi..."
            />
            {keyword && (
              <button
                type="button"
                className="claims-search-clear"
                onClick={() => setKeyword('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="claims-filters-group">
            <div className="claims-filter-item">
              <span className="claims-filter-label">Sự cố:</span>
              <select
                className="claims-select"
                value={filterIncident}
                onChange={(e) => setFilterIncident(e.target.value)}
                aria-label="Loại sự cố"
              >
                <option value="ALL">Tất cả loại sự cố</option>
                <option value="DAMAGED">Bể vỡ / Hư hỏng</option>
                <option value="LOST_IN_TRANSIT">Thất lạc / Mất kiện</option>
              </select>
            </div>

            <div className="claims-filter-item">
              <span className="claims-filter-label">Bên chịu lỗi:</span>
              <select
                className="claims-select"
                value={filterParty}
                onChange={(e) => setFilterParty(e.target.value)}
                aria-label="Bên chịu lỗi"
              >
                <option value="ALL">Tất cả đơn vị</option>
                <option value="ORIGIN_HUB">Bưu cục gửi (Origin Hub)</option>
                <option value="LINEHAUL_FLEET">Xe tuyến liên tỉnh (Linehaul)</option>
                <option value="TRANSIT_HUB">Hub trung chuyển (Transit)</option>
                <option value="DELIVERY_HUB">Bưu cục phát & Shipper</option>
                <option value="UNASSIGNED">Chưa phân định</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Universal Claims Table */}
        <ClaimsLiabilityTable
          claims={filteredClaims}
          selectedClaim={selectedClaim}
          onOpenInspection={openInspection}
          onApprovePayment={handleApprovePayment}
          onSettle={handleSettle}
          onBatchApprove={handleBatchApprove}
          onBatchSettle={handleBatchSettle}
          isLoading={isLoading}
        />
      </div>

      {/* ========================================================= */}
      {/* 2-COLUMN WORKFLOW MODAL: INSPECTION & ADJUDICATION        */}
      {/* ========================================================= */}
      {selectedClaim && (
        <div className="claims-modal-backdrop" onClick={() => setSelectedClaim(null)}>
          <div
            className="claims-modal-dialog claims-modal-dialog--large"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="claims-modal-header">
              <div className="claims-modal-header-left">
                <span className="claims-modal-badge">{selectedClaim.claimCode}</span>
                <h3>Hồ sơ Bồi thường: {selectedClaim.shipmentCode}</h3>
              </div>
              <button
                type="button"
                className="claims-modal-close"
                onClick={() => setSelectedClaim(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="claims-modal-body claims-two-col-layout">
              {/* LEFT COLUMN: EVIDENCE & INCIDENT DETAILS */}
              <div className="claims-col-left">
                <div className="claims-section-title">
                  <Package size={16} />
                  <span>Thông tin Kiện hàng & Hiện trường Tổn thất</span>
                </div>

                <div className="claims-detail-grid">
                  <div className="claims-detail-item">
                    <span className="claims-detail-label">Mã vận đơn</span>
                    <strong className="claims-detail-val">
                      <CopyableShipmentCode code={selectedClaim.shipmentCode} />
                    </strong>
                  </div>
                  <div className="claims-detail-item">
                    <span className="claims-detail-label">Tuyến vận chuyển</span>
                    <span className="claims-detail-val">
                      {selectedClaim.originHubCode} ➔ {selectedClaim.destinationHubCode}
                    </span>
                  </div>
                  <div className="claims-detail-item">
                    <span className="claims-detail-label">Chủ hàng / Shop</span>
                    <span className="claims-detail-val">
                      {selectedClaim.customerName || '---'} ({selectedClaim.customerPhone || '---'})
                    </span>
                  </div>
                  <div className="claims-detail-item">
                    <span className="claims-detail-label">Loại tổn thất</span>
                    <span
                      className={`claims-badge-incident ${
                        selectedClaim.incidentType === 'DAMAGED'
                          ? 'claims-badge-incident--damaged'
                          : 'claims-badge-incident--lost'
                      }`}
                    >
                      {INCIDENT_TYPE_LABELS[selectedClaim.incidentType]}
                    </span>
                  </div>
                  <div className="claims-detail-item">
                    <span className="claims-detail-label">Khai giá hàng</span>
                    <span className="claims-detail-val">
                      {formatCurrency(selectedClaim.declaredValue)}
                    </span>
                  </div>
                  <div className="claims-detail-item">
                    <span className="claims-detail-label">Số tiền yêu cầu đền</span>
                    <span className="claims-detail-val claims-text-danger">
                      {formatCurrency(selectedClaim.claimRequestedAmount)}
                    </span>
                  </div>
                </div>

                {/* Weight Check */}
                <div className="claims-weight-box">
                  <div className="claims-weight-row">
                    <span>Trọng lượng gửi: <strong>{selectedClaim.declaredWeightKg} kg</strong></span>
                    <span>Trọng lượng đến: <strong>{selectedClaim.arrivalWeightKg ?? selectedClaim.declaredWeightKg} kg</strong></span>
                  </div>
                  {selectedClaim.weightDiscrepancyKg && selectedClaim.weightDiscrepancyKg < 0 && (
                    <div className="claims-weight-alert">
                      <AlertTriangle size={13} />
                      <span>Hụt cân: {Math.abs(selectedClaim.weightDiscrepancyKg)} kg (Có dấu hiệu rút ruột kiện)</span>
                    </div>
                  )}
                </div>

                {/* Insurance & Packaging Metadata Card */}
                <div className="claims-insurance-card">
                  <div className="claims-insurance-card-title">
                    <Shield size={14} />
                    <span>Gói Bảo hiểm & Ràng buộc Đóng gói</span>
                  </div>
                  <div className="claims-insurance-row">
                    <span>Gói bảo hiểm:</span>
                    <strong>
                      {selectedClaim.insuranceTier === 'COMPREHENSIVE_100'
                        ? 'Bảo hiểm Toàn diện 100% (Phí 0.5%)'
                        : 'Tiêu chuẩn (Không bảo hiểm)'}
                    </strong>
                  </div>
                  <div className="claims-insurance-row">
                    <span>Biên bản Miễn trừ đóng gói:</span>
                    <strong className={selectedClaim.packagingWaiver ? 'claims-text-danger' : 'claims-text-success'}>
                      {selectedClaim.packagingWaiver
                        ? 'CÓ (Người gửi ký cam kết tự chịu rủi ro bể vỡ)'
                        : 'KHÔNG (Hàng đóng gói chuẩn quy cách bưu điện)'}
                    </strong>
                  </div>
                  <div className="claims-insurance-row">
                    <span>Cước phí vận chuyển:</span>
                    <span>{formatCurrency(selectedClaim.shippingFee)}</span>
                  </div>
                </div>

                {/* Damage Description */}
                <div className="claims-text-block">
                  <label>Mô tả hư hỏng & Hiện trường:</label>
                  <p>{selectedClaim.damageDescription || 'Chưa ghi nhận mô tả chi tiết.'}</p>
                </div>

                {/* Photos */}
                <div className="claims-photos-section">
                  <label>Ảnh chụp bằng chứng tổn thất ({selectedClaim.evidencePhotos?.length || 0}):</label>
                  <div className="claims-photos-row">
                    {selectedClaim.evidencePhotos && selectedClaim.evidencePhotos.length > 0 ? (
                      selectedClaim.evidencePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="claims-photo-thumb"
                          onClick={() => setPreviewPhotoUrl(photo.url)}
                          title={`${photo.label} (Chụp bởi: ${photo.takenBy})`}
                        >
                          <img src={photo.url} alt={photo.label} />
                          <div className="claims-photo-hover">
                            <Eye size={14} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="claims-photo-empty">Không có ảnh đính kèm trong biên bản.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ADJUDICATION & VERDICT */}
              <div className="claims-col-right">
                <div className="claims-section-title">
                  <Gavel size={16} />
                  <span>Phán Quyết Trách Nhiệm & Bồi Thường</span>
                </div>

                {/* Automatic 4-Quadrant Legal Engine Recommendation */}
                {(() => {
                  const matrix = computeMatrixVerdict(selectedClaim);
                  return (
                    <div
                      className={`claims-verdict-box ${
                        matrix.isRejected ? 'claims-verdict-box--rejected' : 'claims-verdict-box--accepted'
                      }`}
                    >
                      <div className="claims-verdict-header">
                        <Scale size={16} />
                        <strong>Gợi ý phán quyết chuẩn Luật Bưu chính:</strong>
                      </div>
                      <div className="claims-verdict-title">{matrix.verdictLabel}</div>
                      <div className="claims-verdict-body">{matrix.verdictExplanation}</div>
                      <div className="claims-verdict-legal">
                        <em>Căn cứ pháp lý: {matrix.legalBasis}</em>
                      </div>
                      <div className="claims-verdict-suggested">
                        <span>Mức bồi thường gợi ý:</span>
                        <strong className={matrix.isRejected ? 'claims-text-danger' : 'claims-text-success'}>
                          {formatCurrency(matrix.suggestedAmount)}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Adjudication View or Edit Form */}
                {isAdjudicateMode ? (
                  <div className="claims-adj-form">
                    <div className="claims-form-group">
                      <label>Khâu chịu trách nhiệm lỗi (*):</label>
                      <select
                        className="claims-form-select"
                        value={adjParty}
                        onChange={(e) => setAdjParty(e.target.value as ResponsiblePartyType)}
                      >
                        <option value="ORIGIN_HUB">Bưu cục gửi (Origin Hub)</option>
                        <option value="LINEHAUL_FLEET">Đội xe tuyến vận chuyển (Linehaul Fleet)</option>
                        <option value="TRANSIT_HUB">Hub trung chuyển (Transit Hub)</option>
                        <option value="DELIVERY_HUB">Bưu cục phát & Shipper</option>
                        <option value="SENDER">Người gửi (Lỗi tự đóng gói)</option>
                      </select>
                    </div>

                    <div className="claims-form-row">
                      <div className="claims-form-group">
                        <label>Mã đơn vị / Hub gây lỗi (*):</label>
                        <input
                          type="text"
                          className="claims-form-input"
                          value={adjEntityCode}
                          onChange={(e) => setAdjEntityCode(e.target.value)}
                          placeholder="VD: 00101W001"
                        />
                      </div>
                      <div className="claims-form-group">
                        <label>Tên đơn vị gây lỗi:</label>
                        <input
                          type="text"
                          className="claims-form-input"
                          value={adjEntityName}
                          onChange={(e) => setAdjEntityName(e.target.value)}
                          placeholder="VD: Hub Tân Bình (Khu dỡ hàng)"
                        />
                      </div>
                    </div>

                    <div className="claims-form-row">
                      <div className="claims-form-group">
                        <label>Tỷ lệ lỗi (%):</label>
                        <input
                          type="number"
                          className="claims-form-input"
                          min="0"
                          max="100"
                          value={adjRatio}
                          onChange={(e) => setAdjRatio(Number(e.target.value))}
                        />
                      </div>
                      <div className="claims-form-group">
                        <label>Nguyên nhân gốc rễ (Root Cause):</label>
                        <select
                          className="claims-form-select"
                          value={adjRootCause}
                          onChange={(e) => setAdjRootCause(e.target.value as RootCauseCategory)}
                        >
                          <option value="PACKAGING_SOP_VIOLATION">Vi phạm SOP đóng gói</option>
                          <option value="ROUGH_HANDLING_STACKING">Ném hàng / Xếp đè hàng nặng</option>
                          <option value="VEHICLE_ACCIDENT_RAIN">Tai nạn xe / Mưa ướt thùng</option>
                          <option value="INTERNAL_THEFT">Mất cắp / Rút ruột nội bộ</option>
                          <option value="WRONG_ROUTING_AGING">Lưu kho quá hạn bẹp dập</option>
                        </select>
                      </div>
                    </div>

                    <div className="claims-form-row">
                      <div className="claims-form-group">
                        <label>Tiền bồi thường duyệt đền cho Shop (đ):</label>
                        <input
                          type="number"
                          className="claims-form-input"
                          value={adjCompensation}
                          onChange={(e) => setAdjCompensation(Number(e.target.value))}
                        />
                      </div>
                      <div className="claims-form-group">
                        <label>Tiền phạt khấu trừ đơn vị lỗi (đ):</label>
                        <input
                          type="number"
                          className="claims-form-input"
                          value={adjPenalty}
                          onChange={(e) => setAdjPenalty(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="claims-form-group">
                      <label>Ghi chú phán quyết của QA / Ban Giám Sát:</label>
                      <textarea
                        className="claims-form-textarea"
                        rows={3}
                        value={adjNotes}
                        onChange={(e) => setAdjNotes(e.target.value)}
                        placeholder="Nêu rõ camera bàn dỡ, biên bản kiểm tra chéo..."
                      />
                    </div>

                    <div className="claims-form-actions">
                      <button
                        type="button"
                        className="claims-btn claims-btn-subtle"
                        onClick={() => setIsAdjudicateMode(false)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="claims-btn claims-btn-primary"
                        onClick={handleSaveAdjudication}
                        disabled={isSavingAdj}
                      >
                        {isSavingAdj ? 'Đang lưu...' : 'Lưu phán quyết quy trách nhiệm'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read-Only Status & Workflow Overview */
                  <div className="claims-adjudicated-info">
                    <div className="claims-summary-card">
                      <div className="claims-summary-row">
                        <span>Trạng thái hồ sơ:</span>
                        <strong className="claims-text-blue">
                          {CLAIM_STATUS_LABELS[selectedClaim.status]}
                        </strong>
                      </div>
                      <div className="claims-summary-row">
                        <span>Khâu chịu lỗi:</span>
                        <strong>{RESPONSIBLE_PARTY_LABELS[selectedClaim.responsibleParty]}</strong>
                      </div>
                      <div className="claims-summary-row">
                        <span>Đơn vị chịu lỗi:</span>
                        <strong>
                          {selectedClaim.responsibleEntityName || selectedClaim.responsibleEntityCode || '---'}
                        </strong>
                      </div>
                      <div className="claims-summary-row">
                        <span>Tỷ lệ chịu trách nhiệm:</span>
                        <strong>{selectedClaim.liabilityRatioPercent}%</strong>
                      </div>
                      <div className="claims-summary-row">
                        <span>Tiền bồi thường duyệt:</span>
                        <strong className="claims-text-success">
                          {formatCurrency(selectedClaim.approvedCompensationAmount)}
                        </strong>
                      </div>
                      <div className="claims-summary-row">
                        <span>Tiền phạt khấu trừ:</span>
                        <strong className="claims-text-danger">
                          {formatCurrency(selectedClaim.penaltyAmount)}
                        </strong>
                      </div>
                      <div className="claims-summary-row">
                        <span>Người lập phán quyết:</span>
                        <span>{selectedClaim.adjudicatedBy || '---'}</span>
                      </div>
                    </div>

                    {selectedClaim.adjudicationNotes && (
                      <div className="claims-notes-box">
                        <label>Căn cứ giám định:</label>
                        <p>{selectedClaim.adjudicationNotes}</p>
                      </div>
                    )}

                    {/* Operational Action Buttons */}
                    <div className="claims-workflow-actions">
                      {selectedClaim.status === 'PENDING_INSPECTION' || selectedClaim.status === 'DRAFT' ? (
                        <button
                          type="button"
                          className="claims-btn claims-btn-primary"
                          onClick={() => setIsAdjudicateMode(true)}
                        >
                          <Gavel size={15} />
                          <span>Mở phiên quy lỗi & Giám định</span>
                        </button>
                      ) : null}

                      {selectedClaim.status === 'LIABILITY_DETERMINED' ? (
                        <div className="claims-workflow-group">
                          <button
                            type="button"
                            className="claims-btn claims-btn-subtle"
                            onClick={() => setIsAdjudicateMode(true)}
                          >
                            Chỉnh sửa phán quyết
                          </button>
                          <button
                            type="button"
                            className="claims-btn claims-btn-success"
                            onClick={() => handleApprovePayment(selectedClaim.id)}
                          >
                            <CheckCircle2 size={15} />
                            <span>Duyệt chi bồi thường ({formatCurrency(selectedClaim.approvedCompensationAmount)})</span>
                          </button>
                        </div>
                      ) : null}

                      {selectedClaim.status === 'APPROVED_COMPENSATION' ? (
                        <button
                          type="button"
                          className="claims-btn claims-btn-settle"
                          onClick={() => handleSettle(selectedClaim.id)}
                        >
                          <DollarSign size={15} />
                          <span>Tất toán khấu trừ chế tài ({formatCurrency(selectedClaim.penaltyAmount)})</span>
                        </button>
                      ) : null}

                      {selectedClaim.status === 'SETTLED' ? (
                        <div className="claims-settled-badge">
                          <CheckCircle2 size={16} />
                          <span>Hồ sơ đã tất toán chi trả & khấu trừ hoàn tất!</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="claims-modal-footer">
              <button
                type="button"
                className="claims-btn claims-btn-subtle"
                onClick={() => setSelectedClaim(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHOTO PREVIEW MODAL                                       */}
      {/* ========================================================= */}
      {previewPhotoUrl && (
        <div className="claims-modal-backdrop" onClick={() => setPreviewPhotoUrl(null)}>
          <div className="claims-photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="claims-photo-modal-header">
              <span>Ảnh hiện trường tổn thất</span>
              <button type="button" onClick={() => setPreviewPhotoUrl(null)}>
                <X size={18} />
              </button>
            </div>
            <img src={previewPhotoUrl} alt="Phóng to tổn thất" className="claims-photo-zoom" />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CREATE NEW CLAIM MODAL                                    */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div className="claims-modal-backdrop" onClick={() => setIsNewModalOpen(false)}>
          <div className="claims-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="claims-modal-header">
              <h3>Lập Hồ sơ Bồi thường Sự cố mới</h3>
              <button
                type="button"
                className="claims-modal-close"
                onClick={() => setIsNewModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="claims-modal-body">
              <div className="claims-form-group">
                <label>Mã vận đơn (*):</label>
                <input
                  type="text"
                  className="claims-form-input"
                  placeholder="VD: NXS000999"
                  value={newShipmentCode}
                  onChange={(e) => setNewShipmentCode(e.target.value)}
                />
              </div>

              <div className="claims-form-row">
                <div className="claims-form-group">
                  <label>Tên khách hàng / Shop gửi:</label>
                  <input
                    type="text"
                    className="claims-form-input"
                    placeholder="VD: Shop Đồ Chơi Mỹ"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                  />
                </div>
                <div className="claims-form-group">
                  <label>Số điện thoại:</label>
                  <input
                    type="text"
                    className="claims-form-input"
                    placeholder="VD: 0912 345 678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="claims-form-row">
                <div className="claims-form-group">
                  <label>Bưu cục gửi (Origin Hub):</label>
                  <input
                    type="text"
                    className="claims-form-input"
                    value={newOriginHub}
                    onChange={(e) => setNewOriginHub(e.target.value)}
                  />
                </div>
                <div className="claims-form-group">
                  <label>Bưu cục phát (Destination Hub):</label>
                  <input
                    type="text"
                    className="claims-form-input"
                    value={newDestHub}
                    onChange={(e) => setNewDestHub(e.target.value)}
                  />
                </div>
              </div>

              <div className="claims-form-row">
                <div className="claims-form-group">
                  <label>Loại sự cố (*):</label>
                  <select
                    className="claims-form-select"
                    value={newIncidentType}
                    onChange={(e) => setNewIncidentType(e.target.value as IncidentType)}
                  >
                    <option value="DAMAGED">Bể vỡ / Hư hỏng hàng hóa</option>
                    <option value="LOST_IN_TRANSIT">Thất lạc / Mất mát nguyên kiện</option>
                  </select>
                </div>
                <div className="claims-form-group">
                  <label>Giá trị hàng khai báo / Yêu cầu đền (đ):</label>
                  <input
                    type="number"
                    className="claims-form-input"
                    value={newDeclaredValue}
                    onChange={(e) => setNewDeclaredValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="claims-form-group">
                <label>Mô tả hàng hóa:</label>
                <input
                  type="text"
                  className="claims-form-input"
                  placeholder="VD: Màn hình máy tính Dell 27 inch"
                  value={newPackageDesc}
                  onChange={(e) => setNewPackageDesc(e.target.value)}
                />
              </div>

              <div className="claims-form-group">
                <label>Mô tả hiện trạng hư hỏng tổn thất:</label>
                <textarea
                  className="claims-form-textarea"
                  rows={2}
                  placeholder="VD: Thùng ngoài dập góc đáy, màn hình bên trong nứt rạn rỗ sọc..."
                  value={newDamageDesc}
                  onChange={(e) => setNewDamageDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="claims-modal-footer">
              <button
                type="button"
                className="claims-btn claims-btn-subtle"
                onClick={() => setIsNewModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="claims-btn claims-btn-primary"
                onClick={handleCreateNewClaim}
                disabled={isCreatingClaim}
              >
                {isCreatingClaim ? 'Đang tạo...' : 'Lưu hồ sơ bồi thường'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default ClaimsLiabilityManagementPage;
