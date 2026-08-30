import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Compass,
  Layers,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  User,
  Users,
  Zap,
} from 'lucide-react';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import {
  useCourierAreaAssignmentsQuery,
  useCreateCourierAreaAssignmentMutation,
  useDeleteCourierAreaAssignmentMutation,
  useUpdateCourierAreaAssignmentMutation,
  useVietnamAdministrativeUnitsQuery,
} from '../../features/masterdata/masterdata.hooks';
import type { CourierAreaAssignmentDto, HubDto } from '../../features/masterdata/masterdata.types';
import {
  calculatePolygonCentroid,
  EXPANDED_WARD_HUBS,
  findOfficialWardForCoordinate,
  findWardForCoordinate,
  isPointInPolygon,
  OFFICIAL_WARD_BOUNDARIES,
  type LocalWardHubItem,
  type OfficialWardBoundary,
} from '../../features/masterdata/vietnamBoundaryData';
import { useCourierOptionsQuery } from '../../features/tasks/tasks.api';
import { useAuthStore } from '../../store/authStore';
import './CourierAreaAssignmentPage.css';

// Preset Colors for Courier Route Recognition
const COURIER_COLOR_PRESETS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#84cc16', // Lime
];

// Fallback Hub Coordinates
const HUB_COORDINATE_MAP: Record<string, { lat: number; lng: number; name: string; province: string; district: string; radiusKm: number }> = {
  'HCM-001': { lat: 10.8010, lng: 106.6570, name: 'Bưu cục Tân Bình / TP.HCM', province: 'Thành phố Hồ Chí Minh', district: 'Quận Tân Bình', radiusKm: 15 },
  'HN-001': { lat: 21.0285, lng: 105.8544, name: 'Bưu cục Đống Đa / Hà Nội', province: 'Thành phố Hà Nội', district: 'Quận Đống Đa', radiusKm: 15 },
  'DN-001': { lat: 16.0678, lng: 108.2208, name: 'Bưu cục Hải Châu / Đà Nẵng', province: 'Thành phố Đà Nẵng', district: 'Quận Hải Châu', radiusKm: 12 },
  'BD-001': { lat: 10.9069, lng: 106.7722, name: 'Bưu cục Dĩ An / Bình Dương', province: 'Tỉnh Bình Dương', district: 'Thành phố Dĩ An', radiusKm: 10 },
  'HP-001': { lat: 20.8449, lng: 106.6881, name: 'Bưu cục Hồng Bàng / Hải Phòng', province: 'Thành phố Hải Phòng', district: 'Quận Hồng Bàng', radiusKm: 12 },
  'CT-001': { lat: 10.0452, lng: 105.7469, name: 'Bưu cục Ninh Kiều / Cần Thơ', province: 'Thành phố Cần Thơ', district: 'Quận Ninh Kiều', radiusKm: 12 },
};

type ViewTabType = 'MAP' | 'ROSTER' | 'COURIER_MATRIX';

