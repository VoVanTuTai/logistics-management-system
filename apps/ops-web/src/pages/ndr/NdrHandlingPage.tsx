import React from 'react';
import { useForm } from 'react-hook-form';

import {
  useNdrCasesQuery,
  useRescheduleMutation,
  useReturnDecisionMutation,
} from '../../features/ndr/ndr.api';
import type { RescheduleInput, ReturnDecisionInput } from '../../features/ndr/ndr.types';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

export function NdrHandlingPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const ndrQuery = useNdrCasesQuery(accessToken);
  const rescheduleMutation = useRescheduleMutation(accessToken);
  const returnMutation = useReturnDecisionMutation(accessToken);
  const rescheduleForm = useForm<RescheduleInput>({
    defaultValues: { ndrId: '', nextDeliveryAt: '', note: '' },
  });
  const returnForm = useForm<ReturnDecisionInput>({
    defaultValues: { ndrId: '', returnToSender: true, note: '' },
  });

  return (
    <section>
      <h2>NDR handling</h2>
      <div style={styles.grid}>
        <article style={styles.card}>
          <h3>Reschedule</h3>
          <form onSubmit={rescheduleForm.handleSubmit((v) => rescheduleMutation.mutate(v))}>
            <input placeholder="NDR ID" {...rescheduleForm.register('ndrId')} />
            <input
              type="datetime-local"
              {...rescheduleForm.register('nextDeliveryAt')}
            />
            <input placeholder="Note" {...rescheduleForm.register('note')} />
            <button type="submit">Submit reschedule</button>
          </form>
        </article>
        <article style={styles.card}>
          <h3>Return decision</h3>
          <form onSubmit={returnForm.handleSubmit((v) => returnMutation.mutate(v))}>
            <input placeholder="NDR ID" {...returnForm.register('ndrId')} />
            <label>
              <input type="checkbox" {...returnForm.register('returnToSender')} />
              Return to sender
            </label>
            <input placeholder="Note" {...returnForm.register('note')} />
            <button type="submit">Submit decision</button>
          </form>
        </article>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>NDR ID</th>
            <th>Shipment</th>
            <th>Status</th>
            <th>Reason code</th>
            <th>Updated at</th>
          </tr>
        </thead>
        <tbody>
          {(ndrQuery.data ?? []).map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.shipmentCode}</td>
              <td>{item.status}</td>
              <td>{item.reasonCode ?? 'N/A'}</td>
              <td>{formatDateTime(item.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    border: '1px solid #e7ebf8',
    borderRadius: 12,
    padding: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
};

