import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

const SERVICE_URL_ENV = {
  auth: 'AUTH_SERVICE_URL',
  delivery: 'DELIVERY_SERVICE_URL',
  dispatch: 'DISPATCH_SERVICE_URL',
  manifest: 'MANIFEST_SERVICE_URL',
  masterdata: 'MASTERDATA_SERVICE_URL',
  pickup: 'PICKUP_SERVICE_URL',
  reporting: 'REPORTING_SERVICE_URL',
  scan: 'SCAN_SERVICE_URL',
  shipment: 'SHIPMENT_SERVICE_URL',
  tracking: 'TRACKING_SERVICE_URL',
} as const;

export type ApiGroup = 'public' | 'merchant' | 'ops' | 'courier';
type ServiceName = keyof typeof SERVICE_URL_ENV;

@Injectable()
export class ServiceRegistryClient {
  resolveServiceUrl(serviceName: string): string {
    const normalizedServiceName = this.normalizeServiceName(serviceName);
    const envKey = SERVICE_URL_ENV[normalizedServiceName as ServiceName];

    if (!envKey) {
      throw new NotFoundException(`Unknown target service "${serviceName}".`);
    }

    const targetUrl = process.env[envKey];

    if (!targetUrl) {
      throw new ServiceUnavailableException(
        `Missing target URL configuration for "${serviceName}".`,
      );
    }

    return targetUrl;
  }

  private normalizeServiceName(serviceName: string): string {
    return serviceName.trim().toLowerCase().replace(/-service$/, '');
  }
}
