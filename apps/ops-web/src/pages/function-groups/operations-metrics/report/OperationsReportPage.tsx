import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  HelpCircle,
  Layers,
  MapPin,
  RotateCcw,
  Search,
  TrendingUp,
} from 'lucide-react';

import { useManifestsQuery } from '../../../../features/manifests/manifests.api';
import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import './OperationsReportPage.css';

type ReportStatusFilter = 'all' | 'open' | 'delivered' | 'exception' | 'overdue';
type KpiTone = 'primary' | 'success' | 'warning' | 'danger';
type HubSortKey = 'total' | 'delivered' | 'open' | 'overdue' | 'sla48';

interface HubReportRow {
  hubCode: string;
  total: number;
  delivered: number;
  open: number;
  exception: number;
  overdue: number;
  sla48: number;
}

const FINAL_STATUSES = new Set(['DELIVERED', 'RETURN_COMPLETED', 'CANCELLED']);
const EXCEPTION_STATUSES = new Set(['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED', 'RETURN_COMPLETED']);

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toDateInputValue(date);
}

function ageHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
}

function durationHours(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) {
    return null;
  }
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, Math.round((end - start) / 3600000));
}

function resolveShipmentHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeCode(shipment.currentLocation) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
  );
}

function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) {
    return '0%';
  }
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

function isOverdueShipment(shipment: ShipmentListItemDto): boolean {
  if (normalizeCode(shipment.currentStatus) === 'DELIVERED') {
    return false;
  }
  const hours = ageHours(shipment.updatedAt ?? shipment.createdAt);
  return hours !== null && hours >= 24;
}

function isWithinDateRange(value: string, from: string, to: string): boolean {
  const dateKey = toDateKey(value);
  return dateKey >= from && dateKey <= to;
}

