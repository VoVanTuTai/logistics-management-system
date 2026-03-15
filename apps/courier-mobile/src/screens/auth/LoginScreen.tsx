import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { useLoginMutation } from '../../features/auth/auth.api';
import { persistAuthSession } from '../../features/auth/auth.session';
import {
  loginSchema,
  type LoginFormValues,
} from '../../features/auth/auth.types';
import { useAppStore } from '../../store/appStore';

export function LoginScreen(): React.JSX.Element {
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  const loginMutation = useLoginMutation();

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await loginMutation.mutateAsync(values);
      await persistAuthSession(result);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Login failed.');
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Courier login</Text>
      <Text style={styles.description}>
        App chi goi qua gateway-bff. CourierId hien tai la placeholder tu env
        cho task query.
      </Text>

      <Controller
        control={control}
        name="username"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              autoCapitalize="none"
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="courier.username"
            />
            {fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="********"
            />
            {fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <Pressable
        disabled={loginMutation.isPending}
        onPress={onSubmit}
        style={styles.primaryButton}
      >
        {loginMutation.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Login</Text>
        )}
      </Pressable>

      {formState.isSubmitted && !formState.isValid ? (
        <Text style={styles.errorText}>Form chua hop le.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  description: {
    color: '#475569',
    marginBottom: 24,
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
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
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
