import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import {
  useInboundScanMutation,
  useOutboundScanMutation,
  usePickupScanMutation,
} from '../../../../features/scans/scans.api';
import type { HubScanType } from '../../../../features/scans/scans.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { createIdempotencyKey } from '../../../../utils/idempotency';
import {
  deriveHubScopeTokens,
  isShipmentInScope,
} from '../../../../utils/locationScope';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { queryKeys } from '../../../../utils/queryKeys';
import './BranchLocalOrderOverviewPage.css';

type BranchLocalOrderPageMode = 'overview' | 'management';

interface BranchLocalOrderOverviewPageProps {
  mode?: BranchLocalOrderPageMode;
}

interface LocalOrderRow {
  shipment: ShipmentListItemDto;
  currentStage: string;
  customerName: string;
  serviceType: string;
  lastScan: string;
  courier: string;
  aging: string;
  alert: 'Trong hạn' | 'Chưa quét gửi' | 'Cần bàn giao phát' | 'Quá hạn';
}

interface ScanFormState {
  shipmentCode: string;
  locationCode: string;
  scanType: HubScanType;
  note: string;
}

const ACTIVE_BRANCH_STATUSES = new Set([
  'CREATED',
  'UPDATED',
  'TASK_ASSIGNED',
  'PICKUP_COMPLETED',
  'MANIFEST_RECEIVED',
  'SCAN_INBOUND',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
]);

const WAITING_DELIVERY_STATUSES = new Set(['MANIFEST_RECEIVED', 'SCAN_INBOUND']);
const WAITING_OUTBOUND_STATUSES = new Set(['CREATED', 'UPDATED', 'PICKUP_COMPLETED']);
const EXCEPTION_STATUSES = new Set(['DELIVERY_FAILED', 'NDR_CREATED', 'RETURN_STARTED']);

function formatCurrency(value: number | null): string {
  if (value === null) {
    return '0 đ';
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function formatAging(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Không rõ';
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) {
    return `${days} ngày ${hours} giờ`;
  }

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }

  return `${minutes} phút`;
}

