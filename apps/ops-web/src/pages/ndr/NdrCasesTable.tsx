import React from 'react';
import { Link } from 'react-router-dom';

import type { NdrCaseListItemDto } from '../../features/ndr/ndr.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';

interface NdrCasesTableProps {
  items: NdrCaseListItemDto[];
}

export function NdrCasesTable({ items }: NdrCasesTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>NDR ID</th>
          <th style={styles.headerCell}>Vận đơn</th>
          <th style={styles.headerCell}>Trạng thái</th>
          <th style={styles.headerCell}>Lý do</th>
          <th style={styles.headerCell}>Cập nhật lúc</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.cell}>
              <Link to={routePaths.ndrDetail(item.id)}>{item.id}</Link>
            </td>
            <td style={styles.cell}>{item.shipmentCode}</td>
            <td style={styles.cell}>{item.status}</td>
            <td style={styles.cell}>{item.reasonCode ?? 'Không có'}</td>
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
