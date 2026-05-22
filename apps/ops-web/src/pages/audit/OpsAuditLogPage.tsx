import React, { useMemo, useState } from 'react';

import {
  useExportOpsAuditLogsMutation,
  useOpsAuditLogsQuery,
} from '../../features/ops-audit/opsAudit.api';
import type {
  OpsAuditLogDto,
  OpsAuditLogFilters,
  OpsAuditSource,
} from '../../features/ops-audit/opsAudit.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

const SOURCE_OPTIONS: Array<{ value: OpsAuditSource; label: string }> = [
  { value: 'all', label: 'Tất cả nguồn' },
  { value: 'dispatch-service', label: 'Dispatch' },
  { value: 'scan-service', label: 'Scan' },
  { value: 'manifest-service', label: 'Manifest' },
  { value: 'delivery-service', label: 'Delivery/NDR' },
  { value: 'masterdata-service', label: 'Masterdata' },
  { value: 'auth-service', label: 'Auth' },
];

const DEFAULT_PAGE_SIZE = 20;

function toJsonPreview(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function downloadCsv(content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ops-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function OpsAuditLogPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [draftFilters, setDraftFilters] = useState<OpsAuditLogFilters>({
    source: 'all',
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
  });
  const [appliedFilters, setAppliedFilters] =
    useState<OpsAuditLogFilters>(draftFilters);
  const auditQuery = useOpsAuditLogsQuery(accessToken, appliedFilters);
  const exportMutation = useExportOpsAuditLogsMutation(accessToken);
  const rows = auditQuery.data?.items ?? [];
  const pageInfo = auditQuery.data?.pageInfo ?? { hasNextPage: false, total: 0 };
  const pageSize = appliedFilters.limit ?? DEFAULT_PAGE_SIZE;
  const offset = appliedFilters.offset ?? 0;
  const pageNumber = Math.floor(offset / pageSize) + 1;

  const summary = useMemo(() => {
    const sourceCount = new Set(rows.map((row) => row.source)).size;
    const actionCount = new Set(rows.map((row) => row.action)).size;

    return {
      sourceCount,
      actionCount,
    };
  }, [rows]);

  const updateDraft = (patch: Partial<OpsAuditLogFilters>) => {
    setDraftFilters((current) => ({ ...current, ...patch }));
  };

  const applyFilters = () => {
    setAppliedFilters({
      ...draftFilters,
      limit: draftFilters.limit ?? DEFAULT_PAGE_SIZE,
      offset: 0,
    });
  };

  const goToOffset = (nextOffset: number) => {
    setAppliedFilters((current) => ({
      ...current,
      offset: Math.max(0, nextOffset),
    }));
  };

  const handleExport = async () => {
    const csv = await exportMutation.mutateAsync({
      ...appliedFilters,
      offset: 0,
      limit: 5000,
    });
    downloadCsv(csv);
  };

  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <div>
          <small style={styles.eyebrow}>OPS_AUDIT_LOGS</small>
          <h2 style={styles.title}>Nhật ký thao tác Ops</h2>
          <p style={styles.summary}>
            Truy vết phân công task, scan hub, đóng/nhận bao, quyết định NDR và các thao tác quản trị.
          </p>
        </div>
        <div style={styles.metrics}>
          <article style={styles.metricCard}>
            <span>Tổng dòng</span>
            <strong>{pageInfo.total}</strong>
          </article>
          <article style={styles.metricCard}>
            <span>Nguồn trên trang</span>
            <strong>{summary.sourceCount}</strong>
          </article>
          <article style={styles.metricCard}>
            <span>Action trên trang</span>
            <strong>{summary.actionCount}</strong>
          </article>
        </div>
      </header>

      <form
        style={styles.filters}
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <label style={styles.field}>
          <span>Nguồn</span>
          <select
            value={draftFilters.source ?? 'all'}
            onChange={(event) =>
              updateDraft({ source: event.target.value as OpsAuditSource })
            }
          >
            {SOURCE_OPTIONS.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.field}>
          <span>Action</span>
          <input
            value={draftFilters.action ?? ''}
            onChange={(event) => updateDraft({ action: event.target.value })}
            placeholder="TASK_ASSIGNED, SCAN_INBOUND..."
          />
        </label>
        <label style={styles.field}>
          <span>Target</span>
          <input
            value={draftFilters.targetId ?? ''}
            onChange={(event) => updateDraft({ targetId: event.target.value })}
            placeholder="Mã task, shipment, manifest, NDR"
          />
        </label>
        <label style={styles.field}>
          <span>Actor</span>
          <input
            value={draftFilters.actor ?? ''}
            onChange={(event) => updateDraft({ actor: event.target.value })}
            placeholder="Username hoặc user id"
          />
        </label>
        <label style={styles.field}>
          <span>Từ ngày</span>
          <input
            type="date"
            value={draftFilters.createdFrom ?? ''}
            onChange={(event) => updateDraft({ createdFrom: event.target.value })}
          />
        </label>
        <label style={styles.field}>
          <span>Đến ngày</span>
          <input
            type="date"
            value={draftFilters.createdTo ?? ''}
            onChange={(event) => updateDraft({ createdTo: event.target.value })}
          />
        </label>
        <label style={styles.field}>
          <span>Tìm nhanh</span>
          <input
            value={draftFilters.q ?? ''}
            onChange={(event) => updateDraft({ q: event.target.value })}
            placeholder="Action, actor, request id..."
          />
        </label>
        <div style={styles.actions}>
          <button type="submit" style={styles.primaryButton} disabled={auditQuery.isFetching}>
            {auditQuery.isFetching ? 'Đang tải...' : 'Lọc'}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              const reset = {
                source: 'all' as const,
                limit: DEFAULT_PAGE_SIZE,
                offset: 0,
              };
              setDraftFilters(reset);
              setAppliedFilters(reset);
            }}
          >
            Xóa lọc
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => void handleExport()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Đang export...' : 'Export CSV'}
          </button>
        </div>
      </form>

      {auditQuery.isError ? (
        <p style={styles.error}>{getErrorMessage(auditQuery.error)}</p>
      ) : null}
      {exportMutation.isError ? (
        <p style={styles.error}>{getErrorMessage(exportMutation.error)}</p>
      ) : null}

      <section style={styles.panel}>
        <header style={styles.panelHeader}>
          <h3>Audit events</h3>
          <span>
            Trang {pageNumber} | {pageInfo.total} dòng
          </span>
        </header>

        {auditQuery.isLoading ? (
          <p style={styles.empty}>Đang tải nhật ký thao tác...</p>
        ) : rows.length === 0 ? (
          <p style={styles.empty}>Không có log phù hợp bộ lọc hiện tại.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Thời gian</th>
                  <th style={styles.th}>Nguồn</th>
                  <th style={styles.th}>Actor</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>Request</th>
                  <th style={styles.th}>Before / After</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <AuditRow key={`${row.source}:${row.id}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer style={styles.pagination}>
          <button
            type="button"
            style={styles.secondaryButton}
            disabled={offset <= 0 || auditQuery.isFetching}
            onClick={() => goToOffset(offset - pageSize)}
          >
            Trước
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            disabled={!pageInfo.hasNextPage || auditQuery.isFetching}
            onClick={() => goToOffset(offset + pageSize)}
          >
            Sau
          </button>
        </footer>
      </section>
    </section>
  );
}

function AuditRow({ row }: { row: OpsAuditLogDto }): React.JSX.Element {
  return (
    <tr>
      <td style={styles.td}>{formatDateTime(row.createdAt)}</td>
      <td style={styles.td}>
        <span style={styles.sourceBadge}>{row.source}</span>
      </td>
      <td style={styles.td}>
        <strong>{row.actorUsername ?? row.actorId ?? 'UNKNOWN_ACTOR'}</strong>
        <br />
        <span style={styles.muted}>{row.ipAddress ?? '-'}</span>
      </td>
      <td style={styles.td}>{row.action}</td>
      <td style={styles.td}>
        <strong>{row.targetType}</strong>
        <br />
        <span style={styles.muted}>{row.targetId ?? '-'}</span>
      </td>
      <td style={styles.td}>
        <span>{row.requestId ?? '-'}</span>
      </td>
      <td style={styles.td}>
        <details>
          <summary>Chi tiết</summary>
          <div style={styles.detailGrid}>
            <pre style={styles.payload}>{toJsonPreview(row.before)}</pre>
            <pre style={styles.payload}>{toJsonPreview(row.after)}</pre>
          </div>
        </details>
      </td>
    </tr>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'grid', gap: 16 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  eyebrow: { color: '#64748b', fontWeight: 800, letterSpacing: 0 },
  title: { margin: '4px 0', color: '#0f172a' },
  summary: { margin: 0, color: '#64748b' },
  metrics: { display: 'flex', gap: 10, flexWrap: 'wrap' },
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
    minWidth: 170,
    color: '#475569',
    fontSize: 13,
    fontWeight: 700,
  },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  primaryButton: {
    border: 0,
    borderRadius: 8,
    padding: '9px 12px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '9px 12px',
    background: '#fff',
    color: '#0f172a',
    fontWeight: 800,
    cursor: 'pointer',
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
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 1120 },
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
  sourceBadge: {
    display: 'inline-flex',
    borderRadius: 999,
    padding: '4px 8px',
    background: '#eef2ff',
    color: '#3730a3',
    fontWeight: 800,
    fontSize: 12,
  },
  muted: { color: '#64748b', fontSize: 12 },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 8,
    marginTop: 8,
  },
  payload: {
    margin: 0,
    maxHeight: 220,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 12,
    borderTop: '1px solid #e2e8f0',
  },
  empty: { padding: 16, margin: 0, color: '#64748b' },
  error: {
    margin: 0,
    padding: 12,
    borderRadius: 8,
    background: '#fee2e2',
    color: '#991b1b',
  },
};
