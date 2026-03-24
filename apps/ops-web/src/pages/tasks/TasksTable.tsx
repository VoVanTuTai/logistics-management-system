import React from 'react';
import { Link } from 'react-router-dom';

import type { TaskListItemDto } from '../../features/tasks/tasks.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatTaskStatusLabel, formatTaskTypeLabel } from '../../utils/logisticsLabels';

interface TasksTableProps {
  items: TaskListItemDto[];
  selectedTaskIds?: string[];
  allSelectableSelected?: boolean;
  onToggleTaskSelection?: (taskId: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;
}

export function TasksTable({
  items,
  selectedTaskIds = [],
  allSelectableSelected = false,
  onToggleTaskSelection,
  onToggleSelectAll,
}: TasksTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>
            <input
              type="checkbox"
              checked={allSelectableSelected}
              disabled={!onToggleSelectAll}
              onChange={(event) => onToggleSelectAll?.(event.currentTarget.checked)}
            />
          </th>
          <th style={styles.headerCell}>Tac vu</th>
          <th style={styles.headerCell}>Loai</th>
          <th style={styles.headerCell}>Trang thai</th>
          <th style={styles.headerCell}>Van don</th>
          <th style={styles.headerCell}>Nguoi gui</th>
          <th style={styles.headerCell}>Nguoi nhan</th>
          <th style={styles.headerCell}>Nen tang</th>
          <th style={styles.headerCell}>Khu vuc giao</th>
          <th style={styles.headerCell}>Nhan vien giao</th>
          <th style={styles.headerCell}>Cap nhat luc</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.cell}>
              <input
                type="checkbox"
                checked={selectedTaskIds.includes(item.id)}
                disabled={!item.isSelectable || !onToggleTaskSelection}
                onChange={(event) =>
                  onToggleTaskSelection?.(item.id, event.currentTarget.checked)
                }
              />
            </td>
            <td style={styles.cell}>
              <Link to={routePaths.taskDetail(item.id)}>{item.taskCode}</Link>
            </td>
            <td style={styles.cell}>{formatTaskTypeLabel(item.taskType)}</td>
            <td style={styles.cell}>{formatTaskStatusLabel(item.status)}</td>
            <td style={styles.cell}>{item.shipmentCode ?? 'Khong co'}</td>
            <td style={styles.cell}>{item.senderName ?? 'Khong co'}</td>
            <td style={styles.cell}>{item.receiverName ?? 'Khong co'}</td>
            <td style={styles.cell}>
              <span style={styles.platformTag}>{item.platform ?? 'Khong co'}</span>
            </td>
            <td style={styles.cell}>{item.deliveryArea ?? 'Khong xac dinh'}</td>
            <td style={styles.cell}>{item.assignedCourierId ?? 'Khong co'}</td>
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
  platformTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 999,
    border: '1px solid #d9def3',
    backgroundColor: '#f3f6ff',
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
};
