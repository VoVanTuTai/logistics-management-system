import React from 'react';

import type { TrackingTimelineEventDto } from '../../features/tracking/tracking.types';
import { formatDateTime } from '../../utils/format';

interface TrackingTimelineTableProps {
  items: TrackingTimelineEventDto[];
}

export function TrackingTimelineTable({
  items,
}: TrackingTimelineTableProps): React.JSX.Element {
  const renderSourceBadge = (source: string, note?: string | null) => {
    const isAuto =
      source.toLowerCase().includes('hệ thống') ||
      (note && note.includes('Hệ thống tự động')) ||
      (note && note.includes('🤖'));

    if (isAuto) {
      return (
        <span style={styles.autoBadge}>
          🤖 Tự động (Hệ thống)
        </span>
      );
    }

    return (
      <span style={styles.manualBadge}>
        👤 {source}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.headerCell}>Sự kiện hành trình</th>
            <th style={styles.headerCell}>Nguồn điều phối / Tác nhân</th>
            <th style={styles.headerCell}>Trạng thái</th>
            <th style={styles.headerCell}>Vị trí thực hiện</th>
            <th style={styles.headerCell}>Thời điểm</th>
          </tr>
        </thead>
        <tbody>
          {items.map((event) => (
            <tr key={event.id} style={styles.row}>
              <td style={styles.cell}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                  {event.eventType}
                </div>
                {event.note ? (
                  <div style={styles.noteBox}>
                    {event.note}
                  </div>
                ) : event.eventTypeCode ? (
                  <small style={styles.subtle}>{event.eventTypeCode}</small>
                ) : null}
              </td>
              <td style={styles.cell}>
                {renderSourceBadge(event.eventSource, event.note)}
              </td>
              <td style={styles.cell}>
                <span style={styles.statusBadge}>
                  {event.statusAfterEvent ?? 'Không có'}
                </span>
              </td>
              <td style={styles.cell}>
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  📍 {event.locationText ?? event.locationCode ?? 'Chưa xác định'}
                </div>
              </td>
              <td style={styles.cell}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {formatDateTime(event.occurredAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  headerCell: {
    textAlign: 'left',
    padding: '10px 14px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  row: {
    borderBottom: '1px solid #f1f5f9',
  },
  cell: {
    padding: '12px 14px',
    verticalAlign: 'top',
  },
  noteBox: {
    backgroundColor: '#f0fdf4',
    borderLeft: '3px solid #22c55e',
    color: '#166534',
    fontSize: '12px',
    marginTop: '6px',
    padding: '4px 8px',
    borderRadius: '0 4px 4px 0',
    lineHeight: '1.4',
  },
  autoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ecfdf5',
    color: '#047857',
    border: '1px solid #a7f3d0',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  manualBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    display: 'inline-block',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  subtle: {
    color: '#94a3b8',
    fontSize: '11px',
  },
};
