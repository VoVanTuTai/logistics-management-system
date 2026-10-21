import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface NexusBrandMarkProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'white';
}

/**
 * Unified Standalone Letter 'N' Emblem of Nexus Logistics Express
 * Clean, bold, iconic courier monogram with signature accent dot.
 */
export const NexusBrandMark: React.FC<NexusBrandMarkProps> = ({
  className = '',
  size = 'md',
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  const sizeMap = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
  };

  return (
    <div
      className={`relative ${sizeMap[size]} ${
        isDark
          ? 'bg-white text-blue-600 shadow-xs border border-white'
          : 'bg-blue-600 text-white shadow-xs'
      } flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-200 select-none overflow-hidden ${className}`}
    >
      {/* Crisp Unified Letter N Monogram */}
      <svg
        viewBox="0 0 210 210"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
        aria-hidden="true"
      >
        {/* Bold Letter N: Inverted on dark variant */}
        <path
          d="M58 154V56h28l36 52V56h28v98h-28L86 102v52H58Z"
          fill={isDark ? '#2563EB' : '#FFFFFF'}
        />
        {/* Signature Cyan Accent Dot */}
        <circle cx="156" cy="154" r="7.5" fill={isDark ? '#0284C7' : '#93C5FD'} />
      </svg>
    </div>
  );
};

export interface NexusBrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSlogan?: boolean;
  showIconOnly?: boolean;
  asLink?: boolean;
  className?: string;
}

export const NexusBrandLogo: React.FC<NexusBrandLogoProps> = ({
  size = 'md',
  variant = 'light',
  showSlogan = true,
  showIconOnly = false,
  asLink = true,
  className = '',
}) => {
  const isDark = variant === 'dark';

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Unified Letter N Mark (Sharp square emblem) */}
      <NexusBrandMark size={size} variant={variant} />

      {/* Brand Typography */}
      {!showIconOnly && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${textSizes[size]} ${
                isDark ? 'text-white' : 'text-slate-900'
              } transition-colors font-sans`}
            >
              NEXUS
            </span>
            <span
              className={`inline-flex items-center font-black uppercase tracking-wider italic ${
                isDark ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
              } ${badgeSizes[size]}`}
            >
              EXPRESS
            </span>
          </div>

          {showSlogan && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${
                  isDark ? 'text-sky-200' : 'text-blue-600'
                }`}
              >
                Hệ Thống Bưu Chính & Logistics
              </span>
              <span className="hidden sm:inline-block h-1 w-1 bg-emerald-400" />
              <span
                className={`hidden sm:inline-block text-[8px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                Đồ Án Tốt Nghiệp Kỹ Sư CNTT
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <RouterLink
        to="/"
        className="inline-flex items-center focus:outline-none"
        aria-label="Trang chủ Nexus Logistics Express"
      >
        {content}
      </RouterLink>
    );
  }

  return content;
};


