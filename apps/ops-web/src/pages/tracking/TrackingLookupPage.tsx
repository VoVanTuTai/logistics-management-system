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
      <h2>Tra cứu hành trình nội bộ</h2>
      <p style={{ color: '#2d3f99' }}>
        Tra cứu đọc read-model tracking từ server, không tự suy diễn trạng thái hoặc vị trí ở
        client.
      </p>
      <form onSubmit={onSubmit} style={styles.form}>
        <input
          value={shipmentCodeInput}
          onChange={(event) => setShipmentCodeInput(event.target.value)}
          placeholder="Mã vận đơn"
        />
        <button type="submit" disabled={searchQuery.isLoading}>
          Tìm kiếm
        </button>
      </form>

      {!submittedShipmentCode ? <p>Nhập mã vận đơn để bắt đầu tra cứu.</p> : null}
      {searchQuery.isLoading ? <p>Đang tải kết quả tra cứu...</p> : null}
      {searchQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(searchQuery.error)}</p>
      ) : null}
      {searchQuery.isSuccess && !searchQuery.data ? <p>Không tìm thấy dữ liệu tracking.</p> : null}
      {searchQuery.data ? (
        <article style={styles.currentCard}>
          <h3>Kết quả tra cứu</h3>
          <p>Mã vận đơn: {searchQuery.data.shipmentCode}</p>
          <p>Trạng thái hiện tại: {searchQuery.data.currentStatus ?? 'Không có'}</p>
          <p>Vị trí hiện tại: {searchQuery.data.currentLocation ?? 'Không có'}</p>
          <p>Cập nhật lúc: {formatDateTime(searchQuery.data.updatedAt)}</p>
          <Link to={routePaths.trackingDetail(searchQuery.data.shipmentCode)}>
            Mở chi tiết hành trình
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
