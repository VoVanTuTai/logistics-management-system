import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useTrackingSearchQuery } from '../../features/tracking/tracking.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';

export function TrackingLookupPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [shipmentCodeInput, setShipmentCodeInput] = useState('');
  const [submittedShipmentCode, setSubmittedShipmentCode] = useState('');
  const searchQuery = useTrackingSearchQuery(
    accessToken,
    submittedShipmentCode,
    Boolean(submittedShipmentCode),
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCode = shipmentCodeInput.trim();

    if (!nextCode) {
      return;
    }

    setSubmittedShipmentCode(nextCode);
  };

  return (
    <section>
      <h2>Tra cuu hanh trinh noi bo</h2>
      <p style={{ color: '#2d3f99' }}>
        Du lieu hanh trinh duoc doc truc tiep tu backend, khong tu suy dien trang thai tren giao dien.
      </p>
      <form onSubmit={onSubmit} style={styles.form}>
        <input
          value={shipmentCodeInput}
          onChange={(event) => setShipmentCodeInput(event.target.value)}
          placeholder="Ma van don"
        />
        <button type="submit" disabled={searchQuery.isLoading}>
          Tim kiem
        </button>
      </form>

      {!submittedShipmentCode ? <p>Nhap ma van don de bat dau tra cuu.</p> : null}
      {searchQuery.isLoading ? <p>Dang tai ket qua tra cuu...</p> : null}
      {searchQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(searchQuery.error)}</p>
      ) : null}
      {searchQuery.isSuccess && !searchQuery.data ? <p>Khong tim thay du lieu hanh trinh.</p> : null}
      {searchQuery.data ? (
        <article style={styles.currentCard}>
          <h3>Ket qua tra cuu</h3>
          <p>Ma van don: {searchQuery.data.shipmentCode}</p>
          <p>Trang thai hien tai: {formatShipmentStatusLabel(searchQuery.data.currentStatus)}</p>
          <p>Vi tri hien tai: {searchQuery.data.currentLocation ?? 'Khong co'}</p>
          <p>Cap nhat luc: {formatDateTime(searchQuery.data.updatedAt)}</p>
          <Link to={routePaths.trackingDetail(searchQuery.data.shipmentCode)}>
            Mo chi tiet hanh trinh
          </Link>
        </article>
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  currentCard: {
    border: '1px solid #e7ebf8',
    borderRadius: 12,
    padding: 12,
    maxWidth: 620,
  },
  errorText: {
    color: '#b91c1c',
  },
};
