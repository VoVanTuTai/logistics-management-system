import React, { useState, useEffect, useMemo } from 'react';
import {
  BrowserRouter,
  MemoryRouter,
  Link as RouterLink,
  NavLink as RouterNavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
  useParams,
} from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  LogOut,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Truck,
  User,
  X,
  Calculator,
  ArrowRight,
  Zap,
  Building2,
  Check,
  Boxes,
  AlertCircle,
  RefreshCw,
  QrCode,
  Copy,
  ExternalLink,
  Navigation,
  Share2,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Bot,
  UserCheck,
  Filter,
  Calendar,
  Eye,
  Send,
  Inbox,
  ArrowUpRight,
  ArrowDownLeft,
  Image as ImageIcon,
  Lock,
  Bell,
  UserPlus,
  Barcode,
  Scale,
  Printer,
  Container,
  Layers,
} from 'lucide-react';
import qrcode from 'qrcode-generator';

import { IndustrialBarcode } from './components/IndustrialBarcode';
import { ZaloIcon } from './components/ZaloIcon';
import { NexusBrandLogo, NexusBrandMark } from './components/NexusBrandLogo';
import { LogisticsAnimatedBanner } from './components/LogisticsAnimatedBanner';
import { PortalHeader } from './components/PortalHeader';
import { PortalFooter } from './components/PortalFooter';
import { JtServicesShowcase } from './components/JtServicesShowcase';
import { JtCommitmentsAndSteps } from './components/JtCommitmentsAndSteps';
import LoginPage from './pages/LoginPage';
import { FloatingAiChatWidget } from './components/FloatingAiChatWidget';
import { OrdersPage } from './pages/OrdersPage';
import { TermsOfServicePage } from './pages/terms/TermsOfServicePage';
import { useAuthStore } from './store/useAuthStore';
import { resolveCourierForOrder, formatCourierPhone } from './utils/courierResolver';
import {
  trackingApi,
  type UnifiedTrackingResponse,
  type TimelineEventResponse,
} from './services/api/tracking.api';
import { pricingApi, type PricingQuoteResponse } from './services/api/pricing.api';
import { authApi } from './services/api/auth.api';
import { computeFallbackQuote } from './utils/pricingCalculator';
import { shipmentApi, type ShipmentResponse } from './services/api/shipment.api';
import { masterdataApi, type HubRecord } from './services/api/masterdata.api';
import {
  normalizeMediaPublicUrl,
  cleanCustomerNote,
  formatCustomerTimelineEvent,
  formatVnd,
} from './utils/trackingUtils';
import {
  getWardsForProvince,
  findMatchingHubsForLocation,
  parseApiAdministrativeUnits,
  VIETNAM_ADMINISTRATIVE_DATA,
  type AdminUnitProvince,
  type AdminUnitWard,
} from './utils/vietnamAdministrativeData';
import {
  getDefaultAddress,
  getSavedAddresses,
  type SavedAddress,
} from './utils/savedAddressService';


const PROVINCES = VIETNAM_ADMINISTRATIVE_DATA.map((p) => p.name);

const OPS_HERO_BG =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80';

// Helper to render QR Code as SVG Data URL
function generateQrDataUrl(text: string): string {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(5, 10);
  } catch {
    return '';
  }
}

// 5 Main Milestones for Graphical Progression Bar
interface MilestoneStep {
  key: string;
  label: string;
  subLabel: string;
  icon: React.ElementType;
}

const MILESTONES: MilestoneStep[] = [
  { key: 'CREATED', label: 'Tạo Đơn', subLabel: 'Đã tiếp nhận', icon: FileText },
  { key: 'PICKED_UP', label: 'Đã Lấy Hàng', subLabel: 'Bưu cục gốc', icon: Package },
  { key: 'IN_TRANSIT', label: 'Trung Chuyển', subLabel: 'Liên tỉnh', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Đang Giao', subLabel: 'Bưu tá phát', icon: Navigation },
  { key: 'DELIVERED', label: 'Thành Công', subLabel: 'Ký nhận POD', icon: CheckCircle2 },
];

export interface LogisticsLeg {
  id: string;
  legNumber: string;
  name: string;
  subTitle: string;
  description: string;
  icon: React.ElementType;
  minCompletedMilestone: number;
  activeMilestone: number;
}

export const LOGISTICS_LEGS: LogisticsLeg[] = [
  {
    id: 'first-mile',
    legNumber: 'CHẶNG 01',
    name: 'First-Mile Gom Hàng',
    subTitle: 'Điểm gửi ➔ Bưu cục gốc',
    description: 'Bưu tá tiếp nhận bưu phẩm hoặc khách gửi tại quầy bưu cục',
    icon: Package,
    minCompletedMilestone: 1,
    activeMilestone: 0,
  },
  {
    id: 'origin-hub',
    legNumber: 'CHẶNG 02',
    name: 'Khai Thác Bưu Cục Gốc',
    subTitle: 'Quét cân đo IATA & Đóng bao tải',
    description: 'Phân loại tự động, dán tem mã vạch và niêm phong chì seal',
    icon: Building2,
    minCompletedMilestone: 2,
    activeMilestone: 1,
  },
  {
    id: 'linehaul',
    legNumber: 'CHẶNG 03',
    name: 'Trung Chuyển Đường Trục',
    subTitle: 'Xe tải Linehaul / Container liên tỉnh',
    description: 'Vận chuyển liên vùng kết nối giữa các trung tâm khai thác (Hub-to-Hub)',
    icon: Truck,
    minCompletedMilestone: 3,
    activeMilestone: 2,
  },
  {
    id: 'last-mile',
    legNumber: 'CHẶNG 04',
    name: 'Last-Mile & Giao Nhận POD',
    subTitle: 'Bưu cục phát ➔ Khách nhận',
    description: 'Bưu tá xuất tuyến giao tận nơi, thu COD và ký nhận điện tử POD',
    icon: CheckCircle2,
    minCompletedMilestone: 4,
    activeMilestone: 3,
  },
];

function getMilestoneIndex(status?: string | null): number {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 4;
  if (s === 'DELIVERING' || s === 'OUT_FOR_DELIVERY' || s === 'READY_FOR_DELIVERY' || s === 'RESCHEDULED') return 3;
  if (s === 'IN_TRANSIT' || s === 'SCAN_INBOUND' || s === 'SCAN_OUTBOUND' || s === 'SORTED' || s === 'BAGGED' || s === 'MANIFEST_SEALED' || s === 'MANIFEST_RECEIVED' || s === 'MANIFEST_UNSEALED' || s === 'ARRIVED_HUB' || s === 'ARRIVED_DEST_HUB') return 2;
  if (s === 'PICKED_UP' || s === 'PICKUP_COMPLETED' || s === 'SCAN_PICKUP' || s === 'ARRIVED_ORIGIN_HUB') return 1;
  return 0; // CREATED, UPDATED, TASK_ASSIGNED, PICKUP_REQUESTED, PICKUP_ASSIGNED
}

function getStatusBadgeDetails(status?: string | null) {
  const s = (status || 'CREATED').toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') {
    return { label: 'Giao Hàng Thành Công', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' };
  }
  if (s === 'DELIVERY_FAILED' || s === 'NDR_CREATED') {
    return { label: 'Giao Thất Bại (Sự Cố NDR)', bg: 'bg-amber-500/10 text-amber-700 border-amber-300', dot: 'bg-amber-500' };
  }
  if (s === 'RETURN_STARTED' || s === 'RETURN_COMPLETED' || s === 'RETURNING' || s === 'RETURNED') {
    return { label: 'Đang Chuyển Hoàn', bg: 'bg-rose-500/10 text-rose-700 border-rose-300', dot: 'bg-rose-500' };
  }
  if (s === 'CANCELLED') {
    return { label: 'Đã Hủy Đơn', bg: 'bg-slate-500/10 text-slate-700 border-slate-300', dot: 'bg-slate-500' };
  }
  if (s === 'DELIVERING' || s === 'OUT_FOR_DELIVERY' || s === 'READY_FOR_DELIVERY') {
    return { label: 'Đang Phát Hàng Tận Nơi', bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-300', dot: 'bg-indigo-500 animate-pulse' };
  }
  if (s === 'IN_TRANSIT' || s === 'SCAN_INBOUND' || s === 'SCAN_OUTBOUND' || s === 'SORTED' || s === 'ARRIVED_HUB' || s === 'ARRIVED_DEST_HUB') {
    return { label: 'Đang Trung Chuyển Liên Tỉnh', bg: 'bg-blue-500/10 text-blue-700 border-blue-300', dot: 'bg-blue-500 animate-pulse' };
  }
  if (s === 'PICKED_UP' || s === 'PICKUP_COMPLETED' || s === 'SCAN_PICKUP' || s === 'ARRIVED_ORIGIN_HUB') {
    return { label: 'Bưu Tá Đã Lấy Hàng', bg: 'bg-sky-500/10 text-sky-700 border-sky-300', dot: 'bg-sky-500' };
  }
  if (s === 'TASK_ASSIGNED' || s === 'PICKUP_ASSIGNED') {
    return { label: 'Chờ Lấy Hàng (Đã Phân Công)', bg: 'bg-amber-500/10 text-amber-700 border-amber-300', dot: 'bg-amber-500' };
  }
  return { label: 'Đã Tiếp Nhận (Chờ Lấy)', bg: 'bg-blue-500/10 text-blue-700 border-blue-300', dot: 'bg-blue-500' };
}

function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* J&T Full-Width Top Header */}
      <PortalHeader />

      {/* Main View Area (Full-Width Canvas) */}
      <main className="w-full flex-1" id="main-content">
        <Outlet />
      </main>

      {/* J&T Full-Width Enterprise Footer */}
      {!isLoginPage && <PortalFooter />}

      {/* Floating AI Chat Assistant Widget */}
      <FloatingAiChatWidget />
    </div>
  );
}

