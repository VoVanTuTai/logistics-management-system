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
      <h2>Xu ly NDR</h2>
      <p style={{ color: '#2d3f99' }}>
        Trang thai va thong tin ho so duoc hien thi truc tiep tu du lieu backend.
      </p>
      {ndrQuery.isLoading ? <p>Dang tai danh sach NDR...</p> : null}
      {ndrQuery.isError ? <p style={styles.errorText}>{getErrorMessage(ndrQuery.error)}</p> : null}
      {ndrQuery.isSuccess && (ndrQuery.data?.length ?? 0) === 0 ? <p>Khong co ho so NDR.</p> : null}
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
