import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { authClient } from '../../../../features/auth/auth.client';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { tasksClient, useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { routePaths } from '../../../../navigation/routes';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  deriveHubScopeTokens,
  isShipmentInScope,
  shipmentDestinationHubCode,
} from '../../../../utils/locationScope';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { queryKeys } from '../../../../utils/queryKeys';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { BranchTablePagination } from '../shared/BranchTablePagination';
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
  shipmentStatusGroup: 'UNSEALED' | 'ARRIVED' | 'INVENTORY';
  shipmentStatusLabel: string;
  sla: 'normal' | 'urgent';
  task: TaskListItemDto | null;
}

interface HandoffAuditPreview {
  batchCode: string;
  courierId: string;
  shipmentCodes: string[];
  note: string;
  createdAt: string;
}

const DELIVERY_STATUS_GROUPS: Record<'UNSEALED' | 'ARRIVED' | 'INVENTORY', ReadonlySet<string>> = {
  UNSEALED: new Set(['MANIFEST_UNSEALED']),
  ARRIVED: new Set(['PICKUP_COMPLETED', 'MANIFEST_RECEIVED', 'SCAN_INBOUND']),
  INVENTORY: new Set(['INVENTORY_CHECK']),
};

function getDeliveryStatusGroup(
  status: string | null | undefined,
): 'UNSEALED' | 'ARRIVED' | 'INVENTORY' | null {
  const normalized = (status ?? '').trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  if (DELIVERY_STATUS_GROUPS.UNSEALED.has(normalized)) {
    return 'UNSEALED';
  }
  if (DELIVERY_STATUS_GROUPS.ARRIVED.has(normalized)) {
    return 'ARRIVED';
  }
  if (DELIVERY_STATUS_GROUPS.INVENTORY.has(normalized)) {
    return 'INVENTORY';
  }
  return null;
}

function getDeliveryStatusLabel(group: 'UNSEALED' | 'ARRIVED' | 'INVENTORY'): string {
  if (group === 'UNSEALED') {
    return 'Gỡ bao';
  }
  if (group === 'ARRIVED') {
    return 'Hàng đến';
  }
  return 'Tồn kho';
}

function SendIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 12 15-7-4 15-3-6z" />
      <path d="m12 14 7-9" />
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

  const destinationHubCode = shipmentDestinationHubCode(shipment);
  if (destinationHubCode) {
    return assignedHubCodes.includes(destinationHubCode);
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' });
  const courierOptionsQuery = useQuery({
    queryKey: [...queryKeys.tasks, 'couriers-by-hub', ...assignedHubCodes],
    queryFn: async () => {
      if (!accessToken || assignedHubCodes.length === 0) {
        return [];
      }

      const usersByHub = await Promise.all(
        assignedHubCodes.map((hubCode) =>
          authClient.listUsers(accessToken, {
            roleGroup: 'SHIPPER',
            status: 'ACTIVE',
            hubCode,
          }),
        ),
      );

      const mergedCouriers = new Map<string, { courierId: string; label: string }>();
      for (const users of usersByHub) {
        for (const user of users) {
          const courierId = user.username.trim();
          if (!courierId) {
            continue;
          }
          const label = user.displayName?.trim()
            ? `${user.displayName.trim()} (${courierId})`
            : courierId;
          mergedCouriers.set(courierId, { courierId, label });
        }
      }

      return Array.from(mergedCouriers.values()).sort((a, b) =>
        a.courierId.localeCompare(b.courierId),
      );
    },
    enabled: Boolean(accessToken) && assignedHubCodes.length > 0,
  });

  const [selectedShipmentCodes, setSelectedShipmentCodes] = useState<string[]>([]);
  const [areaFilter, setAreaFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'UNSEALED' | 'ARRIVED' | 'INVENTORY'>(
    'all',
  );
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [courierId, setCourierId] = useState('');
  const [courierSearch, setCourierSearch] = useState('');
  const [handoffNote, setHandoffNote] = useState('Bàn giao phát từ màn hình bưu cục.');
  const [isAssignPanelOpen, setIsAssignPanelOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastHandoffAudit, setLastHandoffAudit] = useState<HandoffAuditPreview | null>(null);
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
      .map((shipment) => {
        const shipmentStatusGroup = getDeliveryStatusGroup(shipment.currentStatus);
        if (!shipmentStatusGroup) {
          return null;
        }
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
          shipmentStatusGroup,
          shipmentStatusLabel: getDeliveryStatusLabel(shipmentStatusGroup),
          lastScan: `${formatShipmentStatusLabel(shipment.currentStatus)} - ${formatDateTime(shipment.updatedAt)}`,
          sla: isUrgent(shipment) ? 'urgent' : 'normal',
          task,
        };
      })
      .filter((shipment): shipment is DeliveryOrderRow => shipment !== null);
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
        statusFilter === 'all' || order.shipmentStatusGroup === statusFilter;
      const keywordMatched =
        normalizedKeyword.length === 0 ||
        normalize(order.shipment.shipmentCode).includes(normalizedKeyword) ||
        normalize(order.receiverName).includes(normalizedKeyword) ||
        normalize(order.receiverPhone).includes(normalizedKeyword);

      return areaMatched && serviceMatched && statusMatched && keywordMatched;
    });
  }, [areaFilter, keyword, rows, serviceFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [areaFilter, keyword, pageSize, serviceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredOrders, pageSize],
  );

  const selectedOrders = rows.filter((order) =>
    selectedShipmentCodes.includes(order.shipment.shipmentCode),
  );
  const selectedReadyOrders = selectedOrders.filter((order) => order.shipmentStatusGroup !== null);
  const selectedHubLabels = Array.from(new Set(selectedOrders.map((order) => order.area))).filter(
    Boolean,
  );
  const isLoading =
    shipmentsQuery.isLoading || deliveryTasksQuery.isLoading || hubsQuery.isLoading;

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
  const searchedCouriers = useMemo(() => {
    const normalizedKeyword = normalize(courierSearch);
    if (normalizedKeyword.length === 0) {
      return courierLoad;
    }

    return courierLoad.filter(({ courier }) => {
      return (
        normalize(courier.label).includes(normalizedKeyword) ||
        normalize(courier.courierId).includes(normalizedKeyword)
      );
    });
  }, [courierLoad, courierSearch]);

  const toggleOrder = (shipmentCode: string) => {
    setSelectedShipmentCodes((current) =>
      current.includes(shipmentCode)
        ? current.filter((selectedId) => selectedId !== shipmentCode)
        : [...current, shipmentCode],
    );
  };
  const selectAllFiltered = () => {
    setSelectedShipmentCodes(filteredOrders.map((order) => order.shipment.shipmentCode));
    setActionError(null);
  };
  const clearSelectedOrders = () => {
    setSelectedShipmentCodes([]);
    setActionError(null);
  };
  const resetFilters = () => {
    setAreaFilter('all');
    setServiceFilter('all');
    setStatusFilter('all');
    setKeyword('');
    setPage(1);
    void shipmentsQuery.refetch();
    void deliveryTasksQuery.refetch();
    void hubsQuery.refetch();
    void courierOptionsQuery.refetch();
  };

  const printHandoffList = (ordersToPrint: DeliveryOrderRow[], title: string) => {
    if (ordersToPrint.length === 0) {
      setActionError('Không có vận đơn để in danh sách bàn giao.');
      setActionMessage(null);
      return;
    }

    const printedAt = new Date().toLocaleString('vi-VN');
    const rowsHtml = ordersToPrint
      .map(
        (order, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(order.shipment.shipmentCode)}</td>
            <td>${escapeHtml(order.receiverName)}</td>
            <td>${escapeHtml(order.receiverPhone)}</td>
            <td>${escapeHtml(order.address)}</td>
            <td>${escapeHtml(order.codAmount)}</td>
            <td>${escapeHtml(order.task?.assignedCourierId ?? (effectiveCourierId || 'Chưa bàn giao'))}</td>
          </tr>
        `,
      )
      .join('');
    const printWindow = window.open('', 'branch-delivery-handoff-print', 'width=960,height=720');

    if (!printWindow) {
      setActionError('Trình duyệt đang chặn cửa sổ in danh sách bàn giao.');
      setActionMessage(null);
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #172033; margin: 24px; }
            h1 { margin: 0 0 6px; font-size: 20px; }
            p { margin: 0 0 14px; color: #475569; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f1f5f9; color: #0f172a; }
            .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; }
            .signatures div { min-height: 76px; border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <p>Thời gian in: ${escapeHtml(printedAt)} | Số vận đơn: ${ordersToPrint.length}</p>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã vận đơn</th>
                <th>Người nhận</th>
                <th>SĐT</th>
                <th>Địa chỉ</th>
                <th>COD</th>
                <th>Courier</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <section class="signatures">
            <div>Người bàn giao</div>
            <div>Courier nhận bàn giao</div>
            <div>Kiểm soát bưu cục</div>
          </section>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
            hubCode: assignedHubCodes[0] ?? null,
            note: handoffNote.trim() || 'Bàn giao phát tại bưu cục',
          });
        } else if (!task.assignedCourierId) {
          await tasksClient.assign(accessToken, {
            taskId: task.id,
            courierId: effectiveCourierId,
            hubCode: assignedHubCodes[0] ?? null,
            note: handoffNote.trim() || 'Bàn giao phát tại bưu cục',
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      setLastHandoffAudit({
        batchCode: `HANDOFF-${Date.now().toString().slice(-8)}`,
        courierId: effectiveCourierId,
        shipmentCodes: selectedOrders.map((order) => order.shipment.shipmentCode),
        note: handoffNote.trim() || 'Bàn giao phát tại bưu cục',
        createdAt: new Date().toISOString(),
      });
      setActionMessage(`Đã bàn giao ${selectedOrders.length} vận đơn cho courier ${effectiveCourierId}.`);
      setSelectedShipmentCodes([]);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignPanel = () => {
    if (selectedOrders.length === 0) {
      setActionError('Cần chọn ít nhất một vận đơn trước khi phân công courier.');
      setActionMessage(null);
      return;
    }
    setActionError(null);
    setActionMessage(null);
    if (!courierId && courierOptions[0]?.courierId) {
      setCourierId(courierOptions[0].courierId);
    }
    setCourierSearch('');
    setIsAssignPanelOpen(true);
  };

  return (
    <section className="ops-branch-delivery">
      <header className="ops-branch-delivery__top">
        <div className="ops-branch-delivery__summary">
          <div>
            <span>Gỡ bao</span>
            <strong>{rows.filter((row) => row.shipmentStatusGroup === 'UNSEALED').length}</strong>
          </div>
          <div>
            <span>Hàng đến</span>
            <strong>{rows.filter((row) => row.shipmentStatusGroup === 'ARRIVED').length}</strong>
          </div>
          <div>
            <span>Tồn kho</span>
            <strong>{rows.filter((row) => row.shipmentStatusGroup === 'INVENTORY').length}</strong>
          </div>
        </div>
      </header>

      <section className="ops-branch-delivery__toolbar" aria-label="Thao tác điều phối phát hàng">
        <button type="button" onClick={resetFilters}>
          Làm mới
        </button>
        <button
          type="button"
          className="ops-branch-delivery__primary-action"
          onClick={openAssignPanel}
          disabled={selectedOrders.length === 0}
        >
          Điều phối NVGN
        </button>
        <button
          type="button"
          onClick={() =>
            printHandoffList(
              selectedOrders.length > 0 ? selectedOrders : filteredOrders,
              selectedOrders.length > 0
                ? 'Danh sách bàn giao vận đơn đã chọn'
                : 'Danh sách bàn giao vận đơn chờ phát',
            )
          }
          disabled={filteredOrders.length === 0}
        >
          In danh sách
        </button>
      </section>

      <section className="ops-branch-delivery__filters">
        <label className="ops-branch-delivery__filter-wide">
          <span>Từ khóa</span>
          <input
            type="text"
            placeholder="Mã vận đơn, người nhận, số điện thoại"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
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
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | 'UNSEALED' | 'ARRIVED' | 'INVENTORY')
            }
          >
            <option value="UNSEALED">Gỡ bao</option>
            <option value="ARRIVED">Hàng đến</option>
            <option value="INVENTORY">Tồn kho</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
        <label>
          <span>Bưu cục xử lý</span>
          <input
            type="text"
            value={assignedHubCodes.length ? assignedHubCodes.join(', ') : 'Chưa được gán bưu cục'}
            disabled
            readOnly
          />
        </label>
      </section>

      <section className="ops-branch-delivery__assign-strip">
        <div className="ops-branch-delivery__bulk-metric">
          <strong>{selectedShipmentCodes.length}</strong>
          <span>vận đơn đã chọn</span>
        </div>
        <div className="ops-branch-delivery__bulk-metric">
          <strong>{selectedReadyOrders.length}</strong>
          <span>đủ điều phối</span>
        </div>
        <div className="ops-branch-delivery__bulk-metric">
          <strong>{selectedHubLabels.length ? selectedHubLabels.join(', ') : '-'}</strong>
          <span>tuyến / khu vực</span>
        </div>
        <div className="ops-branch-delivery__bulk-metric">
          <strong>{effectiveCourierId || '-'}</strong>
          <span>courier đang chọn</span>
        </div>
        <div className="ops-branch-delivery__bulk-actions">
          <button type="button" onClick={selectAllFiltered} disabled={filteredOrders.length === 0}>
            Chọn tất cả kết quả lọc
          </button>
          <button type="button" onClick={clearSelectedOrders} disabled={selectedShipmentCodes.length === 0}>
            Bỏ chọn
          </button>
          <button
            type="button"
            className="ops-branch-delivery__primary-action"
            onClick={openAssignPanel}
            disabled={selectedOrders.length === 0}
          >
            Điều phối {selectedOrders.length} vận đơn
          </button>
        </div>
        {actionMessage ? <p role="status">{actionMessage}</p> : null}
      </section>

      <div className="ops-branch-delivery__content">
        <section className="ops-branch-delivery__table-card">
          <div className="ops-branch-delivery__table-title">
            <h3>Danh sách đơn chờ phát</h3>
            <div className="ops-branch-delivery__table-actions">
              <span>{filteredOrders.length} đơn</span>
            </div>
          </div>
          {isLoading ? (
            <div className="ops-branch-delivery__loading">Đang tải dữ liệu điều phối...</div>
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
                  <th>Trạng thái phát hàng</th>
                  <th>Courier</th>
                  <th>Liên lạc</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedShipmentCodes.includes(order.shipment.shipmentCode)}
                        onChange={() => toggleOrder(order.shipment.shipmentCode)}
                        aria-label={`Chọn ${order.shipment.shipmentCode}`}
                      />
                    </td>
                    <td>
                      <CopyableShipmentCode
                        code={order.shipment.shipmentCode}
                        className="ops-branch-delivery__code"
                      />
                    </td>
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
                    <td>{order.shipmentStatusLabel}</td>
                    <td>{order.task?.assignedCourierId ?? 'Chưa bàn giao'}</td>
                    <td>
                      {order.task?.assignedCourierId ? (
                        <Link
                          className="ops-branch-delivery__chat-link"
                          to={routePaths.opsChatWithCourier(order.task.assignedCourierId)}
                        >
                          Chat
                        </Link>
                      ) : (
                        <span className="ops-branch-delivery__muted">Chưa có</span>
                      )}
                    </td>
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
          <BranchTablePagination
            totalRows={filteredOrders.length}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </section>
      </div>
      {actionError && !isAssignPanelOpen ? (
        <p className="ops-branch-delivery__notice ops-branch-delivery__notice--error">{actionError}</p>
      ) : null}
      {lastHandoffAudit ? (
        <section className="ops-branch-delivery__audit">
          <div>
            <span>Audit preview</span>
            <strong>{lastHandoffAudit.batchCode}</strong>
          </div>
          <div>
            <span>Courier</span>
            <strong>{lastHandoffAudit.courierId}</strong>
          </div>
          <div>
            <span>Vận đơn</span>
            <strong>{lastHandoffAudit.shipmentCodes.length}</strong>
          </div>
          <div>
            <span>Thời gian</span>
            <strong>{formatDateTime(lastHandoffAudit.createdAt)}</strong>
          </div>
          <p>{lastHandoffAudit.note}</p>
        </section>
      ) : null}
      {isAssignPanelOpen ? (
        <div className="ops-branch-delivery__modal" role="presentation">
          <aside
            className="ops-branch-delivery__drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-assign-title"
          >
            <header className="ops-branch-delivery__drawer-head">
              <div>
                <h3 id="delivery-assign-title">Điều phối nhân viên giao hàng</h3>
                <span>{selectedShipmentCodes.length} vận đơn đã chọn</span>
              </div>
              <button
                type="button"
                className="ops-branch-delivery__drawer-close"
                onClick={() => setIsAssignPanelOpen(false)}
                aria-label="Đóng modal điều phối"
              >
                ×
              </button>
            </header>

            <section className="ops-branch-delivery__drawer-summary">
              <span>Bưu cục xử lý</span>
              <strong>{assignedHubCodes[0] ?? 'Chưa gán bưu cục'}</strong>
            </section>

            <label className="ops-branch-delivery__courier-search">
              <span>Tìm nhân viên giao hàng</span>
              <input
                value={courierSearch}
                onChange={(event) => setCourierSearch(event.target.value)}
                placeholder="Nhập tên hoặc mã nhân viên"
                autoFocus
              />
            </label>

            <label className="ops-branch-delivery__drawer-note">
              <span>Ghi chú giao hàng</span>
              <textarea value={handoffNote} onChange={(event) => setHandoffNote(event.target.value)} />
            </label>

            <div className="ops-branch-delivery__courier-load" role="listbox">
              {courierOptionsQuery.isLoading ? (
                <article>Đang tải danh sách courier...</article>
              ) : null}
              {searchedCouriers.map(({ courier, activeTasks }) => {
                const isActive = effectiveCourierId === courier.courierId;
                return (
                  <button
                    key={courier.courierId}
                    type="button"
                    className={`ops-branch-delivery__courier-option${
                      isActive ? ' ops-branch-delivery__courier-option--active' : ''
                    }`}
                    onClick={() => setCourierId(courier.courierId)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span>
                      <strong>{courier.label}</strong>
                      <small>{courier.courierId}</small>
                    </span>
                    <em>{activeTasks} task</em>
                  </button>
                );
              })}
              {!courierOptionsQuery.isLoading && searchedCouriers.length === 0 ? (
                <article>Không có courier phù hợp điều kiện tìm kiếm.</article>
              ) : null}
            </div>

            {actionError ? (
              <p className="ops-branch-delivery__notice ops-branch-delivery__notice--error">{actionError}</p>
            ) : null}

            <footer className="ops-branch-delivery__drawer-actions">
              <button type="button" onClick={() => setIsAssignPanelOpen(false)}>
                Hủy
              </button>
              {effectiveCourierId ? (
                <Link
                  className="ops-branch-delivery__drawer-chat"
                  to={routePaths.opsChatWithCourier(effectiveCourierId)}
                >
                  Chat courier
                </Link>
              ) : null}
              <button
                type="button"
                className="ops-branch-delivery__assign-btn"
                onClick={() => void submitHandoff()}
                disabled={isSubmitting || !effectiveCourierId}
              >
                <SendIcon />
                {isSubmitting ? 'Đang chốt...' : 'Chốt bàn giao'}
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
