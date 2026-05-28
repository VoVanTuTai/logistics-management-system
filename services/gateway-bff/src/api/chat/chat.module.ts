import { Module } from '@nestjs/common';

import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';
import { ChatController } from './chat.controller';
import { ChatMetricsService } from './chat.metrics';
import { ChatPubSubService } from './chat.pubsub';
import { ChatRealtimeGateway } from './chat-realtime.gateway';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [
    AuthServiceClient,
    ChatMetricsService,
    ChatPubSubService,
    ChatRealtimeGateway,
    ChatService,
    ServiceRegistryClient,
  ],
  exports: [ChatMetricsService, ChatRealtimeGateway],
})
export class ChatModule {}
