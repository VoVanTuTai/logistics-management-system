import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      service: 'masterdata-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
