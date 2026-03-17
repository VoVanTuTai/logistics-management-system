import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useShipmentsQuery } from '../../features/shipments/shipments.api';
import type { ShipmentListFilters } from '../../features/shipments/shipments.types';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../services/api/errors';
import { ShipmentsTable } from './ShipmentsTable';

export function ShipmentListPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const filters: ShipmentListFilters = {
    q: searchParams.get('q') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  };
  const [qInput, setQInput] = useState(filters.q ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const shipmentQuery = useShipmentsQuery(accessToken, filters);

  useEffect(() => {
    setQInput(filters.q ?? '');
    setStatusInput(filters.status ?? '');
  }, [filters.q, filters.status]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const next = new URLSearchParams();

    if (q) {
      next.set('q', q);
    }

    if (status) {
      next.set('status', status);
    }

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setQInput('');
    setStatusInput('');
  };

  return (
    <div>
      <h2>Vận đơn</h2>
      <p style={{ color: '#2d3f99' }}>
        currentStatus/currentLocation được hiển thị đúng theo phản hồi API.
      </p>
      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <input
          name="q"
          placeholder="Tìm mã vận đơn"
          value={qInput}
          onChange={(event) => setQInput(event.target.value)}
          style={styles.input}
        />
        <select
          name="status"
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          style={styles.select}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="CREATED">CREATED</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="FAILED">FAILED</option>
          <option value="RETURNED">RETURNED</option>
        </select>
        <button type="submit">Áp dụng</button>
        <button type="button" onClick={onResetFilters}>
          Đặt lại
        </button>
      </form>

      {shipmentQuery.isLoading ? <p>Đang tải vận đơn...</p> : null}
      {shipmentQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(shipmentQuery.error)}</p>
      ) : null}
      {shipmentQuery.isSuccess && (shipmentQuery.data?.length ?? 0) === 0 ? (
        <p>Không tìm thấy vận đơn theo bộ lọc hiện tại.</p>
      ) : null}
      {shipmentQuery.isSuccess && (shipmentQuery.data?.length ?? 0) > 0 ? (
        <ShipmentsTable items={shipmentQuery.data ?? []} />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  filterForm: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 240,
  },
  select: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 12,
  },
};
