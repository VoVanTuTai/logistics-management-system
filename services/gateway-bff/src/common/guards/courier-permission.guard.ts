import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import {
  AuthServiceClient,
  type MobilePermissionFeature,
} from '../../infrastructure/clients/auth-service.client';

type RoutePermissionRule = {
  method: string;
  pattern: RegExp;
  permission: MobilePermissionFeature;
};

const SENSITIVE_COURIER_ROUTES: RoutePermissionRule[] = [
  {
    method: 'POST',
    pattern: /^scan\/scans\/pickup$/,
    permission: 'scan.pickup',
  },
  {
    method: 'POST',
    pattern: /^scan\/scans\/inbound$/,
    permission: 'scan.inbound',
  },
  {
    method: 'POST',
    pattern: /^scan\/scans\/outbound$/,
    permission: 'scan.outbound',
  },
  {
    method: 'POST',
    pattern: /^manifest\/manifests\/[^/]+\/shipments\/add$/,
    permission: 'scan.bag-seal',
  },
  {
    method: 'POST',
    pattern: /^manifest\/manifests\/[^/]+\/seal$/,
    permission: 'scan.bag-seal',
  },
  {
    method: 'POST',
    pattern: /^manifest\/manifests\/[^/]+\/shipments\/remove$/,
    permission: 'scan.bag-unseal',
  },
  {
    method: 'POST',
    pattern: /^manifest\/manifests\/[^/]+\/receive$/,
    permission: 'scan.bag-unseal',
  },
  {
    method: 'POST',
    pattern: /^delivery\/deliveries\/success$/,
    permission: 'scan.delivery-sign',
  },
  {
    method: 'POST',
    pattern: /^delivery\/deliveries\/fail$/,
    permission: 'scan.issue',
  },
  {
    method: 'POST',
    pattern: /^payment\/cod\/collect$/,
    permission: 'scan.delivery-sign',
  },
];

@Injectable()
export class CourierPermissionGuard implements CanActivate {
  constructor(private readonly authServiceClient: AuthServiceClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const requiredPermission = this.resolveRequiredPermission(request);

    if (!requiredPermission) {
      return true;
    }

    const accessToken = this.extractBearerToken(request);
    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer access token.');
    }

    try {
      const introspection = await this.authServiceClient.introspect(accessToken);
      const userId = introspection.user?.id;

      if (!introspection.active || !userId) {
        throw new UnauthorizedException('Invalid or expired access token.');
      }

      const effectivePermissions =
        await this.authServiceClient.getMobilePermissionEffective(
          userId,
          accessToken,
        );

      if (effectivePermissions.permissions[requiredPermission] !== true) {
        throw new ForbiddenException(
          'Tài khoản chưa được phân quyền thực hiện thao tác này.',
        );
      }

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new ForbiddenException(
        'Không xác thực được quyền courier-mobile. Thao tác nhạy cảm đã bị chặn.',
      );
    }
  }

  private resolveRequiredPermission(
    request: Request,
  ): MobilePermissionFeature | null {
    const method = request.method.toUpperCase();
    const path = this.normalizeCourierWildcardPath(request.params['0']);
    const matchedRule = SENSITIVE_COURIER_ROUTES.find(
      (rule) => rule.method === method && rule.pattern.test(path),
    );

    return matchedRule?.permission ?? null;
  }

  private normalizeCourierWildcardPath(value: unknown): string {
    return typeof value === 'string'
      ? value.trim().replace(/^\/+|\/+$/g, '')
      : '';
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
