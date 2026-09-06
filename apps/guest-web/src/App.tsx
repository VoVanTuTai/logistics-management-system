import React, { useState, useEffect, useMemo } from 'react';
import {
  BrowserRouter,
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
} from 'lucide-react';
import qrcode from 'qrcode-generator';

import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';
import {
  trackingApi,
  type UnifiedTrackingResponse,
  type TimelineEventResponse,
} from './services/api/tracking.api';
import { pricingApi, type PricingQuoteResponse } from './services/api/pricing.api';
import { shipmentApi, type ShipmentResponse } from './services/api/shipment.api';
import { masterdataApi, type HubRecord } from './services/api/masterdata.api';
import {
  normalizeMediaPublicUrl,
  cleanCustomerNote,
  formatVnd,
} from './utils/trackingUtils';
import {
  getWardsForProvince,
  findMatchingHubsForLocation,
  type AdminUnitWard,
} from './utils/vietnamAdministrativeData';

const navItems = [
  { to: '/', icon: Search, label: 'Tra cứu & Cước phí' },
  { to: '/create', icon: PlusCircle, label: 'Tạo vận đơn' },
  { to: '/history', icon: Clock, label: 'Lịch sử đơn hàng' },
  { to: '/network', icon: Building2, label: 'Mạng lưới bưu cục' },
];

const PROVINCES = [
  'Thành phố Hồ Chí Minh',
  'Thành phố Hà Nội',
  'Thành phố Đà Nẵng',
  'Tỉnh Bình Dương',
  'Tỉnh Đồng Nai',
  'Thành phố Cần Thơ',
  'Thành phố Hải Phòng',
  'Tỉnh Quảng Ninh',
  'Tỉnh Thừa Thiên Huế',
  'Tỉnh Khánh Hòa',
  'Tỉnh Nghệ An',
  'Tỉnh Lâm Đồng',
];

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

function getMilestoneIndex(status?: string | null): number {
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 4;
  if (s === 'DELIVERING' || s === 'OUT_FOR_DELIVERY' || s === 'TASK_ASSIGNED' || s === 'RESCHEDULED') return 3;
  if (s === 'IN_TRANSIT' || s === 'SCAN_INBOUND' || s === 'SCAN_OUTBOUND' || s === 'SORTED' || s === 'ARRIVED_DEST_HUB') return 2;
  if (s === 'PICKED_UP' || s === 'PICKUP_COMPLETED' || s === 'ARRIVED_ORIGIN_HUB') return 1;
  return 0;
}

