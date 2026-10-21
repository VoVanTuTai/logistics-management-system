import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useHubScope } from '../../../../hooks/useHubScope';
import { isShipmentInHubScope } from '../../../../utils/hubScopeResolver';
import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatShipmentStatusLabel } from '../../../../utils/logisticsLabels';
import { ShipmentsTable, minutesSince } from '../../../shipments/ShipmentsTable';

import './OperationalDataMonitorPage.css';

type ShipmentMonitorMode = 'arrival' | 'outbound' | 'delivery';

interface ShipmentDataMonitorPageProps {
  mode: ShipmentMonitorMode;
}

interface ShipmentMonitorConfig {
  groupCode: string;
  title: string;
  description: string;
  statusQuery?: string;
  defaultStatuses: string[];
  keywordLabel: string;
  hubLabel: string;
  oppositeHubLabel: string;
  ownerLabel: string;
  senderFilterLabel?: string;
  receiverFilterLabel?: string;
  emptyText: string;
  summaryLabels: {
    total: string;
    secondary: string;
    warning: string;
  };
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;
const DATA_LIMIT = 200;

const configs: Record<ShipmentMonitorMode, ShipmentMonitorConfig> = {
  arrival: {
    groupCode: 'MONITOR_DATA_HANG_DEN',
    title: 'Giám sát hàng đến',
    description: 'Theo dõi các đơn từ hub khác đã được quét hàng đến tại bưu cục.',
    statusQuery: 'SCAN_INBOUND',
    defaultStatuses: ['SCAN_INBOUND'],
    keywordLabel: 'Mã vận đơn / người gửi / người nhận',
    hubLabel: 'BC đến',
    oppositeHubLabel: 'Hub gửi',
    ownerLabel: 'Người quét/xử lý',
    emptyText: 'Chưa có đơn quét hàng đến từ hub khác phù hợp bộ lọc.',
    summaryLabels: {
      total: 'Hàng đến',
      secondary: 'Hub gửi khác',
      warning: 'Quá 6 giờ',
    },
  },
  outbound: {
    groupCode: 'MONITOR_DATA_HANG_GUI',
    title: 'Giám sát hàng gửi',
    description:
      'Theo dõi hàng nhân viên Ops hoặc courier đã nhận để chuẩn bị gửi đi cho khách hàng.',
    defaultStatuses: [
      'PICKUP_COMPLETED',
      'MANIFEST_RECEIVED',
      'MANIFEST_UNSEALED',
      'SCAN_INBOUND',
      'INVENTORY_CHECK',
    ],
    keywordLabel: 'Mã vận đơn / người gửi / người nhận / hub đích',
    hubLabel: 'BC gửi',
    oppositeHubLabel: 'BC đích',
    ownerLabel: 'Người gửi',
    emptyText: 'Chưa có dữ liệu hàng gửi phù hợp bộ lọc.',
    summaryLabels: {
      total: 'Đã nhận gửi',
      secondary: 'Hub đích',
      warning: 'Chờ gửi quá 6 giờ',
    },
  },
  delivery: {
    groupCode: 'MONITOR_DATA_HANG_PHAT',
    title: 'Giám sát hàng phát',
    description: 'Theo dõi các đơn đã giao và hỗ trợ rà soát lại theo bên gửi, bên nhận.',
    statusQuery: 'DELIVERED',
    defaultStatuses: ['DELIVERED'],
    keywordLabel: 'Mã vận đơn / bên gửi / bên nhận / số điện thoại',
    hubLabel: 'BC phát',
    oppositeHubLabel: 'BC gửi',
    ownerLabel: 'Bên nhận',
    senderFilterLabel: 'Bên gửi',
    receiverFilterLabel: 'Bên nhận',
    emptyText: 'Không tìm thấy dữ liệu hàng phát phù hợp bộ lọc.',
    summaryLabels: {
      total: 'Đã giao',
      secondary: 'Bên gửi',
      warning: 'Bên nhận',
    },
  },
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolvePrimaryHub(shipment: ShipmentListItemDto, mode: ShipmentMonitorMode): string {
  if (mode === 'outbound') {
    return normalizeCode(shipment.currentLocation) || normalizeCode(shipment.originHubCode) || normalizeCode(shipment.senderHubCode) || '---';
  }

  if (mode === 'delivery') {
    return normalizeCode(shipment.destinationHubCode) || normalizeCode(shipment.receiverHubCode) || normalizeCode(shipment.currentLocation) || '---';
  }

  return normalizeCode(shipment.currentLocation) || normalizeCode(shipment.receiverHubCode) || normalizeCode(shipment.destinationHubCode) || '---';
}

function resolveOppositeHub(shipment: ShipmentListItemDto, mode: ShipmentMonitorMode): string {
  if (mode === 'outbound') {
    return normalizeCode(shipment.destinationHubCode) || normalizeCode(shipment.receiverHubCode) || '---';
  }

  if (mode === 'delivery') {
    return normalizeCode(shipment.originHubCode) || normalizeCode(shipment.senderHubCode) || '---';
  }

  return normalizeCode(shipment.originHubCode) || normalizeCode(shipment.senderHubCode) || '---';
}

function hasKnownDifferentHub(left: string, right: string): boolean {
  return left !== '---' && right !== '---' && left !== right;
}

function isArrivalFromAnotherHub(shipment: ShipmentListItemDto): boolean {
  const arrivalHub = resolvePrimaryHub(shipment, 'arrival');
  const senderHub = resolveOppositeHub(shipment, 'arrival');

  return hasKnownDifferentHub(arrivalHub, senderHub);
}

function matchesPartyFilter(shipment: ShipmentListItemDto, senderFilter: string, receiverFilter: string): boolean {
  const normalizedSender = normalize(senderFilter);
  const normalizedReceiver = normalize(receiverFilter);
  const senderValues = [
    shipment.senderName,
    shipment.senderPhone,
    shipment.senderAddress,
    shipment.senderWard,
    shipment.senderDistrict,
    shipment.senderProvince,
    shipment.senderHubCode,
    shipment.originHubCode,
  ];
  const receiverValues = [
    shipment.receiverName,
    shipment.receiverPhone,
    shipment.receiverAddress,
    shipment.receiverRegion,
    shipment.receiverHubCode,
    shipment.destinationHubCode,
  ];

  const senderMatched =
    !normalizedSender || senderValues.some((value) => normalize(value).includes(normalizedSender));
  const receiverMatched =
    !normalizedReceiver || receiverValues.some((value) => normalize(value).includes(normalizedReceiver));

  return senderMatched && receiverMatched;
}

function countUnique(values: string[]): number {
  return new Set(values.map(normalize).filter(Boolean)).size;
}

export function ShipmentDataMonitorPage({
  mode,
}: ShipmentDataMonitorPageProps): React.JSX.Element {
  const config = configs[mode];
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const scopedHubCodes = session?.user.hubCodes ?? [];
  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const hubScope = useHubScope();

  const [shipments, setShipments] = useState<ShipmentListItemDto[]>([]);
  const [keyword, setKeyword] = useState('');
  const [hubFilter, setHubFilter] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [receiverFilter, setReceiverFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Checkbox selection state
  const [selectedShipmentCodes, setSelectedShipmentCodes] = useState<string[]>([]);

  const effectiveHubCodes = useMemo(() => {
    return hubScope.scopedHubCodes.length > 0 ? hubScope.scopedHubCodes : scopedHubCodes;
  }, [hubScope.scopedHubCodes, scopedHubCodes]);

  const isAllSystem = canViewAllHubAreas || hubScope.isAllSystem;

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setShipments([]);
      setErrorMessage('Bạn cần đăng nhập để tải dữ liệu giám sát.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await shipmentsClient.list(accessToken, {
        status: config.statusQuery,
        limit: DATA_LIMIT,
        offset: 0,
      });
      setShipments(result);
    } catch (error) {
      setShipments([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, config.statusQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, hubFilter, keyword, mode, pageSize, receiverFilter, senderFilter, statusFilter]);

  const sourceRows = useMemo(() => {
    const normalizedKeyword = normalize(keyword);

    return shipments
      .filter((shipment) => config.defaultStatuses.includes(shipment.currentStatus))
      .filter((shipment) => (mode === 'arrival' ? isArrivalFromAnotherHub(shipment) : true))
      .filter((shipment) => {
        // Nếu nhập mã tra cứu cụ thể -> hiển thị dù ở bất kỳ Hub nào
        if (normalizedKeyword) {
          return true;
        }
        // Nếu là HQ toàn quốc -> hiển thị tất cả
        if (isAllSystem) {
          return true;
        }
        // Mặc định lọc theo phạm vi Hub quản lý
        return isShipmentInHubScope(shipment, effectiveHubCodes);
      });
  }, [config.defaultStatuses, effectiveHubCodes, isAllSystem, keyword, mode, shipments]);

  const statusOptions = useMemo(
    () => Array.from(new Set(sourceRows.map((shipment) => shipment.currentStatus))).sort(),
    [sourceRows],
  );

  const filteredRows = useMemo(() => {
    const normalizedKeyword = normalize(keyword);
    const normalizedHub = normalizeCode(hubFilter);

    return sourceRows.filter((shipment) => {
      const primaryHub = resolvePrimaryHub(shipment, mode);
      const oppositeHub = resolveOppositeHub(shipment, mode);
      const updatedDate = toDateKey(shipment.updatedAt);
      const keywordMatched =
        !normalizedKeyword ||
        [
          shipment.shipmentCode,
          shipment.senderName,
          shipment.senderPhone,
          shipment.receiverName,
          shipment.receiverPhone,
          shipment.currentLocation,
          primaryHub,
          oppositeHub,
          shipment.deliveryNote,
        ].some((value) => normalize(value).includes(normalizedKeyword));

      return (
        keywordMatched &&
        (!normalizedHub || primaryHub.includes(normalizedHub) || oppositeHub.includes(normalizedHub)) &&
        matchesPartyFilter(shipment, mode === 'delivery' ? senderFilter : '', mode === 'delivery' ? receiverFilter : '') &&
        (!statusFilter || shipment.currentStatus === statusFilter) &&
        (!dateFrom || !updatedDate || updatedDate >= dateFrom) &&
        (!dateTo || !updatedDate || updatedDate <= dateTo)
      );
    });
  }, [dateFrom, dateTo, hubFilter, keyword, mode, receiverFilter, senderFilter, sourceRows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const warningRows = filteredRows.filter((shipment) => (minutesSince(shipment.updatedAt) ?? 0) >= 360);
  const secondaryCount =
    mode === 'delivery'
      ? countUnique(filteredRows.map((shipment) => shipment.senderPhone || shipment.senderName || ''))
      : new Set(filteredRows.map((shipment) => resolvePrimaryHub(shipment, mode)).filter((hub) => hub !== '---')).size;
  const warningCount =
    mode === 'delivery'
      ? countUnique(filteredRows.map((shipment) => shipment.receiverPhone || shipment.receiverName || ''))
      : warningRows.length;

  const handleToggleShipment = useCallback((code: string, checked: boolean) => {
    setSelectedShipmentCodes((prev) =>
      checked ? Array.from(new Set([...prev, code])) : prev.filter((item) => item !== code),
    );
  }, []);

  const handleToggleAllVisible = useCallback((checked: boolean) => {
    const visibleCodes = pagedRows.map((item) => item.shipmentCode);
    if (checked) {
      setSelectedShipmentCodes((prev) => Array.from(new Set([...prev, ...visibleCodes])));
    } else {
      setSelectedShipmentCodes((prev) => prev.filter((code) => !visibleCodes.includes(code)));
    }
  }, [pagedRows]);

  const handleSelectAllFiltered = useCallback(() => {
    setSelectedShipmentCodes(filteredRows.map((item) => item.shipmentCode));
  }, [filteredRows]);

  const handleClearSelected = useCallback(() => {
    setSelectedShipmentCodes([]);
  }, []);

  return (
    <section className="ops-data-monitor">
      <header className="ops-data-monitor__header">
        <div>
          <small>{config.groupCode}</small>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <div className="ops-data-monitor__summary" aria-label="Thống kê nhanh">
          <article className="ops-data-monitor__summary-card">
            <span>{config.summaryLabels.total}</span>
            <strong>{filteredRows.length}</strong>
          </article>
          <article className="ops-data-monitor__summary-card">
            <span>{config.summaryLabels.secondary}</span>
            <strong>{secondaryCount}</strong>
          </article>
          <article className={warningCount > 0 && mode !== 'delivery' ? 'ops-data-monitor__summary-card ops-data-monitor__summary-card--warning' : 'ops-data-monitor__summary-card'}>
            <span>{config.summaryLabels.warning}</span>
            <strong>{warningCount}</strong>
          </article>
        </div>
      </header>

      {scopedHubCodes.length > 0 ? (
        <p className="ops-data-monitor__scope">
          Tài khoản đang giới hạn dữ liệu theo bưu cục: {scopedHubCodes.join(', ')}.
        </p>
      ) : null}

      <section className="ops-data-monitor__toolbar">
        <label>
          <span>Từ ngày cập nhật</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>Đến ngày cập nhật</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label>
          <span>{config.hubLabel}</span>
          <input
            type="text"
            value={hubFilter}
            onChange={(event) => setHubFilter(event.target.value)}
            placeholder="Nhập mã hub..."
          />
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatShipmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        {mode === 'delivery' ? (
          <>
            <label>
              <span>{config.senderFilterLabel}</span>
              <input
                type="search"
                value={senderFilter}
                onChange={(event) => setSenderFilter(event.target.value)}
                placeholder="Tên, SĐT hoặc hub gửi..."
              />
            </label>
            <label>
              <span>{config.receiverFilterLabel}</span>
              <input
                type="search"
                value={receiverFilter}
                onChange={(event) => setReceiverFilter(event.target.value)}
                placeholder="Tên, SĐT hoặc khu vực nhận..."
              />
            </label>
          </>
        ) : null}
        <label>
          <span>{config.keywordLabel}</span>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Nhập từ khóa..."
          />
        </label>
        <div className="ops-data-monitor__actions">
          <button type="button" onClick={fetchData} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setHubFilter('');
              setSenderFilter('');
              setReceiverFilter('');
              setStatusFilter('');
              setKeyword('');
            }}
          >
            Xóa lọc
          </button>
        </div>
      </section>

      {errorMessage ? <p className="ops-data-monitor__error">{errorMessage}</p> : null}

      {/* Unified Table Card ("Nằm gọn trong một thẻ") */}
      <article className="ops-data-monitor__table-card">
        {isLoading && <div className="ops-data-monitor__loading">Đang tải dữ liệu...</div>}
        <ShipmentsTable
          items={pagedRows}
          pageOffset={(currentPage - 1) * pageSize}
          selectedShipmentCodes={selectedShipmentCodes}
          onToggleShipment={handleToggleShipment}
          onToggleAllVisible={handleToggleAllVisible}
          storageKeyPrefix={`ops_monitor_${mode}`}
          enabledColumns={[
            'stt',
            'code',
            'status',
            'parcelType',
            'chargeableWeight',
            'primaryHub',
            'oppositeHub',
            'senderName',
            'senderPhone',
            'receiverName',
            'receiverPhone',
            'receiverAddress',
            'cod',
            'ageMinutes',
            'updatedAt',
            'deliveryNote',
          ]}
          defaultVisibleColumns={{
            stt: true,
            code: true,
            status: true,
            parcelType: true,
            chargeableWeight: true,
            primaryHub: true,
            oppositeHub: true,
            senderName: true,
            senderPhone: true,
            senderAddress: false,
            receiverName: true,
            receiverPhone: true,
            receiverAddress: true,
            cod: true,
            routeHub: false,
            ageMinutes: true,
            createdAt: false,
            deliveredAt: false,
            updatedAt: true,
            deliveryNote: true,
          }}
          columnLabelsOverride={{
            primaryHub: `${config.hubLabel} (Hub nhận)`,
            oppositeHub: `${config.oppositeHubLabel} (Hub gửi)`,
            senderName: 'Bên gửi',
            receiverName: 'Bên nhận',
            receiverAddress: 'Địa chỉ giao & Đồng kiểm',
          }}
          primaryHubResolver={(s) => resolvePrimaryHub(s, mode)}
          oppositeHubResolver={(s) => resolveOppositeHub(s, mode)}
          emptyMessage={config.emptyText}
          showSelectionStrip={true}
          totalFilteredCount={filteredRows.length}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearSelected={handleClearSelected}
          containerStyle={{ flex: 1, minHeight: 0 }}
          tableShellStyle={{ flex: 1, minHeight: 0, marginTop: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}
        />

        {/* Standard Pagination Footer Docked at Bottom of Card */}
        <footer className="ops-data-monitor__pagination">
          <span>
            Hiển thị {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(filteredRows.length, currentPage * pageSize)} / {filteredRows.length} dòng
          </span>
          <label>
            <span>Số dòng/trang</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} dòng
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Trước
            </button>
            <strong>
              Trang {currentPage} / {totalPages}
            </strong>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Sau
            </button>
          </div>
        </footer>
      </article>
    </section>
  );
}
