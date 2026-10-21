import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useManifestsQuery } from '../../features/manifests/manifests.api';
import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { useNdrCasesQuery } from '../../features/ndr/ndr.api';
import { canAccessOpsFeature } from '../../features/permissions/opsPermissions';
import { useShipmentsQuery } from '../../features/shipments/shipments.api';
import { useTasksQuery } from '../../features/tasks/tasks.api';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import { appEnv } from '../../utils/env';
import { formatHubFullAddress } from '../../utils/locationScope';
import { useHubScope } from '../../hooks/useHubScope';
import { isShipmentInHubScope } from '../../utils/hubScopeResolver';
import { AnalyticsDashboardPage } from './analytics/AnalyticsDashboardPage';
import {
  Globe2,
  Store,
  Navigation,
  Truck,
  ShieldAlert,
  BarChart3,
  Layers,
  Database,
  QrCode,
  Headphones,
  Receipt,
  Server,
  Building2,
  MapPin,
  Shield,
  Radio,
  CheckCircle2,
  Package,
  AlertTriangle,
  ArrowRight,
  Clock,
  RefreshCw,
  LocateFixed,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Megaphone,
  AlertOctagon,
  FileCheck,
  FileSearch,
} from 'lucide-react';
import './DashboardPage.css';

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function dedupeCodes(codes: string[]): string[] {
  return Array.from(
    new Set(
      codes
        .map((code) => normalizeCode(code))
        .filter((code) => code.length > 0),
    ),
  );
}

type DashboardMenuIcon =
  | 'hq_operations'
  | 'basic_data'
  | 'operations_platform'
  | 'integration_services'
  | 'customer_platform'
  | 'branch_business'
  | 'finance_settlement'
  | 'capability_platform'
  | 'operations_metrics'
  | 'service_quality'
  | 'database'
  | 'smart_devices'
  | 'planning_platform';

function DashboardMenuSymbolIcon({ icon }: { icon: DashboardMenuIcon }): React.JSX.Element {
  const props = { size: 24, strokeWidth: 1.8, 'aria-hidden': true };
  switch (icon) {
    case 'hq_operations':
      return <Globe2 {...props} />;
    case 'branch_business':
      return <Store {...props} />;
    case 'operations_platform':
      return <Navigation {...props} />;
    case 'capability_platform':
      return <Truck {...props} />;
    case 'service_quality':
      return <ShieldAlert {...props} />;
    case 'operations_metrics':
      return <BarChart3 {...props} />;
    case 'planning_platform':
      return <Layers {...props} />;
    case 'finance_settlement':
      return <Receipt {...props} />;
    case 'smart_devices':
      return <QrCode {...props} />;
    case 'customer_platform':
      return <Headphones {...props} />;
    case 'database':
      return <Database {...props} />;
    case 'integration_services':
      return <Server {...props} />;
    default:
      return <Layers {...props} />;
  }
}

function QuickActionIcon({ icon }: { icon?: string }): React.JSX.Element | null {
  if (!icon) return null;
  const props = { size: 14, strokeWidth: 1.8, className: 'ops-menu-action-icon', 'aria-hidden': true };
  switch (icon) {
    case 'radar':
      return <Radio {...props} />;
    case 'map':
      return <MapPin {...props} />;
    case 'alarm':
      return <Clock {...props} />;
    case 'qr_code_scanner':
      return <QrCode {...props} />;
    case 'point_of_sale':
      return <Receipt {...props} />;
    case 'fact_check':
      return <CheckCircle2 {...props} />;
    case 'near_me':
    case 'hail':
    case 'route':
      return <Navigation {...props} />;
    case 'commute':
      return <Truck {...props} />;
    case 'lock':
      return <Shield {...props} />;
    case 'label':
      return <Layers {...props} />;
    case 'support_agent':
      return <Headphones {...props} />;
    case 'search_insights':
      return <FileSearch {...props} />;
    case 'receipt_long':
      return <Receipt {...props} />;
    case 'query_stats':
    case 'bar_chart':
      return <BarChart3 {...props} />;
    case 'inventory':
    case 'inventory_2':
      return <Package {...props} />;
    case 'tune':
      return <Layers {...props} />;
    case 'swap_horiz':
      return <RefreshCw {...props} />;
    case 'travel_explore':
      return <Globe2 {...props} />;
    default:
      return <Package {...props} />;
  }
}

