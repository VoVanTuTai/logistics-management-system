import React from 'react';

import '../dashboard/analytics/AnalyticsDashboard.css';

interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
  visionText?: string;
  phaseLabel?: string;
  badgeLabel?: string;
}

export function ComingSoonPlaceholder({
  title,
  description,
  visionText,
  phaseLabel = 'Production hardening roadmap',
  badgeLabel = 'Đang hoàn thiện',
}: ComingSoonPlaceholderProps): React.JSX.Element {
  return (
    <div className="coming-soon">
      <div className="coming-soon__card">
        {/* Animated icon */}
        <div className="coming-soon__icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>

        <span className="coming-soon__badge">{badgeLabel}</span>

        {/* Title */}
        <h2 className="coming-soon__title">{title}</h2>

        {/* Description */}
        <p className="coming-soon__desc">{description}</p>

        {/* Architecture vision block */}
        {visionText ? (
          <div className="coming-soon__vision">
            <strong>Tầm nhìn kiến trúc:</strong> {visionText}
          </div>
        ) : null}

        {/* Phase label */}
        <span className="coming-soon__phase">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {phaseLabel}
        </span>
      </div>
    </div>
  );
}
