import { Body, Controller, Post } from '@nestjs/common';

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
}
