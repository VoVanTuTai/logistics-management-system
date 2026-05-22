import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  useApproveChangeRequestMutation,
  useChangeRequestsQuery,
} from '../../features/change-requests/changeRequests.api';
import type {
  ChangeRequestDto,
  ChangeRequestStatus,
} from '../../features/change-requests/changeRequests.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

const STATUS_OPTIONS: Array<ChangeRequestStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'APPROVED',
  'REJECTED',
];

const STATUS_LABELS: Record<ChangeRequestStatus | 'ALL', string> = {
  ALL: 'Tất cả',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

function stringifyPayload(payload: unknown): string {
  if (payload === null || payload === undefined) {
    return '-';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function matchesSearch(request: ChangeRequestDto, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  return [
    request.shipmentCode,
    request.requestType,
    request.requestedBy ?? '',
    stringifyPayload(request.payload),
  ].some((value) => value.toLowerCase().includes(normalizedKeyword));
}

export function ChangeRequestsPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const requestsQuery = useChangeRequestsQuery(accessToken);
  const approveMutation = useApproveChangeRequestMutation(accessToken);
  const [statusFilter, setStatusFilter] = useState<ChangeRequestStatus | 'ALL'>('PENDING');
  const [keyword, setKeyword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const rows = useMemo(() => {
    return (requestsQuery.data ?? []).filter((request) => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : request.status === statusFilter;

      return matchesStatus && matchesSearch(request, keyword);
    });
  }, [keyword, requestsQuery.data, statusFilter]);

  const handleApprove = async (request: ChangeRequestDto) => {
    setSuccessMessage(null);
    const approved = await approveMutation.mutateAsync({
      requestId: request.id,
      payload: {
        approvedBy: session?.user.username ?? session?.user.displayName ?? 'ops-web',
      },
    });
    setSuccessMessage(`Đã duyệt yêu cầu ${approved.id} cho vận đơn ${approved.shipmentCode}.`);
  };

  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <div>
          <small style={styles.eyebrow}>CHANGE_REQUESTS</small>
          <h2 style={styles.title}>Duyệt thay đổi thông tin giao hàng</h2>
          <p style={styles.summary}>
            Theo dõi và duyệt các yêu cầu đổi thông tin vận đơn từ merchant/CS.
          </p>
        </div>
        <div style={styles.metrics} aria-label="Thống kê yêu cầu đổi thông tin">
          <article style={styles.metricCard}>
            <span>Tổng yêu cầu</span>
            <strong>{requestsQuery.data?.length ?? 0}</strong>
          </article>
          <article style={styles.metricCard}>
            <span>Chờ duyệt</span>
            <strong>
              {(requestsQuery.data ?? []).filter((item) => item.status === 'PENDING').length}
            </strong>
          </article>
        </div>
      </header>

      <form style={styles.filters} onSubmit={(event) => event.preventDefault()}>
        <label style={styles.field}>
          <span>Trạng thái</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ChangeRequestStatus | 'ALL')
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.field}>
          <span>Tìm kiếm</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn, loại yêu cầu, người tạo"
          />
        </label>
        <button
          type="button"
          onClick={() => void requestsQuery.refetch()}
          disabled={requestsQuery.isFetching}
          style={styles.secondaryButton}
        >
          {requestsQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
        </button>
      </form>

      {successMessage ? <p style={styles.success}>{successMessage}</p> : null}
      {requestsQuery.isError ? (
        <p style={styles.error}>{getErrorMessage(requestsQuery.error)}</p>
      ) : null}
      {approveMutation.isError ? (
        <p style={styles.error}>{getErrorMessage(approveMutation.error)}</p>
      ) : null}

      <section style={styles.panel}>
        <header style={styles.panelHeader}>
          <h3>Danh sách yêu cầu</h3>
          <span>{rows.length} dòng</span>
        </header>

        {requestsQuery.isLoading ? (
          <p style={styles.empty}>Đang tải yêu cầu đổi thông tin...</p>
        ) : rows.length === 0 ? (
          <p style={styles.empty}>Không có yêu cầu phù hợp bộ lọc hiện tại.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vận đơn</th>
                  <th style={styles.th}>Loại yêu cầu</th>
                  <th style={styles.th}>Trạng thái</th>
                  <th style={styles.th}>Payload</th>
                  <th style={styles.th}>Người tạo</th>
                  <th style={styles.th}>Thời gian</th>
                  <th style={styles.th}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((request) => (
                  <tr key={request.id}>
                    <td style={styles.td}>
                      <Link to={routePaths.shipmentDetail(request.shipmentCode)}>
                        {request.shipmentCode}
                      </Link>
                    </td>
                    <td style={styles.td}>{request.requestType}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(request.status === 'PENDING'
                            ? styles.badgeWarning
                            : request.status === 'APPROVED'
                              ? styles.badgeSuccess
                              : styles.badgeMuted),
                        }}
                      >
                        {STATUS_LABELS[request.status]}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <pre style={styles.payload}>{stringifyPayload(request.payload)}</pre>
                    </td>
                    <td style={styles.td}>{request.requestedBy ?? '-'}</td>
                    <td style={styles.td}>{formatDateTime(request.createdAt)}</td>
                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={() => void handleApprove(request)}
                        disabled={
                          request.status !== 'PENDING' ||
                          approveMutation.isPending
                        }
                        style={styles.primaryButton}
                      >
                        Duyệt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'grid',
    gap: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: '#64748b',
    fontWeight: 700,
    letterSpacing: 0,
  },
  title: {
    margin: '4px 0',
    color: '#0f172a',
  },
  summary: {
    margin: 0,
    color: '#64748b',
  },
  metrics: {
    display: 'flex',
    gap: 10,
  },
  metricCard: {
    minWidth: 120,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 12,
    background: '#fff',
    display: 'grid',
    gap: 4,
  },
  filters: {
    display: 'flex',
    alignItems: 'end',
    gap: 12,
    flexWrap: 'wrap',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 12,
    background: '#fff',
  },
  field: {
    display: 'grid',
    gap: 6,
    minWidth: 220,
    color: '#475569',
    fontSize: 13,
    fontWeight: 700,
  },
  panel: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    background: '#fff',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottom: '1px solid #e2e8f0',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 980,
  },
  th: {
    textAlign: 'left',
    padding: 12,
    fontSize: 12,
    color: '#64748b',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: 12,
    verticalAlign: 'top',
    borderBottom: '1px solid #f1f5f9',
    color: '#0f172a',
  },
  payload: {
    margin: 0,
    maxWidth: 360,
    whiteSpace: 'pre-wrap',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  },
  badge: {
    display: 'inline-flex',
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 700,
  },
  badgeWarning: {
    background: '#fef3c7',
    color: '#92400e',
  },
  badgeSuccess: {
    background: '#dcfce7',
    color: '#166534',
  },
  badgeMuted: {
    background: '#f1f5f9',
    color: '#475569',
  },
  primaryButton: {
    border: 0,
    borderRadius: 8,
    padding: '8px 12px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '9px 12px',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 700,
    cursor: 'pointer',
  },
  empty: {
    padding: 16,
    margin: 0,
    color: '#64748b',
  },
  success: {
    margin: 0,
    padding: 12,
    borderRadius: 8,
    background: '#dcfce7',
    color: '#166534',
  },
  error: {
    margin: 0,
    padding: 12,
    borderRadius: 8,
    background: '#fee2e2',
    color: '#991b1b',
  },
};
