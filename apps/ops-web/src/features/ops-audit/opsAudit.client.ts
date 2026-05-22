import { ApiClientError } from '../../services/api/errors';
import { opsApiClient } from '../../services/api/client';
import { opsEndpoints } from '../../services/api/endpoints';
import { getValidAccessToken } from '../auth/auth.session';
import { appEnv } from '../../utils/env';
import type { OpsAuditLogFilters, OpsAuditLogPageDto } from './opsAudit.types';

function buildAuditLogPath(
  basePath: string,
  filters: OpsAuditLogFilters = {},
): string {
  const searchParams = new URLSearchParams();

  appendQueryParam(searchParams, 'source', filters.source);
  appendQueryParam(searchParams, 'action', filters.action);
  appendQueryParam(searchParams, 'targetType', filters.targetType);
  appendQueryParam(searchParams, 'targetId', filters.targetId);
  appendQueryParam(searchParams, 'actor', filters.actor);
  appendQueryParam(searchParams, 'createdFrom', filters.createdFrom);
  appendQueryParam(searchParams, 'createdTo', filters.createdTo);
  appendQueryParam(searchParams, 'q', filters.q);
  appendQueryParam(searchParams, 'limit', filters.limit);
  appendQueryParam(searchParams, 'offset', filters.offset);

  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function appendQueryParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
): void {
  if (value === undefined || value === null) {
    return;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized.toUpperCase() === 'ALL') {
    return;
  }

  searchParams.set(key, normalized);
}

export const opsAuditClient = {
  list: (
    accessToken: string | null,
    filters: OpsAuditLogFilters = {},
  ): Promise<OpsAuditLogPageDto> =>
    opsApiClient.request<OpsAuditLogPageDto>(
      buildAuditLogPath(opsEndpoints.admin.auditLogs, filters),
      { accessToken },
    ),

  exportCsv: async (
    accessToken: string | null,
    filters: OpsAuditLogFilters = {},
  ): Promise<string> => {
    const resolvedAccessToken = await getValidAccessToken(accessToken);
    const response = await fetch(
      `${appEnv.gatewayBaseUrl}${buildAuditLogPath(
        opsEndpoints.admin.auditLogsExport,
        filters,
      )}`,
      {
        headers: {
          Accept: 'text/csv',
          ...(resolvedAccessToken
            ? { Authorization: `Bearer ${resolvedAccessToken}` }
            : {}),
        },
      },
    );
    const text = await response.text();

    if (!response.ok) {
      throw new ApiClientError({
        message: text || `Export audit thất bại với mã ${response.status}.`,
        status: response.status,
      });
    }

    return text;
  },
};
