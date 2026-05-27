import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import {
  AuthServiceClient,
  type AuthenticatedUserView,
} from '../../infrastructure/clients/auth-service.client';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';

type OpsSensitiveAction =
  | 'task-assignment'
  | 'shipment-scan'
  | 'manifest-seal'
  | 'manifest-receive'
  | 'ndr-return-decision';

type OpsRouteRule = {
  method: string;
  pattern: RegExp;
  action: OpsSensitiveAction;
};

type ScopeDecision = {
  hubCodes: string[];
  missingContextMessage?: string;
};

const OPS_SENSITIVE_ROUTES: OpsRouteRule[] = [
  {
    method: 'POST',
    pattern: /^dispatch\/tasks\/[^/]+\/assign$/,
    action: 'task-assignment',
  },
  {
    method: 'POST',
    pattern: /^dispatch\/tasks\/[^/]+\/reassign$/,
    action: 'task-assignment',
  },
  {
    method: 'POST',
    pattern: /^scan\/scans\/(?:pickup|inbound|outbound)$/,
    action: 'shipment-scan',
  },
  {
    method: 'POST',
    pattern: /^manifest\/manifests\/[^/]+\/seal$/,
    action: 'manifest-seal',
  },
  {
    method: 'POST',
    pattern: /^manifest\/manifests\/[^/]+\/receive$/,
    action: 'manifest-receive',
  },
  {
    method: 'POST',
    pattern: /^delivery\/ndr\/[^/]+\/return-decision$/,
    action: 'ndr-return-decision',
  },
];

@Injectable()
export class OpsHubScopeGuard implements CanActivate {
  constructor(
    private readonly authServiceClient: AuthServiceClient,
    private readonly serviceRegistryClient: ServiceRegistryClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rule = this.resolveRule(request);
    const accessToken = this.extractBearerToken(request);
    if (!accessToken) {
      if (!rule) {
        return true;
      }

      throw new UnauthorizedException('Missing bearer access token.');
    }

    let introspection;
    try {
      introspection = await this.authServiceClient.introspect(accessToken);
    } catch (error) {
      if (!rule) {
        return true;
      }

      throw error;
    }
    const user = introspection.user;

    if (!introspection.active || !user) {
      if (!rule) {
        return true;
      }

      throw new UnauthorizedException('Invalid or expired access token.');
    }

    const roles = normalizeStringList(user.roles);
    const assignedHubCodes = normalizeStringList(user.hubCodes ?? []);
    this.attachOpsContextHeaders(request, user, roles, assignedHubCodes);

    if (!rule) {
      return true;
    }

    if (rule.action === 'task-assignment') {
      await this.ensureTaskAssignmentAllowed(request);
    }

    if (roles.includes('SYSTEM_ADMIN')) {
      return true;
    }

    if (assignedHubCodes.length === 0) {
      throw new ForbiddenException(
        'Tài khoản OPS chưa được gán hub nên không được thực hiện thao tác nhạy cảm.',
      );
    }

    const targetScope = await this.resolveTargetScope(rule.action, request);
    if (targetScope.missingContextMessage) {
      throw new BadRequestException(targetScope.missingContextMessage);
    }

    if (targetScope.hubCodes.length === 0) {
      throw new ForbiddenException(
        'Không xác định được hub của dữ liệu nghiệp vụ. Thao tác đã bị chặn.',
      );
    }

    const hasAllowedHub = targetScope.hubCodes.some((hubCode) =>
      assignedHubCodes.some((assignedHubCode) =>
        isSameHubOrScopedLocation(hubCode, assignedHubCode),
      ),
    );

    if (!hasAllowedHub) {
      throw new ForbiddenException(
        'Tài khoản OPS không có quyền thao tác dữ liệu ngoài phạm vi hub được gán.',
      );
    }

    return true;
  }

  private resolveRule(request: Request): OpsRouteRule | null {
    const method = request.method.toUpperCase();
    const path = normalizeWildcardPath(request.params['0']);

    return (
      OPS_SENSITIVE_ROUTES.find(
        (rule) => rule.method === method && rule.pattern.test(path),
      ) ?? null
    );
  }

  private async resolveTargetScope(
    action: OpsSensitiveAction,
    request: Request,
  ): Promise<ScopeDecision> {
    if (action === 'shipment-scan') {
      return this.resolveScanScope(request);
    }

    if (action === 'task-assignment') {
      return this.resolveTaskAssignmentScope(request);
    }

    if (action === 'manifest-seal' || action === 'manifest-receive') {
      return this.resolveManifestScope(request, action);
    }

    return this.resolveNdrScope(request);
  }

  private resolveScanScope(request: Request): ScopeDecision {
    const body = asRecord(request.body);
    const locationCode = normalizeString(body?.locationCode);

    if (!locationCode) {
      return {
        hubCodes: [],
        missingContextMessage:
          'Thiếu locationCode để xác định phạm vi hub cho thao tác quét.',
      };
    }

    return {
      hubCodes: [locationCode],
    };
  }

