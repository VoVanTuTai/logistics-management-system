import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import {
  buildBranchScopeTokens,
  formatBranchCurrency,
  isShipmentInBranchScope,
  normalizeBranchCode,
  normalizeBranchText,
  resolveShipmentHub,
  toBranchDateInputValue,
  toBranchDateKey,
} from '../shared/branchBusinessData';
import { BranchTablePagination } from '../shared/BranchTablePagination';
import {
  NexusAlertTriangleIcon,
  NexusAuditShieldIcon,
  NexusBookGuideIcon,
  NexusBranchLedgerIcon,
  NexusCheckCircleIcon,
  NexusCloseIcon,
  NexusCodVaultIcon,
  NexusExportCsvIcon,
  NexusFlowArrow,
  NexusFreightTransitIcon,
  NexusInfoCircleIcon,
  NexusInsightPulse,
  NexusNetSettlementIcon,
  NexusPinBadge,
  NexusWarningBadge,
} from './NexusFinanceIcons';
import './BranchFinanceReconcilePage.css';

interface DebtRow {
  key: string;
  customerKey: string;
  hubCode: string;
  shipmentCount: number;
  codOrdersCount: number;
  codTotal: number;
  feeTotal: number;
  receivable: number;
  netSettlement: number;
  discrepancy: number;
  reconcileStatus: 'MATCHED' | 'DISCREPANCY';
  shipments: ShipmentListItemDto[];
}

type ExplanationTab = 'cod_nature' | 'net_settlement' | 'receivable_formula' | 'discrepancy_cases' | 'faq';

const DEFAULT_RECONCILE_COL_WIDTHS = {
  partner: 240,
  volume: 120,
  codTotal: 150,
  feeTotal: 140,
  receivable: 150,
  netSettlement: 160,
  discrepancy: 120,
  status: 130,
  action: 85,
};

const MIN_RECONCILE_COL_WIDTHS: Record<keyof typeof DEFAULT_RECONCILE_COL_WIDTHS, number> = {
  partner: 160,
  volume: 90,
  codTotal: 110,
  feeTotal: 100,
  receivable: 110,
  netSettlement: 120,
  discrepancy: 85,
  status: 95,
  action: 70,
};

