import React from 'react';
import { Link } from 'react-router-dom';

import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';

interface ShipmentsTableProps {
  items: ShipmentListItemDto[];
  onPrint?: (shipment: ShipmentListItemDto) => void;
  onPrepareReceive?: (shipmentCode: string) => void;
}

export function ShipmentsTable({
  items,
  onPrint,
  onPrepareReceive,
}: ShipmentsTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Van don</th>
          <th style={styles.headerCell}>Trang thai</th>
          <th style={styles.headerCell}>Nen tang</th>
          <th style={styles.headerCell}>Nguoi gui</th>
          <th style={styles.headerCell}>Nguoi nhan</th>
          <th style={styles.headerCell}>Khu vuc</th>
          <th style={styles.headerCell}>Vi tri hien tai</th>
          <th style={styles.headerCell}>Tao luc</th>
          <th style={styles.headerCell}>Cap nhat luc</th>
          <th style={styles.headerCell}>Hanh dong</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.cell}>
              <Link to={routePaths.shipmentDetail(item.shipmentCode)}>{item.shipmentCode}</Link>
            </td>
            <td style={styles.cell}>{formatShipmentStatusLabel(item.currentStatus)}</td>
            <td style={styles.cell}>{item.platform ?? 'Khong co'}</td>
            <td style={styles.cell}>
              <div>{item.senderName ?? 'Khong co'}</div>
              <small style={styles.subText}>{item.senderPhone ?? '-'}</small>
            </td>
            <td style={styles.cell}>
              <div>{item.receiverName ?? 'Khong co'}</div>
              <small style={styles.subText}>{item.receiverPhone ?? '-'}</small>
            </td>
            <td style={styles.cell}>{item.receiverRegion ?? 'Khong co'}</td>
            <td style={styles.cell}>{item.currentLocation ?? 'Khong co'}</td>
            <td style={styles.cell}>{formatDateTime(item.createdAt)}</td>
            <td style={styles.cell}>{formatDateTime(item.updatedAt)}</td>
            <td style={styles.cell}>
              <div style={styles.actionGroup}>
                <button type="button" onClick={() => onPrepareReceive?.(item.shipmentCode)}>
                  Quet nhan
                </button>
                <button type="button" onClick={() => onPrint?.(item)}>
                  In van don
                </button>
              </div>
            </td>
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
    whiteSpace: 'nowrap',
  },
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid #e7ebf8',
    verticalAlign: 'top',
  },
  subText: {
    color: '#5262a6',
    fontSize: 12,
  },
  actionGroup: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
};
