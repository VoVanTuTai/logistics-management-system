import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Building2,
  Clock,
  ShieldCheck,
  Cpu,
  FileText,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Award,
} from 'lucide-react';

export const JtCommitmentsAndSteps: React.FC = () => {
  return (
    <div className="space-y-16 pt-4">
      {/* 1. WHY CHOOSE US (4 Commitments Pillars matching J&T Express) */}
      <section className="space-y-8" aria-label="Cam kết chất lượng bưu chính">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
            <Award className="h-3.5 w-3.5 text-blue-600" />
            Năng Lực Bưu Chính & Cam Kết Dịch Vụ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Vì Sao Hơn 100.000 Shop Chọn Nexus Logistics?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Hạ tầng bưu chính công nghệ cao kết hợp quy trình quản lý chất lượng nghiêm ngặt, đảm bảo mỗi kiện hàng đều đến nơi an toàn, đúng giờ.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs hover:shadow-lg hover:border-blue-400 transition-all space-y-3">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-xs">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="font-black text-base text-slate-900 tracking-tight">
              Mạng Lưới 34 Hub Toàn Quốc
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              34 Trung tâm khai thác bưu phẩm hiện đại, phủ sóng 100% quận huyện và 63 tỉnh thành Việt Nam.
            </p>
          </div>

          <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs hover:shadow-lg hover:border-blue-400 transition-all space-y-3">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-black text-base text-slate-900 tracking-tight">
              Đúng Giờ Cam Kết 99.4%
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Phân luồng thông minh, giờ xuất bến cố định và ưu tiên đường bay IATA Bắc - Nam 24 giờ.
            </p>
          </div>

          <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs hover:shadow-lg hover:border-blue-400 transition-all space-y-3">
            <div className="h-12 w-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-base text-slate-900 tracking-tight">
              Bảo Hiểm Đền Bù 100%
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Chính sách bảo hiểm minh bạch, giải quyết bồi thường kiện hàng thất thoát trong vòng 24 giờ.
            </p>
          </div>

          <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs hover:shadow-lg hover:border-blue-400 transition-all space-y-3">
            <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-xs">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="font-black text-base text-slate-900 tracking-tight">
              Số Hóa & Ký Nhận POD MinIO
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Theo dõi GPS thời gian thực, chữ ký số và biên bản ảnh thật bưu tá đồng bộ tức thì.
            </p>
          </div>
        </div>
      </section>

      {/* 2. 4 STEPS HOW IT WORKS (Quy trình gửi hàng chuẩn bưu chính) */}
      <section className="bg-gradient-to-b from-blue-50/70 via-white to-slate-50/80 p-8 sm:p-10 border border-blue-100 rounded-2xl shadow-xs space-y-8" aria-label="Quy trình gửi hàng">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider bg-white text-blue-700 border border-blue-200 rounded-full shadow-2xs">
            Quy Trình Chuẩn Bưu Chính
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Gửi Hàng Nhanh Chóng Trong 4 Bước
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Thao tác đơn giản trực tiếp trên Web hoặc ứng dụng di động mà không cần đến bưu cục.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              icon: FileText,
              title: 'Tạo Vận Đơn Online',
              desc: 'Nhập thông tin người gửi, người nhận và chọn dịch vụ vận chuyển mong muốn.',
            },
            {
              step: '02',
              icon: Package,
              title: 'Lấy Hàng Tận Nơi 30P',
              desc: 'Bưu tá Nexus tiếp nhận đơn và đến tận nhà lấy hàng, dán tem mã vạch chuẩn Code-128.',
            },
            {
              step: '03',
              icon: Truck,
              title: 'Phân Loại & Vận Chuyển',
              desc: 'Kiện hàng được tự động hóa phân tuyến và vận chuyển liên tỉnh trên tuyến xe hoặc máy bay.',
            },
            {
              step: '04',
              icon: CheckCircle2,
              title: 'Giao Nhận & Đối Soát',
              desc: 'Bưu tá giao tận tay, người nhận ký POD MinIO và tiền thu hộ COD về ví Shop mỗi sáng.',
            },
          ].map((item, idx) => {
            const StepIcon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between space-y-3 relative group hover:border-blue-400 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner inside Steps */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-blue-100">
          <div>
            <h4 className="font-black text-sm text-slate-900">
              Bạn Đã Sẵn Sàng Trải Nghiệm Dịch Vụ Cùng Nexus?
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Đăng ký gửi đơn ngay hôm nay để nhận ưu đãi giảm 20% cước liên tỉnh.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <RouterLink
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-xs transition active:scale-95"
            >
              <span>Tạo Vận Đơn Ngay</span>
              <ArrowRight className="h-4 w-4" />
            </RouterLink>

            <a
              href="https://zalo.me/0869500573"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 rounded-lg transition"
            >
              <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
              <span>Tư Vấn Zalo</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
