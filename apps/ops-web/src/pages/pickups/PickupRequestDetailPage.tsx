import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';

import {
  useApprovePickupMutation,
  useCompletePickupMutation,
  usePickupRequestDetailQuery,
  useRejectPickupMutation,
} from '../../features/pickups/pickups.api';
import type {
  PickupActionResultDto,
  PickupReviewInput,
} from '../../features/pickups/pickups.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatPickupStatusLabel } from '../../utils/logisticsLabels';

export function PickupRequestDetailPage(): React.JSX.Element {
  const { pickupId = '' } = useParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = usePickupRequestDetailQuery(accessToken, pickupId);
  const approveMutation = useApprovePickupMutation(accessToken, pickupId);
  const completeMutation = useCompletePickupMutation(accessToken, pickupId);
  const rejectMutation = useRejectPickupMutation(accessToken, pickupId);
  const approveForm = useForm<PickupReviewInput>({
    defaultValues: {
      note: '',
    },
  });
  const rejectForm = useForm<PickupReviewInput>({
    defaultValues: {
      note: '',
    },
  });
  const [lastActionName, setLastActionName] = useState<
    'approve' | 'complete' | 'reject' | null
  >(null);
  const [lastActionResponse, setLastActionResponse] =
    useState<PickupActionResultDto | null>(null);

  const onApproveSubmit = approveForm.handleSubmit(async (payload) => {
    const response = await approveMutation.mutateAsync(payload);
    setLastActionName('approve');
    setLastActionResponse(response);
  });

  const onRejectSubmit = rejectForm.handleSubmit(async (payload) => {
    const response = await rejectMutation.mutateAsync(payload);
    setLastActionName('reject');
    setLastActionResponse(response);
  });

  const onCompleteClick = async () => {
    const response = await completeMutation.mutateAsync();
    setLastActionName('complete');
    setLastActionResponse(response);
  };

  const lastActionLabel =
    lastActionName === 'approve'
      ? 'duyệt'
      : lastActionName === 'complete'
        ? 'hoàn tất'
        : lastActionName === 'reject'
          ? 'từ chối'
          : 'chưa-có';

  if (detailQuery.isLoading) {
    return <p>Đang tải chi tiet yêu cầu lấy hàng...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Không tìm thấy yêu cầu lấy hàng.</p>;
  }

  const canComplete =
    detailQuery.data.status === 'APPROVED' || detailQuery.data.status === 'COMPLETED';

  return (
    <section>
      <h2>Chi tiết yêu cầu lấy hàng</h2>
      <p>
        <Link to={routePaths.pickups}>Quay lại danh sach yêu cầu lấy hàng</Link>
      </p>
      <p>Ma yêu cầu: {detailQuery.data.requestCode}</p>
      <p>Ma vận đơn: {detailQuery.data.shipmentCode ?? 'Không có'}</p>
      <p>Trạng thái: {formatPickupStatusLabel(detailQuery.data.status)}</p>
      <p>Thoi diem tao: {formatDateTime(detailQuery.data.requestedAt)}</p>
      <p>Cập nhật lúc: {detailQuery.data.updatedAt ? formatDateTime(detailQuery.data.updatedAt) : 'Không có'}</p>
      <p>Ghi chu: {detailQuery.data.note ?? 'Không có'}</p>

      <div style={styles.actionsGrid}>
        <form onSubmit={onApproveSubmit} style={styles.form}>
          <h3 style={styles.actionTitle}>Duyet</h3>
          <textarea rows={3} placeholder="Ghi chú duyệt" {...approveForm.register('note')} />
          <button type="submit" disabled={approveMutation.isPending}>
            {approveMutation.isPending ? 'Đang gửi duyệt...' : 'Duyệt lấy hàng'}
          </button>
          {approveMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(approveMutation.error)}</small>
          ) : null}
        </form>

        <form onSubmit={onRejectSubmit} style={styles.form}>
          <h3 style={styles.actionTitle}>Tu choi</h3>
          <textarea rows={3} placeholder="Lý do từ chối" {...rejectForm.register('note')} />
          <button type="submit" disabled={rejectMutation.isPending}>
            {rejectMutation.isPending ? 'Đang gửi từ chối...' : 'Từ chối lấy hàng'}
          </button>
          {rejectMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(rejectMutation.error)}</small>
          ) : null}
        </form>

        <div style={styles.form}>
          <h3 style={styles.actionTitle}>Hoàn tất</h3>
          <button
            type="button"
            onClick={() => void onCompleteClick()}
            disabled={completeMutation.isPending || !canComplete}
          >
            {completeMutation.isPending ? 'Đang gửi hoàn tất...' : 'Hoàn tất lấy hàng'}
          </button>
          {!canComplete ? (
            <small>
              Chi hoàn tất lấy hàng khi trạng thái la {formatPickupStatusLabel('APPROVED')}.
            </small>
          ) : null}
          {completeMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(completeMutation.error)}</small>
          ) : null}
        </div>
      </div>

      {lastActionResponse ? (
        <div style={styles.responseBox}>
          <strong>Phan hoi hệ thống moi nhat ({lastActionLabel})</strong>
          <pre style={styles.pre}>{JSON.stringify(lastActionResponse, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'grid',
    gap: 8,
    marginTop: 12,
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
    marginTop: 8,
    maxWidth: 900,
  },
  actionTitle: {
    margin: 0,
  },
  responseBox: {
    marginTop: 16,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
  },
  pre: {
    marginTop: 8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13,
  },
  errorText: {
    color: '#b91c1c',
  },
};
