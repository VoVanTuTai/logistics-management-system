/**
 * Mock data for the Operations Analytics Dashboard.
 * 
 * Dữ liệu mẫu được thiết kế chuyên nghiệp nhằm demo các biểu đồ
 * Recharts (BarChart, PieChart) và bảng cảnh báo vận hành.
 */

/* ------------------------------------------------------------------ */
/*  KPI Cards                                                         */
/* ------------------------------------------------------------------ */
export interface KeyMetric {
  label: string;
  value: string;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  accent: 'primary' | 'info' | 'success' | 'danger';
}

export const keyMetrics: KeyMetric[] = [
  {
    label: 'Tổng đơn trong ngày',
    value: '1,245',
    trend: 'up',
    trendValue: '+12.3%',
    accent: 'primary',
  },
  {
    label: 'Đang giao',
    value: '65%',
    unit: '(810 đơn)',
    trend: 'neutral',
    trendValue: '—',
    accent: 'info',
  },
  {
    label: 'Giao thành công',
    value: '32%',
    unit: '(398 đơn)',
    trend: 'up',
    trendValue: '+4.1%',
    accent: 'success',
  },
  {
    label: 'Bất thường / Cảnh báo',
    value: '3%',
    unit: '(37 đơn)',
    trend: 'down',
    trendValue: '+0.8%',
    accent: 'danger',
  },
];

/* ------------------------------------------------------------------ */
/*  Bar Chart – Sản lượng luân chuyển theo Hub (7 ngày)               */
/* ------------------------------------------------------------------ */
export interface HubThroughputDay {
  date: string;        // e.g. '10/05'
  HCM01: number;
  HCM02: number;
  HCM03: number;
  HNI01: number;
  DNG01: number;
}

export const hubThroughputData: HubThroughputDay[] = [
  { date: '11/05', HCM01: 320, HCM02: 280, HCM03: 195, HNI01: 410, DNG01: 165 },
  { date: '12/05', HCM01: 345, HCM02: 295, HCM03: 210, HNI01: 388, DNG01: 172 },
  { date: '13/05', HCM01: 298, HCM02: 310, HCM03: 225, HNI01: 420, DNG01: 190 },
  { date: '14/05', HCM01: 380, HCM02: 275, HCM03: 198, HNI01: 395, DNG01: 178 },
  { date: '15/05', HCM01: 410, HCM02: 330, HCM03: 240, HNI01: 450, DNG01: 205 },
  { date: '16/05', HCM01: 395, HCM02: 348, HCM03: 232, HNI01: 468, DNG01: 198 },
  { date: '17/05', HCM01: 425, HCM02: 365, HCM03: 252, HNI01: 485, DNG01: 220 },
];

export const hubBarColors: Record<string, string> = {
  HCM01: '#6366f1',
  HCM02: '#818cf8',
  HCM03: '#a5b4fc',
  HNI01: '#f59e0b',
  DNG01: '#10b981',
};

/* ------------------------------------------------------------------ */
/*  Donut Chart – Nguyên nhân giao thất bại (NDR / Exception)         */
/* ------------------------------------------------------------------ */
export interface NdrReasonSlice {
  name: string;
  value: number;
  color: string;
}

export const ndrReasonData: NdrReasonSlice[] = [
  { name: 'Khách hẹn lại',       value: 35, color: '#6366f1' },
  { name: 'Không nghe máy',      value: 28, color: '#f59e0b' },
  { name: 'Sai địa chỉ',        value: 18, color: '#ef4444' },
  { name: 'Khách từ chối nhận',  value: 12, color: '#10b981' },
  { name: 'Khác',                value: 7,  color: '#94a3b8' },
];

/* ------------------------------------------------------------------ */
/*  Urgent Alert Table – Cảnh báo cần xử lý gấp                      */
/* ------------------------------------------------------------------ */
export type AlertSeverity = 'critical' | 'high' | 'medium';

export interface UrgentAlert {
  id: string;
  shipmentCode: string;
  issue: string;
  hub: string;
  severity: AlertSeverity;
  elapsedHours: number;
  courier: string;
}

export const urgentAlerts: UrgentAlert[] = [
  {
    id: 'alert-1',
    shipmentCode: 'NXS-20260517-00842',
    issue: 'Quá hạn SLA giao 48h',
    hub: 'HCM01',
    severity: 'critical',
    elapsedHours: 52,
    courier: 'Nguyễn Văn A',
  },
  {
    id: 'alert-2',
    shipmentCode: 'NXS-20260517-01103',
    issue: 'Khách khiếu nại 3 lần liên tiếp',
    hub: 'HCM02',
    severity: 'critical',
    elapsedHours: 36,
    courier: 'Trần Thị B',
  },
  {
    id: 'alert-3',
    shipmentCode: 'NXS-20260516-08977',
    issue: 'Sai địa chỉ – chưa liên hệ lại',
    hub: 'HNI01',
    severity: 'high',
    elapsedHours: 28,
    courier: 'Lê Minh C',
  },
  {
    id: 'alert-4',
    shipmentCode: 'NXS-20260516-05421',
    issue: 'Hàng hư hỏng – chờ xác nhận',
    hub: 'DNG01',
    severity: 'high',
    elapsedHours: 18,
    courier: 'Phạm Quốc D',
  },
  {
    id: 'alert-5',
    shipmentCode: 'NXS-20260517-02204',
    issue: 'Shipper báo mất hàng',
    hub: 'HCM03',
    severity: 'medium',
    elapsedHours: 6,
    courier: 'Hoàng Thị E',
  },
];
