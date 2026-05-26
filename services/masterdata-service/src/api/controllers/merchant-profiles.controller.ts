import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';

import { MerchantProfilesService } from '../../application/services/merchant-profiles.service';
import type {
  MerchantProfile,
  MerchantProfileWriteInput,
} from '../../domain/entities/merchant-profile.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

@Controller('merchant-profiles')
export class MerchantProfilesController {
  constructor(private readonly merchantProfilesService: MerchantProfilesService) {}

  @Get()
  list(
    @Query('username') username?: string,
    @Query('citizenId') citizenId?: string,
    @Query('regionCode') regionCode?: string,
    @Query('defaultHubCode') defaultHubCode?: string,
    @Query('q') q?: string,
  ): Promise<MerchantProfile[]> {
    return this.merchantProfilesService.list({
      username,
      citizenId,
      regionCode,
      defaultHubCode,
      q,
    });
  }

  @Get('by-username/:username')
  getByUsername(@Param('username') username: string): Promise<MerchantProfile> {
    return this.merchantProfilesService.getByUsername(username);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<MerchantProfile> {
    return this.merchantProfilesService.getById(id);
  }

  @Post()
  create(
    @Body() body: MerchantProfileWriteInput,
    @Req() request: AuditRequest,
  ): Promise<MerchantProfile> {
    return this.merchantProfilesService.create(
      body,
      getAdminAuditContext(request),
    );
  }

  @Put('by-username/:username')
  upsertByUsername(
    @Param('username') username: string,
    @Body() body: MerchantProfileWriteInput,
    @Req() request: AuditRequest,
  ): Promise<MerchantProfile> {
    return this.merchantProfilesService.upsertByUsername(
      username,
      body,
      getAdminAuditContext(request),
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<MerchantProfileWriteInput>,
    @Req() request: AuditRequest,
  ): Promise<MerchantProfile> {
    return this.merchantProfilesService.update(
      id,
      body,
      getAdminAuditContext(request),
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; merchantProfileId: string | null }> {
    return this.merchantProfilesService.remove(
      id,
      getAdminAuditContext(request),
    );
  }
}
