import React from 'react';
import { Link, useParams } from 'react-router-dom';

import { useTrackingDetailQuery } from '../../features/tracking/tracking.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';
import { TrackingTimelineTable } from './TrackingTimelineTable';

export function TrackingDetailPage(): React.JSX.Element {
  const { shipmentCode: shipmentCodeParam = '' } = useParams();
  const shipmentCode = decodeURIComponent(shipmentCodeParam);
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = useTrackingDetailQuery(accessToken, shipmentCode);

  if (detailQuery.isLoading) {
    return <p>Dang tai chi tiet hanh trinh...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Khong tim thay chi tiet hanh trinh.</p>;
  }

  return (
    <section>
      <h2>Chi tiet hanh trinh van don</h2>
      <p>
        <Link to={routePaths.tracking}>Quay lai tra cuu hanh trinh</Link>
      </p>

      <article style={styles.currentCard}>
        <h3>Du lieu hanh trinh hien tai</h3>
        <p>Ma van don: {detailQuery.data.current?.shipmentCode ?? shipmentCode}</p>
        <p>
          Trang thai hien tai:{' '}
          {formatShipmentStatusLabel(detailQuery.data.current?.currentStatus)}
        </p>
        <p>Vi tri hien tai: {detailQuery.data.current?.currentLocation ?? 'Khong co'}</p>
        <p>Cap nhat luc: {formatDateTime(detailQuery.data.current?.updatedAt)}</p>
      </article>

      <h3 style={styles.timelineHeading}>Dong thoi gian</h3>
      {detailQuery.data.timeline.length === 0 ? <p>Khong co su kien hanh trinh.</p> : null}
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
