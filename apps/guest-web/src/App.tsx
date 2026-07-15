import React from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import { Package, Search, PlusCircle, Clock, Menu, LogOut, User } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/useAuthStore';

function Layout() {
  const { phone, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (phone) {
      logout();
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-64">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="font-bold text-xl text-primary flex items-center gap-2">
          <Package className="w-6 h-6" /> NEXUS
        </div>
        <button className="p-2 -mr-2 text-gray-500" onClick={handleAuthClick}>
          {phone ? <LogOut className="w-6 h-6" /> : <User className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:border-t-0 md:border-r md:w-64 md:top-0 md:bottom-0 z-20 flex md:flex-col justify-around md:justify-start px-2 py-2 md:p-4">
        <div className="hidden md:flex font-bold text-2xl text-primary items-center justify-between gap-2 mb-8 px-4 py-2">
          <div className="flex items-center gap-2"><Package className="w-8 h-8" /> NEXUS</div>
        </div>
        
        <NavLink to="/" icon={<Search />} label="Tra cứu" />
        <NavLink to="/create" icon={<PlusCircle />} label="Tạo đơn" />
        <NavLink to="/history" icon={<Clock />} label="Lịch sử" />

        <div className="hidden md:block mt-auto">
          {phone ? (
            <button onClick={handleAuthClick} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
              <LogOut className="w-5 h-5" /> Đăng xuất
            </button>
          ) : (
            <button onClick={handleAuthClick} className="w-full flex items-center gap-3 px-4 py-3 text-primary hover:bg-primary/10 rounded-lg font-medium transition-colors">
              <User className="w-5 h-5" /> Đăng nhập
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-md mx-auto md:max-w-3xl w-full p-4">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      to={to} 
      className="flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors text-xs md:text-sm font-medium"
    >
      <span className="[&>svg]:w-6 [&>svg]:h-6 md:[&>svg]:w-5 md:[&>svg]:h-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

// Placeholders for Pages
function TrackingPage() {
  return (
    <div className="space-y-6 mt-4">
      <h1 className="text-2xl font-bold tracking-tight">Tra cứu đơn hàng</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Mã vận đơn</label>
          <input type="text" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Nhập mã đơn hàng..." />
        </div>
        <button className="w-full bg-primary text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
          <Search className="w-5 h-5" /> Tra cứu ngay
        </button>
      </div>
    </div>
  );
}

function CreateOrderPage() {
  const { phone } = useAuthStore();
  const navigate = useNavigate();
  
  if (!phone) {
    return (
      <div className="space-y-6 mt-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Tạo đơn hàng mới</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium">Bạn chưa đăng nhập</h2>
          <p className="text-gray-500 text-sm">Vui lòng đăng nhập bằng SĐT để tạo đơn hàng mới.</p>
          <button onClick={() => navigate('/login')} className="bg-primary text-white px-6 py-3 rounded-xl font-medium mt-4">
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 pb-8">
      <h1 className="text-2xl font-bold tracking-tight">Tạo đơn hàng mới</h1>
      
      <div className="space-y-6">
        {/* Thông tin người gửi */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
            <User className="w-5 h-5 text-primary" /> Thông tin lấy hàng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tên người gửi</label>
              <input type="text" className="w-full px-4 py-2 mt-1 border rounded-xl bg-gray-50" defaultValue="Khách hàng" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">SĐT người gửi</label>
              <input type="tel" className="w-full px-4 py-2 mt-1 border rounded-xl bg-gray-50 font-medium" value={phone} disabled />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Địa chỉ lấy hàng</label>
              <input type="text" className="w-full px-4 py-2 mt-1 border rounded-xl" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." />
            </div>
          </div>
        </section>

        {/* Thông tin người nhận */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
            <User className="w-5 h-5 text-orange-500" /> Thông tin giao hàng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Tên người nhận <span className="text-red-500">*</span></label>
              <input type="text" className="w-full px-4 py-2 mt-1 border rounded-xl" placeholder="Nhập tên..." />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">SĐT người nhận <span className="text-red-500">*</span></label>
              <input type="tel" className="w-full px-4 py-2 mt-1 border rounded-xl" placeholder="Nhập SĐT..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Địa chỉ giao hàng <span className="text-red-500">*</span></label>
              <input type="text" className="w-full px-4 py-2 mt-1 border rounded-xl" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." />
            </div>
          </div>
        </section>

        {/* Thông tin hàng hóa */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
            <Package className="w-5 h-5 text-blue-500" /> Chi tiết hàng hóa
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">Tên/Loại hàng</label>
              <input type="text" className="w-full px-4 py-2 mt-1 border rounded-xl" placeholder="Quần áo, tài liệu..." />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium text-gray-700">Khối lượng (kg)</label>
              <input type="number" step="0.1" className="w-full px-4 py-2 mt-1 border rounded-xl" placeholder="0.5" />
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Dài (cm)</label>
                <input type="number" className="w-full px-3 py-2 mt-1 border rounded-xl" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Rộng (cm)</label>
                <input type="number" className="w-full px-3 py-2 mt-1 border rounded-xl" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Cao (cm)</label>
                <input type="number" className="w-full px-3 py-2 mt-1 border rounded-xl" placeholder="0" />
              </div>
            </div>
          </div>
        </section>

        {/* Dịch vụ & Thanh toán */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
            <Clock className="w-5 h-5 text-purple-500" /> Dịch vụ & Ghi chú
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Gói dịch vụ</label>
              <select className="w-full px-4 py-2 mt-1 border rounded-xl bg-white">
                <option value="STANDARD">Giao chuẩn (Standard)</option>
                <option value="EXPRESS">Giao nhanh (Express)</option>
                <option value="SAME_DAY">Giao hỏa tốc (Same Day)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tiền thu hộ (COD)</label>
              <div className="relative">
                <input type="number" className="w-full pl-4 pr-12 py-2 mt-1 border rounded-xl" placeholder="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 mt-0.5 text-gray-500 font-medium">VNĐ</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Ghi chú giao hàng</label>
              <textarea className="w-full px-4 py-2 mt-1 border rounded-xl resize-none" rows={2} placeholder="Cho khách xem hàng, gọi trước khi giao..." />
            </div>
          </div>
        </section>

        {/* Hành động */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col sm:flex-row justify-between items-center gap-4 sticky bottom-20 md:bottom-4 z-10">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <p className="text-sm text-gray-500">Cước phí dự kiến</p>
            <p className="text-xl font-bold text-primary">0 VNĐ</p>
          </div>
          <button className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors">
            TẠO ĐƠN HÀNG
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryPage() {
  const { phone } = useAuthStore();
  const navigate = useNavigate();

  if (!phone) {
    return (
      <div className="space-y-6 mt-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử gửi hàng</h1>
        <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-medium">Bạn chưa đăng nhập</h2>
          <p className="text-gray-500 text-sm">Đăng nhập để xem danh sách đơn hàng bạn đã gửi.</p>
          <button onClick={() => navigate('/login')} className="bg-primary text-white px-6 py-3 rounded-xl font-medium mt-4">
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <h1 className="text-2xl font-bold tracking-tight">Lịch sử gửi hàng</h1>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="font-medium text-lg">Đơn hàng #{i}23456</p>
              <p className="text-gray-500 text-sm">Giao đến: Nguyễn Văn A - 0987654321</p>
            </div>
            <div className="text-right flex flex-row md:flex-col justify-between items-center md:items-end">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Đang giao</span>
              <span className="text-gray-400 text-xs md:mt-2">Hôm nay 14:30</span>
            </div>
          </div>
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
