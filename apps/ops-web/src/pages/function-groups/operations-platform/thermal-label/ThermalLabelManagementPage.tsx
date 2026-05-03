import React, { useMemo, useState } from 'react';

import { useManifestsQuery, useManifestDetailQuery } from '../../../../features/manifests/manifests.hooks';
import { useAuthStore } from '../../../../store/authStore';
import './ThermalLabelManagementPage.css';

function ManifestDetailModal({ manifestId, onClose, accessToken }: { manifestId: string; onClose: () => void; accessToken: string | null }): React.JSX.Element {
  const { data: detail, isLoading } = useManifestDetailQuery(accessToken, manifestId);

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
                <h4>Danh sách mã vận đơn ({detail.shipmentCodes.length}):</h4>
                {detail.shipmentCodes.length === 0 ? (
                  <p className="ops-thermal-management__empty-text">Chưa có mã vận đơn nào trong bao này.</p>
                ) : (
                  <ul className="ops-thermal-management__shipment-list">
                    {detail.shipmentCodes.map((code) => (
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

export function ThermalLabelManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((s) => s.session?.tokens.accessToken ?? null);
  const { data: manifests = [], isLoading, isError } = useManifestsQuery(accessToken);
  const [activeManifestId, setActiveManifestId] = useState<string | null>(null);

  const usedBagLabels = useMemo(() => {
    return manifests
      .filter((m) => m.status === 'SEALED' || m.status === 'RECEIVED' || (m.shipmentCount ?? 0) > 0)
      .map((m) => ({
        id: m.id,
        bagCode: m.manifestCode,
        shipmentCount: m.shipmentCount ?? 0,
        operationAt: m.sealedAt
          ? new Date(m.sealedAt).toLocaleString()
          : m.updatedAt
            ? new Date(m.updatedAt).toLocaleString()
            : '',
        uploadedAt: m.createdAt ? new Date(m.createdAt).toLocaleString() : '',
        originHubCode: m.originHubCode ?? 'N/A',
        destinationHubCode: m.destinationHubCode ?? 'N/A',
      }));
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
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>
                  Đã xảy ra lỗi khi tải dữ liệu tem bao.
                </td>
              </tr>
            ) : usedBagLabels.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
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
    </section>
  );
}
