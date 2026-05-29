import React, { useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { useCodDailySettlementQuery } from '../../../../features/payments/payment.api';
import type { CodDailySettlementRecordDto } from '../../../../features/payments/payment.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import {
  EXCEPTION_BRANCH_STATUSES,
  buildBranchScopeTokens,
  buildTaskByShipment,
  formatBranchCurrency,
  formatBranchDateTime,
  isBranchInventoryShipment,
  isShipmentInBranchScope,
  normalizeBranchCode,
  resolveShipmentHub,
  toBranchDateInputValue,
  toBranchDateKey,
} from '../shared/branchBusinessData';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import '../shared/BranchBusinessOperations.css';

type ShiftCode = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

const SHIFT_LABELS: Record<ShiftCode, string> = {
  MORNING: 'Ca sáng',
  AFTERNOON: 'Ca chiều',
  FULL_DAY: 'Cả ngày',
};

const INVENTORY_CHECK_STATUSES = new Set(['INVENTORY_CHECK']);

interface CourierCodReportRow {
  courierId: string;
  deliveredOrders: number;
  failedOrders: number;
  codTotal: number;
  remittedTotal: number;
  pendingTotal: number;
  source: 'payment' | 'preview';
}

function normalizeTaskStatus(task: TaskListItemDto | null | undefined): string {
  return normalizeBranchCode(task?.status);
}

function isDeliveryCompleted(shipment: ShipmentListItemDto, task: TaskListItemDto | null): boolean {
  return normalizeBranchCode(shipment.currentStatus) === 'DELIVERED' || normalizeTaskStatus(task) === 'COMPLETED';
}

function isDeliveryIssue(shipment: ShipmentListItemDto, task: TaskListItemDto | null): boolean {
  return EXCEPTION_BRANCH_STATUSES.has(normalizeBranchCode(shipment.currentStatus)) || normalizeTaskStatus(task) === 'CANCELLED';
}

function readCollectedAmount(record: CodDailySettlementRecordDto): number {
  return Math.max(0, record.collectedAmount ?? record.codAmount);
}

function isShipmentInSelectedShift(updatedAt: string, selectedDate: string, shift: ShiftCode): boolean {
  if (toBranchDateKey(updatedAt) !== selectedDate) {
    return false;
  }

  if (shift === 'FULL_DAY') {
    return true;
  }

  const hour = new Date(updatedAt).getHours();
  return shift === 'MORNING' ? hour < 12 : hour >= 12;
}

