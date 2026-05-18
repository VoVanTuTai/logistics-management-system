import { Controller, Get, Query } from '@nestjs/common';
import { Res } from '@nestjs/common';

import {
  AdminAuditService,
  type ListAdminAuditLogsInput,
} from '../../application/services/admin-audit.service';

@Controller('auth/admin-audit-logs')
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get()
  list(@Query() query: ListAdminAuditLogsInput) {
    return this.adminAuditService.list(query);
  }

  @Get('export')
  async export(
    @Query() query: ListAdminAuditLogsInput,
    @Res() response: CsvResponse,
  ): Promise<void> {
    const rows = await this.adminAuditService.export(query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="auth-admin-audit-logs.csv"',
    );
    response.send(toCsv(rows));
  }
}

interface CsvResponse {
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

function toCsv(rows: Awaited<ReturnType<AdminAuditService['export']>>): string {
  const headers = [
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
      row.id,
      row.actorId,
      row.actorUsername,
      row.action,
      row.targetType,
      row.targetId,
      row.requestId,
      row.ipAddress,
      row.userAgent,
      row.createdAt.toISOString(),
      JSON.stringify(row.before ?? null),
      JSON.stringify(row.after ?? null),
    ]
      .map(escapeCsvValue)
      .join(','),
  );

  return [headers.join(','), ...lines].join('\n');
}

function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
