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
    <div className="space-y-6 max-w-sm mx-auto mt-10">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Đăng nhập nhanh</h1>
        <p className="text-gray-500 text-sm">
          {step === 'phone' 
            ? 'Nhập số điện thoại để tiếp tục tạo đơn hoặc xem lịch sử' 
            : `Nhập mã OTP gồm 6 chữ số vừa được gửi đến SĐT ${phone}`}
        </p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-2">
            <input 
              type="tel" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại..." 
              className="w-full px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-center tracking-wider"
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            disabled={phone.length < 10}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp tục <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <input 
              type="number" 
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              placeholder="000000" 
              className="w-full px-4 py-3 text-2xl border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-center tracking-[0.5em]"
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            disabled={otp.length !== 6}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận <CheckCircle2 className="w-4 h-4" />
          </button>
          <button 
            type="button" 
            onClick={() => setStep('phone')}
            className="w-full text-gray-500 text-sm py-2 hover:underline"
          >
            Đổi số điện thoại khác
          </button>
        </form>
      )}
    </div>
  );
}
