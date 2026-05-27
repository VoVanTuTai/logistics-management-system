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
}

function buildDefaultForm(originHubCode: string): TripCreateFormState {
  const startAt = new Date();
  startAt.setHours(startAt.getHours() + 1, 0, 0, 0);
  const endAt = new Date(startAt);
  endAt.setHours(endAt.getHours() + 4);

  return {
    originHubCode,
    destinationHubCode: '',
    tripType: 'PICKUP',
    plannedStartAt: toDateTimeLocalValue(startAt),
    plannedEndAt: toDateTimeLocalValue(endAt),
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

    try {
      await createManifestMutation.mutateAsync({
        manifestCode: createdTrip.tripCode,
        originHubCode,
        destinationHubCode,
        shipmentCodes: [],
        note: [
          'LINEHAUL_TRIP',
          `tripType=${form.tripType}`,
          `plannedStartAt=${plannedStartAt}`,
          `plannedEndAt=${plannedEndAt}`,
        ].join('|'),
      });
    } catch (error) {
      setActionMessage(getErrorMessage(error));
      return;
    }

    const nextTrips = [createdTrip, ...trips];

    writeLinehaulTrips(nextTrips);
    setTrips(nextTrips);
    setCreatedTripCode(createdTrip.tripCode);
    setActionMessage(`Đã tạo chuyến xe ${createdTrip.tripCode}. Chưa in tem vì chưa có thông tin tài xế/xe.`);
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
            Tạo kế hoạch chuyến xe trước với hub đi, hub đến, loại chuyến và thời gian dự kiến.
            Tem xe sẽ in ở bước sau khi đã bổ sung tài xế, biển số và thông tin vận hành.
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
            <span>Tạo kế hoạch trước, chưa in tem khi chưa có tài xế/xe</span>
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
            />
          </label>
          <label>
            <span>Hub đến</span>
            <input
              list="ops-linehaul-hubs"
              value={form.destinationHubCode}
              onChange={(event) => updateForm('destinationHubCode', event.target.value)}
              placeholder="Ví dụ: HN01"
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
            />
          </label>
          <label>
            <span>Ngày giờ kết thúc</span>
            <input
              type="datetime-local"
              value={form.plannedEndAt}
              onChange={(event) => updateForm('plannedEndAt', event.target.value)}
            />
          </label>
        </div>
        <div className="ops-linehaul-seal__sync-strip">
          <article>
            <CheckCircle2 size={16} />
            <div>
              <strong>Đồng bộ mã chuyến</strong>
              <span>Mã chuyến được lưu trên hệ thống để dùng khi in tem ở bước sau.</span>
            </div>
          </article>
          <article>
            <CheckCircle2 size={16} />
            <div>
              <strong>Thông tin tối thiểu</strong>
              <span>Chỉ cần hub đi, hub đến, gom/phát hàng và khung thời gian chuyến.</span>
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
            Chưa có chuyến xe nào. Sau khi tạo, chuyến sẽ chờ bổ sung tài xế/xe trước khi in tem.
          </p>
        ) : (
          <div className="ops-linehaul-seal__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã chuyến</th>
                  <th>Giai đoạn</th>
                  <th>Trạng thái</th>
                  <th>Hub đi</th>
                  <th>Hub đến</th>
                  <th>Loại</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td>{trip.tripCode}</td>
                    <td>
                      <span className="ops-linehaul-seal__sync-badge">Kế hoạch</span>
                    </td>
                    <td>{getLinehaulTripStatusLabel(getLinehaulTripStatus(trip))}</td>
                    <td>{trip.originHubCode}</td>
                    <td>{trip.destinationHubCode}</td>
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