  private async resolveTaskAssignmentScope(
    request: Request,
  ): Promise<ScopeDecision> {
    const taskId = extractPathParam(
      normalizeWildcardPath(request.params['0']),
      /^dispatch\/tasks\/([^/]+)\/(?:assign|reassign)$/,
    );

    if (!taskId) {
      return {
        hubCodes: [],
        missingContextMessage:
          'Thiếu taskId để xác định phạm vi hub cho thao tác phân công.',
      };
    }

    const task = await this.fetchServiceJson('dispatch', `tasks/${taskId}`, request);
    const taskRecord = asRecord(task);
    const shipmentCode = normalizeString(taskRecord?.shipmentCode);
    const relatedShipment = shipmentCode
      ? await this.fetchServiceJson(
          'shipment',
          `shipments/${encodeURIComponent(shipmentCode)}`,
          request,
        )
      : null;

    const taskScope = collectHubCodes(task);
    if (taskScope.length > 0) {
      return { hubCodes: taskScope };
    }

    if (relatedShipment) {
      return {
        hubCodes: collectHubCodes(relatedShipment),
      };
    }

    return {
      hubCodes: [],
      missingContextMessage:
        'Task không có shipmentCode hoặc hub context nên không thể phân quyền phân công.',
    };
  }

  private async ensureTaskAssignmentAllowed(request: Request): Promise<void> {
    const taskId = extractPathParam(
      normalizeWildcardPath(request.params['0']),
      /^dispatch\/tasks\/([^/]+)\/(?:assign|reassign)$/,
    );
    if (!taskId) {
      return;
    }

    const task = await this.fetchServiceJson('dispatch', `tasks/${taskId}`, request);
    const taskRecord = asRecord(task);
    if (normalizeString(taskRecord?.taskType) !== 'DELIVERY') {
      return;
    }

    const shipmentCode = normalizeString(taskRecord?.shipmentCode);
    if (!shipmentCode) {
      return;
    }

    const shipment = await this.fetchServiceJson(
      'shipment',
      `shipments/${encodeURIComponent(shipmentCode)}`,
      request,
    );
    const blockReason = getShipmentOperationBlockReason(shipment, shipmentCode);
    if (blockReason) {
      throw new ForbiddenException(blockReason);
    }
  }

  private async resolveManifestScope(
    request: Request,
    action: Extract<OpsSensitiveAction, 'manifest-seal' | 'manifest-receive'>,
  ): Promise<ScopeDecision> {
    const manifestId = extractPathParam(
      normalizeWildcardPath(request.params['0']),
      /^manifest\/manifests\/([^/]+)\/(?:seal|receive)$/,
    );

    if (!manifestId) {
      return {
        hubCodes: [],
        missingContextMessage:
          'Thiếu manifestId để xác định phạm vi hub cho thao tác bao hàng.',
      };
    }

    const manifest = await this.fetchServiceJson(
      'manifest',
      `manifests/${manifestId}`,
      request,
    );
    const record = asRecord(manifest);
    const body = asRecord(request.body);
    const explicitProcessingHubCode = normalizeString(body?.processingHubCode);

    if (explicitProcessingHubCode) {
      return { hubCodes: [explicitProcessingHubCode] };
    }

    const hubCode =
      action === 'manifest-seal'
        ? normalizeString(record?.originHubCode)
        : normalizeString(record?.destinationHubCode);

    if (!hubCode) {
      return {
        hubCodes: [],
        missingContextMessage:
          action === 'manifest-seal'
            ? 'Manifest thiếu originHubCode nên không thể xác định quyền seal.'
            : 'Manifest thiếu destinationHubCode nên không thể xác định quyền receive.',
      };
    }

    return { hubCodes: [hubCode] };
  }

  private async resolveNdrScope(request: Request): Promise<ScopeDecision> {
    const ndrId = extractPathParam(
      normalizeWildcardPath(request.params['0']),
      /^delivery\/ndr\/([^/]+)\/return-decision$/,
    );

    if (!ndrId) {
      return {
        hubCodes: [],
        missingContextMessage:
          'Thiếu ndrId để xác định phạm vi hub cho quyết định NDR.',
      };
    }

    const ndrCase = await this.fetchServiceJson('delivery', `ndr/${ndrId}`, request);
    const ndrRecord = asRecord(ndrCase);
    const reportedHubCode = normalizeString(ndrRecord?.reportedHubCode);
    if (reportedHubCode) {
      return { hubCodes: [reportedHubCode] };
    }

    const shipmentCode = normalizeString(ndrRecord?.shipmentCode);
    if (shipmentCode) {
      return {
        hubCodes: await this.resolveShipmentHubCodes(shipmentCode, request),
      };
    }

    return {
      hubCodes: [],
      missingContextMessage:
        'NDR case không có reportedHubCode hoặc shipmentCode nên không thể phân quyền.',
    };
  }

