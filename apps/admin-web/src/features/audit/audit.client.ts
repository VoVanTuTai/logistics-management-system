import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import type {
  AdminAuditLogDto,
  AdminAuditLogFilters,
  AdminAuditSource,
} from './audit.types';

type SourceKey = 'auth' | 'masterdata';

function buildQueryString(filters: AdminAuditLogFilters): string {
  const params = new URLSearchParams();
  const action = filters.action?.trim();
  const targetType = filters.targetType?.trim();
  const actor = filters.actor?.trim();

  if (action) {
    params.set('action', action);
  }

  if (targetType) {
    params.set('targetType', targetType);
  }

  if (actor) {
    params.set('actor', actor);
  }

  if (filters.createdDate) {
    const range = toDateRange(filters.createdDate);
    params.set('createdFrom', range.createdFrom);
    params.set('createdTo', range.createdTo);
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

function getEndpoint(source: SourceKey): string {
  return source === 'auth'
    ? opsEndpoints.auth.adminAuditLogs
    : opsEndpoints.masterdata.adminAuditLogs;
}

function getSourceLabel(source: SourceKey): AdminAuditSource {
  return source === 'auth' ? 'auth-service' : 'masterdata-service';
}

function normalizeAuditResponse(
  payload: unknown,
  source: AdminAuditSource,
): AdminAuditLogDto[] {
  const rows = extractRows(payload);

  return rows.map((row, index) => normalizeAuditRow(row, source, index));
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
  source: AdminAuditSource,
  index: number,
): AdminAuditLogDto {
  const record = isRecord(row) ? row : {};
  const createdAt = getString(record.createdAt) ?? new Date(0).toISOString();

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
    source: SourceKey,
    filters: AdminAuditLogFilters,
  ): Promise<AdminAuditLogDto[]> => {
    const payload = await opsApiClient.request<unknown>(
      `${getEndpoint(source)}${buildQueryString(filters)}`,
      { accessToken },
    );

    return normalizeAuditResponse(payload, getSourceLabel(source));
  },
};
