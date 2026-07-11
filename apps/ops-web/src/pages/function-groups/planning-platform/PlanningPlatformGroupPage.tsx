import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Sliders,
  Calendar,
  Activity,
  Layers,
  ShieldAlert,
} from 'lucide-react';

import './DemandForecasting.css';

// Interface for simulated daily operations record
interface DailyRecord {
  dayIndex: number;
  dateStr: string;
  dayOfWeek: string;
  totalOrders: number;
  pickupOrders: number;
  deliveryOrders: number;
  returnOrders: number;
  slaDelayed: number;
  merchantVolume: number; // Volume from top merchants
  hubAOrders: number;
  hubBOrders: number;
  hubCOrders: number;
}

// Generate base historical data for 30 days
function generateHistoricalData(
  volumeMultiplier: number,
  slaDelayedRate: number,
  weeklyPatternStrength: number
): DailyRecord[] {
  const data: DailyRecord[] = [];
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  
  // Base parameters
  const baseVolume = 1200;
  const growthSlope = 5; // upward trend
  
  // Day of week multipliers: high mid-week (Tuesday-Thursday), lower on weekends
  const dayMultipliers: Record<number, number> = {
    0: 0.7, // Sunday
    1: 1.1, // Monday
    2: 1.2, // Tuesday
    3: 1.25, // Wednesday
    4: 1.15, // Thursday
    5: 1.05, // Friday
    6: 0.8, // Saturday
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dayOfWeekIndex = currentDate.getDay();
    const dayOfWeekName = daysOfWeek[dayOfWeekIndex];
    
    // Calculate simulated volume with trend, weekly pattern, and random noise
    const trendVol = baseVolume + growthSlope * i;
    const weeklyFactor = 1 + (dayMultipliers[dayOfWeekIndex] - 1) * weeklyPatternStrength;
    const noise = (Math.sin(i * 1.5) * 50 + Math.cos(i * 0.8) * 30);
    
    const totalOrders = Math.max(
      200,
      Math.round((trendVol * weeklyFactor + noise) * volumeMultiplier)
    );

    // Distribution ratios
    const pickupRatio = 0.35 + Math.sin(i) * 0.03;
    const deliveryRatio = 0.55 + Math.cos(i) * 0.03;
    const returnRatio = 1 - (pickupRatio + deliveryRatio);

    const pickupOrders = Math.round(totalOrders * pickupRatio);
    const deliveryOrders = Math.round(totalOrders * deliveryRatio);
    const returnOrders = totalOrders - pickupOrders - deliveryOrders;

    // SLA delayed calculation
    const slaDelayed = Math.max(
      0,
      Math.round(totalOrders * (0.04 + Math.sin(i * 2.2) * 0.02) * slaDelayedRate)
    );

    // Top merchant volume (approx 40% of total)
    const merchantVolume = Math.round(totalOrders * (0.42 + Math.cos(i * 1.7) * 0.04));

    // Region/hub distributions (Hub A: ~45%, Hub B: ~35%, Hub C: ~20%)
    const hubAOrders = Math.round(totalOrders * (0.45 + Math.sin(i * 0.9) * 0.02));
    const hubBOrders = Math.round(totalOrders * (0.35 + Math.cos(i * 1.1) * 0.02));
    const hubCOrders = totalOrders - hubAOrders - hubBOrders;

    const dateStr = currentDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });

    data.push({
      dayIndex: i + 1,
      dateStr,
      dayOfWeek: dayOfWeekName,
      totalOrders,
      pickupOrders,
      deliveryOrders,
      returnOrders,
      slaDelayed,
      merchantVolume,
      hubAOrders,
      hubBOrders,
      hubCOrders,
    });
  }

  return data;
}

