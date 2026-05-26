import React from 'react';

import { useAuthStore } from '../../../store/authStore';

import './IntegrationServicesGroupPage.css';

type IntegrationStatus = 'CONTRACT_PENDING';

interface IntegrationChannelContract {
  id: string;
  name: string;
  type: string;
  owner: string;
  direction: string;
  status: IntegrationStatus;
  lastSyncAt: string | null;
  errorCount: number | null;
  lastError: string;
  requiredEndpoint: string;
}

const channelContracts: IntegrationChannelContract[] = [
  {
    id: 'merchant-order-api',
    name: 'Merchant Order API',
    type: 'Đơn hàng',
    owner: 'Merchant Web / đối tác',
    direction: 'Inbound',
    status: 'CONTRACT_PENDING',
    lastSyncAt: null,
    errorCount: null,
    lastError: 'Chưa có endpoint integration log/config qua gateway.',
    requiredEndpoint: 'GET /ops/integration/channels, GET /ops/integration/sync-logs',
  },
  {
    id: 'public-tracking-webhook',
    name: 'Tracking Webhook',
    type: 'Trạng thái vận đơn',
    owner: 'Tracking service',
    direction: 'Outbound',
    status: 'CONTRACT_PENDING',
    lastSyncAt: null,
    errorCount: null,
    lastError: 'Chưa có contract lưu trạng thái webhook và retry.',
    requiredEndpoint: 'POST /ops/integration/webhooks/:id/retry',
  },
  {
    id: 'finance-cod-export',
    name: 'Finance/COD Export',
    type: 'Tài chính',
    owner: 'Finance settlement',
    direction: 'Outbound',
    status: 'CONTRACT_PENDING',
    lastSyncAt: null,
    errorCount: null,
    lastError: 'Chưa có contract export/ack quyết toán từ hệ thống tài chính.',
    requiredEndpoint: 'GET /ops/integration/finance-exports',
  },
];

const statusLabels: Record<IntegrationStatus, string> = {
  CONTRACT_PENDING: 'Chờ backend contract',
};

function formatNumber(value: number | null): string {
  return value === null ? '---' : new Intl.NumberFormat('vi-VN').format(value);
}

export function IntegrationServicesGroupPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const scopedHubCodes = session?.user.hubCodes ?? [];

  const totalChannels = channelContracts.length;
  const connectedChannels = 0;
  const pendingContracts = channelContracts.filter(
    (channel) => channel.status === 'CONTRACT_PENDING',
  ).length;
  const syncErrorCount = channelContracts.reduce(
    (sum, channel) => sum + (channel.errorCount ?? 0),
    0,
  );

  return (
    <section className="ops-integration-services">
      <header className="ops-integration-services__header">
        <div>
          <small>INTEGRATION_SERVICES</small>
          <h2>Dịch vụ tích hợp</h2>
          <p>
            Theo dõi kênh kết nối, trạng thái đồng bộ và lỗi retry của các hệ
            thống tích hợp quanh Ops Web.
          </p>
        </div>
        <div className="ops-integration-services__summary" aria-label="Thống kê tích hợp">
          <article>
            <span>Kênh khai báo</span>
            <strong>{totalChannels}</strong>
          </article>
          <article>
            <span>Đang kết nối</span>
            <strong>{connectedChannels}</strong>
          </article>
          <article className="ops-integration-services__summary-card--warning">
            <span>Chờ contract</span>
            <strong>{pendingContracts}</strong>
          </article>
          <article>
            <span>Lỗi đồng bộ</span>
            <strong>{syncErrorCount}</strong>
          </article>
        </div>
      </header>

      {scopedHubCodes.length > 0 ? (
        <p className="ops-integration-services__scope">
          Tài khoản đang giới hạn theo bưu cục: {scopedHubCodes.join(', ')}.
          Dịch vụ tích hợp cấp hệ thống vẫn cần backend áp scope khi có API.
        </p>
      ) : null}

      <section className="ops-integration-services__panel">
        <header className="ops-integration-services__panel-header">
          <h3>Kênh tích hợp</h3>
          <span>Dữ liệu cấu trúc contract, chưa có log vận hành từ backend</span>
        </header>

        <div className="ops-integration-services__table-wrap">
          <table className="ops-integration-services__table">
            <thead>
              <tr>
                <th>Kênh</th>
                <th>Loại</th>
                <th>Hướng</th>
                <th>Trạng thái</th>
                <th>Đồng bộ cuối</th>
                <th>Lỗi</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {channelContracts.map((channel) => (
                <tr key={channel.id}>
                  <td>
                    <div className="ops-integration-services__channel">
                      <strong>{channel.name}</strong>
                      <span>{channel.owner}</span>
                    </div>
                  </td>
                  <td>{channel.type}</td>
                  <td>{channel.direction}</td>
                  <td>
                    <span className="ops-integration-services__status">
                      {statusLabels[channel.status]}
                    </span>
                  </td>
                  <td>{channel.lastSyncAt ?? 'Chưa có log'}</td>
                  <td>
                    <div className="ops-integration-services__error-cell">
                      <strong>{formatNumber(channel.errorCount)}</strong>
                      <span>{channel.lastError}</span>
                    </div>
                  </td>
                  <td>
                    <div className="ops-integration-services__row-actions">
                      <button type="button" disabled title="Cần backend retry contract">
                        Retry
                      </button>
                      <button type="button" disabled title="Cần backend reconnect contract">
                        Reconnect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-integration-services__grid">
        <article className="ops-integration-services__panel">
          <header className="ops-integration-services__panel-header">
            <h3>Log đồng bộ gần đây</h3>
          </header>
          <div className="ops-integration-services__empty">
            <strong>Chưa có integration log từ backend.</strong>
            <p>
              Cần bổ sung endpoint danh sách log có `channelId`, `direction`,
              `status`, `requestId`, `attemptCount`, `lastError`, `createdAt`
              và `resolvedAt`.
            </p>
          </div>
        </article>

        <article className="ops-integration-services__panel">
          <header className="ops-integration-services__panel-header">
            <h3>Backend contract cần bổ sung</h3>
          </header>
          <ul className="ops-integration-services__contract-list">
            {channelContracts.map((channel) => (
              <li key={channel.id}>
                <strong>{channel.name}</strong>
                <span>{channel.requiredEndpoint}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}
