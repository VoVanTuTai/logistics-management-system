import { useMutation, useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { opsAuditClient } from './opsAudit.client';
import type { OpsAuditLogFilters } from './opsAudit.types';

export function useOpsAuditLogsQuery(
  accessToken: string | null,
  filters: OpsAuditLogFilters,
) {
  return useQuery({
    queryKey: buildOpsAuditQueryKey(filters),
    queryFn: () => opsAuditClient.list(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}

export function useExportOpsAuditLogsMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (filters: OpsAuditLogFilters) =>
      opsAuditClient.exportCsv(accessToken, filters),
  });
}

function buildOpsAuditQueryKey(filters: OpsAuditLogFilters) {
  return [
    ...queryKeys.opsAudit,
    filters.source ?? '',
    filters.action ?? '',
    filters.targetType ?? '',
    filters.targetId ?? '',
    filters.actor ?? '',
    filters.createdFrom ?? '',
    filters.createdTo ?? '',
    filters.q ?? '',
    filters.limit ?? '',
    filters.offset ?? '',
  ];
}
