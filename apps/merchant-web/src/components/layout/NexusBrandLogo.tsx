import React from 'react';

export interface NexusBrandLogoProps {
  size?: number;
  portal?: 'merchant' | 'ops' | 'admin';
  showLabel?: boolean;
  theme?: 'dark' | 'light';
  subTitle?: string;
}

export function NexusBrandLogo({
  size = 32,
  portal = 'merchant',
  showLabel = true,
  theme = 'light',
  subTitle,
}: NexusBrandLogoProps): React.JSX.Element {
  const iconSize = Math.round(size * 0.68);

  const portalLabels = {
    merchant: {
      badge: 'Merchant Portal',
      badgeClass: 'nexus-badge--merchant',
      fallbackSub: 'Cổng thông tin Đối tác',
    },
    ops: {
      badge: 'Control Tower',
      badgeClass: 'nexus-badge--ops',
      fallbackSub: 'Trung tâm Điều phối Bưu cục',
    },
    admin: {
      badge: 'System Admin',
      badgeClass: 'nexus-badge--admin',
      fallbackSub: 'Quản trị Hệ thống Trung ương',
    },
  };

  const portalConfig = portalLabels[portal];

  return (
    <div className={`nexus-brand-lockup nexus-brand-lockup--${theme}`}>
      <span
        className="nexus-brand-squircle"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          background: 'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 82, 204, 0.35)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 19.5V4.5L16.5 17.5V4.5"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19.5" cy="5" r="2.2" fill="#93c5fd" />
        </svg>
      </span>

      {showLabel ? (
        <div className="nexus-brand-text">
          <div className="nexus-brand-title-line">
            <strong className="nexus-brand-name">NEXUS</strong>
            <span className="nexus-brand-logistics">Logistics</span>
          </div>
          <div className="nexus-brand-sub-line">
            <span className={`nexus-portal-tag ${portalConfig.badgeClass}`}>
              {portalConfig.badge}
            </span>
            <span className="nexus-brand-sub">
              {subTitle ?? portalConfig.fallbackSub}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
