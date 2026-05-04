import React, { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';

import { useManifestsQuery, useManifestDetailQuery } from '../../../../features/manifests/manifests.hooks';
import { useAuthStore } from '../../../../store/authStore';
import './ThermalLabelManagementPage.css';

function ManifestDetailModal({ manifestId, onClose, accessToken }: { manifestId: string; onClose: () => void; accessToken: string | null }): React.JSX.Element {
  const { data: detail, isLoading } = useManifestDetailQuery(accessToken, manifestId);
  const shipmentCodes = detail?.shipmentCodes ?? [];

  return (
    <div className="ops-thermal-management__modal" onClick={onClose}>
      <div className="ops-thermal-management__modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ops-thermal-management__modal-header">
          <h3>Chi tiết Tem Bao</h3>
          <button type="button" onClick={onClose}>&times;</button>
        </div>
        <div className="ops-thermal-management__modal-body">
          {isLoading ? (
            <p>Đang tải thông tin...</p>
          ) : !detail ? (
            <p>Không có thông tin chi tiết.</p>
          ) : (
            <>
              <div className="ops-thermal-management__modal-info">
                <div><strong>Mã bao:</strong> {detail.manifestCode}</div>
                <div><strong>Trạng thái:</strong> {detail.status}</div>
                <div><strong>Hub đích:</strong> {detail.destinationHubCode}</div>
              </div>
              <div className="ops-thermal-management__modal-list">
                <h4>Danh sách mã vận đơn ({shipmentCodes.length}):</h4>
                {shipmentCodes.length === 0 ? (
                  <p className="ops-thermal-management__empty-text">Chưa có mã vận đơn nào trong bao này.</p>
                ) : (
                  <ul className="ops-thermal-management__shipment-list">
                    {shipmentCodes.map((code) => (
                      <li key={code}>{code}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ManifestQrModal({
  bagCode,
  onClose,
}: {
  bagCode: string;
  onClose: () => void;
}): React.JSX.Element {
  const qrPreviewSrc = useMemo(() => buildQrPreviewSrc(bagCode), [bagCode]);

  return (
    <div className="ops-thermal-management__modal" onClick={onClose}>
      <div className="ops-thermal-management__modal-content ops-thermal-management__qr-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="ops-thermal-management__modal-header">
          <h3>Mã QR tem bao</h3>
          <button type="button" onClick={onClose}>&times;</button>
        </div>
        <div className="ops-thermal-management__modal-body ops-thermal-management__qr-modal-body">
          <p><strong>Mã bao:</strong> {bagCode}</p>
          {qrPreviewSrc ? (
            <img className="ops-thermal-management__qr-image" src={qrPreviewSrc} alt={`QR ${bagCode}`} />
          ) : (
            <p className="ops-thermal-management__empty-text">Không thể tạo mã QR cho tem bao này.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ThermalLabelManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((s) => s.session?.tokens.accessToken ?? null);
  const { data: manifests = [], isLoading, isError } = useManifestsQuery(accessToken);
  const [activeManifestId, setActiveManifestId] = useState<string | null>(null);
  const [activeQrBagCode, setActiveQrBagCode] = useState<string | null>(null);

  const usedBagLabels = useMemo(() => {
    return manifests
      .filter((m) => m.status === 'SEALED' || m.status === 'RECEIVED' || (m.shipmentCount ?? 0) > 0)
      .map((m) => ({
        id: m.id,
        bagCode: m.manifestCode,
        shipmentCount: m.shipmentCount ?? 0,
        createdAtRaw: m.createdAt ?? null,
        operationAt: m.sealedAt
          ? new Date(m.sealedAt).toLocaleString()
          : m.updatedAt
            ? new Date(m.updatedAt).toLocaleString()
            : '',
        uploadedAt: m.createdAt ? new Date(m.createdAt).toLocaleString() : '',
        originHubCode: m.originHubCode ?? 'N/A',
        destinationHubCode: m.destinationHubCode ?? 'N/A',
      }))
      .sort((a, b) => {
        const byCreatedAt = getDateSortValue(b.createdAtRaw) - getDateSortValue(a.createdAtRaw);
        if (byCreatedAt !== 0) {
          return byCreatedAt;
        }
        return b.bagCode.localeCompare(a.bagCode);
      });
  }, [manifests]);

  const totalShipments = usedBagLabels.reduce(
    (sum, item) => sum + item.shipmentCount,
    0,
  );

  return (
    <section className="ops-thermal-management">
      <header className="ops-thermal-management__header">
        <small>THERMAL_LABEL_MANAGEMENT</small>
        <h2>Quản lý tem bao đã sử dụng</h2>
        <p>
          Danh sách bên dưới là các tem bao đã có thao tác đóng bao và đã tải lên hệ thống.
        </p>
      </header>

      <section className="ops-thermal-management__summary">
        <article className="ops-thermal-management__summary-card">
          <span>Tổng tem bao đã sử dụng</span>
          <strong>{usedBagLabels.length}</strong>
        </article>
        <article className="ops-thermal-management__summary-card">
          <span>Tổng số đơn trong các bao</span>
          <strong>{totalShipments}</strong>
        </article>
      </section>

      <section className="ops-thermal-management__table-wrap">
        <table className="ops-thermal-management__table">
          <thead>
            <tr>
              <th>Mã bao</th>
              <th>Số lượng đơn trong bao</th>
              <th>Ngày giờ thao tác</th>
              <th>Ngày giờ tải lên</th>
              <th>Mã hub đi</th>
              <th>Mã hub đến</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>
                  Đã xảy ra lỗi khi tải dữ liệu tem bao.
                </td>
              </tr>
            ) : usedBagLabels.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                  Chưa có dữ liệu tem bao từ server.
                </td>
              </tr>
            ) : (
              usedBagLabels.map((item) => (
                <tr key={item.id} className="ops-thermal-management__tr-clickable" onClick={() => setActiveManifestId(item.id)}>
                  <td className="ops-thermal-management__bag-code">{item.bagCode}</td>
                  <td>{item.shipmentCount}</td>
                  <td>{item.operationAt}</td>
                  <td>{item.uploadedAt}</td>
                  <td>{item.originHubCode}</td>
                  <td>{item.destinationHubCode}</td>
                  <td>
                    <button
                      type="button"
                      className="ops-thermal-management__qr-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveQrBagCode(item.bagCode);
                      }}
                    >
                      Mã QR
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {activeManifestId && (
        <ManifestDetailModal 
          manifestId={activeManifestId} 
          accessToken={accessToken} 
          onClose={() => setActiveManifestId(null)} 
        />
      )}
      {activeQrBagCode ? (
        <ManifestQrModal bagCode={activeQrBagCode} onClose={() => setActiveQrBagCode(null)} />
      ) : null}
    </section>
  );
}

function getDateSortValue(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildQrPreviewSrc(value: string): string | null {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(value || 'N/A', 'Byte');
    qr.make();
    const qrSvg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    return `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;
  } catch {
    return null;
  }
}
