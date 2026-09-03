import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';

import * as Location from 'expo-location';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { shipmentApi } from '../../features/shipment/shipment.api';
import type { ShipmentDto, ShipmentMetadata } from '../../features/shipment/shipment.types';
import { tasksApi } from '../../features/tasks/tasks.api';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import type { TaskDto, TaskStatus, TaskType } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierId, resolveCourierDisplayName } from '../../utils/courier';
import {
  openGoogleMapsDirections,
  resolveShipmentNavigationDestination,
  type NavigationDestination,
} from '../../utils/directions';
import { optimizeClientRoute } from '../../utils/routeOptimizer';
import { theme } from '../../theme';

type TaskListRouteParams = AppNavigatorParamList['TaskList'];
type TaskViewMode = 'ORDER' | 'CUSTOMER';
const UNKNOWN_RECEIVER_NAME = 'Chưa có người nhận';

interface TaskDisplayItem {
  task: TaskDto;
  shipment: ShipmentDto | null;
  receiverName: string;
  receiverPhone: string | null;
  deliveryAddress: string | null;
  navigationDestination: NavigationDestination | null;
  customerKey: string;
}

interface CustomerTaskGroup {
  id: string;
  receiverName: string;
  receiverPhone: string | null;
  deliveryAddress: string | null;
  navigationDestination: NavigationDestination | null;
  tasks: TaskDisplayItem[];
}

interface Props {
  route?: {
    params?: TaskListRouteParams;
  };
}

function statusVariant(status: TaskStatus):
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  if (status === 'CREATED') return 'warning';
  return 'info';
}

function readMetadataPath(
  metadata: ShipmentMetadata | null,
  path: string,
): unknown {
  if (!metadata) {
    return null;
  }

  const keys = path.split('.');
  let current: unknown = metadata;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function readMetadataString(
  metadata: ShipmentMetadata | null,
  paths: string[],
): string | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const normalizedPhone = phone.replace(/[^\d+]/g, '');
  return normalizedPhone.length > 0 ? normalizedPhone : null;
}

