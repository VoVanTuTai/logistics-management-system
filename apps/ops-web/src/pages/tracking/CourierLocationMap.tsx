import React, { useEffect, useRef, useState } from 'react';

export interface LocationHistorySample {
  latitude: number;
  longitude: number;
  capturedAt: string;
}

interface CourierLocationMapProps {
  latitude: number;
  longitude: number;
  courierId?: string | null;
  history?: LocationHistorySample[];
}

export function CourierLocationMap({
  latitude,
  longitude,
  courierId,
  history = [],
}: CourierLocationMapProps): React.JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const trailRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // 1. Inject Leaflet CSS if not present
    let cssLink = document.getElementById('leaflet-css') as HTMLLinkElement;
    if (!cssLink) {
      cssLink = document.createElement('link');
      cssLink.id = 'leaflet-css';
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
    }

    // 2. Inject Leaflet JS if not present
    let jsScript = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (!jsScript) {
      jsScript = document.createElement('script');
      jsScript.id = 'leaflet-js';
      jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(jsScript);
    }

    const checkLeaflet = () => {
      if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        setTimeout(checkLeaflet, 100);
      }
    };

    if ((window as any).L) {
      setLeafletLoaded(true);
    } else {
      jsScript.addEventListener('load', () => setLeafletLoaded(true));
      checkLeaflet();
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) {
      return;
    }

    const L = (window as any).L;
    if (!L) {
      return;
    }

    // Initialize map if not yet initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Create primary marker
      markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
      updatePopup();

      // Create polyline trail for history
      const latlngs = getHistoryLatLngs();
      trailRef.current = L.polyline(latlngs, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.6,
        dashArray: '5, 10',
      }).addTo(mapRef.current);

      if (latlngs.length > 0) {
        // Fit bounds to encompass the trail and current position
        const bounds = L.latLngBounds([
          [latitude, longitude],
          ...latlngs,
        ]);
        mapRef.current.fitBounds(bounds, { padding: [30, 30] });
      }
    } else {
      // Map is already initialized, just update marker and trail
      const currentLatLng = [latitude, longitude];
      markerRef.current.setLatLng(currentLatLng);
      updatePopup();

      const latlngs = getHistoryLatLngs();
      trailRef.current.setLatLngs(latlngs);

      // Auto-re-center map if current position isn't in view
      if (!mapRef.current.getBounds().contains(currentLatLng)) {
        mapRef.current.panTo(currentLatLng);
      }
    }

    function updatePopup() {
      if (markerRef.current) {
        markerRef.current.bindPopup(
          `<div style="font-family: inherit; font-size: 13px;">
             <strong>Courier:</strong> ${courierId ?? 'N/A'}<br/>
             <strong>Vĩ độ:</strong> ${latitude.toFixed(6)}<br/>
             <strong>Kinh độ:</strong> ${longitude.toFixed(6)}
           </div>`
        );
      }
    }

    function getHistoryLatLngs(): [number, number][] {
      // Sort chronologically ascending for polyline drawing
      const sortedHistory = [...history].sort(
        (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
      );
      return sortedHistory.map((s) => [s.latitude, s.longitude]);
    }

    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        trailRef.current = null;
      }
    };
  }, [leafletLoaded, latitude, longitude, courierId, history]);

  if (!leafletLoaded) {
    return (
      <div
        style={{
          height: '350px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '14px',
          fontWeight: 500,
          marginTop: '12px',
        }}
      >
        Đang tải bản đồ định vị...
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{
        height: '350px',
        width: '100%',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginTop: '12px',
        zIndex: 1,
      }}
    />
  );
}
