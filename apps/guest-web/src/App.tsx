import React from 'react';
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
  LogOut,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Truck,
  User,
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
    description: 'Kết nối tuyến nội thành, liên tỉnh và thu hộ COD cho khách lẻ.',
  },
  {
    icon: ShieldCheck,
    title: 'Theo dõi minh bạch',
    description: 'Tra cứu trạng thái đơn theo mã vận đơn, dễ kiểm tra trên mọi thiết bị.',
  },
  {
    icon: Clock,
    title: 'Tạo đơn nhanh',
    description: 'Đăng nhập bằng số điện thoại để lưu lịch sử gửi hàng và tạo đơn mới.',
  },
];

const processSteps = [
  'Nhập mã vận đơn để tra cứu trạng thái giao hàng.',
  'Đăng nhập bằng số điện thoại khi cần tạo đơn hoặc xem lịch sử.',
  'Điền thông tin lấy hàng, giao hàng, hàng hóa và COD.',
  'Nexus Logistics tiếp nhận, điều phối và cập nhật hành trình.',
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
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <BrandMark />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary"
            onClick={handleAuthClick}
            aria-label={phone ? 'Đăng xuất' : 'Đăng nhập'}
          >
            {phone ? <LogOut className="h-5 w-5" /> : <User className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:bottom-auto md:right-auto md:top-0 md:h-screen md:w-72 md:border-r md:border-t-0 md:shadow-none">
        <div className="hidden px-6 pb-4 pt-6 md:block">
          <BrandMark />
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Cổng gửi hàng dành cho khách vãng lai của Nexus Logistics.
          </p>
        </div>

        <nav className="mx-auto flex max-w-md items-center justify-around gap-1 px-2 py-2 md:mx-0 md:max-w-none md:flex-col md:items-stretch md:px-4 md:py-4">
          {navItems.map((item) => (
            <GuestNavLink key={item.to} {...item} />
          ))}
        </nav>

        <div className="hidden px-4 pb-5 md:absolute md:bottom-0 md:left-0 md:right-0 md:block">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hotline hỗ trợ</p>
            <a className="mt-2 flex items-center gap-2 font-semibold text-slate-900" href="tel:19000000">
              <Phone className="h-4 w-4 text-primary" />
              1900 0000
            </a>
          </div>
          <button
            onClick={handleAuthClick}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
              phone
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border-primary/20 bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90'
            }`}
          >
            {phone ? <LogOut className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {phone ? 'Đăng xuất' : 'Đăng nhập'}
          </button>
        </div>
      </aside>

      <main className={`mx-auto w-full pb-24 md:ml-72 md:pb-0 ${isLoginPage ? '' : 'md:px-8'}`}>
        <Outlet />
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <RouterLink to="/" className="flex items-center gap-3" aria-label="Nexus Logistics">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
        <Package className="h-6 w-6" />
      </span>
      <span>
        <span className="block text-lg font-black tracking-tight text-slate-950">NEXUS</span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Logistics</span>
      </span>
    </RouterLink>
  );
}

function GuestNavLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <RouterNavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'flex min-w-20 flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition md:min-w-0 md:flex-row md:gap-3 md:px-4 md:py-3 md:text-sm',
          isActive
            ? 'bg-primary text-white shadow-sm shadow-primary/20'
            : 'text-slate-600 hover:bg-slate-100 hover:text-primary',
        ].join(' ')
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </RouterNavLink>
  );
}

function TrackingPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <section className="grid min-h-[calc(100vh-72px)] items-center gap-8 px-4 py-8 md:min-h-screen md:grid-cols-[1.05fr_0.95fr] md:px-0 md:py-12">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            Gửi hàng nhanh cho khách vãng lai
          </div>
          <div className="max-w-3xl space-y-5">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              Tra cứu vận đơn và tạo đơn giao hàng cùng Nexus Logistics
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Cổng công khai dành cho khách lẻ: kiểm tra hành trình đơn hàng, đăng nhập bằng số điện thoại để tạo đơn mới và lưu lịch sử gửi hàng.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <RouterLink
              to="/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              Tạo đơn giao hàng
              <ChevronRight className="h-4 w-4" />
            </RouterLink>
            <a
              href="#huong-dan"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-primary/40 hover:text-primary"
            >
              Xem quy trình
            </a>
          </div>
          <dl className="grid max-w-2xl grid-cols-3 gap-3">
            {[
              ['24/7', 'Tra cứu'],
              ['63', 'Tỉnh thành'],
              ['COD', 'Hỗ trợ thu hộ'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <dt className="text-2xl font-black text-slate-950">{value}</dt>
                <dd className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80 md:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Tra cứu đơn hàng</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Nhập mã vận đơn</h2>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Search className="h-6 w-6" />
            </span>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="tracking-code">
              Mã vận đơn
            </label>
            <input
              id="tracking-code"
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-4 text-base font-semibold uppercase tracking-wide text-slate-950 outline-none transition placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="VD: NX123456789"
            />
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
              <Search className="h-5 w-5" />
              Tra cứu ngay
            </button>
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Mẹo tra cứu chính xác</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Mã vận đơn thường nằm trong tin nhắn xác nhận hoặc phiếu gửi hàng. Nhập liền không dấu cách để kết quả khớp nhanh hơn.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-4 pb-8 md:grid-cols-3 md:px-0">
        {serviceCards.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </section>

      <section id="huong-dan" className="grid gap-6 px-4 pb-10 md:grid-cols-[0.8fr_1.2fr] md:px-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Quy trình</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Gửi hàng đơn giản trong vài bước</h2>
        </div>
        <div className="grid gap-3">
          {processSteps.map((step, index) => (
            <div key={step} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="pt-1 text-sm font-medium leading-6 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-12 md:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Câu hỏi thường gặp</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['Khách vãng lai có cần tài khoản không?', 'Bạn có thể tra cứu vận đơn ngay. Khi tạo đơn hoặc xem lịch sử, hệ thống yêu cầu đăng nhập nhanh bằng số điện thoại.'],
              ['Có hỗ trợ thu hộ COD không?', 'Có. Mẫu tạo đơn có trường tiền thu hộ để bạn nhập số tiền cần thu khi giao hàng.'],
              ['Tôi cần gì để tra cứu đơn?', 'Bạn chỉ cần mã vận đơn do Nexus Logistics cung cấp sau khi đơn được tạo.'],
              ['Có thể tạo đơn trên điện thoại không?', 'Có. Giao diện được tối ưu cho điện thoại, máy tính bảng và desktop.'],
            ].map(([question, answer]) => (
              <article key={question} className="rounded-xl bg-slate-50 p-4">
                <h3 className="font-bold text-slate-950">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CreateOrderPage() {
  const { phone } = useAuthStore();
  const navigate = useNavigate();

  if (!phone) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PlusCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Tạo đơn hàng mới</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            Vui lòng đăng nhập bằng số điện thoại để Nexus Logistics lưu thông tin gửi hàng và lịch sử đơn của bạn.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            Đăng nhập ngay
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-0 md:py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Khởi tạo vận đơn</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Tạo đơn hàng mới</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Hoàn tất thông tin lấy hàng, giao hàng và chi tiết hàng hóa để chuẩn bị điều phối.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Số điện thoại</p>
          <p className="mt-1 font-bold text-slate-950">{phone}</p>
        </div>
      </div>

      <div className="space-y-5">
        <FormSection icon={<MapPin className="h-5 w-5" />} title="Thông tin lấy hàng" tone="text-primary">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên người gửi">
              <input type="text" className="guest-input" defaultValue="Khách hàng" />
            </Field>
            <Field label="SĐT người gửi">
              <input type="tel" className="guest-input bg-slate-50 font-semibold" value={phone} disabled />
            </Field>
            <Field label="Địa chỉ lấy hàng" className="md:col-span-2">
              <input type="text" className="guest-input" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." />
            </Field>
          </div>
        </FormSection>

        <FormSection icon={<User className="h-5 w-5" />} title="Thông tin giao hàng" tone="text-emerald-600">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên người nhận" required>
              <input type="text" className="guest-input" placeholder="Nhập tên..." />
            </Field>
            <Field label="SĐT người nhận" required>
              <input type="tel" className="guest-input" placeholder="Nhập SĐT..." />
            </Field>
            <Field label="Địa chỉ giao hàng" required className="md:col-span-2">
              <input type="text" className="guest-input" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." />
            </Field>
          </div>
        </FormSection>

        <FormSection icon={<Package className="h-5 w-5" />} title="Chi tiết hàng hóa" tone="text-sky-600">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tên/Loại hàng" className="col-span-2 md:col-span-1">
              <input type="text" className="guest-input" placeholder="Quần áo, tài liệu..." />
            </Field>
            <Field label="Khối lượng (kg)" className="col-span-2 md:col-span-1">
              <input type="number" step="0.1" className="guest-input" placeholder="0.5" />
            </Field>
            <div className="col-span-2 grid grid-cols-3 gap-3">
              {['Dài (cm)', 'Rộng (cm)', 'Cao (cm)'].map((label) => (
                <Field key={label} label={label} compact>
                  <input type="number" className="guest-input px-3" placeholder="0" />
                </Field>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection icon={<Clock className="h-5 w-5" />} title="Dịch vụ & ghi chú" tone="text-violet-600">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Gói dịch vụ">
              <select className="guest-input bg-white">
                <option value="STANDARD">Giao chuẩn (Standard)</option>
                <option value="EXPRESS">Giao nhanh (Express)</option>
                <option value="SAME_DAY">Giao hỏa tốc (Same Day)</option>
              </select>
            </Field>
            <Field label="Tiền thu hộ (COD)">
              <div className="relative">
                <input type="number" className="guest-input pr-14" placeholder="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">VNĐ</span>
              </div>
            </Field>
            <Field label="Ghi chú giao hàng" className="md:col-span-2">
              <textarea className="guest-input min-h-24 resize-none" rows={3} placeholder="Cho khách xem hàng, gọi trước khi giao..." />
            </Field>
          </div>
        </FormSection>

        <div className="sticky bottom-20 z-10 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80 md:bottom-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Cước phí dự kiến</p>
            <p className="text-2xl font-black text-primary">0 VNĐ</p>
          </div>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 md:w-auto">
            Tạo đơn hàng
            <ChevronRight className="h-4 w-4" />
          </button>
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4 text-lg font-black text-slate-950">
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
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-slate-700`}>
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function HistoryPage() {
  const { phone } = useAuthStore();
  const navigate = useNavigate();

  if (!phone) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Lịch sử gửi hàng</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            Đăng nhập để xem lại danh sách đơn hàng đã tạo bằng số điện thoại của bạn.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            Đăng nhập ngay
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-0 md:py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Đơn đã gửi</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Lịch sử gửi hàng</h1>
        </div>
        <RouterLink
          to="/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          Tạo đơn mới
          <PlusCircle className="h-4 w-4" />
        </RouterLink>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <article key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-lg font-black text-slate-950">Đơn hàng #{i}23456</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Giao đến: Nguyễn Văn A - 0987654321</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đang giao
                </span>
                <span className="text-xs font-semibold text-slate-400">Hôm nay 14:30</span>
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
