import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';

import { ManifestsService } from '../../application/services/manifests.service';
import type {
  AddShipmentsInput,
  CreateManifestInput,
  GenerateBagCodesInput,
  Manifest,
  ReceiveManifestInput,
  RemoveShipmentsInput,
  SealManifestInput,
  UpdateManifestInput,
} from '../../domain/entities/manifest.entity';
import {
  type AuditRequest,
  getOpsAuditContext,
} from './ops-audit-context';

@Controller('manifests')
export class ManifestsController {
  constructor(private readonly manifestsService: ManifestsService) {}

  @Get()
  list(): Promise<Manifest[]> {
    return this.manifestsService.list();
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Manifest> {
    return this.manifestsService.getById(id);
  }

  @Post()
  create(@Body() body: CreateManifestInput): Promise<Manifest> {
    return this.manifestsService.create(body);
  }

  @Post('bags/generate')
  generateBagCodes(@Body() body: GenerateBagCodesInput): Promise<Manifest[]> {
    return this.manifestsService.generateBagCodes(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateManifestInput,
  ): Promise<Manifest> {
    return this.manifestsService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<Manifest> {
    return this.manifestsService.delete(id);
  }

  @Post(':id/shipments/add')
  addShipments(
    @Param('id') id: string,
    @Body() body: AddShipmentsInput,
    @Req() request: AuditRequest,
  ): Promise<Manifest> {
    return this.manifestsService.addShipments(id, body, getOpsAuditContext(request));
  }

  @Post(':id/shipments/remove')
  removeShipments(
    @Param('id') id: string,
    @Body() body: RemoveShipmentsInput,
    @Req() request: AuditRequest,
  ): Promise<Manifest> {
    return this.manifestsService.removeShipments(id, body, getOpsAuditContext(request));
  }

  @Post(':id/seal')
  seal(
    @Param('id') id: string,
    @Body() body: SealManifestInput,
    @Req() request: AuditRequest,
  ): Promise<Manifest> {
    return this.manifestsService.seal(id, body, getOpsAuditContext(request));
  }

  @Post(':id/receive')
  receive(
    @Param('id') id: string,
    @Body() body: ReceiveManifestInput,
    @Req() request: AuditRequest,
  ): Promise<Manifest> {
    return this.manifestsService.receive(id, body, getOpsAuditContext(request));
  }
}
