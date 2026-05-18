import React, { useMemo, useState } from 'react';

import {
  useAuthAuditLogsQuery,
  useMasterdataAuditLogsQuery,
} from '../../features/audit/audit.api';
import type {
  AdminAuditLogDto,
  AdminAuditLogFilters,
  AdminAuditSource,
} from '../../features/audit/audit.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

const SUMMARY_LIMIT = 170;

function normalizeText(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function safeStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Không có';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function summarizeJson(value: unknown): string {
  const text = safeStringify(value).replace(/\s+/g, ' ').trim();

  if (text.length <= SUMMARY_LIMIT) {
    return text;
  }

  return `${text.slice(0, SUMMARY_LIMIT)}...`;
}

function getActorLabel(log: AdminAuditLogDto): string {
  if (log.actorUsername && log.actorId && log.actorUsername !== log.actorId) {
    return `${log.actorUsername} (${log.actorId})`;
  }

  return log.actorUsername ?? log.actorId ?? 'UNKNOWN_ACTOR';
}

function toLocalDateValue(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function matchesFilters(
  log: AdminAuditLogDto,
  filters: AdminAuditLogFilters,
): boolean {
  const action = filters.action?.trim().toLowerCase();
  const targetType = filters.targetType?.trim().toLowerCase();
  const actor = filters.actor?.trim().toLowerCase();

  if (action && !log.action.toLowerCase().includes(action)) {
    return false;
  }

  if (targetType && !log.targetType.toLowerCase().includes(targetType)) {
    return false;
  }

  if (actor) {
    const actorText = [log.actorId, log.actorUsername]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!actorText.includes(actor)) {
      return false;
    }
  }

  if (filters.createdDate && toLocalDateValue(log.createdAt) !== filters.createdDate) {
    return false;
  }

  return true;
}

function getSourceLabel(source: AdminAuditSource): string {
  return source === 'auth-service' ? 'Auth' : 'Masterdata';
}

