import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueries } from '@tanstack/react-query';

import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { shipmentApi } from '../../features/shipment/shipment.api';
import type { ShipmentDto, ShipmentMetadata } from '../../features/shipment/shipment.types';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import type { TaskDto, TaskStatus, TaskType } from '../../features/tasks/tasks.types';
import type { AppNavigatorParamList } from '../../navigation/types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';
import { resolveCourierDisplayName, resolveCourierId } from '../../utils/courier';
import {
  openGoogleMapsDirections,
  resolveShipmentNavigationDestination,
  type NavigationDestination,
} from '../../utils/directions';
import { appEnv } from '../../utils/env';

type LocationState = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

interface PlotPosition {
  x: number;
  y: number;
}

interface MapPoint {
  id: string;
  task: TaskDto;
  shipment: ShipmentDto | null;
  title: string;
  subtitle: string;
  contact: string | null;
  destination: NavigationDestination | null;
  coordinate: GeoCoordinate | null;
  plot: PlotPosition;
  codAmount: number | null;
  operationAreaKey: string | null;
  groupingBlockedReason: string | null;
}

type ClusterRadiusMeters = 500 | 1000 | 2000;

interface SmartCluster {
  id: string;
  points: MapPoint[];
  center: GeoCoordinate;
  radiusMeters: ClusterRadiusMeters;
  maxDistanceMeters: number;
  codTotal: number;
  codCount: number;
  areaLabel: string;
}

const MARKER_SIZE = 42;
const MAP_PADDING_PERCENT = 9;
const CLUSTER_RADII: ClusterRadiusMeters[] = [500, 1000, 2000];
const FALLBACK_ROUTE: PlotPosition[] = [
  { x: 16, y: 66 },
  { x: 31, y: 34 },
  { x: 47, y: 58 },
  { x: 62, y: 27 },
  { x: 78, y: 49 },
  { x: 86, y: 72 },
];

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

function readMetadataNumber(
  metadata: ShipmentMetadata | null,
  paths: string[],
): number | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function normalizeAreaKey(value: string | null): string | null {
  return value ? value.trim().toUpperCase() : null;
}

function resolveCodAmount(shipment: ShipmentDto | null): number | null {
  return shipment?.codAmount ?? readMetadataNumber(shipment?.metadata ?? null, [
    'codAmount',
    'payment.codAmount',
    'payment.cod',
    'cod.amount',
  ]);
}

