export type AdminAuditSource = 'auth-service' | 'masterdata-service';

export interface AdminAuditLogFilters {
  action?: string;
  targetType?: string;
  actor?: string;
  createdDate?: string;
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