export function PlanningPlatformGroupPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulation' | 'capacity'>('dashboard');
  
  // Simulation Parameter States
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(1.0);
  const [slaDelayedRate, setSlaDelayedRate] = useState<number>(1.0);
  const [weeklyPatternStrength, setWeeklyPatternStrength] = useState<number>(1.0);
  
  // Capacity States
  const [courierCapacity, setCourierCapacity] = useState<number>(50); // orders per courier
  const [hubACapacityCouriers, setHubACapacityCouriers] = useState<number>(15);
  const [hubBCapacityCouriers, setHubBCapacityCouriers] = useState<number>(11);
  const [hubCCapacityCouriers, setHubCCapacityCouriers] = useState<number>(6);

  // Generate dataset dynamically based on simulation sliders
  const historicalData = useMemo(() => {
    return generateHistoricalData(volumeMultiplier, slaDelayedRate, weeklyPatternStrength);
  }, [volumeMultiplier, slaDelayedRate, weeklyPatternStrength]);

  // Model 1: Baseline Moving Average (e.g., 7-day MA)
  const baselineForecast = useMemo(() => {
    // Tomorrow's MA forecast is simply average of last 7 days
    const last7Days = historicalData.slice(-7);
    const sum = last7Days.reduce((acc, curr) => acc + curr.totalOrders, 0);
    return Math.round(sum / 7);
  }, [historicalData]);

  // Model 2: Simple Time-series Linear Regression with Weekly Seasonality
  const linearRegressionForecast = useMemo(() => {
    const N = historicalData.length;
    
    // Fit y = mx + c
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < N; i++) {
      const x = historicalData[i].dayIndex;
      const y = historicalData[i].totalOrders;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }
    
    const slope = (N * sumXY - sumX * sumY) / (N * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / N;

    // Calculate weekly seasonality factors
    // Ratios of Actual to Linear Trend for each day
    const dayRatios: Record<string, number[]> = {};
    for (let i = 0; i < N; i++) {
      const x = historicalData[i].dayIndex;
      const actual = historicalData[i].totalOrders;
      const trend = slope * x + intercept;
      const ratio = trend > 0 ? actual / trend : 1;
      
      const dow = historicalData[i].dayOfWeek;
      if (!dayRatios[dow]) {
        dayRatios[dow] = [];
      }
      dayRatios[dow].push(ratio);
    }

    const seasonalityFactors: Record<string, number> = {};
    Object.keys(dayRatios).forEach((dow) => {
      const arr = dayRatios[dow];
      const avg = arr.reduce((acc, c) => acc + c, 0) / arr.length;
      seasonalityFactors[dow] = avg;
    });

    // Forecast tomorrow (Day N + 1)
    const tomorrowDayIndex = N + 1;
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const tomorrowDow = daysOfWeek[tomorrowDate.getDay()];
    
    const tomorrowTrend = slope * tomorrowDayIndex + intercept;
    const tomorrowSeasonality = seasonalityFactors[tomorrowDow] ?? 1.0;
    
    const forecastVal = Math.max(100, Math.round(tomorrowTrend * tomorrowSeasonality));
    
    return {
      slope,
      intercept,
      forecastValue: forecastVal,
      tomorrowDow,
    };
  }, [historicalData]);

  // Model performance analysis (MAPE over last 7 days of historical data)
  const modelComparisons = useMemo(() => {
    let baselineErrorSum = 0;
    let regressionErrorSum = 0;
    const testCount = 7;
    const startTestIdx = historicalData.length - testCount;

    for (let i = 0; i < testCount; i++) {
      const idx = startTestIdx + i;
      const actual = historicalData[idx].totalOrders;
      
      // 1. Moving average at that point (using previous 7 days)
      const prevForMA = historicalData.slice(idx - 7, idx);
      const maPrediction = prevForMA.reduce((acc, c) => acc + c.totalOrders, 0) / prevForMA.length;
      baselineErrorSum += Math.abs(actual - maPrediction) / actual;

      // 2. Linear Regression at that point (using all data up to idx - 1)
      const trainingSet = historicalData.slice(0, idx);
      const Tn = trainingSet.length;
      let sX = 0, sY = 0, sXY = 0, sXX = 0;
      for (let j = 0; j < Tn; j++) {
        const x = trainingSet[j].dayIndex;
        const y = trainingSet[j].totalOrders;
        sX += x;
        sY += y;
        sXY += x * y;
        sXX += x * x;
      }
      const sl = (Tn * sXY - sX * sY) / (Tn * sXX - sX * sX);
      const int = (sY - sl * sX) / Tn;
      const lrTrend = sl * (idx + 1) + int;

      // Seasonality factor for this DOW
      const dow = historicalData[idx].dayOfWeek;
      const dowRatios = trainingSet
        .filter((d) => d.dayOfWeek === dow)
        .map((d) => d.totalOrders / (sl * d.dayIndex + int));
      const dowSeasonality = dowRatios.length > 0 
        ? dowRatios.reduce((a, b) => a + b, 0) / dowRatios.length 
        : 1.0;

      const lrPrediction = lrTrend * dowSeasonality;
      regressionErrorSum += Math.abs(actual - lrPrediction) / actual;
    }

    return {
      baselineMape: Math.round((baselineErrorSum / testCount) * 1000) / 10,
      regressionMape: Math.round((regressionErrorSum / testCount) * 1000) / 10,
    };
  }, [historicalData]);

  // Combine historical data with forecasted tomorrow for graph display
  const chartData = useMemo(() => {
    // Map existing records
    const records = historicalData.map((d, index) => {
      // Calculate 7-day MA for each point (starting day 8)
      let ma7 = null;
      if (index >= 7) {
        const last7 = historicalData.slice(index - 7, index);
        ma7 = Math.round(last7.reduce((acc, c) => acc + c.totalOrders, 0) / 7);
      }

      // Calculate regression trend for each point
      const x = d.dayIndex;
      const regressionVal = Math.round(
        linearRegressionForecast.slope * x + linearRegressionForecast.intercept
      );

      return {
        ...d,
        "Đơn hàng thực tế": d.totalOrders,
        "Đường Moving Average": ma7,
        "Dự báo Regression": regressionVal,
      };
    });

    // Add tomorrow's projection point
    const N = historicalData.length;
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const dateStr = tomorrowDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });

    records.push({
      dayIndex: N + 1,
      dateStr: `${dateStr} (Dự báo)`,
      dayOfWeek: linearRegressionForecast.tomorrowDow,
      totalOrders: 0,
      pickupOrders: 0,
      deliveryOrders: 0,
      returnOrders: 0,
      slaDelayed: 0,
      merchantVolume: 0,
      hubAOrders: 0,
      hubBOrders: 0,
      hubCOrders: 0,
      "Đơn hàng thực tế": undefined as any,
      "Đường Moving Average": baselineForecast,
      "Dự báo Regression": linearRegressionForecast.forecastValue,
    } as any);

    return records;
  }, [historicalData, linearRegressionForecast, baselineForecast]);

  // Regional breakdown prediction for tomorrow
  // Using historical percentages from the past 7 days to split tomorrow's forecasted volume
  const hubDistributionForecast = useMemo(() => {
    const last7Days = historicalData.slice(-7);
    const totalLast7 = last7Days.reduce((acc, c) => acc + c.totalOrders, 0);
    const totalA = last7Days.reduce((acc, c) => acc + c.hubAOrders, 0);
    const totalB = last7Days.reduce((acc, c) => acc + c.hubBOrders, 0);
    const totalC = last7Days.reduce((acc, c) => acc + c.hubCOrders, 0);

    const shareA = totalLast7 > 0 ? totalA / totalLast7 : 0.45;
    const shareB = totalLast7 > 0 ? totalB / totalLast7 : 0.35;
    const shareC = totalLast7 > 0 ? totalC / totalLast7 : 0.20;

    const tomorrowTotal = linearRegressionForecast.forecastValue;
    
    // Predicted orders per hub
    const predA = Math.round(tomorrowTotal * shareA);
    const predB = Math.round(tomorrowTotal * shareB);
    const predC = tomorrowTotal - predA - predB;

    // Capacities in orders = courier count * courier efficiency
    const capA = hubACapacityCouriers * courierCapacity;
    const capB = hubBCapacityCouriers * courierCapacity;
    const capC = hubCCapacityCouriers * courierCapacity;

    // Load percentages
    const loadA = capA > 0 ? Math.round((predA / capA) * 100) : 0;
    const loadB = capB > 0 ? Math.round((predB / capB) * 100) : 0;
    const loadC = capC > 0 ? Math.round((predC / capC) * 100) : 0;

    // Suggested couriers (minimum needed to handle predicted load)
    const sugA = Math.ceil(predA / courierCapacity);
    const sugB = Math.ceil(predB / courierCapacity);
    const sugC = Math.ceil(predC / courierCapacity);

    return [
      {
        id: 'hub-a',
        name: 'Hub Miền Bắc (Hub A)',
        predictedOrders: predA,
        capacityOrders: capA,
        couriersAssigned: hubACapacityCouriers,
        couriersSuggested: sugA,
        loadFactor: loadA,
        status: loadA > 100 ? 'danger' : loadA > 85 ? 'warning' : 'normal',
      },
      {
        id: 'hub-b',
        name: 'Hub Miền Nam (Hub B)',
        predictedOrders: predB,
        capacityOrders: capB,
        couriersAssigned: hubBCapacityCouriers,
        couriersSuggested: sugB,
        loadFactor: loadB,
        status: loadB > 100 ? 'danger' : loadB > 85 ? 'warning' : 'normal',
      },
      {
        id: 'hub-c',
        name: 'Hub Miền Trung (Hub C)',
        predictedOrders: predC,
        capacityOrders: capC,
        couriersAssigned: hubCCapacityCouriers,
        couriersSuggested: sugC,
        loadFactor: loadC,
        status: loadC > 100 ? 'danger' : loadC > 85 ? 'warning' : 'normal',
      },
    ];
  }, [
    historicalData,
    linearRegressionForecast,
    courierCapacity,
    hubACapacityCouriers,
    hubBCapacityCouriers,
    hubCCapacityCouriers,
  ]);

  // Aggregate courier suggestion
  const totalCouriersSuggested = hubDistributionForecast.reduce((a, b) => a + b.couriersSuggested, 0);
  const totalCouriersAssigned = hubACapacityCouriers + hubBCapacityCouriers + hubCCapacityCouriers;

  // Active warning alerts for overload risks
  const overloadAlerts = useMemo(() => {
    return hubDistributionForecast.filter((h) => h.loadFactor > 90);
  }, [hubDistributionForecast]);

  // Calculate historical totals for operation mix pie chart (pickups, deliveries, returns)
  const operationMixData = useMemo(() => {
    const last7Days = historicalData.slice(-7);
    const pickups = last7Days.reduce((acc, c) => acc + c.pickupOrders, 0);
    const deliveries = last7Days.reduce((acc, c) => acc + c.deliveryOrders, 0);
    const returns = last7Days.reduce((acc, c) => acc + c.returnOrders, 0);
    
    return [
      { name: 'Đơn Delivery', value: deliveries, color: '#3b82f6' },
      { name: 'Đơn Pickup', value: pickups, color: '#10b981' },
      { name: 'Đơn Return', value: returns, color: '#f59e0b' },
    ];
  }, [historicalData]);

  // SLA delay percentage trend calculation
  const slaTrendData = useMemo(() => {
    return historicalData.map((d) => ({
      dateStr: d.dateStr,
      "Tỉ lệ trễ SLA (%)": d.totalOrders > 0 ? Math.round((d.slaDelayed / d.totalOrders) * 1000) / 10 : 0,
      "Số đơn trễ SLA": d.slaDelayed,
    }));
  }, [historicalData]);

  return (
    <div className="ops-forecast-container">
      {/* Page Header */}
      <header className="ops-forecast-header">
        <div>
          <small className="ops-forecast-card-label" style={{ color: '#2563eb' }}>Planning Platform</small>
          <h1>Dự báo tải vận hành & Quy hoạch Tài nguyên</h1>
          <p>
            Dự báo sản lượng đơn hàng theo ngày/khu vực/hub hỗ trợ lập kế hoạch và điều phối courier.
          </p>
        </div>
        
        {/* Reset parameters button */}
        <button
          type="button"
          onClick={() => {
            setVolumeMultiplier(1.0);
            setSlaDelayedRate(1.0);
            setWeeklyPatternStrength(1.0);
            setCourierCapacity(50);
            setHubACapacityCouriers(15);
            setHubBCapacityCouriers(11);
            setHubCCapacityCouriers(6);
          }}
          className="ops-forecast-tab-btn"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#fff',
            fontSize: '0.8rem',
            padding: '6px 12px',
          }}
        >
          Đặt lại mặc định
        </button>
      </header>

      {/* Tabs Menu */}
      <nav className="ops-forecast-tabs" aria-label="Forecast tabs navigation">
        <button
          type="button"
          className={`ops-forecast-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Bảng điều khiển Dự báo
        </button>
        <button
          type="button"
          className={`ops-forecast-tab-btn ${activeTab === 'simulation' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulation')}
        >
          Mô phỏng Dữ liệu ML
        </button>
        <button
          type="button"
          className={`ops-forecast-tab-btn ${activeTab === 'capacity' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacity')}
        >
          Cấu hình Năng lực Hub
        </button>
      </nav>

      {/* Warning Banners */}
      {overloadAlerts.length > 0 && (
        <section className="ops-forecast-alerts-section" aria-label="Overload Alerts">
          {overloadAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`ops-forecast-alert-banner ${alert.loadFactor > 100 ? 'danger' : 'warning'}`}
            >
              <ShieldAlert />
              <div className="ops-forecast-alert-content">
                <div className="ops-forecast-alert-title">
                  Nguy cơ quá tải vận hành tại {alert.name} ({alert.loadFactor}% Tải dự báo)
                </div>
                <div className="ops-forecast-alert-desc">
                  Sản lượng dự báo ngày mai tại {alert.name} đạt{' '}
                  <strong>{alert.predictedOrders} đơn</strong>, vượt mức năng lực xử lý hiện tại ({alert.capacityOrders} đơn với {alert.couriersAssigned} Courier). Gợi ý chuẩn bị tối thiểu <strong>{alert.couriersSuggested} Courier</strong> để tránh trễ hạn SLA.
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Tab 1: Forecasting Dashboard */}
      {activeTab === 'dashboard' && (
        <>
          {/* Top Metric Cards */}
          <section className="ops-forecast-summary-grid" aria-label="Key predictions summary">
            <div className="ops-forecast-card primary">
              <span className="ops-forecast-card-label">Sản lượng dự báo ngày mai</span>
              <div className="ops-forecast-card-value">
                {linearRegressionForecast.forecastValue}
                <span className="ops-forecast-card-unit">đơn hàng</span>
              </div>
              <div className="ops-forecast-card-desc">
                <TrendingUp size={14} style={{ color: '#10b981' }} />
                <span>Mô hình Regression ({linearRegressionForecast.tomorrowDow})</span>
              </div>
            </div>

            <div className="ops-forecast-card">
              <span className="ops-forecast-card-label">Baseline Moving Average</span>
              <div className="ops-forecast-card-value">
                {baselineForecast}
                <span className="ops-forecast-card-unit">đơn hàng</span>
              </div>
              <div className="ops-forecast-card-desc">
                <Calendar size={14} />
                <span>Trung bình động 7 ngày gần nhất</span>
              </div>
            </div>

            <div className="ops-forecast-card success">
              <span className="ops-forecast-card-label">Courier cần chuẩn bị</span>
              <div className="ops-forecast-card-value">
                {totalCouriersSuggested}
                <span className="ops-forecast-card-unit">Nhân sự</span>
              </div>
              <div className="ops-forecast-card-desc">
                <Users size={14} />
                <span>Hiện tại có: {totalCouriersAssigned} (Thiếu {Math.max(0, totalCouriersSuggested - totalCouriersAssigned)})</span>
              </div>
            </div>

            <div className="ops-forecast-card warning">
              <span className="ops-forecast-card-label">Nguy cơ quá tải khu vực</span>
              <div className="ops-forecast-card-value">
                {overloadAlerts.length}
                <span className="ops-forecast-card-unit">Hub cảnh báo</span>
              </div>
              <div className="ops-forecast-card-desc">
                <AlertTriangle size={14} />
                <span>Độ trễ trung bình SLA dự đoán: {Math.round(4.5 * slaDelayedRate * 10) / 10}%</span>
              </div>
            </div>
          </section>

          {/* Main Visualizations Layout */}
          <section className="ops-forecast-main-layout">
            {/* Chart Card */}
            <article className="ops-forecast-chart-card">
              <header className="ops-forecast-chart-header">
                <span className="ops-forecast-chart-title">Xu hướng sản lượng và Đường dự báo ngày mai</span>
                <div className="ops-forecast-chart-legend">
                  <div className="ops-forecast-legend-item">
                    <span className="ops-forecast-legend-dot" style={{ backgroundColor: '#2563eb' }} />
                    Thực tế
                  </div>
                  <div className="ops-forecast-legend-item">
                    <span className="ops-forecast-legend-dot" style={{ backgroundColor: '#f59e0b' }} />
                    Baseline MA (7d)
                  </div>
                  <div className="ops-forecast-legend-item">
                    <span className="ops-forecast-legend-dot" style={{ backgroundColor: '#10b981' }} />
                    Regression + Seasonality
                  </div>
                </div>
              </header>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dateStr" tick={{ fontSize: 10 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748b" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="Đơn hàng thực tế" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrders)" name="Sản lượng thực" />
                    <Line type="monotone" dataKey="Đường Moving Average" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Baseline MA Forecast" />
                    <Line type="monotone" dataKey="Dự báo Regression" stroke="#10b981" strokeWidth={2} dot={{ r: 5 }} name="Seasonal LR Forecast" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Hub Load Breakdown */}
            <article className="ops-forecast-detail-side">
              <div className="ops-forecast-table-card">
                <h3>Phân bổ tải theo Hub / Khu vực</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {hubDistributionForecast.map((hub) => (
                    <div key={hub.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                        <span>{hub.name}</span>
                        <span>{hub.predictedOrders} / {hub.capacityOrders} đơn</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="ops-forecast-progress-bar" style={{ flex: 1 }}>
                          <div
                            className="ops-forecast-progress-fill"
                            style={{
                              width: `${Math.min(100, hub.loadFactor)}%`,
                              backgroundColor: hub.status === 'danger' ? '#ef4444' : hub.status === 'warning' ? '#f59e0b' : '#3b82f6',
                            }}
                          />
                        </div>
                        <span className={`ops-forecast-hub-badge ${hub.status}`}>
                          {hub.loadFactor}% tải
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>Đã gán: {hub.couriersAssigned} Courier</span>
                        <span>Gợi ý: <strong>{hub.couriersSuggested} Courier</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Performance Compare Box */}
              <div className="ops-forecast-table-card">
                <h3>Độ lệch dự báo (Model MAPE)</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 12px 0' }}>
                  Đánh giá sai số phần trăm tuyệt đối trung bình (MAPE) trên 7 ngày gần nhất. Sai số càng nhỏ mô hình càng chính xác.
                </p>
                <div className="ops-model-stats-grid">
                  <div className="ops-model-stat-box" style={{ borderLeft: '3px solid #f59e0b' }}>
                    <div className="ops-model-stat-title">MAPE: Baseline MA</div>
                    <div className="ops-model-stat-value">{modelComparisons.baselineMape}%</div>
                  </div>
                  <div className="ops-model-stat-box" style={{ borderLeft: '3px solid #10b981' }}>
                    <div className="ops-model-stat-title">MAPE: Seasonal LR</div>
                    <div className="ops-model-stat-value">{modelComparisons.regressionMape}%</div>
                  </div>
                </div>
              </div>
            </article>
          </section>

          {/* Sub-visualizations (Operations mix & SLA delays) */}
          <section className="ops-forecast-main-layout" style={{ marginTop: '8px' }}>
            {/* SLA Delay Trend */}
            <article className="ops-forecast-chart-card">
              <div className="ops-forecast-chart-title" style={{ marginBottom: 16 }}>
                Diễn biến tỉ lệ trễ SLA vận hành (30 ngày qua)
              </div>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={slaTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dateStr" tick={{ fontSize: 10 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#64748b" unit="%" />
                    <Tooltip />
                    <Line type="monotone" dataKey="Tỉ lệ trễ SLA (%)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Operations Breakdown Pie */}
            <article className="ops-forecast-table-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center' }}>
              <h3>Cơ cấu hoạt động vận hành</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 12px 0' }}>
                Phân bổ tỉ lệ Pickup/Delivery/Return của tuần qua làm cơ sở dự báo cho tải ngày mai.
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={operationMixData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {operationMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} đơn`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', marginTop: 8 }}>
                {operationMixData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }} />
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}

      {/* Tab 2: Simulation adjustments */}
      {activeTab === 'simulation' && (
        <section className="ops-simulation-section">
          {/* Slider Panel */}
          <article className="ops-simulation-card">
            <h3>Tham số Mô phỏng Dữ liệu đầu vào</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Điều chỉnh các tham số này để mô phỏng sự biến động của dữ liệu thực tế và kiểm chứng khả năng phản hồi của các thuật toán ML.
            </p>

            <div className="ops-simulation-input-group">
              {/* Volume Multiplier */}
              <div className="ops-simulation-field">
                <div className="ops-simulation-field-header">
                  <span>Hệ số lượng đơn hàng (Volume Multiplier)</span>
                  <span className="ops-simulation-field-value">{volumeMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={volumeMultiplier}
                  onChange={(e) => setVolumeMultiplier(parseFloat(e.target.value))}
                  className="ops-simulation-slider"
                />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Mô phỏng đợt Mega Sale (tăng volume) hoặc mùa thấp điểm (giảm volume)
                </span>
              </div>

              {/* SLA Delayed rate multiplier */}
              <div className="ops-simulation-field">
                <div className="ops-simulation-field-header">
                  <span>Hệ số đơn trễ SLA (SLA Delayed Multiplier)</span>
                  <span className="ops-simulation-field-value">{slaDelayedRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={slaDelayedRate}
                  onChange={(e) => setSlaDelayedRate(parseFloat(e.target.value))}
                  className="ops-simulation-slider"
                />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Mô phỏng thời tiết xấu / ùn tắc giao thông làm tăng tỉ lệ trễ hẹn
                </span>
              </div>

              {/* Weekly Pattern Strength */}
              <div className="ops-simulation-field">
                <div className="ops-simulation-field-header">
                  <span>Độ mạnh quy luật tuần (Weekly Pattern Strength)</span>
                  <span className="ops-simulation-field-value">{weeklyPatternStrength}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={weeklyPatternStrength}
                  onChange={(e) => setWeeklyPatternStrength(parseFloat(e.target.value))}
                  className="ops-simulation-slider"
                />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Mô phỏng tính chu kỳ cuối tuần / đầu tuần (nếu bằng 0 sẽ triệt tiêu chu kỳ)
                </span>
              </div>
            </div>
          </article>

          {/* Model Description and math pipeline */}
          <article className="ops-simulation-card">
            <h3>Chi tiết Thuật toán Pipeline mô hình</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.825rem', lineHeight: '1.5', color: '#475569' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>1. Baseline Moving Average Model:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Tính trung bình cộng số đơn của 7 ngày gần nhất. Mô hình phản hồi chậm với các đột biến ngắn hạn và bỏ qua tính chu kỳ ngày trong tuần (DOW).
                </p>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <strong style={{ color: '#0f172a' }}>2. Linear Regression (LR) + Seasonality:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Khớp đường xu hướng tuyến tính bằng phương pháp Bình phương tối thiểu (OLS). Hệ số DOW Seasonality được tính bằng tỉ số trung bình giữa giá trị thực tế và giá trị xu hướng dự báo cho từng ngày trong tuần.
                </p>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <strong style={{ color: '#0f172a' }}>3. Cơ cấu tính năng lực & Gợi ý:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Mỗi courier xử lý tối đa <strong>{courierCapacity} đơn/ngày</strong> (có thể cấu hình trong tab Năng lực). Số courier gợi ý = <code>Math.ceil(Dự báo đơn / Năng lực courier)</code>.
                </p>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* Tab 3: Capacity configuration */}
      {activeTab === 'capacity' && (
        <section className="ops-simulation-section">
          {/* General capacity parameters */}
          <article className="ops-simulation-card">
            <h3>Cấu hình Năng lực Courier</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Thiết lập hiệu suất tối đa bình quân của một courier trong một ngày làm cơ sở tính toán định biên nhân sự.
            </p>

            <div className="ops-simulation-field">
              <div className="ops-simulation-field-header">
                <span>Số lượng đơn giao tối đa / Courier / Ngày</span>
                <span className="ops-simulation-field-value">{courierCapacity} đơn</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={courierCapacity}
                onChange={(e) => setCourierCapacity(parseInt(e.target.value))}
                className="ops-simulation-slider"
              />
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Tăng năng lực giao khi tối ưu hóa tuyến đường (Route Optimization) hoặc giảm khi điều kiện thời tiết xấu.
              </span>
            </div>
          </article>

          {/* Hub courier assignments */}
          <article className="ops-simulation-card">
            <h3>Phân bổ Courier hiện có tại Hub</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Điều chỉnh số lượng nhân sự courier đang túc trực tại mỗi hub để kiểm tra rủi ro quá tải.
            </p>

            <div className="ops-simulation-input-group">
              {/* Hub A */}
              <div className="ops-simulation-field">
                <div className="ops-simulation-field-header">
                  <span>Hub Miền Bắc (Hub A)</span>
                  <span className="ops-simulation-field-value">{hubACapacityCouriers} Courier</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={hubACapacityCouriers}
                  onChange={(e) => setHubACapacityCouriers(parseInt(e.target.value))}
                  className="ops-simulation-slider"
                />
              </div>

              {/* Hub B */}
              <div className="ops-simulation-field">
                <div className="ops-simulation-field-header">
                  <span>Hub Miền Nam (Hub B)</span>
                  <span className="ops-simulation-field-value">{hubBCapacityCouriers} Courier</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={hubBCapacityCouriers}
                  onChange={(e) => setHubBCapacityCouriers(parseInt(e.target.value))}
                  className="ops-simulation-slider"
                />
              </div>

              {/* Hub C */}
              <div className="ops-simulation-field">
                <div className="ops-simulation-field-header">
                  <span>Hub Miền Trung (Hub C)</span>
                  <span className="ops-simulation-field-value">{hubCCapacityCouriers} Courier</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={hubCCapacityCouriers}
                  onChange={(e) => setHubCCapacityCouriers(parseInt(e.target.value))}
                  className="ops-simulation-slider"
                />
              </div>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
