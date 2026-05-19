import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { manifestsClient } from '../../../../features/manifests/manifests.client';
import type { ManifestListItemDto } from '../../../../features/manifests/manifests.types';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { tasksClient } from '../../../../features/tasks/tasks.client';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { routePaths } from '../../../../navigation/routes';
import { useAuthStore } from '../../../../store/authStore';
import {
  formatManifestStatusLabel,
  formatShipmentStatusLabel,
  formatTaskStatusLabel,
  formatTaskTypeLabel,
} from '../../../../utils/logisticsLabels';

import './OperationalDataMonitorPage.css';

type MonitorMode = 'received' | 'two-in-one' | 'advance' | 'bagging';

interface OperationalDataMonitorPageProps {
  mode: MonitorMode;
}

interface MonitorRow {
  id: string;
  code: string;
  codeTo?: string;
  codePath?: string;
  hubCode: string;
  oppositeHubCode: string;
  customer: string;
  status: string;
  statusLabel: string;
  owner: string;
  amountText: string;
  updatedAt: string | null;
  ageMinutes: number | null;
  note: string;
}

interface MonitorSummary {
  label: string;
  value: string;
  tone?: 'normal' | 'warning' | 'danger';
}

interface MonitorConfig {
  groupCode: string;
  title: string;
  description: string;
  searchLabel: string;
  hubLabel: string;
  emptyText: string;
  columns: {
    oppositeHub: string;
    owner: string;
    amount: string;
  };
}

const PAGE_SIZE = 20;
const DATA_LIMIT = 200;

const RECEIVED_STATUSES = new Set([
  'PICKUP_COMPLETED',
  'MANIFEST_RECEIVED',
  'INVENTORY_CHECK',
  'SCAN_INBOUND',
]);

const OUTBOUND_DONE_STATUSES = new Set([
  'SCAN_OUTBOUND',
  'SEND_GOODS',
  'IN_TRANSIT',
  'MANIFEST_SEALED',
  'DELIVERED',
  'RETURN_COMPLETED',
  'CANCELLED',
]);

const CASH_WATCH_STATUSES = new Set([
  'TASK_ASSIGNED',
  'PICKUP_COMPLETED',
  'SCAN_INBOUND',
  'SCAN_OUTBOUND',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'DELIVERED',
]);

const configs: Record<MonitorMode, MonitorConfig> = {
  received: {
    groupCode: 'MONITOR_DATA_HANG_NHAN',
    title: 'Giám sát hàng nhận',
    description:
      'Theo dõi các đơn đã nhận tại bưu cục nhưng chưa có thao tác quét gửi ra khỏi bưu cục.',
    searchLabel: 'Mã vận đơn / khách hàng',
    hubLabel: 'BC nhận',
    emptyText: 'Không có đơn hàng nhận phù hợp bộ lọc.',
    columns: {
      oppositeHub: 'BC gửi/đích',
      owner: 'Khách hàng',
      amount: 'Tuổi tồn',
    },
  },
  'two-in-one': {
    groupCode: 'MONITOR_DATA_2IN1',
    title: 'Giám sát 2in1',
    description:
      'Theo dõi các đơn có tín hiệu gom lấy hàng và phát hàng trong cùng một luồng điều phối.',
    searchLabel: 'Mã vận đơn / mã task',
    hubLabel: 'Hub xử lý',
    emptyText: 'Chưa có đơn đủ dữ kiện 2in1 từ shipments/tasks.',
    columns: {
      oppositeHub: 'Hub còn lại',
      owner: 'Task liên quan',
      amount: 'Tuổi xử lý',
    },
  },
  advance: {
    groupCode: 'MONITOR_DATA_THEO_DOI_TAM_UNG',
    title: 'Theo dõi tạm ứng',
    description:
      'Theo dõi các đơn COD cần kiểm soát tiền tạm ứng/thu hộ trước khi quyết toán chính thức.',
    searchLabel: 'Mã vận đơn / người nhận',
    hubLabel: 'Hub phát/thu',
    emptyText: 'Không có đơn COD cần theo dõi tạm ứng theo bộ lọc hiện tại.',
    columns: {
      oppositeHub: 'Hub nguồn',
      owner: 'Người nhận',
      amount: 'COD cần kiểm soát',
    },
  },
  bagging: {
    groupCode: 'MONITOR_DATA_DONG_BAO',
    title: 'Giám sát đóng bao',
    description:
      'Theo dõi bao/manifest đã tạo, đã niêm phong và đã nhận để kiểm soát tiến độ đóng bao.',
    searchLabel: 'Mã bao / hub',
    hubLabel: 'Hub đi',
    emptyText: 'Không có bao/manifest phù hợp bộ lọc.',
    columns: {
      oppositeHub: 'Hub đến',
      owner: 'Số kiện',
      amount: 'Tuổi bao',
    },
  },
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '---';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '---' : date.toLocaleString('vi-VN');
}

