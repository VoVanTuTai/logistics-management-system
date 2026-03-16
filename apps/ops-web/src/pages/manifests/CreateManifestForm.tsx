import React from 'react';
import { useForm } from 'react-hook-form';

import type { CreateManifestInput } from '../../features/manifests/manifests.types';

interface CreateManifestFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: CreateManifestInput) => Promise<void>;
}

interface CreateManifestFormValues {
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
      originHubCode: '',
      destinationHubCode: '',
      shipmentCodesText: '',
    },
  });

  const onFormSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
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
      <h3 style={styles.title}>Create manifest</h3>
      <input placeholder="Origin hub code" {...form.register('originHubCode')} />
      <input placeholder="Destination hub code" {...form.register('destinationHubCode')} />
      <textarea
        rows={3}
        placeholder="Shipment codes (comma separated)"
        {...form.register('shipmentCodesText')}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create manifest'}
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

