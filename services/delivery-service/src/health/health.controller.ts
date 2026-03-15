import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { service: string; status: string; timestamp: string } {
    return {
      service: 'delivery-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
