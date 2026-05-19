import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { ndrClient } from '../../../../features/ndr/ndr.client';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { routePaths } from '../../../../navigation/routes';
import { openReturnShippingLabelPrint } from '../../../../printing/returnShippingLabelPrint';
import { useAuthStore } from '../../../../store/authStore';
import { formatNdrStatusLabel, formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';

import './ReturnBlockManagementPage.css';

type ReturnOrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ReturnOrder {
  id: string;
  sourceType: 'NDR' | 'SHIPMENT';
  originalCode: string;
  originalShipmentId?: string;
  ndrId?: string;
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
}

const statusLabels: Record<ReturnOrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  APPROVED: 'Sẵn sàng in',
  REJECTED: 'Đã đóng',
};

const RETURN_RELATED_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'EXCEPTION',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
]);

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
  shipment: ShipmentListItemDto | undefined,
  ndr: NdrCaseListItemDto | undefined,
): ReturnOrderStatus {
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

function buildReturnInstruction(order: ReturnOrder): string {
  return [
    'Đây là tem chuyển hoàn, không thu tiền người nhận.',
    `Lý do hoàn: ${order.reason}`,
    `Đối soát theo mã gốc ${order.originalCode}.`,
  ].join('\n');
}

function buildReturnOrder(
  shipmentCode: string,
  shipment: ShipmentListItemDto | undefined,
  ndr: NdrCaseListItemDto | undefined,
): ReturnOrder {
  const originalStatusLabel = shipment
    ? formatShipmentStatusLabel(shipment.currentStatus)
    : ndr
      ? formatNdrStatusLabel(ndr.status)
      : 'Cần xử lý';

  return {
    id: ndr?.id ?? shipment?.id ?? shipmentCode,
    sourceType: ndr ? 'NDR' : 'SHIPMENT',
    originalCode: shipmentCode,
    originalShipmentId: shipment?.id,
    ndrId: ndr?.id,
    newCode: `${shipmentCode}-R`,
    status: resolveReturnStatus(shipment, ndr),
    sourceStatus: originalStatusLabel,
    reason: ndr?.reasonCode || shipment?.deliveryNote || 'Yêu cầu chuyển hoàn từ luồng giao thất bại.',
    createdAt: formatDateTime(ndr?.updatedAt ?? shipment?.updatedAt),
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
  };
}

function buildReturnOrders(
  shipments: ShipmentListItemDto[],
  ndrCases: NdrCaseListItemDto[],
): ReturnOrder[] {
  const shipmentsByCode = new Map(shipments.map((shipment) => [shipment.shipmentCode, shipment]));
  const ndrByCode = new Map(ndrCases.map((ndr) => [ndr.shipmentCode, ndr]));

  const candidateCodes = new Set<string>();
  ndrCases.forEach((ndr) => candidateCodes.add(ndr.shipmentCode));
  shipments
    .filter((shipment) => RETURN_RELATED_STATUSES.has(shipment.currentStatus))
    .forEach((shipment) => candidateCodes.add(shipment.shipmentCode));

  return Array.from(candidateCodes)
    .map((shipmentCode) =>
      buildReturnOrder(shipmentCode, shipmentsByCode.get(shipmentCode), ndrByCode.get(shipmentCode)),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ReturnBlockManagementPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnOrderStatus | ''>('');
  const [orders, setOrders] = useState<ReturnOrder[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReturnOrders = useCallback(async () => {
    if (!accessToken) {
      setOrders([]);
      setErrorMessage('Bạn cần đăng nhập để tải danh sách chuyển hoàn.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [ndrResult, shipmentsResult] = await Promise.allSettled([
      ndrClient.list(accessToken),
      shipmentsClient.list(accessToken, {
        limit: 200,
        offset: 0,
      }),
    ]);

    const ndrCases = ndrResult.status === 'fulfilled' ? ndrResult.value : [];
    const shipments =
      shipmentsResult.status === 'fulfilled' ? shipmentsResult.value : [];

    if (ndrResult.status === 'rejected' && shipmentsResult.status === 'rejected') {
      setOrders([]);
      setErrorMessage(extractErrorMessage(ndrResult.reason));
    } else {
      setOrders(buildReturnOrders(shipments, ndrCases));
      const failedResult = ndrResult.status === 'rejected' ? ndrResult : shipmentsResult.status === 'rejected' ? shipmentsResult : null;
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
      const matchesSearch = query
        ? [order.originalCode, order.newCode, order.reason, order.returnHubCode, order.sourceStatus]
            .some((value) => value.toLowerCase().includes(query))
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchCode, statusFilter]);

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

  return (
    <section className="ops-return-list">
      <section className="ops-return-list__hero">
        <div>
          <small>Operations platform</small>
          <h2>Quản lý chuyển hoàn</h2>
          <p>
            Theo dõi yêu cầu hoàn phát sinh từ NDR và trạng thái vận đơn hoàn,
            sau đó in tem hoàn hàng theo chuẩn vận đơn.
          </p>
        </div>
        <div className="ops-return-list__hero-stats" aria-label="Thống kê chuyển hoàn">
          <span>
            <strong>{orders.length}</strong>
            Yêu cầu
          </span>
          <span>
            <strong>{orders.filter((order) => order.status === 'APPROVED').length}</strong>
            Sẵn sàng in
          </span>
          <span>
            <strong>{orders.filter((order) => order.status === 'PENDING').length}</strong>
            Chờ xác nhận
          </span>
        </div>
      </section>

      <section className="ops-return-list__panel">
        <header className="ops-return-list__panel-header">
          <h3>Tra cứu danh sách chuyển hoàn</h3>
          <span>{isLoading ? 'Đang tải' : 'Dữ liệu NDR/vận đơn'}</span>
        </header>
        <div className="ops-return-list__panel-body">
          <div className="ops-return-list__filters">
            <label className="ops-return-list__field">
              <span>Mã đơn gốc / Mã đơn hoàn</span>
              <input
                type="text"
                placeholder="Nhập mã đơn..."
                value={searchCode}
                onChange={(event) => setSearchCode(event.target.value)}
              />
            </label>
            <label className="ops-return-list__field">
              <span>Trạng thái xử lý</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ReturnOrderStatus | '')}
              >
                <option value="">Tất cả</option>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="APPROVED">Sẵn sàng in</option>
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

      <section className="ops-return-list__panel">
        <header className="ops-return-list__panel-header">
          <h3>Danh sách yêu cầu chuyển hoàn</h3>
          <span>{filteredOrders.length} dòng</span>
        </header>
        <div className="ops-return-list__table-wrap">
          <table className="ops-return-list__table">
            <thead>
              <tr>
                <th>Mã đơn gốc</th>
                <th>Mã đơn hoàn</th>
                <th>Nguồn</th>
                <th>Tuyến hoàn</th>
                <th>Lý do</th>
                <th>Cập nhật</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={`${order.sourceType}-${order.id}`}>
                  <td>
                    {order.originalShipmentId ? (
                      <Link
                        className="ops-return-list__mono"
                        to={routePaths.shipmentDetail(order.originalShipmentId)}
                      >
                        {order.originalCode}
                      </Link>
                    ) : (
                      <span className="ops-return-list__mono">{order.originalCode}</span>
                    )}
                  </td>
                  <td>
                    <strong className="ops-return-list__code">{order.newCode}</strong>
                  </td>
                  <td>
                    <div className="ops-return-list__route-cell">
                      <strong>{order.sourceType}</strong>
                      <span>{order.sourceStatus}</span>
                    </div>
                  </td>
                  <td>
                    <div className="ops-return-list__route-cell">
                      <strong>{order.returnHubCode}</strong>
                      <span>{order.returnZoneCode}</span>
                    </div>
                  </td>
                  <td>{order.reason}</td>
                  <td>{order.createdAt}</td>
                  <td>
                    <span
                      className={`ops-return-list__status ops-return-list__status--${order.status.toLowerCase()}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td>
                    {order.status === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => handlePrintLabel(order)}
                        className="ops-return-list__print-btn"
                      >
                        In tem
                      </button>
                    ) : (
                      <span className="ops-return-list__disabled-text">
                        {order.status === 'PENDING' ? 'Chờ return decision' : 'Đã đóng'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="ops-return-list__empty">
                      Không có yêu cầu chuyển hoàn phù hợp bộ lọc.
                    </div>
                  </td>
                </tr>
              ) : null}
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="ops-return-list__empty">Đang tải danh sách chuyển hoàn...</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
