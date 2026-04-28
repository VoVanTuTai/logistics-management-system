import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { tasksClient, useCourierOptionsQuery, useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  deriveHubScopeTokens,
  isShipmentInScope,
} from '../../../../utils/locationScope';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { queryKeys } from '../../../../utils/queryKeys';
import './BranchDeliveryDispatchPage.css';

interface DeliveryOrderRow {
  id: string;
  shipment: ShipmentListItemDto;
  receiverName: string;
  receiverPhone: string;
  address: string;
  area: string;
  serviceType: string;
  codAmount: string;
  lastScan: string;
  sla: 'normal' | 'urgent';
  task: TaskListItemDto | null;
}

const WAITING_DELIVERY_STATUSES = new Set(['MANIFEST_RECEIVED', 'SCAN_INBOUND', 'TASK_ASSIGNED']);

function SendIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 12 15-7-4 15-3-6z" />
      <path d="m12 14 7-9" />
    </svg>
  );
}

function SearchIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function formatCurrency(value: number | null): string {
  if (value === null) {
    return '0 đ';
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isUrgent(shipment: ShipmentListItemDto): boolean {
  const updatedAt = new Date(shipment.updatedAt).getTime();
  if (Number.isNaN(updatedAt)) {
    return false;
  }

  return Date.now() - updatedAt > 12 * 60 * 60 * 1000 || (shipment.codAmount ?? 0) > 0;
}

function getDeliveryArea(shipment: ShipmentListItemDto): string {
  if (shipment.receiverRegion?.trim()) {
    return shipment.receiverRegion.trim();
  }

  const parts = (shipment.receiverAddress ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts[parts.length - 1] : 'Chưa xác định';
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
    if (!task.shipmentCode || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      continue;
    }

    const previous = result.get(task.shipmentCode);
    if (!previous || previous.updatedAt < task.updatedAt) {
      result.set(task.shipmentCode, task);
    }
  }

  return result;
}

function generateDeliveryTaskCode(shipmentCode: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const normalizedShipmentCode = shipmentCode
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(-6);

  return `DLV-${normalizedShipmentCode || 'SHIP'}-${timestamp}`;
}

export function BranchDeliveryDispatchPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map((code) => code.trim().toUpperCase()).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;

  const shipmentsQuery = useShipmentsQuery(accessToken, {});
  const hubsQuery = useHubsQuery(accessToken, {});
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' });
  const courierOptionsQuery = useCourierOptionsQuery(accessToken);

  const [selectedShipmentCodes, setSelectedShipmentCodes] = useState<string[]>([]);
  const [areaFilter, setAreaFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('waiting-delivery');
  const [keyword, setKeyword] = useState('');
  const [courierId, setCourierId] = useState('');
  const [handoffNote, setHandoffNote] = useState('Bàn giao phát từ màn hình Phát hàng bưu cục.');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hubScopeTokens = useMemo(
    () => deriveHubScopeTokens(hubsQuery.data ?? [], assignedHubCodes),
    [assignedHubCodes, hubsQuery.data],
  );

  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? []),
    [deliveryTasksQuery.data],
  );

  const rows = useMemo<DeliveryOrderRow[]>(() => {
    const source = shipmentsQuery.data ?? [];
    const scopedShipments = canViewAllHubAreas
      ? source
      : source.filter((shipment) =>
          isShipmentAtAssignedBranch(shipment, assignedHubCodes, hubScopeTokens),
        );

    return scopedShipments
      .filter((shipment) => WAITING_DELIVERY_STATUSES.has(shipment.currentStatus))
      .map((shipment) => {
        const task = taskByShipment.get(shipment.shipmentCode) ?? null;

        return {
          id: shipment.id,
          shipment,
          receiverName: shipment.receiverName ?? 'Người nhận',
          receiverPhone: shipment.receiverPhone ?? '-',
          address: shipment.receiverAddress ?? 'Chưa có địa chỉ',
          area: getDeliveryArea(shipment),
          serviceType: shipment.serviceType ?? shipment.parcelType ?? 'Không có',
          codAmount: formatCurrency(shipment.codAmount),
          lastScan: `${formatShipmentStatusLabel(shipment.currentStatus)} - ${formatDateTime(shipment.updatedAt)}`,
          sla: isUrgent(shipment) ? 'urgent' : 'normal',
          task,
        };
      });
  }, [
    assignedHubCodes,
    canViewAllHubAreas,
    hubScopeTokens,
    shipmentsQuery.data,
    taskByShipment,
  ]);

  const areaOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.area))).filter(Boolean),
    [rows],
  );

  const filteredOrders = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    return rows.filter((order) => {
      const areaMatched = areaFilter === 'all' || order.area === areaFilter;
      const serviceMatched =
        serviceFilter === 'all' || normalize(order.serviceType).includes(normalize(serviceFilter));
      const statusMatched =
        statusFilter === 'all' ||
        (statusFilter === 'waiting-delivery' && !order.task?.assignedCourierId) ||
        (statusFilter === 'assigned' && Boolean(order.task?.assignedCourierId));
      const keywordMatched =
        normalizedKeyword.length === 0 ||
        normalize(order.shipment.shipmentCode).includes(normalizedKeyword) ||
        normalize(order.receiverName).includes(normalizedKeyword) ||
        normalize(order.receiverPhone).includes(normalizedKeyword);

      return areaMatched && serviceMatched && statusMatched && keywordMatched;
    });
  }, [areaFilter, keyword, rows, serviceFilter, statusFilter]);

  const selectedOrders = rows.filter((order) =>
    selectedShipmentCodes.includes(order.shipment.shipmentCode),
  );
  const urgentSelectedCount = selectedOrders.filter((order) => order.sla === 'urgent').length;

  const courierOptions = courierOptionsQuery.data ?? [];
  const effectiveCourierId = courierId || courierOptions[0]?.courierId || '';

  const courierLoad = useMemo(
    () =>
      courierOptions.map((courier) => ({
        courier,
        activeTasks: (deliveryTasksQuery.data ?? []).filter(
          (task) =>
            task.assignedCourierId === courier.courierId &&
            task.status !== 'COMPLETED' &&
            task.status !== 'CANCELLED',
        ).length,
      })),
    [courierOptions, deliveryTasksQuery.data],
  );

  const toggleOrder = (shipmentCode: string) => {
    setSelectedShipmentCodes((current) =>
      current.includes(shipmentCode)
        ? current.filter((selectedId) => selectedId !== shipmentCode)
        : [...current, shipmentCode],
    );
  };

  const submitHandoff = async () => {
    if (!accessToken || isSubmitting) {
      return;
    }

    if (selectedOrders.length === 0) {
      setActionError('Cần chọn ít nhất một vận đơn để bàn giao phát.');
      return;
    }

    if (!effectiveCourierId) {
      setActionError('Cần chọn courier để bàn giao phát.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      for (const order of selectedOrders) {
        let task = order.task;

        if (!task) {
          task = await tasksClient.create(accessToken, {
            taskCode: generateDeliveryTaskCode(order.shipment.shipmentCode),
            taskType: 'DELIVERY',
            shipmentCode: order.shipment.shipmentCode,
            note: handoffNote.trim() || 'Bàn giao phát tại bưu cục',
          });
        }

        if (task.assignedCourierId && task.assignedCourierId !== effectiveCourierId) {
          await tasksClient.reassign(accessToken, {
            taskId: task.id,
            courierId: effectiveCourierId,
          });
        } else if (!task.assignedCourierId) {
          await tasksClient.assign(accessToken, {
            taskId: task.id,
            courierId: effectiveCourierId,
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      setActionMessage(`Đã bàn giao ${selectedOrders.length} vận đơn cho courier ${effectiveCourierId}.`);
      setSelectedShipmentCodes([]);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="ops-branch-delivery">
      <header className="ops-branch-delivery__header">
        <div>
          <small>BRANCH_DELIVERY_DISPATCH</small>
          <h2>Phát hàng</h2>
          <p>Dữ liệu lấy từ shipment-service và dispatch-service, dùng để bàn giao đơn thật sang app courier.</p>
        </div>
        <div className="ops-branch-delivery__summary">
          <article>
            <span>Chờ phát</span>
            <strong>{rows.filter((row) => !row.task?.assignedCourierId).length}</strong>
          </article>
          <article>
            <span>Đã chọn</span>
            <strong>{selectedShipmentCodes.length}</strong>
          </article>
          <article>
            <span>Ưu tiên</span>
            <strong>{urgentSelectedCount}</strong>
          </article>
        </div>
      </header>

      <section className="ops-branch-delivery__filters">
        <label>
          <span>Tuyến / khu vực</span>
          <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Dịch vụ</span>
          <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="cod">COD</option>
            <option value="express">EXPRESS</option>
            <option value="standard">STANDARD</option>
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="waiting-delivery">Chờ bàn giao phát</option>
            <option value="assigned">Đã bàn giao courier</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
        <label className="ops-branch-delivery__search">
          <span>Tìm kiếm</span>
          <div>
            <SearchIcon />
            <input
              type="text"
              placeholder="Mã vận đơn, người nhận, số điện thoại"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </label>
      </section>

      <div className="ops-branch-delivery__content">
        <section className="ops-branch-delivery__table-card">
          <div className="ops-branch-delivery__table-title">
            <h3>Danh sách đơn chờ phát</h3>
            <span>{filteredOrders.length} đơn</span>
          </div>
          {shipmentsQuery.isLoading || deliveryTasksQuery.isLoading || hubsQuery.isLoading ? (
            <p className="ops-branch-delivery__empty">Đang tải dữ liệu thật từ hệ thống...</p>
          ) : null}
          {shipmentsQuery.isError ? (
            <p className="ops-branch-delivery__empty">{getErrorMessage(shipmentsQuery.error)}</p>
          ) : null}
          {assignedHubCodes.length === 0 && !canViewAllHubAreas ? (
            <p className="ops-branch-delivery__empty">
              Tài khoản OPS chưa được gán hub nên chưa thể xác định phạm vi bưu cục.
            </p>
          ) : null}
          {!shipmentsQuery.isLoading && filteredOrders.length === 0 ? (
            <p className="ops-branch-delivery__empty">Không có đơn chờ phát phù hợp bộ lọc.</p>
          ) : null}
          <div className="ops-branch-delivery__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>Mã vận đơn</th>
                  <th>Người nhận</th>
                  <th>Địa chỉ giao</th>
                  <th>Dịch vụ</th>
                  <th>COD</th>
                  <th>Thao tác cuối</th>
                  <th>Courier</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedShipmentCodes.includes(order.shipment.shipmentCode)}
                        onChange={() => toggleOrder(order.shipment.shipmentCode)}
                        aria-label={`Chọn ${order.shipment.shipmentCode}`}
                      />
                    </td>
                    <td className="ops-branch-delivery__code">{order.shipment.shipmentCode}</td>
                    <td>
                      <strong>{order.receiverName}</strong>
                      <small>{order.receiverPhone}</small>
                    </td>
                    <td>
                      {order.address}
                      <small>{order.area}</small>
                    </td>
                    <td>{order.serviceType}</td>
                    <td>{order.codAmount}</td>
                    <td>{order.lastScan}</td>
                    <td>{order.task?.assignedCourierId ?? 'Chưa bàn giao'}</td>
                    <td>
                      <span
                        className={
                          order.sla === 'urgent'
                            ? 'ops-branch-delivery__sla ops-branch-delivery__sla--urgent'
                            : 'ops-branch-delivery__sla'
                        }
                      >
                        {order.sla === 'urgent' ? 'Cần phát sớm' : 'Trong hạn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="ops-branch-delivery__assign-card">
          <h3>Đẩy sang app courier</h3>
          <label>
            <span>Courier đi giao</span>
            <select
              value={effectiveCourierId}
              onChange={(event) => setCourierId(event.target.value)}
              disabled={courierOptionsQuery.isLoading || isSubmitting}
            >
              <option value="">Chọn courier</option>
              {courierOptions.map((courier) => (
                <option key={courier.courierId} value={courier.courierId}>
                  {courier.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Ca giao</span>
            <select defaultValue="current">
              <option value="current">Ca hiện tại</option>
              <option value="afternoon">Ca chiều</option>
              <option value="evening">Ca tối</option>
            </select>
          </label>
          <label>
            <span>Ghi chú giao hàng</span>
            <textarea value={handoffNote} onChange={(event) => setHandoffNote(event.target.value)} />
          </label>

          <div className="ops-branch-delivery__courier-load">
            {courierLoad.map(({ courier, activeTasks }) => (
              <article key={courier.courierId}>
                <span>{courier.label}</span>
                <strong>{activeTasks} đơn đang giao</strong>
              </article>
            ))}
          </div>

          {actionMessage ? <p className="ops-branch-delivery__notice">{actionMessage}</p> : null}
          {actionError ? (
            <p className="ops-branch-delivery__notice ops-branch-delivery__notice--error">
              {actionError}
            </p>
          ) : null}

          <button
            type="button"
            className="ops-branch-delivery__assign-btn"
            onClick={() => void submitHandoff()}
            disabled={isSubmitting}
          >
            <SendIcon />
            {isSubmitting ? 'Đang bàn giao...' : 'Phát hàng sang app courier'}
          </button>
        </aside>
      </div>
    </section>
  );
}
