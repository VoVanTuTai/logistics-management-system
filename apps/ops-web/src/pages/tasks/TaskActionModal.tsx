import React from 'react';
import { useForm } from 'react-hook-form';

import type { AssignTaskInput, ReassignTaskInput } from '../../features/tasks/tasks.types';

interface TaskActionModalProps {
  taskId: string;
  mode: 'assign' | 'reassign';
  isOpen: boolean;
  isSubmitting: boolean;
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
  onClose,
  onSubmit,
}: TaskActionModalProps): React.JSX.Element | null {
  const form = useForm<TaskActionFormValues>({
    defaultValues: {
      courierId: '',
      note: '',
    },
  });

  if (!isOpen) {
    return null;
  }

  const actionTitle = mode === 'assign' ? 'Assign task' : 'Reassign task';

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
          <label htmlFor={`${mode}-courier`}>Courier ID</label>
          <input
            id={`${mode}-courier`}
            placeholder="Courier ID"
            {...form.register('courierId', { required: true })}
          />
          <label htmlFor={`${mode}-note`}>Note</label>
          <textarea
            id={`${mode}-note`}
            rows={3}
            placeholder="Optional note"
            {...form.register('note')}
          />
          <div style={styles.actions}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : actionTitle}
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
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
};

