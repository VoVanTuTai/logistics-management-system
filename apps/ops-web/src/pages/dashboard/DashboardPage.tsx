import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { routePaths } from '../../navigation/routes';
import { useAuthStore } from '../../store/authStore';
import { appEnv } from '../../utils/env';
import { AnalyticsDashboardPage } from './analytics/AnalyticsDashboardPage';
import './DashboardPage.css';

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function dedupeCodes(codes: string[]): string[] {
  return Array.from(
    new Set(
      codes
        .map((code) => normalizeCode(code))
        .filter((code) => code.length > 0),
    ),
  );
}

type DashboardMenuIcon =
  | 'basic_data'
  | 'operations_platform'
  | 'integration_services'
  | 'customer_platform'
  | 'branch_business'
  | 'finance_settlement'
  | 'capability_platform'
  | 'operations_metrics'
  | 'service_quality'
  | 'database'
  | 'smart_devices'
  | 'planning_platform';

function DashboardMenuOutlineIcon({
  icon,
}: {
  icon: DashboardMenuIcon;
}): React.JSX.Element {
  const outlineProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const accentStrokeProps = {
    ...outlineProps,
    stroke: 'var(--ops-menu-accent, #2563eb)',
  };
  const accentFill = 'var(--ops-menu-accent, #2563eb)';

  switch (icon) {
    case 'basic_data':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3.5h8l3 3V20H7z" {...outlineProps} />
          <path d="M15 3.5v3h3" {...outlineProps} />
          <path d="M9 11h6" {...accentStrokeProps} />
          <path d="M9 14.5h5.2" {...accentStrokeProps} />
        </svg>
      );
    case 'operations_platform':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="5" width="15" height="10" rx="1.5" {...outlineProps} />
          <path d="M8.5 18.5h7" {...outlineProps} />
          <path d="M10 8.5 14.4 10.2 10 12.4z" fill={accentFill} />
        </svg>
      );
    case 'integration_services':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="4.5" width="6" height="6" rx="1.2" {...outlineProps} />
          <rect x="13.5" y="13.5" width="6" height="6" rx="1.2" {...outlineProps} />
          <rect x="4.5" y="13.5" width="6" height="6" rx="1.2" {...outlineProps} />
          <circle cx="16.5" cy="7.5" r="3.4" {...accentStrokeProps} />
        </svg>
      );
    case 'customer_platform':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="7.3" r="3" {...outlineProps} />
          <path d="M6 19.5c.8-3.4 3.1-5.2 6-5.2s5.2 1.8 6 5.2z" {...outlineProps} />
          <path d="M12 13.9v4.5" {...accentStrokeProps} />
          <circle cx="12" cy="18.8" r="1.1" fill={accentFill} />
        </svg>
      );
    case 'branch_business':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20c3.8-3.5 5.8-6 5.8-8.8A5.8 5.8 0 0 0 12 5.4a5.8 5.8 0 0 0-5.8 5.8c0 2.8 2 5.3 5.8 8.8Z" {...outlineProps} />
          <circle cx="12" cy="11.1" r="1.9" fill={accentFill} />
        </svg>
      );
    case 'finance_settlement':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="6.2" width="15" height="11.6" rx="1.8" {...outlineProps} />
          <path d="M4.5 10h15" {...outlineProps} />
          <rect x="7.2" y="12.4" width="3.8" height="2.4" rx=".5" {...accentStrokeProps} />
        </svg>
      );
    case 'capability_platform':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8h9v7H5z" {...outlineProps} />
          <path d="M14 10h3l2 2v3h-5z" {...outlineProps} />
          <circle cx="8" cy="17.2" r="1.6" {...outlineProps} />
          <circle cx="16.8" cy="17.2" r="1.6" {...outlineProps} />
          <path d="M15.5 10.8h2.2v2h-2.2z" {...accentStrokeProps} />
        </svg>
      );
    case 'operations_metrics':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="5.5" width="15" height="11" rx="1.4" {...outlineProps} />
          <path d="M8 19h8" {...outlineProps} />
          <path d="m7.5 13 2.2-2.4 2.1 1.5 3.1-3.7" {...accentStrokeProps} />
        </svg>
      );
    case 'service_quality':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 12.8V11a6 6 0 0 1 12 0v1.8" {...outlineProps} />
          <rect x="5" y="12.2" width="2.7" height="5.2" rx="1" {...outlineProps} />
          <rect x="16.3" y="12.2" width="2.7" height="5.2" rx="1" {...outlineProps} />
          <path d="M9 18.2h3.2" {...outlineProps} />
          <circle cx="13.7" cy="18.2" r="1.1" fill={accentFill} />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5a7 7 0 1 0 7 7" {...outlineProps} />
          <path d="M12 5v7h7" {...outlineProps} />
          <rect x="14.5" y="6.5" width="4.2" height="4.2" rx=".7" {...accentStrokeProps} />
        </svg>
      );
    case 'smart_devices':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="6.5" width="10" height="11.5" rx="2" {...outlineProps} />
          <path d="M10.2 11h3.6" {...accentStrokeProps} />
          <path d="M8.8 4.6 7.4 3.2" {...accentStrokeProps} />
          <path d="m15.2 4.6 1.4-1.4" {...accentStrokeProps} />
          <rect x="5.2" y="10.2" width="1.8" height="4" rx=".6" {...outlineProps} />
          <rect x="17" y="10.2" width="1.8" height="4" rx=".6" {...outlineProps} />
        </svg>
      );
    case 'planning_platform':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="5.2" width="15" height="10.8" rx="1.4" {...outlineProps} />
          <path d="M8.5 19h7" {...outlineProps} />
          <circle cx="9" cy="10.2" r="1.2" {...accentStrokeProps} />
          <circle cx="15" cy="8.8" r="1.2" {...accentStrokeProps} />
          <circle cx="12" cy="12.8" r="1.2" {...accentStrokeProps} />
          <path d="m10.2 10 3.6-.9-2 2.9" {...accentStrokeProps} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" {...outlineProps} />
        </svg>
      );
  }
}

