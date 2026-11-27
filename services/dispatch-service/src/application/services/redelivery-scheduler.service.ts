import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

const DEFAULT_REDELIVERY_POLL_INTERVAL_MS = 30_000;

@Injectable()
export class RedeliverySchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedeliverySchedulerService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly tasksService: TasksService) {}

  onModuleInit(): void {
    if (!isRedeliveryAutoDispatchEnabled()) {
      this.logger.log('Scheduled redelivery auto-dispatch is disabled.');
      return;
    }

    void this.runTick();
    this.pollTimer = setInterval(
      () => void this.runTick(),
      getRedeliveryPollIntervalMs(),
    );
  }

  onModuleDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async runTick(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      const dispatchedCount =
        await this.tasksService.processDueRescheduledRedeliveries();
      if (dispatchedCount > 0) {
        this.logger.log(
          `Auto-dispatched ${dispatchedCount} scheduled redelivery task(s) from prior inventory check.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Scheduled redelivery poll failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}

function getRedeliveryPollIntervalMs(): number {
  const parsed = Number(process.env.REDELIVERY_POLL_INTERVAL_MS);
  return Number.isFinite(parsed) && parsed >= 5_000
    ? parsed
    : DEFAULT_REDELIVERY_POLL_INTERVAL_MS;
}

function isRedeliveryAutoDispatchEnabled(): boolean {
  return process.env.REDELIVERY_AUTO_DISPATCH_ENABLED?.trim().toLowerCase() !== 'false';
}