// ==========================================
// 1. UNIFIED TRACKING & PUBLIC PORTAL PAGE
// ==========================================
function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { code: routeCode } = useParams<{ code?: string }>();
  const { phone, token, user } = useAuthStore();
  const isLoggedIn = Boolean(token);
  const navigate = useNavigate();

  // Search state
  const [trackingCode, setTrackingCode] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [selectedPodImage, setSelectedPodImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<UnifiedTrackingResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Fee Estimator State
  const [calcOrigin, setCalcOrigin] = useState('Thành phố Hồ Chí Minh');
  const [calcDest, setCalcDest] = useState('Thành phố Hà Nội');
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcLength, setCalcLength] = useState(20);
  const [calcWidth, setCalcWidth] = useState(15);
  const [calcHeight, setCalcHeight] = useState(10);
  const [calcService, setCalcService] = useState<'EXPRESS' | 'STANDARD' | 'CARGO'>('STANDARD');
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<PricingQuoteResponse | null>(null);

  // Chuẩn quốc tế IATA: Khối lượng quy đổi thể tích V = (Dài x Rộng x Cao) / 6000
  const calcVolumetricWeight = useMemo(() => {
    if (calcLength > 0 && calcWidth > 0 && calcHeight > 0) {
      return Number(((calcLength * calcWidth * calcHeight) / 6000).toFixed(2));
    }
    return 0;
  }, [calcLength, calcWidth, calcHeight]);

  const calcChargeableWeight = useMemo(() => {
    return Math.max(calcWeight, calcVolumetricWeight);
  }, [calcWeight, calcVolumetricWeight]);

  // Hubs Directory
  const [hubs, setHubs] = useState<HubRecord[]>([]);

  // Driver apply modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyStep, setApplyStep] = useState<'form' | 'success'>('form');
  const [applyName, setApplyName] = useState('');
  const [applyPhone, setApplyPhone] = useState('');

  // Initial code from query param or path
  useEffect(() => {
    masterdataApi.getHubs().then(setHubs).catch(() => {});
    const initialCode = routeCode || searchParams.get('track') || searchParams.get('code');
    const initialPhone = searchParams.get('phone') || searchParams.get('receiverPhone') || '';
    if (initialPhone) {
      setReceiverPhone(initialPhone);
    }
    if (initialCode) {
      const codeTrimmed = initialCode.trim().toUpperCase();
      setTrackingCode(codeTrimmed);
      if (token || initialPhone) {
        doSearch(codeTrimmed, initialPhone || (token ? (phone || undefined) : undefined));
      }
    }
  }, [routeCode, searchParams, token, phone]);

  const doSearch = async (code: string, phoneInput?: string) => {
    if (!code) return;
    const phoneToUse = (phoneInput !== undefined ? phoneInput : receiverPhone).trim();

    // Security check: Guest users must supply receiver phone
    if (!token && !phoneToUse) {
      setSearchError('Theo chính sách bảo mật bưu gửi, quý khách chưa đăng nhập vui lòng nhập cả mã vận đơn và số điện thoại người nhận.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const data = await trackingApi.getTracking(
        code,
        token,
        phoneToUse || (token ? (phone || undefined) : undefined),
      );
      if (data.requiresReceiverPhone) {
        setSearchResult(data);
        setSearchError('Đơn hàng yêu cầu xác thực số điện thoại người nhận để mở khóa chi tiết.');
      } else if (!data.current && data.timeline.length === 0 && !data.order) {
        setSearchError(`Không tìm thấy hành trình vận đơn "${code}". Vui lòng kiểm tra lại mã hoặc số điện thoại.`);
        setSearchResult(null);
      } else {
        setSearchResult(data);
        const nextParams: Record<string, string> = { track: code };
        if (!token && phoneToUse) {
          nextParams.phone = phoneToUse;
        }
        setSearchParams(nextParams);
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Tra cứu vận đơn thất bại.');
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCode.trim().toUpperCase();
    if (!code) return;
    doSearch(code);
  };

  const handlePhoneVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCode.trim().toUpperCase();
    if (!code || !receiverPhone.trim()) return;
    doSearch(code, receiverPhone.trim());
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?track=${encodeURIComponent(trackingCode.trim().toUpperCase())}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCalculateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    try {
      const res = await pricingApi.calculateQuote({
        serviceType: calcService,
        sender: { province: calcOrigin },
        receiver: { province: calcDest },
        package: {
          weightKg: calcWeight,
          dimensionsCm: {
            length: calcLength,
            width: calcWidth,
            height: calcHeight,
          },
        },
      });
      setQuoteResult(res);

      try {
        localStorage.setItem(
          'nexus_draft_quote',
          JSON.stringify({
            originProvince: calcOrigin,
            destProvince: calcDest,
            weightKg: calcWeight,
            lengthCm: calcLength,
            widthCm: calcWidth,
            heightCm: calcHeight,
            serviceType: calcService === 'CARGO' ? 'STANDARD' : calcService,
            estimatedFee: res.totalFee,
            timestamp: Date.now(),
          }),
        );
      } catch {}
    } catch {
      const fallback = computeFallbackQuote({
        serviceType: calcService,
        senderProvince: calcOrigin,
        receiverProvince: calcDest,
        weightKg: calcWeight,
        lengthCm: calcLength,
        widthCm: calcWidth,
        heightCm: calcHeight,
      });
      setQuoteResult(fallback);

      try {
        localStorage.setItem(
          'nexus_draft_quote',
          JSON.stringify({
            originProvince: calcOrigin,
            destProvince: calcDest,
            weightKg: calcWeight,
            lengthCm: calcLength,
            widthCm: calcWidth,
            heightCm: calcHeight,
            serviceType: calcService === 'CARGO' ? 'STANDARD' : calcService,
            estimatedFee: fallback.totalFee,
            timestamp: Date.now(),
          }),
        );
      } catch {}
    } finally {
      setIsCalculating(false);
    }
  };

  const currentStatusCode = searchResult?.current?.currentStatusCode || searchResult?.order?.statusCode;
  const milestoneIndex = getMilestoneIndex(currentStatusCode);
  const statusBadge = getStatusBadgeDetails(currentStatusCode);

  const qrDataUrl = useMemo(() => {
    if (!searchResult?.shipmentCode) return '';
    const shareUrl = `${window.location.origin}/?track=${encodeURIComponent(searchResult.shipmentCode)}`;
    return generateQrDataUrl(shareUrl);
  }, [searchResult?.shipmentCode]);

  // Logistics package metrics & industrial routing tags
  const pkgGrossWeight = searchResult?.order?.package?.weightKg || 1.2;
  const pkgDimensions = searchResult?.order?.package?.dimensionsCm || { length: 20, width: 15, height: 10 };
  const pkgVolumetricWeight = useMemo(() => {
    if (pkgDimensions.length && pkgDimensions.width && pkgDimensions.height) {
      return Number(((pkgDimensions.length * pkgDimensions.width * pkgDimensions.height) / 6000).toFixed(2));
    }
    return 0.5;
  }, [pkgDimensions]);
  const pkgChargeableWeight = Math.max(pkgGrossWeight, pkgVolumetricWeight);

  const originHubCode = searchResult?.order?.routing?.originHubCode || searchResult?.order?.sender?.hubCode || 'HUB-HCM-001';
  const destHubCode = searchResult?.order?.routing?.destinationHubCode || searchResult?.order?.receiver?.hubCode || 'HUB-HN-001';
  const sealNumber = `SEAL-VN-${(searchResult?.shipmentCode || '2026').slice(-4)}-X8`;

  return (
    <div className="w-full pb-16 font-sans">
      {/* 0. DYNAMIC LOGISTICS HERO BANNER WITH UNIFIED TRACKING STATION (Full-Width Edge-to-Edge) */}
      <LogisticsAnimatedBanner
        trackingCode={trackingCode}
        setTrackingCode={setTrackingCode}
        receiverPhone={receiverPhone}
        setReceiverPhone={setReceiverPhone}
        isLoggedIn={isLoggedIn}
        userDisplayName={user?.displayName || undefined}
        userPhone={phone || undefined}
        isSearching={isSearching}
        onTrackingSubmit={handleTrackingSubmit}
        onSampleCodeClick={(code) => {
          setTrackingCode(code);
          doSearch(code);
        }}
        onClearTracking={() => {
          setTrackingCode('');
          setSearchResult(null);
          setSearchError(null);
        }}
      />

      {/* Main Body Content Canvas (Max-W 1536px Spacious Container) */}
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-10 space-y-12">
        {/* 1. SEARCH ERROR OR PRIVACY VERIFICATION ALERT */}
        {searchError && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{searchError}</span>
            </div>
            {searchResult?.requiresReceiverPhone && (
              <form onSubmit={handlePhoneVerifySubmit} className="flex gap-2 shrink-0">
                <input
                  type="tel"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Nhập SĐT người nhận..."
                  className="px-3 py-1.5 text-xs border border-amber-300 bg-white font-semibold text-slate-900 outline-none rounded-lg"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Xác Thực
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. ELECTRONIC CONSIGNMENT NOTE (e-AWB) & OPERATIONAL TRACKING */}
        {searchResult && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-6">
            {/* Official Waybill Header */}
            {/* Official Waybill Top Brand Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <NexusBrandLogo size="sm" asLink={false} />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 border border-blue-200 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  VẬN ĐƠN BƯU CHÍNH ĐIỆN TỬ (e-AWB)
                </span>
                <span className="text-[10px] font-bold text-white bg-blue-600 px-2.5 py-1 rounded-full">
                  {searchResult.order?.serviceType === 'EXPRESS' ? 'HỎA TỐC 24H' : 'TIÊU CHUẨN'}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 border border-blue-200 rounded-full">
                  ĐỒ ÁN KHOÁ LUẬN CNTT
                </span>
              </div>
            </div>

          {/* Official Waybill Header Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  #{searchResult.shipmentCode}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                    title="Sao chép link theo dõi"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                    title="Xem mã QR quét điện thoại"
                  >
                    <QrCode className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Ngày khởi tạo: {searchResult.order?.createdAt ? new Date(searchResult.order.createdAt).toLocaleDateString('vi-VN') : '17/10/2026'} • Nexus Logistics Network
              </p>
            </div>

            {/* Crisp Code-128 SVG Barcode */}
            <div className="bg-slate-50 p-2.5 border border-slate-200 rounded-lg flex flex-col items-center">
              <IndustrialBarcode value={searchResult.shipmentCode} height={48} />
            </div>

            {/* Current Status Badge */}
            <div className="flex flex-col md:items-end justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Trạng Thái Vận Hành Hiện Tại:
              </span>
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold border rounded-full shadow-xs ${statusBadge.bg}`}>
                <span className={`h-2 w-2 rounded-full ${statusBadge.dot}`} />
                {searchResult.current?.currentStatus || statusBadge.label}
              </span>
            </div>
          </div>

          {/* Solid Routing Sector Tag Strip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tuyến Phân Loại (Route)</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                <span className="text-blue-600">{originHubCode}</span> ➔ <span className="text-blue-700">{destHubCode}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Số Niêm Chì (Seal No.)</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">
                {sealNumber}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cước Vận Chuyển</span>
              <p className="font-bold text-blue-700 mt-0.5">
                NGƯỜI GỬI ĐÃ TRẢ (PREPAID)
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Thu Hộ Khi Nhận (COD)</span>
              <p className="font-mono font-extrabold text-blue-700 mt-0.5">
                {(searchResult.order?.codAmount || 0) > 0 ? `${(searchResult.order?.codAmount || 0).toLocaleString('vi-VN')} VNĐ` : '0 VNĐ (Không Thu COD)'}
              </p>
            </div>
          </div>

          {/* 4-Leg Logistics Pipeline Visual Stepper */}
          <div className="border border-slate-200 p-4 bg-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Container className="w-4 h-4 text-blue-600" />
                Tiến Trình 4 Chặng Vận Chuyển Chuẩn Chuỗi Cung Ứng
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                Quy trình vận hành khép kín
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {LOGISTICS_LEGS.map((leg) => {
                const isCompleted = milestoneIndex >= leg.minCompletedMilestone;
                const isActive = milestoneIndex === leg.activeMilestone;
                const Icon = leg.icon;

                return (
                  <div
                    key={leg.id}
                    className={`p-3.5 border rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-50 border-2 border-blue-600 shadow-xs'
                        : isCompleted
                        ? 'bg-blue-50/60 border border-blue-200'
                        : 'bg-slate-50 border border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold uppercase text-slate-400">
                        {leg.legNumber}
                      </span>
                      {isCompleted ? (
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-blue-600" /> ĐÃ XONG
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> ĐANG XỬ LÝ
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          CHỜ ĐẾN LƯỢT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive || isCompleted
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{leg.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{leg.subTitle}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid of Details: Scan Audit Trail (Left 7) & Waybill Technical Specs (Right 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
            {/* Detailed Checkpoint Scan Audit Trail (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-900">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Nhật Ký Quét Kiểm Soát Bưu Phẩm (Scan Audit Trail)
                </div>
                <span className="text-[11px] font-bold text-slate-500 font-mono">
                  {searchResult.timeline.length} BƯỚC QUÉT
                </span>
              </div>

              {searchResult.timeline.length > 0 ? (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                  {searchResult.timeline.map((ev, i) => {
                    const formatted = formatCustomerTimelineEvent(ev);
                    const cleanedNote = cleanCustomerNote(ev.note);
                    const isLatest = i === 0 || i === searchResult.timeline.length - 1;

                    return (
                      <div
                        key={ev.id || i}
                        className={`p-3.5 border rounded-lg transition-all ${
                          isLatest
                            ? 'bg-blue-50 border border-blue-200 shadow-xs'
                            : 'bg-slate-50 border border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isLatest ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              <Truck className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-xs text-slate-900">
                                  {formatted.title}
                                </p>
                                {formatted.badgeText && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
                                    {formatted.badgeText}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                <span className="inline-flex items-center gap-1 font-medium">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  {ev.locationText || ev.locationCode || 'Trạm trung chuyển bưu chính'}
                                </span>
                              </div>

                              {(cleanedNote || formatted.defaultDescription) && (
                                <p className="text-[11px] text-slate-700 font-normal leading-relaxed bg-white p-2 border border-slate-200 rounded-lg">
                                  {cleanedNote || formatted.defaultDescription}
                                </p>
                              )}

                              {/* Proof Image (POD) */}
                              {ev.proofImageUrl && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-600 mb-1.5">
                                    <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Bằng chứng giao hàng (POD):</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPodImage(ev.proofImageUrl || null)}
                                    className="group relative inline-block cursor-pointer overflow-hidden border border-slate-200 bg-slate-100 rounded-lg shadow-xs hover:shadow-md transition text-left"
                                    title="Bấm để xem ảnh phóng to"
                                  >
                                    <img
                                      src={ev.proofImageUrl}
                                      alt="Minh chứng giao hàng POD"
                                      className="h-20 w-32 object-cover transition duration-300 group-hover:scale-105"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[11px] font-bold">
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>Xem ảnh</span>
                                    </div>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0 bg-white px-2 py-0.5 border border-slate-200 rounded-full">
                            {ev.occurredAt
                              ? new Date(ev.occurredAt).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 text-center text-xs text-slate-500 font-medium border border-slate-200 rounded-lg">
                  Bưu phẩm mới khởi tạo, đang sẵn sàng quét mã bưu tá tại bưu cục gốc.
                </div>
              )}
            </div>

            {/* Order & Package Specs Sheet (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Consignor & Consignee Card */}
              <div className="border border-slate-200 p-4 bg-slate-50/60 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-800">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Bưu Phẩm Giao Nhận (Consignor & Consignee)
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Người Gửi (Consignor)</span>
                      <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md">{originHubCode}</span>
                    </div>
                    <p className="font-bold text-slate-900">{searchResult.order?.sender?.name || 'Chủ hàng / Shop đối tác'}</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      {searchResult.order?.sender?.province || 'Bưu cục gốc TP.HCM'}
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Người Nhận (Consignee)</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">{destHubCode}</span>
                    </div>
                    <p className="font-bold text-slate-900">{searchResult.order?.receiver?.name || 'Khách hàng nhận'}</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      {searchResult.order?.receiver?.address || searchResult.order?.receiver?.province || 'Bưu cục phát Hà Nội'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package Specifications & IATA Volumetric Measurements */}
              <div className="border border-slate-200 p-4 bg-white rounded-xl space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    Thông Số Đo Đạc Kỹ Thuật (IATA Specs)
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
                    IATA RATIO 1:6000
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cân Nặng Thực</span>
                      <p className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                        {pkgGrossWeight} kg
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Kích Thước (D×R×C)</span>
                      <p className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                        {pkgDimensions.length}×{pkgDimensions.width}×{pkgDimensions.height} cm
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Quy Đổi Thể Tích</span>
                      <p className="font-bold text-blue-700 font-mono text-sm mt-0.5">
                        {pkgVolumetricWeight} kg
                      </p>
                    </div>

                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block">Tính Cước</span>
                      <p className="font-bold text-blue-900 font-mono text-sm mt-0.5">
                        {pkgChargeableWeight} kg
                      </p>
                    </div>
                  </div>

                  {/* Freight Ledger */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cước Phí Vận Chuyển</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">Người gửi đã thanh toán</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
                      PREPAID
                    </span>
                  </div>

                  {/* COD & Collector Box */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                        Tiền Thu Hộ COD Khi Nhận Hàng
                      </span>
                      <p className="text-lg font-black text-blue-900 font-mono mt-0.5">
                        {(searchResult.order?.codAmount || 0) > 0
                          ? `${(searchResult.order?.codAmount || 0).toLocaleString('vi-VN')} VNĐ`
                          : '0 VNĐ (Không Thu Tiền)'}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 border border-blue-200 rounded-full">
                      Thanh toán Shipper
                    </span>
                  </div>
                </div>
              </div>

              {/* Live GPS Driver Position Badge */}
              {searchResult.gpsPosition && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-blue-900">Vị Trí GPS Bưu Tá Trực Tiếp</p>
                    <p className="text-[11px] text-blue-700 font-mono">
                      Lat: {searchResult.gpsPosition.latitude.toFixed(4)}, Lng: {searchResult.gpsPosition.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. J&T-STYLE 4 FLAGSHIP LOGISTICS SERVICES SHOWCASE */}
      <JtServicesShowcase />

      {/* 3. RATE ESTIMATOR & SERVICES OVERVIEW SECTION */}
      <section id="fee-calculator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-label="Công cụ tính cước nhanh">
        {/* Rate Estimator (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Scale className="h-4 w-4" strokeWidth={2.2} />
              Bảng Dự Toán Cước Bưu Chính Chuẩn IATA
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1 uppercase">Tính Cước Vận Tải Theo Biểu Giá Niêm Yết</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Hệ số thể tích quốc tế IATA (Dài × Rộng × Cao)/6000 đồng bộ mạng lưới toàn quốc.</p>
          </div>

          <form onSubmit={handleCalculateFee} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Tỉnh Gửi</label>
                <select
                  value={calcOrigin}
                  onChange={(e) => setCalcOrigin(e.target.value)}
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none rounded-lg focus:border-blue-600 focus:bg-white"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Tỉnh Nhận</label>
                <select
                  value={calcDest}
                  onChange={(e) => setCalcDest(e.target.value)}
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none rounded-lg focus:border-blue-600 focus:bg-white"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Khối lượng thực tế */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Khối lượng thực tế (kg)</label>
                <span className="text-[10px] text-slate-400 font-medium">Nhập số hoặc chọn nhanh</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={calcWeight || ''}
                    onChange={(e) => setCalcWeight(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    placeholder="VD: 1.0"
                    className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none rounded-lg focus:border-blue-600 focus:bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-semibold">kg</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {[0.5, 1, 2, 5].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setCalcWeight(w)}
                      className={`px-2.5 py-2 text-xs font-bold border rounded-md transition ${
                        calcWeight === w
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50'
                      }`}
                    >
                      {w}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Kích thước Dài x Rộng x Cao & Chuẩn IATA */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                Kích thước kiện hàng (Dài × Rộng × Cao cm)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={calcLength || ''}
                    onChange={(e) => setCalcLength(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Dài"
                    className="w-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-900 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-center"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">cm</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={calcWidth || ''}
                    onChange={(e) => setCalcWidth(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Rộng"
                    className="w-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-900 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-center"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">cm</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={calcHeight || ''}
                    onChange={(e) => setCalcHeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Cao"
                    className="w-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-900 outline-none rounded-lg focus:border-blue-600 focus:bg-white text-center"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">cm</span>
                </div>
              </div>

              {/* Box so sánh IATA V/6000 trực quan */}
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] space-y-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Quy đổi thể tích IATA: <code>(D×R×C)/6000</code></span>
                  <span className="font-mono font-bold text-slate-900">{calcVolumetricWeight} kg</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 font-bold">
                  <span>Trọng lượng tính cước (Chargeable Weight):</span>
                  <span className="font-mono text-blue-700">{calcChargeableWeight} kg</span>
                </div>
                {calcVolumetricWeight > calcWeight ? (
                  <p className="text-[10px] text-blue-700 font-medium">
                    ⚠️ Hàng cồng kềnh: Tính cước theo thể tích quy đổi ({calcVolumetricWeight} kg &gt; {calcWeight} kg).
                  </p>
                ) : (
                  <p className="text-[10px] text-blue-700 font-medium">
                    ✓ Kiện hàng gọn: Tính cước theo cân nặng thực tế ({calcWeight} kg).
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Gói dịch vụ</label>
              <select
                value={calcService}
                onChange={(e) => setCalcService(e.target.value as any)}
                className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none rounded-lg focus:border-blue-600 focus:bg-white"
              >
                <option value="STANDARD">Giao Chuẩn Standard (24 - 48h)</option>
                <option value="EXPRESS">Giao Hỏa Tốc Express (2 - 6h)</option>
                <option value="CARGO">Hàng Nặng Cargo (Chiết khấu)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 font-black text-xs uppercase tracking-wider rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang Tính Cước Theo Biểu Giá...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" strokeWidth={2.4} />
                  <span>Dự Toán Cước Phí Ngay</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column (6 cols): Official Rate Quotation Certificate Card OR Transparency Guide */}
        {quoteResult ? (
          <div className="lg:col-span-6 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-2 border-blue-200/90 p-6 sm:p-7 rounded-2xl shadow-xs flex flex-col justify-between space-y-5">
            {/* Certificate Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <NexusBrandMark size="xs" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                  PHIẾU DỰ TOÁN CƯỚC TẠM TÍNH
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-blue-700 bg-white px-2.5 py-1 border border-blue-200 rounded-full shadow-2xs">
                NEXUS-QUOTE
              </span>
            </div>

            {/* Route & SLA Banner */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-500 uppercase text-[10px]">Lộ trình vận chuyển:</span>
                <span className="font-black text-blue-700 text-xs bg-blue-50 px-2 py-0.5 border border-blue-100 rounded-full">
                  {calcService === 'EXPRESS' ? 'Hỏa Tốc 2-24H' : 'Tiêu Chuẩn 24-48H'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono font-black text-xs text-slate-800">
                <span className="text-blue-700 truncate max-w-[150px]">{calcOrigin}</span>
                <span className="text-slate-400">➔</span>
                <span className="text-blue-700 truncate max-w-[150px]">{calcDest}</span>
              </div>
            </div>

            {/* Weight & IATA Volumetric Analysis */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Cân nặng thực</span>
                <span className="font-mono font-black text-slate-800 text-sm mt-0.5 block">{calcWeight} kg</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Quy đổi IATA</span>
                <span className="font-mono font-black text-blue-700 text-sm mt-0.5 block">{calcVolumetricWeight} kg</span>
              </div>
              <div className="p-3 bg-blue-100/70 border border-blue-300 rounded-lg shadow-2xs">
                <span className="text-[10px] font-black text-blue-800 uppercase block">Tính cước</span>
                <span className="font-mono font-black text-blue-900 text-sm mt-0.5 block">
                  {quoteResult.chargeableWeightKg || calcChargeableWeight} kg
                </span>
              </div>
            </div>

            {/* Detailed Fee Breakdown Items */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs shadow-2xs">
              {quoteResult.breakdown && quoteResult.breakdown.length > 0 ? (
                quoteResult.breakdown.map((item, bIdx) => (
                  <div key={bIdx} className="flex justify-between text-slate-600">
                    <span>{item.label}:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {item.amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Cước vận chuyển chính:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {Math.round(quoteResult.totalFee * 0.88).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phụ phí nhiên liệu & trạm Hub:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {Math.round(quoteResult.totalFee * 0.04).toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Bảo hiểm khai giá 100%:</span>
                <span className="font-extrabold text-emerald-600">MIỄN PHÍ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí thu hộ COD toàn quốc:</span>
                <span className="font-extrabold text-emerald-600">0 ĐỒNG</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="font-black text-xs text-slate-900 uppercase block">TỔNG CƯỚC TẠM TÍNH</span>
                  <span className="text-[10px] text-slate-400 font-medium">(Đã bao gồm VAT 8%)</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tracking-tight">
                  {quoteResult.totalFee.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const draft = {
                    originProvince: calcOrigin,
                    destProvince: calcDest,
                    weightKg: calcWeight,
                    lengthCm: calcLength,
                    widthCm: calcWidth,
                    heightCm: calcHeight,
                    serviceType: calcService === 'CARGO' ? 'STANDARD' : calcService,
                    estimatedFee: quoteResult.totalFee,
                    timestamp: Date.now(),
                  };
                  try {
                    localStorage.setItem('nexus_draft_quote', JSON.stringify(draft));
                  } catch {}
                  navigate('/create', { state: draft });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-xs font-black uppercase tracking-wider rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Tạo Vận Đơn Ngay Với Báo Giá Này</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {!phone && (
                <button
                  type="button"
                  onClick={() => {
                    const draft = {
                      originProvince: calcOrigin,
                      destProvince: calcDest,
                      weightKg: calcWeight,
                      lengthCm: calcLength,
                      widthCm: calcWidth,
                      heightCm: calcHeight,
                      serviceType: calcService === 'CARGO' ? 'STANDARD' : calcService,
                      estimatedFee: quoteResult.totalFee,
                      timestamp: Date.now(),
                    };
                    try {
                      localStorage.setItem('nexus_draft_quote', JSON.stringify(draft));
                    } catch {}
                    navigate('/login?tab=register&redirect=/create');
                  }}
                  className="w-full bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>Lưu Báo Giá & Đăng Ký Tài Khoản Shop</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-6 bg-slate-50/80 border border-slate-200/90 p-6 sm:p-7 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                Cam Kết Biểu Phí Minh Bạch Chuẩn Bưu Chính
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 tracking-tight">
                Quy Chuẩn Cân Đo Thể Tích Hàng Không IATA
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                Áp dụng công thức tính trọng lượng tính cước tiêu chuẩn quốc tế giúp tối ưu chi phí cho shop:
              </p>
              <div className="mt-3 p-3.5 bg-white border border-blue-200 rounded-xl font-mono text-xs font-extrabold text-blue-800 text-center shadow-2xs">
                Khối lượng quy đổi (kg) = (Dài × Rộng × Cao cm) / 6000
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Phí thu hộ COD 0 đồng:</strong> Toàn bộ đơn hàng thu hộ tiền mặt đều được miễn phí thu hộ, đối soát T+1 tự động về tài khoản ngân hàng.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Bảo hiểm 100% khai giá:</strong> Cam kết hoàn tiền và đền bù tổn thất thực tế trong 24 giờ làm việc theo quy chuẩn bưu chính.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Miễn phí lấy hàng tận nơi:</strong> Bưu tá tiếp nhận đơn và đến lấy hàng tại shop sau 30 phút mà không thu phụ phí.
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs font-bold text-blue-800 shadow-2xs">
              👈 Nhập địa chỉ & thông số bưu kiện bên trái để nhận báo giá chi tiết tức thì!
            </div>
          </div>
        )}
      </section>

      {/* 5. J&T-STYLE BRAND COMMITMENTS & 4-STEP SHIPPING PROCESS */}
      <JtCommitmentsAndSteps />
      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-white p-6 shadow-2xl border-2 border-slate-900 rounded-2xl text-center space-y-4 relative">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Mã QR Tra Cứu Vận Đơn</h3>
              <p className="text-xs text-slate-500 font-mono">#{searchResult?.shipmentCode}</p>
            </div>
            {qrDataUrl && (
              <div className="mx-auto p-4 bg-white border border-slate-300 shadow-inner inline-block">
                <img src={qrDataUrl} alt="Mã QR tra cứu" className="w-48 h-48 mx-auto" />
              </div>
            )}
            <p className="text-[11px] text-slate-500">Quét bằng camera điện thoại để mở nhanh trên App hoặc Web.</p>
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full bg-slate-900 text-white py-2.5 font-bold text-xs uppercase"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / POD Proof Image Preview Modal */}
      {selectedPodImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-2xl w-full bg-white p-4 md:p-6 shadow-2xl border-2 border-slate-900 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Ảnh Minh Chứng Giao Hàng (POD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPodImage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Đóng xem ảnh"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[68vh] overflow-hidden bg-slate-950 flex items-center justify-center p-2 border border-slate-800">
              <img
                src={selectedPodImage}
                alt="Minh chứng POD phóng to"
                className="max-h-[64vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                Ảnh ký nhận POD được đồng bộ từ thiết bị bưu tá Nexus Delivery (MinIO).
              </span>
              <a
                href={selectedPodImage}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-bold text-xs flex items-center gap-1"
              >
                Mở trong tab mới <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. NATIONWIDE NETWORK DIRECTORY PAGE
// ==========================================
function NetworkDirectoryPage() {
  const [hubs, setHubs] = useState<HubRecord[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  useEffect(() => {
    masterdataApi.getHubs().then(setHubs).catch(() => {});
  }, []);

  const filteredHubs = useMemo(() => {
    return hubs.filter((h) => {
      const matchQuery =
        !filterQuery.trim() ||
        h.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        h.code.toLowerCase().includes(filterQuery.toLowerCase()) ||
        ((h.addressDetail || h.province) && (h.addressDetail || h.province).toLowerCase().includes(filterQuery.toLowerCase()));
      const matchZone =
        selectedZone === 'ALL' ||
        (selectedZone === 'NORTH' && (h.province.includes('Hà Nội') || h.province.includes('Hải Phòng') || h.province.includes('Quảng Ninh'))) ||
        (selectedZone === 'CENTRAL' && (h.province.includes('Đà Nẵng') || h.province.includes('Huế') || h.province.includes('Nghệ An'))) ||
        (selectedZone === 'SOUTH' && (h.province.includes('Hồ Chí Minh') || h.province.includes('Bình Dương') || h.province.includes('Đồng Nai') || h.province.includes('Cần Thơ')));
      return matchQuery && matchZone;
    });
  }, [hubs, filterQuery, selectedZone]);

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900">Mạng Lưới Bưu Cục & Điểm Giao Nhận Toàn Quốc</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Hệ thống {hubs.length || 34} bưu cục phục vụ nhận hàng, gửi hàng và hỗ trợ khách hàng trực tiếp.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Tìm theo tên bưu cục, mã kho, địa chỉ..."
            className="w-full border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
          />
        </div>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
        >
          <option value="ALL">Tất cả khu vực</option>
          <option value="NORTH">Miền Bắc (Hà Nội, Hải Phòng...)</option>
          <option value="CENTRAL">Miền Trung (Đà Nẵng, Huế...)</option>
          <option value="SOUTH">Miền Nam (TP.HCM, Bình Dương...)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHubs.map((hub) => (
          <div key={hub.id || hub.code} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-2.5 hover:border-blue-500 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {hub.code}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đang mở cửa
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">{hub.name}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                {hub.addressDetail ? `${hub.addressDetail}, ${hub.ward || ''}, ${hub.district || ''}, ${hub.province}` : hub.province || 'Trung tâm khai thác & bưu cục'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Giờ mở cửa: 07:00 - 21:00</span>
              <a href="tel:19000000" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                <Phone className="h-3 w-3" /> Gọi bưu cục
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. CREATE ORDER PAGE
// ==========================================
function CreateOrderPage() {
  const { phone, user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Khôi phục báo giá / bản nháp từ location.state hoặc localStorage nếu khách vừa từ trang đăng ký / tải lại trang
  const initialPrefill = useMemo(() => {
    if (location.state && (location.state as any).originProvince) {
      return location.state as any;
    }
    try {
      const rawDraftOrder = localStorage.getItem('nexus_draft_order');
      if (rawDraftOrder) {
        return JSON.parse(rawDraftOrder);
      }
      const rawDraftQuote = localStorage.getItem('nexus_draft_quote');
      if (rawDraftQuote) {
        return JSON.parse(rawDraftQuote);
      }
    } catch {}
    return null;
  }, [location.state]);

  const [prefill, setPrefill] = useState(initialPrefill);

  // Mode: Lấy hàng tại nhà vs Gửi hàng tại bưu cục
  const [pickupMethod, setPickupMethod] = useState<'PICKUP' | 'DROP_OFF'>(
    initialPrefill?.pickupMethod || 'PICKUP',
  );

  // Masterdata Hubs & Administrative Units
  const [allHubs, setAllHubs] = useState<HubRecord[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnitProvince[]>(VIETNAM_ADMINISTRATIVE_DATA);

  // Sender details
  const [senderName, setSenderName] = useState(
    initialPrefill?.senderName || user?.displayName || 'Chủ hàng',
  );
  const [senderPhoneInput, setSenderPhoneInput] = useState(
    initialPrefill?.senderPhone || phone || '',
  );
  const [senderAddress, setSenderAddress] = useState(initialPrefill?.senderAddress || '');
  const [senderProvince, setSenderProvince] = useState(
    initialPrefill?.originProvince || initialPrefill?.senderProvince || 'Thành phố Hồ Chí Minh',
  );
  const [senderWard, setSenderWard] = useState(initialPrefill?.senderWard || 'Phường Bến Nghé');
  const [senderDistrict, setSenderDistrict] = useState(initialPrefill?.senderDistrict || 'Quận 1');
  const [senderHubCode, setSenderHubCode] = useState(initialPrefill?.senderHubCode || 'HUB-HCM-001');

  // Saved Addresses State
  const [userSavedAddresses, setUserSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  useEffect(() => {
    const ident = phone || user?.id || user?.username;
    if (ident) {
      const list = getSavedAddresses(ident);
      setUserSavedAddresses(list);
      if (!initialPrefill) {
        const def = getDefaultAddress(ident);
        if (def) {
          setSenderName(def.name);
          setSenderPhoneInput(def.phone);
          setSenderAddress(def.addressDetail);
          setSenderProvince(def.province);
          if (def.ward) setSenderWard(def.ward);
          if (def.district) setSenderDistrict(def.district);
        }
      }
    }
  }, [phone, user, initialPrefill]);

  // Receiver details
  const [receiverName, setReceiverName] = useState(initialPrefill?.receiverName || '');
  const [receiverPhone, setReceiverPhone] = useState(initialPrefill?.receiverPhone || '');
  const [receiverAddress, setReceiverAddress] = useState(initialPrefill?.receiverAddress || '');
  const [receiverProvince, setReceiverProvince] = useState(
    initialPrefill?.destProvince || initialPrefill?.receiverProvince || 'Thành phố Hà Nội',
  );
  const [receiverWard, setReceiverWard] = useState(initialPrefill?.receiverWard || 'Phường Tràng Tiền');
  const [receiverDistrict, setReceiverDistrict] = useState(initialPrefill?.receiverDistrict || 'Quận Hoàn Kiếm');
  const [receiverHubCode, setReceiverHubCode] = useState(initialPrefill?.receiverHubCode || 'HUB-HN-001');

  // Cargo & Service details
  const [cargoName, setCargoName] = useState(initialPrefill?.cargoName || 'Kiện hàng mẫu');
  const [cargoWeight, setCargoWeight] = useState(
    initialPrefill?.weightKg !== undefined
      ? initialPrefill.weightKg
      : (initialPrefill?.cargoWeight !== undefined ? initialPrefill.cargoWeight : 1),
  );
  const [cargoLength, setCargoLength] = useState(
    initialPrefill?.lengthCm !== undefined
      ? initialPrefill.lengthCm
      : (initialPrefill?.cargoLength !== undefined ? initialPrefill.cargoLength : 20),
  );
  const [cargoWidth, setCargoWidth] = useState(
    initialPrefill?.widthCm !== undefined
      ? initialPrefill.widthCm
      : (initialPrefill?.cargoWidth !== undefined ? initialPrefill.cargoWidth : 15),
  );
  const [cargoHeight, setCargoHeight] = useState(
    initialPrefill?.heightCm !== undefined
      ? initialPrefill.heightCm
      : (initialPrefill?.cargoHeight !== undefined ? initialPrefill.cargoHeight : 10),
  );
  const [serviceType, setServiceType] = useState<'STANDARD' | 'EXPRESS'>(
    initialPrefill?.serviceType || 'STANDARD',
  );
  const [codAmount, setCodAmount] = useState(initialPrefill?.codAmount || 0);
  const [notes, setNotes] = useState(initialPrefill?.notes || '');

  // Chuẩn quốc tế IATA: Thể tích quy đổi = (D x R x C) / 6000
  const cargoVolumetricWeight = useMemo(() => {
    if (cargoLength > 0 && cargoWidth > 0 && cargoHeight > 0) {
      return Number(((cargoLength * cargoWidth * cargoHeight) / 6000).toFixed(2));
    }
    return 0;
  }, [cargoLength, cargoWidth, cargoHeight]);

  const cargoChargeableWeight = useMemo(() => {
    return Math.max(cargoWeight, cargoVolumetricWeight);
  }, [cargoWeight, cargoVolumetricWeight]);

  // Live fee state
  const [liveFee, setLiveFee] = useState(prefill?.estimatedFee || 22000);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Auth Modal for Guest Users
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authPhone, setAuthPhone] = useState(phone || '');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState(user?.displayName || '');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load hubs and administrative units on mount
  useEffect(() => {
    masterdataApi
      .getAdministrativeUnits()
      .then((units) => {
        if (Array.isArray(units) && units.length > 0) {
          const parsed = parseApiAdministrativeUnits(units);
          if (parsed.length > 0) setAdminUnits(parsed);
        }
      })
      .catch(() => {});

    masterdataApi
      .getHubs()
      .then((hubs) => {
        if (Array.isArray(hubs) && hubs.length > 0) {
          setAllHubs(hubs);
          const sMatching = findMatchingHubsForLocation(hubs, senderProvince);
          if (sMatching.length > 0) setSenderHubCode(sMatching[0].code);
          const rMatching = findMatchingHubsForLocation(hubs, receiverProvince);
          if (rMatching.length > 0) setReceiverHubCode(rMatching[0].code);
        }
      })
      .catch(() => {});
  }, []);

  const availableProvinces = useMemo(() => adminUnits.map((p) => p.name), [adminUnits]);

  // Wards list based on selected provinces
  const senderWards = useMemo(() => getWardsForProvince(senderProvince, adminUnits), [senderProvince, adminUnits]);
  const receiverWards = useMemo(() => getWardsForProvince(receiverProvince, adminUnits), [receiverProvince, adminUnits]);

  // Matching hubs for sender & receiver provinces
  const senderMatchingHubs = useMemo(
    () => findMatchingHubsForLocation(allHubs, senderProvince),
    [allHubs, senderProvince],
  );
  const receiverMatchingHubs = useMemo(
    () => findMatchingHubsForLocation(allHubs, receiverProvince),
    [allHubs, receiverProvince],
  );

  // Sync sender wards & hub when sender province changes
  useEffect(() => {
    if (senderWards.length > 0) {
      setSenderWard(senderWards[0].name);
      setSenderDistrict(senderWards[0].district || '');
    }
    if (senderMatchingHubs.length > 0) {
      setSenderHubCode(senderMatchingHubs[0].code);
    }
  }, [senderProvince, senderWards, senderMatchingHubs]);

  // Sync receiver wards & hub when receiver province changes
  useEffect(() => {
    if (receiverWards.length > 0) {
      setReceiverWard(receiverWards[0].name);
      setReceiverDistrict(receiverWards[0].district || '');
    }
    if (receiverMatchingHubs.length > 0) {
      setReceiverHubCode(receiverMatchingHubs[0].code);
    }
  }, [receiverProvince, receiverWards, receiverMatchingHubs]);

  // Real-time Pricing Engine calculation with debounce (includes weight + dimensions)
  useEffect(() => {
    let active = true;
    setIsCalculatingFee(true);

    const timer = setTimeout(() => {
      pricingApi
        .calculateQuote({
          serviceType,
          sender: { province: senderProvince, hubCode: senderHubCode },
          receiver: { province: receiverProvince, hubCode: receiverHubCode },
          package: {
            weightKg: cargoWeight,
            dimensionsCm: {
              length: cargoLength,
              width: cargoWidth,
              height: cargoHeight,
            },
          },
          codAmount: codAmount,
        })
        .then((res) => {
          if (active && res?.totalFee) {
            setLiveFee(res.totalFee);
          }
        })
        .catch(() => {
          const fallback = computeFallbackQuote({
            serviceType,
            senderProvince,
            receiverProvince,
            weightKg: cargoWeight,
            lengthCm: cargoLength,
            widthCm: cargoWidth,
            heightCm: cargoHeight,
            codAmount,
          });
          if (active) setLiveFee(fallback.totalFee);
        })
        .finally(() => {
          if (active) setIsCalculatingFee(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    senderProvince,
    senderHubCode,
    receiverProvince,
    receiverHubCode,
    cargoWeight,
    cargoLength,
    cargoWidth,
    cargoHeight,
    serviceType,
    codAmount,
  ]);

  // Auto-save form inputs to localStorage so guest users don't lose progress on reload/auth
  useEffect(() => {
    const draftData = {
      pickupMethod,
      senderName,
      senderPhone: senderPhoneInput,
      senderAddress,
      originProvince: senderProvince,
      senderProvince,
      senderDistrict,
      senderWard,
      senderHubCode,
      receiverName,
      receiverPhone,
      receiverAddress,
      destProvince: receiverProvince,
      receiverProvince,
      receiverDistrict,
      receiverWard,
      receiverHubCode,
      cargoName,
      cargoWeight,
      weightKg: cargoWeight,
      cargoLength,
      lengthCm: cargoLength,
      cargoWidth,
      widthCm: cargoWidth,
      cargoHeight,
      heightCm: cargoHeight,
      serviceType,
      codAmount,
      notes,
      estimatedFee: liveFee,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem('nexus_draft_order', JSON.stringify(draftData));
    } catch {}
  }, [
    pickupMethod,
    senderName,
    senderPhoneInput,
    senderAddress,
    senderProvince,
    senderDistrict,
    senderWard,
    senderHubCode,
    receiverName,
    receiverPhone,
    receiverAddress,
    receiverProvince,
    receiverDistrict,
    receiverWard,
    receiverHubCode,
    cargoName,
    cargoWeight,
    cargoLength,
    cargoWidth,
    cargoHeight,
    serviceType,
    codAmount,
    notes,
    liveFee,
  ]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem('nexus_draft_quote');
      localStorage.removeItem('nexus_draft_order');
    } catch {}
    setPrefill(null);
    setReceiverName('');
    setReceiverPhone('');
    setReceiverAddress('');
    setNotes('');
  };

  const doCreateOrder = async (authToken: string, senderPhoneToUse: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const selectedDropOffHub = allHubs.find((h) => h.code === senderHubCode);
      const fullSenderAddress =
        pickupMethod === 'DROP_OFF'
          ? (selectedDropOffHub
              ? `${selectedDropOffHub.name} - ${selectedDropOffHub.addressDetail || selectedDropOffHub.province}`
              : `Bưu cục ${senderHubCode}, ${senderWard}, ${senderProvince}`)
          : `${senderAddress.trim()}, ${senderWard}, ${senderProvince}`;

      const fullReceiverAddress = `${receiverAddress.trim()}, ${receiverWard}, ${receiverProvince}`;

      const res = await shipmentApi.createShipment(authToken, {
        sender: {
          name: senderName.trim(),
          phone: senderPhoneToUse,
          addressDetail:
            pickupMethod === 'DROP_OFF'
              ? (selectedDropOffHub?.addressDetail || selectedDropOffHub?.name || 'Gửi tại quầy bưu cục')
              : senderAddress.trim(),
          address: fullSenderAddress,
          province: senderProvince,
          district: senderDistrict,
          ward: senderWard,
          hubCode: senderHubCode,
        },
        receiver: {
          name: receiverName.trim(),
          phone: receiverPhone.trim(),
          addressDetail: receiverAddress.trim(),
          address: fullReceiverAddress,
          province: receiverProvince,
          district: receiverDistrict,
          ward: receiverWard,
          hubCode: receiverHubCode,
        },
        package: {
          itemName: cargoName.trim(),
          weightKg: cargoWeight,
          dimensionsCm: {
            length: cargoLength,
            width: cargoWidth,
            height: cargoHeight,
          },
          codAmount: codAmount,
        },
        pickupType: pickupMethod,
        service: {
          type: serviceType,
          pickupType: pickupMethod,
          fee: liveFee,
        },
        shippingFee: liveFee,
        codAmount: codAmount,
        notes: notes.trim(),
        deliveryNote: notes.trim(),
        originHubCode: senderHubCode,
        destinationHubCode: receiverHubCode,
        senderHubCode: senderHubCode,
        receiverHubCode: receiverHubCode,
        routing: {
          originHubCode: senderHubCode,
          destinationHubCode: receiverHubCode,
        },
      });

      // Clear draft quote and order upon successful creation
      try {
        localStorage.removeItem('nexus_draft_quote');
        localStorage.removeItem('nexus_draft_order');
      } catch {}
      setPrefill(null);

      setSuccessMsg(`Tạo vận đơn #${res.code} thành công! Đang chuyển đến danh sách đơn hàng...`);
      setTimeout(() => {
        navigate('/orders');
      }, 1200);
    } catch (err: any) {
      if (
        err?.message?.includes('Invalid or expired access token') ||
        err?.status === 401
      ) {
        useAuthStore.getState().logout();
        setErrorMsg('Phiên đăng nhập đã hết hạn. Vui lòng xác thực lại tài khoản.');
        setIsAuthModalOpen(true);
      } else {
        setErrorMsg(err?.message || 'Tạo vận đơn thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin người nhận (Tên, SĐT, Địa chỉ chi tiết).');
      return;
    }

    if (pickupMethod === 'PICKUP' && !senderAddress.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ lấy hàng tại nhà chi tiết (số nhà, tên đường).');
      return;
    }

    const effectivePhone = (phone || senderPhoneInput).trim();
    if (!effectivePhone) {
      setErrorMsg('Vui lòng nhập số điện thoại người gửi.');
      return;
    }

    // Nếu khách vãng lai chưa có token xác thực: Mở modal xác thực nhanh ngay tại chỗ
    if (!token) {
      setAuthPhone(effectivePhone);
      setAuthFullName(senderName.trim() || 'Khách hàng');
      setAuthError(null);
      setIsAuthModalOpen(true);
      return;
    }

    await doCreateOrder(token, effectivePhone);
  };

  const handleQuickAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone.trim()) {
      setAuthError('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!authPassword.trim()) {
      setAuthError('Vui lòng nhập mật khẩu.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authTab === 'register') {
        await authApi.register({
          username: authPhone.trim(),
          password: authPassword.trim(),
          displayName: authFullName.trim() || authPhone.trim(),
          phone: authPhone.trim(),
        });
      }

      const res = await authApi.login({
        username: authPhone.trim(),
        password: authPassword.trim(),
        roleGroup: 'CUSTOMER_APP',
      });

      const authToken = res.tokens?.accessToken || res.accessToken;
      if (!authToken) {
        throw new Error('Không nhận được token xác thực từ máy chủ.');
      }

      useAuthStore.getState().login(authPhone.trim(), authToken, {
        id: res.user.id,
        username: res.user.username,
        displayName: res.user.displayName || authFullName.trim() || authPhone.trim(),
        phone: res.user.phone || authPhone.trim(),
        roles: res.user.roles || ['CUSTOMER'],
      });

      setIsAuthModalOpen(false);
      // Tự động tạo đơn hàng ngay lập tức không làm mất dữ liệu!
      await doCreateOrder(authToken, authPhone.trim());
    } catch (err: any) {
      setAuthError(err?.message || 'Xác thực tài khoản thất bại. Vui lòng kiểm tra lại mật khẩu.');
    } finally {
      setAuthLoading(false);
    }
  };

  const currentSenderHub = allHubs.find((h) => h.code === senderHubCode);
  const currentReceiverHub = allHubs.find((h) => h.code === receiverHubCode);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo Đơn Hàng Vận Chuyển Mới</h1>
          <p className="text-xs text-slate-500 font-medium">
            Hỗ trợ tùy chọn lấy hàng tận nhà (Auto Dispatch bưu tá) hoặc gửi trực tiếp tại bưu cục.
          </p>
        </div>
        {phone ? (
          <div className="border border-emerald-300 bg-emerald-50/70 px-3.5 py-2 flex items-center gap-2.5 rounded-full shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <span className="block text-[10px] uppercase font-bold text-slate-500">Người gửi đã xác thực:</span>
              <span className="font-mono font-bold text-emerald-800 text-xs">{phone}</span>
            </div>
          </div>
        ) : (
          <div className="border border-blue-300 bg-blue-50/70 px-3.5 py-2 flex items-center gap-2.5 rounded-full shadow-xs">
            <User className="w-4 h-4 text-blue-600" />
            <div className="text-left">
              <span className="block text-[10px] uppercase font-bold text-blue-800">Chế độ Khách Vãng Lai</span>
              <span className="text-[11px] font-medium text-slate-600">Điền đơn và xác thực nhanh khi tạo</span>
            </div>
          </div>
        )}
      </div>

      {prefill && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Đã tự động khôi phục thông tin từ <b>Báo giá ước tính</b> (
              {(prefill.originProvince || prefill.senderProvince)} → {(prefill.destProvince || prefill.receiverProvince)}, {prefill.weightKg || prefill.cargoWeight}kg
              {prefill.lengthCm || prefill.cargoLength ? `, ${prefill.lengthCm || prefill.cargoLength}×${prefill.widthCm || prefill.cargoWidth}×${prefill.heightCm || prefill.cargoHeight}cm` : ''}).
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <span className="font-mono font-extrabold text-blue-700">{formatVnd(prefill.estimatedFee || liveFee)}</span>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-[11px] font-semibold text-slate-500 hover:text-red-600 underline transition"
            >
              Xóa dữ liệu nháp
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* HÌNH THỨC GỬI HÀNG (PICKUP vs DROP_OFF) */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            Hình Thức Gửi Hàng
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {pickupMethod === 'PICKUP' ? 'Điều phối Shipper đến lấy' : 'Gửi tại quầy bưu cục'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <button
            type="button"
            onClick={() => setPickupMethod('PICKUP')}
            className={`flex items-start gap-3.5 p-4 border rounded-xl text-left transition-all ${
              pickupMethod === 'PICKUP'
                ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                pickupMethod === 'PICKUP' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Truck className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                Lấy hàng tại địa chỉ gửi (Pickup)
                {pickupMethod === 'PICKUP' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Bưu tá Nexus sẽ đến tận nơi theo địa chỉ lấy hàng của bạn. Hệ thống tự động phân tuyến theo Phường/Xã.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPickupMethod('DROP_OFF')}
            className={`flex items-start gap-3.5 p-4 border rounded-xl text-left transition-all ${
              pickupMethod === 'DROP_OFF'
                ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                pickupMethod === 'DROP_OFF' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                Gửi hàng tại bưu cục (Drop-off)
                {pickupMethod === 'DROP_OFF' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Bạn chủ động mang hàng ra điểm bưu cục / bưu cục khai thác Nexus gần nhất để làm thủ tục gửi.
              </p>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleCreateOrder} className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-7 space-y-5">
          {/* THÔNG TIN NGƯỜI GỬI */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700">
                <MapPin className="h-4 w-4 text-blue-600" />
                Thông Tin Người Gửi
              </div>
              <div className="flex items-center gap-2">
                {userSavedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker((prev) => !prev)}
                    className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Sổ địa chỉ ({userSavedAddresses.length})</span>
                  </button>
                )}
                {currentSenderHub && (
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Hub gửi: {currentSenderHub.code}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Address Picker Dropdown */}
            {showAddressPicker && userSavedAddresses.length > 0 && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-200/60 pb-1.5">
                  <span>Chọn địa chỉ gửi đã lưu:</span>
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {userSavedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSenderName(addr.name);
                        setSenderPhoneInput(addr.phone);
                        setSenderAddress(addr.addressDetail);
                        setSenderProvince(addr.province);
                        if (addr.ward) setSenderWard(addr.ward);
                        if (addr.district) setSenderDistrict(addr.district);
                        setShowAddressPicker(false);
                      }}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-800">{addr.name}</strong>
                          <span className="text-slate-400 font-mono">({addr.phone})</span>
                          {addr.isDefault && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-extrabold">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] truncate max-w-sm mt-0.5">{addr.composedAddress}</p>
                      </div>
                      <span className="text-blue-600 text-[11px] font-bold shrink-0">Chọn</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tên người gửi *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Số điện thoại gửi *</label>
                  {phone ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Đã xác thực
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Liên hệ bưu tá
                    </span>
                  )}
                </div>
                {phone ? (
                  <input
                    type="tel"
                    className="mt-1 w-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg cursor-not-allowed"
                    value={phone}
                    disabled
                  />
                ) : (
                  <input
                    type="tel"
                    required
                    className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                    placeholder="09xx xxx xxx"
                    value={senderPhoneInput}
                    onChange={(e) => setSenderPhoneInput(e.target.value)}
                  />
                )}
              </div>

              {/* TỈNH / THÀNH PHỐ GỬI */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tỉnh / Thành gửi *</label>
                <select
                  className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  value={senderProvince}
                  onChange={(e) => setSenderProvince(e.target.value)}
                >
                  {availableProvinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* PHƯỜNG / XÃ GỬI (ĐỒNG BỘ AUTO ĐIỀU PHỐI) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Phường / Xã gửi (Tuyến bưu tá) *
                </label>
                <select
                  className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  value={senderWard}
                  onChange={(e) => {
                    const found = senderWards.find((w) => w.name === e.target.value);
                    setSenderWard(e.target.value);
                    if (found?.district) setSenderDistrict(found.district);
                  }}
                >
                  {senderWards.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* ĐIỀU KIỆN THEO HÌNH THỨC GỬI */}
              {pickupMethod === 'DROP_OFF' ? (
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-blue-700 uppercase">
                    Chọn bưu cục Nexus tiếp nhận gửi hàng *
                  </label>
                  <select
                    className="mt-1 w-full border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-bold text-blue-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                    value={senderHubCode}
                    onChange={(e) => setSenderHubCode(e.target.value)}
                  >
                    {senderMatchingHubs.length > 0 ? (
                      senderMatchingHubs.map((h) => (
                        <option key={h.code} value={h.code}>
                          {h.name} [{h.code}] - {h.addressDetail || h.province}
                        </option>
                      ))
                    ) : (
                      allHubs.map((h) => (
                        <option key={h.code} value={h.code}>
                          {h.name} [{h.code}] - {h.province}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500 font-medium">
                    Quý khách vui lòng mang hàng hóa ra điểm bưu cục đã chọn trong giờ làm việc.
                  </p>
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Địa chỉ lấy hàng chi tiết (Số nhà, ngõ, tên đường) *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                    placeholder="Ví dụ: 123 Nguyễn Văn Cừ, Tòa nhà Bitexco..."
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                  />
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Tự động gán bưu tá lấy hàng phụ trách khu vực <b>{senderWard}</b> thuộc bưu cục{' '}
                      <b>{senderHubCode}</b>.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* THÔNG TIN NGƯỜI NHẬN */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700">
                <User className="h-4 w-4 text-blue-600" />
                Thông Tin Người Nhận
              </div>
              {currentReceiverHub && (
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Hub nhận: {currentReceiverHub.code}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tên người nhận *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  placeholder="Nhập họ tên người nhận..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Số điện thoại nhận *</label>
                <input
                  type="tel"
                  required
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  placeholder="09xx xxx xxx"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                />
              </div>

              {/* TỈNH / THÀNH PHỐ NHẬN */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tỉnh / Thành nhận *</label>
                <select
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  value={receiverProvince}
                  onChange={(e) => setReceiverProvince(e.target.value)}
                >
                  {availableProvinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* PHƯỜNG / XÃ NHẬN (ĐỒNG BỘ AUTO ĐIỀU PHỐI GIAO) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Phường / Xã nhận (Tuyến bưu tá) *
                </label>
                <select
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  value={receiverWard}
                  onChange={(e) => {
                    const found = receiverWards.find((w) => w.name === e.target.value);
                    setReceiverWard(e.target.value);
                    if (found?.district) setReceiverDistrict(found.district);
                  }}
                >
                  {receiverWards.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Địa chỉ giao hàng chi tiết (Số nhà, ngõ, tên đường) *
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  placeholder="Ví dụ: Số 45 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm..."
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN KIỆN HÀNG, DỊCH VỤ, CƯỚC PHÍ */}
        <div className="md:col-span-5 space-y-5">
          <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700 border-b border-slate-100 pb-2.5">
              <Package className="h-4 w-4 text-blue-600" />
              Thông Tin Kiện Hàng & Dịch Vụ
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tên hàng hóa *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  value={cargoName}
                  onChange={(e) => setCargoName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Khối lượng (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(parseFloat(e.target.value) || 0.1)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Gói dịch vụ</label>
                  <select
                    className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                  >
                    <option value="STANDARD">Tiêu Chuẩn (24 - 48h)</option>
                    <option value="EXPRESS">Hỏa Tốc (2 - 6h)</option>
                  </select>
                </div>
              </div>

              {/* KÍCH THƯỚC DÀI X RỘNG X CAO (CM) & CÔNG THỨC IATA */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Kích thước kiện hàng (Dài × Rộng × Cao cm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="Dài"
                      className="w-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 text-center"
                      value={cargoLength || ''}
                      onChange={(e) => setCargoLength(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">cm</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="Rộng"
                      className="w-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 text-center"
                      value={cargoWidth || ''}
                      onChange={(e) => setCargoWidth(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">cm</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cao"
                      className="w-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 text-center"
                      value={cargoHeight || ''}
                      onChange={(e) => setCargoHeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400">cm</span>
                  </div>
                </div>

                {/* THÔNG BÁO QUY ĐỔI THỂ TÍCH IATA */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Quy đổi thể tích IATA: <code>(D×R×C)/6000</code></span>
                    <span className="font-mono font-bold text-slate-900">{cargoVolumetricWeight} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-bold">
                    <span>Trọng lượng tính cước (Chargeable):</span>
                    <span className="font-mono text-blue-700">{cargoChargeableWeight} kg</span>
                  </div>
                  {cargoVolumetricWeight > cargoWeight ? (
                    <p className="text-[10px] text-amber-700 font-medium">
                      ⚠️ Kiện hàng cồng kềnh, tính cước theo thể tích quy đổi ({cargoVolumetricWeight} kg &gt; {cargoWeight} kg).
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-700 font-medium">
                      ✓ Kiện hàng gọn, tính cước theo cân nặng thực tế ({cargoWeight} kg).
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tiền Thu Hộ COD (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-blue-700 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  value={codAmount}
                  onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Ghi chú giao hàng</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  placeholder="Cho xem hàng, giao giờ hành chính..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* BẢNG TỔNG CƯỚC TÍNH TOÁN */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Cước vận chuyển ({serviceType === 'EXPRESS' ? 'Hỏa Tốc' : 'Tiêu Chuẩn'}):</span>
                <span className="font-bold font-mono text-slate-900">
                  {isCalculatingFee ? 'Đang tính...' : formatVnd(liveFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Tiền thu hộ COD:</span>
                <span className="font-bold font-mono text-slate-900">{formatVnd(codAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 text-xs font-extrabold text-blue-800">
                <span>TỔNG CƯỚC ƯỚC TÍNH:</span>
                <span className="text-base font-black font-mono text-blue-700">
                  {isCalculatingFee ? 'Đang tính...' : formatVnd(liveFee)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-blue-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang gửi thông tin...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Xác Nhận Tạo Đơn Hàng
              </>
            )}
          </button>

          {!phone && (
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              💡 Khách vãng lai có thể điền đơn ngay. Khi bấm <b>Xác Nhận</b>, hệ thống sẽ xác thực số điện thoại người gửi để bưu tá liên hệ lấy hàng và đảm bảo quyền lợi đối soát COD.
            </p>
          )}
        </div>
      </form>

      {/* QUICK SENDER AUTH MODAL FOR GUESTS */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Xác Thực Người Gửi Bưu Kiện</h3>
                  <p className="text-[11px] text-slate-500">Bảo mật vận đơn & Điều phối lấy hàng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-blue-50/70 p-3.5 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              Theo <b>Luật Bưu chính</b> và bảo đảm tài chính thu hộ COD, mọi đơn hàng phải gắn với số điện thoại xác thực của người gửi để shipper hẹn giờ lấy hàng và tra soát hành trình.
            </div>

            {/* TAB SELECTOR: Đăng nhập vs Đăng ký */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  authTab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đăng Nhập Nhanh
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  authTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tạo Tài Khoản Mới
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleQuickAuthSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase">Số điện thoại người gửi</label>
                <input
                  type="tel"
                  required
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                />
              </div>

              {authTab === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Họ và tên người gửi</label>
                  <input
                    type="text"
                    required
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  {authTab === 'login' ? 'Mật khẩu' : 'Tạo mật khẩu cho tài khoản'}
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-600 rounded-lg transition"
                >
                  Quay Lại Sửa Đơn
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {authTab === 'login' ? 'Xác Thực & Tạo Đơn' : 'Đăng Ký & Tạo Đơn'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. HISTORY / SHIPMENT MANAGEMENT PAGE
// ==========================================
function HistoryPage() {
  const { phone, token, user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'SENT' | 'RECEIVED'>('SENT');
  const [sentOrders, setSentOrders] = useState<ShipmentResponse[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<ShipmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedOrderForModal, setSelectedOrderForModal] = useState<ShipmentResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadShipments = async (showLoading = true) => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (showLoading) setIsLoading(true);
    try {
      const [sentRes, recRes] = await Promise.allSettled([
        shipmentApi.getShipments(token, { limit: 100, userId: user?.id }),
        shipmentApi.getReceivedShipments(token, { limit: 100, phone: phone || user?.phone }),
      ]);
      if (sentRes.status === 'fulfilled') {
        setSentOrders(sentRes.value || []);
      }
      if (recRes.status === 'fulfilled') {
        setReceivedOrders(recRes.value || []);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadShipments(true);
  }, [token, phone]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadShipments(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // If user is not logged in, enforce login screen
  if (!token || !phone) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-lg items-center justify-center px-4 py-8">
        <div className="w-full bg-white p-8 text-center border border-slate-200 rounded-2xl shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl shadow-inner">
            <Lock className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Lịch Sử & Quản Lý Đơn Hàng</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
              Vui lòng đăng nhập hoặc đăng ký tài khoản để xem toàn bộ danh sách đơn bạn đã gửi và các kiện hàng đang được giao đến số điện thoại của bạn.
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-100 rounded-xl text-left text-xs space-y-2 text-blue-900 font-medium">
            <div className="flex items-center gap-2 font-bold text-blue-800">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Đặc quyền tài khoản Nexus:</span>
            </div>
            <p className="pl-6 text-[11px] text-blue-700 leading-relaxed">
              • Quản lý 2 chiều: <strong className="font-bold">Đơn gửi</strong> (do bạn tạo) và <strong className="font-bold">Đơn nhận</strong> (gửi tới SĐT của bạn).
            </p>
            <p className="pl-6 text-[11px] text-blue-700 leading-relaxed">
              • Bộ lọc trực quan theo trạng thái (Chờ lấy, Đang giao, Thành công, Hoàn).
            </p>
            <p className="pl-6 text-[11px] text-blue-700 leading-relaxed">
              • Xem ảnh chữ ký / ảnh chụp POD bưu tá giao hàng từ MinIO và tra cứu tọa độ GPS.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg shadow-md shadow-blue-600/25 transition"
          >
            Đăng Nhập / Đăng Ký Ngay
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'SENT' ? sentOrders : receivedOrders;

  // Compute 4 KPI stats for the active category
  const stats = {
    total: currentList.length,
    inTransit: currentList.filter((s) => {
      const st = (s.currentStatus || '').toUpperCase();
      return (
        st === 'IN_TRANSIT' ||
        st === 'SCAN_INBOUND' ||
        st === 'SCAN_OUTBOUND' ||
        st === 'SORTED' ||
        st === 'DELIVERING' ||
        st === 'OUT_FOR_DELIVERY' ||
        st === 'PICKED_UP' ||
        st === 'PICKUP_COMPLETED' ||
        st === 'ARRIVED_DEST_HUB'
      );
    }).length,
    delivered: currentList.filter((s) => {
      const st = (s.currentStatus || '').toUpperCase();
      return st === 'DELIVERED' || st === 'COMPLETED';
    }).length,
    issues: currentList.filter((s) => {
      const st = (s.currentStatus || '').toUpperCase();
      return (
        st === 'DELIVERY_FAILED' ||
        st === 'NDR_CREATED' ||
        st === 'CANCELLED' ||
        st === 'RETURN_STARTED' ||
        st === 'RETURN_COMPLETED' ||
        st === 'RETURNED' ||
        st === 'RETURNING'
      );
    }).length,
  };

  // Filter logic
  const filteredShipments = currentList.filter((s) => {
    // 1. Status Filter
    if (statusFilter !== 'ALL') {
      const st = (s.currentStatus || '').toUpperCase();
      if (
        statusFilter === 'CREATED' &&
        !['CREATED', 'UPDATED', 'TASK_ASSIGNED', 'PICKUP_REQUESTED', 'PICKUP_ASSIGNED'].includes(st)
      )
        return false;
      if (
        statusFilter === 'PICKED_UP' &&
        !['PICKED_UP', 'PICKUP_COMPLETED', 'SCAN_PICKUP', 'ARRIVED_ORIGIN_HUB'].includes(st)
      )
        return false;
      if (
        statusFilter === 'IN_TRANSIT' &&
        !['IN_TRANSIT', 'SCAN_INBOUND', 'SCAN_OUTBOUND', 'SORTED', 'ARRIVED_HUB', 'ARRIVED_DEST_HUB'].includes(st)
      )
        return false;
      if (
        statusFilter === 'DELIVERING' &&
        !['DELIVERING', 'OUT_FOR_DELIVERY', 'READY_FOR_DELIVERY'].includes(st)
      )
        return false;
      if (statusFilter === 'DELIVERED' && !['DELIVERED', 'COMPLETED'].includes(st)) return false;
      if (statusFilter === 'DELIVERY_FAILED' && !['DELIVERY_FAILED', 'NDR_CREATED'].includes(st))
        return false;
      if (
        statusFilter === 'RETURNED' &&
        !['RETURNED', 'RETURN_STARTED', 'RETURN_COMPLETED', 'RETURNING'].includes(st)
      )
        return false;
    }

    // 2. Time Filter
    if (timeFilter !== 'ALL' && s.createdAt) {
      const createdTime = new Date(s.createdAt).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (timeFilter === 'TODAY' && now - createdTime > oneDay) return false;
      if (timeFilter === '7DAYS' && now - createdTime > 7 * oneDay) return false;
      if (timeFilter === '30DAYS' && now - createdTime > 30 * oneDay) return false;
      if (timeFilter === 'THIS_MONTH') {
        const cDate = new Date(s.createdAt);
        const nowDate = new Date();
        if (cDate.getMonth() !== nowDate.getMonth() || cDate.getFullYear() !== nowDate.getFullYear()) {
          return false;
        }
      }
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const code = (s.code || '').toLowerCase();
      const sName = (s.metadata?.sender?.name || '').toLowerCase();
      const rName = (s.metadata?.receiver?.name || '').toLowerCase();
      const rPhone = (s.metadata?.receiver?.phone || '').toLowerCase();
      const sPhone = (s.metadata?.sender?.phone || '').toLowerCase();
      const addr = (
        s.metadata?.receiver?.address ||
        s.metadata?.receiver?.addressDetail ||
        s.metadata?.receiver?.province ||
        ''
      ).toLowerCase();
      const item = (s.metadata?.package?.itemName || '').toLowerCase();
      const matches =
        code.includes(q) ||
        sName.includes(q) ||
        rName.includes(q) ||
        rPhone.includes(q) ||
        sPhone.includes(q) ||
        addr.includes(q) ||
        item.includes(q);
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & REFRESH ACTION */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Lịch Sử & Quản Lý Đơn Hàng
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
              <User className="h-3 w-3" />
              {phone}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi, tra cứu chi tiết hành trình và quản lý danh sách đơn gửi / đơn nhận của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Tạo Vận Đơn</span>
          </button>
        </div>
      </div>

      {/* 2. KPI QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Tổng Đơn {activeTab === 'SENT' ? 'Gửi' : 'Nhận'}</span>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{stats.total}</p>
          <p className="text-[10px] text-slate-400 font-medium">Tất cả thời gian</p>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-600 font-bold">
            <span>Đang Giao / Vận Chuyển</span>
            <Truck className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 font-mono">{stats.inTransit}</p>
          <p className="text-[10px] text-indigo-500 font-medium">Bưu tá & Trung chuyển</p>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
            <span>Giao Thành Công</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">{stats.delivered}</p>
          <p className="text-[10px] text-emerald-500 font-medium">Đã ký nhận POD</p>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-600 font-bold">
            <span>Sự Cố / NDR / Hoàn</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono">{stats.issues}</p>
          <p className="text-[10px] text-amber-500 font-medium">Cần xử lý & Hoàn</p>
        </div>
      </div>

      {/* 3. DUAL CATEGORY TABS (SENT vs RECEIVED) */}
      <div className="bg-slate-100 p-1 flex gap-1 border border-slate-200/80 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('SENT')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-extrabold rounded-lg transition-all duration-200 ${
            activeTab === 'SENT'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Đơn Đã Gửi</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
              activeTab === 'SENT'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {sentOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RECEIVED')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-extrabold rounded-lg transition-all duration-200 ${
            activeTab === 'RECEIVED'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Đơn Nhận Hàng</span>
          <span
            className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
              activeTab === 'RECEIVED'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {receivedOrders.length}
          </span>
        </button>
      </div>

      {/* 4. FILTER TOOLBAR: SEARCH + STATUS + TIME */}
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã vận đơn, tên người nhận, SĐT, địa chỉ..."
            className="w-full border border-slate-200 bg-slate-50 pl-10 pr-10 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Status Dropdown */}
          <div className="relative flex-1 md:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CREATED">Chờ lấy hàng (CREATED)</option>
              <option value="PICKED_UP">Đã lấy hàng (PICKED_UP)</option>
              <option value="IN_TRANSIT">Đang trung chuyển (IN_TRANSIT)</option>
              <option value="DELIVERING">Đang giao hàng (DELIVERING)</option>
              <option value="DELIVERED">Giao thành công (DELIVERED)</option>
              <option value="DELIVERY_FAILED">Sự cố giao hàng (NDR)</option>
              <option value="RETURNED">Đang chuyển hoàn (RETURNED)</option>
            </select>
          </div>

          {/* Time Dropdown */}
          <div className="relative flex-1 md:w-44">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 rounded-lg outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="TODAY">Hôm nay</option>
              <option value="7DAYS">7 ngày qua</option>
              <option value="30DAYS">30 ngày qua</option>
              <option value="THIS_MONTH">Tháng này</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. ORDERS LIST / GRID */}
      {isLoading ? (
        <div className="p-16 bg-white border border-slate-200 rounded-xl text-center space-y-3">
          <RefreshCw className="h-7 w-7 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Đang đồng bộ danh sách vận đơn từ máy chủ Nexus...</p>
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="p-16 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-sm">
          <div className="mx-auto w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
            <Package className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-slate-800">
              {activeTab === 'SENT' ? 'Không có đơn gửi nào phù hợp.' : 'Chưa có đơn hàng nào gửi tới bạn.'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              {searchQuery || statusFilter !== 'ALL' || timeFilter !== 'ALL'
                ? 'Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.'
                : activeTab === 'SENT'
                ? 'Tạo đơn bưu gửi đầu tiên để trải nghiệm dịch vụ giao hàng thông minh Nexus.'
                : 'Khi shop gửi hàng với số điện thoại của bạn, đơn sẽ tự động xuất hiện tại đây.'}
            </p>
          </div>
          {activeTab === 'SENT' && (
            <button
              onClick={() => navigate('/create')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md shadow-blue-600/20 transition inline-flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Tạo Vận Đơn Ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShipments.map((s) => {
            const badge = getStatusBadgeDetails(s.currentStatus);
            const meta = s.metadata || {};
            const sender = meta.sender || {};
            const receiver = meta.receiver || {};
            const pkg = meta.package || {};

            const weight = pkg.weightKg || meta.weightKg || 1;
            const cod = meta.codAmount || pkg.codAmount || 0;
            const shippingFee = meta.shippingFee || meta.estimatedFee || 22000;

            const senderAddr = sender.province || sender.address || sender.addressDetail || 'Bưu cục gửi';
            const receiverAddr = receiver.address || receiver.addressDetail || receiver.province || 'Địa chỉ nhận';

            return (
              <div
                key={s.id || s.code}
                className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-3.5 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Top Row: Code, Category badge, Status badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                        #{s.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(s.code)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                        title="Sao chép mã"
                      >
                        {copiedCode === s.code ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          activeTab === 'SENT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {activeTab === 'SENT' ? 'Đơn gửi' : 'Đơn nhận'}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${badge.bg}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Route: Sender -> Receiver */}
                  <div className="bg-slate-50/80 p-2.5 border border-slate-100 rounded-lg text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Từ:</span>
                        <span className="font-bold text-slate-800">{sender.name || 'Người gửi'}</span>
                        <span className="text-slate-500 text-[11px] ml-1">({senderAddr})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Đến:</span>
                        <span className="font-bold text-slate-800">{receiver.name || 'Người nhận'}</span>
                        <span className="text-slate-500 text-[11px] ml-1">({receiverAddr})</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Chips: Weight, COD, Shipping Fee */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Khối lượng</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{weight} kg</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Tiền Thu Hộ</span>
                      <span className="font-bold text-blue-700 font-mono text-[11px]">{formatVnd(cod)}</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Cước Phí</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{formatVnd(shippingFee)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : ''}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForModal(s)}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 transition"
                    >
                      <Eye className="h-3 w-3" /> Chi tiết
                    </button>
                    <RouterLink
                      to={`/?track=${encodeURIComponent(s.code)}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm transition"
                    >
                      Hành trình <ChevronRight className="h-3 w-3" />
                    </RouterLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. ORDER DETAIL MODAL */}
      {selectedOrderForModal && (
        <OrderDetailModal
          shipment={selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
          onTrack={(code) => {
            setSelectedOrderForModal(null);
            navigate(`/?track=${encodeURIComponent(code)}`);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// ORDER DETAIL MODAL (FULL SPECS VIEW)
// ==========================================
function OrderDetailModal({
  shipment,
  onClose,
  onTrack,
}: {
  shipment: ShipmentResponse;
  onClose: () => void;
  onTrack: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const meta = shipment.metadata || {};
  const sender = meta.sender || {};
  const receiver = meta.receiver || {};
  const pkg = meta.package || {};
  const badge = getStatusBadgeDetails(shipment.currentStatus);

  const qrDataUrl = useMemo(() => {
    return generateQrDataUrl(`${window.location.origin}/?track=${encodeURIComponent(shipment.code)}`);
  }, [shipment.code]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shipment.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-xl w-full bg-white p-6 shadow-2xl border border-slate-200 rounded-2xl my-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Chi Tiết Vận Đơn Nexus
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${badge.bg}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl font-black text-blue-950 font-mono tracking-tight">
                #{shipment.code}
              </h2>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                title="Sao chép mã đơn"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sender & Receiver Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-blue-800 font-extrabold uppercase text-[10px]">
              <Send className="h-3 w-3" />
              <span>Người Gửi</span>
            </div>
            <p className="font-extrabold text-slate-900">{sender.name || 'Chủ hàng'}</p>
            {sender.phone && <p className="text-slate-600 font-mono text-[11px]">{sender.phone}</p>}
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {sender.address || sender.addressDetail || sender.province || 'Bưu cục gửi'}
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold uppercase text-[10px]">
              <Inbox className="h-3 w-3" />
              <span>Người Nhận</span>
            </div>
            <p className="font-extrabold text-slate-900">{receiver.name || 'Khách hàng nhận'}</p>
            {receiver.phone && <p className="text-slate-600 font-mono text-[11px]">{receiver.phone}</p>}
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {receiver.address || receiver.addressDetail || receiver.province || 'Địa chỉ giao hàng'}
            </p>
          </div>
        </div>

        {/* Package Specs & Financials */}
        <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-xl space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-extrabold uppercase text-slate-700 text-[11px]">
            <Package className="h-3.5 w-3.5 text-blue-600" />
            <span>Quy Cách Kiện Hàng & Cước Phí</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Tên hàng hóa</span>
              <span className="font-extrabold text-slate-900 text-xs">{pkg.itemName || 'Hàng hóa bưu gửi'}</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Khối lượng</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs">{pkg.weightKg || 1} kg</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Dịch vụ</span>
              <span className="font-extrabold text-blue-700 text-xs">{meta.service?.type || 'TIÊU CHUẨN'}</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Tiền Thu Hộ (COD)</span>
              <span className="font-extrabold text-blue-700 font-mono text-xs">
                {formatVnd(meta.codAmount || pkg.codAmount || 0)}
              </span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Cước Vận Chuyển</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs">
                {formatVnd(meta.shippingFee || meta.estimatedFee || 22000)}
              </span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Khai Giá Hàng</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs">
                {formatVnd(pkg.declaredValue || 0)}
              </span>
            </div>
          </div>

          {meta.notes && (
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Ghi chú giao hàng:</span>
              <p className="text-slate-700 text-xs mt-0.5">{meta.notes}</p>
            </div>
          )}
        </div>

        {/* QR Code Quick Scan */}
        {qrDataUrl && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <img src={qrDataUrl} alt="Mã QR tra cứu" className="w-16 h-16 border rounded-lg bg-white p-1 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-900">Mã QR Tra Cứu Tức Thì</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quét bằng camera điện thoại để mở trực tiếp hành trình đơn hàng trên Nexus Mobile/Web.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => onTrack(shipment.code)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-md shadow-blue-600/25 transition flex items-center gap-1.5"
          >
            Theo Dõi Hành Trình <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN ROUTER CONFIGURATION
// ==========================================
const TRACKING_ACTIVE_ROUTE_KEY = 'nexus_tracking_active_route';
const isTestEnv = Boolean(import.meta.env.TEST || import.meta.env.MODE === 'test');

function resolveInitialTrackingRoute(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  if (isTestEnv) {
    const testPath = window.location.pathname;
    if (testPath && testPath !== '/') {
      return testPath + window.location.search;
    }
    return '/';
  }
  try {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    // Direct tracking link / deep link entered by user or scanned QR code
    if (currentPath.startsWith('/track/') || currentSearch.includes('track=') || currentSearch.includes('code=')) {
      return currentPath + currentSearch;
    }

    // Direct sub-page entered initially (e.g. /create, /orders, /network, /login, /terms)
    if (currentPath !== '/' && currentPath !== '') {
      return currentPath + currentSearch;
    }

    // Restore from session storage if returning or refreshing
    const saved = sessionStorage.getItem(TRACKING_ACTIVE_ROUTE_KEY);
    if (saved && saved.startsWith('/')) {
      return saved;
    }

    return '/' + currentSearch;
  } catch {
    return '/';
  }
}

function TrackingRoutePersistenceSync(): null {
  const location = useLocation();

  useEffect(() => {
    if (isTestEnv || typeof window === 'undefined') {
      return;
    }

    // Save active route (path + search)
    try {
      sessionStorage.setItem(TRACKING_ACTIVE_ROUTE_KEY, location.pathname + location.search);
    } catch {}

    // Mask browser address bar so it never exposes /create, /orders, /network, etc.
    // Address bar stays clean at '/' just like Merchant Web
    if (window.location.pathname !== '/' || (window.location.search && !location.search)) {
      try {
        window.history.replaceState(null, '', '/');
      } catch {}
    }
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  const initialRoute = useMemo(() => resolveInitialTrackingRoute(), []);

  const routesContent = (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<TrackingPage />} />
        <Route path="track/:code" element={<TrackingPage />} />
        <Route path="create" element={<CreateOrderPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="history" element={<OrdersPage />} />
        <Route path="network" element={<NetworkDirectoryPage />} />
        <Route path="terms-of-service" element={<TermsOfServicePage />} />
        <Route path="terms" element={<TermsOfServicePage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
    </Routes>
  );

  if (isTestEnv) {
    return <BrowserRouter>{routesContent}</BrowserRouter>;
  }

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <TrackingRoutePersistenceSync />
      {routesContent}
    </MemoryRouter>
  );
}
