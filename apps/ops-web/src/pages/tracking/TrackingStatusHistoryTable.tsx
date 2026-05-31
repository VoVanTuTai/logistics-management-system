import React from 'react';

import { LinkifiedText } from '../shared/LinkifiedText';

interface TrackingStatusHistoryRow {
  id: string;
  stt: number;
  scanTime: string;
  uploadedTime: string;
  action: string;
  status: string;
  location: string;
  source: string;
  description: string;
  actualWeight: string;
  chargedWeight: string;
}

interface TrackingStatusHistoryTableProps {
  rows: TrackingStatusHistoryRow[];
}

export function TrackingStatusHistoryTable({
  rows,
}: TrackingStatusHistoryTableProps): React.JSX.Element {
  return (
    <div className="ops-tracking-lookup__history-table-wrap">
      <table className="ops-tracking-lookup__history-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Thời gian quét</th>
            <th>Thời gian tải lên</th>
            <th>Thao tác</th>
            <th>Trạng thái</th>
            <th>Vị trí</th>
            <th className="ops-tracking-lookup__history-description-col">Ghi chú chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.stt}</td>
              <td>{row.scanTime}</td>
              <td>{row.uploadedTime}</td>
              <td>{row.action}</td>
              <td>{row.status}</td>
              <td>{row.location}</td>
              <td className="ops-tracking-lookup__history-description-cell">
                <LinkifiedText text={row.description} fallback="--" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
