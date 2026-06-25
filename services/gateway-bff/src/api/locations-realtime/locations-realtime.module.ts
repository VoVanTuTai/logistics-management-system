import { Module } from '@nestjs/common';

import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';
import { LocationsRealtimeProxyGateway } from './locations-realtime-proxy.gateway';

@Module({
  providers: [ServiceRegistryClient, LocationsRealtimeProxyGateway],
  exports: [LocationsRealtimeProxyGateway],
})
export class LocationsRealtimeModule {}
