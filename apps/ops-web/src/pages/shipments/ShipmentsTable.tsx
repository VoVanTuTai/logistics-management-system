import React from 'react';
import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';
import type { TaskListItemDto } from '../../features/tasks/tasks.types';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel, formatTaskStatusLabel } from '../../utils/logisticsLabels';
import { CopyableShipmentCode } from '../shared/CopyableShipmentCode';

interface ShipmentsTableProps {
  items: ShipmentListItemDto[];
  deliveryCourierByShipment: Map<string, string>;
  deliveryTaskByShipment: Map<string, TaskListItemDto>;
  selectedShipmentCodes: string[];
  onToggleShipment: (shipmentCode: string, checked: boolean) => void;
  onToggleAllVisible: (checked: boolean) => void;
}

function resolveShipmentStatusLabel(item: ShipmentListItemDto): string {
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

export function ShipmentsTable({
  items,
  deliveryCourierByShipment,
  deliveryTaskByShipment,
  selectedShipmentCodes,
  onToggleShipment,
  onToggleAllVisible,
}: ShipmentsTableProps): React.JSX.Element {
  const selectedSet = new Set(selectedShipmentCodes);
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedSet.has(item.shipmentCode));
  const someVisibleSelected = items.some((item) => selectedSet.has(item.shipmentCode));

  return (
    <div style={styles.tableShell}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.headerCell, ...styles.selectCell }}>
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
            <th style={styles.headerCell}>Vận đơn</th>
            <th style={styles.headerCell}>Trạng thái</th>
            <th style={styles.headerCell}>Nền tảng</th>
            <th style={styles.headerCell}>Người gửi</th>
            <th style={styles.headerCell}>Người nhận</th>
            <th style={styles.headerCell}>Luồng vận hành</th>
            <th style={styles.headerCell}>Mốc trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const checked = selectedSet.has(item.shipmentCode);
            const normalizedShipmentCode = normalizeShipmentCode(item.shipmentCode);
            const assignedCourier =
              deliveryCourierByShipment.get(normalizedShipmentCode) ?? 'Chưa bàn giao';
            const deliveryTask = deliveryTaskByShipment.get(normalizedShipmentCode) ?? null;

            return (
              <tr key={item.id} style={checked ? styles.selectedRow : undefined}>
                <td style={{ ...styles.cell, ...styles.selectCell }}>
                  <input
                    type="checkbox"
                    aria-label={`Chọn vận đơn ${item.shipmentCode}`}
                    checked={checked}
                    onChange={(event) => onToggleShipment(item.shipmentCode, event.target.checked)}
                  />
                </td>
                <td style={styles.cell}>
                  <CopyableShipmentCode code={item.shipmentCode} />
                  <div style={styles.subText}>{item.receiverRegion ?? 'Chưa có khu vực'}</div>
                </td>
                <td style={styles.cell}>
                  <div style={styles.statusText}>{resolveShipmentStatusLabel(item)}</div>
                  <small style={styles.statusCode}>{item.currentStatus}</small>
                  {item.requiresLabelReprint ? (
                    <small style={styles.reprintWarning}>Cần in lại tem mới</small>
                  ) : null}
                  {item.isOperationLocked ? (
                    <small style={styles.lockWarning}>Đang chặn thao tác</small>
                  ) : null}
                </td>
                <td style={styles.cell}>{item.platform ?? 'Không có'}</td>
                <td style={styles.cell}>
                  <div>{item.senderName ?? 'Không có'}</div>
                  <small style={styles.subText}>{item.senderPhone ?? '-'}</small>
                </td>
                <td style={styles.cell}>
                  <div>{item.receiverName ?? 'Không có'}</div>
                  <small style={styles.subText}>{item.receiverPhone ?? '-'}</small>
                </td>
                <td style={styles.cell}>
                  <div>{item.currentLocation ?? 'Chưa có vị trí'}</div>
                  <small style={styles.subText}>
                    Hub đích: {item.receiverHubCode ?? item.destinationHubCode ?? '-'}
                  </small>
                  <small style={styles.subText}>Courier: {assignedCourier}</small>
                  <small style={styles.subText}>
                    Task giao: {deliveryTask ? formatTaskStatusLabel(deliveryTask.status) : 'Chưa tạo'}
                  </small>
                </td>
                <td style={styles.cell}>
                  <div>Trạng thái: {formatDateTime(item.updatedAt)}</div>
                  <small style={styles.subText}>Tạo vận đơn: {formatDateTime(item.createdAt)}</small>
                  <small style={styles.subText}>
                    Task giao: {deliveryTask ? formatDateTime(deliveryTask.updatedAt) : 'Chưa có'}
                  </small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tableShell: {
    marginTop: 12,
    overflowX: 'auto',
    border: '1px solid #d9def3',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 1160,
  },
  headerCell: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '1px solid #d9def3',
    backgroundColor: '#f8faff',
    color: '#1f2b6f',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  cell: {
    padding: '10px 12px',
    borderBottom: '1px solid #e7ebf8',
    verticalAlign: 'top',
    color: '#152052',
    fontSize: 13,
  },
  selectCell: {
    width: 44,
    textAlign: 'center',
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
  },
  statusCode: {
    display: 'block',
    marginTop: 3,
    color: '#64748b',
    fontSize: 11,
    fontWeight: 700,
  },
  subText: {
    display: 'block',
    color: '#5262a6',
    fontSize: 12,
  },
  reprintWarning: {
    display: 'inline-block',
    marginTop: 4,
    color: '#b42318',
    fontWeight: 700,
  },
  lockWarning: {
    display: 'inline-block',
    marginTop: 4,
    color: '#9a3412',
    fontWeight: 700,
  },
};
