import { opsApiClient } from '../../services/api/client';
import { ApiClientError } from '../../services/api/errors';
import { opsEndpoints } from '../../services/api/endpoints';
import { getValidAccessToken } from '../auth/auth.session';
import { appEnv } from '../../utils/env';
import type {
  AdminAuditLogDto,
  AdminAuditLogFilters,
  AdminAuditLogPage,
  AdminAuditSource,
} from './audit.types';

function buildQueryString(filters: AdminAuditLogFilters): string {
  const params = new URLSearchParams();
  const source = filters.source?.trim();
  const action = filters.action?.trim();
  const targetType = filters.targetType?.trim();
  const targetId = filters.targetId?.trim();
  const actor = filters.actor?.trim();
  const q = filters.q?.trim();

  if (source) {
    params.set('source', source);
  }

  if (action) {
    params.set('action', action);
  }

  if (targetType) {
    params.set('targetType', targetType);
  }

  if (targetId) {
    params.set('targetId', targetId);
  }

  if (actor) {
    params.set('actor', actor);
  }

  if (q) {
    params.set('q', q);
  }

  if (filters.createdDate) {
    const range = toDateRange(filters.createdDate);
    params.set('createdFrom', range.createdFrom);
    params.set('createdTo', range.createdTo);
  }

  if (filters.limit) {
    params.set('limit', filters.limit);
  }

  if (filters.offset) {
    params.set('offset', filters.offset);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

function toDateRange(dateValue: string): {
  createdFrom: string;
  createdTo: string;
} {
  const [year, month, day] = dateValue.split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return {
    createdFrom: start.toISOString(),
    createdTo: end.toISOString(),
  };
}

function normalizeAuditResponse(payload: unknown): AdminAuditLogPage {
  const record = isRecord(payload) ? payload : {};
  const rows = extractRows(payload);
  const pageInfo = isRecord(record.pageInfo) ? record.pageInfo : {};

  return {
    items: rows.map((row, index) => normalizeAuditRow(row, index)),
    pageInfo: {
      nextCursor: getString(pageInfo.nextCursor) ?? undefined,
      hasNextPage:
        typeof pageInfo.hasNextPage === 'boolean'
          ? pageInfo.hasNextPage
          : false,
      total: typeof pageInfo.total === 'number' ? pageInfo.total : rows.length,
    },
  };
}

function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of ['items', 'data', 'logs', 'records']) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeAuditRow(
  row: unknown,
  index: number,
): AdminAuditLogDto {
  const record = isRecord(row) ? row : {};
  const createdAt = getString(record.createdAt) ?? new Date(0).toISOString();
  const source = normalizeSource(record.source);

  return {
    id: getString(record.id) ?? `${source}-${index}-${createdAt}`,
    source,
    actorId: getNullableString(record.actorId),
    actorUsername: getNullableString(record.actorUsername),
    action: getString(record.action) ?? 'UNKNOWN_ACTION',
    targetType: getString(record.targetType) ?? 'UNKNOWN_TARGET',
    targetId: getNullableString(record.targetId),
    before: record.before ?? null,
    after: record.after ?? null,
    requestId: getNullableString(record.requestId),
    ipAddress: getNullableString(record.ipAddress),
    userAgent: getNullableString(record.userAgent),
    createdAt,
  };
}

function normalizeSource(value: unknown): AdminAuditSource {
  return value === 'auth-service' || value === 'masterdata-service'
    ? value
    : 'auth-service';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getNullableString(value: unknown): string | null {
  return getString(value);
}

export const auditClient = {
  listAuditLogs: async (
    accessToken: string | null,
    filters: AdminAuditLogFilters,
  ): Promise<AdminAuditLogPage> => {
    const payload = await opsApiClient.request<unknown>(
      `${opsEndpoints.admin.auditLogs}${buildQueryString(filters)}`,
      { accessToken },
    );

    return normalizeAuditResponse(payload);
  },

  exportAuditLogs: async (
    accessToken: string | null,
    filters: AdminAuditLogFilters,
  ): Promise<Blob> => {
    const validAccessToken = await getValidAccessToken(accessToken);
    const response = await fetch(
      `${appEnv.gatewayBaseUrl}${opsEndpoints.admin.auditLogsExport}${buildQueryString(filters)}`,
      {
        headers: {
          Accept: 'text/csv',
          ...(validAccessToken ? { Authorization: `Bearer ${validAccessToken}` } : {}),
        },
      },
    );

    if (!response.ok) {
      throw new ApiClientError({
        message: `Export audit log thất bại với mã trạng thái ${response.status}.`,
        status: response.status,
      });
    }

    return response.blob();
  },
};
