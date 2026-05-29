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
  type OpsShipmentScopeContext,
  ShipmentsService,
} from '../../application/services/shipments.service';
import type {
  CancelShipmentInput,
  ConfirmLabelReprintInput,
  CreateShipmentInput,
  Shipment,
  ShipmentListFilters,
  ShipmentListPage,
  UpdateShipmentInput,
} from '../../domain/entities/shipment.entity';

interface ScopedRequest {
  headers: Record<string, string | string[] | undefined>;
}

@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  list(
    @Query() filters: ShipmentListFilters,
    @Req() request: ScopedRequest,
  ): Promise<Shipment[] | ShipmentListPage> {
    return this.shipmentsService.list(
      filters,
      getOpsShipmentScopeContext(request),
    );
  }

  @Get(':code')
  getByCode(
    @Param('code') code: string,
    @Req() request: ScopedRequest,
  ): Promise<Shipment> {
    return this.shipmentsService.getByCode(
      code,
      getOpsShipmentScopeContext(request),
    );
  }

  @Post()
  create(@Body() body: CreateShipmentInput): Promise<Shipment> {
    return this.shipmentsService.create(body);
  }

  @Patch(':code')
  update(
    @Param('code') code: string,
    @Body() body: UpdateShipmentInput,
    @Req() request: ScopedRequest,
  ): Promise<Shipment> {
    return this.shipmentsService.update(
      code,
      body,
      getOpsShipmentScopeContext(request),
    );
  }

  @Post(':code/label-reprint/confirm')
  confirmLabelReprint(
    @Param('code') code: string,
    @Body() body: ConfirmLabelReprintInput,
    @Req() request: ScopedRequest,
  ): Promise<Shipment> {
    return this.shipmentsService.confirmLabelReprint(
      code,
      body,
      getOpsShipmentScopeContext(request),
    );
  }

  @Post(':code/cancel')
  cancel(
    @Param('code') code: string,
    @Body() body: CancelShipmentInput,
    @Req() request: ScopedRequest,
  ): Promise<Shipment> {
    return this.shipmentsService.cancel(
      code,
      body,
      getOpsShipmentScopeContext(request),
    );
  }
}

function getOpsShipmentScopeContext(
  request: ScopedRequest,
): OpsShipmentScopeContext | undefined {
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
