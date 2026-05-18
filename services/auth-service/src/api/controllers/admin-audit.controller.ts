import { Controller, Get, Query } from '@nestjs/common';

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
}
