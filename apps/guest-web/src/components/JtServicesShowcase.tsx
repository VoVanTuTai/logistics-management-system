import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Zap,
  ShieldCheck,
  Package,
  ArrowRight,
  Clock,
  Percent,
  CheckCircle2,
  Boxes,
} from 'lucide-react';

interface LogisticsServiceItem {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  highlight: string;
  description: string;
  features: string[];
  actionLabel: string;
  actionTo: string;
  image: string;
}

const SERVICES: LogisticsServiceItem[] = [
  {
    id: 'standard',
    badge: 'TIẾT KIỆM TỐI ĐA',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'Nexus Standard Express',
    highlight: 'Chuyển Phát Tiêu Chuẩn Toàn Quốc',
    description:
      'Dịch vụ vận chuyển bưu kiện thương mại điện tử chuyên nghiệp, tối ưu chi phí cho các Shop Online với tỷ lệ giao thành công trên 98%.',
    features: [
      'Phủ sóng 100% quận huyện và 63 tỉnh thành',
      'Miễn phí lấy hàng tận nhà cho chủ shop',
      'Theo dõi trạng thái bưu kiện 24/7 theo thời gian thực',
    ],
    actionLabel: 'Tạo Vận Đơn Tiết Kiệm',
    actionTo: '/create',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'fast',
    badge: 'HỎA TỐC 24H',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    title: 'Nexus Fast Air-Express',
    highlight: 'Chặng Bay IATA Bắc - Nam 24 Giờ',
    description:
      'Ưu tiên kết nối các chuyến bay chuyên dụng của các hãng hàng không hàng đầu, giao nhận hỏa tốc Hà Nội ⇄ TP.HCM trong ngày.',
    features: [
      'Cam kết thời gian chuẩn SLA 99.4%',
      'Lấy hàng ngay sau 30 phút đặt lịch',
      'Hoàn cước 100% nếu trễ hẹn cam kết',
    ],
    actionLabel: 'Giao Hỏa Tốc Ngay',
    actionTo: '/create',
    image:
      'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cargo',
    badge: 'AN TOÀN TUYỆT ĐỐI',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    title: 'Nexus Heavy & Secure',
    highlight: 'Hàng Cồng Kềnh & Niêm Phong Seal X8',
    description:
      'Quy chuẩn đóng gói bọc lót chống sốc 3 lớp, kẹp chì niêm phong điện tử Seal X8 chống thất thoát, bảo hiểm đền bù 100% giá trị bưu kiện.',
    features: [
      'Đền bù 100% giá trị khai giá trong 24h',
      'Phân loại tự động 3D sensor chống quăng quật',
      'Chiết khấu trọng lượng lớn theo thể tích IATA',
    ],
    actionLabel: 'Dự Toán Cước Hàng Lớn',
    actionTo: '#fee-calculator-section',
    image:
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cod',
    badge: 'ĐẶC QUYỀN SHOP',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    title: 'Nexus COD & Fulfillment',
    highlight: 'Thu Hộ 0 Đồng • Đối Soát T+1 Mỗi Sáng',
    description:
      'Giải pháp tối ưu dòng tiền kinh doanh hàng đầu cho nhà bán hàng: Chuyển khoản tiền thu hộ COD tự động mỗi sáng lúc 09:00.',
    features: [
      'Miễn phí 100% cước thu hộ COD toàn quốc',
      'Bằng chứng giao nhận chữ ký số & ảnh POD MinIO',
      'Tặng ngay 50.000đ khi mở tài khoản gửi hàng',
    ],
    actionLabel: 'Đăng Ký Nhận Ưu Đãi',
    actionTo: '/create',
    image:
      'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80',
  },
];

export const JtServicesShowcase: React.FC = () => {
  const navigate = useNavigate();
  const [selectedServiceId, setSelectedServiceId] = useState<string>('express');

  const handleAction = (to: string) => {
    if (to.startsWith('#')) {
      const el = document.getElementById(to.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    navigate(to);
  };

  return (
    <section id="flagship-services" className="space-y-6 pt-4" aria-label="Dịch vụ chuyển phát chủ lực">
      {/* Section Header (J&T style) */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
          <Truck className="h-3.5 w-3.5 text-blue-600" />
          Dịch Vụ Bưu Chính & Chuyển Phát Chủ Lực
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Giải Pháp Vận Chuyển Toàn Diện Cùng Nexus
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          Được thiết kế linh hoạt đáp ứng mọi nhu cầu gửi bưu phẩm, thương mại điện tử và kiện hàng cồng kềnh với tốc độ vượt trội và chi phí tối ưu.
        </p>
      </div>

      {/* 4 Flagship Services Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SERVICES.map((svc) => {
          const isSelected = selectedServiceId === svc.id;
          return (
            <div
              key={svc.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedServiceId(svc.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedServiceId(svc.id);
                }
              }}
              className={`group bg-white border rounded-2xl shadow-xs transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer select-none relative ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600 shadow-xl -translate-y-1.5'
                  : 'border-slate-200 hover:shadow-xl hover:border-blue-400 hover:-translate-y-0.5'
              }`}
            >
              {/* Service Visual Preview */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={svc.image}
                  alt={svc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent pointer-events-none" />

                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                  <span
                    className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider border shadow-xs rounded-full ${svc.badgeColor}`}
                  >
                    {svc.badge}
                  </span>
                  {isSelected && (
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-md rounded-full border border-blue-400 animate-fade-in">
                      Đang chọn
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                  <h3 className="font-black text-lg tracking-tight leading-snug drop-shadow-xs">
                    {svc.title}
                  </h3>
                  <p className="text-xs text-sky-300 font-bold mt-0.5 truncate">
                    {svc.highlight}
                  </p>
                </div>
              </div>

              {/* Service Details & Feature Bullets */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {svc.description}
                </p>

                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  {svc.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="font-semibold leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(svc.actionTo);
                  }}
                  className={`w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider border rounded-xl transition active:scale-95 cursor-pointer group/btn shadow-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600'
                  }`}
                >
                  <span>{isSelected ? `${svc.actionLabel} • Đã Chọn` : svc.actionLabel}</span>
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
