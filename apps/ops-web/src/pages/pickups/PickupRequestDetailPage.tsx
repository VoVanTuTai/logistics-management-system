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
      ? 'approve'
      : lastActionName === 'complete'
        ? 'complete'
        : lastActionName === 'reject'
          ? 'reject'
          : 'none';

  if (detailQuery.isLoading) {
    return <p>Loading pickup request detail...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Pickup request was not found.</p>;
  }

  const canComplete =
    detailQuery.data.status === 'APPROVED' || detailQuery.data.status === 'COMPLETED';

  return (
    <section>
      <h2>Pickup Request Detail</h2>
      <p>
        <Link to={routePaths.pickups}>Back to pickup requests</Link>
      </p>
      <p>Request code: {detailQuery.data.requestCode}</p>
      <p>Shipment code: {detailQuery.data.shipmentCode ?? 'N/A'}</p>
      <p>Status: {detailQuery.data.status}</p>
      <p>Requested at: {formatDateTime(detailQuery.data.requestedAt)}</p>
      <p>Updated at: {detailQuery.data.updatedAt ? formatDateTime(detailQuery.data.updatedAt) : 'N/A'}</p>
      <p>Note: {detailQuery.data.note ?? 'N/A'}</p>

      <div style={styles.actionsGrid}>
        <form onSubmit={onApproveSubmit} style={styles.form}>
          <h3 style={styles.actionTitle}>Approve</h3>
          <textarea rows={3} placeholder="Approval note" {...approveForm.register('note')} />
          <button type="submit" disabled={approveMutation.isPending}>
            {approveMutation.isPending ? 'Submitting approval...' : 'Approve pickup'}
          </button>
          {approveMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(approveMutation.error)}</small>
          ) : null}
        </form>

        <form onSubmit={onRejectSubmit} style={styles.form}>
          <h3 style={styles.actionTitle}>Cancel</h3>
          <textarea rows={3} placeholder="Cancellation reason" {...rejectForm.register('note')} />
          <button type="submit" disabled={rejectMutation.isPending}>
            {rejectMutation.isPending ? 'Submitting cancellation...' : 'Cancel pickup'}
          </button>
          {rejectMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(rejectMutation.error)}</small>
          ) : null}
        </form>

        <div style={styles.form}>
          <h3 style={styles.actionTitle}>Complete</h3>
          <button
            type="button"
            onClick={() => void onCompleteClick()}
            disabled={completeMutation.isPending || !canComplete}
          >
            {completeMutation.isPending ? 'Submitting completion...' : 'Complete pickup'}
          </button>
          {!canComplete ? (
            <small>Pickup can be completed only when status is APPROVED.</small>
          ) : null}
          {completeMutation.isError ? (
            <small style={styles.errorText}>{getErrorMessage(completeMutation.error)}</small>
          ) : null}
        </div>
      </div>

      {lastActionResponse ? (
        <div style={styles.responseBox}>
          <strong>Latest server response ({lastActionLabel})</strong>
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
