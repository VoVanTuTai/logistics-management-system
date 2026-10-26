import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Plus, RefreshCw } from 'lucide-react';

import { useCreateManifestMutation } from '../../../../features/manifests/manifests.api';
import { useHubsQuery } from '../../../../features/masterdata/masterdata.api';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  LINEHAUL_TRIP_TYPE_LABELS,
  createLinehaulTrip,
  fromDateTimeLocalValue,
  getLinehaulTripStatus,
  getLinehaulTripStatusLabel,
  normalizeTripCode,
  readLinehaulTrips,
  toDateTimeLocalValue,
  writeLinehaulTrips,
} from './linehaulTrips';
import type { LinehaulTrip, LinehaulTripType } from './linehaulTrips';
import './LinehaulStyles.css';

interface TripCreateFormState {
  originHubCode: string;
  destinationHubCode: string;
  tripType: LinehaulTripType;
  plannedStartAt: string;
  plannedEndAt: string;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  shipmentCount: number;
}

function buildDefaultForm(originHubCode: string): TripCreateFormState {
  const startAt = new Date();
  startAt.setHours(startAt.getHours() + 1, 0, 0, 0);
  const endAt = new Date(startAt);
  endAt.setHours(endAt.getHours() + 4);

  return {
    originHubCode,
    destinationHubCode: '',
    tripType: 'DELIVERY',
    plannedStartAt: toDateTimeLocalValue(startAt),
    plannedEndAt: toDateTimeLocalValue(endAt),
    vehiclePlate: '',
    driverName: '',
    driverPhone: '',
    shipmentCount: 0,
  };
}

