import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import type {
  AssignTaskInput,
  CourierOptionDto,
  ReassignTaskInput,
} from '../../features/tasks/tasks.types';

interface TaskActionModalProps {
  taskId: string;
  mode: 'assign' | 'reassign';
  isOpen: boolean;
  isSubmitting: boolean;
  courierOptions: CourierOptionDto[];
  courierOptionsLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: AssignTaskInput | ReassignTaskInput) => Promise<void>;
}

type TaskActionFormValues = {
  courierId: string;
  note: string;
};

export function TaskActionModal({
  taskId,
  mode,
  isOpen,
  isSubmitting,
  courierOptions,
  courierOptionsLoading,
  onClose,
  onSubmit,
}: TaskActionModalProps): React.JSX.Element | null {
  const form = useForm<TaskActionFormValues>({
    defaultValues: {
      courierId: '',
      note: '',
    },
  });

  useEffect(() => {
    if (!isOpen || courierOptions.length === 0) {
      return;
    }

    const currentCourierId = form.getValues('courierId')?.trim() ?? '';
    if (!currentCourierId) {
      form.setValue('courierId', courierOptions[0].courierId, {
        shouldValidate: true,
      });
    }
  }, [courierOptions, form, isOpen]);

  if (!isOpen) {
    return null;
  }

  const actionTitle = mode === 'assign' ? 'Phan cong tac vu' : 'Phan cong lai tac vu';

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      taskId,
      courierId: values.courierId,
      note: values.note || null,
    });
    form.reset();
    onClose();
  });

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <h3 style={styles.title}>{actionTitle}</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor={`${mode}-courier`}>Nhan vien giao</label>

          {courierOptionsLoading ? (
            <p style={styles.helperText}>Dang tai danh sach nhan vien giao...</p>
          ) : courierOptions.length > 0 ? (
            <select
              id={`${mode}-courier`}
              {...form.register('courierId', { required: true })}
            >
              {courierOptions.map((option) => (
                <option key={option.courierId} value={option.courierId}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                id={`${mode}-courier`}
                placeholder="Nhap ma nhan vien giao"
                {...form.register('courierId', { required: true })}
              />
              <small style={styles.helperText}>
                Chua co danh sach nhan vien giao. Vui long nhap ma thu cong.
              </small>
            </>
          )}

          <label htmlFor={`${mode}-note`}>Ghi chu</label>
          <textarea
            id={`${mode}-note`}
            rows={3}
            placeholder="Ghi chu (khong bat buoc)"
            {...form.register('note')}
          />
          <div style={styles.actions}>
            <button type="button" onClick={onClose}>
              Huy
            </button>
            <button type="submit" disabled={isSubmitting || courierOptionsLoading}>
              {isSubmitting ? 'Dang gui...' : actionTitle}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#00000066',
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modal: {
    width: 'min(520px, 100%)',
    borderRadius: 12,
    border: '1px solid #d9def3',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    marginTop: 0,
    marginBottom: 12,
  },
  form: {
    display: 'grid',
    gap: 8,
  },
  helperText: {
    margin: 0,
    color: '#334155',
    fontSize: 13,
  },
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
};
