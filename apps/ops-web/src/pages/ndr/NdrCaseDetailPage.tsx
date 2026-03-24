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
import { formatAnyCodeLabel, formatNdrStatusLabel } from '../../utils/logisticsLabels';
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
  const lastActionLabel =
    lastActionName === 'reschedule'
      ? 'dời lịch giao'
      : lastActionName === 'return'
        ? 'hoàn hàng'
        : 'không có';

  if (detailQuery.isLoading) {
    return <p>Đang tải chi tiết NDR...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Không tìm thấy case NDR.</p>;
  }

  return (
    <section>
      <h2>Chi tiết NDR</h2>
      <p>
        <Link to={routePaths.ndr}>Quay lại danh sách NDR</Link>
      </p>

      <p>NDR ID: {detailQuery.data.id}</p>
      <p>Mã vận đơn: {detailQuery.data.shipmentCode}</p>
      <p>Trạng thái: {formatNdrStatusLabel(detailQuery.data.status)}</p>
      <p>Mã lý do: {formatAnyCodeLabel(detailQuery.data.reasonCode)}</p>
      <p>Cập nhật lúc: {formatDateTime(detailQuery.data.updatedAt)}</p>
      <p>Ghi chú: {detailQuery.data.note ?? 'Không có'}</p>

      <label htmlFor="ndr-next-action">Hành động tiếp theo</label>
      <select
        id="ndr-next-action"
        value={actionMode}
        onChange={(event) => setActionMode(event.target.value as NdrActionMode)}
        style={styles.select}
      >
        <option value="RESCHEDULE">Dời lịch giao</option>
        <option value="RETURN">Hoàn hàng</option>
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
          <strong>Phan hoi he thong gan nhat ({lastActionLabel})</strong>
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
