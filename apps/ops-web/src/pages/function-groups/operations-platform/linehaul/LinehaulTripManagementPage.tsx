import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LinehaulVehicleSealPage } from './LinehaulVehicleSealPage';
import { LinehaulTripDataMonitorPage } from './LinehaulTripDataMonitorPage';
import {
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  Package,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Truck,
  X,
} from 'lucide-react';

import { manifestsClient, useManifestsQuery } from '../../../../features/manifests/manifests.api';
import { useHubScope } from '../../../../hooks/useHubScope';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  LINEHAUL_TRIP_TYPE_LABELS,
  getLinehaulTripStatus,
  getLinehaulTripStatusLabel,
  mergeTripsWithManifests,
  normalizeTripCode,
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
  direction?: 'ALL' | 'ORIGIN' | 'DESTINATION';
}

interface LinehaulTripOperationForm {
  tripId: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  shipmentCount?: number;
}

interface SealFormState {
  trip: LinehaulTrip | null;
  sealCode: string;
  sealedBy: string;
  note: string;
}

interface ReceiveFormState {
  trip: LinehaulTrip | null;
  receiverName: string;
  sealCondition: 'INTACT' | 'BROKEN' | 'MISMATCH';
  actualShipments: number;
  note: string;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isTripOverdue(trip: LinehaulTrip): boolean {
  if (trip.receivedAt || trip.sealedAt) {
    return false;
  }

  const endAt = new Date(trip.plannedEndAt).getTime();
  return Number.isFinite(endAt) && Date.now() > endAt;
}

function statusTone(status: LinehaulTripStatus, overdue: boolean): string {
  if (overdue) {
    return 'danger';
  }
  if (status === 'RECEIVED') {
    return 'received';
  }
  if (status === 'SEALED') {
    return 'sealed';
  }
  if (status === 'PRINTED') {
    return 'printed';
  }
  return 'pending';
}

function buildLinehaulTripNote(trip: LinehaulTrip): string {
  return [
    'LINEHAUL_TRIP',
    `tripType=${trip.tripType}`,
    `originHubCode=${trip.originHubCode}`,
    `destinationHubCode=${trip.destinationHubCode}`,
    `plannedStartAt=${trip.plannedStartAt}`,
    `plannedEndAt=${trip.plannedEndAt}`,
    trip.driverName?.trim() ? `driverName=${trip.driverName.trim()}` : null,
    trip.driverPhone?.trim() ? `driverPhone=${trip.driverPhone.trim()}` : null,
    trip.vehiclePlate?.trim() ? `vehiclePlate=${trip.vehiclePlate.trim().toUpperCase()}` : null,
    trip.vehiclePlate?.trim() ? `licensePlate=${trip.vehiclePlate.trim().toUpperCase()}` : null,
    trip.shipmentCount !== undefined ? `shipmentCount=${trip.shipmentCount}` : null,
  ]
    .filter((segment): segment is string => Boolean(segment))
    .join('|');
}

export function LinehaulTripManagementPage(): React.JSX.Element {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') || 'trips';
    } catch {
      return 'trips';
    }
  });

  const handleSwitchTab = (tab: string) => {
    setCurrentTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // ignore
    }
  };

  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const assignedHubCodes = useMemo(
    () => (session?.user.hubCodes ?? []).map(normalizeTripCode).filter(Boolean),
    [session?.user.hubCodes],
  );
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const hubScope = useHubScope();

  // Queries & Local state
  const manifestsQuery = useManifestsQuery(accessToken, { refetchInterval: 8000 });
  const [localTrips, setLocalTrips] = useState<LinehaulTrip[]>(readLinehaulTrips);

  // Combine Real DB Manifests with Local storage
  const trips = useMemo(() => {
    return mergeTripsWithManifests(manifestsQuery.data ?? [], localTrips);
  }, [manifestsQuery.data, localTrips]);

  // Operation Modal (Driver / Vehicle)
  const [operationModalOpen, setOperationModalOpen] = useState(false);
  const [operationForm, setOperationForm] = useState<LinehaulTripOperationForm>({
    tripId: '',
    driverName: '',
    driverPhone: '',
    vehiclePlate: '',
    shipmentCount: 0,
  });

  // Seal Modal (Kẹp chì & Xuất bến)
  const [sealModalOpen, setSealModalOpen] = useState(false);
  const [sealForm, setSealForm] = useState<SealFormState>({
    trip: null,
    sealCode: '',
    sealedBy: '',
    note: '',
  });

  // Receive Handover Modal (Tiếp nhận xe & Cắt chì tại Hub đích)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveForm, setReceiveForm] = useState<ReceiveFormState>({
    trip: null,
    receiverName: '',
    sealCondition: 'INTACT',
    actualShipments: 0,
    note: '',
  });

  // View Handover Modal
  const [viewHandoverTrip, setViewHandoverTrip] = useState<LinehaulTrip | null>(null);

  // Filters
  const [filters, setFilters] = useState<LinehaulTripFilters>({
    hubCode: 'ALL',
    tripType: 'ALL',
    status: 'ALL',
    keyword: '',
    direction: 'ALL',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const effectiveHubCodes = useMemo(() => {
    const list = hubScope.scopedHubCodes.length > 0 ? hubScope.scopedHubCodes : assignedHubCodes;
    return list.map(normalizeTripCode).filter(Boolean);
  }, [hubScope.scopedHubCodes, assignedHubCodes]);

  const isAllSystem = canViewAllHubAreas || hubScope.isAllSystem;

  // Quy tắc phạm vi Hub đối với Tuyến xe / Chuyến xe:
  // 1. Mặc định chỉ hiển thị chuyến xe mà Hub mình là Hub đi (origin) HOẶC Hub đến (destination)
  // 2. Tra cứu bằng từ khóa: tìm kiếm toàn quốc
  const scopedTrips = useMemo(() => {
    const keyword = normalizeText(filters.keyword);
    if (keyword) {
      const matchAll = trips.filter(
        (trip) =>
          normalizeText(trip.tripCode).includes(keyword) ||
          normalizeText(trip.vehiclePlate).includes(keyword) ||
          normalizeText(trip.driverName).includes(keyword) ||
          normalizeText(trip.originHubCode).includes(keyword) ||
          normalizeText(trip.destinationHubCode).includes(keyword) ||
          normalizeText(trip.sealCode).includes(keyword),
      );
      if (matchAll.length > 0) {
        return matchAll;
      }
    }

    if (isAllSystem) {
      return trips;
    }

    if (effectiveHubCodes.length === 0) {
      return [];
    }

    return trips.filter((trip) => {
      const isOrigin = effectiveHubCodes.includes(normalizeTripCode(trip.originHubCode));
      const isDest = effectiveHubCodes.includes(normalizeTripCode(trip.destinationHubCode));
      return isOrigin || isDest;
    });
  }, [effectiveHubCodes, filters.keyword, isAllSystem, trips]);

  const hubOptions = useMemo(() => {
    const hubs = new Set<string>();
    for (const trip of scopedTrips) {
      hubs.add(trip.originHubCode);
      hubs.add(trip.destinationHubCode);
    }
    return Array.from(hubs).sort();
  }, [scopedTrips]);

  const filteredTrips = useMemo(() => {
    const keyword = normalizeText(filters.keyword);

    return scopedTrips.filter((trip) => {
      const status = getLinehaulTripStatus(trip);
      const hubMatched =
        filters.hubCode === 'ALL' ||
        trip.originHubCode === filters.hubCode ||
        trip.destinationHubCode === filters.hubCode;
      const keywordMatched =
        !keyword ||
        normalizeText(trip.tripCode).includes(keyword) ||
        normalizeText(trip.originHubCode).includes(keyword) ||
        normalizeText(trip.destinationHubCode).includes(keyword) ||
        normalizeText(trip.vehiclePlate).includes(keyword) ||
        normalizeText(trip.driverName).includes(keyword) ||
        normalizeText(trip.sealCode).includes(keyword);

      const directionMatched =
        !filters.direction ||
        filters.direction === 'ALL' ||
        isAllSystem ||
        (filters.direction === 'ORIGIN' &&
          effectiveHubCodes.includes(normalizeTripCode(trip.originHubCode))) ||
        (filters.direction === 'DESTINATION' &&
          effectiveHubCodes.includes(normalizeTripCode(trip.destinationHubCode)));

      return (
        hubMatched &&
        directionMatched &&
        (filters.tripType === 'ALL' || trip.tripType === filters.tripType) &&
        (filters.status === 'ALL' || status === filters.status) &&
        keywordMatched
      );
    });
  }, [effectiveHubCodes, filters, isAllSystem, scopedTrips]);

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
      total: scopedTrips.length,
      planned: scopedTrips.filter((trip) => getLinehaulTripStatus(trip) === 'PLANNED').length,
      printed: scopedTrips.filter((trip) => getLinehaulTripStatus(trip) === 'PRINTED').length,
      sealed: scopedTrips.filter((trip) => getLinehaulTripStatus(trip) === 'SEALED').length,
      received: scopedTrips.filter((trip) => getLinehaulTripStatus(trip) === 'RECEIVED').length,
      overdue: scopedTrips.filter(isTripOverdue).length,
    }),
    [scopedTrips],
  );

  const selectedTrip = useMemo(
    () => scopedTrips.find((trip) => trip.id === operationForm.tripId) ?? null,
    [operationForm.tripId, scopedTrips],
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

  const saveLocalAndSync = (nextTrips: LinehaulTrip[]) => {
    const sortedTrips = [...nextTrips].sort((left, right) =>
      (right.createdAt || '').localeCompare(left.createdAt || ''),
    );
    writeLinehaulTrips(sortedTrips);
    setLocalTrips(sortedTrips);
  };

  const canPrintTrip = (trip: LinehaulTrip): boolean =>
    Boolean(trip.driverName?.trim() && trip.vehiclePlate?.trim());

  const canUserReceive = (trip: LinehaulTrip): boolean => {
    if (isAllSystem) return true;
    return effectiveHubCodes.includes(normalizeTripCode(trip.destinationHubCode));
  };

  const selectTripForOperation = (trip: LinehaulTrip) => {
    setOperationForm({
      tripId: trip.id,
      driverName: trip.driverName ?? '',
      driverPhone: trip.driverPhone ?? '',
      vehiclePlate: trip.vehiclePlate ?? '',
      shipmentCount: trip.shipmentCount ?? 0,
    });
    setActionMessage(null);
    setOperationModalOpen(true);
  };

  const updateOperationForm = <Key extends keyof LinehaulTripOperationForm>(
    key: Key,
    value: LinehaulTripOperationForm[Key],
  ) => {
    if (key === 'tripId') {
      const trip = scopedTrips.find((item) => item.id === value);
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

  const saveTripOperationInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const driverName = operationForm.driverName.trim();
    const driverPhone = operationForm.driverPhone.trim();
    const vehiclePlate = operationForm.vehiclePlate.trim().toUpperCase();
    const shipmentCount = Number(operationForm.shipmentCount ?? 0);

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
      shipmentCount,
    };

    const nextLocal = localTrips.map((trip) => (trip.id === selectedTrip.id ? updatedTrip : trip));
    saveLocalAndSync(nextLocal);
    setOperationModalOpen(false);

    if (!accessToken) {
      setActionMessage(
        `Đã cập nhật tài xế/xe cho chuyến ${updatedTrip.tripCode} trên bộ nhớ máy. Chưa có kết nối Ops API.`,
      );
      return;
    }

    try {
      const targetManifestId = selectedTrip.manifestId || selectedTrip.id;
      if (targetManifestId) {
        await manifestsClient.update(accessToken, targetManifestId, {
          originHubCode: updatedTrip.originHubCode,
          destinationHubCode: updatedTrip.destinationHubCode,
          note: buildLinehaulTripNote(updatedTrip),
        });
      }

      await manifestsQuery.refetch();
      setActionMessage(`Đã cập nhật tài xế (${driverName}), biển số (${vehiclePlate}) cho chuyến ${updatedTrip.tripCode}. Đã sẵn sàng in tem và xuất bến.`);
    } catch (error) {
      setActionMessage(
        `Đã lưu trên máy nhưng chưa cập nhật lên server Ops: ${getErrorMessage(error)}`,
      );
    }
  };

  const printTrip = (trip: LinehaulTrip) => {
    if (!canPrintTrip(trip)) {
      selectTripForOperation(trip);
      setActionMessage(
        `Chuyến ${trip.tripCode} chưa có thông tin tài xế và biển số xe nên chưa thể in tem. Vui lòng bổ sung trước.`,
      );
      return;
    }

    const opened = printLinehaulTripSeal(trip);
    if (!opened) {
      setActionMessage('Trình duyệt đang chặn cửa sổ in tem. Hãy cho phép popup và thử lại.');
      return;
    }

    const printedTrip: LinehaulTrip = {
      ...trip,
      printedAt: new Date().toISOString(),
    };
    saveLocalAndSync(localTrips.map((item) => (item.id === trip.id ? printedTrip : item)));
    setActionMessage(`Đã in tem niêm phong xe cho chuyến ${trip.tripCode}.`);
  };

  // Seal & Dispatch Modal Handlers
  const openSealModal = (trip: LinehaulTrip) => {
    if (!canPrintTrip(trip)) {
      selectTripForOperation(trip);
      setActionMessage(`Chuyến ${trip.tripCode} cần có thông tin tài xế & xe trước khi kẹp chì xuất bến.`);
      return;
    }

    const defaultSeal = `SL-${Math.floor(100000 + Math.random() * 900000)}`;
    const defaultSealer = session?.user.displayName || session?.user.username || 'Điều phối viên Hub';

    setSealForm({
      trip,
      sealCode: defaultSeal,
      sealedBy: defaultSealer,
      note: `Xe thùng bạt/kín ${trip.vehiclePlate}. Niêm phong cửa hậu 01 seal cáp bảo mật.`,
    });
    setSealModalOpen(true);
    setActionMessage(null);
  };

  const submitSeal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sealForm.trip) return;

    const sealCode = sealForm.sealCode.trim();
    const sealedBy = sealForm.sealedBy.trim();
    if (!sealCode) {
      setActionMessage('Vui lòng nhập mã seal chì niêm phong.');
      return;
    }

    if (!accessToken) {
      setActionMessage('Phiên đăng nhập đã hết hạn.');
      return;
    }

    const manifestId = sealForm.trip.manifestId || sealForm.trip.id;

    try {
      await manifestsClient.seal(accessToken, manifestId, {
        sealCode,
        note: `sealCode=${sealCode}|sealedBy=${sealedBy}|${sealForm.note.trim()}`,
      });

      const updatedLocal = localTrips.map((t) =>
        t.id === sealForm.trip?.id
          ? {
              ...t,
              sealedAt: new Date().toISOString(),
              sealCode,
              sealedBy,
            }
          : t,
      );
      saveLocalAndSync(updatedLocal);
      await manifestsQuery.refetch();

      setSealModalOpen(false);
      setActionMessage(
        `Đã kẹp chì thành công cho chuyến ${sealForm.trip.tripCode} với mã seal [${sealCode}]. Xe đang vận chuyển từ ${sealForm.trip.originHubCode} đến ${sealForm.trip.destinationHubCode}.`,
      );
    } catch (error) {
      setActionMessage(`Không thể kẹp chì xuất bến: ${getErrorMessage(error)}`);
    }
  };

  // Receive Handover Modal Handlers
  const openReceiveModal = (trip: LinehaulTrip) => {
    const defaultReceiver = session?.user.displayName || session?.user.username || 'Thủ kho Hub đích';
    setReceiveForm({
      trip,
      receiverName: defaultReceiver,
      sealCondition: 'INTACT',
      actualShipments: trip.shipmentCount ?? 0,
      note: 'Đã cắt chì kiểm tra thực tế, niêm phong nguyên vẹn, nhận đủ kiện vào kho phân loại Hub.',
    });
    setReceiveModalOpen(true);
    setActionMessage(null);
  };

  const submitReceive = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receiveForm.trip) return;

    const receiverName = receiveForm.receiverName.trim();
    if (!receiverName) {
      setActionMessage('Vui lòng nhập họ tên người tiếp nhận xe.');
      return;
    }

    if (!accessToken) {
      setActionMessage('Phiên đăng nhập đã hết hạn.');
      return;
    }

    const manifestId = receiveForm.trip.manifestId || receiveForm.trip.id;
    const conditionText =
      receiveForm.sealCondition === 'INTACT'
        ? 'Niêm phong nguyên vẹn (Khớp mã seal)'
        : receiveForm.sealCondition === 'BROKEN'
          ? 'Seal bị rách / hỏng / đứt cáp'
          : 'Sai lệch mã seal so với xuất bến';

    const handoverNote = `Tình trạng seal: ${conditionText} | Thực nhận: ${receiveForm.actualShipments}/${receiveForm.trip.shipmentCount ?? 0} kiện | ${receiveForm.note.trim()}`;

    try {
      await manifestsClient.receiveHandover(accessToken, manifestId, {
        manifestCode: receiveForm.trip.tripCode,
        receiverName,
        note: handoverNote,
      });

      const updatedLocal = localTrips.map((t) =>
        t.id === receiveForm.trip?.id
          ? {
              ...t,
              receivedAt: new Date().toISOString(),
              receivedBy: receiverName,
              receiveNote: handoverNote,
            }
          : t,
      );
      saveLocalAndSync(updatedLocal);
      await manifestsQuery.refetch();

      setReceiveModalOpen(false);
      setActionMessage(
        `Đã hoàn tất tiếp nhận xe ${receiveForm.trip.tripCode} tại Hub đích ${receiveForm.trip.destinationHubCode}. Toàn bộ ${receiveForm.actualShipments} kiện hàng đã chuyển vào quy trình phân loại.`,
      );
    } catch (error) {
      setActionMessage(`Lỗi tiếp nhận xe: ${getErrorMessage(error)}`);
    }
  };

  return (
    <section className="ops-linehaul-dashboard">
      {/* Unified Tab Navigation Bar */}
      <div className="ops-unified-sub-tabs" role="tablist">
        <button
          type="button"
          className={`ops-unified-sub-tab-btn ${currentTab === 'trips' ? 'ops-unified-sub-tab-btn--active' : ''}`}
          onClick={() => handleSwitchTab('trips')}
        >
          <Truck size={15} />
          <span>Quản lý Chuyến xe tải</span>
        </button>
        <button
          type="button"
          className={`ops-unified-sub-tab-btn ${currentTab === 'seal' ? 'ops-unified-sub-tab-btn--active' : ''}`}
          onClick={() => handleSwitchTab('seal')}
        >
          <Lock size={15} />
          <span>Niêm phong & Kẹp chì xe</span>
        </button>
        <button
          type="button"
          className={`ops-unified-sub-tab-btn ${currentTab === 'monitor' ? 'ops-unified-sub-tab-btn--active' : ''}`}
          onClick={() => handleSwitchTab('monitor')}
        >
          <Clock size={15} />
          <span>Giám sát Dữ liệu Chuyến xe</span>
        </button>
      </div>

      {currentTab === 'seal' ? (
        <LinehaulVehicleSealPage />
      ) : currentTab === 'monitor' ? (
        <LinehaulTripDataMonitorPage />
      ) : (
        <>
          <header className="ops-linehaul-dashboard__header">
            <div>
              <small>LINEHAUL_TRIP_MANAGEMENT</small>
              <h2>Quản lý chuyến xe</h2>
              <p>
                Giám sát toàn trình xe tải trung chuyển liên Hub: Biển số xe, tài xế phụ trách, số lượng kiện hàng,
                mã chì niêm phong (Seal) và biên bản xác nhận tiếp nhận tại Hub đích.
              </p>
            </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="ops-thermal-management__hub-badge">
            <span className="ops-thermal-management__hub-badge-dot" />
            <span>
              Phạm vi: <strong>{hubScope.scopeLabel}</strong>
              {!isAllSystem && effectiveHubCodes.length > 0 ? ` (${effectiveHubCodes.join(', ')})` : ''}
            </span>
          </div>
          <div className="ops-linehaul-dashboard__actions">
            <Link className="ops-linehaul-dashboard__primary-link" to={routePaths.linehaulVehicleSeal}>
              <Plus size={16} />
              Tạo chuyến xe
            </Link>
            <button
              type="button"
              onClick={() => {
                setLocalTrips(readLinehaulTrips());
                void manifestsQuery.refetch();
                setActionMessage(null);
              }}
            >
              <RefreshCw size={16} className={manifestsQuery.isFetching ? 'spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <section className="ops-linehaul-dashboard__kpis ops-linehaul-dashboard__kpis--six">
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
        <article data-tone="transit">
          <span>Đang kẹp chì xe</span>
          <strong>{kpis.sealed}</strong>
        </article>
        <article data-tone="arrived">
          <span>Đã nhận tại Hub đích</span>
          <strong>{kpis.received}</strong>
        </article>
        <article data-tone="danger">
          <span>Quá giờ chưa xong</span>
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
        {!isAllSystem && (
          <label>
            <span>Chiều tuyến</span>
            <select
              value={filters.direction ?? 'ALL'}
              onChange={(event) => updateFilter('direction', event.target.value as any)}
            >
              <option value="ALL">Tất cả liên quan</option>
              <option value="ORIGIN">Chuyến xuất bến (Đi)</option>
              <option value="DESTINATION">Chuyến cập bến (Đến)</option>
            </select>
          </label>
        )}
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
            {(['PLANNED', 'PRINTED', 'SEALED', 'RECEIVED'] as const).map((status) => (
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
            placeholder="Mã chuyến, seal, biển số, tài xế, hub"
          />
        </label>
      </section>

      <section className="ops-linehaul-dashboard__panel">
        <header className="ops-linehaul-dashboard__panel-head">
          <div>
            <h3>Danh sách chuyến xe liên Hub</h3>
            <span>{filteredTrips.length} chuyến xe</span>
          </div>
          <em>Quy trình khép kín: Lập chuyến ➔ Bổ sung xe ➔ In tem ➔ Kẹp chì xuất bến ➔ Cắt chì & Tiếp nhận tại Hub đích</em>
        </header>

        {filteredTrips.length === 0 ? (
          <p className="ops-linehaul-dashboard__empty">
            Chưa có chuyến xe phù hợp. Bấm &quot;Tạo chuyến xe&quot; để tạo kế hoạch chuyến mới.
          </p>
        ) : (
          <div className="ops-linehaul-dashboard__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã chuyến & Niêm phong</th>
                  <th>Trạng thái</th>
                  <th>Tuyến xe</th>
                  <th>Loại</th>
                  <th>Tài xế & Phương tiện</th>
                  <th>Hàng hóa</th>
                  <th>Tiếp nhận tại Hub đích</th>
                  <th>Lịch trình</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrips.map((trip) => {
                  const status = getLinehaulTripStatus(trip);
                  const overdue = isTripOverdue(trip);
                  const canReceiveThisTrip = canUserReceive(trip);

                  return (
                    <tr key={trip.id}>
                      <td>
                        <span className="ops-linehaul-dashboard__code">{trip.tripCode}</span>
                        {trip.sealCode ? (
                          <div className="ops-linehaul-dashboard__seal-tag" title={`Mã seal: ${trip.sealCode}`}>
                            <Lock size={12} />
                            <span>{trip.sealCode}</span>
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={`ops-linehaul-dashboard__badge ops-linehaul-dashboard__badge--${statusTone(
                            status,
                            overdue,
                          )}`}
                        >
                          {overdue ? 'Quá giờ chưa xong' : getLinehaulTripStatusLabel(status)}
                        </span>
                      </td>
                      <td>
                        <div className="ops-linehaul-dashboard__driver-cell">
                          <strong>{trip.originHubCode} ➔ {trip.destinationHubCode}</strong>
                        </div>
                      </td>
                      <td>{LINEHAUL_TRIP_TYPE_LABELS[trip.tripType]}</td>
                      <td>
                        <div className="ops-linehaul-dashboard__driver-cell">
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                            {trip.vehiclePlate?.trim() || 'Chưa gán biển số'}
                          </strong>
                          <span>
                            {trip.driverName?.trim() || 'Chưa gán tài xế'}
                            {trip.driverPhone?.trim() ? ` (${trip.driverPhone})` : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="ops-linehaul-dashboard__shipment-pill">
                          <Package size={14} />
                          <strong>{trip.shipmentCount ?? 0}</strong> kiện
                        </span>
                      </td>
                      <td>
                        {trip.receivedAt ? (
                          <div className="ops-linehaul-dashboard__handover-cell">
                            <strong>
                              <CheckCircle2 size={14} />
                              Đã nhận bởi: {trip.receivedBy || 'Thủ kho'}
                            </strong>
                            <span>Lúc {formatDateTime(trip.receivedAt)}</span>
                            {trip.receiveNote ? (
                              <span style={{ fontStyle: 'italic', color: '#475569' }} title={trip.receiveNote}>
                                {trip.receiveNote.slice(0, 36)}...
                              </span>
                            ) : null}
                          </div>
                        ) : trip.sealedAt ? (
                          <div className="ops-linehaul-dashboard__handover-waiting">
                            <Truck size={14} />
                            <span>Đang trung chuyển đến {trip.destinationHubCode}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Chưa xuất bến</span>
                        )}
                      </td>
                      <td>
                        <div className="ops-linehaul-dashboard__driver-cell" style={{ fontSize: '11px' }}>
                          <span>Khởi hành: {formatDateTime(trip.plannedStartAt)}</span>
                          <span>Dự kiến đến: {formatDateTime(trip.plannedEndAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="ops-linehaul-dashboard__row-actions">
                          {status === 'PLANNED' || status === 'PRINTED' ? (
                            <button type="button" onClick={() => selectTripForOperation(trip)}>
                              <Pencil size={14} />
                              Bổ sung
                            </button>
                          ) : null}

                          <button type="button" onClick={() => printTrip(trip)}>
                            <Printer size={14} />
                            {trip.printedAt ? 'In lại' : 'In tem'}
                          </button>

                          {(status === 'PLANNED' || status === 'PRINTED') && canPrintTrip(trip) ? (
                            <button
                              type="button"
                              className="ops-linehaul-dashboard__btn--seal"
                              onClick={() => openSealModal(trip)}
                              title="Kẹp chì niêm phong xe và xuất bến"
                            >
                              <Lock size={14} />
                              Kẹp chì & Xuất bến
                            </button>
                          ) : null}

                          {status === 'SEALED' && canReceiveThisTrip ? (
                            <button
                              type="button"
                              className="ops-linehaul-dashboard__btn--receive"
                              onClick={() => openReceiveModal(trip)}
                              title="Xác nhận nhận xe và cắt chì tại Hub đích"
                            >
                              <CheckCircle2 size={14} />
                              Xác nhận nhận xe
                            </button>
                          ) : null}

                          {status === 'RECEIVED' ? (
                            <button
                              type="button"
                              onClick={() => setViewHandoverTrip(trip)}
                              title="Xem chi tiết biên bản bàn giao và kiểm tra seal"
                            >
                              <Eye size={14} />
                              Biên bản
                            </button>
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

      {/* MODAL 1: Bổ sung tài xế & xe */}
      {operationModalOpen ? (
        <div className="lh-modal-overlay" role="presentation">
          <form
            className="lh-modal ops-linehaul-dashboard__operation-modal"
            onSubmit={saveTripOperationInfo}
          >
            <div className="lh-modal__title ops-linehaul-dashboard__operation-modal-title">
              <span>Bổ sung thông tin tài xế và xe trung chuyển</span>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setOperationModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="lh-modal__body">
              <p>Nhập thông tin phương tiện vận chuyển và tài xế phụ trách trước khi in tem xe và kẹp chì xuất bến.</p>
              <div className="lh-modal__field">
                <label htmlFor="linehaul-operation-trip">Chuyến xe</label>
                <select
                  id="linehaul-operation-trip"
                  className="ops-linehaul-dashboard__operation-input"
                  value={operationForm.tripId}
                  onChange={(event) => updateOperationForm('tripId', event.target.value)}
                >
                  <option value="">Chọn chuyến cần bổ sung</option>
                  {scopedTrips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.tripCode} | {trip.originHubCode} ➔ {trip.destinationHubCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lh-modal__field">
                <label htmlFor="linehaul-operation-plate">Biển số xe tải</label>
                <input
                  id="linehaul-operation-plate"
                  className="ops-linehaul-dashboard__operation-input"
                  value={operationForm.vehiclePlate}
                  onChange={(event) => updateOperationForm('vehiclePlate', event.target.value)}
                  placeholder="Ví dụ: 29C-882.14 hoặc 51D-938.22"
                  required
                />
              </div>
              <div className="lh-modal__field">
                <label htmlFor="linehaul-operation-driver">Họ tên tài xế</label>
                <input
                  id="linehaul-operation-driver"
                  className="ops-linehaul-dashboard__operation-input"
                  value={operationForm.driverName}
                  onChange={(event) => updateOperationForm('driverName', event.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Tuấn"
                  required
                />
              </div>
              <div className="lh-modal__field">
                <label htmlFor="linehaul-operation-phone">Số điện thoại liên hệ</label>
                <input
                  id="linehaul-operation-phone"
                  className="ops-linehaul-dashboard__operation-input"
                  value={operationForm.driverPhone}
                  onChange={(event) => updateOperationForm('driverPhone', event.target.value)}
                  placeholder="Ví dụ: 0908123456"
                  required
                />
              </div>
              <div className="lh-modal__field">
                <label htmlFor="linehaul-operation-shipments">Số lượng kiện hàng xếp xe</label>
                <input
                  id="linehaul-operation-shipments"
                  type="number"
                  min="0"
                  className="ops-linehaul-dashboard__operation-input"
                  value={operationForm.shipmentCount ?? 0}
                  onChange={(event) => updateOperationForm('shipmentCount', Number(event.target.value))}
                  placeholder="Số lượng kiện hàng theo bảng kê"
                />
              </div>
            </div>
            <div className="lh-modal__actions">
              <button
                type="button"
                className="ops-linehaul-dashboard__modal-secondary"
                onClick={() => setOperationModalOpen(false)}
              >
                Đóng
              </button>
              <button type="submit" className="ops-linehaul-dashboard__modal-primary">
                <Save size={16} />
                Lưu thông tin vận hành
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* MODAL 2: Kẹp chì & Xuất bến */}
      {sealModalOpen && sealForm.trip ? (
        <div className="lh-modal-overlay" role="presentation">
          <form className="lh-modal ops-linehaul-dashboard__operation-modal" onSubmit={submitSeal}>
            <div className="lh-modal__title ops-linehaul-dashboard__operation-modal-title">
              <span>Kẹp chì niêm phong xe & Xuất bến liên Hub</span>
              <button type="button" aria-label="Đóng" onClick={() => setSealModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="lh-modal__body">
              <div className="ops-linehaul-dashboard__handover-summary-box">
                <div>
                  <span>Mã chuyến</span>
                  <strong>{sealForm.trip.tripCode}</strong>
                </div>
                <div>
                  <span>Tuyến đường</span>
                  <strong>{sealForm.trip.originHubCode} ➔ {sealForm.trip.destinationHubCode}</strong>
                </div>
                <div>
                  <span>Biển số xe & Tài xế</span>
                  <strong>{sealForm.trip.vehiclePlate} ({sealForm.trip.driverName})</strong>
                </div>
                <div>
                  <span>Số lượng hàng xếp xe</span>
                  <strong>{sealForm.trip.shipmentCount ?? 0} kiện hàng</strong>
                </div>
              </div>

              <div className="lh-modal__field">
                <label htmlFor="linehaul-seal-code">Mã chì niêm phong (Seal Code)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="linehaul-seal-code"
                    className="ops-linehaul-dashboard__operation-input"
                    value={sealForm.sealCode}
                    onChange={(e) => setSealForm({ ...sealForm, sealCode: e.target.value })}
                    placeholder="Ví dụ: SL-892145"
                    required
                  />
                  <button
                    type="button"
                    style={{ whiteSpace: 'nowrap', padding: '0 10px', fontSize: '12px' }}
                    onClick={() =>
                      setSealForm({
                        ...sealForm,
                        sealCode: `SL-${Math.floor(100000 + Math.random() * 900000)}`,
                      })
                    }
                  >
                    Tạo mã ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="lh-modal__field">
                <label htmlFor="linehaul-seal-staff">Nhân viên kẹp chì xuất bến</label>
                <input
                  id="linehaul-seal-staff"
                  className="ops-linehaul-dashboard__operation-input"
                  value={sealForm.sealedBy}
                  onChange={(e) => setSealForm({ ...sealForm, sealedBy: e.target.value })}
                  placeholder="Họ tên nhân viên điều phối"
                  required
                />
              </div>

              <div className="lh-modal__field">
                <label htmlFor="linehaul-seal-note">Ghi chú niêm phong</label>
                <textarea
                  id="linehaul-seal-note"
                  className="ops-linehaul-dashboard__operation-input"
                  rows={2}
                  value={sealForm.note}
                  onChange={(e) => setSealForm({ ...sealForm, note: e.target.value })}
                  placeholder="Ghi chú về tình trạng thùng xe, số lượng seal gắn..."
                />
              </div>
            </div>
            <div className="lh-modal__actions">
              <button
                type="button"
                className="ops-linehaul-dashboard__modal-secondary"
                onClick={() => setSealModalOpen(false)}
              >
                Hủy
              </button>
              <button type="submit" className="ops-linehaul-dashboard__modal-primary" style={{ background: '#d97706' }}>
                <Lock size={16} />
                Xác nhận kẹp chì & Xuất bến
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* MODAL 3: Tiếp nhận xe & Cắt chì tại Hub đích */}
      {receiveModalOpen && receiveForm.trip ? (
        <div className="lh-modal-overlay" role="presentation">
          <form className="lh-modal ops-linehaul-dashboard__operation-modal" onSubmit={submitReceive}>
            <div className="lh-modal__title ops-linehaul-dashboard__operation-modal-title">
              <span>Biên bản tiếp nhận xe & Cắt chì tại Hub đích</span>
              <button type="button" aria-label="Đóng" onClick={() => setReceiveModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="lh-modal__body">
              <p style={{ color: '#0369a1', fontSize: '12px', marginTop: 0 }}>
                Đối soát thông tin từ Hub xuất phát <strong>{receiveForm.trip.originHubCode}</strong> đến Hub hiện tại <strong>{receiveForm.trip.destinationHubCode}</strong>:
              </p>

              <div className="ops-linehaul-dashboard__handover-summary-box">
                <div>
                  <span>Mã chuyến</span>
                  <strong>{receiveForm.trip.tripCode}</strong>
                </div>
                <div>
                  <span>Mã Seal xuất bến</span>
                  <strong style={{ color: '#1d4ed8' }}>{receiveForm.trip.sealCode || 'Không có mã'}</strong>
                </div>
                <div>
                  <span>Biển số xe & Tài xế</span>
                  <strong>{receiveForm.trip.vehiclePlate} ({receiveForm.trip.driverName})</strong>
                </div>
                <div>
                  <span>Số lượng kiện xuất bến</span>
                  <strong>{receiveForm.trip.shipmentCount ?? 0} kiện hàng</strong>
                </div>
              </div>

              <div className="lh-modal__field">
                <label>Tình trạng chì niêm phong thực tế</label>
                <div className="ops-linehaul-dashboard__check-group">
                  <label className={`ops-linehaul-dashboard__check-option ${receiveForm.sealCondition === 'INTACT' ? 'ops-linehaul-dashboard__check-option--selected' : ''}`}>
                    <input
                      type="radio"
                      name="sealCondition"
                      checked={receiveForm.sealCondition === 'INTACT'}
                      onChange={() => setReceiveForm({ ...receiveForm, sealCondition: 'INTACT' })}
                    />
                    <div>
                      <strong>Niêm phong nguyên vẹn 100%</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                        Mã chì khớp chính xác với mã [{receiveForm.trip.sealCode || 'N/A'}], không có dấu hiệu cạy phá hay đứt gãy.
                      </span>
                    </div>
                  </label>

                  <label className={`ops-linehaul-dashboard__check-option ${receiveForm.sealCondition === 'BROKEN' ? 'ops-linehaul-dashboard__check-option--selected' : ''}`}>
                    <input
                      type="radio"
                      name="sealCondition"
                      checked={receiveForm.sealCondition === 'BROKEN'}
                      onChange={() => setReceiveForm({ ...receiveForm, sealCondition: 'BROKEN' })}
                    />
                    <div>
                      <strong style={{ color: '#b91c1c' }}>Seal bị rách / hỏng / đứt cáp</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                        Dây seal bị đứt hoặc thân khóa biến dạng trước khi mở cửa xe.
                      </span>
                    </div>
                  </label>

                  <label className={`ops-linehaul-dashboard__check-option ${receiveForm.sealCondition === 'MISMATCH' ? 'ops-linehaul-dashboard__check-option--selected' : ''}`}>
                    <input
                      type="radio"
                      name="sealCondition"
                      checked={receiveForm.sealCondition === 'MISMATCH'}
                      onChange={() => setReceiveForm({ ...receiveForm, sealCondition: 'MISMATCH' })}
                    />
                    <div>
                      <strong style={{ color: '#b91c1c' }}>Sai lệch mã seal</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                        Mã số dập trên chì thực tế không trùng khớp với mã trên hệ thống.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="lh-modal__field">
                <label htmlFor="linehaul-actual-shipments">Số lượng kiện thực tế kiểm đếm vào kho</label>
                <input
                  id="linehaul-actual-shipments"
                  type="number"
                  min="0"
                  className="ops-linehaul-dashboard__operation-input"
                  value={receiveForm.actualShipments}
                  onChange={(e) => setReceiveForm({ ...receiveForm, actualShipments: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="lh-modal__field">
                <label htmlFor="linehaul-receive-staff">Họ tên nhân viên kiểm nhận tại Hub đích</label>
                <input
                  id="linehaul-receive-staff"
                  className="ops-linehaul-dashboard__operation-input"
                  value={receiveForm.receiverName}
                  onChange={(e) => setReceiveForm({ ...receiveForm, receiverName: e.target.value })}
                  placeholder="Họ tên thủ kho / nhân viên nhận xe"
                  required
                />
              </div>

              <div className="lh-modal__field">
                <label htmlFor="linehaul-receive-note">Ghi chú biên bản bàn giao</label>
                <textarea
                  id="linehaul-receive-note"
                  className="ops-linehaul-dashboard__operation-input"
                  rows={2}
                  value={receiveForm.note}
                  onChange={(e) => setReceiveForm({ ...receiveForm, note: e.target.value })}
                  placeholder="Ghi chú thêm về biên bản kiểm đếm..."
                />
              </div>
            </div>
            <div className="lh-modal__actions">
              <button
                type="button"
                className="ops-linehaul-dashboard__modal-secondary"
                onClick={() => setReceiveModalOpen(false)}
              >
                Hủy
              </button>
              <button type="submit" className="ops-linehaul-dashboard__modal-primary" style={{ background: '#16a34a' }}>
                <CheckCircle2 size={16} />
                Xác nhận tiếp nhận vào Hub đích
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* MODAL 4: Chi tiết biên bản bàn giao đã hoàn tất */}
      {viewHandoverTrip ? (
        <div className="lh-modal-overlay" role="presentation">
          <div className="lh-modal ops-linehaul-dashboard__operation-modal">
            <div className="lh-modal__title ops-linehaul-dashboard__operation-modal-title">
              <span>Biên bản tiếp nhận xe hoàn tất - {viewHandoverTrip.tripCode}</span>
              <button type="button" aria-label="Đóng" onClick={() => setViewHandoverTrip(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="lh-modal__body">
              <div className="ops-linehaul-dashboard__handover-summary-box">
                <div>
                  <span>Tuyến vận chuyển</span>
                  <strong>{viewHandoverTrip.originHubCode} ➔ {viewHandoverTrip.destinationHubCode}</strong>
                </div>
                <div>
                  <span>Mã Seal niêm phong</span>
                  <strong style={{ color: '#1d4ed8' }}>{viewHandoverTrip.sealCode || 'N/A'}</strong>
                </div>
                <div>
                  <span>Phương tiện & Tài xế</span>
                  <strong>{viewHandoverTrip.vehiclePlate} | {viewHandoverTrip.driverName}</strong>
                </div>
                <div>
                  <span>Tổng kiện bàn giao</span>
                  <strong>{viewHandoverTrip.shipmentCount ?? 0} kiện hàng</strong>
                </div>
                <div>
                  <span>Thời gian tiếp nhận</span>
                  <strong>{viewHandoverTrip.receivedAt ? formatDateTime(viewHandoverTrip.receivedAt) : 'Chưa có'}</strong>
                </div>
                <div>
                  <span>Người tiếp nhận</span>
                  <strong style={{ color: '#15803d' }}>{viewHandoverTrip.receivedBy || 'Thủ kho'}</strong>
                </div>
              </div>

              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', fontSize: '13px', lineHeight: '1.6' }}>
                <strong style={{ display: 'block', color: '#1e293b', marginBottom: '4px' }}>
                  Chi tiết biên bản kiểm tra:
                </strong>
                <p style={{ margin: 0, color: '#334155' }}>
                  {viewHandoverTrip.receiveNote || 'Đã tiếp nhận đầy đủ vào hệ thống kho vận.'}
                </p>
              </div>
            </div>
            <div className="lh-modal__actions">
              <button
                type="button"
                className="ops-linehaul-dashboard__modal-secondary"
                onClick={() => setViewHandoverTrip(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="ops-linehaul-dashboard__modal-primary"
                onClick={() => {
                  printTrip(viewHandoverTrip);
                }}
              >
                <Printer size={16} />
                In tem xe
              </button>
            </div>
          </div>
        </div>
      ) : null}
        </>
      )}
    </section>
  );
}