function NoticeSymbolIcon({ icon }: { icon: string }): React.JSX.Element {
  const props = { size: 13, strokeWidth: 1.8, 'aria-hidden': true };
  switch (icon) {
    case 'error_outline':
      return <AlertOctagon {...props} />;
    case 'local_shipping':
      return <Truck {...props} />;
    case 'verified':
      return <FileCheck {...props} />;
    case 'assignment_turned_in':
      return <CheckCircle2 {...props} />;
    default:
      return <AlertTriangle {...props} />;
  }
}

function HeroTagIcon({ icon }: { icon: string }): React.JSX.Element {
  const props = { size: 14, strokeWidth: 1.8, 'aria-hidden': true };
  switch (icon) {
    case 'radar':
      return <Radio {...props} />;
    case 'two_wheeler':
      return <Navigation {...props} />;
    case 'local_shipping':
      return <Truck {...props} />;
    default:
      return <Radio {...props} />;
  }
}

export function DashboardPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const currentRoles = session?.user.roles ?? [];
  const assignedHubCodes = dedupeCodes(session?.user.hubCodes ?? []);
  const canViewAllHubData = currentRoles.includes('SYSTEM_ADMIN');

  const hubScope = useHubScope();

  const effectiveHubCode = useMemo(() => {
    return hubScope.primaryHub?.code ?? assignedHubCodes[0] ?? undefined;
  }, [hubScope.primaryHub, assignedHubCodes]);

  const hubsQuery = useHubsQuery(accessToken, {});
  const shipmentsQuery = useShipmentsQuery(
    accessToken,
    hubScope.scopedHubCodes.length > 0 ? { hubCodes: hubScope.scopedHubCodes } : {},
    { refetchInterval: 15000 },
  );
  const tasksQuery = useTasksQuery(accessToken, {}, { refetchInterval: 15000 });
  const manifestsQuery = useManifestsQuery(accessToken);
  const ndrQuery = useNdrCasesQuery(accessToken);

  const rawShipments = useMemo(() => {
    const data = shipmentsQuery.data ?? [];
    if (hubScope.isAllSystem || hubScope.scopedHubCodes.length === 0) {
      return data;
    }
    return data.filter((s) => isShipmentInHubScope(s, hubScope.scopedHubCodes));
  }, [shipmentsQuery.data, hubScope.isAllSystem, hubScope.scopedHubCodes]);

  const rawTasks = tasksQuery.data ?? [];
  const rawManifests = manifestsQuery.data ?? [];
  const rawNdrCases = ndrQuery.data ?? [];

  const metrics = useMemo(() => {
    const total = rawShipments.length;
    const delivered = rawShipments.filter((s) => s.currentStatus === 'DELIVERED').length;
    const inTransit = rawShipments.filter(
      (s) =>
        s.currentStatus === 'IN_TRANSIT' ||
        s.currentStatus === 'SCAN_INBOUND' ||
        s.currentStatus === 'TASK_ASSIGNED',
    ).length;
    const incidents = rawShipments.filter(
      (s) =>
        s.currentStatus === 'NDR_CREATED' ||
        s.currentStatus === 'EXCEPTION' ||
        s.currentStatus === 'DELIVERY_FAILED',
    ).length;
    const successRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '100';

    const totalManifests = rawManifests.length;
    const dispatchedManifests = rawManifests.filter(
      (m) => m.status === 'SEALED' || m.status === 'DISPATCHED' || m.status === 'RECEIVED',
    ).length;
    const linehaulRate = totalManifests > 0 ? Math.round((dispatchedManifests / totalManifests) * 100) : 100;

    return {
      totalShipments: total,
      deliveredCount: delivered,
      inTransitCount: inTransit,
      incidentCount: incidents,
      successRate,
      totalManifests,
      dispatchedManifests,
      linehaulRate,
    };
  }, [rawShipments, rawManifests]);

  const scopedHubs = useMemo(() => {
    if (canViewAllHubData) {
      return hubsQuery.data ?? [];
    }

    const assignedSet = new Set(assignedHubCodes);
    return (hubsQuery.data ?? []).filter((hub) =>
      assignedSet.has(normalizeCode(hub.code)),
    );
  }, [assignedHubCodes, canViewAllHubData, hubsQuery.data]);

  const currentHub = useMemo(() => {
    if (hubScope.primaryHub) return hubScope.primaryHub;
    if (scopedHubs.length === 0) {
      return null;
    }

    if (!effectiveHubCode) {
      return scopedHubs[0];
    }

    return (
      scopedHubs.find((hub) => normalizeCode(hub.code) === effectiveHubCode) ??
      scopedHubs[0]
    );
  }, [hubScope.primaryHub, effectiveHubCode, scopedHubs]);

  const currentHubAddress = useMemo(() => {
    return formatHubFullAddress(currentHub);
  }, [currentHub]);

  const canViewHq = canAccessOpsFeature(session?.user, 'nav.hq-command-center');

  type OpsDomainAccent = 'branch' | 'dispatch' | 'linehaul' | 'incident' | 'analytics' | 'planning' | 'hq';

  interface QuickMenuItem {
    title: string;
    badge?: string;
    description: string;
    to?: string;
    icon: DashboardMenuIcon;
    accent: OpsDomainAccent;
    disabled?: boolean;
    featured?: boolean;
    quickLinks?: Array<{ label: string; to: string; icon?: string }>;
  }

  const quickMenu: ReadonlyArray<QuickMenuItem> = appEnv.enableFullOpsModules
    ? [
        ...(canViewHq
          ? [
              {
                title: 'Điều hành HQ',
                badge: 'HQ MASTER',
                description: 'Giám sát vĩ mô toàn mạng lưới, radar SLA 3 miền và hạm đội vận tải liên tỉnh.',
                to: routePaths.masterOpsCommandCenter,
                icon: 'hq_operations' as const,
                accent: 'hq' as const,
                featured: true,
                quickLinks: [
                  { label: 'Trung tâm chỉ huy', to: routePaths.masterOpsCommandCenter, icon: 'radar' },
                  { label: 'Bản đồ Hub', to: routePaths.masterdataHubNetworkMap, icon: 'map' },
                  { label: 'Cảnh báo quá hạn', to: routePaths.opsMetricsDeadlineOverdueAlerts, icon: 'alarm' },
                ],
              },
            ]
          : []),
        {
          title: 'Vận hành Bưu cục & Quầy',
          badge: 'BƯU CỤC',
          description: 'Quét mã vạch In/Outbound, tiếp nhận bưu gửi tại quầy, kiểm kê tồn kho và chốt ca cuối ngày.',
          to: routePaths.groupBranchBusiness,
          icon: 'branch_business',
          accent: 'branch',
          quickLinks: [
            { label: 'Quét mã vạch', to: routePaths.scans, icon: 'qr_code_scanner' },
            { label: 'Tạo đơn quầy', to: routePaths.branchBusinessOrderCreate, icon: 'point_of_sale' },
            { label: 'Chốt ca', to: routePaths.branchBusinessShiftClosing, icon: 'fact_check' },
          ],
        },
        {
          title: 'Điều phối Giao nhận',
          badge: 'ĐIỀU PHỐI',
          description: 'Phân công thu gom đơn shop, chia tuyến phát shipper và điều chuyển vận đơn thời gian thực.',
          to: routePaths.groupOperationsPlatform,
          icon: 'operations_platform',
          accent: 'dispatch',
          featured: !canViewHq,
          quickLinks: [
            { label: 'Điều phối phát', to: routePaths.operationsPlatformDeliveryDispatch, icon: 'near_me' },
            { label: 'Điều phối lấy', to: routePaths.operationsPlatformPickupDispatch, icon: 'hail' },
            { label: 'Tuyến Shipper', to: routePaths.courierAreaAssignment, icon: 'route' },
          ],
        },
        {
          title: 'Trung chuyển & Tuyến xe',
          badge: 'LINEHAUL',
          description: 'Quản lý lịch trình xe tải xuất bến, kẹp chì niêm phong seal và in tem nhãn đóng bao tải.',
          to: routePaths.groupCapabilityPlatform,
          icon: 'capability_platform',
          accent: 'linehaul',
          quickLinks: [
            { label: 'Quản lý chuyến xe', to: routePaths.linehaulTripManagement, icon: 'commute' },
            { label: 'Niêm phong chì', to: routePaths.linehaulVehicleSeal, icon: 'lock' },
            { label: 'Tem bao tải', to: routePaths.linehaulBagLabelManagement, icon: 'label' },
          ],
        },
        {
          title: 'Sự cố & Chất lượng Dịch vụ',
          badge: 'GIÁM ĐỊNH & ĐỀN BÙ',
          description: 'Giám định đơn lạc, phân tích log đứt gãy vết quét, phân định trách nhiệm và đền bù theo Hub.',
          to: routePaths.groupServiceQuality,
          icon: 'service_quality',
          accent: 'incident',
          quickLinks: [
            { label: 'CSKH & Khiếu nại', to: routePaths.customerServiceTickets, icon: 'support_agent' },
            { label: 'Đơn lạc & Log', to: routePaths.strayShipmentInvestigation, icon: 'search_insights' },
            { label: 'Hồ sơ đền bù', to: routePaths.claimsLiabilityManagement, icon: 'receipt_long' },
            { label: 'Thống kê Hub', to: routePaths.claimsHubStatistics, icon: 'query_stats' },
          ],
        },
        {
          title: 'Báo cáo & Chỉ số Vận hành',
          badge: 'KPI BÁO CÁO',
          description: 'Báo cáo sản lượng khai thác, tỷ lệ phát thành công và kiểm soát hàng tồn kho quá hạn.',
          to: routePaths.groupOperationsMetrics,
          icon: 'operations_metrics',
          accent: 'analytics',
          quickLinks: [
            { label: 'Báo cáo vận hành', to: routePaths.opsMetricsReport, icon: 'bar_chart' },
            { label: 'Kiểm kê tồn kho', to: routePaths.opsMetricsDeadlineInventory, icon: 'inventory' },
          ],
        },
        {
          title: 'Quy hoạch & Dự báo Tải',
          badge: 'QUY HOẠCH',
          description: 'Quy hoạch tài nguyên mạng lưới, cân bằng công suất bưu cục và dự báo tải mùa sale.',
          to: routePaths.groupPlanningPlatform,
          icon: 'planning_platform',
          accent: 'planning',
          quickLinks: [
            { label: 'Quy hoạch tải trọng', to: routePaths.groupPlanningPlatform, icon: 'tune' },
          ],
        },
      ]
    : [
        {
          title: 'Quản lý vận đơn',
          badge: 'VẬN ĐƠN',
          description: 'Danh sách và trạng thái chi tiết các bưu gửi trong luồng.',
          to: routePaths.shipments,
          icon: 'branch_business',
          accent: 'branch',
          quickLinks: [{ label: 'Vận đơn', to: routePaths.shipments, icon: 'inventory_2' }],
        },
        {
          title: 'Điều phối vận đơn',
          badge: 'ĐIỀU PHỐI',
          description: 'Phân bổ đơn lấy và phát cho bưu tá các tuyến.',
          to: routePaths.operationsPlatformPickupDispatch,
          icon: 'operations_platform',
          accent: 'dispatch',
          quickLinks: [{ label: 'Điều phối', to: routePaths.operationsPlatformPickupDispatch, icon: 'near_me' }],
        },
        {
          title: 'Chuyển đơn bàn giao',
          badge: 'BÀN GIAO',
          description: 'Chuyển đơn giữa các nhân sự giao nhận khi quá tải.',
          to: routePaths.courierTaskTransfer,
          icon: 'operations_platform',
          accent: 'dispatch',
          quickLinks: [{ label: 'Chuyển đơn', to: routePaths.courierTaskTransfer, icon: 'swap_horiz' }],
        },
        {
          title: 'Quản lý tem bao',
          badge: 'ĐÓNG BAO',
          description: 'Mã vạch và niêm phong bao hàng trung chuyển.',
          to: routePaths.linehaulBagLabelManagement,
          icon: 'capability_platform',
          accent: 'linehaul',
          quickLinks: [{ label: 'Tem bao', to: routePaths.linehaulBagLabelManagement, icon: 'label' }],
        },
        {
          title: 'Tra cứu hành trình',
          badge: 'TRA CỨU',
          description: 'Theo dõi mốc thời gian và điểm quét bưu gửi.',
          to: routePaths.tracking,
          icon: 'operations_metrics',
          accent: 'analytics',
          quickLinks: [{ label: 'Tracking', to: routePaths.tracking, icon: 'travel_explore' }],
        },
      ];

  const notices = [
    {
      id: 'notice-1',
      priority: 'CRITICAL' as const,
      priorityLabel: 'Khẩn cấp',
      badgeClass: 'notice-badge--critical',
      icon: 'error_outline',
      department: 'Ban Vận Tải HQ',
      time: '10 phút trước',
      title: 'Kiểm soát kẹp chì Seal xe tải trục Bắc - Nam',
      content:
        'Yêu cầu 100% bưu cục xuất bến kiểm tra khớp mã seal trên hệ thống trước khi cấp lệnh xe rời kho tại Hub Tân Bình và Hoàn Kiếm.',
    },
    {
      id: 'notice-2',
      priority: 'DISPATCH' as const,
      priorityLabel: 'Điều độ xe',
      badgeClass: 'notice-badge--dispatch',
      icon: 'local_shipping',
      department: 'Điều độ Vùng 3',
      time: '45 phút trước',
      title: 'Tăng cường 2 xe linehaul khung 18:30',
      content:
        'Sản lượng gom đơn sàn TMĐT tăng 28%, điều động thêm 2 xe tải 8 tấn hỗ trợ trục SGN - BDG đảm bảo SLA cam kết.',
    },
    {
      id: 'notice-3',
      priority: 'SOP' as const,
      priorityLabel: 'Quy chuẩn SOP',
      badgeClass: 'notice-badge--sop',
      icon: 'verified',
      department: 'Ban Chất Lượng QA',
      time: 'Hôm nay 08:30',
      title: 'Áp dụng SOP kiểm định hàng giá trị cao',
      content:
        'Bắt buộc chụp ảnh 4 góc và dán tem niêm phong đối với đơn hàng khai giá trên 5.000.000 đ trước khi đóng bao trung chuyển.',
    },
    {
      id: 'notice-4',
      priority: 'SYSTEM' as const,
      priorityLabel: 'Ca trực',
      badgeClass: 'notice-badge--system',
      icon: 'assignment_turned_in',
      department: 'Thủ kho Bưu cục',
      time: 'Hôm nay 07:15',
      title: 'Chốt ca & Kiểm kê tồn kho lúc 14:00',
      content:
        'Hoàn tất quét kiểm kê tồn kho bưu cục trên hệ thống trước khi ký biên bản bàn giao ca sáng sang ca chiều.',
    },
  ];

  const heroSlides = useMemo(
    () => [
      {
        id: 'slide-1',
        tag: 'CONTROL TOWER VẬN MẠNG',
        tagIcon: 'radar',
        title: 'NEXUS EXPRESS SYSTEM',
        slogan: 'DIGITIZATION • AUTOMATION • INTELLIGENCE',
        description:
          'Hệ thống điều hành vận tải bưu chính tập trung, kiểm soát lưu thoát bưu gửi thời gian thực và liên kết chuỗi cung ứng đa kênh toàn quốc.',
        kpiHighlight: `${metrics.totalShipments.toLocaleString('vi-VN')} bưu gửi lưu chuyển (${metrics.inTransitCount} đang luân chuyển)`,
      },
      {
        id: 'slide-2',
        tag: 'ĐIỀU HÀNH THÔNG MINH',
        tagIcon: 'two_wheeler',
        title: 'NXS OPS COMMAND CENTER',
        slogan: 'FAST RESPONSE • HUB VISIBILITY • SMART DISPATCH',
        description:
          'Tối ưu phân công tuyến phát shipper, radar phát hiện quá tải bưu cục và kiểm soát chặt chẽ chỉ số cam kết SLA 3 miền.',
        kpiHighlight: `${metrics.successRate}% tỷ lệ giao thành công (${metrics.deliveredCount}/${metrics.totalShipments} đơn hoàn tất)`,
      },
      {
        id: 'slide-3',
        tag: 'MẠNG LƯỚI TRUNG CHUYỂN',
        tagIcon: 'local_shipping',
        title: 'NEXUS LINEHAUL FLEET',
        slogan: 'DATA DRIVEN • ZERO DELAY • HIGH RELIABILITY',
        description:
          'Đồng bộ lịch trình xe tải liên tỉnh xuất bến, kẹp chì niêm phong seal điện tử và bảo toàn hàng hóa trên các trục huyết mạch.',
        kpiHighlight: `${metrics.linehaulRate}% xe tải Linehaul đúng giờ (${metrics.dispatchedManifests}/${metrics.totalManifests || 1} chuyến)`,
      },
    ],
    [metrics],
  );

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    if (isHeroPaused) return;
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHeroPaused, heroSlides.length]);

  const onPrevHero = () => {
    setActiveHeroIndex((curr) => (curr === 0 ? heroSlides.length - 1 : curr - 1));
  };

  const onNextHero = () => {
    setActiveHeroIndex((curr) => (curr + 1) % heroSlides.length);
  };

  const activeHeroSlide = heroSlides[activeHeroIndex] ?? heroSlides[0];

  return (
    <div className="ops-dashboard">
      {/* 1. NEXUS Signature Dynamic Operational Hero Banner */}
      <section
        className="ops-dashboard__hero"
        aria-label="Hero carousel"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div className="ops-dashboard__hero-slider">
          <button
            type="button"
            className="ops-dashboard__hero-nav ops-dashboard__hero-nav--prev"
            aria-label="Trang trước"
            onClick={onPrevHero}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <div className="ops-dashboard__hero-content" key={activeHeroSlide.id}>
            <div className="ops-dashboard__hero-tag-row">
              <span className="ops-dashboard__hero-live-pill">
                <span className="ops-live-pulse-dot" />
                <span>NEXUS CONTROL TOWER · LIVE</span>
              </span>
              <span className="ops-dashboard__hero-domain-tag">
                <HeroTagIcon icon={activeHeroSlide.tagIcon} />
                <span>{activeHeroSlide.tag}</span>
              </span>
            </div>

            <p className="ops-dashboard__hero-company">{activeHeroSlide.title}</p>
            <h2 className="ops-dashboard__hero-title">{activeHeroSlide.slogan}</h2>
            <p className="ops-dashboard__hero-subtitle">{activeHeroSlide.description}</p>

            <div className="ops-dashboard__hero-footer">
              <span className="ops-dashboard__hero-kpi-highlight">
                <TrendingUp size={15} aria-hidden="true" />
                <span>{activeHeroSlide.kpiHighlight}</span>
              </span>

              <div className="ops-dashboard__hero-dots" aria-hidden="true">
                {heroSlides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.id}
                    className={
                      index === activeHeroIndex
                        ? 'ops-dashboard__hero-dot ops-dashboard__hero-dot--active'
                        : 'ops-dashboard__hero-dot'
                    }
                    onClick={() => setActiveHeroIndex(index)}
                    aria-label={`Chuyển tới slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="ops-dashboard__hero-nav ops-dashboard__hero-nav--next"
            aria-label="Trang sau"
            onClick={onNextHero}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Thẻ Bưu Cục Vận Hành Sở Tại (Preserves aria-label for test compatibility) */}
        <div className="ops-dashboard__hero-badge ops-dashboard__hero-badge--detailed" aria-label="Hub đang theo dõi">
          <div className="ops-dashboard__hero-badge-top">
            <span className="ops-dashboard__hero-badge-icon-box">
              {hubScope.hubLevel === 0 ? <Globe2 size={20} /> : <Building2 size={20} />}
            </span>
            <div className="ops-dashboard__hero-badge-title-wrap">
              <small>
                {hubScope.hubLevel === 0
                  ? 'Trụ sở Điều hành HQ (Toàn quốc)'
                  : hubScope.hubLevel === 1
                  ? 'Hub Điều hành Cấp Miền'
                  : hubScope.hubLevel === 2
                  ? 'Bưu cục Trung tâm Cấp Tỉnh'
                  : 'Bưu cục Vận hành Sở tại'}
              </small>
              <div className="ops-dashboard__hero-badge-name-row">
                <strong>{currentHub?.name ?? currentHub?.code ?? effectiveHubCode ?? 'Chưa gán'}</strong>
                <span className="ops-dashboard__hero-badge-code">
                  {currentHub?.code ?? effectiveHubCode ?? 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {currentHubAddress ? (
            <div className="ops-dashboard__hero-badge-address" title={currentHubAddress}>
              <MapPin size={14} aria-hidden="true" />
              <span>{currentHubAddress}</span>
            </div>
          ) : null}

          <div className="ops-dashboard__hero-badge-meta">
            <span className="ops-hub-meta-item">
              <Shield size={14} aria-hidden="true" />
              <span>{hubScope.scopeLabel}</span>
            </span>
            <span className="ops-hub-meta-item">
              <Radio size={14} aria-hidden="true" />
              <span>Bán kính {currentHub?.coverageRadiusKm ?? 5} km</span>
            </span>
            {currentHub?.latitude && currentHub?.longitude ? (
              <span className="ops-hub-meta-item">
                <LocateFixed size={14} aria-hidden="true" />
                <span>GPS: {currentHub.latitude.toFixed(4)}, {currentHub.longitude.toFixed(4)}</span>
              </span>
            ) : null}
            <span className="ops-status-online">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>Trực tuyến</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Real-time Telemetry & KPI Counters Strip */}
      <section className="ops-dashboard__command-bar" aria-label="Bảng chỉ huy tác nghiệp">
        <div className="ops-command-meta">
          <span className="ops-shift-live-pill">
            <Clock size={14} className="ops-shift-icon" aria-hidden="true" />
            <span>CA TRỰC VẬN HÀNH: CA SÁNG (06:00 - 14:00)</span>
          </span>
          <span className="ops-sync-time">
            <RefreshCw size={14} className="ops-sync-icon" aria-hidden="true" />
            <span>Cập nhật thời gian thực: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </span>
        </div>

        {/* Real Operational Throughput Counters */}
        <div className="ops-command-kpis">
          <div className="ops-command-kpi-item">
            <span className="ops-kpi-icon-box ops-kpi-icon-box--inbox">
              <Package size={20} aria-hidden="true" />
            </span>
            <div className="ops-kpi-body">
              <span className="ops-kpi-num">{metrics.totalShipments.toLocaleString('vi-VN')}</span>
              <span className="ops-kpi-lbl">Bưu gửi hệ thống</span>
            </div>
            <span className="ops-kpi-trend positive">{metrics.inTransitCount} đang chuyển</span>
          </div>

          <div className="ops-command-kpi-item">
            <span className="ops-kpi-icon-box ops-kpi-icon-box--linehaul">
              <Truck size={20} aria-hidden="true" />
            </span>
            <div className="ops-kpi-body">
              <span className="ops-kpi-num">{metrics.linehaulRate}%</span>
              <span className="ops-kpi-lbl">Linehaul xuất bến</span>
            </div>
            <span className="ops-kpi-tag">{metrics.dispatchedManifests}/{metrics.totalManifests || 1} chuyến</span>
          </div>

          <div className="ops-command-kpi-item">
            <span className="ops-kpi-icon-box ops-kpi-icon-box--sla">
              <CheckCircle2 size={20} aria-hidden="true" />
            </span>
            <div className="ops-kpi-body">
              <span className="ops-kpi-num">{metrics.successRate}%</span>
              <span className="ops-kpi-lbl">Tỷ lệ phát đạt SLA</span>
            </div>
            <span className="ops-kpi-tag standard">Chuẩn A ({metrics.deliveredCount} đơn)</span>
          </div>

          <div className="ops-command-kpi-item alert">
            <span className="ops-kpi-icon-box ops-kpi-icon-box--alert">
              <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <div className="ops-kpi-body">
              <span className="ops-kpi-num">{metrics.incidentCount}</span>
              <span className="ops-kpi-lbl">Sự cố cần can thiệp</span>
            </div>
            <span className="ops-kpi-trend danger">{rawNdrCases.length || metrics.incidentCount} đơn NDR</span>
          </div>
        </div>
      </section>

      {/* 2. Middle Section: Functional Operations Modules + Live Dispatch Notices */}
      <section className="ops-dashboard__menu-layout">
        <section className="ops-dashboard__function-groups" aria-label="Nhóm chức năng">
          <header className="ops-dashboard__section-header">
            <div className="ops-section-title-wrap">
              <h3>Menu chính</h3>
              <span className="ops-section-subtitle">Lối tắt tác nghiệp nhanh theo từng phân hệ quản lý</span>
            </div>
          </header>

          <div className="ops-menu-grid">
            {quickMenu.map((item) => (
              <div
                key={item.title}
                className={`ops-menu-card ops-menu-card--${item.accent} ${item.featured ? 'ops-menu-card--featured' : ''} ${item.disabled ? 'ops-menu-card--disabled' : ''}`}
              >
                <div className="ops-menu-card__top">
                  <span className="ops-menu-tile__icon-box">
                    <DashboardMenuSymbolIcon icon={item.icon} />
                  </span>
                  {item.badge && <span className="ops-menu-card__badge">{item.badge}</span>}
                </div>

                <div className="ops-menu-card__info">
                  <Link to={item.to || '#'} className="ops-menu-card__title-link">
                    <strong>{item.title}</strong>
                  </Link>
                  <p className="ops-menu-card__desc">{item.description}</p>
                </div>

                {item.quickLinks && item.quickLinks.length > 0 && (
                  <div className="ops-menu-card__actions">
                    {item.quickLinks.map((link) => (
                      <Link key={link.label} to={link.to} className="ops-menu-action-pill">
                        <QuickActionIcon icon={link.icon} />
                        <span>{link.label}</span>
                        <ArrowRight size={13} strokeWidth={2} className="ops-menu-action-arrow" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Aside Operational Dispatch Notices */}
        <aside className="ops-dashboard__menu-side">
          <article className="ops-card ops-dispatch-card">
            <header className="ops-card__header">
              <div className="ops-dispatch-header-title">
                <span className="ops-dispatch-header-icon-box">
                  <Megaphone size={18} aria-hidden="true" />
                </span>
                <h3>Thông báo</h3>
              </div>
              <span className="ops-dispatch-badge">{notices.length} tin mới</span>
            </header>

            <ul className="ops-notification-list">
              {notices.map((item) => (
                <li key={item.id} className="ops-notification-item">
                  <div className="ops-notification-header">
                    <span className={`ops-notice-tag ${item.badgeClass}`}>
                      <NoticeSymbolIcon icon={item.icon} />
                      <span>{item.priorityLabel}</span>
                    </span>
                    <span className="ops-notice-time">{item.time}</span>
                  </div>
                  <strong className="ops-notice-title">{item.title}</strong>
                  <p className="ops-notice-content">{item.content}</p>
                  <div className="ops-notice-footer">
                    <span className="ops-notice-dept">Phát lệnh: {item.department}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>

      {/* 3. Bottom Section: Analytics & Performance Radar */}
      <section className="ops-dashboard__content ops-dashboard__content--analytics">
        <AnalyticsDashboardPage />
      </section>
    </div>
  );
}
