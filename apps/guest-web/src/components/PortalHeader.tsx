import React, { useState, useEffect } from 'react';
import { Link as RouterLink, NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Truck,
  Phone,
  Building2,
  Search,
  PlusCircle,
  Package,
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { shipmentApi, ShipmentResponse } from '../services/api/shipment.api';
import { resolveCourierForOrder } from '../utils/courierResolver';
import { ZaloIcon } from './ZaloIcon';

import { NexusBrandLogo } from './NexusBrandLogo';
import { CustomerAccountModal } from './CustomerAccountModal';

export const PortalHeader: React.FC = () => {
  const { phone, user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [receivedNotifs, setReceivedNotifs] = useState<ShipmentResponse[]>([]);
  const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Auto load notifications for receiver
  useEffect(() => {
    if (!token || !phone) {
      setReceivedNotifs([]);
      return;
    }
    const loadNotifs = async () => {
      try {
        const res = await shipmentApi.getReceivedShipments(token, { limit: 10, phone: phone || user?.phone });
        setReceivedNotifs(res || []);
      } catch {
        setReceivedNotifs([]);
      }
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 15000);
    return () => clearInterval(interval);
  }, [token, phone, user?.phone]);

  const handleAuthClick = () => {
    if (phone) {
      setIsAccountModalOpen(true);
    } else {
      const redirectParam =
        location.pathname !== '/login'
          ? `?redirect=${encodeURIComponent(location.pathname + location.search)}`
          : '';
      navigate(`/login${redirectParam}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAccountModalOpen(false);
    navigate('/');
  };

  const handleNavClick = (sectionId?: string) => {
    setIsMobileOpen(false);
    if (!sectionId) return;

    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full shrink-0">
      {/* 1. TOP UTILITY STRIP (Nexus Logistics Primary Blue Bar) */}
      <div className="hidden lg:block bg-blue-600 text-white text-[11px] font-medium py-1.5 border-b border-blue-500/80 shadow-2xs">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a
              href="tel:19000000"
              className="flex items-center gap-1.5 hover:text-blue-100 transition text-white"
            >
              <Phone className="h-3 w-3 text-sky-200" />
              <span>
                Tổng Đài Demo: <strong className="text-white font-bold">1900 0000</strong>
              </span>
            </a>

            <a
              href="https://zalo.me/0869500573"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sky-200 hover:text-white font-bold transition"
            >
              <span className="h-1.5 w-1.5 bg-emerald-300 animate-pulse" />
              <span>Zalo Trực Tuyến: 0869 500 573</span>
            </a>

            <span className="hidden xl:inline text-blue-100/90 font-medium">
              🎓 Đồ Án Khóa Luận Tốt Nghiệp Kỹ Sư CNTT • Hệ Thống Quản Lý Bưu Chính Nexus
            </span>
          </div>

          <div className="flex items-center gap-5">
            <RouterLink
              to="/network"
              className="hover:text-blue-100 transition flex items-center gap-1.5 text-white"
            >
              <Building2 className="h-3 w-3 text-sky-200" />
              <span>Mạng lưới 34 Bưu cục toàn quốc</span>
            </RouterLink>
            <span className="text-blue-400">|</span>
            <div className="flex items-center gap-1 font-bold text-white">
              <span>🇻🇳</span>
              <span>Tiếng Việt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Mini Top Utility Strip in Primary Blue */}
      <div className="lg:hidden bg-blue-600 text-white text-[11px] font-semibold py-1 px-4 flex items-center justify-between border-b border-blue-500/80 shadow-2xs">
        <a href="tel:19000000" className="flex items-center gap-1.5 text-white">
          <Phone className="h-3 w-3 text-sky-200" />
          <span>Demo: <strong>1900 0000</strong></span>
        </a>
        <a
          href="https://zalo.me/0869500573"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sky-200 hover:text-white"
        >
          <span className="h-1.5 w-1.5 bg-emerald-300 animate-pulse" />
          <span>Khóa Luận CNTT</span>
        </a>
      </div>

      {/* 2. MAIN HEADER (Sticky Top Navbar matching J&T Express) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100/80 shadow-2xs">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <NexusBrandLogo size="md" showSlogan={true} />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 font-bold text-xs uppercase tracking-wider">
            <RouterNavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition ${
                  isActive && location.pathname === '/'
                    ? 'text-blue-600 bg-blue-50 font-black'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              Trang Chủ
            </RouterNavLink>

            <button
              type="button"
              onClick={() => handleNavClick('flagship-services')}
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Dịch Vụ
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('fee-calculator-section')}
              className="px-3 py-2 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Bảng Giá & Cước
            </button>

            <RouterNavLink
              to="/orders"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-black'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              Đơn Hàng
            </RouterNavLink>

            <RouterNavLink
              to="/network"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-black'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              34 Bưu Cục
            </RouterNavLink>

            <RouterNavLink
              to="/terms-of-service"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-black'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              Bảo Hiểm & Hỗ Trợ
            </RouterNavLink>
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* J&T Prominent CTA Button: Tạo Vận Đơn Ngay */}
            <RouterLink
              to="/create"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-xs transition active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo Vận Đơn</span>
              <span className="sm:hidden">Tạo Đơn</span>
            </RouterLink>

            {/* Notification Bell (if logged in) */}
            {phone && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifsDropdown((v) => !v)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  aria-label="Thông báo đơn nhận"
                >
                  <Bell className="h-4 w-4 text-blue-600" />
                  {receivedNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs">
                      {receivedNotifs.length > 9 ? '9+' : receivedNotifs.length}
                    </span>
                  )}
                </button>

                {/* Popover notifications */}
                {showNotifsDropdown && (
                  <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-black uppercase text-slate-800">
                          Đơn gửi đến số điện thoại {phone}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNotifsDropdown(false)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
                      {receivedNotifs.length === 0 ? (
                        <p className="text-slate-500 py-6 text-center text-xs">
                          Chưa có đơn hàng nào gửi đến bạn.
                        </p>
                      ) : (
                        receivedNotifs.map((s) => {
                          const meta = (s.metadata as Record<string, any>) || {};
                          const courier = resolveCourierForOrder({
                            courierId: meta.courierId,
                            courierName: meta.courierName,
                            courierPhone: meta.courierPhone,
                            receiverHubCode: meta.receiver?.hubCode || meta.receiverHubCode,
                          });
                          return (
                            <div
                              key={s.id || s.code}
                              onClick={() => {
                                setShowNotifsDropdown(false);
                                navigate('/orders');
                              }}
                              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-200 cursor-pointer transition space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-blue-700">#{s.code}</span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <p className="text-slate-700 font-medium">
                                Người gửi: <strong>{meta.sender?.name || 'Shop / Khách gửi'}</strong>
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold pt-0.5">
                                <Truck className="h-3 w-3" />
                                <span>Bưu tá: {courier.name} • {courier.phone}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifsDropdown(false);
                        navigate('/orders');
                      }}
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition cursor-pointer"
                    >
                      Xem tất cả đơn nhận
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* User Account / Login Button */}
            {phone ? (
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs divide-x divide-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs font-bold text-slate-800 hover:text-blue-600 transition cursor-pointer"
                  title="Xem thông tin tài khoản & ngân hàng"
                >
                  <div className="h-6 w-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {(user?.displayName || phone).charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[110px] truncate">{user?.displayName || phone}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAuthClick}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <User className="h-4 w-4 text-blue-600" />
                <span>Đăng Nhập</span>
              </button>
            )}

            {/* Mobile Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen((v) => !v)}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* 3. MOBILE SLIDE-DOWN DRAWER (J&T style mobile menu) */}
        {isMobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white rounded-b-2xl shadow-xl animate-in slide-in-from-top duration-200">
            <div className="px-4 py-4 space-y-3">
              {phone ? (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl mb-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {(user?.displayName || phone).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{user?.displayName || phone}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{phone}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      Khách hàng
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileOpen(false);
                        setIsAccountModalOpen(true);
                      }}
                      className="py-2 px-2.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>Xem tài khoản</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileOpen(false);
                        handleLogout();
                      }}
                      className="py-2 px-2.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false);
                    navigate('/login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 mb-1 transition shadow-xs cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Đăng Nhập Tài Khoản</span>
                </button>
              )}
              <nav className="flex flex-col space-y-1 font-bold text-xs uppercase tracking-wider">
                <RouterLink
                  to="/"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3.5 py-2.5 text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5"
                >
                  <Search className="h-4 w-4 text-blue-600" />
                  <span>Trang Chủ & Tra Cứu</span>
                </RouterLink>

                <button
                  type="button"
                  onClick={() => handleNavClick('flagship-services')}
                  className="px-3.5 py-2.5 text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Dịch Vụ Bưu Chính</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('fee-calculator-section')}
                  className="px-3.5 py-2.5 text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <span>Ước Tính Cước Phí</span>
                </button>

                <RouterLink
                  to="/orders"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3.5 py-2.5 text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5"
                >
                  <Package className="h-4 w-4 text-blue-600" />
                  <span>Quản Lý Đơn Hàng</span>
                </RouterLink>

                <RouterLink
                  to="/network"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3.5 py-2.5 text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5"
                >
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>Mạng Lưới 34 Bưu Cục</span>
                </RouterLink>

                <RouterLink
                  to="/terms-of-service"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3.5 py-2.5 text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5"
                >
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Bảo Hiểm & Điều Khoản</span>
                </RouterLink>
              </nav>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <a
                  href="https://zalo.me/0869500573"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold"
                >
                  <div className="flex items-center gap-2.5">
                    <ZaloIcon className="h-5 w-5" />
                    <span>Chat Zalo Bưu Chính 24/7</span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <a
                  href="tel:19000000"
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>Hotline: 1900 0000 (Miễn cước)</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Customer Account & Bank Account Modal */}
      <CustomerAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        phone={phone}
        onLogout={handleLogout}
      />
    </div>
  );
};
