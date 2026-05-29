import { Module } from '@nestjs/common';

import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';
import { TasksRealtimeProxyGateway } from './tasks-realtime-proxy.gateway';

@Module({
  providers: [ServiceRegistryClient, TasksRealtimeProxyGateway],
  exports: [TasksRealtimeProxyGateway],
})
export class TasksRealtimeModule {}
