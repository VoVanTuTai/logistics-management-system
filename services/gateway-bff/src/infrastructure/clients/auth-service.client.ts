import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { ServiceRegistryClient } from './service-registry.client';

export type AuthenticatedUserView = {
  id: string;
  username: string;
  displayName?: string | null;
  roles: string[];
  hubCodes?: string[];
};

export type IntrospectResponse = {
  active: boolean;
  sessionId: string | null;
  user: AuthenticatedUserView | null;
  accessTokenExpiresAt: string | null;
};

export type MobilePermissionFeature =
  | 'scan.delivery-sign'
  | 'scan.return-sign'
  | 'scan.pickup'
  | 'scan.bag-seal'
  | 'scan.bag-unseal'
  | 'scan.delivery'
  | 'scan.issue'
  | 'scan.outbound'
  | 'scan.inbound'
  | 'scan.vehicle-inbound'
  | 'scan.vehicle-outbound'
  | 'scan.inventory-check'
  | 'scan.branch-pickup'
  | 'scan.high-value-label'
  | 'scan.high-value-check';

export type MobilePermissionMap = Record<MobilePermissionFeature, boolean>;

export type MobilePermissionEffectiveResponse = {
  userId: string;
  actor: 'OPS' | 'COURIER';
  permissions: MobilePermissionMap;
  hasOverride: boolean;
};

@Injectable()
export class AuthServiceClient {
  constructor(private readonly serviceRegistryClient: ServiceRegistryClient) {}

  async introspect(accessToken: string): Promise<IntrospectResponse> {
    return this.request<IntrospectResponse>('/auth/introspect', {
      method: 'POST',
      body: { accessToken },
    });
  }

  async getMobilePermissionEffective(
    userId: string,
    accessToken: string,
  ): Promise<MobilePermissionEffectiveResponse> {
    return this.request<MobilePermissionEffectiveResponse>(
      `/auth/mobile-permissions/users/${encodeURIComponent(userId)}/effective`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      body?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const baseUrl = this.serviceRegistryClient.resolveServiceUrl('auth');
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await response.text();
    const payload = text ? this.parseJson(text) : null;

    if (!response.ok) {
      throw new ServiceUnavailableException(
        this.extractErrorMessage(payload, response.status),
      );
    }

    return payload as T;
  }

  private parseJson(rawText: string): unknown {
    try {
      return JSON.parse(rawText);
    } catch {
      return rawText;
    }
  }

  private extractErrorMessage(payload: unknown, status: number): string {
    if (typeof payload === 'string' && payload.length > 0) {
      return payload;
    }

    if (
      payload !== null &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
    ) {
      return payload.message;
    }

    return `Auth service request failed with status ${status}.`;
  }
}
