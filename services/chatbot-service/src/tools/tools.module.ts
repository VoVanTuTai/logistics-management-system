import { Module } from '@nestjs/common';
import { LogisticsToolsService } from './logistics-tools.service';

@Module({
  providers: [LogisticsToolsService],
  exports: [LogisticsToolsService],
})
export class ToolsModule {}
