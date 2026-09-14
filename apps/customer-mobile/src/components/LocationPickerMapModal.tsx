import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import {
  DEFAULT_HUB_RECORDS,
  masterdataApi,
  type HubRecord,
} from '../services/api/masterdata.api';
import {
  locationService,
  type GeocodedAddressResult,
  type LocationCoordinates,
} from '../services/locationService';
import { colors, shadows, spacing } from '../theme';

interface LocationPickerMapModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmLocation: (result: {
    province: string;
    ward: string;
    district?: string;
    street: string;
    composedAddress: string;
    hubCode: string;
    hubName: string;
    latitude: number;
    longitude: number;
  }) => void;
  accessToken?: string;
}

export function LocationPickerMapModal({
  visible,
  onClose,
  onConfirmLocation,
  accessToken,
}: LocationPickerMapModalProps): React.JSX.Element {
  const webViewRef = useRef<WebView | null>(null);
  const pendingCoordsRef = useRef<LocationCoordinates | null>(null);

  const [coords, setCoords] = useState<LocationCoordinates>({
    latitude: 10.867, // An Phú Đông Default
    longitude: 106.696,
  });
  const [geocoded, setGeocoded] = useState<GeocodedAddressResult | null>(null);
  const [hubList, setHubList] = useState<HubRecord[]>(DEFAULT_HUB_RECORDS);
  const [selectedHub, setSelectedHub] = useState<HubRecord | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  // Helper: Inject JavaScript to move Leaflet map center seamlessly without reloading HTML
  const sendCenterToMap = (lat: number, lng: number) => {
    pendingCoordsRef.current = { latitude: lat, longitude: lng };
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.setMapCenter) { window.setMapCenter(${lat}, ${lng}); } true;`,
      );
    }
  };

  // Fetch hubs list from masterdata
  useEffect(() => {
    if (!visible) return;
    masterdataApi.getHubs(accessToken).then((res) => {
      if (Array.isArray(res) && res.length > 0) setHubList(res);
    });
  }, [visible]);

  // Request GPS & set initial coordinates on modal open
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;

    const initGps = async () => {
      setLoadingLocation(true);
      const loc = await locationService.getCurrentLocation();
      if (isMounted && loc) {
        setCoords(loc);
        pendingCoordsRef.current = loc;
        await updateAddressForCoords(loc.latitude, loc.longitude);
        sendCenterToMap(loc.latitude, loc.longitude);
      }
      if (isMounted) setLoadingLocation(false);
    };

    initGps();
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Reverse geocode & match Hub
  const updateAddressForCoords = async (lat: number, lng: number) => {
    setResolvingAddress(true);
    try {
      const res = await locationService.reverseGeocode(lat, lng);
      setGeocoded(res);

      const normProv = (res.province || '').toLowerCase().replace(/^(tỉnh|thành phố)\s+/, '');
      const foundHub = hubList.find((h) => {
        const normH = (h.province || '').toLowerCase();
        return normH.includes(normProv) || normProv.includes(normH);
      });
      setSelectedHub(foundHub || hubList[0] || DEFAULT_HUB_RECORDS[0]);
    } catch {
      // Ignore errors
    } finally {
      setResolvingAddress(false);
    }
  };

  const handleRecenterGps = async () => {
    setLoadingLocation(true);
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setCoords(loc);
        sendCenterToMap(loc.latitude, loc.longitude);
        await updateAddressForCoords(loc.latitude, loc.longitude);
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  // Handle messages from Leaflet map WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        if (pendingCoordsRef.current) {
          sendCenterToMap(pendingCoordsRef.current.latitude, pendingCoordsRef.current.longitude);
        }
      }
      if (data.type === 'MOVE_END' && data.lat && data.lng) {
        // Update local address and coords state WITHOUT causing WebView HTML reload
        setCoords({ latitude: data.lat, longitude: data.lng });
        updateAddressForCoords(data.lat, data.lng);
      }
    } catch {
      // Ignore invalid JSON
    }
  };

  const handleConfirm = () => {
    if (!geocoded) return;
    const hub = selectedHub || DEFAULT_HUB_RECORDS[0];
    onConfirmLocation({
      province: geocoded.province,
      ward: geocoded.ward,
      district: geocoded.district || '',
      street: geocoded.street,
      composedAddress: geocoded.composedAddress,
      hubCode: hub.code,
      hubName: hub.name,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    onClose();
  };

  // Stable Memoized Leaflet HTML string - NEVER re-created when coords state updates
  const mapHtml = useMemo(
    () => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #e2e8f0; }
    .center-pin {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
      filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.35));
    }
    .pin-shadow {
      width: 14px;
      height: 6px;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -2px);
      z-index: 999;
      pointer-events: none;
    }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="pin-shadow"></div>
  <div class="center-pin">
    <svg width="44" height="44" viewBox="0 0 24 24" fill="#1D4ED8" stroke="#ffffff" stroke-width="1.6">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([10.867, 106.696], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    window.leafletMap = map;

    window.setMapCenter = function(lat, lng) {
      if (window.leafletMap) {
        window.leafletMap.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
      }
    };

    function sendCenter() {
      var center = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MOVE_END',
          lat: center.lat,
          lng: center.lng
        }));
      }
    }

    map.on('moveend', sendCenter);

    setTimeout(function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    }, 250);
  </script>
</body>
</html>`,
    [visible],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="location" size={22} color={colors.primary} />
              <Text style={styles.headerTitle}>Chọn vị trí GPS trên bản đồ</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* REAL INTERACTIVE MAP CANVAS */}
          <View style={styles.mapCanvasContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              onMessage={handleWebViewMessage}
              onLoadEnd={() => {
                if (pendingCoordsRef.current) {
                  sendCenterToMap(pendingCoordsRef.current.latitude, pendingCoordsRef.current.longitude);
                }
              }}
              style={styles.webViewMap}
              javaScriptEnabled
              domStorageEnabled
            />

            {/* FLOATING GPS RE-CENTER BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.floatingGpsBtn}
              onPress={handleRecenterGps}
            >
              <Ionicons name="locate" size={20} color={colors.primary} />
              <Text style={styles.floatingGpsText}>GPS hiện tại</Text>
            </TouchableOpacity>

            {loadingLocation ? (
              <View style={styles.mapLoadingBadge}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.mapLoadingText}>Đang định vị GPS...</Text>
              </View>
            ) : null}
          </View>

          {/* BOTTOM PREVIEW CARD */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeaderRow}>
              <Ionicons name="navigate-circle" size={20} color={colors.primary} />
              <Text style={styles.previewTitle}>Địa chỉ giải mã từ vị trí bản đồ</Text>
              {resolvingAddress ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
              ) : null}
            </View>

            {geocoded ? (
              <View style={styles.addressInfoBlock}>
                <Text style={styles.composedAddressText}>{geocoded.composedAddress}</Text>
                <View style={styles.hubMatchRow}>
                  <Ionicons name="business" size={15} color={colors.primary} />
                  <Text style={styles.hubMatchText}>
                    Bưu cục phục vụ:{' '}
                    <Text style={styles.boldHubText}>
                      {selectedHub?.name || 'Bưu cục Trung tâm'}
                    </Text>{' '}
                    [{selectedHub?.code || 'HUB-MAIN'}]
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.loadingText}>Đang định vị địa chỉ...</Text>
            )}

            {/* CONFIRM BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.confirmBtn, (!geocoded || resolvingAddress) && styles.confirmBtnDisabled]}
              disabled={!geocoded || resolvingAddress}
              onPress={handleConfirm}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
              <Text style={styles.confirmBtnText}>Xác nhận vị trí này</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: 540,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  mapCanvasContainer: {
    height: 280,
    backgroundColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
  },
  webViewMap: {
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  floatingGpsBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  floatingGpsText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  mapLoadingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    ...shadows.sm,
  },
  mapLoadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  previewCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addressInfoBlock: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  composedAddressText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  hubMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  hubMatchText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  boldHubText: {
    fontWeight: '800',
    color: colors.primary,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...shadows.sm,
  },
  confirmBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },
});
