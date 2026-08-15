import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ndrClient } from '../../../../features/ndr/ndr.client';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import { returnClient } from '../../../../features/returns/return.client';
import type { ReturnCaseDto } from '../../../../features/returns/return.types';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { openReturnShippingLabelPrint } from '../../../../printing/returnShippingLabelPrint';
import { useAuthStore } from '../../../../store/authStore';
import { formatNdrStatusLabel, formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { canAccessOpsFeature, resolveOpsActor } from '../../../../features/permissions/opsPermissions';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';

import '../data-monitoring/OperationalDataMonitorPage.css';
import './ReturnBlockManagementPage.css';

type ReturnOrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RetryStage = 'RETRY_DAY_1' | 'RETRY_DAY_2' | 'FAST_TRACK_APPROVED' | 'MAX_RETRY_REACHED' | 'COMPLETED';

export interface ReturnOrder {
  id: string;
  sourceType: 'RETURN' | 'NDR' | 'SHIPMENT';
  originalCode: string;
  originalShipmentId?: string;
  ndrId?: string;
  returnCaseId?: string;
  returnCaseStatus?: ReturnCaseDto['status'];
  newCode: string;
  status: ReturnOrderStatus;
  sourceStatus: string;
  reason: string;
  createdAt: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  returnHubCode: string;
  returnZoneCode: string;
  itemDescription: string;
  parcelNote: string;
  // Sale fast-track & redelivery retry cycle fields
  retryStage: RetryStage;
  retryAttempt: number;
  maxRetryLimit: number;
  assignedCourierName?: string;
  assignedCourierPhone?: string;
  nextRetryDate?: string;
  isFastTrackApproved: boolean;
  fastTrackApprovedBy?: string;
  fastTrackReason?: string;
}

const statusLabels: Record<ReturnOrderStatus, string> = {
  PENDING: 'Chờ xử lý',
  APPROVED: 'Sẵn sàng in tem',
  REJECTED: 'Đã đóng',
};

const retryStageLabels: Record<RetryStage, { label: string; classModifier: string; icon: string }> = {
  RETRY_DAY_1: {
    label: 'Đang phát lại Ngày 1/2',
    classModifier: 'retry-day1',
    icon: 'hourglass_top',
  },
  RETRY_DAY_2: {
    label: 'Đang phát lại Ngày 2/2',
    classModifier: 'retry-day2',
    icon: 'hourglass_bottom',
  },
  FAST_TRACK_APPROVED: {
    label: '⚡ Đã duyệt hoàn gấp (Mùa Sale)',
    classModifier: 'fast-track',
    icon: 'bolt',
  },
  MAX_RETRY_REACHED: {
    label: 'Hết 2 ngày phát lại -> Chuyển hoàn',
    classModifier: 'max-retry',
    icon: 'check_circle',
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    classModifier: 'completed',
    icon: 'task_alt',
  },
};

const FAST_TRACK_PRESET_REASONS = [
  'Mùa Sale cao điểm - Tồn kho bưu cục quá tải >85% sức chứa',
  'Khách hàng từ chối nhận dứt điểm / Không có nhu cầu hẹn lại',
  'Shop / Người gửi yêu cầu thu hồi đơn khẩn cấp',
  'Hàng hóa có nguy cơ hư hại / Giảm phẩm chất nếu tiếp tục lưu kho',
];

const RETURN_RELATED_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
]);
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không tải được dữ liệu chuyển hoàn.';
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '---';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
}

function resolveReturnStatus(
  returnCase: ReturnCaseDto | undefined,
  shipment: ShipmentListItemDto | undefined,
  ndr: NdrCaseListItemDto | undefined,
  isFastTrack: boolean,
): ReturnOrderStatus {
  if (returnCase?.status === 'COMPLETED') {
    return 'REJECTED';
  }

  if (isFastTrack) {
    return 'APPROVED';
  }

  if (returnCase?.status === 'STARTED') {
    return 'APPROVED';
  }

  if (shipment?.currentStatus === 'RETURN_COMPLETED') {
    return 'REJECTED';
  }

  if (shipment?.currentStatus === 'RETURN_STARTED') {
    return 'APPROVED';
  }

  if (ndr?.status === 'RETURNING' || ndr?.status === 'RESOLVED') {
    return 'APPROVED';
  }

  if (ndr?.status === 'CLOSED') {
    return 'REJECTED';
  }

  return 'PENDING';
}

