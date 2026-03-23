import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DeliveryFailForm } from '../../features/delivery/DeliveryFailForm';
import { useDeliveryFailActionMutation } from '../../features/delivery/delivery-fail.mutation';
import { enqueueDeliveryFailOffline } from '../../features/delivery/delivery-fail.offline';
import {
  deliveryFailFormSchema,
  type DeliveryFailMutationResult,
  type DeliveryFailNextAction,
  type DeliveryFailSubmitState,
  type DeliveryFailFormValues,
} from '../../features/delivery/delivery-fail.types';
import type { DeliveryFailPayload } from '../../features/delivery/delivery.types';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveryFail'>;

export function DeliveryFailScreen({
  route,
}: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const mutation = useDeliveryFailActionMutation(
    session?.tokens.accessToken ?? null,
  );
  const [submitState, setSubmitState] =
    React.useState<DeliveryFailSubmitState>('IDLE');
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const [selectedNextAction, setSelectedNextAction] =
    React.useState<DeliveryFailNextAction>('CREATE_NDR');
  const [lastPayload, setLastPayload] =
    React.useState<DeliveryFailPayload | null>(null);
  const [lastResult, setLastResult] =
    React.useState<DeliveryFailMutationResult | null>(null);
  const { control, handleSubmit, setValue } = useForm<DeliveryFailFormValues>({
    resolver: zodResolver(deliveryFailFormSchema),
    defaultValues: {
      shipmentCode: route.params.shipmentCode ?? '',
      locationCode: '',
      reasonCode: '',
      nextAction: 'CREATE_NDR',
      note: '',
      idempotencyKey: '',
    },
  });

  const executeSubmit = async (payload: DeliveryFailPayload) => {
    setSubmitState('SUBMITTING');
    setSubmitMessage(null);
    setLastPayload(payload);
    setLastResult(null);

    try {
      const result = await mutation.mutateAsync(payload);
      setLastResult(result);
      setSubmitState('SUCCESS');

      if (result.source === 'DUPLICATE_REPLAY') {
        setSubmitMessage(
          'Server da tra lai ket qua cu cho idempotencyKey trung lap.',
        );
      } else {
        setSubmitMessage('Submit delivery fail thanh cong.');
      }
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueDeliveryFailOffline(payload);
        setSubmitState('SUCCESS');
        setSubmitMessage('Mat mang: action duoc enqueue va se retry sau.');
        return;
      }

      setSubmitState('FAILED');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Delivery fail failed.',
      );
      setGlobalError(error instanceof Error ? error.message : 'Delivery fail failed.');
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const resolvedIdempotencyKey =
      values.idempotencyKey.trim().length > 0
        ? values.idempotencyKey.trim()
        : createIdempotencyKey('delivery-fail');

    setValue('idempotencyKey', resolvedIdempotencyKey, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const payload: DeliveryFailPayload = {
      shipmentCode: values.shipmentCode,
      taskId: route.params.taskId ?? null,
      courierId: null,
      locationCode: values.locationCode || null,
      actor: session?.user.username ?? null,
      note: values.note || null,
      occurredAt: new Date().toISOString(),
      idempotencyKey: resolvedIdempotencyKey,
      failReasonCode: values.reasonCode,
      createNdr: values.nextAction === 'CREATE_NDR',
      startReturn: values.nextAction === 'START_RETURN',
    };

    await executeSubmit(payload);
  });

  const handleSelectNextAction = (nextAction: DeliveryFailNextAction) => {
    setSelectedNextAction(nextAction);
    setValue('nextAction', nextAction, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleGenerateIdempotencyKey = () => {
    setValue('idempotencyKey', createIdempotencyKey('delivery-fail'), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleRetryLastSubmit = async () => {
    if (!lastPayload) {
      return;
    }

    await executeSubmit(lastPayload);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Delivery fail / NDR</Text>
      <Text style={styles.helperText}>
        Chi gui payload theo reasonCode va nextAction nguoi dung chon. App khong
        tu suy dien luong reschedule/return.
      </Text>
      <Text style={styles.helperText}>
        Không xử lý event `ndr.created` hoac `return.started` o client.
      </Text>

      {submitMessage ? (
        <Text
          style={submitState === 'FAILED' ? styles.errorText : styles.successText}
        >
          {submitMessage}
        </Text>
      ) : null}

      {lastResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            Server response ({lastResult.source})
          </Text>
          <Text style={styles.resultText}>
            Attempt: {lastResult.result.deliveryAttempt.id}
          </Text>
          <Text style={styles.resultText}>
            Status: {lastResult.result.deliveryAttempt.status}
          </Text>
          <Text style={styles.resultText}>
            NDR case: {lastResult.result.ndrCase ? 'AVAILABLE' : 'N/A'}
          </Text>
          <Text style={styles.resultText}>
            Return case: {lastResult.result.returnCase ? 'AVAILABLE' : 'N/A'}
          </Text>
        </View>
      ) : null}

      <DeliveryFailForm
        control={control}
        selectedNextAction={selectedNextAction}
        submitting={submitState === 'SUBMITTING'}
        onSelectNextAction={handleSelectNextAction}
        onGenerateIdempotencyKey={handleGenerateIdempotencyKey}
        onSubmit={() => {
          void onSubmit();
        }}
      />

      <Pressable
        disabled={submitState === 'SUBMITTING' || !lastPayload}
        onPress={() => {
          void handleRetryLastSubmit();
        }}
        style={styles.retryButton}
      >
        <Text style={styles.retryButtonText}>Retry last submit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  helperText: {
    color: '#64748b',
    marginBottom: 8,
  },
  successText: {
    marginTop: 8,
    marginBottom: 12,
    color: '#0f766e',
  },
  resultCard: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  resultTitle: {
    color: '#991b1b',
    fontWeight: '700',
    marginBottom: 6,
  },
  resultText: {
    color: '#991b1b',
    marginBottom: 4,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 8,
    marginBottom: 12,
    color: '#b91c1c',
  },
});
