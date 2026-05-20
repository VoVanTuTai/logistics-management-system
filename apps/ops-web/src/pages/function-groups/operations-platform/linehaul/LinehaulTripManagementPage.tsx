import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, RefreshCw } from 'lucide-react';

import { useManifestsQuery } from '../../../../features/manifests/manifests.api';
import type { ManifestListItemDto } from '../../../../features/manifests/manifests.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatManifestStatusLabel } from '../../../../utils/logisticsLabels';
import './LinehaulStyles.css';

interface LinehaulFilters {
  originHubCode: string;
  destinationHubCode: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  keyword: string;
}

type LinehaulStatusTone = 'pending' | 'transit' | 'arrived' | 'default';

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toDateInputValue(date);
}

function monthStart(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function resolveManifestTimelineDate(manifest: ManifestListItemDto): string | null | undefined {
  return manifest.sealedAt ?? manifest.updatedAt ?? manifest.createdAt;
}

function isOpenManifest(status: string): boolean {
  return ['CREATED', 'OPEN', 'PENDING'].includes(normalizeCode(status));
}

function isSealedManifest(status: string): boolean {
  return ['SEALED', 'IN_TRANSIT'].includes(normalizeCode(status));
}

function isReceivedManifest(status: string): boolean {
  return ['RECEIVED', 'CLOSED'].includes(normalizeCode(status));
}

function isOverdueManifest(manifest: ManifestListItemDto): boolean {
  const basis = manifest.sealedAt ?? manifest.createdAt ?? manifest.updatedAt;
  if (!basis || isReceivedManifest(manifest.status)) {
    return false;
  }

  const timestamp = new Date(basis).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const thresholdHours = isSealedManifest(manifest.status) ? 48 : 24;
  return Date.now() - timestamp > thresholdHours * 60 * 60 * 1000;
}

function statusTone(status: string): LinehaulStatusTone {
  if (isReceivedManifest(status)) {
    return 'arrived';
  }
  if (isSealedManifest(status)) {
    return 'transit';
  }
  if (isOpenManifest(status)) {
    return 'pending';
  }
  return 'default';
}

export function LinehaulTripManagementPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [filters, setFilters] = useState<LinehaulFilters>({
    originHubCode: 'ALL',
    destinationHubCode: 'ALL',
    status: 'ALL',
    dateFrom: monthStart(new Date()),
    dateTo: today,
    keyword: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const manifestsQuery = useManifestsQuery(accessToken);
  const manifests = manifestsQuery.data ?? [];

  const hubOptions = useMemo(() => {
    const hubs = new Set<string>();
    for (const manifest of manifests) {
      const origin = normalizeCode(manifest.originHubCode);
      const destination = normalizeCode(manifest.destinationHubCode);
      if (origin) {
        hubs.add(origin);
      }
      if (destination) {
        hubs.add(destination);
      }
    }
    return Array.from(hubs).sort();
  }, [manifests]);

  const statusOptions = useMemo(
    () => Array.from(new Set(manifests.map((manifest) => normalizeCode(manifest.status)))).sort(),
    [manifests],
  );

  const filteredManifests = useMemo(() => {
    const keyword = normalizeText(filters.keyword);

    return manifests.filter((manifest) => {
      const originHubCode = normalizeCode(manifest.originHubCode);
      const destinationHubCode = normalizeCode(manifest.destinationHubCode);
      const status = normalizeCode(manifest.status);
      const dateKey = toDateKey(resolveManifestTimelineDate(manifest));
      const keywordMatched =
        !keyword ||
        normalizeText(manifest.manifestCode).includes(keyword) ||
        normalizeText(originHubCode).includes(keyword) ||
        normalizeText(destinationHubCode).includes(keyword);

      return (
        keywordMatched &&
        (filters.originHubCode === 'ALL' || originHubCode === filters.originHubCode) &&
        (filters.destinationHubCode === 'ALL' ||
          destinationHubCode === filters.destinationHubCode) &&
        (filters.status === 'ALL' || status === filters.status) &&
        (!filters.dateFrom || !dateKey || dateKey >= filters.dateFrom) &&
        (!filters.dateTo || !dateKey || dateKey <= filters.dateTo)
      );
    });
  }, [filters, manifests]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredManifests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedManifests = useMemo(
    () => filteredManifests.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredManifests, pageSize],
  );

  const kpis = useMemo(
    () => ({
      open: manifests.filter((manifest) => isOpenManifest(manifest.status)).length,
      sealed: manifests.filter((manifest) => isSealedManifest(manifest.status)).length,
      received: manifests.filter((manifest) => isReceivedManifest(manifest.status)).length,
      overdue: manifests.filter(isOverdueManifest).length,
    }),
    [manifests],
  );

  const updateFilter = <Key extends keyof LinehaulFilters>(
    key: Key,
    value: LinehaulFilters[Key],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <section className="ops-linehaul-dashboard">
      <header className="ops-linehaul-dashboard__header">
        <div>
          <small>LINEHAUL_TRIP_MANAGEMENT</small>
          <h2>Quản lý chuyến xe</h2>
          <p>
            Theo dõi chuyến xe/manifest, tuyến hub đi - hub đến, seal và trạng thái
            giao nhận. Chưa có domain linehaul riêng nên manifest là nguồn dữ liệu chính.
          </p>
        </div>
        <div className="ops-linehaul-dashboard__actions">
          <Link className="ops-linehaul-dashboard__primary-link" to={routePaths.linehaulVehicleSeal}>
            <Plus size={16} />
            Tem xe
          </Link>
          <button type="button" onClick={() => void manifestsQuery.refetch()}>
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </header>

      <section className="ops-linehaul-dashboard__kpis">
        <article>
          <span>Manifest đang mở</span>
          <strong>{kpis.open}</strong>
        </article>
        <article data-tone="transit">
          <span>Đã seal / đang đi</span>
          <strong>{kpis.sealed}</strong>
        </article>
        <article data-tone="arrived">
          <span>Đã receive</span>
          <strong>{kpis.received}</strong>
        </article>
        <article data-tone="danger">
          <span>Lỗi quá hạn</span>
          <strong>{kpis.overdue}</strong>
        </article>
      </section>

      <section className="ops-linehaul-dashboard__filters">
        <label>
          <span>Hub đi</span>
          <select
            value={filters.originHubCode}
            onChange={(event) => updateFilter('originHubCode', event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Hub đến</span>
          <select
            value={filters.destinationHubCode}
            onChange={(event) => updateFilter('destinationHubCode', event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Từ ngày</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => updateFilter('dateFrom', event.target.value)}
          />
        </label>
        <label>
          <span>Đến ngày</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => updateFilter('dateTo', event.target.value)}
          />
        </label>
        <label>
          <span>Trạng thái</span>
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatManifestStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tìm kiếm</span>
          <input
            value={filters.keyword}
            onChange={(event) => updateFilter('keyword', event.target.value)}
            placeholder="Manifest, hub đi, hub đến"
          />
        </label>
      </section>

      {manifestsQuery.error ? (
        <p className="ops-linehaul-dashboard__error" role="alert">
          {getErrorMessage(manifestsQuery.error)}
        </p>
      ) : null}

      <section className="ops-linehaul-dashboard__panel">
        <header className="ops-linehaul-dashboard__panel-head">
          <div>
            <h3>Manifest / chuyến xe</h3>
            <span>
              {manifestsQuery.isLoading
                ? 'Đang tải...'
                : `${filteredManifests.length} dòng từ manifest API`}
            </span>
          </div>
          <em>Link chi tiết mở manifest detail hiện có</em>
        </header>

        {manifestsQuery.isLoading ? (
          <p className="ops-linehaul-dashboard__empty">Đang tải danh sách manifest...</p>
        ) : null}
        {!manifestsQuery.isLoading && filteredManifests.length === 0 ? (
          <p className="ops-linehaul-dashboard__empty">
            Không có manifest/chuyến xe phù hợp bộ lọc. Không sử dụng seed data thay thế.
          </p>
        ) : null}

        <div className="ops-linehaul-dashboard__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Manifest / seal</th>
                <th>Trạng thái</th>
                <th>Hub đi</th>
                <th>Hub đến</th>
                <th>Bao/kiện</th>
                <th>Đã seal</th>
                <th>Cập nhật</th>
                <th>SLA</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {paginatedManifests.map((manifest) => {
                const overdue = isOverdueManifest(manifest);
                return (
                  <tr key={manifest.id}>
                    <td>
                      <Link
                        className="ops-linehaul-dashboard__code"
                        to={routePaths.manifestDetail(manifest.id)}
                      >
                        {manifest.manifestCode}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`ops-linehaul-dashboard__badge ops-linehaul-dashboard__badge--${statusTone(
                          manifest.status,
                        )}`}
                      >
                        {formatManifestStatusLabel(manifest.status)}
                      </span>
                    </td>
                    <td>{manifest.originHubCode ?? 'Chưa có'}</td>
                    <td>{manifest.destinationHubCode ?? 'Chưa có'}</td>
                    <td>{manifest.shipmentCount ?? 0}</td>
                    <td>{manifest.sealedAt ? formatDateTime(manifest.sealedAt) : 'Chưa seal'}</td>
                    <td>{formatDateTime(manifest.updatedAt ?? manifest.createdAt)}</td>
                    <td>
                      <span
                        className={
                          overdue
                            ? 'ops-linehaul-dashboard__badge ops-linehaul-dashboard__badge--danger'
                            : 'ops-linehaul-dashboard__badge'
                        }
                      >
                        {overdue ? 'Quá hạn' : 'Trong hạn'}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="ops-linehaul-dashboard__detail-link"
                        to={routePaths.manifestDetail(manifest.id)}
                      >
                        <FileText size={15} />
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="ops-linehaul-dashboard__pagination">
          <span>
            Hiển thị {filteredManifests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredManifests.length, currentPage * pageSize)} / {filteredManifests.length}
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[10, 25, 50].map((size) => (
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
            <strong>
              {currentPage}/{totalPages}
            </strong>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Sau
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
