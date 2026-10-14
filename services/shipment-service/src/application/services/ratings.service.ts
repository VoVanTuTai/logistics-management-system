import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CourierRating } from '@prisma/client';

export interface SubmitRatingInput {
  shipmentCode: string;
  courierId: string;
  courierName?: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  tags?: string[];
  comment?: string;
}

export interface CourierRatingSummary {
  courierId: string;
  courierName: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  topTags: Array<{ tag: string; count: number }>;
}

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitRating(input: SubmitRatingInput): Promise<CourierRating> {
    const clampedRating = Math.max(1, Math.min(5, Math.round(input.rating)));

    // Ensure shipment exists
    await this.prisma.shipment.upsert({
      where: { code: input.shipmentCode },
      update: {},
      create: {
        code: input.shipmentCode,
        currentStatus: 'DELIVERED',
      },
    });

    return this.prisma.courierRating.upsert({
      where: { shipmentCode: input.shipmentCode },
      update: {
        courierId: input.courierId,
        courierName: input.courierName,
        customerPhone: input.customerPhone,
        rating: clampedRating,
        tags: input.tags ?? [],
        comment: input.comment,
        updatedAt: new Date(),
      },
      create: {
        shipmentCode: input.shipmentCode,
        courierId: input.courierId,
        courierName: input.courierName,
        customerPhone: input.customerPhone,
        rating: clampedRating,
        tags: input.tags ?? [],
        comment: input.comment,
      },
    });
  }

  async getByShipment(shipmentCode: string): Promise<CourierRating | null> {
    return this.prisma.courierRating.findUnique({
      where: { shipmentCode },
    });
  }

  async getCourierSummary(courierId: string): Promise<CourierRatingSummary> {
    const reviews = await this.prisma.courierRating.findMany({
      where: { courierId },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        courierId,
        courierName: 'Bưu tá Nexus',
        averageRating: 5.0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topTags: [],
      };
    }

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    const tagCountMap: Record<string, number> = {};
    let courierName = 'Bưu tá Nexus';

    for (const r of reviews) {
      sum += r.rating;
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      if (r.courierName) courierName = r.courierName;

      if (Array.isArray(r.tags)) {
        for (const tag of r.tags as string[]) {
          tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        }
      }
    }

    const topTags = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      courierId,
      courierName,
      averageRating: Number((sum / totalReviews).toFixed(1)),
      totalReviews,
      ratingDistribution: distribution,
      topTags,
    };
  }
}
