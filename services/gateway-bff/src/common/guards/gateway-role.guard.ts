import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';

type GatewayRoleGroup = 'OPS' | 'COURIER' | 'MERCHANT' | 'CUSTOMER';

const OPS_ALLOWED_ROLES = new Set(['SYSTEM_ADMIN', 'OPS_ADMIN', 'OPS_VIEWER']);
const COURIER_ALLOWED_ROLES = new Set([
  'SYSTEM_ADMIN',
  'OPS_ADMIN',
  'OPS_VIEWER',
  'COURIER',
]);
const MERCHANT_ALLOWED_ROLES = new Set(['MERCHANT']);
const CUSTOMER_ALLOWED_ROLES = new Set(['CUSTOMER']);

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

    request.headers['x-user-id'] = introspection.user.id;
    request.headers['x-user-username'] = introspection.user.username;
    request.headers['x-user-roles'] = roles.join(',');
    if (introspection.user.phone) {
      request.headers['x-user-phone'] = introspection.user.phone;
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

  if (firstSegment === 'customer') {
    return 'CUSTOMER';
  }

  return null;
}

function isAuthPassthroughRoute(request: Request): boolean {
  const path = request.originalUrl ? request.originalUrl.split('?')[0] : (request.path ?? '');

  return /^\/(?:ops|merchant|courier|customer)\/auth\/auth\/(?:login|refresh|logout|introspect|register-customer)$/.test(
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
        : roleGroup === 'MERCHANT'
          ? MERCHANT_ALLOWED_ROLES
          : CUSTOMER_ALLOWED_ROLES;

  return roles.some((role) => allowedRoles.has(role));
}
