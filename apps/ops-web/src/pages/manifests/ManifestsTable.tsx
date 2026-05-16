import React from 'react';
import { Link } from 'react-router-dom';

import type { ManifestListItemDto } from '../../features/manifests/manifests.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatManifestStatusLabel } from '../../utils/logisticsLabels';

import './ManifestsTable.css';

interface ManifestsTableProps {
  items: ManifestListItemDto[];
  deletingManifestId?: string | null;
  onDeleteManifest: (item: ManifestListItemDto) => void;
  onPrintManifest: (item: ManifestListItemDto) => void;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'CREATED': return 'mt-badge--created';
    case 'SEALED': return 'mt-badge--sealed';
    case 'RECEIVED': return 'mt-badge--received';
    case 'CLOSED': return 'mt-badge--closed';
    default: return 'mt-badge--default';
  }
}

export function ManifestsTable({
  items,
  deletingManifestId,
  onDeleteManifest,
  onPrintManifest,
}: ManifestsTableProps): React.JSX.Element {
  return (
    <div className="manifests-table-wrap">
      <table className="manifests-table">
        <thead>
          <tr>
            <th>Mã bao</th>
            <th>Trạng thái</th>
            <th>Hub đi</th>
            <th>Hub đích</th>
            <th>Số kiện</th>
            <th>Niêm phong lúc</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const canDelete = item.status === 'CREATED';
            const deleting = deletingManifestId === item.id;

            return (
              <tr key={item.id}>
                <td>
                  <Link to={routePaths.manifestDetail(item.id)} className="manifests-table__code-link">
                    {item.manifestCode}
                  </Link>
                </td>
                <td>
                  <span className={`mt-badge ${getStatusBadgeClass(item.status)}`}>
                    {formatManifestStatusLabel(item.status)}
                  </span>
                </td>
                <td className="manifests-table__hub">{item.originHubCode ?? '—'}</td>
                <td className="manifests-table__hub">{item.destinationHubCode ?? '—'}</td>
                <td className="manifests-table__count">{item.shipmentCount ?? '—'}</td>
                <td className="manifests-table__time">{formatDateTime(item.sealedAt)}</td>
                <td>
                  <div className="manifests-table__actions">
                    <button
                      type="button"
                      onClick={() => onPrintManifest(item)}
                      className="mt-action-btn mt-action-btn--print"
                    >
                      🖨 In mã bao
                    </button>
                    <button
                      type="button"
                      disabled={!canDelete || deleting}
                      onClick={() => onDeleteManifest(item)}
                      className="mt-action-btn mt-action-btn--delete"
                      title={
                        canDelete
                          ? 'Xóa mã bao'
                          : `Chỉ xóa được bao đang ở trạng thái ${formatManifestStatusLabel('CREATED')}`
                      }
                    >
                      {deleting ? '⏳ Đang xóa...' : '🗑 Xóa'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
