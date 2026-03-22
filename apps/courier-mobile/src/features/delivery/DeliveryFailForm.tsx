import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { DeliveryFailFormValues, DeliveryFailNextAction } from './delivery-fail.types';

const NEXT_ACTION_OPTIONS: Array<{ label: string; value: DeliveryFailNextAction }> = [
  { label: 'None', value: 'NONE' },
  { label: 'Create NDR', value: 'CREATE_NDR' },
  { label: 'Start Return', value: 'START_RETURN' },
];

interface DeliveryFailFormProps {
  control: Control<DeliveryFailFormValues>;
  selectedNextAction: DeliveryFailNextAction;
  submitting: boolean;
  onSelectNextAction: (nextAction: DeliveryFailNextAction) => void;
  onGenerateIdempotencyKey: () => void;
  onSubmit: () => void;
}

export function DeliveryFailForm({
  control,
  selectedNextAction,
  submitting,
  onSelectNextAction,
  onGenerateIdempotencyKey,
  onSubmit,
}: DeliveryFailFormProps): React.JSX.Element {
  return (
    <View>
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
        name="reasonCode"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Reason code</Text>
            <TextInput
              autoCapitalize="characters"
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="CUSTOMER_UNREACHABLE"
            />
            {fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Next action</Text>
        <View style={styles.nextActionRow}>
          {NEXT_ACTION_OPTIONS.map((nextActionOption) => {
            const active = nextActionOption.value === selectedNextAction;

            return (
              <Pressable
                key={nextActionOption.value}
                onPress={() => onSelectNextAction(nextActionOption.value)}
                style={[styles.nextActionButton, active && styles.nextActionButtonActive]}
              >
                <Text
                  style={[
                    styles.nextActionButtonText,
                    active && styles.nextActionButtonTextActive,
                  ]}
                >
                  {nextActionOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
        <Pressable onPress={onGenerateIdempotencyKey} style={styles.inlineButton}>
          <Text style={styles.inlineButtonText}>Generate idempotency key</Text>
        </Pressable>
      </View>

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

      <Pressable disabled={submitting} onPress={onSubmit} style={styles.primaryButton}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit delivery failure</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  nextActionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  nextActionButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  nextActionButtonActive: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  nextActionButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  nextActionButtonTextActive: {
    color: '#ffffff',
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
  errorText: {
    marginTop: 6,
    color: '#b91c1c',
  },
});
