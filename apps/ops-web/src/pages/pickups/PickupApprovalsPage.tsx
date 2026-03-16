import React from 'react';

import {
  useApprovePickupMutation,
  usePickupRequestsQuery,
  useRejectPickupMutation,
} from '../../features/pickups/pickups.api';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

export function PickupApprovalsPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const pickupsQuery = usePickupRequestsQuery(accessToken);
  const approveMutation = useApprovePickupMutation(accessToken);
  const rejectMutation = useRejectPickupMutation(accessToken);

  return (
    <section>
      <h2>Pickup approvals</h2>
      <p style={{ color: '#2d3f99' }}>
        Review actions are commands sent to /ops only. No client-side workflow transitions.
      </p>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Request</th>
            <th>Shipment</th>
            <th>Status</th>
            <th>Requested at</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(pickupsQuery.data ?? []).map((pickup) => (
            <tr key={pickup.id}>
              <td>{pickup.requestCode}</td>
              <td>{pickup.shipmentCode ?? 'N/A'}</td>
              <td>{pickup.status}</td>
              <td>{formatDateTime(pickup.requestedAt)}</td>
              <td style={styles.actionCell}>
                <button
                  type="button"
                  onClick={() =>
                    approveMutation.mutate({
                      pickupId: pickup.id,
                      payload: { note: 'Approved by ops' },
                    })
                  }
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    rejectMutation.mutate({
                      pickupId: pickup.id,
                      payload: { note: 'Rejected by ops' },
                    })
                  }
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 12,
  },
  actionCell: {
    display: 'flex',
    gap: 8,
  },
};

