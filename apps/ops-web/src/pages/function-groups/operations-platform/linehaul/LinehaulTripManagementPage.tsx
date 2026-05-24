import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Printer, RefreshCw } from 'lucide-react';

import { routePaths } from '../../../../navigation/routes';
import { formatDateTime } from '../../../../utils/format';
import {
  LINEHAUL_TRIP_TYPE_LABELS,
  getLinehaulTripStatus,
  getLinehaulTripStatusLabel,
  readLinehaulTrips,
  writeLinehaulTrips,
} from './linehaulTrips';
import type { LinehaulTrip, LinehaulTripStatus } from './linehaulTrips';
import { printLinehaulTripSeal } from './linehaulTripPrint';
import './LinehaulStyles.css';

interface LinehaulTripFilters {
  hubCode: string;
  tripType: string;
  status: string;
  keyword: string;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isTripOverdue(trip: LinehaulTrip): boolean {
  if (trip.printedAt) {
    return false;
  }

  const endAt = new Date(trip.plannedEndAt).getTime();
  return Number.isFinite(endAt) && Date.now() > endAt;
}

function statusTone(status: LinehaulTripStatus, overdue: boolean): string {
  if (overdue) {
    return 'danger';
  }
  if (status === 'PRINTED') {
    return 'arrived';
  }
  return 'pending';
}

export function LinehaulTripManagementPage(): React.JSX.Element {
  const [trips, setTrips] = useState<LinehaulTrip[]>(readLinehaulTrips);
  const [filters, setFilters] = useState<LinehaulTripFilters>({
    hubCode: 'ALL',
    tripType: 'ALL',
    status: 'ALL',
    keyword: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const hubOptions = useMemo(() => {
    const hubs = new Set<string>();
    for (const trip of trips) {
      hubs.add(trip.originHubCode);
      hubs.add(trip.destinationHubCode);
    }
    return Array.from(hubs).sort();
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const keyword = normalizeText(filters.keyword);

    return trips.filter((trip) => {
      const status = getLinehaulTripStatus(trip);
      const hubMatched =
        filters.hubCode === 'ALL' ||
        trip.originHubCode === filters.hubCode ||
        trip.destinationHubCode === filters.hubCode;
      const keywordMatched =
        !keyword ||
        normalizeText(trip.tripCode).includes(keyword) ||
        normalizeText(trip.originHubCode).includes(keyword) ||
        normalizeText(trip.destinationHubCode).includes(keyword);

      return (
        hubMatched &&
        (filters.tripType === 'ALL' || trip.tripType === filters.tripType) &&
        (filters.status === 'ALL' || status === filters.status) &&
        keywordMatched
      );
    });
  }, [filters, trips]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTrips = useMemo(
    () => filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredTrips, pageSize],
  );

  const kpis = useMemo(
    () => ({
      total: trips.length,
      planned: trips.filter((trip) => getLinehaulTripStatus(trip) === 'PLANNED').length,
      printed: trips.filter((trip) => getLinehaulTripStatus(trip) === 'PRINTED').length,
      overdue: trips.filter(isTripOverdue).length,
    }),
    [trips],
  );

  const updateFilter = <Key extends keyof LinehaulTripFilters>(
    key: Key,
    value: LinehaulTripFilters[Key],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveTrips = (nextTrips: LinehaulTrip[]) => {
    const sortedTrips = [...nextTrips].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    writeLinehaulTrips(sortedTrips);
    setTrips(sortedTrips);
  };

  const printTrip = (trip: LinehaulTrip) => {
    const opened = printLinehaulTripSeal(trip);
    if (!opened) {
      setActionMessage('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.');
      return;
    }

    const printedTrip = {
      ...trip,
      printedAt: new Date().toISOString(),
    };
    saveTrips(trips.map((item) => (item.id === trip.id ? printedTrip : item)));
    setActionMessage(`Đã in tem cho chuyến ${trip.tripCode}.`);
  };

  return (
    <section className="ops-linehaul-dashboard">
      <header className="ops-linehaul-dashboard__header">
        <div>
          <small>LINEHAUL_TRIP_MANAGEMENT</small>
          <h2>Quản lý chuyến xe</h2>
          <p>
            Danh sách chuyến đã tạo. In tem xe trước khi xe tới; courier sẽ quét tem ở bước
            Xe đi rồi quét đúng 2 seal để gắn seal với mã tem xe.
          </p>
        </div>
        <div className="ops-linehaul-dashboard__actions">
          <Link className="ops-linehaul-dashboard__primary-link" to={routePaths.linehaulVehicleSeal}>
            <Plus size={16} />
            Tạo và in tem
          </Link>
          <button
            type="button"
            onClick={() => {
              setTrips(readLinehaulTrips());
              setActionMessage(null);
            }}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </header>

      <section className="ops-linehaul-dashboard__kpis">
        <article>
          <span>Tổng chuyến</span>
          <strong>{kpis.total}</strong>
        </article>
        <article>
          <span>Chờ in tem</span>
          <strong>{kpis.planned}</strong>
        </article>
        <article data-tone="arrived">
          <span>Đã in tem</span>
          <strong>{kpis.printed}</strong>
        </article>
        <article data-tone="danger">
          <span>Quá giờ chưa in</span>
          <strong>{kpis.overdue}</strong>
        </article>
      </section>

      {actionMessage ? (
        <p
          className={
            actionMessage.startsWith('Đã')
              ? 'ops-linehaul-dashboard__success'
              : 'ops-linehaul-dashboard__error'
          }
          role="status"
        >
          {actionMessage}
        </p>
      ) : null}

      <section className="ops-linehaul-dashboard__filters">
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
          <span>Loại chuyến</span>
          <select
            value={filters.tripType}
            onChange={(event) => updateFilter('tripType', event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {Object.entries(LINEHAUL_TRIP_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            {(['PLANNED', 'PRINTED'] as const).map((status) => (
              <option key={status} value={status}>
                {getLinehaulTripStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tìm kiếm</span>
          <input
            value={filters.keyword}
            onChange={(event) => updateFilter('keyword', event.target.value)}
            placeholder="Mã chuyến, hub"
          />
        </label>
      </section>

      <section className="ops-linehaul-dashboard__panel">
        <header className="ops-linehaul-dashboard__panel-head">
          <div>
            <h3>Danh sách chuyến xe</h3>
            <span>{filteredTrips.length} chuyến</span>
          </div>
          <em>2 seal sẽ được courier ghi khi xác nhận Xe đi</em>
        </header>

        {filteredTrips.length === 0 ? (
          <p className="ops-linehaul-dashboard__empty">
            Chưa có chuyến xe phù hợp. Vào Tạo và in tem để tạo tem xe mới.
          </p>
        ) : (
          <div className="ops-linehaul-dashboard__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã chuyến</th>
                  <th>Trạng thái</th>
                  <th>Hub đi</th>
                  <th>Hub đến</th>
                  <th>Loại</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrips.map((trip) => {
                  const status = getLinehaulTripStatus(trip);
                  const overdue = isTripOverdue(trip);
                  return (
                    <tr key={trip.id}>
                      <td>
                        <span className="ops-linehaul-dashboard__code">{trip.tripCode}</span>
                      </td>
                      <td>
                        <span
                          className={`ops-linehaul-dashboard__badge ops-linehaul-dashboard__badge--${statusTone(
                            status,
                            overdue,
                          )}`}
                        >
                          {overdue ? 'Quá giờ chưa in' : getLinehaulTripStatusLabel(status)}
                        </span>
                      </td>
                      <td>{trip.originHubCode}</td>
                      <td>{trip.destinationHubCode}</td>
                      <td>{LINEHAUL_TRIP_TYPE_LABELS[trip.tripType]}</td>
                      <td>{formatDateTime(trip.plannedStartAt)}</td>
                      <td>{formatDateTime(trip.plannedEndAt)}</td>
                      <td>
                        <div className="ops-linehaul-dashboard__row-actions">
                          <button type="button" onClick={() => printTrip(trip)}>
                            <Printer size={15} />
                            {trip.printedAt ? 'In lại' : 'In tem'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="ops-linehaul-dashboard__pagination">
          <span>
            Hiển thị {filteredTrips.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(filteredTrips.length, currentPage * pageSize)} / {filteredTrips.length}
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
