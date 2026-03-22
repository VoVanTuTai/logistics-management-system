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
import type { BarcodeScanningResult } from 'expo-camera';

import {
  pickupScanFormSchema,
  type PickupScanCommand,
  type PickupScanFormValues,
  type PickupScanMutationResult,
} from '../../features/scan/pickup.types';
import { usePickupScanMutation } from '../../features/scan/pickup.mutation';
import { enqueuePickupScanOffline } from '../../features/scan/pickup.offline';
import { parsePickupScannedCode } from '../../features/scan/pickup.scanner.adapter';
import { useAppStore } from '../../store/appStore';
import type { AppNavigatorParamList } from '../../navigation/types';
import { shouldQueueOffline } from '../../services/api/client';
import { createIdempotencyKey } from '../../utils/idempotency';
import { CameraScannerModal } from '../../components/scan/CameraScannerModal';

type Props = NativeStackScreenProps<AppNavigatorParamList, 'PickupScan'>;

export function PickupScanScreen({ route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const mutation = usePickupScanMutation(session?.tokens.accessToken ?? null);
  const [lastCommand, setLastCommand] = React.useState<PickupScanCommand | null>(
    null,
  );
  const [scannerError, setScannerError] = React.useState<string | null>(null);
  const [isScannerVisible, setScannerVisible] = React.useState(false);
  const [localInfoMessage, setLocalInfoMessage] = React.useState<string | null>(
    null,
  );
  const [lastServerResult, setLastServerResult] =
    React.useState<PickupScanMutationResult | null>(null);
  const { control, handleSubmit, setValue } = useForm<PickupScanFormValues>({
    resolver: zodResolver(pickupScanFormSchema),
    defaultValues: {
      shipmentCode: route.params.shipmentCode ?? '',
      locationCode: '',
      note: '',
      idempotencyKey: '',
    },
  });

  const executeSubmit = async (command: PickupScanCommand) => {
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
        setLocalInfoMessage('Pickup scan submit thanh cong.');
      }
    } catch (error) {
      if (shouldQueueOffline(error)) {
        await enqueuePickupScanOffline(command);
        setLocalInfoMessage('Mat mang: action duoc enqueue va se retry sau.');
        return;
      }

      setGlobalError(
        error instanceof Error ? error.message : 'Pickup scan failed.',
      );
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const resolvedIdempotencyKey =
      values.idempotencyKey.trim().length > 0
        ? values.idempotencyKey.trim()
        : createIdempotencyKey('pickup-scan');

    setValue('idempotencyKey', resolvedIdempotencyKey, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const command: PickupScanCommand = {
      shipmentCode: values.shipmentCode,
      locationCode: values.locationCode || null,
      note: values.note || null,
      actor: session?.user.username ?? null,
      occurredAt: new Date().toISOString(),
      idempotencyKey: resolvedIdempotencyKey,
    };

    await executeSubmit(command);
  });

  const handleGenerateIdempotencyKey = () => {
    setValue('idempotencyKey', createIdempotencyKey('pickup-scan'), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleScanQrOrBarcode = () => {
    setScannerError(null);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    const parsed = parsePickupScannedCode({
      data: result.data,
      type: result.type,
    });

    if (!parsed) {
      setScannerError('Không đọc được mã hợp lệ. Vui lòng thử lại.');
      return;
    }

    setValue('shipmentCode', parsed.value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setLocalInfoMessage(`Đã nhận mã ${parsed.format}: ${parsed.value}`);
    setScannerVisible(false);
  };

  const handleRetryLast = async () => {
    if (!lastCommand) {
      return;
    }

    await executeSubmit(lastCommand);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CameraScannerModal
        visible={isScannerVisible}
        title="Quét mã pickup"
        helperText="Hỗ trợ quét QR và barcode cho shipment code."
        onClose={() => setScannerVisible(false)}
        onScanned={handleBarcodeScanned}
      />

      <Text style={styles.title}>Pickup scan</Text>
      <Text style={styles.helperText}>
        Scanner adapter duoc truu tuong hoa. Co the nhap tay shipment code va
        idempotencyKey khi can.
      </Text>

      <Pressable onPress={handleScanQrOrBarcode} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Scan QR / Barcode</Text>
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
            Shipment: {lastServerResult.result.scanEvent.shipmentCode}
          </Text>
          <Text style={styles.resultText}>
            Scan event: {lastServerResult.result.scanEvent.id}
          </Text>
          <Text style={styles.resultText}>
            Current location updatedAt:{' '}
            {lastServerResult.result.currentLocation.updatedAt}
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

      <Pressable
        disabled={mutation.isPending}
        onPress={onSubmit}
        style={styles.primaryButton}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit pickup scan</Text>
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
    borderColor: '#99f6e4',
    backgroundColor: '#f0fdfa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  resultTitle: {
    color: '#115e59',
    fontWeight: '700',
    marginBottom: 6,
  },
  resultText: {
    color: '#134e4a',
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


