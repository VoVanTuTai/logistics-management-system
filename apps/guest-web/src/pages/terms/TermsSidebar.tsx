import React from 'react';
import { BookOpen, ChevronRight, Search, ShieldCheck, FileText } from 'lucide-react';

import type { PublicPolicyItem } from '../../services/api/policy.api';
import { CATEGORY_NAMES } from '../../services/api/policy.api';

interface TermsSidebarProps {
  policies: PublicPolicyItem[];
  activeSlug: string | null;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSelectSection: (slug: string) => void;
}

export function TermsSidebar({
  policies,
  activeSlug,
  searchTerm,
  onSearchChange,
  onSelectSection,
}: TermsSidebarProps): React.JSX.Element {
  return (
    <aside className="w-full lg:w-80 shrink-0 sticky top-2 lg:top-4 z-20 self-start">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Mục lục điều khoản
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {policies.length} điều khoản chính sách
            </p>
          </div>
        </div>

        {/* Search Input within Terms */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm quy định..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Navigation List with scroll */}
        <nav className="space-y-1 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
          {policies.map((policy, idx) => {
            const isActive = activeSlug === policy.slug;
            return (
              <button
                key={policy.id}
                type="button"
                onClick={() => onSelectSection(policy.slug)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-start justify-between gap-2 transition group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate leading-snug">{policy.title}</p>
                    <span
                      className={`text-[10px] font-medium block mt-0.5 ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {CATEGORY_NAMES[policy.category] || policy.category}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-blue-600'
                  }`}
                />
              </button>
            );
          })}

          {policies.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              Không tìm thấy mục phù hợp.
            </div>
          )}
        </nav>

        {/* Support Callout */}
        <div className="pt-3 border-t border-slate-100">
          <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-blue-100/60 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <div className="text-[11px]">
              <p className="font-bold text-slate-900">Bảo vệ quyền lợi</p>
              <p className="text-slate-500 text-[10px] leading-tight">
                Mọi đơn hàng vận chuyển tại Nexus đều được bảo hiểm & giải quyết theo chính sách này.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
