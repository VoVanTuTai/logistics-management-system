import { Injectable } from '@nestjs/common';

import type { ManifestStatus } from '../entities/manifest.entity';

@Injectable()
export class ManifestStateMachine {
  canEdit(status: ManifestStatus): boolean {
    return status === 'CREATED';
  }

  canRemoveShipments(status: ManifestStatus): boolean {
    return ['CREATED', 'SEALED', 'RECEIVED'].includes(status);
  }

  canSeal(status: ManifestStatus): boolean {
    return status === 'CREATED';
  }

  canReceive(status: ManifestStatus): boolean {
    return ['CREATED', 'SEALED'].includes(status);
  }
}
