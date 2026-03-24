import React from 'react';

import type { TrackingTimelineEventDto } from '../../features/tracking/tracking.types';
import { formatDateTime } from '../../utils/format';
import {
  formatShipmentStatusLabel,
  formatTrackingEventSourceLabel,
  formatTrackingEventTypeLabel,
} from '../../utils/logisticsLabels';

interface TrackingTimelineTableProps {
  items: TrackingTimelineEventDto[];
}

export function TrackingTimelineTable({
  items,
}: TrackingTimelineTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Su kien</th>
          <th style={styles.headerCell}>Nguon</th>
          <th style={styles.headerCell}>Trang thai sau su kien</th>
          <th style={styles.headerCell}>Vi tri</th>
          <th style={styles.headerCell}>Thoi diem xay ra</th>
        </tr>
      </thead>
      <tbody>
        {items.map((event) => (
          <tr key={event.id}>
            <td style={styles.cell}>{formatTrackingEventTypeLabel(event.eventType)}</td>
            <td style={styles.cell}>{formatTrackingEventSourceLabel(event.eventSource)}</td>
            <td style={styles.cell}>{formatShipmentStatusLabel(event.statusAfterEvent)}</td>
            <td style={styles.cell}>{event.locationCode ?? 'Khong co'}</td>
            <td style={styles.cell}>{formatDateTime(event.occurredAt)}</td>
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
