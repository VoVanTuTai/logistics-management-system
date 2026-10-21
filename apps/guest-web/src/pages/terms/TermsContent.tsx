import React from 'react';
import { ShieldCheck, HelpCircle, PhoneCall, Mail, ArrowUpRight, Search } from 'lucide-react';

import type { PublicPolicyItem } from '../../services/api/policy.api';
import { TermsSection } from './TermsSection';

interface TermsContentProps {
  policies: PublicPolicyItem[];
  searchTerm: string;
  onClearSearch: () => void;
}

export function TermsContent({
  policies,
  searchTerm,
  onClearSearch,
}: TermsContentProps): React.JSX.Element {
  return (
    <div className="flex-1 min-w-0 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 lg:p-10 relative overflow-hidden border border-slate-800 rounded-2xl shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Chính sách chính thức của Nexus Express</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Điều khoản dịch vụ & Quy định vận hành
          </h1>

          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed font-normal">
            Toàn bộ quy định về gửi nhận bưu gửi, quy chuẩn đóng gói, bồi thường thiệt hại,
            và nghĩa vụ của các bên khi sử dụng hệ sinh thái vận chuyển Nexus Express.
          </p>
        </div>
      </div>

      {/* Search Filter Status indicator */}
      {searchTerm && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-900 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span>
              Kết quả tìm kiếm cho: <strong>"{searchTerm}"</strong> ({policies.length} điều khoản)
            </span>
          </div>
          <button
            type="button"
            onClick={onClearSearch}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
          >
            Xóa tìm kiếm
          </button>
        </div>
      )}

      {/* List of Policy Sections */}
      {policies.length > 0 ? (
        <div className="space-y-6">
          {policies.map((policy, idx) => (
            <TermsSection key={policy.id} policy={policy} index={idx} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy điều khoản nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không có quy định hoặc điều khoản nào khớp với từ khóa "{searchTerm}".
            </p>
          </div>
          <button
            type="button"
            onClick={onClearSearch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 rounded-lg transition"
          >
            Xem tất cả điều khoản
          </button>
        </div>
      )}

      {/* Bottom Help / Support Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Cần giải đáp về quy định?</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Đội ngũ hỗ trợ pháp lý & CSKH Nexus 24/7
          </h3>
          <p className="text-xs text-slate-500">
            Nếu có bất kỳ thắc mắc nào về quyền lợi bồi thường hay điều khoản dịch vụ, hãy liên hệ ngay.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="tel:19008888"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
            <span>Hotline: 1900 8888</span>
          </a>
          <a
            href="mailto:support@nexusexpress.vn"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition border border-blue-200"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gửi khiếu nại</span>
          </a>
        </div>
      </div>
    </div>
  );
}
