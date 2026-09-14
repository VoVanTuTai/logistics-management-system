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

import {
  calculateHubStatistics,
  calculateMonthlyTrend,
  calculateRootCauseBreakdown,
  readClaims,
  ROOT_CAUSE_LABELS,
} from '../../../../features/claims/claims.data';
import { SCOPE_OPTIONS, useOpsScopeStore } from '../../../../store/opsScopeStore';
import type {
  CompensationClaim,
  HubClaimSummary,
  RiskLevel,
} from '../../../../features/claims/claims.types';
import './HubCompensationStatisticsPage.css';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export const HubCompensationStatisticsPage: React.FC = () => {
  const [claims, setClaims] = useState<CompensationClaim[]>(() => readClaims());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [selectedHubDetail, setSelectedHubDetail] = useState<HubClaimSummary | null>(null);

  // Operations Scope Tier from Global Store
  const scopeLevel = useOpsScopeStore((state) => state.scopeLevel);
  const selectedProvinceName = useOpsScopeStore((state) => state.selectedProvinceName);
  const selectedHubCode = useOpsScopeStore((state) => state.selectedHubCode);
  const selectedHubName = useOpsScopeStore((state) => state.selectedHubName);

  const currentScopeMeta = useMemo(() => {
    return SCOPE_OPTIONS.find((s) => s.key === scopeLevel) || SCOPE_OPTIONS[0];
  }, [scopeLevel]);

  // Re-read data on refresh
  const handleRefresh = () => {
    setClaims(readClaims());
  };

  const allHubStats = useMemo(() => calculateHubStatistics(claims), [claims]);

  // Scoped Hub Statistics based on Tier Level (Nationwide / Regional / Provincial / Ward)
  const scopedHubStats = useMemo(() => {
    return allHubStats.filter((h) => {
      if (scopeLevel === 'NATIONWIDE') return true;
      if (scopeLevel === 'REGION_NORTH') return h.zoneCode === 'ZONE_NORTH';
      if (scopeLevel === 'REGION_CENTRAL') return h.zoneCode === 'ZONE_CENTRAL';
      if (scopeLevel === 'REGION_SOUTH') return h.zoneCode === 'ZONE_SOUTH';
      if (scopeLevel === 'PROVINCE') {
        if (selectedProvinceName?.toLowerCase().includes('hà nội')) {
          return h.hubCode.startsWith('HN') || h.hubName.includes('Hà Nội');
        }
        return (
          h.hubCode.startsWith('HCM') ||
          h.hubName.includes('TP.HCM') ||
          h.hubName.includes('Tân Bình') ||
          h.hubName.includes('Quận 1')
        );
      }
      if (scopeLevel === 'HUB') {
        const target = selectedHubCode || 'HCM02';
        return h.hubCode === target || h.hubCode === 'HCM02';
      }
      return true;
    });
  }, [allHubStats, scopeLevel, selectedProvinceName, selectedHubCode]);

  // Scoped Claims matching the filtered hubs
  const scopedClaims = useMemo(() => {
    if (scopeLevel === 'NATIONWIDE') return claims;
    const scopedCodes = new Set(scopedHubStats.map((h) => h.hubCode));
    return claims.filter(
      (c) =>
        scopedCodes.has(c.originHubCode) ||
        scopedCodes.has(c.responsibleEntityCode) ||
        scopedCodes.has(c.destinationHubCode),
    );
  }, [claims, scopeLevel, scopedHubStats]);

  const rootCauseStats = useMemo(() => calculateRootCauseBreakdown(scopedClaims), [scopedClaims]);
  const monthlyTrend = useMemo(() => calculateMonthlyTrend(), []);

  // Top-level network KPIs calculated on scoped data
  const overallKPIs = useMemo(() => {
    const totalVolume = scopedHubStats.reduce((sum, h) => sum + h.totalShipmentsHandled, 0);
    const totalIncidents = scopedClaims.length;
    const lossRate = totalVolume > 0 ? (totalIncidents / totalVolume) * 100 : 0;
    const totalCost = scopedClaims.reduce(
      (sum, c) => sum + (c.approvedCompensationAmount || c.claimRequestedAmount || 0),
      0,
    );
    const totalPenaltyAssigned = scopedClaims.reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);
    const totalPenaltyRecovered = scopedClaims
      .filter((c) => Boolean(c.hubDeductedAt))
      .reduce((sum, c) => sum + (c.penaltyAmount || 0), 0);
    const recoveryRate =
      totalPenaltyAssigned > 0 ? (totalPenaltyRecovered / totalPenaltyAssigned) * 100 : 0;

    const criticalHub = [...scopedHubStats].sort(
      (a, b) => b.totalCompensationCost - a.totalCompensationCost,
    )[0];

    return {
      lossRate: Number(lossRate.toFixed(3)),
      totalCost,
      recoveryRate: Number(recoveryRate.toFixed(1)),
      criticalHub: criticalHub?.hubName || 'Không có',
      criticalHubCode: criticalHub?.hubCode || 'N/A',
      totalIncidents,
      totalVolume,
    };
  }, [scopedClaims, scopedHubStats]);

  // Filtered hub table
  const filteredHubs = useMemo(() => {
    return scopedHubStats.filter((hub) => {
      const matchQuery =
        hub.hubCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hub.hubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hub.zoneCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRisk =
        selectedRiskFilter === 'ALL' || hub.riskLevel === selectedRiskFilter;

      return matchQuery && matchRisk;
    });
  }, [scopedHubStats, searchQuery, selectedRiskFilter]);

  // Data for Top Hubs Bar Chart
  const topHubsChartData = useMemo(() => {
    return [...scopedHubStats]
      .sort((a, b) => b.totalCompensationCost - a.totalCompensationCost)
      .slice(0, 5)
      .map((h) => ({
        name: h.hubCode,
        fullName: h.hubName,
        'Tiền bồi thường': Math.round(h.totalCompensationCost / 1000000), // Triệu VNĐ
        'Thu hồi chế tài': Math.round(h.penaltyRecoveredAmount / 1000000), // Triệu VNĐ
      }));
  }, [scopedHubStats]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã Hub',
      'Tên Hub',
      'Vùng miền',
      'Sản lượng xử lý',
      'Hỏng vỡ',
      'Thất lạc',
      'Tổng sự cố',
      'Tỷ lệ thất thoát (%)',
      'Tổng tiền bồi thường (VNĐ)',
      'Chế tài gán (VNĐ)',
      'Đã thu hồi (VNĐ)',
      'Mức rủi ro',
      'Nguyên nhân chủ yếu',
    ];

    const rows = filteredHubs.map((h) => [
      h.hubCode,
      `"${h.hubName}"`,
      h.zoneCode,
      h.totalShipmentsHandled,
      h.damagedCount,
      h.lostCount,
      h.totalIncidentCount,
      `${h.lossAndDamageRate}%`,
      h.totalCompensationCost,
      h.penaltyAssignedAmount,
      h.penaltyRecoveredAmount,
      h.riskLevel,
      `"${h.topRootCause}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_cao_boi_thuong_theo_hub_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find claims for selected hub
  const claimsForSelectedHub = useMemo(() => {
    if (!selectedHubDetail) return [];
    return claims.filter(
      (c) =>
        c.originHubCode === selectedHubDetail.hubCode ||
        c.responsibleEntityCode === selectedHubDetail.hubCode,
    );
  }, [claims, selectedHubDetail]);

  return (
    <div className="hub-stats-page">
      {/* Header */}
      <div className="hub-stats-header">
        <div className="hub-stats-title">
          <h1>📊 Thống Kê Bồi Thường Theo Hub & Báo Cáo Rủi Ro</h1>
          <p>
            Giám sát tỷ lệ hỏng vỡ, thất lạc (Loss & Damage Rate), theo dõi chi phí đền bù và thu hồi chế tài theo từng Hub và tuyến vận tải.
          </p>
          <div
            className="hub-scope-context-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              color: '#334155',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0284c7' }}>
              {currentScopeMeta.icon}
            </span>
            <span>
              Phạm vi quản trị: <strong style={{ color: '#0f172a' }}>{currentScopeMeta.label}</strong>
            </span>
            <span
              style={{
                backgroundColor: '#e2e8f0',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '11px',
                color: '#475569',
              }}
            >
              {currentScopeMeta.badge}
            </span>
            <span style={{ color: '#64748b', fontSize: '11.5px' }}>
              • Tổng hợp tự động {scopedHubStats.length} Hub trong phạm vi
            </span>
          </div>
        </div>
        <div className="hub-stats-actions">
          <button
            type="button"
            className="btn-refresh-stats"
            onClick={handleRefresh}
            title="Làm mới dữ liệu từ hệ thống"
          >
            🔄 Làm mới
          </button>
          <button
            type="button"
            className="btn-export-excel"
            onClick={handleExportCSV}
            title="Tải bảng đối soát dạng Excel/CSV"
          >
            📥 Xuất Báo Cáo Đối Soát (.csv)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="hub-stats-kpi-grid">
        <div className="hub-kpi-card loss-rate">
          <div className="kpi-icon-box red">📉</div>
          <div className="kpi-details">
            <div className="kpi-label">Tỷ Lệ Hỏng & Mất (Toàn Mạng)</div>
            <div className="kpi-value">{overallKPIs.lossRate}%</div>
            <div className="kpi-subtext">
              SLA Benchmark: <span className="badge-sla">&lt; 0.05%</span>
            </div>
          </div>
        </div>

        <div className="hub-kpi-card total-cost">
          <div className="kpi-icon-box amber">💰</div>
          <div className="kpi-details">
            <div className="kpi-label">Tổng Chi Phí Đền Bù</div>
            <div className="kpi-value">{formatVND(overallKPIs.totalCost)}</div>
            <div className="kpi-subtext">
              {overallKPIs.totalIncidents} hồ sơ phát sinh trong tháng
            </div>
          </div>
        </div>

        <div className="hub-kpi-card recovery-rate">
          <div className="kpi-icon-box green">⚖️</div>
          <div className="kpi-details">
            <div className="kpi-label">Tỷ Lệ Thu Hồi Chế Tài</div>
            <div className="kpi-value">{overallKPIs.recoveryRate}%</div>
            <div className="kpi-subtext">Cấn trừ công nợ & thưởng phạt nội bộ</div>
          </div>
        </div>

        <div className="hub-kpi-card critical-hub">
          <div className="kpi-icon-box purple">⚠️</div>
          <div className="kpi-details">
            <div className="kpi-label">Hub Rủi Ro Thiệt Hại Cao</div>
            <div className="kpi-value">{overallKPIs.criticalHubCode}</div>
            <div className="kpi-subtext">{overallKPIs.criticalHub}</div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="hub-charts-grid">
        {/* Chart 1: Top 5 Hubs BarChart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">🏢 Top 5 Hubs Thiệt Hại Bồi Thường Cao Nhất</h3>
            <span className="chart-legend-tag">Đơn vị: Triệu VNĐ</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topHubsChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = topHubsChartData.find((d) => d.name === label);
                      return (
                        <div className="custom-recharts-tooltip">
                          <div className="tooltip-title">{item?.fullName || label}</div>
                          {payload.map((p, index) => (
                            <div key={index} className="tooltip-row">
                              <span>{p.name}:</span>
                              <strong style={{ color: p.color }}>{p.value} tr VNĐ</strong>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Tiền bồi thường" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Thu hồi chế tài" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Root Cause Breakdown Donut Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">🎯 Phân Bổ Nguyên Nhân Gốc Rễ (Root Cause)</h3>
            <span className="chart-legend-tag">Theo tỷ lệ % sự cố</span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rootCauseStats}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {rootCauseStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-recharts-tooltip">
                          <div className="tooltip-title">{data.label}</div>
                          <div className="tooltip-row">
                            <span>Số ca vi phạm:</span>
                            <strong>{data.count} ca ({data.percentage}%)</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Chi phí đền bù:</span>
                            <strong style={{ color: '#fbbf24' }}>{formatVND(data.totalCost)}</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Trend Line Chart */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3 className="chart-title">📈 Xu Hướng Tỷ Lệ Thất Thoát & Chi Phí 6 Tháng Gần Nhất</h3>
            <span className="chart-legend-tag">Toàn hệ thống logistics</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#ef4444" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-recharts-tooltip">
                          <div className="tooltip-title">Tháng {label}</div>
                          <div className="tooltip-row">
                            <span>Tỷ lệ Loss Rate:</span>
                            <strong style={{ color: '#ef4444' }}>{payload[0]?.value}%</strong>
                          </div>
                          <div className="tooltip-row">
                            <span>Chi phí bồi thường:</span>
                            <strong style={{ color: '#3b82f6' }}>
                              {formatVND(Number(payload[1]?.value || 0))}
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="lossRate"
                  name="Loss Rate (%)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalCompensationCost"
                  name="Tổng tiền bồi thường (VNĐ)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hub Liability & Deductions Table */}
      <div className="hub-table-card">
        <div className="table-header-row">
          <div>
            <h3 className="table-title">📑 Ma Trận Đối Soát Bồi Thường & Chế Tài Theo Hub</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Danh sách chi tiết tỷ lệ hỏng vỡ, số tiền phải chịu và tình trạng thu hồi chế tài của từng đơn vị.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="table-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Tìm Hub theo mã, tên, vùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#ffffff',
                color: '#1e293b',
              }}
            >
              <option value="ALL">Mọi mức rủi ro</option>
              <option value="CRITICAL">🔴 Báo động Đỏ (Critical)</option>
              <option value="HIGH">🟠 Rủi ro Cao (High)</option>
              <option value="MEDIUM">🟡 Rủi ro Trung bình</option>
              <option value="LOW">🟢 Kiểm soát Tốt (Low)</option>
            </select>
          </div>
        </div>

        <div className="stats-table-wrapper">
          <table className="hub-stats-table">
            <thead>
              <tr>
                <th>Mã & Tên Hub</th>
                <th>Vùng</th>
                <th style={{ textAlign: 'right' }}>Sản Lượng</th>
                <th style={{ textAlign: 'center' }}>Hỏng / Mất</th>
                <th style={{ textAlign: 'right' }}>Tỷ Lệ Mất/Hỏng</th>
                <th style={{ textAlign: 'right' }}>Tiền Bồi Thường</th>
                <th style={{ textAlign: 'right' }}>Đã Thu Hồi</th>
                <th>Mức Rủi Ro</th>
                <th>Nguyên Nhân Chủ Yếu</th>
                <th style={{ textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredHubs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    Không tìm thấy dữ liệu Hub phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredHubs.map((hub) => {
                  const recoveryPercent =
                    hub.penaltyAssignedAmount > 0
                      ? Math.min(100, Math.round((hub.penaltyRecoveredAmount / hub.penaltyAssignedAmount) * 100))
                      : 100;

                  return (
                    <tr key={hub.hubCode}>
                      <td>
                        <div className="hub-name-cell">
                          <span className="hub-code-badge">{hub.hubCode}</span>
                          <span className="hub-fullname">{hub.hubName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-zone ${hub.zoneCode}`}>
                          {hub.zoneCode === 'ZONE_NORTH'
                            ? 'Miền Bắc'
                            : hub.zoneCode === 'ZONE_CENTRAL'
                              ? 'Miền Trung'
                              : 'Miền Nam'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {hub.totalShipmentsHandled.toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>{hub.damagedCount} vỡ</span> /{' '}
                        <span style={{ color: '#6366f1', fontWeight: 600 }}>{hub.lostCount} mất</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`loss-rate-cell ${hub.lossAndDamageRate > 0.03 ? 'high' : 'normal'}`}
                        >
                          {hub.lossAndDamageRate}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#b91c1c' }}>
                        {formatVND(hub.totalCompensationCost)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#059669' }}>
                          {formatVND(hub.penaltyRecoveredAmount)}
                        </div>
                        <div className="progress-bar-bg" title={`Đã thu hồi ${recoveryPercent}%`}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${recoveryPercent}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={`badge-risk ${hub.riskLevel}`}>
                          {hub.riskLevel === 'CRITICAL' && '🔴 BÁO ĐỘNG ĐỎ'}
                          {hub.riskLevel === 'HIGH' && '🟠 RỦI RO CAO'}
                          {hub.riskLevel === 'MEDIUM' && '🟡 TRUNG BÌNH'}
                          {hub.riskLevel === 'LOW' && '🟢 AN TOÀN'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '12px', color: '#475569' }}>
                        {hub.topRootCause}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-view-hub-claims"
                          onClick={() => setSelectedHubDetail(hub)}
                        >
                          Xem hồ sơ Hub
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hub Detail & CAPA Modal */}
      {selectedHubDetail && (
        <div className="hub-detail-modal-overlay" onClick={() => setSelectedHubDetail(null)}>
          <div className="hub-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                🏢 Chi Tiết Rủi Ro & Hồ Sơ Bồi Thường: {selectedHubDetail.hubCode} - {selectedHubDetail.hubName}
              </h2>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedHubDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Quick Hub Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SẢN LƯỢNG THÁNG</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>
                    {selectedHubDetail.totalShipmentsHandled.toLocaleString()} đơn
                  </div>
                </div>
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '11px', color: '#991b1b' }}>TỶ LỆ LOSS RATE</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>
                    {selectedHubDetail.lossAndDamageRate}%
                  </div>
                </div>
                <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '11px', color: '#92400e' }}>TIỀN ĐỀN BÙ PHẢI CHỊU</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#b45309' }}>
                    {formatVND(selectedHubDetail.totalCompensationCost)}
                  </div>
                </div>
                <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '11px', color: '#065f46' }}>ĐÃ THU HỒI CHẾ TÀI</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>
                    {formatVND(selectedHubDetail.penaltyRecoveredAmount)}
                  </div>
                </div>
              </div>

              {/* CAPA Recommendations */}
              <div className="capa-box">
                <h4>🛡️ Khuyến Nghị Biện Pháp Khắc Phục & Phòng Ngừa (CAPA)</h4>
                <ul>
                  <li>
                    <strong>Quy chuẩn đóng gói:</strong> Yêu cầu bộ phận tiếp nhận tại quầy bắt buộc chụp ảnh 3 góc trước khi dán tem niêm phong đối với các mặt hàng gốm sứ/dễ vỡ.
                  </li>
                  <li>
                    <strong>Xếp dỡ xe tải:</strong> Kiểm tra định kỳ quy tắc xếp pallet, nghiêm cấm đặt hàng nặng (&gt;15kg) lên các kiện hàng điện tử/gia dụng.
                  </li>
                  <li>
                    <strong>Kẹp chì niêm phong:</strong> Bắt buộc 2 bên tài xế và thủ kho cùng ký biên bản bàn giao số seri seal trước khi xuất phát và khi mở thùng xe.
                  </li>
                </ul>
              </div>

              {/* Claims list of this hub */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>
                  📋 Danh sách các sự cố liên quan đến Hub ({claimsForSelectedHub.length} hồ sơ):
                </h4>
                {claimsForSelectedHub.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Không có hồ sơ sự cố phát sinh tại Hub này.</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Mã HS</th>
                          <th style={{ padding: '8px' }}>Mã Kiện</th>
                          <th style={{ padding: '8px' }}>Loại Sự Cố</th>
                          <th style={{ padding: '8px' }}>Nguyên Nhân</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Tiền Bồi Thường</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claimsForSelectedHub.map((c) => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{c.claimCode}</td>
                            <td style={{ padding: '8px', color: '#2563eb' }}>{c.shipmentCode}</td>
                            <td style={{ padding: '8px' }}>
                              {c.incidentType === 'DAMAGED' ? 'Bể vỡ' : 'Thất lạc'}
                            </td>
                            <td style={{ padding: '8px', color: '#64748b' }}>
                              {ROOT_CAUSE_LABELS[c.rootCause]}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                              {formatVND(c.approvedCompensationAmount || c.claimRequestedAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-refresh-stats"
                  onClick={() => setSelectedHubDetail(null)}
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubCompensationStatisticsPage;
