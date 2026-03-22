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

import { loginSchema, type LoginFormValues } from './auth.types';
import { theme } from '../../theme';

interface LoginFormProps {
  loading: boolean;
  errorMessage: string | null;
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

export function LoginForm({
  loading,
  errorMessage,
  onSubmit,
}: LoginFormProps): React.JSX.Element {
  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  return (
    <View>
      <Controller
        control={control}
        name="username"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Tài khoản</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="courier.username"
              placeholderTextColor="#8EA1BA"
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
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="********"
              placeholderTextColor="#8EA1BA"
            />
            {fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {formState.isSubmitted && !formState.isValid ? (
        <Text style={styles.errorText}>Thông tin đăng nhập chưa hợp lệ.</Text>
      ) : null}

      <Pressable
        disabled={loading}
        onPress={handleSubmit(onSubmit)}
        style={styles.primaryButton}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Đăng nhập</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: 6,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4E0F2',
    borderRadius: theme.radius.md,
    backgroundColor: '#F8FBFF',
    color: theme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    marginTop: 6,
    color: theme.colors.danger,
  },
});
