import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useCourierAreaAssignmentsQuery,
  useCreateCourierAreaAssignmentMutation,
  useDeleteCourierAreaAssignmentMutation,
  useHubsQuery,
  useUpdateHubMutation,
} from '../../features/masterdata/masterdata.api';
import type { CourierAreaAssignmentDto, HubDto } from '../../features/masterdata/masterdata.types';
import { useAuthStore } from '../../store/authStore';
import {
  calculatePolygonAreaKm2,
  calculatePolygonCentroid,
  EXPANDED_WARD_HUBS,
  findProvinceForCoordinate,
  findWardForCoordinate,
  isPointInPolygon,
  OFFICIAL_WARD_BOUNDARIES,
  VIETNAM_NATIONAL_BOUNDARY,
  VIETNAM_PROVINCE_BOUNDARIES,
  VIETNAM_REGION_BOUNDARIES,
  type BoundaryItem,
  type LocalWardHubItem,
} from '../../features/masterdata/vietnamBoundaryData';
import './AdminHubGeofenceMapPage.css';

// Shipper demo list for assigning courier zones
const DEMO_COURIERS = [
  { courierId: '30000001', fullName: 'Nguyễn Văn An', defaultZone: 'Tuyến Khu phố Đông Chiêu - Ga Dĩ An' },
  { courierId: '30000002', fullName: 'Trần Văn Bình', defaultZone: 'Tuyến Khu phố Nhị Đồng 1 & 2' },
  { courierId: '30000003', fullName: 'Lê Văn Cường', defaultZone: 'Tuyến Ga Sóng Thần - Phạm Văn Đồng' },
  { courierId: '30000004', fullName: 'Phạm Văn Dũng', defaultZone: 'Tuyến Trung tâm Phố Lê Lợi - Chợ' },
  { courierId: '30000005', fullName: 'Hoàng Văn Em', defaultZone: 'Tuyến Khu Công Nghiệp & Cụm Đường Lớn' },
];

const PRESET_COLORS = ['#ea4335', '#38bdf8', '#f97316', '#10b981', '#ec4899', '#8b5cf6', '#eab308'];

export type CoverageLayerType = 'ALL_PROVINCES' | 'NATIONAL' | 'REGIONS' | 'WARD_HUBS' | 'ALL_LAYERS';

export function AdminHubGeofenceMapPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  // Remote data
  const { data: remoteHubs = [], isLoading: isLoadingHubs } = useHubsQuery(accessToken, {});
  const { data: courierAssignments = [] } = useCourierAreaAssignmentsQuery(accessToken, {});
  const updateHubMutation = useUpdateHubMutation(accessToken);
  const createCourierAssignmentMutation = useCreateCourierAreaAssignmentMutation(accessToken);
  const deleteCourierAssignmentMutation = useDeleteCourierAreaAssignmentMutation(accessToken);

  // Map & Layer References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const nationalLayerRef = useRef<any>(null);
  const regionLayerRef = useRef<any>(null);
  const provinceLayerRef = useRef<any>(null);
  const wardLayerRef = useRef<any>(null);
  const courierZonesLayerRef = useRef<any>(null);
  const activeSelectionLayerRef = useRef<any>(null);
  const previewPolygonRef = useRef<any>(null);
  const drawingLayerRef = useRef<any>(null);

  // States
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [coverageLayer, setCoverageLayer] = useState<CoverageLayerType>('ALL_PROVINCES');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<'ALL' | 'NORTH' | 'CENTRAL' | 'SOUTH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Area / Hub
  const [selectedItem, setSelectedItem] = useState<BoundaryItem | LocalWardHubItem | HubDto | null>(
    VIETNAM_PROVINCE_BOUNDARIES.find((p) => p.code === '003074B001') || VIETNAM_PROVINCE_BOUNDARIES[0],
  );

  // High-Definition Search Panel
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [fetchedBoundary, setFetchedBoundary] = useState<{
    displayName: string;
    lat: number;
    lon: number;
    polygon: Array<[number, number]>;
  } | null>(null);

  // Drawing Mode
  const [isDrawingCourierZone, setIsDrawingCourierZone] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Array<[number, number]>>([]);
  const [newZoneName, setNewZoneName] = useState('Tuyến 1 - Khu Phố Trung Tâm');
  const [selectedCourierId, setSelectedCourierId] = useState(DEMO_COURIERS[0].courierId);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // 1. Load Leaflet CSS and JS
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

  // 2. Comprehensive Hubs & Boundaries List
  const allMasterItems = useMemo(() => {
    const list: Array<BoundaryItem | LocalWardHubItem | HubDto> = [
      VIETNAM_NATIONAL_BOUNDARY,
      ...VIETNAM_REGION_BOUNDARIES,
      ...VIETNAM_PROVINCE_BOUNDARIES,
      // 483 phường/xã GeoJSON chuẩn quốc gia (ưu tiên) + 16 phường cũ (fallback)
      ...OFFICIAL_WARD_BOUNDARIES.map((w) => ({
        ...w,
        ward: w.name,
        parentHubCode: '',
        parentName: '',
        zoneCode: '',
        address: `${w.name}, ${w.district}, ${w.province}`,
        phone: '',
      })),
    ];

    // Merge remote hubs from database if not duplicated
    remoteHubs.forEach((hub) => {
      if (!list.some((item) => item.code === hub.code)) {
        list.push(hub);
      }
    });

    return list;
  }, [remoteHubs]);

  // 3. Filtered Items based on Region Tab & Search Box
  const filteredItems = useMemo(() => {
    return allMasterItems.filter((item) => {
      const region = (item as any).region || (item as any).zoneCode;
      if (selectedRegionFilter === 'NORTH') {
        if (region !== 'NORTH' && region !== '001') return false;
      } else if (selectedRegionFilter === 'CENTRAL') {
        if (region !== 'CENTRAL' && region !== '002') return false;
      } else if (selectedRegionFilter === 'SOUTH') {
        if (region !== 'SOUTH' && region !== '003') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (item.name || '').toLowerCase();
        const code = (item.code || '').toLowerCase();
        const desc = ((item as any).description || '').toLowerCase();
        return name.includes(q) || code.includes(q) || desc.includes(q);
      }

      return true;
    });
  }, [allMasterItems, selectedRegionFilter, searchQuery]);

  // Current Hub Courier Assignments
  const currentItemCourierZones = useMemo(() => {
    if (!selectedItem) return [];
    return courierAssignments.filter(
      (a) => a.hubCode === selectedItem.code && a.boundaryPolygon && a.boundaryPolygon.length >= 3,
    );
  }, [selectedItem, courierAssignments]);

  // 4. Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Vietnam center focus
    const map = L.map(mapContainerRef.current, {
      center: [16.0471, 108.2068],
      zoom: 6,
      minZoom: 5,
      maxZoom: 19,
    });

    // High clarity logistics basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    nationalLayerRef.current = L.layerGroup().addTo(map);
    regionLayerRef.current = L.layerGroup().addTo(map);
    provinceLayerRef.current = L.layerGroup().addTo(map);
    wardLayerRef.current = L.layerGroup().addTo(map);
    courierZonesLayerRef.current = L.layerGroup().addTo(map);
    activeSelectionLayerRef.current = L.layerGroup().addTo(map);
    drawingLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Handle clicks when drawing
    map.on('click', (e: any) => {
      if ((window as any).__isDrawingMode) {
        const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
        (window as any).__addPoint(newPt);
      } else {
        // Point in polygon auto-lookup on map click (Kiểm tra Phường khít trước, rồi đến Tỉnh)
        const clickedWard = findWardForCoordinate(e.latlng.lat, e.latlng.lng);
        if (clickedWard) {
          setSelectedItem(clickedWard);
        } else {
          const clickedProvince = findProvinceForCoordinate(e.latlng.lat, e.latlng.lng);
          if (clickedProvince) {
            setSelectedItem(clickedProvince);
          }
        }
      }
    });
  }, [leafletLoaded]);

  // Connect window helpers for map drawing
  useEffect(() => {
    (window as any).__isDrawingMode = isDrawingCourierZone;
    (window as any).__addPoint = (pt: [number, number]) => {
      setDrawnPoints((prev) => [...prev, pt]);
    };
  }, [isDrawingCourierZone]);

  // Update Drawing Layer on point addition
  useEffect(() => {
    if (!drawingLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    drawingLayerRef.current.clearLayers();

    if (drawnPoints.length > 0) {
      drawnPoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 6,
          fillColor: selectedColor,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1,
        });
        marker.bindTooltip(`Điểm ${idx + 1}`, { permanent: false });
        drawingLayerRef.current.addLayer(marker);
      });

      if (drawnPoints.length >= 2) {
        const polyline = L.polyline(drawnPoints, {
          color: selectedColor,
          weight: 3,
          dashArray: '4, 4',
        });
        drawingLayerRef.current.addLayer(polyline);
      }

      if (drawnPoints.length >= 3) {
        const polygon = L.polygon(drawnPoints, {
          color: selectedColor,
          weight: 2.5,
          fillColor: selectedColor,
          fillOpacity: 0.35,
        });
        drawingLayerRef.current.addLayer(polygon);
      }
    }
  }, [drawnPoints, selectedColor]);

  // 5. Render 100% Vietnam Boundaries with Google Maps Styling
  useEffect(() => {
    if (
      !mapRef.current ||
      !nationalLayerRef.current ||
      !regionLayerRef.current ||
      !provinceLayerRef.current ||
      !wardLayerRef.current ||
      !courierZonesLayerRef.current ||
      !activeSelectionLayerRef.current
    )
      return;

    const L = (window as any).L;
    if (!L) return;

    // Clear all layers before re-rendering
    nationalLayerRef.current.clearLayers();
    regionLayerRef.current.clearLayers();
    provinceLayerRef.current.clearLayers();
    wardLayerRef.current.clearLayers();
    courierZonesLayerRef.current.clearLayers();
    activeSelectionLayerRef.current.clearLayers();

    // ----------------------------------------------------
    // LAYER A: TOÀN QUỐC (NATIONAL BORDER + ISLANDS)
    // ----------------------------------------------------
    if (coverageLayer === 'NATIONAL' || coverageLayer === 'ALL_LAYERS') {
      const natPoly = L.polygon(VIETNAM_NATIONAL_BOUNDARY.polygon, {
        color: '#ea4335', // Google Maps Signature Red
        weight: 3.5,
        fillColor: '#ea4335',
        fillOpacity: 0.08,
        dashArray: '8, 6',
      });

      natPoly.bindTooltip(
        `<div style="font-weight:bold; color:#ea4335; font-size:13px;">🇻🇳 ${VIETNAM_NATIONAL_BOUNDARY.name}</div>
         <div style="font-size:11px; color:#cbd5e1;">Ranh giới Quốc gia (Bao phủ 100% Lãnh thổ Việt Nam)</div>`,
        { sticky: true },
      );

      natPoly.on('click', () => setSelectedItem(VIETNAM_NATIONAL_BOUNDARY));
      nationalLayerRef.current.addLayer(natPoly);

      // Render Islands (Hoàng Sa, Trường Sa, Phú Quốc, Côn Đảo)
      VIETNAM_NATIONAL_BOUNDARY.islandPolygons?.forEach((island, idx) => {
        const islandNames = ['Quần đảo Hoàng Sa (Đà Nẵng)', 'Quần đảo Trường Sa (Khánh Hòa)', 'Đảo Phú Quốc (Kiên Giang)', 'Côn Đảo (BR-VT)'];
        const islandPoly = L.polygon(island, {
          color: '#ea4335',
          weight: 2,
          fillColor: '#ea4335',
          fillOpacity: 0.15,
          dashArray: '4, 4',
        });
        islandPoly.bindTooltip(
          `<div style="font-weight:bold; color:#ea4335;">🏝️ ${islandNames[idx] || 'Hải đảo Việt Nam'}</div>
           <div style="font-size:10px; color:#cbd5e1;">Chủ quyền thiêng liêng của Tổ quốc Việt Nam</div>`,
          { sticky: true },
        );
        nationalLayerRef.current.addLayer(islandPoly);
      });
    }

    // ----------------------------------------------------
    // LAYER B: 3 VÙNG MIỀN (BẮC - TRUNG - NAM)
    // Phân biệt màu sắc đặc trưng theo từng miền
    // ----------------------------------------------------
    if (coverageLayer === 'REGIONS' || coverageLayer === 'ALL_LAYERS') {
      VIETNAM_REGION_BOUNDARIES.forEach((reg) => {
        const isSelected = selectedItem?.code === reg.code;
        const regColor = reg.colorHex || '#2563eb';

        const regPoly = L.polygon(reg.polygon, {
          color: isSelected ? '#ffffff' : regColor,
          weight: isSelected ? 4 : 3.2,
          fillColor: regColor,
          fillOpacity: isSelected ? 0.22 : 0.08,
          dashArray: '8, 8',
        });

        regPoly.bindTooltip(
          `<div style="font-weight:bold; color:${regColor}; font-size:13px;">🗺️ ${reg.name}</div>
           <div style="font-size:11px; color:#cbd5e1;">${reg.description}</div>`,
          { sticky: true },
        );

        regPoly.on('click', () => {
          setSelectedItem(reg);
          mapRef.current.fitBounds(regPoly.getBounds(), { padding: [30, 30] });
        });

        regionLayerRef.current.addLayer(regPoly);
      });
    }

    // ----------------------------------------------------
    // LAYER C: TOÀN BỘ TỈNH / THÀNH PHỐ (100% COVERAGE)
    // Mỗi tỉnh có màu sắc chuyên biệt (Province Chroma Spectrum)
    // ----------------------------------------------------
    if (coverageLayer === 'ALL_PROVINCES' || coverageLayer === 'ALL_LAYERS') {
      VIETNAM_PROVINCE_BOUNDARIES.forEach((prov) => {
        const isSelected = selectedItem?.code === prov.code;
        const provColor = prov.colorHex || '#ea580c';

        const provPoly = L.polygon(prov.polygon, {
          color: isSelected ? '#ffffff' : provColor,
          weight: isSelected ? 3.5 : 2,
          fillColor: provColor,
          fillOpacity: isSelected ? 0.35 : 0.14,
          dashArray: '4, 4',
        });

        provPoly.bindTooltip(
          `<div style="font-weight:bold; color:${provColor}; font-size:13px;">📍 ${prov.name}</div>
           <div style="font-size:11px; color:#e2e8f0;">Diện tích ước tính: ${prov.areaKm2 ? prov.areaKm2.toLocaleString() : 'N/A'} km²</div>
           <div style="font-size:10px; color:#94a3b8;">${prov.polygon.length} đỉnh tọa độ viền khép kín</div>`,
          { sticky: true },
        );

        provPoly.on('mouseover', () => {
          provPoly.setStyle({ weight: 3.5, fillOpacity: 0.3 });
        });

        provPoly.on('mouseout', () => {
          if (selectedItem?.code !== prov.code) {
            provPoly.setStyle({ weight: 2, fillOpacity: 0.14 });
          }
        });

        provPoly.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          setSelectedItem(prov);
          mapRef.current.fitBounds(provPoly.getBounds(), { padding: [40, 40] });
        });

        provinceLayerRef.current.addLayer(provPoly);

        // Marker for Province Centroid
        const provMarker = L.divIcon({
          className: 'admin-prov-pin',
          html: `
            <div style="
              background: ${provColor}; color: #ffffff; padding: 2px 8px; border-radius: 9999px;
              font-size: 11px; font-weight: 700; border: 1.5px solid #ffffff; white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5); cursor: pointer;
            ">
              ${prov.name.replace(/^(Thành phố|Tỉnh)\s+/i, '')}
            </div>
          `,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        });

        const centerPoint = prov.center || calculatePolygonCentroid(prov.polygon);
        const marker = L.marker(centerPoint, { icon: provMarker });
        marker.on('click', () => {
          setSelectedItem(prov);
          mapRef.current.fitBounds(provPoly.getBounds(), { padding: [40, 40] });
        });
        provinceLayerRef.current.addLayer(marker);
      });
    }

    // ----------------------------------------------------
    // LAYER D: BƯU CỤC CẤP PHƯỜNG / XÃ (483 PHƯỜNG GEOJSON CHUẨN QUỐC GIA)
    // Nét liền Tím Violet / Xanh Đậm nổi bật rõ nét
    // ----------------------------------------------------
    if (coverageLayer === 'WARD_HUBS' || coverageLayer === 'ALL_LAYERS') {
      // Render 483 phường/xã GeoJSON chuẩn quốc gia (khớp 100% Google Maps)
      OFFICIAL_WARD_BOUNDARIES.forEach((ward) => {
        const isSelected = selectedItem?.code === ward.code;
        const wardColor = ward.colorHex || '#9333ea';

        const wardPoly = L.polygon(ward.boundaryPolygon, {
          color: isSelected ? '#ffffff' : wardColor,
          weight: isSelected ? 3 : 1.5,
          fillColor: wardColor,
          fillOpacity: isSelected ? 0.45 : 0.22,
          dashArray: isSelected ? undefined : undefined,
        });

        wardPoly.bindTooltip(
          `<div style="font-weight:bold; color:${wardColor}; font-size:13px;">🏣 ${ward.name}</div>
           <div style="font-size:11px; color:#475569;">${ward.district}, ${ward.province}</div>
           <div style="font-size:10px; color:#64748b;">${ward.areaKm2} km² • Mã bưu chính: ${ward.postalCode || 'N/A'}</div>
           <div style="font-size:10px; color:#0052cc; font-weight:700; margin-top:2px;">✓ GeoJSON chuẩn quốc gia (${ward.originalVertices} đỉnh gốc → ${ward.boundaryPolygon.length} đỉnh)</div>`,
          { sticky: true },
        );

        wardPoly.on('mouseover', () => {
          wardPoly.setStyle({ weight: 3, fillOpacity: 0.4 });
        });

        wardPoly.on('mouseout', () => {
          if (selectedItem?.code !== ward.code) {
            wardPoly.setStyle({ weight: 1.5, fillOpacity: 0.22 });
          }
        });

        wardPoly.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          setSelectedItem({
            ...ward,
            ward: ward.name,
            parentHubCode: '',
            parentName: '',
            zoneCode: '',
            address: `${ward.name}, ${ward.district}, ${ward.province}`,
            phone: '',
          } as any);
          mapRef.current.fitBounds(wardPoly.getBounds(), { padding: [30, 30] });
        });

        wardLayerRef.current.addLayer(wardPoly);
      });
    }

    // ----------------------------------------------------
    // LAYER E: CÁC TUYẾN PHÂN KHU CHO SHIPPER (COURIER ZONES)
    // ----------------------------------------------------
    courierAssignments.forEach((assignment: CourierAreaAssignmentDto) => {
      if (assignment.boundaryPolygon && assignment.boundaryPolygon.length >= 3) {
        const zoneColor = assignment.colorHex || '#0284c7';
        const courierObj = DEMO_COURIERS.find((c) => c.courierId === assignment.courierId);

        const subZone = L.polygon(assignment.boundaryPolygon, {
          color: zoneColor,
          weight: 2.5,
          fillColor: zoneColor,
          fillOpacity: 0.25,
        });

        subZone.bindTooltip(
          `<div style="font-weight:bold; color:${zoneColor};">🛵 ${assignment.zoneName || 'Tuyến giao hàng'}</div>
           <div style="font-size:11px; color:#1e293b;">Shipper: ${courierObj?.fullName || assignment.courierId} (${assignment.courierId})</div>
           <div style="font-size:10px; color:#64748b;">${assignment.boundaryPolygon.length} điểm đỉnh</div>`,
          { sticky: true },
        );

        courierZonesLayerRef.current.addLayer(subZone);
      }
    });

    // ----------------------------------------------------
    // ACTIVE HIGHLIGHT: ĐƯỜNG BIÊN PHÁT SÁNG CHO ĐƠN VỊ ĐANG CHỌN (Xanh Chủ Đạo #0052cc)
    // ----------------------------------------------------
    if (selectedItem && (selectedItem as any).polygon) {
      const activePoly = L.polygon((selectedItem as any).polygon, {
        color: '#0052cc',
        weight: 4,
        fillColor: '#0052cc',
        fillOpacity: 0.2,
        dashArray: '6, 6',
      });
      activeSelectionLayerRef.current.addLayer(activePoly);
    } else if (selectedItem && (selectedItem as any).boundaryPolygon) {
      const activePoly = L.polygon((selectedItem as any).boundaryPolygon, {
        color: '#0052cc',
        weight: 4,
        fillColor: '#0052cc',
        fillOpacity: 0.22,
        dashArray: '6, 6',
      });
      activeSelectionLayerRef.current.addLayer(activePoly);
    }
  }, [coverageLayer, selectedItem, courierAssignments, leafletLoaded]);

  // 6. Handle Search Boundary: Built-in + OpenStreetMap OSM
  const handleFetchHdBoundary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiSearchQuery.trim()) return;

    const term = apiSearchQuery.trim().toLowerCase();

    // First check built-in high-definition dataset
    const matchedProv = VIETNAM_PROVINCE_BOUNDARIES.find(
      (p) => p.name.toLowerCase().includes(term) || p.code.toLowerCase() === term,
    );

    if (matchedProv) {
      setSelectedItem(matchedProv);
      if (mapRef.current) {
        const L = (window as any).L;
        if (L) {
          const bounds = L.polygon(matchedProv.polygon).getBounds();
          mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
      }
      setFetchedBoundary({
        displayName: `${matchedProv.name} (Bộ dữ liệu tọa độ chuẩn 100% Việt Nam)`,
        lat: matchedProv.center[0],
        lon: matchedProv.center[1],
        polygon: matchedProv.polygon,
      });
      return;
    }

    const matchedWard = EXPANDED_WARD_HUBS.find(
      (w) => w.name.toLowerCase().includes(term) || w.ward.toLowerCase().includes(term),
    );

    if (matchedWard) {
      setSelectedItem(matchedWard);
      if (mapRef.current) {
        const L = (window as any).L;
        if (L) {
          const bounds = L.polygon(matchedWard.boundaryPolygon).getBounds();
          mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
      }
      setFetchedBoundary({
        displayName: `${matchedWard.name}, ${matchedWard.district}, ${matchedWard.province}`,
        lat: matchedWard.latitude,
        lon: matchedWard.longitude,
        polygon: matchedWard.boundaryPolygon,
      });
      return;
    }

    // Secondary fallback: Query OpenStreetMap Nominatim for micro wards
    setIsSearchingApi(true);
    try {
      const query = encodeURIComponent(`${apiSearchQuery.trim()}, Vietnam`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&polygon_geojson=1&limit=1`,
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        let polygon: Array<[number, number]> = [];

        if (item.geojson && item.geojson.type === 'Polygon') {
          polygon = item.geojson.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);
        } else if (item.geojson && item.geojson.type === 'MultiPolygon') {
          polygon = item.geojson.coordinates[0][0].map((c: [number, number]) => [c[1], c[0]]);
        }

        if (polygon.length >= 3) {
          setFetchedBoundary({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            polygon,
          });

          const L = (window as any).L;
          if (L && mapRef.current) {
            if (previewPolygonRef.current) {
              mapRef.current.removeLayer(previewPolygonRef.current);
            }

            previewPolygonRef.current = L.polygon(polygon, {
              color: '#ef4444',
              weight: 3.5,
              fillColor: '#ef4444',
              fillOpacity: 0.2,
              dashArray: '6, 6',
            }).addTo(mapRef.current);

            mapRef.current.fitBounds(previewPolygonRef.current.getBounds(), { padding: [30, 30] });
          }
        } else {
          alert('Không tìm thấy đa giác khép kín. Vui lòng nhập rõ tên Phường/Xã/Quận.');
        }
      } else {
        alert(`Không tìm thấy ranh giới cho "${apiSearchQuery}".`);
      }
    } catch (err: any) {
      alert(`Lỗi tìm kiếm ranh giới: ${err.message}`);
    } finally {
      setIsSearchingApi(false);
    }
  };

  // 7. Save HD Boundary to Hub
  const handleSaveBoundaryToHub = async () => {
    if (!selectedItem || !fetchedBoundary) return;
    try {
      await updateHubMutation.mutateAsync({
        hubId: (selectedItem as any).id || selectedItem.code,
        payload: {
          latitude: fetchedBoundary.lat,
          longitude: fetchedBoundary.lon,
          boundaryPolygon: fetchedBoundary.polygon,
        },
      });
      alert(`✅ Đã lưu ranh giới (${fetchedBoundary.polygon.length} đỉnh uốn lượn) vào Hub [${selectedItem.name}]!`);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // 8. Drawing Controls for Courier Zone
  const handleStartDrawing = () => {
    if (!selectedItem) {
      alert('Vui lòng chọn một Hub/Tỉnh trước khi vẽ tuyến Shipper!');
      return;
    }
    setIsDrawingCourierZone(true);
    setDrawnPoints([]);
  };

  const handleCancelDrawing = () => {
    setIsDrawingCourierZone(false);
    setDrawnPoints([]);
    if (drawingLayerRef.current) {
      drawingLayerRef.current.clearLayers();
    }
  };

  const handleSaveCourierZone = async () => {
    if (!selectedItem || drawnPoints.length < 3) {
      alert('Vui lòng vẽ ít nhất 3 điểm trên bản đồ để tạo thành một khu vực khép kín!');
      return;
    }

    try {
      const selectedCourier = DEMO_COURIERS.find((c) => c.courierId === selectedCourierId);
      const hubWard = (selectedItem as any).ward || selectedItem.name;
      const hubDistrict = (selectedItem as any).district || 'Quận Trung Tâm';
      const hubProvince = (selectedItem as any).province || selectedItem.name;

      await createCourierAssignmentMutation.mutateAsync({
        courierId: selectedCourierId,
        hubCode: selectedItem.code,
        province: hubProvince,
        district: hubDistrict,
        ward: `${hubWard} - ${newZoneName}`,
        zoneName: newZoneName,
        colorHex: selectedColor,
        boundaryPolygon: [...drawnPoints, drawnPoints[0]],
        isActive: true,
      });

      alert(`✅ Đã lưu thành công Tuyến [${newZoneName}] cho Shipper [${selectedCourier?.fullName || selectedCourierId}]!`);
      handleCancelDrawing();
    } catch (err: any) {
      alert(`Lỗi khi lưu tuyến: ${err.message}`);
    }
  };

  const handleDeleteCourierZone = async (id: string, name?: string | null) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tuyến "${name || 'Này'}"?`)) return;
    try {
      await deleteCourierAssignmentMutation.mutateAsync(id);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Calculate polygon stats for currently selected item
  const selectedPolygon = useMemo(() => {
    if (!selectedItem) return null;
    return (selectedItem as any).polygon || (selectedItem as any).boundaryPolygon || null;
  }, [selectedItem]);

  const selectedStats = useMemo(() => {
    if (!selectedPolygon || selectedPolygon.length < 3) return null;
    const centroid = calculatePolygonCentroid(selectedPolygon);
    const area = (selectedItem as any).areaKm2 || calculatePolygonAreaKm2(selectedPolygon);
    return {
      centroid,
      area,
      verticesCount: selectedPolygon.length,
    };
  }, [selectedPolygon, selectedItem]);

  return (
    <div className="admin-geofence-page">
      {/* Top Header */}
      <header className="admin-geofence-header">
        <div className="admin-geofence-title-row">
          <div className="admin-geofence-title-icon">
            <svg viewBox="0 0 24 24">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <div>
            <h1 className="admin-geofence-title">
              Quản Lý Phân Vùng Tọa Độ Đa Giác Toàn Quốc (100% Bao Phủ Bản Đồ Việt Nam)
            </h1>
            <p className="admin-geofence-subtitle">
              Ranh giới chuẩn Google Maps (Đường viền nét đứt đỏ #EA4335) • Cấp Quốc gia, 3 Vùng Miền & Toàn Bộ 34/63 Tỉnh Thành
            </p>
          </div>
        </div>

        {/* Coverage Layer Switcher Tabs */}
        <div className="admin-geofence-layer-switcher">
          <button
            type="button"
            className={`admin-geofence-layer-tab ${coverageLayer === 'ALL_PROVINCES' ? 'active' : ''}`}
            onClick={() => setCoverageLayer('ALL_PROVINCES')}
          >
            <span>🏙️</span>
            <span>100% Tỉnh Thành</span>
          </button>
          <button
            type="button"
            className={`admin-geofence-layer-tab ${coverageLayer === 'REGIONS' ? 'active' : ''}`}
            onClick={() => setCoverageLayer('REGIONS')}
          >
            <span>🗺️</span>
            <span>3 Vùng Miền</span>
          </button>
          <button
            type="button"
            className={`admin-geofence-layer-tab ${coverageLayer === 'NATIONAL' ? 'active' : ''}`}
            onClick={() => setCoverageLayer('NATIONAL')}
          >
            <span>🇻🇳</span>
            <span>Toàn Quốc</span>
          </button>
          <button
            type="button"
            className={`admin-geofence-layer-tab ${coverageLayer === 'WARD_HUBS' ? 'active' : ''}`}
            onClick={() => setCoverageLayer('WARD_HUBS')}
          >
            <span>🏬</span>
            <span>Bưu Cục Phường</span>
          </button>
          <button
            type="button"
            className={`admin-geofence-layer-tab ${coverageLayer === 'ALL_LAYERS' ? 'active' : ''}`}
            onClick={() => setCoverageLayer('ALL_LAYERS')}
          >
            <span>🌐</span>
            <span>Tất Cả Lớp</span>
          </button>
        </div>

        <div className="admin-geofence-header-actions">
          {!isDrawingCourierZone ? (
            <button
              type="button"
              className="admin-geofence-btn-action primary"
              onClick={handleStartDrawing}
            >
              <span>➕</span>
              <span>Vẽ Tuyến Cho Shipper</span>
            </button>
          ) : (
            <button
              type="button"
              className="admin-geofence-btn-action drawing"
              onClick={handleCancelDrawing}
            >
              <span>✕</span>
              <span>Hủy Chế Độ Vẽ</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="admin-geofence-workspace">
        {/* Left Sidebar: Master List of 100% Vietnam Areas & Hubs */}
        <aside className="admin-geofence-sidebar-left">
          <div className="admin-geofence-search-box">
            <div className="admin-geofence-input-wrap">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm Tỉnh/Thành, Hub, Quận..."
              />
            </div>
          </div>

          <div className="admin-geofence-region-tabs">
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegionFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedRegionFilter('ALL')}
            >
              Tất cả ({allMasterItems.length})
            </button>
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegionFilter === 'NORTH' ? 'active' : ''}`}
              onClick={() => setSelectedRegionFilter('NORTH')}
            >
              Bắc
            </button>
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegionFilter === 'CENTRAL' ? 'active' : ''}`}
              onClick={() => setSelectedRegionFilter('CENTRAL')}
            >
              Trung
            </button>
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegionFilter === 'SOUTH' ? 'active' : ''}`}
              onClick={() => setSelectedRegionFilter('SOUTH')}
            >
              Nam
            </button>
          </div>

          {/* List of Hubs / Provinces */}
          <div className="admin-geofence-hub-list">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.code === item.code;
              const level = (item as any).level ?? 2;
              const poly = (item as any).polygon || (item as any).boundaryPolygon || [];
              const vertices = poly.length;

              return (
                <div
                  key={item.code}
                  className={`admin-geofence-hub-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedItem(item);
                    if (mapRef.current && poly.length >= 3) {
                      const L = (window as any).L;
                      if (L) {
                        const bounds = L.polygon(poly).getBounds();
                        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
                      }
                    } else if (mapRef.current && (item as any).latitude && (item as any).longitude) {
                      mapRef.current.flyTo([(item as any).latitude, (item as any).longitude], 14, { duration: 1 });
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="admin-geofence-hub-item-name">{item.name}</div>
                    <div className="admin-geofence-hub-item-meta">
                      <span className="admin-geofence-hub-item-code">{item.code}</span>
                      {vertices > 0 && (
                        <span className="admin-geofence-vertices-pill">
                          🔴 {vertices} đỉnh
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`admin-geofence-hub-badge level-${level}`}>
                    {level === 0 ? 'Quốc gia' : level === 1 ? 'Vùng' : level === 2 ? 'Tỉnh/TP' : 'Phường'}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Map Canvas */}
        <main className="admin-geofence-map-container">
          <div ref={mapContainerRef} className="admin-geofence-leaflet-mount" />

          {/* Floating High-Definition Map Boundary Search Widget */}
          <div className="admin-geofence-api-search-panel">
            <div className="admin-geofence-api-title">
              <span>🛰️</span>
              <span>Tra Cứu & Nạp Ranh Giới Chuẩn (Google Maps Style)</span>
            </div>
            <p style={{ margin: '0', fontSize: '0.72rem', color: '#94a3b8' }}>
              Tự động khớp dữ liệu 100% Việt Nam hoặc truy vấn GeoJSON vệ tinh thời gian thực.
            </p>

            <form onSubmit={handleFetchHdBoundary} className="admin-geofence-api-form">
              <input
                type="text"
                value={apiSearchQuery}
                onChange={(e) => setApiSearchQuery(e.target.value)}
                placeholder="VD: Hà Nội, Dĩ An, Cần Thơ, Hải Phòng..."
              />
              <button type="submit" disabled={isSearchingApi}>
                {isSearchingApi ? 'Đang tra...' : 'Tìm & Vẽ Vùng'}
              </button>
            </form>

            {fetchedBoundary && (
              <div className="admin-geofence-api-result">
                <div className="admin-geofence-api-result-title">
                  ✓ Nạp thành công {fetchedBoundary.polygon.length} đỉnh tọa độ uốn lượn
                </div>
                <div className="admin-geofence-api-result-details">
                  <strong>Vị trí:</strong> {fetchedBoundary.displayName}
                </div>
                {selectedItem ? (
                  <button
                    type="button"
                    className="admin-geofence-btn-apply"
                    onClick={handleSaveBoundaryToHub}
                    disabled={updateHubMutation.isPending}
                  >
                    {updateHubMutation.isPending
                      ? 'Đang lưu...'
                      : `💾 Áp Dụng Ranh Giới Vào Hub [${selectedItem.code}]`}
                  </button>
                ) : (
                  <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#facc15' }}>
                    👉 Hãy chọn 1 Hub ở cột trái để lưu vào hệ thống.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating Drawing Toolbar for Courier Zone */}
          {isDrawingCourierZone && (
            <div className="admin-geofence-drawing-bar">
              <div className="admin-geofence-drawing-title">
                <span>✏️ Vẽ Phân Khu Cho Shipper</span>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>
                  {drawnPoints.length} điểm đã chọn
                </span>
              </div>

              <div className="admin-geofence-drawing-instruct">
                💡 <strong>Hướng dẫn:</strong> Nhấp chuột lên bản đồ để khoanh vùng phân chia khu vực giao nhận cho Shipper này.
              </div>

              <div className="admin-geofence-drawing-form-group">
                <label>Tên tuyến phân khu:</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="VD: Tuyến Ga Dĩ An - Đông Chiêu"
                />
              </div>

              <div className="admin-geofence-drawing-form-group">
                <label>Shipper phụ trách:</label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                >
                  {DEMO_COURIERS.map((c) => (
                    <option key={c.courierId} value={c.courierId}>
                      {c.fullName} ({c.courierId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-geofence-drawing-form-group">
                <label>Màu sắc nhận diện tuyến:</label>
                <div className="admin-geofence-color-picker-row">
                  {PRESET_COLORS.map((col) => (
                    <div
                      key={col}
                      className={`admin-geofence-color-dot ${selectedColor === col ? 'active' : ''}`}
                      style={{ backgroundColor: col }}
                      onClick={() => setSelectedColor(col)}
                    />
                  ))}
                </div>
              </div>

              <div className="admin-geofence-drawing-actions">
                <button
                  type="button"
                  style={{ background: '#334155', color: '#ffffff' }}
                  onClick={handleCancelDrawing}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  style={{
                    background: drawnPoints.length >= 3 ? '#059669' : '#64748b',
                    color: '#ffffff',
                  }}
                  disabled={drawnPoints.length < 3 || createCourierAssignmentMutation.isPending}
                  onClick={handleSaveCourierZone}
                >
                  {createCourierAssignmentMutation.isPending
                    ? 'Đang lưu...'
                    : `💾 Lưu Tuyến (${drawnPoints.length} điểm)`}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Detailed Boundary & Courier Zones Inspector */}
        <aside className="admin-geofence-sidebar-right">
          <h2 className="admin-geofence-inspector-title">Thông Tin Vùng & Tọa Độ Địa Giới</h2>

          {selectedItem ? (
            <>
              <div className="admin-geofence-detail-card">
                <div className="admin-geofence-detail-row">
                  <span className="admin-geofence-detail-label">Tên Đơn Vị</span>
                  <span className="admin-geofence-detail-val" style={{ color: '#ea4335' }}>
                    {selectedItem.name}
                  </span>
                </div>
                <div className="admin-geofence-detail-row">
                  <span className="admin-geofence-detail-label">Mã Định Danh</span>
                  <span className="admin-geofence-detail-val">{selectedItem.code}</span>
                </div>
                <div className="admin-geofence-detail-row">
                  <span className="admin-geofence-detail-label">Cấp Quản Lý</span>
                  <span className="admin-geofence-detail-val">
                    {(selectedItem as any).level === 0
                      ? 'Cấp 0 (Toàn quốc)'
                      : (selectedItem as any).level === 1
                      ? 'Cấp 1 (Vùng miền)'
                      : (selectedItem as any).level === 2
                      ? 'Cấp 2 (Tỉnh / Thành phố)'
                      : 'Cấp 3 (Phường / Xã)'}
                  </span>
                </div>
                {selectedStats && (
                  <>
                    <div className="admin-geofence-detail-row">
                      <span className="admin-geofence-detail-label">Ranh giới nét cao</span>
                      <span className="admin-geofence-detail-val" style={{ color: '#ea4335' }}>
                        {selectedStats.verticesCount} đỉnh uốn lượn khép kín
                      </span>
                    </div>
                    <div className="admin-geofence-detail-row">
                      <span className="admin-geofence-detail-label">Diện tích ước tính</span>
                      <span className="admin-geofence-detail-val" style={{ color: '#38bdf8' }}>
                        {selectedStats.area > 0 ? `${selectedStats.area.toLocaleString()} km²` : 'Đang cập nhật'}
                      </span>
                    </div>
                    <div className="admin-geofence-detail-row">
                      <span className="admin-geofence-detail-label">Tọa độ tâm (Centroid)</span>
                      <span className="admin-geofence-detail-val" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>
                        {selectedStats.centroid[0].toFixed(4)}, {selectedStats.centroid[1].toFixed(4)}
                      </span>
                    </div>
                  </>
                )}
                {(selectedItem as any).description && (
                  <div className="admin-geofence-detail-row" style={{ flexDirection: 'column', gap: '4px' }}>
                    <span className="admin-geofence-detail-label">Mô tả phạm vi</span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {(selectedItem as any).description}
                    </span>
                  </div>
                )}
              </div>

              {/* Courier Sub-Zones in this Hub/Province */}
              <div className="admin-geofence-courier-zone-header">
                <h3>Các Tuyến Shipper Phụ Trách ({currentItemCourierZones.length})</h3>
                <button
                  type="button"
                  className="admin-geofence-btn-add-zone"
                  onClick={handleStartDrawing}
                >
                  ➕ Thêm Tuyến
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {currentItemCourierZones.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                    Chưa có tuyến Shipper nào được gán trong khu vực này. Bấm "➕ Thêm Tuyến" để phân vùng cho Shipper.
                  </div>
                ) : (
                  currentItemCourierZones.map((zone) => {
                    const courierObj = DEMO_COURIERS.find((c) => c.courierId === zone.courierId);
                    return (
                      <div
                        key={zone.id}
                        className="admin-geofence-courier-item"
                        style={{ borderLeftColor: zone.colorHex || '#38bdf8' }}
                      >
                        <div className="admin-geofence-courier-item-info">
                          <div className="admin-geofence-courier-name">
                            🛵 {courierObj?.fullName || zone.courierId} ({zone.courierId})
                          </div>
                          <div className="admin-geofence-courier-zone-name">
                            {zone.zoneName || zone.ward} ({zone.boundaryPolygon?.length || 0} điểm)
                          </div>
                        </div>
                        <div className="admin-geofence-courier-item-actions">
                          <button
                            type="button"
                            onClick={() => handleDeleteCourierZone(zone.id, zone.zoneName)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
              Hãy chọn một khu vực/Hub từ danh sách hoặc nhấp chuột lên bản đồ.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
