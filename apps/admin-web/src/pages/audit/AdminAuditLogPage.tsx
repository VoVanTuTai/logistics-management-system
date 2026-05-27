import React, { useState } from 'react';

import { auditClient, useAdminAuditLogsQuery } from '../../features/audit/audit.api';
import type {
  AdminAuditLogDto,
  AdminAuditLogFilters,
  AdminAuditSource,
  AdminAuditSourceFilter,
} from '../../features/audit/audit.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

const SUMMARY_LIMIT = 170;
const AUDIT_EXPORT_LIMIT = '5000';
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

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

function getSourceLabel(source: AdminAuditSource): string {
  return source === 'auth-service' ? 'Auth' : 'Masterdata';
}

export function AdminAuditLogPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [draftFilters, setDraftFilters] = useState<AdminAuditLogFilters>({
    source: 'all',
  });
  const [appliedFilters, setAppliedFilters] = useState<AdminAuditLogFilters>({
    source: 'all',
    limit: String(PAGE_SIZE_OPTIONS[1]),
    offset: '0',
  });
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogDto | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[1]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const auditQuery = useAdminAuditLogsQuery(accessToken, appliedFilters);
  const auditLogs = auditQuery.data?.items ?? [];
  const totalRecords = auditQuery.data?.pageInfo.total ?? auditLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageOffset = (safeCurrentPage - 1) * pageSize;
  const pageStartIndex = totalRecords === 0 ? 0 : pageOffset + 1;
  const pageEndIndex = Math.min(pageOffset + auditLogs.length, totalRecords);

  const onApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedLog(null);
    setCurrentPage(1);
    setAppliedFilters({
      source: draftFilters.source ?? 'all',
      action: normalizeText(draftFilters.action ?? ''),
      targetType: normalizeText(draftFilters.targetType ?? ''),
      targetId: normalizeText(draftFilters.targetId ?? ''),
      actor: normalizeText(draftFilters.actor ?? ''),
      q: normalizeText(draftFilters.q ?? ''),
      createdDate: normalizeText(draftFilters.createdDate ?? ''),
      limit: String(pageSize),
      offset: '0',
    });
  };

  const onResetFilters = () => {
    setDraftFilters({ source: 'all' });
    setAppliedFilters({
      source: 'all',
      limit: String(pageSize),
      offset: '0',
    });
    setSelectedLog(null);
    setCurrentPage(1);
    setExportError(null);
  };

  const onRefresh = async () => {
    await auditQuery.refetch();
  };

  const onChangePageSize = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPageSize = Number(event.target.value);
    setPageSize(nextPageSize);
    setCurrentPage(1);
    setSelectedLog(null);
    setAppliedFilters((previous) => ({
      ...previous,
      limit: String(nextPageSize),
      offset: '0',
    }));
  };

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    setSelectedLog(null);
    setAppliedFilters((previous) => ({
      ...previous,
      limit: String(pageSize),
      offset: String((nextPage - 1) * pageSize),
    }));
  };

  const onExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const blob = await auditClient.exportAuditLogs(accessToken, {
        ...appliedFilters,
        offset: '0',
        limit: AUDIT_EXPORT_LIMIT,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'admin-audit-logs.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = auditQuery.isLoading;
  const isFetching = auditQuery.isFetching;
  const hasSuccess = auditQuery.isSuccess;

  return (
    <div>
      <h2>Audit log quản trị</h2>
      <p style={styles.helperText}>
        Theo dõi thay đổi từ endpoint gateway thống nhất.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          aria-label="Tìm kiếm audit"
          placeholder="Search"
          value={draftFilters.q ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              q: event.target.value,
            }))
          }
          style={styles.input}
        />
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
        <select
          aria-label="Nguồn audit"
          value={draftFilters.source ?? 'all'}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              source: event.target.value as AdminAuditSourceFilter,
            }))
          }
          style={styles.input}
        >
          <option value="all">Tất cả nguồn</option>
          <option value="auth-service">Auth</option>
          <option value="masterdata-service">Masterdata</option>
        </select>
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
          placeholder="Target ID"
          value={draftFilters.targetId ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              targetId: event.target.value,
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
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={isExporting || isLoading}
          style={styles.secondaryButton}
        >
          {isExporting ? 'Đang export...' : 'Export CSV'}
        </button>
      </form>

      <QueryStatus
        isLoading={auditQuery.isLoading}
        isError={auditQuery.isError}
        error={auditQuery.error}
        count={totalRecords}
      />
      {exportError ? <p style={styles.errorText}>{exportError}</p> : null}

      {isLoading ? <p>Đang tải audit log...</p> : null}
      {hasSuccess && auditLogs.length === 0 ? (
        <p>Không tìm thấy audit log phù hợp.</p>
      ) : null}

      {auditLogs.length > 0 ? (
        <>
          <div style={styles.paginationBar}>
            <span>
              Hiển thị {pageStartIndex}-{pageEndIndex} / {totalRecords} bản ghi
            </span>
            <label style={styles.pageSizeLabel}>
              Số dòng
              <select value={pageSize} onChange={onChangePageSize} style={styles.pageSizeSelect}>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div style={styles.paginationActions}>
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => goToPage(safeCurrentPage - 1)}
                style={styles.secondaryButton}
              >
                Trước
              </button>
              <span>
                Trang {safeCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={!auditQuery.data?.pageInfo.hasNextPage}
                onClick={() => goToPage(safeCurrentPage + 1)}
                style={styles.secondaryButton}
              >
                Sau
              </button>
            </div>
          </div>

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
        </>
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

function QueryStatus({
  isLoading,
  isError,
  error,
  count,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  count: number;
}): React.JSX.Element {
  if (isLoading) {
    return (
      <div style={styles.sourceStatus}>
        <strong>Gateway audit</strong>
        <span>Đang tải</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ ...styles.sourceStatus, ...styles.sourceStatusError }}>
        <strong>Gateway audit</strong>
        <span>{getErrorMessage(error)}</span>
      </div>
    );
  }

  return (
    <div style={styles.sourceStatus}>
      <strong>Gateway audit</strong>
      <span>{count} bản ghi theo filter hiện tại</span>
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
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    marginTop: 8,
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
  paginationBar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 13,
    color: 'var(--admin-muted)',
  },
  pageSizeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
  },
  pageSizeSelect: {
    border: '1px solid var(--admin-border)',
    borderRadius: 8,
    padding: '6px 8px',
  },
  paginationActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
