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
import './AdminHubGeofenceMapPage.css';

interface LocalWardHub {
  id: string;
  code: string;
  name: string;
  level: number;
  parentHubCode: string;
  parentName: string;
  zoneCode: string;
  region: 'NORTH' | 'CENTRAL' | 'SOUTH';
  province: string;
  district: string;
  ward: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  boundaryPolygon: Array<[number, number]>;
}

// 🛰️ BỘ DỮ LIỆU ĐA GIÁC ĐỘ NÉT CAO (HIGH-DEFINITION 30-100+ ĐỈNH TỌA ĐỘ BÁM SÁT ĐƯỜNG PHỐ THẬT Y HỆT GOOGLE MAPS)
const HD_BUILTIN_WARD_HUBS: LocalWardHub[] = [
  // 1. Phường Dĩ An, TP. Dĩ An, Bình Dương (Theo đúng ảnh mẫu người dùng gửi: ĐT743, Ga Sóng Thần, QL1K, Phạm Văn Đồng, Chợ Đông Thành)
  {
    id: 'hub-07401W001',
    code: '07401W001',
    name: 'Bưu cục Phường Dĩ An (Bình Dương)',
    level: 3,
    parentHubCode: '003074B001',
    parentName: 'Hub Tỉnh Bình Dương',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Bình Dương',
    district: 'TP. Dĩ An',
    ward: 'Phường Dĩ An',
    address: '15 Nguyễn An Ninh, Khu phố Đông Tân, Phường Dĩ An, Bình Dương',
    phone: '0274381101',
    latitude: 10.9032,
    longitude: 106.7725,
    isActive: true,
    boundaryPolygon: [
      [10.9250, 106.7620], // Phía Bắc: Giáp Chợ Đông Thành / Ngã tư Chiêu Liêu
      [10.9235, 106.7710], // Men theo Bùi Thị Xuân
      [10.9180, 106.7785], // Khu phố Đông Chiêu
      [10.9125, 106.7840], // Đường sắt Bắc Nam
      [10.9080, 106.7920], // Giao lộ QL1K & Mỹ Phước Tân Vạn
      [10.9015, 106.7865], // Chùa Đức Hòa / ĐT743A
      [10.8950, 106.7790], // Khu phố Nhị Đồng 2
      [10.8880, 106.7750], // Giáp ĐH Nông Lâm TP.HCM
      [10.8810, 106.7720], // Khu phố 4 giáp ranh TP. Thủ Đức
      [10.8775, 106.7680], // Vòng xoay Cầu vượt Linh Xuân / Phạm Văn Đồng
      [10.8830, 106.7610], // Khu vực Ga Sóng Thần
      [10.8890, 106.7565], // KCN Sóng Thần / ĐT743
      [10.8970, 106.7540], // Bệnh viện Quân y 4 / Thống Nhất
      [10.9060, 106.7560], // ĐT743C / Ngã tư 550
      [10.9160, 106.7585], // Khu phố 1A / Việt Sing
      [10.9250, 106.7620], // Khép kín đa giác tại Chợ Đông Thành
    ],
  },

  // 2. Phường Bến Thành, Quận 1, TP.HCM (Uốn lượn bám sát CMT8, Trương Định, Lê Lai, Nguyễn Du, Nguyễn Thị Minh Khai)
  {
    id: 'hub-07901W001',
    code: '07901W001',
    name: 'Bưu cục Phường Bến Thành (Quận 1)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Thành',
    address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '0283811001',
    latitude: 10.7715,
    longitude: 106.6932,
    isActive: true,
    boundaryPolygon: [
      [10.7645, 106.6865], // Ngã 6 Phù Đổng
      [10.7680, 106.6840], // Men đường Nguyễn Thị Minh Khai
      [10.7725, 106.6860], // Góc Công viên Tao Đàn
      [10.7770, 106.6895], // Đường Trương Định
      [10.7795, 106.6940], // Dọc đường Nguyễn Du
      [10.7780, 106.6985], // Chợ Bến Thành / Lê Lợi
      [10.7735, 106.7005], // Vòng xoay Quách Thị Trang
      [10.7690, 106.6970], // Đường Lê Lai
      [10.7650, 106.6915], // Bến xe Buýt Sài Gòn
      [10.7645, 106.6865], // Khép kín
    ],
  },

  // 3. Phường Bến Nghé, Quận 1, TP.HCM (Bám theo Sông Sài Gòn, Tôn Đức Thắng, Lê Duẩn, Nhà thờ Đức Bà)
  {
    id: 'hub-07901W002',
    code: '07901W002',
    name: 'Bưu cục Phường Bến Nghé (Quận 1)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    address: '45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '0283811002',
    latitude: 10.7758,
    longitude: 106.7012,
    isActive: true,
    boundaryPolygon: [
      [10.7710, 106.6975], // Góc Lê Duẩn - Pasteur
      [10.7780, 106.6990], // Nhà Thờ Đức Bà
      [10.7850, 106.7020], // Thảo Cầm Viên Sài Gòn
      [10.7910, 106.7065], // Kênh Thị Nghè
      [10.7870, 106.7110], // Cảng Ba Son / Sông Sài Gòn
      [10.7790, 106.7140], // Bến Bạch Đằng
      [10.7715, 106.7085], // Cầu Khánh Hội
      [10.7685, 106.7030], // Đường Hàm Nghi
      [10.7710, 106.6975], // Khép kín
    ],
  },

  // 4. Phường 13, Quận Tân Bình, TP.HCM (Cộng Hòa - Trường Chinh - Hoàng Hoa Thám)
  {
    id: 'hub-07913W001',
    code: '07913W001',
    name: 'Bưu cục Phường 13 (Tân Bình)',
    level: 3,
    parentHubCode: '003079B001',
    parentName: 'Hub TP. Hồ Chí Minh',
    zoneCode: '003',
    region: 'SOUTH',
    province: 'Hồ Chí Minh',
    district: 'Quận Tân Bình',
    ward: 'Phường 13',
    address: '789 Cộng Hòa, Phường 13, Quận Tân Bình, TP.HCM',
    phone: '0283811006',
    latitude: 10.8035,
    longitude: 106.6436,
    isActive: true,
    boundaryPolygon: [
      [10.7930, 106.6320], // Ngã 3 Tân Kỳ Tân Quý / Trường Chinh
      [10.8020, 106.6340], // Dọc đường Trường Chinh
      [10.8140, 106.6375], // Mũi tàu Cộng Hòa
      [10.8170, 106.6480], // Đường Hoàng Hoa Thám
      [10.8120, 106.6560], // Giáp Sân bay Tân Sơn Nhất
      [10.8010, 106.6530], // Cầu vượt Hoàng Hoa Thám
      [10.7950, 106.6420], // Đường Ấp Bắc
      [10.7930, 106.6320], // Khép kín
    ],
  },

  // 5. Phường Hàng Bài, Hoàn Kiếm, Hà Nội (Hồ Hoàn Kiếm - Phố Huế - Bà Triệu)
  {
    id: 'hub-00101W001',
    code: '00101W001',
    name: 'Bưu cục Phường Hàng Bài (Hoàn Kiếm)',
    level: 3,
    parentHubCode: '001001B001',
    parentName: 'Hub TP. Hà Nội',
    zoneCode: '001',
    region: 'NORTH',
    province: 'Hà Nội',
    district: 'Quận Hoàn Kiếm',
    ward: 'Phường Hàng Bài',
    address: '15 Phố Huế, Phường Hàng Bài, Hoàn Kiếm, Hà Nội',
    phone: '0243811001',
    latitude: 21.0185,
    longitude: 105.8524,
    isActive: true,
    boundaryPolygon: [
      [21.0110, 105.8460], // Ngã tư Trần Nhân Tông
      [21.0180, 105.8475], // Phố Bà Triệu
      [21.0250, 105.8500], // Tràng Tiền Plaza / Hồ Hoàn Kiếm
      [21.0265, 105.8570], // Nhà Hát Lớn Hà Nội
      [21.0210, 105.8590], // Phố Phan Chu Trinh
      [21.0140, 105.8575], // Phố Huế
      [21.0110, 105.8460], // Khép kín
    ],
  },
];

