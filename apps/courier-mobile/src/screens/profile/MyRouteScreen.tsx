import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { theme } from '../../theme';
import { courierApiClient } from '../../services/api/client';
import { courierEndpoints } from '../../services/api/endpoints';
import { useAppStore } from '../../store/appStore';
import { appEnv } from '../../utils/env';
import { resolveCourierDisplayName, resolveCourierId } from '../../utils/courier';
import { openGoogleMapsDirections, type GeoCoordinate } from '../../utils/directions';
import { calculateHaversineKm } from '../../utils/routeOptimizer';
import { useAssignedTasksQuery } from '../../features/tasks/tasks.queries';
import {
  MapView as NativeMapView,
  Marker as NativeMarker,
  Polygon as NativePolygon,
  PROVIDER_GOOGLE,
} from '../map/nativeMaps';

interface AssignedArea {
  id: string;
  courierId: string;
  hubCode: string;
  province: string;
  district: string;
  ward: string;
  zoneName?: string | null;
  colorHex?: string | null;
  boundaryPolygon?: Array<[number, number]> | null;
  isActive: boolean;
}

interface MapRegion extends GeoCoordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  const clean = (hex ?? '').replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(37, 99, 235, ${alpha})`;
}

/**
 * Kiểm tra điểm GPS có nằm trong ranh giới đa giác hay không (Ray-Casting Algorithm)
 */
function isPointInPolygon(
  point: GeoCoordinate,
  polygon: Array<[number, number]>,
): boolean {
  if (polygon.length < 3) return false;
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1];
    const yi = polygon[i][0];
    const xj = polygon[j][1];
    const yj = polygon[j][0];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const DEFAULT_REGION: MapRegion = {
  latitude: 21.033,
  longitude: 105.786,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export function MyRouteScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const courierId = resolveCourierId(appEnv.courierId, session?.user.username);
  const courierName = resolveCourierDisplayName({
    displayName: session?.user.displayName,
    username: session?.user.username,
    courierId,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedArea, setAssignedArea] = useState<AssignedArea | null>(null);
  const [courierLocation, setCourierLocation] = useState<GeoCoordinate | null>(null);
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'ready' | 'denied' | 'error'>('requesting');
  const [customFocusedRegion, setCustomFocusedRegion] = useState<MapRegion | null>(null);
  const [showVerticesList, setShowVerticesList] = useState(false);

  // Lấy các nhiệm vụ được gán cho courier để đếm số đơn trong tuyến
  const tasksQuery = useAssignedTasksQuery({
    accessToken: session?.tokens.accessToken ?? null,
    courierId,
  });
  const tasks = tasksQuery.data ?? [];

  // Tải thông tin tuyến phân công từ backend
  const fetchAreaAssignment = useCallback(async () => {
    if (!courierId || !session?.tokens.accessToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await courierApiClient.request<AssignedArea[]>(
        courierEndpoints.masterdata.areaAssignments(courierId),
        { accessToken: session.tokens.accessToken },
      );
      if (Array.isArray(res) && res.length > 0) {
        setAssignedArea(res[0]);
      } else {
        setAssignedArea(null);
      }
    } catch {
      // Giữ nguyên dữ liệu cũ nếu lỗi mạng tạm thời
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courierId, session?.tokens.accessToken]);

  useEffect(() => {
    void fetchAreaAssignment();
  }, [fetchAreaAssignment]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchAreaAssignment();
    void tasksQuery.refetch();
  }, [fetchAreaAssignment, tasksQuery]);

  // Lấy vị trí GPS hiện tại của courier
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (status !== 'granted') {
          setLocationStatus('denied');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!isMounted) return;
        setCourierLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setLocationStatus('ready');
      } catch {
        if (isMounted) setLocationStatus('error');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Danh sách tọa độ ranh giới
  const boundaryCoordinates = useMemo((): GeoCoordinate[] => {
    if (!assignedArea?.boundaryPolygon || !Array.isArray(assignedArea.boundaryPolygon)) {
      return [];
    }
    return assignedArea.boundaryPolygon.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));
  }, [assignedArea?.boundaryPolygon]);

  // Tọa độ tâm tuyến (Centroid)
  const zoneCenterCoordinate = useMemo((): GeoCoordinate | null => {
    if (boundaryCoordinates.length === 0) return null;
    const sumLat = boundaryCoordinates.reduce((s, c) => s + c.latitude, 0);
    const sumLng = boundaryCoordinates.reduce((s, c) => s + c.longitude, 0);
    return {
      latitude: sumLat / boundaryCoordinates.length,
      longitude: sumLng / boundaryCoordinates.length,
    };
  }, [boundaryCoordinates]);

  // Vùng bao quanh ranh giới tuyến để fit bản đồ
  const zoneRegion = useMemo((): MapRegion | null => {
    if (boundaryCoordinates.length === 0) return null;
    let minLat = boundaryCoordinates[0].latitude;
    let maxLat = boundaryCoordinates[0].latitude;
    let minLng = boundaryCoordinates[0].longitude;
    let maxLng = boundaryCoordinates[0].longitude;

    for (const c of boundaryCoordinates) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }

    const latDelta = Math.max((maxLat - minLat) * 1.6, 0.012);
    const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.012);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [boundaryCoordinates]);

  // Kiểm tra courier có đang nằm trong ranh giới tuyến hay không
  const isInsideGeofence = useMemo(() => {
    if (!courierLocation || !assignedArea?.boundaryPolygon) return null;
    return isPointInPolygon(courierLocation, assignedArea.boundaryPolygon);
  }, [courierLocation, assignedArea?.boundaryPolygon]);

  // Khoảng cách từ courier tới tâm tuyến
  const distanceToZoneCenterKm = useMemo(() => {
    if (!courierLocation || !zoneCenterCoordinate) return null;
    return calculateHaversineKm(courierLocation, zoneCenterCoordinate);
  }, [courierLocation, zoneCenterCoordinate]);

  const activeMapRegion = customFocusedRegion || zoneRegion || DEFAULT_REGION;
  const zoneColor = assignedArea?.colorHex || theme.colors.primary;
  const canUseNativeMap =
    Platform.OS !== 'web' && Boolean(NativeMapView && NativePolygon && NativeMarker);

  const handleFocusZone = () => {
    if (zoneRegion) {
      setCustomFocusedRegion({ ...zoneRegion });
    }
  };

  const handleFocusCourier = () => {
    if (courierLocation) {
      setCustomFocusedRegion({
        latitude: courierLocation.latitude,
        longitude: courierLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
    } else {
      Alert.alert('Chưa có vị trí', 'Đang xác định vị trí GPS của bạn hoặc chưa cấp quyền.');
    }
  };

  const handleOpenGoogleMaps = () => {
    if (zoneCenterCoordinate) {
      void openGoogleMapsDirections({
        address: `${assignedArea?.ward ?? ''}, ${assignedArea?.district ?? ''}, ${assignedArea?.province ?? ''}`,
        latitude: zoneCenterCoordinate.latitude,
        longitude: zoneCenterCoordinate.longitude,
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin tuyến phụ trách...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP STATUS CARD */}
        {assignedArea ? (
          <View style={[styles.card, styles.topInfoCard]}>
            <View style={styles.zoneHeaderRow}>
              <View style={[styles.zoneColorBadge, { backgroundColor: zoneColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.zoneNameText}>
                  {assignedArea.zoneName || 'Tuyến phụ trách'}
                </Text>
                <Text style={styles.zoneSubText}>
                  {assignedArea.ward} • {assignedArea.district} • {assignedArea.province}
                </Text>
              </View>
              <View style={[styles.hubBadge, { borderColor: zoneColor }]}>
                <Text style={[styles.hubBadgeText, { color: zoneColor }]}>
                  {assignedArea.hubCode}
                </Text>
              </View>
            </View>

            {/* Courier In/Out Geofence Status */}
            <View style={styles.geofenceStatusRow}>
              {isInsideGeofence === true ? (
                <View style={[styles.statusPill, styles.statusPillInside]}>
                  <Ionicons name="checkmark-circle" size={15} color="#059669" />
                  <Text style={styles.statusPillTextInside}>
                    Bạn đang ở bên trong ranh giới tuyến
                  </Text>
                </View>
              ) : isInsideGeofence === false ? (
                <View style={[styles.statusPill, styles.statusPillOutside]}>
                  <Ionicons name="alert-circle" size={15} color="#D97706" />
                  <Text style={styles.statusPillTextOutside}>
                    Bạn đang ở ngoài ranh giới tuyến
                    {distanceToZoneCenterKm !== null
                      ? ` (~${distanceToZoneCenterKm.toFixed(1)} km đến tâm)`
                      : ''}
                  </Text>
                </View>
              ) : (
                <View style={[styles.statusPill, styles.statusPillNeutral]}>
                  <Ionicons name="location-outline" size={15} color={theme.colors.textSecondary} />
                  <Text style={styles.statusPillTextNeutral}>
                    {locationStatus === 'denied'
                      ? 'Chưa cấp quyền GPS thiết bị'
                      : 'Đang xác định GPS...'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.emptyCard]}>
            <Ionicons name="map-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có cấu hình tuyến riêng</Text>
            <Text style={styles.emptySubtitle}>
              Tài khoản {courierName} ({courierId}) hiện đang hoạt động linh hoạt theo điều phối chung của Hub.
            </Text>
            <Pressable style={styles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.refreshBtnText}>Kiểm tra lại</Text>
            </Pressable>
          </View>
        )}

        {/* MAP CONTAINER */}
        {assignedArea && boundaryCoordinates.length >= 3 ? (
          <View style={[styles.card, styles.mapCard]}>
            <View style={styles.mapHeaderRow}>
              <View style={styles.mapHeaderLeft}>
                <Ionicons name="navigate-circle" size={18} color={zoneColor} />
                <Text style={styles.mapHeaderTitle}>Bản đồ ranh giới địa bàn</Text>
              </View>
              <Text style={styles.vertexCountText}>
                {boundaryCoordinates.length} mốc ranh giới
              </Text>
            </View>

            {/* Native Map View or Web/Fallback */}
            <View style={styles.mapWrapper}>
              {canUseNativeMap ? (
                <NativeMapView
                  style={styles.map}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  region={activeMapRegion}
                  showsUserLocation={Boolean(courierLocation)}
                  showsMyLocationButton={false}
                  loadingEnabled
                  toolbarEnabled={false}
                >
                  {/* Đường biên ranh giới (Geofence Polygon) */}
                  <NativePolygon
                    coordinates={boundaryCoordinates}
                    strokeColor={zoneColor}
                    fillColor={hexToRgba(zoneColor, 0.25)}
                    strokeWidth={3}
                  />

                  {/* Marker tâm tuyến */}
                  {zoneCenterCoordinate ? (
                    <NativeMarker
                      coordinate={zoneCenterCoordinate}
                      title={assignedArea.zoneName || 'Tâm tuyến'}
                      description={`${assignedArea.ward} • Hub ${assignedArea.hubCode}`}
                    >
                      <View style={[styles.centerMarkerBadge, { borderColor: zoneColor }]}>
                        <Ionicons name="pin" size={14} color={zoneColor} />
                        <Text style={[styles.centerMarkerText, { color: zoneColor }]}>
                          Tâm tuyến
                        </Text>
                      </View>
                    </NativeMarker>
                  ) : null}

                  {/* Marker vị trí của Courier nếu có */}
                  {courierLocation ? (
                    <NativeMarker
                      coordinate={courierLocation}
                      title="Vị trí của bạn"
                      description={
                        isInsideGeofence
                          ? 'Đang trong ranh giới tuyến'
                          : 'Ngoài ranh giới tuyến'
                      }
                    >
                      <View style={styles.courierMarkerBadge}>
                        <Ionicons name="bicycle" size={14} color="#FFFFFF" />
                      </View>
                    </NativeMarker>
                  ) : null}
                </NativeMapView>
              ) : (
                /* Fallback SVG / 2D Diagram for Web & Environments without Google Play Services */
                <View style={styles.webFallbackContainer}>
                  <View style={styles.webFallbackInner}>
                    <Ionicons name="map" size={42} color={zoneColor} />
                    <Text style={styles.webFallbackTitle}>
                      Ranh giới đa giác: {assignedArea.zoneName}
                    </Text>
                    <Text style={styles.webFallbackDesc}>
                      {assignedArea.ward}, {assignedArea.district}, {assignedArea.province}
                    </Text>
                    <View style={styles.webFallbackGrid}>
                      <View style={styles.webFallbackItem}>
                        <Text style={styles.webFallbackItemLabel}>Số mốc GPS:</Text>
                        <Text style={styles.webFallbackItemVal}>{boundaryCoordinates.length}</Text>
                      </View>
                      <View style={styles.webFallbackItem}>
                        <Text style={styles.webFallbackItemLabel}>Màu nhận diện:</Text>
                        <View
                          style={[
                            styles.webColorSwatch,
                            { backgroundColor: zoneColor },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Map Floating Actions */}
              <View style={styles.mapActionsBar}>
                <Pressable
                  style={({ pressed }) => [
                    styles.mapActionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleFocusZone}
                >
                  <Ionicons name="scan-outline" size={15} color={theme.colors.primary} />
                  <Text style={styles.mapActionText}>Căn toàn tuyến</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.mapActionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleFocusCourier}
                >
                  <Ionicons name="locate" size={15} color={theme.colors.primary} />
                  <Text style={styles.mapActionText}>Vị trí của tôi</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.mapActionButton,
                    styles.mapActionDirections,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={handleOpenGoogleMaps}
                >
                  <Ionicons name="navigate" size={15} color="#FFFFFF" />
                  <Text style={styles.mapActionTextWhite}>Chỉ đường</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {/* DETAILS & SPECIFICATIONS */}
        {assignedArea ? (
          <>
            {/* Quick Metrics */}
            <View style={styles.metricsRow}>
              <View style={[styles.card, styles.metricCard]}>
                <Text style={styles.metricNumber}>{tasks.length}</Text>
                <Text style={styles.metricLabel}>Đơn được giao</Text>
              </View>
              <View style={[styles.card, styles.metricCard]}>
                <Text style={styles.metricNumber}>{boundaryCoordinates.length}</Text>
                <Text style={styles.metricLabel}>Mốc ranh giới</Text>
              </View>
              <View style={[styles.card, styles.metricCard]}>
                <Text style={[styles.metricNumber, { color: '#059669' }]}>
                  {assignedArea.isActive ? '100%' : '0%'}
                </Text>
                <Text style={styles.metricLabel}>Ưu tiên gán</Text>
              </View>
            </View>

            {/* Dispatch Mechanism Card */}
            <View style={[styles.card, styles.infoCard]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="flash-outline" size={18} color="#D97706" />
                <Text style={styles.infoCardTitle}>Thuật toán gán đơn theo tuyến</Text>
              </View>
              <Text style={styles.infoCardDesc}>
                Hệ thống áp dụng cơ chế{' '}
                <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>
                  Point-in-Polygon Priority
                </Text>
                : Mọi đơn hàng mới phát sinh từ người gửi trong ranh giới{' '}
                <Text style={{ fontWeight: '700', color: zoneColor }}>
                  {assignedArea.ward}
                </Text>{' '}
                sẽ được ưu tiên phân bổ trực tiếp cho bạn trước khi xét các tiêu chí khoảng cách.
              </Text>
            </View>

            {/* Boundary Vertices List (Collapsible) */}
            <View style={[styles.card, styles.verticesCard]}>
              <Pressable
                style={styles.verticesHeader}
                onPress={() => setShowVerticesList(!showVerticesList)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="git-commit-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.verticesTitle}>Tọa độ các mốc ranh giới GPS</Text>
                </View>
                <Ionicons
                  name={showVerticesList ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </Pressable>

              {showVerticesList ? (
                <View style={styles.verticesList}>
                  <Text style={styles.verticesSubNote}>
                    Khung đa giác khép kín quy định phạm vi tuyến:
                  </Text>
                  {boundaryCoordinates.map((coord, idx) => (
                    <View key={idx} style={styles.vertexRow}>
                      <View style={[styles.vertexIndexBadge, { backgroundColor: zoneColor }]}>
                        <Text style={styles.vertexIndexText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.vertexCoordText}>
                        Lat: {coord.latitude.toFixed(5)} , Lng: {coord.longitude.toFixed(5)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  topInfoCard: {
    gap: theme.spacing.sm,
  },
  zoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  zoneColorBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  zoneNameText: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  zoneSubText: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  hubBadge: {
    borderWidth: 1.5,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
  },
  hubBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  geofenceStatusRow: {
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  statusPillInside: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusPillTextInside: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  statusPillOutside: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPillTextOutside: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  statusPillNeutral: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillTextNeutral: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...theme.typography.body.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    marginTop: 8,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  mapCard: {
    padding: 0,
    overflow: 'hidden',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  vertexCountText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  mapWrapper: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerMarkerBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    ...theme.shadow.sm,
  },
  centerMarkerText: {
    fontSize: 11,
    fontWeight: '800',
  },
  courierMarkerBadge: {
    backgroundColor: '#059669',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...theme.shadow.sm,
  },
  webFallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EBF3FE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  webFallbackInner: {
    alignItems: 'center',
    gap: 6,
  },
  webFallbackTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 6,
  },
  webFallbackDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  webFallbackGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  webFallbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webFallbackItemLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  webFallbackItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  webColorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  mapActionsBar: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#D8E2EE',
    ...theme.shadow.sm,
  },
  mapActionDirections: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  mapActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  mapActionTextWhite: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  metricLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  infoCard: {
    gap: 6,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  infoCardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  verticesCard: {
    padding: theme.spacing.md,
  },
  verticesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verticesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  verticesList: {
    marginTop: 12,
    gap: 8,
  },
  verticesSubNote: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  vertexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  vertexIndexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertexIndexText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  vertexCoordText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.colors.textPrimary,
  },
});
