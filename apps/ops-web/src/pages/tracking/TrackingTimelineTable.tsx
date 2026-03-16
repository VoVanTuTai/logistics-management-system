import React from 'react';

import type { TrackingTimelineEventDto } from '../../features/tracking/tracking.types';
import { formatDateTime } from '../../utils/format';

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
          <th style={styles.headerCell}>Event</th>
          <th style={styles.headerCell}>Source</th>
          <th style={styles.headerCell}>Status after</th>
          <th style={styles.headerCell}>Location</th>
          <th style={styles.headerCell}>Occurred at</th>
        </tr>
      </thead>
      <tbody>
        {items.map((event) => (
          <tr key={event.id}>
            <td style={styles.cell}>{event.eventType}</td>
            <td style={styles.cell}>{event.eventSource}</td>
            <td style={styles.cell}>{event.statusAfterEvent ?? 'N/A'}</td>
            <td style={styles.cell}>{event.locationCode ?? 'N/A'}</td>
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
