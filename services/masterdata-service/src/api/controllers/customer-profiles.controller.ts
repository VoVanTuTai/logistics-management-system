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
} from '@nestjs/common';

import { CustomerProfilesService } from '../../application/services/customer-profiles.service';
import type {
  CustomerProfile,
  CustomerProfileWriteInput,
} from '../../domain/entities/customer-profile.entity';

@Controller('customer-profiles')
export class CustomerProfilesController {
  constructor(
    private readonly customerProfilesService: CustomerProfilesService,
  ) {}

  @Get()
  list(
    @Query('userId') userId?: string,
    @Query('phone') phone?: string,
    @Query('q') q?: string,
  ): Promise<CustomerProfile[]> {
    return this.customerProfilesService.list({
      userId,
      phone,
      q,
    });
  }

  @Get('by-user-id/:userId')
  getByUserId(@Param('userId') userId: string): Promise<CustomerProfile> {
    return this.customerProfilesService.getByUserId(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<CustomerProfile> {
    return this.customerProfilesService.getById(id);
  }

  @Post()
  create(@Body() body: CustomerProfileWriteInput): Promise<CustomerProfile> {
    return this.customerProfilesService.create(body);
  }

  @Put('by-user-id/:userId')
  upsertByUserId(
    @Param('userId') userId: string,
    @Body() body: CustomerProfileWriteInput,
  ): Promise<CustomerProfile> {
    return this.customerProfilesService.upsertByUserId(userId, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<CustomerProfileWriteInput>,
  ): Promise<CustomerProfile> {
    return this.customerProfilesService.update(id, body);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ): Promise<{ deleted: boolean; customerProfileId: string | null }> {
    return this.customerProfilesService.remove(id);
  }
}