function getStatusBadgeDetails(status?: string | null) {
  const s = (status || 'CREATED').toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') {
    return { label: 'Giao Hàng Thành Công', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' };
  }
  if (s === 'DELIVERY_FAILED' || s === 'NDR_CREATED') {
    return { label: 'Giao Thất Bại (Sự Cố NDR)', bg: 'bg-amber-500/10 text-amber-700 border-amber-300', dot: 'bg-amber-500' };
  }
  if (s === 'RETURN_STARTED' || s === 'RETURN_COMPLETED' || s === 'RETURNING') {
    return { label: 'Đang Chuyển Hoàn', bg: 'bg-rose-500/10 text-rose-700 border-rose-300', dot: 'bg-rose-500' };
  }
  if (s === 'CANCELLED') {
    return { label: 'Đã Hủy Đơn', bg: 'bg-slate-500/10 text-slate-700 border-slate-300', dot: 'bg-slate-500' };
  }
  if (s === 'DELIVERING' || s === 'OUT_FOR_DELIVERY' || s === 'TASK_ASSIGNED') {
    return { label: 'Đang Phát Hàng Tận Nơi', bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-300', dot: 'bg-indigo-500 animate-pulse' };
  }
  if (s === 'IN_TRANSIT' || s === 'SCAN_INBOUND' || s === 'SCAN_OUTBOUND') {
    return { label: 'Đang Trung Chuyển Liên Tỉnh', bg: 'bg-blue-500/10 text-blue-700 border-blue-300', dot: 'bg-blue-500 animate-pulse' };
  }
  if (s === 'PICKED_UP' || s === 'PICKUP_COMPLETED') {
    return { label: 'Bưu Tá Đã Lấy Hàng', bg: 'bg-sky-500/10 text-sky-700 border-sky-300', dot: 'bg-sky-500' };
  }
  return { label: 'Đã Tiếp Nhận (Chờ Lấy)', bg: 'bg-blue-500/10 text-blue-700 border-blue-300', dot: 'bg-blue-500' };
}

function Layout() {
  const { phone, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthClick = () => {
    if (phone) {
      logout();
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen w-screen bg-[#F0F6FF] text-slate-900 font-sans antialiased flex flex-col md:flex-row md:h-screen md:overflow-hidden">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 backdrop-blur md:hidden shrink-0 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <BrandMark />
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              onClick={handleAuthClick}
              aria-label={phone ? 'Đăng xuất tài khoản' : 'Đăng nhập tài khoản'}
            >
              {phone ? <LogOut className="h-4 w-4" strokeWidth={2} /> : <User className="h-4 w-4" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-xl md:bottom-auto md:right-auto md:top-0 md:h-screen md:w-64 md:border-r md:border-t-0 md:shadow-none md:relative md:shrink-0 flex flex-col justify-between"
        aria-label="Sidebar Navigation"
      >
        <div>
          <div className="hidden px-5 pb-4 pt-6 md:block border-b border-slate-100">
            <BrandMark />
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500 font-medium">
              Cổng tra cứu vận đơn & điều phối logistics toàn quốc Nexus.
            </p>
          </div>

          <nav
            className="mx-auto flex max-w-md items-center justify-around gap-1 px-2 py-2 md:mx-0 md:max-w-none md:flex-col md:items-stretch md:px-3 md:py-5 md:gap-1.5"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => (
              <GuestNavLink key={item.to} {...item} />
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="hidden px-4 pb-5 md:block space-y-3 border-t border-slate-100 pt-4">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/70 p-3.5 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">Hotline Hỗ Trợ 24/7</p>
            <a
              className="mt-1 flex items-center gap-2 font-extrabold text-sm text-blue-700 hover:text-blue-800 transition-colors"
              href="tel:19000000"
              aria-label="Gọi điện đến hotline hỗ trợ 1900 0000"
            >
              <Phone className="h-4 w-4 text-blue-600" strokeWidth={2.2} />
              1900 0000 (Miễn cước)
            </a>
          </div>

          {phone && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <p className="text-[10px] font-bold uppercase text-slate-500">Khách hàng</p>
              <p className="text-xs font-bold text-blue-900 truncate">{user?.displayName || phone}</p>
              <p className="text-[11px] font-mono text-slate-600">{phone}</p>
            </div>
          )}

          <button
            onClick={handleAuthClick}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
              phone
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/25'
            }`}
          >
            {phone ? <LogOut className="h-3.5 w-3.5" strokeWidth={2} /> : <User className="h-3.5 w-3.5" strokeWidth={2} />}
            {phone ? 'Đăng xuất' : 'Đăng nhập'}
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main
        className={`w-full flex-1 md:h-screen md:overflow-y-auto ${isLoginPage ? '' : 'px-4 py-4 md:px-8 md:py-6'}`}
        id="main-content"
      >
        <Outlet />
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <RouterLink to="/" className="flex items-center gap-2.5 group" aria-label="Trang chủ Nexus Logistics">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform duration-200">
        <Truck className="h-4.5 w-4.5" strokeWidth={2.2} />
      </div>
      <div>
        <span className="block font-black tracking-tight text-base text-slate-900 leading-none">NEXUS</span>
        <span className="block text-[9px] font-extrabold uppercase tracking-widest text-blue-600">Customer Portal</span>
      </div>
    </RouterLink>
  );
}

function GuestNavLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex min-w-[70px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium tracking-wide transition-all duration-200 md:min-w-0 md:flex-row md:gap-3 md:px-3.5 md:py-2.5 md:text-xs font-bold',
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
            : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      <span>{label}</span>
    </RouterNavLink>
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
  const [calcService, setCalcService] = useState<'EXPRESS' | 'STANDARD' | 'CARGO'>('STANDARD');
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<PricingQuoteResponse | null>(null);

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
        package: { weightKg: calcWeight },
      });
      setQuoteResult(res);
    } catch {
      const isSameProvince = calcOrigin === calcDest;
      const baseFee = isSameProvince ? 16500 : 32000;
      const weightFee = Math.max(0, calcWeight - 1) * (isSameProvince ? 3000 : 7000);
      const serviceMultiplier = calcService === 'EXPRESS' ? 1.4 : calcService === 'CARGO' ? 0.85 : 1.0;
      const total = Math.round((baseFee + weightFee) * serviceMultiplier);
      setQuoteResult({
        quoteId: 'quote-local',
        serviceType: calcService,
        totalFee: total,
        actualWeightKg: calcWeight,
        volumetricWeightKg: calcWeight,
        chargeableWeightKg: calcWeight,
        breakdown: [
          { code: 'BASE_FEE', label: 'Cước cơ bản', amount: Math.round(baseFee * serviceMultiplier), basis: 'Chặng vận chuyển' },
          { code: 'WEIGHT_FEE', label: 'Cước vượt cân', amount: Math.round(weightFee * serviceMultiplier), basis: `${calcWeight}kg` },
        ],
      });
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

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HERO SEARCH SECTION */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-blue-400/30 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <img
          src={OPS_HERO_BG}
          alt="Nexus Logistics Operations"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-25 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/90 via-blue-700/80 to-indigo-900/70" />

        <div className="relative z-10 p-6 md:p-8 space-y-5 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            🟢 Cổng Tra Cứu Vận Đơn Công Khai & Quản Lý Khách Hàng
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-white leading-tight">
              Tra Cứu Hành Trình Đơn Hàng & Ước Tính Cước Phí
            </h1>
            <p className="text-blue-100 text-xs md:text-sm leading-relaxed max-w-2xl font-medium">
              Theo dõi trực tiếp bưu tá lấy/giao hàng, lộ trình trung chuyển liên tỉnh, vị trí GPS và minh bạch đối soát COD 24/7.
            </p>
          </div>

          {/* Quick Universal Tracking Search Form */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg space-y-3">
            {/* Status / Privacy Policy Notice */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {isLoggedIn ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 font-bold text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Tài khoản đã đăng nhập: {user?.displayName || phone} (Tự động mở khóa vận đơn của bạn)
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-100 font-bold text-[11px]">
                  <Lock className="h-3 w-3 text-amber-300" />
                  Tra cứu bảo mật: Khách chưa đăng nhập vui lòng nhập Mã vận đơn & Số điện thoại nhận
                </div>
              )}

              {!isLoggedIn && (
                <RouterLink
                  to="/login"
                  className="text-[11px] font-bold text-blue-200 hover:text-white underline flex items-center gap-1 ml-auto"
                >
                  Đăng nhập để xem nhanh <ChevronRight className="h-3 w-3" />
                </RouterLink>
              )}
            </div>

            <form onSubmit={handleTrackingSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Nhập mã vận đơn (VD: 111089343576, 111000000074)..."
                  className="w-full rounded-xl bg-white pl-10 pr-10 py-3 text-sm font-bold uppercase tracking-wider text-slate-900 placeholder-slate-400 outline-none shadow-sm focus:ring-2 focus:ring-blue-400"
                />
                {trackingCode && (
                  <button
                    type="button"
                    onClick={() => { setTrackingCode(''); setSearchResult(null); setSearchError(null); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!isLoggedIn && (
                <div className="relative sm:w-64">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="SĐT người nhận (VD: 09xx)..."
                    className="w-full rounded-xl bg-white pl-10 pr-3 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none shadow-sm focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" strokeWidth={2.5} />}
                Tra Cứu Ngay
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-blue-100 pt-1 px-1">
              <span className="font-bold text-[11px] text-blue-200">Mã đơn mẫu trong hệ thống:</span>
              {['111089343576', '111000000074', '111000000064'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setTrackingCode(sample);
                    if (isLoggedIn) {
                      doSearch(sample);
                    }
                  }}
                  className="px-2 py-0.5 rounded-md bg-white/20 text-white hover:bg-white/30 font-mono text-[11px] font-bold border border-white/20 transition"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <Zap className="h-3.5 w-3.5 fill-amber-300" />
                Giao Hỏa Tốc
              </div>
              <p className="text-xs font-bold text-white mt-0.5">2H Nội thành</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20">
              <div className="flex items-center gap-1.5 text-cyan-200 font-bold text-xs">
                <Building2 className="h-3.5 w-3.5" />
                Mạng Lưới Bưu Cục
              </div>
              <p className="text-xs font-bold text-white mt-0.5">{hubs.length || 34} Điểm giao nhận</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tỷ Lệ Đúng Hạn
              </div>
              <p className="text-xs font-bold text-white mt-0.5">99.8% Chuẩn SLA</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20">
              <div className="flex items-center gap-1.5 text-purple-200 font-bold text-xs">
                <DollarSign className="h-3.5 w-3.5" />
                Đối Soát COD
              </div>
              <p className="text-xs font-bold text-white mt-0.5">Rút tiền 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH ERROR OR PRIVACY VERIFICATION ALERT */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
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
                className="px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white font-semibold text-slate-900 outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Xác Thực
              </button>
            </form>
          )}
        </div>
      )}

      {/* 3. COMPREHENSIVE TRACKING DETAILS CARD (IF FOUND) */}
      {searchResult && (
        <section className="bg-white rounded-3xl border border-blue-100 p-5 md:p-6 shadow-md shadow-blue-500/5 space-y-6 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mã Vận Đơn Tra Cứu</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {searchResult.order?.serviceType || 'TIÊU CHUẨN'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-xl md:text-2xl font-black text-blue-950 font-mono tracking-tight">
                  #{searchResult.shipmentCode}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Sao chép link theo dõi"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Xem mã QR quét điện thoại"
                >
                  <QrCode className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-sm ${statusBadge.bg}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${statusBadge.dot}`} />
                {searchResult.current?.currentStatus || statusBadge.label}
              </span>
            </div>
          </div>

          {/* 5-Stage Visual Progression Stepper */}
          <div className="py-2">
            <div className="grid grid-cols-5 gap-1 sm:gap-2 relative">
              {/* Connecting progress line */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-100 -z-0 rounded" />
              <div
                className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-blue-600 -z-0 rounded transition-all duration-700"
                style={{ width: `${(milestoneIndex / (MILESTONES.length - 1)) * 92}%` }}
              />

              {MILESTONES.map((step, idx) => {
                const isPassed = idx <= milestoneIndex;
                const isCurrent = idx === milestoneIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isPassed
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : 'bg-white text-slate-300 border border-slate-200'
                      } ${isCurrent ? 'ring-4 ring-blue-100 scale-105' : ''}`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
                    </div>
                    <p className={`mt-2 text-[11px] sm:text-xs font-extrabold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    <p className="hidden sm:block text-[10px] text-slate-400 font-medium">
                      {step.subLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid of Details: Timeline (Left 7) & Order Specs (Right 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Detailed Timeline Events (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Nhật Ký Hành Trình Vận Chuyển
                </div>
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {searchResult.timeline.length} Sự kiện
                </span>
              </div>

              {searchResult.timeline.length > 0 ? (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {searchResult.timeline.map((ev, i) => {
                    const isSystemAuto = ev.note?.includes('🤖') || ev.note?.includes('tự động') || ev.actor === 'SYSTEM_AUTO_DISPATCH';
                    const isLatest = i === 0 || i === searchResult.timeline.length - 1;

                    return (
                      <div
                        key={ev.id || i}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isLatest
                            ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 p-1.5 rounded-xl ${isLatest ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              <Truck className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-extrabold text-xs text-slate-900">
                                {ev.statusAfterEvent || ev.eventType || ev.eventTypeCode || 'Sự kiện cập nhật'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  {ev.locationText || ev.locationCode || 'Trạm trung chuyển'}
                                </span>
                                {isSystemAuto && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold border border-blue-200">
                                    <Bot className="h-3 w-3" />
                                    Tự động điều phối
                                  </span>
                                )}
                              </div>
                              {cleanCustomerNote(ev.note) && (
                                <p className="text-[11px] text-slate-600 font-normal mt-1 leading-relaxed bg-white/60 p-2 rounded-lg border border-slate-100">
                                  {cleanCustomerNote(ev.note)}
                                </p>
                              )}

                              {/* Proof Image (POD) */}
                              {ev.proofImageUrl && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">
                                    <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Ảnh minh chứng giao hàng (POD):</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPodImage(ev.proofImageUrl || null)}
                                    className="group relative inline-block cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm hover:shadow-md transition text-left"
                                    title="Bấm để xem ảnh phóng to"
                                  >
                                    <img
                                      src={ev.proofImageUrl}
                                      alt="Minh chứng giao hàng POD"
                                      className="h-20 w-28 object-cover rounded-xl transition duration-300 group-hover:scale-105"
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
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
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
                <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 font-medium">
                  Đơn hàng mới tạo, đang chuẩn bị quét mã tại bưu cục gốc.
                </div>
              )}
            </div>

            {/* Order & Package Specs Card (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Sender & Receiver Summary */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Thông Tin Giao Nhận
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Người Gửi</span>
                    <p className="font-bold text-slate-900">{searchResult.order?.sender?.name || 'Chủ hàng / Shop đối tác'}</p>
                    <p className="text-slate-600 text-[11px]">
                      {searchResult.order?.sender?.province || 'Bưu cục gốc TP.HCM'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Người Nhận</span>
                    <p className="font-bold text-slate-900">{searchResult.order?.receiver?.name || 'Khách hàng nhận'}</p>
                    <p className="text-slate-600 text-[11px]">
                      {searchResult.order?.receiver?.address || searchResult.order?.receiver?.province || 'Bưu cục phát Hà Nội'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package Specs & Financials */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700">
                  <Package className="h-4 w-4 text-blue-600" />
                  Quy Cách Kiện Hàng & Tiền COD
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Khối Lượng</span>
                    <p className="font-extrabold text-slate-900 font-mono">
                      {searchResult.order?.package?.weightKg ? `${searchResult.order.package.weightKg} kg` : '1.2 kg'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Kích Thước</span>
                    <p className="font-extrabold text-slate-900 font-mono">
                      {searchResult.order?.package?.dimensionsCm
                        ? `${searchResult.order.package.dimensionsCm.length}x${searchResult.order.package.dimensionsCm.width}x${searchResult.order.package.dimensionsCm.height} cm`
                        : '20x15x10 cm'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tiền Thu Hộ (COD)</span>
                      <p className="text-base font-extrabold text-blue-700 font-mono">
                        {(searchResult.order?.codAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Miễn Phí COD
                    </span>
                  </div>
                </div>
              </div>

              {/* Live GPS Position Badge (If available) */}
              {searchResult.gpsPosition && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-emerald-600 shrink-0 animate-pulse" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-900">Tọa Độ GPS Bưu Tá Trực Tiếp</p>
                    <p className="text-[11px] text-emerald-700 font-mono">
                      Lat: {searchResult.gpsPosition.latitude.toFixed(4)}, Lng: {searchResult.gpsPosition.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4. RATE ESTIMATOR & SERVICES OVERVIEW SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-label="Công cụ tính cước nhanh">
        {/* Rate Estimator (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-blue-100 p-6 shadow-md shadow-blue-500/5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs uppercase tracking-wider">
              <Calculator className="h-4 w-4" strokeWidth={2.5} />
              Ước Tính Cước Phí Nhanh
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">Tính Giá Cước Vận Chuyển Tự Động</h2>
            <p className="text-xs text-slate-500 mt-0.5">Áp dụng bảng giá cước chuẩn hóa toàn quốc.</p>
          </div>

          <form onSubmit={handleCalculateFee} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Tỉnh Gửi</label>
                <select
                  value={calcOrigin}
                  onChange={(e) => setCalcOrigin(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Khối lượng (kg)</label>
              <div className="flex gap-2 mt-1">
                {[0.5, 1, 2, 5].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setCalcWeight(w)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      calcWeight === w
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50'
                    }`}
                  >
                    {w} kg
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Gói dịch vụ</label>
              <select
                value={calcService}
                onChange={(e) => setCalcService(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="STANDARD">Giao Chuẩn Standard (24 - 48h)</option>
                <option value="EXPRESS">Giao Hỏa Tốc Express (2 - 6h)</option>
                <option value="CARGO">Hàng Nặng Cargo (Chiết khấu)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2"
            >
              {isCalculating ? 'Đang tính toán...' : 'Tính Cước Phí Ngay'}
            </button>
          </form>

          {quoteResult && (
            <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Cước phí ước tính</p>
                  <p className="text-2xl font-extrabold text-blue-600">{quoteResult.totalFee.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <span className="text-[11px] text-emerald-800 font-extrabold bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
                  {calcService === 'EXPRESS' ? 'Giao 2-6 giờ' : 'Giao 24-48 giờ'}
                </span>
              </div>
              <button
                onClick={() => navigate('/create')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                Tạo Đơn Hàng Ngay <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Services Showcase (6 cols) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[
            {
              icon: Zap,
              title: 'Giao Hỏa Tốc Same-Day',
              desc: 'Giao nhận nội thành siêu tốc trong 2 giờ. Tự động điều phối shipper gần nhất.',
              badge: '2 Giờ',
              bg: 'bg-amber-500/10 text-amber-700 border-amber-200',
            },
            {
              icon: Truck,
              title: 'Giao Chuẩn Standard',
              desc: 'Tối ưu chi phí, cam kết đúng hạn 24h - 48h trên mạng lưới bưu cục toàn quốc.',
              badge: 'Tiết kiệm',
              bg: 'bg-blue-500/10 text-blue-700 border-blue-200',
            },
            {
              icon: Boxes,
              title: 'Vận Chuyển Hàng Lớn',
              desc: 'Kiện hàng cồng kềnh, tải trọng lớn với mức chiết khấu linh hoạt.',
              badge: 'Cargo Freight',
              bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
            },
            {
              icon: DollarSign,
              title: 'Thu Hộ COD 24/7',
              desc: 'Đối soát tiền thu hộ minh bạch, rút tiền bất cứ lúc nào không phí ẩn.',
              badge: 'Miễn Phí',
              bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
            },
          ].map((svc, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 hover:border-blue-300 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center border ${svc.bg}`}>
                    <svc.icon className="w-4 h-4" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {svc.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-xs text-slate-900">{svc.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{svc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 relative">
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
              <div className="mx-auto p-4 bg-white rounded-2xl border border-slate-200 shadow-inner inline-block">
                <img src={qrDataUrl} alt="Mã QR tra cứu" className="w-48 h-48 mx-auto" />
              </div>
            )}
            <p className="text-[11px] text-slate-500">Quét bằng camera điện thoại để mở nhanh trên App hoặc Web.</p>
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs uppercase"
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
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Ảnh Minh Chứng Giao Hàng (POD)</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPodImage(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Đóng xem ảnh"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[68vh] overflow-hidden rounded-2xl bg-slate-950 flex items-center justify-center p-2">
              <img
                src={selectedPodImage}
                alt="Minh chứng POD phóng to"
                className="max-h-[64vh] w-auto max-w-full object-contain rounded-xl"
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
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          />
        </div>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
        >
          <option value="ALL">Tất cả khu vực</option>
          <option value="NORTH">Miền Bắc (Hà Nội, Hải Phòng...)</option>
          <option value="CENTRAL">Miền Trung (Đà Nẵng, Huế...)</option>
          <option value="SOUTH">Miền Nam (TP.HCM, Bình Dương...)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHubs.map((hub) => (
          <div key={hub.id || hub.code} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5 hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {hub.code}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
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

  // Mode: Lấy hàng tại nhà vs Gửi hàng tại bưu cục
  const [pickupMethod, setPickupMethod] = useState<'PICKUP' | 'DROP_OFF'>('PICKUP');

  // Masterdata Hubs
  const [allHubs, setAllHubs] = useState<HubRecord[]>([]);

  // Sender details
  const [senderName, setSenderName] = useState(user?.displayName || 'Chủ hàng');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderProvince, setSenderProvince] = useState('Thành phố Hồ Chí Minh');
  const [senderWard, setSenderWard] = useState('Phường Bến Nghé');
  const [senderDistrict, setSenderDistrict] = useState('Quận 1');
  const [senderHubCode, setSenderHubCode] = useState('HUB-HCM-001');

  // Receiver details
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverProvince, setReceiverProvince] = useState('Thành phố Hà Nội');
  const [receiverWard, setReceiverWard] = useState('Phường Tràng Tiền');
  const [receiverDistrict, setReceiverDistrict] = useState('Quận Hoàn Kiếm');
  const [receiverHubCode, setReceiverHubCode] = useState('HUB-HN-001');

  // Cargo & Service details
  const [cargoName, setCargoName] = useState('Kiện hàng mẫu');
  const [cargoWeight, setCargoWeight] = useState(1);
  const [serviceType, setServiceType] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [codAmount, setCodAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Live fee state
  const [liveFee, setLiveFee] = useState(22000);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load hubs on mount
  useEffect(() => {
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

  // Wards list based on selected provinces
  const senderWards = useMemo(() => getWardsForProvince(senderProvince), [senderProvince]);
  const receiverWards = useMemo(() => getWardsForProvince(receiverProvince), [receiverProvince]);

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

  // Real-time Pricing Engine calculation
  useEffect(() => {
    let active = true;
    setIsCalculatingFee(true);

    pricingApi
      .calculateQuote({
        serviceType,
        sender: { province: senderProvince, hubCode: senderHubCode },
        receiver: { province: receiverProvince, hubCode: receiverHubCode },
        package: { weightKg: cargoWeight },
        codAmount: codAmount,
      })
      .then((res) => {
        if (active && res?.totalFee) {
          setLiveFee(res.totalFee);
        }
      })
      .catch(() => {
        const isSame = senderProvince === receiverProvince;
        const base = isSame ? 16500 : 32000;
        const extra = Math.max(0, cargoWeight - 1) * (isSame ? 3000 : 7000);
        const mult = serviceType === 'EXPRESS' ? 1.4 : 1.0;
        if (active) setLiveFee(Math.round((base + extra) * mult));
      })
      .finally(() => {
        if (active) setIsCalculatingFee(false);
      });

    return () => {
      active = false;
    };
  }, [senderProvince, senderHubCode, receiverProvince, receiverHubCode, cargoWeight, serviceType, codAmount]);

  if (!phone) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
        <div className="w-full bg-white p-8 text-center rounded-3xl border border-slate-200 shadow-md space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <PlusCircle className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Tạo Vận Đơn Mới</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
              Vui lòng đăng nhập hoặc đăng ký tài khoản để tạo và đồng bộ vận đơn trên cơ sở dữ liệu Nexus.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition"
          >
            Đăng Nhập / Đăng Ký Ngay
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }

    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin người nhận (Tên, SĐT, Địa chỉ chi tiết).');
      return;
    }

    if (pickupMethod === 'PICKUP' && !senderAddress.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ lấy hàng tại nhà chi tiết (số nhà, tên đường).');
      return;
    }

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

      const res = await shipmentApi.createShipment(token, {
        sender: {
          name: senderName.trim(),
          phone: phone,
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

      setSuccessMsg(`Tạo vận đơn #${res.code} thành công! Đang chuyển đến lịch sử...`);
      setTimeout(() => {
        navigate('/history');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Tạo vận đơn thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
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
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2 flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-600">Tài khoản:</span>
          <span className="font-mono font-bold text-blue-700 text-sm">{phone}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* HÌNH THỨC GỬI HÀNG (PICKUP vs DROP_OFF) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            Hình Thức Gửi Hàng
          </div>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {pickupMethod === 'PICKUP' ? 'Điều phối Shipper đến lấy' : 'Gửi tại quầy bưu cục'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <button
            type="button"
            onClick={() => setPickupMethod('PICKUP')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
              pickupMethod === 'PICKUP'
                ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                pickupMethod === 'PICKUP' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Truck className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                🚚 Lấy hàng tại nhà (PICKUP)
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
            className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
              pickupMethod === 'DROP_OFF'
                ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                pickupMethod === 'DROP_OFF' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                🏢 Gửi hàng tại bưu cục (DROP_OFF)
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700">
                <MapPin className="h-4 w-4 text-blue-600" />
                Thông Tin Người Gửi
              </div>
              {currentSenderHub && (
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Hub gửi: {currentSenderHub.code}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tên người gửi *</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Số điện thoại gửi</label>
                <input
                  type="tel"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 cursor-not-allowed"
                  value={phone}
                  disabled
                />
              </div>

              {/* TỈNH / THÀNH PHỐ GỬI */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tỉnh / Thành gửi *</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={senderProvince}
                  onChange={(e) => setSenderProvince(e.target.value)}
                >
                  {PROVINCES.map((p) => (
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
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
                    🏢 Chọn bưu cục Nexus tiếp nhận gửi hàng *
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-bold text-blue-900 outline-none focus:bg-white focus:border-blue-600"
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
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                    placeholder="Ví dụ: 123 Nguyễn Văn Cừ, Tòa nhà Bitexco..."
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                  />
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-700">
                <User className="h-4 w-4 text-blue-600" />
                Thông Tin Người Nhận
              </div>
              {currentReceiverHub && (
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  placeholder="09xx xxx xxx"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                />
              </div>

              {/* TỈNH / THÀNH PHỐ NHẬN */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tỉnh / Thành nhận *</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={receiverProvince}
                  onChange={(e) => setReceiverProvince(e.target.value)}
                >
                  {PROVINCES.map((p) => (
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3.5 shadow-sm">
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={cargoName}
                  onChange={(e) => setCargoName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Khối lượng (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Gói dịch vụ</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                  >
                    <option value="STANDARD">Tiêu Chuẩn</option>
                    <option value="EXPRESS">Hỏa Tốc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Tiền Thu Hộ COD (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-blue-700 outline-none focus:bg-white focus:border-blue-600"
                  value={codAmount}
                  onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase">Ghi chú giao hàng</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
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
                  {formatVnd(liveFee)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
        </div>
      </form>
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
        <div className="w-full bg-white p-8 text-center rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-inner">
            <Lock className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Lịch Sử & Quản Lý Đơn Hàng</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
              Vui lòng đăng nhập hoặc đăng ký tài khoản để xem toàn bộ danh sách đơn bạn đã gửi và các kiện hàng đang được giao đến số điện thoại của bạn.
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 rounded-2xl border border-blue-100 text-left text-xs space-y-2 text-blue-900 font-medium">
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
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/25 transition"
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
        st === 'TASK_ASSIGNED' ||
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
      if (statusFilter === 'CREATED' && st !== 'CREATED') return false;
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
        !['DELIVERING', 'OUT_FOR_DELIVERY', 'TASK_ASSIGNED', 'READY_FOR_DELIVERY'].includes(st)
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
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm Mới</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Tạo Vận Đơn</span>
          </button>
        </div>
      </div>

      {/* 2. KPI QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Tổng Đơn {activeTab === 'SENT' ? 'Gửi' : 'Nhận'}</span>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{stats.total}</p>
          <p className="text-[10px] text-slate-400 font-medium">Tất cả thời gian</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-600 font-bold">
            <span>Đang Giao / Vận Chuyển</span>
            <Truck className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 font-mono">{stats.inTransit}</p>
          <p className="text-[10px] text-indigo-500 font-medium">Bưu tá & Trung chuyển</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
            <span>Giao Thành Công</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">{stats.delivered}</p>
          <p className="text-[10px] text-emerald-500 font-medium">Đã ký nhận POD</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-600 font-bold">
            <span>Sự Cố / NDR / Hoàn</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono">{stats.issues}</p>
          <p className="text-[10px] text-amber-500 font-medium">Cần xử lý & Hoàn</p>
        </div>
      </div>

      {/* 3. DUAL CATEGORY TABS (SENT vs RECEIVED) */}
      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('SENT')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            activeTab === 'SENT'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Đơn Đã Gửi</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 ${
            activeTab === 'RECEIVED'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Đơn Nhận Hàng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
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
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã vận đơn, tên người nhận, SĐT, địa chỉ..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600"
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
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="h-7 w-7 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Đang đồng bộ danh sách vận đơn từ máy chủ Nexus...</p>
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
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
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-600/20 transition inline-flex items-center gap-1.5"
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
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Top Row: Code, Category badge, Status badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        #{s.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(s.code)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
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
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1.5">
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
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Khối lượng</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">{weight} kg</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Tiền Thu Hộ</span>
                      <span className="font-bold text-blue-700 font-mono text-[11px]">{formatVnd(cod)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
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
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                    >
                      <Eye className="h-3 w-3" /> Chi tiết
                    </button>
                    <RouterLink
                      to={`/?track=${encodeURIComponent(s.code)}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
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
      <div className="relative max-w-xl w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Chi Tiết Vận Đơn Nexus
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg}`}>
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
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                title="Sao chép mã đơn"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sender & Receiver Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
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

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
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
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-extrabold uppercase text-slate-700 text-[11px]">
            <Package className="h-3.5 w-3.5 text-blue-600" />
            <span>Quy Cách Kiện Hàng & Cước Phí</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Tên hàng hóa</span>
              <span className="font-extrabold text-slate-900 text-xs">{pkg.itemName || 'Hàng hóa bưu gửi'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Khối lượng</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs">{pkg.weightKg || 1} kg</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Dịch vụ</span>
              <span className="font-extrabold text-blue-700 text-xs">{meta.service?.type || 'TIÊU CHUẨN'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Tiền Thu Hộ (COD)</span>
              <span className="font-extrabold text-blue-700 font-mono text-xs">
                {formatVnd(meta.codAmount || pkg.codAmount || 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Cước Vận Chuyển</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs">
                {formatVnd(meta.shippingFee || meta.estimatedFee || 22000)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Khai Giá Hàng</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs">
                {formatVnd(pkg.declaredValue || 0)}
              </span>
            </div>
          </div>

          {meta.notes && (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Ghi chú giao hàng:</span>
              <p className="text-slate-700 text-xs mt-0.5">{meta.notes}</p>
            </div>
          )}
        </div>

        {/* QR Code Quick Scan */}
        {qrDataUrl && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <img src={qrDataUrl} alt="Mã QR tra cứu" className="w-16 h-16 rounded-lg border bg-white p-1 shrink-0" />
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
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => onTrack(shipment.code)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-600/25 transition flex items-center gap-1.5"
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
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TrackingPage />} />
          <Route path="track/:code" element={<TrackingPage />} />
          <Route path="create" element={<CreateOrderPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="network" element={<NetworkDirectoryPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
