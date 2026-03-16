import React from 'react';
import { Link } from 'react-router-dom';

import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';

interface ShipmentsTableProps {
  items: ShipmentListItemDto[];
}

export function ShipmentsTable({ items }: ShipmentsTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Shipment</th>
          <th style={styles.headerCell}>Status</th>
          <th style={styles.headerCell}>Current location</th>
          <th style={styles.headerCell}>Updated at</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.cell}>
              <Link to={routePaths.shipmentDetail(item.id)}>{item.shipmentCode}</Link>
            </td>
            <td style={styles.cell}>{item.currentStatus}</td>
            <td style={styles.cell}>{item.currentLocation ?? 'N/A'}</td>
            <td style={styles.cell}>{formatDateTime(item.updatedAt)}</td>
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
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid #e7ebf8',
  },
};

