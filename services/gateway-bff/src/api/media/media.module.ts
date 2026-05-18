import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';

@Module({
  controllers: [MediaController],
  providers: [GatewayAuthGuard],
})
export class MediaModule {}
