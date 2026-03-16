import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useNdrCaseDetailQuery,
  useRescheduleMutation,
  useReturnDecisionMutation,
} from '../../features/ndr/ndr.api';
import type {
  NdrActionResultDto,
  RescheduleInput,
  ReturnDecisionInput,
} from '../../features/ndr/ndr.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { type NdrActionMode } from './NdrActionForm.schema';
import { NdrNextActionForm } from './NdrNextActionForm';

export function NdrCaseDetailPage(): React.JSX.Element {
  const { ndrId = '' } = useParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = useNdrCaseDetailQuery(accessToken, ndrId);
  const rescheduleMutation = useRescheduleMutation(accessToken, ndrId);
  const returnMutation = useReturnDecisionMutation(accessToken, ndrId);
  const [actionMode, setActionMode] = useState<NdrActionMode>('RESCHEDULE');
  const [lastActionName, setLastActionName] =
    useState<'reschedule' | 'return' | null>(null);
  const [lastActionResponse, setLastActionResponse] =
    useState<NdrActionResultDto | null>(null);

  const onReschedule = async (payload: RescheduleInput) => {
    const response = await rescheduleMutation.mutateAsync(payload);
    setLastActionName('reschedule');
    setLastActionResponse(response);
  };

  const onReturnDecision = async (payload: ReturnDecisionInput) => {
    const response = await returnMutation.mutateAsync(payload);
    setLastActionName('return');
    setLastActionResponse(response);
  };

  if (detailQuery.isLoading) {
    return <p>Loading NDR detail...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>NDR case not found.</p>;
  }

  return (
    <section>
      <h2>NDR detail</h2>
      <p>
        <Link to={routePaths.ndr}>Back to NDR list</Link>
      </p>

      <p>NDR ID: {detailQuery.data.id}</p>
      <p>Shipment code: {detailQuery.data.shipmentCode}</p>
      <p>Status: {detailQuery.data.status}</p>
      <p>Reason code: {detailQuery.data.reasonCode ?? 'N/A'}</p>
      <p>Updated at: {formatDateTime(detailQuery.data.updatedAt)}</p>
      <p>Note: {detailQuery.data.note ?? 'N/A'}</p>

      <label htmlFor="ndr-next-action">Next action</label>
      <select
        id="ndr-next-action"
        value={actionMode}
        onChange={(event) => setActionMode(event.target.value as NdrActionMode)}
        style={styles.select}
      >
        <option value="RESCHEDULE">RESCHEDULE</option>
        <option value="RETURN">RETURN</option>
      </select>

      <NdrNextActionForm
        mode={actionMode}
        isSubmitting={rescheduleMutation.isPending || returnMutation.isPending}
        onReschedule={onReschedule}
        onReturnDecision={onReturnDecision}
      />

      {rescheduleMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(rescheduleMutation.error)}</p>
      ) : null}
      {returnMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(returnMutation.error)}</p>
      ) : null}

      {lastActionResponse ? (
        <div style={styles.responseBox}>
          <strong>Last server response ({lastActionName})</strong>
          <pre style={styles.pre}>{JSON.stringify(lastActionResponse, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  select: {
    marginTop: 8,
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
