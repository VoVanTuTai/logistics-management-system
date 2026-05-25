import type { OpsAuditContext } from '../../application/services/ops-audit.service';

export interface AuditRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

export function getOpsAuditContext(request: AuditRequest): OpsAuditContext {
  return {
    actorId: getHeaderValue(request, 'x-ops-user-id') ?? getHeaderValue(request, 'x-actor-id'),
    actorUsername:
      getHeaderValue(request, 'x-ops-username') ?? getHeaderValue(request, 'x-actor-username'),
    requestId: getHeaderValue(request, 'x-request-id'),
    ipAddress: request.ip ?? request.socket?.remoteAddress ?? null,
    userAgent: getHeaderValue(request, 'user-agent'),
  };
}

function getHeaderValue(request: AuditRequest, name: string): string | null {
  const value = request.headers[name];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}
