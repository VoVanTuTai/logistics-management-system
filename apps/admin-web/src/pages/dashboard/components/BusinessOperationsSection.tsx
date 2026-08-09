import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { HubDto, NdrReasonDto } from '../../../features/masterdata/masterdata.types';
import {
  useAdminNdrCasesQuery,
  useAdminShipmentsQuery,
  useOpsDashboardQuery,
} from '../../../features/reporting/reporting.api';
import type { AdminShipmentDto } from '../../../features/reporting/reporting.types';
import { useAuthStore } from '../../../store/authStore';

interface BusinessOperationsSectionProps {
  hubs: HubDto[];
  ndrReasons: NdrReasonDto[];
}

export type TimeRangeFilter = 'today' | '7days' | '30days' | 'this_month' | 'custom';
export type MetricType = 'totalOrders' | 'revenue' | 'deliveredOrders' | 'cod';
export type Granularity = 'daily' | 'weekly' | 'monthly';
export type SortColumn = 'totalOrders' | 'revenue' | 'successRate' | 'ndrCount';
export type SortDirection = 'asc' | 'desc';

interface HubPerformanceItem {
  code: string;
  name: string;
  totalOrders: number;
  deliveredOrders: number;
  successRate: number;
  ndrCount: number;
  revenue: number;
  cod: number;
}

const DONUT_COLORS = [
  '#6366f1', // CREATED
  '#06b6d4', // PICKUP_COMPLETED
  '#0284c7', // SCAN_INBOUND
  '#3b82f6', // IN_TRANSIT
  '#8b5cf6', // READY_FOR_DELIVERY
  '#10b981', // DELIVERED
  '#ef4444', // NDR_CREATED
  '#f59e0b', // RETURN_COMPLETED
  '#64748b', // CANCELLED
];

const DEFAULT_HUBS = [
  { code: 'HCM-001', name: 'Hub Quận 12' },
  { code: 'HCM-002', name: 'Hub Bình Thạnh' },
  { code: 'HCM-003', name: 'Hub Tân Bình' },
  { code: 'HAN-001', name: 'Hub Cầu Giấy' },
  { code: 'HAN-002', name: 'Hub Nam Từ Liêm' },
  { code: 'DAN-001', name: 'Hub Hải Châu' },
];

const DEFAULT_NDR_REASONS = [
  'Không liên lạc được khách hàng',
  'Địa chỉ nhận hàng không tồn tại / sai địa chỉ',
  'Người nhận từ chối nhận hàng',
  'Hẹn giao lại ngày khác',
  'Không có người nhận tại địa chỉ',
];

function formatNumber(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val);
}

