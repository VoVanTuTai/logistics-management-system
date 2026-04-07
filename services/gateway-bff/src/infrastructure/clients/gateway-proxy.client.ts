import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import type { Request, Response as ExpressResponse } from 'express';

import { ApiGroup, ServiceRegistryClient } from './service-registry.client';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'expect',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

@Injectable()
export class GatewayProxyClient {
  private readonly logger = new Logger(GatewayProxyClient.name);

  constructor(private readonly serviceRegistryClient: ServiceRegistryClient) {}

  rejectMissingService(group: ApiGroup, response: ExpressResponse): void {
    response.status(400).json({
      message: `Target service is required for /${group} routes.`,
    });
  }

  async forward(
    group: ApiGroup,
    wildcardPath: string,
    request: Request,
    response: ExpressResponse,
  ): Promise<void> {
    const [serviceName, ...targetPathSegments] = wildcardPath
      .split('/')
      .filter(Boolean);

    if (!serviceName) {
      this.rejectMissingService(group, response);
      return;
    }

    const targetBaseUrl = this.serviceRegistryClient.resolveServiceUrl(serviceName);
    const targetUrl = this.buildTargetUrl(targetBaseUrl, targetPathSegments, request);

    try {
      const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers: this.buildHeaders(request),
        body: this.buildRequestBody(request),
        redirect: 'manual',
      });

      response.status(upstreamResponse.status);

      upstreamResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'transfer-encoding') {
          return;
        }

        response.setHeader(key, value);
      });

      const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
      response.send(responseBody);
    } catch (error) {
      const upstreamMessage =
        error instanceof Error ? error.message : 'Unable to reach upstream service.';

      this.logger.error(
        `Proxy request failed for service "${serviceName}" -> ${targetUrl}: ${upstreamMessage}`,
      );

      throw new BadGatewayException(
        `Upstream "${serviceName}" unavailable at ${targetUrl}. ${upstreamMessage}`,
      );
    }
  }

  private buildTargetUrl(
    targetBaseUrl: string,
    targetPathSegments: string[],
    request: Request,
  ): string {
    const normalizedBaseUrl = targetBaseUrl.endsWith('/')
      ? targetBaseUrl
      : `${targetBaseUrl}/`;
    const targetPath = targetPathSegments.join('/');
    const url = new URL(targetPath, normalizedBaseUrl);
    const rawQuery = request.originalUrl.split('?')[1];

    if (rawQuery) {
      url.search = `?${rawQuery}`;
    }

    return url.toString();
  }

  private buildHeaders(request: Request): Headers {
    const headers = new Headers();

    for (const [key, value] of Object.entries(request.headers)) {
      const normalizedKey = key.toLowerCase();

      if (
        value === undefined ||
        HOP_BY_HOP_HEADERS.has(normalizedKey)
      ) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, item);
        }

        continue;
      }

      headers.set(key, value);
    }

    headers.set('x-forwarded-for', request.ip ?? '');
    headers.set('x-forwarded-host', request.hostname ?? '');
    headers.set('x-forwarded-proto', request.protocol ?? '');
    headers.set('x-gateway-group', request.baseUrl.replace(/^\//, ''));

    return headers;
  }

  private buildRequestBody(request: Request): BodyInit | undefined {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return undefined;
    }

    if (request.body === undefined || request.body === null) {
      return undefined;
    }

    if (typeof request.body === 'string') {
      return request.body;
    }

    if (Buffer.isBuffer(request.body)) {
      return new Uint8Array(request.body);
    }

    return JSON.stringify(request.body);
  }
}
