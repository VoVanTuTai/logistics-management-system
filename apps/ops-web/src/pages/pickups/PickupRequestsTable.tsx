import React from 'react';
import { Link } from 'react-router-dom';

import { routePaths } from '../../navigation/routes';
import { formatPickupStatusLabel } from '../../utils/logisticsLabels';

interface PickupRequestsTableProps {
  items: PickupApprovalRow[];
  selectedIds: string[];
  onToggleRow: (pickupId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}

export interface PickupApprovalRow {
  pickupId: string;
  shipmentCode: string | null;
  status: string;
  senderName: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  itemType: string | null;
  codAmount: number | null;
  shippingFee: number | null;
  selectable: boolean;
}

function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '-';
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`;
}

export function PickupRequestsTable({
  items,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: PickupRequestsTableProps): React.JSX.Element {
  const selectableIds = items.filter((item) => item.selectable).map((item) => item.pickupId);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((pickupId) => selectedIds.includes(pickupId));

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCellCheckbox}>
            <input
              type="checkbox"
              checked={allSelected}
              disabled={selectableIds.length === 0}
              onChange={(event) => onToggleAll(event.target.checked)}
            />
          </th>
          <th style={styles.headerCell}>Van don</th>
          <th style={styles.headerCell}>Trang thai lay hang</th>
          <th style={styles.headerCell}>Nguoi gui</th>
          <th style={styles.headerCell}>Nguoi nhan</th>
          <th style={styles.headerCell}>So dien thoai</th>
          <th style={styles.headerCell}>Loai hang</th>
          <th style={styles.headerCell}>Tien thu ho (COD)</th>
          <th style={styles.headerCell}>Phi van chuyen</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.pickupId}>
            <td style={styles.cellCheckbox}>
              <input
                type="checkbox"
                checked={selectedIds.includes(item.pickupId)}
                disabled={!item.selectable}
                onChange={(event) => onToggleRow(item.pickupId, event.target.checked)}
              />
            </td>
            <td style={styles.cell}>
              {item.shipmentCode ? (
                <Link to={routePaths.pickupDetail(item.pickupId)}>{item.shipmentCode}</Link>
              ) : (
                '-'
              )}
            </td>
            <td style={styles.cell}>{formatPickupStatusLabel(item.status)}</td>
            <td style={styles.cell}>{item.senderName ?? '-'}</td>
            <td style={styles.cell}>{item.receiverName ?? '-'}</td>
            <td style={styles.cell}>{item.receiverPhone ?? '-'}</td>
            <td style={styles.cell}>{item.itemType ?? '-'}</td>
            <td style={styles.cell}>{formatCurrency(item.codAmount)}</td>
            <td style={styles.cell}>{formatCurrency(item.shippingFee)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 12,
  },
  headerCell: {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '1px solid #d9def3',
  },
  headerCellCheckbox: {
    width: 36,
    textAlign: 'center',
    padding: '8px 4px',
    borderBottom: '1px solid #d9def3',
  },
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid #e7ebf8',
  },
  cellCheckbox: {
    width: 36,
    textAlign: 'center',
    padding: '8px 4px',
    borderBottom: '1px solid #e7ebf8',
  },
};
