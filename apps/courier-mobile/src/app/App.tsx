import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RootNavigator } from '../navigation/RootNavigator';
import { hydrateAuthSession } from '../features/auth/auth.session';
import { getOfflineQueue } from '../offline/queue.storage';
import { useAppStore } from '../store/appStore';
import { AppProviders } from './providers/AppProviders';

function Bootstrap(): React.JSX.Element {
  const authStatus = useAppStore((state) => state.authStatus);
  const globalErrorMessage = useAppStore((state) => state.globalErrorMessage);
  const globalLoadingMessage = useAppStore((state) => state.globalLoadingMessage);
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);
  const clearGlobalError = useAppStore((state) => state.clearGlobalError);
  const setGuest = useAppStore((state) => state.setGuest);
  const setOfflinePendingCount = useAppStore(
    (state) => state.setOfflinePendingCount,
  );

  useEffect(() => {
    void (async () => {
      try {
        await hydrateAuthSession();
        const queue = await getOfflineQueue();
        setOfflinePendingCount(queue.length);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Bootstrap failed.';
        useAppStore.getState().setGlobalError(message);
        setGuest();
      }
    })();
  }, [setGuest, setOfflinePendingCount]);

  if (authStatus === 'booting') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Dang khoi tao courier-mobile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {globalErrorMessage ? (
        <Pressable onPress={clearGlobalError} style={styles.bannerError}>
          <Text style={styles.bannerTitle}>Loi</Text>
          <Text style={styles.bannerText}>{globalErrorMessage}</Text>
        </Pressable>
      ) : null}

      {globalLoadingMessage ? (
        <View style={styles.bannerInfo}>
          <ActivityIndicator size="small" color="#0f172a" />
          <Text style={styles.bannerText}>{globalLoadingMessage}</Text>
        </View>
      ) : null}

      {offlinePendingCount > 0 ? (
        <View style={styles.bannerWarning}>
          <Text style={styles.bannerTitle}>Offline queue</Text>
          <Text style={styles.bannerText}>
            Dang co {offlinePendingCount} action cho retry.
          </Text>
        </View>
      ) : null}

      <View style={styles.navigatorContainer}>
        <RootNavigator />
      </View>
    </View>
  );
}

export default function App(): React.JSX.Element {
  return (
    <AppProviders>
      <Bootstrap />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  helperText: {
    marginTop: 12,
    color: '#475569',
  },
  bannerError: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bannerWarning: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerTitle: {
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  bannerText: {
    color: '#334155',
  },
  navigatorContainer: {
    flex: 1,
  },
});
