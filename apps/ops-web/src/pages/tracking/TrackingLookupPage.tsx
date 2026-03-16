import React, { useState } from 'react';

import { useTrackingLookupMutation } from '../../features/tracking/tracking.api';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

export function TrackingLookupPage(): React.JSX.Element {
  const [shipmentCode, setShipmentCode] = useState('');
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const lookupMutation = useTrackingLookupMutation(accessToken);

  return (
    <section>
      <h2>Internal tracking lookup</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!shipmentCode.trim()) {
            return;
          }
          lookupMutation.mutate(shipmentCode.trim());
        }}
        style={styles.form}
      >
        <input
          value={shipmentCode}
          onChange={(event) => setShipmentCode(event.target.value)}
          placeholder="Shipment code"
        />
        <button type="submit" disabled={lookupMutation.isPending}>
          Lookup
        </button>
      </form>
      {!lookupMutation.data ? null : (
        <>
          <article style={styles.currentCard}>
            <h3>Current</h3>
            <p>Status: {lookupMutation.data.current?.currentStatus ?? 'N/A'}</p>
            <p>Location: {lookupMutation.data.current?.currentLocation ?? 'N/A'}</p>
            <p>Updated at: {formatDateTime(lookupMutation.data.current?.updatedAt)}</p>
          </article>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Event</th>
                <th>Source</th>
                <th>Status after</th>
                <th>Location</th>
                <th>Occurred at</th>
              </tr>
            </thead>
            <tbody>
              {lookupMutation.data.timeline.map((event) => (
                <tr key={event.id}>
                  <td>{event.eventType}</td>
                  <td>{event.eventSource}</td>
                  <td>{event.statusAfterEvent ?? 'N/A'}</td>
                  <td>{event.locationCode ?? 'N/A'}</td>
                  <td>{formatDateTime(event.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  currentCard: {
    border: '1px solid #e7ebf8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
};

