import React, { useState } from 'react';

import {
  useInboundScanMutation,
  useOutboundScanMutation,
  usePickupScanMutation,
} from '../../features/scans/scans.api';
import type {
  HubScanInput,
  HubScanResultDto,
  HubScanType,
} from '../../features/scans/scans.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { createIdempotencyKey } from '../../utils/idempotency';
import { formatScanTypeLabel } from '../../utils/logisticsLabels';
import { HubScanForm, type HubScanFormValues } from './HubScanForm';

export function HubScanPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const pickupMutation = usePickupScanMutation(accessToken);
  const inboundMutation = useInboundScanMutation(accessToken);
  const outboundMutation = useOutboundScanMutation(accessToken);
  const [lastScanType, setLastScanType] = useState<HubScanType | null>(null);
  const [lastScanResult, setLastScanResult] = useState<HubScanResultDto | null>(null);

  const onSubmit = async (values: HubScanFormValues) => {
    const payload: HubScanInput = {
      shipmentCode: values.shipmentCode,
      locationCode: values.locationCode,
      note: values.note ?? null,
      scanType: values.scanType,
      idempotencyKey: createIdempotencyKey('ops-scan'),
    };

    if (values.scanType === 'PICKUP') {
      const result = await pickupMutation.mutateAsync(payload);
      setLastScanType('PICKUP');
      setLastScanResult(result);
      return;
    }

    if (values.scanType === 'INBOUND') {
      const result = await inboundMutation.mutateAsync(payload);
      setLastScanType('INBOUND');
      setLastScanResult(result);
      return;
    }

    const result = await outboundMutation.mutateAsync(payload);
    setLastScanType('OUTBOUND');
    setLastScanResult(result);
  };

  const isSubmitting =
    pickupMutation.isPending || inboundMutation.isPending || outboundMutation.isPending;
  const actionError =
    pickupMutation.error ?? inboundMutation.error ?? outboundMutation.error;
  const lastScanLabel = formatScanTypeLabel(lastScanType);

  return (
    <section>
      <h2>Van hanh quet</h2>
      <p style={{ color: '#2d3f99' }}>
        Dung man hinh nay cho quet lay hang, nhap hub va xuat hub. Moi quet hop le
        se cap nhat vi tri hien tai va dam bao idempotency theo request key.
      </p>
      <HubScanForm isSubmitting={isSubmitting} onSubmit={onSubmit} />

      {isSubmitting ? <p>Dang gui quet...</p> : null}
      {actionError ? <p style={styles.errorText}>{getErrorMessage(actionError)}</p> : null}
      {!isSubmitting && !actionError && !lastScanResult ? <p>Chua co ket qua quet.</p> : null}
      {lastScanResult ? (
        <div style={styles.responseBox}>
          <strong>Phan hoi quet gan nhat ({lastScanLabel})</strong>
          <pre style={styles.pre}>{JSON.stringify(lastScanResult, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  responseBox: {
    marginTop: 12,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
    maxWidth: 920,
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
