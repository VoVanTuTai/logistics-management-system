import { Module } from '@nestjs/common';

import { QuotesController } from './api/controllers/quotes.controller';
import { PricingService } from './application/services/pricing.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule],
  controllers: [QuotesController],
  providers: [PricingService],
})
export class AppModule {}
