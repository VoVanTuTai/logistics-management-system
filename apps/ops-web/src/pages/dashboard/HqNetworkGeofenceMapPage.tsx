import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import type { HubDto } from '../../features/masterdata/masterdata.types';
import { useAuthStore } from '../../store/authStore';
import './HqNetworkGeofenceMapPage.css';

interface LocalWardHub {
  id: string;
  code: string;
  name: string;
  level: number;
  parentHubCode: string;
  parentName: string;
  zoneCode: string;
  region: 'NORTH' | 'CENTRAL' | 'SOUTH';
  district: string;
  ward: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  boundaryPolygon: Array<[number, number]>;
}

// Built-in Geofence Polygons for key Last-mile Ward Hubs
const BUILTIN_WARD_HUBS: LocalWardHub[] = [
  // Bình Dương
  {
    id: 'hub-07401W001',
    code: '07401W001',
    name: 'Bưu cục Phường Dĩ An (Bình Dương)',
    level: 3,
    parentHubCode: '003074B001',
    parentName: 'Hub Tỉnh Bình Dương',
    zoneCode: '003',
    region: 'SOUTH',
    district: 'TP. Dĩ An',
    ward: 'Phường Dĩ An',
    address: '15 Nguyễn An Ninh, Khu phố Đông Tân, Phường Dĩ An, Bình Dương',
    phone: '0274381101',
    latitude: 10.9032,
    longitude: 106.7725,
    isActive: true,
    boundaryPolygon: [
      [10.9250, 106.7620],
      [10.9235, 106.7710],
      [10.9180, 106.7785],
      [10.9125, 106.7840],
      [10.9080, 106.7920],
      [10.9015, 106.7865],
      [10.8950, 106.7790],
      [10.8880, 106.7750],
      [10.8810, 106.7720],
      [10.8775, 106.7680],
      [10.8830, 106.7610],
      [10.8890, 106.7565],
      [10.8970, 106.7540],
      [10.9060, 106.7560],
      [10.9160, 106.7585],
      [10.9250, 106.7620],
    ],
  },
  // TP. Hồ Chí Minh
  {
    id: 'hub-07901W001',
    code: '07901W001',
    name: 'Bưu cục Phường Bến Thành',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '0283811001',
    latitude: 10.7715,
    longitude: 106.6932,
    isActive: true,
    boundaryPolygon: [
      [10.766, 106.687],
      [10.777, 106.689],
      [10.779, 106.696],
      [10.774, 106.699],
      [10.768, 106.696],
      [10.765, 106.691],
      [10.766, 106.687],
    ],
  },
  {
    id: 'hub-07901W002',
    code: '07901W002',
    name: 'Bưu cục Phường Bến Nghé',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    address: '45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '0283811002',
    latitude: 10.7758,
    longitude: 106.7012,
    isActive: true,
    boundaryPolygon: [
      [10.772, 106.698],
      [10.785, 106.701],
      [10.789, 106.707],
      [10.778, 106.712],
      [10.770, 106.706],
      [10.772, 106.698],
    ],
  },
  {
    id: 'hub-07903W001',
    code: '07903W001',
    name: 'Bưu cục Phường 13 - Quận 3',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    district: 'Quận 3',
    ward: 'Phường 13',
    address: '78 Lê Văn Sỹ, Phường 13, Quận 3, TP.HCM',
    phone: '0283811003',
    latitude: 10.7891,
    longitude: 106.6775,
    isActive: true,
    boundaryPolygon: [
      [10.782, 106.671],
      [10.794, 106.673],
      [10.795, 106.684],
      [10.784, 106.683],
      [10.782, 106.671],
    ],
  },
  {
    id: 'hub-07905W001',
    code: '07905W001',
    name: 'Bưu cục Phường 2 - Quận 5',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    district: 'Quận 5',
    ward: 'Phường 2',
    address: '88 Trần Hưng Đạo, Phường 2, Quận 5, TP.HCM',
    phone: '0283811004',
    latitude: 10.7538,
    longitude: 106.6782,
    isActive: true,
    boundaryPolygon: [
      [10.746, 106.672],
      [10.759, 106.673],
      [10.760, 106.685],
      [10.748, 106.684],
      [10.746, 106.672],
    ],
  },
  {
    id: 'hub-07912W001',
    code: '07912W001',
    name: 'Bưu cục Phường An Phú Đông',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    district: 'Quận 12',
    ward: 'Phường An Phú Đông',
    address: '1013A Hà Huy Giáp, Phường An Phú Đông, Quận 12, TP.HCM',
    phone: '0283811005',
    latitude: 10.867,
    longitude: 106.696,
    isActive: true,
    boundaryPolygon: [
      [10.850, 106.683],
      [10.880, 106.686],
      [10.885, 106.713],
      [10.857, 106.715],
      [10.850, 106.683],
    ],
  },
  {
    id: 'hub-07913W001',
    code: '07913W001',
    name: 'Bưu cục Phường 13 - Tân Bình',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    district: 'Quận Tân Bình',
    ward: 'Phường 13',
    address: '789 Cộng Hòa, Phường 13, Quận Tân Bình, TP.HCM',
    phone: '0283811006',
    latitude: 10.8035,
    longitude: 106.6436,
    isActive: true,
    boundaryPolygon: [
      [10.794, 106.633],
      [10.815, 106.636],
      [10.813, 106.655],
      [10.796, 106.652],
      [10.794, 106.633],
    ],
  },

  // Hà Nội
  {
    id: 'hub-00101W001',
    code: '00101W001',
    name: 'Bưu cục Phường Hàng Bài',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Hàng Bài',
    address: '15 Phố Huế, Phường Hàng Bài, Hoàn Kiếm, Hà Nội',
    phone: '0243811001',
    latitude: 21.0185,
    longitude: 105.8524,
    isActive: true,
    boundaryPolygon: [
      [21.012, 105.847],
      [21.024, 105.849],
      [21.025, 105.858],
      [21.013, 105.857],
      [21.012, 105.847],
    ],
  },
  {
    id: 'hub-00102W001',
    code: '00102W001',
    name: 'Bưu cục Phường Kim Mã',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    district: 'Quận Ba Đình',
    ward: 'Phường Kim Mã',
    address: '56 Kim Mã, Phường Kim Mã, Ba Đình, Hà Nội',
    phone: '0243811002',
    latitude: 21.0318,
    longitude: 105.8247,
    isActive: true,
    boundaryPolygon: [
      [21.025, 105.817],
      [21.037, 105.819],
      [21.038, 105.831],
      [21.026, 105.829],
      [21.025, 105.817],
    ],
  },
  {
    id: 'hub-00103W001',
    code: '00103W001',
    name: 'Bưu cục Phường Dịch Vọng',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    district: 'Quận Cầu Giấy',
    ward: 'Phường Dịch Vọng',
    address: '234 Cầu Giấy, Phường Dịch Vọng, Cầu Giấy, Hà Nội',
    phone: '0243811003',
    latitude: 21.0336,
    longitude: 105.7958,
    isActive: true,
    boundaryPolygon: [
      [21.025, 105.787],
      [21.041, 105.789],
      [21.042, 105.804],
      [21.027, 105.803],
      [21.025, 105.787],
    ],
  },
  {
    id: 'hub-00104W001',
    code: '00104W001',
    name: 'Bưu cục Phường Trung Liệt',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    district: 'Quận Đống Đa',
    ward: 'Phường Trung Liệt',
    address: '88 Thái Hà, Phường Trung Liệt, Đống Đa, Hà Nội',
    phone: '0243811004',
    latitude: 21.0135,
    longitude: 105.8194,
    isActive: true,
    boundaryPolygon: [
      [21.007, 105.811],
      [21.019, 105.813],
      [21.020, 105.826],
      [21.008, 105.825],
      [21.007, 105.811],
    ],
  },

  // Đà Nẵng
  {
    id: 'hub-04801W001',
    code: '04801W001',
    name: 'Bưu cục Phường Thạch Thang',
    level: 3,
    parentHubCode: '002048B001',
    parentName: 'Hub TP. Đà Nẵng',
    zoneCode: '002',
    region: 'CENTRAL',
    district: 'Quận Hải Châu',
    ward: 'Phường Thạch Thang',
    address: '12 Bạch Đằng, Phường Thạch Thang, Hải Châu, Đà Nẵng',
    phone: '0236381101',
    latitude: 16.0742,
    longitude: 108.2239,
    isActive: true,
    boundaryPolygon: [
      [16.067, 108.217],
      [16.081, 108.219],
      [16.082, 108.229],
      [16.068, 108.228],
      [16.067, 108.217],
    ],
  },
];

