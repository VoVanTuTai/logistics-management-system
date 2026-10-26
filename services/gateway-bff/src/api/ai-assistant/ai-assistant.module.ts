import { Module } from '@nestjs/common';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';
import { AiAssistantController } from './ai-assistant.controller';

@Module({
  controllers: [AiAssistantController],
  providers: [ServiceRegistryClient],
})
export class AiAssistantModule {}

