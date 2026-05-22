import {
  All,
  BadGatewayException,
  Controller,
  Get,
  Module,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';
import { OpsHubScopeGuard } from '../../common/guards/ops-hub-scope.guard';
import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';
import { GatewayProxyClient } from '../../infrastructure/clients/gateway-proxy.client';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';

@UseGuards(GatewayAuthGuard, OpsHubScopeGuard)
@Controller('ops')
class OpsController {
  constructor(
    private readonly gatewayProxyClient: GatewayProxyClient,
    private readonly serviceRegistryClient: ServiceRegistryClient,
  ) {}

  @Get('admin/audit-logs')
  async listAuditLogs(
    @Query() query: AuditLogQuery,
    @Req() request: Request,
  ): Promise<AuditLogPage> {
    return this.loadUnifiedAuditLogs(query, request, 'page');
  }

  @Get('admin/audit-logs/export')
  async exportAuditLogs(
    @Query() query: AuditLogQuery,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const page = await this.loadUnifiedAuditLogs(
      {
        ...query,
        offset: '0',
        limit: query.limit ?? String(AUDIT_EXPORT_LIMIT),
      },
      request,
      'export',
    );

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="admin-audit-logs.csv"',
    );
    response.send(toAuditCsv(page.items));
  }

  @All()
  handleRoot(@Res() response: Response): void {
    this.gatewayProxyClient.rejectMissingService('ops', response);
  }

  @All('*')
  async proxy(@Req() request: Request, @Res() response: Response): Promise<void> {
    await this.gatewayProxyClient.forward(
      'ops',
      request.params['0'] ?? '',
      request,
      response,
    );
  }

  private async loadUnifiedAuditLogs(
    query: AuditLogQuery,
    request: Request,
    mode: 'page' | 'export',
  ): Promise<AuditLogPage> {
    const source = normalizeSource(query.source);
    const limit = mode === 'export'
      ? normalizeLimit(query.limit, AUDIT_EXPORT_LIMIT)
      : normalizeLimit(query.limit, AUDIT_DEFAULT_LIMIT);
    const offset = mode === 'export' ? 0 : normalizeOffset(query.offset);
    const serviceSources = source === 'all'
      ? AUDIT_SOURCES
      : AUDIT_SOURCES.filter((item) => item.source === source);
    const serviceLimit = source === 'all' ? offset + limit : limit;

    const pages = await Promise.all(
      serviceSources.map((item) =>
        this.fetchAuditPage(
          item,
          {
            ...query,
            limit: String(serviceLimit),
            offset: source === 'all' ? '0' : String(offset),
          },
          request,
        ),
      ),
    );

    const mergedItems = pages
      .flatMap((page) => page.items)
      .sort(compareAuditLogsDesc);
    const total = pages.reduce((sum, page) => sum + page.pageInfo.total, 0);
    const items = source === 'all'
      ? mergedItems.slice(offset, offset + limit)
      : mergedItems;

    return {
      items,
      pageInfo: {
        hasNextPage: offset + items.length < total,
        total,
      },
    };
  }

  private async fetchAuditPage(
    sourceConfig: AuditSourceConfig,
    query: AuditLogQuery,
    request: Request,
  ): Promise<AuditLogPage> {
    const baseUrl = this.serviceRegistryClient.resolveServiceUrl(sourceConfig.service);
    const url = new URL(sourceConfig.path, ensureTrailingSlash(baseUrl));
    const params = buildAuditSearchParams(query);
    url.search = params.toString();

    const upstreamResponse = await fetch(url, {
      method: 'GET',
      headers: buildForwardHeaders(request),
      redirect: 'manual',
    });
    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      const message = extractUpstreamMessage(payload, upstreamResponse.status);
      throw new BadGatewayException(
        `${sourceConfig.source} audit read failed: ${message}`,
      );
    }

    return normalizeAuditPage(payload, sourceConfig.source);
  }
}

@Module({
  controllers: [OpsController],
  providers: [
    AuthServiceClient,
    GatewayProxyClient,
    ServiceRegistryClient,
    GatewayAuthGuard,
    OpsHubScopeGuard,
  ],
})
export class OpsModule {}

const AUDIT_DEFAULT_LIMIT = 20;
const AUDIT_EXPORT_LIMIT = 5000;

type AuditSource =
  | 'auth-service'
  | 'masterdata-service'
  | 'dispatch-service'
  | 'scan-service'
  | 'manifest-service'
  | 'delivery-service';
type AuditSourceFilter = 'all' | AuditSource;

interface AuditLogQuery {
  source?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  actor?: string;
  createdFrom?: string;
  createdTo?: string;
  q?: string;
  limit?: string;
  offset?: string;
}

