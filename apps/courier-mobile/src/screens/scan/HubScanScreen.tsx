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

import {
  hubScanFormSchema,
  type HubScanCommand,
  type HubScanMode,
  type HubScanFormValues,
  type HubScanMutationResult,
} from '../../features/scan/hub.types';
import { useHubScanMutation } from '../../features/scan/hub.mutation';
import { enqueueHubScanOffline } from '../../features/scan/hub.offline';
import { getHubScannerAdapter } from '../../features/scan/hub.scanner.adapter';
import { useAppStore } from '../../store/appStore';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { shouldQueueOffline } from '../../services/api/client';
import { createIdempotencyKey } from '../../utils/idempotency';

type Props = NativeStackScreenProps<RootStackParamList, 'HubScan'>;

const HUB_SCAN_MODE_OPTIONS: Array<{ value: HubScanMode; label: string }> = [
  { value: 'INBOUND', label: 'Inbound' },
  { value: 'OUTBOUND', label: 'Outbound' },
];

export function HubScanScreen({ route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const mutation = useHubScanMutation(session?.tokens.accessToken ?? null);
  const [selectedMode, setSelectedMode] = React.useState<HubScanMode>(
    route.params.mode,
  );
  const [lastCommand, setLastCommand] = React.useState<HubScanCommand | null>(
    null,
  );
  const [scannerError, setScannerError] = React.useState<string | null>(null);
  const [localInfoMessage, setLocalInfoMessage] = React.useState<string | null>(
    null,
  );
  const [lastServerResult, setLastServerResult] =
    React.useState<HubScanMutationResult | null>(null);
  const { control, handleSubmit, setValue } = useForm<HubScanFormValues>({
    resolver: zodResolver(hubScanFormSchema),
    defaultValues: {
      mode: route.params.mode,
      shipmentCode: route.params.shipmentCode ?? '',
      locationCode: '',
      manifestCode: '',
      note: '',
      idempotencyKey: '',
    },
  });

  const executeSubmit = async (command: HubScanCommand) => {
    setLastCommand(command);
    setLocalInfoMessage(null);
    setLastServerResult(null);

    try {
      const result = await mutation.mutateAsync(command);
      setLastServerResult(result);
      if (result.source === 'DUPLICATE_REPLAY') {
        setLocalInfoMessage(
          'Server da tra lai ket qua cu cho idempotencyKey trung lap.',
        );
      } else {
        setLocalInfoMessage('Hub scan submit thanh cong.');
      }
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueueHubScanOffline(command);
        setLocalInfoMessage('Mat mang: action duoc enqueue va se retry sau.');
        return;
      }

      setGlobalError(error instanceof Error ? error.message : 'Hub scan failed.');
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const resolvedIdempotencyKey =
      values.idempotencyKey.trim().length > 0
        ? values.idempotencyKey.trim()
        : createIdempotencyKey(
            selectedMode === 'INBOUND' ? 'hub-inbound' : 'hub-outbound',
          );

    setValue('idempotencyKey', resolvedIdempotencyKey, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const command: HubScanCommand = {
      mode: selectedMode,
      shipmentCode: values.shipmentCode,
      locationCode: values.locationCode,
      manifestCode: values.manifestCode || null,
      note: values.note || null,
      actor: session?.user.username ?? null,
      occurredAt: new Date().toISOString(),
      idempotencyKey: resolvedIdempotencyKey,
    };

    await executeSubmit(command);
  });

  const handleSelectMode = (mode: HubScanMode) => {
    setSelectedMode(mode);
    setValue('mode', mode, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleGenerateIdempotencyKey = () => {
    setValue(
      'idempotencyKey',
      createIdempotencyKey(selectedMode === 'INBOUND' ? 'hub-inbound' : 'hub-outbound'),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const handleScanShipmentCode = async () => {
    setScannerError(null);

    try {
      const scanResult = await getHubScannerAdapter().scanShipmentCode();
      if (!scanResult) {
        return;
      }

      setValue('shipmentCode', scanResult.value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setLocalInfoMessage(`Da nhan ma ${scanResult.format}: ${scanResult.value}`);
    } catch (error) {
      setScannerError(
        error instanceof Error ? error.message : 'Scanner action failed.',
      );
    }
  };

  const handleRetryLast = async () => {
    if (!lastCommand) {
      return;
    }

    await executeSubmit(lastCommand);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hub scan</Text>
      <Text style={styles.helperText}>
        Chi hien thi ket qua server tra ve. App khong tu suy dien current
        location.
      </Text>

      <View style={styles.modeSelectorRow}>
        {HUB_SCAN_MODE_OPTIONS.map((modeOption) => {
          const active = modeOption.value === selectedMode;

          return (
            <Pressable
              key={modeOption.value}
              onPress={() => handleSelectMode(modeOption.value)}
              style={[styles.modeButton, active && styles.modeButtonActive]}
            >
              <Text
                style={[styles.modeButtonText, active && styles.modeButtonTextActive]}
              >
                {modeOption.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={handleScanShipmentCode} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Scan shipment code</Text>
      </Pressable>

      {scannerError ? <Text style={styles.errorText}>{scannerError}</Text> : null}
      {localInfoMessage ? (
        <Text style={styles.infoText}>{localInfoMessage}</Text>
      ) : null}
      {lastServerResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            Server response ({lastServerResult.source})
          </Text>
          <Text style={styles.resultText}>
            Scan type: {lastServerResult.result.scanEvent.scanType}
          </Text>
          <Text style={styles.resultText}>
            Shipment: {lastServerResult.result.scanEvent.shipmentCode}
          </Text>
          <Text style={styles.resultText}>
            Current location: {lastServerResult.result.currentLocation.locationCode ?? 'N/A'}
          </Text>
          <Text style={styles.resultText}>
            Updated at: {lastServerResult.result.currentLocation.updatedAt}
          </Text>
        </View>
      ) : null}

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

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Idempotency key</Text>
        <Controller
          control={control}
          name="idempotencyKey"
          render={({ field }) => (
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="Neu bo trong se tu sinh key"
            />
          )}
        />
        <Pressable
          onPress={handleGenerateIdempotencyKey}
          style={styles.inlineButton}
        >
          <Text style={styles.inlineButtonText}>Generate idempotency key</Text>
        </Pressable>
      </View>

      <Controller
        control={control}
        name="locationCode"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Location code</Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="HCM-HUB-01"
            />
            {fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="manifestCode"
        render={({ field }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Manifest code</Text>
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="MNF-001"
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

      <Pressable
        disabled={mutation.isPending}
        onPress={onSubmit}
        style={styles.primaryButton}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit hub scan</Text>
        )}
      </Pressable>

      <Pressable
        disabled={mutation.isPending || !lastCommand}
        onPress={handleRetryLast}
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
    marginBottom: 14,
  },
  modeSelectorRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  modeButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  modeButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#ffffff',
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
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  inlineButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  infoText: {
    marginBottom: 12,
    color: '#0f766e',
  },
  resultCard: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  resultTitle: {
    color: '#1e3a8a',
    fontWeight: '700',
    marginBottom: 6,
  },
  resultText: {
    color: '#1e40af',
    marginBottom: 4,
  },
  errorText: {
    marginTop: 6,
    color: '#b91c1c',
  },
  retryButton: {
    marginTop: 10,
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
});
