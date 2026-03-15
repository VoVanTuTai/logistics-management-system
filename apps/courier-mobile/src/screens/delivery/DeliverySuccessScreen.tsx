import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDeliverySuccessMutation } from '../../features/delivery/delivery.api';
import {
  deliverySuccessSchema,
  type DeliverySuccessFormValues,
} from '../../features/delivery/delivery.types';
import { createDeliverySuccessOfflineJob } from '../../features/offline/offline.facade';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { enqueueOfflineJob } from '../../offline/queue.storage';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliverySuccess'>;

export function DeliverySuccessScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const mutation = useDeliverySuccessMutation(
    session?.tokens.accessToken ?? null,
  );
  const { control, handleSubmit } = useForm<DeliverySuccessFormValues>({
    resolver: zodResolver(deliverySuccessSchema),
    defaultValues: {
      shipmentCode: route.params.shipmentCode ?? '',
      locationCode: '',
      podImageUrl: '',
      podNote: '',
      otpCode: '',
      note: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      shipmentCode: values.shipmentCode,
      taskId: route.params.taskId ?? null,
      courierId: null,
      locationCode: values.locationCode || null,
      actor: session?.user.username ?? null,
      note: values.note || null,
      occurredAt: new Date().toISOString(),
      idempotencyKey: createIdempotencyKey('delivery-success'),
      podImageUrl: values.podImageUrl || null,
      podNote: values.podNote || null,
      podCapturedBy: session?.user.username ?? null,
      otpCode: values.otpCode || null,
    };

    try {
      await mutation.mutateAsync(payload);
      navigation.goBack();
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueOfflineJob(createDeliverySuccessOfflineJob(payload));
        navigation.goBack();
        return;
      }

      setGlobalError(
        error instanceof Error ? error.message : 'Delivery success failed.',
      );
    }
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Delivery success</Text>
      <Text style={styles.helperText}>
        TODO: POD upload contract chua ro. Hien tai app chi gui `podImageUrl`
        placeholder qua gateway.
      </Text>

      <Controller
        control={control}
        name="shipmentCode"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Shipment code</Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="SHP123"
            />
            {fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="locationCode"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Location code</Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="HCM-HUB-01"
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="otpCode"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>OTP code</Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="123456"
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="podImageUrl"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>POD image URL</Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="https://..."
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="podNote"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>POD note</Text>
            <TextInput
              multiline
              value={field.value}
              onChangeText={field.onChange}
              style={[styles.input, styles.multilineInput]}
              placeholder="Receiver note"
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="note"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Internal note</Text>
            <TextInput
              multiline
              value={field.value}
              onChangeText={field.onChange}
              style={[styles.input, styles.multilineInput]}
              placeholder="Optional note"
            />
          </View>
        )}
      />

      <Pressable
        disabled={mutation.isPending}
        onPress={onSubmit}
        style={styles.primaryButton}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Confirm delivery success</Text>
        )}
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
    marginBottom: 20,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 6,
    color: '#b91c1c',
  },
});