function resolveOperationAreaKey(
  taskType: TaskType,
  metadata: ShipmentMetadata | null,
): string | null {
  const sharedPaths = [
    'hubCode',
    'processingHubCode',
    'assignedHubCode',
    'currentHubCode',
    'routeAreaCode',
    'areaCode',
    'zoneCode',
    'districtCode',
  ];

  if (taskType === 'PICKUP') {
    return normalizeAreaKey(readMetadataString(metadata, [
      'pickupHubCode',
      'pickup.hubCode',
      'pickup.location.hubCode',
      'originHubCode',
      'origin.hubCode',
      'pickupAreaCode',
      'pickup.areaCode',
      'sender.areaCode',
      'sender.districtCode',
      ...sharedPaths,
    ]));
  }

  if (taskType === 'RETURN') {
    return normalizeAreaKey(readMetadataString(metadata, [
      'returnHubCode',
      'return.hubCode',
      'return.location.hubCode',
      'returnAreaCode',
      'return.areaCode',
      'sender.areaCode',
      'sender.districtCode',
      ...sharedPaths,
    ]));
  }

  return normalizeAreaKey(readMetadataString(metadata, [
    'deliveryHubCode',
    'delivery.hubCode',
    'delivery.location.hubCode',
    'destinationHubCode',
    'destination.hubCode',
    'deliveryAreaCode',
    'delivery.areaCode',
    'receiver.areaCode',
    'receiver.districtCode',
    'recipient.areaCode',
    'recipient.districtCode',
    ...sharedPaths,
  ]));
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(meters >= 10_000 ? 0 : 1)}km`;
  }

  return `${Math.round(meters)}m`;
}

function formatMoney(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '0đ';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function toTaskTypeLabel(taskType: TaskType): string {
  const labels: Record<TaskType, string> = {
    PICKUP: 'Pickup',
    DELIVERY: 'Delivery',
    RETURN: 'Hoàn',
  };

  return labels[taskType];
}

function toTaskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    CREATED: 'Chờ nhận',
    ASSIGNED: 'Đang xử lý',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  return labels[status];
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

function typeColor(taskType: TaskType): string {
  if (taskType === 'PICKUP') {
    return '#F97316';
  }

  if (taskType === 'RETURN') {
    return '#0F766E';
  }

  return '#2563EB';
}

function statusColor(status: TaskStatus): string {
  if (status === 'COMPLETED') {
    return '#16A34A';
  }

  if (status === 'CANCELLED') {
    return '#DC2626';
  }

  if (status === 'ASSIGNED') {
    return '#7C3AED';
  }

  return '#F59E0B';
}

function resolvePointTitle(task: TaskDto, metadata: ShipmentMetadata | null): string {
  if (task.taskType === 'PICKUP') {
    return (
      readMetadataString(metadata, ['senderName', 'sender.name', 'merchant.name']) ??
      task.shipmentCode ??
      task.taskCode
    );
  }

  return (
    readMetadataString(metadata, [
      'receiverName',
      'receiver.name',
      'recipientName',
      'recipient.name',
    ]) ??
    task.shipmentCode ??
    task.taskCode
  );
}

function resolvePointContact(
  task: TaskDto,
  metadata: ShipmentMetadata | null,
): string | null {
  if (task.taskType === 'PICKUP') {
    return readMetadataString(metadata, ['senderPhone', 'sender.phone', 'merchant.phone']);
  }

  return readMetadataString(metadata, [
    'receiverPhone',
    'receiver.phone',
    'recipientPhone',
    'recipient.phone',
  ]);
}

function getFallbackPlot(index: number): PlotPosition {
  const base = FALLBACK_ROUTE[index % FALLBACK_ROUTE.length];
  const loopOffset = Math.floor(index / FALLBACK_ROUTE.length) * 4;

  return {
    x: Math.max(10, Math.min(90, base.x + loopOffset)),
    y: Math.max(18, Math.min(82, base.y - loopOffset)),
  };
}

function buildCoordinateBounds(
  coordinates: GeoCoordinate[],
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null {
  if (coordinates.length === 0) {
    return null;
  }

  return coordinates.reduce(
    (bounds, coordinate) => ({
      minLat: Math.min(bounds.minLat, coordinate.latitude),
      maxLat: Math.max(bounds.maxLat, coordinate.latitude),
      minLng: Math.min(bounds.minLng, coordinate.longitude),
      maxLng: Math.max(bounds.maxLng, coordinate.longitude),
    }),
    {
      minLat: coordinates[0].latitude,
      maxLat: coordinates[0].latitude,
      minLng: coordinates[0].longitude,
      maxLng: coordinates[0].longitude,
    },
  );
}

function projectCoordinate(
  coordinate: GeoCoordinate,
  bounds: NonNullable<ReturnType<typeof buildCoordinateBounds>>,
): PlotPosition {
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
  const usable = 100 - MAP_PADDING_PERCENT * 2;

  return {
    x: MAP_PADDING_PERCENT + ((coordinate.longitude - bounds.minLng) / lngRange) * usable,
    y: MAP_PADDING_PERCENT + ((bounds.maxLat - coordinate.latitude) / latRange) * usable,
  };
}

function distanceMeters(first: GeoCoordinate, second: GeoCoordinate): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6_371_000;
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLng = toRadians(second.longitude - first.longitude);
  const firstLat = toRadians(first.latitude);
  const secondLat = toRadians(second.latitude);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(firstLat) *
      Math.cos(secondLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function buildPickupCompletionByShipment(tasks: TaskDto[]): Map<string, boolean> {
  const pickupCompletion = new Map<string, boolean>();

  tasks.forEach((task) => {
    if (task.taskType !== 'PICKUP' || !task.shipmentCode) {
      return;
    }

    const shipmentCode = task.shipmentCode.trim().toUpperCase();
    const existing = pickupCompletion.get(shipmentCode);
    pickupCompletion.set(shipmentCode, Boolean(existing) || task.status === 'COMPLETED');
  });

  return pickupCompletion;
}

function resolveGroupingBlockedReason(
  task: TaskDto,
  pickupCompletionByShipment: Map<string, boolean>,
): string | null {
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    return 'Nhiệm vụ đã kết thúc';
  }

  if (task.taskType === 'DELIVERY' && task.shipmentCode) {
    const shipmentCode = task.shipmentCode.trim().toUpperCase();
    if (pickupCompletionByShipment.has(shipmentCode) && !pickupCompletionByShipment.get(shipmentCode)) {
      return 'Cần pickup trước delivery';
    }
  }

  return null;
}

function buildMapPoint(input: {
  task: TaskDto;
  shipment: ShipmentDto | null;
  index: number;
  bounds: NonNullable<ReturnType<typeof buildCoordinateBounds>> | null;
  pickupCompletionByShipment: Map<string, boolean>;
}): MapPoint {
  const metadata = input.shipment?.metadata ?? null;
  const destination = resolveShipmentNavigationDestination({
    taskType: input.task.taskType,
    metadata,
  });
  const coordinate =
    destination && destination.latitude !== null && destination.longitude !== null
      ? {
          latitude: destination.latitude,
          longitude: destination.longitude,
        }
      : null;

  return {
    id: input.task.id,
    task: input.task,
    shipment: input.shipment,
    title: resolvePointTitle(input.task, metadata),
    subtitle: destination?.address ?? input.task.note ?? 'Chưa có địa chỉ',
    contact: resolvePointContact(input.task, metadata),
    destination,
    coordinate,
    plot: coordinate && input.bounds
      ? projectCoordinate(coordinate, input.bounds)
      : getFallbackPlot(input.index),
    codAmount: resolveCodAmount(input.shipment),
    operationAreaKey: resolveOperationAreaKey(input.task.taskType, metadata),
    groupingBlockedReason: resolveGroupingBlockedReason(
      input.task,
      input.pickupCompletionByShipment,
    ),
  };
}

function canGroupTogether(first: MapPoint, second: MapPoint): boolean {
  if (first.operationAreaKey && second.operationAreaKey) {
    return first.operationAreaKey === second.operationAreaKey;
  }

  return true;
}

function averageCoordinate(points: MapPoint[]): GeoCoordinate {
  const total = points.reduce(
    (sum, point) => ({
      latitude: sum.latitude + (point.coordinate?.latitude ?? 0),
      longitude: sum.longitude + (point.coordinate?.longitude ?? 0),
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: total.latitude / points.length,
    longitude: total.longitude / points.length,
  };
}

function buildSmartClusters(
  mapPoints: MapPoint[],
  radiusMeters: ClusterRadiusMeters,
): SmartCluster[] {
  const candidates = mapPoints.filter(
    (point) => point.coordinate && !point.groupingBlockedReason,
  );
  const usedPointIds = new Set<string>();
  const clusters: SmartCluster[] = [];

  candidates.forEach((seed) => {
    if (!seed.coordinate || usedPointIds.has(seed.id)) {
      return;
    }

    const seedCoordinate = seed.coordinate;
    const points = candidates.filter((candidate) => {
      if (!candidate.coordinate || usedPointIds.has(candidate.id)) {
        return false;
      }

      return (
        canGroupTogether(seed, candidate) &&
        distanceMeters(seedCoordinate, candidate.coordinate) <= radiusMeters
      );
    });

    if (points.length < 2) {
      return;
    }

    const center = averageCoordinate(points);
    const maxDistanceMeters = points.reduce((maxDistance, point) => {
      if (!point.coordinate) {
        return maxDistance;
      }

      return Math.max(maxDistance, distanceMeters(center, point.coordinate));
    }, 0);
    const codTotal = points.reduce((total, point) => total + (point.codAmount ?? 0), 0);
    const codCount = points.filter((point) => (point.codAmount ?? 0) > 0).length;
    const areaKey = points.find((point) => point.operationAreaKey)?.operationAreaKey;

    points.forEach((point) => usedPointIds.add(point.id));
    clusters.push({
      id: `${radiusMeters}:${points.map((point) => point.id).join('|')}`,
      points,
      center,
      radiusMeters,
      maxDistanceMeters,
      codTotal,
      codCount,
      areaLabel: areaKey ? `Khu vực ${areaKey}` : 'Cùng khu vực gần nhau',
    });
  });

  return clusters.sort((first, second) => {
    if (second.points.length !== first.points.length) {
      return second.points.length - first.points.length;
    }

    return first.maxDistanceMeters - second.maxDistanceMeters;
  });
}

export function CourierMapScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppNavigatorParamList>>();
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const courierName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [clusterRadius, setClusterRadius] = useState<ClusterRadiusMeters>(1000);
  const [currentLocation, setCurrentLocation] = useState<GeoCoordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');

  const tasks = tasksQuery.data ?? [];
  const shipmentCodes = useMemo(
    () =>
      Array.from(
        new Set(
          tasks
            .map((task) => task.shipmentCode?.trim())
            .filter((shipmentCode): shipmentCode is string => Boolean(shipmentCode)),
        ),
      ),
    [tasks],
  );
  const shipmentQueries = useQueries({
    queries: shipmentCodes.map((shipmentCode) => ({
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

    shipmentCodes.forEach((shipmentCode, index) => {
      const shipment = shipmentQueries[index]?.data;
      if (shipment) {
        shipments.set(shipmentCode, shipment);
      }
    });

    return shipments;
  }, [shipmentCodes, shipmentQueries]);
  const coordinateBounds = useMemo(() => {
    const coordinates = tasks
      .map((task) => {
        const shipment = task.shipmentCode
          ? shipmentByCode.get(task.shipmentCode) ?? null
          : null;
        const destination = resolveShipmentNavigationDestination({
          taskType: task.taskType,
          metadata: shipment?.metadata ?? null,
        });

        if (destination && destination.latitude !== null && destination.longitude !== null) {
          return {
            latitude: destination.latitude,
            longitude: destination.longitude,
          };
        }

        return null;
      })
      .filter((coordinate): coordinate is GeoCoordinate => Boolean(coordinate));

    if (currentLocation) {
      coordinates.push(currentLocation);
    }

    return buildCoordinateBounds(coordinates);
  }, [currentLocation, shipmentByCode, tasks]);
  const pickupCompletionByShipment = useMemo(
    () => buildPickupCompletionByShipment(tasks),
    [tasks],
  );
  const mapPoints = useMemo(
    () =>
      tasks.map((task, index) =>
        buildMapPoint({
          task,
          shipment: task.shipmentCode
            ? shipmentByCode.get(task.shipmentCode) ?? null
            : null,
          index,
          bounds: coordinateBounds,
          pickupCompletionByShipment,
        }),
      ),
    [coordinateBounds, pickupCompletionByShipment, shipmentByCode, tasks],
  );
  const smartClusters = useMemo(
    () => buildSmartClusters(mapPoints, clusterRadius),
    [clusterRadius, mapPoints],
  );
  const selectedCluster =
    smartClusters.find((cluster) => cluster.id === selectedClusterId) ?? null;
  const selectedClusterPointIds = useMemo(
    () => new Set(selectedCluster?.points.map((point) => point.id) ?? []),
    [selectedCluster],
  );
  const selectedPoint =
    mapPoints.find((point) => point.id === selectedPointId) ?? mapPoints[0] ?? null;
  const currentLocationPlot =
    currentLocation && coordinateBounds
      ? projectCoordinate(currentLocation, coordinateBounds)
      : { x: 12, y: 20 };
  const isShipmentLoading = shipmentQueries.some((query) => query.isLoading);
  const isRefreshing = tasksQuery.isRefetching || shipmentQueries.some((query) => query.isFetching);
  const completedCount = mapPoints.filter((point) => point.task.status === 'COMPLETED').length;
  const processingCount = mapPoints.filter((point) => point.task.status === 'ASSIGNED').length;

  const refreshCurrentLocation = useCallback(async () => {
    setLocationState('loading');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationState('unavailable');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationState('ready');
    } catch {
      setLocationState('error');
    }
  }, []);

  useEffect(() => {
    void refreshCurrentLocation();
  }, [refreshCurrentLocation]);

  useEffect(() => {
    if (!selectedPointId && mapPoints.length > 0) {
      setSelectedPointId(mapPoints[0].id);
    }
  }, [mapPoints, selectedPointId]);

  useEffect(() => {
    if (selectedClusterId && !smartClusters.some((cluster) => cluster.id === selectedClusterId)) {
      setSelectedClusterId(null);
    }
  }, [selectedClusterId, smartClusters]);

  const handleRefresh = () => {
    void refreshCurrentLocation();
    void tasksQuery.refetch();
  };

  const handleOpenDirections = async (destination: NavigationDestination | null) => {
    await openGoogleMapsDirections(destination);
  };

  const handleSelectCluster = (cluster: SmartCluster) => {
    setSelectedClusterId(cluster.id);
    setSelectedPointId(cluster.points[0]?.id ?? null);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.eyebrow}>{courierName} - {courierId}</Text>
            <Text style={styles.title}>Bản đồ giao hàng</Text>
          </View>
          <Pressable
            onPress={refreshCurrentLocation}
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.locationButtonPressed,
            ]}
          >
            {locationState === 'loading' ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="locate-outline" size={16} color={theme.colors.primary} />
            )}
            <Text style={styles.locationButtonText}>Vị trí</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{mapPoints.length}</Text>
            <Text style={styles.summaryLabel}>điểm</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{processingCount}</Text>
            <Text style={styles.summaryLabel}>đang xử lý</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completedCount}</Text>
            <Text style={styles.summaryLabel}>hoàn thành</Text>
          </View>
        </View>

        <Card style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <View>
              <Text style={styles.mapTitle}>Tuyến hôm nay</Text>
              <Text style={styles.mapSubtitle}>
                {isShipmentLoading ? 'Đang nạp địa chỉ đơn...' : 'Pickup, delivery và trạng thái'}
              </Text>
            </View>
            <StatusBadge
              label={locationState === 'ready' ? 'GPS ready' : 'GPS pending'}
              variant={locationState === 'ready' ? 'success' : 'neutral'}
            />
          </View>

          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: typeColor('PICKUP') }]} />
              <Text style={styles.legendText}>Pickup</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: typeColor('DELIVERY') }]} />
              <Text style={styles.legendText}>Delivery</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendRing, { borderColor: statusColor('COMPLETED') }]} />
              <Text style={styles.legendText}>Đã hoàn thành</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendRing, { borderColor: statusColor('ASSIGNED') }]} />
              <Text style={styles.legendText}>Đang xử lý</Text>
            </View>
          </View>

          <View style={styles.mapSurface}>
            <View style={[styles.gridLineVertical, { left: '25%' }]} />
            <View style={[styles.gridLineVertical, { left: '50%' }]} />
            <View style={[styles.gridLineVertical, { left: '75%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '33%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '66%' }]} />
            <View style={styles.routeRibbon} />

            {currentLocation ? (
              <View
                style={[
                  styles.currentLocationMarker,
                  {
                    left: `${currentLocationPlot.x}%`,
                    top: `${currentLocationPlot.y}%`,
                  },
                ]}
              >
                <View style={styles.currentLocationPulse} />
                <Ionicons name="navigate" size={15} color="#FFFFFF" />
              </View>
            ) : (
              <View
                style={[
                  styles.currentLocationMarker,
                  styles.currentLocationMarkerMuted,
                  {
                    left: `${currentLocationPlot.x}%`,
                    top: `${currentLocationPlot.y}%`,
                  },
                ]}
              >
                <Ionicons name="locate-outline" size={15} color="#FFFFFF" />
              </View>
            )}

            {mapPoints.map((point, index) => {
              const selected = selectedPoint?.id === point.id;
              const clustered = selectedClusterPointIds.has(point.id);

              return (
                <Pressable
                  key={point.id}
                  onPress={() => {
                    setSelectedPointId(point.id);
                    if (!clustered) {
                      setSelectedClusterId(null);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.marker,
                    clustered && styles.markerClustered,
                    selected && styles.markerSelected,
                    pressed && styles.markerPressed,
                    {
                      left: `${point.plot.x}%`,
                      top: `${point.plot.y}%`,
                      borderColor: statusColor(point.task.status),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.markerInner,
                      { backgroundColor: typeColor(point.task.taskType) },
                    ]}
                  >
                    <Text style={styles.markerIndex}>{index + 1}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {!tasksQuery.isLoading && !tasksQuery.isError ? (
          <Card style={styles.clusterCard}>
            <View style={styles.clusterHeaderRow}>
              <View style={styles.clusterTitleBlock}>
                <Text style={styles.clusterEyebrow}>Gợi ý thông minh</Text>
                <Text style={styles.clusterTitle}>Gom đơn gần nhau</Text>
              </View>
              <StatusBadge
                label={`${smartClusters.length} nhóm`}
                variant={smartClusters.length > 0 ? 'info' : 'neutral'}
              />
            </View>

            <View style={styles.radiusControl}>
              {CLUSTER_RADII.map((radius) => {
                const active = clusterRadius === radius;

                return (
                  <Pressable
                    key={radius}
                    onPress={() => setClusterRadius(radius)}
                    style={({ pressed }) => [
                      styles.radiusButton,
                      active && styles.radiusButtonActive,
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.radiusButtonText,
                        active && styles.radiusButtonTextActive,
                      ]}
                    >
                      {formatDistance(radius)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {smartClusters.length === 0 ? (
              <View style={styles.clusterEmptyState}>
                <Ionicons name="git-merge-outline" size={22} color={theme.colors.textMuted} />
                <Text style={styles.clusterEmptyTitle}>Chưa có cụm phù hợp</Text>
                <Text style={styles.clusterEmptyText}>
                  Cần ít nhất 2 đơn có tọa độ, đúng thứ tự pickup/delivery và cùng khu vực khi có dữ liệu hub.
                </Text>
              </View>
            ) : (
              <View style={styles.clusterList}>
                {smartClusters.map((cluster) => {
                  const active = selectedCluster?.id === cluster.id;
                  const firstPoint = cluster.points[0] ?? null;

                  return (
                    <Pressable
                      key={cluster.id}
                      onPress={() => handleSelectCluster(cluster)}
                      style={({ pressed }) => [
                        styles.clusterItem,
                        active && styles.clusterItemActive,
                        pressed && styles.pointRowPressed,
                      ]}
                    >
                      <View style={styles.clusterItemTop}>
                        <View style={styles.clusterCountBadge}>
                          <Text style={styles.clusterCountText}>{cluster.points.length}</Text>
                        </View>
                        <View style={styles.clusterItemTextBlock}>
                          <Text style={styles.clusterItemTitle}>
                            {cluster.points.length} đơn gần khu vực này
                          </Text>
                          <Text style={styles.clusterItemSubtitle}>
                            Gần đây có thêm {Math.max(cluster.points.length - 1, 1)} đơn, xử lý cùng lượt trong {formatDistance(cluster.radiusMeters)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.clusterMetaRow}>
                        <View style={styles.clusterMetaPill}>
                          <Ionicons name="map-outline" size={13} color={theme.colors.textSecondary} />
                          <Text style={styles.clusterMetaText}>
                            {cluster.areaLabel} - xa nhất {formatDistance(cluster.maxDistanceMeters)}
                          </Text>
                        </View>
                        <View style={styles.clusterMetaPill}>
                          <Ionicons name="cash-outline" size={13} color={theme.colors.textSecondary} />
                          <Text style={styles.clusterMetaText}>
                            COD {formatMoney(cluster.codTotal)} ({cluster.codCount} đơn)
                          </Text>
                        </View>
                      </View>

                      {active ? (
                        <View style={styles.clusterDetailList}>
                          {cluster.points.map((point) => (
                            <Pressable
                              key={point.id}
                              onPress={() => setSelectedPointId(point.id)}
                              style={({ pressed }) => [
                                styles.clusterPointRow,
                                selectedPoint?.id === point.id && styles.clusterPointRowActive,
                                pressed && styles.pointRowPressed,
                              ]}
                            >
                              <View
                                style={[
                                  styles.clusterPointDot,
                                  { backgroundColor: typeColor(point.task.taskType) },
                                ]}
                              />
                              <View style={styles.clusterPointTextBlock}>
                                <Text numberOfLines={1} style={styles.clusterPointTitle}>
                                  {point.task.shipmentCode ?? point.task.taskCode}
                                </Text>
                                <Text numberOfLines={1} style={styles.clusterPointSubtitle}>
                                  {toTaskTypeLabel(point.task.taskType)} - {formatMoney(point.codAmount)}
                                </Text>
                              </View>
                              <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={theme.colors.textMuted}
                              />
                            </Pressable>
                          ))}
                          {firstPoint ? (
                            <View style={styles.actionRow}>
                              <Pressable
                                onPress={() =>
                                  navigation.navigate('TaskDetail', { taskId: firstPoint.task.id })
                                }
                                style={({ pressed }) => [
                                  styles.secondaryAction,
                                  pressed && styles.actionPressed,
                                ]}
                              >
                                <Ionicons
                                  name="document-text-outline"
                                  size={15}
                                  color={theme.colors.primary}
                                />
                                <Text style={styles.secondaryActionText}>Xem điểm đầu</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => void handleOpenDirections(firstPoint.destination)}
                                style={({ pressed }) => [
                                  styles.primaryAction,
                                  !firstPoint.destination && styles.actionDisabled,
                                  pressed && styles.actionPressed,
                                ]}
                              >
                                <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />
                                <Text style={styles.primaryActionText}>Đi điểm đầu</Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>
        ) : null}

        {tasksQuery.isLoading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.stateText}>Đang tải nhiệm vụ trên bản đồ...</Text>
          </View>
        ) : null}

        {tasksQuery.isError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>
              {tasksQuery.error instanceof Error
                ? tasksQuery.error.message
                : 'Không tải được nhiệm vụ bản đồ.'}
            </Text>
            <Pressable onPress={() => void tasksQuery.refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          </Card>
        ) : null}

        {!tasksQuery.isLoading && !tasksQuery.isError && mapPoints.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="map-outline" size={28} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có đơn trên bản đồ</Text>
            <Text style={styles.stateText}>Kéo để làm mới khi có nhiệm vụ mới.</Text>
          </Card>
        ) : null}

        {selectedPoint ? (
          <Card style={styles.detailCard}>
            <View style={styles.detailTopRow}>
              <View style={styles.detailTitleBlock}>
                <Text style={styles.detailEyebrow}>
                  {toTaskTypeLabel(selectedPoint.task.taskType)} - {selectedPoint.task.taskCode}
                </Text>
                <Text style={styles.detailTitle}>
                  {selectedPoint.task.shipmentCode ?? 'Chưa có mã vận đơn'}
                </Text>
              </View>
              <StatusBadge
                label={toTaskStatusLabel(selectedPoint.task.status)}
                variant={statusVariant(selectedPoint.task.status)}
              />
            </View>
            <Text style={styles.detailName}>{selectedPoint.title}</Text>
            <Text style={styles.detailAddress}>{selectedPoint.subtitle}</Text>
            <View style={styles.detailMetaRow}>
              <Ionicons name="call-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.detailMetaText}>
                {selectedPoint.contact ?? 'Chưa có số liên hệ'}
              </Text>
            </View>
            <View style={styles.detailMetaRow}>
              <Ionicons name="cash-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.detailMetaText}>
                COD {formatMoney(selectedPoint.codAmount)}
              </Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() =>
                  navigation.navigate('TaskDetail', { taskId: selectedPoint.task.id })
                }
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons name="document-text-outline" size={15} color={theme.colors.primary} />
                <Text style={styles.secondaryActionText}>Chi tiết đơn</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleOpenDirections(selectedPoint.destination)}
                style={({ pressed }) => [
                  styles.primaryAction,
                  !selectedPoint.destination && styles.actionDisabled,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Đi tới điểm này</Text>
              </Pressable>
            </View>
          </Card>
        ) : null}

        <View style={styles.pointList}>
          {mapPoints.map((point, index) => (
            <Pressable
              key={point.id}
              onPress={() => setSelectedPointId(point.id)}
              style={({ pressed }) => [
                styles.pointRow,
                selectedPoint?.id === point.id && styles.pointRowActive,
                pressed && styles.pointRowPressed,
              ]}
            >
              <View
                style={[
                  styles.pointNumber,
                  {
                    backgroundColor: typeColor(point.task.taskType),
                    borderColor: statusColor(point.task.status),
                  },
                ]}
              >
                <Text style={styles.pointNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.pointTextBlock}>
                <Text numberOfLines={1} style={styles.pointTitle}>
                  {point.task.shipmentCode ?? point.task.taskCode}
                </Text>
                <Text numberOfLines={1} style={styles.pointSubtitle}>
                  {toTaskTypeLabel(point.task.taskType)} - COD {formatMoney(point.codAmount)}
                </Text>
              </View>
              <StatusBadge
                label={toTaskStatusLabel(point.task.status)}
                variant={statusVariant(point.task.status)}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  locationButton: {
    minHeight: 38,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  locationButtonPressed: {
    opacity: 0.86,
  },
  locationButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryItem: {
    flex: 1,
    minHeight: 70,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.sm,
  },
  summaryValue: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  mapCard: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  mapTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  mapSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  legendItem: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
  },
  legendText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  mapSurface: {
    height: 360,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EAF3FF',
    overflow: 'hidden',
    position: 'relative',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  routeRibbon: {
    position: 'absolute',
    left: '12%',
    right: '10%',
    top: '48%',
    height: 44,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    transform: [{ rotate: '-11deg' }],
  },
  currentLocationMarker: {
    position: 'absolute',
    width: 34,
    height: 34,
    marginLeft: -17,
    marginTop: -17,
    borderRadius: 17,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 8,
    ...theme.shadow.md,
  },
  currentLocationMarkerMuted: {
    backgroundColor: '#64748B',
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(17, 24, 39, 0.14)',
  },
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    marginLeft: -(MARKER_SIZE / 2),
    marginTop: -(MARKER_SIZE / 2),
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...theme.shadow.md,
  },
  markerSelected: {
    width: MARKER_SIZE + 8,
    height: MARKER_SIZE + 8,
    marginLeft: -((MARKER_SIZE + 8) / 2),
    marginTop: -((MARKER_SIZE + 8) / 2),
    borderWidth: 5,
  },
  markerClustered: {
    borderColor: '#14B8A6',
    backgroundColor: '#CCFBF1',
  },
  markerPressed: {
    opacity: 0.84,
  },
  markerInner: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIndex: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  clusterCard: {
    gap: theme.spacing.md,
  },
  clusterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  clusterTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  clusterEyebrow: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
  },
  clusterTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  radiusControl: {
    minHeight: 42,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  radiusButton: {
    flex: 1,
    minHeight: 32,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#0F766E',
    ...theme.shadow.sm,
  },
  radiusButtonText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  radiusButtonTextActive: {
    color: '#FFFFFF',
  },
  clusterEmptyState: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  clusterEmptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
  clusterEmptyText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  clusterList: {
    gap: theme.spacing.sm,
  },
  clusterItem: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    backgroundColor: '#F0FDFA',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  clusterItemActive: {
    borderColor: '#0F766E',
    backgroundColor: '#ECFDF5',
  },
  clusterItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  clusterCountBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterCountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  clusterItemTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  clusterItemTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  clusterItemSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  clusterMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  clusterMetaPill: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clusterMetaText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  clusterDetailList: {
    gap: theme.spacing.xs,
  },
  clusterPointRow: {
    minHeight: 48,
    borderRadius: theme.radius.sm,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  clusterPointRowActive: {
    backgroundColor: '#DBEAFE',
  },
  clusterPointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  clusterPointTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  clusterPointTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  clusterPointSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  centeredState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  stateText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  errorCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: theme.colors.danger,
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
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  detailCard: {
    gap: theme.spacing.sm,
  },
  detailTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  detailTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  detailEyebrow: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  detailName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  detailAddress: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailMetaText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.md,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  actionPressed: {
    opacity: 0.86,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  secondaryActionText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  pointList: {
    gap: theme.spacing.sm,
  },
  pointRow: {
    minHeight: 64,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  pointRowActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  pointRowPressed: {
    opacity: 0.88,
  },
  pointNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  pointTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  pointTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  pointSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
