import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  controllers: [HealthController],
})
export class HealthModule {}
