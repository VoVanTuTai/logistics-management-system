import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAssignedTasksQuery } from '../../features/tasks/tasks.api';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../navigation/navigation.types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';

type Props = BottomTabScreenProps<MainTabParamList, 'Tasks'>;

export function TaskListScreen(_: Props): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = useAppStore((state) => state.session);
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId: appEnv.courierId,
  });

  if (tasksQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.helperText}>Dang tai task...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assigned tasks</Text>
      <Text style={styles.helperText}>
        CourierId dang dung: {appEnv.courierId}. TODO: map tu identity/claim cua
        BFF.
      </Text>

      <FlatList
        data={tasksQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={tasksQuery.refetch}
        refreshing={tasksQuery.isRefetching}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Khong co task</Text>
            <Text style={styles.helperText}>
              Kiem tra lai courierId hoac assignment tren backend.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>{item.taskCode}</Text>
            <Text style={styles.cardMeta}>Type: {item.taskType}</Text>
            <Text style={styles.cardMeta}>Status: {item.status}</Text>
            <Text style={styles.cardMeta}>
              Shipment: {item.shipmentCode ?? 'N/A'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  helperText: {
    color: '#64748b',
  },
  listContent: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardMeta: {
    color: '#475569',
    marginBottom: 2,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
});
