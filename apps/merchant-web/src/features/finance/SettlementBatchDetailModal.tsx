import React from 'react';
import type { SettlementBatch, ShipmentRow } from '../../types';
import { formatCurrency } from '../../api';

export interface SettlementBatchDetailModalProps {
  batch: SettlementBatch | null;
  onClose: () => void;
  shipmentRows: ShipmentRow[];
  onExportBatchToCsv: (batch: SettlementBatch) => void;
}

export function SettlementBatchDetailModal({
  batch,
  onClose,
  shipmentRows,
  onExportBatchToCsv,
}: SettlementBatchDetailModalProps): React.JSX.Element | null {
  if (!batch) return null;

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div
        className="ops-modal-card"
        style={{ maxWidth: '800px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--stitch-on-surface)',
              }}
            >
              Chi tiết kỳ đối soát #{batch.code}
            </h3>
            <div className="muted" style={{ fontSize: '13px' }}>
              {batch.cycleName} • {batch.orderCount} đơn hàng
            </div>
          </div>
          <button type="button" className="ops-modal-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            padding: '14px',
            background: '#f8fafc',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Tổng COD thu hộ
            </div>
            <div style={{ fontWeight: 700, color: '#127a56' }}>
              +{formatCurrency(batch.codTotal)}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Cước cấn trừ
            </div>
            <div style={{ fontWeight: 700, color: '#ba1a1a' }}>
              -{formatCurrency(batch.feeTotal)}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Thực nhận
            </div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#0052cc' }}>
              {formatCurrency(batch.netPayout)}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Trạng thái
            </div>
            <div>{batch.status === 'PAID' ? 'Đã chi trả' : 'Đang xử lý'}</div>
          </div>
        </div>

        <div
          style={{
            maxHeight: '340px',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <table className="finance-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Người nhận</th>
                <th>SĐT</th>
                <th style={{ textAlign: 'right' }}>Tiền COD</th>
                <th style={{ textAlign: 'right' }}>Cước phí</th>
                <th style={{ textAlign: 'right' }}>Thực nhận</th>
              </tr>
            </thead>
            <tbody>
              {shipmentRows
                .filter((r) => batch.shipmentCodes.includes(r.shipment.code))
                .map((r) => (
                  <tr key={r.shipment.id}>
                    <td>
                      <span className="code-pill">{r.shipment.code}</span>
                    </td>
                    <td>{r.receiverName}</td>
                    <td>{r.receiverPhone}</td>
                    <td style={{ textAlign: 'right' }} className="money-plus">
                      +{formatCurrency(r.codAmount)}
                    </td>
                    <td style={{ textAlign: 'right' }} className="money-minus">
                      -{formatCurrency(r.feeEstimate)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(r.codAmount - r.feeEstimate)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onExportBatchToCsv(batch)}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px', marginRight: '6px' }}
            >
              download
            </span>
            <span>Tải bảng kê Excel (.csv)</span>
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
