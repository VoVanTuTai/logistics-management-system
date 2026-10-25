import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useColumnSelection } from '../../../../hooks/useColumnSelection';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatNdrStatusLabel, formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { NDR_REASON_MAP } from '../../../ndr/NdrCasesTable';
import './OpsMetricsAbnormalHandlingPage.css';

interface OpsMetricsAbnormalHandlingPageProps {
  title?: string;
  summary?: string;
}

export type AbnormalCategory =
  | 'NDR'
  | 'DELIVERY_FAILED'
  | 'RETURN_STARTED'
  | 'RETURN_COMPLETED'
  | 'INVENTORY_CHECK';

export interface AbnormalItem {
  id: string;
  type: 'ndr' | 'shipment';
  code: string;
  category: AbnormalCategory;
  categoryLabel: string;
  reason: string;
  hubCode: string;
  owner: string;
  updatedAt: string;
  ageHours: number;
  status: string;
  statusLabel: string;
  isOverdue: boolean;
  isResolved: boolean;
  ndrId?: string;
  shipmentId?: string;
}

const FAILED_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'INVENTORY_CHECK',
]);

const RESOLVED_STATUSES = new Set(['CLOSED', 'RESOLVED', 'RETURN_COMPLETED', 'DELIVERED']);

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function resolveShipmentHub(shipment: ShipmentListItemDto): string {
  return (
    normalize(shipment.currentLocation) ||
    normalize(shipment.receiverHubCode) ||
    normalize(shipment.destinationHubCode) ||
    normalize(shipment.originHubCode) ||
    normalize(shipment.senderHubCode) ||
    'CHƯA XÁC ĐỊNH'
  );
}

function calcAgeHours(timestamp: string | null | undefined): number {
  if (!timestamp) return 0;
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 3600000));
}

