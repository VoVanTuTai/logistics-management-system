import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
    const opsScope = getOpsShipmentScopeContext(request);
    const ownerContext = getAuthenticatedOwnerContext(request, {});
    const effectiveFilters = { ...filters };

    // Only auto-scope createdByUserId for Merchant web calls (not OPS portal calls)
    if (!opsScope && ownerContext.createdByUserId && ownerContext.createdByType === 'MERCHANT') {
      effectiveFilters.createdByUserId = ownerContext.createdByUserId;
    }

    return this.shipmentsService.list(
      effectiveFilters,
      opsScope,
    );
  }

  @Get('sent')
  listSent(
    @Query() filters: ShipmentListFilters & { userId?: string },
    @Req() request: ScopedRequest,
  ): Promise<Shipment[] | ShipmentListPage> {
    const ownerContext = getAuthenticatedOwnerContext(request, {});
    const { createdByUserId: _ignored1, userId: queryUserId, ...cleanFilters } = filters;

    const targetUserId = ownerContext.createdByUserId || queryUserId;

    if (!targetUserId) {
      return Promise.resolve([]);
    }

    const effectiveFilters: ShipmentListFilters = {
      ...cleanFilters,
      createdByUserId: targetUserId,
    };

    return this.shipmentsService.list(effectiveFilters);
  }

  @Get('received')
  listReceived(
    @Query() filters: ShipmentListFilters & { phone?: string },
    @Req() request: ScopedRequest,
  ): Promise<Shipment[] | ShipmentListPage> {
    const userPhone = getSingleHeader(request, 'x-user-phone') || filters.phone;
    const { receiverPhone: _ignored1, phone: _ignored2, ...cleanFilters } = filters;

    if (!userPhone) {
      return Promise.resolve([]);
    }

    const effectiveFilters: ShipmentListFilters = {
      ...cleanFilters,
      receiverPhone: userPhone,
    };

    return this.shipmentsService.list(effectiveFilters);
  }

  @Get(':code')
  async getByCode(
    @Param('code') code: string,
    @Req() request: ScopedRequest,
  ): Promise<Shipment> {
    const opsScope = getOpsShipmentScopeContext(request);
    const shipment = await this.shipmentsService.getByCode(code, opsScope);

    const ownerContext = getAuthenticatedOwnerContext(request, {});
    const userRoles = getHeaderList(request, 'x-user-roles');
    const userPhone = getSingleHeader(request, 'x-user-phone');

    if (userRoles.includes('CUSTOMER')) {
      const isSender =
        ownerContext.createdByUserId &&
        shipment.createdByUserId === ownerContext.createdByUserId;
      const isReceiver =
        userPhone && shipment.receiverPhone === userPhone;

      if (!isSender && !isReceiver) {
        throw new NotFoundException(`Shipment "${code}" was not found.`);
      }
    }

    return shipment;
  }

  @Post()
  create(
    @Body() body: CreateShipmentInput,
    @Req() request: ScopedRequest,
  ): Promise<Shipment> {
    const ownerContext = getAuthenticatedOwnerContext(request, body);

    const {
      createdByUserId: _ignored1,
      createdByType: _ignored2,
      receiverPhone: _ignored3,
      ...cleanBody
    } = body;

    return this.shipmentsService.create({
      ...cleanBody,
      createdByUserId: ownerContext.createdByUserId,
      createdByType: ownerContext.createdByType,
    });
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

function getAuthenticatedOwnerContext(
  request: ScopedRequest,
  body: CreateShipmentInput,
): { createdByUserId: string | null; createdByType: 'MERCHANT' | 'CUSTOMER' | null } {
  const userId =
    getSingleHeader(request, 'x-user-id') ||
    getSingleHeader(request, 'x-merchant-id') ||
    getSingleHeader(request, 'x-ops-user-id');
  const roles = getHeaderList(request, 'x-user-roles');

  const createdByType = roles.includes('CUSTOMER') ? 'CUSTOMER' : 'MERCHANT';

  if (userId) {
    return {
      createdByUserId: userId,
      createdByType,
    };
  }

  const metadata = asRecord(body.metadata);
  const merchant = asRecord(metadata?.merchant);
  const createdBy = asRecord(metadata?.createdBy);
  const sender = asRecord(metadata?.sender);

  const fallbackUserId =
    typeof metadata?.createdByUserId === 'string'
      ? metadata.createdByUserId.trim()
      : typeof createdBy?.userId === 'string'
        ? createdBy.userId.trim()
        : typeof sender?.phone === 'string'
          ? sender.phone.trim()
          : typeof merchant?.username === 'string'
            ? merchant.username.trim()
            : null;

  const isCustomer =
    roles.includes('CUSTOMER') ||
    metadata?.source === 'customer-mobile' ||
    typeof metadata?.createdByUserId === 'string' ||
    typeof createdBy?.userId === 'string';

  return {
    createdByUserId: fallbackUserId,
    createdByType: isCustomer ? 'CUSTOMER' : fallbackUserId ? 'MERCHANT' : null,
  };
}

function getSingleHeader(request: ScopedRequest, name: string): string | null {
  const value = request.headers[name];
  const rawValue = Array.isArray(value) ? value[0] : value;
  return typeof rawValue === 'string' && rawValue.trim().length > 0 ? rawValue.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