function normalizeCustomerText(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function buildCustomerKey(input: {
  taskId: string;
  receiverName: string;
  receiverPhone: string | null;
  deliveryAddress: string | null;
}): string {
  const phoneKey = normalizePhone(input.receiverPhone);
  if (phoneKey) {
    return `phone:${phoneKey}`;
  }

  const nameKey = normalizeCustomerText(input.receiverName);
  const addressKey = normalizeCustomerText(input.deliveryAddress);
  if (nameKey && nameKey !== 'n/a' && nameKey !== normalizeCustomerText(UNKNOWN_RECEIVER_NAME)) {
    return `receiver:${nameKey}:${addressKey}`;
  }

  return `task:${input.taskId}`;
}

function buildTaskDisplayItem(
  task: TaskDto,
  shipment: ShipmentDto | null,
): TaskDisplayItem {
  const metadata = shipment?.metadata ?? null;
  const receiverName =
    readMetadataString(metadata, [
      'receiverName',
      'receiver.name',
      'recipientName',
      'recipient.name',
    ]) ?? UNKNOWN_RECEIVER_NAME;
  const receiverPhone =
    readMetadataString(metadata, [
      'receiverPhone',
      'receiver.phone',
      'recipientPhone',
      'recipient.phone',
    ]) ?? null;
  const deliveryAddress =
    readMetadataString(metadata, [
      'deliveryAddress',
      'receiverAddress',
      'recipientAddress',
      'receiver.address',
      'recipient.address',
      'address',
    ]) ?? null;
  const navigationDestination = resolveShipmentNavigationDestination({
    taskType: task.taskType,
    metadata,
  });

  return {
    task,
    shipment,
    receiverName,
    receiverPhone,
    deliveryAddress,
    navigationDestination,
    customerKey: buildCustomerKey({
      taskId: task.id,
      receiverName,
      receiverPhone,
      deliveryAddress,
    }),
  };
}

function groupTasksByCustomer(items: TaskDisplayItem[]): CustomerTaskGroup[] {
  const groups = new Map<string, CustomerTaskGroup>();

  for (const item of items) {
    const existingGroup = groups.get(item.customerKey);
    if (existingGroup) {
      if (!existingGroup.navigationDestination && item.navigationDestination) {
        existingGroup.navigationDestination = item.navigationDestination;
      }

      existingGroup.tasks.push(item);
      continue;
    }

    groups.set(item.customerKey, {
      id: item.customerKey,
      receiverName: item.receiverName,
      receiverPhone: item.receiverPhone,
      deliveryAddress: item.deliveryAddress,
      navigationDestination: item.navigationDestination,
      tasks: [item],
    });
  }

  return Array.from(groups.values());
}

function formatShipmentCode(task: TaskDto): string {
  return task.shipmentCode ?? 'Chưa có mã vận đơn';
}

function toTaskTypeLabel(taskType: TaskType): string {
  const labels: Record<TaskType, string> = {
    PICKUP: 'Đợi lấy',
    DELIVERY: 'Đợi phát',
    RETURN: 'Hoàn hàng',
  };

  return labels[taskType];
}

export function TaskListScreen({ route }: Props = {}): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const courierName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const offlinePendingCount = useAppStore((state) => state.offlinePendingCount);

  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const onRefresh = () => void tasksQuery.refetch();

  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskType | 'ALL'>(
    route?.params?.initialTaskType ?? 'ALL',
  );
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED'
  >(route?.params?.initialStatus ?? 'ALL');
  const [viewMode, setViewMode] = useState<TaskViewMode>('ORDER');
  const [isOptimizedRoute, setIsOptimizedRoute] = useState<boolean>(false);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [routeStats, setRouteStats] = useState<{
    totalDistanceKm: number;
    totalDurationMinutes: number;
    legDistanceMap: Record<string, number>;
    stepOrderMap: Record<string, number>;
  } | null>(null);

  const tasks = tasksQuery.data ?? [];

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (taskTypeFilter === 'ALL' || task.taskType === taskTypeFilter) &&
          (statusFilter === 'ALL' || task.status === statusFilter),
      ),
    [tasks, taskTypeFilter, statusFilter],
  );

  const filteredShipmentCodes = useMemo(
    () =>
      Array.from(
        new Set(
          filteredTasks
            .map((task) => task.shipmentCode?.trim())
            .filter((shipmentCode): shipmentCode is string => Boolean(shipmentCode)),
        ),
      ),
    [filteredTasks],
  );
  const shipmentQueries = useQueries({
    queries: filteredShipmentCodes.map((shipmentCode) => ({
      queryKey: ['shipment', 'detail', shipmentCode],
      queryFn: () =>
        shipmentApi.getShipmentDetail(
          session?.tokens.accessToken as string,
          shipmentCode,
        ),
      enabled: Boolean(session?.tokens.accessToken),
      staleTime: 30_000,
    })),
  });
  const shipmentByCode = useMemo(() => {
    const shipments = new Map<string, ShipmentDto>();

    filteredShipmentCodes.forEach((shipmentCode, index) => {
      const shipment = shipmentQueries[index]?.data;
      if (shipment) {
        shipments.set(shipmentCode, shipment);
      }
    });

    return shipments;
  }, [filteredShipmentCodes, shipmentQueries]);
  const displayItems = useMemo(
    () =>
      filteredTasks.map((task) =>
        buildTaskDisplayItem(
          task,
          task.shipmentCode ? shipmentByCode.get(task.shipmentCode) ?? null : null,
        ),
      ),
    [filteredTasks, shipmentByCode],
  );

  const sortedDisplayItems = useMemo(() => {
    if (!isOptimizedRoute || !routeStats) {
      return displayItems;
    }
    return [...displayItems].sort((a, b) => {
      const orderA = routeStats.stepOrderMap[a.task.id] ?? 9999;
      const orderB = routeStats.stepOrderMap[b.task.id] ?? 9999;
      return orderA - orderB;
    });
  }, [displayItems, isOptimizedRoute, routeStats]);

  const customerGroups = useMemo(
    () => groupTasksByCustomer(sortedDisplayItems),
    [sortedDisplayItems],
  );

  const typeOptions: { value: TaskType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PICKUP', label: 'Đợi lấy' },
    { value: 'DELIVERY', label: 'Đợi phát' },
    { value: 'RETURN', label: 'Hoàn hàng' },
  ];

  const statusOptions: {
    value: 'ALL' | 'CREATED' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
    label: string;
  }[] = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'CREATED', label: 'Chờ nhận' },
    { value: 'ASSIGNED', label: 'Đang giao' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
  ];

  const visibleCountText =
    viewMode === 'CUSTOMER'
      ? `${customerGroups.length} khách / ${filteredTasks.length} đơn`
      : `${filteredTasks.length} nhiệm vụ`;

  const handleCallCustomer = async (phone: string | null) => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      Alert.alert('Chưa có số điện thoại', 'Đơn này chưa có số điện thoại người nhận.');
      return;
    }

    try {
      await Linking.openURL(`tel:${normalizedPhone}`);
    } catch (error) {
      Alert.alert(
        'Không thể gọi',
        error instanceof Error
          ? error.message
          : `Không thể mở ứng dụng gọi điện cho số ${normalizedPhone}.`,
      );
    }
  };

  const handleOpenDirections = async (
    destination: NavigationDestination | null,
  ) => {
    await openGoogleMapsDirections(destination);
  };

  const handleToggleOptimizedRoute = async () => {
    if (isOptimizedRoute) {
      setIsOptimizedRoute(false);
      setRouteStats(null);
      return;
    }

    if (displayItems.length === 0) {
      Alert.alert('Không có nhiệm vụ', 'Danh sách hiện tại không có đơn để tối ưu lộ trình.');
      return;
    }

    setOptimizing(true);
    try {
      let currentLat = 10.8000;
      let currentLng = 106.6600;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          currentLat = loc.coords.latitude;
          currentLng = loc.coords.longitude;
        }
      } catch (locErr) {
        console.warn('GPS location fallback used:', locErr);
      }

      const clientNodes = displayItems.map((item) => {
        const dest = item.navigationDestination;
        const lat = dest?.latitude ?? currentLat + (Math.random() - 0.5) * 0.01;
        const lng = dest?.longitude ?? currentLng + (Math.random() - 0.5) * 0.01;
        return {
          id: item.task.id,
          coordinate: { latitude: lat, longitude: lng },
          data: item,
        };
      });

      let orderedIds: string[] = [];
      let totalDistanceKm = 0;
      let totalDurationMinutes = 0;
      const legDistMap: Record<string, number> = {};
      const stepMap: Record<string, number> = {};

      let apiSuccess = false;
      if (session?.tokens.accessToken) {
        try {
          const apiResult = await tasksApi.optimizeRoute(session.tokens.accessToken, {
            courierId,
            startLatitude: currentLat,
            startLongitude: currentLng,
            taskIds: displayItems.map((d) => d.task.id),
          });
          if (apiResult && Array.isArray(apiResult.orderedTaskIds) && apiResult.orderedTaskIds.length > 0) {
            orderedIds = apiResult.orderedTaskIds;
            totalDistanceKm = Number((apiResult.totalDistanceMeters / 1000).toFixed(1));
            totalDurationMinutes = Math.round(apiResult.estimatedDurationSeconds / 60);

            apiResult.legs?.forEach((leg) => {
              if (leg.toId && leg.toId !== 'START') {
                legDistMap[leg.toId] = Number((leg.distanceMeters / 1000).toFixed(1));
              }
            });
            apiSuccess = true;
          }
        } catch (apiErr) {
          console.warn('Backend route optimization failed, using client fallback:', apiErr);
        }
      }

      if (!apiSuccess) {
        const clientRes = optimizeClientRoute({ latitude: currentLat, longitude: currentLng }, clientNodes);
        orderedIds = clientRes.orderedIds;
        totalDistanceKm = clientRes.totalDistanceKm;
        totalDurationMinutes = clientRes.totalDurationMinutes;

        clientRes.legs.forEach((leg) => {
          if (leg.toId && leg.toId !== 'START') {
            legDistMap[leg.toId] = leg.distanceKm;
          }
        });
      }

      orderedIds.forEach((taskId, index) => {
        stepMap[taskId] = index + 1;
      });

      setRouteStats({
        totalDistanceKm,
        totalDurationMinutes,
        legDistanceMap: legDistMap,
        stepOrderMap: stepMap,
      });
      setIsOptimizedRoute(true);
    } catch (error) {
      Alert.alert('Lỗi tối ưu lộ trình', error instanceof Error ? error.message : String(error));
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Screen
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      onRefresh={onRefresh}
      refreshing={tasksQuery.isRefetching}
    >
      <View style={styles.headerBlock}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerEyebrow}>{courierName} - {courierId}</Text>
            <Text style={styles.headerTitle}>Nhiệm vụ hàng ngày</Text>
            <Text style={styles.headerSubtitle}>{visibleCountText}</Text>
          </View>
          <View style={styles.headerActionRow}>
            <Pressable
              onPress={handleToggleOptimizedRoute}
              disabled={optimizing}
              style={({ pressed }) => [
                styles.optimizeButton,
                isOptimizedRoute && styles.optimizeButtonActive,
                pressed && styles.optimizeButtonPressed,
              ]}
            >
              {optimizing ? (
                <ActivityIndicator size="small" color={isOptimizedRoute ? '#FFFFFF' : theme.colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={isOptimizedRoute ? 'map' : 'compass-outline'}
                    size={14}
                    color={isOptimizedRoute ? '#FFFFFF' : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.optimizeButtonText,
                      isOptimizedRoute && styles.optimizeButtonTextActive,
                    ]}
                  >
                    {isOptimizedRoute ? 'Đã xếp' : 'Xếp lộ trình'}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('TrackingLookup')}
              style={({ pressed }) => [styles.trackButton, pressed && styles.trackButtonPressed]}
            >
              <Ionicons name="search" size={13} color={theme.colors.primary} />
              <Text style={styles.trackButtonText}>Tra cứu</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.filterPanel}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Ionicons name="cube-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.filterLabel}>Nhiệm vụ</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
              style={styles.filterScrollView}
            >
              {typeOptions.map((option) => {
                const active = option.value === taskTypeFilter;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setTaskTypeFilter(option.value)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      active && styles.filterChipActive,
                      pressed && styles.filterChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Ionicons name="radio-button-on-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.filterLabel}>Trạng thái</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
              style={styles.filterScrollView}
            >
              {statusOptions.map((option) => {
                const active = option.value === statusFilter;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setStatusFilter(option.value)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      active && styles.filterChipActive,
                      pressed && styles.filterChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={styles.viewModeRow}>
          <Pressable
            onPress={() => setViewMode('ORDER')}
            style={({ pressed }) => [
              styles.viewModeButton,
              viewMode === 'ORDER' && styles.viewModeButtonActive,
              pressed && styles.viewModeButtonPressed,
            ]}
          >
            <Ionicons
              name="receipt-outline"
              size={13}
              color={viewMode === 'ORDER' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'ORDER' && styles.viewModeTextActive,
              ]}
            >
              Theo đơn
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('CUSTOMER')}
            style={({ pressed }) => [
              styles.viewModeButton,
              viewMode === 'CUSTOMER' && styles.viewModeButtonActive,
              pressed && styles.viewModeButtonPressed,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={13}
              color={viewMode === 'CUSTOMER' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'CUSTOMER' && styles.viewModeTextActive,
              ]}
            >
              Theo khách hàng
            </Text>
          </Pressable>
        </View>
      </View>

      {offlinePendingCount > 0 ? (
        <Card style={styles.offlineBanner}>
          <Text style={styles.offlineBannerTitle}>Đang có thao tác chờ đồng bộ offline</Text>
          <Text style={styles.offlineBannerText}>
            {offlinePendingCount} thao tác đang trong hàng đợi. Vào tab Cá nhân để thử lại thủ công.
          </Text>
        </Card>
      ) : null}

      {tasksQuery.isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>Đang tải nhiệm vụ...</Text>
        </View>
      ) : null}

      {tasksQuery.isError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>
            {tasksQuery.error instanceof Error
              ? tasksQuery.error.message
              : 'Tải nhiệm vụ thất bại.'}
          </Text>
          <Pressable onPress={() => void tasksQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && filteredTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Không có nhiệm vụ phù hợp</Text>
          <Text style={styles.stateText}>Thử đổi bộ lọc hoặc kéo để làm mới.</Text>
        </Card>
      ) : null}

      {isOptimizedRoute && routeStats ? (
        <Card style={styles.routeBanner}>
          <View style={styles.routeBannerHeader}>
            <View style={styles.routeBannerTitleBlock}>
              <View style={styles.routeBannerBadge}>
                <Ionicons name="sparkles" size={14} color="#0284c7" />
                <Text style={styles.routeBannerBadgeText}>Lộ trình tối ưu thông minh</Text>
              </View>
              <Text style={styles.routeBannerStats}>
                {sortedDisplayItems.length} chặng • ~{routeStats.totalDistanceKm} km • ~{routeStats.totalDurationMinutes} phút
              </Text>
            </View>
            <Pressable onPress={handleToggleOptimizedRoute} style={styles.routeBannerResetBtn}>
              <Text style={styles.routeBannerResetText}>Khôi phục</Text>
            </Pressable>
          </View>
          {sortedDisplayItems[0]?.navigationDestination ? (
            <Pressable
              style={styles.startLegButton}
              onPress={() => void handleOpenDirections(sortedDisplayItems[0].navigationDestination)}
            >
              <Ionicons name="navigate" size={14} color="#FFFFFF" />
              <Text style={styles.startLegButtonText}>
                Bắt đầu Chặng 1 ({sortedDisplayItems[0].receiverName})
              </Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && viewMode === 'ORDER'
        ? sortedDisplayItems.map((item, index) => (
            <Card
              key={item.task.id}
              style={[styles.taskCard, index === 0 && { marginTop: theme.spacing.xs }]}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.task.id })}
            >
              {isOptimizedRoute && routeStats?.stepOrderMap[item.task.id] ? (
                <View style={styles.stepBadge}>
                  <Ionicons name="flag" size={12} color="#0369a1" />
                  <Text style={styles.stepBadgeText}>
                    CHẶNG #{routeStats.stepOrderMap[item.task.id]} • CÁCH ~{routeStats.legDistanceMap[item.task.id] ?? 0} KM
                  </Text>
                </View>
              ) : null}
              <View style={styles.taskTopRow}>
                <View style={styles.taskTitleBlock}>
                  <Text style={styles.shipmentCode}>{formatShipmentCode(item.task)}</Text>
                  <Text numberOfLines={1} style={styles.receiverName}>
                    {item.receiverName}
                  </Text>
                </View>
                <StatusBadge label={item.task.status} variant={statusVariant(item.task.status)} />
              </View>
              <View style={styles.taskMetaRow}>
                <StatusBadge label={toTaskTypeLabel(item.task.taskType)} variant="neutral" />
                <Text numberOfLines={1} style={styles.taskShipment}>
                  {item.deliveryAddress ?? item.receiverPhone ?? 'Chưa có thông tin nhận'}
                </Text>
              </View>
              <Text style={styles.taskNote}>{item.task.note ?? 'Không có ghi chú.'}</Text>
              <View style={styles.taskActionRow}>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    void handleOpenDirections(item.navigationDestination);
                  }}
                  style={({ pressed }) => [
                    styles.directionsButton,
                    !item.navigationDestination && styles.directionsButtonDisabled,
                    pressed && styles.directionsButtonPressed,
                  ]}
                >
                  <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.directionsButtonText}>Chỉ đường</Text>
                </Pressable>
              </View>
            </Card>
          ))
        : null}

      {!tasksQuery.isLoading && !tasksQuery.isError && viewMode === 'CUSTOMER'
        ? customerGroups.map((group, index) => (
            <Card
              key={group.id}
              style={[styles.customerCard, index === 0 && { marginTop: theme.spacing.xs }]}
            >
              <View style={styles.customerTopRow}>
                <View style={styles.customerTitleBlock}>
                  <Text style={styles.customerName}>{group.receiverName}</Text>
                  <Text numberOfLines={1} style={styles.customerMeta}>
                    {group.receiverPhone ?? group.deliveryAddress ?? 'Chưa có thông tin liên hệ'}
                  </Text>
                </View>
                <StatusBadge label={`${group.tasks.length} đơn`} variant="info" />
              </View>

              <View style={styles.customerActionRow}>
                <Pressable
                  onPress={() => void handleCallCustomer(group.receiverPhone)}
                  style={({ pressed }) => [
                    styles.callButton,
                    !group.receiverPhone && styles.callButtonDisabled,
                    pressed && styles.callButtonPressed,
                  ]}
                >
                  <Ionicons name="call-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.callButtonText}>Gọi khách</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleOpenDirections(group.navigationDestination)}
                  style={({ pressed }) => [
                    styles.directionsButton,
                    !group.navigationDestination && styles.directionsButtonDisabled,
                    pressed && styles.directionsButtonPressed,
                  ]}
                >
                  <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.directionsButtonText}>Chỉ đường</Text>
                </Pressable>
                <View style={styles.signModeBadge}>
                  <Ionicons name="create-outline" size={13} color={theme.colors.textSecondary} />
                  <Text style={styles.signModeText}>Ký từng đơn</Text>
                </View>
              </View>

              <View style={styles.groupShipmentList}>
                {group.tasks.map((item) => (
                  <Pressable
                    key={item.task.id}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: item.task.id })}
                    style={({ pressed }) => [
                      styles.groupShipmentRow,
                      pressed && styles.groupShipmentRowPressed,
                    ]}
                  >
                    <View style={styles.groupShipmentTextBlock}>
                      <Text style={styles.groupShipmentCode}>{formatShipmentCode(item.task)}</Text>
                      <Text numberOfLines={1} style={styles.groupShipmentMeta}>
                        {toTaskTypeLabel(item.task.taskType)}
                      </Text>
                    </View>
                    <StatusBadge
                      label={item.task.status}
                      variant={statusVariant(item.task.status)}
                    />
                  </Pressable>
                ))}
              </View>
            </Card>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  headerBlock: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    ...theme.shadow.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 0,
    marginTop: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerEyebrow: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  trackButton: {
    minHeight: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackButtonPressed: {
    opacity: 0.82,
  },
  trackButtonText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 11,
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: theme.radius.lg,
    padding: 3,
    marginTop: 2,
  },
  viewModeButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#FFFFFF',
    ...theme.shadow.sm,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  viewModeButtonPressed: {
    opacity: 0.85,
  },
  viewModeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeTextActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  filterPanel: {
    gap: theme.spacing.sm,
  },
  filterSection: {
    gap: 6,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 2,
  },
  filterLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterScrollView: {
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  filterChipRow: {
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.xl,
    paddingVertical: 2,
  },
  filterChip: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: theme.colors.primary,
  },
  filterChipPressed: {
    opacity: 0.82,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  offlineBanner: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    ...theme.shadow.sm,
  },
  offlineBannerTitle: {
    color: '#9A3412',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },
  offlineBannerText: {
    color: '#7C2D12',
    fontSize: 12,
    lineHeight: 17,
  },
  centeredState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  stateText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
  },
  errorCard: {
    borderColor: theme.colors.dangerSoft,
    backgroundColor: 'rgba(254, 226, 226, 0.4)',
    borderWidth: 1,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  taskCard: {
    marginHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    ...theme.shadow.md,
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  taskTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  shipmentCode: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  receiverName: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  taskCode: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  taskShipment: {
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
  },
  taskNote: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  taskActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  customerCard: {
    marginHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    borderRadius: theme.radius.xl,
    ...theme.shadow.md,
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  customerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  customerMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  customerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  callButton: {
    minHeight: 34,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  callButtonDisabled: {
    opacity: 0.55,
  },
  callButtonPressed: {
    opacity: 0.88,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  directionsButton: {
    minHeight: 34,
    borderRadius: theme.radius.lg,
    backgroundColor: '#2563EB',
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  directionsButtonDisabled: {
    opacity: 0.55,
  },
  directionsButtonPressed: {
    opacity: 0.88,
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  signModeBadge: {
    minHeight: 34,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  signModeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  groupShipmentList: {
    gap: theme.spacing.xs,
  },
  groupShipmentRow: {
    minHeight: 52,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  groupShipmentRowPressed: {
    opacity: 0.85,
  },
  groupShipmentTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  groupShipmentCode: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  groupShipmentMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  optimizeButton: {
    minHeight: 32,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  optimizeButtonActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  optimizeButtonPressed: {
    opacity: 0.85,
  },
  optimizeButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  optimizeButtonTextActive: {
    color: '#FFFFFF',
  },
  routeBanner: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    gap: theme.spacing.sm,
  },
  routeBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeBannerTitleBlock: {
    gap: 4,
  },
  routeBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeBannerBadgeText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  routeBannerStats: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '600',
  },
  routeBannerResetBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: '#E0F2FE',
  },
  routeBannerResetText: {
    color: '#0369a1',
    fontSize: 11,
    fontWeight: '700',
  },
  startLegButton: {
    backgroundColor: '#0284c7',
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  startLegButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    borderColor: '#7DD3FC',
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  stepBadgeText: {
    color: '#0369a1',
    fontSize: 11,
    fontWeight: '800',
  },
});
