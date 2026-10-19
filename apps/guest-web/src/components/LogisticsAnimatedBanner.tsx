import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Percent,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  PhoneCall,
  Gift,
  Search,
  Calculator,
  MapPin,
  Sparkles,
  User,
  Lock,
  RefreshCw,
  Barcode,
  X,
  Phone,
} from 'lucide-react';
import { NexusBrandLogo, NexusBrandMark } from './NexusBrandLogo';

interface PromoSlide {
  id: number;
  bgImage: string;
  campaignBadge: string;
  badgeAccent: string;
  headlineMain: string;
  headlineHighlight: string;
  subDescription: string;
  saleSticker: {
    icon: React.ElementType;
    tag: string;
    title: string;
    sub: string;
  };
  keyFeatures: {
    icon: React.ElementType;
    label: string;
    detail: string;
  }[];
  primaryAction: {
    label: string;
    type: 'create' | 'search' | 'calculator' | 'zalo';
  };
  secondaryAction?: {
    label: string;
    type: 'create' | 'search' | 'calculator' | 'zalo' | 'terms';
  };
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 0,
    bgImage:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80',
    campaignBadge: '⚡ NEXUS EXPRESS • HỎA TỐC LIÊN TỈNH 24H',
    badgeAccent: 'bg-white/20 text-white border-white/30',
    headlineMain: 'HẠ TẦNG VẬN TẢI BƯU CHÍNH NEXUS',
    headlineHighlight: 'GIAO HỎA TỐC 24H • KẾT NỐI 34 HUBS TOÀN QUỐC',
    subDescription:
      'Mô hình điều phối trung tâm khai thác bưu phẩm thông minh kết hợp tuyến bay trục Hà Nội ⇄ TP. Hồ Chí Minh. Cam kết chuẩn SLA 99.4%, hiển thị lộ trình thời gian thực.',
    saleSticker: {
      icon: Percent,
      tag: 'BẢNG CƯỚC TIẾT KIỆM',
      title: 'Tối Ưu 20% Cước',
      sub: 'Biểu phí bưu chính minh bạch chuẩn IATA',
    },
    keyFeatures: [
      {
        icon: Zap,
        label: 'Lấy Hàng 30 Phút',
        detail: 'Bưu tá tiếp nhận tận nơi sau khi tạo đơn',
      },
      {
        icon: Clock,
        label: 'Chuẩn SLA 99.4%',
        detail: 'Cam kết giao đúng giờ trên toàn quốc',
      },
      {
        icon: Truck,
        label: 'Tuyến Bay Trục 24H',
        detail: 'Kết nối hỏa tốc các trung tâm bưu phẩm',
      },
    ],
    primaryAction: { label: 'Tạo Đơn Gửi Ngay (-20%)', type: 'create' },
    secondaryAction: { label: 'Tra Cứu Lộ Trình', type: 'search' },
  },
  {
    id: 1,
    bgImage:
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=2000&q=80',
    campaignBadge: '🛡️ QUY CHUẨN AN TOÀN • BẢO HIỂM BƯU GỬI 100%',
    badgeAccent: 'bg-white/20 text-white border-white/30',
    headlineMain: 'QUY TRÌNH KIỂM SOÁT BƯU PHẨM',
    headlineHighlight: 'BẢO TOÀN KIỆN HÀNG • NIÊM PHONG SEAL X8',
    subDescription:
      'Quy chuẩn đóng gói chống va đập 3 lớp, kẹp chì an toàn bảo mật bưu phẩm và cam kết bồi thường 100% giá trị khai báo khi có rủi ro phát sinh trong vận chuyển.',
    saleSticker: {
      icon: ShieldCheck,
      tag: 'CAM KẾT AN TOÀN',
      title: 'Đền Bù 100%',
      sub: 'Đồng kiểm bưu kiện tận mắt cùng bưu tá',
    },
    keyFeatures: [
      {
        icon: ShieldCheck,
        label: 'Bảo Hiểm 100% Khai Giá',
        detail: 'Thẩm định bồi thường bưu kiện trong 24h',
      },
      {
        icon: Package,
        label: 'Chống Móp Vỡ Bưu Phẩm',
        detail: 'Quy chuẩn đóng gói bọc lót chống sốc',
      },
      {
        icon: CheckCircle2,
        label: 'Niêm Phong Seal X8',
        detail: 'Kẹp chì điện tử chống cạy mở bưu phẩm',
      },
    ],
    primaryAction: { label: 'Dự Toán Cước Bưu Chính', type: 'calculator' },
    secondaryAction: { label: 'Quy Chuẩn Bồi Thường', type: 'terms' },
  },
  {
    id: 2,
    bgImage:
      'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=2000&q=80',
    campaignBadge: '📦 ĐỒNG HÀNH SHOP ONLINE • ĐỐI SOÁT COD T+1',
    badgeAccent: 'bg-white/20 text-white border-white/30',
    headlineMain: 'GIẢI PHÁP THƯƠNG MẠI ĐIỆN TỬ',
    headlineHighlight: 'MIỄN PHÍ THU HỘ COD • TỰ ĐỘNG VỀ TÀI KHOẢN',
    subDescription:
      'Dòng tiền thu hộ COD tự động đối soát định kỳ mỗi ngày, chuyển khoản không giữ vốn shop. Ký nhận điện tử POD bằng hình ảnh thực tế thời gian thực.',
    saleSticker: {
      icon: Gift,
      tag: 'ĐẶC QUYỀN SHOP',
      title: 'Hỗ Trợ Shop Mới',
      sub: 'Miễn phí thu hộ & chiết khấu cước',
    },
    keyFeatures: [
      {
        icon: Percent,
        label: 'Phí Thu Hộ 0 Đồng',
        detail: 'Miễn phí toàn bộ cước thu tiền mặt COD',
      },
      {
        icon: Layers,
        label: 'Đối Soát T+1 Mỗi Sáng',
        detail: 'Chuyển khoản tự động không giam vốn shop',
      },
      {
        icon: ShieldCheck,
        label: 'Ảnh Ký Nhận POD MinIO',
        detail: 'Xác thực chữ ký người nhận trong 3 giây',
      },
    ],
    primaryAction: { label: 'Tạo Vận Đơn Thử Nghiệm', type: 'create' },
    secondaryAction: { label: 'Chat Zalo Bưu Chính', type: 'zalo' },
  },
];

