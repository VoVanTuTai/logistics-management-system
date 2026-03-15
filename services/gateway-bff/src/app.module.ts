import { Module } from '@nestjs/common';

import { CourierModule } from './api/courier/courier.module';
import { MerchantModule } from './api/merchant/merchant.module';
import { OpsModule } from './api/ops/ops.module';
import { PublicModule } from './api/public/public.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule, PublicModule, MerchantModule, OpsModule, CourierModule],
})
export class AppModule {}
