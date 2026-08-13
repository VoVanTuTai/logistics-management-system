import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { routePaths } from '../../navigation/routes';
import { resolveAllowedScopes, ScopeLevel, useOpsScopeStore } from '../../store/opsScopeStore';
import { useAuthStore } from '../../store/authStore';
import { exportShipmentsToExcel } from '../../utils/shipmentExcelExporter';

interface RegionalPerformanceItem {
  regionKey: string;
  regionName: string;
  totalOrders: number;
  onTimeDeliveryRate: number;
  activeCouriers: number;
  bottleneckAlerts: number;
  linehaulVehicles: number;
  codHeldVnd: number;
}

interface LinehaulTripMonitorItem {
  tripCode: string;
  route: string;
  driverName: string;
  vehiclePlate: string;
  departureTime: string;
  estimatedArrival: string;
  sealStatus: 'SEALED' | 'UNSEALED' | 'CHECKED';
  capacityUsagePercent: number;
  status: 'ON_SCHEDULE' | 'DELAYED' | 'ARRIVED';
}

const REGION_COLORS = ['#4f46e5', '#0284c7', '#059669'];

function formatNumber(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val);
}

function formatVnd(val: number): string {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(2).replace('.', ',')} tỷ VNĐ`;
  }
  if (val >= 1_000_000) {
    return `${Math.round(val / 1_000_000)} triệu VNĐ`;
  }
  return `${formatNumber(val)} VNĐ`;
}

export function MasterOpsCommandCenterPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const scopeLevel = useOpsScopeStore((state) => state.scopeLevel);
  const selectedHubName = useOpsScopeStore((state) => state.selectedHubName);
  const setScopeLevel = useOpsScopeStore((state) => state.setScopeLevel);

  const allowedScopes = useMemo(() => {
    return resolveAllowedScopes(
      session?.user.username,
      session?.user.roles,
      session?.user.hubCodes,
    );
  }, [session?.user.username, session?.user.roles, session?.user.hubCodes]);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LINEHAUL' | 'BOTTLENECK'>('OVERVIEW');

  // Simulated Macro Nationwide Analytics Data
  const regionsData = useMemo<RegionalPerformanceItem[]>(
    () => [
      {
        regionKey: 'REGION_NORTH',
        regionName: 'Khu Vực Miền Bắc (Hà Nội Hub Tổng)',
        totalOrders: 42850,
        onTimeDeliveryRate: 94.2,
        activeCouriers: 320,
        bottleneckAlerts: 1,
        linehaulVehicles: 28,
        codHeldVnd: 1850000000,
      },
      {
        regionKey: 'REGION_CENTRAL',
        regionName: 'Khu Vực Miền Trung (Đà Nẵng Hub Tổng)',
        totalOrders: 18400,
        onTimeDeliveryRate: 91.8,
        activeCouriers: 145,
        bottleneckAlerts: 2,
        linehaulVehicles: 16,
        codHeldVnd: 920000000,
      },
      {
        regionKey: 'REGION_SOUTH',
        regionName: 'Khu Vực Miền Nam (TP.HCM Hub Tổng)',
        totalOrders: 65200,
        onTimeDeliveryRate: 96.1,
        activeCouriers: 580,
        bottleneckAlerts: 0,
        linehaulVehicles: 45,
        codHeldVnd: 3420000000,
      },
    ],
    [],
  );

  const filteredRegions = useMemo(() => {
    if (scopeLevel === 'NATIONWIDE' || scopeLevel === 'HUB') return regionsData;
    return regionsData.filter((r) => r.regionKey === scopeLevel);
  }, [regionsData, scopeLevel]);

  const macroKpi = useMemo(() => {
    const totalOrders = filteredRegions.reduce((sum, r) => sum + r.totalOrders, 0);
    const avgSla = filteredRegions.reduce((sum, r) => sum + r.onTimeDeliveryRate, 0) / filteredRegions.length;
    const totalCouriers = filteredRegions.reduce((sum, r) => sum + r.activeCouriers, 0);
    const totalBottlenecks = filteredRegions.reduce((sum, r) => sum + r.bottleneckAlerts, 0);
    const totalLinehaul = filteredRegions.reduce((sum, r) => sum + r.linehaulVehicles, 0);
    const totalCod = filteredRegions.reduce((sum, r) => sum + r.codHeldVnd, 0);

    return {
      totalOrders,
      avgSla: Number(avgSla.toFixed(1)),
      totalCouriers,
      totalBottlenecks,
      totalLinehaul,
      totalCod,
    };
  }, [filteredRegions]);

  const linehaulTrips = useMemo<LinehaulTripMonitorItem[]>(
    () => [
      {
        tripCode: 'LH-HN-HCM-992',
        route: 'Hà Nội ➔ TP. Hồ Chí Minh (Tuyến Nhanh A1)',
        driverName: 'Nguyễn Văn Minh',
        vehiclePlate: '29H-882.14',
        departureTime: '06:00 Hôm nay',
        estimatedArrival: '18:00 Hôm nay',
        sealStatus: 'SEALED',
        capacityUsagePercent: 92,
        status: 'ON_SCHEDULE',
      },
      {
        tripCode: 'LH-DN-HN-401',
        route: 'Đà Nẵng ➔ Hà Nội (Tuyến Trung Chuyển T1)',
        driverName: 'Trần Quốc Bảo',
        vehiclePlate: '43C-112.50',
        departureTime: '08:30 Hôm nay',
        estimatedArrival: '20:00 Hôm nay',
        sealStatus: 'CHECKED',
        capacityUsagePercent: 88,
        status: 'ON_SCHEDULE',
      },
      {
        tripCode: 'LH-HCM-DN-105',
        route: 'TP. Hồ Chí Minh ➔ Đà Nẵng (Tuyến Phủ Sóng M1)',
        driverName: 'Phạm Đức Thành',
        vehiclePlate: '51D-903.77',
        departureTime: '04:15 Hôm nay',
        estimatedArrival: '19:45 Hôm nay',
        sealStatus: 'SEALED',
        capacityUsagePercent: 98,
        status: 'DELAYED',
      },
    ],
    [],
  );

  const hourlyFlowData = [
    { time: '06:00', flowNationwide: 4200, slaRate: 98.1 },
    { time: '09:00', flowNationwide: 12500, slaRate: 97.4 },
    { time: '12:00', flowNationwide: 28400, slaRate: 96.0 },
    { time: '15:00', flowNationwide: 49800, slaRate: 95.2 },
    { time: '18:00', flowNationwide: 78900, slaRate: 94.8 },
    { time: '21:00', flowNationwide: 112000, slaRate: 94.5 },
  ];

  return (
    <div className="master-ops-command-center" style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* 1. TOP HEADER BANNER */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.25)', border: '1px solid rgba(129, 140, 248, 0.4)', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#818cf8' }}>
                public
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#e0e7ff', letterSpacing: '0.5px' }}>
                HQ MASTER OPERATIONS COMMAND CENTER
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              TRUNG TÂM ĐIỀU HÀNH & GIÁM SÁT VẬN HÀNH TOÀN HỆ THỐNG
            </h1>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, maxWidth: '800px' }}>
              Giao diện dữ liệu vĩ mô tổng hợp toàn quốc — Giám sát luồng vận chuyển 3 Miền, theo dõi nghẽn tuyến, điều phối xe liên tỉnh và quản trị SLA hệ thống.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Phạm vi quan sát hiện tại:</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {allowedScopes.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setScopeLevel(opt.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: scopeLevel === opt.key ? '#818cf8' : 'rgba(255,255,255,0.15)',
                    backgroundColor: scopeLevel === opt.key ? '#4f46e5' : 'rgba(255,255,255,0.05)',
                    color: '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  const sampleRecords = [
                    { shipmentCode: 'NXS000001', currentStatus: 'IN_TRANSIT', currentLocation: 'Hub HCM 01', originHubCode: 'HCM-001', destinationHubCode: 'HN-001', senderName: 'Cửa hàng An Phú', senderPhone: '0904110001', senderAddress: '123 Nguyễn Thị Minh Khai, Q1, TP.HCM', senderProvince: 'TP. Hồ Chí Minh', receiverName: 'Nguyễn Văn A', receiverPhone: '0988123456', receiverAddress: '45 Cầu Giấy, Hà Nội', receiverRegion: 'Miền Bắc', codAmount: 450000, shippingFee: 32000, createdAt: new Date().toISOString() },
                    { shipmentCode: 'NXS000002', currentStatus: 'DELIVERED', currentLocation: 'Hub HN 01', originHubCode: 'HN-001', destinationHubCode: 'DN-001', senderName: 'Nhà sách Minh Châu', senderPhone: '0904110002', senderAddress: '88 Hoàng Hoa Thám, Hà Nội', senderProvince: 'Hà Nội', receiverName: 'Trần Thị B', receiverPhone: '0977654321', receiverAddress: '12 Lê Duẩn, Đà Nẵng', receiverRegion: 'Miền Trung', codAmount: 890000, shippingFee: 45000, createdAt: new Date().toISOString() },
                  ];
                  exportShipmentsToExcel(sampleRecords, 'Báo cáo Vận hành HQ Toàn quốc', 'HQ Master Ops');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid #10b981',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  download
                </span>
                Xuất Báo Cáo HQ (Full Fields)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MACRO KPI CARDS */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <article style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', borderLeft: '4px solid #4f46e5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Sản Lượng Toàn Quốc</span>
            <span className="material-symbols-outlined" style={{ color: '#4f46e5' }}>inventory_2</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
            {formatNumber(macroKpi.totalOrders)} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>đơn</span>
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>↑ 14.2% so với hôm qua</div>
        </article>

        <article style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tỷ Lệ Đạt SLA Toàn Hệ Thống</span>
            <span className="material-symbols-outlined" style={{ color: '#059669' }}>verified</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
            {macroKpi.avgSla}%
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Mục tiêu HQ &ge; 90.0%</div>
        </article>

        <article style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Nhân Sự Courier Online</span>
            <span className="material-symbols-outlined" style={{ color: '#0284c7' }}>badge</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
            {formatNumber(macroKpi.totalCouriers)} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>nhân sự</span>
          </div>
          <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>Phủ sóng 63 Tỉnh/Thành</div>
        </article>

        <article style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Xe Vận Chuyển Liên Tỉnh</span>
            <span className="material-symbols-outlined" style={{ color: '#7c3aed' }}>local_shipping</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
            {macroKpi.totalLinehaul} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>chuyến</span>
          </div>
          <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>Tuyến Bắc - Trung - Nam</div>
        </article>

        <article style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Cảnh Báo Nghẽn / Nghẽn Tuyến</span>
            <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>warning</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
            {macroKpi.totalBottlenecks} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>điểm</span>
          </div>
          <div style={{ fontSize: '12px', color: macroKpi.totalBottlenecks > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
            {macroKpi.totalBottlenecks > 0 ? 'Cần điều phối hỗ trợ' : 'Tất cả các tuyến thông suốt'}
          </div>
        </article>

        <article style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tổng Dòng Tiền COD Tạm Giữ</span>
            <span className="material-symbols-outlined" style={{ color: '#d97706' }}>account_balance_wallet</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '8px 0' }}>
            {formatVnd(macroKpi.totalCod)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Chờ chốt ca & đối soát bưu cục</div>
        </article>
      </section>

      {/* 3. MAIN TAB NAVIGATION & CONTENT */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                backgroundColor: activeTab === 'OVERVIEW' ? '#eff6ff' : 'transparent',
                color: activeTab === 'OVERVIEW' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
              }}
            >
              📊 Tổng Quan 3 Miền & Luồng Đơn
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LINEHAUL')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                backgroundColor: activeTab === 'LINEHAUL' ? '#eff6ff' : 'transparent',
                color: activeTab === 'LINEHAUL' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
              }}
            >
              🚛 Chuyến Xe Liên Tỉnh Linehaul
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BOTTLENECK')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                backgroundColor: activeTab === 'BOTTLENECK' ? '#eff6ff' : 'transparent',
                color: activeTab === 'BOTTLENECK' ? '#2563eb' : '#64748b',
                cursor: 'pointer',
              }}
            >
              ⚠️ Cảnh Báo & Giám Sát SLA
            </button>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Cập nhật tự động 30 giây/lần • Hệ thống ổn định
          </div>
        </div>

        {activeTab === 'OVERVIEW' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Diễn Biến Sản Lượng Vận Chuyển & SLA Toàn Quốc Theo Giờ
            </h3>
            <div style={{ width: '100%', height: 300, marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" tickFormatter={(v) => formatNumber(v)} />
                  <YAxis yAxisId="right" orientation="right" domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v, name) => [name === 'flowNationwide' ? `${formatNumber(Number(v))} đơn` : `${v}%`, name === 'flowNationwide' ? 'Sản lượng acumul' : 'SLA đạt']} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="flowNationwide" name="Sản lượng toàn quốc" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="slaRate" name="Tỷ lệ đạt SLA (%)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Báo Cáo Phủ Sóng & Chỉ Số 3 Miền Toàn Quốc
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredRegions.map((region) => (
                <div
                  key={region.regionKey}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{region.regionName}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                      SLA: {region.onTimeDeliveryRate}%
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#475569', margin: '12px 0' }}>
                    <div>Sản lượng: <strong style={{ color: '#0f172a' }}>{formatNumber(region.totalOrders)}</strong></div>
                    <div>Courier: <strong style={{ color: '#0f172a' }}>{region.activeCouriers}</strong></div>
                    <div>Xe tuyến: <strong style={{ color: '#0f172a' }}>{region.linehaulVehicles}</strong></div>
                    <div>Cảnh báo: <strong style={{ color: region.bottleneckAlerts > 0 ? '#dc2626' : '#16a34a' }}>{region.bottleneckAlerts} điểm</strong></div>
                  </div>
                  <div style={{ paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
                    COD tạm giữ: <strong style={{ color: '#0f172a' }}>{formatVnd(region.codHeldVnd)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'LINEHAUL' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Giám Sát Chuyến Xe Vận Chuyển Liên Tỉnh (Linehaul Fleet)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 12px' }}>Mã chuyến xe</th>
                  <th style={{ padding: '10px 12px' }}>Tuyến đường</th>
                  <th style={{ padding: '10px 12px' }}>Tài xế & Bảng số</th>
                  <th style={{ padding: '10px 12px' }}>Khởi hành / Dự kiến</th>
                  <th style={{ padding: '10px 12px' }}>Tem seal thùng</th>
                  <th style={{ padding: '10px 12px' }}>Tải trọng</th>
                  <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {linehaulTrips.map((trip) => (
                  <tr key={trip.tripCode} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4f46e5' }}>{trip.tripCode}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{trip.route}</td>
                    <td style={{ padding: '10px 12px' }}>{trip.driverName} ({trip.vehiclePlate})</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{trip.departureTime} ➔ {trip.estimatedArrival}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                        🔒 {trip.sealStatus}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{trip.capacityUsagePercent}%</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: trip.status === 'ON_SCHEDULE' ? '#dbeafe' : '#fee2e2',
                          color: trip.status === 'ON_SCHEDULE' ? '#1e40af' : '#b91c1c',
                        }}
                      >
                        {trip.status === 'ON_SCHEDULE' ? '● Đúng lịch trình' : '⚠️ Có rủi ro trễ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'BOTTLENECK' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Danh Sách Cảnh Báo Ùn Ứ & Điểm Nghẽn Vận Hành Cần Xử Lý
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '24px' }}>warning</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '14px', color: '#991b1b', display: 'block' }}>Bưu cục Đà Nẵng (DAN-001) — Sản lượng lưu kho tăng đột biến +35%</strong>
                  <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Hơn 450 vận đơn đang chờ nhập kho trung chuyển do xe tuyến liên tỉnh bị chậm 45 phút. Khuyến nghị điều phối xe dự phòng.</span>
                </div>
                <button type="button" style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Điều xe ngay
                </button>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: '24px' }}>schedule</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '14px', color: '#92400e', display: 'block' }}>Tuyến Hà Nội ➔ TP.HCM (LH-HCM-DN-105) — Cảnh báo trễ hạn SLA T1</strong>
                  <span style={{ fontSize: '12px', color: '#78350f' }}>Xe trung chuyển đang gặp thời tiết xấu tại khu vực Đèo Cả. Thời gian dự kiến trễ +60 phút so với kế hoạch.</span>
                </div>
                <button type="button" style={{ padding: '6px 12px', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Gửi thông báo bưu cục phát
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. QUICK LINKS TO OPS MODULES */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <Link to={routePaths.opsMetricsReport} style={{ textDecoration: 'none', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ color: '#4f46e5', fontSize: '24px', padding: '8px', backgroundColor: '#eef2ff', borderRadius: '8px' }}>analytics</span>
          <div>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Báo Cáo Vận Hành</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Chi tiết KPI & thời hiệu</span>
          </div>
        </Link>

        <Link to={routePaths.linehaulTripManagement} style={{ textDecoration: 'none', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '24px', padding: '8px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>local_shipping</span>
          <div>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Quản Lý Tuyến Nhanh</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Quản lý chuyến & tem xe</span>
          </div>
        </Link>

        <Link to={routePaths.serviceQualityAbnormalManagement} style={{ textDecoration: 'none', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '24px', padding: '8px', backgroundColor: '#ffedd5', borderRadius: '8px' }}>report_problem</span>
          <div>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Hàng Bất Thường</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Xử lý sự cố & khiếu nại</span>
          </div>
        </Link>

        <Link to={routePaths.serviceQualityProactiveActionBoard} style={{ textDecoration: 'none', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: '24px', padding: '8px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>assignment_turned_in</span>
          <div>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Proactive Board</strong>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Bàn điều phối chủ động</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
