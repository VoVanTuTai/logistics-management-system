import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../../utils/queryKeys';
import { auditClient } from './audit.client';
import type { AdminAuditLogFilters } from './audit.types';

export function useAuthAuditLogsQuery(
  accessToken: string | null,
  filters: AdminAuditLogFilters,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.adminAuditLogs,
      'auth',
      filters.action ?? '',
      filters.targetType ?? '',
      filters.actor ?? '',
      filters.createdDate ?? '',
    ],
    queryFn: () => auditClient.listAuditLogs(accessToken, 'auth', filters),
    enabled: Boolean(accessToken),
  });
}

export function useMasterdataAuditLogsQuery(
  accessToken: string | null,
  filters: AdminAuditLogFilters,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.adminAuditLogs,
      'masterdata',
      filters.action ?? '',
      filters.targetType ?? '',
      filters.actor ?? '',
      filters.createdDate ?? '',
    ],
    queryFn: () => auditClient.listAuditLogs(accessToken, 'masterdata', filters),
    enabled: Boolean(accessToken),
  });
}
