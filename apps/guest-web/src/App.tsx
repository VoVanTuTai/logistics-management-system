import React, { useState } from 'react';
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
  Award,
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
  Star,
  Truck,
  User,
  X,
  Calculator,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Check,
  Building2,
  Navigation,
  Headphones,
  FileText,
  Shield,
  HelpCircle,
  TrendingUp,
  Boxes,
  Compass,
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';

const navItems = [
  { to: '/', icon: Search, label: 'Tra cứu & Cước phí' },
  { to: '/create', icon: PlusCircle, label: 'Tạo vận đơn' },
  { to: '/history', icon: Clock, label: 'Lịch sử giao dịch' },
];

const PROVINCES = [
  'Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Bình Dương',
  'Đồng Nai',
  'Cần Thơ',
  'Hải Phòng',
  'Quảng Ninh',
];

const OPS_HERO_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH9tY3PsZjp-XCnVG-y43-sPKhb-INEfJPNHYxHTVdm69WwoXvGDiw7DfuvmU5b3DHK_888jICATCwV5G1g3uvdjTPamNKyM8KJB2Ei4T4RBJ-M4US87urT0uP9tXDcCuNPz6FtF-nTa_G-XDYI2LyIsduJvHEffTuIOfqjWvAttJm8D15E5_GNR64ZxIKkl1kwxBKH-3LgX4daJfTkFTanBTrDiE0qwHwVdRRNZ_O-PizHz0CEsugBHSQU-6tzxan_Mxrdatluq8';
const OPS_WAREHOUSE_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNC6uIL7KHoh7W2_Pkpfr2OAR0nRihRxGZAL4zC5URhuoEz5Y6hi0nWoU1x7gNRGfdYrzVXRtzlhIPVTy-E8e-kOs_k_Ssvx_6OmD7N18opsNqGXRyNVjfHQPUShZG7zdauOX72ES5tAsiJTCmjYCEx0Oe7ZOAJdlWtYtqURR5s9tj9jTGI2XR4BYnGxntjxUrv7e506rSC37lQC5zPngQoU3Jyk_5Yh8ZU9xgF5W-58oLgW8PXR2VAwWadMSBVDZAj5eEkP_UdUw';