function formatHoursBadge(hours: number): string {
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function OpsMetricsAbnormalHandlingPage({
  title = 'Theo dõi & Xử lý Kiện Bất thường',
  summary = 'Giám sát tiến độ giải tỏa các ca sự cố giao hàng, phiếu sự cố NDR và luồng chuyển hoàn theo chuẩn thời hiệu SLA 24h.',
}: OpsMetricsAbnormalHandlingPageProps): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const ndrQuery = useNdrCasesQuery(accessToken, {}, { refetchInterval: 15000 });

  const tableShellRef = useRef<HTMLDivElement>(null);
  const { copyColumn, renderToast } = useColumnSelection(tableShellRef, {
    labels: {
      stt: 'STT',
      code: 'Mã vận đơn',
      category: 'Phân loại',
      reason: 'Lý do sự cố',
      hub: 'Bưu cục phụ trách',
      owner: 'Phụ trách / Khách',
      updatedAt: 'Cập nhật cuối',
      ageHours: 'Tuổi tồn đọng',
      status: 'Trạng thái',
      actions: 'Thao tác',
    },
  });

  // Build unified operational items
  const allItems: AbnormalItem[] = useMemo(() => {
    const shipmentList = shipmentsQuery.data ?? [];
    const ndrList = ndrQuery.data ?? [];

    const shipmentMap = new Map<string, ShipmentListItemDto>();
    shipmentList.forEach((s) => {
      const code = normalize(s.shipmentCode);
      if (code) {
        shipmentMap.set(code, s);
      }
    });

    const items: AbnormalItem[] = [];
    const processedCodes = new Set<string>();

    // 1. Process NDR cases first (highest operational priority for action)
    ndrList.forEach((ndr: NdrCaseListItemDto) => {
      const code = (ndr.shipmentCode ?? '').trim();
      if (!code) return;

      const normCode = normalize(code);
      processedCodes.add(normCode);

      const hours = calcAgeHours(ndr.updatedAt || ndr.createdAt);
      const isResolved = RESOLVED_STATUSES.has(normalize(ndr.status));
      const isOverdue = hours >= 24 && !isResolved;

      const matchingShipment = shipmentMap.get(normCode);
      const hubCode =
        normalize(ndr.reportedHubCode) ||
        (matchingShipment ? resolveShipmentHub(matchingShipment) : 'BƯU CỤC PHÁT');

      const reasonText =
        (ndr.reasonCode && NDR_REASON_MAP[ndr.reasonCode]) ||
        ndr.note ||
        ndr.reasonCode ||
        'Giao không thành công';

      items.push({
        id: ndr.id,
        type: 'ndr',
        code,
        category: 'NDR',
        categoryLabel: 'Phiếu sự cố NDR',
        reason: reasonText,
        hubCode,
        owner: ndr.reportedBy || matchingShipment?.receiverName || 'Chưa phân công',
        updatedAt: ndr.updatedAt || ndr.createdAt || new Date().toISOString(),
        ageHours: hours,
        status: normalize(ndr.status),
        statusLabel: formatNdrStatusLabel(ndr.status),
        isOverdue,
        isResolved,
        ndrId: ndr.id,
        shipmentId: matchingShipment?.id,
      });
    });

    // 2. Process abnormal shipments not already captured as NDR
    shipmentList.forEach((s: ShipmentListItemDto) => {
      const normStatus = normalize(s.currentStatus);
      if (!FAILED_STATUSES.has(normStatus)) return;

      const code = (s.shipmentCode ?? '').trim();
      const normCode = normalize(code);
      if (processedCodes.has(normCode)) {
        return; // Already tracked via NDR case
      }

      const hours = calcAgeHours(s.updatedAt || s.createdAt);
      const isResolved = RESOLVED_STATUSES.has(normStatus);
      const isOverdue = hours >= 24 && !isResolved;

      let category: AbnormalCategory = 'DELIVERY_FAILED';
      let categoryLabel = 'Giao thất bại';
      if (normStatus === 'RETURN_STARTED') {
        category = 'RETURN_STARTED';
        categoryLabel = 'Đang chuyển hoàn';
      } else if (normStatus === 'RETURN_COMPLETED') {
        category = 'RETURN_COMPLETED';
        categoryLabel = 'Đã hoàn tất';
      } else if (normStatus === 'INVENTORY_CHECK') {
        category = 'INVENTORY_CHECK';
        categoryLabel = 'Kiểm kê kho';
      } else if (normStatus === 'NDR_CREATED') {
        category = 'NDR';
        categoryLabel = 'Chờ xử lý NDR';
      }

      const reasonText =
        s.deliveryNote || formatShipmentStatusLabel(s.currentStatus) || 'Kiện cần kiểm tra thao tác';

      items.push({
        id: s.id,
        type: 'shipment',
        code,
        category,
        categoryLabel,
        reason: reasonText,
        hubCode: resolveShipmentHub(s),
        owner: s.receiverName || s.senderName || '---',
        updatedAt: s.updatedAt || s.createdAt || new Date().toISOString(),
        ageHours: hours,
        status: normStatus,
        statusLabel: formatShipmentStatusLabel(s.currentStatus),
        isOverdue,
        isResolved,
        shipmentId: s.id,
      });
    });

    // Sort by ageHours descending (most critical oldest items first)
    return items.sort((a, b) => b.ageHours - a.ageHours);
  }, [ndrQuery.data, shipmentsQuery.data]);

  // Overall KPI counts
  const totalCount = allItems.length;
  const overdueCount = allItems.filter((i) => i.isOverdue).length;
  const inProgressCount = allItems.filter((i) => !i.isResolved && !i.isOverdue).length;
  const resolvedCount = allItems.filter((i) => i.isResolved).length;

  // Filtered items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Tab filter
      if (activeTab === 'OVERDUE' && !item.isOverdue) return false;
      if (activeTab === 'IN_PROGRESS' && (item.isResolved || item.isOverdue)) return false;
      if (activeTab === 'RESOLVED' && !item.isResolved) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      // Hub filter
      if (hubFilter !== 'ALL' && item.hubCode !== hubFilter) return false;

      // Keyword search
      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchReason = item.reason.toLowerCase().includes(q);
        const matchOwner = item.owner.toLowerCase().includes(q);
        const matchHub = item.hubCode.toLowerCase().includes(q);
        if (!matchCode && !matchReason && !matchOwner && !matchHub) return false;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const itemDate = item.updatedAt ? item.updatedAt.slice(0, 10) : '';
        if (dateFrom && itemDate < dateFrom) return false;
        if (dateTo && itemDate > dateTo) return false;
      }

      return true;
    });
  }, [activeTab, allItems, categoryFilter, dateFrom, dateTo, hubFilter, keyword]);

  // Distinct hubs for dropdown
  const hubOptions = useMemo(() => {
    return Array.from(new Set(allItems.map((i) => i.hubCode))).filter(Boolean).sort();
  }, [allItems]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [currentPage, filteredItems, pageSize]);

  const handleRefresh = () => {
    void shipmentsQuery.refetch();
    void ndrQuery.refetch();
    setLastRefreshedAt(new Date());
  };

  const handleResetFilters = () => {
    setActiveTab('ALL');
    setKeyword('');
    setCategoryFilter('ALL');
    setHubFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const isLoading = shipmentsQuery.isLoading || ndrQuery.isLoading;
  const loadError = shipmentsQuery.error ?? ndrQuery.error ?? null;

  return (
    <div className="ops-abnormal-page">
      {/* Page Header */}
      <header className="ops-abnormal-header">
        <div className="ops-abnormal-header__title-block">
          <div className="ops-abnormal-header__meta">
            <span className="ops-abnormal-badge-code">OPS-SLA-24H</span>
            <span className="ops-abnormal-header__update-time">
              Cập nhật: {lastRefreshedAt.toLocaleTimeString('vi-VN')}
            </span>
          </div>
          <h1 className="ops-abnormal-header__title">{title}</h1>
          <p className="ops-abnormal-header__summary">{summary}</p>
        </div>
        <div className="ops-abnormal-header__actions">
          <button
            type="button"
            className="ops-abnormal-refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Tải lại dữ liệu sự cố mới nhất"
          >
            {isLoading ? 'Đang cập nhật...' : 'Làm mới'}
          </button>
        </div>
      </header>

      {/* SLA Metric Cards */}
      <section className="ops-abnormal-metrics" aria-label="Thống kê ca sự cố">
        <article className="ops-abnormal-metric-card" data-tone="neutral">
          <span className="ops-abnormal-metric-card__label">Tổng ca sự cố</span>
          <strong className="ops-abnormal-metric-card__value">{totalCount}</strong>
          <span className="ops-abnormal-metric-card__hint">Vận đơn lỗi & phiếu NDR</span>
        </article>

        <article className="ops-abnormal-metric-card" data-tone="danger">
          <span className="ops-abnormal-metric-card__label">Quá hạn 24h (Báo động SLA)</span>
          <strong className="ops-abnormal-metric-card__value">{overdueCount}</strong>
          <span className="ops-abnormal-metric-card__hint">Tồn đọng &gt;24h chưa đóng</span>
        </article>

        <article className="ops-abnormal-metric-card" data-tone="warning">
          <span className="ops-abnormal-metric-card__label">Đang xử lý trong hạn</span>
          <strong className="ops-abnormal-metric-card__value">{inProgressCount}</strong>
          <span className="ops-abnormal-metric-card__hint">&lt;24h đang điều phối</span>
        </article>

        <article className="ops-abnormal-metric-card" data-tone="success">
          <span className="ops-abnormal-metric-card__label">Đã đóng / Hoàn tất</span>
          <strong className="ops-abnormal-metric-card__value">{resolvedCount}</strong>
          <span className="ops-abnormal-metric-card__hint">
            Đã giải quyết ({totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}%)
          </span>
        </article>
      </section>

      {/* Main Panel */}
      <div className="ops-abnormal-panel">
        {/* Quick Filter Tabs */}
        <div className="ops-abnormal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ALL'}
            className={`ops-abnormal-tab ${activeTab === 'ALL' ? 'ops-abnormal-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
          >
            Tất cả sự cố <span className="ops-abnormal-tab__count">{totalCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'OVERDUE'}
            className={`ops-abnormal-tab ops-abnormal-tab--danger ${
              activeTab === 'OVERDUE' ? 'ops-abnormal-tab--active' : ''
            }`}
            onClick={() => {
              setActiveTab('OVERDUE');
              setPage(1);
            }}
          >
            Quá hạn 24h (Báo động SLA){' '}
            <span className="ops-abnormal-tab__count ops-abnormal-tab__count--danger">
              {overdueCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'IN_PROGRESS'}
            className={`ops-abnormal-tab ${
              activeTab === 'IN_PROGRESS' ? 'ops-abnormal-tab--active' : ''
            }`}
            onClick={() => {
              setActiveTab('IN_PROGRESS');
              setPage(1);
            }}
          >
            Đang xử lý (&lt;24h){' '}
            <span className="ops-abnormal-tab__count">{inProgressCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'RESOLVED'}
            className={`ops-abnormal-tab ${activeTab === 'RESOLVED' ? 'ops-abnormal-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('RESOLVED');
              setPage(1);
            }}
          >
            Đã giải quyết / Đóng{' '}
            <span className="ops-abnormal-tab__count">{resolvedCount}</span>
          </button>
        </div>

        {/* Detailed Filter Bar */}
        <div className="ops-abnormal-filter-bar">
          <div className="ops-abnormal-filter-item ops-abnormal-filter-item--search">
            <label htmlFor="abnormal-search-input">Tìm kiếm</label>
            <input
              id="abnormal-search-input"
              type="text"
              placeholder="Mã đơn, lý do, người phụ trách..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="ops-abnormal-filter-item">
            <label htmlFor="abnormal-category-select">Phân loại sự cố</label>
            <select
              id="abnormal-category-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="NDR">Phiếu sự cố NDR</option>
              <option value="DELIVERY_FAILED">Giao thất bại</option>
              <option value="RETURN_STARTED">Đang chuyển hoàn</option>
              <option value="RETURN_COMPLETED">Đã hoàn tất</option>
              <option value="INVENTORY_CHECK">Kiểm kê kho</option>
            </select>
          </div>

          <div className="ops-abnormal-filter-item">
            <label htmlFor="abnormal-hub-select">Bưu cục / Hub</label>
            <select
              id="abnormal-hub-select"
              value={hubFilter}
              onChange={(e) => {
                setHubFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả bưu cục</option>
              {hubOptions.map((hub) => (
                <option key={hub} value={hub}>
                  {hub}
                </option>
              ))}
            </select>
          </div>

          <div className="ops-abnormal-filter-item ops-abnormal-filter-item--date">
            <label htmlFor="abnormal-date-from">Từ ngày</label>
            <input
              id="abnormal-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="ops-abnormal-filter-item ops-abnormal-filter-item--date">
            <label htmlFor="abnormal-date-to">Đến ngày</label>
            <input
              id="abnormal-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="ops-abnormal-filter-item ops-abnormal-filter-item--btn">
            <button
              type="button"
              className="ops-abnormal-btn-reset"
              onClick={handleResetFilters}
              title="Đặt lại tất cả bộ lọc"
            >
              Đặt lại
            </button>
          </div>
        </div>

        {/* Error notification */}
        {loadError && (
          <div className="ops-abnormal-error-banner" role="alert">
            {getErrorMessage(loadError)}
          </div>
        )}

        {/* Table Shell */}
        <div className="ops-abnormal-table-shell" ref={tableShellRef}>
          <table className="ops-abnormal-table">
            <thead>
              <tr>
                <th
                  data-col-key="stt"
                  style={{ width: 48, minWidth: 48, maxWidth: 48, textAlign: 'center' }}
                  onDoubleClick={() => copyColumn('stt', 'STT')}
                  title="Nhấp đúp để sao chép cột STT"
                >
                  STT
                </th>
                <th
                  data-col-key="code"
                  style={{ width: 160, minWidth: 160, maxWidth: 160 }}
                  onDoubleClick={() => copyColumn('code', 'Mã vận đơn')}
                  title="Bôi đen kéo chuột để sao chép mã vận đơn • Nhấp đúp để sao chép cả cột"
                >
                  Mã vận đơn
                </th>
                <th
                  data-col-key="category"
                  style={{ width: 140, minWidth: 140, maxWidth: 140 }}
                  onDoubleClick={() => copyColumn('category', 'Phân loại')}
                  title="Nhấp đúp để sao chép"
                >
                  Phân loại
                </th>
                <th
                  data-col-key="reason"
                  style={{ width: 230, minWidth: 230, maxWidth: 230 }}
                  onDoubleClick={() => copyColumn('reason', 'Lý do sự cố')}
                  title="Nhấp đúp để sao chép"
                >
                  Lý do sự cố
                </th>
                <th
                  data-col-key="hub"
                  style={{ width: 130, minWidth: 130, maxWidth: 130 }}
                  onDoubleClick={() => copyColumn('hub', 'Bưu cục phụ trách')}
                  title="Nhấp đúp để sao chép"
                >
                  Bưu cục
                </th>
                <th
                  data-col-key="owner"
                  style={{ width: 150, minWidth: 150, maxWidth: 150 }}
                  onDoubleClick={() => copyColumn('owner', 'Phụ trách / Khách')}
                  title="Nhấp đúp để sao chép"
                >
                  Phụ trách / Khách
                </th>
                <th
                  data-col-key="updatedAt"
                  style={{ width: 140, minWidth: 140, maxWidth: 140 }}
                  onDoubleClick={() => copyColumn('updatedAt', 'Cập nhật cuối')}
                  title="Nhấp đúp để sao chép"
                >
                  Cập nhật cuối
                </th>
                <th
                  data-col-key="ageHours"
                  style={{ width: 120, minWidth: 120, maxWidth: 120 }}
                  onDoubleClick={() => copyColumn('ageHours', 'Tuổi tồn đọng')}
                  title="Nhấp đúp để sao chép"
                >
                  Tuổi tồn đọng
                </th>
                <th
                  data-col-key="status"
                  style={{ width: 130, minWidth: 130, maxWidth: 130 }}
                  onDoubleClick={() => copyColumn('status', 'Trạng thái')}
                  title="Nhấp đúp để sao chép"
                >
                  Trạng thái
                </th>
                <th
                  data-col-key="actions"
                  style={{ width: 170, minWidth: 170, maxWidth: 170, textAlign: 'center' }}
                >
                  Thao tác xử lý
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="ops-abnormal-empty-cell">
                    Đang tải dữ liệu ca sự cố...
                  </td>
                </tr>
              )}

              {!isLoading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="ops-abnormal-empty-cell">
                    Không có ca sự cố nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}

              {paginatedItems.map((item, index) => {
                const rowIndex = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className={`ops-abnormal-row ${item.isOverdue ? 'ops-abnormal-row--overdue' : ''}`}
                  >
                    {/* STT */}
                    <td
                      data-col-key="stt"
                      data-copy-value={String(rowIndex)}
                      className="ops-abnormal-cell ops-abnormal-cell--center ops-abnormal-cell--muted"
                    >
                      {rowIndex}
                    </td>

                    {/* Clean Selectable Monospace Tracking Code */}
                    <td
                      data-col-key="code"
                      data-copy-value={item.code}
                      className="ops-abnormal-cell ops-abnormal-cell--code"
                    >
                      <span
                        className="ops-abnormal-code-text"
                        title="Bôi đen kéo chuột để sao chép mã vận đơn (Ctrl+C)"
                      >
                        {item.code}
                      </span>
                    </td>

                    {/* Phân loại nguồn */}
                    <td
                      data-col-key="category"
                      data-copy-value={item.categoryLabel}
                      className="ops-abnormal-cell"
                    >
                      <span className={`ops-abnormal-cat-badge ops-abnormal-cat-badge--${item.category.toLowerCase()}`}>
                        {item.categoryLabel}
                      </span>
                    </td>

                    {/* Lý do sự cố */}
                    <td
                      data-col-key="reason"
                      data-copy-value={item.reason}
                      className="ops-abnormal-cell ops-abnormal-cell--reason"
                      title={item.reason}
                    >
                      {item.reason}
                    </td>

                    {/* Bưu cục phụ trách */}
                    <td
                      data-col-key="hub"
                      data-copy-value={item.hubCode}
                      className="ops-abnormal-cell"
                      title={item.hubCode}
                    >
                      {item.hubCode}
                    </td>

                    {/* Phụ trách / Khách */}
                    <td
                      data-col-key="owner"
                      data-copy-value={item.owner}
                      className="ops-abnormal-cell"
                      title={item.owner}
                    >
                      {item.owner}
                    </td>

                    {/* Thời điểm cập nhật cuối */}
                    <td
                      data-col-key="updatedAt"
                      data-copy-value={formatDateTime(item.updatedAt)}
                      className="ops-abnormal-cell ops-abnormal-cell--muted"
                    >
                      {formatDateTime(item.updatedAt)}
                    </td>

                    {/* Tuổi tồn đọng */}
                    <td
                      data-col-key="ageHours"
                      data-copy-value={`${item.ageHours} giờ`}
                      className="ops-abnormal-cell"
                    >
                      {item.isOverdue ? (
                        <span className="ops-abnormal-age-badge ops-abnormal-age-badge--danger" title="Vi phạm SLA xử lý 24 giờ">
                          {formatHoursBadge(item.ageHours)} (Trễ SLA)
                        </span>
                      ) : (
                        <span className="ops-abnormal-age-badge ops-abnormal-age-badge--normal">
                          {formatHoursBadge(item.ageHours)}
                        </span>
                      )}
                    </td>

                    {/* Trạng thái xử lý */}
                    <td
                      data-col-key="status"
                      data-copy-value={item.statusLabel}
                      className="ops-abnormal-cell"
                    >
                      <span
                        className={`ops-abnormal-status-badge ${
                          item.isResolved ? 'ops-abnormal-status-badge--resolved' : ''
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </td>

                    {/* Thao tác xử lý trực tiếp */}
                    <td
                      data-col-key="actions"
                      className="ops-abnormal-cell ops-abnormal-cell--actions"
                    >
                      <div className="ops-abnormal-actions-group">
                        {item.type === 'ndr' ? (
                          <>
                            <Link
                              to={routePaths.ndrDetail(item.id)}
                              className="ops-abnormal-act-btn ops-abnormal-act-btn--primary"
                              title="Mở hồ sơ NDR để hẹn lịch phát lại hoặc đăng ký hoàn"
                            >
                              Xử lý NDR
                            </Link>
                            <Link
                              to={routePaths.trackingDetail(item.code)}
                              className="ops-abnormal-act-btn ops-abnormal-act-btn--secondary"
                              title="Xem vết quét hành trình"
                            >
                              Hành trình
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to={routePaths.trackingDetail(item.code)}
                              className="ops-abnormal-act-btn ops-abnormal-act-btn--primary"
                              title="Xem vết quét hành trình"
                            >
                              Hành trình
                            </Link>
                            {item.shipmentId ? (
                              <Link
                                to={routePaths.shipmentDetail(item.shipmentId)}
                                className="ops-abnormal-act-btn ops-abnormal-act-btn--secondary"
                                title="Xem chi tiết vận đơn"
                              >
                                Xem đơn
                              </Link>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <footer className="ops-abnormal-pagination">
          <div className="ops-abnormal-pagination__info">
            Hiển thị{' '}
            <strong>
              {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(filteredItems.length, currentPage * pageSize)}
            </strong>{' '}
            trên tổng số <strong>{filteredItems.length}</strong> ca sự cố
          </div>

          <div className="ops-abnormal-pagination__controls">
            <div className="ops-abnormal-pagination__pagesize">
              <span>Số dòng / trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[15, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="ops-abnormal-pagination__nav">
              <button
                type="button"
                className="ops-abnormal-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </button>
              <span className="ops-abnormal-page-indicator">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="ops-abnormal-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        </footer>
      </div>

      {renderToast()}
    </div>
  );
}
