import { Module } from '@nestjs/common';

import { CourierModule } from './api/courier/courier.module';
import { ChatModule } from './api/chat/chat.module';
import { MerchantModule } from './api/merchant/merchant.module';
import { OpsModule } from './api/ops/ops.module';
import { PublicModule } from './api/public/public.module';
import { TasksRealtimeModule } from './api/tasks-realtime/tasks-realtime.module';
import { MediaModule } from './api/media/media.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    HealthModule,
    PublicModule,
    ChatModule,
    TasksRealtimeModule,
    MerchantModule,
    OpsModule,
    CourierModule,
    MediaModule,
  ],
})
export class AppModule {}
