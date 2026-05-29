import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';

type GatewayRoleGroup = 'OPS' | 'COURIER' | 'MERCHANT';

const OPS_ALLOWED_ROLES = new Set(['SYSTEM_ADMIN', 'OPS_ADMIN', 'OPS_VIEWER']);
const COURIER_ALLOWED_ROLES = new Set(['COURIER']);
const MERCHANT_ALLOWED_ROLES = new Set(['MERCHANT']);

@Injectable()
export class GatewayRoleGuard implements CanActivate {
  constructor(private readonly authServiceClient: AuthServiceClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.GATEWAY_AUTH_ENABLED !== 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const roleGroup = resolveGatewayRoleGroup(request);

    if (!roleGroup || isAuthPassthroughRoute(request)) {
      return true;
    }

    const accessToken = extractBearerToken(request);
    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer access token.');
    }

    const introspection = await this.authServiceClient.introspect(accessToken);
    if (!introspection.active || !introspection.user) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const roles = normalizeStringList(introspection.user.roles);
    if (!hasGatewayRoleGroup(roles, roleGroup)) {
      throw new ForbiddenException(
        `Tài khoản không thuộc nhóm quyền ${roleGroup}. Vui lòng đăng nhập đúng cổng hệ thống.`,
      );
    }

    return true;
  }
}

function resolveGatewayRoleGroup(request: Request): GatewayRoleGroup | null {
  const path = request.baseUrl || request.path || request.originalUrl.split('?')[0] || '';
  const firstSegment = path.split('/').filter(Boolean)[0]?.toLowerCase();

  if (firstSegment === 'ops') {
    return 'OPS';
  }

  if (firstSegment === 'courier') {
    return 'COURIER';
  }

  if (firstSegment === 'merchant') {
    return 'MERCHANT';
  }

  return null;
}

function isAuthPassthroughRoute(request: Request): boolean {
  const path = request.path ?? request.originalUrl.split('?')[0] ?? '';

  return /^\/(?:ops|merchant|courier)\/auth\/auth\/(?:login|refresh|logout|introspect)$/.test(
    path,
  );
}

function extractBearerToken(request: Request): string | null {
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

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim().toUpperCase() : ''))
        .filter((item) => item.length > 0),
    ),
  );
}

function hasGatewayRoleGroup(
  roles: string[],
  roleGroup: GatewayRoleGroup,
): boolean {
  const allowedRoles =
    roleGroup === 'OPS'
      ? OPS_ALLOWED_ROLES
      : roleGroup === 'COURIER'
        ? COURIER_ALLOWED_ROLES
        : MERCHANT_ALLOWED_ROLES;

  return roles.some((role) => allowedRoles.has(role));
}
