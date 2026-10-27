import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Compass,
  Crosshair,
  Layers,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  User,
  Users,
  X,
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
import { useShipperUsersQuery } from '../../features/auth/auth.api';
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
// Fallback Hub Coordinates
const HUB_COORDINATE_MAP: Record<string, { lat: number; lng: number; name: string; province: string; district: string; radiusKm: number }> = {
  // Trọng điểm TP. Hồ Chí Minh
  'HCM-001': { lat: 10.8010, lng: 106.6570, name: 'Bưu cục Tân Bình / TP.HCM', province: 'Thành phố Hồ Chí Minh', district: 'Quận Tân Bình', radiusKm: 15 },
  '07913W001': { lat: 10.8035, lng: 106.6436, name: 'Bưu cục Phường 13 - Tân Bình', province: 'Thành phố Hồ Chí Minh', district: 'Quận Tân Bình', radiusKm: 15 },
  '003079B001': { lat: 10.7715, lng: 106.6932, name: 'Kho Tỉnh TP. Hồ Chí Minh', province: 'Thành phố Hồ Chí Minh', district: 'Quận 1', radiusKm: 25 },
  '07901W001': { lat: 10.7715, lng: 106.6932, name: 'Bưu cục Phường Bến Thành / Q1', province: 'Thành phố Hồ Chí Minh', district: 'Quận 1', radiusKm: 8 },
  '07903W001': { lat: 10.7891, lng: 106.6775, name: 'Bưu cục Phường 13 / Q3', province: 'Thành phố Hồ Chí Minh', district: 'Quận 3', radiusKm: 8 },
  '07905W001': { lat: 10.7538, lng: 106.6782, name: 'Bưu cục Phường 2 / Q5', province: 'Thành phố Hồ Chí Minh', district: 'Quận 5', radiusKm: 8 },
  '07912W001': { lat: 10.8670, lng: 106.6960, name: 'Bưu cục An Phú Đông / Q12', province: 'Thành phố Hồ Chí Minh', district: 'Quận 12', radiusKm: 10 },
  '07401W001': { lat: 10.9032, lng: 106.7725, name: 'Bưu cục TP. Dĩ An / Bình Dương', province: 'Bình Dương', district: 'TP. Dĩ An', radiusKm: 12 },

  // Trọng điểm Hà Nội
  'HN-001': { lat: 21.0285, lng: 105.8544, name: 'Bưu cục Đống Đa / Hà Nội', province: 'Thành phố Hà Nội', district: 'Quận Đống Đa', radiusKm: 15 },
  '001001B001': { lat: 21.0285, lng: 105.8544, name: 'Kho Tỉnh Hà Nội', province: 'Thành phố Hà Nội', district: 'Quận Hoàn Kiếm', radiusKm: 25 },
  '00101W001': { lat: 21.0185, lng: 105.8524, name: 'Bưu cục Tràng Tiền / Hoàn Kiếm', province: 'Thành phố Hà Nội', district: 'Quận Hoàn Kiếm', radiusKm: 8 },
  '00105W001': { lat: 21.0336, lng: 105.7958, name: 'Bưu cục Dịch Vọng Hậu / Cầu Giấy', province: 'Thành phố Hà Nội', district: 'Quận Cầu Giấy', radiusKm: 8 },
  '00108W001': { lat: 21.0050, lng: 105.8450, name: 'Bưu cục Bách Khoa / Hai Bà Trưng', province: 'Thành phố Hà Nội', district: 'Quận Hai Bà Trưng', radiusKm: 8 },

  // Trọng điểm Đà Nẵng
  'DN-001': { lat: 16.0678, lng: 108.2208, name: 'Bưu cục Hải Châu / Đà Nẵng', province: 'Thành phố Đà Nẵng', district: 'Quận Hải Châu', radiusKm: 12 },
  '002048B001': { lat: 16.0678, lng: 108.2208, name: 'Kho Tỉnh Đà Nẵng', province: 'Thành phố Đà Nẵng', district: 'Quận Hải Châu', radiusKm: 20 },

  // Cấp Miền
  '001': { lat: 21.0285, lng: 105.8544, name: 'Trung tâm Vận hành Miền Bắc', province: 'Thành phố Hà Nội', district: 'Quận Hoàn Kiếm', radiusKm: 50 },
  '002': { lat: 16.0678, lng: 108.2208, name: 'Trung tâm Vận hành Miền Trung', province: 'Thành phố Đà Nẵng', district: 'Quận Hải Châu', radiusKm: 50 },
  '003': { lat: 10.7715, lng: 106.6932, name: 'Trung tâm Vận hành Miền Nam', province: 'Thành phố Hồ Chí Minh', district: 'Quận 1', radiusKm: 50 },
  '000HQ001': { lat: 21.0285, lng: 105.8544, name: 'HQ NEXUS Toàn Quốc', province: 'Thành phố Hà Nội', district: 'Quận Hoàn Kiếm', radiusKm: 100 },
};

