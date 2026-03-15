import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ManifestsService } from '../../application/services/manifests.service';
import type {
  CreateManifestInput,
  Manifest,
  ReceiveManifestInput,
  SealManifestInput,
  UpdateManifestInput,
} from '../../domain/entities/manifest.entity';

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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateManifestInput,
  ): Promise<Manifest> {
    return this.manifestsService.update(id, body);
  }

  @Post(':id/seal')
  seal(
    @Param('id') id: string,
    @Body() body: SealManifestInput,
  ): Promise<Manifest> {
    return this.manifestsService.seal(id, body);
  }

  @Post(':id/receive')
  receive(
    @Param('id') id: string,
    @Body() body: ReceiveManifestInput,
  ): Promise<Manifest> {
    return this.manifestsService.receive(id, body);
  }
}
