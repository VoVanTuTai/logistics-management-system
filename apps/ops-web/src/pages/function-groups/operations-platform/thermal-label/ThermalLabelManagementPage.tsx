import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Filter, Package, Search } from 'lucide-react';

import { useManifestsQuery } from '../../../../features/manifests/manifests.hooks';
import { useHubScope } from '../../../../hooks/useHubScope';
import { useAuthStore } from '../../../../store/authStore';
import { formatManifestStatusLabel } from '../../../../utils/logisticsLabels';
import '../data-monitoring/OperationalDataMonitorPage.css';
import './ThermalLabelManagementPage.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

type BagDirectionFilter = 'ALL' | 'OUTBOUND' | 'INBOUND';

export function ThermalLabelManagementPage(): React.JSX.Element {
  const session = useAuthStore((s) => s.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeHubCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const hubScope = useHubScope();
  const { data: manifests = [], isLoading, isError } = useManifestsQuery(accessToken);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchCode, setSearchCode] = useState('');
  const [directionFilter, setDirectionFilter] = useState<BagDirectionFilter>('ALL');

  const effectiveHubCodes = useMemo(() => {
    const list = hubScope.scopedHubCodes.length > 0 ? hubScope.scopedHubCodes : assignedHubCodes;
    return list.map(normalizeHubCode).filter(Boolean);
  }, [hubScope.scopedHubCodes, assignedHubCodes]);

  const isAllSystem = canViewAllHubAreas || hubScope.isAllSystem;

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

  // Quy tắc phạm vi Hub:
  // 1. Mặc định chỉ hiển thị bao do Hub mình gửi đi (outbound) hoặc nhận đến (inbound)
  // 2. Nếu người dùng nhập mã bao cụ thể (tra cứu barcode/mã): tìm kiếm trên toàn hệ thống
  const scopedBagLabels = useMemo(() => {
    const trimmedSearch = searchCode.trim().toUpperCase();

    // Trường hợp 1: Tra cứu bằng mã bao cụ thể -> cho phép tìm toàn quốc
    if (trimmedSearch) {
      return bagLabels.filter(
        (item) =>
          normalizeHubCode(item.bagCode).includes(trimmedSearch) ||
          normalizeHubCode(item.originHubCode).includes(trimmedSearch) ||
          normalizeHubCode(item.destinationHubCode).includes(trimmedSearch),
      );
    }

    // Trường hợp 2: Quản trị toàn quốc HQ -> thấy tất cả
    if (isAllSystem) {
      return bagLabels;
    }

    if (effectiveHubCodes.length === 0) {
      return [];
    }

    // Trường hợp 3: Hub cơ sở / Tỉnh -> chỉ thấy bao xuất đi từ Hub hoặc gửi đến Hub này
    return bagLabels.filter((item) => {
      const isOutbound = effectiveHubCodes.includes(normalizeHubCode(item.originHubCode));
      const isInbound = effectiveHubCodes.includes(normalizeHubCode(item.destinationHubCode));
      return isOutbound || isInbound;
    });
  }, [bagLabels, effectiveHubCodes, isAllSystem, searchCode]);

  // Lọc theo chiều xuất đi / đến
  const filteredBagLabels = useMemo(() => {
    if (directionFilter === 'ALL' || isAllSystem) {
      return scopedBagLabels;
    }

    return scopedBagLabels.filter((item) => {
      const isOutbound = effectiveHubCodes.includes(normalizeHubCode(item.originHubCode));
      const isInbound = effectiveHubCodes.includes(normalizeHubCode(item.destinationHubCode));

      if (directionFilter === 'OUTBOUND') {
        return isOutbound;
      }
      if (directionFilter === 'INBOUND') {
        return isInbound;
      }
      return true;
    });
  }, [directionFilter, effectiveHubCodes, isAllSystem, scopedBagLabels]);

  const outboundCount = useMemo(() => {
    if (isAllSystem) return scopedBagLabels.length;
    return scopedBagLabels.filter((item) =>
      effectiveHubCodes.includes(normalizeHubCode(item.originHubCode)),
    ).length;
  }, [effectiveHubCodes, isAllSystem, scopedBagLabels]);

  const inboundCount = useMemo(() => {
    if (isAllSystem) return 0;
    return scopedBagLabels.filter((item) =>
      effectiveHubCodes.includes(normalizeHubCode(item.destinationHubCode)),
    ).length;
  }, [effectiveHubCodes, isAllSystem, scopedBagLabels]);

  const totalShipments = filteredBagLabels.reduce((sum, item) => sum + item.shipmentCount, 0);
  const arrivedLabels = filteredBagLabels.filter((item) => item.status === 'RECEIVED').length;
  const totalPages = Math.max(1, Math.ceil(filteredBagLabels.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedBagLabels = filteredBagLabels.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize, searchCode, directionFilter, scopedBagLabels.length]);

  return (
    <section className="ops-thermal-management">
      <header className="ops-thermal-management__header">
        <div className="ops-thermal-management__header-row">
          <div>
            <small>THERMAL_LABEL_MANAGEMENT</small>
            <h2>Quản lý tem bao</h2>
            <p>
              Màn hình tra cứu và theo dõi bao tải bưu phẩm. Mặc định chỉ tải các bao đi/đến
              trong phạm vi Hub quản lý để tránh quá tải danh sách.
            </p>
          </div>
          <div className="ops-thermal-management__hub-badge">
            <span className="ops-thermal-management__hub-badge-dot" />
            <span>
              Phạm vi: <strong>{hubScope.scopeLabel}</strong>
              {!isAllSystem && effectiveHubCodes.length > 0
                ? ` (${effectiveHubCodes.join(', ')})`
                : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Toolbar lọc theo phạm vi và tra cứu mã bao */}
      <section className="ops-thermal-management__toolbar">
        <div className="ops-thermal-management__search-box">
          <Search size={16} className="ops-thermal-management__search-icon" />
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Tra cứu mã bao / barcode (Hỗ trợ tìm trên toàn quốc)..."
            aria-label="Tra cứu mã bao"
          />
          {searchCode && (
            <button
              type="button"
              className="ops-thermal-management__search-clear"
              onClick={() => setSearchCode('')}
              title="Xoá tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        {!isAllSystem && (
          <div className="ops-thermal-management__direction-tabs" role="tablist">
            <button
              type="button"
              className={`ops-thermal-management__tab ${directionFilter === 'ALL' ? 'ops-thermal-management__tab--active' : ''}`}
              onClick={() => setDirectionFilter('ALL')}
            >
              Tất cả bao liên quan ({scopedBagLabels.length})
            </button>
            <button
              type="button"
              className={`ops-thermal-management__tab ${directionFilter === 'OUTBOUND' ? 'ops-thermal-management__tab--active' : ''}`}
              onClick={() => setDirectionFilter('OUTBOUND')}
            >
              Bao xuất đi ({outboundCount})
            </button>
            <button
              type="button"
              className={`ops-thermal-management__tab ${directionFilter === 'INBOUND' ? 'ops-thermal-management__tab--active' : ''}`}
              onClick={() => setDirectionFilter('INBOUND')}
            >
              Bao gửi đến ({inboundCount})
            </button>
          </div>
        )}
      </section>

      <section className="ops-thermal-management__summary">
        <article className="ops-thermal-management__summary-card">
          <span>Tổng tem bao</span>
          <strong>{filteredBagLabels.length}</strong>
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
              <th>Chiều</th>
              <th>Mã bao</th>
              <th>Tuyến Hub</th>
              <th>Trạng thái</th>
              <th>Số lượng đơn</th>
              <th>Ngày giờ thao tác</th>
              <th>Ngày giờ tải lên</th>
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
            ) : filteredBagLabels.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  {searchCode
                    ? `Không tìm thấy bao nào có mã khớp với "${searchCode}".`
                    : isAllSystem
                      ? 'Chưa có dữ liệu tem bao từ server.'
                      : 'Không có bao nào thuộc phạm vi Hub phụ trách (chỉ bao xuất đi hoặc gửi đến Hub này mới hiển thị). Bạn có thể gõ mã bao cụ thể vào ô tìm kiếm để tra cứu liên tỉnh.'}
                </td>
              </tr>
            ) : (
              pagedBagLabels.map((item) => {
                const isOutbound = effectiveHubCodes.includes(normalizeHubCode(item.originHubCode));
                const isInbound = effectiveHubCodes.includes(normalizeHubCode(item.destinationHubCode));

                return (
                  <tr key={item.id}>
                    <td>
                      {isOutbound ? (
                        <span className="ops-bag-dir-badge ops-bag-dir-badge--outbound">
                          Xuất đi
                        </span>
                      ) : isInbound ? (
                        <span className="ops-bag-dir-badge ops-bag-dir-badge--inbound">
                          Gửi đến
                        </span>
                      ) : (
                        <span className="ops-bag-dir-badge ops-bag-dir-badge--transit">
                          Liên tỉnh
                        </span>
                      )}
                    </td>
                    <td className="ops-thermal-management__bag-code">
                      <span className="ops-thermal-management__bag-code-text">{item.bagCode}</span>
                    </td>
                    <td>
                      <div className="ops-thermal-management__route">
                        <strong>{item.originHubCode}</strong>
                        <ArrowRight size={13} className="ops-thermal-management__route-arrow" />
                        <strong>{item.destinationHubCode}</strong>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`ops-thermal-management__status ops-thermal-management__status--${item.status.toLowerCase()}`}
                      >
                        {formatManifestStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <span className="ops-thermal-management__count-badge">
                        {item.shipmentCount} đơn
                      </span>
                    </td>
                    <td>{item.operationAt}</td>
                    <td>{item.uploadedAt}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <footer className="ops-data-monitor__pagination">
        <span>
          Hiển thị {filteredBagLabels.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
          {Math.min(filteredBagLabels.length, currentPage * pageSize)} / {filteredBagLabels.length} dòng
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

function normalizeHubCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function getDateSortValue(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
