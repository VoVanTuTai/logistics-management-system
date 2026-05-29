import React from 'react';
import { Link } from 'react-router-dom';

import type { NdrCaseListItemDto } from '../../features/ndr/ndr.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatAnyCodeLabel, formatNdrStatusLabel } from '../../utils/logisticsLabels';

interface NdrCasesTableProps {
  items: NdrCaseListItemDto[];
  courierByShipmentCode?: Map<string, string>;
}

export function NdrCasesTable({
  items,
  courierByShipmentCode = new Map(),
}: NdrCasesTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Mã NDR</th>
          <th style={styles.headerCell}>Vận đơn</th>
          <th style={styles.headerCell}>Trạng thái</th>
          <th style={styles.headerCell}>Lý do</th>
          <th style={styles.headerCell}>Courier</th>
          <th style={styles.headerCell}>Cập nhật lúc</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const courierId = courierByShipmentCode.get(item.shipmentCode) ?? null;
          return (
            <tr key={item.id}>
              <td style={styles.cell}>
                <Link to={routePaths.ndrDetail(item.id)}>{item.id}</Link>
              </td>
              <td style={styles.cell}>{item.shipmentCode}</td>
              <td style={styles.cell}>{formatNdrStatusLabel(item.status)}</td>
              <td style={styles.cell}>{formatAnyCodeLabel(item.reasonCode)}</td>
              <td style={styles.cell}>
                {courierId ? (
                  <Link style={styles.chatLink} to={routePaths.opsChatWithCourier(courierId)}>
                    Chat {courierId}
                  </Link>
                ) : (
                  'Chưa có'
                )}
              </td>
              <td style={styles.cell}>{formatDateTime(item.updatedAt)}</td>
            </tr>
          );
        })}
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
  chatLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    color: 'var(--ops-primary)',
    padding: '0 10px',
    fontSize: 12,
    fontWeight: 700,
    textDecoration: 'none',
  },
};
