import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(private readonly authServiceClient: AuthServiceClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.GATEWAY_AUTH_ENABLED !== 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = this.extractBearerToken(request);

    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer access token.');
    }

    const introspection = await this.authServiceClient.introspect(accessToken);

    if (!introspection.active || !introspection.user) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    request.headers['x-auth-user-id'] = introspection.user.id;
    request.headers['x-auth-username'] = introspection.user.username;
    request.headers['x-auth-roles'] = introspection.user.roles.join(',');
    request.headers['x-auth-hub-codes'] = (introspection.user.hubCodes ?? []).join(',');

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const headerValue = request.headers.authorization;

    if (!headerValue) {
      return null;
    }

    const [scheme, token] = headerValue.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token.trim() || null;
  }
}