function downloadCsv(filename: string, rows: string[][]): void {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function OperationsReportPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const today = toDateInputValue(new Date());

  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return toDateInputValue(date);
  }, []);

  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return toDateInputValue(date);
  }, []);

  const firstDayOfMonth = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    return toDateInputValue(date);
  }, []);

  const [fromDate, setFromDate] = useState(sevenDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [hubCode, setHubCode] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('all');
  const [hubSearch, setHubSearch] = useState('');
  const [hubSortKey, setHubSortKey] = useState<HubSortKey>('total');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 30000 });
  const tasksQuery = useTasksQuery(accessToken, {}, { refetchInterval: 30000 });
  const manifestsQuery = useManifestsQuery(accessToken);
  const ndrQuery = useNdrCasesQuery(accessToken);

  const shipments = shipmentsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const manifests = manifestsQuery.data ?? [];
  const ndrCases = ndrQuery.data ?? [];
  const loadError = shipmentsQuery.error ?? tasksQuery.error ?? manifestsQuery.error ?? ndrQuery.error ?? null;

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    await Promise.all([
      shipmentsQuery.refetch(),
      tasksQuery.refetch(),
      manifestsQuery.refetch(),
      ndrQuery.refetch(),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const activePreset = useMemo<'today' | '7d' | '30d' | 'month' | 'custom'>(() => {
    if (toDate !== today) {
      return 'custom';
    }
    if (fromDate === today) {
      return 'today';
    }
    if (fromDate === sevenDaysAgo) {
      return '7d';
    }
    if (fromDate === thirtyDaysAgo) {
      return '30d';
    }
    if (fromDate === firstDayOfMonth) {
      return 'month';
    }
    return 'custom';
  }, [firstDayOfMonth, fromDate, sevenDaysAgo, thirtyDaysAgo, toDate, today]);

  const applyPreset = (preset: 'today' | '7d' | '30d' | 'month') => {
    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === '7d') {
      setFromDate(sevenDaysAgo);
      setToDate(today);
    } else if (preset === '30d') {
      setFromDate(thirtyDaysAgo);
      setToDate(today);
    } else if (preset === 'month') {
      setFromDate(firstDayOfMonth);
      setToDate(today);
    }
  };

  const availableHubs = useMemo(() => {
    return Array.from(new Set(shipments.map(resolveShipmentHub))).filter(Boolean).sort();
  }, [shipments]);

  const scopedShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const status = normalizeCode(shipment.currentStatus);
      const inDateRange = isWithinDateRange(shipment.createdAt, fromDate, toDate);
      const inHub = hubCode === 'all' || resolveShipmentHub(shipment) === hubCode;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && !FINAL_STATUSES.has(status)) ||
        (statusFilter === 'delivered' && status === 'DELIVERED') ||
        (statusFilter === 'exception' && EXCEPTION_STATUSES.has(status)) ||
        (statusFilter === 'overdue' && isOverdueShipment(shipment));
      return inDateRange && inHub && matchesStatus;
    });
  }, [fromDate, hubCode, shipments, statusFilter, toDate]);

  const deliveredShipments = scopedShipments.filter((shipment) => normalizeCode(shipment.currentStatus) === 'DELIVERED');
  const openShipments = scopedShipments.filter((shipment) => !FINAL_STATUSES.has(normalizeCode(shipment.currentStatus)));
  const exceptionShipments = scopedShipments.filter((shipment) => EXCEPTION_STATUSES.has(normalizeCode(shipment.currentStatus)));
  const overdueShipments = scopedShipments.filter(isOverdueShipment);
  const sla48Shipments = deliveredShipments.filter((shipment) => {
    const hours = durationHours(shipment.createdAt, shipment.updatedAt);
    return hours !== null && hours <= 48;
  });

  const openTasks = tasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(normalizeCode(task.status))).length;
  const openNdr = ndrCases.filter((ndr) => normalizeCode(ndr.status) !== 'CLOSED').length;
  const openManifests = manifests.filter((manifest) => !['RECEIVED', 'CLOSED'].includes(normalizeCode(manifest.status))).length;

  // Pipeline distribution percentages
  const totalCount = scopedShipments.length;
  const deliveredPct = totalCount > 0 ? (deliveredShipments.length / totalCount) * 100 : 0;
  const overduePct = totalCount > 0 ? (overdueShipments.length / totalCount) * 100 : 0;
  const exceptionPct = totalCount > 0 ? (exceptionShipments.length / totalCount) * 100 : 0;
  const openPct = Math.max(0, 100 - (deliveredPct + overduePct + exceptionPct));

  const sla48Pct = deliveredShipments.length > 0 ? Math.round((sla48Shipments.length / deliveredShipments.length) * 1000) / 10 : 0;

  const hubRows = useMemo<HubReportRow[]>(() => {
    const grouped = new Map<string, HubReportRow>();
    for (const shipment of scopedShipments) {
      const hub = resolveShipmentHub(shipment);
      const row =
        grouped.get(hub) ??
        {
          hubCode: hub,
          total: 0,
          delivered: 0,
          open: 0,
          exception: 0,
          overdue: 0,
          sla48: 0,
        };
      const status = normalizeCode(shipment.currentStatus);
      row.total += 1;
      row.delivered += status === 'DELIVERED' ? 1 : 0;
      row.open += FINAL_STATUSES.has(status) ? 0 : 1;
      row.exception += EXCEPTION_STATUSES.has(status) ? 1 : 0;
      row.overdue += isOverdueShipment(shipment) ? 1 : 0;
      const hours = durationHours(shipment.createdAt, shipment.updatedAt);
      row.sla48 += status === 'DELIVERED' && hours !== null && hours <= 48 ? 1 : 0;
      grouped.set(hub, row);
    }
    return Array.from(grouped.values()).sort((left, right) => right.total - left.total);
  }, [scopedShipments]);

  // Top 5 hubs for comparison visual chart
  const topHubs = useMemo(() => {
    return hubRows.slice(0, 5);
  }, [hubRows]);

  // Filtered & sorted hub rows for the detail table
  const filteredHubRows = useMemo(() => {
    let rows = hubRows;
    if (hubSearch.trim()) {
      const query = hubSearch.trim().toUpperCase();
      rows = rows.filter((r) => r.hubCode.toUpperCase().includes(query));
    }
    return [...rows].sort((a, b) => {
      if (hubSortKey === 'delivered') {
        return b.delivered - a.delivered;
      }
      if (hubSortKey === 'open') {
        return b.open - a.open;
      }
      if (hubSortKey === 'overdue') {
        return b.overdue - a.overdue;
      }
      if (hubSortKey === 'sla48') {
        const rateA = a.delivered > 0 ? a.sla48 / a.delivered : 0;
        const rateB = b.delivered > 0 ? b.sla48 / b.delivered : 0;
        return rateB - rateA;
      }
      return b.total - a.total;
    });
  }, [hubRows, hubSearch, hubSortKey]);

  // Aggregate totals for the table summary row
  const tableSummary = useMemo(() => {
    return hubRows.reduce(
      (acc, row) => {
        acc.total += row.total;
        acc.delivered += row.delivered;
        acc.open += row.open;
        acc.exception += row.exception;
        acc.overdue += row.overdue;
        acc.sla48 += row.sla48;
        return acc;
      },
      { total: 0, delivered: 0, open: 0, exception: 0, overdue: 0, sla48: 0 },
    );
  }, [hubRows]);

  const topExceptions = scopedShipments
    .filter((shipment) => EXCEPTION_STATUSES.has(normalizeCode(shipment.currentStatus)) || isOverdueShipment(shipment))
    .slice()
    .sort((left, right) => (ageHours(right.updatedAt) ?? 0) - (ageHours(left.updatedAt) ?? 0))
    .slice(0, 8);

  const kpis: Array<{
    label: string;
    value: string;
    detail: string;
    hint: string;
    tone: KpiTone;
    to: string;
    icon: React.ReactNode;
    meterPct?: number;
  }> = [
    {
      label: 'Tổng đơn trong kỳ',
      value: String(scopedShipments.length),
      detail: `${fromDate} đến ${toDate}`,
      hint: 'Toàn bộ vận đơn phát sinh theo bộ lọc thời gian',
      tone: 'primary',
      to: routePaths.shipments,
      icon: <Layers size={16} className="ops-report__kpi-icon" />,
    },
    {
      label: 'Giao xong',
      value: formatPercent(deliveredShipments.length, scopedShipments.length),
      detail: `${deliveredShipments.length}/${scopedShipments.length} đơn hoàn tất`,
      hint: 'Tỷ lệ đơn phát thành công trên tổng đơn',
      tone: 'success',
      to: routePaths.shipments,
      icon: <CheckCircle2 size={16} className="ops-report__kpi-icon" />,
      meterPct: totalCount > 0 ? (deliveredShipments.length / totalCount) * 100 : 0,
    },
    {
      label: 'Giao đúng 48h',
      value: formatPercent(sla48Shipments.length, deliveredShipments.length),
      detail: `${sla48Shipments.length}/${deliveredShipments.length} đơn đã giao`,
      hint: 'Tỷ lệ hoàn tất trong hạn định cam kết 48 giờ',
      tone: 'success',
      to: routePaths.shipments,
      icon: <Clock size={16} className="ops-report__kpi-icon" />,
      meterPct: deliveredShipments.length > 0 ? (sla48Shipments.length / deliveredShipments.length) * 100 : 0,
    },
    {
      label: 'Cần xử lý ngay',
      value: String(overdueShipments.length),
      detail: 'Đơn không cập nhật quá 24h',
      hint: 'Ưu tiên kiểm tra trước ca: đơn còn mở chưa đổi trạng thái',
      tone: overdueShipments.length > 0 ? 'danger' : 'success',
      to: routePaths.opsMetricsDeadlineInventory,
      icon: <AlertTriangle size={16} className="ops-report__kpi-icon" />,
    },
    {
      label: 'Đơn bất thường',
      value: String(exceptionShipments.length + openNdr),
      detail: `${exceptionShipments.length} đơn, ${openNdr} NDR mở`,
      hint: 'Sự cố giao hàng, NDR hoặc khiếu nại đang xử lý',
      tone: exceptionShipments.length + openNdr > 0 ? 'warning' : 'success',
      to: routePaths.serviceQualityAbnormalManagement,
      icon: <AlertOctagon size={16} className="ops-report__kpi-icon" />,
    },
    {
      label: 'Việc đang mở',
      value: String(openTasks + openManifests),
      detail: `${openTasks} task, ${openManifests} manifest`,
      hint: 'Công việc điều phối & chuyến xe chưa hoàn tất',
      tone: openTasks + openManifests > 0 ? 'primary' : 'success',
      to: routePaths.operationsPlatformPickupDispatch,
      icon: <TrendingUp size={16} className="ops-report__kpi-icon" />,
    },
  ];

  const handleExport = (): void => {
    const rows = [
      ['Hub', 'Tong don', 'Da giao', 'Dang mo', 'Bat thuong', 'Qua han', 'SLA 48h'],
      ...hubRows.map((row) => [
        row.hubCode,
        String(row.total),
        String(row.delivered),
        String(row.open),
        String(row.exception),
        String(row.overdue),
        formatPercent(row.sla48, row.delivered),
      ]),
    ];
    downloadCsv(`bao-cao-van-hanh-${fromDate}-${toDate}.csv`, rows);
  };

  return (
    <div className="ops-report">
      {/* Header / Hero Section */}
      <header className="ops-report__header">
        <div className="ops-report__header-content">
          <div className="ops-report__badge">
            <span className="ops-report__badge-dot" />
            Bảng kiểm vận hành mạng lưới
          </div>
          <h1 className="ops-report__title">Báo cáo Vận hành & Giám sát Cam kết SLA</h1>
          <p className="ops-report__subtitle">
            Theo dõi tập trung tình hình giao nhận, luồng trạng thái đơn hàng, hiệu suất từng hub và các điểm nghẽn
            cần can thiệp theo từng ca trực vận hành.
          </p>
        </div>
        <div className="ops-report__header-actions">
          <button
            type="button"
            className="ops-report__btn ops-report__btn--secondary"
            onClick={handleRefresh}
            title="Làm mới dữ liệu từ hệ thống"
          >
            <RotateCcw size={15} className={isRefreshing ? 'ops-report__btn-spin' : ''} />
            Làm mới
          </button>
          <Link to={routePaths.opsMetricsDeadlineInventory} className="ops-report__btn ops-report__btn--secondary">
            <Clock size={15} />
            Tồn kho & quá hạn
          </Link>
          <button
            type="button"
            className="ops-report__btn ops-report__btn--primary"
            onClick={handleExport}
            disabled={hubRows.length === 0}
            title="Xuất dữ liệu thống kê ra file CSV"
          >
            <Download size={15} />
            Xuất CSV
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {loadError ? (
        <div className="ops-report__error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>Lỗi tải dữ liệu vận hành: {getErrorMessage(loadError)}</span>
        </div>
      ) : null}

      {/* Toolbar: Date Presets & Custom Filters */}
      <section className="ops-report__toolbar" aria-label="Bộ lọc dữ liệu vận hành">
        <div className="ops-report__toolbar-top">
          <div className="ops-report__presets" role="group" aria-label="Khoảng thời gian nhanh">
            <button
              type="button"
              className="ops-report__preset-btn"
              data-active={activePreset === 'today'}
              onClick={() => applyPreset('today')}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className="ops-report__preset-btn"
              data-active={activePreset === '7d'}
              onClick={() => applyPreset('7d')}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              className="ops-report__preset-btn"
              data-active={activePreset === '30d'}
              onClick={() => applyPreset('30d')}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              className="ops-report__preset-btn"
              data-active={activePreset === 'month'}
              onClick={() => applyPreset('month')}
            >
              Tháng này
            </button>
          </div>

          <div className="ops-report__scope-summary">
            <span>Dữ liệu hiển thị:</span>
            <span className="ops-report__scope-pill">{scopedShipments.length} vận đơn</span>
            <span>·</span>
            <span className="ops-report__scope-pill">{availableHubs.length} hub hoạt động</span>
          </div>
        </div>

        <div className="ops-report__toolbar-inputs">
          <label className="ops-report__field">
            <span className="ops-report__field-label">
              <Calendar size={13} />
              Từ ngày
            </span>
            <input
              type="date"
              className="ops-report__input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>

          <label className="ops-report__field">
            <span className="ops-report__field-label">
              <Calendar size={13} />
              Đến ngày
            </span>
            <input
              type="date"
              className="ops-report__input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>

          <label className="ops-report__field">
            <span className="ops-report__field-label">
              <Building2 size={13} />
              Hub / Chi nhánh
            </span>
            <select
              className="ops-report__select"
              value={hubCode}
              onChange={(e) => setHubCode(e.target.value)}
            >
              <option value="all">Tất cả Hub ({availableHubs.length})</option>
              {availableHubs.map((hub) => (
                <option key={hub} value={hub}>
                  {hub}
                </option>
              ))}
            </select>
          </label>

          <label className="ops-report__field">
            <span className="ops-report__field-label">
              <Filter size={13} />
              Nhóm trạng thái
            </span>
            <select
              className="ops-report__select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatusFilter)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="open">Đang mở (chưa hoàn tất)</option>
              <option value="delivered">Đã giao thành công</option>
              <option value="exception">Bất thường / NDR</option>
              <option value="overdue">Quá hạn (&gt; 24h không đổi)</option>
            </select>
          </label>
        </div>
      </section>

      {/* KPI Cards Grid (6 Columns) */}
      <section className="ops-report__kpis" aria-label="Chỉ số KPI vận hành chính">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to}
            className="ops-report__kpi-card"
            data-tone={kpi.tone}
            title={`Xem chi tiết ${kpi.label}`}
          >
            <div className="ops-report__kpi-head">
              <span className="ops-report__kpi-label">
                {kpi.icon}
                {kpi.label}
              </span>
            </div>

            <div className="ops-report__kpi-value">{kpi.value}</div>
            <div className="ops-report__kpi-detail">{kpi.detail}</div>

            {kpi.meterPct !== undefined ? (
              <div className="ops-report__kpi-meter" aria-hidden="true">
                <div
                  className="ops-report__kpi-meter-fill"
                  style={{ width: `${Math.min(100, Math.max(0, kpi.meterPct))}%` }}
                />
              </div>
            ) : null}

            <div className="ops-report__kpi-hint">
              <span>{kpi.hint}</span>
              <ArrowUpRight size={13} className="ops-report__kpi-arrow" />
            </div>
          </Link>
        ))}
      </section>

      {/* Visual Analytics Section: Pipeline Breakdown & Top Hub Performance */}
      <section className="ops-report__analytics" aria-label="Biểu đồ phân tích vận hành">
        {/* Left: Overall Status Pipeline Breakdown */}
        <article className="ops-report__card">
          <header className="ops-report__panel-head">
            <div className="ops-report__panel-title-wrap">
              <h2 className="ops-report__panel-title">Phân bố Luồng Vận hành & Chỉ số SLA 48h</h2>
              <span className="ops-report__panel-desc">
                Cơ cấu vận đơn theo tiến trình xử lý và mức độ tuân thủ hạn cam kết
              </span>
            </div>
          </header>

          <div className="ops-report__panel-body">
            {/* Visual Multi-Segment Bar */}
            <div className="ops-report__pipeline-wrap">
              <div
                className="ops-report__pipeline-bar"
                role="progressbar"
                aria-label="Tỷ lệ phân bố trạng thái đơn hàng"
              >
                <div
                  className="ops-report__pipeline-segment ops-report__pipeline-segment--delivered"
                  style={{ width: `${deliveredPct}%` }}
                  title={`Đã giao: ${deliveredShipments.length} đơn (${Math.round(deliveredPct)}%)`}
                />
                <div
                  className="ops-report__pipeline-segment ops-report__pipeline-segment--open"
                  style={{ width: `${openPct}%` }}
                  title={`Đang luân chuyển: ${openShipments.length - overdueShipments.length} đơn (${Math.round(openPct)}%)`}
                />
                <div
                  className="ops-report__pipeline-segment ops-report__pipeline-segment--overdue"
                  style={{ width: `${overduePct}%` }}
                  title={`Quá hạn >24h: ${overdueShipments.length} đơn (${Math.round(overduePct)}%)`}
                />
                <div
                  className="ops-report__pipeline-segment ops-report__pipeline-segment--exception"
                  style={{ width: `${exceptionPct}%` }}
                  title={`Bất thường / NDR: ${exceptionShipments.length} đơn (${Math.round(exceptionPct)}%)`}
                />
              </div>

              {/* Legend with exact metrics */}
              <div className="ops-report__pipeline-legend">
                <div className="ops-report__legend-item">
                  <div className="ops-report__legend-header">
                    <span className="ops-report__legend-dot" style={{ background: '#10b981' }} />
                    <span>Đã giao</span>
                  </div>
                  <div className="ops-report__legend-value">
                    {deliveredShipments.length}
                    <span className="ops-report__legend-pct">{formatPercent(deliveredShipments.length, totalCount)}</span>
                  </div>
                </div>

                <div className="ops-report__legend-item">
                  <div className="ops-report__legend-header">
                    <span className="ops-report__legend-dot" style={{ background: '#3b82f6' }} />
                    <span>Đang luân chuyển</span>
                  </div>
                  <div className="ops-report__legend-value">
                    {Math.max(0, openShipments.length - overdueShipments.length)}
                    <span className="ops-report__legend-pct">
                      {formatPercent(Math.max(0, openShipments.length - overdueShipments.length), totalCount)}
                    </span>
                  </div>
                </div>

                <div className="ops-report__legend-item">
                  <div className="ops-report__legend-header">
                    <span className="ops-report__legend-dot" style={{ background: '#ef4444' }} />
                    <span>Quá hạn (&gt;24h)</span>
                  </div>
                  <div className="ops-report__legend-value">
                    {overdueShipments.length}
                    <span className="ops-report__legend-pct">{formatPercent(overdueShipments.length, totalCount)}</span>
                  </div>
                </div>

                <div className="ops-report__legend-item">
                  <div className="ops-report__legend-header">
                    <span className="ops-report__legend-dot" style={{ background: '#f59e0b' }} />
                    <span>Bất thường / NDR</span>
                  </div>
                  <div className="ops-report__legend-value">
                    {exceptionShipments.length}
                    <span className="ops-report__legend-pct">{formatPercent(exceptionShipments.length, totalCount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA 48h Compliance Box */}
            <div className="ops-report__sla-box">
              <div className="ops-report__sla-header">
                <div className="ops-report__sla-title">
                  <Clock size={15} />
                  Hiệu suất Cam kết Giao đúng chuẩn SLA 48h
                </div>
                <span
                  className={`ops-report__sla-badge ${
                    sla48Pct >= 90 ? 'ops-report__sla-badge--good' : 'ops-report__sla-badge--warning'
                  }`}
                >
                  {sla48Pct >= 90 ? 'Đạt chuẩn cam kết (≥ 90%)' : 'Cần tối ưu tuyến luân chuyển'}
                </span>
              </div>

              <div className="ops-report__sla-bar-wrap">
                <div className="ops-report__sla-bar-fill" style={{ width: `${Math.min(100, Math.max(0, sla48Pct))}%` }} />
              </div>

              <p className="ops-report__sla-desc">
                Đạt <strong>{sla48Pct}%</strong> ({sla48Shipments.length}/{deliveredShipments.length} đơn đã giao). Tính
                từ thời điểm tạo vận đơn cho đến khi shipper cập nhật giao thành công không quá 48 giờ.
              </p>
            </div>
          </div>
        </article>

        {/* Right: Top 5 Hubs Volume & Completion Rate */}
        <article className="ops-report__card">
          <header className="ops-report__panel-head">
            <div className="ops-report__panel-title-wrap">
              <h2 className="ops-report__panel-title">Sản lượng & Tỷ lệ Giao Top 5 Hub</h2>
              <span className="ops-report__panel-desc">So sánh tiến độ hoàn tất giữa các chi nhánh có lượng đơn cao nhất</span>
            </div>
          </header>

          <div className="ops-report__panel-body">
            {topHubs.length > 0 ? (
              <div className="ops-report__hub-bars">
                {topHubs.map((hub) => {
                  const delRate = hub.total > 0 ? Math.round((hub.delivered / hub.total) * 100) : 0;
                  const openRate = hub.total > 0 ? Math.round((hub.open / hub.total) * 100) : 0;
                  const riskRate = hub.total > 0 ? Math.round((hub.overdue / hub.total) * 100) : 0;

                  return (
                    <div key={hub.hubCode} className="ops-report__hub-bar-item">
                      <div className="ops-report__hub-bar-head">
                        <span className="ops-report__hub-bar-name">
                          <Building2 size={13} />
                          {hub.hubCode}
                        </span>
                        <div className="ops-report__hub-bar-stats">
                          <span className="ops-report__hub-bar-volume">{hub.total} đơn</span>
                          <span className="ops-report__hub-bar-rate">{delRate}% giao xong</span>
                          {hub.overdue > 0 ? (
                            <span className="ops-report__overdue-pill ops-report__overdue-pill--danger">
                              {hub.overdue} trễ
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="ops-report__hub-bar-meter">
                        <div
                          className="ops-report__hub-bar-delivered"
                          style={{ width: `${delRate}%` }}
                          title={`Giao xong: ${hub.delivered} đơn`}
                        />
                        <div
                          className="ops-report__hub-bar-open"
                          style={{ width: `${openRate}%` }}
                          title={`Đang mở: ${hub.open} đơn`}
                        />
                        <div
                          className="ops-report__hub-bar-risk"
                          style={{ width: `${riskRate}%` }}
                          title={`Quá hạn: ${hub.overdue} đơn`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="ops-report__table-empty">Không có dữ liệu Hub trong kỳ này.</div>
            )}
          </div>
        </article>
      </section>

      {/* Main Body: Hub Breakdown Table (Left) & Urgent Exception List (Right) */}
      <section className="ops-report__body">
        {/* Hub Breakdown Table */}
        <article className="ops-report__card ops-report__table-card">
          <header className="ops-report__panel-head">
            <div className="ops-report__panel-title-wrap">
              <h2 className="ops-report__panel-title">Bảng Tổng hợp Hiệu suất Chi tiết theo Hub</h2>
              <span className="ops-report__panel-desc">
                {filteredHubRows.length} chi nhánh · Sắp xếp theo sản lượng và tỷ lệ cam kết
              </span>
            </div>

            <div className="ops-report__table-controls">
              <div className="ops-report__search-box">
                <Search size={13} className="ops-report__search-icon" />
                <input
                  type="text"
                  className="ops-report__search-input"
                  placeholder="Tìm mã hub..."
                  value={hubSearch}
                  onChange={(e) => setHubSearch(e.target.value)}
                />
              </div>

              <select
                className="ops-report__sort-select"
                value={hubSortKey}
                onChange={(e) => setHubSortKey(e.target.value as HubSortKey)}
                aria-label="Sắp xếp danh sách hub"
              >
                <option value="total">Xếp theo: Tổng đơn</option>
                <option value="delivered">Xếp theo: Đã giao</option>
                <option value="open">Xếp theo: Đang mở</option>
                <option value="overdue">Xếp theo: Quá hạn</option>
                <option value="sla48">Xếp theo: Tỷ lệ SLA 48h</option>
              </select>
            </div>
          </header>

          <div className="ops-report__table-wrap">
            <table className="ops-report__table">
              <thead>
                <tr>
                  <th>Hub / Chi nhánh</th>
                  <th style={{ textAlign: 'right' }}>Tổng đơn</th>
                  <th style={{ minWidth: '130px' }}>Tiến độ giao</th>
                  <th style={{ textAlign: 'right' }}>Đang mở</th>
                  <th style={{ textAlign: 'right' }}>Bất thường</th>
                  <th style={{ textAlign: 'right' }}>Quá hạn (&gt;24h)</th>
                  <th style={{ textAlign: 'right' }}>SLA 48h</th>
                </tr>
              </thead>
              <tbody>
                {filteredHubRows.map((row) => {
                  const delPercent = row.total > 0 ? Math.round((row.delivered / row.total) * 100) : 0;
                  return (
                    <tr key={row.hubCode}>
                      <td>
                        <div className="ops-report__hub-code-cell">
                          <Building2 size={13} />
                          <span>{row.hubCode}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.total}</td>
                      <td>
                        <div className="ops-report__cell-progress">
                          <div className="ops-report__cell-progress-bar">
                            <div className="ops-report__cell-progress-fill" style={{ width: `${delPercent}%` }} />
                          </div>
                          <span>
                            {delPercent}% ({row.delivered})
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{row.open}</td>
                      <td style={{ textAlign: 'right' }}>{row.exception}</td>
                      <td style={{ textAlign: 'right' }}>
                        {row.overdue > 0 ? (
                          <span className="ops-report__overdue-pill ops-report__overdue-pill--danger">
                            {row.overdue} đơn
                          </span>
                        ) : (
                          <span className="ops-report__overdue-pill ops-report__overdue-pill--safe">0</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatPercent(row.sla48, row.delivered)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredHubRows.length > 0 ? (
                <tfoot>
                  <tr>
                    <td>Toàn mạng lưới ({hubRows.length} Hub)</td>
                    <td style={{ textAlign: 'right' }}>{tableSummary.total}</td>
                    <td>
                      {tableSummary.total > 0
                        ? `${Math.round((tableSummary.delivered / tableSummary.total) * 100)}% (${tableSummary.delivered})`
                        : '0%'}
                    </td>
                    <td style={{ textAlign: 'right' }}>{tableSummary.open}</td>
                    <td style={{ textAlign: 'right' }}>{tableSummary.exception}</td>
                    <td style={{ textAlign: 'right' }}>{tableSummary.overdue}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatPercent(tableSummary.sla48, tableSummary.delivered)}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>

            {filteredHubRows.length === 0 ? (
              <div className="ops-report__table-empty">
                {hubSearch ? 'Không tìm thấy hub nào phù hợp từ khóa.' : 'Chưa có dữ liệu theo bộ lọc đang chọn.'}
              </div>
            ) : null}
          </div>
        </article>

        {/* Priority Urgent Exceptions */}
        <article className="ops-report__card ops-report__issue-card">
          <header className="ops-report__panel-head">
            <div className="ops-report__panel-title-wrap">
              <h2 className="ops-report__panel-title">Kiện Hàng Cần Xử Lý Ngay</h2>
              <span className="ops-report__panel-desc">{topExceptions.length} đơn quá hạn hoặc có phát sinh sự cố</span>
            </div>
            <Link
              to={routePaths.opsMetricsDeadlineInventory}
              className="ops-report__btn ops-report__btn--secondary"
              style={{ height: '30px', fontSize: '12px', padding: '0 10px' }}
            >
              Xem tất cả
            </Link>
          </header>

          <div className="ops-report__issue-list">
            {topExceptions.map((shipment) => {
              const overdue = isOverdueShipment(shipment);
              const hours = ageHours(shipment.updatedAt ?? shipment.createdAt) ?? 0;

              return (
                <div key={shipment.id} className="ops-report__issue-item">
                  <div className="ops-report__issue-row-top">
                    <CopyableShipmentCode code={shipment.shipmentCode} />
                    <span
                      className="ops-report__issue-status"
                      data-exception={EXCEPTION_STATUSES.has(normalizeCode(shipment.currentStatus))}
                    >
                      {formatShipmentStatusLabel(shipment.currentStatus)}
                    </span>
                  </div>

                  <div className="ops-report__issue-row-bot">
                    <span className="ops-report__issue-hub">
                      <MapPin size={11} />
                      {resolveShipmentHub(shipment)}
                    </span>
                    <span
                      className={`ops-report__issue-time ${
                        overdue ? 'ops-report__issue-time--overdue' : ''
                      }`}
                    >
                      <Clock size={11} />
                      {overdue ? `Trễ ${hours}h chưa cập nhật` : `${hours}h trước`}
                    </span>
                  </div>
                </div>
              );
            })}

            {topExceptions.length === 0 ? (
              <div className="ops-report__issue-empty">
                <CheckCircle2 size={32} />
                <p>Không có đơn tồn đọng khẩn cấp</p>
                <span>Tất cả đơn trong kỳ đang được luân chuyển đúng tiến độ.</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      {/* Operational Playbook & Metrics Glossary */}
      <section className="ops-report__knowledge" aria-label="Cẩm nang vận hành và giải thích chỉ số">
        {/* Shift SOP Playbook */}
        <article className="ops-report__card">
          <header className="ops-report__panel-head">
            <div className="ops-report__panel-title-wrap">
              <h2 className="ops-report__panel-title">Quy Trình Kiểm Soát Theo 3 Mốc Ca Trực</h2>
              <span className="ops-report__panel-desc">Hướng dẫn thao tác thực chiến cho Trưởng ca & Giám sát Hub</span>
            </div>
          </header>

          <div className="ops-report__sop-list">
            <div className="ops-report__sop-item">
              <span className="ops-report__sop-step">08:00 - Đầu ca</span>
              <div className="ops-report__sop-content">
                <div className="ops-report__sop-title">Kiểm soát đơn quá hạn & Sự cố tồn đọng</div>
                <p className="ops-report__sop-desc">
                  Mở danh sách &quot;Cần xử lý ngay&quot; để rà soát các đơn chưa đổi trạng thái quá 24h và các ca NDR chưa
                  khép lại. Phân công nhân viên kho và điều phối kiểm tra vật lý trước khi xuất ca mới.
                </p>
              </div>
            </div>

            <div className="ops-report__sop-item">
              <span className="ops-report__sop-step">13:00 - Giữa ca</span>
              <div className="ops-report__sop-content">
                <div className="ops-report__sop-title">Giám sát tải trọng và tốc độ luân chuyển Hub</div>
                <p className="ops-report__sop-desc">
                  Kiểm tra bảng tổng hợp Hub để nhận diện sớm các bưu cục có số lượng đơn đang mở tăng đột biến hoặc tỷ lệ
                  giao hoàn tất dưới 60%, kịp thời điều phối phương tiện trung chuyển hỗ trợ.
                </p>
              </div>
            </div>

            <div className="ops-report__sop-item">
              <span className="ops-report__sop-step">18:00 - Cuối ca</span>
              <div className="ops-report__sop-content">
                <div className="ops-report__sop-title">Đối soát tỷ lệ SLA 48h & Xuất báo cáo ca</div>
                <p className="ops-report__sop-desc">
                  Kiểm tra tỷ lệ đạt cam kết SLA 48h (mục tiêu ≥ 90%). Bấm &quot;Xuất CSV&quot; để lưu trữ số liệu bàn giao
                  sang ca tiếp theo và ghi nhận các trường hợp phát sinh ngoại lệ.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Operational Metrics Glossary */}
        <article className="ops-report__card">
          <header className="ops-report__panel-head">
            <div className="ops-report__panel-title-wrap">
              <h2 className="ops-report__panel-title">Từ Điển Chỉ Số & Tiêu Chuẩn Vận Hành</h2>
              <span className="ops-report__panel-desc">Quy chuẩn định nghĩa dữ liệu thống nhất toàn mạng lưới</span>
            </div>
          </header>

          <div className="ops-report__glossary-grid">
            <div className="ops-report__glossary-item">
              <div className="ops-report__glossary-term">
                <Layers size={13} />
                Đơn đang mở (In-Progress)
              </div>
              <p className="ops-report__glossary-def">
                Các vận đơn đang nằm trong chuỗi cung ứng, chưa được xác nhận hoàn tất (chưa Giao thành công, chưa Hủy,
                và chưa Hoàn tất chuyển hoàn).
              </p>
            </div>

            <div className="ops-report__glossary-item">
              <div className="ops-report__glossary-term">
                <AlertTriangle size={13} />
                Đơn quá hạn (&gt; 24h trôi qua)
              </div>
              <p className="ops-report__glossary-def">
                Vận đơn còn mở nhưng không ghi nhận bất kỳ thao tác quét mã (scan in/out), cập nhật tọa độ hoặc thay đổi
                trạng thái nào trong suốt 24 giờ.
              </p>
            </div>

            <div className="ops-report__glossary-item">
              <div className="ops-report__glossary-term">
                <Clock size={13} />
                Chuẩn SLA 48 Giờ
              </div>
              <p className="ops-report__glossary-def">
                Chỉ số đánh giá chất lượng dịch vụ: Vận đơn được giao thành công với tổng thời gian tính từ khi tạo đơn
                đến khi phát hoàn tất không quá 48 tiếng.
              </p>
            </div>

            <div className="ops-report__glossary-item">
              <div className="ops-report__glossary-term">
                <AlertOctagon size={13} />
                Đơn bất thường (Exceptions)
              </div>
              <p className="ops-report__glossary-def">
                Kiện hàng gặp trục trặc như giao thất bại nhiều lần, địa chỉ sai, hàng nghi ngờ hư hại hoặc có biên bản
                NDR cần CSKH can thiệp.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
