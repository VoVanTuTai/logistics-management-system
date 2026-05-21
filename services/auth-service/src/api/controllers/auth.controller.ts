import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { AuthService } from '../../application/services/auth.service';
import type {
  ChangePasswordInput,
  ChangePasswordResult,
  IntrospectInput,
  IntrospectResult,
  LoginInput,
  LoginResult,
  LogoutInput,
  LogoutResult,
  RefreshSessionInput,
  UpdateOwnProfileInput,
} from '../../domain/entities/auth-session.entity';
import type {
  AuthenticatedUser,
  UserAccountView,
  UserCreateInput,
  UserRoleGroup,
  UserStatus,
  UserUpdateInput,
} from '../../domain/entities/user-account.entity';
import {
  type AuditRequest,
  getAdminAuditContext,
} from './admin-audit-context';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginInput): Promise<LoginResult> {
    return this.authService.login(body);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshSessionInput): Promise<LoginResult> {
    return this.authService.refresh(body);
  }

  @Post('logout')
  logout(@Body() body: LogoutInput): Promise<LogoutResult> {
    return this.authService.logout(body);
  }

  @Post('introspect')
  introspect(@Body() body: IntrospectInput): Promise<IntrospectResult> {
    return this.authService.introspect(body);
  }

  @Patch('me')
  updateOwnProfile(
    @Body() body: UpdateOwnProfileInput,
  ): Promise<AuthenticatedUser> {
    return this.authService.updateOwnProfile(body);
  }

  @Post('change-password')
  changePassword(
    @Body() body: ChangePasswordInput,
  ): Promise<ChangePasswordResult> {
    return this.authService.changePassword(body);
  }

  @Get('users')
  listUsers(
    @Query('roleGroup') roleGroup?: UserRoleGroup,
    @Query('status') status?: UserStatus,
    @Query('hubCode') hubCode?: string,
    @Query('q') q?: string,
  ): Promise<UserAccountView[]> {
    return this.authService.listUsers({
      roleGroup,
      status,
      hubCode,
      q,
    });
  }

  @Post('users')
  createUser(
    @Body() body: UserCreateInput,
    @Req() request: AuditRequest,
  ): Promise<UserAccountView> {
    return this.authService.createUser(body, getAdminAuditContext(request));
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: UserUpdateInput,
    @Req() request: AuditRequest,
  ): Promise<UserAccountView> {
    return this.authService.updateUser(id, body, getAdminAuditContext(request));
  }

  @Delete('users/:id')
  deleteUser(
    @Param('id') id: string,
    @Req() request: AuditRequest,
  ): Promise<{ deleted: boolean; userId: string | null }> {
    return this.authService.deleteUser(id, getAdminAuditContext(request));
  }
}
