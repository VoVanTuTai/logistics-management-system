import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DeliverySuccessForm } from '../../features/delivery/DeliverySuccessForm';
import { mapDeliverySuccessFormToPayload } from '../../features/delivery/delivery-success.mapper';
import { useDeliverySuccessActionMutation } from '../../features/delivery/delivery-success.mutation';
import { enqueueDeliverySuccessOffline } from '../../features/delivery/delivery-success.offline';
import {
  deliverySuccessFormSchema,
  type DeliverySuccessMutationResult,
  type DeliverySuccessSubmitState,
  type DeliverySuccessFormValues,
} from '../../features/delivery/delivery-success.types';
import type { DeliverySuccessPayload } from '../../features/delivery/delivery.types';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliverySuccess'>;

export function DeliverySuccessScreen({
  route,
}: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const mutation = useDeliverySuccessActionMutation(
    session?.tokens.accessToken ?? null,
  );
  const [submitState, setSubmitState] =
    React.useState<DeliverySuccessSubmitState>('IDLE');
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);
  const [lastPayload, setLastPayload] =
    React.useState<DeliverySuccessPayload | null>(null);
  const [lastResult, setLastResult] =
    React.useState<DeliverySuccessMutationResult | null>(null);
  const { control, handleSubmit, setValue } = useForm<DeliverySuccessFormValues>({
    resolver: zodResolver(deliverySuccessFormSchema),
    defaultValues: {
      shipmentCode: route.params.shipmentCode ?? '',
      locationCode: '',
      podImageUrl: '',
      podNote: '',
      otpCode: '',
      note: '',
      idempotencyKey: '',
    },
  });

  const executeSubmit = async (payload: DeliverySuccessPayload) => {
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
        setSubmitMessage('Submit delivery success thanh cong.');
      }
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueDeliverySuccessOffline(payload);
        setSubmitState('SUCCESS');
        setSubmitMessage('Mat mang: action duoc enqueue va se retry sau.');
        return;
      }

      setSubmitState('FAILED');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Delivery success failed.',
      );
      setGlobalError(
        error instanceof Error ? error.message : 'Delivery success failed.',
      );
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const resolvedIdempotencyKey =
      values.idempotencyKey.trim().length > 0
        ? values.idempotencyKey.trim()
        : createIdempotencyKey('delivery-success');

    setValue('idempotencyKey', resolvedIdempotencyKey, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const payload = mapDeliverySuccessFormToPayload(values, {
      taskId: route.params.taskId,
      actor: session?.user.username ?? null,
      occurredAt: new Date().toISOString(),
      idempotencyKey: resolvedIdempotencyKey,
    });

    await executeSubmit(payload);
  });

  const handleGenerateIdempotencyKey = () => {
    setValue('idempotencyKey', createIdempotencyKey('delivery-success'), {
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
      <Text style={styles.title}>Delivery success</Text>
      <Text style={styles.helperText}>
        Chuan bi payload va hien thi response server. Khong xu ly
        `pod.captured`, `otp.verified`, `delivery.delivered` o client.
      </Text>
      <Text style={styles.helperText}>
        TODO: ket noi media stack de upload anh POD that, hien tai chi dung
        `podImageUrl` placeholder.
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
            POD record: {lastResult.result.pod ? 'AVAILABLE' : 'N/A'}
          </Text>
          <Text style={styles.resultText}>
            OTP record: {lastResult.result.otpRecord ? 'AVAILABLE' : 'N/A'}
          </Text>
        </View>
      ) : null}

      <DeliverySuccessForm
        control={control}
        submitting={submitState === 'SUBMITTING'}
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
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  resultTitle: {
    color: '#166534',
    fontWeight: '700',
    marginBottom: 6,
  },
  resultText: {
    color: '#166534',
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