function resolveRetryStage(
  returnCase: ReturnCaseDto | undefined,
  shipment: ShipmentListItemDto | undefined,
  ndr: NdrCaseListItemDto | undefined,
  noteText: string,
): {
  retryStage: RetryStage;
  retryAttempt: number;
  isFastTrackApproved: boolean;
  fastTrackApprovedBy?: string;
  fastTrackReason?: string;
} {
  const isFastTrack =
    noteText.includes('[FAST_TRACK_SALE_APPROVED]') ||
    noteText.includes('Duyệt chuyển hoàn gấp') ||
    noteText.includes('FAST_TRACK');

  if (isFastTrack) {
    const byMatch = noteText.match(/Người duyệt:\s*([^|]+)/);
    const reasonMatch = noteText.match(/\[FAST_TRACK_SALE_APPROVED\]\s*([^|]+)/);
    return {
      retryStage: 'FAST_TRACK_APPROVED',
      retryAttempt: 0,
      isFastTrackApproved: true,
      fastTrackApprovedBy: byMatch ? byMatch[1].trim() : 'HQ / OPS Vùng',
      fastTrackReason: reasonMatch ? reasonMatch[1].trim() : 'Giải phóng kho mùa Sale',
    };
  }

  if (returnCase?.status === 'COMPLETED' || shipment?.currentStatus === 'RETURN_COMPLETED') {
    return {
      retryStage: 'COMPLETED',
      retryAttempt: 2,
      isFastTrackApproved: false,
    };
  }

  if (returnCase?.status === 'STARTED' || shipment?.currentStatus === 'RETURN_STARTED' || ndr?.status === 'RETURNING') {
    return {
      retryStage: 'MAX_RETRY_REACHED',
      retryAttempt: 2,
      isFastTrackApproved: false,
    };
  }

  // Pending cycle determination: check date/attempt
  const createdAtTime = new Date(ndr?.createdAt || shipment?.createdAt || Date.now()).getTime();
  const hoursSinceCreation = (Date.now() - createdAtTime) / (1000 * 60 * 60);

  if (hoursSinceCreation > 24) {
    return {
      retryStage: 'RETRY_DAY_2',
      retryAttempt: 2,
      isFastTrackApproved: false,
    };
  }

  return {
    retryStage: 'RETRY_DAY_1',
    retryAttempt: 1,
    isFastTrackApproved: false,
  };
}

function buildReturnInstruction(order: ReturnOrder): string {
  return [
    'Đây là tem chuyển hoàn, không thu tiền người nhận.',
    `Lý do hoàn: ${order.reason}`,
    order.isFastTrackApproved ? `[HQ/OPS DUYỆT GẤP MÙA SALE: ${order.fastTrackReason || 'Giải phóng kho'}]` : '',
    `Đối soát theo mã gốc ${order.originalCode}.`,
  ].filter(Boolean).join('\n');
}

function buildCompleteReturnNote(
  order: ReturnOrder,
  session: ReturnType<typeof useAuthStore.getState>['session'],
): string {
  const employeeName = session?.user.displayName || session?.user.username || 'N/A';
  const employeeId = session?.user.username || 'N/A';
  const hubCode = session?.user.hubCodes?.[0] || order.returnHubCode || 'N/A';

  return [
    'Thao tác: Xác nhận hoàn tất chuyển hoàn',
    `Mã vận đơn gốc: ${order.originalCode}`,
    `Mã đơn hoàn: ${order.newCode}`,
    `Return case: ${order.returnCaseId ?? 'N/A'}`,
    order.isFastTrackApproved ? `(Đơn duyệt hoàn sớm mùa Sale bởi ${order.fastTrackApprovedBy})` : '',
    `Người xác nhận: ${employeeName}`,
    `Mã nhân viên: ${employeeId}`,
    `Hub thao tác: ${hubCode}`,
    `Thời gian xác nhận: ${new Date().toLocaleString('vi-VN')}`,
    `Ghi chú: ${order.reason}`,
  ].filter(Boolean).join('\n');
}

