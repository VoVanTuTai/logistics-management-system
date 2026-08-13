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
  const path = request.originalUrl ? request.originalUrl.split('?')[0] : (request.path ?? '');

  return /^\/(?:ops|merchant|courier|customer)\/auth\/auth\/(?:login|refresh|logout|introspect|register-customer)$/.test(
    path,
  );
}
