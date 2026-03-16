import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useInboundScanMutation,
  useOutboundScanMutation,
} from '../../features/scans/scans.api';
import type { HubScanInput } from '../../features/scans/scans.types';
import { useAuthStore } from '../../store/authStore';
import { createIdempotencyKey } from '../../utils/idempotency';

const scanSchema = z.object({
  shipmentCode: z.string().min(1),
  locationCode: z.string().min(1),
  note: z.string().optional(),
  scanType: z.enum(['INBOUND', 'OUTBOUND']),
});

type ScanFormValues = z.infer<typeof scanSchema>;

export function HubScanPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const inboundMutation = useInboundScanMutation(accessToken);
  const outboundMutation = useOutboundScanMutation(accessToken);
  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      shipmentCode: '',
      locationCode: '',
      note: '',
      scanType: 'INBOUND',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: HubScanInput = {
      shipmentCode: values.shipmentCode,
      locationCode: values.locationCode,
      note: values.note ?? null,
      scanType: values.scanType,
      idempotencyKey: createIdempotencyKey('ops-hub-scan'),
    };

    if (values.scanType === 'INBOUND') {
      await inboundMutation.mutateAsync(payload);
      return;
    }

    await outboundMutation.mutateAsync(payload);
  });

  return (
    <section>
      <h2>Hub scan inbound/outbound</h2>
      <p style={{ color: '#2d3f99' }}>
        Scan command always carries client-generated idempotencyKey.
      </p>
      <form onSubmit={onSubmit} style={styles.form}>
        <input placeholder="Shipment code" {...form.register('shipmentCode')} />
        <input placeholder="Hub location code" {...form.register('locationCode')} />
        <select {...form.register('scanType')}>
          <option value="INBOUND">INBOUND</option>
          <option value="OUTBOUND">OUTBOUND</option>
        </select>
        <textarea rows={4} placeholder="Note" {...form.register('note')} />
        <button type="submit" disabled={inboundMutation.isPending || outboundMutation.isPending}>
          Submit scan
        </button>
      </form>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'grid',
    gap: 8,
    maxWidth: 520,
  },
};

