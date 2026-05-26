import { Body, Controller, Get, Post } from '@nestjs/common';

import { PricingService } from '../../application/services/pricing.service';
import type {
  PricingQuote,
  PricingQuoteInput,
} from '../../domain/entities/pricing-quote.entity';

@Controller()
export class QuotesController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('rates')
  getRates(): {
    owner: string;
    quoteVersion: string;
    basis: string[];
  } {
    return {
      owner: 'pricing-service',
      quoteVersion: 'NEXUS_RATES_2026_05',
      basis: [
        'serviceType',
        'actualWeightKg',
        'volumetricWeightKg = lengthCm * widthCm * heightCm / 6000',
        'chargeableWeightKg = max(actualWeightKg, volumetricWeightKg)',
        'origin/destination zone',
        'declaredValue insurance fee',
        'COD handling fee',
      ],
    };
  }

  @Post('quotes')
  createQuote(@Body() body: PricingQuoteInput): PricingQuote {
    return this.pricingService.quote(body);
  }
}
