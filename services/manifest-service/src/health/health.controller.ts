import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      service: 'manifest-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
