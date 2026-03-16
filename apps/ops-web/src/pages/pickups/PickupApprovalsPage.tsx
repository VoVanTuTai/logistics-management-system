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
      <h2>Pickup approvals</h2>
      <p style={{ color: '#2d3f99' }}>
        Status is displayed exactly as API response. Filter is sent to server as query param.
      </p>
      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <input
          name="status"
          placeholder="Filter by status"
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          style={styles.input}
        />
        <button type="submit">Apply</button>
        <button type="button" onClick={onResetFilters}>
          Reset
        </button>
      </form>

      {pickupsQuery.isLoading ? <p>Loading pickup requests...</p> : null}
      {pickupsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(pickupsQuery.error)}</p>
      ) : null}
      {pickupsQuery.isSuccess && (pickupsQuery.data?.length ?? 0) === 0 ? (
        <p>No pickup requests found for current filters.</p>
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