export function LinehaulVehicleSealPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const defaultOriginHubCode = normalizeTripCode(session?.user.hubCodes?.[0] ?? '');
  const [form, setForm] = useState<TripCreateFormState>(() =>
    buildDefaultForm(defaultOriginHubCode),
  );
  const [trips, setTrips] = useState<LinehaulTrip[]>(readLinehaulTrips);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [createdTripCode, setCreatedTripCode] = useState<string | null>(null);

  const hubsQuery = useHubsQuery(accessToken, {});
  const createManifestMutation = useCreateManifestMutation(accessToken);
  const activeHubs = useMemo(
    () =>
      (hubsQuery.data ?? [])
        .filter((hub) => hub.isActive)
        .sort((left, right) => left.code.localeCompare(right.code)),
    [hubsQuery.data],
  );
  const recentTrips = trips.slice(0, 5);

  const updateForm = <Key extends keyof TripCreateFormState>(
    key: Key,
    value: TripCreateFormState[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetWithNextWindow = () => {
    setForm((current) => ({
      ...buildDefaultForm(current.originHubCode),
      tripType: current.tripType,
    }));
  };

  const onCreateTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);
    setCreatedTripCode(null);

    if (!accessToken) {
      setActionMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    const originHubCode = normalizeTripCode(form.originHubCode);
    const destinationHubCode = normalizeTripCode(form.destinationHubCode);
    const plannedStartAt = fromDateTimeLocalValue(form.plannedStartAt);
    const plannedEndAt = fromDateTimeLocalValue(form.plannedEndAt);
    const vehiclePlate = form.vehiclePlate.trim().toUpperCase();
    const driverName = form.driverName.trim();
    const driverPhone = form.driverPhone.trim();
    const shipmentCount = Number(form.shipmentCount || 0);

    if (!originHubCode || !destinationHubCode) {
      setActionMessage('Vui lòng nhập đủ hub đi và hub đến.');
      return;
    }

    if (originHubCode === destinationHubCode) {
      setActionMessage('Hub đến phải khác hub đi.');
      return;
    }

    if (!plannedStartAt || !plannedEndAt) {
      setActionMessage('Vui lòng nhập ngày giờ bắt đầu và kết thúc hợp lệ.');
      return;
    }

    if (new Date(plannedEndAt).getTime() <= new Date(plannedStartAt).getTime()) {
      setActionMessage('Ngày giờ kết thúc phải sau ngày giờ bắt đầu.');
      return;
    }

    const createdTrip = createLinehaulTrip({
      originHubCode,
      destinationHubCode,
      tripType: form.tripType,
      plannedStartAt,
      plannedEndAt,
    });

    if (vehiclePlate) createdTrip.vehiclePlate = vehiclePlate;
    if (driverName) createdTrip.driverName = driverName;
    if (driverPhone) createdTrip.driverPhone = driverPhone;
    if (shipmentCount > 0) createdTrip.shipmentCount = shipmentCount;

    const noteSegments = [
      'LINEHAUL_TRIP',
      `tripType=${form.tripType}`,
      `originHubCode=${originHubCode}`,
      `destinationHubCode=${destinationHubCode}`,
      `plannedStartAt=${plannedStartAt}`,
      `plannedEndAt=${plannedEndAt}`,
      driverName ? `driverName=${driverName}` : null,
      driverPhone ? `driverPhone=${driverPhone}` : null,
      vehiclePlate ? `vehiclePlate=${vehiclePlate}` : null,
      vehiclePlate ? `licensePlate=${vehiclePlate}` : null,
      shipmentCount > 0 ? `shipmentCount=${shipmentCount}` : null,
    ].filter(Boolean);

    try {
      await createManifestMutation.mutateAsync({
        manifestCode: createdTrip.tripCode,
        originHubCode,
        destinationHubCode,
        shipmentCodes: [],
        note: noteSegments.join('|'),
      });
    } catch (error) {
      setActionMessage(getErrorMessage(error));
      return;
    }

    const nextTrips = [createdTrip, ...trips];

    writeLinehaulTrips(nextTrips);
    setTrips(nextTrips);
    setCreatedTripCode(createdTrip.tripCode);

    if (vehiclePlate && driverName) {
      setActionMessage(`Đã tạo chuyến xe ${createdTrip.tripCode} (Xe: ${vehiclePlate}, Tài xế: ${driverName}, ${shipmentCount} kiện). Đã sẵn sàng in tem và kẹp chì xuất bến.`);
    } else {
      setActionMessage(`Đã tạo chuyến xe ${createdTrip.tripCode}. Chuyến xe chờ bổ sung tài xế/xe trước khi in tem.`);
    }

    resetWithNextWindow();
  };

  return (
    <section className="ops-linehaul-seal">
      <header className="ops-linehaul-seal__header">
        <div>
          <Link to={routePaths.linehaulTripManagement}>
            <ArrowLeft size={16} />
            Quản lý chuyến xe
          </Link>
          <small>LINEHAUL_TRIP_CREATE</small>
          <h2>Tạo chuyến xe</h2>
          <p>
            Tạo kế hoạch chuyến xe tải trung chuyển liên Hub với đầy đủ lộ trình, thời gian, phương tiện
            và tài xế phụ trách. Chuyến xe sẽ được lưu vào cơ sở dữ liệu để in tem và kẹp chì niêm phong.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTrips(readLinehaulTrips());
            void hubsQuery.refetch();
          }}
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </header>

      {hubsQuery.error ? (
        <p className="ops-linehaul-seal__error" role="alert">
          {getErrorMessage(hubsQuery.error)}
        </p>
      ) : null}

      <form className="ops-linehaul-dashboard__create-form" onSubmit={onCreateTrip}>
        <header>
          <div>
            <h3>Thông tin chuyến xe</h3>
            <span>Có thể nhập ngay tài xế/biển số xe để in tem và kẹp chì nhanh chóng</span>
          </div>
          <button type="submit" disabled={createManifestMutation.isPending}>
            <Plus size={16} />
            {createManifestMutation.isPending ? 'Đang tạo...' : 'Tạo chuyến xe'}
          </button>
        </header>

        <div className="ops-linehaul-dashboard__create-grid ops-linehaul-dashboard__create-grid--wide">
          <label>
            <span>Hub đi</span>
            <input
              list="ops-linehaul-hubs"
              value={form.originHubCode}
              onChange={(event) => updateForm('originHubCode', event.target.value)}
              placeholder="Ví dụ: HCM01"
              required
            />
          </label>
          <label>
            <span>Hub đến</span>
            <input
              list="ops-linehaul-hubs"
              value={form.destinationHubCode}
              onChange={(event) => updateForm('destinationHubCode', event.target.value)}
              placeholder="Ví dụ: HN01"
              required
            />
          </label>
          <datalist id="ops-linehaul-hubs">
            {activeHubs.map((hub) => (
              <option key={hub.id} value={normalizeTripCode(hub.code)}>
                {hub.name}
              </option>
            ))}
          </datalist>
          <label>
            <span>Loại chuyến</span>
            <select
              value={form.tripType}
              onChange={(event) => updateForm('tripType', event.target.value as LinehaulTripType)}
            >
              {Object.entries(LINEHAUL_TRIP_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Ngày giờ bắt đầu</span>
            <input
              type="datetime-local"
              value={form.plannedStartAt}
              onChange={(event) => updateForm('plannedStartAt', event.target.value)}
              required
            />
          </label>
          <label>
            <span>Ngày giờ kết thúc dự kiến</span>
            <input
              type="datetime-local"
              value={form.plannedEndAt}
              onChange={(event) => updateForm('plannedEndAt', event.target.value)}
              required
            />
          </label>
          <label>
            <span>Biển số xe tải</span>
            <input
              value={form.vehiclePlate}
              onChange={(event) => updateForm('vehiclePlate', event.target.value)}
              placeholder="Ví dụ: 29C-882.14 hoặc 51D-938.22"
            />
          </label>
          <label>
            <span>Họ tên tài xế</span>
            <input
              value={form.driverName}
              onChange={(event) => updateForm('driverName', event.target.value)}
              placeholder="Ví dụ: Nguyễn Văn Tuấn"
            />
          </label>
          <label>
            <span>SĐT tài xế</span>
            <input
              value={form.driverPhone}
              onChange={(event) => updateForm('driverPhone', event.target.value)}
              placeholder="Ví dụ: 0908123456"
            />
          </label>
          <label>
            <span>Số lượng kiện hàng xếp xe</span>
            <input
              type="number"
              min="0"
              value={form.shipmentCount}
              onChange={(event) => updateForm('shipmentCount', Number(event.target.value))}
              placeholder="Ví dụ: 45 kiện"
            />
          </label>
        </div>
        <div className="ops-linehaul-seal__sync-strip">
          <article>
            <CheckCircle2 size={16} />
            <div>
              <strong>Đồng bộ cơ sở dữ liệu PostgreSQL</strong>
              <span>Chuyến xe tự động lưu vào Manifest Service và đồng bộ tức thì trên toàn hệ thống các Hub.</span>
            </div>
          </article>
          <article>
            <CheckCircle2 size={16} />
            <div>
              <strong>Quy trình khép kín</strong>
              <span>Sau khi tạo, có thể in tem xe, kẹp seal chì niêm phong và đối soát nhận hàng tại Hub đích.</span>
            </div>
          </article>
        </div>
      </form>

      {actionMessage ? (
        <p
          className={
            actionMessage.startsWith('Đã')
              ? 'ops-linehaul-dashboard__success'
              : 'ops-linehaul-dashboard__error'
          }
          role="status"
        >
          {actionMessage}{' '}
          {createdTripCode ? (
            <Link to={routePaths.linehaulTripManagement}>Xem trong Quản lý chuyến xe</Link>
          ) : null}
        </p>
      ) : null}

      <section className="ops-linehaul-seal__panel">
        <header className="ops-linehaul-seal__panel-head">
          <h3>Chuyến xe vừa tạo gần đây</h3>
          <span>{recentTrips.length} chuyến</span>
        </header>
        {recentTrips.length === 0 ? (
          <p className="ops-linehaul-seal__empty">
            Chưa có chuyến xe nào. Hãy nhập thông tin bên trên để tạo chuyến xe mới.
          </p>
        ) : (
          <div className="ops-linehaul-seal__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã chuyến</th>
                  <th>Giai đoạn</th>
                  <th>Trạng thái</th>
                  <th>Tuyến xe</th>
                  <th>Tài xế & Phương tiện</th>
                  <th>Số kiện</th>
                  <th>Loại</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <strong>{trip.tripCode}</strong>
                    </td>
                    <td>
                      <span className="ops-linehaul-seal__sync-badge">
                        {trip.vehiclePlate && trip.driverName ? 'Đã gán xe' : 'Kế hoạch'}
                      </span>
                    </td>
                    <td>{getLinehaulTripStatusLabel(getLinehaulTripStatus(trip))}</td>
                    <td>{trip.originHubCode} ➔ {trip.destinationHubCode}</td>
                    <td>
                      {trip.vehiclePlate || trip.driverName ? (
                        <span>
                          <strong>{trip.vehiclePlate || 'Chưa có biển số'}</strong>
                          {trip.driverName ? ` | ${trip.driverName}` : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Chưa bổ sung</span>
                      )}
                    </td>
                    <td>
                      <strong>{trip.shipmentCount ?? 0}</strong> kiện
                    </td>
                    <td>{LINEHAUL_TRIP_TYPE_LABELS[trip.tripType]}</td>
                    <td>{formatDateTime(trip.plannedStartAt)}</td>
                    <td>{formatDateTime(trip.plannedEndAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
