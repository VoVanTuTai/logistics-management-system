import { Injectable, Logger } from '@nestjs/common';
import type { IncomingMessage, Server } from 'http';
import * as http from 'http';
import * as https from 'https';
import type { Socket } from 'net';

import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';

@Injectable()
export class TasksRealtimeProxyGateway {
  private readonly logger = new Logger(TasksRealtimeProxyGateway.name);
  private isRegistered = false;

  constructor(private readonly serviceRegistryClient: ServiceRegistryClient) {}

  registerHttpServer(server: Server): void {
    if (this.isRegistered) {
      return;
    }

    this.isRegistered = true;
    server.on('upgrade', (request, socket, head) => {
      void this.handleUpgrade(request, socket as Socket, head);
    });
    this.logger.log('Tasks realtime WebSocket proxy is listening on /ws/tasks');
  }

  private async handleUpgrade(
    request: IncomingMessage,
    socket: Socket,
    head: Buffer,
  ): Promise<void> {
    const requestUrl = new URL(request.url ?? '/', 'http://gateway-bff.local');
    if (requestUrl.pathname !== '/ws/tasks') {
      return;
    }

    let targetUrl: URL;
    try {
      targetUrl = this.buildTargetUrl(requestUrl);
    } catch (error) {
      this.reject(socket, 503, toErrorMessage(error));
      return;
    }

    const proxyRequest = this.createProxyRequest(request, targetUrl);

    proxyRequest.on('upgrade', (response, upstreamSocket, upstreamHead) => {
      socket.write(buildUpgradeResponse(response));
      if (upstreamHead.length > 0) {
        socket.write(upstreamHead);
      }
      if (head.length > 0) {
        upstreamSocket.write(head);
      }

      upstreamSocket.pipe(socket);
      socket.pipe(upstreamSocket);
    });

    proxyRequest.on('response', (response) => {
      this.reject(
        socket,
        response.statusCode ?? 502,
        `Dispatch realtime upstream did not upgrade: ${response.statusCode ?? 502}`,
      );
      response.resume();
    });

    proxyRequest.on('error', (error) => {
      this.logger.warn(`Dispatch realtime proxy failed: ${toErrorMessage(error)}`);
      this.reject(socket, 502, 'Dispatch realtime upstream unavailable.');
    });

    proxyRequest.end();
  }

  private buildTargetUrl(requestUrl: URL): URL {
    const dispatchBaseUrl = this.serviceRegistryClient.resolveServiceUrl('dispatch');
    const targetUrl = new URL('/ws/tasks', ensureTrailingSlash(dispatchBaseUrl));
    targetUrl.search = requestUrl.search;
    return targetUrl;
  }

  private createProxyRequest(request: IncomingMessage, targetUrl: URL): http.ClientRequest {
    const headers = {
      ...request.headers,
      host: targetUrl.host,
      connection: 'Upgrade',
      upgrade: 'websocket',
    };
    const requestOptions: http.RequestOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: 'GET',
      headers,
    };

    return targetUrl.protocol === 'https:'
      ? https.request(requestOptions)
      : http.request(requestOptions);
  }

  private reject(socket: Socket, statusCode: number, message: string): void {
    if (socket.destroyed) {
      return;
    }

    socket.write(
      [
        `HTTP/1.1 ${statusCode} ${statusText(statusCode)}`,
        'Connection: close',
        'Content-Type: text/plain; charset=utf-8',
        `Content-Length: ${Buffer.byteLength(message)}`,
        '',
        message,
      ].join('\r\n'),
    );
    socket.destroy();
  }
}

function buildUpgradeResponse(response: IncomingMessage): string {
  const statusCode = response.statusCode ?? 101;
  const statusMessage = response.statusMessage || statusText(statusCode);
  const lines = [`HTTP/1.1 ${statusCode} ${statusMessage}`];

  for (let index = 0; index < response.rawHeaders.length; index += 2) {
    lines.push(`${response.rawHeaders[index]}: ${response.rawHeaders[index + 1]}`);
  }

  lines.push('', '');
  return lines.join('\r\n');
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function statusText(statusCode: number): string {
  if (statusCode === 101) return 'Switching Protocols';
  if (statusCode === 502) return 'Bad Gateway';
  if (statusCode === 503) return 'Service Unavailable';
  return 'WebSocket Error';
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