export function DashboardPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const currentRoles = session?.user.roles ?? [];
  const assignedHubCodes = dedupeCodes(session?.user.hubCodes ?? []);
  const canViewAllHubData = currentRoles.includes('SYSTEM_ADMIN');

  const effectiveHubCode = useMemo(() => {
    return assignedHubCodes[0] ?? undefined;
  }, [assignedHubCodes]);

  const hubsQuery = useHubsQuery(accessToken, {});

  const scopedHubs = useMemo(() => {
    if (canViewAllHubData) {
      return hubsQuery.data ?? [];
    }

    const assignedSet = new Set(assignedHubCodes);
    return (hubsQuery.data ?? []).filter((hub) =>
      assignedSet.has(normalizeCode(hub.code)),
    );
  }, [assignedHubCodes, canViewAllHubData, hubsQuery.data]);

  const currentHub = useMemo(() => {
    if (scopedHubs.length === 0) {
      return null;
    }

    if (!effectiveHubCode) {
      return scopedHubs[0];
    }

    return (
      scopedHubs.find((hub) => normalizeCode(hub.code) === effectiveHubCode) ??
      scopedHubs[0]
    );
  }, [effectiveHubCode, scopedHubs]);

  const quickMenu: ReadonlyArray<{
    title: string;
    to?: string;
    icon: DashboardMenuIcon;
    disabled?: boolean;
    featured?: boolean;
  }> = appEnv.enableFullOpsModules
    ? [
        {
          title: 'Nền tảng điều hành',
          to: routePaths.groupOperationsPlatform,
          icon: 'operations_platform',
          featured: true,
        },
        {
          title: 'Kinh doanh bưu cục',
          to: routePaths.groupBranchBusiness,
          icon: 'branch_business',
        },
        {
          title: 'Vận chuyển tuyến',
          to: routePaths.groupCapabilityPlatform,
          icon: 'capability_platform',
        },
        {
          title: 'Chỉ số vận hành',
          to: routePaths.groupOperationsMetrics,
          icon: 'operations_metrics',
        },
        {
          title: 'Chất lượng dịch vụ',
          to: routePaths.groupServiceQuality,
          icon: 'service_quality',
        },
      ]
    : [
        {
          title: 'Vận đơn',
          to: routePaths.shipments,
          icon: 'branch_business',
        },
        {
          title: 'Phân công tác vụ',
          to: routePaths.tasks,
          icon: 'operations_platform',
        },
        {
          title: 'Quản lý tem bao',
          to: routePaths.linehaulBagLabelManagement,
          icon: 'integration_services',
        },
        {
          title: 'Tra cứu hành trình',
          to: routePaths.tracking,
          icon: 'operations_metrics',
        },
      ];
  const notices = [
    {
      id: 'notice-1',
      tags: ['Ghim', 'Quan trọng'],
      content:
        'Hoàn tất đồng bộ zone mới trước 18:00 để tránh lệch route tại khung cao điểm.',
    },
    {
      id: 'notice-2',
      tags: ['Mới'],
      content:
        'Nhóm hub HCM01-HCM03 đã kích hoạt quy trình scan vào/ra phiên bản mới.',
    },
    {
      id: 'notice-3',
      tags: ['Cần xử lý'],
      content:
        'Tỉ lệ giao thất bại tăng tại khu vực Đông Bắc, ưu tiên kiểm tra NDR reason.',
    },
    {
      id: 'notice-4',
      tags: ['Lịch hệ thống'],
      content:
        'Bảo trì dịch vụ báo cáo KPI dự kiến 23:00-23:30, dữ liệu sẽ cập nhật trễ.',
    },
  ] as const;
  const heroSlides = [
    {
      id: 'slide-1',
      title: 'NEXUS EXPRESS SYSTEM',
      slogan: 'DIGITIZATION • AUTOMATION • INTELLIGENCE',
      description:
        'Vận hành tập trung, theo dõi trạng thái theo thời gian thực và kết nối đa kênh.',
    },
    {
      id: 'slide-2',
      title: 'NXS OPS CENTER',
      slogan: 'FAST RESPONSE • HUB VISIBILITY • SMART DISPATCH',
      description:
        'Tăng tốc phân công tác vụ, cảnh báo nghẽn hub và tối ưu luồng điều phối.',
    },
    {
      id: 'slide-3',
      title: 'NEXUS NETWORK',
      slogan: 'DATA DRIVEN • CONTROL TOWER • RELIABILITY',
      description:
        'Đồng bộ dữ liệu đầu-cuối để giảm sai lệch, tăng độ tin cậy cho vận hành.',
    },
  ] as const;
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const activeHeroSlide = heroSlides[activeHeroIndex];

  const onPrevHero = () => {
    setActiveHeroIndex((currentIndex) =>
      currentIndex === 0 ? heroSlides.length - 1 : currentIndex - 1,
    );
  };

  const onNextHero = () => {
    setActiveHeroIndex((currentIndex) =>
      currentIndex === heroSlides.length - 1 ? 0 : currentIndex + 1,
    );
  };

  return (
    <div className="ops-dashboard">
      <section className="ops-dashboard__hero" aria-label="Hero carousel">
        <button
          type="button"
          className="ops-dashboard__hero-nav"
          aria-label="Trang trước"
          onClick={onPrevHero}
        >
          <span aria-hidden="true">&#x2039;</span>
        </button>
        <div className="ops-dashboard__hero-content">
          <p className="ops-dashboard__hero-company">{activeHeroSlide.title}</p>
          <h2 className="ops-dashboard__hero-title">{activeHeroSlide.slogan}</h2>
          <p className="ops-dashboard__hero-subtitle">{activeHeroSlide.description}</p>
          <div className="ops-dashboard__hero-dots" aria-hidden="true">
            {heroSlides.map((slide, index) => (
              <span
                key={slide.id}
                className={
                  index === activeHeroIndex
                    ? 'ops-dashboard__hero-dot ops-dashboard__hero-dot--active'
                    : 'ops-dashboard__hero-dot'
                }
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="ops-dashboard__hero-nav"
          aria-label="Trang sau"
          onClick={onNextHero}
        >
          <span aria-hidden="true">&#x203A;</span>
        </button>
        <div className="ops-dashboard__hero-badge" aria-label="Hub đang theo dõi">
          <small>Hub đang theo dõi</small>
          <strong>{currentHub?.code ?? effectiveHubCode ?? 'Chưa gán'}</strong>
        </div>
      </section>

      <section className="ops-dashboard__menu-layout">
        <section className="ops-dashboard__function-groups" aria-label="Nhóm chức năng">
          <header className="ops-dashboard__section-header">
            <h3>Menu chính</h3>
          </header>
          <div className="ops-menu-grid">
            {quickMenu.map((item) => {
              const iconNode = (
                <span className="ops-menu-tile__icon">
                  <DashboardMenuOutlineIcon icon={item.icon} />
                </span>
              );

              const tileClassName = item.featured
                ? 'ops-menu-tile ops-menu-tile--featured'
                : 'ops-menu-tile';

              if (item.disabled || !item.to) {
                return (
                  <div
                    key={item.title}
                    className={`${tileClassName} ops-menu-tile--disabled`}
                    aria-disabled="true"
                  >
                    {iconNode}
                    <strong>{item.title}</strong>
                  </div>
                );
              }

              return (
                <Link key={item.title} to={item.to} className={tileClassName}>
                  {iconNode}
                  <strong>{item.title}</strong>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="ops-dashboard__menu-side">
          <article className="ops-card">
            <header className="ops-card__header">
              <h3>Thông báo</h3>
            </header>
            <ul className="ops-notification-list">
              {notices.map((item) => (
                <li key={item.id} className="ops-notification-item">
                  <div className="ops-notification-tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="ops-notification-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p>{item.content}</p>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>

      <section className="ops-dashboard__content ops-dashboard__content--analytics">
        <AnalyticsDashboardPage />
      </section>
    </div>
  );
}
