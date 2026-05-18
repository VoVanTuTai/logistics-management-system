import { Controller, Get, Query } from '@nestjs/common';

import {
  type ListOpsAuditLogsInput,
  OpsAuditService,
} from '../../application/services/ops-audit.service';

@Controller('ops-audit-logs')
export class OpsAuditController {
  constructor(private readonly opsAuditService: OpsAuditService) {}

  @Get()
  list(@Query() query: ListOpsAuditLogsInput) {
    return this.opsAuditService.list(query);
  }
}
