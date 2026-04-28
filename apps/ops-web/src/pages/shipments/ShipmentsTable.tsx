import React from 'react';
import { Link } from 'react-router-dom';

import type { ShipmentListItemDto } from '../../features/shipments/shipments.types';
import { routePaths } from '../../navigation/routes';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';

interface ShipmentsTableProps {
  items: ShipmentListItemDto[];
  onPrint?: (shipment: ShipmentListItemDto) => void;
  onPrepareDispatch?: (shipment: ShipmentListItemDto) => void;
}

function resolveShipmentStatusLabel(item: ShipmentListItemDto): string {
  const deliveryNote = (item.deliveryNote ?? '').trim();
  if (
    item.currentStatus === 'SCAN_INBOUND' &&
    deliveryNote.toLowerCase().startsWith('xuống hàng kiện đến')
  ) {
    return deliveryNote;
  }

  return formatShipmentStatusLabel(item.currentStatus);
}

function canDispatchShipment(item: ShipmentListItemDto): boolean {
  return item.currentStatus === 'SCAN_INBOUND' || item.currentStatus === 'TASK_ASSIGNED';
}

export function ShipmentsTable({
  items,
  onPrint,
  onPrepareDispatch,
}: ShipmentsTableProps): React.JSX.Element {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.headerCell}>Vận đơn</th>
          <th style={styles.headerCell}>Trạng thái</th>
          <th style={styles.headerCell}>Nền tảng</th>
          <th style={styles.headerCell}>Người gửi</th>
          <th style={styles.headerCell}>Người nhận</th>
          <th style={styles.headerCell}>Khu vực</th>
          <th style={styles.headerCell}>Vị trí hiện tại</th>
          <th style={styles.headerCell}>Tạo lúc</th>
          <th style={styles.headerCell}>Cập nhật lúc</th>
          <th style={styles.headerCell}>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const canDispatch = canDispatchShipment(item);

          return (
            <tr key={item.id}>
              <td style={styles.cell}>
                <Link to={routePaths.shipmentDetail(item.shipmentCode)}>{item.shipmentCode}</Link>
              </td>
              <td style={styles.cell}>{resolveShipmentStatusLabel(item)}</td>
              <td style={styles.cell}>{item.platform ?? 'Không có'}</td>
              <td style={styles.cell}>
                <div>{item.senderName ?? 'Không có'}</div>
                <small style={styles.subText}>{item.senderPhone ?? '-'}</small>
              </td>
              <td style={styles.cell}>
                <div>{item.receiverName ?? 'Không có'}</div>
                <small style={styles.subText}>{item.receiverPhone ?? '-'}</small>
              </td>
              <td style={styles.cell}>{item.receiverRegion ?? 'Không có'}</td>
              <td style={styles.cell}>{item.currentLocation ?? 'Không có'}</td>
              <td style={styles.cell}>{formatDateTime(item.createdAt)}</td>
              <td style={styles.cell}>{formatDateTime(item.updatedAt)}</td>
              <td style={styles.cell}>
                <div style={styles.actionGroup}>
                  <button
                    type="button"
                    onClick={() => onPrepareDispatch?.(item)}
                    disabled={!canDispatch}
                    title={
                      canDispatch
                        ? 'Quét phát và phân công courier giao hàng'
                        : 'Chỉ quét phát khi kiện đã xuống bưu cục (SCAN_INBOUND)'
                    }
                  >
                    Quét phát
                  </button>
                  <button type="button" onClick={() => onPrint?.(item)}>
                    In vận đơn
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
    whiteSpace: 'nowrap',
  },
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid #e7ebf8',
    verticalAlign: 'top',
  },
  subText: {
    color: '#5262a6',
    fontSize: 12,
  },
  actionGroup: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
};