export function AdminAuditLogPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [draftFilters, setDraftFilters] = useState<AdminAuditLogFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AdminAuditLogFilters>({});
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogDto | null>(null);

  const authAuditQuery = useAuthAuditLogsQuery(accessToken, appliedFilters);
  const masterdataAuditQuery = useMasterdataAuditLogsQuery(
    accessToken,
    appliedFilters,
  );

  const auditLogs = useMemo(() => {
    const rows = [
      ...(authAuditQuery.data ?? []),
      ...(masterdataAuditQuery.data ?? []),
    ].filter((log) => matchesFilters(log, appliedFilters));

    return rows.sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    );
  }, [appliedFilters, authAuditQuery.data, masterdataAuditQuery.data]);

  const onApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedLog(null);
    setAppliedFilters({
      action: normalizeText(draftFilters.action ?? ''),
      targetType: normalizeText(draftFilters.targetType ?? ''),
      actor: normalizeText(draftFilters.actor ?? ''),
      createdDate: normalizeText(draftFilters.createdDate ?? ''),
    });
  };

  const onResetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
    setSelectedLog(null);
  };

  const onRefresh = async () => {
    await Promise.all([authAuditQuery.refetch(), masterdataAuditQuery.refetch()]);
  };

  const isLoading = authAuditQuery.isLoading || masterdataAuditQuery.isLoading;
  const isFetching = authAuditQuery.isFetching || masterdataAuditQuery.isFetching;
  const hasAnySuccess = authAuditQuery.isSuccess || masterdataAuditQuery.isSuccess;

  return (
    <div>
      <h2>Audit log quản trị</h2>
      <p style={styles.helperText}>
        Theo dõi thay đổi từ auth-service và masterdata-service.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Action"
          value={draftFilters.action ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              action: event.target.value,
            }))
          }
          style={styles.input}
        />
        <input
          placeholder="Target type"
          value={draftFilters.targetType ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              targetType: event.target.value,
            }))
          }
          style={styles.input}
        />
        <input
          placeholder="Actor"
          value={draftFilters.actor ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              actor: event.target.value,
            }))
          }
          style={styles.input}
        />
        <input
          aria-label="Ngày tạo"
          type="date"
          value={draftFilters.createdDate ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              createdDate: event.target.value,
            }))
          }
          style={styles.input}
        />
        <button type="submit">Áp dụng</button>
        <button type="button" onClick={onResetFilters} style={styles.secondaryButton}>
          Đặt lại
        </button>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={isFetching}
          style={styles.secondaryButton}
        >
          Tải lại
        </button>
      </form>

      <div style={styles.sourceGrid}>
        <SourceStatus
          label="Auth"
          queryStatus={{
            isLoading: authAuditQuery.isLoading,
            isError: authAuditQuery.isError,
            error: authAuditQuery.error,
            count: authAuditQuery.data?.length ?? 0,
          }}
        />
        <SourceStatus
          label="Masterdata"
          queryStatus={{
            isLoading: masterdataAuditQuery.isLoading,
            isError: masterdataAuditQuery.isError,
            error: masterdataAuditQuery.error,
            count: masterdataAuditQuery.data?.length ?? 0,
          }}
        />
      </div>

      {isLoading ? <p>Đang tải audit log...</p> : null}
      {hasAnySuccess && auditLogs.length === 0 ? (
        <p>Không tìm thấy audit log phù hợp.</p>
      ) : null}

      {auditLogs.length > 0 ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.sourceCell}>Source</th>
                <th style={styles.timeCell}>Thời gian</th>
                <th style={styles.actorCell}>Actor</th>
                <th style={styles.actionCell}>Action</th>
                <th style={styles.targetTypeCell}>Target type</th>
                <th style={styles.targetIdCell}>Target ID</th>
                <th style={styles.summaryCell}>Before / After</th>
                <th style={styles.actionColumn}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={`${log.source}-${log.id}`}>
                  <td style={styles.sourceCell}>
                    <span style={styles.sourceBadge}>{getSourceLabel(log.source)}</span>
                  </td>
                  <td style={styles.timeCell}>{formatDateTime(log.createdAt)}</td>
                  <td style={styles.actorCell}>{getActorLabel(log)}</td>
                  <td style={styles.actionCell}>{log.action}</td>
                  <td style={styles.targetTypeCell}>{log.targetType}</td>
                  <td style={styles.targetIdCell}>{log.targetId ?? 'Không có'}</td>
                  <td style={styles.summaryCell}>
                    <div style={styles.diffSummary}>
                      <strong>Before</strong>
                      <span>{summarizeJson(log.before)}</span>
                      <strong>After</strong>
                      <span>{summarizeJson(log.after)}</span>
                    </div>
                  </td>
                  <td style={styles.actionColumn}>
                    <button type="button" onClick={() => setSelectedLog(log)}>
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedLog ? (
        <section style={styles.detailCard}>
          <div style={styles.detailHeader}>
            <div>
              <h3 style={styles.detailTitle}>
                {selectedLog.action} - {selectedLog.targetType}
              </h3>
              <p style={styles.detailMeta}>
                {getSourceLabel(selectedLog.source)} · {formatDateTime(selectedLog.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              style={styles.secondaryButton}
            >
              Đóng
            </button>
          </div>

          <dl style={styles.metaGrid}>
            <div>
              <dt>Actor</dt>
              <dd>{getActorLabel(selectedLog)}</dd>
            </div>
            <div>
              <dt>Target ID</dt>
              <dd>{selectedLog.targetId ?? 'Không có'}</dd>
            </div>
            <div>
              <dt>Request ID</dt>
              <dd>{selectedLog.requestId ?? 'Không có'}</dd>
            </div>
            <div>
              <dt>IP / User agent</dt>
              <dd>
                {selectedLog.ipAddress ?? 'Không có'} /{' '}
                {selectedLog.userAgent ?? 'Không có'}
              </dd>
            </div>
          </dl>

          <div style={styles.detailJsonGrid}>
            <JsonPanel title="Before" value={selectedLog.before} />
            <JsonPanel title="After" value={selectedLog.after} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SourceStatus({
  label,
  queryStatus,
}: {
  label: string;
  queryStatus: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    count: number;
  };
}): React.JSX.Element {
  if (queryStatus.isLoading) {
    return (
      <div style={styles.sourceStatus}>
        <strong>{label}</strong>
        <span>Đang tải</span>
      </div>
    );
  }

  if (queryStatus.isError) {
    return (
      <div style={{ ...styles.sourceStatus, ...styles.sourceStatusError }}>
        <strong>{label}</strong>
        <span>{getErrorMessage(queryStatus.error)}</span>
      </div>
    );
  }

  return (
    <div style={styles.sourceStatus}>
      <strong>{label}</strong>
      <span>{queryStatus.count} bản ghi</span>
    </div>
  );
}

function JsonPanel({
  title,
  value,
}: {
  title: string;
  value: unknown;
}): React.JSX.Element {
  return (
    <div style={styles.jsonPanel}>
      <h4>{title}</h4>
      <pre style={styles.jsonPre}>{safeStringify(value)}</pre>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  helperText: {
    color: 'var(--admin-primary)',
    marginTop: 4,
  },
  filterForm: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    border: '1px solid var(--admin-border)',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 150,
  },
  secondaryButton: {
    background: '#ffffff',
    borderColor: '#cbd5e1',
    color: '#475569',
  },
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
    marginBottom: 12,
  },
  sourceStatus: {
    border: '1px solid var(--admin-border)',
    borderRadius: 12,
    padding: 10,
    background: 'var(--admin-surface-soft)',
    display: 'grid',
    gap: 4,
  },
  sourceStatusError: {
    borderColor: '#fecaca',
    background: '#fff1f2',
    color: '#9f1239',
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid var(--admin-border)',
    borderRadius: 12,
  },
  table: {
    minWidth: 1120,
    tableLayout: 'fixed',
  },
  sourceCell: {
    width: 90,
  },
  timeCell: {
    width: 150,
  },
  actorCell: {
    width: 170,
    overflowWrap: 'anywhere',
  },
  actionCell: {
    width: 160,
    overflowWrap: 'anywhere',
  },
  targetTypeCell: {
    width: 130,
    overflowWrap: 'anywhere',
  },
  targetIdCell: {
    width: 180,
    overflowWrap: 'anywhere',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  summaryCell: {
    width: 320,
  },
  actionColumn: {
    width: 90,
  },
  sourceBadge: {
    display: 'inline-block',
    border: '1px solid #c7d2fe',
    borderRadius: 999,
    padding: '3px 8px',
    color: 'var(--admin-primary-dark)',
    background: 'var(--admin-surface-soft)',
    fontSize: 12,
    fontWeight: 700,
  },
  diffSummary: {
    display: 'grid',
    gap: 4,
    maxWidth: 300,
    fontSize: 12,
    lineHeight: 1.45,
    overflowWrap: 'anywhere',
  },
  detailCard: {
    marginTop: 14,
    border: '1px solid var(--admin-border)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'var(--admin-surface-soft)',
    display: 'grid',
    gap: 12,
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailTitle: {
    margin: 0,
    fontSize: 18,
  },
  detailMeta: {
    margin: '4px 0 0',
    color: 'var(--admin-muted)',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 10,
    margin: 0,
  },
  detailJsonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 10,
  },
  jsonPanel: {
    minWidth: 0,
    border: '1px solid var(--admin-border)',
    borderRadius: 10,
    background: '#ffffff',
    padding: 10,
  },
  jsonPre: {
    maxHeight: 320,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    margin: 0,
    fontSize: 12,
    lineHeight: 1.5,
  },
};
