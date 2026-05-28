import React, { useMemo, useState } from 'react';

import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { usePickupRequestsQuery } from '../../../../features/pickups/pickups.api';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import {
  EXCEPTION_BRANCH_STATUSES,
  RECEIVED_BRANCH_STATUSES,
  SENT_BRANCH_STATUSES,
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
  const pickupsQuery = usePickupRequestsQuery(accessToken, {}, { refetchInterval: 15000 });
  const hubsQuery = useHubsQuery(accessToken, {});

  const selectedHubCodes = useMemo(
    () => (hubFilter === 'ALL' ? assignedHubCodes : [hubFilter]),
    [assignedHubCodes, hubFilter],
  );
  const scopeTokens = useMemo(
    () => buildBranchScopeTokens(hubsQuery.data ?? [], selectedHubCodes),
    [hubsQuery.data, selectedHubCodes],
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
  const inventoryShipments = useMemo(
    () => scopedShipments.filter(isBranchInventoryShipment),
    [scopedShipments],
  );
  const exceptionRows = useMemo(
    () =>
      scopedShipments
        .filter((shipment) => EXCEPTION_BRANCH_STATUSES.has(normalizeBranchCode(shipment.currentStatus)))
        .slice(0, 20),
    [scopedShipments],
  );
  const hubOptions = useMemo(
    () =>
      Array.from(new Set(scopedShipments.map(resolveShipmentHub).concat(assignedHubCodes))).filter(Boolean).sort(),
    [assignedHubCodes, scopedShipments],
  );

  const receivedCount = shiftShipments.filter((shipment) =>
    RECEIVED_BRANCH_STATUSES.has(normalizeBranchCode(shipment.currentStatus)),
  ).length;
  const sentCount = shiftShipments.filter((shipment) =>
    SENT_BRANCH_STATUSES.has(normalizeBranchCode(shipment.currentStatus)),
  ).length;
  const deliveredRows = shiftShipments.filter(
    (shipment) => normalizeBranchCode(shipment.currentStatus) === 'DELIVERED',
  );
  const codReceivable = deliveredRows.reduce((sum, shipment) => sum + (shipment.codAmount ?? 0), 0);
  const codHandedOver = 0;
  const pickupCreatedCount = (pickupsQuery.data ?? []).filter(
    (pickup) => toBranchDateKey(pickup.requestedAt) === selectedDate,
  ).length;
  const isLoading =
    shipmentsQuery.isLoading ||
    deliveryTasksQuery.isLoading ||
    pickupsQuery.isLoading ||
    hubsQuery.isLoading;
  const loadError =
    shipmentsQuery.error ?? deliveryTasksQuery.error ?? pickupsQuery.error ?? hubsQuery.error ?? null;

  return (
    <section className="ops-branch-workflow">
      <header className="ops-branch-workflow__header">
        <div>
          <small>BRANCH_SHIFT_CLOSING</small>
          <h2>Chốt ca</h2>
          <p>
            Preview số liệu cuối ca từ shipment, pickup và task. Chưa có API ghi
            nhận chốt ca nên màn này chưa tạo bản ghi đóng ca chính thức.
          </p>
        </div>
        <div className="ops-branch-workflow__scope">
          <span>Trạng thái contract</span>
          <strong>Chưa có API ghi nhận chốt ca</strong>
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
          <span>Đơn nhận</span>
          <strong>{receivedCount + pickupCreatedCount}</strong>
        </article>
        <article>
          <span>Đơn gửi</span>
          <strong>{sentCount}</strong>
        </article>
        <article>
          <span>Đơn phát</span>
          <strong>{deliveredRows.length}</strong>
        </article>
        <article>
          <span>Đơn tồn cuối ca</span>
          <strong>{inventoryShipments.length}</strong>
        </article>
        <article data-tone="money">
          <span>COD phải thu</span>
          <strong>{formatBranchCurrency(codReceivable)}</strong>
        </article>
        <article data-tone="money">
          <span>COD đã giao</span>
          <strong>{formatBranchCurrency(codHandedOver)}</strong>
        </article>
        <article data-tone="danger">
          <span>Ngoại lệ</span>
          <strong>{exceptionRows.length}</strong>
        </article>
        <article>
          <span>Task giao trong ca</span>
          <strong>
            {(deliveryTasksQuery.data ?? []).filter((task) =>
              isShipmentInSelectedShift(task.updatedAt, selectedDate, selectedShift),
            ).length}
          </strong>
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
            <h3>Ngoại lệ cần xử lý trước khi chốt</h3>
            <span>{isLoading ? 'Đang tải...' : `${exceptionRows.length} dòng`}</span>
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
                {exceptionRows.map((shipment) => {
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
          {!isLoading && exceptionRows.length === 0 ? (
            <p className="ops-branch-workflow__empty">
              Không có ngoại lệ trong phạm vi ca hiện tại.
            </p>
          ) : null}
        </section>

        <aside className="ops-branch-workflow__panel">
          <header className="ops-branch-workflow__panel-head">
            <h3>Điều kiện chốt ca</h3>
          </header>
          <div className="ops-branch-workflow__stack">
            <p className="ops-branch-workflow__contract">
              Chưa có API ghi nhận chốt ca. Cần bổ sung endpoint tạo phiên chốt,
              lưu người chốt, hub, ca, tổng COD, danh sách ngoại lệ và audit log.
            </p>
            <ul className="ops-branch-workflow__mini-list">
              <li>
                <span>COD đã giao</span>
                <strong>Chưa có contract nộp tiền</strong>
              </li>
              <li>
                <span>Scan trong ca</span>
                <strong>Chưa có endpoint list scan</strong>
              </li>
              <li>
                <span>Trạng thái</span>
                <strong>Preview only</strong>
              </li>
            </ul>
          </div>
          <div className="ops-branch-workflow__actions">
            <button type="button" disabled title="Chưa có API ghi nhận chốt ca">
              Chốt ca
            </button>
          </div>
        </aside>
      </section>
    </section>
  );
}
