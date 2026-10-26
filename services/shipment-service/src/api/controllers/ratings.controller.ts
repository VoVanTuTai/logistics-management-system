import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  type CourierRatingSummary,
  RatingsService,
  type SubmitRatingInput,
} from '../../application/services/ratings.service';
import type { CourierRating } from '@prisma/client';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  submitRating(@Body() body: SubmitRatingInput): Promise<CourierRating> {
    return this.ratingsService.submitRating(body);
  }

  @Get('shipment/:code')
  getByShipment(@Param('code') code: string): Promise<CourierRating | null> {
    return this.ratingsService.getByShipment(code);
  }

  @Get('courier/:courierId')
  getCourierSummary(
    @Param('courierId') courierId: string,
  ): Promise<CourierRatingSummary> {
    return this.ratingsService.getCourierSummary(courierId);
  }
}
