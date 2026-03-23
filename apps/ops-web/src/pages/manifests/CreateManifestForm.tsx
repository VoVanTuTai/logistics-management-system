import React from 'react';
import { useForm } from 'react-hook-form';

import type { HubDto } from '../../features/masterdata/masterdata.types';
import type { GenerateBagCodesInput } from '../../features/manifests/manifests.types';

interface CreateManifestFormProps {
  isSubmitting: boolean;
  originHubCode: string;
  destinationHubOptions: HubDto[];
  onSubmit: (payload: GenerateBagCodesInput) => Promise<void>;
}

interface CreateBagFormValues {
  destinationHubCode: string;
  quantity: number;
}

export function CreateManifestForm({
  isSubmitting,
  originHubCode,
  destinationHubOptions,
  onSubmit,
}: CreateManifestFormProps): React.JSX.Element {
  const form = useForm<CreateBagFormValues>({
    defaultValues: {
      destinationHubCode: '',
      quantity: 1,
    },
  });

  const onFormSubmit = form.handleSubmit(async (values) => {
    const quantity = Math.max(1, Math.min(200, Number(values.quantity) || 1));
    await onSubmit({
      originHubCode: originHubCode || null,
      destinationHubCode: values.destinationHubCode,
      quantity,
      note: 'EMPTY_BAG',
    });
    form.reset({
      destinationHubCode: '',
      quantity: 1,
    });
  });

  const destinationLabel = (hub: HubDto): string =>
    `${hub.code} - ${hub.name}${hub.zoneCode ? ` (${hub.zoneCode})` : ''}`;

  return (
    <form onSubmit={onFormSubmit} style={styles.form}>
      <h3 style={styles.title}>Tạo mã bao tải</h3>

      <label style={styles.field}>
        <span style={styles.label}>Hub nguồn (bao xuất phát)</span>
        <input value={originHubCode || 'Chưa gán hub'} disabled />
      </label>

      <label style={styles.field}>
        <span style={styles.label}>Hub đích</span>
        <select
          {...form.register('destinationHubCode', { required: true })}
          disabled={isSubmitting || destinationHubOptions.length === 0}
        >
          <option value="">Chọn hub đích</option>
          {destinationHubOptions.map((hub) => (
            <option key={hub.id} value={hub.code}>
              {destinationLabel(hub)}
            </option>
          ))}
        </select>
      </label>

      <label style={styles.field}>
        <span style={styles.label}>Số lượng mã bao cần tạo</span>
        <input
          type="number"
          min={1}
          max={200}
          {...form.register('quantity', { valueAsNumber: true, min: 1, max: 200 })}
        />
      </label>

      <button type="submit" disabled={isSubmitting || !originHubCode}>
        {isSubmitting ? 'Đang tạo mã bao...' : 'Tạo mã bao'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'grid',
    gap: 10,
    marginTop: 12,
    maxWidth: 760,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
  },
  title: {
    margin: 0,
  },
  field: {
    display: 'grid',
    gap: 6,
  },
  label: {
    color: '#1f2b6f',
    fontWeight: 600,
  },
};
