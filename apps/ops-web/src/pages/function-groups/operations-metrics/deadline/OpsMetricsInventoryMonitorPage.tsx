import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { shipmentsClient } from '../../../../features/shipments/shipments.client';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useAuthStore } from '../../../../store/authStore';

import './OpsMetricsInventoryMonitorPage.css';

interface InventoryMonitorRow {
  stt: number;
  hubCode: string;
  thoiGianTttc: string;
  tongKienTon: number;
  tonQuaHan: number;
  canhBao: string;
}

const FINAL_STATUSES = new Set([
  'DELIVERED',
  'DELIVERY_COMPLETED',
  'CANCELLED',
  'RETURNED',
  'RETURN_COMPLETED',
  'LOST',
]);

function isInventoryShipment(shipment: ShipmentListItemDto): boolean {
  const status = shipment.currentStatus.trim().toUpperCase();
  return !FINAL_STATUSES.has(status);
}

function isOverdueInventory(shipment: ShipmentListItemDto): boolean {
  const updatedAt = new Date(shipment.updatedAt).getTime();
  if (!Number.isFinite(updatedAt)) {
    return false;
  }

  const ageHours = (Date.now() - updatedAt) / (1000 * 60 * 60);
  return ageHours >= 24;
}

function resolveInventoryHub(shipment: ShipmentListItemDto): string {
  return (
    shipment.currentLocation ||
    shipment.destinationHubCode ||
    shipment.receiverHubCode ||
    shipment.originHubCode ||
    shipment.senderHubCode ||
    'CHUA_XAC_DINH'
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '---';
  }

  return date.toLocaleString('vi-VN');
}

function buildInventoryRows(shipments: ShipmentListItemDto[]): InventoryMonitorRow[] {
  const groups = new Map<
    string,
    {
      total: number;
      overdue: number;
      latestUpdatedAt: string;
    }
  >();

  shipments.filter(isInventoryShipment).forEach((shipment) => {
    const hubCode = resolveInventoryHub(shipment);
    const current = groups.get(hubCode) ?? {
      total: 0,
      overdue: 0,
      latestUpdatedAt: shipment.updatedAt,
    };

    current.total += 1;
    if (isOverdueInventory(shipment)) {
      current.overdue += 1;
    }

    if (new Date(shipment.updatedAt).getTime() > new Date(current.latestUpdatedAt).getTime()) {
      current.latestUpdatedAt = shipment.updatedAt;
    }

    groups.set(hubCode, current);
  });

  return Array.from(groups.entries())
    .sort((left, right) => right[1].total - left[1].total)
    .map(([hubCode, group], index) => ({
      stt: index + 1,
      hubCode,
      thoiGianTttc: formatDateTime(group.latestUpdatedAt),
      tongKienTon: group.total,
      tonQuaHan: group.overdue,
      canhBao:
        group.overdue >= 10
          ? 'Cao'
          : group.overdue > 0
          ? 'Cần theo dõi'
          : 'Bình thường',
    }));
}

export function OpsMetricsInventoryMonitorPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [shipments, setShipments] = useState<ShipmentListItemDto[]>([]);
  const [filterCode, setFilterCode] = useState('');
  const [scope, setScope] = useState('tttc-quet-gui-kien');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await shipmentsClient.list(accessToken, {
        q: filterCode.trim() || undefined,
        limit: 100,
        offset: 0,
      });
      setShipments(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Không tải được dữ liệu tồn kho.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterCode]);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const inventoryShipments = useMemo(
    () => shipments.filter(isInventoryShipment),
    [shipments],
  );
  const rows = useMemo(() => buildInventoryRows(shipments), [shipments]);
  const overdueTotal = useMemo(
    () => inventoryShipments.filter(isOverdueInventory).length,
    [inventoryShipments],
  );

  const onSearch = () => {
    void fetchInventory();
  };

  return (
    <section className="ops-metrics-inventory">
      <header className="ops-metrics-inventory__tabs" role="tablist" aria-label="Tổng hợp tồn kho">
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="ops-metrics-inventory__tab ops-metrics-inventory__tab--active"
        >
          Tổng
        </button>
        <button type="button" role="tab" aria-selected="false" className="ops-metrics-inventory__tab">
          Chi tiết
        </button>
      </header>

      <div className="ops-metrics-inventory__toolbar">
        <button type="button" className="ops-metrics-inventory__search-btn" onClick={onSearch}>
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </span>
          Tìm kiếm
        </button>

        <button type="button" className="ops-metrics-inventory__export-btn">
          Xuất dữ liệu
        </button>
      </div>

      <div className="ops-metrics-inventory__summary">
        <article>
          <span>Tổng kiện tồn</span>
          <strong>{inventoryShipments.length}</strong>
        </article>
        <article>
          <span>Tồn quá hạn</span>
          <strong>{overdueTotal}</strong>
        </article>
        <article>
          <span>Hub có tồn</span>
          <strong>{rows.length}</strong>
        </article>
      </div>

      <div className="ops-metrics-inventory__filters">
        <label className="ops-metrics-inventory__filter-field">
          <span>Phạm vi lựa chọn:</span>
          <select value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="tttc-quet-gui-kien">Theo TTTC quét gửi kiện</option>
            <option value="hub-vung">Theo hub/vùng</option>
            <option value="chi-nhanh">Theo chi nhánh</option>
          </select>
        </label>
        <label className="ops-metrics-inventory__filter-field">
          <span>Mã vận đơn / hub:</span>
          <input
            type="text"
            value={filterCode}
            onChange={(event) => setFilterCode(event.target.value)}
            placeholder="Nhập mã vận đơn hoặc hub"
          />
        </label>
      </div>

      {errorMessage ? (
        <div className="ops-metrics-inventory__error">{errorMessage}</div>
      ) : null}

      <div className="ops-metrics-inventory__table-wrap">
        {loading ? (
          <div className="ops-metrics-inventory__loading">Đang tải dữ liệu tồn kho...</div>
        ) : null}
        <table className="ops-metrics-inventory__table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Hub/địa điểm tồn</th>
              <th>Cập nhật gần nhất</th>
              <th>Tổng kiện tồn</th>
              <th>Tồn quá hạn</th>
              <th>Mức cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.stt}>
                <td>{row.stt}</td>
                <td>{row.hubCode}</td>
                <td>{row.thoiGianTttc}</td>
                <td>{row.tongKienTon}</td>
                <td className="ops-metrics-inventory__danger-cell">{row.tonQuaHan}</td>
                <td>{row.canhBao}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {loading ? 'Đang tải...' : 'Chưa có dữ liệu tồn kho từ server.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