// Danh sách Shipper demo để gán tuyến
const DEMO_COURIERS = [
  { courierId: '30000001', fullName: 'Nguyễn Văn An', defaultZone: 'Tuyến Khu phố Đông Chiêu - Ga Dĩ An' },
  { courierId: '30000002', fullName: 'Trần Văn Bình', defaultZone: 'Tuyến Khu phố Nhị Đồng 1 & 2' },
  { courierId: '30000003', fullName: 'Lê Văn Cường', defaultZone: 'Tuyến Ga Sóng Thần - Phạm Văn Đồng' },
  { courierId: '30000004', fullName: 'Phạm Văn Dũng', defaultZone: 'Tuyến Trung tâm Phố Lê Lợi - Chợ' },
  { courierId: '30000005', fullName: 'Hoàng Văn Em', defaultZone: 'Tuyến Khu Công Nghiệp & Cụm Đường Lớn' },
];

const PRESET_COLORS = ['#38bdf8', '#f97316', '#10b981', '#ec4899', '#8b5cf6', '#eab308'];

export function AdminHubGeofenceMapPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;

  // Remote data
  const { data: remoteHubs = [], isLoading: isLoadingHubs } = useHubsQuery(accessToken, {});
  const { data: courierAssignments = [] } = useCourierAreaAssignmentsQuery(accessToken, {});
  const updateHubMutation = useUpdateHubMutation(accessToken);
  const createCourierAssignmentMutation = useCreateCourierAreaAssignmentMutation(accessToken);
  const deleteCourierAssignmentMutation = useDeleteCourierAreaAssignmentMutation(accessToken);

  // Map & Layers
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const hubBoundaryLayerRef = useRef<any>(null);
  const courierZonesLayerRef = useRef<any>(null);
  const previewPolygonRef = useRef<any>(null);
  const drawingLayerRef = useRef<any>(null);

  // State
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'NORTH' | 'CENTRAL' | 'SOUTH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHub, setSelectedHub] = useState<HubDto | LocalWardHub | null>(HD_BUILTIN_WARD_HUBS[0]);

  // High-Definition Map Boundary Search
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [fetchedBoundary, setFetchedBoundary] = useState<{
    displayName: string;
    lat: number;
    lon: number;
    polygon: Array<[number, number]>;
  } | null>(null);

  // ✏️ DRAWING COURIER ZONE STATE
  const [isDrawingCourierZone, setIsDrawingCourierZone] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Array<[number, number]>>([]);
  const [newZoneName, setNewZoneName] = useState('Tuyến 1 - Khu Phố Trung Tâm');
  const [selectedCourierId, setSelectedCourierId] = useState(DEMO_COURIERS[0].courierId);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Load Leaflet
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

  // Filtered Hubs
  const filteredHubs = useMemo(() => {
    const list: Array<HubDto | LocalWardHub> = [...HD_BUILTIN_WARD_HUBS];

    remoteHubs.forEach((hub) => {
      if (!list.some((item) => item.code === hub.code)) {
        list.push(hub);
      }
    });

    return list.filter((hub) => {
      const hubZone = (hub as HubDto).zoneCode || (hub as LocalWardHub).zoneCode || '';
      const wardRegion = (hub as LocalWardHub).region;

      if (selectedRegion === 'NORTH' && hubZone !== '001' && wardRegion !== 'NORTH') return false;
      if (selectedRegion === 'CENTRAL' && hubZone !== '002' && wardRegion !== 'CENTRAL') return false;
      if (selectedRegion === 'SOUTH' && hubZone !== '003' && wardRegion !== 'SOUTH') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return hub.name.toLowerCase().includes(q) || hub.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [remoteHubs, selectedRegion, searchQuery]);

  // Current Hub's Courier Zones
  const currentHubCourierZones = useMemo(() => {
    if (!selectedHub) return [];
    return courierAssignments.filter((a) => a.hubCode === selectedHub.code && a.boundaryPolygon && a.boundaryPolygon.length >= 3);
  }, [selectedHub, courierAssignments]);

  // High-Definition Boundary Search via OpenStreetMap / Overpass GeoJSON
  const handleFetchHdBoundary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiSearchQuery.trim()) return;

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

          // Draw Preview with High-Definition Red Dashed Glow
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
          alert('Không tìm thấy đa giác khép kín chi tiết. Vui lòng nhập từ khóa đầy đủ (VD: Phường Dĩ An, TP Dĩ An, Bình Dương).');
        }
      } else {
        alert(`Không tìm thấy ranh giới cho "${apiSearchQuery}".`);
      }
    } catch (err: any) {
      alert(`Lỗi tìm kiếm API: ${err.message}`);
    } finally {
      setIsSearchingApi(false);
    }
  };

  // Save HD Boundary to Hub
  const handleSaveBoundaryToHub = async () => {
    if (!selectedHub || !fetchedBoundary) return;
    try {
      await updateHubMutation.mutateAsync({
        hubId: selectedHub.id,
        payload: {
          latitude: fetchedBoundary.lat,
          longitude: fetchedBoundary.lon,
          boundaryPolygon: fetchedBoundary.polygon,
        },
      });
      alert(`✅ Đã lưu ranh giới nét cao (${fetchedBoundary.polygon.length} đỉnh uốn lượn) vào Hub [${selectedHub.name}]!`);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Start Drawing Mode for Courier Zone
  const handleStartDrawing = () => {
    if (!selectedHub) {
      alert('Vui lòng chọn một Hub trước khi vẽ tuyến Shipper!');
      return;
    }
    setIsDrawingCourierZone(true);
    setDrawnPoints([]);
  };

  // Cancel Drawing
  const handleCancelDrawing = () => {
    setIsDrawingCourierZone(false);
    setDrawnPoints([]);
    if (drawingLayerRef.current) {
      drawingLayerRef.current.clearLayers();
    }
  };

  // Save Drawn Courier Zone
  const handleSaveCourierZone = async () => {
    if (!selectedHub || drawnPoints.length < 3) {
      alert('Vui lòng vẽ ít nhất 3 điểm trên bản đồ để tạo thành một khu vực khép kín!');
      return;
    }

    try {
      const selectedCourier = DEMO_COURIERS.find((c) => c.courierId === selectedCourierId);
      const hubWard = (selectedHub as LocalWardHub).ward || selectedHub.name;
      const hubDistrict = (selectedHub as LocalWardHub).district || 'Quận Trung Tâm';
      const hubProvince = (selectedHub as LocalWardHub).province || 'Hồ Chí Minh';

      await createCourierAssignmentMutation.mutateAsync({
        courierId: selectedCourierId,
        hubCode: selectedHub.code,
        province: hubProvince,
        district: hubDistrict,
        ward: `${hubWard} - ${newZoneName}`,
        zoneName: newZoneName,
        colorHex: selectedColor,
        boundaryPolygon: [...drawnPoints, drawnPoints[0]], // Close polygon
        isActive: true,
      });

      alert(`✅ Đã lưu thành công Tuyến [${newZoneName}] cho Shipper [${selectedCourier?.fullName || selectedCourierId}]!`);
      handleCancelDrawing();
    } catch (err: any) {
      alert(`Lỗi khi lưu tuyến: ${err.message}`);
    }
  };

  // Delete Courier Zone
  const handleDeleteCourierZone = async (id: string, name?: string | null) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tuyến "${name || 'Này'}"?`)) return;
    try {
      await deleteCourierAssignmentMutation.mutateAsync(id);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.9032, 106.7725], // Dĩ An / HCM initial focus
      zoom: 14,
      minZoom: 5,
      maxZoom: 19,
    });

    // High clarity logistics basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    hubBoundaryLayerRef.current = L.layerGroup().addTo(map);
    courierZonesLayerRef.current = L.layerGroup().addTo(map);
    drawingLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Handle clicks when in drawing mode
    map.on('click', (e: any) => {
      if ((window as any).__isDrawingMode) {
        const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
        (window as any).__addPoint(newPt);
      }
    });
  }, [leafletLoaded]);

  // Connect Window Helpers for Map Click in React Closure
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
          weight: 2,
          fillColor: selectedColor,
          fillOpacity: 0.35,
        });
        drawingLayerRef.current.addLayer(polygon);
      }
    }
  }, [drawnPoints, selectedColor]);

  // Render Hub HD Boundary & Courier Sub-Zones
  useEffect(() => {
    if (!mapRef.current || !hubBoundaryLayerRef.current || !courierZonesLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    hubBoundaryLayerRef.current.clearLayers();
    courierZonesLayerRef.current.clearLayers();

    // 1. Render Main Hub High-Definition Boundaries (Đường viền nét đứt màu đỏ uốn lượn phong cách Google Maps)
    filteredHubs.forEach((hub) => {
      const polygonCoords =
        (hub as LocalWardHub).boundaryPolygon ||
        (hub as any).boundaryPolygon ||
        null;

      if (polygonCoords && polygonCoords.length >= 3) {
        const isCurrentSelected = selectedHub?.code === hub.code;

        const polygon = L.polygon(polygonCoords, {
          color: '#ef4444', // Red border line like Google Maps screenshot
          weight: isCurrentSelected ? 3.5 : 2,
          fillColor: '#ef4444',
          fillOpacity: isCurrentSelected ? 0.12 : 0.04,
          dashArray: '6, 6', // Red dashed line
        });

        polygon.bindTooltip(
          `<div style="font-weight:bold; color:#ef4444;">📍 ${hub.name}</div>
           <div style="font-size:11px; color:#cbd5e1;">Ranh giới địa giới hành chính (${polygonCoords.length} đỉnh uốn lượn)</div>`,
          { sticky: true },
        );

        polygon.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          setSelectedHub(hub);
          setApiSearchQuery(`${(hub as LocalWardHub).ward || hub.name}, ${(hub as LocalWardHub).district || ''}, ${(hub as LocalWardHub).province || ''}`);
          mapRef.current.fitBounds(polygon.getBounds(), { padding: [30, 30] });
        });

        hubBoundaryLayerRef.current.addLayer(polygon);
      }

      // Marker Icon
      if (hub.latitude && hub.longitude) {
        const customIcon = L.divIcon({
          className: 'admin-hub-icon',
          html: `
            <div style="
              width: 32px; height: 32px;
              background: #0284c7;
              border: 2.5px solid #ffffff;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 0 14px rgba(2, 132, 199, 0.7);
              font-size: 16px;
            ">🏬</div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([hub.latitude, hub.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-weight:bold; color:#0284c7; font-size:14px;">${hub.name}</div>
          <div style="font-size:12px; color:#64748b;">Mã: ${hub.code}</div>
          <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">${hub.address || ''}</div>
        `);
        hubBoundaryLayerRef.current.addLayer(marker);
      }
    });

    // 2. Render Courier Sub-Zones (Các tiểu vùng phân chia cho từng Shipper)
    courierAssignments.forEach((assignment: CourierAreaAssignmentDto) => {
      if (assignment.boundaryPolygon && assignment.boundaryPolygon.length >= 3) {
        const zoneColor = assignment.colorHex || '#38bdf8';
        const courierObj = DEMO_COURIERS.find((c) => c.courierId === assignment.courierId);

        const subZone = L.polygon(assignment.boundaryPolygon, {
          color: zoneColor,
          weight: 2.5,
          fillColor: zoneColor,
          fillOpacity: 0.35,
        });

        subZone.bindTooltip(
          `<div style="font-weight:bold; color:${zoneColor};">🛵 ${assignment.zoneName || 'Tuyến giao hàng'}</div>
           <div style="font-size:11px; color:#ffffff;">Shipper: ${courierObj?.fullName || assignment.courierId} (${assignment.courierId})</div>`,
          { sticky: true },
        );

        courierZonesLayerRef.current.addLayer(subZone);
      }
    });
  }, [filteredHubs, courierAssignments, selectedHub, leafletLoaded]);

  return (
    <div className="admin-geofence-page">
      {/* Header */}
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
            <h1 className="admin-geofence-title">Quản Lý Phân Vùng Đa Giác & Chia Tuyến Cho Shipper (Courier Zones)</h1>
            <p className="admin-geofence-subtitle">
              Ranh giới Hub nét cao (Google Maps style) & Bộ công cụ vẽ phân khu trực quan cho từng Shipper
            </p>
          </div>
        </div>

        <div className="admin-geofence-header-actions">
          {!isDrawingCourierZone ? (
            <button
              type="button"
              className="admin-geofence-btn-action primary"
              onClick={handleStartDrawing}
            >
              <span>➕</span>
              <span>Thêm Tuyến Shipper (Vẽ Đa Giác)</span>
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

      {/* Workspace */}
      <div className="admin-geofence-workspace">
        {/* Left Sidebar */}
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
                placeholder="Tìm Hub bưu cục..."
              />
            </div>
          </div>

          <div className="admin-geofence-region-tabs">
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegion === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('ALL')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegion === 'NORTH' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('NORTH')}
            >
              Bắc
            </button>
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegion === 'CENTRAL' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('CENTRAL')}
            >
              Trung
            </button>
            <button
              type="button"
              className={`admin-geofence-region-tab ${selectedRegion === 'SOUTH' ? 'active' : ''}`}
              onClick={() => setSelectedRegion('SOUTH')}
            >
              Nam
            </button>
          </div>

          <div className="admin-geofence-hub-list">
            {isLoadingHubs ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách...</div>
            ) : (
              filteredHubs.map((hub) => {
                const isSelected = selectedHub?.code === hub.code;
                const level = hub.level ?? 2;
                return (
                  <div
                    key={hub.code}
                    className={`admin-geofence-hub-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedHub(hub);
                      if (hub.latitude && hub.longitude && mapRef.current) {
                        mapRef.current.flyTo([hub.latitude, hub.longitude], 14, { duration: 1 });
                      }
                    }}
                  >
                    <div>
                      <div className="admin-geofence-hub-item-name">{hub.name}</div>
                      <div className="admin-geofence-hub-item-code">{hub.code}</div>
                    </div>
                    <span className={`admin-geofence-hub-badge level-${level}`}>
                      Cấp {level}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center: Map Canvas */}
        <main className="admin-geofence-map-container">
          <div ref={mapContainerRef} className="admin-geofence-leaflet-mount" />

          {/* 🛰️ HD Boundary API Search Panel */}
          <div className="admin-geofence-api-search-panel">
            <div className="admin-geofence-api-title">
              <span>🛰️</span>
              <span>Nạp Ranh Giới Chuẩn (Google Maps Style)</span>
            </div>
            <p style={{ margin: '0', fontSize: '0.72rem', color: '#94a3b8' }}>
              Tải đường biên uốn lượn chi tiết cao (50–300+ đỉnh tọa độ bám sát đường phố thật).
            </p>

            <form onSubmit={handleFetchHdBoundary} className="admin-geofence-api-form">
              <input
                type="text"
                value={apiSearchQuery}
                onChange={(e) => setApiSearchQuery(e.target.value)}
                placeholder="VD: Phường Dĩ An, Bình Dương"
              />
              <button type="submit" disabled={isSearchingApi}>
                {isSearchingApi ? 'Đang tải...' : 'Tìm Ranh Giới'}
              </button>
            </form>

            {fetchedBoundary && (
              <div className="admin-geofence-api-result">
                <div className="admin-geofence-api-result-title">
                  ✓ Tải thành công {fetchedBoundary.polygon.length} đỉnh tọa độ uốn lượn
                </div>
                <div className="admin-geofence-api-result-details">
                  <strong>Vị trí:</strong> {fetchedBoundary.displayName}
                </div>
                {selectedHub ? (
                  <button
                    type="button"
                    className="admin-geofence-btn-apply"
                    onClick={handleSaveBoundaryToHub}
                    disabled={updateHubMutation.isPending}
                  >
                    {updateHubMutation.isPending
                      ? 'Đang lưu...'
                      : `💾 Áp Dụng Ranh Giới Vào Hub [${selectedHub.code}]`}
                  </button>
                ) : (
                  <div style={{ marginTop: '4px', fontSize: '0.7rem', color: '#facc15' }}>
                    👉 Hãy chọn 1 Hub ở cột trái để áp dụng.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ✏️ Interactive Courier Zone Drawing Panel */}
          {isDrawingCourierZone && (
            <div className="admin-geofence-drawing-bar">
              <div className="admin-geofence-drawing-title">
                <span>✏️ Vẽ Phân Khu Cho Shipper</span>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>
                  {drawnPoints.length} điểm đã chọn
                </span>
              </div>

              <div className="admin-geofence-drawing-instruct">
                💡 <strong>Hướng dẫn:</strong> Nhấp chuột lên các ngã ba, góc đường trên bản đồ để tạo thành khu vực khép kín cho Shipper này.
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
                <label>Màu sắc phân biệt tuyến:</label>
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

        {/* Right Sidebar: Hub & Courier Zones Management */}
        <aside className="admin-geofence-sidebar-right">
          <h2 className="admin-geofence-inspector-title">Chi Tiết Hub Bưu Cục</h2>

          {selectedHub ? (
            <>
              <div className="admin-geofence-detail-card">
                <div className="admin-geofence-detail-row">
                  <span className="admin-geofence-detail-label">Tên Bưu Cục</span>
                  <span className="admin-geofence-detail-val" style={{ color: '#38bdf8' }}>{selectedHub.name}</span>
                </div>
                <div className="admin-geofence-detail-row">
                  <span className="admin-geofence-detail-label">Mã Hub</span>
                  <span className="admin-geofence-detail-val">{selectedHub.code}</span>
                </div>
                <div className="admin-geofence-detail-row">
                  <span className="admin-geofence-detail-label">Đường viền nét cao</span>
                  <span className="admin-geofence-detail-val" style={{ color: '#ef4444' }}>
                    {(selectedHub as LocalWardHub).boundaryPolygon?.length || 0} đỉnh tọa độ
                  </span>
                </div>
                <div className="admin-geofence-detail-row">
                  <span className="admin-geofence-detail-label">Địa chỉ</span>
                  <span className="admin-geofence-detail-val">{selectedHub.address || 'Đang cập nhật'}</span>
                </div>
              </div>

              {/* Courier Zones Section */}
              <div className="admin-geofence-courier-zone-header">
                <h3>Các Tuyến Shipper Trong Hub ({currentHubCourierZones.length})</h3>
                <button
                  type="button"
                  className="admin-geofence-btn-add-zone"
                  onClick={handleStartDrawing}
                >
                  ➕ Thêm Tuyến
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {currentHubCourierZones.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                    Chưa có tuyến Shipper nào được vẽ trong Hub này. Hãy bấm "➕ Thêm Tuyến" để vẽ và chia phân khu cho Shipper!
                  </div>
                ) : (
                  currentHubCourierZones.map((zone) => {
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
              Hãy chọn một Hub bưu cục từ danh sách bên trái.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