// Ray Casting Algorithm in Pure TypeScript
function isPointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<[number, number]>,
): boolean {
  if (!polygon || polygon.length < 3) return false;
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

export function HqNetworkGeofenceMapPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const { data: remoteHubs = [], isLoading: isLoadingHubs } = useHubsQuery(accessToken, {});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const simMarkerRef = useRef<any>(null);
  const simLineRef = useRef<any>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'NORTH' | 'CENTRAL' | 'SOUTH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHub, setSelectedHub] = useState<HubDto | LocalWardHub | null>(null);

  // Simulation state
  const [simResult, setSimResult] = useState<{
    lat: number;
    lng: number;
    matchedHubCode: string;
    matchedHubName: string;
    level: number;
    reason: string;
  } | null>(null);

  // Inject Leaflet CSS & JS
  useEffect(() => {
    let cssLink = document.getElementById('leaflet-css') as HTMLLinkElement;
    if (!cssLink) {
      cssLink = document.createElement('link');
      cssLink.id = 'leaflet-css';
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
    }

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

  // Filtered Hubs for the tree list
  const filteredHubs = useMemo(() => {
    const list: Array<HubDto | LocalWardHub> = [];

    // 1. Level 0 HQ
    list.push({
      id: 'hub-000HQ001',
      code: '000HQ001',
      name: 'Trụ sở Điều hành NEXUS Toàn quốc',
      level: 0,
      zoneCode: '000',
      address: 'Tòa nhà NEXUS Tower, 01 Tràng Tiền, Hoàn Kiếm, Hà Nội',
      latitude: 21.028511,
      longitude: 105.854444,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    });

    // 2. Level 1 Regional
    list.push(
      {
        id: 'hub-001N001',
        code: '001N001',
        name: 'Hub Miền Bắc (Hà Nội)',
        level: 1,
        zoneCode: '001',
        address: '12 Tràng Tiền, Hoàn Kiếm, Hà Nội',
        latitude: 21.0253,
        longitude: 105.8572,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'hub-002C001',
        code: '002C001',
        name: 'Hub Miền Trung (Đà Nẵng)',
        level: 1,
        zoneCode: '002',
        address: '08 Bạch Đằng, Hải Châu, Đà Nẵng',
        latitude: 16.0718,
        longitude: 108.2241,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'hub-003S001',
        code: '003S001',
        name: 'Hub Miền Nam (TP.HCM)',
        level: 1,
        zoneCode: '003',
        address: '02 Công xã Paris, Bến Nghé, Quận 1, TP.HCM',
        latitude: 10.7797,
        longitude: 106.6991,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    );

    // 3. Level 2 Provincial Hubs from remote query
    if (remoteHubs.length > 0) {
      remoteHubs.forEach((hub) => {
        if (!list.some((item) => item.code === hub.code)) {
          list.push(hub);
        }
      });
    }

    // 4. Level 3 Ward Hubs
    BUILTIN_WARD_HUBS.forEach((ward) => {
      if (!list.some((item) => item.code === ward.code)) {
        list.push(ward);
      }
    });

    return list.filter((hub) => {
      // Region filter
      const hubZone = (hub as HubDto).zoneCode || (hub as LocalWardHub).zoneCode || '';
      const wardRegion = (hub as LocalWardHub).region;

      if (selectedRegion === 'NORTH' && hubZone !== '001' && wardRegion !== 'NORTH' && hub.level !== 0) return false;
      if (selectedRegion === 'CENTRAL' && hubZone !== '002' && wardRegion !== 'CENTRAL') return false;
      if (selectedRegion === 'SOUTH' && hubZone !== '003' && wardRegion !== 'SOUTH') return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = hub.name.toLowerCase().includes(q);
        const matchesCode = hub.code.toLowerCase().includes(q);
        const matchesAddr = (hub.address || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesAddr;
      }
      return true;
    });
  }, [remoteHubs, selectedRegion, searchQuery]);

  // Point in polygon tester simulation handler
  const handleMapClick = (lat: number, lng: number) => {
    const point = { latitude: lat, longitude: lng };

    // 1. Test against all Ward Hub Polygons
    let matchedWard: LocalWardHub | null = null;
    for (const ward of BUILTIN_WARD_HUBS) {
      if (isPointInPolygon(point, ward.boundaryPolygon)) {
        matchedWard = ward;
        break;
      }
    }

    if (matchedWard) {
      setSimResult({
        lat,
        lng,
        matchedHubCode: matchedWard.code,
        matchedHubName: matchedWard.name,
        level: 3,
        reason: `Trùng khớp 100% Đa giác ranh giới Phường (${matchedWard.ward}, ${matchedWard.district})`,
      });
      drawSimulation(lat, lng, matchedWard.latitude, matchedWard.longitude, matchedWard.name, '#10b981');
      return;
    }

    // 2. Fallback to Province Hub based on rough latitude
    if (lat >= 19.5) {
      setSimResult({
        lat,
        lng,
        matchedHubCode: '001001B001',
        matchedHubName: 'Bưu cục Hà Nội (Trung tâm phân loại Miền Bắc)',
        level: 2,
        reason: 'Ngoài đa giác bưu cục phường -> Fallback về Hub Tỉnh/TP phụ trách vùng Miền Bắc',
      });
      drawSimulation(lat, lng, 21.028511, 105.854444, 'Bưu cục Hà Nội', '#38bdf8');
    } else if (lat >= 14.5 && lat < 19.5) {
      setSimResult({
        lat,
        lng,
        matchedHubCode: '002048B001',
        matchedHubName: 'Bưu cục Đà Nẵng (Trung tâm phân loại Miền Trung)',
        level: 2,
        reason: 'Ngoài đa giác bưu cục phường -> Fallback về Hub Tỉnh/TP phụ trách vùng Miền Trung',
      });
      drawSimulation(lat, lng, 16.0718, 108.2241, 'Bưu cục Đà Nẵng', '#f97316');
    } else {
      setSimResult({
        lat,
        lng,
        matchedHubCode: '003079B001',
        matchedHubName: 'Bưu cục Hồ Chí Minh (Trung tâm phân loại Miền Nam)',
        level: 2,
        reason: 'Ngoài đa giác bưu cục phường -> Fallback về Hub Tỉnh/TP phụ trách vùng Miền Nam',
      });
      drawSimulation(lat, lng, 10.7797, 106.6991, 'Bưu cục Hồ Chí Minh', '#10b981');
    }
  };

  const drawSimulation = (
    orderLat: number,
    orderLng: number,
    hubLat: number,
    hubLng: number,
    hubName: string,
    color: string,
  ) => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    if (simMarkerRef.current) mapRef.current.removeLayer(simMarkerRef.current);
    if (simLineRef.current) mapRef.current.removeLayer(simLineRef.current);

    // Create Order Pin
    const orderIcon = L.divIcon({
      className: 'sim-order-icon',
      html: `
        <div style="
          width: 28px; height: 28px; background: #ef4444; border: 3px solid #ffffff;
          border-radius: 50%; box-shadow: 0 0 16px #ef4444;
          display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: bold; font-size: 14px;
        ">📦</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    simMarkerRef.current = L.marker([orderLat, orderLng], { icon: orderIcon }).addTo(mapRef.current);
    simMarkerRef.current.bindPopup(`
      <div style="font-size:13px; font-weight:bold; color:#ef4444;">📍 Vị trí đơn hàng test</div>
      <div style="font-size:12px; color:#cbd5e1;">Tọa độ: ${orderLat.toFixed(5)}, ${orderLng.toFixed(5)}</div>
      <div style="font-size:12px; color:#38bdf8; margin-top:4px;">➡️ Bắt về: ${hubName}</div>
    `).openPopup();

    // Connecting dashed line
    simLineRef.current = L.polyline(
      [
        [orderLat, orderLng],
        [hubLat, hubLng],
      ],
      {
        color: color,
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.9,
      },
    ).addTo(mapRef.current);
  };

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.0471, 108.2068], // Center of Vietnam
      zoom: 6,
      minZoom: 5,
      maxZoom: 19,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', (e: any) => {
      handleMapClick(e.latlng.lat, e.latlng.lng);
    });
  }, [leafletLoaded]);

  // Render Hubs and Polygons onto the Map
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    layerGroupRef.current.clearLayers();

    // 1. Render Geofence Boundary Polygons for Ward Hubs (Level 3)
    BUILTIN_WARD_HUBS.forEach((ward) => {
      const polygon = L.polygon(ward.boundaryPolygon, {
        color: '#10b981',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.25,
        dashArray: '3, 6',
      });

      polygon.bindTooltip(
        `<div style="font-weight:bold; color:#10b981;">📍 ${ward.name}</div><div style="font-size:11px; color:#cbd5e1;">Ranh giới địa giới Phường</div>`,
        { sticky: true, className: 'hq-polygon-tooltip' },
      );

      polygon.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        setSelectedHub(ward);
        mapRef.current.flyTo([ward.latitude, ward.longitude], 15, { duration: 1 });
      });

      layerGroupRef.current.addLayer(polygon);
    });

    // 2. Render Markers for all filtered hubs
    filteredHubs.forEach((hub) => {
      if (!hub.latitude || !hub.longitude) return;

      const level = hub.level ?? 2;
      let markerColor = '#64748b';
      let iconHtml = '🏢';
      let iconSize = 28;

      if (level === 0) {
        markerColor = '#f59e0b';
        iconHtml = '👑';
        iconSize = 36;
      } else if (level === 1) {
        markerColor = '#0284c7';
        iconHtml = '🏛️';
        iconSize = 32;
      } else if (level === 2) {
        markerColor = '#0f766e';
        iconHtml = '🏬';
        iconSize = 26;
      } else if (level === 3) {
        markerColor = '#10b981';
        iconHtml = '🏪';
        iconSize = 24;
      }

      const customIcon = L.divIcon({
        className: 'hq-hub-custom-icon',
        html: `
          <div style="
            width: ${iconSize}px; height: ${iconSize}px;
            background: ${markerColor};
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 12px ${markerColor};
            font-size: ${iconSize * 0.55}px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${iconHtml}
          </div>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
      });

      const marker = L.marker([hub.latitude, hub.longitude], { icon: customIcon });

      marker.bindPopup(`
        <div class="hq-popup-title">${hub.name}</div>
        <div class="hq-popup-code">Mã: ${hub.code} (Cấp ${level})</div>
        <div class="hq-popup-address">${hub.address || 'Đang cập nhật địa chỉ'}</div>
        <div style="margin-top:6px; font-size:11px; color:#38bdf8;">Tọa độ: ${hub.latitude.toFixed(4)}, ${hub.longitude.toFixed(4)}</div>
      `);

      marker.on('click', () => {
        setSelectedHub(hub);
      });

      layerGroupRef.current.addLayer(marker);
    });
  }, [filteredHubs, leafletLoaded]);

  // Fly to selected hub
  const handleFlyTo = (lat: number, lng: number, zoom = 14) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="hq-map-page">
      {/* Top Header */}
      <header className="hq-map-header">
        <div className="hq-map-title-row">
          <div className="hq-map-title-icon">
            <svg viewBox="0 0 24 24">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <div>
            <h1 className="hq-map-title">Bản Đồ Mạng Lưới & Phân Vùng Logistics HQ Toàn Quốc</h1>
            <p className="hq-map-subtitle">
              Trực quan hóa Đa giác Ranh giới (Polygon Geofencing) & Tự động Phân bổ Đơn theo Tọa độ GPS
            </p>
          </div>
        </div>

        <div className="hq-map-stats-bar">
          <div className="hq-map-stat-pill">
            <span className="hq-map-stat-dot hq" />
            <span>1 HQ Toàn quốc</span>
          </div>
          <div className="hq-map-stat-pill">
            <span className="hq-map-stat-dot north" />
            <span>3 Hub Miền</span>
          </div>
          <div className="hq-map-stat-pill">
            <span className="hq-map-stat-dot central" />
            <span>34 Hub Tỉnh/TP</span>
          </div>
          <div className="hq-map-stat-pill">
            <span className="hq-map-stat-dot south" />
            <span>Mạng lưới Bưu cục Phường</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="hq-map-workspace">
        {/* Left Sidebar: Filter & List */}
        <aside className="hq-map-sidebar-left">
          <div className="hq-map-sidebar-search">
            <div className="hq-map-search-input-wrap">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm Hub theo mã, tên, địa chỉ..."
              />
            </div>
          </div>

          <div className="hq-map-region-tabs">
            <button
              type="button"
              className={`hq-map-region-tab ${selectedRegion === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('ALL')}
            >
              Toàn quốc
            </button>
            <button
              type="button"
              className={`hq-map-region-tab ${selectedRegion === 'NORTH' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('NORTH')}
            >
              Miền Bắc
            </button>
            <button
              type="button"
              className={`hq-map-region-tab ${selectedRegion === 'CENTRAL' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('CENTRAL')}
            >
              Miền Trung
            </button>
            <button
              type="button"
              className={`hq-map-region-tab ${selectedRegion === 'SOUTH' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('SOUTH')}
            >
              Miền Nam
            </button>
          </div>

          <div className="hq-map-hub-list">
            {isLoadingHubs ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách Hub...</div>
            ) : (
              filteredHubs.map((hub) => {
                const isSelected = selectedHub?.code === hub.code;
                const level = hub.level ?? 2;
                return (
                  <div
                    key={hub.code}
                    className={`hq-map-hub-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedHub(hub);
                      if (hub.latitude && hub.longitude) {
                        handleFlyTo(hub.latitude, hub.longitude, level === 3 ? 15 : level === 2 ? 11 : 8);
                      }
                    }}
                  >
                    <div className="hq-map-hub-item-left">
                      <span className="hq-map-hub-item-name">{hub.name}</span>
                      <span className="hq-map-hub-item-code">{hub.code}</span>
                    </div>
                    <span className={`hq-map-hub-item-badge level-${level}`}>
                      Cấp {level}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center: Leaflet Canvas */}
        <main className="hq-map-canvas-container">
          <div ref={mapContainerRef} className="hq-map-leaflet-mount" />

          {/* Floating Order Simulation Widget */}
          <div className="hq-map-simulator-panel">
            <div className="hq-map-simulator-title">
              <span>🎯</span>
              <span>Công Cụ Thử Nghiệm Bắt Đơn GPS</span>
            </div>
            <p className="hq-map-simulator-desc">
              Nhấp bất kỳ điểm nào trên bản đồ để mô phỏng đơn hàng mới tạo và kiểm tra thuật toán Ray Casting đa giác.
            </p>

            {simResult ? (
              <div className="hq-map-simulator-result">
                <span className={`hq-map-sim-tag ${simResult.level === 3 ? 'matched-ward' : 'fallback-province'}`}>
                  {simResult.level === 3 ? 'ĐÃ KHỚP ĐA GIÁC PHƯỜNG' : 'FALLBACK HUB TỈNH'}
                </span>
                <div className="hq-map-sim-hub-name">{simResult.matchedHubName}</div>
                <div className="hq-map-sim-hub-code">Mã phụ trách: {simResult.matchedHubCode} (Cấp {simResult.level})</div>
                <div className="hq-map-sim-coords">
                  Tọa độ click: [{simResult.lat.toFixed(4)}, {simResult.lng.toFixed(4)}]
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#a7f3d0' }}>
                  {simResult.reason}
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                👉 Chưa có điểm click. Hãy click vào bản đồ!
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Hub Inspector */}
        <aside className="hq-map-sidebar-right">
          <div className="hq-map-inspector-header">
            <h2 className="hq-map-inspector-title">Thông Tin Chi Tiết Hub</h2>
            {selectedHub && (
              <span className={`hq-map-hub-item-badge level-${selectedHub.level ?? 2}`}>
                Cấp {selectedHub.level ?? 2}
              </span>
            )}
          </div>

          {selectedHub ? (
            <>
              <div className="hq-map-detail-card">
                <div className="hq-map-detail-row">
                  <span className="hq-map-detail-label">Tên Hub</span>
                  <span className="hq-map-detail-val" style={{ color: '#38bdf8' }}>{selectedHub.name}</span>
                </div>
                <div className="hq-map-detail-row">
                  <span className="hq-map-detail-label">Mã định danh</span>
                  <span className="hq-map-detail-val">{selectedHub.code}</span>
                </div>
                <div className="hq-map-detail-row">
                  <span className="hq-map-detail-label">Cấp quản lý</span>
                  <span className="hq-map-detail-val">
                    {(selectedHub.level ?? 2) === 0
                      ? 'Cấp 0 (HQ Toàn Quốc)'
                      : (selectedHub.level ?? 2) === 1
                      ? 'Cấp 1 (Hub Miền)'
                      : (selectedHub.level ?? 2) === 2
                      ? 'Cấp 2 (Hub Tỉnh/TP)'
                      : 'Cấp 3 (Bưu cục Phường)'}
                  </span>
                </div>
                <div className="hq-map-detail-row">
                  <span className="hq-map-detail-label">Trực thuộc Hub</span>
                  <span className="hq-map-detail-val">
                    {(selectedHub as LocalWardHub).parentName || (selectedHub as HubDto).parentCode || 'NEXUS HQ'}
                  </span>
                </div>
                <div className="hq-map-detail-row">
                  <span className="hq-map-detail-label">Tọa độ GPS</span>
                  <span className="hq-map-detail-val">
                    {selectedHub.latitude && selectedHub.longitude
                      ? `${selectedHub.latitude.toFixed(4)}, ${selectedHub.longitude.toFixed(4)}`
                      : 'Chưa cấu hình'}
                  </span>
                </div>
                <div className="hq-map-detail-row">
                  <span className="hq-map-detail-label">Địa chỉ</span>
                  <span className="hq-map-detail-val">{selectedHub.address || 'Đang cập nhật'}</span>
                </div>
                {(selectedHub as LocalWardHub).boundaryPolygon && (
                  <div className="hq-map-detail-row">
                    <span className="hq-map-detail-label">Đa giác ranh giới</span>
                    <span className="hq-map-detail-val" style={{ color: '#34d399' }}>
                      {(selectedHub as LocalWardHub).boundaryPolygon.length} điểm đỉnh khép kín
                    </span>
                  </div>
                )}
              </div>

              {selectedHub.latitude && selectedHub.longitude && (
                <button
                  type="button"
                  className="hq-map-fly-btn"
                  onClick={() => handleFlyTo(selectedHub.latitude!, selectedHub.longitude!, (selectedHub.level ?? 2) === 3 ? 15 : 11)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="12 8 8 12 12 16 12 8" />
                  </svg>
                  Bay tới vị trí Hub trên Map
                </button>
              )}
            </>
          ) : (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Chọn một Hub từ danh sách hoặc click vào điểm / đa giác trên bản đồ để xem chi tiết.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
