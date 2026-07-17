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
} from 'lucide-react';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';

const navItems = [
  { to: '/', icon: Search, label: 'Tra cứu' },
  { to: '/create', icon: PlusCircle, label: 'Tạo đơn' },
  { to: '/history', icon: Clock, label: 'Lịch sử' },
];

const serviceCards = [
  {
    icon: Truck,
    title: 'Giao hàng toàn quốc',
    description: 'Kết nối tuyến nội thành, liên tỉnh và thu hộ COD với sự bảo chứng chuyên nghiệp tối đa.',
  },
  {
    icon: ShieldCheck,
    title: 'Theo dõi minh bạch',
    description: 'Giám sát hành trình đơn hàng theo thời gian thực thông qua hệ thống định vị thông minh.',
  },
  {
    icon: Clock,
    title: 'Tạo đơn nhanh',
    description: 'Liên kết số điện thoại cá nhân để bảo mật thông tin gửi hàng và truy xuất lịch sử giao dịch.',
  },
];

const processSteps = [
  'Nhập mã vận đơn để thực hiện việc tra cứu trạng thái giao nhận.',
  'Đăng nhập qua mã OTP di động để xác thực tài khoản và bảo mật lịch sử.',
  'Cung cấp thông tin địa điểm gửi, nhận cùng giá trị ký gửi COD.',
  'Hệ thống tiếp nhận, điều phối chuyên viên vận chuyển cao cấp hành trình đơn.',
];

