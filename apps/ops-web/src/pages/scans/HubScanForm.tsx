import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { HubScanType } from '../../features/scans/scans.types';

const hubScanFormSchema = z.object({
  scanType: z.enum(['PICKUP', 'INBOUND', 'OUTBOUND']),
  shipmentCode: z.string().trim().min(1, 'Shipment code is required'),
  locationCode: z.string().trim().min(1, 'Location code is required'),
  note: z.string().optional(),
});

export type HubScanFormValues = z.infer<typeof hubScanFormSchema>;

interface HubScanFormProps {
  isSubmitting: boolean;
  onSubmit: (values: HubScanFormValues) => Promise<void>;
  defaultScanType?: HubScanType;
}

export function HubScanForm({
  isSubmitting,
  onSubmit,
  defaultScanType = 'INBOUND',
}: HubScanFormProps): React.JSX.Element {
  const form = useForm<HubScanFormValues>({
    resolver: zodResolver(hubScanFormSchema),
    defaultValues: {
      scanType: defaultScanType,
      shipmentCode: '',
      locationCode: '',
      note: '',
    },
  });

  const onFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset({
      scanType: values.scanType,
      shipmentCode: '',
      locationCode: values.locationCode,
      note: '',
    });
  });

  return (
    <form onSubmit={onFormSubmit} style={styles.form}>
      <h3 style={styles.title}>Scan action</h3>
      <select {...form.register('scanType')}>
        <option value="PICKUP">PICKUP</option>
        <option value="INBOUND">INBOUND</option>
        <option value="OUTBOUND">OUTBOUND</option>
      </select>
      <input placeholder="Scan or enter shipment code" {...form.register('shipmentCode')} />
      {form.formState.errors.shipmentCode ? (
        <small style={styles.errorText}>{form.formState.errors.shipmentCode.message}</small>
      ) : null}
      <input placeholder="Hub/branch location code" {...form.register('locationCode')} />
      {form.formState.errors.locationCode ? (
        <small style={styles.errorText}>{form.formState.errors.locationCode.message}</small>
      ) : null}
      <textarea rows={3} placeholder="Optional note" {...form.register('note')} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting scan...' : 'Submit scan'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'grid',
    gap: 8,
    maxWidth: 560,
    marginTop: 12,
  },
  title: {
    margin: 0,
  },
  errorText: {
    color: '#b91c1c',
  },
};
