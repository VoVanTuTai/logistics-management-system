import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Truck,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Building2,
  ExternalLink,
  Clock,
  CheckCircle2,
  GraduationCap,
  Code2,
  BookOpen,
  Cpu,
} from 'lucide-react';
import { ZaloIcon } from './ZaloIcon';
import { NexusBrandLogo } from './NexusBrandLogo';

export const PortalFooter: React.FC = () => {
  return (
    <footer id="layout-footer" className="w-full bg-gradient-to-b from-blue-600 to-blue-700 text-white border-t-4 border-blue-500 mt-16 font-sans select-none shadow-inner">
      {/* Upper Info Grid (Full-Width Responsive Container) */}
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1 (5 cols): Academic Thesis Information & Capstone Overview */}
          <div className="lg:col-span-5 space-y-4">
            {/* Logo inverts cleanly with white squircle & bold blue N */}
            <NexusBrandLogo size="lg" variant="dark" showSlogan={true} />

            <div className="space-y-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 rounded-full">
                <GraduationCap className="h-3.5 w-3.5 text-amber-300" />
                <span>Đồ Án Khóa Luận Tốt Nghiệp Kỹ Sư CNTT</span>
              </div>

              <h4 className="text-sm font-black text-white leading-snug">
                HỆ THỐNG QUẢN LÝ BƯU CHÍNH & ĐIỀU PHỐI LOGISTICS THÔNG MINH
              </h4>

              <p className="text-xs text-blue-100 font-medium leading-relaxed">
                Đề tài khóa luận tốt nghiệp chuyên ngành <strong>Hệ thống Thông tin & Công nghệ Phần mềm</strong>. Dự án tập trung nghiên cứu và ứng dụng giải pháp chuyển đổi số hạ tầng bưu chính: mô hình hóa điều phối mạng lưới 34 Hub trung tâm, đối soát dòng tiền thu hộ COD tự động và trợ lý ảo AI CSKH tra cứu vận đơn thời gian thực.
              </p>
            </div>

            <div className="space-y-2 text-xs text-blue-100 pt-1">
              <div className="p-3 bg-blue-800/60 border border-blue-400/30 rounded-xl flex items-start gap-2.5">
                <BookOpen className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white block font-bold mb-0.5">Mục đích nghiên cứu & thực nghiệm:</strong>
                  Dự án được xây dựng hoàn toàn phục vụ mục đích học thuật và bảo vệ đồ án tốt nghiệp kỹ sư (Non-commercial Academic Capstone Project). Toàn bộ mã vận đơn, thông tin đơn hàng và dữ liệu vận hành là mô phỏng thực nghiệm.
                </div>
              </div>

              <div className="p-3 bg-blue-800/60 border border-blue-400/30 rounded-xl flex items-start gap-2.5">
                <Cpu className="h-4 w-4 text-sky-200 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white block font-bold mb-0.5">Kiến trúc & Ngăn xếp công nghệ:</strong>
                  ReactJS (TypeScript) • Microservices Architecture • PostgreSQL & Redis Cache • MinIO S3 Proof-of-Delivery • Hybrid AI RAG CSKH.
                </div>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 bg-blue-800/70 border border-blue-400/40 rounded-full text-[11px] font-bold text-sky-200 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Phiên Bản Thử Nghiệm Trực Tuyến
              </div>
              <div className="px-3 py-1.5 bg-blue-800/70 border border-blue-400/40 rounded-full text-[11px] font-bold text-white">
                Khóa Luận Kỹ Sư 2026
              </div>
            </div>
          </div>

          {/* Column 2 (2 cols): System Modules & Core Features */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-l-2 border-sky-300 pl-2.5">
              Module Đề Tài
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <RouterLink to="/" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Tra cứu vận đơn (e-AWB)
                </RouterLink>
              </li>
              <li>
                <a href="#fee-calculator-section" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Tính cước chuẩn IATA
                </a>
              </li>
              <li>
                <RouterLink to="/network" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Mạng lưới 34 Bưu cục Hub
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/create" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Cổng tạo đơn gửi hàng
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/orders" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Quản lý đơn hàng người nhận
                </RouterLink>
              </li>
            </ul>
          </div>

          {/* Column 3 (2 cols): Academic Policies & Specifications */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-l-2 border-sky-300 pl-2.5">
              Quy Chuẩn Bưu Chính
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <RouterLink to="/terms-of-service" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Bảo hiểm bưu gửi 100%
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/terms-of-service" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Quy chuẩn niêm phong Seal X8
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/terms-of-service" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Đối soát thu hộ COD T+1
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/terms-of-service" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Điều khoản dịch vụ bưu chính
                </RouterLink>
              </li>
              <li>
                <RouterLink to="/terms-of-service" className="text-blue-100 hover:text-white hover:underline transition font-medium">
                  Bảo mật dữ liệu người dùng
                </RouterLink>
              </li>
            </ul>
          </div>

          {/* Column 4 (3 cols): Contact Channels & Demo Information */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white border-l-2 border-sky-300 pl-2.5">
              Kênh Tra Cứu & Trực Tuyến
            </h4>

            {/* Direct Zalo Card */}
            <a
              href="https://zalo.me/0869500573"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-800/70 hover:bg-blue-800/90 border border-blue-400/40 rounded-xl transition group shadow-xs"
            >
              <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <ZaloIcon className="h-9 w-9" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white group-hover:text-sky-200 transition-colors">
                  Zalo CSKH Thử Nghiệm
                </p>
                <p className="text-[11px] text-blue-100 font-mono">0869 500 573 (Nhấn để chat)</p>
              </div>
              <ExternalLink className="h-4 w-4 text-blue-200 group-hover:text-white" />
            </a>

            <div className="space-y-2 text-xs text-blue-100 pt-1">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-sky-200 shrink-0" />
                <span>
                  Tổng Đài Thử Nghiệm: <strong className="text-white font-mono">1900 0000</strong>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-200 shrink-0" />
                <span>cskh@nexuslogistics.vn</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-sky-200 shrink-0 mt-0.5" />
                <span>
                  Trung tâm vận hành mô phỏng: Tòa nhà Nexus Tower, TP. Hồ Chí Minh
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Row */}
      <div className="w-full border-t border-blue-500/60 bg-blue-800 py-4 text-center text-xs text-blue-100">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Nexus Logistics Management System — Đồ án Khóa Luận Tốt Nghiệp Kỹ Sư CNTT. Nghiên cứu học thuật phi thương mại.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <RouterLink to="/terms-of-service" className="hover:text-white transition">
              Quy Chuẩn Đề Tài
            </RouterLink>
            <span>•</span>
            <RouterLink to="/terms-of-service" className="hover:text-white transition">
              Bảo Mật
            </RouterLink>
            <span>•</span>
            <RouterLink to="/network" className="hover:text-white transition">
              34 Hubs Toàn Quốc
            </RouterLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
