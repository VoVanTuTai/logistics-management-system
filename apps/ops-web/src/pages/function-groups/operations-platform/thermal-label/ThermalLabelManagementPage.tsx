import React, { useEffect, useMemo, useState } from 'react';

import { useManifestsQuery } from '../../../../features/manifests/manifests.hooks';
import { useAuthStore } from '../../../../store/authStore';
import { formatManifestStatusLabel } from '../../../../utils/logisticsLabels';
import '../data-monitoring/OperationalDataMonitorPage.css';
import './ThermalLabelManagementPage.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function ThermalLabelManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((s) => s.session?.tokens.accessToken ?? null);
  const { data: manifests = [], isLoading, isError } = useManifestsQuery(accessToken);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const bagLabels = useMemo(() => {
    return manifests
      .map((manifest) => ({
        id: manifest.id,
        bagCode: manifest.manifestCode,
        status: manifest.status,
        shipmentCount: manifest.shipmentCount ?? 0,
        createdAtRaw: manifest.createdAt ?? null,
        operationAt: manifest.sealedAt
          ? new Date(manifest.sealedAt).toLocaleString()
          : manifest.updatedAt
            ? new Date(manifest.updatedAt).toLocaleString()
            : '',
        uploadedAt: manifest.createdAt ? new Date(manifest.createdAt).toLocaleString() : '',
        originHubCode: manifest.originHubCode ?? 'N/A',
        destinationHubCode: manifest.destinationHubCode ?? 'N/A',
      }))
      .sort((a, b) => {
        const byCreatedAt = getDateSortValue(b.createdAtRaw) - getDateSortValue(a.createdAtRaw);
        if (byCreatedAt !== 0) {
          return byCreatedAt;
        }
        return b.bagCode.localeCompare(a.bagCode);
      });
  }, [manifests]);

  const totalShipments = bagLabels.reduce((sum, item) => sum + item.shipmentCount, 0);
  const arrivedLabels = bagLabels.filter((item) => item.status === 'RECEIVED').length;
  const totalPages = Math.max(1, Math.ceil(bagLabels.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedBagLabels = bagLabels.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize, bagLabels.length]);

  return (
    <section className="ops-thermal-management">
      <header className="ops-thermal-management__header">
        <small>THERMAL_LABEL_MANAGEMENT</small>
        <h2>Quản lý tem bao</h2>
        <p>
          Màn hình chỉ dùng để tra cứu số lượng đơn trong từng tem bao. Các thao tác tạo,
          in, xóa và tái sử dụng tem được thực hiện ở màn In tem bao.
        </p>
      </header>

      <section className="ops-thermal-management__summary">
        <article className="ops-thermal-management__summary-card">
          <span>Tổng tem bao</span>
          <strong>{bagLabels.length}</strong>
        </article>
        <article className="ops-thermal-management__summary-card">
          <span>Tổng số đơn trong các bao</span>
          <strong>{totalShipments}</strong>
        </article>
        <article className="ops-thermal-management__summary-card">
          <span>Tem đã hàng đến</span>
          <strong>{arrivedLabels}</strong>
        </article>
      </section>

      <section className="ops-thermal-management__table-wrap">
        <table className="ops-thermal-management__table">
          <thead>
            <tr>
              <th>Mã bao</th>
              <th>Trạng thái</th>
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
            ) : bagLabels.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                  Chưa có dữ liệu tem bao từ server.
                </td>
              </tr>
            ) : (
              pagedBagLabels.map((item) => (
                <tr key={item.id}>
                  <td className="ops-thermal-management__bag-code">{item.bagCode}</td>
                  <td>
                    <span
                      className={`ops-thermal-management__status ops-thermal-management__status--${item.status.toLowerCase()}`}
                    >
                      {formatManifestStatusLabel(item.status)}
                    </span>
                  </td>
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

      <footer className="ops-data-monitor__pagination">
        <span>
          Hiển thị {bagLabels.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
          {Math.min(bagLabels.length, currentPage * pageSize)} / {bagLabels.length} dòng
        </span>
        <label>
          <span>Số dòng</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div>
          <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
            Trước
          </button>
          <strong>{currentPage}/{totalPages}</strong>
          <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
            Sau
          </button>
        </div>
      </footer>
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
