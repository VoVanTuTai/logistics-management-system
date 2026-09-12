import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Gavel,
  Image as ImageIcon,
  Info,
  Package,
  Plus,
  RefreshCw,
  Scale,
  Search,
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
import './ClaimsLiabilityManagementPage.css';

function formatCurrency(amount: number | null | undefined): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount ?? 0))} đ`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
}

type TabType = 'ALL' | 'PENDING' | 'ADJUDICATED' | 'SETTLED';

export function ClaimsLiabilityManagementPage(): React.JSX.Element {
  // Claims state initialized with local cache, updated with real DB via API
  const [claims, setClaims] = useState<CompensationClaim[]>(() => readClaims());
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

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
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="claims-header-title">
              Hồ sơ Bồi thường & Phân định Trách nhiệm
            </h2>
            <p className="claims-header-desc">
              Giám định tổn thất, quy lỗi minh bạch giữa Bưu cục gửi, Xe tuyến & Bưu cục phát, duyệt chi bồi thường cho Shop và khấu trừ chế tài.
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
            <RefreshCw size={14} className={isLoading ? 'claims-spin' : ''} />
            <span>{isLoading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          <button
            type="button"
            className="claims-btn claims-btn-primary"
            onClick={() => setIsNewModalOpen(true)}
          >
            <Plus size={15} />
            <span>Lập hồ sơ bồi thường</span>
          </button>
        </div>
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
            <FileText size={18} className="claims-kpi-icon claims-kpi-icon--slate" />
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
            <AlertTriangle size={18} className="claims-kpi-icon claims-kpi-icon--amber" />
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
            <Scale size={18} className="claims-kpi-icon claims-kpi-icon--blue" />
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
            <DollarSign size={18} className="claims-kpi-icon claims-kpi-icon--emerald" />
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
            <Search size={15} className="claims-search-icon" />
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

        {/* Master Table */}
        <div className="claims-table-container">
          <table className="claims-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Mã hồ sơ</th>
                <th style={{ width: '220px' }}>Vận đơn & Khách gửi</th>
                <th style={{ width: '150px' }}>Loại sự cố</th>
                <th style={{ width: '150px' }}>Tiền yêu cầu</th>
                <th style={{ minWidth: '220px' }}>Phân định trách nhiệm</th>
                <th style={{ width: '150px' }}>Trạng thái</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="claims-empty-cell">
                    <div className="claims-empty-state">
                      <FileCheck size={36} color="#94a3b8" />
                      <p>Không có hồ sơ đền bù nào phù hợp với bộ lọc hiện tại.</p>
                      {keyword && (
                        <button
                          type="button"
                          className="claims-btn claims-btn-subtle"
                          onClick={() => setKeyword('')}
                        >
                          Xóa tìm kiếm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isPending =
                    claim.status === 'PENDING_INSPECTION' || claim.status === 'DRAFT';
                  const isAdjudicated = claim.status === 'LIABILITY_DETERMINED';
                  const isApproved = claim.status === 'APPROVED_COMPENSATION';
                  const isSettled = claim.status === 'SETTLED';

                  return (
                    <tr key={claim.id} className="claims-tr">
                      {/* Claim Code & Time */}
                      <td>
                        <div className="claims-cell-primary">{claim.claimCode}</div>
                        <div className="claims-cell-sub">
                          <Clock size={11} />
                          <span>{formatDate(claim.reportedAt)}</span>
                        </div>
                      </td>

                      {/* Shipment & Customer */}
                      <td>
                        <div className="claims-shipment-row">
                          <CopyableShipmentCode code={claim.shipmentCode} />
                        </div>
                        <div className="claims-cell-customer">
                          {claim.customerName || 'Khách hàng'}
                        </div>
                        <div className="claims-cell-route">
                          <span>{claim.originHubCode}</span>
                          <ArrowRight size={10} />
                          <span>{claim.destinationHubCode}</span>
                        </div>
                      </td>

                      {/* Incident Type */}
                      <td>
                        <span
                          className={`claims-badge-incident ${
                            claim.incidentType === 'DAMAGED'
                              ? 'claims-badge-incident--damaged'
                              : 'claims-badge-incident--lost'
                          }`}
                        >
                          {claim.incidentType === 'DAMAGED' ? (
                            <AlertTriangle size={11} />
                          ) : (
                            <ShieldAlert size={11} />
                          )}
                          <span>{INCIDENT_TYPE_LABELS[claim.incidentType]}</span>
                        </span>
                        <div className="claims-pkg-desc" title={claim.packageDescription}>
                          {claim.packageDescription}
                        </div>
                      </td>

                      {/* Claim Amount */}
                      <td>
                        <div className="claims-cell-amount">
                          {formatCurrency(claim.claimRequestedAmount)}
                        </div>
                        {claim.approvedCompensationAmount > 0 && (
                          <div className="claims-cell-approved-amount">
                            Duyệt: {formatCurrency(claim.approvedCompensationAmount)}
                          </div>
                        )}
                      </td>

                      {/* Responsibility Assignment */}
                      <td>
                        {claim.responsibleParty === 'UNASSIGNED' ? (
                          <span className="claims-unassigned-tag">
                            <Clock size={11} />
                            <span>Chưa phân định</span>
                          </span>
                        ) : (
                          <div className="claims-liability-box">
                            <div className="claims-liability-party">
                              {claim.responsibleParty === 'LINEHAUL_FLEET' ? (
                                <Truck size={12} />
                              ) : claim.responsibleParty === 'DELIVERY_HUB' ? (
                                <UserCheck size={12} />
                              ) : (
                                <Building2 size={12} />
                              )}
                              <strong>{claim.responsibleEntityName || claim.responsibleEntityCode}</strong>
                            </div>
                            <div className="claims-liability-ratio">
                              Chịu: <strong>{claim.liabilityRatioPercent}%</strong>
                              {claim.penaltyAmount > 0 && (
                                <span className="claims-liability-penalty">
                                  Phạt: {formatCurrency(claim.penaltyAmount)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`claims-status-pill ${
                            isPending
                              ? 'claims-status-pill--pending'
                              : isAdjudicated
                              ? 'claims-status-pill--adjudicated'
                              : isApproved
                              ? 'claims-status-pill--approved'
                              : isSettled
                              ? 'claims-status-pill--settled'
                              : 'claims-status-pill--rejected'
                          }`}
                        >
                          {isPending && <Clock size={11} />}
                          {isAdjudicated && <Scale size={11} />}
                          {isApproved && <CheckCircle2 size={11} />}
                          {isSettled && <ShieldCheck size={11} />}
                          <span>{CLAIM_STATUS_LABELS[claim.status]}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="claims-actions-cell">
                          {/* Main workflow action */}
                          {isPending ? (
                            <button
                              type="button"
                              className="claims-action-btn claims-action-btn--primary"
                              onClick={() => openInspection(claim, true)}
                              title="Giám định và phân định trách nhiệm"
                            >
                              <Gavel size={13} />
                              <span>Quy lỗi</span>
                            </button>
                          ) : isAdjudicated ? (
                            <button
                              type="button"
                              className="claims-action-btn claims-action-btn--success"
                              onClick={() => handleApprovePayment(claim.id)}
                              title="Duyệt chi bồi thường cho Shop"
                            >
                              <CheckCircle2 size={13} />
                              <span>Duyệt chi</span>
                            </button>
                          ) : isApproved ? (
                            <button
                              type="button"
                              className="claims-action-btn claims-action-btn--settle"
                              onClick={() => handleSettle(claim.id)}
                              title="Khấu trừ chế tài hoàn tất"
                            >
                              <DollarSign size={13} />
                              <span>Khấu trừ</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="claims-action-btn claims-action-btn--view"
                              onClick={() => openInspection(claim, false)}
                              title="Xem chi tiết hồ sơ"
                            >
                              <Eye size={13} />
                              <span>Chi tiết</span>
                            </button>
                          )}

                          {/* Quick view button if not in view mode */}
                          {isPending || isAdjudicated || isApproved ? (
                            <button
                              type="button"
                              className="claims-icon-btn"
                              onClick={() => openInspection(claim, false)}
                              title="Xem biên bản & ảnh hiện trường"
                            >
                              <Eye size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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

                {/* Incident Description */}
                <div className="claims-desc-box">
                  <div className="claims-desc-title">Mô tả sản phẩm & hư hại:</div>
                  <p className="claims-desc-text">
                    <strong>Hàng hóa:</strong> {selectedClaim.packageDescription}
                  </p>
                  <p className="claims-desc-text">
                    <strong>Hư hại ghi nhận:</strong>{' '}
                    {selectedClaim.damageDescription || 'Không có ghi chú thêm.'}
                  </p>
                </div>

                {/* Evidence Photos */}
                <div className="claims-photos-section">
                  <div className="claims-desc-title">Ảnh chụp hiện trường & Biên bản:</div>
                  {selectedClaim.evidencePhotos && selectedClaim.evidencePhotos.length > 0 ? (
                    <div className="claims-photos-grid">
                      {selectedClaim.evidencePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="claims-photo-thumb"
                          onClick={() => setPreviewPhotoUrl(photo.url)}
                          title={`${photo.label} (Chụp bởi: ${photo.takenBy})`}
                        >
                          <img src={photo.url} alt={photo.label} />
                          <div className="claims-photo-caption">{photo.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="claims-no-photos">
                      <ImageIcon size={20} color="#94a3b8" />
                      <span>Không có ảnh đính kèm</span>
                    </div>
                  )}
                </div>

                {/* Reporter info */}
                <div className="claims-reporter-info">
                  <User size={13} />
                  <span>
                    Báo cáo bởi: <strong>{selectedClaim.reportedBy}</strong> lúc{' '}
                    {formatDate(selectedClaim.reportedAt)}
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: ADJUDICATION & RESOLUTION WORKFLOW */}
              <div className="claims-col-right">
                <div className="claims-section-title">
                  <Gavel size={16} />
                  <span>Quy trình Xử lý & Phán quyết Trách nhiệm</span>
                </div>

                {/* Step 1: Adjudication Decision */}
                <div className="claims-step-card">
                  <div className="claims-step-header">
                    <div className="claims-step-num">1</div>
                    <div className="claims-step-title">
                      <strong>Phán quyết quy trách nhiệm (Liability)</strong>
                      <span>Xác định đơn vị vi phạm SOP & tỷ lệ bồi thường</span>
                    </div>
                  </div>

                  {isAdjudicateMode ? (
                    <div className="claims-step-form">
                      <div className="claims-form-row">
                        <label>Đơn vị chịu trách nhiệm:</label>
                        <select
                          className="claims-select"
                          value={adjParty}
                          onChange={(e) => setAdjParty(e.target.value as ResponsiblePartyType)}
                        >
                          <option value="ORIGIN_HUB">Bưu cục gửi (Origin Hub)</option>
                          <option value="LINEHAUL_FLEET">Xe tuyến liên tỉnh (Linehaul Fleet)</option>
                          <option value="TRANSIT_HUB">Hub trung chuyển (Transit Sorting)</option>
                          <option value="DELIVERY_HUB">Bưu cục phát & Shipper</option>
                          <option value="INSURANCE_FORCE_MAJEURE">Bảo hiểm / Bất khả kháng</option>
                        </select>
                      </div>

                      <div className="claims-form-row">
                        <label>Tên đơn vị / Xe / Bưu tá:</label>
                        <input
                          type="text"
                          className="claims-input"
                          value={adjEntityName}
                          onChange={(e) => setAdjEntityName(e.target.value)}
                          placeholder="VD: Bưu cục Hàng Bài / Xe 29C-882.19"
                        />
                      </div>

                      <div className="claims-form-grid-2">
                        <div className="claims-form-row">
                          <label>Tỷ lệ chịu lỗi (%):</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="claims-input"
                            value={adjRatio}
                            onChange={(e) => setAdjRatio(Number(e.target.value))}
                          />
                        </div>
                        <div className="claims-form-row">
                          <label>Tiền đền bù duyệt (VNĐ):</label>
                          <input
                            type="number"
                            className="claims-input"
                            value={adjCompensation}
                            onChange={(e) => setAdjCompensation(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="claims-form-row">
                        <label>Nguyên nhân cốt lõi:</label>
                        <select
                          className="claims-select"
                          value={adjRootCause}
                          onChange={(e) => setAdjRootCause(e.target.value as RootCauseCategory)}
                        >
                          {Object.entries(ROOT_CAUSE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="claims-form-row">
                        <label>Ghi chú kết luận của QA / Điều phối:</label>
                        <textarea
                          rows={3}
                          className="claims-textarea"
                          value={adjNotes}
                          onChange={(e) => setAdjNotes(e.target.value)}
                          placeholder="Trích xuất camera, lời giải trình, lý do quy lỗi..."
                        />
                      </div>

                      <div className="claims-step-actions">
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
                          {isSavingAdj ? 'Đang lưu...' : 'Lưu phán quyết'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="claims-step-view">
                      {selectedClaim.responsibleParty === 'UNASSIGNED' ? (
                        <div className="claims-step-empty">
                          <Clock size={16} color="#d97706" />
                          <span>Hồ sơ chưa có phán quyết trách nhiệm.</span>
                          <button
                            type="button"
                            className="claims-btn claims-btn-primary claims-btn-sm"
                            onClick={() => setIsAdjudicateMode(true)}
                          >
                            <Gavel size={13} />
                            <span>Thực hiện quy lỗi ngay</span>
                          </button>
                        </div>
                      ) : (
                        <div className="claims-adjudicated-summary">
                          <div className="claims-adj-item">
                            <span>Bên chịu lỗi:</span>
                            <strong>
                              {RESPONSIBLE_PARTY_LABELS[selectedClaim.responsibleParty]} (
                              {selectedClaim.responsibleEntityName})
                            </strong>
                          </div>
                          <div className="claims-adj-item">
                            <span>Tỷ lệ chịu:</span>
                            <strong className="claims-text-danger">
                              {selectedClaim.liabilityRatioPercent}%
                            </strong>
                          </div>
                          <div className="claims-adj-item">
                            <span>Số tiền duyệt bồi thường:</span>
                            <strong className="claims-text-success">
                              {formatCurrency(selectedClaim.approvedCompensationAmount)}
                            </strong>
                          </div>
                          <div className="claims-adj-item">
                            <span>Nguyên nhân:</span>
                            <span>{ROOT_CAUSE_LABELS[selectedClaim.rootCause]}</span>
                          </div>
                          {selectedClaim.adjudicationNotes && (
                            <div className="claims-adj-notes">
                              <strong>Kết luận:</strong> {selectedClaim.adjudicationNotes}
                            </div>
                          )}
                          <div className="claims-adj-footer">
                            <small>
                              Kết luận bởi: <strong>{selectedClaim.adjudicatedBy}</strong> lúc{' '}
                              {formatDate(selectedClaim.adjudicatedAt)}
                            </small>
                            <button
                              type="button"
                              className="claims-btn claims-btn-subtle claims-btn-xs"
                              onClick={() => setIsAdjudicateMode(true)}
                            >
                              Điều chỉnh
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Compensation Approval */}
                <div className="claims-step-card">
                  <div className="claims-step-header">
                    <div className="claims-step-num">2</div>
                    <div className="claims-step-title">
                      <strong>Chi trả bồi thường cho Shop (Payout)</strong>
                      <span>Duyệt chuyển khoản tiền đền bù thiệt hại</span>
                    </div>
                  </div>

                  <div className="claims-step-content">
                    {selectedClaim.status === 'PENDING_INSPECTION' ||
                    selectedClaim.status === 'DRAFT' ? (
                      <div className="claims-step-locked">
                        <Info size={14} />
                        <span>Cần hoàn tất Bước 1 (Phán quyết quy lỗi) trước khi duyệt chi.</span>
                      </div>
                    ) : selectedClaim.merchantPaidAt ||
                      selectedClaim.status === 'APPROVED_COMPENSATION' ||
                      selectedClaim.status === 'SETTLED' ? (
                      <div className="claims-step-done">
                        <CheckCircle2 size={16} color="#10b981" />
                        <div>
                          <strong>Đã duyệt chi trả cho khách gửi</strong>
                          <div className="claims-text-sm">
                            Số tiền: {formatCurrency(selectedClaim.approvedCompensationAmount)} •{' '}
                            {formatDate(selectedClaim.merchantPaidAt)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="claims-payout-cta">
                        <p>
                          Xác nhận chi trả{' '}
                          <strong>{formatCurrency(selectedClaim.approvedCompensationAmount)}</strong> cho chủ
                          hàng: <strong>{selectedClaim.customerName}</strong>.
                        </p>
                        <button
                          type="button"
                          className="claims-btn claims-btn-success"
                          onClick={() => handleApprovePayment(selectedClaim.id)}
                        >
                          <CheckCircle2 size={15} />
                          <span>Duyệt chuyển tiền đền bù</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Deduction & Final Settlement */}
                <div className="claims-step-card">
                  <div className="claims-step-header">
                    <div className="claims-step-num">3</div>
                    <div className="claims-step-title">
                      <strong>Khấu trừ chế tài & Hoàn tất (Settlement)</strong>
                      <span>Truy thu đối soát công nợ Hub hoặc trừ lương lái xe/bưu tá</span>
                    </div>
                  </div>

                  <div className="claims-step-content">
                    {selectedClaim.status === 'SETTLED' || selectedClaim.hubDeductedAt ? (
                      <div className="claims-step-done">
                        <ShieldCheck size={16} color="#10b981" />
                        <div>
                          <strong>Hồ sơ đã được tất toán hoàn tất</strong>
                          <div className="claims-text-sm">
                            Đã khấu trừ: {formatCurrency(selectedClaim.penaltyAmount)} •{' '}
                            {formatDate(selectedClaim.hubDeductedAt)}
                          </div>
                        </div>
                      </div>
                    ) : selectedClaim.status === 'APPROVED_COMPENSATION' ? (
                      <div className="claims-settle-cta">
                        <p>
                          Xác nhận khấu trừ{' '}
                          <strong>{formatCurrency(selectedClaim.penaltyAmount || selectedClaim.approvedCompensationAmount)}</strong> vào kỳ
                          lương/đối soát của:{' '}
                          <strong>{selectedClaim.responsibleEntityName || selectedClaim.responsibleEntityCode}</strong>.
                        </p>
                        <button
                          type="button"
                          className="claims-btn claims-btn-settle"
                          onClick={() => handleSettle(selectedClaim.id)}
                        >
                          <DollarSign size={15} />
                          <span>Xác nhận đã khấu trừ chế tài</span>
                        </button>
                      </div>
                    ) : (
                      <div className="claims-step-locked">
                        <Info size={14} />
                        <span>Cần hoàn tất duyệt chi bồi thường ở Bước 2 trước khi đóng hồ sơ.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW CLAIM                                   */}
      {/* ========================================================= */}
      {isNewModalOpen && (
        <div className="claims-modal-backdrop" onClick={() => setIsNewModalOpen(false)}>
          <div
            className="claims-modal-dialog claims-modal-dialog--medium"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="claims-modal-header">
              <h3>Lập hồ sơ bồi thường mới</h3>
              <button
                type="button"
                className="claims-modal-close"
                onClick={() => setIsNewModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="claims-modal-body">
              <div className="claims-form-grid-2">
                <div className="claims-form-row">
                  <label>Mã vận đơn (*):</label>
                  <input
                    type="text"
                    className="claims-input"
                    value={newShipmentCode}
                    onChange={(e) => setNewShipmentCode(e.target.value)}
                    placeholder="VD: 101000000001"
                  />
                </div>
                <div className="claims-form-row">
                  <label>Loại sự cố:</label>
                  <select
                    className="claims-select"
                    value={newIncidentType}
                    onChange={(e) => setNewIncidentType(e.target.value as IncidentType)}
                  >
                    <option value="DAMAGED">Bể vỡ / Hư hỏng</option>
                    <option value="LOST_IN_TRANSIT">Thất lạc / Mất kiện</option>
                  </select>
                </div>
              </div>

              <div className="claims-form-grid-2">
                <div className="claims-form-row">
                  <label>Tên khách hàng / Shop:</label>
                  <input
                    type="text"
                    className="claims-input"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    placeholder="Tên shop hoặc khách gửi"
                  />
                </div>
                <div className="claims-form-row">
                  <label>Số điện thoại:</label>
                  <input
                    type="text"
                    className="claims-input"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0912345678"
                  />
                </div>
              </div>

              <div className="claims-form-grid-2">
                <div className="claims-form-row">
                  <label>Bưu cục gửi (Origin):</label>
                  <input
                    type="text"
                    className="claims-input"
                    value={newOriginHub}
                    onChange={(e) => setNewOriginHub(e.target.value)}
                  />
                </div>
                <div className="claims-form-row">
                  <label>Bưu cục nhận (Dest):</label>
                  <input
                    type="text"
                    className="claims-input"
                    value={newDestHub}
                    onChange={(e) => setNewDestHub(e.target.value)}
                  />
                </div>
              </div>

              <div className="claims-form-row">
                <label>Số tiền yêu cầu bồi thường (VNĐ):</label>
                <input
                  type="number"
                  className="claims-input"
                  value={newDeclaredValue}
                  onChange={(e) => setNewDeclaredValue(Number(e.target.value))}
                />
              </div>

              <div className="claims-form-row">
                <label>Mô tả hàng hóa:</label>
                <input
                  type="text"
                  className="claims-input"
                  value={newPackageDesc}
                  onChange={(e) => setNewPackageDesc(e.target.value)}
                  placeholder="VD: Hộp bánh kẹo, Bộ ấm chén gốm..."
                />
              </div>

              <div className="claims-form-row">
                <label>Mô tả hiện trạng hư hại:</label>
                <textarea
                  rows={3}
                  className="claims-textarea"
                  value={newDamageDesc}
                  onChange={(e) => setNewDamageDesc(e.target.value)}
                  placeholder="Thùng móp rách, gãy chân đèn, ướt nước..."
                />
              </div>

              <div className="claims-modal-actions">
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
                  {isCreatingClaim ? 'Đang tạo...' : 'Tạo hồ sơ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHOTO PREVIEW LIGHTBOX                                    */}
      {/* ========================================================= */}
      {previewPhotoUrl && (
        <div className="claims-lightbox-backdrop" onClick={() => setPreviewPhotoUrl(null)}>
          <div className="claims-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="claims-lightbox-close"
              onClick={() => setPreviewPhotoUrl(null)}
            >
              <X size={20} />
            </button>
            <img src={previewPhotoUrl} alt="Ảnh bằng chứng hiện trường phóng to" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimsLiabilityManagementPage;
