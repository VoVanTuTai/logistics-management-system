import React from 'react';
import { Link } from 'react-router-dom';

import type { PickupRequestListItemDto } from '../../features/pickups/pickups.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';

interface PickupRequestsTableProps {
  items: PickupRequestListItemDto[];
}

export function PickupRequestsTable({ items }: PickupRequestsTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Request</th>
          <th style={styles.headerCell}>Shipment</th>
          <th style={styles.headerCell}>Status</th>
          <th style={styles.headerCell}>Requested at</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.cell}>
              <Link to={routePaths.pickupDetail(item.id)}>{item.requestCode}</Link>
            </td>
            <td style={styles.cell}>{item.shipmentCode ?? 'N/A'}</td>
            <td style={styles.cell}>{item.status}</td>
            <td style={styles.cell}>{formatDateTime(item.requestedAt)}</td>
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

