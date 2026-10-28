import React, { useMemo, useState } from 'react';
import type {
  FinancialLedgerEntry,
  MerchantBankProfile,
  SettlementBatch,
  ShipmentRow,
} from '../../types';
import { formatCurrency, formatDate } from '../../api';
import {
  FinanceCardExplanationModal,
  type FinanceExplanationTab,
} from './FinanceCardExplanationModal';
import { FinanceBusinessCharts } from './FinanceBusinessCharts';

export interface FinanceInsightsProps {
  netBalance: number;
  totalCod: number;
  deliveredCod: number;
  totalFee: number;
}

export interface MerchantFinanceViewProps {
  insights: FinanceInsightsProps;
  shipmentRows?: ShipmentRow[];
  merchantBankProfile: MerchantBankProfile;
  settlementBatches: SettlementBatch[];
  financialLedger: FinancialLedgerEntry[];
  financeSubTab: 'overview' | 'batches' | 'ledger' | 'settings';
  financeBatchStatusFilter: string;
  financeLedgerSearch: string;
  financeLedgerTypeFilter: string;
  exportAllLedgerCsv: () => void;
  exportBatchToCsv: (batch: SettlementBatch) => void;
  onSetFinanceSubTab: (tab: 'overview' | 'batches' | 'ledger' | 'settings') => void;
  onSetFinanceBatchStatusFilter: (filter: string) => void;
  onSetFinanceLedgerSearch: (search: string) => void;
  onSetFinanceLedgerTypeFilter: (filter: string) => void;
  onOpenEditBankModal: () => void;
  onShowTopupModal: () => void;
  onSelectSettlementBatch: (batch: SettlementBatch) => void;
  onOpenShipmentDetail: (shipmentCode: string) => void;
}

