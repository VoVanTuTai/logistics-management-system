import { Injectable } from '@nestjs/common';

import type { ManifestStatus } from '../entities/manifest.entity';

@Injectable()
export class ManifestStateMachine {
  canEdit(status: ManifestStatus): boolean {
    return status === 'CREATED';
  }

  canSeal(status: ManifestStatus): boolean {
    return status === 'CREATED';
  }

  canReceive(status: ManifestStatus): boolean {
    return status === 'SEALED';
  }
}