// Realistic Default Pre-assigned Couriers for Production Demo
const DEFAULT_REALISTIC_ASSIGNMENTS: Record<string, Array<{ ward: string; courierId: string; colorHex: string; zoneName: string }>> = {
  'HCM-001': [
    { ward: 'Phường 13', courierId: '30002019', colorHex: '#2563eb', zoneName: 'Tuyến Tân Bình A - Cộng Hòa / E-Town' },
    { ward: 'Phường 12', courierId: '30002019', colorHex: '#2563eb', zoneName: 'Tuyến Tân Bình A - Hoàng Hoa Thám' },
    { ward: 'Phường 14', courierId: '30002019', colorHex: '#2563eb', zoneName: 'Tuyến Tân Bình A - Bàu Cát / Đồng Đen' },
    { ward: 'Phường 2', courierId: '30002020', colorHex: '#10b981', zoneName: 'Tuyến Tân Bình B - Sân Bay Tân Sơn Nhất' },
    { ward: 'Phường 15', courierId: '30002020', colorHex: '#10b981', zoneName: 'Tuyến Tân Bình B - Phan Huy Ích / Tân Trụ' },
    { ward: 'Phường 1', courierId: '30002021', colorHex: '#8b5cf6', zoneName: 'Tuyến Tân Bình C - Hoàng Văn Thụ / Lăng Cha Cả' },
    { ward: 'Phường 3', courierId: '30002021', colorHex: '#8b5cf6', zoneName: 'Tuyến Tân Bình C - Phạm Văn Hai / Bờ Kênh' },
    { ward: 'Phường 4', courierId: '30002021', colorHex: '#8b5cf6', zoneName: 'Tuyến Tân Bình C - Út Tịch / Triển Lãm' },
    { ward: 'Phường 5', courierId: '30002022', colorHex: '#f59e0b', zoneName: 'Tuyến Tân Bình D - CMT8 / Chợ Phạm Văn Hai' },
    { ward: 'Phường 6', courierId: '30002022', colorHex: '#f59e0b', zoneName: 'Tuyến Tân Bình D - Bắc Hải / Cư Xá' },
    { ward: 'Phường 7', courierId: '30002022', colorHex: '#f59e0b', zoneName: 'Tuyến Tân Bình D - Bành Văn Trân' },
    // Phường 8, 9, 10, 11 are unassigned by default so the user can demonstrate assigning in real-time!
  ],
  '07913W001': [
    { ward: 'Phường 13', courierId: '30002019', colorHex: '#2563eb', zoneName: 'Tuyến Tân Bình A - Cộng Hòa / E-Town' },
    { ward: 'Phường 12', courierId: '30002019', colorHex: '#2563eb', zoneName: 'Tuyến Tân Bình A - Hoàng Hoa Thám' },
    { ward: 'Phường 14', courierId: '30002019', colorHex: '#2563eb', zoneName: 'Tuyến Tân Bình A - Bàu Cát / Đồng Đen' },
    { ward: 'Phường 2', courierId: '30002020', colorHex: '#10b981', zoneName: 'Tuyến Tân Bình B - Sân Bay Tân Sơn Nhất' },
    { ward: 'Phường 15', courierId: '30002020', colorHex: '#10b981', zoneName: 'Tuyến Tân Bình B - Phan Huy Ích / Tân Trụ' },
    { ward: 'Phường 1', courierId: '30002021', colorHex: '#8b5cf6', zoneName: 'Tuyến Tân Bình C - Hoàng Văn Thụ / Lăng Cha Cả' },
    { ward: 'Phường 3', courierId: '30002021', colorHex: '#8b5cf6', zoneName: 'Tuyến Tân Bình C - Phạm Văn Hai / Bờ Kênh' },
    { ward: 'Phường 4', courierId: '30002021', colorHex: '#8b5cf6', zoneName: 'Tuyến Tân Bình C - Út Tịch / Triển Lãm' },
    { ward: 'Phường 5', courierId: '30002022', colorHex: '#f59e0b', zoneName: 'Tuyến Tân Bình D - CMT8 / Chợ Phạm Văn Hai' },
    { ward: 'Phường 6', courierId: '30002022', colorHex: '#f59e0b', zoneName: 'Tuyến Tân Bình D - Bắc Hải / Cư Xá' },
    { ward: 'Phường 7', courierId: '30002022', colorHex: '#f59e0b', zoneName: 'Tuyến Tân Bình D - Bành Văn Trân' },
  ],
  '07901W001': [
    { ward: 'Phường Bến Thành', courierId: '30002015', colorHex: '#3b82f6', zoneName: 'Tuyến Q1 A - Chợ Bến Thành' },
    { ward: 'Phường Bến Nghé', courierId: '30002015', colorHex: '#3b82f6', zoneName: 'Tuyến Q1 A - Phố Đi Bộ / Nhà Hát' },
    { ward: 'Phường Phạm Ngũ Lão', courierId: '30002016', colorHex: '#10b981', zoneName: 'Tuyến Q1 B - Phố Tây Bùi Viện' },
    { ward: 'Phường Đa Kao', courierId: '30002016', colorHex: '#10b981', zoneName: 'Tuyến Q1 B - Đinh Tiên Hoàng' },
    { ward: 'Phường Tân Định', courierId: '30002016', colorHex: '#10b981', zoneName: 'Tuyến Q1 B - Chợ Tân Định' },
  ],
};

// Realistic Preset Addresses for Production Demo
const DEMO_PRESET_ADDRESSES = [
  {
    label: '142 Cộng Hòa, Phường 13, Tân Bình, TP.HCM',
    lat: 10.8035,
    lng: 106.6436,
    ward: 'Phường 13',
    hubCode: 'HCM-001',
    description: 'Tòa nhà E-Town Cộng Hòa, Tân Bình',
  },
  {
    label: 'Ga Quốc Tế Tân Sơn Nhất, Phường 2, Tân Bình, TP.HCM',
    lat: 10.8185,
    lng: 106.6605,
    ward: 'Phường 2',
    hubCode: 'HCM-001',
    description: 'Cảng Hàng Không Quốc Tế Tân Sơn Nhất',
  },
  {
    label: 'Chợ Tân Bình, 172 Lý Thường Kiệt, Phường 8, Tân Bình',
    lat: 10.7870,
    lng: 106.6580,
    ward: 'Phường 8',
    hubCode: 'HCM-001',
    description: 'Trung tâm bán sỉ Chợ Tân Bình',
  },
  {
    label: 'Chợ Bến Thành, Lê Lợi, Phường Bến Thành, Quận 1',
    lat: 10.7715,
    lng: 106.6932,
    ward: 'Phường Bến Thành',
    hubCode: '07901W001',
    description: 'Biểu tượng trung tâm Quận 1, TP.HCM',
  },
  {
    label: 'Bưu điện Trung tâm Hà Nội, Phường Tràng Tiền, Hoàn Kiếm',
    lat: 21.0245,
    lng: 105.8575,
    ward: 'Phường Tràng Tiền',
    hubCode: '00101W001',
    description: 'Khu vực Bờ Hồ Hoàn Kiếm, Hà Nội',
  },
];

