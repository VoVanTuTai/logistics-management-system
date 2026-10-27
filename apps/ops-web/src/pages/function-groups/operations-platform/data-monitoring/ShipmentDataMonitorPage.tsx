import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useHubScope } from '../../../../hooks/useHubScope';
import { isShipmentInHubScope } from '../../../../utils/hubScopeResolver';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { formatDateTime } from '../../../../utils/format';
import { ShipmentsTable, minutesSince, resolveParcelWeight } from '../../../shipments/ShipmentsTable';

import './OperationalDataMonitorPage.css';

const INBOUND_EXPECTED_SET = new Set(['IN_TRANSIT', 'LINEHAUL_DISPATCHED', 'MANIFEST_SEALED', 'DISPATCHED_TO_HUB', 'DISPATCHED']);
const INBOUND_ARRIVED_SET = new Set(['SCAN_INBOUND', 'MANIFEST_RECEIVED', 'INVENTORY_CHECK']);
const INBOUND_DELIVERY_SET = new Set(['TASK_ASSIGNED', 'DELIVERY_DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED']);

type ShipmentMonitorMode = 'arrival' | 'outbound' | 'delivery';

interface ShipmentDataMonitorPageProps {
  mode: ShipmentMonitorMode;
}

interface ShipmentMonitorConfig {
  groupCode: string;
  title: string;
  description: string;
  statusQuery?: string;
  defaultStatuses: string[];
  keywordLabel: string;
  hubLabel: string;
  oppositeHubLabel: string;
  ownerLabel: string;
  senderFilterLabel?: string;
  receiverFilterLabel?: string;
  emptyText: string;
  summaryLabels: {
    total: string;
    secondary: string;
    warning: string;
  };
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;
const DATA_LIMIT = 200;

export type InboundFlowTab =
  | 'ALL'
  | 'EXPECTED'
  | 'ARRIVED'
  | 'DELIVERING'
  | 'MISSED_INBOUND'
  | 'MISSED_DISPATCH';

export type InboundAlertFilter =
  | 'ALL'
  | 'STALE_6H'
  | 'REPRINT_REQUIRED'
  | 'BULKY'
  | 'FRAGILE';

const configs: Record<ShipmentMonitorMode, ShipmentMonitorConfig> = {
  arrival: {
    groupCode: 'MONITOR_DATA_HANG_DEN',
    title: 'Giám sát hàng đến',
    description:
      'Đối soát toàn trình hàng sắp đến từ Hub tổng, hàng đã quét nhập kho và kiểm soát quét sót/phát sót đơn hàng.',
    defaultStatuses: [
      'IN_TRANSIT',
      'LINEHAUL_DISPATCHED',
      'MANIFEST_SEALED',
      'DISPATCHED_TO_HUB',
      'DISPATCHED',
      'SCAN_INBOUND',
      'MANIFEST_RECEIVED',
      'INVENTORY_CHECK',
      'TASK_ASSIGNED',
      'DELIVERY_DISPATCHED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ],
    keywordLabel: 'Mã vận đơn / người gửi / người nhận',
    hubLabel: 'BC đến',
    oppositeHubLabel: 'Hub gửi',
    ownerLabel: 'Người quét/xử lý',
    emptyText: 'Chưa có đơn hàng luồng đến phù hợp bộ lọc hiện tại.',
    summaryLabels: {
      total: 'Hàng đến',
      secondary: 'Hub gửi khác',
      warning: 'Quá 6 giờ',
    },
  },
  outbound: {
    groupCode: 'MONITOR_DATA_HANG_GUI',
    title: 'Giám sát hàng gửi',
    description:
      'Theo dõi hàng nhân viên Ops hoặc courier đã nhận để chuẩn bị gửi đi cho khách hàng.',
    defaultStatuses: [
      'PICKUP_COMPLETED',
      'MANIFEST_RECEIVED',
      'MANIFEST_UNSEALED',
      'SCAN_INBOUND',
      'INVENTORY_CHECK',
    ],
    keywordLabel: 'Mã vận đơn / người gửi / người nhận / hub đích',
    hubLabel: 'BC gửi',
    oppositeHubLabel: 'BC đích',
    ownerLabel: 'Người gửi',
    emptyText: 'Chưa có dữ liệu hàng gửi phù hợp bộ lọc.',
    summaryLabels: {
      total: 'Đã nhận gửi',
      secondary: 'Hub đích',
      warning: 'Chờ gửi quá 6 giờ',
    },
  },
  delivery: {
    groupCode: 'MONITOR_DATA_HANG_PHAT',
    title: 'Giám sát hàng phát',
    description: 'Theo dõi các đơn đã giao và hỗ trợ rà soát lại theo bên gửi, bên nhận.',
    statusQuery: 'DELIVERED',
    defaultStatuses: ['DELIVERED'],
    keywordLabel: 'Mã vận đơn / bên gửi / bên nhận / số điện thoại',
    hubLabel: 'BC phát',
    oppositeHubLabel: 'BC gửi',
    ownerLabel: 'Bên nhận',
    senderFilterLabel: 'Bên gửi',
    receiverFilterLabel: 'Bên nhận',
    emptyText: 'Không tìm thấy dữ liệu hàng phát phù hợp bộ lọc.',
    summaryLabels: {
      total: 'Đã giao',
      secondary: 'Bên gửi',
      warning: 'Bên nhận',
    },
  },
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolvePrimaryHub(shipment: ShipmentListItemDto, mode: ShipmentMonitorMode): string {
  if (mode === 'outbound') {
    return (
      normalizeCode(shipment.currentLocation) ||
      normalizeCode(shipment.originHubCode) ||
      normalizeCode(shipment.senderHubCode) ||
      '---'
    );
  }

  if (mode === 'delivery') {
    return (
      normalizeCode(shipment.destinationHubCode) ||
      normalizeCode(shipment.receiverHubCode) ||
      normalizeCode(shipment.currentLocation) ||
      '---'
    );
  }

  // Arrival mode: Destination Hub / Receiving Branch
  return (
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.currentLocation) ||
    '---'
  );
}

function resolveOppositeHub(shipment: ShipmentListItemDto, mode: ShipmentMonitorMode): string {
  if (mode === 'outbound') {
    return (
      normalizeCode(shipment.destinationHubCode) ||
      normalizeCode(shipment.receiverHubCode) ||
      '---'
    );
  }

  if (mode === 'delivery') {
    return (
      normalizeCode(shipment.originHubCode) ||
      normalizeCode(shipment.senderHubCode) ||
      '---'
    );
  }

  // Arrival mode: Origin Hub / Sending Hub
  return (
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    '---'
  );
}

function hasKnownDifferentHub(left: string, right: string): boolean {
  return left !== '---' && right !== '---' && left !== right;
}

function isArrivalFromAnotherHub(shipment: ShipmentListItemDto): boolean {
  const arrivalHub = resolvePrimaryHub(shipment, 'arrival');
  const senderHub = resolveOppositeHub(shipment, 'arrival');

  return hasKnownDifferentHub(arrivalHub, senderHub);
}

function matchesPartyFilter(shipment: ShipmentListItemDto, senderFilter: string, receiverFilter: string): boolean {
  const normalizedSender = normalize(senderFilter);
  const normalizedReceiver = normalize(receiverFilter);
  const senderValues = [
    shipment.senderName,
    shipment.senderPhone,
    shipment.senderAddress,
    shipment.senderWard,
    shipment.senderDistrict,
    shipment.senderProvince,
    shipment.senderHubCode,
    shipment.originHubCode,
  ];
  const receiverValues = [
    shipment.receiverName,
    shipment.receiverPhone,
    shipment.receiverAddress,
    shipment.receiverRegion,
    shipment.receiverHubCode,
    shipment.destinationHubCode,
  ];

  const senderMatched =
    !normalizedSender || senderValues.some((value) => normalize(value).includes(normalizedSender));
  const receiverMatched =
    !normalizedReceiver || receiverValues.some((value) => normalize(value).includes(normalizedReceiver));

  return senderMatched && receiverMatched;
}

function countUnique(values: string[]): number {
  return new Set(values.map(normalize).filter(Boolean)).size;
}

export function ShipmentDataMonitorPage({
  mode,
}: ShipmentDataMonitorPageProps): React.JSX.Element {
  const config = configs[mode];
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const scopedHubCodes = session?.user.hubCodes ?? [];
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const hubScope = useHubScope();

  const [shipments, setShipments] = useState<ShipmentListItemDto[]>([]);
  const [keyword, setKeyword] = useState('');
  const [hubFilter, setHubFilter] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [receiverFilter, setReceiverFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alertFilter, setAlertFilter] = useState<InboundAlertFilter>('ALL');
  const [flowTab, setFlowTab] = useState<InboundFlowTab>('ALL');
  const [inspectingShipment, setInspectingShipment] = useState<ShipmentListItemDto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Checkbox selection state
  const [selectedShipmentCodes, setSelectedShipmentCodes] = useState<string[]>([]);

  const effectiveHubCodes = useMemo(() => {
    return hubScope.scopedHubCodes.length > 0 ? hubScope.scopedHubCodes : scopedHubCodes;
  }, [hubScope.scopedHubCodes, scopedHubCodes]);

  const isAllSystem = canViewAllHubAreas || hubScope.isAllSystem;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const handleCopyMissedCodes = useCallback(() => {
    const missedCodes = shipments
      .filter((s) => (isAllSystem ? true : isShipmentInHubScope(s, effectiveHubCodes)))
      .filter(isArrivalFromAnotherHub)
      .filter((s) => INBOUND_EXPECTED_SET.has(s.currentStatus))
      .map((s) => s.shipmentCode);

    if (missedCodes.length === 0) {
      showToast('Không có mã đơn quét sót nào!');
      return;
    }

    navigator.clipboard.writeText(missedCodes.join('\n'));
    showToast(`Đã sao chép ${missedCodes.length} mã đơn quét sót vào Clipboard!`);
  }, [effectiveHubCodes, isAllSystem, shipments, showToast]);

  const handleFastScanInbound = useCallback(async (targetCodes: string[]) => {
    if (targetCodes.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 vận đơn để quét nhận.');
      return;
    }

    const codeSet = new Set(targetCodes);
    setShipments((prev) =>
      prev.map((s) => {
        if (codeSet.has(s.shipmentCode)) {
          return {
            ...s,
            currentStatus: 'SCAN_INBOUND',
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      }),
    );

    if (inspectingShipment && codeSet.has(inspectingShipment.shipmentCode)) {
      setInspectingShipment((prev) =>
        prev
          ? {
              ...prev,
              currentStatus: 'SCAN_INBOUND',
              updatedAt: new Date().toISOString(),
            }
          : null,
      );
    }

    setSelectedShipmentCodes((prev) => prev.filter((c) => !codeSet.has(c)));
    showToast(`Đã quét SCAN_INBOUND thành công cho ${targetCodes.length} vận đơn!`);
  }, [inspectingShipment, showToast]);

  const handleCreateDiscrepancyMemo = useCallback((shipment: ShipmentListItemDto) => {
    const memo = `[BIÊN BẢN ĐỐI SOÁT HỤT HÀNG TRUNG CHUYỂN]
Mã vận đơn: ${shipment.shipmentCode}
Hub gửi: ${resolveOppositeHub(shipment, 'arrival')}
Hub đích (Thụ hưởng): ${resolvePrimaryHub(shipment, 'arrival')}
Trạng thái bảng kê: Đã xuất bến nhưng thực tế dỡ hàng KHÔNG TÌM THẤY KIỆN.
Thời điểm kiểm kê: ${new Date().toLocaleString('vi-VN')}
Người lập biên bản: ${session?.user.displayName || session?.user.username || 'Điều hành viên'} (${session?.user.username || 'OPS'})
Kiến nghị: Yêu cầu Hub gửi và Tài xế xe tải kiểm tra kho bãi/thùng xe trong vòng 24h.`;

    navigator.clipboard.writeText(memo);
    showToast(`Đã sao chép Biên bản hụt hàng cho đơn ${shipment.shipmentCode}!`);
  }, [session?.user.displayName, session?.user.username, showToast]);

  const handlePrintThermalLabel = useCallback((shipment: ShipmentListItemDto) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Tem vận đơn - ${shipment.shipmentCode}</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 13px; line-height: 1.4; }
            .label-box { border: 2px solid #000; padding: 16px; max-width: 380px; }
            .title { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 12px; }
            .barcode { font-size: 24px; font-weight: 800; text-align: center; letter-spacing: 2px; margin: 10px 0; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="title">NEXUS EXPRESS</div>
            <div class="barcode">*${shipment.shipmentCode}*</div>
            <div class="divider"></div>
            <div><strong>Người gửi:</strong> ${shipment.senderName || '---'} - ${shipment.senderPhone || ''}</div>
            <div><strong>Người nhận:</strong> ${shipment.receiverName || '---'} - ${shipment.receiverPhone || ''}</div>
            <div><strong>Địa chỉ giao:</strong> ${shipment.receiverAddress || '---'}</div>
            <div class="divider"></div>
            <div><strong>COD:</strong> ${(shipment.codAmount ?? 0).toLocaleString('vi-VN')} đ</div>
            <div><strong>Cước:</strong> ${(shipment.shippingFee ?? 0).toLocaleString('vi-VN')} đ</div>
            <div><strong>Loại hàng:</strong> ${shipment.parcelType || 'GENERAL'}</div>
            <div><strong>Trọng lượng:</strong> ${resolveParcelWeight(shipment)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setShipments([]);
      setErrorMessage('Bạn cần đăng nhập để tải dữ liệu giám sát.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await shipmentsClient.list(accessToken, {
        status: mode === 'arrival' ? undefined : config.statusQuery,
        limit: DATA_LIMIT,
        offset: 0,
      });
      setShipments(result);
    } catch (error) {
      setShipments([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, config.statusQuery, mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [alertFilter, dateFrom, dateTo, flowTab, hubFilter, keyword, mode, pageSize, receiverFilter, senderFilter, statusFilter]);

  // Inbound statistics calculation across all shipments reaching this hub
  const inboundStats = useMemo(() => {
    if (mode !== 'arrival') {
      return { total: 0, expected: 0, arrived: 0, missedInbound: 0, delivering: 0, missedDispatch: 0 };
    }

    const baseInbound = shipments
      .filter((s) => (isAllSystem ? true : isShipmentInHubScope(s, effectiveHubCodes)))
      .filter(isArrivalFromAnotherHub);

    let expected = 0;
    let arrived = 0;
    let delivering = 0;
    let missedDispatch = 0;

    for (const s of baseInbound) {
      if (INBOUND_EXPECTED_SET.has(s.currentStatus)) expected++;
      if (INBOUND_ARRIVED_SET.has(s.currentStatus)) {
        arrived++;
        if ((minutesSince(s.updatedAt) ?? 0) >= 360) missedDispatch++;
      }
      if (INBOUND_DELIVERY_SET.has(s.currentStatus)) delivering++;
    }

    return {
      total: baseInbound.length,
      expected,
      arrived,
      missedInbound: expected,
      delivering,
      missedDispatch,
    };
  }, [effectiveHubCodes, isAllSystem, mode, shipments]);

  const sourceRows = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    return shipments
      .filter((shipment) => {
        if (mode === 'arrival') {
          if (flowTab === 'EXPECTED') return INBOUND_EXPECTED_SET.has(shipment.currentStatus);
          if (flowTab === 'ARRIVED') return INBOUND_ARRIVED_SET.has(shipment.currentStatus);
          if (flowTab === 'DELIVERING') return INBOUND_DELIVERY_SET.has(shipment.currentStatus);
          if (flowTab === 'MISSED_INBOUND') return INBOUND_EXPECTED_SET.has(shipment.currentStatus);
          if (flowTab === 'MISSED_DISPATCH') {
            return INBOUND_ARRIVED_SET.has(shipment.currentStatus) && (minutesSince(shipment.updatedAt) ?? 0) >= 360;
          }
          // 'ALL': include all default arrival pipeline statuses
          return config.defaultStatuses.includes(shipment.currentStatus);
        }
        return config.defaultStatuses.includes(shipment.currentStatus);
      })
      .filter((shipment) => {
        if (mode === 'arrival') {
          if (alertFilter === 'STALE_6H' && (minutesSince(shipment.updatedAt) ?? 0) < 360) return false;
          if (alertFilter === 'REPRINT_REQUIRED' && !shipment.requiresLabelReprint) return false;
          if (alertFilter === 'BULKY' && shipment.parcelType !== 'BULKY') return false;
          if (alertFilter === 'FRAGILE' && shipment.parcelType !== 'FRAGILE') return false;
        }
        return true;
      })
      .filter((shipment) => (mode === 'arrival' ? isArrivalFromAnotherHub(shipment) : true))
      .filter((shipment) => {
        // Nếu nhập mã tra cứu cụ thể -> hiển thị dù ở bất kỳ Hub nào
        if (normalizedKeyword) {
          return true;
        }
        // Nếu là HQ toàn quốc -> hiển thị tất cả
        if (isAllSystem) {
          return true;
        }
        // Mặc định lọc theo phạm vi Hub quản lý
        return isShipmentInHubScope(shipment, effectiveHubCodes);
      });
  }, [alertFilter, config.defaultStatuses, effectiveHubCodes, flowTab, isAllSystem, keyword, mode, shipments]);

  const statusOptions = useMemo(
    () => Array.from(new Set(sourceRows.map((shipment) => shipment.currentStatus))).sort(),
    [sourceRows],
  );

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalize(keyword);
    const normalizedHub = normalizeCode(hubFilter);

    return sourceRows.filter((shipment) => {
      const primaryHub = resolvePrimaryHub(shipment, mode);
      const oppositeHub = resolveOppositeHub(shipment, mode);
      const updatedDate = toDateKey(shipment.updatedAt);
      const keywordMatched =
        !normalizedKeyword ||
        [
          shipment.shipmentCode,
          shipment.senderName,
          shipment.senderPhone,
          shipment.receiverName,
          shipment.receiverPhone,
          shipment.currentLocation,
          primaryHub,
          oppositeHub,
          shipment.deliveryNote,
        ].some((value) => normalize(value).includes(normalizedKeyword));

      return (
        keywordMatched &&
        (!normalizedHub || primaryHub.includes(normalizedHub) || oppositeHub.includes(normalizedHub)) &&
        matchesPartyFilter(shipment, mode === 'delivery' ? senderFilter : '', mode === 'delivery' ? receiverFilter : '') &&
        (!statusFilter || shipment.currentStatus === statusFilter) &&
        (!dateFrom || !updatedDate || updatedDate >= dateFrom) &&
        (!dateTo || !updatedDate || updatedDate <= dateTo)
      );
    });
  }, [dateFrom, dateTo, hubFilter, keyword, mode, receiverFilter, senderFilter, sourceRows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const warningRows = filteredRows.filter((shipment) => (minutesSince(shipment.updatedAt) ?? 0) >= 360);
  const secondaryCount =
    mode === 'delivery'
      ? countUnique(filteredRows.map((shipment) => shipment.senderPhone || shipment.senderName || ''))
      : new Set(filteredRows.map((shipment) => resolvePrimaryHub(shipment, mode)).filter((hub) => hub !== '---')).size;
  const warningCount =
    mode === 'delivery'
      ? countUnique(filteredRows.map((shipment) => shipment.receiverPhone || shipment.receiverName || ''))
      : warningRows.length;

  const handleToggleShipment = useCallback((code: string, checked: boolean) => {
    setSelectedShipmentCodes((prev) =>
      checked ? Array.from(new Set([...prev, code])) : prev.filter((item) => item !== code),
    );
  }, []);

  const handleToggleAllVisible = useCallback((checked: boolean) => {
    const visibleCodes = pagedRows.map((item) => item.shipmentCode);
    if (checked) {
      setSelectedShipmentCodes((prev) => Array.from(new Set([...prev, ...visibleCodes])));
    } else {
      setSelectedShipmentCodes((prev) => prev.filter((code) => !visibleCodes.includes(code)));
    }
  }, [pagedRows]);

  const handleSelectAllFiltered = useCallback(() => {
    setSelectedShipmentCodes(filteredRows.map((item) => item.shipmentCode));
  }, [filteredRows]);

  const handleClearSelected = useCallback(() => {
    setSelectedShipmentCodes([]);
  }, []);

  const totalInboundExpected = inboundStats.expected + inboundStats.arrived;
  const inboundCompletionPercent = totalInboundExpected > 0 ? Math.round((inboundStats.arrived / totalInboundExpected) * 100) : 100;

  return (
    <section className="ops-data-monitor">
      <header className="ops-data-monitor__header">
        <div>
          <small>{config.groupCode}</small>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>

        {mode === 'arrival' ? (
          <div className="ops-data-monitor__summary" aria-label="Thống kê đối soát hàng đến">
            <article className="ops-data-monitor__summary-card" title="Số lượng đơn hàng trên bảng kê các chuyến xe từ Hub gửi về bưu cục (Cái neo gốc)">
              <span>Kế hoạch xe về</span>
              <strong>{totalInboundExpected}</strong>
            </article>
            <article className="ops-data-monitor__summary-card" title="Số lượng đơn hàng đã quét SCAN_INBOUND nhận kho thực tế">
              <span>Đã quét nhận</span>
              <strong style={{ color: '#16a34a' }}>{inboundStats.arrived} ({inboundCompletionPercent}%)</strong>
            </article>
            <article
              className={`ops-data-monitor__summary-card ${inboundStats.missedInbound > 0 ? 'ops-data-monitor__summary-card--danger' : ''}`}
              title="CẢNH BÁO: Đơn hàng có trên bảng kê xe đến nhưng kho chưa quét SCAN_INBOUND"
            >
              <span>Quét sót</span>
              <strong>{inboundStats.missedInbound}</strong>
            </article>
          </div>
        ) : (
          <div className="ops-data-monitor__summary" aria-label="Thống kê nhanh">
            <article className="ops-data-monitor__summary-card">
              <span>{config.summaryLabels.total}</span>
              <strong>{filteredRows.length}</strong>
            </article>
            <article className="ops-data-monitor__summary-card">
              <span>{config.summaryLabels.secondary}</span>
              <strong>{secondaryCount}</strong>
            </article>
            <article className={warningCount > 0 && mode !== 'delivery' ? 'ops-data-monitor__summary-card ops-data-monitor__summary-card--warning' : 'ops-data-monitor__summary-card'}>
              <span>{config.summaryLabels.warning}</span>
              <strong>{warningCount}</strong>
            </article>
          </div>
        )}
      </header>

      {/* STREAMLINED INBOUND RECONCILIATION PIPELINE STRIP */}
      {mode === 'arrival' && (
        <div className="ops-inbound-reconcile-bar" role="tablist" aria-label="Đối soát luồng hàng đến">
          <button
            type="button"
            role="tab"
            aria-selected={flowTab === 'ALL'}
            className={`ops-inbound-pill ${flowTab === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setFlowTab('ALL')}
          >
            <span>Tất cả luồng</span>
            <span className="ops-inbound-pill__badge">{inboundStats.total}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={flowTab === 'EXPECTED'}
            className={`ops-inbound-pill ${flowTab === 'EXPECTED' ? 'is-active' : ''}`}
            onClick={() => setFlowTab('EXPECTED')}
            title="1. Hàng đang trên xe tải trung chuyển từ Hub gửi về bưu cục (Cái neo đối soát gốc)"
          >
            <span>1. Kế hoạch đến (Neo)</span>
            <span className="ops-inbound-pill__badge">{inboundStats.expected}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={flowTab === 'ARRIVED'}
            className={`ops-inbound-pill ${flowTab === 'ARRIVED' ? 'is-active' : ''}`}
            onClick={() => setFlowTab('ARRIVED')}
            title="2. Đơn hàng đã dỡ xuống và quét SCAN_INBOUND nhập kho thực tế"
          >
            <span>2. Đã nhận kho</span>
            <span className="ops-inbound-pill__badge">{inboundStats.arrived} ({inboundCompletionPercent}%)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={flowTab === 'MISSED_INBOUND'}
            className={`ops-inbound-pill ops-inbound-pill--danger ${flowTab === 'MISSED_INBOUND' ? 'is-active' : ''}`}
            onClick={() => setFlowTab('MISSED_INBOUND')}
            title="3. CẢNH BÁO QUÉT SÓT: Đơn có trên bảng kê xe đến nhưng kho chưa quét SCAN_INBOUND"
          >
            <span>3. Quét sót</span>
            <span className="ops-inbound-pill__badge">{inboundStats.missedInbound}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={flowTab === 'DELIVERING'}
            className={`ops-inbound-pill ${flowTab === 'DELIVERING' ? 'is-active' : ''}`}
            onClick={() => setFlowTab('DELIVERING')}
            title="4. Đơn hàng đã chia tuyến cho Shipper hoặc đang đi phát"
          >
            <span>4. Đang/Đã phát</span>
            <span className="ops-inbound-pill__badge">{inboundStats.delivering}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={flowTab === 'MISSED_DISPATCH'}
            className={`ops-inbound-pill ops-inbound-pill--amber ${flowTab === 'MISSED_DISPATCH' ? 'is-active' : ''}`}
            onClick={() => setFlowTab('MISSED_DISPATCH')}
            title="5. CẢNH BÁO PHÁT SÓT: Đơn đã quét Inbound lưu kho quá 6 giờ chưa gán bưu tá đi phát"
          >
            <span>5. Phát sót (&gt;6h)</span>
            <span className="ops-inbound-pill__badge">{inboundStats.missedDispatch}</span>
          </button>
        </div>
      )}

      {/* QUICK OPERATIONAL ALERT & ACTION STRIP */}
      {mode === 'arrival' && flowTab === 'MISSED_INBOUND' && (
        <div className="ops-inbound-quick-strip ops-inbound-quick-strip--danger">
          <span>
            <strong>CẢNH BÁO QUÉT SÓT ({inboundStats.missedInbound} đơn):</strong> Các đơn này có trên bảng kê xe trung chuyển nhưng bưu cục chưa bắn mã SCAN_INBOUND. Cần rà soát thùng xe trước khi ký bàn giao!
          </span>
          <div className="ops-inbound-quick-strip__actions">
            <button
              type="button"
              className="ops-inbound-quick-strip__btn ops-inbound-quick-strip__btn--secondary"
              onClick={handleCopyMissedCodes}
              title="Sao chép toàn bộ mã đơn sót để gửi tài xế hoặc Hub tổng đối soát"
            >
              Sao chép DS mã đơn sót
            </button>
            {selectedShipmentCodes.length > 0 && (
              <button
                type="button"
                className="ops-inbound-quick-strip__btn ops-inbound-quick-strip__btn--primary"
                onClick={() => handleFastScanInbound(selectedShipmentCodes)}
              >
                Quét nhận nhanh ({selectedShipmentCodes.length} đơn đã chọn)
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'arrival' && flowTab === 'MISSED_DISPATCH' && (
        <div className="ops-inbound-quick-strip ops-inbound-quick-strip--amber">
          <span>
            <strong>CẢNH BÁO PHÁT SÓT ({inboundStats.missedDispatch} đơn):</strong> Đơn đã quét SCAN_INBOUND lưu kho quá 6 giờ (&ge; 360 phút) chưa bàn giao bưu tá đi phát.
          </span>
          <div className="ops-inbound-quick-strip__actions">
            <button
              type="button"
              className="ops-inbound-quick-strip__btn ops-inbound-quick-strip__btn--primary"
              onClick={() => {
                window.location.href = '/app/function-groups/branch-business/delivery-dispatch';
              }}
            >
              Bàn giao phát bưu tá ngay
            </button>
          </div>
        </div>
      )}

      {scopedHubCodes.length > 0 ? (
        <p className="ops-data-monitor__scope">
          Tài khoản đang giới hạn dữ liệu theo bưu cục: {scopedHubCodes.join(', ')}.
        </p>
      ) : null}

      <section className="ops-data-monitor__toolbar">
        <label>
          <span>Từ ngày cập nhật</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>Đến ngày cập nhật</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label>
          <span>{config.hubLabel}</span>
          <input
            type="text"
            value={hubFilter}
            onChange={(event) => setHubFilter(event.target.value)}
            placeholder="Nhập mã hub..."
          />
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatShipmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        {mode === 'arrival' && (
          <label>
            <span>Kiểm soát cảnh báo</span>
            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value as InboundAlertFilter)}
            >
              <option value="ALL">Tất cả cảnh báo</option>
              <option value="STALE_6H">Quá 6 giờ (Nguy cơ trễ)</option>
              <option value="REPRINT_REQUIRED">Cần in lại tem</option>
              <option value="BULKY">Hàng cồng kềnh (IATA)</option>
              <option value="FRAGILE">Hàng dễ vỡ</option>
            </select>
          </label>
        )}
        {mode === 'delivery' ? (
          <>
            <label>
              <span>{config.senderFilterLabel}</span>
              <input
                type="search"
                value={senderFilter}
                onChange={(event) => setSenderFilter(event.target.value)}
                placeholder="Tên, SĐT hoặc hub gửi..."
              />
            </label>
            <label>
              <span>{config.receiverFilterLabel}</span>
              <input
                type="search"
                value={receiverFilter}
                onChange={(event) => setReceiverFilter(event.target.value)}
                placeholder="Tên, SĐT hoặc khu vực nhận..."
              />
            </label>
          </>
        ) : null}
        <label>
          <span>{config.keywordLabel}</span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Nhập từ khóa..."
          />
        </label>
        <div className="ops-data-monitor__actions">
          <button type="button" onClick={fetchData} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setHubFilter('');
              setSenderFilter('');
              setReceiverFilter('');
              setAlertFilter('ALL');
              setFlowTab('ALL');
              setKeyword('');
            }}
          >
            Xóa lọc
          </button>
        </div>
      </section>

      {errorMessage ? <p className="ops-data-monitor__error">{errorMessage}</p> : null}

      {/* Unified Table Card ("Nằm gọn trong một thẻ") */}
      <article className="ops-data-monitor__table-card">
        {isLoading && <div className="ops-data-monitor__loading">Đang tải dữ liệu...</div>}
        <ShipmentsTable
          items={pagedRows}
          pageOffset={(currentPage - 1) * pageSize}
          selectedShipmentCodes={selectedShipmentCodes}
          onToggleShipment={handleToggleShipment}
          onToggleAllVisible={handleToggleAllVisible}
          storageKeyPrefix={`ops_monitor_${mode}`}
          enabledColumns={[
            'stt',
            'code',
            'status',
            'parcelType',
            'chargeableWeight',
            'primaryHub',
            'oppositeHub',
            'senderName',
            'senderPhone',
            'receiverName',
            'receiverPhone',
            'receiverAddress',
            'cod',
            'ageMinutes',
            'updatedAt',
            'deliveryNote',
          ]}
          defaultVisibleColumns={{
            stt: true,
            code: true,
            status: true,
            parcelType: true,
            chargeableWeight: true,
            primaryHub: true,
            oppositeHub: true,
            senderName: true,
            senderPhone: true,
            senderAddress: false,
            receiverName: true,
            receiverPhone: true,
            receiverAddress: true,
            cod: true,
            routeHub: false,
            ageMinutes: true,
            createdAt: false,
            deliveredAt: false,
            updatedAt: true,
            deliveryNote: true,
          }}
          columnLabelsOverride={{
            primaryHub: `${config.hubLabel} (Hub nhận)`,
            oppositeHub: `${config.oppositeHubLabel} (Hub gửi)`,
            senderName: 'Bên gửi',
            receiverName: 'Bên nhận',
            receiverAddress: 'Địa chỉ giao & Đồng kiểm',
          }}
          primaryHubResolver={(s) => resolvePrimaryHub(s, mode)}
          oppositeHubResolver={(s) => resolveOppositeHub(s, mode)}
          emptyMessage={config.emptyText}
          showSelectionStrip={true}
          totalFilteredCount={filteredRows.length}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearSelected={handleClearSelected}
          onRowClick={(item) => setInspectingShipment(item)}
          containerStyle={{ flex: 1, minHeight: 0 }}
          tableShellStyle={{ flex: 1, minHeight: 0, marginTop: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}
        />

        {/* Standard Pagination Footer Docked at Bottom of Card */}
        <footer className="ops-data-monitor__pagination">
          <span>
            Hiển thị {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(filteredRows.length, currentPage * pageSize)} / {filteredRows.length} dòng
          </span>
          <label>
            <span>Số dòng/trang</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} dòng
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Trước
            </button>
            <strong>
              Trang {currentPage} / {totalPages}
            </strong>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Sau
            </button>
          </div>
        </footer>
      </article>

      {/* SLIDE-OVER SHIPMENT INSPECTION & ACTION DRAWER */}
      {inspectingShipment && (
        <div className="ops-shipment-drawer-backdrop" onClick={() => setInspectingShipment(null)}>
          <div className="ops-shipment-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ops-shipment-drawer__header">
              <div>
                <div className="ops-shipment-drawer__code">
                  <span>{inspectingShipment.shipmentCode}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inspectingShipment.shipmentCode);
                      showToast(`Đã sao chép mã ${inspectingShipment.shipmentCode}`);
                    }}
                    title="Sao chép mã vận đơn"
                    style={{
                      background: 'transparent',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#475569',
                    }}
                  >
                    Sao chép
                  </button>
                </div>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {INBOUND_EXPECTED_SET.has(inspectingShipment.currentStatus) ? (
                    <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      CẢNH BÁO QUÉT SÓT KHO
                    </span>
                  ) : INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) && (minutesSince(inspectingShipment.updatedAt) ?? 0) >= 360 ? (
                    <span style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      CẢNH BÁO TỒN KHO PHÁT SÓT (&gt;6H)
                    </span>
                  ) : INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) ? (
                    <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      ĐÃ SCAN NHẬP KHO
                    </span>
                  ) : INBOUND_DELIVERY_SET.has(inspectingShipment.currentStatus) ? (
                    <span style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      ĐANG GIAO BƯU TÁ
                    </span>
                  ) : (
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      HÀNG SẮP ĐẾN (TRÊN XE)
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Trạng thái: <strong>{formatShipmentStatusLabel(inspectingShipment.currentStatus)}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="ops-shipment-drawer__close-btn"
                onClick={() => setInspectingShipment(null)}
                title="Đóng chi tiết"
              >
                &times;
              </button>
            </div>

            <div className="ops-shipment-drawer__body">
              {/* Card 1: Đối soát luồng hàng đến & Chuyến xe */}
              <div className="ops-shipment-drawer__card">
                <h4 className="ops-shipment-drawer__card-title">
                  <span>Đối soát luồng hàng đến &amp; Vết quét</span>
                </h4>
                <div className="ops-shipment-drawer__grid">
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Bưu cục nhận (Thụ hưởng)</span>
                    <span className="ops-shipment-drawer__item-value ops-shipment-drawer__item-value--mono" style={{ color: '#1e40af' }}>
                      {resolvePrimaryHub(inspectingShipment, mode)}
                    </span>
                  </div>
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Hub gửi (Gốc)</span>
                    <span className="ops-shipment-drawer__item-value ops-shipment-drawer__item-value--mono" style={{ color: '#475569' }}>
                      {resolveOppositeHub(inspectingShipment, mode)}
                    </span>
                  </div>
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Chuyến xe / Bảng kê trung chuyển</span>
                    <span className="ops-shipment-drawer__item-value ops-shipment-drawer__item-value--mono">
                      {inspectingShipment.deliveryNote || 'CHUYEN-TRUC-LIEN-HUB'}
                    </span>
                  </div>
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Cập nhật lần cuối</span>
                    <span className="ops-shipment-drawer__item-value">
                      {formatDateTime(inspectingShipment.updatedAt)}
                    </span>
                  </div>
                </div>
                <div style={{
                  marginTop: '4px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: INBOUND_EXPECTED_SET.has(inspectingShipment.currentStatus) ? '#fef2f2' : INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${INBOUND_EXPECTED_SET.has(inspectingShipment.currentStatus) ? '#fecaca' : INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) ? '#bbf7d0' : '#e2e8f0'}`,
                  color: INBOUND_EXPECTED_SET.has(inspectingShipment.currentStatus) ? '#991b1b' : INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) ? '#166534' : '#334155'
                }}>
                  {INBOUND_EXPECTED_SET.has(inspectingShipment.currentStatus)
                    ? 'Chú ý: Đơn hàng nằm trong danh sách bảng kê xe đến nhưng kho chưa bắn mã SCAN_INBOUND. Cần rà soát đáy xe hoặc lập biên bản hụt hàng với tài xế.'
                    : INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus)
                    ? `Kiện hàng đã được quét SCAN_INBOUND lưu kho an toàn lúc ${formatDateTime(inspectingShipment.updatedAt)} (${minutesSince(inspectingShipment.updatedAt)} phút trước).`
                    : 'Kiện hàng đang trong chu trình luân chuyển.'}
                </div>
              </div>

              {/* Card 2: Thông số kiện hàng & Phân loại Carrier */}
              <div className="ops-shipment-drawer__card">
                <h4 className="ops-shipment-drawer__card-title">
                  <span>Quy chuẩn Kiện hàng &amp; Cước phí (Carrier SOP)</span>
                </h4>
                <div className="ops-shipment-drawer__grid">
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Phân loại mặt hàng</span>
                    <span className="ops-shipment-drawer__item-value">
                      {inspectingShipment.parcelType || 'Hàng thông thường'}
                    </span>
                  </div>
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Trọng lượng tính cước (IATA)</span>
                    <span className="ops-shipment-drawer__item-value ops-shipment-drawer__item-value--mono" style={{ color: '#ea580c' }}>
                      {resolveParcelWeight(inspectingShipment)}
                    </span>
                  </div>
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Tiền thu hộ COD</span>
                    <span className="ops-shipment-drawer__item-value" style={{ color: '#047857' }}>
                      {(inspectingShipment.codAmount ?? 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="ops-shipment-drawer__item">
                    <span className="ops-shipment-drawer__item-label">Cước vận chuyển</span>
                    <span className="ops-shipment-drawer__item-value">
                      {(inspectingShipment.shippingFee ?? 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Thông tin Giao nhận */}
              <div className="ops-shipment-drawer__card">
                <h4 className="ops-shipment-drawer__card-title">
                  <span>Thông tin Giao nhận</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Bên gửi: </span>
                    <strong>{inspectingShipment.senderName || '---'}</strong>
                    <span style={{ fontFamily: 'monospace', color: '#475569', marginLeft: '6px' }}>({inspectingShipment.senderPhone || '-'})</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Bên nhận: </span>
                    <strong>{inspectingShipment.receiverName || '---'}</strong>
                    <span style={{ fontFamily: 'monospace', color: '#475569', marginLeft: '6px' }}>({inspectingShipment.receiverPhone || '-'})</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Địa chỉ phát hàng: </span>
                    <span>{inspectingShipment.receiverAddress || 'Chưa có địa chỉ chi tiết'}</span>
                  </div>
                  {inspectingShipment.deliveryNote && (
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Ghi chú giao hàng: </span>
                      <span style={{ color: '#0284c7' }}>{inspectingShipment.deliveryNote}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Lịch sử chuỗi vết quét (Chain of Custody) */}
              <div className="ops-shipment-drawer__card">
                <h4 className="ops-shipment-drawer__card-title">
                  <span>Lịch sử Vết quét Chuỗi hành trình (Chain of Custody)</span>
                </h4>
                <div className="ops-shipment-drawer__timeline">
                  <div className="ops-shipment-drawer__timeline-item">
                    <span className="ops-shipment-drawer__timeline-dot" style={{ background: '#16a34a' }} />
                    <div>
                      <strong>Tạo đơn bưu gửi &amp; Tiếp nhận</strong>
                      <div style={{ color: '#64748b', fontSize: '11.5px' }}>{formatDateTime(inspectingShipment.createdAt)} tại {resolveOppositeHub(inspectingShipment, mode)}</div>
                    </div>
                  </div>
                  <div className="ops-shipment-drawer__timeline-item">
                    <span className="ops-shipment-drawer__timeline-dot" style={{ background: '#0284c7' }} />
                    <div>
                      <strong>Xuất xe trung chuyển đường trục (Linehaul)</strong>
                      <div style={{ color: '#64748b', fontSize: '11.5px' }}>Đóng niêm phong seal xe tải hướng về {resolvePrimaryHub(inspectingShipment, mode)}</div>
                    </div>
                  </div>
                  <div className="ops-shipment-drawer__timeline-item">
                    <span className="ops-shipment-drawer__timeline-dot" style={{ background: INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) ? '#16a34a' : '#ea580c' }} />
                    <div>
                      <strong>{INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) ? 'Đã Scan Inbound nhập kho đích' : 'Đang chờ dỡ hàng & Scan Inbound'}</strong>
                      <div style={{ color: '#64748b', fontSize: '11.5px' }}>{formatDateTime(inspectingShipment.updatedAt)} tại {resolvePrimaryHub(inspectingShipment, mode)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Action Buttons Footer */}
            <div className="ops-shipment-drawer__footer">
              <button
                type="button"
                className="ops-shipment-drawer__btn--secondary"
                onClick={() => handlePrintThermalLabel(inspectingShipment)}
              >
                In tem nhiệt
              </button>

              {INBOUND_EXPECTED_SET.has(inspectingShipment.currentStatus) ? (
                <>
                  <button
                    type="button"
                    className="ops-shipment-drawer__btn--danger"
                    onClick={() => handleCreateDiscrepancyMemo(inspectingShipment)}
                  >
                    Lập biên bản hụt xe
                  </button>
                  <button
                    type="button"
                    className="ops-shipment-drawer__btn--primary"
                    onClick={() => handleFastScanInbound([inspectingShipment.shipmentCode])}
                  >
                    Xác nhận Quét Inbound ngay
                  </button>
                </>
              ) : INBOUND_ARRIVED_SET.has(inspectingShipment.currentStatus) ? (
                <button
                  type="button"
                  className="ops-shipment-drawer__btn--primary"
                  onClick={() => {
                    window.location.href = '/app/function-groups/branch-business/delivery-dispatch';
                  }}
                >
                  Bàn giao phát bưu tá
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOAST */}
      {toastMessage && (
        <div className="ops-action-toast" role="status">
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
