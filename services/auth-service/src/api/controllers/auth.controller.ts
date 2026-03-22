import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { AuthService } from '../../application/services/auth.service';
import type {
  IntrospectInput,
  IntrospectResult,
  LoginInput,
  LoginResult,
  LogoutInput,
  LogoutResult,
  RefreshSessionInput,
} from '../../domain/entities/auth-session.entity';
import type {
  UserAccountView,
  UserCreateInput,
  UserRoleGroup,
  UserStatus,
  UserUpdateInput,
} from '../../domain/entities/user-account.entity';

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
  createUser(@Body() body: UserCreateInput): Promise<UserAccountView> {
    return this.authService.createUser(body);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: UserUpdateInput,
  ): Promise<UserAccountView> {
    return this.authService.updateUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string): Promise<{ deleted: boolean; userId: string | null }> {
    return this.authService.deleteUser(id);
  }
}
