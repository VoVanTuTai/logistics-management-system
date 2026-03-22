import React from 'react';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppNavigator } from '../navigation/AppNavigator';
import { useAuthStore } from '../features/auth/auth.store';
import { useAppStore } from '../store/appStore';
import { theme } from '../theme';
import { AppProviders } from './providers/AppProviders';

export default function App(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const globalLoadingMessage = useAppStore((state) => state.globalLoadingMessage);
  const globalErrorMessage = useAppStore((state) => state.globalErrorMessage);
  const clearGlobalError = useAppStore((state) => state.clearGlobalError);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <AppProviders>
      <View style={styles.appContainer}>
        {status === 'booting' ? <BootingScreen /> : <AppNavigator />}

        {globalLoadingMessage ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.loadingText}>{globalLoadingMessage}</Text>
          </View>
        ) : null}

        {globalErrorMessage ? (
          <Pressable onPress={clearGlobalError} style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
            <Text style={styles.errorText}>{globalErrorMessage}</Text>
            <Text style={styles.errorHint}>Chạm để đóng</Text>
          </Pressable>
        ) : null}
      </View>
    </AppProviders>
  );
}

function BootingScreen(): React.JSX.Element {
  return (
    <View style={styles.bootingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.bootingText}>Đang khôi phục phiên đăng nhập...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  bootingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  bootingText: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
  },
  loadingBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(12, 35, 64, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    ...theme.shadow.md,
  },
  loadingText: {
    ...theme.typography.caption.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...theme.shadow.md,
  },
  errorTitle: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.danger,
  },
  errorText: {
    ...theme.typography.caption.md,
    color: '#7F1D1D',
    marginTop: 2,
  },
  errorHint: {
    ...theme.typography.caption.sm,
    color: '#B91C1C',
    marginTop: theme.spacing.xs,
  },
});
