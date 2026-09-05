import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { loginSchema, type LoginFormValues } from './auth.types';
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from './auth.session';
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { control, handleSubmit, formState, setValue } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Load remembered credentials on mount to auto-fill username/password
  useEffect(() => {
    let isMounted = true;
    void loadRememberedCredentials().then((saved) => {
      if (saved && isMounted) {
        if (saved.username) {
          setValue('username', saved.username, { shouldValidate: true });
        }
        if (saved.password) {
          setValue('password', saved.password, { shouldValidate: true });
        }
        setRememberMe(saved.rememberMe ?? true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setValue]);

  const handleFormSubmit = async (values: LoginFormValues) => {
    if (rememberMe) {
      await saveRememberedCredentials({
        username: values.username,
        password: values.password,
        rememberMe: true,
      });
    } else {
      await clearRememberedCredentials();
    }
    await onSubmit(values);
  };

  return (
    <View>
      <Controller
        control={control}
        name="username"
        render={({ field, fieldState }) => (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Tài khoản</Text>
            <TextInput
              testID="login-username-input"
              accessibilityLabel="Tài khoản courier"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              value={field.value}
              onChangeText={field.onChange}
              style={styles.input}
              placeholder="Nhập tài khoản courier (8 chữ số)"
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
            <View style={styles.passwordContainer}>
              <TextInput
                testID="login-password-input"
                accessibilityLabel="Mật khẩu courier"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                value={field.value}
                onChangeText={field.onChange}
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#8EA1BA"
              />
              <Pressable
                testID="login-toggle-password-visibility"
                accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                accessibilityRole="button"
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
                hitSlop={12}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#64748B"
                />
              </Pressable>
            </View>
            {fieldState.error ? (
              <Text style={styles.errorText}>{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      {/* OPTIONS ROW: REMEMBER ME CHECKBOX */}
      <View style={styles.optionsRow}>
        <Pressable
          testID="login-remember-me-checkbox"
          accessibilityLabel="Ghi nhớ đăng nhập"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
          onPress={() => setRememberMe((prev) => !prev)}
          style={styles.rememberRow}
          hitSlop={8}
        >
          <Ionicons
            name={rememberMe ? 'checkbox' : 'square-outline'}
            size={20}
            color={rememberMe ? theme.colors.primary : '#8EA1BA'}
          />
          <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
        </Pressable>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {formState.isSubmitted && !formState.isValid ? (
        <Text style={styles.errorText}>Thông tin đăng nhập chưa hợp lệ.</Text>
      ) : null}

      <Pressable
        testID="login-submit-button"
        accessibilityLabel="Đăng nhập"
        disabled={loading}
        onPress={handleSubmit(handleFormSubmit)}
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
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4E0F2',
    borderRadius: theme.radius.md,
    backgroundColor: '#F8FBFF',
    color: theme.colors.textPrimary,
    paddingLeft: 12,
    paddingRight: 44,
    paddingVertical: 12,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: theme.spacing.xs,
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
