import React from 'react';
import { Link } from 'react-router-dom';

import type { TaskListItemDto } from '../../features/tasks/tasks.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';

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
          <th style={styles.headerCell}>Task</th>
          <th style={styles.headerCell}>Type</th>
          <th style={styles.headerCell}>Status</th>
          <th style={styles.headerCell}>Shipment</th>
          <th style={styles.headerCell}>Sender</th>
          <th style={styles.headerCell}>Receiver</th>
          <th style={styles.headerCell}>Platform</th>
          <th style={styles.headerCell}>Delivery Area</th>
          <th style={styles.headerCell}>Courier</th>
          <th style={styles.headerCell}>Updated At</th>
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
            <td style={styles.cell}>{item.taskType}</td>
            <td style={styles.cell}>{item.status}</td>
            <td style={styles.cell}>{item.shipmentCode ?? 'N/A'}</td>
            <td style={styles.cell}>{item.senderName ?? 'N/A'}</td>
            <td style={styles.cell}>{item.receiverName ?? 'N/A'}</td>
            <td style={styles.cell}>
              <span style={styles.platformTag}>{item.platform ?? 'N/A'}</span>
            </td>
            <td style={styles.cell}>{item.deliveryArea ?? 'Unknown'}</td>
            <td style={styles.cell}>{item.assignedCourierId ?? 'N/A'}</td>
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
