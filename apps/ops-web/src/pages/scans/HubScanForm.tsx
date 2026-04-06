import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { HubScanType } from '../../features/scans/scans.types';
import { formatScanTypeLabel } from '../../utils/logisticsLabels';

const hubScanFormSchema = z.object({
  scanType: z.enum(['PICKUP', 'INBOUND', 'OUTBOUND']),
  shipmentCode: z.string().trim().min(1, 'Ma van don la bat buoc'),
  locationCode: z.string().trim().min(1, 'Ma vi tri la bat buoc'),
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
      <h3 style={styles.title}>Tac vu quet</h3>
      <select {...form.register('scanType')}>
        <option value="PICKUP">{formatScanTypeLabel('PICKUP')}</option>
        <option value="INBOUND">{formatScanTypeLabel('INBOUND')}</option>
        <option value="OUTBOUND">{formatScanTypeLabel('OUTBOUND')}</option>
      </select>
      <input placeholder="Quet hoac nhap ma van don" {...form.register('shipmentCode')} />
      {form.formState.errors.shipmentCode ? (
        <small style={styles.errorText}>{form.formState.errors.shipmentCode.message}</small>
      ) : null}
      <input placeholder="Ma vi tri hub/chi nhanh" {...form.register('locationCode')} />
      {form.formState.errors.locationCode ? (
        <small style={styles.errorText}>{form.formState.errors.locationCode.message}</small>
      ) : null}
      <textarea rows={3} placeholder="Ghi chu (khong bat buoc)" {...form.register('note')} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Dang gui quet...' : 'Gui quet'}
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
