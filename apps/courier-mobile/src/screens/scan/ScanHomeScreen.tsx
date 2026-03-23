import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../navigation/navigation.types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Scan'>;

export function ScanHomeScreen(_: Props): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);

  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Trung tam quet ma</Text>
        <Text style={styles.subtitle}>Uu tien thao tac nhanh, mot tay, de retry.</Text>
      </View>

      <Card
        onPress={() => navigation.navigate('PickupScan', {})}
        style={styles.primaryActionCard}
      >
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.primaryActionTitle}>Quet Pickup</Text>
            <Text style={styles.primaryActionHint}>
              Quet QR/barcode va gui scan pickup
            </Text>
          </View>
          <Ionicons name="scan" size={30} color="#FFFFFF" />
        </View>
      </Card>

      <View style={styles.grid}>
        <Card
          onPress={() => navigation.navigate('HubScan', { mode: 'INBOUND' })}
          style={styles.gridCard}
        >
          <Ionicons name="arrow-down-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.gridTitle}>Hub inbound</Text>
          <Text style={styles.gridHint}>Nhap kho / nhan hub</Text>
        </Card>

        <Card
          onPress={() => navigation.navigate('HubScan', { mode: 'OUTBOUND' })}
          style={styles.gridCard}
        >
          <Ionicons name="arrow-up-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.gridTitle}>Hub outbound</Text>
          <Text style={styles.gridHint}>Xuat kho / roi hub</Text>
        </Card>
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.statusTitle}>Offline queue</Text>
          {offlinePendingCount > 0 ? (
            <StatusBadge label={`${offlinePendingCount} cho retry`} variant="warning" />
          ) : (
            <StatusBadge label="Không có queue" variant="success" />
          )}
        </View>
        <Text style={styles.statusHint}>
          Retry su dung lai idempotencyKey de tranh duplicate khong kiem soat.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  hero: {
    gap: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  primaryActionCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  primaryActionHint: {
    color: '#DDE8FF',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  gridCard: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  gridTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  gridHint: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  statusCard: {
    gap: theme.spacing.sm,
  },
  statusTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  statusHint: {
    color: theme.colors.textMuted,
    lineHeight: 19,
  },
});

