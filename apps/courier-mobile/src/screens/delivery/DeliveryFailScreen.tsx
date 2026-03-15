import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDeliveryFailMutation } from '../../features/delivery/delivery.api';
import {
  deliveryFailSchema,
  type DeliveryFailFormValues,
} from '../../features/delivery/delivery.types';
import { createDeliveryFailOfflineJob } from '../../features/offline/offline.facade';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { enqueueOfflineJob } from '../../offline/queue.storage';
import { shouldQueueOffline } from '../../services/api/client';
import { useAppStore } from '../../store/appStore';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<RootStackParamList, 'DeliveryFail'>;

export function DeliveryFailScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const mutation = useDeliveryFailMutation(session?.tokens.accessToken ?? null);
  const { control, handleSubmit } = useForm<DeliveryFailFormValues>({
    resolver: zodResolver(deliveryFailSchema),
    defaultValues: {
      shipmentCode: route.params.shipmentCode ?? '',
      locationCode: '',
      failReasonCode: '',
      note: '',
      createNdr: true,
      startReturn: false,
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
      idempotencyKey: createIdempotencyKey('delivery-fail'),
      failReasonCode: values.failReasonCode || null,
      createNdr: values.createNdr,
      startReturn: values.startReturn,
    };

    try {
      await mutation.mutateAsync(payload);
      navigation.goBack();
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueOfflineJob(createDeliveryFailOfflineJob(payload));
        navigation.goBack();
        return;
      }

      setGlobalError(
        error instanceof Error ? error.message : 'Delivery fail failed.',
      );
    }
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Delivery fail / NDR</Text>
      <Text style={styles.helperText}>
        `createNdr` va `startReturn` chi la command flag gui len server, app
        khong tu orchestration workflow.
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
        name="failReasonCode"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Fail reason code</Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="CUSTOMER_UNREACHABLE"
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
              placeholder="Failure note"
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="createNdr"
        render={({ field }) => (
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Create NDR</Text>
              <Text style={styles.switchHint}>
                Bat de server tao NDR case neu contract ho tro.
              </Text>
            </View>
            <Switch value={field.value} onValueChange={field.onChange} />
          </View>
        )}
      />

      <Controller
        control={control}
        name="startReturn"
        render={({ field }) => (
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Start return</Text>
              <Text style={styles.switchHint}>
                TODO: xac nhan contract `startReturn` voi BFF/backend.
              </Text>
            </View>
            <Switch value={field.value} onValueChange={field.onChange} />
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
          <Text style={styles.primaryButtonText}>Submit delivery failure</Text>
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
    color: '#334155',
    fontWeight: '600',
    marginBottom: 4,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  switchHint: {
    color: '#64748b',
    maxWidth: 240,
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
