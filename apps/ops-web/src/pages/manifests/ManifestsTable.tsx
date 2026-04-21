import React from 'react';
import { Link } from 'react-router-dom';

import type { ManifestListItemDto } from '../../features/manifests/manifests.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatManifestStatusLabel } from '../../utils/logisticsLabels';

interface ManifestsTableProps {
  items: ManifestListItemDto[];
  deletingManifestId?: string | null;
  onDeleteManifest: (item: ManifestListItemDto) => void;
  onPrintManifest: (item: ManifestListItemDto) => void;
}

export function ManifestsTable({
  items,
  deletingManifestId,
  onDeleteManifest,
  onPrintManifest,
}: ManifestsTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Ma bao</th>
          <th style={styles.headerCell}>Trạng thái</th>
          <th style={styles.headerCell}>Hub di</th>
          <th style={styles.headerCell}>Hub dich</th>
          <th style={styles.headerCell}>Niem phong luc</th>
          <th style={styles.headerCell}>Hanh dong</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const canDelete = item.status === 'CREATED';
          const deleting = deletingManifestId === item.id;

          return (
            <tr key={item.id}>
              <td style={styles.cell}>
                <Link to={routePaths.manifestDetail(item.id)}>{item.manifestCode}</Link>
              </td>
              <td style={styles.cell}>{formatManifestStatusLabel(item.status)}</td>
              <td style={styles.cell}>{item.originHubCode ?? 'Không có'}</td>
              <td style={styles.cell}>{item.destinationHubCode ?? 'Không có'}</td>
              <td style={styles.cell}>{formatDateTime(item.sealedAt)}</td>
              <td style={styles.cell}>
                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={() => onPrintManifest(item)}
                    style={styles.printButton}
                  >
                    In ma bao
                  </button>
                  <button
                    type="button"
                    disabled={!canDelete || deleting}
                    onClick={() => onDeleteManifest(item)}
                    style={{
                      ...styles.deleteButton,
                      opacity: !canDelete || deleting ? 0.55 : 1,
                      cursor: !canDelete || deleting ? 'not-allowed' : 'pointer',
                    }}
                    title={
                      canDelete
                        ? 'Xóa mã bao'
                        : `Chỉ xóa được bao đang ở trạng thái ${formatManifestStatusLabel('CREATED')}`
                    }
                  >
                    {deleting ? 'Đang xóa...' : 'Xóa mã bao'}
                  </button>
                </div>
              </td>
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
    verticalAlign: 'top',
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  printButton: {
    border: '1px solid #1d4ed8',
    borderRadius: 8,
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    padding: '4px 10px',
    fontWeight: 600,
  },
  deleteButton: {
    border: '1px solid #b91c1c',
    borderRadius: 8,
    backgroundColor: '#b91c1c',
    color: '#ffffff',
    padding: '4px 10px',
    fontWeight: 600,
  },
};