function Layout() {
  const { phone, logout } = useAuthStore();
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
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105">
        <Truck className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="block text-lg font-extrabold tracking-tight text-slate-900 leading-none">NEXUS</span>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700 leading-none uppercase">Logistics</span>
        </div>
        <span className="block text-[10px] font-semibold text-slate-500 mt-1 leading-none">Express Shipping Portal</span>
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
  icon: React.ComponentType<any>;
  label: string;
}) {
  return (
    <RouterNavLink
      to={to}
      end={to === '/'}
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
  
  // Tracking search state
  const [trackingCode, setTrackingCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<null | { code: string; status: string; currentLoc: string; updatedAt: string; steps: Array<{ title: string; time: string; done: boolean }> }>(null);
  
  // Fee Estimator State
  const [calcOrigin, setCalcOrigin] = useState('Hồ Chí Minh');
  const [calcDest, setCalcDest] = useState('Hà Nội');
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcService, setCalcService] = useState<'EXPRESS' | 'STANDARD' | 'CARGO'>('STANDARD');
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);

  const handleTrackingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setSearchResult({
        code: trackingCode.trim().toUpperCase(),
        status: 'Đang giao hàng cho người nhận',
        currentLoc: 'Bưu cục Quận 1 - Chuyên viên Nguyễn Văn B',
        updatedAt: '5 phút trước',
        steps: [
          { title: 'Tạo vận đơn thành công', time: '08:00 Hôm nay', done: true },
          { title: 'Đã lấy hàng & nhập kho Tân Bình', time: '10:30 Hôm nay', done: true },
          { title: 'Đang giao hàng cho người nhận', time: '13:15 Hôm nay', done: true },
          { title: 'Giao hàng thành công (Dự kiến)', time: 'Trong 2-4 giờ tới', done: false },
        ],
      });
    }, 400);
  };

  const handleCalculateFee = (e: React.FormEvent) => {
    e.preventDefault();
    const isSameProvince = calcOrigin === calcDest;
    const baseFee = isSameProvince ? 16500 : 32000;
    const weightFee = Math.max(0, calcWeight - 1) * (isSameProvince ? 3000 : 7000);
    const serviceMultiplier = calcService === 'EXPRESS' ? 1.4 : calcService === 'CARGO' ? 0.85 : 1.0;
    const total = Math.round((baseFee + weightFee) * serviceMultiplier);
    setEstimatedFee(total);
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
        {/* Authentic Ops-Web Background Overlay */}
        <img
          src={OPS_HERO_BG}
          alt="Trung Tâm Điều Phối Nexus Logistics"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-overlay transform scale-105 transition-transform duration-1000"
        />

        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/90 via-blue-600/80 to-indigo-800/70" />

        {/* Hero Main Content */}
        <div className="relative z-10 p-6 md:p-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-300 animate-pulse" />
            🟢 Mạng lưới 34 Tỉnh Thành Vận Hành 24/7
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2.5xl md:text-4xl lg:text-4.5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
              Tra Cứu Vận Đơn & Ước Tính Cước Phí Giao Hàng Toàn Quốc
            </h1>
            <p className="text-blue-50 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
              Theo dõi hành trình đơn hàng chính xác thời gian thực, ước tính chi phí minh bạch và đối soát COD 24/7 dành cho mọi cá nhân và chủ shop online.
            </p>
          </div>

          {/* Fresh Key Performance Indicators (Metrics Grid) */}
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
              <p className="text-base md:text-lg font-bold text-white mt-1">34 Tỉnh Thành</p>
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
              Tra Cứu Lộ Trình Vận Đơn
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">Nhập Mã Vận Đơn Để Xem Hành Trình</h2>
            <p className="text-xs text-slate-500 mt-1">
              Nhập mã vận đơn in trên phiếu gửi (ví dụ: <span className="font-mono font-bold text-blue-600">NX8829103</span>) để cập nhật vị trí thời gian thực.
            </p>
          </div>

          <form onSubmit={handleTrackingSearch} className="space-y-3">
            <div className="flex gap-2">
              <input
                id="tracking-input"
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Nhập mã vận đơn... (VD: NX8829103)"
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
              <span className="font-bold text-slate-700">Thử mã mẫu:</span>
              {['NX8829103', 'NX5519820', 'NX9920112'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setTrackingCode(code);
                    setIsSearching(true);
                    setTimeout(() => {
                      setIsSearching(false);
                      setSearchResult({
                        code,
                        status: 'Đang giao hàng cho người nhận',
                        currentLoc: 'Bưu cục Quận 1 - Chuyên viên Nguyễn Văn B',
                        updatedAt: 'Vừa xong',
                        steps: [
                          { title: 'Tạo vận đơn thành công', time: '08:00 Hôm nay', done: true },
                          { title: 'Đã nhập kho Hub Tân Bình', time: '10:30 Hôm nay', done: true },
                          { title: 'Đang giao hàng cho người nhận', time: '13:15 Hôm nay', done: true },
                          { title: 'Giao hàng thành công (Dự kiến)', time: 'Trong 2 giờ tới', done: false },
                        ],
                      });
                    }, 300);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono text-[11px] font-bold border border-blue-200 transition"
                >
                  {code}
                </button>
              ))}
            </div>
          </form>

          {/* Interactive Search Result Card */}
          {searchResult && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-5 space-y-4 animate-fadeIn shadow-sm">
              <div className="flex justify-between items-center border-b border-blue-200/80 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mã Vận Đơn</span>
                  <p className="font-extrabold text-base text-blue-900 font-mono">#{searchResult.code}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {searchResult.status}
                </span>
              </div>
              
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Vị trí hiện tại:</span> {searchResult.currentLoc}
              </p>

              {/* Progress Steps */}
              <div className="space-y-2 pt-1 border-t border-blue-200/60">
                <p className="text-[11px] font-bold uppercase text-slate-500">Hành Trình Vận Chuyển</p>
                <div className="space-y-2">
                  {searchResult.steps.map((st, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${st.done ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'}`} />
                      <span className={`flex-1 font-semibold ${st.done ? 'text-slate-800' : 'text-slate-400 font-normal'}`}>{st.title}</span>
                      <span className="text-[11px] text-slate-400">{st.time}</span>
                    </div>
                  ))}
                </div>
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
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition"
            >
              Tính Ngay Cước Phí
            </button>
          </form>

          {estimatedFee !== null && (
            <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Cước phí ước tính</p>
                  <p className="text-2xl font-extrabold text-blue-600">{estimatedFee.toLocaleString('vi-VN')} VNĐ</p>
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
              title: "Giao Hỏa Tốc Same-day",
              desc: "Giao nhận siêu tốc nội thành chỉ từ 2 giờ. Ưu tiên điều phối shipper lấy ngay tận nơi.",
              price: "Từ 22.000đ",
              badge: "Nội thành 2H",
              bg: "bg-amber-500/10 text-amber-700 border-amber-200",
            },
            {
              icon: Truck,
              title: "Giao Chuẩn Standard",
              desc: "Tối ưu chi phí cho cửa hàng online, cam kết giao đúng hẹn 24h - 48h trên 34 tỉnh thành.",
              price: "Từ 16.500đ",
              badge: "Tiết kiệm",
              bg: "bg-blue-500/10 text-blue-700 border-blue-200",
            },
            {
              icon: Boxes,
              title: "Vận Chuyển Hàng Nặng",
              desc: "Chuyên tuyến kiện hàng lớn, cồng kềnh với mức giá chiết khấu riêng biệt theo khối lượng.",
              price: "Chiết khấu 20%",
              badge: "Cargo Freight",
              bg: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
            },
            {
              icon: DollarSign,
              title: "Đối Soát COD 24/7",
              desc: "Thu hộ COD minh bạch, không phí ẩn. Tiền về tài khoản tự động hoặc rút theo yêu cầu.",
              price: "Miễn phí COD",
              badge: "An toàn 100%",
              bg: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
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

      {/* Interactive 4-Step Shipping Process Section */}
      <section className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm space-y-6" aria-label="Quy trình giao nhận 4 bước">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Quy trình đơn giản</span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">4 Bước Giao Nhận Hàng Hóa Nhanh Chóng</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Tạo Vận Đơn Online', desc: 'Xác thực số điện thoại OTP và nhập địa chỉ lấy/nhận hàng trong 1 phút.' },
            { step: '02', title: 'Shipper Lấy Hàng', desc: 'Tài xế chuyên nghiệp đến tận nhà lấy hàng hoàn toàn miễn phí.' },
            { step: '03', title: 'Phân Loại Kho Hub', desc: 'Hệ thống tự động điều phối hàng qua kho trung chuyển 34 tỉnh thành.' },
            { step: '04', title: 'Giao Hàng & Thu COD', desc: 'Giao tận tay người nhận, dòng tiền đối soát COD rút trực tiếp 24/7.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-2 relative">
              <span className="text-2xl font-black text-blue-300/80 font-mono">{item.step}</span>
              <h3 className="font-extrabold text-sm text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Driver & Partner Recruitment Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6" aria-label="Chương trình đối tác tuyển dụng">
        <img
          src={OPS_WAREHOUSE_BG}
          alt="Nexus Warehouse Operations"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-25 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/80 via-teal-700/80 to-blue-700/80" />

        <div className="relative z-10 space-y-3 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold border border-white/30 backdrop-blur-md">
            <Check className="h-3.5 w-3.5 text-amber-300" /> Tuyển Dụng Đối Tác Tài Xế Vận Chuyển
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Gia Nhập Đội Ngũ Giao Nhận Nexus</h2>
          <p className="text-xs md:text-sm text-emerald-50 leading-relaxed font-medium">
            Thu nhập hấp dẫn lên đến <span className="text-amber-300 font-extrabold text-base">15,000,000đ/tháng</span>, nhận đơn chủ động theo khu vực, hỗ trợ bảo hiểm tai nạn tự nguyện và trang bị đồng phục miễn phí.
          </p>
          <div className="flex flex-wrap gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-amber-300" /> Đăng ký nhanh 3 phút
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-amber-300" /> Nhận thưởng hiệu suất
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="relative z-10 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-4 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-400/25 transition shrink-0 flex items-center gap-2"
        >
          Ứng Tuyển Tài Xế Ngay
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </section>

      {/* SEO Structured FAQs Section */}
      <section className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm space-y-4" aria-label="Hỏi đáp thường gặp">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Giải đáp thắc mắc</span>
          <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3 mt-0.5">Câu Hỏi Thường Gặp (FAQs)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              q: 'Khách hàng có cần tạo tài khoản để tra cứu không?',
              a: 'Không cần. Khách hàng có thể nhập trực tiếp mã vận đơn để kiểm tra lộ trình thực tế 34 tỉnh thành mọi lúc.',
            },
            {
              q: 'Cần làm gì để gửi hàng và tạo vận đơn mới?',
              a: 'Bạn chỉ cần nhập số điện thoại để nhận mã xác thực OTP đơn giản, sau đó điền địa chỉ người nhận.',
            },
            {
              q: 'Nexus hỗ trợ thanh toán COD như thế nào?',
              a: 'Tiền thu hộ COD được ghi nhận tự động vào hệ thống và chuyển khoản đối soát linh hoạt theo chu kỳ đăng ký.',
            },
          ].map((faq, i) => (
            <article key={i} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
              <h3 className="text-xs font-bold text-blue-700">{faq.q}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{faq.a}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Semantic SEO Footer */}
      <footer className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 text-slate-600 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-3">
            <BrandMark />
            <p className="text-slate-500 leading-relaxed font-medium">
              Hệ thống quản lý & điều phối vận chuyển hàng hóa công nghệ cao trên 34 tỉnh thành Việt Nam.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Bưu Cục Trung Chuyển</h4>
            <ul className="space-y-1.5 text-slate-500 font-medium">
              <li>TP. Hồ Chí Minh: Kho Hub Tân Bình</li>
              <li>Hà Nội: Kho Hub Long Biên</li>
              <li>Đà Nẵng: Kho Hub Hải Châu</li>
              <li>Mạng lưới 34 Tỉnh Thành</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Dịch Vụ Nổi Bật</h4>
            <ul className="space-y-1.5 text-slate-500 font-medium">
              <li>Giao Hỏa Tốc Same-day 2H</li>
              <li>Giao Chuẩn Standard 24H</li>
              <li>Vận Chuyển Hàng Nặng Cargo</li>
              <li>Dịch Vụ Thu Hộ COD 24/7</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Liên Hệ & Hỗ Trợ</h4>
            <p className="font-bold text-blue-600 text-sm">Hotline: 1900 0000</p>
            <p className="text-slate-500 font-medium">Email: support@nexuslogistics.vn</p>
            <p className="text-slate-500 font-medium">Thời gian: 07:00 - 22:00 hàng ngày</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-400 font-medium">
          <p>© 2026 NEXUS Logistics System. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-blue-600">Điều khoản sử dụng</a>
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-blue-600">Chính sách bảo mật</a>
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-blue-600">Quy định bồi thường</a>
          </div>
        </div>
      </footer>

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
                      onChange={e => setApplyName(e.target.value)}
                      placeholder="Nguyễn Văn A..."
                      className="logistics-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="apply-phone" className="block text-xs font-semibold text-slate-600 uppercase">Số điện thoại</label>
                    <input
                      id="apply-phone"
                      type="tel"
                      required
                      value={applyPhone}
                      onChange={e => setApplyPhone(e.target.value)}
                      placeholder="0912345678..."
                      className="logistics-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="apply-vehicle" className="block text-xs font-semibold text-slate-600 uppercase">Phương tiện</label>
                      <select id="apply-vehicle" className="logistics-input bg-white">
                        <option value="MOTORBIKE">Xe máy</option>
                        <option value="TRUCK">Xe tải nhỏ</option>
                        <option value="ELECTRIC_BIKE">Xe máy điện</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="apply-region" className="block text-xs font-semibold text-slate-600 uppercase">Khu vực hoạt động</label>
                      <select id="apply-region" className="logistics-input bg-white">
                        <option value="HCM">Hồ Chí Minh</option>
                        <option value="HN">Hà Nội</option>
                        <option value="DN">Đà Nẵng</option>
                        <option value="OTHER">Khu vực khác</option>
                      </select>
                    </div>
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
  const { phone } = useAuthStore();
  const navigate = useNavigate();

  if (!phone) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
        <div className="w-full bg-white p-8 text-center rounded-3xl border border-slate-200 shadow-md space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <PlusCircle className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Tạo Vận Đơn Mới</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
              Vui lòng xác thực số điện thoại để khởi tạo và lưu danh sách vận đơn gửi nhận của bạn.
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
      {/* Title section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tạo Đơn Hàng Vận Chuyển Mới</h1>
          <p className="text-xs text-slate-500 font-medium">
            Điền đầy đủ thông tin điểm lấy hàng, người nhận và kiểm kê khối lượng.
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-3.5 py-2 flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-600">Tài khoản:</span>
          <span className="font-mono font-bold text-blue-700 text-sm">{phone}</span>
        </div>
      </div>

      {/* Two-Column split form */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left column (Sender/Receiver/Goods) */}
        <div className="md:col-span-7 space-y-5">
          <FormSection icon={<MapPin className="h-4 w-4" />} title="Thông tin người gửi">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tên người gửi" htmlFor="sender-name">
                <input id="sender-name" type="text" className="logistics-input" defaultValue="Khách hàng" />
              </Field>
              <Field label="Số điện thoại người gửi" htmlFor="sender-phone">
                <input id="sender-phone" type="tel" className="logistics-input bg-slate-100 font-semibold" value={phone} disabled />
              </Field>
              <Field label="Địa chỉ lấy hàng" htmlFor="sender-address" className="md:col-span-2">
                <input id="sender-address" type="text" className="logistics-input" placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<User className="h-4 w-4" />} title="Thông tin người nhận">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tên người nhận" required htmlFor="receiver-name">
                <input id="receiver-name" type="text" className="logistics-input" placeholder="Nhập họ tên người nhận..." />
              </Field>
              <Field label="Số điện thoại người nhận" required htmlFor="receiver-phone">
                <input id="receiver-phone" type="tel" className="logistics-input" placeholder="09xx xxx xxx" />
              </Field>
              <Field label="Địa chỉ giao hàng" required htmlFor="receiver-address" className="md:col-span-2">
                <input id="receiver-address" type="text" className="logistics-input" placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<Package className="h-4 w-4" />} title="Khai báo hàng hóa">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên hàng hóa" htmlFor="cargo-name" className="col-span-2 md:col-span-1">
                <input id="cargo-name" type="text" className="logistics-input" placeholder="Quần áo, mỹ phẩm, hồ sơ..." />
              </Field>
              <Field label="Trọng lượng (kg)" htmlFor="cargo-weight" className="col-span-2 md:col-span-1">
                <input id="cargo-weight" type="number" step="0.1" className="logistics-input" placeholder="0.5" />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Right column (Service & Cost) */}
        <div className="md:col-span-5 space-y-5">
          <FormSection icon={<Clock className="h-4 w-4" />} title="Gói dịch vụ & Ghi chú">
            <div className="space-y-3">
              <Field label="Phương thức vận chuyển" htmlFor="service-type">
                <select id="service-type" className="logistics-input bg-white">
                  <option value="STANDARD">Giao Chuẩn (Standard 24h)</option>
                  <option value="EXPRESS">Giao Hỏa Tốc (Same-day 2h)</option>
                </select>
              </Field>
              <Field label="Thu hộ COD" htmlFor="cod-amount">
                <div className="relative">
                  <input id="cod-amount" type="number" className="logistics-input pr-14" placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
                </div>
              </Field>
              <Field label="Ghi chú vận chuyển" htmlFor="shipping-notes">
                <textarea id="shipping-notes" className="logistics-input min-h-20 resize-none" rows={3} placeholder="Cho thử hàng, gọi điện trước khi giao..." />
              </Field>
            </div>
          </FormSection>

          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TỔNG CƯỚC DỰ KIẾN</p>
                <p className="text-2xl font-extrabold text-blue-600 mt-0.5">22.000 VNĐ</p>
              </div>
              <div className="text-right text-[11px] text-slate-500 font-medium">
                Đã bao gồm phụ phí <br /> & bảo hiểm hàng hóa
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition">
              Xác Nhận Tạo Đơn Hàng
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

      </div>
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
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm space-y-4">
      <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
        <span className="text-blue-600">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  htmlFor,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label 
        htmlFor={htmlFor}
        className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
      >
        {label} {required ? <span className="text-red-500 font-bold">*</span> : null}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function HistoryPage() {
  const { phone } = useAuthStore();
  const navigate = useNavigate();

  if (!phone) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
        <div className="w-full bg-white p-8 text-center rounded-3xl border border-slate-200 shadow-md space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Clock className="h-7 w-7" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Lịch Sử Vận Đơn</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
              Vui lòng đăng nhập bằng số điện thoại để tra cứu lại lịch sử các đơn hàng bạn đã tạo.
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
          <p className="text-xs text-slate-500 font-medium">Danh sách các vận đơn đã tạo gắn liền với số điện thoại {phone}.</p>
        </div>
        <RouterLink
          to="/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition shrink-0"
        >
          Tạo vận đơn mới
          <PlusCircle className="h-4 w-4" strokeWidth={2} />
        </RouterLink>
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <article key={i} className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-blue-300 transition">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-mono font-bold text-xs">
                #{i}23
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-mono">Mã vận đơn #NX882910{i}</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Người nhận: Nguyễn Văn A - 098765432{i} (Hồ Chí Minh)</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 md:justify-end">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                Đang giao hàng
              </span>
              <span className="text-xs text-slate-400 font-medium">14:30 Hôm nay</span>
            </div>
          </article>
        ))}
      </div>
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
