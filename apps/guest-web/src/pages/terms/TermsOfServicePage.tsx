import React, { useEffect, useState, useMemo } from 'react';
import { ShieldAlert, RefreshCw, Loader2, ArrowUp } from 'lucide-react';

import { listPublishedPolicies, type PublicPolicyItem } from '../../services/api/policy.api';
import { TermsSidebar } from './TermsSidebar';
import { TermsContent } from './TermsContent';

export function TermsOfServicePage(): React.JSX.Element {
  const [policies, setPolicies] = useState<PublicPolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listPublishedPolicies();
      setPolicies(data);
      if (data.length > 0) {
        setActiveSlug(data[0].slug);
      }
    } catch (err: any) {
      console.error('Failed to load terms of service:', err);
      setError(
        err?.response?.data?.message ||
          'Không thể tải dữ liệu điều khoản dịch vụ. Vui lòng kiểm tra lại kết nối mạng.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Filter policies based on search keyword
  const filteredPolicies = useMemo(() => {
    if (!searchTerm.trim()) return policies;
    const q = searchTerm.toLowerCase();
    return policies.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.summary && p.summary.toLowerCase().includes(q)) ||
        p.content.toLowerCase().includes(q),
    );
  }, [policies, searchTerm]);

  // Scrollspy to automatically highlight active sidebar item
  useEffect(() => {
    const mainEl = document.getElementById('main-content');

    const handleScroll = () => {
      const scrollY = mainEl ? mainEl.scrollTop : window.scrollY;
      setShowScrollTop(scrollY > 300);

      const sectionElements = filteredPolicies
        .map((p) => document.getElementById(p.slug))
        .filter((el): el is HTMLElement => Boolean(el));

      const scrollPosition = scrollY + 180;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el) {
          const topPos = mainEl ? el.offsetTop - mainEl.offsetTop : el.offsetTop;
          if (topPos <= scrollPosition) {
            setActiveSlug(el.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, [filteredPolicies]);

  const handleSelectSection = (slug: string) => {
    setActiveSlug(slug);
    const target = document.getElementById(slug);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToTop = () => {
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">
              Đang tải danh mục điều khoản & chính sách...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-500/5 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Không thể tải điều khoản</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchPolicies}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Main Content Layout */}
        {!loading && !error && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Table of Contents Sticky Sidebar */}
            <TermsSidebar
              policies={filteredPolicies}
              activeSlug={activeSlug}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelectSection={handleSelectSection}
            />

            {/* Main Policy Content Feed */}
            <TermsContent
              policies={filteredPolicies}
              searchTerm={searchTerm}
              onClearSearch={() => setSearchTerm('')}
            />
          </div>
        )}
      </div>

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          aria-label="Cuộn lên đầu trang"
          className="fixed bottom-8 right-8 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 transition duration-200 animate-fade-in focus:outline-none focus:ring-4 focus:ring-blue-500/20"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default TermsOfServicePage;
