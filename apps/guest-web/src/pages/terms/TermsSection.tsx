import React from 'react';
import { Calendar, Tag, CheckCircle, Clock } from 'lucide-react';

import type { PublicPolicyItem } from '../../services/api/policy.api';
import { CATEGORY_NAMES } from '../../services/api/policy.api';

interface TermsSectionProps {
  policy: PublicPolicyItem;
  index: number;
}

export function TermsSection({ policy, index }: TermsSectionProps): React.JSX.Element {
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Áp dụng từ 2026';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Convert simple markdown headings and paragraphs into styled JSX
  const renderFormattedContent = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.JSX.Element[] = [];

    let currentList: string[] = [];
    let keyIdx = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${keyIdx++}`} className="space-y-1.5 my-3 pl-2">
            {currentList.map((item, lIdx) => (
              <li key={lIdx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>{renderInlineFormatting(item)}</span>
              </li>
            ))}
          </ul>,
        );
        currentList = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Heading 3: ### ...
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4
            key={`h3-${keyIdx++}`}
            className="text-sm font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2 border-b border-slate-100 pb-1.5"
          >
            <span className="w-2 h-2 rounded-sm bg-blue-600 shrink-0" />
            {trimmed.replace('### ', '')}
          </h4>,
        );
        return;
      }

      // Heading 2: ## ...
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h3
            key={`h2-${keyIdx++}`}
            className="text-base font-extrabold text-slate-900 mt-6 mb-3 flex items-center gap-2"
          >
            {trimmed.replace('## ', '')}
          </h3>,
        );
        return;
      }

      // Bullet points: - ... or * ...
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentList.push(trimmed.substring(2));
        return;
      }

      // Numbered items: 1. ...
      if (/^\d+\.\s/.test(trimmed)) {
        flushList();
        const num = trimmed.match(/^(\d+)\.\s/)?.[1] || '1';
        const text = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={`num-${keyIdx++}`} className="flex items-start gap-2.5 my-2.5 text-xs text-slate-700 leading-relaxed">
            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              {num}
            </span>
            <span>{renderInlineFormatting(text)}</span>
          </div>,
        );
        return;
      }

      // Normal paragraph
      flushList();
      elements.push(
        <p key={`p-${keyIdx++}`} className="text-xs text-slate-700 leading-relaxed my-2">
          {renderInlineFormatting(trimmed)}
        </p>,
      );
    });

    flushList();
    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    // Simple inline bold **text** and code `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-slate-100 text-blue-700 font-mono text-[11px] font-semibold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <article
      id={policy.slug}
      className="scroll-mt-28 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 lg:p-8 space-y-5 transition hover:shadow-md"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 border border-blue-100">
              <Tag className="w-3 h-3" />
              {CATEGORY_NAMES[policy.category] || policy.category}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Phiên bản v{policy.version}
            </span>
          </div>
          <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight">
            {policy.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Hiệu lực: {formatDate(policy.effectiveDate || policy.publishedAt)}</span>
        </div>
      </div>

      {/* Summary Box */}
      {policy.summary && (
        <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 rounded-xl border border-blue-100/80 text-xs text-blue-950 leading-relaxed flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-900 block mb-0.5 uppercase text-[10px] tracking-wider">
              Tóm tắt quy định
            </span>
            <p className="text-slate-700 font-normal">{policy.summary}</p>
          </div>
        </div>
      )}

      {/* Structured Content */}
      <div className="prose prose-slate max-w-none text-slate-700">
        {renderFormattedContent(policy.content)}
      </div>
    </article>
  );
}