export function CourierAreaAssignmentPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const userHubCodes = session?.user.hubCodes ?? [];
  const isSystemAdmin = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;

  // Selected Hub
  const defaultHub = searchParams.get('hubCode') || userHubCodes[0] || 'HCM-001';
  const [activeHubCode, setActiveHubCode] = useState<string>(defaultHub);

  // Tab View
  const [activeTab, setActiveTab] = useState<ViewTabType>('MAP');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Ward for Assignment
  const [selectedWard, setSelectedWard] = useState<OfficialWardBoundary | LocalWardHubItem | null>(null);

  // Form State
  const [formCourierId, setFormCourierId] = useState<string>('');
  const [formColorHex, setFormColorHex] = useState<string>(COURIER_COLOR_PRESETS[0]);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formZoneName, setFormZoneName] = useState<string>('');

  // Simulator State
  const [simLat, setSimLat] = useState<number | ''>('');
  const [simLng, setSimLng] = useState<number | ''>('');
  const [simResult, setSimResult] = useState<{
    lat: number;
    lng: number;
    wardName: string;
    district: string;
    province: string;
    courierId: string | null;
    courierName: string | null;
    isAutoDispatched: boolean;
    simulatedLog: string;
  } | null>(null);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const wardLayersGroupRef = useRef<any>(null);
  const hubMarkerGroupRef = useRef<any>(null);
  const simMarkerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // API Queries
  const hubsQuery = useHubsQuery(accessToken, {});
  const assignmentsQuery = useCourierAreaAssignmentsQuery(accessToken, {
    hubCode: activeHubCode || undefined,
  });
  const couriersQuery = useCourierOptionsQuery(accessToken);
  const adminUnitsQuery = useVietnamAdministrativeUnitsQuery(accessToken);

  // Mutations
  const createMutation = useCreateCourierAreaAssignmentMutation(accessToken);
  const updateMutation = useUpdateCourierAreaAssignmentMutation(accessToken);
  const deleteMutation = useDeleteCourierAreaAssignmentMutation(accessToken);

  // Auto clear message
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Sync default courier when couriers data loaded
  useEffect(() => {
    if (couriersQuery.data && couriersQuery.data.length > 0 && !formCourierId) {
      setFormCourierId(couriersQuery.data[0].courierId);
    }
  }, [couriersQuery.data, formCourierId]);

  // 1. Inject Leaflet CDN assets dynamically
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

  // Hub List
  const availableHubs = useMemo(() => {
    if (hubsQuery.data && hubsQuery.data.length > 0) {
      return hubsQuery.data;
    }
    return Object.entries(HUB_COORDINATE_MAP).map(([code, meta]) => ({
      id: code,
      code,
      name: meta.name,
      level: 2,
      latitude: meta.lat,
      longitude: meta.lng,
      address: `${meta.district}, ${meta.province}`,
      district: meta.district,
      ward: '',
      isActive: true,
      coverageRadiusKm: meta.radiusKm,
    }));
  }, [hubsQuery.data]);

  // Current Hub Info & Center Coordinates
  const currentHubInfo = useMemo(() => {
    const fromRemote = availableHubs.find((h) => h.code === activeHubCode);
    const fallback = HUB_COORDINATE_MAP[activeHubCode] || HUB_COORDINATE_MAP['HCM-001'];
    return {
      code: activeHubCode,
      name: fromRemote?.name || fallback.name,
      lat: fromRemote?.latitude || fallback.lat,
      lng: fromRemote?.longitude || fallback.lng,
      province: fallback.province,
      district: fallback.district,
      radiusKm: fromRemote?.coverageRadiusKm || fallback.radiusKm,
    };
  }, [availableHubs, activeHubCode]);

  // 2. Filter Wards Belonging to Current Hub
  const hubWards = useMemo(() => {
    // Combine official ward boundaries and expanded ward hubs
    const allWards: Array<OfficialWardBoundary | LocalWardHubItem> = [
      ...OFFICIAL_WARD_BOUNDARIES,
      ...EXPANDED_WARD_HUBS,
    ];

    // Priority filter: Wards matching current hub province/district, or nearby within radius
    const hubLat = currentHubInfo.lat;
    const hubLng = currentHubInfo.lng;

    const matched = allWards.filter((w) => {
      const centroid = calculatePolygonCentroid(w.boundaryPolygon);
      const distKm = Math.hypot(centroid[0] - hubLat, centroid[1] - hubLng) * 111;
      return distKm <= currentHubInfo.radiusKm * 1.5;
    });

    if (matched.length > 0) {
      return matched;
    }

    // Fallback: take wards matching province or top wards
    return allWards.slice(0, 30);
  }, [currentHubInfo]);

  // Assignment Map by Ward Name / Code
  const assignmentLookup = useMemo(() => {
    const map = new Map<string, CourierAreaAssignmentDto>();
    (assignmentsQuery.data ?? []).forEach((item) => {
      const key = `${item.province}_${item.district}_${item.ward}`.toLowerCase();
      map.set(key, item);
      map.set(item.ward.toLowerCase(), item);
    });
    return map;
  }, [assignmentsQuery.data]);

  // Assign courier color map for consistent styling
  const courierColorMap = useMemo(() => {
    const map = new Map<string, string>();
    (couriersQuery.data ?? []).forEach((c, idx) => {
      map.set(c.courierId, COURIER_COLOR_PRESETS[idx % COURIER_COLOR_PRESETS.length]);
    });
    // Overlay custom saved colors from DB
    (assignmentsQuery.data ?? []).forEach((a) => {
      if (a.colorHex) {
        map.set(a.courierId, a.colorHex);
      }
    });
    return map;
  }, [couriersQuery.data, assignmentsQuery.data]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalWards = hubWards.length;
    let assignedCount = 0;
    const activeCouriersSet = new Set<string>();

    hubWards.forEach((w) => {
      const key = `${w.province}_${w.district}_${w.name}`.toLowerCase();
      const assignment = assignmentLookup.get(key) || assignmentLookup.get(w.name.toLowerCase());
      if (assignment && assignment.isActive) {
        assignedCount++;
        activeCouriersSet.add(assignment.courierId);
      }
    });

    const unassignedCount = Math.max(0, totalWards - assignedCount);
    const coveragePercent = totalWards > 0 ? Math.round((assignedCount / totalWards) * 100) : 0;

    return {
      totalWards,
      assignedCount,
      unassignedCount,
      coveragePercent,
      activeCouriersCount: activeCouriersSet.size,
    };
  }, [hubWards, assignmentLookup]);

  // 3. Initialize & Render Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) {
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([currentHubInfo.lat, currentHubInfo.lng], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB &copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      wardLayersGroupRef.current = L.layerGroup().addTo(map);
      hubMarkerGroupRef.current = L.layerGroup().addTo(map);

      // Map Click Handler for GPS Simulation
      map.on('click', (e: any) => {
        handleMapClickSimulate(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    } else {
      mapRef.current.setView([currentHubInfo.lat, currentHubInfo.lng], 13);
    }
  }, [leafletLoaded, currentHubInfo]);

  // 4. Render Hub Center Pin and Coverage Circle
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !hubMarkerGroupRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    hubMarkerGroupRef.current.clearLayers();

    // Hub Coverage Circle
    const radiusCircle = L.circle([currentHubInfo.lat, currentHubInfo.lng], {
      radius: currentHubInfo.radiusKm * 1000,
      color: '#2563eb',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#3b82f6',
      fillOpacity: 0.05,
    }).addTo(hubMarkerGroupRef.current);

    radiusCircle.bindTooltip(
      `<div style="font-weight:700; color:#1d4ed8;">🎯 Bán kính phục vụ: ${currentHubInfo.radiusKm} km</div>`,
      { sticky: true }
    );

    // Hub Center Marker with custom icon
    const hubIcon = L.divIcon({
      className: 'hub-center-beacon-marker',
      html: `
        <div style="
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 9999px; background: #1d4ed8; color: #ffffff;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.4); border: 2.5px solid #ffffff; cursor: pointer;
        ">
          <span style="font-size: 16px;">🏢</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const hubMarker = L.marker([currentHubInfo.lat, currentHubInfo.lng], { icon: hubIcon }).addTo(
      hubMarkerGroupRef.current
    );

    hubMarker.bindPopup(`
      <div style="font-family: inherit; padding: 4px;">
        <h4 style="margin:0 0 4px 0; color:#1e293b; font-size:14px;">🏢 ${currentHubInfo.name}</h4>
        <div style="font-size:12px; color:#475569;">Mã Hub: <strong>${currentHubInfo.code}</strong></div>
        <div style="font-size:12px; color:#64748b;">Bán kính điều phối: ${currentHubInfo.radiusKm} km</div>
      </div>
    `);
  }, [leafletLoaded, currentHubInfo]);

  // 5. Render Ward Polygons & Courier Zones on Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !wardLayersGroupRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    wardLayersGroupRef.current.clearLayers();

    hubWards.forEach((ward) => {
      const key = `${ward.province}_${ward.district}_${ward.name}`.toLowerCase();
      const assignment = assignmentLookup.get(key) || assignmentLookup.get(ward.name.toLowerCase());
      const isAssigned = !!assignment && assignment.isActive;
      const isSelected = selectedWard?.code === ward.code;

      const courierId = assignment?.courierId;
      const courier = couriersQuery.data?.find((c) => c.courierId === courierId);
      const zoneColor = isAssigned
        ? assignment?.colorHex || courierColorMap.get(courierId!) || '#10b981'
        : '#f59e0b'; // Amber for unassigned

      const poly = L.polygon(ward.boundaryPolygon, {
        color: isSelected ? '#ffffff' : isAssigned ? zoneColor : '#ef4444',
        weight: isSelected ? 3.5 : isAssigned ? 2 : 1.8,
        dashArray: isAssigned ? undefined : '4, 4',
        fillColor: zoneColor,
        fillOpacity: isSelected ? 0.55 : isAssigned ? 0.35 : 0.12,
      });

      const tooltipContent = `
        <div style="font-family: inherit; font-size: 12px;">
          <div style="font-weight: 700; color: ${isAssigned ? zoneColor : '#dc2626'}; font-size: 13px;">
            ${isAssigned ? '🚚 ' : '⚠️ '}${ward.name}
          </div>
          <div style="color: #475569; font-size: 11px;">${ward.district}, ${ward.province}</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            ${
              isAssigned
                ? `<strong>Shipper:</strong> ${courier ? courier.label : courierId}`
                : `<span style="color:#dc2626; font-weight:600;">Chưa phân công Shipper</span>`
            }
          </div>
        </div>
      `;

      poly.bindTooltip(tooltipContent, { sticky: true });

      poly.on('mouseover', () => {
        poly.setStyle({
          weight: 3,
          fillOpacity: 0.5,
        });
      });

      poly.on('mouseout', () => {
        if (selectedWard?.code !== ward.code) {
          poly.setStyle({
            weight: isAssigned ? 2 : 1.8,
            fillOpacity: isAssigned ? 0.35 : 0.12,
          });
        }
      });

      poly.on('click', () => {
        handleSelectWard(ward, assignment);
      });

      poly.addTo(wardLayersGroupRef.current);
    });
  }, [leafletLoaded, hubWards, assignmentLookup, selectedWard, couriersQuery.data, courierColorMap]);

  // Handle Select Ward from Map or Table
  const handleSelectWard = (
    ward: OfficialWardBoundary | LocalWardHubItem,
    existingAssignment?: CourierAreaAssignmentDto | null
  ) => {
    setSelectedWard(ward);
    const key = `${ward.province}_${ward.district}_${ward.name}`.toLowerCase();
    const assignment =
      existingAssignment || assignmentLookup.get(key) || assignmentLookup.get(ward.name.toLowerCase());

    if (assignment) {
      setFormCourierId(assignment.courierId);
      setFormColorHex(assignment.colorHex || COURIER_COLOR_PRESETS[0]);
      setFormIsActive(assignment.isActive);
      setFormZoneName(assignment.zoneName || `Tuyến ${ward.name}`);
    } else {
      if (couriersQuery.data && couriersQuery.data.length > 0 && !formCourierId) {
        setFormCourierId(couriersQuery.data[0].courierId);
      }
      setFormColorHex(COURIER_COLOR_PRESETS[0]);
      setFormIsActive(true);
      setFormZoneName(`Tuyến ${ward.name}`);
    }
  };

  // 6. Handle Map Click for GPS Point-in-Polygon & Auto-Dispatch Simulation
  const handleMapClickSimulate = (lat: number, lng: number) => {
    setSimLat(parseFloat(lat.toFixed(6)));
    setSimLng(parseFloat(lng.toFixed(6)));

    // Point in polygon check
    let matchedWard: OfficialWardBoundary | LocalWardHubItem | null = null;
    for (const w of hubWards) {
      if (isPointInPolygon({ latitude: lat, longitude: lng }, w.boundaryPolygon)) {
        matchedWard = w;
        break;
      }
    }

    if (!matchedWard) {
      matchedWard = findOfficialWardForCoordinate(lat, lng) || findWardForCoordinate(lat, lng);
    }

    const L = (window as any).L;
    if (L && mapRef.current) {
      if (simMarkerRef.current) {
        mapRef.current.removeLayer(simMarkerRef.current);
      }

      const simIcon = L.divIcon({
        className: 'sim-radar-pin',
        html: `
          <div style="
            position: relative; width: 24px; height: 24px; border-radius: 9999px;
            background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 12px #ef4444;
            animation: pulse 1.5s infinite;
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      simMarkerRef.current = L.marker([lat, lng], { icon: simIcon }).addTo(mapRef.current);
    }

    if (matchedWard) {
      const key = `${matchedWard.province}_${matchedWard.district}_${matchedWard.name}`.toLowerCase();
      const assignment =
        assignmentLookup.get(key) || assignmentLookup.get(matchedWard.name.toLowerCase());
      const isAssigned = !!assignment && assignment.isActive;
      const courier = isAssigned
        ? couriersQuery.data?.find((c) => c.courierId === assignment.courierId)
        : null;

      const simulatedLog = isAssigned
        ? `🤖 [Hệ thống tự động điều phối] Shipper: ${assignment?.courierId} (${courier?.label || 'Shipper'}) - Hub: ${activeHubCode} | Hệ thống tự động so khớp tọa độ GPS rơi vào phân vùng [${matchedWard.name}, ${matchedWard.district}]`
        : `⚠️ [Cảnh báo Điều phối] Tọa độ rơi vào ${matchedWard.name}, ${matchedWard.district} chưa có Shipper phụ trách -> Đơn sẽ chuyển vào Hàng đợi Điều phối Thủ công (Ops Manual Queue).`;

      setSimResult({
        lat,
        lng,
        wardName: matchedWard.name,
        district: matchedWard.district,
        province: matchedWard.province,
        courierId: assignment?.courierId ?? null,
        courierName: courier?.label ?? null,
        isAutoDispatched: isAssigned,
        simulatedLog,
      });
    } else {
      setSimResult({
        lat,
        lng,
        wardName: 'Ngoài vùng Hub',
        district: 'N/A',
        province: 'N/A',
        courierId: null,
        courierName: null,
        isAutoDispatched: false,
        simulatedLog: `⚠️ Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)}) nằm ngoài ranh giới phục vụ của Hub ${activeHubCode}. Đơn hàng cần trung chuyển sang Hub phụ trách khác.`,
      });
    }
  };

  // Submit Assignment Form
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedWard) {
      setErrorMsg('Vui lòng chọn một phường/khu vực trên bản đồ trước khi lưu.');
      return;
    }

    if (!formCourierId) {
      setErrorMsg('Vui lòng chọn Shipper đảm nhiệm tuyến.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const key = `${selectedWard.province}_${selectedWard.district}_${selectedWard.name}`.toLowerCase();
    const existing = assignmentLookup.get(key) || assignmentLookup.get(selectedWard.name.toLowerCase());

    try {
      if (existing) {
        // Update
        await updateMutation.mutateAsync({
          id: existing.id,
          payload: {
            courierId: formCourierId,
            colorHex: formColorHex,
            isActive: formIsActive,
            zoneName: formZoneName || `Tuyến ${selectedWard.name}`,
          },
        });
        setSuccessMsg(`Đã cập nhật phân công tuyến ${selectedWard.name} cho Shipper ${formCourierId} thành công!`);
      } else {
        // Create
        await createMutation.mutateAsync({
          hubCode: activeHubCode,
          courierId: formCourierId,
          province: selectedWard.province,
          district: selectedWard.district,
          ward: selectedWard.name,
          colorHex: formColorHex,
          isActive: formIsActive,
          zoneName: formZoneName || `Tuyến ${selectedWard.name}`,
        });
        setSuccessMsg(`Đã phân công tuyến ${selectedWard.name} cho Shipper ${formCourierId} thành công!`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu phân công tuyến cho Shipper.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Unassign Ward
  const handleDeleteAssignment = async () => {
    if (!accessToken || !selectedWard) return;
    const key = `${selectedWard.province}_${selectedWard.district}_${selectedWard.name}`.toLowerCase();
    const existing = assignmentLookup.get(key) || assignmentLookup.get(selectedWard.name.toLowerCase());

    if (!existing) return;

    if (!window.confirm(`Bạn có chắc chắn muốn hủy phân công tuyến ${selectedWard.name}?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(existing.id);
      setSuccessMsg(`Đã hủy phân công tuyến ${selectedWard.name}. Tuyến chuyển về trạng thái chưa phân công.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi hủy phân công tuyến.');
    }
  };

  // Filtered wards for table view
  const filteredTableWards = useMemo(() => {
    if (!searchTerm.trim()) return hubWards;
    const q = searchTerm.toLowerCase().trim();
    return hubWards.filter((w) => {
      const key = `${w.province}_${w.district}_${w.name}`.toLowerCase();
      const assignment = assignmentLookup.get(key) || assignmentLookup.get(w.name.toLowerCase());
      return (
        w.name.toLowerCase().includes(q) ||
        w.district.toLowerCase().includes(q) ||
        (assignment && assignment.courierId.toLowerCase().includes(q))
      );
    });
  }, [hubWards, searchTerm, assignmentLookup]);

  return (
    <div className="hub-geofence-container">
      {/* 1. Header & Hub Selector */}
      <div className="hub-geofence-header">
        <div className="hub-geofence-title-area">
          <h2>
            <Compass size={28} style={{ color: '#2563eb' }} />
            Quản lý Phân vùng Nội bộ & Phân công Tuyến Shipper
          </h2>
          <p className="hub-geofence-subtitle">
            Bản đồ định vị ranh giới địa lý bưu cục, phân công Shipper đảm nhiệm từng phường/xã và thiết lập quy tắc tự động điều phối đơn hàng theo Geofence.
          </p>
        </div>

        <div className="hub-selector-group">
          <label>🏢 Bưu cục đang quản lý:</label>
          <select
            value={activeHubCode}
            onChange={(e) => {
              setActiveHubCode(e.target.value);
              setSelectedWard(null);
            }}
            className="hub-select-input"
          >
            {availableHubs.map((h) => (
              <option key={h.code} value={h.code}>
                {h.code} - {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Educational Banner */}
      <div className="hub-guide-banner">
        <div className="hub-guide-icon">
          <Zap size={22} />
        </div>
        <div className="hub-guide-content">
          <h4>Cơ chế Điều phối Tự động Thông minh (System Auto-Dispatch Engine)</h4>
          <p>
            Khi đơn hàng mới phát sinh hoặc được quét nhập kho tại bưu cục đích, hệ thống sẽ tự động quét tọa độ GPS & địa chỉ Phường/Xã đối chiếu với bản đồ phân vùng bên dưới. Đơn hàng sẽ được <strong>tự động gán ngay cho Shipper phụ trách tuyến</strong> và ghi nhận trên hành trình là <strong>[Hệ thống tự động điều phối]</strong> mà không cần nhân viên Ops thao tác thủ công.
          </p>
        </div>
      </div>

      {/* 3. KPI Metrics Summary Cards */}
      <div className="hub-kpi-grid">
        <div className="hub-kpi-card">
          <div className="hub-kpi-header">
            <span>Tổng Phường / Tuyến Hub</span>
            <div className="hub-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <MapPin size={18} />
            </div>
          </div>
          <div className="hub-kpi-value">{metrics.totalWards}</div>
          <div className="hub-kpi-subtext">Khu vực địa giới nội bộ Hub quản lý</div>
        </div>

        <div className="hub-kpi-card">
          <div className="hub-kpi-header">
            <span>Tỷ lệ Phủ sóng Phân tuyến</span>
            <div className="hub-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="hub-kpi-value" style={{ color: '#059669' }}>
            {metrics.coveragePercent}%
          </div>
          <div className="hub-kpi-progress-bg">
            <div
              className="hub-kpi-progress-fill"
              style={{
                width: `${metrics.coveragePercent}%`,
                background: metrics.coveragePercent >= 80 ? '#10b981' : '#f59e0b',
              }}
            />
          </div>
        </div>

        <div className="hub-kpi-card">
          <div className="hub-kpi-header">
            <span>Tuyến ĐÃ phân công</span>
            <div className="hub-kpi-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="hub-kpi-value" style={{ color: '#16a34a' }}>
            {metrics.assignedCount} / {metrics.totalWards}
          </div>
          <div className="hub-kpi-subtext">Sẵn sàng tự động tiếp nhận đơn hàng</div>
        </div>

        <div className="hub-kpi-card">
          <div className="hub-kpi-header">
            <span>Tuyến CHƯA phân công (Rủi ro)</span>
            <div
              className="hub-kpi-icon"
              style={{
                background: metrics.unassignedCount > 0 ? '#fef2f2' : '#f0fdf4',
                color: metrics.unassignedCount > 0 ? '#dc2626' : '#16a34a',
              }}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <div
            className="hub-kpi-value"
            style={{ color: metrics.unassignedCount > 0 ? '#dc2626' : '#16a34a' }}
          >
            {metrics.unassignedCount}
          </div>
          <div className="hub-kpi-subtext">Cần gán Shipper để tránh đơn trễ hạn</div>
        </div>

        <div className="hub-kpi-card">
          <div className="hub-kpi-header">
            <span>Shipper Đang Hoạt động</span>
            <div className="hub-kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Truck size={18} />
            </div>
          </div>
          <div className="hub-kpi-value" style={{ color: '#7c3aed' }}>
            {metrics.activeCouriersCount}
          </div>
          <div className="hub-kpi-subtext">Nhân sự giao nhận tại bưu cục</div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Tab View Controls */}
      <div className="hub-view-controls-bar">
        <div className="hub-tab-buttons">
          <button
            type="button"
            className={`hub-tab-btn ${activeTab === 'MAP' ? 'active' : ''}`}
            onClick={() => setActiveTab('MAP')}
          >
            <MapIcon size={16} />
            Bản đồ Phân vùng Tuyến
          </button>
          <button
            type="button"
            className={`hub-tab-btn ${activeTab === 'ROSTER' ? 'active' : ''}`}
            onClick={() => setActiveTab('ROSTER')}
          >
            <List size={16} />
            Danh sách Phân công ({hubWards.length})
          </button>
          <button
            type="button"
            className={`hub-tab-btn ${activeTab === 'COURIER_MATRIX' ? 'active' : ''}`}
            onClick={() => setActiveTab('COURIER_MATRIX')}
          >
            <Users size={16} />
            Ma trận Phủ sóng Shipper
          </button>
        </div>

        <div className="hub-search-box">
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm kiếm phường, quận hoặc Shipper..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 5. TAB 1: INTERACTIVE MAP WORKBENCH */}
      {activeTab === 'MAP' && (
        <div className="hub-workbench-grid">
          {/* Left Column: Interactive Map */}
          <div className="hub-map-card">
            <div className="hub-map-action-tip">
              <span>💡 Click vào bất kỳ đa giác Phường trên bản đồ để gán Shipper | Click để thử giả lập GPS</span>
            </div>

            <div ref={mapContainerRef} className="hub-map-canvas" />

            {/* Floating Legend */}
            <div className="hub-map-floating-legend">
              <div className="hub-legend-title">Chú giải Bản đồ Phân vùng</div>
              <div className="hub-legend-item">
                <div className="hub-legend-color-box" style={{ background: '#2563eb' }} />
                <span>🏢 Tâm Hub & Bán kính phục vụ</span>
              </div>
              <div className="hub-legend-item">
                <div className="hub-legend-color-box" style={{ background: '#10b981' }} />
                <span>🟢 Phường ĐÃ phân công Shipper</span>
              </div>
              <div className="hub-legend-item">
                <div
                  className="hub-legend-color-box"
                  style={{ background: '#f59e0b', border: '1px dashed #ef4444' }}
                />
                <span>🔴 Phường CHƯA phân công (Cần gán)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Assignment Form & Live Simulator */}
          <div className="hub-sidebar-panel">
            {/* Quick Assignment Card */}
            <div className="hub-card-panel">
              <div className="hub-panel-title">
                <span>📝 Phân công Tuyến Shipper</span>
                {selectedWard && (
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                    {selectedWard.name}
                  </span>
                )}
              </div>

              {selectedWard ? (
                <form onSubmit={handleSaveAssignment}>
                  <div className="hub-form-group">
                    <label>Khu vực được chọn (Phường / Xã):</label>
                    <input
                      type="text"
                      className="hub-form-input"
                      value={`${selectedWard.name}, ${selectedWard.district}, ${selectedWard.province}`}
                      disabled
                      style={{ background: '#f8fafc', fontWeight: 600 }}
                    />
                  </div>

                  <div className="hub-form-group">
                    <label>Tên định danh Tuyến:</label>
                    <input
                      type="text"
                      className="hub-form-input"
                      value={formZoneName}
                      onChange={(e) => setFormZoneName(e.target.value)}
                      placeholder="VD: Tuyến Phường 12 - Tân Bình"
                    />
                  </div>

                  <div className="hub-form-group">
                    <label>Shipper đảm nhiệm tuyến:</label>
                    <select
                      className="hub-form-select"
                      value={formCourierId}
                      onChange={(e) => {
                        setFormCourierId(e.target.value);
                        const defaultColor = courierColorMap.get(e.target.value);
                        if (defaultColor) setFormColorHex(defaultColor);
                      }}
                    >
                      <option value="">-- Chọn Shipper --</option>
                      {couriersQuery.data?.map((c) => (
                        <option key={c.courierId} value={c.courierId}>
                          {c.label} ({c.courierId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hub-form-group">
                    <label>Màu nhận diện tuyến trên bản đồ:</label>
                    <div className="hub-color-picker-group">
                      <input
                        type="color"
                        className="hub-color-input"
                        value={formColorHex}
                        onChange={(e) => setFormColorHex(e.target.value)}
                      />
                      <div className="hub-color-presets">
                        {COURIER_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className="hub-color-preset-btn"
                            style={{ background: preset }}
                            onClick={() => setFormColorHex(preset)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="hub-form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <label style={{ margin: 0 }}>Tự động điều phối theo tuyến:</label>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: formIsActive ? '#10b981' : '#94a3b8' }}
                    >
                      {formIsActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="hub-btn-primary"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                      Lưu phân công
                    </button>

                    {assignmentLookup.has(
                      `${selectedWard.province}_${selectedWard.district}_${selectedWard.name}`.toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onClick={handleDeleteAssignment}
                        className="hub-btn-danger"
                        title="Hủy phân công tuyến này"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                  <MapPin size={36} style={{ color: '#94a3b8', marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: 13 }}>
                    Chưa chọn khu vực. Vui lòng click vào một đa giác phường trên bản đồ để thực hiện phân công.
                  </p>
                </div>
              )}
            </div>

            {/* Live Point-in-Polygon & Dispatch Simulator */}
            <div className="hub-simulator-card">
              <h4>
                <Zap size={18} />
                Giả lập Điều phối GPS Tự động
              </h4>
              <p>
                Nhấp vào vị trí bất kỳ trên bản đồ để kiểm tra phân giải tọa độ Point-in-Polygon và xem trước quyết định điều phối tự động của hệ thống.
              </p>

              {simResult && (
                <div className="hub-sim-result-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      📍 Tọa độ: {simResult.lat.toFixed(5)}, {simResult.lng.toFixed(5)}
                    </span>
                    {simResult.isAutoDispatched ? (
                      <span className="hub-sim-badge-success">
                        <CheckCircle size={12} /> Tự động Gán Shipper
                      </span>
                    ) : (
                      <span className="hub-sim-badge-warning">
                        <AlertTriangle size={12} /> Chờ Ops thủ công
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                    🗺️ {simResult.wardName} - {simResult.district}
                  </div>

                  {simResult.courierId && (
                    <div style={{ fontSize: 12, color: '#38bdf8' }}>
                      🚚 Shipper tiếp nhận: <strong>{simResult.courierName || simResult.courierId}</strong>
                    </div>
                  )}

                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Mô phỏng Ghi chú Hành trình đơn:</div>
                    <div className="hub-sim-log-preview">
                      {simResult.simulatedLog}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: ROSTER TABLE VIEW */}
      {activeTab === 'ROSTER' && (
        <div className="hub-table-card">
          <div className="hub-table-header">
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              Danh sách Phân công Tuyến Bưu cục {activeHubCode} ({filteredTableWards.length} Phường/Xã)
            </h4>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="hub-data-table">
              <thead>
                <tr>
                  <th>Khu vực Phường / Xã</th>
                  <th>Quận / Huyện</th>
                  <th>Trạng thái Phân tuyến</th>
                  <th>Shipper phụ trách</th>
                  <th>Màu tuyến</th>
                  <th>Tự động điều phối</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableWards.map((w) => {
                  const key = `${w.province}_${w.district}_${w.name}`.toLowerCase();
                  const assignment =
                    assignmentLookup.get(key) || assignmentLookup.get(w.name.toLowerCase());
                  const isAssigned = !!assignment && assignment.isActive;
                  const courier = couriersQuery.data?.find((c) => c.courierId === assignment?.courierId);

                  return (
                    <tr key={w.code}>
                      <td>
                        <strong>{w.name}</strong>
                      </td>
                      <td>{w.district}</td>
                      <td>
                        {isAssigned ? (
                          <span style={{ padding: '3px 8px', borderRadius: 999, background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 600 }}>
                            🟢 Đã phân công
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600 }}>
                            🔴 Chưa phân công
                          </span>
                        )}
                      </td>
                      <td>
                        {assignment ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} style={{ color: '#64748b' }} />
                            <span>{courier ? courier.label : assignment.courierId}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa gán</span>
                        )}
                      </td>
                      <td>
                        {assignment?.colorHex ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 3, background: assignment.colorHex }} />
                            <span style={{ fontSize: 11, color: '#64748b' }}>{assignment.colorHex}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        {isAssigned ? (
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>🤖 Bật</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>Tắt</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('MAP');
                            handleSelectWard(w, assignment);
                          }}
                          style={{
                            padding: '4px 10px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Chỉnh sửa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB 3: COURIER COVERAGE MATRIX */}
      {activeTab === 'COURIER_MATRIX' && (
        <div className="hub-table-card">
          <div className="hub-table-header">
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              Ma trận Phủ sóng Tuyến theo Shipper tại {activeHubCode}
            </h4>
          </div>

          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {couriersQuery.data?.map((courier) => {
              const assignedWards = hubWards.filter((w) => {
                const key = `${w.province}_${w.district}_${w.name}`.toLowerCase();
                const assignment =
                  assignmentLookup.get(key) || assignmentLookup.get(w.name.toLowerCase());
                return assignment?.courierId === courier.courierId && assignment.isActive;
              });

              const courierColor = courierColorMap.get(courier.courierId) || '#2563eb';

              return (
                <div
                  key={courier.courierId}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    borderLeft: `4px solid ${courierColor}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, color: '#0f172a' }}>{courier.label}</h4>
                      <span style={{ fontSize: 11, color: '#64748b' }}>Mã Shipper: {courier.courierId}</span>
                    </div>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                      {assignedWards.length} Phường
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {assignedWards.length > 0 ? (
                      assignedWards.map((w) => (
                        <span
                          key={w.code}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            color: '#334155',
                          }}
                        >
                          {w.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                        Chưa được phân công phụ trách tuyến nào
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
