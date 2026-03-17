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
    return <p>Đang tải chi tiết hành trình...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Không tìm thấy chi tiết hành trình.</p>;
  }

  return (
    <section>
      <h2>Chi tiết hành trình vận đơn</h2>
      <p>
        <Link to={routePaths.tracking}>Quay lại tra cứu hành trình</Link>
      </p>

      <article style={styles.currentCard}>
        <h3>Mô hình đọc hiện tại</h3>
        <p>Mã vận đơn: {detailQuery.data.current?.shipmentCode ?? shipmentCode}</p>
        <p>Trạng thái hiện tại: {detailQuery.data.current?.currentStatus ?? 'Không có'}</p>
        <p>Vị trí hiện tại: {detailQuery.data.current?.currentLocation ?? 'Không có'}</p>
        <p>Cập nhật lúc: {formatDateTime(detailQuery.data.current?.updatedAt)}</p>
      </article>

      <h3 style={styles.timelineHeading}>Dòng thời gian</h3>
      {detailQuery.data.timeline.length === 0 ? <p>Không có sự kiện timeline.</p> : null}
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
