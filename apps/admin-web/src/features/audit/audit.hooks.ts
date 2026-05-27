import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { auditClient } from './audit.client';
import type { AdminAuditLogFilters } from './audit.types';

export function useAdminAuditLogsQuery(
  accessToken: string | null,
  filters: AdminAuditLogFilters,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.adminAuditLogs,
      filters.source ?? '',
      filters.action ?? '',
      filters.targetType ?? '',
      filters.targetId ?? '',
      filters.actor ?? '',
      filters.q ?? '',
      filters.createdDate ?? '',
      filters.limit ?? '',
      filters.offset ?? '',
    ],
    queryFn: () => auditClient.listAuditLogs(accessToken, filters),
    enabled: Boolean(accessToken),
  });
}
