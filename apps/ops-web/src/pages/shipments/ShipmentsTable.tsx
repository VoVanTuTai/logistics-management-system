import React from 'react';
import { Link } from 'react-router-dom';

import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';

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
          <th style={styles.headerCell}>Shipment</th>
          <th style={styles.headerCell}>Status</th>
          <th style={styles.headerCell}>Platform</th>
          <th style={styles.headerCell}>Sender</th>
          <th style={styles.headerCell}>Receiver</th>
          <th style={styles.headerCell}>Area</th>
          <th style={styles.headerCell}>Current Location</th>
          <th style={styles.headerCell}>Created</th>
          <th style={styles.headerCell}>Updated</th>
          <th style={styles.headerCell}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.cell}>
              <Link to={routePaths.shipmentDetail(item.shipmentCode)}>{item.shipmentCode}</Link>
            </td>
            <td style={styles.cell}>{item.currentStatus}</td>
            <td style={styles.cell}>{item.platform ?? 'N/A'}</td>
            <td style={styles.cell}>
              <div>{item.senderName ?? 'N/A'}</div>
              <small style={styles.subText}>{item.senderPhone ?? '-'}</small>
            </td>
            <td style={styles.cell}>
              <div>{item.receiverName ?? 'N/A'}</div>
              <small style={styles.subText}>{item.receiverPhone ?? '-'}</small>
            </td>
            <td style={styles.cell}>{item.receiverRegion ?? 'N/A'}</td>
            <td style={styles.cell}>{item.currentLocation ?? 'N/A'}</td>
            <td style={styles.cell}>{formatDateTime(item.createdAt)}</td>
            <td style={styles.cell}>{formatDateTime(item.updatedAt)}</td>
            <td style={styles.cell}>
              <div style={styles.actionGroup}>
                <button type="button" onClick={() => onPrepareReceive?.(item.shipmentCode)}>
                  Receive
                </button>
                <button type="button" onClick={() => onPrint?.(item)}>
                  Print waybill
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
