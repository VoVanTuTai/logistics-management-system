import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { RescheduleInput, ReturnDecisionInput } from '../../features/ndr/ndr.types';
import {
  type NdrActionMode,
  type RescheduleNdrFormValues,
  type ReturnDecisionFormValues,
  rescheduleNdrSchema,
  returnDecisionSchema,
} from './NdrActionForm.schema';

interface NdrNextActionFormProps {
  mode: NdrActionMode;
  isSubmitting: boolean;
  onReschedule: (payload: RescheduleInput) => Promise<void>;
  onReturnDecision: (payload: ReturnDecisionInput) => Promise<void>;
}

export function NdrNextActionForm({
  mode,
  isSubmitting,
  onReschedule,
  onReturnDecision,
}: NdrNextActionFormProps): React.JSX.Element {
  const rescheduleForm = useForm<RescheduleNdrFormValues>({
    resolver: zodResolver(rescheduleNdrSchema),
    defaultValues: {
      nextDeliveryAt: '',
      note: '',
    },
  });
  const returnForm = useForm<ReturnDecisionFormValues>({
    resolver: zodResolver(returnDecisionSchema),
    defaultValues: {
      returnToSender: true,
      note: '',
    },
  });

  const onSubmitReschedule = rescheduleForm.handleSubmit(async (values) => {
    await onReschedule({
      nextDeliveryAt: values.nextDeliveryAt,
      note: values.note || null,
    });
    rescheduleForm.reset();
  });

  const onSubmitReturn = returnForm.handleSubmit(async (values) => {
    await onReturnDecision({
      returnToSender: values.returnToSender,
      note: values.note || null,
    });
    returnForm.reset({
      returnToSender: values.returnToSender,
      note: '',
    });
  });

  if (mode === 'RESCHEDULE') {
    return (
      <form onSubmit={onSubmitReschedule} style={styles.form}>
        <h3 style={styles.title}>Reschedule action</h3>
        <input type="datetime-local" {...rescheduleForm.register('nextDeliveryAt')} />
        {rescheduleForm.formState.errors.nextDeliveryAt ? (
          <small style={styles.errorText}>
            {rescheduleForm.formState.errors.nextDeliveryAt.message}
          </small>
        ) : null}
        <textarea rows={3} placeholder="Note" {...rescheduleForm.register('note')} />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit reschedule'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitReturn} style={styles.form}>
      <h3 style={styles.title}>Return action</h3>
      <label style={styles.checkbox}>
        <input type="checkbox" {...returnForm.register('returnToSender')} />
        Return to sender
      </label>
      <textarea rows={3} placeholder="Note" {...returnForm.register('note')} />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit return decision'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'grid',
    gap: 8,
    marginTop: 12,
    maxWidth: 520,
  },
  title: {
    margin: 0,
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#b91c1c',
  },
};
