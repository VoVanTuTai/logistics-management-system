import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLogoutMutation } from '../../features/auth/auth.api';
import {
  clearAuthSession,
  persistAuthSession,
} from '../../features/auth/auth.session';
import { flushOfflineQueue } from '../../offline/queue.worker';
import { useAppStore } from '../../store/appStore';

export function ProfileScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);
  const offlineSyncing = useAppStore((state) => state.offlineSyncing);
  const setGlobalError = useAppStore((state) => state.setGlobalError);
  const logoutMutation = useLogoutMutation();

  const handleFlushQueue = async () => {
    try {
      await flushOfflineQueue(session?.tokens.accessToken ?? null);
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Offline queue retry failed.',
      );
    }
  };

  const handleLogout = async () => {
    try {
      if (session) {
        await logoutMutation.mutateAsync({
          accessToken: session.tokens.accessToken,
          refreshToken: session.tokens.refreshToken,
        });
      }
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Logout request failed.',
      );
    } finally {
      await clearAuthSession();
    }
  };

  const handleRefreshSession = async () => {
    if (!session) {
      return;
    }

    try {
      await persistAuthSession(session);
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Session refresh failed.',
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Session</Text>
        <Text style={styles.meta}>User ID: {session?.user.id ?? 'N/A'}</Text>
        <Text style={styles.meta}>
          Username: {session?.user.username ?? 'N/A'}
        </Text>
        <Text style={styles.meta}>
          Roles: {session?.user.roles.join(', ') ?? 'N/A'}
        </Text>
        <Text style={styles.meta}>
          Access token expires: {session?.tokens.accessTokenExpiresAt ?? 'N/A'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Offline queue</Text>
        <Text style={styles.meta}>Pending jobs: {offlinePendingCount}</Text>
        <Text style={styles.meta}>
          Sync status: {offlineSyncing ? 'SYNCING' : 'IDLE'}
        </Text>
        <Text style={styles.helperText}>
          Retry giu nguyen `idempotencyKey`, khong tao key moi khi resend.
        </Text>

        <Pressable
          disabled={offlineSyncing}
          onPress={handleFlushQueue}
          style={styles.primaryButton}
        >
          {offlineSyncing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Retry offline queue</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Utilities</Text>
        <Text style={styles.helperText}>
          Session persistence hien tai luu local. TODO: bo sung refresh-token
          flow khi app package va native runtime da duoc wiring day du.
        </Text>

        <Pressable onPress={handleRefreshSession} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Re-persist session</Text>
        </Pressable>

        <Pressable
          disabled={logoutMutation.isPending}
          onPress={handleLogout}
          style={styles.dangerButton}
        >
          {logoutMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Logout</Text>
          )}
        </Pressable>
      </View>
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  meta: {
    color: '#475569',
    marginBottom: 6,
  },
  helperText: {
    color: '#64748b',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
