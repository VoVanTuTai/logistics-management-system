import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { DeliverySuccessFormValues } from './delivery-success.types';

interface DeliverySuccessFormProps {
  control: Control<DeliverySuccessFormValues>;
  submitting: boolean;
  onSubmit: () => void;
  onGenerateIdempotencyKey: () => void;
}

export function DeliverySuccessForm({
  control,
  submitting,
  onSubmit,
  onGenerateIdempotencyKey,
}: DeliverySuccessFormProps): React.JSX.Element {
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

      <Pressable disabled={submitting} onPress={onSubmit} style={styles.primaryButton}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Confirm delivery success</Text>
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