export function BranchShiftClosingPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeBranchCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const today = useMemo(() => toBranchDateInputValue(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedShift, setSelectedShift] = useState<ShiftCode>('FULL_DAY');
  const [hubFilter, setHubFilter] = useState(assignedHubCodes[0] ?? 'ALL');

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const deliveryTasksQuery = useTasksQuery(accessToken, { taskType: 'DELIVERY' }, {
    refetchInterval: 15000,
  });
  const hubsQuery = useHubsQuery(accessToken, {});

  const selectedHubCodes = useMemo(
    () => (hubFilter === 'ALL' ? assignedHubCodes : [hubFilter]),
    [assignedHubCodes, hubFilter],
  );
  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], selectedHubCodes),
    [hubsQuery.data, selectedHubCodes],
  );
  const settlementQuery = useCodDailySettlementQuery(
    accessToken,
    {
      date: selectedDate,
      hubCode: hubFilter === 'ALL' ? null : hubFilter,
      courierId: null,
      status: 'ALL',
    },
    { refetchInterval: 15000 },
  );
  const taskByShipment = useMemo(
    () => buildTaskByShipment(deliveryTasksQuery.data ?? [], 'DELIVERY'),
    [deliveryTasksQuery.data],
  );

  const scopedShipments = useMemo(
    () =>
      (shipmentsQuery.data ?? []).filter((shipment) =>
        isShipmentInBranchScope(shipment, selectedHubCodes, scopeTokens, canViewAllHubAreas),
      ),
    [canViewAllHubAreas, scopeTokens, selectedHubCodes, shipmentsQuery.data],
  );
  const shiftShipments = useMemo(
    () =>
      scopedShipments.filter((shipment) =>
        isShipmentInSelectedShift(shipment.updatedAt, selectedDate, selectedShift),
      ),
    [scopedShipments, selectedDate, selectedShift],
  );
  const shiftDeliveryTasks = useMemo(
    () =>
      (deliveryTasksQuery.data ?? []).filter((task) =>
        isShipmentInSelectedShift(task.updatedAt, selectedDate, selectedShift),
      ),
    [deliveryTasksQuery.data, selectedDate, selectedShift],
  );
  const assignedTaskRows = useMemo(
    () => shiftDeliveryTasks.filter((task) => Boolean(task.assignedCourierId)),
    [shiftDeliveryTasks],
  );
  const completedRows = useMemo(
    () =>
      shiftShipments.filter((shipment) =>
        isDeliveryCompleted(shipment, taskByShipment.get(normalizeBranchCode(shipment.shipmentCode)) ?? null),
      ),
    [shiftShipments, taskByShipment],
  );
  const issueRows = useMemo(
    () =>
      shiftShipments.filter((shipment) =>
        isDeliveryIssue(shipment, taskByShipment.get(normalizeBranchCode(shipment.shipmentCode)) ?? null),
      ),
    [shiftShipments, taskByShipment],
  );
  const inventoryShipments = useMemo(
    () => scopedShipments.filter(isBranchInventoryShipment),
    [scopedShipments],
  );
  const inventoryCheckedRows = useMemo(
    () =>
      shiftShipments.filter((shipment) =>
        INVENTORY_CHECK_STATUSES.has(normalizeBranchCode(shipment.currentStatus)),
      ),
    [shiftShipments],
  );
  const missingRows = useMemo(
    () =>
      issueRows.filter(
        (shipment) => !INVENTORY_CHECK_STATUSES.has(normalizeBranchCode(shipment.currentStatus)),
      ),
    [issueRows],
  );
  const hubOptions = useMemo(
    () =>
      Array.from(new Set(scopedShipments.map(resolveShipmentHub).concat(assignedHubCodes))).filter(Boolean).sort(),
    [assignedHubCodes, scopedShipments],
  );

  const deliveredRows = completedRows;
  const paymentRecords = settlementQuery.data?.records ?? [];
  const usePaymentCodData = !settlementQuery.isError && paymentRecords.length > 0;
  const courierCodRows = useMemo<CourierCodReportRow[]>(() => {
    const rowsByCourier = new Map<string, CourierCodReportRow>();

    const ensureRow = (courierId: string, source: CourierCodReportRow['source']) => {
      const key = courierId || 'Chưa xác định';
      const row =
        rowsByCourier.get(key) ??
        {
          courierId: key,
          deliveredOrders: 0,
          failedOrders: 0,
          codTotal: 0,
          remittedTotal: 0,
          pendingTotal: 0,
          source,
        };

      rowsByCourier.set(key, row);
      return row;
    };

    for (const shipment of shiftShipments) {
      const task = taskByShipment.get(normalizeBranchCode(shipment.shipmentCode)) ?? null;
      const row = ensureRow(task?.assignedCourierId ?? 'Chưa xác định', usePaymentCodData ? 'payment' : 'preview');

      if (isDeliveryCompleted(shipment, task)) {
        row.deliveredOrders += 1;
      }

      if (isDeliveryIssue(shipment, task)) {
        row.failedOrders += 1;
      }
    }

    if (usePaymentCodData) {
      for (const record of paymentRecords) {
        const row = ensureRow(record.courierId ?? 'Chưa xác định', 'payment');
        const amount = readCollectedAmount(record);

        row.codTotal += Math.max(0, record.codAmount);
        if (record.status === 'REMITTED') {
          row.remittedTotal += amount;
        }
        if (record.status === 'COLLECTED') {
          row.pendingTotal += amount;
        }
      }
    } else {
      for (const shipment of deliveredRows) {
        const codAmount = Math.max(0, shipment.codAmount ?? 0);
        if (codAmount <= 0) {
          continue;
        }

        const task = taskByShipment.get(normalizeBranchCode(shipment.shipmentCode)) ?? null;
        const row = ensureRow(task?.assignedCourierId ?? 'Chưa xác định', 'preview');
        row.codTotal += codAmount;
        row.pendingTotal += codAmount;
      }
    }

    return Array.from(rowsByCourier.values()).sort(
      (left, right) =>
        right.pendingTotal - left.pendingTotal ||
        right.codTotal - left.codTotal ||
        left.courierId.localeCompare(right.courierId),
    );
  }, [deliveredRows, paymentRecords, shiftShipments, taskByShipment, usePaymentCodData]);
  const codReceivable = courierCodRows.reduce((sum, row) => sum + row.codTotal, 0);
  const codHandedOver = courierCodRows.reduce((sum, row) => sum + row.remittedTotal, 0);
  const codPending = courierCodRows.reduce((sum, row) => sum + row.pendingTotal, 0);
  const isLoading =
    shipmentsQuery.isLoading ||
    deliveryTasksQuery.isLoading ||
    settlementQuery.isLoading ||
    hubsQuery.isLoading;
  const loadError =
    shipmentsQuery.error ?? deliveryTasksQuery.error ?? hubsQuery.error ?? null;

  return (
    <section className="ops-branch-workflow">
      <header className="ops-branch-workflow__header">
        <div>
          <small>BRANCH_END_OF_DAY_REPORT</small>
          <h2>Báo cáo cuối ngày</h2>
          <p>
            Tổng hợp dữ liệu cốt lõi khi vận hành giao hàng: đơn đã đẩy sang app courier,
            kết quả phát, tồn kho, thiếu hàng và COD theo từng courier.
          </p>
        </div>
        <div className="ops-branch-workflow__scope">
          <span>Nguồn COD</span>
          <strong>{usePaymentCodData ? 'Payment-service' : 'Preview từ shipment/task'}</strong>
        </div>
      </header>

      <section className="ops-branch-workflow__filters">
        <label>
          <span>Ngày</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
        <label>
          <span>Ca</span>
          <select
            value={selectedShift}
            onChange={(event) => setSelectedShift(event.target.value as ShiftCode)}
          >
            <option value="FULL_DAY">Cả ngày</option>
            <option value="MORNING">Ca sáng</option>
            <option value="AFTERNOON">Ca chiều</option>
          </select>
        </label>
        <label>
          <span>Hub</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            {canViewAllHubAreas ? <option value="ALL">Toàn bộ</option> : null}
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Preview</span>
          <input value={`${SHIFT_LABELS[selectedShift]} - ${selectedDate}`} readOnly disabled />
        </label>
      </section>

      <section className="ops-branch-workflow__kpis">
        <article>
          <span>Đã phát sang app courier</span>
          <strong>{assignedTaskRows.length}</strong>
        </article>
        <article>
          <span>Hoàn thành</span>
          <strong>{completedRows.length}</strong>
        </article>
        <article data-tone="danger">
          <span>Không hoàn thành / có vấn đề</span>
          <strong>{issueRows.length}</strong>
        </article>
        <article>
          <span>Đã kiểm tồn kho</span>
          <strong>{inventoryCheckedRows.length}</strong>
        </article>
        <article data-tone="danger">
          <span>Đơn thiếu chưa về kho</span>
          <strong>{missingRows.length}</strong>
        </article>
        <article>
          <span>Tồn kho hiện tại</span>
          <strong>{inventoryShipments.length}</strong>
        </article>
        <article data-tone="money">
          <span>Tổng COD cần kiểm soát</span>
          <strong>{formatBranchCurrency(codReceivable)}</strong>
        </article>
        <article data-tone="money">
          <span>COD đã nộp</span>
          <strong>{formatBranchCurrency(codHandedOver)}</strong>
        </article>
        <article data-tone="money">
          <span>COD chưa nộp</span>
          <strong>{formatBranchCurrency(codPending)}</strong>
        </article>
      </section>

      {loadError ? (
        <p className="ops-branch-workflow__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="ops-branch-workflow__grid">
        <section className="ops-branch-workflow__panel">
          <header className="ops-branch-workflow__panel-head">
            <h3>Đơn giao không hoàn thành / có ghi nhận vấn đề</h3>
            <span>{isLoading ? 'Đang tải...' : `${issueRows.length} dòng`}</span>
          </header>
          {isLoading ? (
            <p className="ops-branch-workflow__loading">Đang tổng hợp số liệu ca...</p>
          ) : null}
          <div className="ops-branch-workflow__table-wrap">
            <table className="ops-branch-workflow__table">
              <thead>
                <tr>
                  <th>Mã vận đơn</th>
                  <th>Trạng thái</th>
                  <th>Hub</th>
                  <th>Courier</th>
                  <th>COD</th>
                  <th>Cập nhật cuối</th>
                </tr>
              </thead>
              <tbody>
                {issueRows.map((shipment) => {
                  const task = taskByShipment.get(normalizeBranchCode(shipment.shipmentCode));

                  return (
                    <tr key={shipment.shipmentCode}>
                      <td>
                        <CopyableShipmentCode
                          code={shipment.shipmentCode}
                          className="ops-branch-workflow__code"
                        />
                      </td>
                      <td>{formatShipmentStatusLabel(shipment.currentStatus)}</td>
                      <td>{resolveShipmentHub(shipment)}</td>
                      <td>{task?.assignedCourierId ?? 'Chưa bàn giao'}</td>
                      <td className="ops-branch-workflow__money">
                        {formatBranchCurrency(shipment.codAmount)}
                      </td>
                      <td>{formatBranchDateTime(shipment.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!isLoading && issueRows.length === 0 ? (
            <p className="ops-branch-workflow__empty">
              Không có đơn giao lỗi hoặc vấn đề phát sinh trong phạm vi báo cáo.
            </p>
          ) : null}
        </section>

        <aside className="ops-branch-workflow__panel">
          <header className="ops-branch-workflow__panel-head">
            <h3>Diễn giải vận hành</h3>
          </header>
          <div className="ops-branch-workflow__stack">
            <p className="ops-branch-workflow__contract">
              Báo cáo này là màn tổng hợp vận hành từ dữ liệu hiện có. COD ưu tiên lấy
              từ payment-service; nếu chưa có bản ghi COD thì hiển thị preview theo đơn
              đã giao và courier được gán.
            </p>
            <ul className="ops-branch-workflow__mini-list">
              <li>
                <span>Đã phát sang app</span>
                <strong>{assignedTaskRows.length} task DELIVERY có courier</strong>
              </li>
              <li>
                <span>Tỷ lệ hoàn thành</span>
                <strong>
                  {assignedTaskRows.length > 0
                    ? `${Math.round((completedRows.length / assignedTaskRows.length) * 100)}%`
                    : '0%'}
                </strong>
              </li>
              <li>
                <span>COD chưa nộp</span>
                <strong>{formatBranchCurrency(codPending)}</strong>
              </li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="ops-branch-workflow__grid ops-branch-workflow__grid--balanced">
        <section className="ops-branch-workflow__panel">
          <header className="ops-branch-workflow__panel-head">
            <h3>COD theo courier</h3>
            <span>
              {settlementQuery.isError
                ? 'Fallback preview'
                : usePaymentCodData
                  ? `${courierCodRows.length} courier`
                  : 'Preview chưa có settlement'}
            </span>
          </header>
          <div className="ops-branch-workflow__table-wrap">
            <table className="ops-branch-workflow__table">
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Đơn hoàn thành</th>
                  <th>Đơn lỗi</th>
                  <th>Tổng COD</th>
                  <th>Đã nộp</th>
                  <th>Chưa nộp</th>
                  <th>Nguồn</th>
                </tr>
              </thead>
              <tbody>
                {courierCodRows.map((row) => (
                  <tr key={row.courierId}>
                    <td><strong>{row.courierId}</strong></td>
                    <td>{row.deliveredOrders}</td>
                    <td>{row.failedOrders}</td>
                    <td className="ops-branch-workflow__money">{formatBranchCurrency(row.codTotal)}</td>
                    <td className="ops-branch-workflow__money">{formatBranchCurrency(row.remittedTotal)}</td>
                    <td className="ops-branch-workflow__money">{formatBranchCurrency(row.pendingTotal)}</td>
                    <td>
                      <span className="ops-branch-workflow__badge">
                        {row.source === 'payment' ? 'Payment' : 'Preview'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isLoading && courierCodRows.length === 0 ? (
            <p className="ops-branch-workflow__empty">Chưa có dữ liệu COD/courier trong phạm vi báo cáo.</p>
          ) : null}
        </section>

        <section className="ops-branch-workflow__panel">
          <header className="ops-branch-workflow__panel-head">
            <h3>Đơn thiếu chưa về kiểm kho</h3>
            <span>{missingRows.length} dòng</span>
          </header>
          <div className="ops-branch-workflow__table-wrap">
            <table className="ops-branch-workflow__table">
              <thead>
                <tr>
                  <th>Mã vận đơn</th>
                  <th>Trạng thái</th>
                  <th>Courier</th>
                  <th>Cập nhật cuối</th>
                </tr>
              </thead>
              <tbody>
                {missingRows.map((shipment) => {
                  const task = taskByShipment.get(normalizeBranchCode(shipment.shipmentCode));

                  return (
                    <tr key={shipment.shipmentCode}>
                      <td>
                        <CopyableShipmentCode
                          code={shipment.shipmentCode}
                          className="ops-branch-workflow__code"
                        />
                      </td>
                      <td>{formatShipmentStatusLabel(shipment.currentStatus)}</td>
                      <td>{task?.assignedCourierId ?? 'Chưa xác định'}</td>
                      <td>{formatBranchDateTime(shipment.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!isLoading && missingRows.length === 0 ? (
            <p className="ops-branch-workflow__empty">Không có đơn thiếu cần đối soát kho.</p>
          ) : null}
        </section>
      </section>
    </section>
  );
}
