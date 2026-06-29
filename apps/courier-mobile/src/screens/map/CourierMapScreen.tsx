import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
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
  type GeoCoordinate,
  type NavigationDestination,
} from '../../utils/directions';
import { appEnv } from '../../utils/env';
import {
  MapView as NativeMapView,
  Marker as NativeMarker,
  Polyline as NativePolyline,
  PROVIDER_GOOGLE,
} from './nativeMaps';

type LocationState = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

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
  deadlineAt: Date | null;
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

interface RouteStep {
  point: MapPoint;
  distanceFromPreviousMeters: number | null;
  clusterSize: number;
  priorityLabel: string;
}

interface SuggestedRoute {
  steps: RouteStep[];
  totalDistanceMeters: number;
  estimatedDurationMinutes: number | null;
  startsFromCurrentLocation: boolean;
}

interface MapRegion extends GeoCoordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

const MARKER_SIZE = 42;
const MAP_PADDING_PERCENT = 9;
const CLUSTER_RADII: ClusterRadiusMeters[] = [500, 1000, 2000];
const LOCATION_POLLING_INTERVAL_MS = 15_000;
const LOCATION_DISTANCE_INTERVAL_METERS = 25;
const ESTIMATED_ROUTE_SPEED_KPH = 22;
const ESTIMATED_STOP_MINUTES = 4;
const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};
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