type ViewTabType = 'MAP' | 'CUSTOM_ZONES' | 'ROSTER' | 'COURIER_MATRIX';

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

  // Simulator State & Demo Presets
  const [simMode, setSimMode] = useState<'GPS_CLICK' | 'ADDRESS_PRESET'>('GPS_CLICK');
  const [simAddressInput, setSimAddressInput] = useState<string>('');
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

  // Drawing Mode States
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [drawnPoints, setDrawnPoints] = useState<Array<[number, number]>>([]);
  const [drawingZoneName, setDrawingZoneName] = useState<string>('');
  const [drawingCourierId, setDrawingCourierId] = useState<string>('');
  const [drawingColorHex, setDrawingColorHex] = useState<string>(COURIER_COLOR_PRESETS[0]);
  const [drawingIsActive, setDrawingIsActive] = useState<boolean>(true);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const wardLayersGroupRef = useRef<any>(null);
  const wardLabelsGroupRef = useRef<any>(null);
  const customZonesLayerRef = useRef<any>(null);
  const drawingLayerRef = useRef<any>(null);
  const hubMarkerGroupRef = useRef<any>(null);
  const simMarkerRef = useRef<any>(null);
  const simLineRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // API Queries
  const hubsQuery = useHubsQuery(accessToken, {});
  const assignmentsQuery = useCourierAreaAssignmentsQuery(accessToken, {
    hubCode: activeHubCode || undefined,
  });
  // Lấy danh sách tài khoản Shipper thực tế trong CSDL
  const shipperUsersQuery = useShipperUsersQuery(accessToken, { status: 'ACTIVE' });
  const adminUnitsQuery = useVietnamAdministrativeUnitsQuery(accessToken);

  // Tùy chọn lọc: chỉ tài khoản thuộc Hub này hay toàn bộ tài khoản Shipper trong CSDL
  const [filterByActiveHub, setFilterByActiveHub] = useState<boolean>(true);

  // Available Couriers: Lấy đúng dữ liệu tài khoản có trong database.
  // Tuyệt đối không fallback về dữ liệu ảo! Nếu không có thì danh sách rỗng ([]).
  const availableCouriers = useMemo(() => {
    const rawUsers = shipperUsersQuery.data ?? [];
    if (rawUsers.length === 0) return [];

    let filtered = rawUsers;
    if (filterByActiveHub && activeHubCode) {
      filtered = rawUsers.filter((u) => {
        if (!u.hubCodes || u.hubCodes.length === 0) return false;
        return u.hubCodes.some(
          (code) => code.trim().toUpperCase() === activeHubCode.trim().toUpperCase(),
        );
      });
    }

    return filtered.map((u) => ({
      courierId: u.username,
      label: u.displayName ? `${u.displayName} (${u.username})` : u.username,
      name: u.displayName || u.username,
      phone: u.phone || '',
      hubCodes: u.hubCodes || [],
    }));
  }, [shipperUsersQuery.data, filterByActiveHub, activeHubCode]);

  // Map tra cứu tất cả tài khoản Courier trong CSDL
  const allCouriersMap = useMemo(() => {
    const map = new Map<string, { label: string; name: string; phone: string }>();
    (shipperUsersQuery.data ?? []).forEach((u) => {
      map.set(u.username, {
        label: u.displayName ? `${u.displayName} (${u.username})` : u.username,
        name: u.displayName || u.username,
        phone: u.phone || '',
      });
    });
    return map;
  }, [shipperUsersQuery.data]);

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
    if (availableCouriers.length > 0) {
      if (!formCourierId || !availableCouriers.some((c) => c.courierId === formCourierId)) {
        setFormCourierId(availableCouriers[0].courierId);
      }
    } else {
      setFormCourierId('');
    }
  }, [availableCouriers, formCourierId]);

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

  // Hub List with Strict Operations Scope Enforcement
  const availableHubs = useMemo(() => {
    const rawHubs =
      hubsQuery.data && hubsQuery.data.length > 0
        ? hubsQuery.data
        : Object.entries(HUB_COORDINATE_MAP).map(([code, meta]) => ({
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

    // If not SYSTEM_ADMIN or HQ_OPS, lock strictly to the user's assigned Hubs
    const canManageAllHubs =
      isSystemAdmin || (session?.user.roles ?? []).some((r) => r === 'HQ_OPS' || r === 'HQ_MANAGER');

    if (!canManageAllHubs && userHubCodes.length > 0) {
      const allowedSet = new Set(userHubCodes.map((c) => c.trim().toUpperCase()));
      const filtered = rawHubs.filter((h) => allowedSet.has(h.code.trim().toUpperCase()));
      if (filtered.length > 0) {
        return filtered;
      }
    }

    return rawHubs;
  }, [hubsQuery.data, isSystemAdmin, session?.user.roles, userHubCodes]);

  // Sync activeHubCode if not in availableHubs
  useEffect(() => {
    if (availableHubs.length > 0 && !availableHubs.some((h) => h.code === activeHubCode)) {
      setActiveHubCode(availableHubs[0].code);
    }
  }, [availableHubs, activeHubCode]);

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

    const cleanDistrict = (d: string) =>
      d?.toLowerCase().replace(/^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i, '').trim() || '';

    const targetDistrict = cleanDistrict(currentHubInfo.district);

    // 1st Priority: Match exact district cadastral boundaries (e.g. all 15 wards of Tân Bình or all 10 wards of Q1)
    if (targetDistrict) {
      const districtWards = allWards.filter(
        (w) => cleanDistrict(w.district) === targetDistrict
      );
      if (districtWards.length > 0) {
        // De-duplicate by ward name
        const seenNames = new Set<string>();
        const uniqueWards: Array<OfficialWardBoundary | LocalWardHubItem> = [];
        districtWards.forEach((w) => {
          const normName = w.name.toLowerCase().trim();
          if (!seenNames.has(normName)) {
            seenNames.add(normName);
            uniqueWards.push(w);
          }
        });
        // Sort naturally (Phường 1, Phường 2... Phường 15)
        return uniqueWards.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
      }
    }

    // 2nd Priority: Radius proximity match
    const hubLat = currentHubInfo.lat;
    const hubLng = currentHubInfo.lng;
    const matched = allWards.filter((w) => {
      const centroid = calculatePolygonCentroid(w.boundaryPolygon);
      const distKm = Math.hypot(centroid[0] - hubLat, centroid[1] - hubLng) * 111;
      return distKm <= currentHubInfo.radiusKm * 1.5;
    });

    if (matched.length > 0) {
      const seenNames = new Set<string>();
      return matched.filter((w) => {
        const normName = w.name.toLowerCase().trim();
        if (seenNames.has(normName)) return false;
        seenNames.add(normName);
        return true;
      });
    }

    // Fallback: take top wards
    return allWards.slice(0, 15);
  }, [currentHubInfo]);

  // Assignment Map by Ward Name / Code
  const assignmentLookup = useMemo(() => {
    const map = new Map<string, CourierAreaAssignmentDto>();

    // 1. Seed with baseline realistic assignments for production demo
    const defaults = DEFAULT_REALISTIC_ASSIGNMENTS[activeHubCode] || [];
    defaults.forEach((item, idx) => {
      const assignmentDto: CourierAreaAssignmentDto = {
        id: `mock-assignment-${activeHubCode}-${idx}`,
        hubCode: activeHubCode,
        province: currentHubInfo.province,
        district: currentHubInfo.district,
        ward: item.ward,
        courierId: item.courierId,
        colorHex: item.colorHex,
        zoneName: item.zoneName,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      const key = `${currentHubInfo.province}_${currentHubInfo.district}_${item.ward}`.toLowerCase();
      map.set(key, assignmentDto);
      map.set(item.ward.toLowerCase(), assignmentDto);
      map.set(item.ward.toLowerCase().replace(/^phường\s+/i, 'p. '), assignmentDto);
    });

    // 2. Override with live server assignments from DB
    (assignmentsQuery.data ?? []).forEach((item) => {
      const key = `${item.province}_${item.district}_${item.ward}`.toLowerCase();
      map.set(key, item);
      map.set(item.ward.toLowerCase(), item);
      map.set(item.ward.toLowerCase().replace(/^phường\s+/i, 'p. '), item);
    });
    return map;
  }, [assignmentsQuery.data, activeHubCode, currentHubInfo]);

  // Assign courier color map for consistent styling
  const courierColorMap = useMemo(() => {
    const map = new Map<string, string>();
    availableCouriers.forEach((c, idx) => {
      map.set(c.courierId, COURIER_COLOR_PRESETS[idx % COURIER_COLOR_PRESETS.length]);
    });
    // Add default realistic assignment colors
    const defaults = DEFAULT_REALISTIC_ASSIGNMENTS[activeHubCode] || [];
    defaults.forEach((a) => {
      if (a.colorHex) map.set(a.courierId, a.colorHex);
    });
    // Overlay custom saved colors from DB
    (assignmentsQuery.data ?? []).forEach((a) => {
      if (a.colorHex) {
        map.set(a.courierId, a.colorHex);
      }
    });
    return map;
  }, [availableCouriers, assignmentsQuery.data, activeHubCode]);

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

  // Custom drawn zones for current Hub
  const customDrawnZones = useMemo(() => {
    return (assignmentsQuery.data ?? []).filter(
      (a) => a.boundaryPolygon && Array.isArray(a.boundaryPolygon) && a.boundaryPolygon.length >= 3,
    );
  }, [assignmentsQuery.data]);

  // Connect window helpers for map drawing
  useEffect(() => {
    (window as any).__isOpsDrawingMode = isDrawingMode;
    (window as any).__addOpsPoint = (pt: [number, number]) => {
      setDrawnPoints((prev) => [...prev, pt]);
    };
  }, [isDrawingMode]);

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
      wardLabelsGroupRef.current = L.layerGroup().addTo(map);
      customZonesLayerRef.current = L.layerGroup().addTo(map);
      drawingLayerRef.current = L.layerGroup().addTo(map);
      hubMarkerGroupRef.current = L.layerGroup().addTo(map);

      // Map Click Handler: In drawing mode add point, else simulate GPS
      map.on('click', (e: any) => {
        if ((window as any).__isOpsDrawingMode) {
          const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
          (window as any).__addOpsPoint(newPt);
        } else {
          handleMapClickSimulate(e.latlng.lat, e.latlng.lng);
        }
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
      `<div style="font-weight:700; color:#1d4ed8;">Bán kính phục vụ: ${currentHubInfo.radiusKm} km</div>`,
      { sticky: true }
    );

    // Hub Center Marker with custom icon
    const hubIcon = L.divIcon({
      className: 'hub-center-beacon-marker',
      html: `
        <div style="
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 9999px; background: #1d4ed8; color: #ffffff;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.4); border: 2.5px solid #ffffff; cursor: pointer;
        ">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const hubMarker = L.marker([currentHubInfo.lat, currentHubInfo.lng], { icon: hubIcon }).addTo(
      hubMarkerGroupRef.current
    );

    hubMarker.bindPopup(`
      <div style="font-family: inherit; padding: 4px;">
        <h4 style="margin:0 0 4px 0; color:#1e293b; font-size:14px; font-weight:700;">${currentHubInfo.name}</h4>
        <div style="font-size:12px; color:#475569;">Mã Hub: <strong>${currentHubInfo.code}</strong></div>
        <div style="font-size:12px; color:#64748b;">Bán kính điều phối: ${currentHubInfo.radiusKm} km</div>
      </div>
    `);
  }, [leafletLoaded, currentHubInfo]);

  // 5. Update Drawing Layer on point addition
  useEffect(() => {
    if (!drawingLayerRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    drawingLayerRef.current.clearLayers();

    if (drawnPoints.length > 0) {
      drawnPoints.forEach((pt, idx) => {
        const marker = L.circleMarker(pt, {
          radius: 6,
          fillColor: drawingColorHex,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1,
        });
        marker.bindTooltip(`Điểm ${idx + 1}: [${pt[0].toFixed(5)}, ${pt[1].toFixed(5)}]`, { permanent: false });
        drawingLayerRef.current.addLayer(marker);
      });

      if (drawnPoints.length >= 2) {
        const polyline = L.polyline(drawnPoints, {
          color: drawingColorHex,
          weight: 3,
          dashArray: '5, 5',
        });
        drawingLayerRef.current.addLayer(polyline);
      }

      if (drawnPoints.length >= 3) {
        const polygon = L.polygon(drawnPoints, {
          color: drawingColorHex,
          weight: 2.5,
          fillColor: drawingColorHex,
          fillOpacity: 0.35,
        });
        drawingLayerRef.current.addLayer(polygon);
      }
    }
  }, [drawnPoints, drawingColorHex, leafletLoaded]);

  // 6. Render Custom Drawn Zones on Map
  useEffect(() => {
    if (!customZonesLayerRef.current || !leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    customZonesLayerRef.current.clearLayers();

    customDrawnZones.forEach((zone) => {
      if (zone.boundaryPolygon && zone.boundaryPolygon.length >= 3) {
        const zoneColor = zone.colorHex || '#0284c7';
        const courierObj = allCouriersMap.get(zone.courierId);

        const subZone = L.polygon(zone.boundaryPolygon, {
          color: zone.isActive ? zoneColor : '#94a3b8',
          weight: 3,
          fillColor: zoneColor,
          fillOpacity: zone.isActive ? 0.38 : 0.1,
          dashArray: zone.isActive ? undefined : '6, 6',
        });

        subZone.bindTooltip(
          `<div style="font-family: inherit; font-size: 12px;">
            <div style="font-weight: 700; color: ${zoneColor}; font-size: 13px;">
              Dải toạ độ: ${zone.zoneName || zone.ward}
            </div>
            <div style="color: #475569; font-size: 11px;">${zone.district}, ${zone.province}</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
              <strong>Bưu tá:</strong> ${courierObj?.label || zone.courierId}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              ${zone.boundaryPolygon.length} điểm toạ độ khép kín
            </div>
          </div>`,
          { sticky: true },
        );

        subZone.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          setSimLat(zone.boundaryPolygon[0][0]);
          setSimLng(zone.boundaryPolygon[0][1]);
          handleMapClickSimulate(zone.boundaryPolygon[0][0], zone.boundaryPolygon[0][1]);
        });

        customZonesLayerRef.current.addLayer(subZone);
      }
    });
  }, [customDrawnZones, leafletLoaded, allCouriersMap]);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !wardLayersGroupRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    wardLayersGroupRef.current.clearLayers();
    if (wardLabelsGroupRef.current) {
      wardLabelsGroupRef.current.clearLayers();
    }

    const allCoords: [number, number][] = [];

    hubWards.forEach((ward) => {
      const key = `${ward.province}_${ward.district}_${ward.name}`.toLowerCase();
      const assignment = assignmentLookup.get(key) || assignmentLookup.get(ward.name.toLowerCase());
      const isAssigned = !!assignment && assignment.isActive;
      const isSelected = selectedWard?.code === ward.code;

      const courierId = assignment?.courierId;
      const courier = courierId ? allCouriersMap.get(courierId) : null;
      const zoneColor = isAssigned
        ? assignment?.colorHex || courierColorMap.get(courierId!) || '#10b981'
        : '#f59e0b'; // Amber for unassigned

      // Collect coordinates for auto-fit bounds
      if (Array.isArray(ward.boundaryPolygon)) {
        ward.boundaryPolygon.forEach((pt) => allCoords.push(pt));
      }

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
            ${ward.name}
          </div>
          <div style="color: #475569; font-size: 11px;">${ward.district}, ${ward.province}</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            ${
              isAssigned
                ? `<strong>Bưu tá:</strong> ${courier ? courier.label : courierId}`
                : `<span style="color:#dc2626; font-weight:600;">Chưa phân công bưu tá</span>`
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

      // Render permanent centroid label badge on the map
      if (wardLabelsGroupRef.current && Array.isArray(ward.boundaryPolygon) && ward.boundaryPolygon.length >= 3) {
        const centroid = calculatePolygonCentroid(ward.boundaryPolygon);
        const wardShort = ward.name.replace(/^phường\s+/i, 'P.');
        const courierShort = courier?.name || courierId;
        const badgeHtml = `
          <div class="ward-map-badge ${isAssigned ? 'assigned' : 'unassigned'}">
            <span class="ward-map-badge-title">${wardShort}</span>
            <span class="ward-map-badge-sub" style="color: ${isAssigned ? zoneColor : '#b45309'}">
              ${isAssigned ? courierShort : 'Chưa gán'}
            </span>
          </div>
        `;
        const badgeIcon = L.divIcon({
          className: 'custom-ward-label-container',
          html: badgeHtml,
          iconSize: [80, 26],
          iconAnchor: [40, 13],
        });
        const labelMarker = L.marker(centroid, { icon: badgeIcon, interactive: false });
        labelMarker.addTo(wardLabelsGroupRef.current);
      }
    });

    // Auto-fit bounds if we have coordinates
    if (mapRef.current && allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      mapRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    }
  }, [leafletLoaded, hubWards, assignmentLookup, selectedWard, allCouriersMap, courierColorMap]);

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
      if (availableCouriers.length > 0 && !formCourierId) {
        setFormCourierId(availableCouriers[0].courierId);
      }
      setFormColorHex(COURIER_COLOR_PRESETS[0]);
      setFormIsActive(true);
      setFormZoneName(`Tuyến ${ward.name}`);
    }
  };

  // Drawing Handlers
  const handleStartDrawing = () => {
    setIsDrawingMode(true);
    setDrawnPoints([]);
    setDrawingZoneName(`Tuyến Toạ Độ ${customDrawnZones.length + 1} - ${currentHubInfo.name}`);
    setDrawingCourierId(availableCouriers[0]?.courierId || formCourierId || '');
    setDrawingColorHex(COURIER_COLOR_PRESETS[customDrawnZones.length % COURIER_COLOR_PRESETS.length]);
  };

  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    setDrawnPoints([]);
    if (drawingLayerRef.current) {
      drawingLayerRef.current.clearLayers();
    }
  };

  const handleUndoPoint = () => {
    setDrawnPoints((prev) => prev.slice(0, -1));
  };

  const handleSaveDrawnZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (drawnPoints.length < 3) {
      setErrorMsg('Vui lòng click trên bản đồ chấm ít nhất 3 điểm toạ độ để tạo thành đa giác khép kín!');
      return;
    }
    if (!drawingCourierId) {
      setErrorMsg('Vui lòng chọn Shipper phụ trách dải toạ độ này!');
      return;
    }

    setSubmitting(true);
    try {
      const closedPoints: Array<[number, number]> = [...drawnPoints, drawnPoints[0]];
      const courierObj = allCouriersMap.get(drawingCourierId);
      const zoneLabel = drawingZoneName.trim() || `Tuyến Toạ Độ - ${courierObj?.label || drawingCourierId}`;

      await createMutation.mutateAsync({
        hubCode: activeHubCode,
        courierId: drawingCourierId,
        province: currentHubInfo.province || 'Hồ Chí Minh',
        district: currentHubInfo.district || 'Quận Trung Tâm',
        ward: zoneLabel,
        zoneName: zoneLabel,
        colorHex: drawingColorHex,
        boundaryPolygon: closedPoints,
        isActive: drawingIsActive,
      });

      setSuccessMsg(`Đã lưu dải toạ độ tùy biến "${zoneLabel}" thành công!`);
      handleCancelDrawing();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu dải toạ độ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomZone = async (zone: CourierAreaAssignmentDto) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dải toạ độ "${zone.zoneName || zone.ward}"?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(zone.id);
      setSuccessMsg(`Đã xóa dải toạ độ thành công.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi xóa dải toạ độ.');
    }
  };

  const handleZoomToZone = (zone: CourierAreaAssignmentDto) => {
    if (!mapRef.current || !zone.boundaryPolygon || zone.boundaryPolygon.length === 0) return;
    const L = (window as any).L;
    if (!L) return;
    const bounds = L.latLngBounds(zone.boundaryPolygon);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  // Helper for rendering simulation marker and dashed transit line to Hub
  const renderSimMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (simMarkerRef.current) {
      simMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const simIcon = L.divIcon({
        className: 'sim-gps-marker',
        html: `<div style="background: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(239, 68, 68, 0.9); animation: pulse 1.5s infinite;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      simMarkerRef.current = L.marker([lat, lng], { icon: simIcon }).addTo(mapRef.current);
    }

    // Connect line to hub center
    const hubCenter: [number, number] = [currentHubInfo.lat, currentHubInfo.lng];
    if (simLineRef.current) {
      simLineRef.current.setLatLngs([[lat, lng], hubCenter]);
    } else {
      simLineRef.current = L.polyline([[lat, lng], hubCenter], {
        color: '#2563eb',
        weight: 2,
        dashArray: '6, 6',
        opacity: 0.75,
      }).addTo(mapRef.current);
    }
  };

  const handleSelectPresetAddress = (preset: (typeof DEMO_PRESET_ADDRESSES)[number]) => {
    setSimAddressInput(preset.label);
    if (preset.hubCode && preset.hubCode !== activeHubCode) {
      setActiveHubCode(preset.hubCode);
    }
    if (mapRef.current) {
      mapRef.current.flyTo([preset.lat, preset.lng], 14, { duration: 0.8 });
    }
    setTimeout(() => {
      handleMapClickSimulate(preset.lat, preset.lng);
    }, 200);
  };

  const handleSimulateCustomAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAddressInput.trim()) return;

    const matchedPreset = DEMO_PRESET_ADDRESSES.find(
      (p) =>
        p.label.toLowerCase().includes(simAddressInput.toLowerCase()) ||
        p.ward.toLowerCase().includes(simAddressInput.toLowerCase()),
    );
    if (matchedPreset) {
      handleSelectPresetAddress(matchedPreset);
      return;
    }

    const matchedWard = hubWards.find((w) =>
      simAddressInput.toLowerCase().includes(w.name.toLowerCase()),
    );
    if (matchedWard && Array.isArray(matchedWard.boundaryPolygon) && matchedWard.boundaryPolygon.length > 0) {
      const centroid = calculatePolygonCentroid(matchedWard.boundaryPolygon);
      if (mapRef.current) {
        mapRef.current.flyTo(centroid, 14, { duration: 0.8 });
      }
      setTimeout(() => {
        handleMapClickSimulate(centroid[0], centroid[1]);
      }, 200);
      return;
    }

    // Default to hub with small offset
    handleMapClickSimulate(currentHubInfo.lat + 0.006, currentHubInfo.lng + 0.006);
  };

  // 8. Handle Map Click for GPS Point-in-Polygon & Auto-Dispatch Simulation
  const handleMapClickSimulate = (lat: number, lng: number) => {
    setSimLat(parseFloat(lat.toFixed(6)));
    setSimLng(parseFloat(lng.toFixed(6)));

    renderSimMarker(lat, lng);

    // PRIORITY 1: Check Custom Drawn Coordinate Geofences
    let matchedCustomZone: CourierAreaAssignmentDto | null = null;
    for (const zone of customDrawnZones) {
      if (zone.boundaryPolygon && zone.boundaryPolygon.length >= 3 && zone.isActive) {
        if (isPointInPolygon({ latitude: lat, longitude: lng }, zone.boundaryPolygon)) {
          matchedCustomZone = zone;
          break;
        }
      }
    }

    if (matchedCustomZone) {
      const courier = allCouriersMap.get(matchedCustomZone.courierId);
      const simulatedLog = `[Hệ thống tự động điều phối - Geofence Tọa độ] Tọa độ điểm lấy hàng (${lat.toFixed(5)}, ${lng.toFixed(5)}) nằm chính xác trong Dải toạ độ đã vẽ [${matchedCustomZone.zoneName || matchedCustomZone.ward}] ➔ Tự động gán ngay cho Shipper: ${matchedCustomZone.courierId} (${courier?.label || 'Shipper'}).`;

      setSimResult({
        lat,
        lng,
        wardName: `Dải toạ độ: ${matchedCustomZone.zoneName || matchedCustomZone.ward}`,
        district: matchedCustomZone.district,
        province: matchedCustomZone.province,
        courierId: matchedCustomZone.courierId,
        courierName: courier?.label || matchedCustomZone.courierId,
        isAutoDispatched: true,
        simulatedLog,
      });
      return;
    }

    // PRIORITY 2: Check Official Ward Boundary Polygons
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

    if (matchedWard) {
      const key = `${matchedWard.province}_${matchedWard.district}_${matchedWard.name}`.toLowerCase();
      const assignment =
        assignmentLookup.get(key) || assignmentLookup.get(matchedWard.name.toLowerCase());
      const isAssigned = !!assignment && assignment.isActive;
      const courier = isAssigned && assignment
        ? allCouriersMap.get(assignment.courierId)
        : null;

      const simulatedLog = isAssigned
        ? `[Hệ thống tự động điều phối - Địa giới Phường] Tọa độ (${lat.toFixed(5)}, ${lng.toFixed(5)}) rơi vào ${matchedWard.name}, ${matchedWard.district} ➔ Gán Shipper: ${assignment?.courierId} (${courier?.label || 'Shipper'}) thuộc Hub ${activeHubCode}.`
        : `[Cảnh báo điều phối] Tọa độ rơi vào ${matchedWard.name}, ${matchedWard.district} chưa được phân công dải toạ độ hoặc Shipper phụ trách ➔ Đơn chuyển vào hàng đợi điều phối thủ công.`;

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
        simulatedLog: `[Cảnh báo] Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)}) nằm ngoài ranh giới phục vụ của Hub ${activeHubCode}. Đơn hàng cần chuyển tiếp sang bưu cục phụ trách khác.`,
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

        <div className="hub-selector-group" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label>Bưu cục vận hành:</label>
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

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              cursor: 'pointer',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: 8,
              color: '#334155',
              fontWeight: 500,
              marginTop: 18,
            }}
          >
            <input
              type="checkbox"
              checked={filterByActiveHub}
              onChange={(e) => setFilterByActiveHub(e.target.checked)}
              style={{ accentColor: '#2563eb' }}
            />
            <span>
              Chỉ lọc Shipper thuộc Hub <strong>{activeHubCode}</strong> (
              {shipperUsersQuery.isLoading ? 'Đang tải...' : `${availableCouriers.length} tài khoản CSDL`}
              )
            </span>
          </label>
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
            <span>Shipper Có Trong CSDL</span>
            <div className="hub-kpi-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Truck size={18} />
            </div>
          </div>
          <div className="hub-kpi-value" style={{ color: '#7c3aed' }}>
            {shipperUsersQuery.isLoading ? '...' : availableCouriers.length}
          </div>
          <div className="hub-kpi-subtext">
            {shipperUsersQuery.isLoading
              ? 'Đang tải tài khoản CSDL...'
              : filterByActiveHub
              ? `${metrics.activeCouriersCount} Shipper đã phân công tuyến tại Hub`
              : `Toàn bộ Shipper CSDL (${metrics.activeCouriersCount} đã gán tuyến)`}
          </div>
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
            className={`hub-tab-btn ${activeTab === 'CUSTOM_ZONES' ? 'active' : ''}`}
            onClick={() => setActiveTab('CUSTOM_ZONES')}
          >
            <Layers size={16} />
            Dải Toạ Độ Đã Vẽ ({customDrawnZones.length})
          </button>
          <button
            type="button"
            className={`hub-tab-btn ${activeTab === 'ROSTER' ? 'active' : ''}`}
            onClick={() => setActiveTab('ROSTER')}
          >
            <List size={16} />
            Danh sách Phường xã ({hubWards.length})
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
            placeholder="Tìm kiếm tuyến, phường, quận hoặc Shipper..."
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
            {/* Drawing Mode Toolbar */}
            <div className="hub-draw-toolbar">
              {isDrawingMode ? (
                <>
                  <div className="hub-draw-status-badge">
                    <Pencil size={15} />
                    <span>Đang ở Chế độ Vẽ Tuyến: Click trên bản đồ để chấm các đỉnh dải toạ độ ({drawnPoints.length} điểm)</span>
                  </div>
                  <div className="hub-draw-actions">
                    {drawnPoints.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUndoPoint}
                        className="hub-btn-draw-undo"
                        title="Hoàn tác điểm vừa chấm"
                      >
                        <RotateCcw size={14} />
                        Hoàn tác
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCancelDrawing}
                      className="hub-btn-draw-cancel"
                      title="Hủy vẽ dải toạ độ"
                    >
                      <X size={14} />
                      Hủy vẽ
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                    <Compass size={16} style={{ color: '#0284c7' }} />
                    <span>Click bản đồ để gán Shipper hoặc vẽ dải toạ độ đa giác riêng.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartDrawing}
                    className="hub-btn-draw-start"
                  >
                    <Pencil size={15} />
                    Vẽ dải toạ độ tuyến
                  </button>
                </>
              )}
            </div>

            <div className="hub-map-action-tip">
              <span>{isDrawingMode ? 'Nhấp chuột vào các góc đường trên bản đồ để tạo thành đa giác khép kín.' : 'Nhấp đa giác Phường để phân công bưu tá | Nhấp điểm bất kỳ để thử nghiệm điều phối GPS.'}</span>
            </div>

            <div ref={mapContainerRef} className="hub-map-canvas" />

            {/* Floating Legend */}
            <div className="hub-map-floating-legend">
              <div className="hub-legend-title">Chú giải Bản đồ Phân vùng</div>
              <div className="hub-legend-item">
                <div className="hub-legend-color-box" style={{ background: '#2563eb' }} />
                <span>Tâm bưu cục & Bán kính phục vụ</span>
              </div>
              <div className="hub-legend-item">
                <div className="hub-legend-color-box" style={{ background: '#0284c7', border: '1.5px solid #ffffff' }} />
                <span>Dải toạ độ đã vẽ ({customDrawnZones.length} tuyến)</span>
              </div>
              <div className="hub-legend-item">
                <div className="hub-legend-color-box" style={{ background: '#10b981' }} />
                <span>Phường đã phân công bưu tá</span>
              </div>
              <div className="hub-legend-item">
                <div
                  className="hub-legend-color-box"
                  style={{ background: '#f59e0b', border: '1px dashed #ef4444' }}
                />
                <span>Phường chưa phân công</span>
              </div>
            </div>
          </div>

          {/* Right Column: Assignment Form & Live Simulator */}
          <div className="hub-sidebar-panel">
            {/* Quick Assignment / Drawing Card */}
            {isDrawingMode ? (
              <div className="hub-card-panel hub-draw-panel-active">
                <div className="hub-panel-title" style={{ color: '#0284c7' }}>
                  <span>Thiết lập Tuyến Dải Toạ Độ Mới</span>
                  <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4 }}>
                    {drawnPoints.length} điểm chấm
                  </span>
                </div>

                <form onSubmit={handleSaveDrawnZone}>
                  <div className="hub-form-group">
                    <label>Tên Tuyến / Dải Toạ Độ:</label>
                    <input
                      type="text"
                      className="hub-form-input"
                      value={drawingZoneName}
                      onChange={(e) => setDrawingZoneName(e.target.value)}
                      placeholder="VD: Tuyến Phố 30/4 - Chợ Dĩ An"
                      required
                    />
                  </div>

                  <div className="hub-form-group">
                    <label>Shipper phụ trách tuyến:</label>
                    <select
                      className="hub-form-select"
                      value={drawingCourierId}
                      onChange={(e) => {
                        setDrawingCourierId(e.target.value);
                        const clr = courierColorMap.get(e.target.value);
                        if (clr) setDrawingColorHex(clr);
                      }}
                      required
                      disabled={availableCouriers.length === 0}
                    >
                      {availableCouriers.length === 0 ? (
                        <option value="">-- Không có tài khoản Shipper nào trong CSDL --</option>
                      ) : (
                        <>
                          <option value="">-- Chọn Shipper phụ trách ({availableCouriers.length} tài xế) --</option>
                          {availableCouriers.map((c) => (
                            <option key={c.courierId} value={c.courierId}>
                              {c.label} ({c.courierId})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {availableCouriers.length === 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#dc2626' }}>
                        Chưa có tài khoản Shipper {filterByActiveHub ? `thuộc bưu cục ${activeHubCode}` : ''}. Vui lòng tạo tài khoản nhân sự trước khi gán tuyến.
                      </div>
                    )}
                  </div>

                  <div className="hub-form-group">
                    <label>Màu nhận diện tuyến:</label>
                    <div className="hub-color-picker-group">
                      <input
                        type="color"
                        className="hub-color-input"
                        value={drawingColorHex}
                        onChange={(e) => setDrawingColorHex(e.target.value)}
                      />
                      <div className="hub-color-presets">
                        {COURIER_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className="hub-color-preset-btn"
                            style={{ background: preset }}
                            onClick={() => setDrawingColorHex(preset)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="hub-form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <label style={{ margin: 0 }}>Tự động điều phối theo tuyến:</label>
                    <button
                      type="button"
                      onClick={() => setDrawingIsActive(!drawingIsActive)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: drawingIsActive ? '#10b981' : '#94a3b8' }}
                    >
                      {drawingIsActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>

                  <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 8, fontSize: 11, color: '#64748b' }}>
                    {drawnPoints.length < 3 ? (
                      <span style={{ color: '#dc2626' }}>Cần thêm ít nhất {3 - drawnPoints.length} điểm trên bản đồ để tạo thành đa giác khép kín.</span>
                    ) : (
                      <span style={{ color: '#059669' }}>Đã xác định {drawnPoints.length} điểm toạ độ. Sẵn sàng lưu đa giác khép kín ({drawnPoints.length + 1} toạ độ).</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      type="submit"
                      disabled={submitting || drawnPoints.length < 3 || availableCouriers.length === 0}
                      className="hub-btn-primary"
                      style={{ flex: 1 }}
                    >
                      {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      Lưu Tuyến Dải Toạ Độ
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDrawing}
                      className="hub-btn-danger"
                      title="Hủy vẽ"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="hub-card-panel">
                <div className="hub-panel-title">
                  <span>Phân công Tuyến Bưu tá (Theo Phường)</span>
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
                      disabled={availableCouriers.length === 0}
                    >
                      {availableCouriers.length === 0 ? (
                        <option value="">-- Không có tài khoản Shipper nào trong CSDL --</option>
                      ) : (
                        <>
                          <option value="">-- Chọn Shipper ({availableCouriers.length} tài xế) --</option>
                          {availableCouriers.map((c) => (
                            <option key={c.courierId} value={c.courierId}>
                              {c.label} ({c.courierId})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {availableCouriers.length === 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: '#dc2626' }}>
                        Chưa có tài khoản Shipper {filterByActiveHub ? `thuộc bưu cục ${activeHubCode}` : ''}.
                      </div>
                    )}
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
                      disabled={submitting || availableCouriers.length === 0}
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
          )}

            {/* Live Point-in-Polygon & Dispatch Simulator */}
            <div className="hub-simulator-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h4 style={{ margin: 0 }}>
                  Thử nghiệm Điều phối Tuyến (Geofence Engine)
                </h4>
                <span className="hub-sim-zero-cost-badge">
                  Thuật toán Ray-Casting (Local)
                </span>
              </div>
              <p>
                Kiểm tra so khớp Point-in-Polygon và phân quyền điều phối tự động tức thời theo thời gian thực mà <strong>không tốn chi phí gọi Google Maps API</strong>.
              </p>

              {/* Demo Mode Tabs */}
              <div className="hub-sim-demo-tabs">
                <button
                  type="button"
                  className={`hub-sim-demo-tab-btn ${simMode === 'GPS_CLICK' ? 'active' : ''}`}
                  onClick={() => setSimMode('GPS_CLICK')}
                >
                  <Compass size={13} />
                  Chấm GPS trên bản đồ
                </button>
                <button
                  type="button"
                  className={`hub-sim-demo-tab-btn ${simMode === 'ADDRESS_PRESET' ? 'active' : ''}`}
                  onClick={() => setSimMode('ADDRESS_PRESET')}
                >
                  <MapPin size={13} />
                  Địa chỉ thực tế mẫu (1-Click)
                </button>
              </div>

              {/* 1-Click Demo Presets */}
              {simMode === 'ADDRESS_PRESET' && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Chọn nhanh địa chỉ thực tế để demo:
                  </div>
                  <div className="hub-sim-demo-presets">
                    {DEMO_PRESET_ADDRESSES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="hub-sim-preset-btn"
                        onClick={() => handleSelectPresetAddress(preset)}
                      >
                        <span className="hub-sim-preset-btn-name">{preset.label}</span>
                        <span className="hub-sim-preset-btn-desc">{preset.description}</span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSimulateCustomAddress} style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input
                      type="text"
                      className="hub-form-input"
                      style={{ fontSize: 12, padding: '7px 10px', background: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      placeholder="Hoặc gõ địa chỉ / tên phường..."
                      value={simAddressInput}
                      onChange={(e) => setSimAddressInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="hub-btn-primary"
                      style={{ fontSize: 12, padding: '7px 12px', whiteSpace: 'nowrap' }}
                    >
                      Kiểm tra
                    </button>
                  </form>
                </div>
              )}

              {/* 5-Step Pipeline Breakdown */}
              <div className="hub-sim-step-list">
                <div className={`hub-sim-step-item ${simResult ? 'active' : ''}`}>
                  <span className="hub-sim-step-dot" />
                  <span className="hub-sim-step-text">
                    1. Điểm lấy/giao: {simResult ? `${simResult.lat.toFixed(4)}, ${simResult.lng.toFixed(4)}` : 'Chờ điểm thử nghiệm'}
                  </span>
                </div>
                <div className={`hub-sim-step-item ${simResult ? 'active' : ''}`}>
                  <span className="hub-sim-step-dot" />
                  <span className="hub-sim-step-text">
                    2. Bán kính Hub trực thuộc: {currentHubInfo.name} ({currentHubInfo.radiusKm} km)
                  </span>
                </div>
                <div className={`hub-sim-step-item ${simResult ? 'active' : ''}`}>
                  <span className="hub-sim-step-dot" />
                  <span className="hub-sim-step-text">
                    3. Quét đa giác Ray-casting: {simResult ? simResult.wardName : 'Chưa quét'}
                  </span>
                </div>
                <div className={`hub-sim-step-item ${simResult?.courierId ? 'active' : ''}`}>
                  <span className="hub-sim-step-dot" />
                  <span className="hub-sim-step-text">
                    4. Khớp Shipper trực tuyến: {simResult?.courierName || 'Chưa gán'}
                  </span>
                </div>
                <div className={`hub-sim-step-item ${simResult?.isAutoDispatched ? 'active' : ''}`}>
                  <span className="hub-sim-step-dot" />
                  <span className="hub-sim-step-text">
                    5. Lệnh điều phối thời gian thực: {simResult?.isAutoDispatched ? 'Thành công (Tự động)' : 'Chờ xác nhận'}
                  </span>
                </div>
              </div>

              {simResult && (
                <div className="hub-sim-result-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      Tọa độ: {simResult.lat.toFixed(5)}, {simResult.lng.toFixed(5)}
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

                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginTop: 4 }}>
                    {simResult.wardName} - {simResult.district}
                  </div>

                  {simResult.courierId && (
                    <div style={{ fontSize: 12, color: '#38bdf8', marginTop: 2 }}>
                      Bưu tá tiếp nhận: <strong>{simResult.courierName || simResult.courierId}</strong>
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                      Mô phỏng Ghi chú Hành trình đơn:
                    </div>
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

      {/* TAB: CUSTOM DRAWN GEOFENCE ZONES */}
      {activeTab === 'CUSTOM_ZONES' && (
        <div className="hub-table-card">
          <div className="hub-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                Danh sách Dải Toạ Độ Tuyến Vẽ Riêng tại Bưu cục {activeHubCode} ({customDrawnZones.length} tuyến)
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b' }}>
                Các dải toạ độ đa giác tuỳ chỉnh do bưu cục tự thiết lập để tự động so khớp điểm lấy hàng GPS cho từng Shipper.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('MAP');
                handleStartDrawing();
              }}
              className="hub-btn-draw-start"
            >
              <Pencil size={15} />
              Vẽ Dải Toạ Độ Mới
            </button>
          </div>

          {customDrawnZones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <Layers size={48} style={{ color: '#cbd5e1', marginBottom: 12 }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#334155' }}>Chưa có dải toạ độ vẽ riêng nào</h4>
              <p style={{ margin: 0, fontSize: 13, maxWidth: 500, marginInline: 'auto' }}>
                Bưu cục hiện đang phân tuyến theo ranh giới phường hành chính. Bạn có thể sử dụng công cụ vẽ đa giác trên bản đồ để chia nhỏ khu phố/dải đường cụ thể cho Shipper!
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('MAP');
                  handleStartDrawing();
                }}
                className="hub-btn-draw-start"
                style={{ marginTop: 16 }}
              >
                <Pencil size={15} />
                Bắt đầu vẽ dải toạ độ đầu tiên
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="hub-data-table">
                <thead>
                  <tr>
                    <th>Tên Tuyến / Dải Toạ Độ</th>
                    <th>Địa bàn Phụ trách</th>
                    <th>Shipper Đảm nhiệm</th>
                    <th>Số đỉnh toạ độ (Polygon)</th>
                    <th>Màu nhận diện</th>
                    <th>Tự động điều phối</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customDrawnZones.map((zone) => {
                    const courier = allCouriersMap.get(zone.courierId);
                    return (
                      <tr key={zone.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 3,
                                background: zone.colorHex || '#0284c7',
                              }}
                            />
                            <strong style={{ color: '#0f172a' }}>{zone.zoneName || zone.ward}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: '#475569' }}>
                            {zone.district}, {zone.province}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Truck size={14} style={{ color: '#0284c7' }} />
                            <span>
                              <strong>{courier?.label || zone.courierId}</strong> ({zone.courierId})
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {zone.boundaryPolygon.length} điểm khép kín
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                background: zone.colorHex || '#0284c7',
                                border: '1px solid #cbd5e1',
                              }}
                            />
                            <span style={{ fontSize: 12, fontFamily: 'monospace' }}>
                              {zone.colorHex || '#0284c7'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              color: zone.isActive ? '#16a34a' : '#94a3b8',
                            }}
                          >
                            {zone.isActive ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            {zone.isActive ? 'Đang kích hoạt' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('MAP');
                                handleZoomToZone(zone);
                              }}
                              style={{
                                padding: '4px 10px',
                                background: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Xem và phóng to trên bản đồ"
                            >
                              Xem bản đồ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomZone(zone)}
                              style={{
                                padding: '4px 8px',
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                              title="Xóa dải toạ độ này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                  const courier = assignment ? allCouriersMap.get(assignment.courierId) : null;

                  return (
                    <tr key={w.code}>
                      <td>
                        <strong>{w.name}</strong>
                      </td>
                      <td>{w.district}</td>
                      <td>
                        {isAssigned ? (
                          <span style={{ padding: '3px 8px', borderRadius: 999, background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 600 }}>
                            Đã phân công
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 600 }}>
                            Chưa phân công
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
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>Bật</span>
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

          {availableCouriers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
              <Truck size={40} style={{ color: '#94a3b8', marginBottom: 12 }} />
              <h5 style={{ margin: '0 0 6px 0', fontSize: 15, color: '#1e293b' }}>
                Chưa có tài khoản Shipper nào trong Cơ sở dữ liệu
              </h5>
              <p style={{ margin: 0, fontSize: 13, maxWidth: 500, marginInline: 'auto' }}>
                {filterByActiveHub
                  ? `Không tìm thấy tài khoản Shipper nào được gán bưu cục "${activeHubCode}". Hãy thử bỏ chọn "Chỉ lọc Shipper thuộc Hub" hoặc tạo tài khoản nhân sự mới trong Auth Service.`
                  : 'Hệ thống chưa có tài khoản người dùng thuộc nhóm Shipper. Vui lòng tạo tài khoản nhân sự giao hàng trong CSDL.'}
              </p>
            </div>
          ) : (
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {availableCouriers.map((courier) => {
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
          )}
        </div>
      )}
    </div>
  );
}