function isOverdue(value: string): boolean {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp > 24 * 60 * 60 * 1000;
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function getBranchStage(status: string): string {
  if (WAITING_DELIVERY_STATUSES.has(status)) {
    return 'Chờ phát';
  }

  if (WAITING_OUTBOUND_STATUSES.has(status)) {
    return 'Chờ gửi đi';
  }

  if (status === 'TASK_ASSIGNED') {
    return 'Đã bàn giao courier';
  }

  if (EXCEPTION_STATUSES.has(status)) {
    return 'Tồn bưu cục';
  }

  return formatShipmentStatusLabel(status);
}

function getAlert(shipment: ShipmentListItemDto, assignedCourierId: string | null): LocalOrderRow['alert'] {
  if (EXCEPTION_STATUSES.has(shipment.currentStatus) || isOverdue(shipment.updatedAt)) {
    return 'Quá hạn';
  }

  if (WAITING_OUTBOUND_STATUSES.has(shipment.currentStatus)) {
    return 'Chưa quét gửi';
  }

  if (WAITING_DELIVERY_STATUSES.has(shipment.currentStatus) && !assignedCourierId) {
    return 'Cần bàn giao phát';
  }

  return 'Trong hạn';
}

function isShipmentAtAssignedBranch(
  shipment: ShipmentListItemDto,
  assignedHubCodes: string[],
  scopeTokens: Set<string>,
): boolean {
  if (assignedHubCodes.length === 0) {
    return false;
  }

  const currentLocation = (shipment.currentLocation ?? '').trim().toUpperCase();
  if (currentLocation && assignedHubCodes.includes(currentLocation)) {
    return true;
  }

  return isShipmentInScope(shipment, scopeTokens);
}

function buildTaskByShipment(tasks: TaskListItemDto[]): Map<string, TaskListItemDto> {
  const result = new Map<string, TaskListItemDto>();

  for (const task of tasks) {
    if (!task.shipmentCode) {
      continue;
    }

    const previous = result.get(task.shipmentCode);
    if (!previous || previous.updatedAt < task.updatedAt) {
      result.set(task.shipmentCode, task);
    }
  }

  return result;
}

export function BranchLocalOrderOverviewPage({
  mode = 'overview',
}: BranchLocalOrderOverviewPageProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map((code) => code.trim().toUpperCase()).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const defaultLocationCode = assignedHubCodes[0] ?? '';

  const shipmentsQuery = useShipmentsQuery(accessToken, {});
  const hubsQuery = useHubsQuery(accessToken, {});
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' });
  const pickupScanMutation = usePickupScanMutation(accessToken);
  const inboundScanMutation = useInboundScanMutation(accessToken);
  const outboundScanMutation = useOutboundScanMutation(accessToken);

  const [stageFilter, setStageFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');
  const [scanForm, setScanForm] = useState<ScanFormState>({
    shipmentCode: '',
    locationCode: defaultLocationCode,
    scanType: 'INBOUND',
    note: '',
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hubScopeTokens = useMemo(
    () => deriveHubScopeTokens(hubsQuery.data ?? [], assignedHubCodes),
    [assignedHubCodes, hubsQuery.data],
  );

  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );

  const rows = useMemo<LocalOrderRow[]>(() => {
    const source = shipmentsQuery.data ?? [];
    const scopedShipments = canViewAllHubAreas
      ? source
      : source.filter((shipment) =>
          isShipmentAtAssignedBranch(shipment, assignedHubCodes, hubScopeTokens),
        );

    return scopedShipments
      .filter((shipment) => ACTIVE_BRANCH_STATUSES.has(shipment.currentStatus))
      .map((shipment) => {
        const task = taskByShipment.get(shipment.shipmentCode);
        const customerName =
          shipment.senderName ?? shipment.receiverName ?? shipment.platform ?? 'Không có';
        const serviceType = shipment.serviceType ?? shipment.parcelType ?? 'Không có';
        const courier = task?.assignedCourierId ?? 'Chưa bàn giao';

        return {
          shipment,
          currentStage: getBranchStage(shipment.currentStatus),
          customerName,
          serviceType,
          lastScan: `${formatShipmentStatusLabel(shipment.currentStatus)} - ${formatDateTime(shipment.updatedAt)}`,
          courier,
          aging: formatAging(shipment.updatedAt),
          alert: getAlert(shipment, task?.assignedCourierId ?? null),
        };
      });
  }, [
    assignedHubCodes,
    canViewAllHubAreas,
    hubScopeTokens,
    shipmentsQuery.data,
    taskByShipment,
  ]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    return rows.filter((row) => {
      const stageMatched = stageFilter === 'all' || row.currentStage === stageFilter;
      const courierMatched =
        courierFilter === 'all' ||
        normalize(row.courier).includes(normalize(courierFilter));
      const alertMatched = alertFilter === 'all' || row.alert === alertFilter;
      const keywordMatched =
        normalizedKeyword.length === 0 ||
        normalize(row.shipment.shipmentCode).includes(normalizedKeyword) ||
        normalize(row.customerName).includes(normalizedKeyword) ||
        normalize(row.shipment.receiverPhone).includes(normalizedKeyword) ||
        normalize(row.shipment.senderPhone).includes(normalizedKeyword);

      return stageMatched && courierMatched && alertMatched && keywordMatched;
    });
  }, [alertFilter, courierFilter, keyword, rows, stageFilter]);

  const kpiItems = useMemo(
    () => [
      { label: 'Đơn đang ở bưu cục', value: rows.length },
      { label: 'Chờ phát', value: rows.filter((row) => row.currentStage === 'Chờ phát').length },
      { label: 'Chờ gửi đi', value: rows.filter((row) => row.currentStage === 'Chờ gửi đi').length },
      {
        label: 'Đã bàn giao courier',
        value: rows.filter((row) => row.currentStage === 'Đã bàn giao courier').length,
      },
      { label: 'Đơn tồn quá hạn', value: rows.filter((row) => row.alert === 'Quá hạn').length },
    ],
    [rows],
  );

  const courierOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.courier).filter((courier) => courier !== 'Chưa bàn giao'))),
    [rows],
  );

  const isScanSubmitting =
    pickupScanMutation.isPending || inboundScanMutation.isPending || outboundScanMutation.isPending;

  const submitScan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const shipmentCode = scanForm.shipmentCode.trim().toUpperCase();
    const locationCode = scanForm.locationCode.trim().toUpperCase();

    if (!shipmentCode) {
      setActionError('Cần nhập mã vận đơn để ghi nhận quét.');
      return;
    }

    if (!locationCode) {
      setActionError('Cần nhập mã bưu cục/hub để ghi nhận quét.');
      return;
    }

    const payload = {
      shipmentCode,
      locationCode,
      scanType: scanForm.scanType,
      note: scanForm.note.trim() || null,
      idempotencyKey: createIdempotencyKey('branch-local-scan'),
    };

    setActionMessage(null);
    setActionError(null);

    try {
      if (scanForm.scanType === 'PICKUP') {
        await pickupScanMutation.mutateAsync(payload);
      } else if (scanForm.scanType === 'INBOUND') {
        await inboundScanMutation.mutateAsync(payload);
      } else {
        await outboundScanMutation.mutateAsync(payload);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tracking });
      setActionMessage(`Đã ghi nhận ${scanForm.scanType} cho vận đơn ${shipmentCode}.`);
      setScanForm((current) => ({
        ...current,
        shipmentCode: '',
        note: '',
      }));
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const prepareScan = (shipment: ShipmentListItemDto, scanType: HubScanType) => {
    setScanForm({
      shipmentCode: shipment.shipmentCode,
      locationCode: shipment.currentLocation ?? defaultLocationCode,
      scanType,
      note:
        scanType === 'OUTBOUND'
          ? 'Quét gửi đi từ màn hình quản lý đơn tại bưu cục'
          : 'Quét nhận tại màn hình quản lý đơn tại bưu cục',
    });
    setActionError(null);
    setActionMessage(null);
  };

  const pageTitle =
    mode === 'management' ? 'Quản lý đơn tại bưu cục' : 'Tổng quan đơn tại bưu cục';
  const pageCode =
    mode === 'management' ? 'BRANCH_LOCAL_ORDER_MANAGEMENT' : 'BRANCH_LOCAL_ORDER_OVERVIEW';

  return (
    <section className="ops-branch-local-orders">
      <header className="ops-branch-local-orders__header">
        <div>
          <small>{pageCode}</small>
          <h2>{pageTitle}</h2>
          <p>
            Dữ liệu được lấy từ shipment, scan và dispatch service qua Gateway BFF theo phạm vi hub của tài khoản.
          </p>
        </div>
        <div className="ops-branch-local-orders__scope">
          <span>Bưu cục hiện tại</span>
          <strong>{assignedHubCodes.length > 0 ? assignedHubCodes.join(', ') : 'Chưa gán hub'}</strong>
        </div>
      </header>

      <section className="ops-branch-local-orders__kpis">
        {kpiItems.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="ops-branch-local-orders__filters">
        <label>
          <span>Trạng thái tại bưu cục</span>
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="Chờ phát">Chờ phát</option>
            <option value="Chờ gửi đi">Chờ gửi đi</option>
            <option value="Đã bàn giao courier">Đã bàn giao courier</option>
            <option value="Tồn bưu cục">Tồn bưu cục</option>
          </select>
        </label>
        <label>
          <span>Courier phụ trách</span>
          <select value={courierFilter} onChange={(event) => setCourierFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            {courierOptions.map((courier) => (
              <option key={courier} value={courier}>
                {courier}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Mã vận đơn</span>
          <input
            type="text"
            placeholder="Nhập mã vận đơn"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
        <label>
          <span>Cảnh báo</span>
          <select value={alertFilter} onChange={(event) => setAlertFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="Quá hạn">Quá hạn</option>
            <option value="Chưa quét gửi">Chưa quét gửi</option>
            <option value="Cần bàn giao phát">Cần bàn giao phát</option>
          </select>
        </label>
      </section>

      <section className="ops-branch-local-orders__scan-card">
        <h3>Ghi nhận thao tác bưu cục</h3>
        <form onSubmit={submitScan}>
          <label>
            <span>Mã vận đơn</span>
            <input
              value={scanForm.shipmentCode}
              onChange={(event) =>
                setScanForm((current) => ({ ...current, shipmentCode: event.target.value }))
              }
              placeholder="Quét hoặc nhập mã vận đơn"
            />
          </label>
          <label>
            <span>Bưu cục / hub</span>
            <input
              value={scanForm.locationCode}
              onChange={(event) =>
                setScanForm((current) => ({ ...current, locationCode: event.target.value }))
              }
              placeholder="Mã bưu cục"
            />
          </label>
          <label>
            <span>Thao tác</span>
            <select
              value={scanForm.scanType}
              onChange={(event) =>
                setScanForm((current) => ({
                  ...current,
                  scanType: event.target.value as HubScanType,
                }))
              }
            >
              <option value="PICKUP">Tiếp nhận/PICKUP</option>
              <option value="INBOUND">Quét hàng đến/INBOUND</option>
              <option value="OUTBOUND">Quét gửi đi/OUTBOUND</option>
            </select>
          </label>
          <label>
            <span>Ghi chú</span>
            <input
              value={scanForm.note}
              onChange={(event) =>
                setScanForm((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="Không bắt buộc"
            />
          </label>
          <button type="submit" disabled={isScanSubmitting}>
            {isScanSubmitting ? 'Đang ghi nhận...' : 'Ghi nhận'}
          </button>
        </form>
        {actionMessage ? <p className="ops-branch-local-orders__notice">{actionMessage}</p> : null}
        {actionError ? (
          <p className="ops-branch-local-orders__notice ops-branch-local-orders__notice--error">
            {actionError}
          </p>
        ) : null}
      </section>

      <section className="ops-branch-local-orders__content">
        <article className="ops-branch-local-orders__work-card">
          <h3>Luồng xử lý trong bưu cục</h3>
          <ol>
            <li>
              <strong>Nhận vào</strong>
              <span>Quét PICKUP hoặc INBOUND để ghi nhận kiện nằm tại bưu cục.</span>
            </li>
            <li>
              <strong>Phân loại</strong>
              <span>Danh sách được phân nhóm theo trạng thái thật của shipment-service.</span>
            </li>
            <li>
              <strong>Bàn giao</strong>
              <span>Đơn chờ phát được đẩy sang dispatch-service để courier thấy trên app.</span>
            </li>
            <li>
              <strong>Gửi đi</strong>
              <span>Quét OUTBOUND khi kiện rời bưu cục sang hub/tuyến tiếp theo.</span>
            </li>
          </ol>
        </article>

        <section className="ops-branch-local-orders__table-card">
          <div className="ops-branch-local-orders__table-title">
            <h3>Danh sách đơn đang ở bưu cục</h3>
            <span>{filteredRows.length} đơn</span>
          </div>
          {shipmentsQuery.isLoading || deliveryTasksQuery.isLoading || hubsQuery.isLoading ? (
            <p className="ops-branch-local-orders__empty">Đang tải dữ liệu thật từ hệ thống...</p>
          ) : null}
          {shipmentsQuery.isError ? (
            <p className="ops-branch-local-orders__empty">{getErrorMessage(shipmentsQuery.error)}</p>
          ) : null}
          {assignedHubCodes.length === 0 && !canViewAllHubAreas ? (
            <p className="ops-branch-local-orders__empty">
              Tài khoản OPS chưa được gán hub nên chưa thể xác định phạm vi bưu cục.
            </p>
          ) : null}
          {!shipmentsQuery.isLoading && filteredRows.length === 0 ? (
            <p className="ops-branch-local-orders__empty">Không có đơn phù hợp bộ lọc hiện tại.</p>
          ) : null}
          <div className="ops-branch-local-orders__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã vận đơn</th>
                  <th>Trạng thái tại bưu cục</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>COD</th>
                  <th>Vị trí</th>
                  <th>Thao tác cuối</th>
                  <th>Courier</th>
                  <th>Thời gian lưu</th>
                  <th>Cảnh báo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.shipment.shipmentCode}>
                    <td className="ops-branch-local-orders__code">{row.shipment.shipmentCode}</td>
                    <td>{row.currentStage}</td>
                    <td>{row.customerName}</td>
                    <td>{row.serviceType}</td>
                    <td>{formatCurrency(row.shipment.codAmount)}</td>
                    <td>{row.shipment.currentLocation ?? row.shipment.receiverRegion ?? 'Không có'}</td>
                    <td>{row.lastScan}</td>
                    <td>{row.courier}</td>
                    <td>{row.aging}</td>
                    <td>
                      <span
                        className={
                          row.alert === 'Quá hạn'
                            ? 'ops-branch-local-orders__alert ops-branch-local-orders__alert--danger'
                            : 'ops-branch-local-orders__alert'
                        }
                      >
                        {row.alert}
                      </span>
                    </td>
                    <td>
                      <div className="ops-branch-local-orders__row-actions">
                        <button type="button" onClick={() => prepareScan(row.shipment, 'INBOUND')}>
                          Nhận
                        </button>
                        <button type="button" onClick={() => prepareScan(row.shipment, 'OUTBOUND')}>
                          Gửi đi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </section>
  );
}
