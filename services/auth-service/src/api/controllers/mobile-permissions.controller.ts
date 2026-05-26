import { Body, Controller, Get, Param, Put } from '@nestjs/common';

import { MobilePermissionsService } from '../../application/services/mobile-permissions.service';
import type {
  MobilePermissionEffectiveView,
  MobilePermissionMap,
  MobilePermissionMatrix,
  MobilePermissionMatrixUpdateInput,
  MobilePermissionUserOverrideInput,
  MobilePermissionUserOverrideView,
} from '../../domain/entities/mobile-permission.entity';

@Controller('auth/mobile-permissions')
export class MobilePermissionsController {
  constructor(
    private readonly mobilePermissionsService: MobilePermissionsService,
  ) {}

  @Get('matrix')
  getMatrix(): Promise<MobilePermissionMatrix> {
    return this.mobilePermissionsService.getMatrix();
  }

  @Put('matrix')
  updateMatrix(
    @Body() body: MobilePermissionMatrixUpdateInput,
  ): Promise<MobilePermissionMatrix> {
    return this.mobilePermissionsService.updateMatrix(body);
  }

  @Get('users/:userId/effective')
  getEffectiveForUser(
    @Param('userId') userId: string,
  ): Promise<MobilePermissionEffectiveView> {
    return this.mobilePermissionsService.getEffectiveForUser(userId);
  }

  @Put('users/:userId')
  updateUserOverride(
    @Param('userId') userId: string,
    @Body()
    body: MobilePermissionUserOverrideInput | Partial<MobilePermissionMap>,
  ): Promise<MobilePermissionUserOverrideView> {
    return this.mobilePermissionsService.updateUserOverride(userId, body);
  }
}
