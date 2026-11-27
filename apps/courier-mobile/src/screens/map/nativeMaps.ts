import React from 'react';
import { Platform } from 'react-native';
import type MapViewType from 'react-native-maps';
import type {
  Marker as MarkerType,
  Polyline as PolylineType,
  Polygon as PolygonType,
} from 'react-native-maps';

/**
 * ===================================================================================
 * NATIVE MAPS BRIDGE & CRASH-GUARD FOR COURIER MOBILE
 * ===================================================================================
 * Root Cause Analysis of Android Crash (Văng App):
 * react-native-maps on Android requires Google Play Services Maps SDK and a valid
 * Google Maps API Key declared in AndroidManifest.xml (<meta-data android:name="com.google.android.geo.API_KEY" .../>).
 * If no API key is configured in app.json (android.config.googleMaps.apiKey), Google Play Services
 * immediately throws a fatal native exception (java.lang.RuntimeException: API key not found)
 * on the Android UI thread, instantly terminating the Android process ("văng app").
 *
 * Solution:
 * 1. Only attempt to load and render react-native-maps if an explicit Google Maps API Key is provided
 *    (or on iOS where Apple Maps is available natively without API key requirements).
 * 2. When no Google Maps API key is configured on Android, safely set isNativeMapSupported = false
 *    and export NullComponent fallbacks.
 * 3. Screens seamlessly use their built-in, fully interactive schematic route & geofence maps
 *    with real-time GPS tracking, sequence markers, TSP optimization, and 1-tap Google Maps directions.
 * ===================================================================================
 */

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  '';

export const HAS_GOOGLE_MAPS_API_KEY = Boolean(
  GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.trim().length > 10,
);

export const isNativeMapSupported =
  Platform.OS !== 'web' &&
  (Platform.OS === 'ios' || HAS_GOOGLE_MAPS_API_KEY);

const NullComponent: React.ComponentType<any> = () => null;

let MapView: typeof MapViewType = NullComponent as unknown as typeof MapViewType;
let Marker: typeof MarkerType = NullComponent as unknown as typeof MarkerType;
let Polyline: typeof PolylineType = NullComponent as unknown as typeof PolylineType;
let Polygon: typeof PolygonType = NullComponent as unknown as typeof PolygonType;
let PROVIDER_GOOGLE: 'google' | undefined = undefined;

if (isNativeMapSupported) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const maps = require('react-native-maps');
    MapView = maps.default ?? maps.MapView ?? maps;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    Polygon = maps.Polygon;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (err) {
    console.warn('[nativeMaps] Failed to load react-native-maps module:', err);
    MapView = NullComponent as unknown as typeof MapViewType;
    Marker = NullComponent as unknown as typeof MarkerType;
    Polyline = NullComponent as unknown as typeof PolylineType;
    Polygon = NullComponent as unknown as typeof PolygonType;
    PROVIDER_GOOGLE = undefined;
  }
}

export { MapView, Marker, Polyline, Polygon, PROVIDER_GOOGLE };
