export type AdminAuditSource = 'auth-service' | 'masterdata-service';
export type AdminAuditSourceFilter = 'all' | AdminAuditSource | '';

export interface AdminAuditLogFilters {
  source?: AdminAuditSourceFilter;
  action?: string;
  targetType?: string;
  targetId?: string;
  actor?: string;
  q?: string;
  createdDate?: string;
  limit?: string;
  offset?: string;
}

export interface AdminAuditLogDto {
  id: string;
  source: AdminAuditSource;
  actorId: string | null;
  actorUsername: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  before: unknown;
  after: unknown;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminAuditLogPageInfo {
  nextCursor?: string;
  hasNextPage: boolean;
  total?: number;
}

export interface AdminAuditLogPage {
  items: AdminAuditLogDto[];
  pageInfo: AdminAuditLogPageInfo;
}
