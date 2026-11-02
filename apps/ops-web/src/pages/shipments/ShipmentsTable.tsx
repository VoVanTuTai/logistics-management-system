import React from 'react';
import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';
import type { TaskListItemDto } from '../../features/tasks/tasks.types';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel, formatTaskStatusLabel } from '../../utils/logisticsLabels';
import { useColumnSelection } from '../../hooks/useColumnSelection';

export interface ShipmentsTableProps {
  items: ShipmentListItemDto[];
  deliveryCourierByShipment?: Map<string, string>;
  deliveryTaskByShipment?: Map<string, TaskListItemDto>;
  selectedShipmentCodes: string[];
  onToggleShipment: (shipmentCode: string, checked: boolean) => void;
  onToggleAllVisible: (checked: boolean) => void;
  pageOffset?: number;
  storageKeyPrefix?: string;
  defaultVisibleColumns?: Partial<Record<OpsColumnKey, boolean>>;
  columnLabelsOverride?: Partial<Record<OpsColumnKey, string>>;
  enabledColumns?: OpsColumnKey[];
  emptyMessage?: string;
  primaryHubResolver?: (shipment: ShipmentListItemDto) => string;
  oppositeHubResolver?: (shipment: ShipmentListItemDto) => string;
  onSelectAllFiltered?: () => void;
  totalFilteredCount?: number;
  onClearSelected?: () => void;
  showSelectionStrip?: boolean;
  renderCustomActions?: () => React.ReactNode;
  maxHeight?: string | number;
  tableShellStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  onRowClick?: (shipment: ShipmentListItemDto) => void;
}

const DEFAULT_EMPTY_COURIER_MAP = new Map<string, string>();
const DEFAULT_EMPTY_TASK_MAP = new Map<string, TaskListItemDto>();

export const DEFAULT_OPS_COL_WIDTHS = {
  stt: 55,
  code: 165,
  status: 140,
  parcelType: 120,
  chargeableWeight: 130,
  primaryHub: 120,
  oppositeHub: 120,
  senderName: 130,
  senderPhone: 120,
  senderAddress: 220,
  receiverName: 130,
  receiverPhone: 120,
  receiverAddress: 240,
  cod: 140,
  routeHub: 180,
  ageMinutes: 120,
  createdAt: 150,
  deliveredAt: 150,
  updatedAt: 150,
  deliveryNote: 180,
};

export const MIN_OPS_COL_WIDTHS: Record<keyof typeof DEFAULT_OPS_COL_WIDTHS, number> = {
  stt: 45,
  code: 120,
  status: 100,
  parcelType: 90,
  chargeableWeight: 85,
  primaryHub: 90,
  oppositeHub: 90,
  senderName: 80,
  senderPhone: 95,
  senderAddress: 120,
  receiverName: 80,
  receiverPhone: 95,
  receiverAddress: 120,
  cod: 90,
  routeHub: 120,
  ageMinutes: 85,
  createdAt: 110,
  deliveredAt: 110,
  updatedAt: 110,
  deliveryNote: 110,
};

export type OpsColumnKey = keyof typeof DEFAULT_OPS_COL_WIDTHS;

export const OPS_COLUMN_LABELS: Record<OpsColumnKey, string> = {
  stt: 'STT',
  code: 'Mã vận đơn & Nguồn',
  status: 'Trạng thái',
  parcelType: 'Loại hàng',
  chargeableWeight: 'KL tính cước (IATA)',
  primaryHub: 'Bưu cục đến / Quản lý',
  oppositeHub: 'Hub gửi / Đối ứng',
  senderName: 'Người gửi',
  senderPhone: 'SĐT gửi',
  senderAddress: 'Địa chỉ gửi',
  receiverName: 'Người nhận',
  receiverPhone: 'SĐT nhận',
  receiverAddress: 'Địa chỉ giao & Đồng kiểm',
  cod: 'Tiền COD & Cước',
  routeHub: 'Tuyến phát / Hub',
  ageMinutes: 'Tuổi xử lý & Cảnh báo',
  createdAt: 'Ngày giờ tạo',
  deliveredAt: 'Ngày nhận hàng',
  updatedAt: 'Cập nhật cuối',
  deliveryNote: 'Ghi chú vận hành',
};

export const DEFAULT_VISIBLE_COLUMNS: Record<OpsColumnKey, boolean> = {
  stt: false,
  code: true,
  status: true,
  parcelType: false,
  chargeableWeight: false,
  primaryHub: false,
  oppositeHub: false,
  senderName: true,
  senderPhone: false,
  senderAddress: false,
  receiverName: true,
  receiverPhone: true,
  receiverAddress: true,
  cod: true,
  routeHub: true,
  ageMinutes: false,
  createdAt: true,
  deliveredAt: false,
  updatedAt: false,
  deliveryNote: false,
};

export function minutesSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : Math.max(0, Math.floor((Date.now() - time) / 60000));
}

export function formatAge(minutes: number | null): string {
  if (minutes === null) return '---';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  return `${Math.floor(hours / 24)} ngày`;
}

function buildFullAddress(parts: Array<string | null | undefined>): string {
  return parts.map((part) => (part ?? '').trim()).filter(Boolean).join(', ');
}

