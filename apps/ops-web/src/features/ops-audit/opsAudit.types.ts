export type OpsAuditSource =
  | 'all'
  | 'auth-service'
  | 'masterdata-service'
  | 'dispatch-service'
  | 'scan-service'
  | 'manifest-service'
  | 'delivery-service';

export interface OpsAuditLogDto {
  id: string;
  source: Exclude<OpsAuditSource, 'all'>;
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

export interface OpsAuditLogPageDto {
  items: OpsAuditLogDto[];
  pageInfo: {
    hasNextPage: boolean;
    total: number;
  };
}

export interface OpsAuditLogFilters {
  source?: OpsAuditSource;
  action?: string;
  targetType?: string;
  targetId?: string;
  actor?: string;
  createdFrom?: string;
  createdTo?: string;
  q?: string;
  limit?: number;
  offset?: number;
}
