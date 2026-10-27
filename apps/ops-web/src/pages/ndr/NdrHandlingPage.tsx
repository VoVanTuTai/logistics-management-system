import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ReturnBlockManagementPage } from '../function-groups/operations-platform/return-block/ReturnBlockManagementPage';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Info,
  RefreshCw,
  RotateCcw,
  Search,
  Truck,
  X,
  FileSpreadsheet,
} from 'lucide-react';

import {
  useNdrCasesQuery,
  useRescheduleMutation,
  useReturnDecisionMutation,
} from '../../features/ndr/ndr.api';
import type { NdrCaseListItemDto } from '../../features/ndr/ndr.types';
import { useTasksQuery } from '../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../features/tasks/tasks.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { queryKeys } from '../../utils/queryKeys';
import {
  exportNdrToExcel,
  formatNdrDisplayCode,
  NDR_REASON_MAP,
  NdrCasesTable,
} from './NdrCasesTable';
import './NdrHandlingPage.css';

type NdrTabType = 'ALL' | 'PENDING' | 'RESCHEDULED' | 'RETURN' | 'RESOLVED';

export function NdrHandlingPage(): React.JSX.Element {
  const [mainModuleTab, setMainModuleTab] = useState<string>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') === 'return-block' ? 'return-block' : 'ndr';
    } catch {
      return 'ndr';
    }
  });

  const handleSwitchTab = (tab: string) => {
    setMainModuleTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // ignore
    }
  };

  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const queryClient = useQueryClient();

  // Queries
  const ndrQuery = useNdrCasesQuery(accessToken);
  const tasksQuery = useTasksQuery(accessToken, {});

  // Build Courier Map
  const courierByShipmentCode = useMemo(
    () => buildCourierByShipmentCode(tasksQuery.data ?? []),
    [tasksQuery.data],
  );

  const rawItems = ndrQuery.data ?? [];

  // Guide Toggle
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<NdrTabType>('ALL');
  const [keyword, setKeyword] = useState('');
  const [filterReason, setFilterReason] = useState('ALL');

  // Quick Action Modal State
  const [modalItem, setModalItem] = useState<NdrCaseListItemDto | null>(null);
  const [modalMode, setModalMode] = useState<'RESCHEDULE' | 'RETURN'>('RESCHEDULE');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [returnToSender, setReturnToSender] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mutations
  const rescheduleMutation = useRescheduleMutation(accessToken, modalItem?.id ?? '');
  const returnMutation = useReturnDecisionMutation(accessToken, modalItem?.id ?? '');

  // Calculate Statistics
  const stats = useMemo(() => {
    let pending = 0;
    let rescheduled = 0;
    let returnRequested = 0;
    let resolved = 0;

    for (const item of rawItems) {
      const st = item.status?.toUpperCase() || '';
      if (st === 'PENDING_RESOLUTION' || st === 'CREATED' || st === 'OPEN') {
        pending++;
      } else if (st === 'RESCHEDULED') {
        rescheduled++;
      } else if (st === 'RETURN_REQUESTED' || st === 'RETURNING') {
        returnRequested++;
      } else if (st === 'RESOLVED' || st === 'CLOSED') {
        resolved++;
      }
    }

    return {
      total: rawItems.length,
      pending,
      rescheduled,
      returnRequested,
      resolved,
    };
  }, [rawItems]);

  // Filter Items
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const st = item.status?.toUpperCase() || '';

      // Filter by Tab
      if (activeTab === 'PENDING') {
        if (st !== 'PENDING_RESOLUTION' && st !== 'CREATED' && st !== 'OPEN') return false;
      } else if (activeTab === 'RESCHEDULED') {
        if (st !== 'RESCHEDULED') return false;
      } else if (activeTab === 'RETURN') {
        if (st !== 'RETURN_REQUESTED' && st !== 'RETURNING') return false;
      } else if (activeTab === 'RESOLVED') {
        if (st !== 'RESOLVED' && st !== 'CLOSED') return false;
      }

      // Filter by Reason Code
      if (filterReason !== 'ALL') {
        if (item.reasonCode !== filterReason) return false;
      }

      // Filter by Keyword
      if (keyword.trim()) {
        const kw = keyword.toLowerCase().trim();
        const courier = courierByShipmentCode.get(item.shipmentCode) || item.reportedBy || '';
        const displayCode = formatNdrDisplayCode(item.id, item.createdAt);
        const matchShipment = item.shipmentCode?.toLowerCase().includes(kw);
        const matchId = item.id?.toLowerCase().includes(kw) || displayCode.toLowerCase().includes(kw);
        const matchCourier = courier.toLowerCase().includes(kw);
        const matchHub = item.reportedHubCode?.toLowerCase().includes(kw);
        const matchNote = item.note?.toLowerCase().includes(kw);
        const matchReason = (NDR_REASON_MAP[item.reasonCode || ''] || '').toLowerCase().includes(kw);

        if (!matchShipment && !matchId && !matchCourier && !matchHub && !matchNote && !matchReason) {
          return false;
        }
      }

      return true;
    });
  }, [rawItems, activeTab, filterReason, keyword, courierByShipmentCode]);

  // Open Reschedule Modal
  const handleOpenReschedule = (item: NdrCaseListItemDto) => {
    setModalItem(item);
    setModalMode('RESCHEDULE');
    // Pre-fill tomorrow 09:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setRescheduleTime(localIso);
    setActionNote('');
  };

  // Open Return Modal
  const handleOpenReturn = (item: NdrCaseListItemDto) => {
    setModalItem(item);
    setModalMode('RETURN');
    setReturnToSender(true);
    setActionNote('');
  };

  // Close Modal
  const handleCloseModal = () => {
    setModalItem(null);
    setIsSubmittingAction(false);
  };

  // Submit Reschedule
  const handleConfirmReschedule = async () => {
    if (!modalItem) return;
    if (!rescheduleTime) {
      alert('Vui lòng chọn thời gian giao lại');
      return;
    }

    setIsSubmittingAction(true);
    try {
      await rescheduleMutation.mutateAsync({
        nextDeliveryAt: new Date(rescheduleTime).toISOString(),
        note: actionNote || null,
      });
      setToastMessage(`Đã hẹn phát lại thành công cho đơn ${modalItem.shipmentCode}!`);
      setTimeout(() => setToastMessage(null), 3500);
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: queryKeys.ndr });
    } catch (err) {
      alert(`Lỗi khi dời lịch giao: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Return
  const handleConfirmReturn = async () => {
    if (!modalItem) return;

    setIsSubmittingAction(true);
    try {
      await returnMutation.mutateAsync({
        returnToSender,
        note: actionNote || null,
      });
      setToastMessage(`Đã duyệt yêu cầu chuyển hoàn đơn ${modalItem.shipmentCode} về Shop!`);
      setTimeout(() => setToastMessage(null), 3500);
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: queryKeys.ndr });
    } catch (err) {
      alert(`Lỗi khi yêu cầu chuyển hoàn: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Export all filtered
  const handleExportAll = () => {
    if (filteredItems.length === 0) {
      alert('Không có dữ liệu để xuất Excel');
      return;
    }
    exportNdrToExcel(filteredItems, courierByShipmentCode);
  };

  return (
    <div className="ndr-page">
      {/* Unified Module Tabs Bar */}
      <div className="ops-unified-sub-tabs" role="tablist">
        <button
          type="button"
          className={`ops-unified-sub-tab-btn ${mainModuleTab === 'ndr' ? 'ops-unified-sub-tab-btn--active' : ''}`}
          onClick={() => handleSwitchTab('ndr')}
        >
          <Truck size={15} />
          <span>Xử lý Giao thất bại (NDR)</span>
        </button>
        <button
          type="button"
          className={`ops-unified-sub-tab-btn ${mainModuleTab === 'return-block' ? 'ops-unified-sub-tab-btn--active' : ''}`}
          onClick={() => handleSwitchTab('return-block')}
        >
          <RotateCcw size={15} />
          <span>Quản lý Hàng chuyển hoàn</span>
        </button>
      </div>

      {mainModuleTab === 'return-block' ? (
        <ReturnBlockManagementPage />
      ) : (
        <>
          {/* Toast */}
      {toastMessage && (
        <div className="ndr-toast">
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="ndr-header">
        <div className="ndr-header-left">
          <div className="ndr-header-icon">
            <Truck size={20} />
          </div>
          <div>
            <h2 className="ndr-header-title">Xử lý Giao thất bại (NDR - Non-Delivery Report)</h2>
            <p className="ndr-header-desc">
              Tiếp nhận các đơn hàng phát không thành công từ bưu tá, xác minh thông tin và ra quyết định Hẹn phát lại (Reschedule) hoặc Chuyển hoàn về người gửi (Return to Sender).
            </p>
          </div>
        </div>

        <div className="ndr-header-actions">
          <button
            type="button"
            className="ndr-btn ndr-btn-subtle"
            onClick={() => {
              ndrQuery.refetch();
              tasksQuery.refetch();
            }}
            disabled={ndrQuery.isFetching}
            title="Làm mới danh sách sự cố"
          >
            <RefreshCw size={13} className={ndrQuery.isFetching ? 'ndr-spin' : ''} />
            <span>{ndrQuery.isFetching ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          <button
            type="button"
            className="ndr-btn ndr-btn-primary"
            onClick={handleExportAll}
            title="Xuất bảng dữ liệu ra file Excel / CSV"
          >
            <FileSpreadsheet size={14} />
            <span>Xuất Excel ({filteredItems.length})</span>
          </button>
        </div>
      </div>

      {/* Operational SOP Guide Banner */}
      <div className="ndr-guide-box">
        <div
          className="ndr-guide-header"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          role="button"
          tabIndex={0}
        >
          <div className="ndr-guide-header-title">
            <Info size={15} />
            <span>Quy trình 3 bước xử lý giao bất thành chuẩn Bưu chính (Dành cho Điều phối & CSKH)</span>
          </div>
          <button type="button" className="ndr-guide-toggle-btn">
            {isGuideOpen ? 'Thu gọn hướng dẫn ▲' : 'Xem hướng dẫn 3 bước ▼'}
          </button>
        </div>

        {isGuideOpen && (
          <div className="ndr-guide-content">
            <div className="ndr-guide-steps">
              {/* Step 1 */}
              <div className="ndr-guide-step-card">
                <span className="ndr-guide-step-num">Bước 1: Tiếp nhận sự cố</span>
                <span className="ndr-guide-step-title">Shipper báo giao thất bại</span>
                <p className="ndr-guide-step-desc">
                  Bưu tá ngoài hiện trường không giao được hàng (thuê bao, đổi giờ, sai địa chỉ, khách từ chối) chọn lý do trên ứng dụng. Hệ thống tự động tạo hồ sơ sự cố NDR tại đây.
                </p>
              </div>

              {/* Step 2 */}
              <div className="ndr-guide-step-card">
                <span className="ndr-guide-step-num">Bước 2: Xác minh & Điều phối</span>
                <span className="ndr-guide-step-title">Liên hệ Người nhận / Shop</span>
                <p className="ndr-guide-step-desc">
                  Điều phối viên bấm &ldquo;Chat Shipper&rdquo; hoặc liên hệ số điện thoại người nhận để hỗ trợ thông tin, xác nhận địa chỉ chính xác hoặc hỗ trợ Shop thuyết phục khách nhận hàng.
                </p>
              </div>

              {/* Step 3 */}
              <div className="ndr-guide-step-card">
                <span className="ndr-guide-step-num">Bước 3: Phán quyết xử lý</span>
                <span className="ndr-guide-step-title">Hẹn phát lại hoặc Chuyển hoàn</span>
                <p className="ndr-guide-step-desc">
                  <strong>Hẹn lại:</strong> Chọn ngày/giờ phát tiếp theo (tối đa 3 lần theo quy chế bưu chính).<br />
                  <strong>Chuyển hoàn:</strong> Khách hủy dứt khoát hoặc quá 3 lần giao $\rightarrow$ Bấm &ldquo;Hoàn hàng&rdquo; để đóng bao gửi trả Shop.
                </p>
              </div>
            </div>

            <div className="ndr-guide-legal-strip">
              <div className="ndr-guide-legal-item">
                <span>Quy chuẩn vận hành bưu chính:</span>
                <strong>Tối đa 03 lượt giao hàng</strong>
              </div>
              <div className="ndr-guide-legal-item">
                <span>• Hẹn phát lại:</span>
                <strong>Hạn phát tiếp theo trong vòng 24h - 48h</strong>
              </div>
              <div className="ndr-guide-legal-item">
                <span>• Chuyển hoàn:</span>
                <strong>Bưu kiện tự động đưa vào danh sách đóng bao chuyển hoàn về Hub gửi ban đầu</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="ndr-kpis">
        {/* Total */}
        <div className="ndr-kpi-card">
          <span className="ndr-kpi-label">
            <span>Tổng sự cố NDR</span>
            <AlertTriangle size={15} color="#64748b" />
          </span>
          <span className="ndr-kpi-value">{stats.total}</span>
          <span className="ndr-kpi-subtext">Hồ sơ giao bất thành ghi nhận</span>
        </div>

        {/* Pending */}
        <div className="ndr-kpi-card is-amber">
          <span className="ndr-kpi-label">
            <span>Chờ giải quyết (Cần can thiệp gấp)</span>
            <Clock size={15} color="#f59e0b" />
          </span>
          <span className="ndr-kpi-value" style={{ color: '#b45309' }}>
            {stats.pending}
          </span>
          <span className="ndr-kpi-subtext">Chưa liên hệ / Chưa có hướng xử lý</span>
        </div>

        {/* Rescheduled */}
        <div className="ndr-kpi-card is-blue">
          <span className="ndr-kpi-label">
            <span>Đã hẹn phát lại</span>
            <CalendarClock size={15} color="#3b82f6" />
          </span>
          <span className="ndr-kpi-value" style={{ color: '#1d4ed8' }}>
            {stats.rescheduled}
          </span>
          <span className="ndr-kpi-subtext">Đã xếp lịch cho ca giao tiếp theo</span>
        </div>

        {/* Return Requested */}
        <div className="ndr-kpi-card is-purple">
          <span className="ndr-kpi-label">
            <span>Yêu cầu chuyển hoàn</span>
            <RotateCcw size={15} color="#8b5cf6" />
          </span>
          <span className="ndr-kpi-value" style={{ color: '#6d28d9' }}>
            {stats.returnRequested}
          </span>
          <span className="ndr-kpi-subtext">Chờ gom bao đóng gửi trả Shop</span>
        </div>
      </div>

      {/* Main Table Shell */}
      <div className="ndr-main-card">
        {/* Tabs */}
        <div className="ndr-tabs-container">
          <div className="ndr-tabs">
            <button
              type="button"
              className={`ndr-tab-btn ${activeTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              <span>Tất cả sự cố</span>
              <span className="ndr-tab-count">{stats.total}</span>
            </button>

            <button
              type="button"
              className={`ndr-tab-btn ${activeTab === 'PENDING' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('PENDING')}
            >
              <span>Chờ xử lý gấp</span>
              <span className="ndr-tab-count is-amber">{stats.pending}</span>
            </button>

            <button
              type="button"
              className={`ndr-tab-btn ${activeTab === 'RESCHEDULED' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('RESCHEDULED')}
            >
              <span>Đã hẹn lại</span>
              <span className="ndr-tab-count is-blue">{stats.rescheduled}</span>
            </button>

            <button
              type="button"
              className={`ndr-tab-btn ${activeTab === 'RETURN' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('RETURN')}
            >
              <span>Chờ chuyển hoàn</span>
              <span className="ndr-tab-count is-purple">{stats.returnRequested}</span>
            </button>

            <button
              type="button"
              className={`ndr-tab-btn ${activeTab === 'RESOLVED' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('RESOLVED')}
            >
              <span>Đã hoàn tất</span>
              <span className="ndr-tab-count">{stats.resolved}</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ndr-toolbar">
          {/* Search Box */}
          <div className="ndr-search-box">
            <Search size={14} className="ndr-search-icon" />
            <input
              type="text"
              className="ndr-search-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã vận đơn, mã NDR, shipper, bưu cục, ghi chú..."
            />
            {keyword && (
              <button
                type="button"
                className="ndr-search-clear"
                onClick={() => setKeyword('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="ndr-filters-group">
            <div className="ndr-filter-item">
              <span className="ndr-filter-label">Lý do thất bại:</span>
              <select
                className="ndr-select"
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                aria-label="Lọc theo lý do giao thất bại"
              >
                <option value="ALL">Tất cả lý do</option>
                {Object.entries(NDR_REASON_MAP).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Master NDR Table */}
        <NdrCasesTable
          items={filteredItems}
          courierByShipmentCode={courierByShipmentCode}
          onOpenReschedule={handleOpenReschedule}
          onOpenReturn={handleOpenReturn}
          isLoading={ndrQuery.isLoading}
        />
      </div>

      {/* ========================================================= */}
      {/* QUICK ACTION MODAL: RESCHEDULE OR RETURN DECISION         */}
      {/* ========================================================= */}
      {modalItem && (
        <div className="ndr-modal-backdrop" onClick={handleCloseModal}>
          <div className="ndr-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ndr-modal-header">
              <div className="ndr-modal-header-title">
                {modalMode === 'RESCHEDULE' ? (
                  <>
                    <CalendarClock size={18} color="#1d4ed8" />
                    <span>Hẹn phát lại bưu kiện: {modalItem.shipmentCode}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={18} color="#b91c1c" />
                    <span>Quyết định chuyển hoàn đơn: {modalItem.shipmentCode}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                className="ndr-modal-close"
                onClick={handleCloseModal}
                title="Đóng cửa sổ"
              >
                <X size={16} />
              </button>
            </div>

            <div className="ndr-modal-body">
              {/* Summary info box */}
              <div className="ndr-modal-info-box">
                <div className="ndr-modal-info-row">
                  <span className="ndr-modal-info-label">Mã hồ sơ NDR:</span>
                  <span className="ndr-modal-info-val">
                    {formatNdrDisplayCode(modalItem.id, modalItem.createdAt)}
                  </span>
                </div>
                <div className="ndr-modal-info-row">
                  <span className="ndr-modal-info-label">Mã vận đơn:</span>
                  <span className="ndr-modal-info-val">{modalItem.shipmentCode}</span>
                </div>
                <div className="ndr-modal-info-row">
                  <span className="ndr-modal-info-label">Lý do thất bại:</span>
                  <span className="ndr-modal-info-val" style={{ color: '#b45309' }}>
                    {NDR_REASON_MAP[modalItem.reasonCode || ''] || modalItem.reasonCode || '---'}
                  </span>
                </div>
                <div className="ndr-modal-info-row">
                  <span className="ndr-modal-info-label">Shipper báo cáo:</span>
                  <span className="ndr-modal-info-val">
                    {courierByShipmentCode.get(modalItem.shipmentCode) || modalItem.reportedBy || 'Chưa rõ'}
                  </span>
                </div>
              </div>

              {/* Form fields based on mode */}
              {modalMode === 'RESCHEDULE' ? (
                <>
                  <div className="ndr-form-group">
                    <label className="ndr-form-label">Thời gian hẹn giao lại (*):</label>
                    <input
                      type="datetime-local"
                      className="ndr-form-input"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      required
                    />
                    <small style={{ fontSize: 11, color: '#64748b' }}>
                      Đơn hàng sẽ được chuyển vào danh sách phát của bưu tá vào khung giờ này.
                    </small>
                  </div>

                  <div className="ndr-form-group">
                    <label className="ndr-form-label">Ghi chú điều phối / Lời nhắn của khách:</label>
                    <textarea
                      rows={3}
                      className="ndr-form-textarea"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Ví dụ: Khách dặn giao sau 17h, gọi trước khi đến 15 phút..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="ndr-form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={returnToSender}
                        onChange={(e) => setReturnToSender(e.target.checked)}
                      />
                      <span>Xác nhận chuyển hoàn về cho Người gửi / Shop</span>
                    </label>
                    <small style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 4 }}>
                      Lưu ý: Khi xác nhận chuyển hoàn, đơn hàng sẽ chuyển sang trạng thái RETURNING và bưu cục sẽ tiến hành đóng bao xuất trả về Hub gửi ban đầu.
                    </small>
                  </div>

                  <div className="ndr-form-group">
                    <label className="ndr-form-label">Lý do chuyển hoàn & Biên bản cuộc gọi:</label>
                    <textarea
                      rows={3}
                      className="ndr-form-textarea"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Ví dụ: Đã gọi xác nhận với Shop, Shop đồng ý nhận lại hàng do khách đi công tác dài ngày..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="ndr-modal-footer">
              <button
                type="button"
                className="ndr-btn ndr-btn-subtle"
                onClick={handleCloseModal}
                disabled={isSubmittingAction}
              >
                Hủy bỏ
              </button>

              {modalMode === 'RESCHEDULE' ? (
                <button
                  type="button"
                  className="ndr-btn ndr-btn-primary"
                  onClick={handleConfirmReschedule}
                  disabled={isSubmittingAction}
                >
                  <CalendarClock size={13} />
                  <span>{isSubmittingAction ? 'Đang lưu...' : 'Xác nhận hẹn phát lại'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="ndr-btn ndr-btn-danger"
                  onClick={handleConfirmReturn}
                  disabled={isSubmittingAction}
                >
                  <RotateCcw size={13} />
                  <span>{isSubmittingAction ? 'Đang xử lý...' : 'Xác nhận chuyển hoàn'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

function buildCourierByShipmentCode(tasks: TaskListItemDto[]): Map<string, string> {
  const result = new Map<string, string>();
  const newestUpdatedAtByShipment = new Map<string, string>();

  for (const task of tasks) {
    if (!task.shipmentCode || !task.assignedCourierId) {
      continue;
    }

    const previousUpdatedAt = newestUpdatedAtByShipment.get(task.shipmentCode);
    if (previousUpdatedAt && previousUpdatedAt >= task.updatedAt) {
      continue;
    }

    newestUpdatedAtByShipment.set(task.shipmentCode, task.updatedAt);
    result.set(task.shipmentCode, task.assignedCourierId);
  }

  return result;
}