  private async resolveShipmentHubCodes(
    shipmentCode: string,
    request: Request,
  ): Promise<string[]> {
    const shipment = await this.fetchServiceJson(
      'shipment',
      `shipments/${encodeURIComponent(shipmentCode)}`,
      request,
    );

    return collectHubCodes(shipment);
  }

  private async fetchServiceJson(
    serviceName: string,
    path: string,
    request: Request,
  ): Promise<unknown> {
    const baseUrl = this.serviceRegistryClient.resolveServiceUrl(serviceName);
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    const response = await fetch(url, {
      method: 'GET',
      headers: buildForwardHeaders(request),
      redirect: 'manual',
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ForbiddenException(
        `Không xác minh được phạm vi hub từ ${serviceName} service. Thao tác đã bị chặn.`,
      );
    }

    return payload;
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

  private attachOpsContextHeaders(
    request: Request,
    user: AuthenticatedUserView,
    roles: string[],
    hubCodes: string[],
  ): void {
    request.headers['x-ops-user-id'] = user.id;
    request.headers['x-ops-username'] = user.username;
    request.headers['x-ops-roles'] = roles.join(',');
    request.headers['x-ops-hub-codes'] = hubCodes.join(',');
  }
}

function buildForwardHeaders(request: Request): Headers {
  const headers = new Headers();

  if (request.headers.authorization) {
    headers.set('authorization', request.headers.authorization);
  }

  if (request.headers['x-request-id']) {
    headers.set('x-request-id', String(request.headers['x-request-id']));
  }

  headers.set('accept', 'application/json');
  headers.set('x-forwarded-for', request.ip ?? '');
  headers.set('x-forwarded-host', request.hostname ?? '');
  headers.set('x-forwarded-proto', request.protocol ?? '');
  headers.set('x-gateway-group', 'ops');

  return headers;
}

function normalizeWildcardPath(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/^\/+|\/+$/g, '')
    : '';
}

function extractPathParam(path: string, pattern: RegExp): string | null {
  const match = pattern.exec(path);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().toUpperCase()
    : null;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => normalizeString(item))
        .filter((item): item is string => item !== null),
    ),
  );
}

function collectHubCodes(value: unknown): string[] {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const directCodes = [
    record.hubCode,
    record.currentHubCode,
    record.currentLocation,
    record.locationCode,
    record.originHubCode,
    record.destinationHubCode,
    record.senderHubCode,
    record.receiverHubCode,
    record.reportedHubCode,
  ];
  const metadataCodes = collectMetadataHubCodes(asRecord(record.metadata));

  return normalizeStringList([...directCodes, ...metadataCodes]);
}

function collectMetadataHubCodes(metadata: Record<string, unknown> | null): unknown[] {
  if (!metadata) {
    return [];
  }

  const sender = asRecord(metadata.sender);
  const receiver = asRecord(metadata.receiver);
  const routing = asRecord(metadata.routing);
  const location = asRecord(metadata.location);
  const hub = asRecord(metadata.hub);

  return [
    metadata.senderHubCode,
    metadata.receiverHubCode,
    metadata.originHubCode,
    metadata.destinationHubCode,
    metadata.currentHubCode,
    metadata.currentLocation,
    sender?.hubCode,
    receiver?.hubCode,
    routing?.originHubCode,
    routing?.destinationHubCode,
    location?.hubCode,
    location?.current,
    hub?.code,
    hub?.currentCode,
  ];
}

function getShipmentOperationBlockReason(
  value: unknown,
  shipmentCode: string,
): string | null {
  const shipment = asRecord(value);
  if (!shipment) {
    return null;
  }

  const metadata = asRecord(shipment.metadata);
  const deliveryInfoChange = asRecord(metadata?.deliveryInfoChange);
  const returnWorkflow = asRecord(metadata?.returnWorkflow);

  const requiresLabelReprint =
    deliveryInfoChange?.requiresLabelReprint === true ||
    deliveryInfoChange?.blocksOpsUntilLabelReprint === true;

  if (requiresLabelReprint) {
    return `Vận đơn ${shipmentCode} đã đổi thông tin giao hàng và cần OPS in lại tem mới trước khi phân công phát.`;
  }

  if (returnWorkflow?.blocksOps === true || shipment.currentStatus === 'RETURN_STARTED') {
    return `Vận đơn ${shipmentCode} đang chuyển hoàn. Chỉ được xử lý theo luồng đăng ký/in tem chuyển hoàn.`;
  }

  if (shipment.isLocked === true) {
    return `Vận đơn ${shipmentCode} đang bị khóa bởi luồng xử lý ngoại lệ.`;
  }

  return null;
}

function isSameHubOrScopedLocation(targetCode: string, assignedHubCode: string): boolean {
  return (
    targetCode === assignedHubCode ||
    targetCode.startsWith(`${assignedHubCode}-`) ||
    targetCode.startsWith(`${assignedHubCode}_`) ||
    targetCode.startsWith(`${assignedHubCode}.`)
  );
}
