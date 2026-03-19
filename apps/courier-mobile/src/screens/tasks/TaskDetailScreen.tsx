import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTaskDetailQuery } from '../../features/tasks/tasks.queries';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const taskQuery = useTaskDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    taskId: route.params.taskId,
  });

  if (taskQuery.isLoading) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.centeredText}>Dang tai chi tiet...</Text>
        </View>
      </Screen>
    );
  }

  if (taskQuery.isError) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {taskQuery.error instanceof Error
              ? taskQuery.error.message
              : 'Tai task detail that bai.'}
          </Text>
          <Pressable onPress={() => void taskQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Thu lai</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const task = taskQuery.data;

  if (!task) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Khong tim thay task.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      <Card style={styles.heroCard}>
        <Text style={styles.taskCode}>{task.taskCode}</Text>
        <View style={styles.heroMetaRow}>
          <StatusBadge label={task.status} variant="info" />
          <StatusBadge label={task.taskType} variant="neutral" />
        </View>
        <Text style={styles.shipmentText}>
          Shipment code: {task.shipmentCode ?? 'N/A'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Thong tin chi tiet</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pickup request</Text>
          <Text style={styles.infoValue}>{task.pickupRequestId ?? 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Note</Text>
          <Text style={styles.infoValue}>{task.note ?? 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assignments</Text>
          <Text style={styles.infoValue}>{task.assignments.length}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Tac vu nhanh</Text>
        <Text style={styles.sectionHint}>
          Mobile chi navigate va gui action; khong tu suy dien workflow backend.
        </Text>

        <View style={styles.actionGrid}>
          <Pressable
            onPress={() =>
              navigation.navigate('PickupScan', {
                taskId: task.id,
                shipmentCode: task.shipmentCode ?? undefined,
              })
            }
            style={styles.primaryActionBtn}
          >
            <Ionicons name="scan" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Pickup scan</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('HubScan', {
                mode: 'INBOUND',
                taskId: task.id,
                shipmentCode: task.shipmentCode ?? undefined,
              })
            }
            style={styles.secondaryActionBtn}
          >
            <Text style={styles.secondaryActionText}>Hub inbound</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('HubScan', {
                mode: 'OUTBOUND',
                taskId: task.id,
                shipmentCode: task.shipmentCode ?? undefined,
              })
            }
            style={styles.secondaryActionBtn}
          >
            <Text style={styles.secondaryActionText}>Hub outbound</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('DeliverySuccess', {
                taskId: task.id,
                shipmentCode: task.shipmentCode ?? undefined,
              })
            }
            style={styles.secondaryActionBtn}
          >
            <Text style={styles.secondaryActionText}>Delivery success</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('DeliveryFail', {
                taskId: task.id,
                shipmentCode: task.shipmentCode ?? undefined,
              })
            }
            style={styles.secondaryActionBtn}
          >
            <Text style={styles.secondaryActionText}>Delivery fail / NDR</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  centeredText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
  },
  heroCard: {
    backgroundColor: '#EDF4FF',
    borderColor: '#CDE0FF',
    gap: theme.spacing.sm,
  },
  taskCode: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  shipmentText: {
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  sectionHint: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    flex: 1,
  },
  infoValue: {
    color: theme.colors.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  actionGrid: {
    gap: theme.spacing.sm,
  },
  primaryActionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryActionBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryActionText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
