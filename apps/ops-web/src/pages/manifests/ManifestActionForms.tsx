import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import type {
  AddShipmentInput,
  ReceiveHandoverInput,
  RemoveShipmentInput,
  SealManifestInput,
} from '../../features/manifests/manifests.types';

interface ManifestActionFormsProps {
  manifestCode: string;
  onAddShipment: (payload: AddShipmentInput) => Promise<void>;
  onRemoveShipment: (payload: RemoveShipmentInput) => Promise<void>;
  onSealManifest: (payload: SealManifestInput) => Promise<void>;
  onReceiveHandover: (payload: ReceiveHandoverInput) => Promise<void>;
  isAddingShipment: boolean;
  isRemovingShipment: boolean;
  isSealingManifest: boolean;
  isReceivingHandover: boolean;
}

interface ShipmentActionFormValues {
  shipmentCode: string;
  note: string;
}

interface SealFormValues {
  sealCode: string;
  note: string;
}

interface ReceiveFormValues {
  manifestCode: string;
  receiverName: string;
  note: string;
}

export function ManifestActionForms({
  manifestCode,
  onAddShipment,
  onRemoveShipment,
  onSealManifest,
  onReceiveHandover,
  isAddingShipment,
  isRemovingShipment,
  isSealingManifest,
  isReceivingHandover,
}: ManifestActionFormsProps): React.JSX.Element {
  const addShipmentForm = useForm<ShipmentActionFormValues>({
    defaultValues: {
      shipmentCode: '',
      note: '',
    },
  });
  const removeShipmentForm = useForm<ShipmentActionFormValues>({
    defaultValues: {
      shipmentCode: '',
      note: '',
    },
  });
  const sealForm = useForm<SealFormValues>({
    defaultValues: {
      sealCode: '',
      note: '',
    },
  });
  const receiveForm = useForm<ReceiveFormValues>({
    defaultValues: {
      manifestCode,
      receiverName: '',
      note: '',
    },
  });

  useEffect(() => {
    receiveForm.setValue('manifestCode', manifestCode);
  }, [manifestCode, receiveForm]);

  const onAddShipmentSubmit = addShipmentForm.handleSubmit(async (values) => {
    await onAddShipment({
      shipmentCode: values.shipmentCode,
      note: values.note || null,
    });
    addShipmentForm.reset();
  });

  const onRemoveShipmentSubmit = removeShipmentForm.handleSubmit(async (values) => {
    await onRemoveShipment({
      shipmentCode: values.shipmentCode,
      note: values.note || null,
    });
    removeShipmentForm.reset();
  });

  const onSealSubmit = sealForm.handleSubmit(async (values) => {
    await onSealManifest({
      sealCode: values.sealCode,
      note: values.note || null,
    });
    sealForm.reset();
  });

  const onReceiveSubmit = receiveForm.handleSubmit(async (values) => {
    await onReceiveHandover({
      manifestCode: values.manifestCode,
      receiverName: values.receiverName,
      note: values.note || null,
    });
    receiveForm.reset({
      manifestCode,
      receiverName: '',
      note: '',
    });
  });

  return (
    <section style={styles.wrapper}>
      <form onSubmit={onAddShipmentSubmit} style={styles.form}>
        <h3 style={styles.title}>Khung thêm vận đơn</h3>
        <input placeholder="Mã vận đơn" {...addShipmentForm.register('shipmentCode')} />
        <textarea rows={3} placeholder="Ghi chú (không bắt buộc)" {...addShipmentForm.register('note')} />
        <button type="submit" disabled={isAddingShipment}>
          {isAddingShipment ? 'Đang gửi...' : 'Thêm vận đơn'}
        </button>
      </form>

      <form onSubmit={onRemoveShipmentSubmit} style={styles.form}>
        <h3 style={styles.title}>Khung gỡ vận đơn</h3>
        <input placeholder="Mã vận đơn" {...removeShipmentForm.register('shipmentCode')} />
        <textarea
          rows={3}
          placeholder="Ghi chú (không bắt buộc)"
          {...removeShipmentForm.register('note')}
        />
        <button type="submit" disabled={isRemovingShipment}>
          {isRemovingShipment ? 'Đang gửi...' : 'Gỡ vận đơn'}
        </button>
      </form>

      <form onSubmit={onSealSubmit} style={styles.form}>
        <h3 style={styles.title}>Khung thao tác niêm phong</h3>
        <input placeholder="Mã niêm phong" {...sealForm.register('sealCode')} />
        <textarea rows={3} placeholder="Ghi chú (không bắt buộc)" {...sealForm.register('note')} />
        <button type="submit" disabled={isSealingManifest}>
          {isSealingManifest ? 'Đang gửi...' : 'Niêm phong bao tải'}
        </button>
      </form>

      <form onSubmit={onReceiveSubmit} style={styles.form}>
        <h3 style={styles.title}>Khung thao tác nhận bàn giao</h3>
        <input placeholder="Mã bao tải" {...receiveForm.register('manifestCode')} />
        <input placeholder="Tên người nhận" {...receiveForm.register('receiverName')} />
        <textarea rows={3} placeholder="Ghi chú (không bắt buộc)" {...receiveForm.register('note')} />
        <button type="submit" disabled={isReceivingHandover}>
          {isReceivingHandover ? 'Đang gửi...' : 'Nhận bàn giao'}
        </button>
      </form>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12,
    marginTop: 16,
    maxWidth: 980,
  },
  form: {
    display: 'grid',
    gap: 8,
    padding: 12,
    border: '1px solid #d9def3',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    margin: 0,
  },
};
