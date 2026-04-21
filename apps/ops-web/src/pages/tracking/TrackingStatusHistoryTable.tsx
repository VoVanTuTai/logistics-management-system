import React from 'react';

interface TrackingStatusHistoryRow {
  id: string;
  stt: number;
  scanTime: string;
  uploadedTime: string;
  scanCategory: string;
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
            <th>Thoi gian quet</th>
            <th>Thoi gian tai len</th>
            <th>Phan loai quet</th>
            <th className="ops-tracking-lookup__history-description-col">Mo ta lich su hanh trinh</th>
            <th>Trong luong</th>
            <th>Trong luong tinh cuoc</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.stt}</td>
              <td>{row.scanTime}</td>
              <td>{row.uploadedTime}</td>
              <td>{row.scanCategory}</td>
              <td className="ops-tracking-lookup__history-description-cell">{row.description}</td>
              <td>{row.actualWeight}</td>
              <td>{row.chargedWeight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
