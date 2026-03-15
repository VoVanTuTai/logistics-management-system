import React from 'react';
import {
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

import {
  pickupScanSchema,
  type PickupScanFormValues,
} from '../../features/scan/scan.types';
import { useRecordPickupScanMutation } from '../../features/scan/scan.api';
import { createPickupScanOfflineJob } from '../../features/offline/offline.facade';
import { enqueueOfflineJob } from '../../offline/queue.storage';
import { useAppStore } from '../../store/appStore';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { shouldQueueOffline } from '../../services/api/client';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<RootStackParamList, 'PickupScan'>;

export function PickupScanScreen({ route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const mutation = useRecordPickupScanMutation(
    session?.tokens.accessToken ?? null,
  );
  const { control, handleSubmit } = useForm<PickupScanFormValues>({
    resolver: zodResolver(pickupScanSchema),
    defaultValues: {
      shipmentCode: route.params.shipmentCode ?? '',
      locationCode: '',
      note: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      shipmentCode: values.shipmentCode,
      locationCode: values.locationCode || null,
      note: values.note || null,
      actor: session?.user.username ?? null,
      occurredAt: new Date().toISOString(),
      idempotencyKey: createIdempotencyKey('pickup-scan'),
    };

    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueOfflineJob(createPickupScanOfflineJob(payload));
        return;
      }

      setGlobalError(
        error instanceof Error ? error.message : 'Pickup scan failed.',
      );
    }
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pickup scan</Text>
      <Text style={styles.helperText}>
        Offline queue chi retry command da co idempotencyKey.
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
        name="note"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Note</Text>
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

      <Pressable onPress={onSubmit} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Submit pickup scan</Text>
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
