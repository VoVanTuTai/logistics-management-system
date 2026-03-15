import { Body, Controller, Post } from '@nestjs/common';

import { DeliveryService } from '../../application/services/delivery.service';
import type {
  AttemptDeliveryResult,
  DeliveryFailResult,
  DeliverySuccessResult,
  MarkDeliveryFailInput,
  MarkDeliverySuccessInput,
  RecordDeliveryAttemptInput,
} from '../../domain/entities/delivery-attempt.entity';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('attempts')
  createAttempt(
    @Body() body: RecordDeliveryAttemptInput,
  ): Promise<AttemptDeliveryResult> {
    return this.deliveryService.createAttempt(body);
  }

  @Post('success')
  markSuccess(
    @Body() body: MarkDeliverySuccessInput,
  ): Promise<DeliverySuccessResult> {
    return this.deliveryService.markSuccess(body);
  }

  @Post('fail')
  markFail(
    @Body() body: MarkDeliveryFailInput,
  ): Promise<DeliveryFailResult> {
    return this.deliveryService.markFail(body);
  }
}