const testimonials = [
  {
    quote: "Từ ngày gửi hàng tại Nexus L'Express, tỷ lệ giao thành công của shop tôi tăng lên 98.5%. Khách hàng luôn phản hồi rất tốt về thái độ lịch thiệp của shipper.",
    author: "Minh Thư",
    role: "Chủ hãng mỹ phẩm HER",
    stars: 5,
  },
  {
    quote: "Dịch vụ COD đối soát vô cùng nhanh chóng, dòng tiền về tài khoản đúng lịch hẹn 3 lần/tuần. Giao diện tạo đơn trực quan, dễ quản lý trên điện thoại.",
    author: "Hoàng Nam",
    role: "Founder chuỗi đồ da LÉON",
    stars: 5,
  },
];

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
    <div className="h-screen w-screen md:overflow-hidden bg-[#F3F6FA] text-[#0F172A] font-sans antialiased flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#E2EAF4] bg-white/90 backdrop-blur md:hidden shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <BrandMark />
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#0C3E8A]/20 bg-transparent text-[#0C3E8A] shadow-sm transition-all duration-300 hover:border-[#0C3E8A] hover:bg-[#0C3E8A]/5"
            onClick={handleAuthClick}
            aria-label={phone ? 'Đăng xuất tài khoản' : 'Đăng nhập tài khoản'}
          >
            {phone ? <LogOut className="h-5 w-5" strokeWidth={1.5} /> : <User className="h-5 w-5" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E2EAF4] bg-white/95 shadow-[0_-8px_32px_rgba(12,35,64,0.04)] backdrop-blur md:bottom-auto md:right-auto md:top-0 md:h-screen md:w-80 md:border-r md:border-t-0 md:shadow-none md:relative md:shrink-0 flex flex-col justify-between">
        <div>
          <div className="hidden px-8 pb-6 pt-10 md:block">
            <BrandMark />
            <p className="mt-4 text-xs leading-relaxed text-[#5A6E85] font-light">
              Cổng ký gửi vận đơn và tra cứu hành trình cao cấp dành cho khách hàng của Nexus L'Express.
            </p>
          </div>

          <nav className="mx-auto flex max-w-md items-center justify-around gap-1 px-3 py-3 md:mx-0 md:max-w-none md:flex-col md:items-stretch md:px-6 md:py-6 md:gap-2" aria-label="Main Navigation">
            {navItems.map((item) => (
              <GuestNavLink key={item.to} {...item} />
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="hidden px-6 pb-8 md:block">
          <div className="mb-4 rounded-2xl border border-[#0C3E8A]/10 bg-[#E9F1FC] p-4.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4A607A]">Hotline Concierge</p>
            <a className="mt-2 flex items-center gap-2.5 font-serif-luxury text-lg font-medium text-[#0C3E8A] transition-colors hover:text-[#0052CC]" href="tel:19000000" aria-label="Gọi điện đến hotline hỗ trợ">
              <Phone className="h-4.5 w-4.5 text-[#0C3E8A]" strokeWidth={1.5} />
              1900 0000
            </a>
          </div>
          <button
            onClick={handleAuthClick}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              phone
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] text-white hover:brightness-110 shadow-md shadow-[#0C3E8A]/15'
            }`}
          >
            {phone ? <LogOut className="h-4 w-4" strokeWidth={1.5} /> : <User className="h-4 w-4" strokeWidth={1.5} />}
            {phone ? 'Đăng xuất' : 'Đăng nhập'}
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className={`w-full h-[calc(100vh-73px)] md:h-screen overflow-y-auto md:overflow-hidden md:relative flex flex-col ${isLoginPage ? '' : 'px-4 py-4 md:px-10 md:py-8'}`}>
        <Outlet />
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <RouterLink to="/" className="flex items-center gap-3.5 group" aria-label="Trang chủ Nexus Logistics">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0C3E8A] to-[#0052CC] text-white shadow-md transition-transform duration-500 group-hover:scale-105">
        <Package className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <div>
        <span className="block text-xl font-medium tracking-[0.05em] text-[#0C3E8A] font-serif-luxury leading-none">NEXUS</span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.35em] text-[#4A607A] mt-1.5 leading-none">L'Express</span>
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
          'flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-2.5 py-2.5 text-[11px] font-medium tracking-wide transition-all duration-300 md:min-w-0 md:flex-row md:gap-3.5 md:px-5 md:py-3.5 md:text-sm',
          isActive
            ? 'bg-gradient-to-r from-[#0C3E8A]/10 to-[#0052CC]/5 text-[#0C3E8A] border border-[#0C3E8A]/20 shadow-[0_0_15px_rgba(12,62,138,0.05)] font-semibold'
            : 'text-[#5A6E85] border border-transparent hover:text-[#0F172A] hover:bg-white/50',
        ].join(' ')
      }
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <span>{label}</span>
    </RouterNavLink>
  );
}

function TrackingPage() {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyStep, setApplyStep] = useState<'form' | 'success'>('form');
  const [applyName, setApplyName] = useState('');
  const [applyPhone, setApplyPhone] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'recruitment'>('services');

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
    <div className="h-full flex flex-col md:grid md:grid-cols-[1.15fr_0.85fr] gap-6 overflow-y-auto md:overflow-hidden">
      
      {/* Left Column (Hero & Switchable Dashboard) */}
      <div className="flex flex-col justify-between gap-5 md:h-full md:overflow-y-auto md:pr-2 scrollbar-thin pb-4">
        
        {/* Compact Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#0C3E8A]/30 bg-[#0C3E8A]/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#0C3E8A] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Hệ thống giao nhận thế hệ mới
          </div>
          <h1 className="text-3xl lg:text-4.5xl font-light leading-tight tracking-tight text-[#0F172A] font-serif-luxury">
            Vận chuyển thượng lưu & <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#0C3E8A] to-[#0052CC]">Hợp tác thịnh vượng</span>
          </h1>
          <p className="text-sm leading-relaxed text-[#5A6E85] font-light max-w-xl">
            Chuẩn mực giao nhận 5 sao: tốc độ vượt trội cho chủ shop, thu nhập bứt phá cho đối tác tài xế. Ký gửi đơn hàng nhanh hoặc đăng ký đồng hành ngay hôm nay.
          </p>
        </div>

        {/* Tab Switcher for Sales Perks vs Driver Recruitment */}
        <div className="flex flex-col flex-1 min-h-[320px] bg-white rounded-2xl border border-[#E2EAF4] p-5 shadow-sm space-y-4">
          <div className="flex border-b border-[#E2EAF4] pb-2">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 ${
                activeTab === 'services'
                  ? 'border-[#0C3E8A] text-[#0C3E8A]'
                  : 'border-transparent text-[#5A6E85] hover:text-[#0F172A]'
              }`}
            >
              Đặc quyền gửi hàng
            </button>
            <button
              onClick={() => setActiveTab('recruitment')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 ${
                activeTab === 'recruitment'
                  ? 'border-[#0C3E8A] text-[#0C3E8A]'
                  : 'border-transparent text-[#5A6E85] hover:text-[#0F172A]'
              }`}
            >
              Hợp tác tài xế (Tuyển dụng)
            </button>
          </div>

          <div className="flex-1">
            {activeTab === 'services' ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 h-full">
                {[
                  {
                    icon: Clock,
                    title: "Tốc độ cam kết",
                    desc: "Giao nội thành chỉ từ 2 giờ hỏa tốc, liên tỉnh siêu tốc trong 24 giờ."
                  },
                  {
                    icon: Award,
                    title: "Bảo hiểm toàn phần",
                    desc: "Cam kết bồi thường bồi hoàn 100% giá trị hàng hóa ký gửi xảy ra sự cố."
                  },
                  {
                    icon: DollarSign,
                    title: "Đối soát COD 24h",
                    desc: "Đối soát COD định kỳ 3 lần mỗi tuần hoặc rút linh hoạt sau 24h nhận đơn."
                  },
                  {
                    icon: Star,
                    title: "Chuyên viên 5 sao",
                    desc: "Đội ngũ shipper đào tạo bài bản, lịch thiệp, phục vụ chu đáo."
                  }
                ].map((benefit, i) => (
                  <div key={i} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2EAF4] flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0C3E8A]/10 text-[#0C3E8A]">
                      <benefit.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                    </span>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-[#0F172A]">{benefit.title}</h3>
                      <p className="text-[11px] text-[#5A6E85] leading-relaxed font-light">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-5 items-center justify-between h-full">
                <div className="space-y-4 flex-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                    Thu nhập bứt phá
                  </div>
                  <h3 className="text-xl font-medium font-serif-luxury text-[#0F172A]">Gia nhập đội ngũ tài xế Nexus</h3>
                  <div className="space-y-2">
                    {[
                      "Thu nhập hấp dẫn tới 15,000,000đ/tháng",
                      "Bảo hiểm tai nạn tự nguyện miễn phí",
                      "Trang bị đồng phục & thùng hàng cao cấp",
                      "Đăng ký thủ tục nhận việc nhanh chóng"
                    ].map((perk) => (
                      <div key={perk} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2} />
                        <span className="text-xs text-[#0F172A] font-medium">{perk}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsApplyModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:brightness-110 shadow-md transition-all duration-300"
                  >
                    Ứng tuyển ngay
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>

                <div className="w-full sm:w-64 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2EAF4] space-y-3">
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-[0.05em]">Quy trình 3 bước</h4>
                  <div className="space-y-2.5">
                    {[
                      { step: "1", text: "Đăng ký biểu mẫu online" },
                      { step: "2", text: "Phỏng vấn nhận việc" },
                      { step: "3", text: "Nhận đơn tăng thu nhập" }
                    ].map((step, idx) => (
                      <div key={idx} className="flex gap-2.5 items-center">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#0C3E8A] text-white text-[10px] font-bold">
                          {step.step}
                        </span>
                        <span className="text-xs text-[#5A6E85] font-light">{step.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Testimonials Banner (Compact) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white/80 p-4 rounded-xl border border-[#E2EAF4] shadow-sm flex flex-col justify-between space-y-2">
              <p className="text-xs italic leading-relaxed text-[#5A6E85] font-light">"{t.quote}"</p>
              <div className="flex justify-between items-center pt-2 border-t border-[#E2EAF4]/60">
                <span className="text-[11px] font-bold text-[#0F172A]">{t.author} — <span className="font-light text-[#5A6E85]">{t.role}</span></span>
                <div className="flex gap-0.5 text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column (Tracking Lookup & FAQs - Constrained height) */}
      <div className="flex flex-col gap-5 md:h-full md:overflow-hidden pb-4">
        
        {/* Tracking Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2EAF4] shadow-sm space-y-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0C3E8A]">Tra cứu đơn hàng</p>
              <h2 className="text-xl font-medium font-serif-luxury text-[#0F172A]">Nhập mã vận đơn</h2>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0C3E8A]/10 text-[#0C3E8A]">
              <Search className="h-4.5 w-4.5" strokeWidth={1.5} />
            </span>
          </div>

          <div className="space-y-3.5">
            <input
              id="tracking-code"
              type="text"
              className="w-full rounded-xl border border-[#E2EAF4] bg-[#F8FAFC] px-4 py-3 text-base font-semibold uppercase tracking-widest text-[#0F172A] outline-none transition duration-300 placeholder:normal-case placeholder:font-light placeholder:tracking-normal focus:border-[#0C3E8A] focus:ring-1 focus:ring-[#0C3E8A]/20"
              placeholder="Ví dụ: NX123456789"
            />
            <button 
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:brightness-110 shadow-sm transition-all duration-300"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
              Tra cứu hành trình
            </button>
          </div>
          
          <div className="rounded-xl bg-[#E9F1FC] p-3 text-[11px] leading-relaxed text-[#5A6E85] font-light">
            Mã vận đơn (ví dụ: NX123456789) nằm trên phiếu gửi hàng. Hãy điền liền mạch không dấu cách.
          </div>
        </div>

        {/* FAQs list (Scrollable) */}
        <div className="flex-1 bg-white p-5 rounded-2xl border border-[#E2EAF4] shadow-sm flex flex-col md:overflow-hidden min-h-[220px]">
          <h2 className="text-base font-medium font-serif-luxury text-[#0F172A] border-b border-[#E2EAF4] pb-2.5 shrink-0">Hỏi đáp nhanh</h2>
          <div className="flex-1 md:overflow-y-auto pr-1 mt-3 space-y-3.5 scrollbar-thin">
            {[
              ['Khách vãng lai cần tài khoản không?', 'Qúy khách có thể tra cứu lộ trình tự do. Để tạo đơn hàng mới và lưu lịch sử giao dịch, hệ thống yêu cầu xác thực bằng số điện thoại di động.'],
              ['Có thu hộ COD không?', 'Có. Biểu mẫu tạo đơn có tích hợp tùy chọn tiền thu hộ (COD) bảo mật, rút tiền linh hoạt.'],
              ['Có thể sử dụng trên điện thoại không?', 'Hoàn toàn được. Giao diện thiết kế co giãn chuẩn mực trên tất cả thiết bị di động, tablet và máy tính cá nhân.'],
            ].map(([question, answer]) => (
              <article key={question} className="space-y-1">
                <h3 className="text-xs font-bold text-[#0C3E8A]">{question}</h3>
                <p className="text-[11px] leading-relaxed text-[#5A6E85] font-light">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Courier Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-7 md:p-9 shadow-2xl border border-blue-100 relative space-y-6">
            <button
              onClick={closeApplyModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Đóng biểu mẫu"
            >
              <X className="h-5 w-5" />
            </button>

            {applyStep === 'form' ? (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                <div className="space-y-2">
                  <h3 className="text-2.5xl font-light font-serif-luxury text-[#0F172A]">Ứng tuyển Đối tác Vận chuyển</h3>
                  <p className="text-xs text-[#5A6E85] font-light leading-relaxed">
                    Vui lòng hoàn tất thông tin cơ bản dưới đây. Bộ phận Tuyển dụng sẽ chủ động liên hệ trực tiếp trao đổi với quý đối tác trong vòng 24 giờ.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="apply-name" className="block text-xs font-semibold uppercase tracking-[0.05em] text-[#5A6E85]">Họ và tên</label>
                    <input
                      id="apply-name"
                      type="text"
                      required
                      value={applyName}
                      onChange={e => setApplyName(e.target.value)}
                      placeholder="Nhập đầy đủ họ tên..."
                      className="guest-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="apply-phone" className="block text-xs font-semibold uppercase tracking-[0.05em] text-[#5A6E85]">Số điện thoại</label>
                    <input
                      id="apply-phone"
                      type="tel"
                      required
                      value={applyPhone}
                      onChange={e => setApplyPhone(e.target.value)}
                      placeholder="Nhập số điện thoại di động..."
                      className="guest-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="apply-vehicle" className="block text-xs font-semibold uppercase tracking-[0.05em] text-[#5A6E85]">Phương tiện</label>
                      <select id="apply-vehicle" className="guest-input bg-white text-[#0F172A]">
                        <option value="MOTORBIKE">Xe máy</option>
                        <option value="TRUCK">Xe tải nhỏ</option>
                        <option value="ELECTRIC_BIKE">Xe máy điện</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="apply-region" className="block text-xs font-semibold uppercase tracking-[0.05em] text-[#5A6E85]">Khu vực hoạt động</label>
                      <select id="apply-region" className="guest-input bg-white text-[#0F172A]">
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
                  className="w-full bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#0C3E8A]/15 transition-all duration-300"
                >
                  Nộp hồ sơ ứng tuyển
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-light font-serif-luxury text-[#0F172A]">Nộp hồ sơ thành công!</h3>
                  <p className="text-xs text-[#5A6E85] font-light leading-relaxed max-w-sm mx-auto">
                    Cảm ơn quý đối tác **{applyName}** ({applyPhone}) đã gửi thông tin. Chuyên viên Nhân sự Tuyển dụng của Nexus L'Express sẽ sớm liên hệ với bạn để hẹn lịch phỏng vấn và nhận đồng phục.
                  </p>
                </div>
                <button
                  onClick={closeApplyModal}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
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
      <div className="mx-auto flex min-h-[75vh] max-w-2xl items-center px-4">
        <div className="w-full luxury-glass p-8 md:p-12 text-center rounded-2.5xl border border-[#E2EAF4] luxury-shadow">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0C3E8A]/10 text-[#0C3E8A]">
            <PlusCircle className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-3xl font-light font-serif-luxury text-[#0F172A]">Tạo vận đơn mới</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#5A6E85] font-light">
            Vui lòng xác thực số điện thoại di động để Nexus L'Express thiết lập và bảo vệ dữ liệu gửi nhận của quý khách.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:brightness-110 shadow-lg shadow-[#0C3E8A]/15 transition-all duration-300"
          >
            Đăng nhập ngay
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:overflow-hidden pb-4">
      {/* Title section (static) */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0C3E8A]">Khởi tạo vận đơn</p>
          <h1 className="text-2.5xl font-light font-serif-luxury text-[#0F172A]">Tạo đơn hàng mới</h1>
          <p className="text-xs text-[#5A6E85] font-light">
            Vui lòng điền chi tiết thông tin các điểm giao nhận và kiểm kê hàng hóa.
          </p>
        </div>
        <div className="rounded-xl border border-[#0C3E8A]/20 bg-[#E9F1FC] px-4 py-2 flex flex-col shrink-0 min-w-36">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#5A6E85]">Số điện thoại liên kết</p>
          <p className="mt-0.5 font-serif-luxury font-medium text-[#0C3E8A] text-base leading-none">{phone}</p>
        </div>
      </div>

      {/* Two-Column split form */}
      <div className="flex-1 grid md:grid-cols-[1.1fr_0.9fr] gap-6 md:overflow-hidden">
        
        {/* Left column - Scrollable Inputs (Sender/Receiver/Goods) */}
        <div className="md:overflow-y-auto pr-3 space-y-5 scrollbar-thin">
          <FormSection icon={<MapPin className="h-4.5 w-4.5" />} title="Thông tin gửi hàng" tone="text-[#0C3E8A]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tên người gửi" htmlFor="sender-name">
                <input id="sender-name" type="text" className="guest-input" defaultValue="Khách hàng" />
              </Field>
              <Field label="Số điện thoại người gửi" htmlFor="sender-phone">
                <input id="sender-phone" type="tel" className="guest-input bg-[#F8FAFC] font-medium" value={phone} disabled />
              </Field>
              <Field label="Địa chỉ lấy hàng" htmlFor="sender-address" className="md:col-span-2">
                <input id="sender-address" type="text" className="guest-input" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<User className="h-4.5 w-4.5" />} title="Thông tin người nhận" tone="text-[#0C3E8A]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tên người nhận" required htmlFor="receiver-name">
                <input id="receiver-name" type="text" className="guest-input" placeholder="Nhập tên người nhận..." />
              </Field>
              <Field label="Số điện thoại người nhận" required htmlFor="receiver-phone">
                <input id="receiver-phone" type="tel" className="guest-input" placeholder="Nhập số điện thoại..." />
              </Field>
              <Field label="Địa chỉ giao hàng" required htmlFor="receiver-address" className="md:col-span-2">
                <input id="receiver-address" type="text" className="guest-input" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={<Package className="h-4.5 w-4.5" />} title="Khai báo hàng hóa" tone="text-[#0C3E8A]">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên/Loại hàng hóa" htmlFor="cargo-name" className="col-span-2 md:col-span-1">
                <input id="cargo-name" type="text" className="guest-input" placeholder="Quần áo, tài liệu, linh kiện..." />
              </Field>
              <Field label="Trọng lượng (kg)" htmlFor="cargo-weight" className="col-span-2 md:col-span-1">
                <input id="cargo-weight" type="number" step="0.1" className="guest-input" placeholder="0.5" />
              </Field>
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <Field label="Dài (cm)" htmlFor="cargo-length" compact>
                  <input id="cargo-length" type="number" className="guest-input px-3" placeholder="0" />
                </Field>
                <Field label="Rộng (cm)" htmlFor="cargo-width" compact>
                  <input id="cargo-width" type="number" className="guest-input px-3" placeholder="0" />
                </Field>
                <Field label="Cao (cm)" htmlFor="cargo-height" compact>
                  <input id="cargo-height" type="number" className="guest-input px-3" placeholder="0" />
                </Field>
              </div>
            </div>
          </FormSection>
        </div>

        {/* Right column - Service & Final pricing details */}
        <div className="space-y-5 flex flex-col justify-between md:h-full">
          <FormSection icon={<Clock className="h-4.5 w-4.5" />} title="Dịch vụ & Ghi chú" tone="text-[#0C3E8A]">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Phương thức vận chuyển" htmlFor="service-type">
                <select id="service-type" className="guest-input bg-white text-[#0F172A]">
                  <option value="STANDARD">Giao chuẩn (Standard)</option>
                  <option value="EXPRESS">Giao nhanh (Express)</option>
                  <option value="SAME_DAY">Giao hỏa tốc (Same Day)</option>
                </select>
              </Field>
              <Field label="Thu hộ COD" htmlFor="cod-amount">
                <div className="relative">
                  <input id="cod-amount" type="number" className="guest-input pr-16" placeholder="0" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5A6E85]">VNĐ</span>
                </div>
              </Field>
              <Field label="Ghi chú vận chuyển" htmlFor="shipping-notes">
                <textarea id="shipping-notes" className="guest-input min-h-20 resize-none" rows={3} placeholder="Cho phép xem hàng, gọi điện trước khi giao..." />
              </Field>
            </div>
          </FormSection>

          {/* Sticky cost calculator panel */}
          <div className="rounded-2xl border border-[#0C3E8A]/10 bg-white p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2EAF4] pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5A6E85]">Cước phí dự kiến</p>
                <p className="text-3xl font-light font-serif-luxury text-[#0C3E8A] mt-0.5">0 VNĐ</p>
              </div>
              <div className="text-right text-[11px] text-[#5A6E85] font-light">
                Chưa bao gồm VAT <br /> & phụ phí vùng sâu
              </div>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] py-4 text-xs font-bold uppercase tracking-widest text-white hover:brightness-110 shadow-md shadow-[#0C3E8A]/10 transition-all duration-300">
              Tạo đơn hàng ký gửi
              <ChevronRight className="h-4.5 w-4.5" strokeWidth={2} />
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
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E2EAF4] bg-white p-5 shadow-sm space-y-4">
      <h2 className="flex items-center gap-3 border-b border-[#E2EAF4] pb-3 text-base font-semibold font-serif-luxury text-[#0F172A]">
        <span className={tone}>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  compact,
  htmlFor,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  compact?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label 
        htmlFor={htmlFor}
        className={`block ${compact ? 'text-[11px]' : 'text-xs'} font-semibold uppercase tracking-[0.05em] text-[#5A6E85]`}
      >
        {label} {required ? <span className="text-red-500 font-bold">*</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function HistoryPage() {
  const { phone } = useAuthStore();
  const navigate = useNavigate();

  if (!phone) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-2xl items-center px-4">
        <div className="w-full luxury-glass p-8 md:p-12 text-center rounded-2.5xl border border-[#E2EAF4] luxury-shadow">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0C3E8A]/10 text-[#0C3E8A]">
            <Clock className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-3xl font-light font-serif-luxury text-[#0F172A]">Lịch sử ký gửi</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#5A6E85] font-light">
            Vui lòng đăng nhập bằng điện thoại để xem lại danh sách đơn hàng đã tạo bằng số điện thoại của quý khách.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:brightness-110 shadow-lg shadow-[#0C3E8A]/15 transition-all duration-300"
          >
            Đăng nhập ngay
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:overflow-hidden pb-4">
      {/* Page Title (Static) */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0C3E8A]">Đơn đã gửi</p>
          <h1 className="text-2.5xl font-light font-serif-luxury text-[#0F172A]">Lịch sử gửi nhận</h1>
        </div>
        <RouterLink
          to="/create"
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:brightness-110 shadow-md shadow-[#0C3E8A]/15 transition-all duration-300 shrink-0"
        >
          Ký gửi đơn mới
          <PlusCircle className="h-4.5 w-4.5" strokeWidth={2} />
        </RouterLink>
      </div>

      {/* Scrollable list frame */}
      <div className="flex-1 md:overflow-y-auto pr-2 space-y-4.5 scrollbar-thin">
        {[1, 2, 3].map((i) => (
          <article key={i} className="bg-white p-5 rounded-2xl border border-[#E2EAF4] shadow-sm flex flex-col justify-between transition-all duration-300 hover:border-[#0C3E8A]/15">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0C3E8A]/10 text-[#0C3E8A]">
                  <Package className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <div>
                  <h2 className="text-lg font-medium font-serif-luxury text-[#0F172A]">Vận đơn #{i}23456</h2>
                  <p className="mt-1 text-sm text-[#5A6E85] font-light">Giao đến: Nguyễn Văn A - 0987654321</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Đang giao
                </span>
                <span className="text-xs text-[#5A6E85]/60 font-light">Hôm nay 14:30</span>
              </div>
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
