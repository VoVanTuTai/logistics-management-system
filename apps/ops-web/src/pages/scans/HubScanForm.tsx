import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { HubScanType } from '../../features/scans/scans.types';

const hubScanFormSchema = z.object({
  scanType: z.enum(['INBOUND', 'OUTBOUND']),
  shipmentCode: z.string().trim().min(1, 'Mã vận đơn là bắt buộc'),
  locationCode: z.string().trim().min(1, 'Mã vị trí hub là bắt buộc'),
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
      locationCode: '',
      note: '',
    });
  });

  return (
    <form onSubmit={onFormSubmit} style={styles.form}>
      <h3 style={styles.title}>Thao tác quét</h3>
      <select {...form.register('scanType')}>
        <option value="INBOUND">INBOUND</option>
        <option value="OUTBOUND">OUTBOUND</option>
      </select>
      <input placeholder="Nhập hoặc quét mã vận đơn" {...form.register('shipmentCode')} />
      {form.formState.errors.shipmentCode ? (
        <small style={styles.errorText}>
          {form.formState.errors.shipmentCode.message}
        </small>
      ) : null}
      <input placeholder="Mã vị trí hub" {...form.register('locationCode')} />
      {form.formState.errors.locationCode ? (
        <small style={styles.errorText}>
          {form.formState.errors.locationCode.message}
        </small>
      ) : null}
      <textarea rows={3} placeholder="Ghi chú (không bắt buộc)" {...form.register('note')} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi quét...' : 'Gửi quét'}
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
