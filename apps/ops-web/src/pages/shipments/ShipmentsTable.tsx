import React from 'react';
import { Link } from 'react-router-dom';

import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';

interface ShipmentsTableProps {
  items: ShipmentListItemDto[];
  deliveryCourierByShipment: Map<string, string>;
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
            <th style={styles.headerCell}>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const checked = selectedSet.has(item.shipmentCode);
            const assignedCourier =
              deliveryCourierByShipment.get(normalizeShipmentCode(item.shipmentCode)) ?? 'Chưa bàn giao';

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
                  <Link style={styles.shipmentCodeLink} to={routePaths.shipmentDetail(item.shipmentCode)}>
                    {item.shipmentCode}
                  </Link>
                  <div style={styles.subText}>{item.receiverRegion ?? 'Chưa có khu vực'}</div>
                </td>
                <td style={styles.cell}>
                  <div style={styles.statusText}>{resolveShipmentStatusLabel(item)}</div>
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
                </td>
                <td style={styles.cell}>
                  <div>Tạo: {formatDateTime(item.createdAt)}</div>
                  <small style={styles.subText}>Cập nhật: {formatDateTime(item.updatedAt)}</small>
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
    minWidth: 1040,
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
    color: '#0f4c81',
    fontWeight: 800,
    textDecoration: 'none',
  },
  statusText: {
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