function InfoExclamationIcon(): React.JSX.Element {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="finance-info-exclamation-svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function MerchantFinanceView({
  insights,
  shipmentRows = [],
  merchantBankProfile,
  settlementBatches,
  financialLedger,
  financeSubTab,
  financeBatchStatusFilter,
  financeLedgerSearch,
  financeLedgerTypeFilter,
  exportAllLedgerCsv,
  exportBatchToCsv,
  onSetFinanceSubTab,
  onSetFinanceBatchStatusFilter,
  onSetFinanceLedgerSearch,
  onSetFinanceLedgerTypeFilter,
  onOpenEditBankModal,
  onShowTopupModal,
  onSelectSettlementBatch,
  onOpenShipmentDetail,
}: MerchantFinanceViewProps): React.JSX.Element {
  // Current month key (format YYYY-MM)
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Time filter bar state (default is current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Beginner-friendly explanation modal state
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState<boolean>(false);
  const [explanationInitialTab, setExplanationInitialTab] = useState<FinanceExplanationTab>('lifecycle');

  const openExplanation = (tab: FinanceExplanationTab) => {
    setExplanationInitialTab(tab);
    setIsExplanationModalOpen(true);
  };

  const getRelativeMonth = (ym: string, delta: number) => {
    const base = ym === 'all' ? currentMonthKey : ym;
    const [year, month] = base.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const prevMonthKey = useMemo(() => getRelativeMonth(currentMonthKey, -1), [currentMonthKey]);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => getRelativeMonth(prev === 'all' ? currentMonthKey : prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => getRelativeMonth(prev === 'all' ? currentMonthKey : prev, 1));
  };

  const formatMonthLabel = (ym: string) => {
    if (ym === 'all') return 'Toàn bộ thời gian';
    const [year, month] = ym.split('-');
    return `Tháng ${month}/${year}`;
  };

  const getDateRangeString = (ym: string) => {
    if (ym === 'all') return 'Toàn bộ kỳ đối soát từ trước đến nay';
    const [year, month] = ym.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `01/${String(month).padStart(2, '0')}/${year} – ${String(lastDay).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  // Filter shipments for the selected period
  const filteredShipments = useMemo(() => {
    if (!shipmentRows || shipmentRows.length === 0) return [];
    if (selectedMonth === 'all') return shipmentRows;
    return shipmentRows.filter((row) => {
      const raw = row.shipment.createdAt || row.shipment.updatedAt || '';
      return raw.startsWith(selectedMonth);
    });
  }, [shipmentRows, selectedMonth]);

  // Business logic computation:
  // - COD đang giao: các đơn hàng đang giao trong kỳ (chưa giao, chưa hủy/hoàn)
  // - Khi đơn giao thành công (DELIVERED):
  //     + COD đang giao GIẢM
  //     + COD đã thu TĂNG (+row.codAmount)
  //     + Cước phát sinh trong kỳ TĂNG (+row.feeEstimate)
  //     + Số dư ròng khả dụng = COD đã thu - Cước phát sinh trong kỳ
  const effectiveMetrics = useMemo(() => {
    if (shipmentRows && shipmentRows.length > 0) {
      let deliveredCod = 0;
      let deliveringCod = 0;
      let incurredFee = 0;

      for (const row of filteredShipments) {
        const status = String(row.shipment.currentStatus ?? '').toUpperCase();
        const isDelivered = status === 'DELIVERED';
        const isCancelled = status === 'CANCELLED';
        const isReturned = status.includes('RETURN');
        const isFailed = status.includes('FAIL');

        if (isDelivered) {
          deliveredCod += row.codAmount || 0;
          incurredFee += row.feeEstimate || 0;
        } else if (!isCancelled && !isReturned && !isFailed) {
          deliveringCod += row.codAmount || 0;
        } else if (isReturned) {
          incurredFee += Math.round((row.feeEstimate || 0) * 0.5);
        }
      }

      const netBalance = deliveredCod - incurredFee;

      return {
        netBalance,
        deliveredCod,
        deliveringCod,
        incurredFee,
        orderCount: filteredShipments.length,
        hasData: true,
      };
    }

    // Fallback if shipmentRows is not yet populated
    return {
      netBalance: insights.netBalance,
      deliveredCod: insights.deliveredCod,
      deliveringCod: Math.max(0, insights.totalCod - insights.deliveredCod),
      incurredFee: insights.totalFee,
      orderCount: 0,
      hasData: false,
    };
  }, [shipmentRows, filteredShipments, insights]);

  // Filter batches and ledger by month
  const displayBatches = useMemo(() => {
    if (selectedMonth === 'all') return settlementBatches;
    return settlementBatches.filter((b) => {
      const from = b.fromDate || '';
      const to = b.toDate || '';
      return from.startsWith(selectedMonth) || to.startsWith(selectedMonth);
    });
  }, [settlementBatches, selectedMonth]);

  const displayLedger = useMemo(() => {
    if (selectedMonth === 'all') return financialLedger;
    return financialLedger.filter((entry) => {
      const occurred = entry.occurredAt || '';
      return occurred.startsWith(selectedMonth);
    });
  }, [financialLedger, selectedMonth]);

  return (
    <section className="finance-layout">
      {/* Top Header Banner */}
      <div className="finance-header-banner">
        <div className="finance-header-left">
          <div className="finance-header-icon-wrap">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="finance-header-titles">
            <h2>Đối soát & Quản lý Tài chính</h2>
            <p>
              Minh bạch dòng tiền thu hộ COD, tự động cấn trừ cước vận chuyển và lịch trình chi trả
              định kỳ.
            </p>
          </div>
        </div>
        <div className="finance-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportAllLedgerCsv}
            title="Tải toàn bộ lịch sử biến động số dư (.csv)"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', marginRight: '6px' }}
            >
              download
            </span>
            <span>Xuất sổ cái (.csv)</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenEditBankModal}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', marginRight: '6px' }}
            >
              account_balance
            </span>
            <span>Tài khoản nhận tiền</span>
          </button>
          <button
            type="button"
            className={`btn ${effectiveMetrics.netBalance < 0 ? 'btn-danger' : 'btn-primary'}`}
            onClick={onShowTopupModal}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', marginRight: '6px' }}
            >
              qr_code_2
            </span>
            <span>{effectiveMetrics.netBalance < 0 ? 'Thanh toán nợ cước' : 'Nạp tiền VietQR'}</span>
          </button>
        </div>
      </div>

      {/* Modern Time Filter Bar (Thanh thời gian xem báo cáo tài chính) */}
      <div className="finance-period-bar">
        <div className="finance-period-bar__left">
          <div className="finance-period-title-group">
            <div className="finance-period-icon-wrap">
              <span className="material-symbols-outlined">date_range</span>
            </div>
            <div>
              <div className="finance-period-label">Kỳ báo cáo tài chính</div>
              <div className="finance-period-current-text">
                {formatMonthLabel(selectedMonth)}
              </div>
            </div>
          </div>

          {/* Month Navigator & Picker */}
          <div className="finance-period-nav">
            <button
              type="button"
              className="finance-nav-btn"
              onClick={handlePrevMonth}
              title="Tháng trước"
              aria-label="Xem báo cáo tháng trước"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <div className="finance-month-input-container" title="Bấm để chọn tháng & năm bất kỳ">
              <input
                type="month"
                className="finance-month-input"
                value={selectedMonth === 'all' ? currentMonthKey : selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Chọn tháng và năm xem báo cáo tài chính"
              />
              <span className="material-symbols-outlined finance-month-calendar-icon">calendar_month</span>
            </div>

            <button
              type="button"
              className="finance-nav-btn"
              onClick={handleNextMonth}
              title="Tháng sau"
              aria-label="Xem báo cáo tháng sau"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Quick Filter Pills */}
          <div className="finance-quick-pills">
            <button
              type="button"
              className={`finance-quick-pill ${selectedMonth === currentMonthKey ? 'finance-quick-pill--active' : ''}`}
              onClick={() => setSelectedMonth(currentMonthKey)}
            >
              Tháng này
            </button>
            <button
              type="button"
              className={`finance-quick-pill ${selectedMonth === prevMonthKey ? 'finance-quick-pill--active' : ''}`}
              onClick={() => setSelectedMonth(prevMonthKey)}
            >
              Tháng trước
            </button>
            <button
              type="button"
              className={`finance-quick-pill ${selectedMonth === 'all' ? 'finance-quick-pill--active' : ''}`}
              onClick={() => setSelectedMonth('all')}
            >
              Tất cả
            </button>
          </div>
        </div>

        <div className="finance-period-bar__right">
          <div className="finance-period-meta-badge">
            <span className="finance-period-pulse-dot" />
            <span className="finance-period-daterange-text">{getDateRangeString(selectedMonth)}</span>
            <span className="finance-period-sep">•</span>
            <span className="finance-period-orders-count">
              <strong>{effectiveMetrics.orderCount}</strong> đơn trong kỳ
            </span>
          </div>

          <button
            type="button"
            className="finance-guide-btn"
            onClick={() => openExplanation('lifecycle')}
            title="Xem cẩm nang & sơ đồ luồng tiền dành cho người không chuyên"
          >
            <span className="finance-guide-btn-icon">
              <InfoExclamationIcon />
            </span>
            <span>Cẩm nang dòng tiền</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="finance-kpi-grid">
        {/* 1. Số dư ròng khả dụng */}
        <div className="finance-kpi-card">
          <div className="finance-kpi-card__top">
            <div className="finance-kpi-card__label-wrap">
              <span className="finance-kpi-card__label">Số dư ròng khả dụng</span>
              <button
                type="button"
                className="finance-kpi-info-btn"
                onClick={() => openExplanation('netBalance')}
                title="Bấm để xem giải thích chi tiết: Số dư ròng = COD đã thu - Cước phát sinh"
                aria-label="Xem giải thích chi tiết Số dư ròng khả dụng"
              >
                <InfoExclamationIcon />
              </button>
            </div>
            <div
              className={`finance-kpi-card__icon ${
                effectiveMetrics.netBalance >= 0
                  ? 'finance-kpi-card__icon--success'
                  : 'finance-kpi-card__icon--danger'
              }`}
            >
              <span className="material-symbols-outlined">
                {effectiveMetrics.netBalance >= 0 ? 'account_balance' : 'warning'}
              </span>
            </div>
          </div>
          <div
            className="finance-kpi-card__value"
            style={{ color: effectiveMetrics.netBalance >= 0 ? '#127a56' : '#ba1a1a' }}
          >
            {formatCurrency(effectiveMetrics.netBalance)}
          </div>
          <div className="finance-kpi-card__footer">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '15px',
                color: effectiveMetrics.netBalance >= 0 ? '#127a56' : '#ba1a1a',
              }}
            >
              {effectiveMetrics.netBalance >= 0 ? 'check_circle' : 'error'}
            </span>
            <span>
              {effectiveMetrics.netBalance >= 0
                ? 'Đã cấn trừ cước • Sẵn sàng chi trả'
                : 'Vượt hạn mức nợ (-500.000đ)'}
            </span>
          </div>
        </div>

        {/* 2. COD đã thu */}
        <div className="finance-kpi-card">
          <div className="finance-kpi-card__top">
            <div className="finance-kpi-card__label-wrap">
              <span className="finance-kpi-card__label">COD đã thu (Chờ chi)</span>
              <button
                type="button"
                className="finance-kpi-info-btn"
                onClick={() => openExplanation('deliveredCod')}
                title="Bấm để xem giải thích chi tiết COD đã thu"
                aria-label="Xem giải thích chi tiết COD đã thu"
              >
                <InfoExclamationIcon />
              </button>
            </div>
            <div className="finance-kpi-card__icon finance-kpi-card__icon--primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="finance-kpi-card__value" style={{ color: '#0052cc' }}>
            {formatCurrency(effectiveMetrics.deliveredCod)}
          </div>
          <div className="finance-kpi-card__footer">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '15px', color: '#0052cc' }}
            >
              verified
            </span>
            <span>Shipper đã giao thành công & nộp quỹ</span>
          </div>
        </div>

        {/* 3. COD đang giao */}
        <div className="finance-kpi-card">
          <div className="finance-kpi-card__top">
            <div className="finance-kpi-card__label-wrap">
              <span className="finance-kpi-card__label">COD đang giao (Dự kiến)</span>
              <button
                type="button"
                className="finance-kpi-info-btn"
                onClick={() => openExplanation('deliveringCod')}
                title="Bấm để xem giải thích chi tiết COD đang giao"
                aria-label="Xem giải thích chi tiết COD đang giao"
              >
                <InfoExclamationIcon />
              </button>
            </div>
            <div className="finance-kpi-card__icon finance-kpi-card__icon--info">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
          </div>
          <div className="finance-kpi-card__value" style={{ color: '#0059b8' }}>
            {formatCurrency(effectiveMetrics.deliveringCod)}
          </div>
          <div className="finance-kpi-card__footer">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '15px', color: '#0059b8' }}
            >
              schedule
            </span>
            <span>Đơn hàng đang trên đường giao khách</span>
          </div>
        </div>

        {/* 4. Cước vận chuyển phát sinh */}
        <div className="finance-kpi-card">
          <div className="finance-kpi-card__top">
            <div className="finance-kpi-card__label-wrap">
              <span className="finance-kpi-card__label">Cước phát sinh trong kỳ</span>
              <button
                type="button"
                className="finance-kpi-info-btn"
                onClick={() => openExplanation('incurredFee')}
                title="Bấm để xem giải thích chi tiết Cước phát sinh trong kỳ"
                aria-label="Xem giải thích chi tiết Cước phát sinh trong kỳ"
              >
                <InfoExclamationIcon />
              </button>
            </div>
            <div className="finance-kpi-card__icon finance-kpi-card__icon--danger">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
          </div>
          <div className="finance-kpi-card__value" style={{ color: '#ba1a1a' }}>
            {formatCurrency(effectiveMetrics.incurredFee)}
          </div>
          <div className="finance-kpi-card__footer">
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#7c8aa2' }}>
              shield
            </span>
            <span>Hạn mức nợ cước trần: -500.000đ</span>
          </div>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="finance-subtabs-nav">
        <button
          type="button"
          className={`finance-subtab-btn ${
            financeSubTab === 'overview' ? 'finance-subtab-btn--active' : ''
          }`}
          onClick={() => onSetFinanceSubTab('overview')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            dashboard
          </span>
          <span>Tổng quan dòng tiền</span>
        </button>
        <button
          type="button"
          className={`finance-subtab-btn ${
            financeSubTab === 'batches' ? 'finance-subtab-btn--active' : ''
          }`}
          onClick={() => onSetFinanceSubTab('batches')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            fact_check
          </span>
          <span>Kỳ đối soát & Bảng kê ({displayBatches.length})</span>
        </button>
        <button
          type="button"
          className={`finance-subtab-btn ${
            financeSubTab === 'ledger' ? 'finance-subtab-btn--active' : ''
          }`}
          onClick={() => onSetFinanceSubTab('ledger')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            history_edu
          </span>
          <span>Sổ cái biến động số dư ({displayLedger.length})</span>
        </button>
        <button
          type="button"
          className={`finance-subtab-btn ${
            financeSubTab === 'settings' ? 'finance-subtab-btn--active' : ''
          }`}
          onClick={() => onSetFinanceSubTab('settings')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            account_balance
          </span>
          <span>Tài khoản thụ hưởng & Hợp đồng</span>
        </button>
      </div>

      {/* Subtab 1: Tổng quan dòng tiền */}
      {financeSubTab === 'overview' ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Biểu đồ phân tích kinh doanh & Dòng tiền */}
          <FinanceBusinessCharts
            shipmentRows={filteredShipments}
            settlementBatches={displayBatches}
            selectedMonth={selectedMonth}
            deliveredCod={effectiveMetrics.deliveredCod}
            incurredFee={effectiveMetrics.incurredFee}
            deliveringCod={effectiveMetrics.deliveringCod}
            netBalance={effectiveMetrics.netBalance}
          />

          {/* Kỳ đối soát gần nhất */}
          {settlementBatches[0] ? (
            <div className="finance-section-card">
              <div className="finance-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ color: '#0052cc', fontSize: '24px' }}
                  >
                    sync
                  </span>
                  <div>
                    <h3 className="finance-section-title">
                      Kỳ đối soát hiện tại ({settlementBatches[0].code})
                    </h3>
                    <div className="muted" style={{ fontSize: '13px' }}>
                      {settlementBatches[0].cycleName}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="finance-badge finance-badge--processing">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      hourglass_top
                    </span>
                    <span>
                      {settlementBatches[0].status === 'PAID'
                        ? 'Đã chi trả'
                        : 'Đang xử lý chi trả'}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => exportBatchToCsv(settlementBatches[0])}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', marginRight: '6px' }}
                    >
                      download
                    </span>
                    <span>Tải bảng kê kỳ này (.csv)</span>
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div className="muted" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                    Số lượng đơn
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#102548' }}>
                    {settlementBatches[0].orderCount} đơn
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                    Tổng COD thu hộ
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#127a56' }}>
                    +{formatCurrency(settlementBatches[0].codTotal)}
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                    Cước vận chuyển cấn trừ
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ba1a1a' }}>
                    -{formatCurrency(settlementBatches[0].feeTotal)}
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                    Thực nhận về tài khoản
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0052cc' }}>
                    {formatCurrency(settlementBatches[0].netPayout)}
                  </div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
                    Tài khoản nhận tiền
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                    {settlementBatches[0].bankInfo}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Quy định & Chính sách đối soát */}
          <div className="finance-section-card">
            <h3 className="finance-section-title">
              <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                policy
              </span>
              <span>Chính sách đối soát & Bảo toàn tiền hàng</span>
            </h3>
            <div className="finance-rules-list">
              <div className="finance-rule-item">
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#127a56', fontSize: '22px' }}
                >
                  verified_user
                </span>
                <div>
                  <strong>Tính pháp lý của tiền COD:</strong> Toàn bộ tiền COD thu hộ từ người nhận
                  thuộc quyền sở hữu 100% của Chủ Shop. Nexus Logistics cam kết bảo toàn nguyên vẹn
                  và chi trả đúng kỳ hạn đối soát quy định.
                </div>
              </div>
              <div className="finance-rule-item">
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#0052cc', fontSize: '22px' }}
                >
                  calendar_month
                </span>
                <div>
                  <strong>Chu kỳ chi trả tiêu chuẩn (Thứ 2 - Thứ 4 - Thứ 6):</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li>
                      Đơn giao thành công Thứ 7, Chủ nhật và Thứ 2: Đối soát và chi trả vào{' '}
                      <strong>Thứ 4</strong>.
                    </li>
                    <li>
                      Đơn giao thành công Thứ 3 và Thứ 4: Đối soát và chi trả vào <strong>Thứ 6</strong>.
                    </li>
                    <li>
                      Đơn giao thành công Thứ 5 và Thứ 6: Đối soát và chi trả vào{' '}
                      <strong>Thứ 2 tuần kế tiếp</strong>.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="finance-rule-item">
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#0059b8', fontSize: '22px' }}
                >
                  currency_exchange
                </span>
                <div>
                  <strong>Cơ chế cấn trừ tự động (Netting Settlement):</strong> Cước phí vận chuyển,
                  phụ phí vượt cân và phí hoàn hàng (50% cước chiều đi) được tự động cấn trừ vào số
                  tiền COD thu hộ trong kỳ, giúp Shop không phải chuyển tiền lẻ tẻ từng đơn.
                </div>
              </div>
              <div className="finance-rule-item">
                <span
                  className="material-symbols-outlined"
                  style={{ color: '#ba1a1a', fontSize: '22px' }}
                >
                  lock_clock
                </span>
                <div>
                  <strong>Hạn mức nợ cước âm tối đa (-500.000 VNĐ):</strong> Nếu số tiền cước phát
                  sinh vượt quá tiền COD (số dư âm quá -500.000đ), hệ thống sẽ tạm khóa tạo đơn mới.
                  Shop chỉ cần quét mã VietQR chuyển khoản thanh toán nợ, hệ thống SePay tự động mở
                  khóa trong vòng 30 giây.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Subtab 2: Danh sách Kỳ đối soát */}
      {financeSubTab === 'batches' ? (
        <div className="finance-section-card">
          <div className="finance-section-header">
            <h3 className="finance-section-title">
              <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                fact_check
              </span>
              <span>Danh sách các kỳ đối soát COD</span>
            </h3>
            <div className="finance-filter-toolbar">
              <select
                className="finance-filter-input"
                value={financeBatchStatusFilter}
                onChange={(e) => onSetFinanceBatchStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PAID">Đã chi trả</option>
                <option value="PROCESSING">Đang xử lý</option>
              </select>
            </div>
          </div>

          <div className="finance-table-wrapper">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Mã phiên</th>
                  <th>Kỳ đối soát</th>
                  <th>Số lượng đơn</th>
                  <th>Tổng COD thu hộ</th>
                  <th>Cước cấn trừ</th>
                  <th>Thực nhận</th>
                  <th>Thời gian chi trả</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayBatches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '32px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}
                      >
                        event_busy
                      </span>
                      <div>Không có phiên đối soát nào trong {formatMonthLabel(selectedMonth)}</div>
                      {selectedMonth !== 'all' && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ marginTop: '12px', fontSize: '12px' }}
                          onClick={() => setSelectedMonth('all')}
                        >
                          Xem tất cả các tháng
                        </button>
                      )}
                    </td>
                  </tr>
                ) :
                  displayBatches
                    .filter(
                      (b) =>
                        financeBatchStatusFilter === 'ALL' || b.status === financeBatchStatusFilter,
                    )
                    .map((batch) => (
                      <tr key={batch.id}>
                      <td>
                        <span className="code-pill">{batch.code}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{batch.cycleName}</div>
                        <div className="muted" style={{ fontSize: '11px' }}>
                          {batch.fromDate} → {batch.toDate}
                        </div>
                      </td>
                      <td>{batch.orderCount} đơn</td>
                      <td className="money-plus">+{formatCurrency(batch.codTotal)}</td>
                      <td className="money-minus">-{formatCurrency(batch.feeTotal)}</td>
                      <td style={{ fontWeight: 800, fontSize: '14px', color: '#102548' }}>
                        {formatCurrency(batch.netPayout)}
                      </td>
                      <td>
                        <div>{batch.payoutDate}</div>
                        {batch.transferRef ? (
                          <div
                            className="muted"
                            style={{ fontSize: '11px', fontFamily: 'monospace' }}
                          >
                            Ref: {batch.transferRef}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {batch.status === 'PAID' ? (
                          <span className="finance-badge finance-badge--paid">
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '14px' }}
                            >
                              check_circle
                            </span>
                            <span>Đã chi trả</span>
                          </span>
                        ) : (
                          <span className="finance-badge finance-badge--processing">
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '14px' }}
                            >
                              hourglass_top
                            </span>
                            <span>Đang xử lý</span>
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => onSelectSettlementBatch(batch)}
                          >
                            Xem đơn
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => exportBatchToCsv(batch)}
                            title="Tải bảng kê Excel/CSV"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '16px' }}
                            >
                              download
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Subtab 3: Sổ cái biến động số dư */}
      {financeSubTab === 'ledger' ? (
        <div className="finance-section-card">
          <div className="finance-section-header">
            <h3 className="finance-section-title">
              <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                history_edu
              </span>
              <span>Sổ cái biến động số dư thời gian thực</span>
            </h3>
            <div className="finance-filter-toolbar">
              <input
                className="finance-filter-input"
                placeholder="Tìm theo mã vận đơn..."
                value={financeLedgerSearch}
                onChange={(e) => onSetFinanceLedgerSearch(e.target.value)}
                style={{ width: '200px' }}
              />
              <select
                className="finance-filter-input"
                value={financeLedgerTypeFilter}
                onChange={(e) => onSetFinanceLedgerTypeFilter(e.target.value)}
              >
                <option value="ALL">Tất cả nghiệp vụ</option>
                <option value="COD_COLLECTED">Thu hộ COD (+)</option>
                <option value="SHIPPING_FEE">Cước vận chuyển (-)</option>
                <option value="RETURN_FEE">Cước hoàn hàng (-)</option>
                <option value="CLAIM_COMPENSATION">Bồi thường khiếu nại (+)</option>
                <option value="PICKUP_SLA_COMPENSATION">Bồi hoàn lấy trễ SLA (+)</option>
              </select>
              <button type="button" className="btn btn-secondary" onClick={exportAllLedgerCsv}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', marginRight: '6px' }}
                >
                  download
                </span>
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>

          <div className="finance-table-wrapper">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã giao dịch</th>
                  <th>Loại nghiệp vụ</th>
                  <th>Nội dung / Vận đơn</th>
                  <th style={{ textAlign: 'right' }}>Biến động</th>
                  <th style={{ textAlign: 'right' }}>Số dư sau GD</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {displayLedger.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '32px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}
                      >
                        history_toggle_off
                      </span>
                      <div>Không có giao dịch sổ cái nào trong {formatMonthLabel(selectedMonth)}</div>
                      {selectedMonth !== 'all' && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ marginTop: '12px', fontSize: '12px' }}
                          onClick={() => setSelectedMonth('all')}
                        >
                          Xem tất cả các tháng
                        </button>
                      )}
                    </td>
                  </tr>
                ) :
                  displayLedger
                    .filter((entry) => {
                    if (
                      financeLedgerTypeFilter !== 'ALL' &&
                      entry.type !== financeLedgerTypeFilter
                    )
                      return false;
                    if (financeLedgerSearch.trim()) {
                      const q = financeLedgerSearch.trim().toUpperCase();
                      return (
                        entry.id.toUpperCase().includes(q) ||
                        (entry.shipmentCode && entry.shipmentCode.toUpperCase().includes(q)) ||
                        entry.title.toUpperCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '12px' }}>
                        {formatDate(entry.occurredAt)}
                      </td>
                      <td>
                        <span className="code-pill">{entry.id}</span>
                      </td>
                      <td>
                        {entry.type === 'COD_COLLECTED' ? (
                          <span className="finance-badge finance-badge--paid">Thu hộ COD</span>
                        ) : entry.type === 'SHIPPING_FEE' ? (
                          <span className="finance-badge finance-badge--danger">
                            Cước vận chuyển
                          </span>
                        ) : entry.type === 'RETURN_FEE' ? (
                          <span className="finance-badge finance-badge--danger">Phí hoàn 50%</span>
                        ) : entry.type === 'CLAIM_COMPENSATION' ? (
                          <span className="finance-badge finance-badge--paid">
                            Bồi thường sự cố
                          </span>
                        ) : entry.type === 'PICKUP_SLA_COMPENSATION' ? (
                          <span
                            className="finance-badge"
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              fontWeight: 700,
                            }}
                          >
                            Bồi hoàn lấy trễ
                          </span>
                        ) : (
                          <span className="finance-badge finance-badge--pending">{entry.type}</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{entry.title}</div>
                        {entry.shipmentCode ? (
                          <button
                            type="button"
                            className="link-btn"
                            style={{ fontSize: '12px', padding: 0, textDecoration: 'underline' }}
                            onClick={() => {
                              if (entry.shipmentCode) void onOpenShipmentDetail(entry.shipmentCode);
                            }}
                          >
                            Xem chi tiết đơn #{entry.shipmentCode}
                          </button>
                        ) : null}
                      </td>
                      <td
                        style={{ textAlign: 'right', whiteSpace: 'nowrap' }}
                        className={entry.amount >= 0 ? 'money-plus' : 'money-minus'}
                      >
                        {entry.amount >= 0
                          ? `+${formatCurrency(entry.amount)}`
                          : `-${formatCurrency(Math.abs(entry.amount))}`}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          color: '#102548',
                        }}
                      >
                        {formatCurrency(entry.balanceAfter)}
                      </td>
                      <td className="muted" style={{ fontSize: '12px' }}>
                        {entry.note || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Subtab 4: Tài khoản thụ hưởng & Hợp đồng */}
      {financeSubTab === 'settings' ? (
        <div className="finance-bank-profile-grid">
          {/* Cột 1: Thẻ tài khoản ngân hàng */}
          <div className="finance-section-card">
            <h3 className="finance-section-title">
              <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                credit_card
              </span>
              <span>Tài khoản ngân hàng nhận tiền COD</span>
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
              Tiền COD sau khi cấn trừ cước phí sẽ được hệ thống tự động bắn lệnh chuyển khoản Batch
              Transfer về tài khoản ngân hàng này.
            </p>

            <div className="finance-bank-card">
              <div className="finance-bank-card__top">
                <div className="finance-bank-card__chip" />
                <div className="finance-bank-card__bank-name">{merchantBankProfile.bankName}</div>
              </div>
              <div>
                <div
                  className="muted"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                  }}
                >
                  Số tài khoản thụ hưởng
                </div>
                <div className="finance-bank-card__number">
                  {merchantBankProfile.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
                </div>
              </div>
              <div className="finance-bank-card__bottom">
                <div>
                  <div
                    className="muted"
                    style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px' }}
                  >
                    CHỦ TÀI KHOẢN
                  </div>
                  <div className="finance-bank-card__holder">
                    {merchantBankProfile.accountHolder}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.85)',
                      marginTop: '2px',
                    }}
                  >
                    {merchantBankProfile.branch}
                  </div>
                </div>
                <span className="finance-bank-card__tag">
                  {merchantBankProfile.payoutSchedule === 'MWF'
                    ? 'Chi trả Thứ 2 - 4 - 6'
                    : 'Chi trả T+1 Hàng ngày'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onOpenEditBankModal}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', marginRight: '6px' }}
                >
                  edit
                </span>
                <span>Cập nhật tài khoản thụ hưởng</span>
              </button>
            </div>
          </div>

          {/* Cột 2: Thông tin Hợp đồng & Pháp lý */}
          <div className="finance-section-card">
            <h3 className="finance-section-title">
              <span className="material-symbols-outlined" style={{ color: '#0052cc' }}>
                assignment
              </span>
              <span>Hợp đồng dịch vụ & Hạn mức</span>
            </h3>
            <div style={{ display: 'grid', gap: '14px', fontSize: '13px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}
              >
                <span className="muted">Gói hợp đồng:</span>
                <strong style={{ color: '#0052cc' }}>
                  HỢP ĐỒNG TIÊU CHUẨN (STANDARD MERCHANT)
                </strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}
              >
                <span className="muted">Hình thức ký kết:</span>
                <span style={{ color: '#127a56', fontWeight: 600 }}>
                  E-Contract (Đã KYC trực tuyến)
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}
              >
                <span className="muted">Hạn mức nợ cước cho phép:</span>
                <strong style={{ color: '#ba1a1a' }}>-500.000 VNĐ</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}
              >
                <span className="muted">Phương thức chi trả:</span>
                <span>Batch Transfer tự động qua VietQR / Napas247</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}
              >
                <span className="muted">Chu kỳ đối soát:</span>
                <strong>Thứ 2 - Thứ 4 - Thứ 6 hàng tuần</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: '10px',
                }}
              >
                <span className="muted">Nâng cấp Hợp đồng Doanh nghiệp (VIP):</span>
                <span style={{ color: '#0052cc', fontWeight: 600 }}>
                  Liên hệ KAM để hưởng T+1 và Hạn mức 50.000.000đ
                </span>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              <strong>Hỗ trợ kế toán đối soát:</strong> Nếu phát hiện sai lệch số tiền thu hộ COD
              hoặc cước phí so với thực tế, quý khách vui lòng tạo khiếu nại tại mục{' '}
              <strong>Khiếu nại & Bồi thường</strong> hoặc gửi email về{' '}
              <a href="mailto:finance@nexuslogistics.vn" style={{ color: '#0052cc' }}>
                finance@nexuslogistics.vn
              </a>{' '}
              kèm mã phiên đối soát.
            </div>
          </div>
        </div>
      ) : null}

      {/* Beginner-friendly Explanation Modal for Non-specialists */}
      <FinanceCardExplanationModal
        isOpen={isExplanationModalOpen}
        onClose={() => setIsExplanationModalOpen(false)}
        initialTab={explanationInitialTab}
        onOpenBankModal={onOpenEditBankModal}
        onOpenTopupModal={onShowTopupModal}
      />
    </section>
  );
}