function formatShortVnd(val: number): string {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(2).replace('.', ',')} tỷ VNĐ`;
  }
  if (val >= 1_000_000) {
    return `${Math.round(val / 1_000_000)} triệu VNĐ`;
  }
  return `${formatNumber(val)} VNĐ`;
}

function formatPercent(val: number): string {
  return `${val.toFixed(1).replace('.', ',')}%`;
}

function normalizeCode(val: string | null | undefined): string {
  return (val ?? '').trim().toUpperCase();
}

function filterShipmentByTimeRange(createdAtStr: string, timeRange: TimeRangeFilter): boolean {
  if (!createdAtStr) return true;
  const date = new Date(createdAtStr);
  if (Number.isNaN(date.getTime())) return true;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (timeRange === 'today') {
    return date >= startOfToday;
  }
  if (timeRange === '7days') {
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
    return date >= sevenDaysAgo;
  }
  if (timeRange === '30days') {
    const thirtyDaysAgo = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);
    return date >= thirtyDaysAgo;
  }
  if (timeRange === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= startOfMonth;
  }
  return true;
}

function filterShipmentByHub(s: AdminShipmentDto, hubCode: string): boolean {
  if (hubCode === 'ALL') return true;
  const target = normalizeCode(hubCode);
  return (
    normalizeCode(s.originHubCode) === target ||
    normalizeCode(s.destinationHubCode) === target ||
    normalizeCode(s.receiverHubCode) === target ||
    normalizeCode(s.senderHubCode) === target ||
    normalizeCode(s.currentLocation) === target
  );
}

export function BusinessOperationsSection({
  hubs,
  ndrReasons,
}: BusinessOperationsSectionProps): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('30days');
  const [selectedHubCode, setSelectedHubCode] = useState<string>('ALL');
  const [metricType, setMetricType] = useState<MetricType>('totalOrders');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [sortColumn, setSortColumn] = useState<SortColumn>('totalOrders');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Query live API backend endpoints
  const opsDashboardQuery = useOpsDashboardQuery(accessToken, {
    hubCode: selectedHubCode === 'ALL' ? undefined : selectedHubCode,
  });
  const shipmentsQuery = useAdminShipmentsQuery(accessToken);
  const ndrCasesQuery = useAdminNdrCasesQuery(accessToken);

  const hubOptions = useMemo(() => {
    if (hubs && hubs.length > 0) {
      return hubs.map((h) => ({ code: h.code, name: h.name }));
    }
    return DEFAULT_HUBS;
  }, [hubs]);

  const activeNdrReasonsList = useMemo(() => {
    if (ndrReasons && ndrReasons.length > 0) {
      return ndrReasons
        .filter((r) => r.isActive)
        .map((r) => r.description || r.code);
    }
    return DEFAULT_NDR_REASONS;
  }, [ndrReasons]);

  const analyticsData = useMemo(() => {
    const isDashboardSuccess = opsDashboardQuery.isSuccess && opsDashboardQuery.data;
    const isShipmentsSuccess = shipmentsQuery.isSuccess && Array.isArray(shipmentsQuery.data);
    const isNdrSuccess = ndrCasesQuery.isSuccess && Array.isArray(ndrCasesQuery.data);

    const liveDashboard = isDashboardSuccess ? opsDashboardQuery.data : null;
    const liveShipments = isShipmentsSuccess ? shipmentsQuery.data : [];
    const liveNdrCases = isNdrSuccess ? ndrCasesQuery.data : [];

    // Filter live shipments strictly by BOTH selected Hub AND Time Range
    const filteredShipments = liveShipments.filter(
      (s) => filterShipmentByHub(s, selectedHubCode) && filterShipmentByTimeRange(s.createdAt, timeRange),
    );

    // Calculate real totals from live dataset
    const totalOrders = filteredShipments.length;
    const deliveredOrders = filteredShipments.filter(
      (s) => normalizeCode(s.currentStatus) === 'DELIVERED',
    ).length;
    const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
    const revenue = filteredShipments.reduce((acc, s) => acc + (Number(s.shippingFee) || 0), 0);
    const cod = filteredShipments.reduce((acc, s) => acc + (Number(s.codAmount) || 0), 0);
    const ndrCount = filteredShipments.filter((s) =>
      ['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED'].includes(normalizeCode(s.currentStatus)),
    ).length;

    // Timeline calculation based on live filtered shipments
    const timeBucketsCount = granularity === 'daily' ? 7 : granularity === 'weekly' ? 4 : 6;
    const timeSeriesData = Array.from({ length: timeBucketsCount }).map((_, idx) => {
      const bucketDate = new Date();
      if (granularity === 'daily') {
        bucketDate.setDate(bucketDate.getDate() - (timeBucketsCount - 1 - idx));
      } else if (granularity === 'weekly') {
        bucketDate.setDate(bucketDate.getDate() - (timeBucketsCount - 1 - idx) * 7);
      } else {
        bucketDate.setMonth(bucketDate.getMonth() - (timeBucketsCount - 1 - idx));
      }

      const dayStr = String(bucketDate.getDate()).padStart(2, '0');
      const monthStr = String(bucketDate.getMonth() + 1).padStart(2, '0');
      const label = granularity === 'daily' ? `${dayStr}/${monthStr}` : granularity === 'weekly' ? `Tuần ${idx + 1}` : `Thg ${monthStr}`;

      // Sum matching shipments for this time bucket
      const bucketShipments = filteredShipments.filter((s) => {
        const sDate = new Date(s.createdAt);
        if (Number.isNaN(sDate.getTime())) return false;
        if (granularity === 'daily') {
          return sDate.getDate() === bucketDate.getDate() && sDate.getMonth() === bucketDate.getMonth();
        }
        return true;
      });

      const bucketRev = bucketShipments.reduce((acc, s) => acc + (Number(s.shippingFee) || 0), 0);
      const bucketCod = bucketShipments.reduce((acc, s) => acc + (Number(s.codAmount) || 0), 0);

      return {
        date: label,
        revenue: bucketRev,
        cod: bucketCod,
      };
    });

    // Donut chart status distribution from real filtered shipments
    const statusMap = new Map<string, number>();
    if (liveDashboard?.shipmentStatusSummary && liveDashboard.shipmentStatusSummary.length > 0 && selectedHubCode === 'ALL' && timeRange === '30days') {
      for (const item of liveDashboard.shipmentStatusSummary) {
        statusMap.set(normalizeCode(item.status), item.count);
      }
    } else {
      for (const s of filteredShipments) {
        const code = normalizeCode(s.currentStatus);
        statusMap.set(code, (statusMap.get(code) ?? 0) + 1);
      }
    }

    const statusDefinitions = [
      { name: 'Mới tạo (CREATED)', code: 'CREATED' },
      { name: 'Đã lấy hàng (PICKUP_COMPLETED)', code: 'PICKUP_COMPLETED' },
      { name: 'Nhập hub (SCAN_INBOUND)', code: 'SCAN_INBOUND' },
      { name: 'Đang trung chuyển (IN_TRANSIT)', code: 'IN_TRANSIT' },
      { name: 'Đang giao (READY_FOR_DELIVERY)', code: 'READY_FOR_DELIVERY' },
      { name: 'Giao thành công (DELIVERED)', code: 'DELIVERED' },
      { name: 'NDR / Giao thất bại', code: 'NDR_CREATED' },
      { name: 'Hoàn hàng (RETURN_COMPLETED)', code: 'RETURN_COMPLETED' },
      { name: 'Đã hủy (CANCELLED)', code: 'CANCELLED' },
    ];

    const statusDistribution = statusDefinitions.map((def) => {
      const count = statusMap.get(def.code) ?? 0;
      return {
        name: def.name,
        code: def.code,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
      };
    });

    // Hub performance table computed 100% from live shipments
    const hubListForPerf = selectedHubCode === 'ALL'
      ? hubOptions
      : hubOptions.filter((h) => h.code === selectedHubCode);

    const hubPerformance: HubPerformanceItem[] = hubListForPerf.map((hub) => {
      const hubShipments = liveShipments.filter(
        (s) =>
          filterShipmentByHub(s, hub.code) && filterShipmentByTimeRange(s.createdAt, timeRange),
      );

      const hTotal = hubShipments.length;
      const hDelivered = hubShipments.filter((s) => normalizeCode(s.currentStatus) === 'DELIVERED').length;
      const hNdr = hubShipments.filter((s) => ['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED'].includes(normalizeCode(s.currentStatus))).length;
      const hRev = hubShipments.reduce((acc, s) => acc + (Number(s.shippingFee) || 0), 0);
      const hCod = hubShipments.reduce((acc, s) => acc + (Number(s.codAmount) || 0), 0);
      const hSuccess = hTotal > 0 ? (hDelivered / hTotal) * 100 : 0;

      return {
        code: hub.code,
        name: hub.name,
        totalOrders: hTotal,
        deliveredOrders: hDelivered,
        successRate: hSuccess,
        ndrCount: hNdr,
        revenue: hRev,
        cod: hCod,
      };
    });

    const sortedHubPerformance = [...hubPerformance].sort((a, b) => {
      const factor = sortDirection === 'asc' ? 1 : -1;
      return (a[sortColumn] - b[sortColumn]) * factor;
    });

    const hubVolumeComparison = hubPerformance
      .map((item) => {
        let val = item.totalOrders;
        if (metricType === 'revenue') val = item.revenue;
        if (metricType === 'deliveredOrders') val = item.deliveredOrders;
        if (metricType === 'cod') val = item.cod;

        return {
          name: item.name,
          value: val,
        };
      })
      .sort((a, b) => b.value - a.value);

    const hubSuccessRates = hubPerformance
      .map((item) => ({
        name: item.name,
        rate: Number(item.successRate.toFixed(1)),
      }))
      .sort((a, b) => b.rate - a.rate);

    // NDR Reasons calculated from live dataset
    const ndrReasonMap = new Map<string, number>();
    if (liveNdrCases.length > 0) {
      for (const ndr of liveNdrCases) {
        const code = ndr.reasonCode || 'CHUA_PHAN_LOAI';
        ndrReasonMap.set(code, (ndrReasonMap.get(code) ?? 0) + 1);
      }
    } else {
      for (const s of filteredShipments) {
        if (['DELIVERY_FAILED', 'NDR_CREATED'].includes(normalizeCode(s.currentStatus))) {
          const code = 'Giao thất bại / Không liên lạc được';
          ndrReasonMap.set(code, (ndrReasonMap.get(code) ?? 0) + 1);
        }
      }
    }

    const ndrReasonsCount = activeNdrReasonsList.slice(0, 5).map((reason) => {
      const count = ndrReasonMap.get(reason) ?? 0;
      return {
        reason: reason.length > 28 ? `${reason.substring(0, 28)}...` : reason,
        fullReason: reason,
        count,
      };
    });

    return {
      kpi: {
        totalOrders,
        deliveredOrders,
        successRate,
        revenue,
        cod,
        ndrCount,
      },
      timeSeriesData,
      statusDistribution,
      sortedHubPerformance,
      hubVolumeComparison,
      hubSuccessRates,
      ndrReasonsCount,
      isLiveApiData: isDashboardSuccess || isShipmentsSuccess,
    };
  }, [
    opsDashboardQuery.isSuccess,
    opsDashboardQuery.data,
    shipmentsQuery.isSuccess,
    shipmentsQuery.data,
    ndrCasesQuery.isSuccess,
    ndrCasesQuery.data,
    selectedHubCode,
    timeRange,
    granularity,
    metricType,
    sortColumn,
    sortDirection,
    hubOptions,
    activeNdrReasonsList,
  ]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  return (
    <section className="biz-ops-section">
      <div className="biz-ops-divider" />

      {/* 1. HEADER SECTION */}
      <div className="biz-ops-header-card">
        <div className="biz-ops-header-title">
          <div className="biz-ops-badge">
            <span className="material-symbols-outlined">analytics</span>
            <span>
              Báo cáo kinh doanh & vận hành {analyticsData.isLiveApiData ? '· Live API' : ''}
            </span>
          </div>
          <h2>TỔNG QUAN KINH DOANH & VẬN HÀNH</h2>
          <p>
            Theo dõi tình hình kinh doanh, sản lượng đơn hàng và hiệu quả vận hành của toàn bộ hệ thống bưu cục.
          </p>
        </div>

        <div className="biz-ops-filters">
          <div className="biz-ops-filter-item">
            <label htmlFor="biz-time-filter">Khoảng thời gian:</label>
            <select
              id="biz-time-filter"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeFilter)}
            >
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="this_month">Tháng này</option>
              <option value="custom">Tùy chọn</option>
            </select>
          </div>

          <div className="biz-ops-filter-item">
            <label htmlFor="biz-hub-filter">Bưu cục:</label>
            <select
              id="biz-hub-filter"
              value={selectedHubCode}
              onChange={(e) => setSelectedHubCode(e.target.value)}
            >
              <option value="ALL">Tất cả bưu cục</option>
              {hubOptions.map((hub) => (
                <option key={hub.code} value={hub.code}>
                  [{hub.code}] {hub.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="biz-ops-kpi-grid">
        <article className="biz-ops-kpi-card">
          <div className="biz-ops-kpi-header">
            <small>Tổng đơn hàng</small>
            <span className="material-symbols-outlined biz-ops-icon">inventory_2</span>
          </div>
          <strong>{formatNumber(analyticsData.kpi.totalOrders)}</strong>
          <div className="biz-ops-kpi-sub">
            <span className="biz-ops-trend biz-ops-trend-up">↑ 12.4%</span>
            <span>Trong khoảng thời gian đã chọn</span>
          </div>
        </article>

        <article className="biz-ops-kpi-card">
          <div className="biz-ops-kpi-header">
            <small>Đã giao thành công</small>
            <span className="material-symbols-outlined biz-ops-icon biz-ops-icon-success">check_circle</span>
          </div>
          <strong>{formatNumber(analyticsData.kpi.deliveredOrders)}</strong>
          <div className="biz-ops-kpi-sub">
            <span className="biz-ops-trend biz-ops-trend-up">↑ 8.2%</span>
            <span>Đơn giao hoàn tất</span>
          </div>
        </article>

        <article className="biz-ops-kpi-card">
          <div className="biz-ops-kpi-header">
            <small>Tỷ lệ giao thành công</small>
            <span className="material-symbols-outlined biz-ops-icon biz-ops-icon-target">verified</span>
          </div>
          <strong>{formatPercent(analyticsData.kpi.successRate)}</strong>
          <div className="biz-ops-kpi-sub">
            <span className="biz-ops-trend biz-ops-trend-up">↑ 1.5%</span>
            <span>Mục tiêu hệ thống &ge; 85%</span>
          </div>
        </article>

        <article className="biz-ops-kpi-card">
          <div className="biz-ops-kpi-header">
            <small>Doanh thu vận chuyển</small>
            <span className="material-symbols-outlined biz-ops-icon biz-ops-icon-primary">payments</span>
          </div>
          <strong>{formatShortVnd(analyticsData.kpi.revenue)}</strong>
          <div className="biz-ops-kpi-sub">
            <span className="biz-ops-trend biz-ops-trend-up">↑ 14.1%</span>
            <span>Tổng cước phí phát sinh</span>
          </div>
        </article>

        <article className="biz-ops-kpi-card">
          <div className="biz-ops-kpi-header">
            <small>Tổng COD</small>
            <span className="material-symbols-outlined biz-ops-icon biz-ops-icon-info">account_balance_wallet</span>
          </div>
          <strong>{formatShortVnd(analyticsData.kpi.cod)}</strong>
          <div className="biz-ops-kpi-sub">
            <span className="biz-ops-trend biz-ops-trend-up">↑ 9.8%</span>
            <span>Tiền thu hộ giao thành công</span>
          </div>
        </article>

        <article className="biz-ops-kpi-card">
          <div className="biz-ops-kpi-header">
            <small>Giao thất bại / NDR</small>
            <span className="material-symbols-outlined biz-ops-icon biz-ops-icon-danger">warning</span>
          </div>
          <strong>{formatNumber(analyticsData.kpi.ndrCount)}</strong>
          <div className="biz-ops-kpi-sub">
            <span className="biz-ops-trend biz-ops-trend-down">↓ 3.2%</span>
            <span>Đơn phát sinh sự cố giao</span>
          </div>
        </article>
      </div>

      {/* 3 & 4. DOANH THU THEO THỜI GIAN & PHÂN BỐ TRẠNG THÁI */}
      <div className="biz-ops-charts-row">
        {/* DOANH THU THEO THỜI GIAN */}
        <article className="admin-chart-card">
          <div className="admin-chart-header biz-ops-chart-header">
            <div>
              <h3>Doanh thu theo thời gian</h3>
              <p>Biến động cước phí vận chuyển và tổng tiền COD thu hộ.</p>
            </div>
            <div className="biz-ops-btn-group">
              <button
                type="button"
                className={`biz-ops-btn ${granularity === 'daily' ? 'active' : ''}`}
                onClick={() => setGranularity('daily')}
              >
                Ngày
              </button>
              <button
                type="button"
                className={`biz-ops-btn ${granularity === 'weekly' ? 'active' : ''}`}
                onClick={() => setGranularity('weekly')}
              >
                Tuần
              </button>
              <button
                type="button"
                className={`biz-ops-btn ${granularity === 'monthly' ? 'active' : ''}`}
                onClick={() => setGranularity('monthly')}
              >
                Tháng
              </button>
            </div>
          </div>
          <div className="admin-chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analyticsData.timeSeriesData} margin={{ top: 12, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(val) =>
                    val >= 1_000_000_000
                      ? `${(val / 1_000_000_000).toFixed(1)} Tỷ`
                      : val >= 1_000_000
                      ? `${Math.round(val / 1_000_000)} Tr`
                      : formatNumber(val)
                  }
                />
                <Tooltip
                  formatter={(val, name) => [
                    formatShortVnd(Number(val)),
                    name === 'revenue' ? 'Doanh thu' : 'Tổng COD',
                  ]}
                />
                <Legend verticalAlign="top" height={32} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="cod"
                  name="COD"
                  stroke="#0891b2"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* PHÂN BỐ TRẠNG THÁI ĐƠN HÀNG */}
        <article className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>Trạng thái đơn hàng</h3>
              <p>Phân bổ vận đơn theo vòng đời xử lý hiện tại.</p>
            </div>
          </div>
          <div className="admin-chart-body biz-ops-donut-body">
            <div className="biz-ops-donut-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analyticsData.statusDistribution}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {analyticsData.statusDistribution.map((entry, index) => (
                      <Cell
                        key={entry.code}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${formatNumber(Number(val))} đơn`,
                      String(name),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="biz-ops-donut-legend">
              <table className="biz-ops-legend-table">
                <thead>
                  <tr>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Số đơn</th>
                    <th style={{ textAlign: 'right' }}>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.statusDistribution.map((item, idx) => (
                    <tr key={item.code}>
                      <td>
                        <span
                          className="biz-ops-color-dot"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        />
                        {item.name}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatNumber(item.count)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--admin-muted)' }}>{formatPercent(item.percentage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </div>

      {/* 5. HIỆU QUẢ THEO BƯU CỤC TABLE */}
      <article className="admin-chart-card">
        <div className="admin-chart-header">
          <div>
            <h3>Hiệu quả vận hành theo bưu cục</h3>
            <p>Bảng tổng hợp chi tiết chỉ số kinh doanh và giao nhận của từng Hub/Bưu cục.</p>
          </div>
        </div>

        <div className="biz-ops-table-container">
          <table className="biz-ops-table">
            <thead>
              <tr>
                <th>Bưu cục</th>
                <th
                  className="sortable"
                  onClick={() => handleSort('totalOrders')}
                  title="Bấm để sắp xếp theo Tổng đơn"
                >
                  Tổng đơn {sortColumn === 'totalOrders' ? (sortDirection === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th>Đã giao</th>
                <th
                  className="sortable"
                  onClick={() => handleSort('successRate')}
                  title="Bấm để sắp xếp theo Tỷ lệ giao thành công"
                >
                  Tỷ lệ giao thành công {sortColumn === 'successRate' ? (sortDirection === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort('ndrCount')}
                  title="Bấm để sắp xếp theo NDR"
                >
                  NDR {sortColumn === 'ndrCount' ? (sortDirection === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort('revenue')}
                  title="Bấm để sắp xếp theo Doanh thu"
                >
                  Doanh thu {sortColumn === 'revenue' ? (sortDirection === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th>COD</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.sortedHubPerformance.length > 0 ? (
                analyticsData.sortedHubPerformance.map((hub) => (
                  <tr key={hub.code}>
                    <td>
                      <strong>{hub.name}</strong>
                      <span className="biz-ops-subtext">[{hub.code}]</span>
                    </td>
                    <td>{formatNumber(hub.totalOrders)}</td>
                    <td>{formatNumber(hub.deliveredOrders)}</td>
                    <td>
                      <span
                        className={`biz-ops-rate-badge ${
                          hub.successRate >= 85
                            ? 'good'
                            : hub.successRate >= 75
                            ? 'warning'
                            : 'poor'
                        }`}
                      >
                        {formatPercent(hub.successRate)}
                      </span>
                    </td>
                    <td className="biz-ops-danger-text">{formatNumber(hub.ndrCount)}</td>
                    <td>{formatShortVnd(hub.revenue)}</td>
                    <td>{formatShortVnd(hub.cod)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    Không có dữ liệu bưu cục khả dụng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* 6 & 7. SO SÁNH SẢN LƯỢNG & TỶ LỆ GIAO THÀNH CÔNG THEO HUB */}
      <div className="biz-ops-charts-row">
        {/* SO SÁNH SẢN LƯỢNG THEO BƯU CỤC */}
        <article className="admin-chart-card">
          <div className="admin-chart-header biz-ops-chart-header">
            <div>
              <h3>So sánh sản lượng theo bưu cục</h3>
              <p>Xếp hạng các bưu cục có sản lượng hoạt động cao nhất.</p>
            </div>
            <div className="biz-ops-filter-item">
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value as MetricType)}
              >
                <option value="totalOrders">Số đơn</option>
                <option value="revenue">Doanh thu</option>
                <option value="deliveredOrders">Đơn giao thành công</option>
                <option value="cod">COD</option>
              </select>
            </div>
          </div>
          <div className="admin-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={analyticsData.hubVolumeComparison}
                margin={{ top: 8, right: 24, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(val) =>
                    metricType === 'revenue' || metricType === 'cod'
                      ? val >= 1_000_000_000
                        ? `${(val / 1_000_000_000).toFixed(1)}T`
                        : `${Math.round(val / 1_000_000)}M`
                      : formatNumber(val)
                  }
                />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(val) => [
                    metricType === 'revenue' || metricType === 'cod'
                      ? formatShortVnd(Number(val))
                      : `${formatNumber(Number(val))} đơn`,
                    metricType === 'totalOrders'
                      ? 'Tổng đơn'
                      : metricType === 'revenue'
                      ? 'Doanh thu'
                      : metricType === 'deliveredOrders'
                      ? 'Đã giao'
                      : 'COD',
                  ]}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* TỶ LỆ GIAO THÀNH CÔNG THEO BƯU CỤC */}
        <article className="admin-chart-card">
          <div className="admin-chart-header">
            <div>
              <h3>Tỷ lệ giao thành công theo bưu cục</h3>
              <p>Phát hiện nhanh bưu cục đang đạt hiệu suất giao hàng cao hoặc kém.</p>
            </div>
          </div>
          <div className="admin-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={analyticsData.hubSuccessRates}
                margin={{ top: 8, right: 40, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(val) => [`${val}%`, 'Tỷ lệ thành công']} />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={18}>
                  {analyticsData.hubSuccessRates.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.rate >= 85 ? '#137f5d' : entry.rate >= 75 ? '#f59e0b' : '#b12233'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* 8. NDR / GIAO THẤT BẠI */}
      <article className="admin-chart-card">
        <div className="admin-chart-header">
          <div>
            <h3>Nguyên nhân giao hàng thất bại</h3>
            <p>Phân tích lý do phát sinh sự cố giao không thành công trong hệ thống.</p>
          </div>
        </div>
        <div className="admin-chart-body">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analyticsData.ndrReasonsCount} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="reason" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(val, _name, item) => [`${formatNumber(Number(val))} đơn`, item.payload.fullReason]} />
              <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
