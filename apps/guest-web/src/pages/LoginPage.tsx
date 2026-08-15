import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle2, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../services/api/auth.api';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

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
        navigate('/create');
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
        navigate('/create');
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
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
            <Shield className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tài khoản Khách hàng</h1>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto font-medium">
            Đăng nhập hoặc đăng ký tài khoản để tạo đơn, quản lý lịch sử gửi hàng đồng bộ trên hệ thống Nexus Logistics.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login'
                ? 'bg-white text-blue-700 shadow-sm'
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
            className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'register'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Đăng ký mới
          </button>
        </div>

        {/* Error / Success alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Số điện thoại
              </label>
              <input
                id="login-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Mật khẩu
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Họ và tên
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="reg-phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Số điện thoại
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="reg-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Mật khẩu
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
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
