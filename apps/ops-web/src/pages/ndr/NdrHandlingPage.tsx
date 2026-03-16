import React from 'react';

import { useNdrCasesQuery } from '../../features/ndr/ndr.api';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { NdrCasesTable } from './NdrCasesTable';

export function NdrHandlingPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const ndrQuery = useNdrCasesQuery(accessToken);

  return (
    <div>
      <h2>NDR handling</h2>
      <p style={{ color: '#2d3f99' }}>
        Status and case information are displayed directly from server payload.
      </p>
      {ndrQuery.isLoading ? <p>Loading NDR cases...</p> : null}
      {ndrQuery.isError ? <p style={styles.errorText}>{getErrorMessage(ndrQuery.error)}</p> : null}
      {ndrQuery.isSuccess && (ndrQuery.data?.length ?? 0) === 0 ? <p>No NDR cases found.</p> : null}
      {ndrQuery.isSuccess && (ndrQuery.data?.length ?? 0) > 0 ? (
        <NdrCasesTable items={ndrQuery.data ?? []} />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorText: {
    color: '#b91c1c',
  },
};
