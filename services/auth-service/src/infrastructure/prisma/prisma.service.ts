import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const maxAttempts = Number(process.env.PRISMA_CONNECT_MAX_ATTEMPTS ?? 30);
    const retryDelayMs = Number(process.env.PRISMA_CONNECT_RETRY_DELAY_MS ?? 2000);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();

        if (attempt > 1) {
          this.logger.log(
            `Prisma connected after ${attempt} attempts.`,
          );
        }

        return;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown Prisma connection error.';

        if (attempt === maxAttempts) {
          this.logger.error(
            `Prisma connection failed after ${maxAttempts} attempts. Last error: ${message}`,
          );
          throw error;
        }

        this.logger.warn(
          `Prisma connect attempt ${attempt}/${maxAttempts} failed: ${message}. Retrying in ${retryDelayMs}ms.`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
