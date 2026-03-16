import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useTrackingSearchQuery } from '../../features/tracking/tracking.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

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
      <h2>Internal tracking search</h2>
      <p style={{ color: '#2d3f99' }}>
        Search reads tracking projection from server and does not derive status or location on
        client.
      </p>
      <form onSubmit={onSubmit} style={styles.form}>
        <input
          value={shipmentCodeInput}
          onChange={(event) => setShipmentCodeInput(event.target.value)}
          placeholder="Shipment code"
        />
        <button type="submit" disabled={searchQuery.isLoading}>
          Search
        </button>
      </form>

      {!submittedShipmentCode ? <p>Enter shipment code to start search.</p> : null}
      {searchQuery.isLoading ? <p>Loading tracking search...</p> : null}
      {searchQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(searchQuery.error)}</p>
      ) : null}
      {searchQuery.isSuccess && !searchQuery.data ? <p>No tracking data found.</p> : null}
      {searchQuery.data ? (
        <article style={styles.currentCard}>
          <h3>Search result</h3>
          <p>Shipment code: {searchQuery.data.shipmentCode}</p>
          <p>Current status: {searchQuery.data.currentStatus ?? 'N/A'}</p>
          <p>Current location: {searchQuery.data.currentLocation ?? 'N/A'}</p>
          <p>Updated at: {formatDateTime(searchQuery.data.updatedAt)}</p>
          <Link to={routePaths.trackingDetail(searchQuery.data.shipmentCode)}>
            Open tracking detail
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
