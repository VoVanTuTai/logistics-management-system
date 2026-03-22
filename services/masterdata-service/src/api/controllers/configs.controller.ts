import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ConfigsService } from '../../application/services/configs.service';
import type { Config, ConfigWriteInput } from '../../domain/entities/config.entity';

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get()
  list(
    @Query('key') key?: string,
    @Query('scope') scope?: string,
    @Query('q') q?: string,
  ): Promise<Config[]> {
    return this.configsService.list({
      key,
      scope,
      q,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Config> {
    return this.configsService.getById(id);
  }

  @Post()
  create(@Body() body: ConfigWriteInput): Promise<Config> {
    return this.configsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<ConfigWriteInput>,
  ): Promise<Config> {
    return this.configsService.update(id, body);
  }
}