interface AuditLogDto {
  id: string;
  source: AuditSource;
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

interface AuditLogPage {
  items: AuditLogDto[];
  pageInfo: {
    hasNextPage: boolean;
    total: number;
  };
}

interface AuditSourceConfig {
  source: AuditSource;
  service: 'auth' | 'masterdata' | 'dispatch' | 'scan' | 'manifest' | 'delivery';
  path: string;
}

const AUDIT_SOURCES: AuditSourceConfig[] = [
  {
    source: 'auth-service',
    service: 'auth',
    path: 'auth/admin-audit-logs',
  },
  {
    source: 'masterdata-service',
    service: 'masterdata',
    path: 'admin-audit-logs',
  },
  {
    source: 'dispatch-service',
    service: 'dispatch',
    path: 'ops-audit-logs',
  },
  {
    source: 'scan-service',
    service: 'scan',
    path: 'ops-audit-logs',
  },
  {
    source: 'manifest-service',
    service: 'manifest',
    path: 'ops-audit-logs',
  },
  {
    source: 'delivery-service',
    service: 'delivery',
    path: 'ops-audit-logs',
  },
];

function normalizeSource(value: string | undefined): AuditSourceFilter {
  if (
    value === 'auth-service' ||
    value === 'masterdata-service' ||
    value === 'dispatch-service' ||
    value === 'scan-service' ||
    value === 'manifest-service' ||
    value === 'delivery-service'
  ) {
    return value;
  }

  return 'all';
}

function buildAuditSearchParams(query: AuditLogQuery): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of [
    'action',
    'targetType',
    'targetId',
    'actor',
    'createdFrom',
    'createdTo',
    'q',
    'limit',
    'offset',
  ] as const) {
    const value = query[key]?.trim();
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

function normalizeLimit(value: string | undefined, defaultLimit: number): number {
  const parsedLimit = value ? Number(value) : defaultLimit;

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return defaultLimit;
  }

  return Math.min(Math.trunc(parsedLimit), AUDIT_EXPORT_LIMIT);
}

function normalizeOffset(value: string | undefined): number {
  const parsedOffset = value ? Number(value) : 0;

  if (!Number.isFinite(parsedOffset) || parsedOffset <= 0) {
    return 0;
  }

  return Math.trunc(parsedOffset);
}

function normalizeAuditPage(payload: unknown, source: AuditSource): AuditLogPage {
  const record = isRecord(payload) ? payload : {};
  const rows = Array.isArray(record.items) ? record.items : [];
  const pageInfo = isRecord(record.pageInfo) ? record.pageInfo : {};
  const total = typeof pageInfo.total === 'number' ? pageInfo.total : rows.length;
  const hasNextPage =
    typeof pageInfo.hasNextPage === 'boolean'
      ? pageInfo.hasNextPage
      : false;

  return {
    items: rows.map((row, index) => normalizeAuditRow(row, source, index)),
    pageInfo: {
      hasNextPage,
      total,
    },
  };
}

function normalizeAuditRow(
  row: unknown,
  source: AuditSource,
  index: number,
): AuditLogDto {
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

function compareAuditLogsDesc(first: AuditLogDto, second: AuditLogDto): number {
  const createdAtDiff =
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();

  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return `${second.source}:${second.id}`.localeCompare(`${first.source}:${first.id}`);
}

function toAuditCsv(rows: AuditLogDto[]): string {
  const headers = [
    'source',
    'id',
    'actorId',
    'actorUsername',
    'action',
    'targetType',
    'targetId',
    'requestId',
    'ipAddress',
    'userAgent',
    'createdAt',
    'before',
    'after',
  ];
  const lines = rows.map((row) =>
    [
      row.source,
      row.id,
      row.actorId,
      row.actorUsername,
      row.action,
      row.targetType,
      row.targetId,
      row.requestId,
      row.ipAddress,
      row.userAgent,
      row.createdAt,
      JSON.stringify(row.before ?? null),
      JSON.stringify(row.after ?? null),
    ]
      .map(escapeCsvValue)
      .join(','),
  );

  return [headers.join(','), ...lines].join('\n');
}

function buildForwardHeaders(request: Request): Headers {
  const headers = new Headers();

  if (request.headers.authorization) {
    headers.set('authorization', request.headers.authorization);
  }

  if (request.headers['x-request-id']) {
    headers.set('x-request-id', String(request.headers['x-request-id']));
  }

  headers.set('accept', 'application/json');
  headers.set('x-forwarded-for', request.ip ?? '');
  headers.set('x-forwarded-host', request.hostname ?? '');
  headers.set('x-forwarded-proto', request.protocol ?? '');
  headers.set('x-gateway-group', 'ops');

  return headers;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function extractUpstreamMessage(payload: unknown, status: number): string {
  if (
    isRecord(payload) &&
    typeof payload.message === 'string' &&
    payload.message.trim().length > 0
  ) {
    return payload.message;
  }

  return `status ${status}`;
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

function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