export function useColumnVisibility(
  storageKey: string,
  defaultVisible: Record<OpsColumnKey, boolean> = DEFAULT_VISIBLE_COLUMNS,
  enabledColumns?: OpsColumnKey[],
) {
  const [visibleColumns, setVisibleColumns] = React.useState<Record<OpsColumnKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultVisible, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return defaultVisible;
  });

  const toggleColumn = React.useCallback((colKey: OpsColumnKey) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [colKey]: !prev[colKey] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [storageKey]);

  const setAllColumns = React.useCallback((visible: boolean) => {
    const keys = enabledColumns || (Object.keys(defaultVisible) as OpsColumnKey[]);
    setVisibleColumns((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = visible;
      });
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [defaultVisible, enabledColumns, storageKey]);

  const resetColumns = React.useCallback(() => {
    setVisibleColumns(defaultVisible);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultVisible));
    } catch {
      // ignore
    }
  }, [defaultVisible, storageKey]);

  return { visibleColumns, toggleColumn, setAllColumns, resetColumns };
}

export function ColumnVisibilityPicker<K extends string = OpsColumnKey>({
  visibleColumns,
  labels = OPS_COLUMN_LABELS as unknown as Record<K, string>,
  enabledKeys,
  onToggleColumn,
  onSetAllColumns,
  onResetColumns,
}: {
  visibleColumns: Record<K, boolean>;
  labels?: Record<K, string>;
  enabledKeys?: K[];
  onToggleColumn: (key: K) => void;
  onSetAllColumns: (visible: boolean) => void;
  onResetColumns: () => void;
}): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const keysToDisplay = enabledKeys || (Object.keys(labels) as K[]);
  const activeCount = keysToDisplay.filter((k) => visibleColumns[k] ?? true).length;
  const totalCount = keysToDisplay.length;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 30,
          padding: '0 10px',
          borderRadius: 6,
          backgroundColor: isOpen ? '#eef2ff' : '#ffffff',
          color: '#1f2b6f',
          border: '1px solid #c7d2fe',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>Tùy chỉnh cột ({activeCount}/{totalCount})</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 100,
            width: 250,
            backgroundColor: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #cbd5e1',
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
            <strong style={{ fontSize: 13, color: '#0f172a' }}>Ẩn / Hiện Cột</strong>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => onSetAllColumns(true)}
                style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Tất cả
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={onResetColumns}
                style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Mặc định
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {keysToDisplay.map((key) => {
              const checked = visibleColumns[key] ?? true;
              return (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: checked ? '#1e293b' : '#94a3b8',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '3px 4px',
                    borderRadius: 4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleColumn(key)}
                    style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  <span>{labels[key] || key}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function useResizableColumns<T extends Record<string, number>>(
  storageKey: string,
  defaultWidths: T,
  minWidths: Record<keyof T, number>,
) {
  const [widths, setWidths] = React.useState<T>(() => {
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

  const resizingRef = React.useRef<{
    colKey: keyof T | null;
    startX: number;
    startWidth: number;
  }>({ colKey: null, startX: 0, startWidth: 0 });

  const handleMouseDown = React.useCallback(
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

  const resetColumnWidth = React.useCallback(
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

export function resolveShipmentStatusLabel(item: ShipmentListItemDto): string {
  const deliveryNote = (item.deliveryNote ?? '').trim();
  if (
    item.currentStatus === 'SCAN_INBOUND' &&
    deliveryNote.toLowerCase().startsWith('xuống hàng kiện đến')
  ) {
    return deliveryNote;
  }

  return formatShipmentStatusLabel(item.currentStatus);
}

function normalizeShipmentCode(value: string): string {
  return value.trim().toUpperCase();
}

export function formatCurrency(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0 đ';
  }
  return `${value.toLocaleString('vi-VN')} đ`;
}

export interface ChargeableWeightInfo {
  weightText: string;
  chargeableKg: number;
  isVolumetric: boolean;
  actualKg?: number;
  volumetricKg?: number;
  formulaHint: string;
}

export function resolveChargeableWeight(item: ShipmentListItemDto): ChargeableWeightInfo {
  const meta = item.metadata as Record<string, unknown> | null | undefined;
  const pkg = (meta?.package ?? {}) as Record<string, unknown>;
  const pricing = (meta?.pricing ?? {}) as Record<string, unknown>;

  let explicitChargeable: number | undefined;
  const rawChargeable =
    meta?.chargeableWeightKg ??
    meta?.chargeableWeight ??
    pkg.chargeableWeightKg ??
    pricing.chargeableWeightKg;
  if (typeof rawChargeable === 'number' && rawChargeable > 0) {
    explicitChargeable = rawChargeable;
  } else if (typeof rawChargeable === 'string' && parseFloat(rawChargeable) > 0) {
    explicitChargeable = parseFloat(rawChargeable);
  }

  let actual: number | undefined;
  const rawActual =
    meta?.weight ??
    meta?.weightKg ??
    meta?.actualWeight ??
    meta?.parcelWeight ??
    pkg.weightKg ??
    pricing.actualWeightKg;
  if (typeof rawActual === 'number' && rawActual > 0) {
    actual = rawActual;
  } else if (typeof rawActual === 'string' && parseFloat(rawActual) > 0) {
    actual = parseFloat(rawActual);
  }

  const pkgDims = (pkg.dimensions ?? {}) as Record<string, unknown>;
  const dims = ((meta?.dimensionsCm ?? pkgDims) ?? {}) as Record<string, unknown>;
  const length = Number(meta?.length ?? dims.length ?? pkgDims.length) || 0;
  const width = Number(meta?.width ?? dims.width ?? pkgDims.width) || 0;
  const height = Number(meta?.height ?? dims.height ?? pkgDims.height) || 0;

  let volumetric: number | undefined = undefined;
  if (length > 0 && width > 0 && height > 0) {
    volumetric = Math.round(((length * width * height) / 6000) * 100) / 100;
  }

  let finalChargeable = explicitChargeable;
  let isVolumetric = false;

  if (finalChargeable === undefined) {
    if (actual !== undefined && volumetric !== undefined) {
      finalChargeable = Math.round(Math.max(actual, volumetric) * 100) / 100;
      isVolumetric = volumetric > actual;
    } else if (actual !== undefined) {
      finalChargeable = actual;
    } else if (volumetric !== undefined) {
      finalChargeable = volumetric;
      isVolumetric = true;
    }
  } else if (actual !== undefined && volumetric !== undefined) {
    isVolumetric = volumetric > actual;
  }

  if (!finalChargeable || finalChargeable <= 0) {
    const type = (item.parcelType ?? '').toUpperCase();
    if (type === 'DOCUMENT' || type.includes('THƯ') || type.includes('TÀI LIỆU')) {
      finalChargeable = 0.2;
    } else if (type === 'BULKY' || type === 'HEAVY' || type.includes('CỒNG') || type.includes('NẶNG')) {
      finalChargeable = 25.0;
      isVolumetric = true;
    } else if (type === 'FRAGILE' || type.includes('VỠ')) {
      finalChargeable = 1.5;
    } else if (type === 'HIGH_VALUE' || type === 'ELECTRONICS' || type.includes('ĐIỆN TỬ')) {
      finalChargeable = 0.8;
    } else {
      finalChargeable = 0.5;
    }
  }

  const weightText = `${finalChargeable >= 1 ? finalChargeable.toFixed(1) : finalChargeable.toFixed(2)} kg`;

  let formulaHint = `Cân tính cước: ${weightText}`;
  if (isVolumetric && volumetric && actual) {
    formulaHint = `Cân tính cước: ${weightText} (Quy đổi IATA: ${volumetric}kg > Cân thực tế: ${actual}kg)`;
  } else if (isVolumetric) {
    formulaHint = `Cân tính cước theo thể tích IATA (D×R×C/6000): ${weightText}`;
  } else if (actual) {
    formulaHint = `Cân tính cước theo trọng lượng thực tế: ${weightText}`;
  }

  return {
    weightText,
    chargeableKg: finalChargeable,
    isVolumetric,
    actualKg: actual,
    volumetricKg: volumetric,
    formulaHint,
  };
}

export function resolveParcelWeight(item: ShipmentListItemDto): string {
  return resolveChargeableWeight(item).weightText;
}

export function resolveParcelClassification(item: ShipmentListItemDto): {
  label: string;
  badgeStyle: React.CSSProperties;
} {
  const type = (item.parcelType ?? '').toUpperCase();
  if (type === 'FRAGILE' || type.includes('VỠ')) {
    return {
      label: 'DỄ VỠ',
      badgeStyle: {
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        fontSize: 10,
        fontWeight: 800,
        padding: '1px 5px',
        borderRadius: 4,
      },
    };
  }
  if (type === 'BULKY' || type === 'HEAVY' || type.includes('CỒNG') || type.includes('NẶNG')) {
    return {
      label: 'CỒNG KỀNH',
      badgeStyle: {
        backgroundColor: '#fff7ed',
        color: '#ea580c',
        border: '1px solid #fed7aa',
        fontSize: 10,
        fontWeight: 800,
        padding: '1px 5px',
        borderRadius: 4,
      },
    };
  }
  if (type === 'HIGH_VALUE' || type === 'ELECTRONICS' || type.includes('ĐIỆN TỬ') || type.includes('GIÁ TRỊ')) {
    return {
      label: 'GIÁ TRỊ CAO',
      badgeStyle: {
        backgroundColor: '#faf5ff',
        color: '#9333ea',
        border: '1px solid #e9d5ff',
        fontSize: 10,
        fontWeight: 800,
        padding: '1px 5px',
        borderRadius: 4,
      },
    };
  }
  if (type === 'DOCUMENT' || type.includes('TÀI LIỆU') || type.includes('THƯ')) {
    return {
      label: 'TÀI LIỆU',
      badgeStyle: {
        backgroundColor: '#f0fdf4',
        color: '#16a34a',
        border: '1px solid #bbf7d0',
        fontSize: 10,
        fontWeight: 800,
        padding: '1px 5px',
        borderRadius: 4,
      },
    };
  }
  return {
    label: 'TIÊU CHUẨN',
    badgeStyle: {
      backgroundColor: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0',
      fontSize: 10,
      fontWeight: 700,
      padding: '1px 5px',
      borderRadius: 4,
    },
  };
}

export function resolveServiceTag(item: ShipmentListItemDto): {
  serviceLabel: string;
  platformLabel: string;
} {
  const service = (item.serviceType ?? '').toUpperCase();
  const serviceLabel =
    service === 'EXPRESS' || service === 'NHANH'
      ? 'Hỏa tốc'
      : service === 'SAME_DAY'
      ? 'Trong ngày'
      : 'Tiêu chuẩn';

  const meta = item.metadata as Record<string, unknown> | null | undefined;
  const rawPlatform = (item.platform ?? (meta?.platform as string) ?? (meta?.source as string) ?? '').toUpperCase();
  let platformLabel = 'Web';
  if (rawPlatform.includes('SHOPEE')) platformLabel = 'Shopee';
  else if (rawPlatform.includes('TIKTOK')) platformLabel = 'TikTok';
  else if (rawPlatform.includes('LAZADA')) platformLabel = 'Lazada';
  else if (rawPlatform.includes('WALK') || rawPlatform.includes('QUẦY')) platformLabel = 'Quầy';
  else if (rawPlatform.includes('MERCHANT')) platformLabel = 'Merchant';

  return { serviceLabel, platformLabel };
}

export function resolveFeePayer(item: ShipmentListItemDto): {
  payerLabel: string;
  isReceiverPay: boolean;
} {
  const meta = item.metadata as Record<string, unknown> | null | undefined;
  const payer = String(meta?.feePayer ?? meta?.payer ?? meta?.paymentPayer ?? '').toUpperCase();
  const isReceiverPay = payer.includes('RECEIVER') || payer.includes('NGUOI_NHAN') || payer === 'CC_CASH';
  return {
    payerLabel: isReceiverPay ? 'Khách trả' : 'Shop trả',
    isReceiverPay,
  };
}

export function resolveInspectionPolicy(item: ShipmentListItemDto): string {
  const meta = item.metadata as Record<string, unknown> | null | undefined;
  const policy = String(meta?.inspectionPolicy ?? meta?.checkPolicy ?? '').toUpperCase();
  if (policy.includes('NO_CHECK') || policy.includes('KHONG_CHO_XEM')) {
    return 'Không cho xem hàng';
  }
  if (policy.includes('ALLOW_TRY') || policy.includes('CHO_THU')) {
    return 'Cho thử hàng';
  }
  return 'Xem hàng, không thử';
}

export function getOpsStatusBadgeStyle(status: string): React.CSSProperties {
  let bg = '#eff6ff';
  let color = '#1d4ed8';
  let border = '#bfdbfe';

  if (status === 'DELIVERED') {
    bg = '#ecfdf5';
    color = '#047857';
    border = '#a7f3d0';
  } else if (
    status === 'CANCELLED' ||
    status === 'DELIVERY_FAILED' ||
    status === 'EXCEPTION'
  ) {
    bg = '#fef2f2';
    color = '#b91c1c';
    border = '#fecaca';
  } else if (
    status === 'WAITING_PICKUP' ||
    status === 'CREATED' ||
    status === 'UPDATED'
  ) {
    bg = '#fffbeb';
    color = '#b45309';
    border = '#fde68a';
  } else if (status.startsWith('RETURN')) {
    bg = '#fdf4ff';
    color = '#a21caf';
    border = '#f5d0fe';
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 700,
    backgroundColor: bg,
    color: color,
    border: `1px solid ${border}`,
    whiteSpace: 'nowrap',
    lineHeight: 1.3,
  };
}

export function ShipmentsTable({
  items,
  deliveryCourierByShipment = DEFAULT_EMPTY_COURIER_MAP,
  deliveryTaskByShipment = DEFAULT_EMPTY_TASK_MAP,
  selectedShipmentCodes,
  onToggleShipment,
  onToggleAllVisible,
  pageOffset = 0,
  storageKeyPrefix = 'ops_shipments',
  defaultVisibleColumns,
  columnLabelsOverride,
  enabledColumns,
  emptyMessage,
  primaryHubResolver,
  oppositeHubResolver,
  onSelectAllFiltered,
  totalFilteredCount,
  onClearSelected,
  showSelectionStrip = false,
  renderCustomActions,
  maxHeight,
  tableShellStyle,
  containerStyle,
  onRowClick,
}: ShipmentsTableProps): React.JSX.Element {
  const selectedSet = new Set(selectedShipmentCodes);
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedSet.has(item.shipmentCode));
  const someVisibleSelected = items.some((item) => selectedSet.has(item.shipmentCode));

  const initialVisibleCols = React.useMemo(() => {
    return {
      ...DEFAULT_VISIBLE_COLUMNS,
      ...defaultVisibleColumns,
    };
  }, [defaultVisibleColumns]);

  const mergedLabels = React.useMemo(() => {
    return {
      ...OPS_COLUMN_LABELS,
      ...columnLabelsOverride,
    };
  }, [columnLabelsOverride]);

  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns(
    `${storageKeyPrefix}_col_widths_v3`,
    DEFAULT_OPS_COL_WIDTHS,
    MIN_OPS_COL_WIDTHS,
  );

  const { visibleColumns, toggleColumn, setAllColumns, resetColumns } = useColumnVisibility(
    `${storageKeyPrefix}_visible_columns_v2`,
    initialVisibleCols,
    enabledColumns,
  );

  const tableShellRef = React.useRef<HTMLDivElement>(null);
  const { copyColumn, shouldSuppressRowClick, renderToast } = useColumnSelection(
    tableShellRef,
    { labels: mergedLabels },
  );

  const renderHeaderCell = (colKey: OpsColumnKey, align?: 'left' | 'center' | 'right') => {
    return (
      <th
        key={colKey}
        data-col-key={colKey}
        style={{
          ...styles.headerCell,
          width: widths[colKey],
          minWidth: widths[colKey],
          maxWidth: widths[colKey],
          textAlign: align || 'left',
        }}
        title={`Bôi đen kéo chuột theo cột • Nhấp đúp hoặc bấm icon để sao chép cột "${mergedLabels[colKey]}"`}
        onDoubleClick={() => copyColumn(colKey, mergedLabels[colKey])}
      >
        <div className="ops-col-header-wrap">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mergedLabels[colKey]}
          </span>
          <button
            type="button"
            className="ops-col-copy-btn"
            title={`Sao chép toàn bộ cột "${mergedLabels[colKey]}" (dán được vào Excel)`}
            onClick={(e) => {
              e.stopPropagation();
              copyColumn(colKey, mergedLabels[colKey]);
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
        <span
          className="table-col-resizer"
          title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
          onMouseDown={(e) => handleMouseDown(colKey, e)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            resetColumnWidth(colKey);
          }}
        />
      </th>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minHeight: 0, ...containerStyle }}>
      {/* Optional Top Selection Strip */}
      {showSelectionStrip && selectedShipmentCodes.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, color: '#1e40af' }}>
              Đã chọn: {selectedShipmentCodes.length} vận đơn
            </span>
            {totalFilteredCount !== undefined &&
              selectedShipmentCodes.length < totalFilteredCount &&
              onSelectAllFiltered && (
                <button
                  type="button"
                  onClick={onSelectAllFiltered}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Chọn tất cả {totalFilteredCount} vận đơn trong kết quả lọc
                </button>
              )}
          </div>
          {onClearSelected && (
            <button
              type="button"
              onClick={onClearSelected}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                color: '#475569',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
              }}
            >
              Bỏ chọn
            </button>
          )}
        </div>
      )}

      {/* Top Toolbar: Custom Actions / Summary + Column Visibility Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2px 0' }}>
        <div>
          {renderCustomActions ? (
            renderCustomActions()
          ) : totalFilteredCount !== undefined ? (
            <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
              Hiển thị <strong>{totalFilteredCount}</strong> vận đơn phù hợp
            </span>
          ) : null}
        </div>
        <ColumnVisibilityPicker
          visibleColumns={visibleColumns}
          labels={mergedLabels}
          enabledKeys={enabledColumns}
          onToggleColumn={toggleColumn}
          onSetAllColumns={setAllColumns}
          onResetColumns={resetColumns}
        />
      </div>

      {/* Table Shell */}
      <div
        ref={tableShellRef}
        style={{
          ...styles.tableShell,
          ...(maxHeight ? { maxHeight, overflow: 'auto' } : {}),
          ...tableShellStyle,
        }}
        className="ops-shipments-table-shell ops-column-selectable-table"
      >
        <table style={{ ...styles.table, minWidth: 1750 }}>
          <thead>
            <tr>
              <th style={{ ...styles.headerCell, ...styles.selectCell, zIndex: 11 }}>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả vận đơn trên trang"
                  checked={allVisibleSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }
                  }}
                  onChange={(event) => onToggleAllVisible(event.target.checked)}
                />
              </th>

              {visibleColumns.stt && renderHeaderCell('stt', 'center')}
              {visibleColumns.code && renderHeaderCell('code')}
              {visibleColumns.status && renderHeaderCell('status')}
              {visibleColumns.parcelType && renderHeaderCell('parcelType')}
              {visibleColumns.chargeableWeight && renderHeaderCell('chargeableWeight')}
              {visibleColumns.primaryHub && renderHeaderCell('primaryHub')}
              {visibleColumns.oppositeHub && renderHeaderCell('oppositeHub')}
              {visibleColumns.senderName && renderHeaderCell('senderName')}
              {visibleColumns.senderPhone && renderHeaderCell('senderPhone')}
              {visibleColumns.senderAddress && renderHeaderCell('senderAddress')}
              {visibleColumns.receiverName && renderHeaderCell('receiverName')}
              {visibleColumns.receiverPhone && renderHeaderCell('receiverPhone')}
              {visibleColumns.receiverAddress && renderHeaderCell('receiverAddress')}
              {visibleColumns.cod && renderHeaderCell('cod')}
              {visibleColumns.routeHub && renderHeaderCell('routeHub')}
              {visibleColumns.ageMinutes && renderHeaderCell('ageMinutes')}
              {visibleColumns.createdAt && renderHeaderCell('createdAt')}
              {visibleColumns.deliveredAt && renderHeaderCell('deliveredAt')}
              {visibleColumns.updatedAt && renderHeaderCell('updatedAt')}
              {visibleColumns.deliveryNote && renderHeaderCell('deliveryNote')}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const checked = selectedSet.has(item.shipmentCode);
              const normalizedShipmentCode = normalizeShipmentCode(item.shipmentCode);
              const assignedCourier =
                deliveryCourierByShipment.get(normalizedShipmentCode) ?? 'Chưa bàn giao';
              const deliveryTask = deliveryTaskByShipment.get(normalizedShipmentCode) ?? null;

              const isDelivered =
                item.currentStatus === 'DELIVERED' || deliveryTask?.status === 'DELIVERED';
              const deliveredAt = isDelivered ? deliveryTask?.updatedAt || item.updatedAt : null;

              const fullSenderAddress =
                item.senderAddress ||
                buildFullAddress([item.senderWard, item.senderDistrict, item.senderProvince]) ||
                '-';

              const fullReceiverAddress =
                item.receiverAddress || item.receiverRegion || '-';
              const statusLabel = resolveShipmentStatusLabel(item);

              const chargeableWeightInfo = resolveChargeableWeight(item);
              const classification = resolveParcelClassification(item);
              const service = resolveServiceTag(item);
              const feePayer = resolveFeePayer(item);
              const inspectionPolicy = resolveInspectionPolicy(item);

              const primaryHub = primaryHubResolver
                ? primaryHubResolver(item)
                : (item.currentLocation || item.receiverHubCode || item.destinationHubCode || '---');
              const oppositeHub = oppositeHubResolver
                ? oppositeHubResolver(item)
                : (item.originHubCode || item.senderHubCode || '---');

              const age = minutesSince(item.updatedAt);
              const isOverdue = (age ?? 0) >= 360;

              return (
                <tr
                  key={item.id}
                  data-row-index={index}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'INPUT' || target.closest('input')) return;
                    if (shouldSuppressRowClick()) return;
                    onRowClick?.(item);
                  }}
                  style={{
                    ...(checked ? styles.selectedRow : undefined),
                    cursor: onRowClick ? 'pointer' : undefined,
                  }}
                >
                  <td style={{ ...styles.cell, ...styles.selectCell }}>
                    <input
                      type="checkbox"
                      aria-label={`Chọn vận đơn ${item.shipmentCode}`}
                      checked={checked}
                      onChange={(event) => onToggleShipment(item.shipmentCode, event.target.checked)}
                    />
                  </td>

                  {visibleColumns.stt && (
                    <td
                      data-col-key="stt"
                      data-row-index={index}
                      data-copy-value={String(pageOffset + index + 1)}
                      style={{ ...styles.cell, width: widths.stt, maxWidth: widths.stt, textAlign: 'center', color: '#64748b', fontSize: 12 }}
                    >
                      {pageOffset + index + 1}
                    </td>
                  )}

                  {visibleColumns.code && (
                    <td
                      data-col-key="code"
                      data-row-index={index}
                      data-copy-value={item.shipmentCode}
                      style={{
                        ...styles.shipmentCodeCell,
                        width: widths.code,
                        maxWidth: widths.code,
                      }}
                      className="ops-shipment-code-cell"
                    >
                      <span
                        className="ops-shipment-code-text"
                        title="Bôi đen kéo chuột để sao chép mã vận đơn (Ctrl+C)"
                        style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontWeight: 700,
                          color: 'var(--ops-primary, #0052cc)',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          cursor: 'text',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {item.shipmentCode}
                      </span>
                    </td>
                  )}

                  {visibleColumns.status && (
                    <td
                      data-col-key="status"
                      data-row-index={index}
                      data-copy-value={statusLabel}
                      style={{ ...styles.cell, width: widths.status, maxWidth: widths.status }}
                    >
                      <span style={getOpsStatusBadgeStyle(item.currentStatus)}>
                        {statusLabel}
                      </span>
                      {item.requiresLabelReprint ? (
                        <span
                          title="Vận đơn cần in lại tem mới"
                          style={{ ...styles.reprintBadge, marginLeft: 4 }}
                        >
                          In lại tem
                        </span>
                      ) : null}
                      {item.isOperationLocked ? (
                        <span
                          title="Đơn hàng đang bị khóa thao tác"
                          style={{ ...styles.lockBadge, marginLeft: 4 }}
                        >
                          Khóa
                        </span>
                      ) : null}
                    </td>
                  )}

                  {visibleColumns.parcelType && (
                    <td
                      data-col-key="parcelType"
                      data-row-index={index}
                      data-copy-value={classification.label}
                      style={{ ...styles.cell, width: widths.parcelType, maxWidth: widths.parcelType }}
                    >
                      <span style={classification.badgeStyle}>
                        {classification.label}
                      </span>
                    </td>
                  )}

                  {visibleColumns.chargeableWeight && (
                    <td
                      data-col-key="chargeableWeight"
                      data-row-index={index}
                      data-copy-value={chargeableWeightInfo.weightText}
                      style={{ ...styles.cell, width: widths.chargeableWeight, maxWidth: widths.chargeableWeight }}
                    >
                      <span
                        title={chargeableWeightInfo.formulaHint}
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 13,
                          color: chargeableWeightInfo.isVolumetric ? '#ea580c' : '#0f172a',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chargeableWeightInfo.weightText}
                      </span>
                      {chargeableWeightInfo.isVolumetric && (
                        <span
                          title={chargeableWeightInfo.formulaHint}
                          style={{
                            fontSize: 10,
                            color: '#ea580c',
                            fontWeight: 700,
                            marginLeft: 4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Thể tích IATA
                        </span>
                      )}
                    </td>
                  )}

                  {visibleColumns.primaryHub && (
                    <td
                      data-col-key="primaryHub"
                      data-row-index={index}
                      data-copy-value={primaryHub}
                      style={{ ...styles.cell, width: widths.primaryHub, maxWidth: widths.primaryHub }}
                    >
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        backgroundColor: '#eef2ff',
                        color: '#1e40af',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid #c7d2fe',
                        fontSize: 12,
                        display: 'inline-block',
                      }}>
                        {primaryHub}
                      </span>
                    </td>
                  )}

                  {visibleColumns.oppositeHub && (
                    <td
                      data-col-key="oppositeHub"
                      data-row-index={index}
                      data-copy-value={oppositeHub}
                      style={{ ...styles.cell, width: widths.oppositeHub, maxWidth: widths.oppositeHub }}
                    >
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        backgroundColor: '#f8fafc',
                        color: '#475569',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        display: 'inline-block',
                      }}>
                        {oppositeHub}
                      </span>
                    </td>
                  )}

                  {visibleColumns.senderName && (
                    <td
                      data-col-key="senderName"
                      data-row-index={index}
                      data-copy-value={item.senderName ?? ''}
                      style={{ ...styles.cell, width: widths.senderName, maxWidth: widths.senderName }}
                    >
                      <div
                        className="ops-cell-scrollable"
                        title={item.senderName ?? 'Không có'}
                        style={{ width: '100%', maxWidth: '100%', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {item.senderName ?? 'Không có'}
                      </div>
                    </td>
                  )}

                  {visibleColumns.senderPhone && (
                    <td
                      data-col-key="senderPhone"
                      data-row-index={index}
                      data-copy-value={item.senderPhone ?? ''}
                      style={{ ...styles.cell, width: widths.senderPhone, maxWidth: widths.senderPhone }}
                    >
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {item.senderPhone ?? '-'}
                      </span>
                    </td>
                  )}

                  {visibleColumns.senderAddress && (
                    <td
                      data-col-key="senderAddress"
                      data-row-index={index}
                      data-copy-value={fullSenderAddress}
                      style={{ ...styles.cell, width: widths.senderAddress, maxWidth: widths.senderAddress }}
                    >
                      <div
                        className="ops-cell-scrollable"
                        title={fullSenderAddress}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          fontSize: 12,
                          color: '#334155',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {fullSenderAddress}
                      </div>
                    </td>
                  )}

                  {visibleColumns.receiverName && (
                    <td
                      data-col-key="receiverName"
                      data-row-index={index}
                      data-copy-value={item.receiverName ?? ''}
                      style={{ ...styles.cell, width: widths.receiverName, maxWidth: widths.receiverName }}
                    >
                      <div
                        className="ops-cell-scrollable"
                        title={item.receiverName ?? 'Không có'}
                        style={{ width: '100%', maxWidth: '100%', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {item.receiverName ?? 'Không có'}
                      </div>
                    </td>
                  )}

                  {visibleColumns.receiverPhone && (
                    <td
                      data-col-key="receiverPhone"
                      data-row-index={index}
                      data-copy-value={item.receiverPhone ?? ''}
                      style={{ ...styles.cell, width: widths.receiverPhone, maxWidth: widths.receiverPhone }}
                    >
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {item.receiverPhone ?? '-'}
                      </span>
                    </td>
                  )}

                  {visibleColumns.receiverAddress && (
                    <td
                      data-col-key="receiverAddress"
                      data-row-index={index}
                      data-copy-value={fullReceiverAddress}
                      style={{ ...styles.cell, width: widths.receiverAddress, maxWidth: widths.receiverAddress }}
                    >
                      <div
                        className="ops-cell-scrollable"
                        title={`${fullReceiverAddress}${item.deliveryNote ? ` • ${item.deliveryNote}` : ''}`}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          fontSize: 12,
                          color: '#334155',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {fullReceiverAddress}
                      </div>
                    </td>
                  )}

                  {visibleColumns.cod && (
                    <td
                      data-col-key="cod"
                      data-row-index={index}
                      data-copy-value={item.codAmount !== undefined && item.codAmount !== null ? String(item.codAmount) : '0'}
                      style={{ ...styles.cell, width: widths.cod, maxWidth: widths.cod }}
                    >
                      <span
                        title={`Cước: ${formatCurrency(item.shippingFee)} • ${feePayer.payerLabel}`}
                        style={{ fontWeight: 700, color: item.codAmount ? '#059669' : '#64748b', whiteSpace: 'nowrap' }}
                      >
                        {formatCurrency(item.codAmount)}
                      </span>
                    </td>
                  )}

                  {visibleColumns.routeHub && (
                    <td
                      data-col-key="routeHub"
                      data-row-index={index}
                      data-copy-value={`${item.receiverHubCode ?? item.destinationHubCode ?? '-'} • ${assignedCourier}`}
                      style={{ ...styles.cell, width: widths.routeHub, maxWidth: widths.routeHub }}
                    >
                      <div
                        className="ops-cell-scrollable"
                        title={`Hub: ${item.receiverHubCode ?? item.destinationHubCode ?? '-'} | Shipper: ${assignedCourier}${deliveryTask ? ` | Task: ${formatTaskStatusLabel(deliveryTask.status)}` : ''}`}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <span>{item.receiverHubCode ?? item.destinationHubCode ?? '-'}</span>
                        <span style={{ margin: '0 4px', color: '#94a3b8' }}>•</span>
                        <span>{assignedCourier}</span>
                      </div>
                    </td>
                  )}

                  {visibleColumns.ageMinutes && (
                    <td
                      data-col-key="ageMinutes"
                      data-row-index={index}
                      data-copy-value={formatAge(age)}
                      style={{ ...styles.cell, width: widths.ageMinutes, maxWidth: widths.ageMinutes }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: isOverdue ? '#dc2626' : '#0f766e', whiteSpace: 'nowrap' }}>
                          {formatAge(age)}
                        </span>
                        {isOverdue && (
                          <span
                            title="Đơn hàng tại bưu cục quá 6 giờ chưa hoàn tất khâu kế tiếp"
                            style={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Quá 6h
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {visibleColumns.createdAt && (
                    <td
                      data-col-key="createdAt"
                      data-row-index={index}
                      data-copy-value={formatDateTime(item.createdAt)}
                      style={{ ...styles.cell, width: widths.createdAt, maxWidth: widths.createdAt }}
                    >
                      <span style={{ fontSize: 12, color: '#334155', whiteSpace: 'nowrap' }}>
                        {formatDateTime(item.createdAt)}
                      </span>
                    </td>
                  )}

                  {visibleColumns.deliveredAt && (
                    <td
                      data-col-key="deliveredAt"
                      data-row-index={index}
                      data-copy-value={deliveredAt ? formatDateTime(deliveredAt) : 'Chưa nhận'}
                      style={{ ...styles.cell, width: widths.deliveredAt, maxWidth: widths.deliveredAt }}
                    >
                      {deliveredAt ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', whiteSpace: 'nowrap' }}>
                          {formatDateTime(deliveredAt)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                          Chưa nhận
                        </span>
                      )}
                    </td>
                  )}

                  {visibleColumns.updatedAt && (
                    <td
                      data-col-key="updatedAt"
                      data-row-index={index}
                      data-copy-value={formatDateTime(item.updatedAt)}
                      style={{ ...styles.cell, width: widths.updatedAt, maxWidth: widths.updatedAt }}
                    >
                      <span style={{ fontSize: 12, color: '#334155', whiteSpace: 'nowrap' }}>
                        {formatDateTime(item.updatedAt)}
                      </span>
                    </td>
                  )}

                  {visibleColumns.deliveryNote && (
                    <td
                      data-col-key="deliveryNote"
                      data-row-index={index}
                      data-copy-value={item.deliveryNote || ''}
                      style={{ ...styles.cell, width: widths.deliveryNote, maxWidth: widths.deliveryNote }}
                    >
                      <div
                        title={item.deliveryNote || ''}
                        style={{
                          maxWidth: widths.deliveryNote - 24,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 12,
                          color: '#475569',
                        }}
                      >
                        {item.deliveryNote || (age !== null && age >= 360 ? 'Cần rà soát vì quá 6 giờ chưa có bước tiếp theo.' : '-')}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {items.length === 0 ? (
              <tr>
                <td colSpan={100} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                  {emptyMessage || 'Không có dữ liệu vận đơn phù hợp.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {renderToast()}
    </div>
  );
}

export { ShipmentsTable as UniversalShipmentsTable };

export const styles: Record<string, React.CSSProperties> = {
  tableShell: {
    marginTop: 4,
    overflow: 'auto',
    border: '1px solid #d9def3',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 1100,
  },
  headerCell: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    textAlign: 'left',
    padding: '7px 10px',
    borderBottom: '2px solid #cbd5e1',
    backgroundColor: '#f8faff',
    color: '#1f2b6f',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  cell: {
    padding: '6px 10px',
    borderBottom: '1px solid #e7ebf8',
    verticalAlign: 'middle',
    color: '#152052',
    fontSize: 13,
    whiteSpace: 'nowrap',
    userSelect: 'text',
    WebkitUserSelect: 'text',
    height: 38,
  },
  shipmentCodeCell: {
    padding: '6px 10px',
    borderBottom: '1px solid #e7ebf8',
    verticalAlign: 'middle',
    color: '#152052',
    fontSize: 13,
    userSelect: 'text',
    WebkitUserSelect: 'text',
    whiteSpace: 'nowrap',
    cursor: 'text',
    height: 38,
  },
  selectCell: {
    width: 44,
    textAlign: 'center',
    padding: '6px 8px',
    verticalAlign: 'middle',
  },
  selectedRow: {
    backgroundColor: '#f3f7ff',
  },
  shipmentCodeLink: {
    color: 'var(--ops-primary-dark)',
    fontWeight: 800,
    textDecoration: 'none',
  },
  statusText: {
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  reprintBadge: {
    display: 'inline-block',
    color: '#b42318',
    backgroundColor: '#fef3f2',
    border: '1px solid #fee4e2',
    padding: '1px 5px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  lockBadge: {
    display: 'inline-block',
    color: '#9a3412',
    backgroundColor: '#fff7ed',
    border: '1px solid #ffedd5',
    padding: '1px 5px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  platformBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: 3,
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    textTransform: 'uppercase',
  },
  serviceTag: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 4px',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
  },
  feeSubline: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    whiteSpace: 'nowrap',
  },
  addressSubline: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inspectionTag: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    padding: '0 4px',
    borderRadius: 3,
  },
};
