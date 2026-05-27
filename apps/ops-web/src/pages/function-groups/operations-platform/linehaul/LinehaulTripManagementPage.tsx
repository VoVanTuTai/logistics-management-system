import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Printer, RefreshCw, Save } from 'lucide-react';

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

interface LinehaulTripOperationForm {
  tripId: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
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
  const [operationForm, setOperationForm] = useState<LinehaulTripOperationForm>({
    tripId: '',
    driverName: '',
    driverPhone: '',
    vehiclePlate: '',
  });
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
  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === operationForm.tripId) ?? null,
    [operationForm.tripId, trips],
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

  const canPrintTrip = (trip: LinehaulTrip): boolean =>
    Boolean(trip.driverName?.trim() && trip.vehiclePlate?.trim());

  const selectTripForOperation = (trip: LinehaulTrip) => {
    setOperationForm({
      tripId: trip.id,
      driverName: trip.driverName ?? '',
      driverPhone: trip.driverPhone ?? '',
      vehiclePlate: trip.vehiclePlate ?? '',
    });
    setActionMessage(null);
  };

  const updateOperationForm = <Key extends keyof LinehaulTripOperationForm>(
    key: Key,
    value: LinehaulTripOperationForm[Key],
  ) => {
    if (key === 'tripId') {
      const trip = trips.find((item) => item.id === value);
      if (trip) {
        selectTripForOperation(trip);
        return;
      }
    }

    setOperationForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const saveTripOperationInfo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const driverName = operationForm.driverName.trim();
    const driverPhone = operationForm.driverPhone.trim();
    const vehiclePlate = operationForm.vehiclePlate.trim().toUpperCase();

    if (!selectedTrip) {
      setActionMessage('Vui lòng chọn chuyến xe cần bổ sung thông tin.');
      return;
    }

    if (!driverName || !driverPhone || !vehiclePlate) {
      setActionMessage('Vui lòng nhập đủ tên tài xế, số điện thoại và biển số xe.');
      return;
    }

    const updatedTrip: LinehaulTrip = {
      ...selectedTrip,
      driverName,
      driverPhone,
      vehiclePlate,
    };

    saveTrips(trips.map((trip) => (trip.id === selectedTrip.id ? updatedTrip : trip)));
    setOperationForm({
      tripId: updatedTrip.id,
      driverName: updatedTrip.driverName ?? '',
      driverPhone: updatedTrip.driverPhone ?? '',
      vehiclePlate: updatedTrip.vehiclePlate ?? '',
    });
    setActionMessage(`Đã cập nhật tài xế/xe cho chuyến ${updatedTrip.tripCode}. Có thể in tem.`);
  };

  const printTrip = (trip: LinehaulTrip) => {
    if (!canPrintTrip(trip)) {
      setActionMessage(
        `Chuyến ${trip.tripCode} chưa có tài xế và biển số xe nên chưa thể in tem.`,
      );
      return;
    }

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
            Danh sách chuyến đã tạo. Chuyến mới chỉ có kế hoạch cơ bản; chỉ in tem xe sau
            khi đã bổ sung tài xế, biển số và thông tin vận hành.
          </p>
        </div>
        <div className="ops-linehaul-dashboard__actions">
          <Link className="ops-linehaul-dashboard__primary-link" to={routePaths.linehaulVehicleSeal}>
            <Plus size={16} />
            Tạo chuyến xe
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
          <span>Chờ bổ sung</span>
          <strong>{kpis.planned}</strong>
        </article>
        <article data-tone="arrived">
          <span>Đã in tem</span>
          <strong>{kpis.printed}</strong>
        </article>
        <article data-tone="danger">
          <span>Quá giờ chưa hoàn tất</span>
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

      <form className="ops-linehaul-dashboard__operation-form" onSubmit={saveTripOperationInfo}>
        <header>
          <div>
            <h3>Bổ sung tài xế và xe</h3>
            <span>Chọn chuyến đã tạo, nhập thông tin vận hành rồi mới in tem xe.</span>
          </div>
          <button type="submit">
            <Save size={16} />
            Lưu thông tin
          </button>
        </header>
        <div className="ops-linehaul-dashboard__operation-grid">
          <label>
            <span>Chuyến xe</span>
            <select
              value={operationForm.tripId}
              onChange={(event) => updateOperationForm('tripId', event.target.value)}
            >
              <option value="">Chọn chuyến cần bổ sung</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.tripCode} | {trip.originHubCode} - {trip.destinationHubCode}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Tài xế</span>
            <input
              value={operationForm.driverName}
              onChange={(event) => updateOperationForm('driverName', event.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </label>
          <label>
            <span>Số điện thoại</span>
            <input
              value={operationForm.driverPhone}
              onChange={(event) => updateOperationForm('driverPhone', event.target.value)}
              placeholder="Ví dụ: 0901234567"
            />
          </label>
          <label>
            <span>Biển số xe</span>
            <input
              value={operationForm.vehiclePlate}
              onChange={(event) => updateOperationForm('vehiclePlate', event.target.value)}
              placeholder="Ví dụ: 51C-12345"
            />
          </label>
        </div>
        {selectedTrip ? (
          <p className="ops-linehaul-dashboard__operation-hint">
            Đang chọn {selectedTrip.tripCode}. Sau khi lưu đủ tài xế, số điện thoại và biển số,
            nút In tem sẽ dùng các thông tin này trên tem xe.
          </p>
        ) : null}
      </form>

      <section className="ops-linehaul-dashboard__panel">
        <header className="ops-linehaul-dashboard__panel-head">
          <div>
            <h3>Danh sách chuyến xe</h3>
            <span>{filteredTrips.length} chuyến</span>
          </div>
          <em>Courier sẽ ghi một hoặc nhiều seal khi xác nhận Xe đi</em>
        </header>

        {filteredTrips.length === 0 ? (
          <p className="ops-linehaul-dashboard__empty">
            Chưa có chuyến xe phù hợp. Vào Tạo chuyến xe để tạo kế hoạch mới.
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
                  <th>Tài xế / xe</th>
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
                          {overdue ? 'Quá giờ chưa hoàn tất' : getLinehaulTripStatusLabel(status)}
                        </span>
                      </td>
                      <td>{trip.originHubCode}</td>
                      <td>{trip.destinationHubCode}</td>
                      <td>{LINEHAUL_TRIP_TYPE_LABELS[trip.tripType]}</td>
                      <td>
                        <div className="ops-linehaul-dashboard__driver-cell">
                          <strong>{trip.driverName?.trim() || 'Chưa có tài xế'}</strong>
                          <span>
                            {trip.vehiclePlate?.trim() || 'Chưa có biển số'}
                            {trip.driverPhone?.trim() ? ` | ${trip.driverPhone}` : ''}
                          </span>
                        </div>
                      </td>
                      <td>{formatDateTime(trip.plannedStartAt)}</td>
                      <td>{formatDateTime(trip.plannedEndAt)}</td>
                      <td>
                        <div className="ops-linehaul-dashboard__row-actions">
                          <button type="button" onClick={() => selectTripForOperation(trip)}>
                            <Pencil size={15} />
                            Bổ sung
                          </button>
                          <button type="button" onClick={() => printTrip(trip)}>
                            <Printer size={15} />
                            {trip.printedAt ? 'In lại' : 'In tem'}
                          </button>
                          {!canPrintTrip(trip) ? (
                            <span className="ops-linehaul-dashboard__action-note">
                              Chưa có tài xế/xe
                            </span>
                          ) : null}
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
