import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import {
  type OpsPickupScopeContext,
  PickupsService,
} from '../../application/services/pickups.service';
import type {
  ApprovePickupRequestInput,
  CancelPickupRequestInput,
  CreatePickupRequestInput,
  PickupRequest,
  UpdatePickupRequestInput,
} from '../../domain/entities/pickup-request.entity';

interface ScopedRequest {
  headers: Record<string, string | string[] | undefined>;
}

@Controller('pickups')
export class PickupsController {
  constructor(private readonly pickupsService: PickupsService) {}

  @Get()
  list(
    @Query('status') status: string | undefined,
    @Req() request: ScopedRequest,
  ): Promise<PickupRequest[]> {
    return this.pickupsService.list(status, getOpsPickupScopeContext(request));
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Req() request: ScopedRequest,
  ): Promise<PickupRequest> {
    return this.pickupsService.getById(id, getOpsPickupScopeContext(request));
  }

  @Post()
  create(@Body() body: CreatePickupRequestInput): Promise<PickupRequest> {
    return this.pickupsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdatePickupRequestInput,
    @Req() request: ScopedRequest,
  ): Promise<PickupRequest> {
    return this.pickupsService.update(
      id,
      body,
      getOpsPickupScopeContext(request),
    );
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: CancelPickupRequestInput,
    @Req() request: ScopedRequest,
  ): Promise<PickupRequest> {
    return this.pickupsService.cancel(
      id,
      body,
      getOpsPickupScopeContext(request),
    );
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: ApprovePickupRequestInput,
    @Req() request: ScopedRequest,
  ): Promise<PickupRequest> {
    return this.pickupsService.approve(
      id,
      body,
      getOpsPickupScopeContext(request),
    );
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @Req() request: ScopedRequest,
  ): Promise<PickupRequest> {
    return this.pickupsService.complete(id, getOpsPickupScopeContext(request));
  }
}

function getOpsPickupScopeContext(
  request: ScopedRequest,
): OpsPickupScopeContext | undefined {
  const roles = getHeaderList(request, 'x-ops-roles');
  const hubCodes = getHeaderList(request, 'x-ops-hub-codes');

  if (roles.length === 0 && hubCodes.length === 0) {
    return undefined;
  }

  return {
    hubCodes,
    canAccessAllHubs: roles.includes('SYSTEM_ADMIN'),
  };
}

function getHeaderList(request: ScopedRequest, name: string): string[] {
  const value = request.headers[name];
  const rawValues = Array.isArray(value) ? value : [value];

  return Array.from(
    new Set(
      rawValues
        .filter((item): item is string => typeof item === 'string')
        .flatMap((item) => item.split(','))
        .map((item) => item.trim().toUpperCase())
        .filter((item) => item.length > 0),
    ),
  );
}
