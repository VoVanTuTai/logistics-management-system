import { Injectable } from '@nestjs/common';

import type {
  ProjectionResult,
  ReportingEventEnvelope,
} from './reporting-event.types';
import { ReportingProjectionStore } from '../../infrastructure/prisma/reporting-projection.store';

@Injectable()
export class ReportingProjectionService {
  constructor(
    private readonly reportingProjectionStore: ReportingProjectionStore,
  ) {}

  project(event: ReportingEventEnvelope): Promise<ProjectionResult> {
    return this.reportingProjectionStore.project(event);
  }
}
