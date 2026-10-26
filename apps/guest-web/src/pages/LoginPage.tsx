import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, CheckCircle2, UserPlus, LogIn, AlertCircle, Package, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../services/api/auth.api';

interface SavedDraftQuote {
  originProvince: string;
  destProvince: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  serviceType: string;
  estimatedFee: number;
  timestamp?: number;
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/create';
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedQuote, setSavedQuote] = useState<SavedDraftQuote | null>(null);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nexus_draft_quote');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedQuote(parsed);
      }
    } catch {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.login({
        username: phone.trim(),
        password: password.trim(),
        roleGroup: 'CUSTOMER_APP',
      });

      const token = res.tokens?.accessToken || res.accessToken;
      if (!token) {
        throw new Error('Không nhận được token xác thực từ máy chủ.');
      }

      login(phone.trim(), token, {
        id: res.user.id,
        username: res.user.username,
        displayName: res.user.displayName || phone.trim(),
        phone: res.user.phone || phone.trim(),
        roles: res.user.roles || ['CUSTOMER'],
      });

      setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(redirectTarget);
      }, 500);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại số điện thoại hoặc mật khẩu.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Register customer account
      await authApi.register({
        username: phone.trim(),
        password: password.trim(),
        displayName: fullName.trim(),
        phone: phone.trim(),
      });

      // 2. Auto login
      const loginRes = await authApi.login({
        username: phone.trim(),
        password: password.trim(),
        roleGroup: 'CUSTOMER_APP',
      });

      const token = loginRes.tokens?.accessToken || loginRes.accessToken;
      if (!token) {
        throw new Error('Không nhận được token xác thực từ máy chủ.');
      }

      login(phone.trim(), token, {
        id: loginRes.user.id,
        username: loginRes.user.username,
        displayName: loginRes.user.displayName || fullName.trim(),
        phone: loginRes.user.phone || phone.trim(),
        roles: loginRes.user.roles || ['CUSTOMER'],
      });

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate(redirectTarget);
      }, 600);
    } catch (err: any) {
      setErrorMessage(
        err?.message?.includes('already exists')
          ? `Số điện thoại "${phone.trim()}" đã được đăng ký. Vui lòng chuyển sang Đăng nhập.`
          : err?.message || 'Đăng ký thất bại. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 md:p-10 border border-slate-300 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
            <Shield className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tài khoản Khách hàng</h1>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto font-medium">
            Đăng nhập hoặc đăng ký tài khoản để tạo đơn, quản lý lịch sử gửi hàng đồng bộ trên hệ thống Nexus Logistics.
          </p>
        </div>

        {/* THẺ BÁO GIÁ ĐƯỢC GIỮ CHỖ TỪ TRƯỚC */}
        {savedQuote && (
          <div className="border border-blue-200 bg-blue-50/70 p-4 rounded-xl space-y-2 text-xs text-blue-900 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-extrabold text-blue-700 uppercase text-[10px] tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Đang lưu báo giá ước tính của bạn
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-200 rounded-full">
                Tự động khôi phục
              </span>
            </div>
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                {savedQuote.originProvince} → {savedQuote.destProvince}
              </span>
              <span className="font-mono text-blue-700 text-sm font-extrabold">
                {savedQuote.estimatedFee ? `${savedQuote.estimatedFee.toLocaleString('vi-VN')} đ` : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Kiện hàng: <b>{savedQuote.weightKg} kg</b> • Kích thước: <b>{savedQuote.lengthCm}×{savedQuote.widthCm}×{savedQuote.heightCm} cm</b>
            </p>
            <p className="text-[10px] text-blue-700 pt-1.5 border-t border-blue-200 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              Sau khi hoàn tất {tab === 'login' ? 'đăng nhập' : 'đăng ký'}, hệ thống sẽ chuyển thẳng vào đơn hàng với dữ liệu này!
            </p>
          </div>
        )}

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`py-2.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage(null);
            }}
            className={`py-2.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Đăng ký mới
          </button>
        </div>

        {/* Error / Success alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Số điện thoại
              </label>
              <input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none rounded-lg transition focus:bg-white focus:border-blue-600"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Mật khẩu
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none rounded-lg transition focus:bg-white focus:border-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1 text-left">
              <label
                htmlFor="reg-fullname"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Họ và tên
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none rounded-lg transition focus:bg-white focus:border-blue-600"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="reg-phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Số điện thoại
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none rounded-lg transition focus:bg-white focus:border-blue-600"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Mật khẩu
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none rounded-lg transition focus:bg-white focus:border-blue-600"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none rounded-lg transition focus:bg-white focus:border-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? 'Đang khởi tạo...' : 'Đăng ký tài khoản'}
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
