import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';

import {
  useApproveShipmentMutation,
  useReviewShipmentMutation,
  useShipmentDetailQuery,
  useUpdateShipmentMutation,
} from '../../features/shipments/shipments.api';
import type {
  ApproveShipmentInput,
  ReviewShipmentInput,
  UpdateShipmentInput,
} from '../../features/shipments/shipments.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatShipmentStatusLabel } from '../../utils/logisticsLabels';

export function ShipmentDetailPage(): React.JSX.Element {
  const { shipmentId = '' } = useParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = useShipmentDetailQuery(accessToken, shipmentId);
  const updateMutation = useUpdateShipmentMutation(accessToken, shipmentId);
  const reviewMutation = useReviewShipmentMutation(accessToken, shipmentId);
  const approveMutation = useApproveShipmentMutation(accessToken, shipmentId);
  const form = useForm<UpdateShipmentInput>({
    defaultValues: {
      note: '',
    },
  });
  const reviewForm = useForm<ReviewShipmentInput>({
    defaultValues: {
      note: '',
    },
  });
  const approveForm = useForm<ApproveShipmentInput>({
    defaultValues: {
      note: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync(values);
  });
  const onReviewSubmit = reviewForm.handleSubmit(async (values) => {
    await reviewMutation.mutateAsync(values);
  });
  const onApproveSubmit = approveForm.handleSubmit(async (values) => {
    await approveMutation.mutateAsync(values);
  });

  if (detailQuery.isLoading) {
    return <p>Đang tải chi tiết vận đơn...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Không tìm thấy vận đơn.</p>;
  }

  return (
    <section>
      <h2>Chi tiết vận đơn</h2>
      <p>Mã vận đơn: {detailQuery.data.shipmentCode}</p>
      <p>Trạng thái hiện tại: {formatShipmentStatusLabel(detailQuery.data.currentStatus)}</p>
      <p>Vị trí hiện tại: {detailQuery.data.currentLocation ?? 'Không có'}</p>
      <p>Cập nhật lúc: {formatDateTime(detailQuery.data.updatedAt)}</p>

      <div style={styles.entryPointGroup}>
        <strong>Điểm vào nghiệp vụ liên quan</strong>
        <div style={styles.entryLinks}>
          <Link to={`${routePaths.tasks}?shipmentCode=${encodeURIComponent(detailQuery.data.shipmentCode)}`}>
            Phân công/phân công lại tác vụ
          </Link>
          <Link
            to={`${routePaths.manifests}?shipmentCode=${encodeURIComponent(detailQuery.data.shipmentCode)}`}
          >
            Thêm vào bao tải
          </Link>
          <Link to={`${routePaths.scans}?shipmentCode=${encodeURIComponent(detailQuery.data.shipmentCode)}`}>
            Quét hub
          </Link>
          <Link to={`${routePaths.ndr}?shipmentCode=${encodeURIComponent(detailQuery.data.shipmentCode)}`}>
            Xử lý NDR
          </Link>
        </div>
      </div>

      <form onSubmit={onSubmit} style={styles.form}>
        <label htmlFor="note">Ghi chú vận hành</label>
        <textarea id="note" rows={4} {...form.register('note')} />
        <button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
        </button>
        {updateMutation.isError ? (
          <small style={styles.errorText}>{getErrorMessage(updateMutation.error)}</small>
        ) : null}
      </form>

      <div style={styles.actionsGrid}>
        <form onSubmit={onReviewSubmit} style={styles.form}>
          <h3 style={styles.actionTitle}>Rà soát</h3>
          <textarea rows={3} placeholder="Ghi chú rà soát" {...reviewForm.register('note')} />
          <button type="submit" disabled={reviewMutation.isPending}>
            {reviewMutation.isPending ? 'Đang gửi rà soát...' : 'Gửi rà soát'}
          </button>
          {reviewMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(reviewMutation.error)}</small>
          ) : null}
        </form>

        <form onSubmit={onApproveSubmit} style={styles.form}>
          <h3 style={styles.actionTitle}>Phê duyệt</h3>
          <textarea rows={3} placeholder="Ghi chú phê duyệt" {...approveForm.register('note')} />
          <button type="submit" disabled={approveMutation.isPending}>
            {approveMutation.isPending ? 'Đang gửi phê duyệt...' : 'Gửi phê duyệt'}
          </button>
          {approveMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(approveMutation.error)}</small>
          ) : null}
        </form>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  entryPointGroup: {
    marginTop: 12,
    padding: 12,
    border: '1px solid #e7ebf8',
    borderRadius: 12,
  },
  entryLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  form: {
    display: 'grid',
    gap: 8,
    marginTop: 12,
    maxWidth: 520,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
    marginTop: 8,
  },
  actionTitle: {
    margin: 0,
  },
  errorText: {
    color: '#b91c1c',
  },
};
