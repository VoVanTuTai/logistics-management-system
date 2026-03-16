import React from 'react';
import { Link, useParams } from 'react-router-dom';

import { useTrackingDetailQuery } from '../../features/tracking/tracking.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { TrackingTimelineTable } from './TrackingTimelineTable';

export function TrackingDetailPage(): React.JSX.Element {
  const { shipmentCode: shipmentCodeParam = '' } = useParams();
  const shipmentCode = decodeURIComponent(shipmentCodeParam);
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = useTrackingDetailQuery(accessToken, shipmentCode);

  if (detailQuery.isLoading) {
    return <p>Loading tracking detail...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Tracking detail not found.</p>;
  }

  return (
    <section>
      <h2>Shipment tracking detail</h2>
      <p>
        <Link to={routePaths.tracking}>Back to tracking search</Link>
      </p>

      <article style={styles.currentCard}>
        <h3>Current read model</h3>
        <p>Shipment code: {detailQuery.data.current?.shipmentCode ?? shipmentCode}</p>
        <p>Current status: {detailQuery.data.current?.currentStatus ?? 'N/A'}</p>
        <p>Current location: {detailQuery.data.current?.currentLocation ?? 'N/A'}</p>
        <p>Updated at: {formatDateTime(detailQuery.data.current?.updatedAt)}</p>
      </article>

      <h3 style={styles.timelineHeading}>Timeline</h3>
      {detailQuery.data.timeline.length === 0 ? <p>No timeline events.</p> : null}
      {detailQuery.data.timeline.length > 0 ? (
        <TrackingTimelineTable items={detailQuery.data.timeline} />
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  currentCard: {
    border: '1px solid #e7ebf8',
    borderRadius: 12,
    padding: 12,
    maxWidth: 720,
  },
  timelineHeading: {
    marginTop: 16,
    marginBottom: 0,
  },
  errorText: {
    color: '#b91c1c',
  },
};