function buildReturnOrder(
  shipmentCode: string,
  returnCase: ReturnCaseDto | undefined,
  shipment: ShipmentListItemDto | undefined,
  ndr: NdrCaseListItemDto | undefined,
): ReturnOrder {
  const originalStatusLabel = shipment
    ? formatShipmentStatusLabel(shipment.currentStatus)
    : returnCase
      ? returnCase.status === 'COMPLETED'
        ? 'Return completed'
        : 'Return started'
    : ndr
      ? formatNdrStatusLabel(ndr.status)
      : 'Cần xử lý';

  const rawNote =
    returnCase?.note ||
    ndr?.note ||
    ndr?.reasonCode ||
    shipment?.deliveryNote ||
    'Yêu cầu chuyển hoàn từ luồng giao thất bại.';

  const retryInfo = resolveRetryStage(returnCase, shipment, ndr, rawNote);
  const status = resolveReturnStatus(returnCase, shipment, ndr, retryInfo.isFastTrackApproved);

  return {
    id: returnCase?.id ?? ndr?.id ?? shipment?.id ?? shipmentCode,
    sourceType: returnCase ? 'RETURN' : ndr ? 'NDR' : 'SHIPMENT',
    originalCode: shipmentCode,
    originalShipmentId: shipment?.id,
    ndrId: returnCase?.ndrCaseId ?? ndr?.id,
    returnCaseId: returnCase?.id,
    returnCaseStatus: returnCase?.status,
    newCode: `${shipmentCode}-R`,
    status,
    sourceStatus: originalStatusLabel,
    reason: rawNote,
    createdAt: formatDateTime(returnCase?.updatedAt ?? ndr?.updatedAt ?? shipment?.updatedAt),
    senderName: shipment?.receiverName || 'Người nhận gốc',
    senderPhone: shipment?.receiverPhone || '---',
    senderAddress: shipment?.receiverAddress || 'Địa chỉ nhận gốc chưa có dữ liệu',
    receiverName: shipment?.senderName || 'Người gửi gốc',
    receiverPhone: shipment?.senderPhone || '---',
    receiverAddress: shipment?.senderAddress || 'Địa chỉ gửi gốc chưa có dữ liệu',
    returnHubCode:
      shipment?.originHubCode ||
      shipment?.senderHubCode ||
      shipment?.currentLocation ||
      shipment?.destinationHubCode ||
      '---',
    returnZoneCode: shipment?.senderDistrict || shipment?.senderProvince || 'RETURN',
    itemDescription: shipment?.parcelType || shipment?.serviceType || 'Hàng chuyển hoàn',
    parcelNote: shipment?.deliveryNote || `Nguồn chuyển hoàn: ${originalStatusLabel}`,
    retryStage: retryInfo.retryStage,
    retryAttempt: retryInfo.retryAttempt,
    maxRetryLimit: 2,
    assignedCourierName: 'Nguyễn Văn A (Courier Tuyến)',
    assignedCourierPhone: '0901234567',
    nextRetryDate: retryInfo.retryStage === 'RETRY_DAY_1' ? 'Ngày mai (Ca 08:30)' : 'Trong ngày (Ca 14:00)',
    isFastTrackApproved: retryInfo.isFastTrackApproved,
    fastTrackApprovedBy: retryInfo.fastTrackApprovedBy,
    fastTrackReason: retryInfo.fastTrackReason,
  };
}

