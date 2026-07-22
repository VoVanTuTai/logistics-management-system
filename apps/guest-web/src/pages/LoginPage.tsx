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
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md luxury-glass p-8 md:p-10 rounded-2.5xl border border-[#E2EAF4] luxury-shadow space-y-7 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-[#0C3E8A]/10 text-[#0C3E8A] rounded-2xl flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-2.5xl font-light font-serif-luxury text-[#0F172A]">Xác thực tài khoản</h1>
          <p className="text-[#5A6E85] text-sm font-light leading-relaxed max-w-xs mx-auto">
            {step === 'phone' 
              ? 'Nhập số điện thoại di động của quý khách để nhận mã truy cập OTP.' 
              : `Nhập mã OTP gồm 6 chữ số vừa được gửi đến thiết bị số di động ${phone}.`}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div className="space-y-2 text-left">
              <label htmlFor="login-phone" className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#5A6E85]">
                Số điện thoại
              </label>
              <input 
                id="login-phone"
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại..." 
                className="w-full rounded-xl border border-[#E2EAF4] bg-white px-5 py-4 text-center text-lg font-medium tracking-widest text-[#0F172A] outline-none transition duration-300 placeholder:normal-case placeholder:font-light placeholder:tracking-normal focus:border-[#0C3E8A] focus:ring-1 focus:ring-[#0C3E8A]/20"
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              disabled={phone.length < 10}
              className="w-full bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#0C3E8A]/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              Tiếp tục <ArrowRight className="w-4.5 h-4.5" strokeWidth={2} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2 text-left">
              <label htmlFor="login-otp" className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#5A6E85]">
                Mã xác thực OTP
              </label>
              <input 
                id="login-otp"
                type="number" 
                value={otp}
                onChange={e => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000" 
                className="w-full rounded-xl border border-[#E2EAF4] bg-white px-5 py-4 text-center text-2xl font-semibold tracking-[0.5em] text-[#0F172A] outline-none transition duration-300 placeholder:normal-case placeholder:font-light placeholder:tracking-normal focus:border-[#0C3E8A] focus:ring-1 focus:ring-[#0C3E8A]/20"
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              disabled={otp.length !== 6}
              className="w-full bg-gradient-to-r from-[#0C3E8A] to-[#0052CC] text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#0C3E8A]/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              Xác nhận mã OTP <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2} />
            </button>
            <button 
              type="button" 
              onClick={() => setStep('phone')}
              className="w-full text-[#5A6E85] hover:text-[#0C3E8A] text-xs font-medium py-1 transition-colors duration-200"
            >
              Thay đổi số điện thoại liên kết
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
