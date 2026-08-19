import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Link as RouterLink,
  NavLink as RouterNavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
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
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';
import { trackingApi, type UnifiedTrackingResponse } from './services/api/tracking.api';
import { pricingApi, type PricingQuoteResponse } from './services/api/pricing.api';
import { shipmentApi, type ShipmentResponse } from './services/api/shipment.api';
import { masterdataApi, type HubRecord } from './services/api/masterdata.api';

const navItems = [
  { to: '/', icon: Search, label: 'Tra cứu & Cước phí' },
  { to: '/create', icon: PlusCircle, label: 'Tạo vận đơn' },
  { to: '/history', icon: Clock, label: 'Lịch sử giao dịch' },
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
];

const OPS_HERO_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAH9tY3PsZjp-XCnVG-y43-sPKhb-INEfJPNHYxHTVdm69WwoXvGDiw7DfuvmU5b3DHK_888jICATCwV5G1g3uvdjTPamNKyM8KJB2Ei4T4RBJ-M4US87urT0uP9tXDcCuNPz6FtF-nTa_G-XDYI2LyIsduJvHEffTuIOfqjWvAttJm8D15E5_GNR64ZxIKkl1kwxBKH-3LgX4daJfTkFTanBTrDiE0qwHwVdRRNZ_O-PizHz0CEsugBHSQU-6tzxan_Mxrdatluq8';
const OPS_WAREHOUSE_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDNC6uIL7KHoh7W2_Pkpfr2OAR0nRihRxGZAL4zC5URhuoEz5Y6hi0nWoU1x7gNRGfdYrzVXRtzlhIPVTy-E8e-kOs_k_Ssvx_6OmD7N18opsNqGXRyNVjfHQPUShZG7zdauOX72ES5tAsiJTCmjYCEx0Oe7ZOAJdlWtYtqURR5s9tj9jTGI2XR4BYnGxntjxUrv7e506rSC37lQC5zPngQoU3Jyk_5Yh8ZU9xgF5W-58oLgW8PXR2VAwWadMSBVDZAj5eEkP_UdUw';

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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <BrandMark />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            onClick={handleAuthClick}
            aria-label={phone ? 'Đăng xuất tài khoản' : 'Đăng nhập tài khoản'}
          >
            {phone ? <LogOut className="h-4.5 w-4.5" strokeWidth={1.75} /> : <User className="h-4.5 w-4.5" strokeWidth={1.75} />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-xl md:bottom-auto md:right-auto md:top-0 md:h-screen md:w-72 md:border-r md:border-t-0 md:shadow-none md:relative md:shrink-0 flex flex-col justify-between" aria-label="Sidebar Navigation">
        <div>
          <div className="hidden px-6 pb-4 pt-8 md:block border-b border-slate-100">
            <BrandMark />
            <p className="mt-3 text-xs leading-relaxed text-slate-500 font-medium">
              Cổng thông tin tra cứu & điều phối vận chuyển toàn quốc Nexus Logistics.
            </p>
          </div>

          <nav className="mx-auto flex max-w-md items-center justify-around gap-1 px-3 py-2 md:mx-0 md:max-w-none md:flex-col md:items-stretch md:px-4 md:py-6 md:gap-1.5" aria-label="Main Navigation">
            {navItems.map((item) => (
              <GuestNavLink key={item.to} {...item} />
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="hidden px-5 pb-6 md:block space-y-3 border-t border-slate-100 pt-5">
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">Hotline Vận Chuyển 24/7</p>
            <a className="mt-1 flex items-center gap-2 font-extrabold text-base text-blue-700 hover:text-blue-800 transition-colors" href="tel:19000000" aria-label="Gọi điện đến hotline hỗ trợ 1900 0000">
              <Phone className="h-4.5 w-4.5 text-blue-600" strokeWidth={2.2} />
              1900 0000 (Tổng đài)
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
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
              phone
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/25'
            }`}
          >
            {phone ? <LogOut className="h-4 w-4" strokeWidth={1.75} /> : <User className="h-4 w-4" strokeWidth={1.75} />}
            {phone ? 'Đăng xuất' : 'Đăng nhập'}
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className={`w-full flex-1 md:h-screen md:overflow-y-auto ${isLoginPage ? '' : 'px-4 py-4 md:px-8 md:py-6'}`} id="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <RouterLink to="/" className="flex items-center gap-3 group" aria-label="Trang chủ Nexus Logistics">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform duration-200">
        <Truck className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div>
        <span className="block font-black tracking-tight text-lg text-slate-900 leading-none">NEXUS</span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-600">Logistics Portal</span>
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
          'flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-2.5 py-2.5 text-[11px] font-medium tracking-wide transition-all duration-200 md:min-w-0 md:flex-row md:gap-3 md:px-4 md:py-3 md:text-xs font-bold',
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
            : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80',
        ].join(' ')
      }
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      <span>{label}</span>
    </RouterNavLink>
  );
}

function TrackingPage() {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyStep, setApplyStep] = useState<'form' | 'success'>('form');
  const [applyName, setApplyName] = useState('');
  const [applyPhone, setApplyPhone] = useState('');
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // Tracking search state
  const [trackingCode, setTrackingCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<UnifiedTrackingResponse | null>(null);

  // Fee Estimator State
  const [calcOrigin, setCalcOrigin] = useState('Thành phố Hồ Chí Minh');
  const [calcDest, setCalcDest] = useState('Thành phố Hà Nội');
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcService, setCalcService] = useState<'EXPRESS' | 'STANDARD' | 'CARGO'>('STANDARD');
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<PricingQuoteResponse | null>(null);

  // Dynamic Hubs
  const [hubs, setHubs] = useState<HubRecord[]>([]);

  useEffect(() => {
    masterdataApi.getHubs().then(setHubs);
  }, []);

  const handleTrackingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCode.trim().toUpperCase();
    if (!code) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const data = await trackingApi.getTracking(code, token);
      if (!data.current && data.timeline.length === 0) {
        setSearchError(`Không tìm thấy thông tin vận đơn "${code}". Vui lòng kiểm tra lại mã.`);
      } else {
        setSearchResult(data);
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Tra cứu vận đơn thất bại.');
    } finally {
      setIsSearching(false);
    }
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
      // Fallback calculation if pricing service is adjusting
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

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (applyName.trim() && applyPhone.trim()) {
      setApplyStep('success');
    }
  };

  const closeApplyModal = () => {
    setIsApplyModalOpen(false);
    setApplyStep('form');
    setApplyName('');
    setApplyPhone('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic SEO Headline Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-blue-400/40 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <img
          src={OPS_HERO_BG}
          alt="Trung Tâm Điều Phối Nexus Logistics"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-overlay transform scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/90 via-blue-600/80 to-indigo-800/70" />

        {/* Hero Main Content */}
        <div className="relative z-10 p-6 md:p-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            🟢 Dữ Liệu Đồng Bộ Trực Tiếp Cơ Sở Dữ Liệu Nexus 24/7
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl lg:text-4.5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
              Tra Cứu Vận Đơn & Ước Tính Cước Phí Giao Hàng Toàn Quốc
            </h1>
            <p className="text-blue-50 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
              Theo dõi hành trình đơn hàng chính xác thời gian thực từ hệ thống cơ sở dữ liệu, ước tính chi phí minh bạch và đối soát COD trực tiếp cho khách hàng.
            </p>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 shadow-sm hover:bg-white/20 transition">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Zap className="h-4 w-4 fill-amber-300" />
                Giao 2H Hỏa Tốc
              </div>
              <p className="text-base md:text-lg font-bold text-white mt-1">Nội thành siêu tốc</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 shadow-sm hover:bg-white/20 transition">
              <div className="flex items-center gap-2 text-cyan-200 font-bold text-xs">
                <Building2 className="h-4 w-4" />
                Mạng Lưới Bưu Cục
              </div>
              <p className="text-base md:text-lg font-bold text-white mt-1">
                {hubs.length > 0 ? `${hubs.length} Bưu Cục` : '34 Tỉnh Thành'}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 shadow-sm hover:bg-white/20 transition">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                Tỷ Lệ Đúng Giờ
              </div>
              <p className="text-base md:text-lg font-bold text-white mt-1">99.8% Đúng Hẹn</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25 shadow-sm hover:bg-white/20 transition">
              <div className="flex items-center gap-2 text-purple-200 font-bold text-xs">
                <DollarSign className="h-4 w-4" />
                Đối Soát COD
              </div>
              <p className="text-base md:text-lg font-bold text-white mt-1">Rút Tiền 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Tools: Order Tracking & Rate Estimator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-label="Công cụ tra cứu và tính cước">
        {/* Order Tracking Search (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-blue-100 p-6 shadow-md shadow-blue-500/5 flex flex-col justify-between space-y-5 hover:border-blue-300 transition">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
              <Search className="h-4 w-4" strokeWidth={2.5} />
              Tra Cứu Lộ Trình Vận Đơn Trực Tuyến
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">Nhập Mã Vận Đơn Để Xem Hành Trình</h2>
            <p className="text-xs text-slate-500 mt-1">
              Nhập mã vận đơn (ví dụ: <span className="font-mono font-bold text-blue-600">111000000074</span>) để cập nhật vị trí thời gian thực từ cơ sở dữ liệu.
            </p>
          </div>

          <form onSubmit={handleTrackingSearch} className="space-y-3">
            <div className="flex gap-2">
              <input
                id="tracking-input"
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Nhập mã vận đơn... (VD: 111000000074)"
                className="flex-1 rounded-xl border border-slate-200 bg-blue-50/40 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-900 outline-none transition focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                aria-label="Mã vận đơn tra cứu"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 transition flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isSearching ? <span className="animate-spin text-sm">⏳</span> : <Search className="h-4 w-4" strokeWidth={2.5} />}
                Tra Cứu ngay
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
              <span className="font-bold text-slate-700">Mã đơn thực tế trong DB:</span>
              {['111000000074', '111000000064', '111000000054'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setTrackingCode(code);
                    setIsSearching(true);
                    setSearchError(null);
                    trackingApi.getTracking(code, token).then((data) => {
                      setSearchResult(data);
                      setIsSearching(false);
                    }).catch((err) => {
                      setSearchError(err?.message || 'Lỗi tra cứu');
                      setIsSearching(false);
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono text-[11px] font-bold border border-blue-200 transition"
                >
                  {code}
                </button>
              ))}
            </div>
          </form>

          {/* Search Error Alert */}
          {searchError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Real Tracking Result Card */}
          {searchResult && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-5 space-y-4 animate-fadeIn shadow-sm">
              <div className="flex justify-between items-center border-b border-blue-200/80 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã Vận Đơn</span>
                  <p className="font-extrabold text-base text-blue-900 font-mono">#{searchResult.shipmentCode}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {searchResult.current?.currentStatus || searchResult.current?.currentStatusCode || 'ĐANG VẬN CHUYỂN'}
                </span>
              </div>

              <div className="text-xs text-slate-700 space-y-1">
                <p>
                  <span className="font-bold text-slate-900">Vị trí hiện tại:</span>{' '}
                  {searchResult.current?.currentLocationText || searchResult.current?.currentLocationCode || 'Trung tâm khai thác'}
                </p>
                {searchResult.current?.lastEventAt && (
                  <p className="text-slate-500">
                    Cập nhật lần cuối: {new Date(searchResult.current.lastEventAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>

              {/* Progress Steps Timeline */}
              <div className="space-y-2 pt-1 border-t border-blue-200/60">
                <p className="text-[11px] font-bold uppercase text-slate-500">Nhật Ký Hành Trình Vận Chuyển</p>
                {searchResult.timeline.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {searchResult.timeline.map((ev, i) => (
                      <div key={ev.id || i} className="flex items-start gap-3 text-xs bg-white/70 p-2.5 rounded-xl border border-blue-100">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 mt-1 bg-blue-600 ring-2 ring-blue-200" />
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">
                            {ev.statusAfterEvent || ev.eventType || ev.eventTypeCode || 'Sự kiện vận chuyển'}
                          </p>
                          <p className="text-[11px] text-slate-600">{ev.locationText || ev.locationCode || 'Trạm trung chuyển'}</p>
                          {ev.note && <p className="text-[11px] text-slate-500 italic mt-0.5">{ev.note}</p>}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono shrink-0">
                          {ev.occurredAt ? new Date(ev.occurredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Đơn hàng mới tạo, đang chờ quét mã tại bưu cục gửi.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Rate Estimator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-blue-100 p-6 shadow-md shadow-blue-500/5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs uppercase tracking-wider">
              <Calculator className="h-4 w-4" strokeWidth={2.5} />
              Ước Tính Cước Phí Tự Động
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">Tính Giá Cước Vận Chuyển Nhanh</h2>
          </div>

          <form onSubmit={handleCalculateFee} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="calc-origin" className="block text-[11px] font-extrabold text-slate-700 uppercase">Điểm gửi hàng</label>
                <select
                  id="calc-origin"
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
                <label htmlFor="calc-dest" className="block text-[11px] font-extrabold text-slate-700 uppercase">Điểm giao hàng</label>
                <select
                  id="calc-dest"
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

            {/* Quick Weight Selectors */}
            <div>
              <label htmlFor="calc-weight" className="block text-[11px] font-extrabold text-slate-700 uppercase">Khối lượng (kg)</label>
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
              <input
                id="calc-weight"
                type="number"
                min="0.1"
                step="0.5"
                value={calcWeight}
                onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0.5)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                placeholder="Nhập khối lượng tùy chỉnh..."
              />
            </div>

            <div>
              <label htmlFor="calc-service" className="block text-[11px] font-extrabold text-slate-700 uppercase">Gói dịch vụ</label>
              <select
                id="calc-service"
                value={calcService}
                onChange={(e) => setCalcService(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="STANDARD">Giao Chuẩn Standard (24 - 48h)</option>
                <option value="EXPRESS">Giao Hỏa Tốc Express (2 - 6h)</option>
                <option value="CARGO">Vận Chuyển Hàng Lớn Cargo (Chiết khấu)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2"
            >
              {isCalculating ? 'Đang tính cước...' : 'Tính Ngay Cước Phí'}
            </button>
          </form>

          {quoteResult && (
            <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-3.5 space-y-3">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                Tạo Đơn Hàng Ngay <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Core Logistics Services Grid */}
      <section className="space-y-4" aria-label="Các dịch vụ vận chuyển trọng tâm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Dịch Vụ Vận Chuyển Trọng Tâm</h2>
          <p className="text-xs text-slate-500 font-medium">Đáp ứng linh hoạt nhu cầu gửi hàng cá nhân, shop online và doanh nghiệp thương mại.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              icon: Zap,
              title: 'Giao Hỏa Tốc Same-day',
              desc: 'Giao nhận siêu tốc nội thành chỉ từ 2 giờ. Ưu tiên điều phối shipper lấy ngay tận nơi.',
              price: 'Từ 22.000đ',
              badge: 'Nội thành 2H',
              bg: 'bg-amber-500/10 text-amber-700 border-amber-200',
            },
            {
              icon: Truck,
              title: 'Giao Chuẩn Standard',
              desc: 'Tối ưu chi phí cho cửa hàng online, cam kết giao đúng hẹn 24h - 48h trên 34 tỉnh thành.',
              price: 'Từ 16.500đ',
              badge: 'Tiết kiệm',
              bg: 'bg-blue-500/10 text-blue-700 border-blue-200',
            },
            {
              icon: Boxes,
              title: 'Vận Chuyển Hàng Nặng',
              desc: 'Chuyên tuyến kiện hàng lớn, cồng kềnh với mức giá chiết khấu riêng biệt theo khối lượng.',
              price: 'Chiết khấu 20%',
              badge: 'Cargo Freight',
              bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
            },
            {
              icon: DollarSign,
              title: 'Đối Soát COD 24/7',
              desc: 'Thu hộ COD minh bạch, không phí ẩn. Tiền về tài khoản tự động hoặc rút theo yêu cầu.',
              price: 'Miễn phí COD',
              badge: 'An toàn 100%',
              bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
            },
          ].map((svc, i) => (
            <article key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center border ${svc.bg}`}>
                    <svc.icon className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {svc.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{svc.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{svc.desc}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-extrabold text-blue-600">{svc.price}</span>
                <span className="text-slate-400 font-semibold flex items-center gap-1">Chi tiết <ChevronRight className="h-3 w-3" /></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Driver Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 relative space-y-5">
            <button
              onClick={closeApplyModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Đóng biểu mẫu ứng tuyển"
            >
              <X className="h-5 w-5" />
            </button>

            {applyStep === 'form' ? (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Đăng Ký Đối Tác Vận Chuyển</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Điền thông tin cá nhân. Bộ phận tuyển dụng sẽ liên hệ lại với bạn trong vòng 24 giờ.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="apply-name" className="block text-xs font-semibold text-slate-600 uppercase">Họ và tên</label>
                    <input
                      id="apply-name"
                      type="text"
                      required
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                      placeholder="Nguyễn Văn A..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="apply-phone" className="block text-xs font-semibold text-slate-600 uppercase">Số điện thoại</label>
                    <input
                      id="apply-phone"
                      type="tel"
                      required
                      value={applyPhone}
                      onChange={(e) => setApplyPhone(e.target.value)}
                      placeholder="0912345678..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition"
                >
                  Nộp Hồ Sơ Ứng Tuyển
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">Nộp hồ sơ thành công!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Cảm ơn đối tác **{applyName}** ({applyPhone}). Bộ phận tuyển dụng của Nexus Logistics sẽ liên hệ với bạn để hoàn tất thủ tục nhận việc.
                  </p>
                </div>
                <button
                  onClick={closeApplyModal}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition"
                >
                  Đóng cửa sổ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateOrderPage() {
  const { phone, user, token } = useAuthStore();
  const navigate = useNavigate();

  const [senderName, setSenderName] = useState(user?.displayName || 'Khách hàng');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderProvince, setSenderProvince] = useState('Thành phố Hồ Chí Minh');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverProvince, setReceiverProvince] = useState('Thành phố Hà Nội');

  const [cargoName, setCargoName] = useState('Kiện hàng quà tặng');
  const [cargoWeight, setCargoWeight] = useState(1);
  const [serviceType, setServiceType] = useState<'STANDARD' | 'EXPRESS'>('STANDARD');
  const [codAmount, setCodAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      setErrorMsg('Vui lòng điền đầy đủ thông tin người nhận (Tên, SĐT, Địa chỉ).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await shipmentApi.createShipment(token, {
        sender: {
          name: senderName.trim(),
          phone: phone,
          addressDetail: senderAddress.trim() || 'Địa chỉ người gửi',
          province: senderProvince,
        },
        receiver: {
          name: receiverName.trim(),
          phone: receiverPhone.trim(),
          addressDetail: receiverAddress.trim(),
          province: receiverProvince,
        },
        package: {
          itemName: cargoName.trim(),
          weightKg: cargoWeight,
          codAmount: codAmount,
        },
        service: {
          type: serviceType,
        },
        codAmount: codAmount,
        notes: notes.trim(),
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

  return (
    <div className="space-y-6 pb-12">
      {/* Title section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo Đơn Hàng Vận Chuyển Mới</h1>
          <p className="text-xs text-slate-500 font-medium">
            Dữ liệu tạo đơn được lưu 100% vào cơ sở dữ liệu và đồng bộ với hệ thống bưu tá & điều phối.
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

      {/* Two-Column split form */}
      <form onSubmit={handleCreateOrder} className="grid md:grid-cols-12 gap-6">
        {/* Left column (Sender/Receiver/Goods) */}
        <div className="md:col-span-7 space-y-5">
          <FormSection icon={<MapPin className="h-4 w-4" />} title="Thông tin người gửi">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tên người gửi" htmlFor="sender-name">
                <input
                  id="sender-name"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </Field>
              <Field label="Số điện thoại người gửi" htmlFor="sender-phone">
                <input
                  id="sender-phone"
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                  value={phone}
                  disabled
                />
              </Field>
              <Field label="Tỉnh / Thành phố gửi" htmlFor="sender-province">
                <select
                  id="sender-province"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={senderProvince}
                  onChange={(e) => setSenderProvince(e.target.value)}
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Địa chỉ lấy hàng chi tiết" htmlFor="sender-address">
                <input
                  id="sender-address"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  placeholder="Số nhà, tên đường..."
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<User className="h-4 w-4" />} title="Thông tin người nhận">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tên người nhận" required htmlFor="receiver-name">
                <input
                  id="receiver-name"
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  placeholder="Nhập họ tên người nhận..."
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                />
              </Field>
              <Field label="Số điện thoại người nhận" required htmlFor="receiver-phone">
                <input
                  id="receiver-phone"
                  type="tel"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  placeholder="09xx xxx xxx"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                />
              </Field>
              <Field label="Tỉnh / Thành phố nhận" htmlFor="receiver-province">
                <select
                  id="receiver-province"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={receiverProvince}
                  onChange={(e) => setReceiverProvince(e.target.value)}
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Địa chỉ giao hàng chi tiết" required htmlFor="receiver-address">
                <input
                  id="receiver-address"
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  placeholder="Số nhà, đường, phường/xã..."
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<Package className="h-4 w-4" />} title="Khai báo hàng hóa">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên hàng hóa" htmlFor="cargo-name">
                <input
                  id="cargo-name"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  placeholder="Quần áo, tài liệu..."
                  value={cargoName}
                  onChange={(e) => setCargoName(e.target.value)}
                />
              </Field>
              <Field label="Trọng lượng (kg)" htmlFor="cargo-weight">
                <input
                  id="cargo-weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(parseFloat(e.target.value) || 1)}
                />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Right column (Service & Cost) */}
        <div className="md:col-span-5 space-y-5">
          <FormSection icon={<Clock className="h-4 w-4" />} title="Gói dịch vụ & Ghi chú">
            <div className="space-y-3">
              <Field label="Phương thức vận chuyển" htmlFor="service-type">
                <select
                  id="service-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                >
                  <option value="STANDARD">Giao Chuẩn (Standard 24h - 48h)</option>
                  <option value="EXPRESS">Giao Hỏa Tốc (Same-day 2h - 6h)</option>
                </select>
              </Field>
              <Field label="Thu hộ COD" htmlFor="cod-amount">
                <div className="relative">
                  <input
                    id="cod-amount"
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600 pr-14"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
                </div>
              </Field>
              <Field label="Ghi chú vận chuyển" htmlFor="shipping-notes">
                <textarea
                  id="shipping-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-600 min-h-20 resize-none"
                  rows={3}
                  placeholder="Cho kiểm hàng, gọi trước khi giao..."
                />
              </Field>
            </div>
          </FormSection>

          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-md space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang khởi tạo...' : 'Xác Nhận Tạo Đơn Hàng'}
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
      <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  htmlFor,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className || ''}`}>
      <label htmlFor={htmlFor} className="block text-[11px] font-extrabold text-slate-700 uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function HistoryPage() {
  const { phone, token } = useAuthStore();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await shipmentApi.getShipments(token);
      setShipments(list);
    } catch {
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  if (!phone) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
        <div className="w-full bg-white p-8 text-center rounded-3xl border border-slate-200 shadow-md space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <Clock className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Lịch Sử Vận Đơn</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
              Vui lòng đăng nhập bằng số điện thoại để tra cứu lại lịch sử các đơn hàng bạn đã tạo trên hệ thống.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition"
          >
            Đăng Nhập Ngay
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lịch Sử Gửi Hàng & Vận Đơn</h1>
          <p className="text-xs text-slate-500 font-medium">
            Danh sách các đơn hàng thực tế đã tạo gắn liền với tài khoản {phone}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <RouterLink
            to="/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition shrink-0"
          >
            Tạo vận đơn mới
            <PlusCircle className="h-4 w-4" strokeWidth={2} />
          </RouterLink>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm font-semibold">
          Đang tải danh sách vận đơn từ cơ sở dữ liệu...
        </div>
      ) : shipments.length > 0 ? (
        <div className="space-y-3">
          {shipments.map((s) => {
            const receiverName =
              s.metadata?.receiver?.name || s.metadata?.recipientName || 'Người nhận';
            const receiverPhone =
              s.metadata?.receiver?.phone || s.metadata?.recipientPhone || '';
            const receiverAddr =
              s.metadata?.receiver?.addressDetail ||
              s.metadata?.receiver?.province ||
              '';

            return (
              <article
                key={s.id || s.code}
                className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-blue-300 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-mono font-bold text-xs">
                    <Package className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-mono">
                      Mã vận đơn #{s.code}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Người nhận: {receiverName} {receiverPhone ? `- ${receiverPhone}` : ''} {receiverAddr ? `(${receiverAddr})` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    {s.currentStatus || 'ĐANG XỬ LÝ'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium font-mono">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Chưa có vận đơn nào được tạo</p>
          <p className="text-xs text-slate-500">Các đơn hàng bạn tạo sẽ hiển thị tại đây theo thời gian thực.</p>
          <RouterLink
            to="/create"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition mt-2"
          >
            Tạo đơn ngay <ArrowRight className="w-3.5 h-3.5" />
          </RouterLink>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TrackingPage />} />
          <Route path="create" element={<CreateOrderPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
