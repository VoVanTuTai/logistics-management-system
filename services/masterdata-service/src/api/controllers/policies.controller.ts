import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { PoliciesService } from '../../application/services/policies.service';
import type {
  PolicyAdminView,
  PolicyCategory,
  PolicyCreateInput,
  PolicyPublicView,
  PolicyStatus,
  PolicyUpdateInput,
} from '../../domain/entities/policy.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

// ==========================================
// 1. PUBLIC CONTROLLER (Customer & Guest)
// ==========================================
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  list(@Query('category') category?: string): Promise<PolicyPublicView[]> {
    return this.policiesService.listPublic(category);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<PolicyPublicView> {
    return this.policiesService.getPublicBySlug(slug);
  }
}

// ==========================================
// 2. ADMIN CONTROLLER (Admin Portal CRUD)
// ==========================================
@Controller('admin/policies')
export class AdminPoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  list(
    @Query('category') category?: PolicyCategory,
    @Query('status') status?: PolicyStatus,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: PolicyAdminView[]; total: number }> {
    return this.policiesService.listAdmin({
      category,
      status,
      q,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<PolicyAdminView> {
    return this.policiesService.getAdminById(id);
  }

  @Post()
  create(
    @Body() body: PolicyCreateInput,
    @Req() request: AuditRequest,
  ): Promise<PolicyAdminView> {
    return this.policiesService.create(body, getAdminAuditContext(request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: PolicyUpdateInput,
    @Req() request: AuditRequest,
  ): Promise<PolicyAdminView> {
    return this.policiesService.update(id, body, getAdminAuditContext(request));
  }

  @Patch(':id/publish')
  publish(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<PolicyAdminView> {
    return this.policiesService.publish(id, getAdminAuditContext(request));
  }

  @Patch(':id/archive')
  archive(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<PolicyAdminView> {
    return this.policiesService.archive(id, getAdminAuditContext(request));
  }

  @Patch(':id/restore')
  restore(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<PolicyAdminView> {
    return this.policiesService.restore(id, getAdminAuditContext(request));
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; policyId: string | null }> {
    return this.policiesService.remove(id, getAdminAuditContext(request));
  }
}
