import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

import { useManifestsQuery } from '../../../../features/manifests/manifests.api';
import type { ManifestListItemDto } from '../../../../features/manifests/manifests.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  LINEHAUL_TRIP_TYPE_LABELS,
  normalizeTripCode,
  readLinehaulTrips,
} from './linehaulTrips';
import type { LinehaulTrip } from './linehaulTrips';
import './LinehaulStyles.css';

interface MonitorFilters {
  hubCode: string;
  sealStatus: 'ALL' | 'SEALED' | 'NO_SEAL';
  keyword: string;
}

interface LinehaulMonitorRow {
  trip: LinehaulTrip;
  manifest: ManifestListItemDto | null;
  hasVehicleLabel: boolean;
  hasSeal: boolean;
  bagCount: number;
  shipmentCount: number;
  vehicleStatusLabel: string;
  sealLabel: string;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isManifestSealed(manifest: ManifestListItemDto | null): boolean {
  if (!manifest) {
    return false;
  }

  return Boolean(manifest.sealedAt) || normalizeTripCode(manifest.status) === 'SEALED';
}

function resolveVehicleStatusLabel(trip: LinehaulTrip, hasSeal: boolean): string {
  if (!trip.printedAt) {
    return 'Chưa in tem xe';
  }

  if (!hasSeal) {
    return 'Chưa đóng seal / chưa quét xe đi';
  }

  return 'Đã có seal để đối soát xe đi';
}

function buildManifestLookup(manifests: ManifestListItemDto[]): Map<string, ManifestListItemDto> {
  const lookup = new Map<string, ManifestListItemDto>();

  for (const manifest of manifests) {
    const manifestCode = normalizeTripCode(manifest.manifestCode);
    if (manifestCode) {
      lookup.set(manifestCode, manifest);
    }
  }

  return lookup;
}

export function LinehaulTripDataMonitorPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const [trips, setTrips] = useState<LinehaulTrip[]>(readLinehaulTrips);
  const [filters, setFilters] = useState<MonitorFilters>({
    hubCode: 'ALL',
    sealStatus: 'ALL',
    keyword: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const manifestsQuery = useManifestsQuery(accessToken);
  const manifests = manifestsQuery.data ?? [];

  const rows = useMemo<LinehaulMonitorRow[]>(() => {
    const manifestLookup = buildManifestLookup(manifests);

    return trips.map((trip) => {
      const manifest = manifestLookup.get(normalizeTripCode(trip.tripCode)) ?? null;
      const hasSeal = isManifestSealed(manifest);
      const hasVehicleLabel = Boolean(trip.printedAt);

      return {
        trip,
        manifest,
        hasVehicleLabel,
        hasSeal,
        bagCount: manifest ? 1 : 0,
        shipmentCount: Math.max(0, manifest?.shipmentCount ?? 0),
        vehicleStatusLabel: resolveVehicleStatusLabel(trip, hasSeal),
        sealLabel: hasSeal ? 'Đã đóng seal' : 'Chưa có',
      };
    });
  }, [manifests, trips]);

  const hubOptions = useMemo(() => {
    const hubCodes = new Set<string>();

    for (const row of rows) {
      hubCodes.add(row.trip.originHubCode);
      hubCodes.add(row.trip.destinationHubCode);
    }

    return Array.from(hubCodes).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = normalizeText(filters.keyword);

    return rows.filter((row) => {
      const hubMatched =
        filters.hubCode === 'ALL' ||
        row.trip.originHubCode === filters.hubCode ||
        row.trip.destinationHubCode === filters.hubCode;
      const sealMatched =
        filters.sealStatus === 'ALL' ||
        (filters.sealStatus === 'SEALED' && row.hasSeal) ||
        (filters.sealStatus === 'NO_SEAL' && !row.hasSeal);
      const keywordMatched =
        !keyword ||
        normalizeText(row.trip.tripCode).includes(keyword) ||
        normalizeText(row.trip.vehiclePlate).includes(keyword) ||
        normalizeText(row.trip.driverName).includes(keyword) ||
        normalizeText(row.manifest?.manifestCode).includes(keyword);

      return hubMatched && sealMatched && keywordMatched;
    });
  }, [filters, rows]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const kpis = useMemo(
    () => ({
      totalTrips: rows.length,
      printedLabels: rows.filter((row) => row.hasVehicleLabel).length,
      noSeal: rows.filter((row) => !row.hasSeal).length,
      sealed: rows.filter((row) => row.hasSeal).length,
      bagCount: rows.reduce((sum, row) => sum + row.bagCount, 0),
      shipmentCount: rows.reduce((sum, row) => sum + row.shipmentCount, 0),
    }),
    [rows],
  );

  const updateFilter = <Key extends keyof MonitorFilters>(
    key: Key,
    value: MonitorFilters[Key],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const refreshData = () => {
    setTrips(readLinehaulTrips());
    void manifestsQuery.refetch();
  };

  return (
    <section className="ops-linehaul-dashboard">
      <header className="ops-linehaul-dashboard__header">
        <div>
          <small>LINEHAUL_TRIP_DATA_MONITOR</small>
          <h2>Giám sát dữ liệu chuyến xe</h2>
          <p>
            Kiểm soát tem xe, trạng thái seal và số lượng bao/kiện đang gắn với từng chuyến
            để Ops đối soát khi test luồng xe đi.
          </p>
        </div>
        <div className="ops-linehaul-dashboard__actions">
          <Link className="ops-linehaul-dashboard__primary-link" to={routePaths.linehaulVehicleSeal}>
            Tạo tem xe
          </Link>
          <button type="button" onClick={refreshData}>
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </header>

      {manifestsQuery.error ? (
        <p className="ops-linehaul-dashboard__error" role="alert">
          {getErrorMessage(manifestsQuery.error)}
        </p>
      ) : null}

      <section className="ops-linehaul-dashboard__kpis ops-linehaul-dashboard__kpis--six">
        <article>
          <span>Tổng chuyến</span>
          <strong>{kpis.totalTrips}</strong>
        </article>
        <article data-tone="arrived">
          <span>Đã in tem</span>
          <strong>{kpis.printedLabels}</strong>
        </article>
        <article data-tone="danger">
          <span>Chưa có seal</span>
          <strong>{kpis.noSeal}</strong>
        </article>
        <article data-tone="arrived">
          <span>Đã đóng seal</span>
          <strong>{kpis.sealed}</strong>
        </article>
        <article>
          <span>Bao hàng</span>
          <strong>{kpis.bagCount}</strong>
        </article>
        <article>
          <span>Kiện hàng</span>
          <strong>{kpis.shipmentCount}</strong>
        </article>
      </section>

      <section className="ops-linehaul-dashboard__filters ops-linehaul-dashboard__filters--monitor">
        <label>
          <span>Hub</span>
          <select
            value={filters.hubCode}
            onChange={(event) => updateFilter('hubCode', event.target.value)}
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
          <span>Seal</span>
          <select
            value={filters.sealStatus}
            onChange={(event) =>
              updateFilter('sealStatus', event.target.value as MonitorFilters['sealStatus'])
            }
          >
            <option value="ALL">Tất cả</option>
            <option value="NO_SEAL">Chưa có seal</option>
            <option value="SEALED">Đã đóng seal</option>
          </select>
        </label>
        <label>
          <span>Tìm chuyến / xe / tài xế</span>
          <input
            value={filters.keyword}
            onChange={(event) => updateFilter('keyword', event.target.value)}
            placeholder="Mã chuyến, biển số, tài xế"
          />
        </label>
      </section>

      <section className="ops-linehaul-dashboard__panel">
        <header className="ops-linehaul-dashboard__panel-head">
          <div>
            <h3>Bảng đối soát tem xe và seal</h3>
            <span>
              {manifestsQuery.isLoading ? 'Đang tải...' : `${filteredRows.length} chuyến`}
            </span>
          </div>
          <em>Seal hiển thị “Chưa có” khi tem xe/chuyến chưa được đóng seal để quét xe đi</em>
        </header>

        {manifestsQuery.isLoading ? (
          <p className="ops-linehaul-dashboard__empty">Đang tải dữ liệu tem xe và manifest...</p>
        ) : null}
        {!manifestsQuery.isLoading && filteredRows.length === 0 ? (
          <p className="ops-linehaul-dashboard__empty">
            Chưa có chuyến xe phù hợp bộ lọc. Vào Tạo tem xe để tạo chuyến test mới.
          </p>
        ) : null}

        <div className="ops-linehaul-dashboard__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã chuyến / tem xe</th>
                <th>Tuyến</th>
                <th>Tài xế / xe</th>
                <th>Loại chuyến</th>
                <th>Xe đi</th>
                <th>Seal</th>
                <th>Bao hàng</th>
                <th>Kiện hàng</th>
                <th>Manifest</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.trip.id}>
                  <td>
                    <span className="ops-linehaul-dashboard__code">{row.trip.tripCode}</span>
                  </td>
                  <td>
                    <div className="ops-linehaul-dashboard__driver-cell">
                      <strong>{row.trip.originHubCode}</strong>
                      <span>{row.trip.destinationHubCode}</span>
                    </div>
                  </td>
                  <td>
                    <div className="ops-linehaul-dashboard__driver-cell">
                      <strong>{row.trip.driverName?.trim() || 'Chưa có tài xế'}</strong>
                      <span>{row.trip.vehiclePlate?.trim() || 'Chưa có biển số'}</span>
                    </div>
                  </td>
                  <td>{LINEHAUL_TRIP_TYPE_LABELS[row.trip.tripType]}</td>
                  <td>
                    <span
                      className={`ops-linehaul-dashboard__badge ${
                        row.hasSeal
                          ? 'ops-linehaul-dashboard__badge--arrived'
                          : row.hasVehicleLabel
                            ? 'ops-linehaul-dashboard__badge--pending'
                            : 'ops-linehaul-dashboard__badge--danger'
                      }`}
                    >
                      {row.vehicleStatusLabel}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`ops-linehaul-dashboard__badge ${
                        row.hasSeal
                          ? 'ops-linehaul-dashboard__badge--arrived'
                          : 'ops-linehaul-dashboard__badge--danger'
                      }`}
                    >
                      {row.sealLabel}
                    </span>
                  </td>
                  <td>{row.bagCount}</td>
                  <td>{row.shipmentCount}</td>
                  <td>
                    {row.manifest ? (
                      <Link to={routePaths.manifestDetail(row.manifest.id)}>
                        {row.manifest.manifestCode}
                      </Link>
                    ) : (
                      'Chưa có manifest'
                    )}
                  </td>
                  <td>
                    <div className="ops-linehaul-dashboard__driver-cell">
                      <strong>{formatDateTime(row.trip.plannedStartAt)}</strong>
                      <span>
                        {row.manifest?.sealedAt
                          ? `Seal: ${formatDateTime(row.manifest.sealedAt)}`
                          : 'Chưa ghi nhận seal'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="ops-linehaul-dashboard__pagination">
          <span>
            Hiển thị {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredRows.length, currentPage * pageSize)} / {filteredRows.length}
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
