import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { usePickupRequestsQuery } from '../../features/pickups/pickups.api';
import type { PickupRequestListFilters } from '../../features/pickups/pickups.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { PickupRequestsTable } from './PickupRequestsTable';

export function PickupApprovalsPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const filters: PickupRequestListFilters = {
    status: searchParams.get('status') ?? undefined,
  };
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const pickupsQuery = usePickupRequestsQuery(accessToken, filters);

  useEffect(() => {
    setStatusInput(filters.status ?? '');
  }, [filters.status]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const status = String(formData.get('status') ?? '').trim();
    const next = new URLSearchParams();

    if (status) {
      next.set('status', status);
    }

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setStatusInput('');
  };

  return (
    <div>
      <h2>Duyệt lấy hàng</h2>
      <p style={{ color: '#2d3f99' }}>
        Trạng thái hiển thị đúng theo phản hồi API. Bộ lọc được gửi lên server bằng query param.
      </p>
      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <input
          name="status"
          placeholder="Lọc theo trạng thái"
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          style={styles.input}
        />
        <button type="submit">Áp dụng</button>
        <button type="button" onClick={onResetFilters}>
          Đặt lại
        </button>
      </form>

      {pickupsQuery.isLoading ? <p>Đang tải yêu cầu lấy hàng...</p> : null}
      {pickupsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(pickupsQuery.error)}</p>
      ) : null}
      {pickupsQuery.isSuccess && (pickupsQuery.data?.length ?? 0) === 0 ? (
        <p>Không có yêu cầu lấy hàng phù hợp bộ lọc hiện tại.</p>
      ) : null}
      {pickupsQuery.isSuccess && (pickupsQuery.data?.length ?? 0) > 0 ? (
        <PickupRequestsTable items={pickupsQuery.data ?? []} />
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
  errorText: {
    color: '#b91c1c',
    marginTop: 12,
  },
};
