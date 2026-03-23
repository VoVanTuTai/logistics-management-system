import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LoginForm } from '../../features/auth/LoginForm';
import { useAuthStore } from '../../features/auth/auth.store';
import type { LoginFormValues } from '../../features/auth/auth.types';
import { Card } from '../../components/ui/Card';
import { theme } from '../../theme';

export function LoginScreen(): React.JSX.Element {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.isLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      await login(values);
    } catch {
      // Error state được auth store cập nhật.
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="cube-outline" size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Courier Mobile</Text>
        <Text style={styles.heroSubtitle}>Hệ thống vận hành giao nhận logistics</Text>
      </View>

      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Đăng nhập tài khoản shipper</Text>
        <Text style={styles.formDescription}>
          App chỉ gọi gateway-bff. Session/token được lưu an toàn bởi auth module.
        </Text>
        <Text style={styles.seedHint}>
          Tài khoản seed local: courier.hcm1 / courier123456
        </Text>

        <LoginForm
          loading={loading}
          errorMessage={errorMessage}
          onSubmit={handleLogin}
        />
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#DDE8FF',
  },
  formCard: {
    flex: 1,
  },
  formTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  formDescription: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: 19,
  },
  seedHint: {
    ...theme.typography.caption.md,
    color: theme.colors.info,
    marginBottom: theme.spacing.lg,
  },
});