function minutesSince(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - time) / 60000));
}

function formatAge(minutes: number | null): string {
  if (minutes === null) {
    return '---';
  }

  if (minutes < 60) {
    return `${minutes} phút`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ`;
  }

  return `${Math.floor(hours / 24)} ngày`;
}

function formatMoney(value: number | null | undefined): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function matchesQuery(row: MonitorRow, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return true;
  }

  return [
    row.code,
    row.codeTo,
    row.hubCode,
    row.oppositeHubCode,
    row.customer,
    row.owner,
    row.status,
    row.note,
  ].some((value) => normalize(value).includes(normalizedQuery));
}

function matchesHub(row: MonitorRow, hubCode: string): boolean {
  const normalizedHub = normalize(hubCode);
  if (!normalizedHub) {
    return true;
  }

  return normalize(row.hubCode).includes(normalizedHub) || normalize(row.oppositeHubCode).includes(normalizedHub);
}

function statusClass(status: string): string {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không tải được dữ liệu từ server.';
}

function shipmentHub(shipment: ShipmentListItemDto): string {
  return (
    shipment.currentLocation ||
    shipment.receiverHubCode ||
    shipment.destinationHubCode ||
    shipment.senderHubCode ||
    shipment.originHubCode ||
    '---'
  );
}

function buildReceivedRows(shipments: ShipmentListItemDto[]): MonitorRow[] {
  return shipments
    .filter((shipment) => RECEIVED_STATUSES.has(shipment.currentStatus))
    .filter((shipment) => !OUTBOUND_DONE_STATUSES.has(shipment.currentStatus))
    .map((shipment) => {
      const ageMinutes = minutesSince(shipment.updatedAt);
      return {
        id: shipment.id,
        code: shipment.shipmentCode,
        codePath: routePaths.shipmentDetail(shipment.id),
        hubCode: shipmentHub(shipment),
        oppositeHubCode: shipment.originHubCode || shipment.senderHubCode || shipment.destinationHubCode || '---',
        customer: shipment.senderName || shipment.receiverName || '---',
        status: shipment.currentStatus,
        statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
        owner: shipment.senderName || shipment.senderPhone || '---',
        amountText: formatAge(ageMinutes),
        updatedAt: shipment.updatedAt,
        ageMinutes,
        note:
          ageMinutes !== null && ageMinutes >= 360
            ? 'Cần kiểm tra vì đã nhận quá 6 giờ nhưng chưa quét gửi.'
            : 'Chờ thao tác quét gửi hoặc đóng bao tiếp theo.',
      };
    });
}

function buildTwoInOneRows(
  shipments: ShipmentListItemDto[],
  tasks: TaskListItemDto[],
): MonitorRow[] {
  const tasksByShipment = new Map<string, TaskListItemDto[]>();
  tasks.forEach((task) => {
    if (!task.shipmentCode) {
      return;
    }

    const list = tasksByShipment.get(task.shipmentCode) ?? [];
    list.push(task);
    tasksByShipment.set(task.shipmentCode, list);
  });

  return shipments
    .map((shipment): MonitorRow | null => {
      const relatedTasks = tasksByShipment.get(shipment.shipmentCode) ?? [];
      const hasPickup = relatedTasks.some((task) => task.taskType === 'PICKUP');
      const hasDelivery = relatedTasks.some((task) => task.taskType === 'DELIVERY');
      const sameHub =
        Boolean(shipment.originHubCode) &&
        shipment.originHubCode === shipment.destinationHubCode;

      if (!((hasPickup && hasDelivery) || sameHub)) {
        return null;
      }

      const ageMinutes = minutesSince(shipment.updatedAt);
      const taskSummary = relatedTasks.length
        ? relatedTasks
            .map((task) => `${formatTaskTypeLabel(task.taskType)}: ${formatTaskStatusLabel(task.status)}`)
            .join(' / ')
        : 'Cùng hub gửi - nhận';

      return {
        id: shipment.id,
        code: shipment.shipmentCode,
        codePath: routePaths.shipmentDetail(shipment.id),
        hubCode: shipmentHub(shipment),
        oppositeHubCode: shipment.destinationHubCode || shipment.receiverHubCode || '---',
        customer: shipment.receiverName || shipment.senderName || '---',
        status: shipment.currentStatus,
        statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
        owner: taskSummary,
        amountText: formatAge(ageMinutes),
        updatedAt: shipment.updatedAt,
        ageMinutes,
        note: hasPickup && hasDelivery
          ? 'Có đủ task lấy hàng và giao hàng trên cùng vận đơn.'
          : 'Ứng viên 2in1 do hub gửi và hub nhận trùng nhau.',
      };
    })
    .filter((row): row is MonitorRow => row !== null);
}

function buildAdvanceRows(shipments: ShipmentListItemDto[]): MonitorRow[] {
  return shipments
    .filter((shipment) => (shipment.codAmount ?? 0) > 0)
    .filter((shipment) => CASH_WATCH_STATUSES.has(shipment.currentStatus))
    .map((shipment) => {
      const ageMinutes = minutesSince(shipment.updatedAt);
      return {
        id: shipment.id,
        code: shipment.shipmentCode,
        codePath: routePaths.shipmentDetail(shipment.id),
        hubCode: shipment.destinationHubCode || shipment.receiverHubCode || shipmentHub(shipment),
        oppositeHubCode: shipment.originHubCode || shipment.senderHubCode || '---',
        customer: shipment.receiverName || shipment.receiverPhone || '---',
        status: shipment.currentStatus,
        statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
        owner: shipment.receiverName || shipment.receiverPhone || '---',
        amountText: formatMoney(shipment.codAmount),
        updatedAt: shipment.updatedAt,
        ageMinutes,
        note:
          shipment.currentStatus === 'DELIVERED'
            ? 'Đã giao, cần đối chiếu với quyết toán COD.'
            : 'Đang trong luồng phát/COD, cần theo dõi trước khi quyết toán.',
      };
    });
}

function buildBaggingRows(manifests: ManifestListItemDto[]): MonitorRow[] {
  return manifests.map((manifest) => {
    const updatedAt = manifest.updatedAt || manifest.sealedAt || manifest.createdAt || null;
    const ageMinutes = minutesSince(updatedAt);

    return {
      id: manifest.id,
      code: manifest.manifestCode,
      codePath: routePaths.manifestDetail(manifest.id),
      hubCode: manifest.originHubCode || '---',
      oppositeHubCode: manifest.destinationHubCode || '---',
      customer: manifest.manifestCode,
      status: manifest.status,
      statusLabel: formatManifestStatusLabel(manifest.status),
      owner: `${manifest.shipmentCount ?? 0} kiện`,
      amountText: formatAge(ageMinutes),
      updatedAt,
      ageMinutes,
      note:
        manifest.status === 'CREATED'
          ? 'Bao đã tạo, chờ bổ sung kiện và niêm phong.'
          : manifest.status === 'SEALED'
            ? 'Bao đã niêm phong, chờ nhận tại hub đích.'
            : 'Bao đã hoàn tất trạng thái hiện tại.',
    };
  });
}

function buildRows(
  mode: MonitorMode,
  shipments: ShipmentListItemDto[],
  tasks: TaskListItemDto[],
  manifests: ManifestListItemDto[],
): MonitorRow[] {
  switch (mode) {
    case 'received':
      return buildReceivedRows(shipments);
    case 'two-in-one':
      return buildTwoInOneRows(shipments, tasks);
    case 'advance':
      return buildAdvanceRows(shipments);
    case 'bagging':
      return buildBaggingRows(manifests);
    default:
      return [];
  }
}

function buildSummaries(mode: MonitorMode, rows: MonitorRow[]): MonitorSummary[] {
  const warningCount = rows.filter((row) => (row.ageMinutes ?? 0) >= 360).length;

  if (mode === 'advance') {
    const totalAmount = rows.reduce((sum, row) => {
      const digits = row.amountText.replace(/[^\d]/g, '');
      return sum + (digits ? Number(digits) : 0);
    }, 0);

    return [
      { label: 'Đơn COD', value: String(rows.length) },
      { label: 'Tiền cần kiểm soát', value: formatMoney(totalAmount), tone: 'warning' },
      { label: 'Cần rà soát', value: String(warningCount), tone: warningCount > 0 ? 'danger' : 'normal' },
    ];
  }

  if (mode === 'bagging') {
    const sealedCount = rows.filter((row) => row.status === 'SEALED').length;
    const openCount = rows.filter((row) => row.status === 'CREATED').length;
    return [
      { label: 'Tổng bao', value: String(rows.length) },
      { label: 'Đã niêm phong', value: String(sealedCount) },
      { label: 'Chờ đóng', value: String(openCount), tone: openCount > 0 ? 'warning' : 'normal' },
    ];
  }

  return [
    { label: 'Tổng dòng', value: String(rows.length) },
    { label: 'Quá 6 giờ', value: String(warningCount), tone: warningCount > 0 ? 'danger' : 'normal' },
    { label: 'Hub liên quan', value: String(new Set(rows.map((row) => row.hubCode).filter((hub) => hub !== '---')).size) },
  ];
}

export function OperationalDataMonitorPage({
  mode,
}: OperationalDataMonitorPageProps): React.JSX.Element {
  const config = configs[mode];
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const scopedHubCodes = session?.user.hubCodes ?? [];

  const [rows, setRows] = useState<MonitorRow[]>([]);
  const [query, setQuery] = useState('');
  const [hubCode, setHubCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [partialMessage, setPartialMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setRows([]);
      setErrorMessage('Bạn cần đăng nhập để tải dữ liệu giám sát.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPartialMessage(null);

    const [shipmentsResult, tasksResult, manifestsResult] = await Promise.allSettled([
      shipmentsClient.list(accessToken, {
        limit: DATA_LIMIT,
        offset: 0,
      }),
      tasksClient.list(accessToken, {}),
      manifestsClient.list(accessToken),
    ]);

    const shipments =
      shipmentsResult.status === 'fulfilled' ? shipmentsResult.value : [];
    const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
    const manifests =
      manifestsResult.status === 'fulfilled' ? manifestsResult.value : [];

    const failedMessages = [shipmentsResult, tasksResult, manifestsResult]
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => extractErrorMessage(result.reason));

    if (failedMessages.length === 3) {
      setRows([]);
      setErrorMessage(failedMessages[0]);
    } else {
      setRows(buildRows(mode, shipments, tasks, manifests));
      setPartialMessage(failedMessages.length > 0 ? `Một phần dữ liệu chưa tải được: ${failedMessages[0]}` : null);
    }

    setIsLoading(false);
  }, [accessToken, mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [query, hubCode, statusFilter, mode]);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((row) => matchesQuery(row, query))
        .filter((row) => matchesHub(row, hubCode))
        .filter((row) => (statusFilter ? row.status === statusFilter : true)),
    [hubCode, query, rows, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.status))).sort(),
    [rows],
  );
  const summaries = useMemo(() => buildSummaries(mode, filteredRows), [filteredRows, mode]);

  return (
    <section className="ops-data-monitor">
      <header className="ops-data-monitor__header">
        <div>
          <small>{config.groupCode}</small>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <div className="ops-data-monitor__summary" aria-label="Thống kê nhanh">
          {summaries.map((summary) => (
            <article
              key={summary.label}
              className={summary.tone ? `ops-data-monitor__summary-card ops-data-monitor__summary-card--${summary.tone}` : 'ops-data-monitor__summary-card'}
            >
              <span>{summary.label}</span>
              <strong>{summary.value}</strong>
            </article>
          ))}
        </div>
      </header>

      {scopedHubCodes.length > 0 ? (
        <p className="ops-data-monitor__scope">
          Tài khoản đang giới hạn dữ liệu theo bưu cục: {scopedHubCodes.join(', ')}.
        </p>
      ) : null}

      <section className="ops-data-monitor__toolbar">
        <label>
          <span>{config.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập từ khóa..."
          />
        </label>
        <label>
          <span>{config.hubLabel}</span>
          <input
            type="text"
            value={hubCode}
            onChange={(event) => setHubCode(event.target.value)}
            placeholder="Nhập mã hub..."
          />
        </label>
        <label>
          <span>Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="ops-data-monitor__actions">
          <button type="button" onClick={fetchData} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setHubCode('');
              setStatusFilter('');
            }}
          >
            Xóa lọc
          </button>
        </div>
      </section>

      {errorMessage ? <p className="ops-data-monitor__error">{errorMessage}</p> : null}
      {partialMessage && !errorMessage ? (
        <p className="ops-data-monitor__warning">{partialMessage}</p>
      ) : null}

      <section className="ops-data-monitor__table-wrap" aria-busy={isLoading}>
        {isLoading ? <div className="ops-data-monitor__loading">Đang tải dữ liệu...</div> : null}
        <table className="ops-data-monitor__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã nghiệp vụ</th>
              <th>{config.hubLabel}</th>
              <th>{config.columns.oppositeHub}</th>
              <th>{config.columns.owner}</th>
              <th>{config.columns.amount}</th>
              <th>Cập nhật</th>
              <th>Trạng thái</th>
              <th>Ghi chú xử lý</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, index) => (
              <tr key={`${row.id}-${row.code}`}>
                <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                <td>
                  {row.codePath ? (
                    <Link className="ops-data-monitor__code" to={row.codePath}>
                      {row.code}
                    </Link>
                  ) : (
                    <strong className="ops-data-monitor__code">{row.code}</strong>
                  )}
                  {row.codeTo ? <span>{row.codeTo}</span> : null}
                </td>
                <td>{row.hubCode}</td>
                <td>{row.oppositeHubCode}</td>
                <td>{row.owner}</td>
                <td className="ops-data-monitor__amount">{row.amountText}</td>
                <td>{formatDateTime(row.updatedAt)}</td>
                <td>
                  <span className={`ops-data-monitor__status ops-data-monitor__status--${statusClass(row.status)}`}>
                    {row.statusLabel}
                  </span>
                </td>
                <td>{row.note}</td>
              </tr>
            ))}
            {!isLoading && pagedRows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="ops-data-monitor__empty">{config.emptyText}</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <footer className="ops-data-monitor__pagination">
        <span>
          Hiển thị {pagedRows.length} / {filteredRows.length} dòng
        </span>
        <div>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trước
          </button>
          <strong>
            {page}/{totalPages}
          </strong>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Sau
          </button>
        </div>
      </footer>
    </section>
  );
}
