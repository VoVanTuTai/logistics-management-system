import React from 'react';
import { Link } from 'react-router-dom';

import type { ManifestListItemDto } from '../../features/manifests/manifests.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';

interface ManifestsTableProps {
  items: ManifestListItemDto[];
}

export function ManifestsTable({ items }: ManifestsTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Mã manifest</th>
          <th style={styles.headerCell}>Trạng thái</th>
          <th style={styles.headerCell}>Hub đi</th>
          <th style={styles.headerCell}>Hub đến</th>
          <th style={styles.headerCell}>Niêm phong lúc</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.cell}>
              <Link to={routePaths.manifestDetail(item.id)}>{item.manifestCode}</Link>
            </td>
            <td style={styles.cell}>{item.status}</td>
            <td style={styles.cell}>{item.originHubCode ?? 'Không có'}</td>
            <td style={styles.cell}>{item.destinationHubCode ?? 'Không có'}</td>
            <td style={styles.cell}>{formatDateTime(item.sealedAt)}</td>
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
