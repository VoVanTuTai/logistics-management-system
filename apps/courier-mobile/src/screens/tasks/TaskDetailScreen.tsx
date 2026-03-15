import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTaskDetailQuery } from '../../features/tasks/tasks.api';
import type { RootStackParamList } from '../../navigation/navigation.types';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({ navigation, route }: Props): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const taskQuery = useTaskDetailQuery({
    accessToken: session?.tokens.accessToken ?? null,
    taskId: route.params.taskId,
  });

  if (taskQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  const task = taskQuery.data;

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Khong tim thay task.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{task.taskCode}</Text>
      <Text style={styles.meta}>Task type: {task.taskType}</Text>
      <Text style={styles.meta}>Task status: {task.status}</Text>
      <Text style={styles.meta}>
        Shipment code: {task.shipmentCode ?? 'N/A'}
      </Text>
      <Text style={styles.meta}>
        Pickup request: {task.pickupRequestId ?? 'N/A'}
      </Text>
      <Text style={styles.meta}>Note: {task.note ?? 'N/A'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignments</Text>
        {task.assignments.length === 0 ? (
          <Text style={styles.meta}>Khong co assignment.</Text>
        ) : (
          task.assignments.map((assignment) => (
            <Text key={assignment.id} style={styles.meta}>
              {assignment.courierId} - assignedAt {assignment.assignedAt}
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <Text style={styles.helperText}>
          TODO: action availability nen duoc BFF/backend tra ve ro rang, mobile
          khong tu suy dien workflow.
        </Text>

        <Pressable
          onPress={() =>
            navigation.navigate('PickupScan', {
              taskId: task.id,
              shipmentCode: task.shipmentCode ?? undefined,
            })
          }
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Scan pickup</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('HubScan', {
              mode: 'INBOUND',
              taskId: task.id,
              shipmentCode: task.shipmentCode ?? undefined,
            })
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Hub inbound</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('HubScan', {
              mode: 'OUTBOUND',
              taskId: task.id,
              shipmentCode: task.shipmentCode ?? undefined,
            })
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Hub outbound</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('DeliverySuccess', {
              taskId: task.id,
              shipmentCode: task.shipmentCode ?? undefined,
            })
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Delivery success</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('DeliveryFail', {
              taskId: task.id,
              shipmentCode: task.shipmentCode ?? undefined,
            })
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Delivery fail / NDR</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  meta: {
    color: '#475569',
    marginBottom: 6,
  },
  section: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  helperText: {
    color: '#64748b',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  errorText: {
    color: '#b91c1c',
  },
});