function resolveDeadlineAt(
  taskType: TaskType,
  metadata: ShipmentMetadata | null,
): Date | null {
  const sharedPaths = [
    'deadline',
    'deadlineAt',
    'dueAt',
    'slaDeadline',
    'expectedAt',
    'promisedAt',
  ];
  const taskPaths =
    taskType === 'PICKUP'
      ? [
          'pickupDeadline',
          'pickup.deadline',
          'pickup.deadlineAt',
          'pickup.dueAt',
          'pickup.expectedAt',
          'pickup.promisedAt',
        ]
      : taskType === 'RETURN'
        ? [
            'returnDeadline',
            'return.deadline',
            'return.deadlineAt',
            'return.dueAt',
            'return.expectedAt',
            'return.promisedAt',
          ]
        : [
            'deliveryDeadline',
            'delivery.deadline',
            'delivery.deadlineAt',
            'delivery.dueAt',
            'delivery.expectedAt',
            'delivery.promisedAt',
            'promisedDeliveryAt',
          ];
  const value = readMetadataString(metadata, [...taskPaths, ...sharedPaths]);

  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function formatDuration(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) {
    return 'ETA chưa rõ';
  }

  if (minutes < 60) {
    return `ETA ~${Math.round(minutes)} phút`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  return remainingMinutes > 0
    ? `ETA ~${hours}h${remainingMinutes}p`
    : `ETA ~${hours}h`;
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

function formatDeadline(value: Date | null): string {
  if (!value) {
    return 'Không deadline';
  }

  return value.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLocationUpdatedAt(value: Date | null): string {
  if (!value) {
    return 'Chưa có GPS';
  }

  return value.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTodayLabel(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date());
}

function formatRouteSummary(steps: RouteStep[]): string {
  if (steps.length === 0) {
    return 'Chưa có tuyến';
  }

  return steps
    .slice(0, 5)
    .map((step, index) => `Điểm ${index + 1}`)
    .join(' → ');
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

function buildMapRegion(coordinates: GeoCoordinate[]): MapRegion {
  if (coordinates.length === 0) {
    return DEFAULT_MAP_REGION;
  }

  const bounds = buildCoordinateBounds(coordinates);
  if (!bounds) {
    return DEFAULT_MAP_REGION;
  }

  const latitudeDelta = Math.max((bounds.maxLat - bounds.minLat) * 1.65, 0.01);
  const longitudeDelta = Math.max((bounds.maxLng - bounds.minLng) * 1.65, 0.01);

  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLng + bounds.maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
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

function calculateRouteDistance(route: MapPoint[], currentLocation: GeoCoordinate | null): number {
  let totalDistance = 0;
  let cursor = currentLocation;
  for (const point of route) {
    if (point.coordinate) {
      if (cursor) {
        totalDistance += distanceMeters(cursor, point.coordinate);
      }
      cursor = point.coordinate;
    }
  }
  return totalDistance;
}

function isValidRouteOrder(route: MapPoint[]): boolean {
  const pickupPositions = new Map<string, number>();
  for (let i = 0; i < route.length; i++) {
    const point = route[i];
    if (point.task.taskType === 'PICKUP' && point.task.shipmentCode) {
      pickupPositions.set(point.task.shipmentCode.trim().toUpperCase(), i);
    }
  }

  for (let i = 0; i < route.length; i++) {
    const point = route[i];
    if (point.task.taskType === 'DELIVERY' && point.task.shipmentCode) {
      const code = point.task.shipmentCode.trim().toUpperCase();
      const pickupIdx = pickupPositions.get(code);
      if (pickupIdx !== undefined && pickupIdx > i) {
        return false;
      }
    }
  }
  return true;
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
    deadlineAt: resolveDeadlineAt(input.task.taskType, metadata),
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

function buildClusterSizeByPointId(clusters: SmartCluster[]): Map<string, number> {
  const clusterSizeByPointId = new Map<string, number>();

  clusters.forEach((cluster) => {
    cluster.points.forEach((point) => {
      clusterSizeByPointId.set(
        point.id,
        Math.max(clusterSizeByPointId.get(point.id) ?? 0, cluster.points.length),
      );
    });
  });

  return clusterSizeByPointId;
}

function hasPendingPickupBeforeDelivery(
  candidate: MapPoint,
  unvisited: MapPoint[],
): boolean {
  if (candidate.task.taskType !== 'DELIVERY' || !candidate.task.shipmentCode) {
    return false;
  }

  const shipmentCode = candidate.task.shipmentCode.trim().toUpperCase();

  return unvisited.some(
    (point) =>
      point.id !== candidate.id &&
      point.task.taskType === 'PICKUP' &&
      point.task.shipmentCode?.trim().toUpperCase() === shipmentCode,
  );
}

function deadlinePriorityPenalty(point: MapPoint, now: number): number {
  if (!point.deadlineAt) {
    return 0;
  }

  const hoursUntilDeadline = (point.deadlineAt.getTime() - now) / 3_600_000;

  if (hoursUntilDeadline <= 0) {
    return -2000;
  }

  if (hoursUntilDeadline <= 2) {
    return -1300;
  }

  if (hoursUntilDeadline <= 6) {
    return -700;
  }

  if (hoursUntilDeadline <= 24) {
    return -250;
  }

  return 0;
}

function pickupDeliveryPenalty(point: MapPoint): number {
  if (point.task.taskType === 'PICKUP') {
    return -200;
  }
  if (point.task.taskType === 'DELIVERY') {
    return 200;
  }
  return 0;
}

function routePriorityLabel(point: MapPoint, clusterSize: number, now: number): string {
  const labels: string[] = [];

  if (point.deadlineAt) {
    const overdue = point.deadlineAt.getTime() < now;
    labels.push(overdue ? 'Quá hạn' : `Deadline ${formatDeadline(point.deadlineAt)}`);
  }

  if (clusterSize > 1) {
    labels.push(`${clusterSize} đơn cùng cụm`);
  }

  if (point.operationAreaKey) {
    labels.push(`Khu ${point.operationAreaKey}`);
  }

  return labels.length > 0 ? labels.join(' - ') : 'Gần nhất tiếp theo';
}

function formatRouteStepMeta(step: RouteStep): string {
  const distanceLabel = !step.point.coordinate
    ? 'Thiếu tọa độ - không vẽ marker'
    : step.distanceFromPreviousMeters === null
      ? 'Điểm bắt đầu'
      : `Cách điểm trước ${formatDistance(step.distanceFromPreviousMeters)}`;

  return `${distanceLabel} - COD ${formatMoney(step.point.codAmount)}`;
}

function buildSuggestedRoute(input: {
  mapPoints: MapPoint[];
  currentLocation: GeoCoordinate | null;
  smartClusters: SmartCluster[];
  manualOrderIds: string[];
}): SuggestedRoute {
  const clusterSizeByPointId = buildClusterSizeByPointId(input.smartClusters);
  const pointById = new Map(input.mapPoints.map((point) => [point.id, point]));
  const routeCandidates = input.mapPoints.filter(
    (point) => isRouteEligiblePoint(point),
  );
  const manualSteps = input.manualOrderIds
    .map((pointId) => pointById.get(pointId) ?? null)
    .filter((point): point is MapPoint =>
      Boolean(point && isRouteEligiblePoint(point)),
    );
  const orderedPoints =
    manualSteps.length === routeCandidates.length
      ? manualSteps
      : buildAutomaticRouteOrder({
          candidates: routeCandidates,
          currentLocation: input.currentLocation,
          clusterSizeByPointId,
        });

  return buildRouteFromOrderedPoints({
    orderedPoints,
    currentLocation: input.currentLocation,
    clusterSizeByPointId,
  });
}

function isRouteEligiblePoint(point: MapPoint): boolean {
  return Boolean(
    point.task.status !== 'COMPLETED' &&
      point.task.status !== 'CANCELLED',
  );
}

function buildAutomaticRouteOrder(input: {
  candidates: MapPoint[];
  currentLocation: GeoCoordinate | null;
  clusterSizeByPointId: Map<string, number>;
}): MapPoint[] {
  const unvisited = [...input.candidates];
  const ordered: MapPoint[] = [];
  let cursor = input.currentLocation;
  const now = Date.now();

  while (unvisited.length > 0) {
    const eligible = unvisited.filter(
      (candidate) => !hasPendingPickupBeforeDelivery(candidate, unvisited),
    );
    const pool = eligible.length > 0 ? eligible : unvisited;
    const drawablePool = pool.filter((candidate) => candidate.coordinate);
    const next =
      drawablePool.length > 0
        ? drawablePool.reduce<MapPoint | null>((best, candidate) => {
            if (!candidate.coordinate) {
              return best;
            }

            if (!best?.coordinate) {
              return candidate;
            }

            const candidateDistance = cursor
              ? distanceMeters(cursor, candidate.coordinate)
              : 0;
            const bestDistance = cursor ? distanceMeters(cursor, best.coordinate) : 0;
            const candidateClusterSize = input.clusterSizeByPointId.get(candidate.id) ?? 1;
            const bestClusterSize = input.clusterSizeByPointId.get(best.id) ?? 1;
            const candidateScore =
              candidateDistance -
              Math.max(candidateClusterSize - 1, 0) * 450 +
              deadlinePriorityPenalty(candidate, now) +
              pickupDeliveryPenalty(candidate);
            const bestScore =
              bestDistance -
              Math.max(bestClusterSize - 1, 0) * 450 +
              deadlinePriorityPenalty(best, now) +
              pickupDeliveryPenalty(best);

            return candidateScore < bestScore ? candidate : best;
          }, null)
        : pool[0] ?? null;

    if (!next) {
      break;
    }

    ordered.push(next);
    cursor = next.coordinate ?? cursor;
    unvisited.splice(unvisited.findIndex((point) => point.id === next.id), 1);
  }

  return optimizeRoute2Opt(ordered, input.currentLocation);
}

function optimizeRoute2Opt(
  initialRoute: MapPoint[],
  currentLocation: GeoCoordinate | null,
): MapPoint[] {
  if (initialRoute.length <= 3) {
    return initialRoute;
  }

  let bestRoute = [...initialRoute];
  let bestDistance = calculateRouteDistance(bestRoute, currentLocation);
  let improved = true;
  let iterations = 0;
  const maxIterations = 200;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        const newRoute = bestRoute.slice(0, i)
          .concat(bestRoute.slice(i, j + 1).reverse())
          .concat(bestRoute.slice(j + 1));

        if (!isValidRouteOrder(newRoute)) {
          continue;
        }

        const newDistance = calculateRouteDistance(newRoute, currentLocation);
        if (newDistance < bestDistance - 1) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}


function buildRouteFromOrderedPoints(input: {
  orderedPoints: MapPoint[];
  currentLocation: GeoCoordinate | null;
  clusterSizeByPointId: Map<string, number>;
}): SuggestedRoute {
  let cursor = input.currentLocation;
  let totalDistanceMeters = 0;
  let drawableStepCount = 0;
  const now = Date.now();
  const steps = input.orderedPoints.map((point) => {
    const distanceFromPreviousMeters =
      cursor && point.coordinate ? distanceMeters(cursor, point.coordinate) : null;

    if (typeof distanceFromPreviousMeters === 'number') {
      totalDistanceMeters += distanceFromPreviousMeters;
    }

    if (point.coordinate) {
      drawableStepCount += 1;
      cursor = point.coordinate;
    }

    return {
      point,
      distanceFromPreviousMeters,
      clusterSize: input.clusterSizeByPointId.get(point.id) ?? 1,
      priorityLabel: routePriorityLabel(
        point,
        input.clusterSizeByPointId.get(point.id) ?? 1,
        now,
      ),
    };
  });

  return {
    steps,
    totalDistanceMeters,
    estimatedDurationMinutes:
      totalDistanceMeters > 0
        ? Math.ceil(
            (totalDistanceMeters / 1000 / ESTIMATED_ROUTE_SPEED_KPH) * 60 +
              drawableStepCount * ESTIMATED_STOP_MINUTES,
          )
        : null,
    startsFromCurrentLocation: Boolean(input.currentLocation),
  };
}

function canMoveRouteStep(
  orderedPoints: MapPoint[],
  fromIndex: number,
  toIndex: number,
): boolean {
  if (toIndex < 0 || toIndex >= orderedPoints.length) {
    return false;
  }

  const nextOrder = [...orderedPoints];
  const [movedPoint] = nextOrder.splice(fromIndex, 1);

  if (!movedPoint) {
    return false;
  }

  nextOrder.splice(toIndex, 0, movedPoint);

  return isPickupBeforeDeliveryOrder(nextOrder);
}

function isPickupBeforeDeliveryOrder(orderedPoints: MapPoint[]): boolean {
  const pickupIndexByShipment = new Map<string, number>();

  orderedPoints.forEach((point, index) => {
    if (point.task.taskType === 'PICKUP' && point.task.shipmentCode) {
      pickupIndexByShipment.set(point.task.shipmentCode.trim().toUpperCase(), index);
    }
  });

  return orderedPoints.every((point, index) => {
    if (point.task.taskType !== 'DELIVERY' || !point.task.shipmentCode) {
      return true;
    }

    const pickupIndex = pickupIndexByShipment.get(point.task.shipmentCode.trim().toUpperCase());

    return pickupIndex === undefined || pickupIndex < index;
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
  const [manualRouteOrderIds, setManualRouteOrderIds] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeoCoordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [lastLocationUpdatedAt, setLastLocationUpdatedAt] = useState<Date | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

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
  const suggestedRoute = useMemo(
    () =>
      buildSuggestedRoute({
        mapPoints,
        currentLocation,
        smartClusters,
        manualOrderIds: manualRouteOrderIds,
      }),
    [currentLocation, manualRouteOrderIds, mapPoints, smartClusters],
  );
  const defaultRoute = useMemo(
    () => {
      const candidates = mapPoints.filter(isRouteEligiblePoint);
      const clusterSizeByPointId = buildClusterSizeByPointId(smartClusters);
      return buildRouteFromOrderedPoints({
        orderedPoints: candidates,
        currentLocation,
        clusterSizeByPointId,
      });
    },
    [mapPoints, currentLocation, smartClusters]
  );
  const savedDistanceMeters = Math.max(0, defaultRoute.totalDistanceMeters - suggestedRoute.totalDistanceMeters);
  const savedMinutes = Math.max(0, (defaultRoute.estimatedDurationMinutes ?? 0) - (suggestedRoute.estimatedDurationMinutes ?? 0));
  const improvementRatio = defaultRoute.totalDistanceMeters > 0 
    ? (savedDistanceMeters / defaultRoute.totalDistanceMeters) * 100 
    : 0;
  const routePointIds = useMemo(
    () => new Set(suggestedRoute.steps.map((step) => step.point.id)),
    [suggestedRoute.steps],
  );
  const routePointNumberById = useMemo(
    () =>
      new Map(
        suggestedRoute.steps.map((step, index) => [step.point.id, index + 1]),
      ),
    [suggestedRoute.steps],
  );
  const routeMapPoints = useMemo(
    () =>
      suggestedRoute.steps
        .map((step) => step.point)
        .filter((point) => point.coordinate),
    [suggestedRoute.steps],
  );
  const routeCoordinates = useMemo(
    () =>
      suggestedRoute.steps
        .map((step) => step.point.coordinate)
        .filter((coordinate): coordinate is GeoCoordinate => Boolean(coordinate)),
    [suggestedRoute.steps],
  );
  const polylineCoordinates = useMemo(
    () => [
      ...(currentLocation ? [currentLocation] : []),
      ...routeCoordinates,
    ],
    [currentLocation, routeCoordinates],
  );
  const nativeMapRegion = useMemo(
    () => buildMapRegion(polylineCoordinates),
    [polylineCoordinates],
  );
  const selectedPoint =
    mapPoints.find((point) => point.id === selectedPointId) ?? mapPoints[0] ?? null;
  const nextRoutePoint = suggestedRoute.steps[0]?.point ?? null;
  const currentLocationPlot =
    currentLocation && coordinateBounds
      ? projectCoordinate(currentLocation, coordinateBounds)
      : { x: 12, y: 20 };
  const isShipmentLoading = shipmentQueries.some((query) => query.isLoading);
  const isRefreshing = tasksQuery.isRefetching || shipmentQueries.some((query) => query.isFetching);
  const completedCount = mapPoints.filter((point) => point.task.status === 'COMPLETED').length;
  const processingCount = mapPoints.filter((point) => point.task.status === 'ASSIGNED').length;
  const pendingCount = mapPoints.filter((point) => point.task.status === 'CREATED').length;
  const routeEligibleCount = mapPoints.filter(isRouteEligiblePoint).length;
  const missingRouteCoordinateCount =
    suggestedRoute.steps.length - routeCoordinates.length;
  const clusteredPointCount = new Set(
    smartClusters.flatMap((cluster) => cluster.points.map((point) => point.id)),
  ).size;
  const codTotal = mapPoints.reduce((total, point) => total + (point.codAmount ?? 0), 0);
  const todayLabel = formatTodayLabel();
  const canUseNativeMap =
    Platform.OS !== 'web' &&
    Boolean(NativeMapView && NativeMarker && NativePolyline);
  const locationNotice =
    locationState === 'unavailable'
      ? 'Chưa cấp quyền vị trí. Courier vẫn xem được tuyến nhưng chưa thấy vị trí hiện tại.'
      : locationState === 'error'
        ? 'Không lấy được GPS. Bấm Vị trí để thử lại.'
        : null;
  const routeNotice =
    suggestedRoute.steps.length === 0
      ? 'Chưa có nhiệm vụ active để đề xuất tuyến.'
      : routeCoordinates.length === 0
        ? 'Tuyến hiện chỉ có điểm thiếu tọa độ nên chưa vẽ marker/polyline.'
        : polylineCoordinates.length < 2
          ? 'Cần vị trí courier hoặc thêm một điểm có tọa độ để vẽ polyline.'
        : missingRouteCoordinateCount > 0
          ? `${missingRouteCoordinateCount} điểm thiếu tọa độ nên chỉ hiển thị trong danh sách.`
          : null;

  const applyCurrentLocation = useCallback((position: Location.LocationObject) => {
    setCurrentLocation({
      latitude: Number(position.coords.latitude.toFixed(6)),
      longitude: Number(position.coords.longitude.toFixed(6)),
    });
    setLastLocationUpdatedAt(new Date(position.timestamp));
    setLocationState('ready');
  }, []);

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

      applyCurrentLocation(position);
    } catch {
      setLocationState('error');
    }
  }, [applyCurrentLocation]);

  const startLocationPolling = useCallback(async () => {
    setLocationState((state) => (state === 'ready' ? state : 'loading'));

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationState('unavailable');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      applyCurrentLocation(position);
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_POLLING_INTERVAL_MS,
          distanceInterval: LOCATION_DISTANCE_INTERVAL_METERS,
        },
        applyCurrentLocation,
      );
    } catch {
      setLocationState('error');
    }
  }, [applyCurrentLocation]);

  useEffect(() => {
    void startLocationPolling();

    return () => {
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;
    };
  }, [startLocationPolling]);

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

  useEffect(() => {
    const automaticOrderIds = buildSuggestedRoute({
      mapPoints,
      currentLocation,
      smartClusters,
      manualOrderIds: [],
    }).steps.map((step) => step.point.id);

    setManualRouteOrderIds((currentOrderIds) => {
      const currentSet = new Set(currentOrderIds);
      const automaticSet = new Set(automaticOrderIds);
      const hasSameRouteIds =
        currentOrderIds.length === automaticOrderIds.length &&
        automaticOrderIds.every((pointId) => currentSet.has(pointId));

      if (hasSameRouteIds) {
        return currentOrderIds;
      }

      return [
        ...currentOrderIds.filter((pointId) => automaticSet.has(pointId)),
        ...automaticOrderIds.filter((pointId) => !currentSet.has(pointId)),
      ];
    });
  }, [currentLocation, mapPoints, smartClusters]);

  const handleRefresh = () => {
    void refreshCurrentLocation();
    void tasksQuery.refetch();
  };

  const handleOpenDirections = async (destination: NavigationDestination | null) => {
    await openGoogleMapsDirections(destination);
  };

  const handleCallContact = async (phone: string | null) => {
    const normalizedPhone = phone?.replace(/[^\d+]/g, '') ?? '';
    if (!normalizedPhone) {
      return;
    }

    await Linking.openURL(`tel:${normalizedPhone}`);
  };

  const handleSelectCluster = (cluster: SmartCluster) => {
    setSelectedClusterId(cluster.id);
    setSelectedPointId(cluster.points[0]?.id ?? null);
  };

  const handleMoveRouteStep = (fromIndex: number, direction: -1 | 1) => {
    const orderedPoints = suggestedRoute.steps.map((step) => step.point);
    const toIndex = fromIndex + direction;

    if (!canMoveRouteStep(orderedPoints, fromIndex, toIndex)) {
      return;
    }

    const nextOrder = orderedPoints.map((point) => point.id);
    const [movedPointId] = nextOrder.splice(fromIndex, 1);

    if (!movedPointId) {
      return;
    }

    nextOrder.splice(toIndex, 0, movedPointId);
    setManualRouteOrderIds(nextOrder);
  };

  const handleResetRouteOrder = () => {
    setManualRouteOrderIds([]);
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
            <Text style={styles.title}>MVP tuyến giao hôm nay</Text>
            <Text style={styles.headerSubtitle}>{todayLabel}</Text>
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

        <Card style={styles.demoCard}>
          <View style={styles.demoCardHeader}>
            <View style={styles.demoIconShell}>
              <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.demoTitleBlock}>
              <Text style={styles.demoEyebrow}>Demo đồ án logistics</Text>
              <Text style={styles.demoTitle}>4 điểm ăn tiền trên một màn hình</Text>
            </View>
          </View>
          <View style={styles.demoFeatureGrid}>
            <View style={styles.demoFeaturePill}>
              <Ionicons name="list-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.demoFeatureText}>Đơn hôm nay</Text>
            </View>
            <View style={styles.demoFeaturePill}>
              <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.demoFeatureText}>Bản đồ điểm</Text>
            </View>
            <View style={styles.demoFeaturePill}>
              <Ionicons name="navigate-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.demoFeatureText}>Chỉ đường từng đơn</Text>
            </View>
            <View style={styles.demoFeaturePill}>
              <Ionicons name="git-merge-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.demoFeatureText}>Gom cụm + tuyến</Text>
            </View>
          </View>
        </Card>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{mapPoints.length}</Text>
            <Text style={styles.summaryLabel}>đơn hôm nay</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{processingCount}</Text>
            <Text style={styles.summaryLabel}>đang xử lý</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{routeEligibleCount}</Text>
            <Text style={styles.summaryLabel}>có tuyến</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{smartClusters.length}</Text>
            <Text style={styles.summaryLabel}>nhóm gần</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{clusteredPointCount}</Text>
            <Text style={styles.summaryLabel}>đơn gom cụm</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatMoney(codTotal)}</Text>
            <Text style={styles.summaryLabel}>COD dự kiến</Text>
          </View>
        </View>

        <Card style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <View>
              <Text style={styles.mapTitle}>Tuyến hôm nay</Text>
              <Text style={styles.mapSubtitle}>
                {isShipmentLoading
                  ? 'Đang nạp địa chỉ đơn...'
                  : `${mapPoints.length} điểm, ${pendingCount} chờ nhận, ${completedCount} hoàn thành - GPS ${formatLocationUpdatedAt(lastLocationUpdatedAt)}`}
              </Text>
            </View>
            <StatusBadge
              label={locationState === 'ready' ? 'GPS live' : 'GPS pending'}
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

          {locationNotice ? (
            <View style={styles.mapNotice}>
              <Ionicons name="warning-outline" size={15} color="#B45309" />
              <Text style={styles.mapNoticeText}>{locationNotice}</Text>
              <Pressable onPress={refreshCurrentLocation} style={styles.mapNoticeAction}>
                <Text style={styles.mapNoticeActionText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}

          {routeNotice ? (
            <View style={styles.mapNotice}>
              <Ionicons name="information-circle-outline" size={15} color={theme.colors.primary} />
              <Text style={styles.mapNoticeText}>{routeNotice}</Text>
            </View>
          ) : null}

          <View style={styles.mapSurface}>
            {canUseNativeMap ? (
              <NativeMapView
                style={styles.nativeMap}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                region={nativeMapRegion}
                showsUserLocation={locationState === 'ready'}
                showsMyLocationButton
                loadingEnabled
                toolbarEnabled={false}
              >
                {polylineCoordinates.length > 1 ? (
                  <NativePolyline
                    coordinates={polylineCoordinates}
                    strokeColor={theme.colors.primary}
                    strokeWidth={5}
                    lineCap="round"
                    lineJoin="round"
                  />
                ) : null}

                {currentLocation ? (
                  <NativeMarker coordinate={currentLocation} title="Vị trí courier">
                    <View style={styles.nativeCurrentMarker}>
                      <Ionicons name="navigate" size={15} color="#FFFFFF" />
                    </View>
                  </NativeMarker>
                ) : null}

                {routeMapPoints.map((point) => {
                  if (!point.coordinate) {
                    return null;
                  }

                  const selected = selectedPoint?.id === point.id;
                  const sequenceNumber = routePointNumberById.get(point.id);

                  return (
                    <NativeMarker
                      key={point.id}
                      coordinate={point.coordinate}
                      title={point.task.shipmentCode ?? point.task.taskCode}
                      description={point.subtitle}
                      onPress={() => {
                        setSelectedPointId(point.id);
                        if (!selectedClusterPointIds.has(point.id)) {
                          setSelectedClusterId(null);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.nativeTaskMarker,
                          selected && styles.nativeTaskMarkerSelected,
                          { borderColor: statusColor(point.task.status) },
                        ]}
                      >
                        <View
                          style={[
                            styles.nativeTaskMarkerInner,
                            { backgroundColor: typeColor(point.task.taskType) },
                          ]}
                        >
                          <Text style={styles.nativeTaskMarkerText}>
                            {sequenceNumber ?? ''}
                          </Text>
                        </View>
                      </View>
                    </NativeMarker>
                  );
                })}
              </NativeMapView>
            ) : (
              <>
                <View style={styles.mapDistrictA} />
                <View style={styles.mapDistrictB} />
                <View style={styles.mapDistrictC} />
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

                {routeMapPoints.map((point) => {
                  const selected = selectedPoint?.id === point.id;
                  const clustered = selectedClusterPointIds.has(point.id);
                  const routed = routePointIds.has(point.id);
                  const sequenceNumber = routePointNumberById.get(point.id);

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
                        routed && styles.markerRouted,
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
                        <Text style={styles.markerIndex}>{sequenceNumber ?? ''}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            )}

            <View style={styles.mapStatusChipRow} pointerEvents="none">
              <View style={styles.mapStatusChip}>
                <Ionicons
                  name={locationState === 'ready' ? 'locate' : 'locate-outline'}
                  size={13}
                  color={locationState === 'ready' ? '#16A34A' : '#64748B'}
                />
                <Text style={styles.mapStatusChipText}>
                  {locationState === 'ready' ? 'GPS sẵn sàng' : 'Chưa có GPS'}
                </Text>
              </View>
              <View style={styles.mapStatusChip}>
                <Ionicons name="git-branch-outline" size={13} color={theme.colors.primary} />
                <Text style={styles.mapStatusChipText}>
                  {canUseNativeMap ? 'MapView + polyline' : 'Polyline dự phòng'}
                </Text>
              </View>
            </View>

            {nextRoutePoint ? (
              <View style={styles.nextStopSheet}>
                <View style={styles.nextStopHeader}>
                  <View style={styles.nextStopTextBlock}>
                    <Text style={styles.nextStopEyebrow}>Điểm tiếp theo</Text>
                    <Text numberOfLines={1} style={styles.nextStopTitle}>
                      {nextRoutePoint.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.nextStopNumber,
                      { backgroundColor: typeColor(nextRoutePoint.task.taskType) },
                    ]}
                  >
                    <Text style={styles.nextStopNumberText}>
                      {routePointNumberById.get(nextRoutePoint.id) ?? 1}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.nextStopAddress}>
                  {nextRoutePoint.subtitle}
                </Text>
                <View style={styles.nextStopBadgeRow}>
                  <StatusBadge
                    label={toTaskTypeLabel(nextRoutePoint.task.taskType)}
                    variant="info"
                  />
                  <StatusBadge
                    label={toTaskStatusLabel(nextRoutePoint.task.status)}
                    variant={statusVariant(nextRoutePoint.task.status)}
                  />
                </View>
                <View style={styles.nextStopActionRow}>
                  <Pressable
                    disabled={!nextRoutePoint.contact}
                    onPress={() => void handleCallContact(nextRoutePoint.contact)}
                    style={({ pressed }) => [
                      styles.nextStopSecondaryAction,
                      !nextRoutePoint.contact && styles.actionDisabled,
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <Ionicons name="call-outline" size={15} color={theme.colors.primary} />
                    <Text style={styles.nextStopSecondaryText}>Gọi</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('TaskDetail', { taskId: nextRoutePoint.task.id })
                    }
                    style={({ pressed }) => [
                      styles.nextStopSecondaryAction,
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={15} color={theme.colors.primary} />
                    <Text style={styles.nextStopSecondaryText}>Chi tiết</Text>
                  </Pressable>
                  <Pressable
                    disabled={!nextRoutePoint.destination}
                    onPress={() => void handleOpenDirections(nextRoutePoint.destination)}
                    style={({ pressed }) => [
                      styles.nextStopPrimaryAction,
                      !nextRoutePoint.destination && styles.actionDisabled,
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.nextStopPrimaryText}>Bắt đầu</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.mapEmptyOverlay}>
                <Ionicons name="map-outline" size={24} color={theme.colors.textMuted} />
                <Text style={styles.mapEmptyTitle}>Chưa có tuyến để vẽ</Text>
                <Text style={styles.mapEmptyText}>
                  Các đơn thiếu tọa độ vẫn nằm trong danh sách bên dưới.
                </Text>
              </View>
            )}
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
                            Nhóm {cluster.points.length} đơn gần nhau
                          </Text>
                          <Text style={styles.clusterItemSubtitle}>
                            Đề xuất xử lý cùng lượt trong bán kính {formatDistance(cluster.radiusMeters)}
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

        {!tasksQuery.isLoading && !tasksQuery.isError ? (
          <Card style={styles.routeCard}>
            <View style={styles.routeHeaderRow}>
              <View style={styles.routeTitleBlock}>
                <Text style={styles.routeEyebrow}>Tối ưu tuyến đường</Text>
                <Text style={styles.routeTitle}>Tuyến đề xuất</Text>
              </View>
              <Pressable
                onPress={handleResetRouteOrder}
                style={({ pressed }) => [
                  styles.routeResetButton,
                  pressed && styles.actionPressed,
                ]}
              >
                <Ionicons name="refresh-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.routeResetText}>Tự động</Text>
              </Pressable>
            </View>

            {suggestedRoute.steps.length === 0 ? (
              <View style={styles.routeEmptyState}>
                <Ionicons name="trail-sign-outline" size={22} color={theme.colors.textMuted} />
                <Text style={styles.routeEmptyTitle}>Chưa đủ dữ liệu tuyến</Text>
                <Text style={styles.routeEmptyText}>
                  Cần nhiệm vụ active để đề xuất thứ tự đi; điểm thiếu tọa độ vẫn sẽ hiện ở đây.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.routeSummaryBox}>
                  <Text style={styles.routeSummaryText}>
                    {formatRouteSummary(suggestedRoute.steps)}
                  </Text>
                  <View style={styles.routeMetricRow}>
                    <View style={styles.routeMetricPill}>
                      <Ionicons name="navigate-outline" size={13} color={theme.colors.textSecondary} />
                      <Text style={styles.routeMetricText}>
                        {formatDistance(suggestedRoute.totalDistanceMeters)}
                      </Text>
                    </View>
                    <View style={styles.routeMetricPill}>
                      <Ionicons name="time-outline" size={13} color={theme.colors.textSecondary} />
                      <Text style={styles.routeMetricText}>
                        {formatDuration(suggestedRoute.estimatedDurationMinutes)}
                      </Text>
                    </View>
                    <View style={styles.routeMetricPill}>
                      <Ionicons name="locate-outline" size={13} color={theme.colors.textSecondary} />
                      <Text style={styles.routeMetricText}>
                        {suggestedRoute.startsFromCurrentLocation ? 'Từ vị trí hiện tại' : 'Từ điểm đầu'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.evaluationBox}>
                  <View style={styles.evaluationHeader}>
                    <Ionicons name="analytics-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.evaluationTitle}>Đánh giá hiệu quả (Giai đoạn 4)</Text>
                  </View>
                  <View style={styles.evaluationRow}>
                    <Text style={styles.evaluationLabel}>Tuyến mặc định:</Text>
                    <Text style={styles.evaluationValue}>
                      {formatDistance(defaultRoute.totalDistanceMeters)}, {formatDuration(defaultRoute.estimatedDurationMinutes)}
                    </Text>
                  </View>
                  <View style={styles.evaluationRow}>
                    <Text style={styles.evaluationLabel}>Tuyến đề xuất:</Text>
                    <Text style={styles.evaluationValue}>
                      {formatDistance(suggestedRoute.totalDistanceMeters)}, {formatDuration(suggestedRoute.estimatedDurationMinutes)}
                    </Text>
                  </View>
                  <View style={styles.evaluationRow}>
                    <Text style={styles.evaluationLabel}>Tiết kiệm:</Text>
                    <Text style={styles.evaluationHighlight}>
                      {formatDistance(savedDistanceMeters)}, ~{savedMinutes} phút (Cải thiện {improvementRatio.toFixed(1)}%)
                    </Text>
                  </View>
                </View>

                <View style={styles.routeStepList}>
                  {suggestedRoute.steps.map((step, index) => {
                    const canMoveUp = canMoveRouteStep(
                      suggestedRoute.steps.map((routeStep) => routeStep.point),
                      index,
                      index - 1,
                    );
                    const canMoveDown = canMoveRouteStep(
                      suggestedRoute.steps.map((routeStep) => routeStep.point),
                      index,
                      index + 1,
                    );

                    return (
                      <Pressable
                        key={step.point.id}
                        onPress={() => setSelectedPointId(step.point.id)}
                        style={({ pressed }) => [
                          styles.routeStepRow,
                          selectedPoint?.id === step.point.id && styles.routeStepRowActive,
                          pressed && styles.pointRowPressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.routeStepNumber,
                            !step.point.coordinate && styles.routeStepNumberMuted,
                          ]}
                        >
                          <Text style={styles.routeStepNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.routeStepTextBlock}>
                          <Text numberOfLines={1} style={styles.routeStepTitle}>
                            {step.point.task.shipmentCode ?? step.point.task.taskCode}
                          </Text>
                          <Text numberOfLines={1} style={styles.routeStepSubtitle}>
                            {toTaskTypeLabel(step.point.task.taskType)} - {step.point.coordinate
                              ? step.priorityLabel
                              : 'Chưa có tọa độ'}
                          </Text>
                          <Text numberOfLines={1} style={styles.routeStepMeta}>
                            {formatRouteStepMeta(step)}
                          </Text>
                        </View>
                        <View style={styles.routeStepActions}>
                          <Pressable
                            disabled={!canMoveUp}
                            onPress={() => handleMoveRouteStep(index, -1)}
                            style={({ pressed }) => [
                              styles.routeStepActionButton,
                              !canMoveUp && styles.routeStepActionButtonDisabled,
                              pressed && styles.actionPressed,
                            ]}
                          >
                            <Ionicons
                              name="chevron-up"
                              size={16}
                              color={canMoveUp ? theme.colors.primary : theme.colors.textMuted}
                            />
                          </Pressable>
                          <Pressable
                            disabled={!canMoveDown}
                            onPress={() => handleMoveRouteStep(index, 1)}
                            style={({ pressed }) => [
                              styles.routeStepActionButton,
                              !canMoveDown && styles.routeStepActionButtonDisabled,
                              pressed && styles.actionPressed,
                            ]}
                          >
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color={canMoveDown ? theme.colors.primary : theme.colors.textMuted}
                            />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
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

        {!tasksQuery.isLoading && !tasksQuery.isError && mapPoints.length > 0 ? (
          <Card style={styles.todayListCard}>
            <View style={styles.todayListHeader}>
              <View>
                <Text style={styles.todayListEyebrow}>Danh sách đơn hôm nay</Text>
                <Text style={styles.todayListTitle}>
                  {mapPoints.length} điểm cần lấy/giao
                </Text>
              </View>
              <StatusBadge
                label={`${routeEligibleCount} có chỉ đường`}
                variant={routeEligibleCount > 0 ? 'info' : 'neutral'}
              />
            </View>

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
                    <Text numberOfLines={1} style={styles.pointAddress}>
                      {point.subtitle}
                    </Text>
                  </View>
                  <View style={styles.pointRightBlock}>
                    <StatusBadge
                      label={toTaskStatusLabel(point.task.status)}
                      variant={statusVariant(point.task.status)}
                    />
                    <Pressable
                      disabled={!point.destination}
                      onPress={() => void handleOpenDirections(point.destination)}
                      style={({ pressed }) => [
                        styles.pointDirectionButton,
                        !point.destination && styles.actionDisabled,
                        pressed && styles.actionPressed,
                      ]}
                    >
                      <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.pointDirectionText}>Đi</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}
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
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'capitalize',
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
  demoCard: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  demoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  demoIconShell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  demoEyebrow: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '900',
  },
  demoTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  demoFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  demoFeaturePill: {
    minHeight: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoFeatureText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '900',
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
  mapNotice: {
    minHeight: 38,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  mapNoticeText: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  mapNoticeAction: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapNoticeActionText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '900',
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
  nativeMap: {
    ...StyleSheet.absoluteFillObject,
  },
  nativeCurrentMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...theme.shadow.md,
  },
  nativeTaskMarker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  },
  nativeTaskMarkerSelected: {
    width: MARKER_SIZE + 8,
    height: MARKER_SIZE + 8,
    borderRadius: (MARKER_SIZE + 8) / 2,
    borderWidth: 5,
  },
  nativeTaskMarkerInner: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeTaskMarkerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  mapStatusChipRow: {
    position: 'absolute',
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    zIndex: 20,
  },
  mapStatusChip: {
    minHeight: 30,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mapStatusChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '900',
  },
  nextStopSheet: {
    position: 'absolute',
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    zIndex: 25,
    ...theme.shadow.md,
  },
  nextStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  nextStopTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  nextStopEyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nextStopTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  nextStopNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStopNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  nextStopAddress: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  nextStopBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  nextStopActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  nextStopSecondaryAction: {
    minHeight: 42,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  nextStopSecondaryText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  nextStopPrimaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextStopPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  mapEmptyOverlay: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    top: '34%',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: theme.spacing.md,
    alignItems: 'center',
    zIndex: 25,
    ...theme.shadow.sm,
  },
  mapEmptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
  mapEmptyText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 3,
  },
  mapDistrictA: {
    position: 'absolute',
    left: '-5%',
    top: '9%',
    width: '54%',
    height: '45%',
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    transform: [{ rotate: '-18deg' }],
  },
  mapDistrictB: {
    position: 'absolute',
    right: '-9%',
    top: '18%',
    width: '58%',
    height: '48%',
    borderRadius: 999,
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    transform: [{ rotate: '21deg' }],
  },
  mapDistrictC: {
    position: 'absolute',
    left: '12%',
    bottom: '-10%',
    width: '72%',
    height: '42%',
    borderRadius: 999,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
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
  markerRouted: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
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
  routeCard: {
    gap: theme.spacing.md,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  routeTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  routeEyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  routeTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  routeResetButton: {
    minHeight: 34,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  routeResetText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  routeEmptyState: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  routeEmptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: theme.spacing.xs,
  },
  routeEmptyText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  routeSummaryBox: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  routeSummaryText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
  },
  routeMetricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  routeMetricPill: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  routeMetricText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  routeStepList: {
    gap: theme.spacing.sm,
  },
  routeStepRow: {
    minHeight: 78,
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
  routeStepRowActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  routeStepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeStepNumberMuted: {
    backgroundColor: theme.colors.textMuted,
  },
  routeStepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  routeStepTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  routeStepTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  routeStepSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  routeStepMeta: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  routeStepActions: {
    gap: 5,
  },
  routeStepActionButton: {
    width: 32,
    height: 30,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeStepActionButtonDisabled: {
    opacity: 0.4,
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
  todayListCard: {
    gap: theme.spacing.md,
  },
  todayListHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  todayListEyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  todayListTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
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
  pointAddress: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  pointRightBlock: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  pointDirectionButton: {
    minHeight: 30,
    borderRadius: theme.radius.pill,
    backgroundColor: '#2563EB',
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointDirectionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  evaluationBox: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: theme.spacing.xs,
  },
  evaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  evaluationTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  evaluationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evaluationLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  evaluationValue: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  evaluationHighlight: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
});