function buildReturnOrders(
  shipments: ShipmentListItemDto[],
  ndrCases: NdrCaseListItemDto[],
  returnCases: ReturnCaseDto[],
): ReturnOrder[] {
  const shipmentsByCode = new Map(shipments.map((shipment) => [shipment.shipmentCode, shipment]));
  const ndrByCode = new Map(ndrCases.map((ndr) => [ndr.shipmentCode, ndr]));
  const returnByCode = new Map(returnCases.map((returnCase) => [returnCase.shipmentCode, returnCase]));

  const candidateCodes = new Set<string>();
  returnCases.forEach((returnCase) => candidateCodes.add(returnCase.shipmentCode));
  ndrCases.forEach((ndr) => candidateCodes.add(ndr.shipmentCode));
  shipments
    .filter((shipment) => RETURN_RELATED_STATUSES.has(shipment.currentStatus))
    .forEach((shipment) => candidateCodes.add(shipment.shipmentCode));

  return Array.from(candidateCodes)
    .map((shipmentCode) =>
      buildReturnOrder(
        shipmentCode,
        returnByCode.get(shipmentCode),
        shipmentsByCode.get(shipmentCode),
        ndrByCode.get(shipmentCode),
      ),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ReturnBlockManagementPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  const canFastTrack = canAccessOpsFeature(session?.user, 'action.fast-track-return');
  const actor = resolveOpsActor(session?.user.username, session?.user.roles);

  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnOrderStatus | ''>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [orders, setOrders] = useState<ReturnOrder[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completingReturnId, setCompletingReturnId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fast-track Modal state
  const [selectedFastTrackOrder, setSelectedFastTrackOrder] = useState<ReturnOrder | null>(null);
  const [fastTrackReasonPreset, setFastTrackReasonPreset] = useState<string>(FAST_TRACK_PRESET_REASONS[0]);
  const [fastTrackCustomNote, setFastTrackCustomNote] = useState<string>('');
  const [isSubmittingFastTrack, setIsSubmittingFastTrack] = useState<boolean>(false);

  const fetchReturnOrders = useCallback(async () => {
    if (!accessToken) {
      setOrders([]);
      setErrorMessage('Bạn cần đăng nhập để tải danh sách chuyển hoàn.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [returnsResult, ndrResult, shipmentsResult] = await Promise.allSettled([
      returnClient.list(accessToken),
      ndrClient.list(accessToken),
      shipmentsClient.list(accessToken, {
        limit: 200,
        offset: 0,
      }),
    ]);

    const returnCases = returnsResult.status === 'fulfilled' ? returnsResult.value : [];
    const ndrCases = ndrResult.status === 'fulfilled' ? ndrResult.value : [];
    const shipments =
      shipmentsResult.status === 'fulfilled' ? shipmentsResult.value : [];

    if (
      returnsResult.status === 'rejected' &&
      ndrResult.status === 'rejected' &&
      shipmentsResult.status === 'rejected'
    ) {
      setOrders([]);
      setErrorMessage(extractErrorMessage(returnsResult.reason));
    } else {
      setOrders(buildReturnOrders(shipments, ndrCases, returnCases));
      const failedResult =
        returnsResult.status === 'rejected'
          ? returnsResult
          : ndrResult.status === 'rejected'
            ? ndrResult
            : shipmentsResult.status === 'rejected'
              ? shipmentsResult
              : null;
      setErrorMessage(
        failedResult ? `Một phần dữ liệu chưa tải được: ${extractErrorMessage(failedResult.reason)}` : null,
      );
    }

    setIsLoading(false);
  }, [accessToken]);

  useEffect(() => {
    fetchReturnOrders();
  }, [fetchReturnOrders]);

  const filteredOrders = useMemo(() => {
    const query = normalizeSearch(searchCode);

    return orders.filter((order) => {
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesStage = stageFilter ? order.retryStage === stageFilter : true;
      const matchesSearch = query
        ? [order.originalCode, order.newCode, order.reason, order.returnHubCode, order.sourceStatus]
            .some((value) => value.toLowerCase().includes(query))
        : true;

      return matchesStatus && matchesStage && matchesSearch;
    });
  }, [orders, searchCode, statusFilter, stageFilter]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, searchCode, statusFilter, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrintLabel = (order: ReturnOrder) => {
    const didOpen = openReturnShippingLabelPrint({
      brandName: 'NEXUS Express',
      serviceName: 'Chuyển hoàn',
      shipmentCode: order.newCode,
      originalShipmentCode: order.originalCode,
      senderName: order.senderName,
      senderPhone: order.senderPhone,
      senderAddress: order.senderAddress,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      receiverAddress: order.receiverAddress,
      hubCode: order.returnHubCode,
      zoneCode: order.returnZoneCode,
      itemDescription: order.itemDescription,
      parcelNote: order.parcelNote,
      qrValue: order.newCode,
      routeTag: 'RETURN',
      sortCode: `${order.returnHubCode}\n${order.returnZoneCode}`,
      codAmountText: '0 VND',
      createdAtText: order.createdAt,
      deliveryInstruction: buildReturnInstruction(order),
      hotlineText: 'NEXUS Express - Tem chuyển hoàn nội bộ | Hotline: 1900 1000',
    });

    setNotice(
      didOpen
        ? `Đã mở cửa sổ in tem chuyển hoàn ${order.newCode}.`
        : 'Trình duyệt đang chặn popup in. Hãy cho phép popup rồi bấm In tem lại.',
    );
  };

  const handleCompleteReturn = async (order: ReturnOrder) => {
    if (!accessToken || !order.returnCaseId) {
      return;
    }

    setCompletingReturnId(order.returnCaseId);
    setErrorMessage(null);

    try {
      await returnClient.complete(accessToken, order.returnCaseId, {
        note: buildCompleteReturnNote(order, session),
      });
      setNotice(`Đã hoàn tất return case ${order.returnCaseId}.`);
      await fetchReturnOrders();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setCompletingReturnId(null);
    }
  };

  const handleConfirmFastTrack = async () => {
    if (!selectedFastTrackOrder || !accessToken) return;

    setIsSubmittingFastTrack(true);
    setErrorMessage(null);

    try {
      const approverName = session?.user.displayName || session?.user.username || 'HQ Ops Master';
      const approverRole = actor === 'HQ_OPS' ? 'HQ MASTER' : 'OPS KHU VỰC';
      const reasonDetail = fastTrackCustomNote.trim()
        ? `${fastTrackReasonPreset} - ${fastTrackCustomNote.trim()}`
        : fastTrackReasonPreset;

      const fastTrackNote = `[FAST_TRACK_SALE_APPROVED] ${reasonDetail} | Người duyệt: ${approverName} (${approverRole}) | Thời gian: ${new Date().toLocaleString('vi-VN')}`;

      if (selectedFastTrackOrder.ndrId) {
        await ndrClient.returnDecision(accessToken, selectedFastTrackOrder.ndrId, {
          returnToSender: true,
          note: fastTrackNote,
        });
      } else {
        await returnClient.create(accessToken, {
          shipmentCode: selectedFastTrackOrder.originalCode,
          note: fastTrackNote,
        });
      }

      setNotice(
        `⚡ ĐÃ DUYỆT CHUYỂN HOÀN GẤP MÙA SALE cho vận đơn ${selectedFastTrackOrder.originalCode}. Đã giải phóng kho và hủy lịch phát lại của bưu tá.`,
      );
      setSelectedFastTrackOrder(null);
      setFastTrackCustomNote('');
      await fetchReturnOrders();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSubmittingFastTrack(false);
    }
  };

  const fastTrackCount = orders.filter((o) => o.isFastTrackApproved).length;
  const retryCycleCount = orders.filter((o) => o.retryStage === 'RETRY_DAY_1' || o.retryStage === 'RETRY_DAY_2').length;

  return (
    <section className="ops-return-list">
      {/* 1. HERO BANNER */}
      <section className="ops-return-list__hero">
        <div>
          <small>Operations platform • Hệ thống Quản trị Chuyển hoàn</small>
          <h2>Quản lý chuyển hoàn & Kiểm soát tồn kho</h2>
          <p>
            Quy trình phát lại mặc định <strong>2 ngày liên tiếp (1 lần/ngày)</strong> vào App Courier quen tuyến.
            {canFastTrack ? (
              <span style={{ color: '#6366f1', fontWeight: 700, marginLeft: '4px' }}>
                ⭐ Bạn có thẩm quyền <strong>HQ/OPS Khu Vực</strong> để duyệt chuyển hoàn ngay lập tức, giải phóng mặt bằng bưu cục trong mùa Sale.
              </span>
            ) : (
              <span style={{ color: '#64748b', marginLeft: '4px' }}>
                (Tài khoản Bưu cục thực hiện theo đúng chu kỳ phát lại 2 ngày của bưu tá).
              </span>
            )}
          </p>
        </div>
        <div className="ops-return-list__hero-stats" aria-label="Thống kê chuyển hoàn">
          <span>
            <strong>{orders.length}</strong>
            Tổng hồ sơ
          </span>
          <span style={{ borderColor: '#fef08a', background: '#fefce8' }}>
            <strong style={{ color: '#ca8a04' }}>{retryCycleCount}</strong>
            Đang phát lại (1-2 ngày)
          </span>
          <span style={{ borderColor: '#e9d5ff', background: '#faf5ff' }}>
            <strong style={{ color: '#9333ea' }}>{fastTrackCount}</strong>
            ⚡ Duyệt gấp (Mùa Sale)
          </span>
          <span style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            <strong style={{ color: '#16a34a' }}>
              {orders.filter((order) => order.status === 'APPROVED').length}
            </strong>
            Sẵn sàng in tem
          </span>
        </div>
      </section>

      {/* 2. FILTER CONTROLS */}
      <section className="ops-return-list__panel">
        <header className="ops-return-list__panel-header">
          <h3>Tra cứu danh sách chuyển hoàn & Tiến độ phát lại</h3>
          <span>{isLoading ? 'Đang tải...' : 'Dữ liệu thời gian thực'}</span>
        </header>
        <div className="ops-return-list__panel-body">
          <div className="ops-return-list__filters">
            <label className="ops-return-list__field">
              <span>Mã đơn gốc / Mã đơn hoàn / Bưu cục</span>
              <input
                type="text"
                placeholder="Nhập mã đơn, hub..."
                value={searchCode}
                onChange={(event) => setSearchCode(event.target.value)}
              />
            </label>
            <label className="ops-return-list__field">
              <span>Chu kỳ phát lại & Tồn kho</span>
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
              >
                <option value="">Tất cả chu kỳ</option>
                <option value="RETRY_DAY_1">⏳ Đang phát lại Ngày 1/2</option>
                <option value="RETRY_DAY_2">⏳ Đang phát lại Ngày 2/2</option>
                <option value="FAST_TRACK_APPROVED">⚡ Đã duyệt hoàn gấp (HQ/Vùng)</option>
                <option value="MAX_RETRY_REACHED">Hết 2 ngày phát lại ➔ Chuyển hoàn</option>
                <option value="COMPLETED">Đã hoàn tất chuyển hoàn</option>
              </select>
            </label>
            <label className="ops-return-list__field">
              <span>Trạng thái xử lý tem</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ReturnOrderStatus | '')}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý / Đang phát lại</option>
                <option value="APPROVED">Sẵn sàng in tem</option>
                <option value="REJECTED">Đã đóng</option>
              </select>
            </label>
            <div className="ops-return-list__actions">
              <button type="button" className="ops-return-list__search-btn" onClick={fetchReturnOrders}>
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </button>
              <button
                type="button"
                className="ops-return-list__reset-btn"
                onClick={() => {
                  setSearchCode('');
                  setStatusFilter('');
                  setStageFilter('');
                  setNotice(null);
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>
          {notice ? <p className="ops-return-list__notice">{notice}</p> : null}
          {errorMessage ? <p className="ops-return-list__error">{errorMessage}</p> : null}
        </div>
      </section>

      {/* 3. TABLE DATA */}
      <section className="ops-return-list__panel">
        <header className="ops-return-list__panel-header">
          <h3>Danh sách yêu cầu chuyển hoàn ({filteredOrders.length} đơn)</h3>
          <span>
            {canFastTrack ? 'Đặc quyền HQ/OPS Vùng khả dụng' : 'Chế độ bưu cục cơ sở'}
          </span>
        </header>
        <div className="ops-return-list__table-wrap">
          <table className="ops-return-list__table">
            <thead>
              <tr>
                <th>Mã đơn gốc</th>
                <th>Mã tem hoàn</th>
                <th>Chu kỳ phát lại & Tồn kho</th>
                <th>Bưu tá phụ trách</th>
                <th>Tuyến hoàn</th>
                <th>Lý do & Nguồn</th>
                <th>Cập nhật</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map((order) => {
                const stageInfo = retryStageLabels[order.retryStage];
                const isPendingOrRetrying = order.status === 'PENDING' || order.retryStage === 'RETRY_DAY_1' || order.retryStage === 'RETRY_DAY_2';

                return (
                  <tr key={`${order.sourceType}-${order.id}`}>
                    <td>
                      {order.originalShipmentId ? (
                        <CopyableShipmentCode
                          code={order.originalCode}
                          className="ops-return-list__mono"
                        />
                      ) : (
                        <span className="ops-return-list__mono">{order.originalCode}</span>
                      )}
                    </td>
                    <td>
                      <strong className="ops-return-list__code">{order.newCode}</strong>
                    </td>
                    <td>
                      <div className="ops-return-list__stage-cell">
                        <span className={`ops-return-list__stage-badge ops-return-list__stage-badge--${stageInfo.classModifier}`}>
                          {stageInfo.label}
                        </span>
                        {order.isFastTrackApproved && order.fastTrackApprovedBy ? (
                          <small style={{ color: '#7e22ce', fontSize: '11px', fontWeight: 600 }}>
                            Duyệt bởi: {order.fastTrackApprovedBy}
                          </small>
                        ) : isPendingOrRetrying ? (
                          <small style={{ color: '#64748b', fontSize: '11px' }}>
                            Phát lại: {order.nextRetryDate}
                          </small>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="ops-return-list__courier-cell">
                        <strong>{order.assignedCourierName || 'Courier Tuyến'}</strong>
                        <span>{order.assignedCourierPhone || '---'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ops-return-list__route-cell">
                        <strong>{order.returnHubCode}</strong>
                        <span>{order.returnZoneCode}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '220px', fontSize: '12px' }}>
                        <div style={{ color: '#0f172a', fontWeight: 600, marginBottom: '2px' }}>
                          {order.reason}
                        </div>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>{order.sourceStatus}</span>
                      </div>
                    </td>
                    <td>{order.createdAt}</td>
                    <td>
                      <span
                        className={`ops-return-list__status ops-return-list__status--${order.status.toLowerCase()}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {order.status === 'APPROVED' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePrintLabel(order)}
                              className="ops-return-list__print-btn"
                            >
                              In tem
                            </button>
                            {order.returnCaseId && order.returnCaseStatus === 'STARTED' ? (
                              <button
                                type="button"
                                onClick={() => void handleCompleteReturn(order)}
                                className="ops-return-list__reset-btn"
                                disabled={completingReturnId === order.returnCaseId}
                              >
                                {completingReturnId === order.returnCaseId ? 'Đang hoàn tất...' : 'Hoàn tất'}
                              </button>
                            ) : null}
                          </>
                        ) : null}

                        {/* Special HQ / Regional Ops Fast Track Button */}
                        {canFastTrack && isPendingOrRetrying && !order.isFastTrackApproved ? (
                          <button
                            type="button"
                            onClick={() => setSelectedFastTrackOrder(order)}
                            className="ops-return-list__fast-track-btn"
                            title="Duyệt chuyển hoàn ngay lập tức để giải phóng kho mùa Sale"
                          >
                            ⚡ Duyệt Hoàn Ngay
                          </button>
                        ) : null}

                        {!canFastTrack && isPendingOrRetrying ? (
                          <span className="ops-return-list__disabled-text">
                            Đang theo dõi chu kỳ 2 ngày
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="ops-return-list__empty">
                      Không có yêu cầu chuyển hoàn phù hợp bộ lọc.
                    </div>
                  </td>
                </tr>
              ) : null}
              {isLoading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="ops-return-list__empty">Đang tải danh sách chuyển hoàn...</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer className="ops-data-monitor__pagination">
          <span>
            Hiển thị {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredOrders.length, currentPage * pageSize)} / {filteredOrders.length} dòng
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
              Trước
            </button>
            <strong>{currentPage}/{totalPages}</strong>
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              Sau
            </button>
          </div>
        </footer>
      </section>

      {/* 4. MODAL: FAST-TRACK INSTANT RETURN APPROVAL (SALE SEASON) */}
      {selectedFastTrackOrder ? (
        <div className="ops-return-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ops-return-modal">
            <header className="ops-return-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ops-return-modal__icon">⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e1b4b' }}>
                    Duyệt Chuyển Hoàn Ngay (Giải Phóng Tồn Kho Mùa Sale)
                  </h3>
                  <small style={{ color: '#6366f1', fontWeight: 600 }}>
                    Thẩm quyền {actor === 'HQ_OPS' ? 'HQ Master Ops' : 'OPS Khu Vực'} • Bỏ qua chu kỳ phát lại 2 ngày
                  </small>
                </div>
              </div>
              <button
                type="button"
                className="ops-return-modal__close-btn"
                onClick={() => setSelectedFastTrackOrder(null)}
              >
                ✕
              </button>
            </header>

            <div className="ops-return-modal__body">
              <div className="ops-return-modal__info-box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    Mã vận đơn: <strong style={{ color: '#4338ca' }}>{selectedFastTrackOrder.originalCode}</strong>
                  </div>
                  <div>
                    Bưu cục quản lý: <strong>{selectedFastTrackOrder.returnHubCode}</strong>
                  </div>
                  <div>
                    Người gửi: <strong>{selectedFastTrackOrder.receiverName}</strong>
                  </div>
                  <div>
                    Người nhận: <strong>{selectedFastTrackOrder.senderName}</strong>
                  </div>
                  <div>
                    Bưu tá phát trước đó: <strong>{selectedFastTrackOrder.assignedCourierName}</strong>
                  </div>
                  <div>
                    Tiến độ hiện tại: <strong style={{ color: '#d97706' }}>{retryStageLabels[selectedFastTrackOrder.retryStage].label}</strong>
                  </div>
                </div>
              </div>

              <div style={{ margin: '16px 0 8px 0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Chọn lý do duyệt hoàn ngay lập tức:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {FAST_TRACK_PRESET_REASONS.map((reason) => (
                    <label
                      key={reason}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: fastTrackReasonPreset === reason ? '#6366f1' : '#e2e8f0',
                        backgroundColor: fastTrackReasonPreset === reason ? '#eef2ff' : '#f8fafc',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: fastTrackReasonPreset === reason ? 700 : 500,
                        color: fastTrackReasonPreset === reason ? '#3730a3' : '#334155',
                      }}
                    >
                      <input
                        type="radio"
                        name="fastTrackReason"
                        checked={fastTrackReasonPreset === reason}
                        onChange={() => setFastTrackReasonPreset(reason)}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ margin: '14px 0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  Ghi chú bổ sung (tùy chọn):
                </label>
                <textarea
                  rows={2}
                  value={fastTrackCustomNote}
                  onChange={(e) => setFastTrackCustomNote(e.target.value)}
                  placeholder="Ví dụ: Đã xác nhận qua hotline với Shop; Ưu tiên giải phóng Hub HN01..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', fontSize: '12px', color: '#92400e' }}>
                ⚠️ <strong>Lưu ý:</strong> Khi duyệt, đơn hàng sẽ ngay lập tức được cấp tem chuyển hoàn mới (<code>{selectedFastTrackOrder.newCode}</code>), chuyển sang trạng thái <strong>Sẵn sàng in tem</strong> và tự động hủy bỏ lịch giao lại trên App của Courier.
              </div>
            </div>

            <footer className="ops-return-modal__footer">
              <button
                type="button"
                className="ops-return-list__reset-btn"
                onClick={() => setSelectedFastTrackOrder(null)}
                disabled={isSubmittingFastTrack}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ops-return-modal__confirm-btn"
                onClick={handleConfirmFastTrack}
                disabled={isSubmittingFastTrack}
              >
                {isSubmittingFastTrack ? 'Đang duyệt chuyển hoàn...' : '⚡ Xác Nhận Duyệt Hoàn Ngay'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  );
}
