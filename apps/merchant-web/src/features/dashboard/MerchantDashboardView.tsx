import React from 'react';
import type {
  HubLocationOption,
  MerchantProfile,
  MerchantProfileConfigPayload,
  MerchantSession,
  ShipmentResponse,
  ShipmentRow,
  ViewId,
} from '../../types';
import { formatCurrency, formatDate } from '../../api';

export interface DashboardStats {
  totalToday: number;
  waitingPickup: number;
  inTransit: number;
  delivered: number;
  failedOrReturn: number;
}

export interface DashboardInsights {
  dailySeries: Array<{
    key: string;
    label: string;
    shortDate: string;
    orders: number;
    fee: number;
  }>;
  maxDailyOrders: number;
  maxDailyFee: number;
  statusGroups: Array<{
    key: string;
    label: string;
    color: string;
    count: number;
  }>;
  totalFee: number;
  totalCod: number;
  deliveredCod: number;
  netBalance: number;
  isNegativeBalanceLocked: boolean;
  deliveryRate: number;
  issueRate: number;
  cashItems: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  maxCashValue: number;
  donutGradient: string;
}

export interface MerchantDashboardViewProps {
  dashboardSearchCode: string;
  onDashboardSearchCodeChange: (val: string) => void;
  onQuickTrackFromDashboard: (e?: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  profile: MerchantProfile;
  merchantProfileConfig: MerchantProfileConfigPayload | null;
  lockedSenderHub: HubLocationOption | null;
  selectedAccountProvinceHub: HubLocationOption | null;
  session: MerchantSession;
  resolveRouteAndCourier: (
    shopAddress: string,
    ward?: string,
    district?: string,
    hubCode?: string,
    isPickup?: boolean,
  ) => { routeName: string; courierId: string };
  onNavigateView: (view: ViewId) => void;
  dashboardStats: DashboardStats;
  dashboardInsights: DashboardInsights;
  shipmentRows: ShipmentRow[];
  recentRows: ShipmentRow[];
  resolveShipmentStatusClass: (shipment: ShipmentResponse) => string;
  resolveShipmentStatusLabel: (shipment: ShipmentResponse) => string;
  onOpenShipmentDetail: (shipmentCode: string) => void;
}

export function MerchantDashboardView({
  dashboardSearchCode,
  onDashboardSearchCodeChange,
  onQuickTrackFromDashboard,
  profile,
  merchantProfileConfig,
  lockedSenderHub,
  selectedAccountProvinceHub,
  session,
  resolveRouteAndCourier,
  onNavigateView,
  dashboardStats,
  dashboardInsights,
  shipmentRows,
  recentRows,
  resolveShipmentStatusClass,
  resolveShipmentStatusLabel,
  onOpenShipmentDetail,
}: MerchantDashboardViewProps): React.JSX.Element {
  const regShopAddress =
    profile.defaultPickupAddressDetail ||
    profile.defaultPickupAddress ||
    merchantProfileConfig?.defaultSenderAddress ||
    'Chưa cấu hình địa chỉ kho';

  const regProvince =
    profile.defaultPickupProvince || merchantProfileConfig?.regionLabel || 'Toàn quốc';

  const defaultHub = lockedSenderHub ?? selectedAccountProvinceHub;
  const regHubName =
    defaultHub?.hubName || merchantProfileConfig?.defaultHubName || 'Bưu cục phụ trách';

  const regHubCode =
    defaultHub?.hubCode || merchantProfileConfig?.defaultHubCode || 'HUB_DEFAULT';

  const regLat = profile.latitude ?? merchantProfileConfig?.latitude ?? defaultHub?.latitude;
  const regLng = profile.longitude ?? merchantProfileConfig?.longitude ?? defaultHub?.longitude;

  const regRoute = resolveRouteAndCourier(
    regShopAddress,
    defaultHub?.ward,
    undefined,
    regHubCode,
    true,
  );

  return (
    <section className="dashboard-layout">
      <div className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="login-kicker">Merchant performance</p>
          <h3>Tổng quan vận hành</h3>
          <p className="muted">
            Theo dõi nhịp đơn, COD và phí vận chuyển ước tính từ các vận đơn hiện có.
          </p>
        </div>
        <form
          className="dashboard-search"
          onSubmit={(e) => {
            void onQuickTrackFromDashboard(e);
          }}
        >
          <input
            className="input dashboard-search__input"
            value={dashboardSearchCode}
            onChange={(e) => onDashboardSearchCodeChange(e.target.value)}
            placeholder="101000000001"
          />
          <button className="btn btn-primary dashboard-search__btn" type="submit">
            Tra cứu
          </button>
        </form>
      </div>

      {/* Thẻ thông tin địa chỉ kho đăng ký & Bưu cục tiếp nhận của Shop phục vụ demo */}
      <div className="card merchant-location-card">
        <div className="merchant-location-card__header">
          <div className="merchant-location-card__title-box">
            <span className="material-symbols-outlined merchant-location-card__icon">
              storefront
            </span>
            <div>
              <div className="merchant-location-card__kicker">
                <span
                  className="badge"
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    fontWeight: 700,
                  }}
                >
                  Đang hoạt động
                </span>
                <span
                  className="badge"
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  Tài khoản: {session.user.username}
                </span>
                {merchantProfileConfig?.citizenId ? (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    CCCD: {merchantProfileConfig.citizenId}
                  </span>
                ) : null}
              </div>
              <h3 className="merchant-location-card__shop-name">
                {profile.shopName || session.user.displayName || 'Shop Đối Tác NEXUS'}
              </h3>
            </div>
          </div>
          <div className="merchant-location-card__hotline">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: '#0284c7' }}
            >
              call
            </span>
            <span>
              Hotline Shop:{' '}
              <strong>{profile.contactPhone || session.user.phone || '0988-111-222'}</strong>
            </span>
          </div>
        </div>

        <div className="merchant-location-grid">
          <div className="merchant-location-col">
            <div className="merchant-location-label">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px', color: '#dc2626' }}
              >
                location_on
              </span>
              <span>Kho hàng đăng ký lấy hàng</span>
            </div>
            <div className="merchant-location-value merchant-location-value--highlight">
              {regShopAddress}
            </div>
            <div className="merchant-location-sub">
              Khu vực: <strong>{regProvince}</strong>
              {regLat && regLng ? (
                <span
                  className="merchant-location-coords"
                  title="Tọa độ GPS kho hàng"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                >
                  •{' '}
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '14px', verticalAlign: 'middle' }}
                  >
                    my_location
                  </span>{' '}
                  GPS: {regLat.toFixed(5)}, {regLng.toFixed(5)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="merchant-location-col">
            <div className="merchant-location-label">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px', color: '#2563eb' }}
              >
                domain
              </span>
              <span>Bưu cục (Hub) phụ trách tiếp nhận</span>
            </div>
            <div className="merchant-location-value">{regHubName}</div>
            <div className="merchant-location-sub">
              Mã bưu cục:{' '}
              <span
                className="badge"
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontWeight: 700,
                }}
              >
                {regHubCode}
              </span>
            </div>
          </div>

          <div className="merchant-location-col">
            <div className="merchant-location-label">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px', color: '#16a34a' }}
              >
                local_shipping
              </span>
              <span>Tuyến lấy & Shipper đảm nhiệm</span>
            </div>
            <div
              className="merchant-location-value"
              style={{ color: '#15803d', fontWeight: 700 }}
            >
              {regRoute.routeName}
            </div>
            <div className="merchant-location-sub">
              Shipper ID: <strong style={{ color: '#0f766e' }}>{regRoute.courierId}</strong> (Khớp
              phân vùng Geofence)
            </div>
          </div>
        </div>
      </div>

      {/* Lối tắt nghiệp vụ Doanh nghiệp (Enterprise Launchpad) */}
      <div className="dashboard-launchpad">
        <div
          className="dashboard-launchpad-card"
          onClick={() => onNavigateView('create-shipment')}
        >
          <div
            className="dashboard-launchpad-icon"
            style={{ background: '#e7efff', color: '#0052cc' }}
          >
            <span className="material-symbols-outlined">add_circle</span>
          </div>
          <div>
            <div className="dashboard-launchpad-title">Tạo đơn hàng mới</div>
            <div className="dashboard-launchpad-desc">Lên đơn nhanh, tính cước tức thì</div>
          </div>
        </div>

        <div className="dashboard-launchpad-card" onClick={() => onNavigateView('pickups')}>
          <div
            className="dashboard-launchpad-icon"
            style={{ background: '#e8f7f0', color: '#127a56' }}
          >
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <div className="dashboard-launchpad-title">Yêu cầu lấy hàng (Pickup)</div>
            <div className="dashboard-launchpad-desc">Bưu tá tới kho lấy tận nơi</div>
          </div>
        </div>

        <div className="dashboard-launchpad-card" onClick={() => onNavigateView('finance')}>
          <div
            className="dashboard-launchpad-icon"
            style={{ background: '#fff4d9', color: '#8b5f07' }}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <div className="dashboard-launchpad-title">Đối soát & Tiền hàng COD</div>
            <div className="dashboard-launchpad-desc">
              Theo dõi dòng tiền, cấn trừ cước T2-4-6
            </div>
          </div>
        </div>

        <div className="dashboard-launchpad-card" onClick={() => onNavigateView('print')}>
          <div
            className="dashboard-launchpad-icon"
            style={{ background: '#f1f4ff', color: '#0059b8' }}
          >
            <span className="material-symbols-outlined">print</span>
          </div>
          <div>
            <div className="dashboard-launchpad-title">In vận đơn hàng loạt</div>
            <div className="dashboard-launchpad-desc">Tem nhãn chuẩn A5 & K80 nhiệt</div>
          </div>
        </div>

        <div className="dashboard-launchpad-card" onClick={() => onNavigateView('claims')}>
          <div
            className="dashboard-launchpad-icon"
            style={{ background: '#fef2f2', color: '#dc2626' }}
          >
            <span className="material-symbols-outlined">gavel</span>
          </div>
          <div>
            <div className="dashboard-launchpad-title">Khiếu nại & Đền bù</div>
            <div className="dashboard-launchpad-desc">Xử lý sự cố bể vỡ, thất lạc</div>
          </div>
        </div>
      </div>

      <div className="metric-grid dashboard-metrics">
        <div className="metric dashboard-metric">
          <div className="metric-title">Tổng số đơn hôm nay</div>
          <div className="metric-value">{dashboardStats.totalToday}</div>
          <div className="dashboard-metric__hint">Tạo mới trong ngày</div>
        </div>
        <div className="metric dashboard-metric">
          <div className="metric-title">Đơn chờ pickup</div>
          <div className="metric-value">{dashboardStats.waitingPickup}</div>
          <div className="dashboard-metric__hint">Cần bàn giao lấy hàng</div>
        </div>
        <div className="metric dashboard-metric">
          <div className="metric-title">Đơn đang giao</div>
          <div className="metric-value">{dashboardStats.inTransit}</div>
          <div className="dashboard-metric__hint">Đang luân chuyển</div>
        </div>
        <div className="metric dashboard-metric">
          <div className="metric-title">Đơn giao thành công</div>
          <div className="metric-value">{dashboardStats.delivered}</div>
          <div className="dashboard-metric__hint">
            {dashboardInsights.deliveryRate}% toàn bộ đơn
          </div>
        </div>
        <div className="metric dashboard-metric">
          <div className="metric-title">Thất bại / hoàn</div>
          <div className="metric-value">{dashboardStats.failedOrReturn}</div>
          <div className="dashboard-metric__hint">
            {dashboardInsights.issueRate}% cần theo dõi
          </div>
        </div>
      </div>

      <div className="dashboard-chart-grid">
        <section className="card dashboard-chart-card dashboard-chart-card--wide">
          <div className="dashboard-card-header">
            <div>
              <p className="login-kicker">7 ngày gần nhất</p>
              <h3>Đơn hàng & phí vận chuyển</h3>
            </div>
            <span className="badge">
              {formatCurrency(dashboardInsights.totalFee)} phí ước tính
            </span>
          </div>
          <div className="dashboard-bars" aria-label="Biểu đồ đơn hàng 7 ngày gần nhất">
            {dashboardInsights.dailySeries.map((item) => (
              <div className="dashboard-bar-item" key={item.key}>
                <div className="dashboard-bar-stack">
                  <span
                    className="dashboard-bar dashboard-bar--fee"
                    style={{
                      height: `${Math.max(
                        8,
                        (item.fee / dashboardInsights.maxDailyFee) * 100,
                      )}%`,
                    }}
                    title={`${formatCurrency(item.fee)} phí ước tính`}
                  />
                  <span
                    className="dashboard-bar dashboard-bar--orders"
                    style={{
                      height: `${Math.max(
                        8,
                        (item.orders / dashboardInsights.maxDailyOrders) * 100,
                      )}%`,
                    }}
                    title={`${item.orders} đơn`}
                  />
                </div>
                <strong>{item.orders}</strong>
                <span>{item.label}</span>
                <small>{item.shortDate}</small>
              </div>
            ))}
          </div>
          <div className="dashboard-legend">
            <span>
              <i className="dashboard-dot dashboard-dot--orders" /> Số đơn
            </span>
            <span>
              <i className="dashboard-dot dashboard-dot--fee" /> Phí ước tính
            </span>
          </div>
        </section>

        <section className="card dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <p className="login-kicker">Tỷ trọng</p>
              <h3>Trạng thái đơn</h3>
            </div>
          </div>
          <div className="dashboard-status-chart">
            <div
              className="dashboard-donut"
              style={{ background: dashboardInsights.donutGradient }}
            >
              <div>
                <strong>{shipmentRows.length}</strong>
                <span>đơn</span>
              </div>
            </div>
            <div className="dashboard-status-list">
              {dashboardInsights.statusGroups.map((item) => (
                <div className="dashboard-status-row" key={item.key}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="card dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <p className="login-kicker">Dòng tiền</p>
              <h3>COD & phí</h3>
            </div>
          </div>
          <div className="dashboard-cash-list">
            {dashboardInsights.cashItems.map((item) => (
              <div className="dashboard-cash-row" key={item.label}>
                <div className="dashboard-cash-row__head">
                  <span>{item.label}</span>
                  <strong>{formatCurrency(item.value)}</strong>
                </div>
                <div className="dashboard-cash-bar">
                  <span
                    style={{
                      width: `${Math.max(
                        4,
                        (item.value / dashboardInsights.maxCashValue) * 100,
                      )}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card dashboard-recent-card">
          <div className="dashboard-card-header">
            <div>
              <p className="login-kicker">Gần đây</p>
              <h3>Đơn mới tạo</h3>
            </div>
            <span className="badge">{recentRows.length} đơn</span>
          </div>
          {recentRows.length === 0 ? (
            <div className="empty">Chưa có đơn hàng.</div>
          ) : (
            <div className="table-wrap dashboard-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Người nhận</th>
                    <th>SĐT</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((row) => (
                    <tr key={row.shipment.id}>
                      <td>{row.shipment.code}</td>
                      <td>{row.receiverName}</td>
                      <td>{row.receiverPhone}</td>
                      <td>
                        <span className={resolveShipmentStatusClass(row.shipment)}>
                          {resolveShipmentStatusLabel(row.shipment)}
                        </span>
                      </td>
                      <td>{formatDate(row.shipment.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            void onOpenShipmentDetail(row.shipment.code);
                          }}
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
