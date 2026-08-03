import React, { useState } from 'react';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep('otp');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      login(phone, 'mock-token');
      navigate('/create');
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-lg space-y-6 text-center">
        <div className="space-y-3">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto border border-blue-100">
            <Shield className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Xác thực tài khoản khách hàng</h1>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
            {step === 'phone' 
              ? 'Nhập số điện thoại di động để nhận mã xác thực OTP tạo đơn và truy xuất vận đơn.' 
              : `Nhập mã xác thực OTP 6 chữ số đã được gửi đến số điện thoại ${phone}.`}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label htmlFor="login-phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Số điện thoại di động
              </label>
              <input 
                id="login-phone"
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912 345 678" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-lg font-semibold tracking-widest text-slate-900 outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              disabled={phone.length < 10}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              Nhận mã OTP <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label htmlFor="login-otp" className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mã xác thực OTP
              </label>
              <input 
                id="login-otp"
                type="number" 
                value={otp}
                onChange={e => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000" 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.4em] text-slate-900 outline-none transition duration-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              disabled={otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              Xác nhận & Đăng nhập <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            </button>
            <button 
              type="button" 
              onClick={() => setStep('phone')}
              className="w-full text-slate-500 hover:text-blue-600 text-xs font-medium py-1 transition-colors duration-200"
            >
              Đổi số điện thoại nhận mã
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
