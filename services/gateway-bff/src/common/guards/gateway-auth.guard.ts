import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.GATEWAY_AUTH_ENABLED !== 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (isAuthPassthroughRoute(request)) {
      return true;
    }

    if (!request.headers.authorization) {
      throw new UnauthorizedException('Missing Authorization header.');
    }

    return true;
  }
}

function isAuthPassthroughRoute(request: Request): boolean {
  const path = request.path ?? request.originalUrl.split('?')[0] ?? '';

  return /^\/(?:ops|merchant|courier)\/auth\/auth\/(?:login|refresh|logout|introspect)$/.test(
    path,
  );
}
