import React from 'react';
import { useForm } from 'react-hook-form';

import type { CreateManifestInput } from '../../features/manifests/manifests.types';

interface CreateManifestFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: CreateManifestInput) => Promise<void>;
}

interface CreateManifestFormValues {
  manifestCode: string;
  originHubCode: string;
  destinationHubCode: string;
  shipmentCodesText: string;
}

export function CreateManifestForm({
  isSubmitting,
  onSubmit,
}: CreateManifestFormProps): React.JSX.Element {
  const form = useForm<CreateManifestFormValues>({
    defaultValues: {
      manifestCode: '',
      originHubCode: '',
      destinationHubCode: '',
      shipmentCodesText: '',
    },
  });

  const onFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      manifestCode: values.manifestCode.trim(),
      originHubCode: values.originHubCode,
      destinationHubCode: values.destinationHubCode,
      shipmentCodes: values.shipmentCodesText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
    form.reset();
  });

  return (
    <form onSubmit={onFormSubmit} style={styles.form}>
      <h3 style={styles.title}>Tạo manifest</h3>
      <input
        placeholder="Mã manifest"
        {...form.register('manifestCode', { required: true })}
      />
      <input placeholder="Mã hub đi" {...form.register('originHubCode')} />
      <input placeholder="Mã hub đến" {...form.register('destinationHubCode')} />
      <textarea
        rows={3}
        placeholder="Mã vận đơn (phân tách bằng dấu phẩy)"
        {...form.register('shipmentCodesText')}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang tạo...' : 'Tạo manifest'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'grid',
    gap: 8,
    marginTop: 12,
    maxWidth: 620,
  },
  title: {
    margin: 0,
  },
};