interface LogisticsAnimatedBannerProps {
  onQuickTrack?: (code: string) => void;
  trackingCode?: string;
  setTrackingCode?: (code: string) => void;
  receiverPhone?: string;
  setReceiverPhone?: (phone: string) => void;
  isLoggedIn?: boolean;
  userDisplayName?: string;
  userPhone?: string;
  isSearching?: boolean;
  onTrackingSubmit?: (e: React.FormEvent) => void;
  onSampleCodeClick?: (code: string) => void;
  onClearTracking?: () => void;
}

export const LogisticsAnimatedBanner: React.FC<LogisticsAnimatedBannerProps> = ({
  onQuickTrack,
  trackingCode,
  setTrackingCode,
  receiverPhone = '',
  setReceiverPhone,
  isLoggedIn = false,
  userDisplayName,
  userPhone,
  isSearching = false,
  onTrackingSubmit,
  onSampleCodeClick,
  onClearTracking,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [localAwb, setLocalAwb] = useState('');
  const [activeTab, setActiveTab] = useState<'track' | 'calc' | 'network' | 'zalo'>('track');
  const navigate = useNavigate();

  const currentCode = trackingCode !== undefined ? trackingCode : localAwb;

  const handleCodeChange = (val: string) => {
    if (setTrackingCode) {
      setTrackingCode(val);
    } else {
      setLocalAwb(val);
    }
  };

  const handleClear = () => {
    if (onClearTracking) {
      onClearTracking();
    } else {
      handleCodeChange('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTrackingSubmit) {
      onTrackingSubmit(e);
      return;
    }
    const clean = currentCode.trim().toUpperCase();
    if (!clean) return;
    if (onQuickTrack) {
      onQuickTrack(clean);
    }
  };

  const SLIDE_DURATION = 6000; // 6s per slide, smooth J&T pacing

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, SLIDE_DURATION);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
  };

  const handleAction = (type: 'create' | 'search' | 'calculator' | 'zalo' | 'terms') => {
    if (type === 'create') {
      navigate('/create');
      return;
    }
    if (type === 'terms') {
      navigate('/terms-of-service');
      return;
    }
    if (type === 'zalo') {
      window.open('https://zalo.me/0869500573', '_blank');
      return;
    }
    if (type === 'search') {
      const searchEl = document.querySelector('input[placeholder*="Nhập mã vận đơn"]') as HTMLInputElement;
      if (searchEl) {
        searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchEl.focus();
      }
      return;
    }
    if (type === 'calculator') {
      const calcEl = document.getElementById('fee-calculator-section') || document.querySelector('input[type="number"]');
      if (calcEl) {
        calcEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const [selectedFeature, setSelectedFeature] = useState(0);

  useEffect(() => {
    setSelectedFeature(0);
  }, [currentSlide]);

  const slide = PROMO_SLIDES[currentSlide];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="space-y-0 overflow-hidden border border-slate-200/90 shadow-xs select-none bg-white"
    >
      {/* 1. J&T-STYLE FULL-IMPACT HERO SLIDER STAGE */}
      <div className="relative min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] flex items-center overflow-hidden bg-slate-950">
        {/* Real Logistics Photographic Backgrounds with Cross-fade and subtle zoom */}
        {PROMO_SLIDES.map((s, idx) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={s.bgImage}
              alt={s.headlineMain}
              className={`w-full h-full object-cover transition-transform duration-7000 ease-out ${
                idx === currentSlide ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        ))}

        {/* Professional Enterprise Directional Gradient Scrim: Rich Royal Blue with high text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/80 to-blue-950/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-blue-950/20 pointer-events-none" />

        {/* Content Container (Full-Width Responsive 1536px Grid) */}
        <div className="relative z-10 w-full max-w-[1536px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (8 cols): Typography & Real Enterprise Badges */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Campaign Badge with Official Nexus Logo */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="py-1 px-3 bg-white/95 border border-white/60 shadow-xs rounded-full">
                <NexusBrandLogo size="sm" variant="light" asLink={false} />
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black tracking-wide border shadow-xs rounded-full ${slide.badgeAccent}`}
              >
                <span className="h-1.5 w-1.5 bg-emerald-400 animate-pulse rounded-full" />
                <span>{slide.campaignBadge}</span>
              </span>
            </div>

            {/* Main Punchy Headlines in Clean White & Nexus Sky Blue */}
            <div className="space-y-1.5">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight text-white drop-shadow-xs">
                {slide.headlineMain}
                <span className="block text-sky-300 font-extrabold sm:mt-1">
                  {slide.headlineHighlight}
                </span>
              </h2>
              <p className="text-sm sm:text-base text-blue-100 font-medium leading-relaxed max-w-2xl drop-shadow-xs">
                {slide.subDescription}
              </p>
            </div>

            {/* 3 Key Feature Cards: Soft Rounded 2xl Cards, No Built-in Icons, with Interactive Select Effect */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 max-w-2xl">
              {slide.keyFeatures.map((feat, fIdx) => {
                const isSelected = selectedFeature === fIdx;
                return (
                  <div
                    key={fIdx}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedFeature(fIdx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedFeature(fIdx);
                      }
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer select-none text-left relative overflow-hidden ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xl ring-2 ring-sky-400 border border-transparent scale-[1.02]'
                        : 'bg-white/90 hover:bg-white text-slate-800 shadow-md border border-white/80 hover:scale-[1.01] hover:border-sky-300/70'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600" />
                    )}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {feat.label}
                      </span>
                      {isSelected && (
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-tight">
                      {feat.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAction(slide.primaryAction.type)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>{slide.primaryAction.label}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {slide.secondaryAction && (
                <button
                  type="button"
                  onClick={() => handleAction(slide.secondaryAction!.type)}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/25 transition active:scale-95 cursor-pointer"
                >
                  {slide.secondaryAction.type === 'zalo' && (
                    <PhoneCall className="h-4 w-4 text-sky-300" />
                  )}
                  <span>{slide.secondaryAction.label}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Solid White Promotion Card - Rounded 2xl, No Built-in Icon */}
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <div className="w-full max-w-xs bg-white p-5 rounded-2xl shadow-xl border border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 text-xs font-black uppercase tracking-wider border border-blue-200 rounded-full">
                  {slide.saleSticker.tag}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  0{currentSlide + 1} / 0{PROMO_SLIDES.length}
                </span>
              </div>

              <div className="pt-1">
                <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {slide.saleSticker.title}
                </h4>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {slide.saleSticker.sub}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span className="cursor-pointer hover:underline" onClick={() => handleAction('create')}>
                  Tạo đơn trải nghiệm &rarr;
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Đề tài CNTT 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* J&T-Style Floating Navigation Chevron Controls */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-slate-800 hover:text-blue-600 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="Slide trước"
          title="Banner trước"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-slate-800 hover:text-blue-600 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer"
          aria-label="Slide tiếp theo"
          title="Banner tiếp theo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* J&T-Style Expanding Pagination Bars (Bottom Right) */}
        <div className="absolute bottom-4 right-6 sm:right-10 z-20 flex items-center gap-1.5">
          {PROMO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? 'w-8 bg-blue-500 shadow-xs'
                  : 'w-3 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Đi tới banner ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. J&T-STYLE INTEGRATED QUICK UTILITY BAR (Full-Width Responsive 1536px Layout) */}
      <div className="bg-white border-t border-slate-200 shadow-xs">
        {/* Official Station Branding Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white border-b border-blue-500/50 shadow-xs">
          <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <NexusBrandMark size="sm" variant="dark" className="shadow-xs" />
              <div>
                <h3 className="font-black text-xs sm:text-sm tracking-tight text-white flex items-center gap-2">
                  TRẠM DỊCH VỤ BƯU CHÍNH ĐIỆN TỬ NEXUS EXPRESS
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-white/20 text-white border border-white/30">
                    <span className="h-1.5 w-1.5 bg-emerald-300 animate-pulse" />
                    Đồ Án Kỹ Sư CNTT 2026
                  </span>
                </h3>
                <p className="text-[10px] text-blue-100 font-medium">Mô hình điều phối trung tâm khai thác bưu phẩm • Tra cứu hành trình thời gian thực • Mạng lưới 34 Hubs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-blue-100">
                <span>Tổng Đài Demo: <strong className="text-white font-mono">1900 0000</strong></span>
                <span className="text-blue-300">•</span>
                <span>Zalo Trực Tuyến: <strong className="text-white font-mono">0869 500 573</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Header (Full-Width 1536px) */}
        <div className="w-full max-w-[1536px] mx-auto border-b border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-black transition cursor-pointer ${
              activeTab === 'track'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Search className="h-4 w-4 text-blue-600" />
            <span>Tra Cứu Vận Đơn</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('calc');
              handleAction('calculator');
            }}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeTab === 'calc'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Calculator className="h-4 w-4 text-emerald-600" />
            <span>Ước Tính Cước Phí</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('network');
              navigate('/network');
            }}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeTab === 'network'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <MapPin className="h-4 w-4 text-amber-500" />
            <span>34 Bưu Cục Toàn Quốc</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('zalo');
              handleAction('zalo');
            }}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
              activeTab === 'zalo'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <PhoneCall className="h-4 w-4 text-blue-500" />
            <span>Hotline / Zalo 24/7</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Tra Cứu Vận Đơn (Full-Width Responsive 1536px Console) */}
      {activeTab === 'track' && (
        <div className="w-full max-w-[1536px] mx-auto p-5 sm:p-7 bg-white rounded-b-2xl border-x border-b border-slate-200 shadow-xs space-y-4">
            {/* Account Status / Security Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {isLoggedIn ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[11px] rounded-full">
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  Tài khoản: {userDisplayName || userPhone} (Đã xác thực bảo mật)
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[11px] rounded-full">
                  <Lock className="h-3 w-3 text-blue-600" />
                  Tra cứu an toàn: Khách chưa đăng nhập vui lòng nhập Mã vận đơn & SĐT người nhận
                </div>
              )}

              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1 ml-auto cursor-pointer"
                >
                  Đăng nhập xem nhanh <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Tracking Input Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 border border-blue-200 rounded">
                  AWB#
                </span>
                <input
                  type="text"
                  value={currentCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Nhập mã vận đơn bưu chính (VD: 111089343576)..."
                  className="w-full rounded-lg bg-slate-50 pl-20 pr-10 py-3 text-sm font-mono font-bold uppercase tracking-wider text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 border border-slate-300 transition shadow-2xs"
                />
                {currentCode && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="Xóa mã"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!isLoggedIn && (
                <div className="relative sm:w-64">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone && setReceiverPhone(e.target.value)}
                    placeholder="SĐT người nhận..."
                    className="w-full rounded-lg bg-slate-50 pl-10 pr-3 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 border border-slate-300 transition shadow-2xs"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-xs active:scale-95 cursor-pointer"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" strokeWidth={2.4} />
                )}
                <span>Tra Cứu Vận Đơn</span>
              </button>
            </form>

            {/* Quick Demo Barcode Sample Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-blue-600" /> Mã bưu phẩm mẫu:
              </span>
              {[
                { code: '111089343576', desc: 'Hà Nội' },
                { code: '111000000074', desc: 'TP.HCM' },
                { code: '111000000064', desc: 'Đà Nẵng' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => {
                    handleCodeChange(sample.code);
                    if (onSampleCodeClick) {
                      onSampleCodeClick(sample.code);
                    }
                  }}
                  className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 font-mono text-xs font-bold border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{sample.code}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({sample.desc})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