function useResizableColumns<T extends Record<string, number>>(
  storageKey: string,
  defaultWidths: T,
  minWidths: Record<keyof T, number>,
) {
  const [widths, setWidths] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultWidths, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return defaultWidths;
  });

  const resizingRef = useRef<{
    colKey: keyof T | null;
    startX: number;
    startWidth: number;
  }>({ colKey: null, startX: 0, startWidth: 0 });

  const handleMouseDown = useCallback(
    (colKey: keyof T, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = widths[colKey];
      resizingRef.current = { colKey, startX, startWidth };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current.colKey) return;
        const diff = moveEvent.clientX - resizingRef.current.startX;
        const minW = minWidths[resizingRef.current.colKey] || 60;
        const newWidth = Math.max(minW, Math.round(resizingRef.current.startWidth + diff));

        setWidths((prev) => ({
          ...prev,
          [resizingRef.current.colKey!]: newWidth,
        }));
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (resizingRef.current.colKey) {
          setWidths((latest) => {
            try {
              localStorage.setItem(storageKey, JSON.stringify(latest));
            } catch {
              // ignore
            }
            return latest;
          });
        }
        resizingRef.current = { colKey: null, startX: 0, startWidth: 0 };
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [widths, minWidths, storageKey],
  );

  const resetColumnWidth = useCallback(
    (colKey: keyof T) => {
      setWidths((prev) => {
        const next = { ...prev, [colKey]: defaultWidths[colKey] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [defaultWidths, storageKey],
  );

  return { widths, handleMouseDown, resetColumnWidth };
}

function monthStart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function prevMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    from: toBranchDateInputValue(firstDayPrevMonth),
    to: toBranchDateInputValue(lastDayPrevMonth),
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toBranchDateInputValue(d);
}

export function BranchFinanceReconcilePage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeBranchCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toBranchDateInputValue(new Date()), []);
  const [dateFrom, setDateFrom] = useState(monthStart(new Date()));
  const [dateTo, setDateTo] = useState(today);
  const [hubFilter, setHubFilter] = useState(assignedHubCodes[0] ?? 'ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal State
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [activeExplainTab, setActiveExplainTab] = useState<ExplanationTab>('cod_nature');

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});

  const selectedHubCodes = useMemo(
    () => (hubFilter === 'ALL' ? assignedHubCodes : [hubFilter]),
    [assignedHubCodes, hubFilter],
  );
  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], selectedHubCodes),
    [hubsQuery.data, selectedHubCodes],
  );

  const rows = useMemo<DebtRow[]>(() => {
    const groups = new Map<string, DebtRow>();

    for (const shipment of shipmentsQuery.data ?? []) {
      if (!isShipmentInBranchScope(shipment, selectedHubCodes, scopeTokens, canViewAllHubAreas)) {
        continue;
      }

      const createdDate = toBranchDateKey(shipment.createdAt);
      if ((dateFrom && createdDate < dateFrom) || (dateTo && createdDate > dateTo)) {
        continue;
      }

      const customerKey =
        shipment.platform ??
        shipment.senderName ??
        shipment.receiverName ??
        shipment.senderPhone ??
        'Khách lẻ vãng lai';
      const hubCode = resolveShipmentHub(shipment);
      const key = `${customerKey}::${hubCode}`;
      const current =
        groups.get(key) ?? {
          key,
          customerKey,
          hubCode,
          shipmentCount: 0,
          codOrdersCount: 0,
          codTotal: 0,
          feeTotal: 0,
          receivable: 0,
          netSettlement: 0,
          discrepancy: 0,
          reconcileStatus: 'MATCHED' as const,
          shipments: [],
        };

      const codAmount = Math.max(0, shipment.codAmount ?? 0);
      const feeAmount = Math.max(0, shipment.shippingFee ?? 0);
      current.shipmentCount += 1;
      current.shipments.push(shipment);
      if (codAmount > 0) {
        current.codOrdersCount += 1;
      }
      current.codTotal += codAmount;
      current.feeTotal += feeAmount;
      current.receivable += codAmount + feeAmount;
      current.netSettlement = current.codTotal - current.feeTotal;
      current.reconcileStatus = current.discrepancy === 0 ? 'MATCHED' : 'DISCREPANCY';

      groups.set(key, current);
    }

    return Array.from(groups.values()).sort((left, right) => right.receivable - left.receivable);
  }, [
    canViewAllHubAreas,
    dateFrom,
    dateTo,
    scopeTokens,
    selectedHubCodes,
    shipmentsQuery.data,
  ]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalizeBranchText(keyword);
    return rows.filter(
      (row) =>
        !normalizedKeyword ||
        normalizeBranchText(row.customerKey).includes(normalizedKeyword) ||
        normalizeBranchText(row.hubCode).includes(normalizedKeyword),
    );
  }, [keyword, rows]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, hubFilter, keyword, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredRows, pageSize],
  );

  // Table Column Resizing & Multi-Select State
  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns(
    'ops_finance_reconcile_col_widths_v2',
    DEFAULT_RECONCILE_COL_WIDTHS,
    MIN_RECONCILE_COL_WIDTHS,
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [inspectingRow, setInspectingRow] = useState<DebtRow | null>(null);

  const selectedSet = useMemo(() => new Set(selectedRowKeys), [selectedRowKeys]);
  const allVisibleSelected =
    paginatedRows.length > 0 && paginatedRows.every((row) => selectedSet.has(row.key));
  const someVisibleSelected = paginatedRows.some((row) => selectedSet.has(row.key));

  const selectedRows = useMemo(
    () => filteredRows.filter((r) => selectedSet.has(r.key)),
    [filteredRows, selectedSet],
  );

  const handleToggleRow = (key: string, checked: boolean) => {
    setSelectedRowKeys((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));
  };

  const handleToggleAllVisible = (checked: boolean) => {
    if (checked) {
      const pageKeys = paginatedRows.map((r) => r.key);
      setSelectedRowKeys((prev) => Array.from(new Set([...prev, ...pageKeys])));
    } else {
      const pageKeySet = new Set(paginatedRows.map((r) => r.key));
      setSelectedRowKeys((prev) => prev.filter((k) => !pageKeySet.has(k)));
    }
  };

  const hubOptions = useMemo(
    () =>
      Array.from(
        new Set((shipmentsQuery.data ?? []).map(resolveShipmentHub).concat(assignedHubCodes)),
      )
        .filter(Boolean)
        .sort(),
    [assignedHubCodes, shipmentsQuery.data],
  );

  const totals = useMemo(() => {
    const shipmentCount = filteredRows.reduce((sum, row) => sum + row.shipmentCount, 0);
    const codTotal = filteredRows.reduce((sum, row) => sum + row.codTotal, 0);
    const feeTotal = filteredRows.reduce((sum, row) => sum + row.feeTotal, 0);
    const receivable = filteredRows.reduce((sum, row) => sum + row.receivable, 0);
    const discrepancy = filteredRows.reduce((sum, row) => sum + row.discrepancy, 0);
    const netSettlement = codTotal - feeTotal;
    const codOrdersCount = filteredRows.reduce((sum, row) => sum + row.codOrdersCount, 0);
    const avgCod = codOrdersCount > 0 ? Math.round(codTotal / codOrdersCount) : 0;
    const avgFee = shipmentCount > 0 ? Math.round(feeTotal / shipmentCount) : 0;
    const codPercentage =
      shipmentCount > 0 ? Math.round((codOrdersCount / shipmentCount) * 100) : 0;

    return {
      shipmentCount,
      codTotal,
      feeTotal,
      receivable,
      discrepancy,
      netSettlement,
      codOrdersCount,
      avgCod,
      avgFee,
      codPercentage,
    };
  }, [filteredRows]);

  const isLoading = shipmentsQuery.isLoading || hubsQuery.isLoading;
  const loadError = shipmentsQuery.error ?? hubsQuery.error ?? null;

  const openExplainModal = (tab: ExplanationTab) => {
    setActiveExplainTab(tab);
    setIsExplainModalOpen(true);
  };

  const handleExportCsv = (rowsToExport: DebtRow[] = filteredRows, filenameSuffix = '') => {
    const headers = [
      'Khách hàng / Kênh',
      'Bưu cục phụ trách',
      'Kỳ đối soát',
      'Tổng vận đơn',
      'Đơn có COD',
      'Tổng tiền COD (VNĐ)',
      'Tổng cước phí (VNĐ)',
      'Công nợ phải thu (VNĐ)',
      'Thực chuyển ròng Shop (VNĐ)',
      'Chênh lệch (VNĐ)',
      'Trạng thái đối soát',
    ];

    const csvRows = rowsToExport.map((row) => [
      `"${row.customerKey.replace(/"/g, '""')}"`,
      `"${row.hubCode}"`,
      `"${dateFrom} - ${dateTo}"`,
      `"${row.shipmentCount}"`,
      `"${row.codOrdersCount}"`,
      `"${row.codTotal}"`,
      `"${row.feeTotal}"`,
      `"${row.receivable}"`,
      `"${row.netSettlement}"`,
      `"${row.discrepancy}"`,
      `"${row.reconcileStatus === 'MATCHED' ? 'Khớp 100%' : 'Chênh lệch'}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...csvRows.map((cols) => cols.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Bang_ke_doi_soat_cong_no_${hubFilter}_${dateFrom}_${dateTo}${filenameSuffix}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const applyPreset = (preset: 'this_month' | 'prev_month' | '7days' | 'today') => {
    if (preset === 'this_month') {
      setDateFrom(monthStart(new Date()));
      setDateTo(today);
    } else if (preset === 'prev_month') {
      const range = prevMonthRange();
      setDateFrom(range.from);
      setDateTo(range.to);
    } else if (preset === '7days') {
      setDateFrom(daysAgo(7));
      setDateTo(today);
    } else if (preset === 'today') {
      setDateFrom(today);
      setDateTo(today);
    }
  };

  const scopeText = canViewAllHubAreas
    ? hubFilter === 'ALL'
      ? 'Toàn mạng lưới'
      : hubFilter
    : assignedHubCodes.length > 0
    ? assignedHubCodes.join(', ')
    : 'Chưa được gán hub';

  return (
    <section className="ops-finance-reconcile">
      {/* Page Header */}
      <header className="ops-finance-reconcile__header">
        <div className="ops-finance-reconcile__header-info">
          <small>BRANCH_FINANCE_RECONCILE</small>
          <h2>Đối soát công nợ bưu cục</h2>
          <p>
            Giám sát toàn diện dòng tiền luân chuyển qua két bưu cục, cấn trừ cước phí và tiền thu hộ COD.
            Minh bạch 100% bản chất từng khoản tiền dành cho nhân sự vận hành và kế toán bưu cục.
          </p>
        </div>
        <div className="ops-finance-reconcile__header-actions">
          <button
            type="button"
            className="ops-finance-reconcile__guide-btn"
            onClick={() => openExplainModal('cod_nature')}
          >
            <NexusBookGuideIcon size={16} />
            <span>Cẩm nang Dòng tiền bưu cục</span>
          </button>
          <button
            type="button"
            className="ops-finance-reconcile__export-btn"
            onClick={() => handleExportCsv()}
          >
            <NexusExportCsvIcon size={16} />
            <span>Xuất bảng kê (CSV)</span>
          </button>
          <div className="ops-finance-reconcile__scope-pill">
            <span>Phạm vi bưu cục</span>
            <strong>{scopeText}</strong>
          </div>
        </div>
      </header>

      {/* Financial Health Summary Banner */}
      <section className="ops-finance-reconcile__banner">
        <div className="ops-finance-reconcile__banner-content">
          <div className="ops-finance-reconcile__banner-icon">
            <NexusAuditShieldIcon size={18} isMatched={totals.discrepancy === 0} />
          </div>
          <div>
            <strong>Kỳ đối soát từ {dateFrom} đến {dateTo}:</strong> Tổng dòng tiền quản lý thu{' '}
            <strong>{formatBranchCurrency(totals.receivable)}</strong> (gồm {formatBranchCurrency(totals.codTotal)} tiền COD thu hộ và{' '}
            {formatBranchCurrency(totals.feeTotal)} cước vận chuyển bưu cục). Sau khi cấn trừ cước, số dư thực chuyển ròng cho Shop đạt{' '}
            <strong>{formatBranchCurrency(totals.netSettlement)}</strong>. Sổ sách đối soát{' '}
            <strong style={{ color: totals.discrepancy === 0 ? '#15803d' : '#dc2626' }}>
              {totals.discrepancy === 0 ? 'cân bằng khớp 100%' : `có chênh lệch ${formatBranchCurrency(totals.discrepancy)} cần làm rõ`}
            </strong>.
          </div>
        </div>
      </section>

      {/* 5 Rich Financial KPI Cards with Proprietary Circular Exclamation Info Icons (!) */}
      <section className="ops-finance-reconcile__cards" aria-label="Các chỉ số tài chính bưu cục">
        {/* Card 1: Tiền thu hộ COD */}
        <article className="ops-finance-card ops-finance-card--cod">
          <div>
            <div className="ops-finance-card__head">
              <div className="ops-finance-card__title-group">
                <span className="ops-finance-card__icon-wrap">
                  <NexusCodVaultIcon size={18} />
                </span>
                <span className="ops-finance-card__label">Tiền thu hộ COD</span>
                <button
                  type="button"
                  className="ops-finance-info-btn"
                  onClick={() => openExplainModal('cod_nature')}
                  aria-label="Xem giải thích Tiền thu hộ COD"
                >
                  <NexusInfoCircleIcon />
                  <span className="ops-finance-tooltip">
                    Tiền hàng bưu cục thu hộ Shop từ người nhận. Khoản này 100% thuộc về Shop, bưu cục chỉ giữ hộ và phải chuyển trả theo kỳ đối soát.
                  </span>
                </button>
              </div>
              <span className="ops-finance-card__badge ops-finance-card__badge--emerald">
                Giữ hộ Shop
              </span>
            </div>
            <div className="ops-finance-card__body">
              <span className="ops-finance-card__amount">
                {formatBranchCurrency(totals.codTotal)}
              </span>
            </div>
          </div>
          <div className="ops-finance-card__footer">
            <span className="ops-finance-card__subtext">
              {totals.codOrdersCount} đơn COD ({totals.codPercentage}% tổng lượng đơn)
            </span>
            <span className="ops-finance-card__subtext">
              Bình quân: {formatBranchCurrency(totals.avgCod)} / đơn
            </span>
          </div>
        </article>

        {/* Card 2: Cước dịch vụ chuyển phát */}
        <article className="ops-finance-card ops-finance-card--fee">
          <div>
            <div className="ops-finance-card__head">
              <div className="ops-finance-card__title-group">
                <span className="ops-finance-card__icon-wrap">
                  <NexusFreightTransitIcon size={18} />
                </span>
                <span className="ops-finance-card__label">Cước dịch vụ bưu chính</span>
                <button
                  type="button"
                  className="ops-finance-info-btn"
                  onClick={() => openExplainModal('receivable_formula')}
                  aria-label="Xem giải thích Cước dịch vụ chuyển phát"
                >
                  <NexusInfoCircleIcon />
                  <span className="ops-finance-tooltip">
                    Doanh thu dịch vụ của bưu cục/công ty. Bao gồm cước vận chuyển, phụ phí hàng cồng kềnh/dễ vỡ và phí bảo hiểm hàng giá trị cao.
                  </span>
                </button>
              </div>
              <span className="ops-finance-card__badge ops-finance-card__badge--blue">
                Doanh thu bưu cục
              </span>
            </div>
            <div className="ops-finance-card__body">
              <span className="ops-finance-card__amount">
                {formatBranchCurrency(totals.feeTotal)}
              </span>
            </div>
          </div>
          <div className="ops-finance-card__footer">
            <span className="ops-finance-card__subtext">
              Cước bình quân: {formatBranchCurrency(totals.avgFee)} / đơn
            </span>
            <span className="ops-finance-card__subtext">
              Tỷ lệ cước/COD: {totals.codTotal > 0 ? ((totals.feeTotal / totals.codTotal) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </article>

        {/* Card 3: Tổng công nợ phải thu */}
        <article className="ops-finance-card ops-finance-card--receivable">
          <div>
            <div className="ops-finance-card__head">
              <div className="ops-finance-card__title-group">
                <span className="ops-finance-card__icon-wrap">
                  <NexusBranchLedgerIcon size={18} />
                </span>
                <span className="ops-finance-card__label">Tổng công nợ phải thu</span>
                <button
                  type="button"
                  className="ops-finance-info-btn"
                  onClick={() => openExplainModal('receivable_formula')}
                  aria-label="Xem giải thích Tổng công nợ phải thu"
                >
                  <NexusInfoCircleIcon />
                  <span className="ops-finance-tooltip">
                    Tổng giá trị dòng tiền bưu cục có trách nhiệm thu hồi từ khách hàng và bưu tá trong kỳ (= COD thu hộ + Cước người nhận trả).
                  </span>
                </button>
              </div>
              <span className="ops-finance-card__badge ops-finance-card__badge--indigo">
                Quản lý thu
              </span>
            </div>
            <div className="ops-finance-card__body">
              <span className="ops-finance-card__amount">
                {formatBranchCurrency(totals.receivable)}
              </span>
            </div>
          </div>
          <div className="ops-finance-card__footer">
            <span className="ops-finance-card__subtext">
              Quy mô: {totals.shipmentCount} vận đơn phát sinh
            </span>
            <span className="ops-finance-card__subtext">
              Phát sinh từ: {filteredRows.length} đối tác/kênh
            </span>
          </div>
        </article>

        {/* Card 4: Thực chuyển ròng Shop (Net Settlement) */}
        <article className="ops-finance-card ops-finance-card--net">
          <div>
            <div className="ops-finance-card__head">
              <div className="ops-finance-card__title-group">
                <span className="ops-finance-card__icon-wrap">
                  <NexusNetSettlementIcon size={18} />
                </span>
                <span className="ops-finance-card__label">Thực chuyển ròng Shop</span>
                <button
                  type="button"
                  className="ops-finance-info-btn"
                  onClick={() => openExplainModal('net_settlement')}
                  aria-label="Xem giải thích Thực chuyển ròng Shop"
                >
                  <NexusInfoCircleIcon />
                  <span className="ops-finance-tooltip">
                    Số tiền thực tế chuyển khoản trả Shop sau khi đã tự động cấn trừ cước phí (= Tổng COD thu hộ - Tổng cước phí vận chuyển).
                  </span>
                </button>
              </div>
              <span className="ops-finance-card__badge ops-finance-card__badge--teal">
                Cấn trừ ròng
              </span>
            </div>
            <div className="ops-finance-card__body">
              <span className="ops-finance-card__amount">
                {formatBranchCurrency(totals.netSettlement)}
              </span>
            </div>
          </div>
          <div className="ops-finance-card__footer">
            <span className="ops-finance-card__subtext">
              Công thức: COD thu hộ - Cước phí
            </span>
            <span className="ops-finance-card__subtext">
              Lịch đối soát: Thứ 2 - Thứ 4 - Thứ 6
            </span>
          </div>
        </article>

        {/* Card 5: Chênh lệch đối soát */}
        <article
          className={`ops-finance-card ${
            totals.discrepancy === 0
              ? 'ops-finance-card--discrepancy'
              : 'ops-finance-card--discrepancy-alert'
          }`}
        >
          <div>
            <div className="ops-finance-card__head">
              <div className="ops-finance-card__title-group">
                <span className="ops-finance-card__icon-wrap">
                  <NexusAuditShieldIcon size={18} isMatched={totals.discrepancy === 0} />
                </span>
                <span className="ops-finance-card__label">Chênh lệch đối soát</span>
                <button
                  type="button"
                  className="ops-finance-info-btn"
                  onClick={() => openExplainModal('discrepancy_cases')}
                  aria-label="Xem giải thích Chênh lệch đối soát"
                >
                  <NexusInfoCircleIcon />
                  <span className="ops-finance-tooltip">
                    Sai lệch giữa chứng từ hệ thống và số tiền thực thu thực tế vào tài khoản. Cần = 0 đ để đảm bảo sổ sách kế toán cân bằng an toàn.
                  </span>
                </button>
              </div>
              <span
                className={`ops-finance-card__badge ${
                  totals.discrepancy === 0
                    ? 'ops-finance-card__badge--green'
                    : 'ops-finance-card__badge--danger'
                }`}
              >
                {totals.discrepancy === 0 ? 'Cân bằng 100%' : 'Cần kiểm tra'}
              </span>
            </div>
            <div className="ops-finance-card__body">
              <span className="ops-finance-card__amount">
                {formatBranchCurrency(totals.discrepancy)}
              </span>
            </div>
          </div>
          <div className="ops-finance-card__footer">
            <span className="ops-finance-card__subtext">
              {totals.discrepancy === 0
                ? 'Khớp 100% dữ liệu tạm tính'
                : 'Phát hiện sai lệch cần rà soát'}
            </span>
            <span className="ops-finance-card__subtext">
              Kiểm soát tự động SePay &amp; Hệ thống
            </span>
          </div>
        </article>
      </section>

      {/* Filter Section with Quick Presets */}
      <section className="ops-finance-reconcile__filters">
        <div className="ops-finance-reconcile__presets">
          <span>Chọn nhanh kỳ đối soát</span>
          <div className="ops-finance-reconcile__preset-buttons">
            <button
              type="button"
              className={`ops-finance-reconcile__preset-btn ${
                dateFrom === monthStart(new Date()) && dateTo === today
                  ? 'ops-finance-reconcile__preset-btn--active'
                  : ''
              }`}
              onClick={() => applyPreset('this_month')}
            >
              Tháng này
            </button>
            <button
              type="button"
              className="ops-finance-reconcile__preset-btn"
              onClick={() => applyPreset('prev_month')}
            >
              Tháng trước
            </button>
            <button
              type="button"
              className="ops-finance-reconcile__preset-btn"
              onClick={() => applyPreset('7days')}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              className={`ops-finance-reconcile__preset-btn ${
                dateFrom === today && dateTo === today
                  ? 'ops-finance-reconcile__preset-btn--active'
                  : ''
              }`}
              onClick={() => applyPreset('today')}
            >
              Hôm nay
            </button>
          </div>
        </div>

        <label>
          <span>Từ ngày</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>
        <label>
          <span>Đến ngày</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>
        <label>
          <span>Bưu cục chịu trách nhiệm</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            {canViewAllHubAreas ? <option value="ALL">Toàn mạng lưới</option> : null}
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tìm kiếm đối tác / kênh</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tên khách hàng, kênh bán hoặc bưu cục..."
          />
        </label>
      </section>

      {/* Backend Status Notice */}
      <p className="ops-finance-reconcile__notice">
        <NexusInfoCircleIcon size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '6px' }} />
        <strong>Lưu ý nghiệp vụ:</strong> Dữ liệu công nợ trên được trích xuất trực tiếp từ các vận đơn đã phát sinh trong kỳ theo chuẩn đối soát bưu chính. Khi chốt kỳ, số dư COD sau khi trừ cước sẽ tự động được chi trả cho khách hàng qua tài khoản ngân hàng liên kết.
      </p>

      {loadError ? (
        <p className="ops-branch-workflow__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      {/* Batch Action Toolbar when rows are selected */}
      {selectedRows.length > 0 ? (
        <section className="ops-finance-batch-bar" aria-label="Thao tác hàng loạt">
          <div className="ops-finance-batch-bar__info">
            <span>
              Đã chọn <strong>{selectedRows.length}</strong> / {filteredRows.length} đối tác trên bảng kê
            </span>
          </div>
          <div className="ops-finance-batch-bar__actions">
            <button
              type="button"
              className="ops-finance-batch-bar__btn"
              onClick={() => handleExportCsv(selectedRows, `_chon_${selectedRows.length}_doi_tac`)}
            >
              <NexusExportCsvIcon size={14} />
              <span>Xuất bảng kê các đối tác đã chọn ({selectedRows.length})</span>
            </button>
            <button
              type="button"
              className="ops-finance-batch-bar__clear-btn"
              onClick={() => setSelectedRowKeys([])}
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </section>
      ) : null}

      {/* Main Reconcile Data Table */}
      <section className="ops-finance-reconcile__panel">
        <header className="ops-finance-reconcile__panel-head">
          <div>
            <h3>Bảng kê công nợ đối tác &amp; Khách hàng theo kỳ</h3>
          </div>
          <span>{isLoading ? 'Đang tải...' : `${filteredRows.length} đối tác trong kỳ`}</span>
        </header>

        {isLoading ? (
          <p className="ops-branch-workflow__loading">Đang tải và tổng hợp dữ liệu công nợ vận đơn...</p>
        ) : null}

        <div className="ops-finance-reconcile__table-shell">
          <table className="ops-finance-reconcile__table">
            <thead>
              <tr>
                <th className="ops-finance-reconcile__th ops-finance-reconcile__th--select">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả đối tác trên trang"
                    checked={allVisibleSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someVisibleSelected && !allVisibleSelected;
                      }
                    }}
                    onChange={(e) => handleToggleAllVisible(e.target.checked)}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th"
                  style={{ width: widths.partner, minWidth: widths.partner, maxWidth: widths.partner }}
                >
                  <span>Khách hàng / Kênh &amp; Bưu cục</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('partner', e)}
                    onDoubleClick={() => resetColumnWidth('partner')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th num"
                  style={{ width: widths.volume, minWidth: widths.volume, maxWidth: widths.volume }}
                >
                  <span>Vận đơn (COD)</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('volume', e)}
                    onDoubleClick={() => resetColumnWidth('volume')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th num"
                  style={{ width: widths.codTotal, minWidth: widths.codTotal, maxWidth: widths.codTotal }}
                >
                  <span>Tiền COD thu hộ</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('codTotal', e)}
                    onDoubleClick={() => resetColumnWidth('codTotal')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th num"
                  style={{ width: widths.feeTotal, minWidth: widths.feeTotal, maxWidth: widths.feeTotal }}
                >
                  <span>Cước dịch vụ</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('feeTotal', e)}
                    onDoubleClick={() => resetColumnWidth('feeTotal')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th num"
                  style={{ width: widths.receivable, minWidth: widths.receivable, maxWidth: widths.receivable }}
                >
                  <span>Công nợ phải thu</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('receivable', e)}
                    onDoubleClick={() => resetColumnWidth('receivable')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th num"
                  style={{ width: widths.netSettlement, minWidth: widths.netSettlement, maxWidth: widths.netSettlement }}
                >
                  <span>Thực chuyển ròng</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('netSettlement', e)}
                    onDoubleClick={() => resetColumnWidth('netSettlement')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th num"
                  style={{ width: widths.discrepancy, minWidth: widths.discrepancy, maxWidth: widths.discrepancy }}
                >
                  <span>Chênh lệch</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('discrepancy', e)}
                    onDoubleClick={() => resetColumnWidth('discrepancy')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th"
                  style={{ width: widths.status, minWidth: widths.status, maxWidth: widths.status }}
                >
                  <span>Trạng thái</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    onDoubleClick={() => resetColumnWidth('status')}
                  />
                </th>
                <th
                  className="ops-finance-reconcile__th text-center"
                  style={{ width: widths.action, minWidth: widths.action, maxWidth: widths.action }}
                >
                  <span>Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const checked = selectedSet.has(row.key);
                const avgCod = row.codOrdersCount > 0 ? Math.round(row.codTotal / row.codOrdersCount) : 0;
                const feeRatio = row.codTotal > 0 ? ((row.feeTotal / row.codTotal) * 100).toFixed(1) : '0';
                const codPercentage = row.shipmentCount > 0 ? Math.round((row.codOrdersCount / row.shipmentCount) * 100) : 0;

                return (
                  <tr
                    key={row.key}
                    className={`ops-finance-reconcile__tr ${checked ? 'ops-finance-reconcile__tr--selected' : ''}`}
                  >
                    <td className="ops-finance-reconcile__td ops-finance-reconcile__td--select">
                      <input
                        type="checkbox"
                        aria-label={`Chọn đối tác ${row.customerKey}`}
                        checked={checked}
                        onChange={(e) => handleToggleRow(row.key, e.target.checked)}
                      />
                    </td>
                    <td className="ops-finance-reconcile__td" style={{ width: widths.partner, maxWidth: widths.partner }}>
                      <div className="ops-finance-reconcile__cell-primary">
                        <strong className="ops-finance-reconcile__customer-name" title={row.customerKey}>
                          {row.customerKey}
                        </strong>
                      </div>
                      <div className="ops-finance-reconcile__cell-subline">
                        <span className="ops-finance-reconcile__hub-badge">{row.hubCode}</span>
                        <span className="ops-finance-reconcile__period-pill">
                          {dateFrom} → {dateTo}
                        </span>
                      </div>
                    </td>
                    <td className="ops-finance-reconcile__td num" style={{ width: widths.volume, maxWidth: widths.volume }}>
                      <div className="ops-finance-reconcile__cell-primary">
                        <strong>{row.shipmentCount}</strong> đơn
                      </div>
                      <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                        {row.codOrdersCount} COD ({codPercentage}%)
                      </div>
                    </td>
                    <td className="ops-finance-reconcile__td num" style={{ width: widths.codTotal, maxWidth: widths.codTotal }}>
                      <div className="ops-finance-reconcile__cell-primary">
                        <strong style={{ color: '#059669' }}>{formatBranchCurrency(row.codTotal)}</strong>
                      </div>
                      <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                        BQ: {formatBranchCurrency(avgCod)}/đơn
                      </div>
                    </td>
                    <td className="ops-finance-reconcile__td num" style={{ width: widths.feeTotal, maxWidth: widths.feeTotal }}>
                      <div className="ops-finance-reconcile__cell-primary">
                        <strong style={{ color: '#2563eb' }}>{formatBranchCurrency(row.feeTotal)}</strong>
                      </div>
                      <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                        Tỷ lệ: {feeRatio}% COD
                      </div>
                    </td>
                    <td className="ops-finance-reconcile__td num" style={{ width: widths.receivable, maxWidth: widths.receivable }}>
                      <div className="ops-finance-reconcile__cell-primary">
                        <strong style={{ color: '#4f46e5' }}>{formatBranchCurrency(row.receivable)}</strong>
                      </div>
                      <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                        COD + Cước
                      </div>
                    </td>
                    <td className="ops-finance-reconcile__td num" style={{ width: widths.netSettlement, maxWidth: widths.netSettlement }}>
                      <div className="ops-finance-reconcile__cell-primary">
                        <strong style={{ color: '#0d9488', fontSize: '13.5px' }}>
                          {formatBranchCurrency(row.netSettlement)}
                        </strong>
                      </div>
                      <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num" style={{ color: '#0d9488', fontWeight: 700 }}>
                        = COD - Cước
                      </div>
                    </td>
                    <td className="ops-finance-reconcile__td num" style={{ width: widths.discrepancy, maxWidth: widths.discrepancy }}>
                      <div className="ops-finance-reconcile__cell-primary">
                        <strong style={{ color: row.discrepancy === 0 ? '#64748b' : '#dc2626' }}>
                          {formatBranchCurrency(row.discrepancy)}
                        </strong>
                      </div>
                      <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                        {row.discrepancy === 0 ? (
                          <span style={{ color: '#16a34a' }}>Cân bằng 100%</span>
                        ) : (
                          <span style={{ color: '#dc2626' }}>Lệch sổ</span>
                        )}
                      </div>
                    </td>
                    <td className="ops-finance-reconcile__td" style={{ width: widths.status, maxWidth: widths.status }}>
                      <span
                        className={`ops-finance-reconcile__status-pill ${
                          row.reconcileStatus === 'MATCHED'
                            ? 'ops-finance-reconcile__status-pill--matched'
                            : 'ops-finance-reconcile__status-pill--discrepancy'
                        }`}
                      >
                        {row.reconcileStatus === 'MATCHED' ? (
                          <>
                            <NexusCheckCircleIcon size={12} />
                            <span>Khớp 100%</span>
                          </>
                        ) : (
                          <>
                            <NexusAlertTriangleIcon size={12} />
                            <span>Chênh lệch</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="ops-finance-reconcile__td text-center" style={{ width: widths.action, maxWidth: widths.action }}>
                      <button
                        type="button"
                        className="ops-finance-reconcile__inspect-btn"
                        onClick={() => setInspectingRow(row)}
                        title="Xem chi tiết danh sách vận đơn phát sinh"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Total Summary Row */}
            <tfoot className="ops-finance-reconcile__tfoot">
              <tr>
                <td className="ops-finance-reconcile__td ops-finance-reconcile__td--select" />
                <td className="ops-finance-reconcile__td" style={{ width: widths.partner }}>
                  <div className="ops-finance-reconcile__cell-primary">
                    <strong>TỔNG CỘNG ({filteredRows.length} đối tác)</strong>
                  </div>
                  <div className="ops-finance-reconcile__cell-subline">
                    Kỳ: {dateFrom} → {dateTo}
                  </div>
                </td>
                <td className="ops-finance-reconcile__td num" style={{ width: widths.volume }}>
                  <div className="ops-finance-reconcile__cell-primary">
                    <strong>{totals.shipmentCount}</strong> đơn
                  </div>
                  <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                    {totals.codOrdersCount} COD ({totals.codPercentage}%)
                  </div>
                </td>
                <td className="ops-finance-reconcile__td num" style={{ width: widths.codTotal }}>
                  <div className="ops-finance-reconcile__cell-primary">
                    <strong style={{ color: '#059669' }}>{formatBranchCurrency(totals.codTotal)}</strong>
                  </div>
                  <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                    BQ: {formatBranchCurrency(totals.avgCod)}/đơn
                  </div>
                </td>
                <td className="ops-finance-reconcile__td num" style={{ width: widths.feeTotal }}>
                  <div className="ops-finance-reconcile__cell-primary">
                    <strong style={{ color: '#2563eb' }}>{formatBranchCurrency(totals.feeTotal)}</strong>
                  </div>
                  <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                    Cước TB: {formatBranchCurrency(totals.avgFee)}
                  </div>
                </td>
                <td className="ops-finance-reconcile__td num" style={{ width: widths.receivable }}>
                  <div className="ops-finance-reconcile__cell-primary">
                    <strong style={{ color: '#4f46e5' }}>{formatBranchCurrency(totals.receivable)}</strong>
                  </div>
                  <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                    Quản lý thu
                  </div>
                </td>
                <td className="ops-finance-reconcile__td num" style={{ width: widths.netSettlement }}>
                  <div className="ops-finance-reconcile__cell-primary">
                    <strong style={{ color: '#0d9488', fontSize: '13.5px' }}>
                      {formatBranchCurrency(totals.netSettlement)}
                    </strong>
                  </div>
                  <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num" style={{ color: '#0d9488', fontWeight: 700 }}>
                    Thực chuyển ròng
                  </div>
                </td>
                <td className="ops-finance-reconcile__td num" style={{ width: widths.discrepancy }}>
                  <div className="ops-finance-reconcile__cell-primary">
                    <strong style={{ color: totals.discrepancy === 0 ? '#15803d' : '#dc2626' }}>
                      {formatBranchCurrency(totals.discrepancy)}
                    </strong>
                  </div>
                  <div className="ops-finance-reconcile__cell-subline ops-finance-reconcile__cell-subline--num">
                    {totals.discrepancy === 0 ? 'Khớp 100%' : 'Có sai lệch'}
                  </div>
                </td>
                <td className="ops-finance-reconcile__td" style={{ width: widths.status }}>
                  <span className="ops-finance-reconcile__status-pill ops-finance-reconcile__status-pill--matched">
                    <NexusCheckCircleIcon size={12} />
                    <span>{totals.discrepancy === 0 ? 'Toàn bộ khớp' : 'Có đơn lệch'}</span>
                  </span>
                </td>
                <td className="ops-finance-reconcile__td" style={{ width: widths.action }} />
              </tr>
            </tfoot>
          </table>
        </div>

        <BranchTablePagination
          totalRows={filteredRows.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        {!isLoading && filteredRows.length === 0 ? (
          <p className="ops-branch-workflow__empty">
            Không có dữ liệu vận đơn phát sinh công nợ trong khoảng thời gian đã chọn.
          </p>
        ) : null}
      </section>

      {/* ==========================================================================
          INTERACTIVE FINANCE EXPLANATION MODAL (Cẩm nang Dòng tiền Bưu cục)
          ========================================================================== */}
      {isExplainModalOpen && (
        <div
          className="ops-explain-modal-backdrop"
          onClick={() => setIsExplainModalOpen(false)}
        >
          <div
            className="ops-explain-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ops-explain-title"
          >
            {/* Modal Header */}
            <div className="ops-explain-modal__head">
              <div className="ops-explain-modal__head-title">
                <div className="ops-explain-modal__circle-icon">
                  <NexusInfoCircleIcon size={20} />
                </div>
                <div>
                  <h3 id="ops-explain-title">Cẩm nang Dòng tiền &amp; Đối soát Công nợ Bưu cục</h3>
                  <p>
                    Giải thích chi tiết bản chất dòng tiền, phân biệt tiền COD và cước phí dành cho người mới
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ops-explain-modal__close-btn"
                onClick={() => setIsExplainModalOpen(false)}
                aria-label="Đóng cửa sổ"
              >
                <NexusCloseIcon size={16} />
              </button>
            </div>

            {/* Modal Tabs with NEXUS Vector Icons */}
            <div className="ops-explain-modal__tabs">
              <button
                type="button"
                className={`ops-explain-modal__tab-btn ${
                  activeExplainTab === 'cod_nature' ? 'ops-explain-modal__tab-btn--active' : ''
                }`}
                onClick={() => setActiveExplainTab('cod_nature')}
              >
                <NexusCodVaultIcon size={16} />
                <span>1. Tiền COD là gì?</span>
              </button>
              <button
                type="button"
                className={`ops-explain-modal__tab-btn ${
                  activeExplainTab === 'net_settlement' ? 'ops-explain-modal__tab-btn--active' : ''
                }`}
                onClick={() => setActiveExplainTab('net_settlement')}
              >
                <NexusNetSettlementIcon size={16} />
                <span>2. Công thức Cấn trừ Ròng</span>
              </button>
              <button
                type="button"
                className={`ops-explain-modal__tab-btn ${
                  activeExplainTab === 'receivable_formula' ? 'ops-explain-modal__tab-btn--active' : ''
                }`}
                onClick={() => setActiveExplainTab('receivable_formula')}
              >
                <NexusBranchLedgerIcon size={16} />
                <span>3. Công nợ phải thu &amp; Cước</span>
              </button>
              <button
                type="button"
                className={`ops-explain-modal__tab-btn ${
                  activeExplainTab === 'discrepancy_cases' ? 'ops-explain-modal__tab-btn--active' : ''
                }`}
                onClick={() => setActiveExplainTab('discrepancy_cases')}
              >
                <NexusAuditShieldIcon size={16} isMatched={false} />
                <span>4. Chênh lệch đối soát</span>
              </button>
              <button
                type="button"
                className={`ops-explain-modal__tab-btn ${
                  activeExplainTab === 'faq' ? 'ops-explain-modal__tab-btn--active' : ''
                }`}
                onClick={() => setActiveExplainTab('faq')}
              >
                <NexusInfoCircleIcon size={16} />
                <span>5. Câu hỏi thường gặp (FAQ)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="ops-explain-modal__body">
              {activeExplainTab === 'cod_nature' && (
                <div className="ops-explain-section">
                  <h4>Bản chất Tiền thu hộ COD (Cash On Delivery) - Tiền của ai?</h4>
                  <p>
                    Rất nhiều người mới nhầm lẫn rằng <strong>tiền COD là doanh thu của bưu cục</strong>. Điều này <strong>hoàn toàn sai</strong>.
                  </p>
                  <p>
                    Tiền COD là <strong>tiền hàng của Người bán (Shop/Merchant)</strong> mà Bưu tá/Bưu cục thu hộ từ Người nhận (Consignee) khi kiện hàng được giao thành công.
                  </p>
                  <div className="ops-explain-diagram">
                    <div className="ops-explain-diagram__step">
                      <span>Bước 1</span>
                      <strong>Người mua</strong>
                      <small>Trả tiền mặt/chuyển khoản cho Shipper</small>
                    </div>
                    <div className="ops-explain-diagram__step">
                      <span>Bước 2</span>
                      <strong>Shipper / Bưu tá</strong>
                      <small>Nộp 100% tiền về két Bưu cục</small>
                    </div>
                    <div className="ops-explain-diagram__step">
                      <span>Bước 3</span>
                      <strong>Két Bưu cục</strong>
                      <small>Nộp về Tài khoản Công ty (VietQR / SePay)</small>
                    </div>
                    <div className="ops-explain-diagram__step">
                      <span>Bước 4</span>
                      <strong>Tài khoản Shop</strong>
                      <small>Hệ thống tự động chuyển trả tiền hàng cho Shop</small>
                    </div>
                  </div>
                  <div className="ops-explain-example">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <NexusPinBadge size={16} style={{ color: '#059669' }} />
                      <strong>Quy tắc cốt tử của ngành bưu chính:</strong>
                    </div>
                    Bưu cục chỉ giữ hộ tạm thời. Tuyệt đối không được xem tiền COD là doanh thu hay tự ý lấy tiền COD để chi trả các chi phí vận hành khác.
                  </div>
                </div>
              )}

              {activeExplainTab === 'net_settlement' && (
                <div className="ops-explain-section">
                  <h4>Cơ chế Cấn trừ Ròng (Net Cash Settlement) hoạt động ra sao?</h4>
                  <p>
                    Trong thương mại điện tử, Shop thường không trả tiền cước lẻ từng đơn mỗi ngày. Thay vào đó, hệ thống tự động cấn trừ tiền cước trực tiếp vào tiền COD thu hộ trước khi chuyển khoản cho Shop:
                  </p>
                  <div className="ops-explain-formula">
                    Thực chuyển ròng trả Shop = Tổng tiền COD thu hộ - Tổng cước phí dịch vụ
                  </div>
                  <div className="ops-explain-example">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <NexusInsightPulse size={16} style={{ color: '#0284c7' }} />
                      <strong>Ví dụ thực tế dễ hiểu:</strong>
                    </div>
                    - Shop giao 1 gói hàng trị giá COD: <strong>500.000 đ</strong>.
                    <br />
                    - Tiền cước vận chuyển bưu cục: <strong>35.000 đ</strong>.
                    <br />
                    - Khi bưu tá giao thành công, thu về 500.000 đ từ người mua.
                    <br />
                    - Đến kỳ đối soát (T2 - T4 - T6): Hệ thống giữ lại 35.000 đ cước doanh thu, và chuyển khoản đúng <strong>465.000 đ</strong> cho Shop. Cả Shop và Bưu cục đều không phải thao tác chuyển khoản qua lại nhiều lần!
                  </div>
                </div>
              )}

              {activeExplainTab === 'receivable_formula' && (
                <div className="ops-explain-section">
                  <h4>Tổng công nợ phải thu &amp; Cước phí dịch vụ bưu cục</h4>
                  <p>
                    <strong>Cước phí dịch vụ chuyển phát:</strong> Đây mới chính là <strong>Doanh thu thực tế</strong> của hãng vận chuyển. Bao gồm: Cước vận chuyển chặng chính, phụ phí hàng cồng kềnh, phụ phí hàng dễ vỡ, và bảo hiểm hàng giá trị cao (0.5% giá trị khai báo).
                  </p>
                  <div className="ops-explain-formula">
                    Tổng công nợ phải thu = Tiền thu hộ COD + Cước phí người nhận trả
                  </div>
                  <p>
                    <strong>Tại sao Công nợ phải thu lại lớn hơn Tiền COD?</strong>
                    <br />
                    Vì ngoài việc thu hộ tiền hàng cho Shop, bưu tá còn thu thêm tiền cước từ người mua (với các đơn người mua chịu tiền ship). Tổng dòng tiền mà bưu tá phải mang về nộp vào két bưu cục chính là Công nợ phải thu.
                  </p>
                </div>
              )}

              {activeExplainTab === 'discrepancy_cases' && (
                <div className="ops-explain-section">
                  <h4>Chênh lệch đối soát là gì và khi nào phát sinh?</h4>
                  <p>
                    <strong>Chênh lệch</strong> là khoảng cách giữa <em>Số tiền tạm tính theo chứng từ hệ thống</em> và <em>Số tiền thực thu nộp vào tài khoản ngân hàng</em>.
                  </p>
                  <p>
                    Trong điều kiện chuẩn mực, <strong>Chênh lệch phải bằng 0 đ</strong> (sổ sách cân đối 100%).
                  </p>
                  <div className="ops-explain-example" style={{ borderLeftColor: '#d97706', background: '#fffbeb', color: '#92400e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <NexusWarningBadge size={16} style={{ color: '#d97706' }} />
                      <strong>Các nguyên nhân thường gặp khi có chênh lệch:</strong>
                    </div>
                    1. <strong>Bưu tá làm tròn tiền:</strong> Đơn 49.000 đ nhưng thu 50.000 đ hoặc ngược lại bưu tá bớt tiền khách.
                    <br />
                    2. <strong>Phát sinh phụ phí chặng phụ:</strong> Khách đổi địa chỉ giao sang huyện khác, hệ thống tự động cộng thêm phụ phí chuyển tiếp.
                    <br />
                    3. <strong>Bồi thường hàng vỡ hỏng:</strong> Tiền bồi thường khiếu nại được cấn trừ trực tiếp vào công nợ của bưu cục/bưu tá.
                    <br />
                    4. <strong>Lệnh chuyển khoản SePay bị treo:</strong> Giao dịch ngân hàng xử lý chậm trong giờ cao điểm.
                  </div>
                </div>
              )}

              {activeExplainTab === 'faq' && (
                <div className="ops-explain-section">
                  <h4>Câu hỏi thường gặp dành cho nhân sự bưu cục (FAQ)</h4>
                  <p>
                    <strong>Q1: Bưu cục có được dùng tiền COD để tạm ứng lương hoặc mua đồ dùng không?</strong>
                    <br />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <NexusFlowArrow size={12} style={{ color: '#dc2626' }} />
                      <em>Tuyệt đối không!</em>
                    </span>{' '}
                    Tiền COD là tài sản của Shop. Sử dụng tiền COD sai mục đích sẽ dẫn đến lệch két cuối ngày và vi phạm nghiêm trọng quy chế tài chính bưu chính.
                  </p>
                  <p>
                    <strong>Q2: Khi nào tiền COD được chuyển trả cho Shop?</strong>
                    <br />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <NexusFlowArrow size={12} style={{ color: '#0284c7' }} />
                      <span>Hệ thống hỗ trợ chu kỳ đối soát tự động linh hoạt:</span>
                    </span>{' '}
                    Định kỳ 3 lần/tuần (Thứ 2, 4, 6) hoặc đối soát tức thời ngay sau khi bưu tá quét nộp tiền thành công.
                  </p>
                  <p>
                    <strong>Q3: Nếu đơn hàng bị hoàn về thì tính tiền thế nào?</strong>
                    <br />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <NexusFlowArrow size={12} style={{ color: '#0d9488' }} />
                      <span>Đơn giao bất thành hoàn về sẽ không có tiền COD thu hộ (COD = 0 đ).</span>
                    </span>{' '}
                    Cước chuyển hoàn (thường bằng 50% cước chiều đi) sẽ được ghi nhận vào công nợ và trừ vào tiền COD của các đơn giao thành công khác của Shop đó.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="ops-explain-modal__foot">
              <button
                type="button"
                onClick={() => setIsExplainModalOpen(false)}
              >
                Đã hiểu, đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==========================================================================
          PARTNER RECONCILIATION DRILL-DOWN MODAL (Chi tiết Vận đơn Đối soát)
          ========================================================================== */}
      {inspectingRow ? (
        <div
          className="ops-explain-modal-backdrop"
          onClick={() => setInspectingRow(null)}
          role="presentation"
        >
          <div
            className="ops-explain-modal ops-explain-modal--wide"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ops-drilldown-title"
          >
            <div className="ops-explain-modal__head">
              <div className="ops-explain-modal__head-title">
                <div className="ops-explain-modal__circle-icon">
                  <NexusBranchLedgerIcon size={20} />
                </div>
                <div>
                  <h3 id="ops-drilldown-title">
                    Bảng kê chi tiết vận đơn: {inspectingRow.customerKey}
                  </h3>
                  <p>
                    Bưu cục phụ trách: <strong>{inspectingRow.hubCode}</strong> · Kỳ đối soát: <strong>{dateFrom} → {dateTo}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ops-explain-modal__close-btn"
                onClick={() => setInspectingRow(null)}
                aria-label="Đóng cửa sổ"
              >
                <NexusCloseIcon size={16} />
              </button>
            </div>

            {/* Quick Stat Summary Cards for this partner */}
            <div className="ops-finance-drilldown-stats">
              <div className="ops-finance-drilldown-stat">
                <small>Tổng vận đơn</small>
                <strong>{inspectingRow.shipmentCount}</strong>
                <span>({inspectingRow.codOrdersCount} đơn có COD)</span>
              </div>
              <div className="ops-finance-drilldown-stat">
                <small>Tiền thu hộ COD</small>
                <strong style={{ color: '#059669' }}>{formatBranchCurrency(inspectingRow.codTotal)}</strong>
                <span>Tiền giữ hộ chuyển Shop</span>
              </div>
              <div className="ops-finance-drilldown-stat">
                <small>Cước dịch vụ chuyển phát</small>
                <strong style={{ color: '#2563eb' }}>{formatBranchCurrency(inspectingRow.feeTotal)}</strong>
                <span>Doanh thu bưu cục</span>
              </div>
              <div className="ops-finance-drilldown-stat">
                <small>Thực chuyển ròng Shop</small>
                <strong style={{ color: '#0d9488' }}>{formatBranchCurrency(inspectingRow.netSettlement)}</strong>
                <span>= COD - Cước phí</span>
              </div>
            </div>

            {/* Shipments List Table */}
            <div className="ops-finance-drilldown-table-wrap">
              <table className="ops-finance-drilldown-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>STT</th>
                    <th>Mã vận đơn</th>
                    <th>Ngày tạo</th>
                    <th>Người nhận &amp; SĐT</th>
                    <th className="num">Tiền COD</th>
                    <th className="num">Cước phí</th>
                    <th>Trạng thái đơn</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectingRow.shipments.map((s, idx) => (
                    <tr key={s.id || s.shipmentCode}>
                      <td>{idx + 1}</td>
                      <td>
                        <CopyableShipmentCode code={s.shipmentCode} />
                      </td>
                      <td>
                        <small>{formatDateTime(s.createdAt)}</small>
                      </td>
                      <td>
                        <strong>{s.receiverName || 'Khách nhận'}</strong>
                        {s.receiverPhone ? (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{s.receiverPhone}</div>
                        ) : null}
                      </td>
                      <td className="num">
                        <strong style={{ color: '#059669' }}>
                          {formatBranchCurrency(s.codAmount ?? 0)}
                        </strong>
                      </td>
                      <td className="num">
                        <strong style={{ color: '#2563eb' }}>
                          {formatBranchCurrency(s.shippingFee ?? 0)}
                        </strong>
                      </td>
                      <td>
                        <span className="ops-finance-reconcile__shipment-status">
                          {formatShipmentStatusLabel(s.currentStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ops-explain-modal__foot">
              <button
                type="button"
                onClick={() => setInspectingRow(null)}
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
