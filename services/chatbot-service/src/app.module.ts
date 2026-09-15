import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ChatModule } from './chat/chat.module';
import { RagModule } from './rag/rag.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [HealthModule, ChatModule, RagModule, ToolsModule],
})
export class AppModule {}
