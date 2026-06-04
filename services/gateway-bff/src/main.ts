import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import type { Request, Response } from 'express';

import { AppModule } from './app.module';
import { ChatRealtimeGateway } from './api/chat/chat-realtime.gateway';
import { TasksRealtimeProxyGateway } from './api/tasks-realtime/tasks-realtime-proxy.gateway';
import {
  captureRawBody,
  createPayloadErrorHandler,
  createRateLimitMiddleware,
  gatewayBodyLimit,
  GatewayHttpMetrics,
} from './common/http/gateway-http-controls';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const port = Number(process.env.PORT ?? 3000);
  const defaultCorsOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
  ];
  const envCorsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const corsOrigins = Array.from(new Set([...defaultCorsOrigins, ...envCorsOrigins]));

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Nexus-Partner-Code',
      'X-Nexus-Api-Key',
      'X-Nexus-Timestamp',
      'X-Nexus-Nonce',
      'X-Nexus-Signature',
    ],
  });

  const metrics = new GatewayHttpMetrics();
  const bodyLimit = gatewayBodyLimit();
  const expressApp = app.getHttpAdapter().getInstance();

  app.use(metrics.middleware());
  app.use(createRateLimitMiddleware(metrics));
  app.use(express.json({ limit: bodyLimit, verify: captureRawBody }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit, verify: captureRawBody }));
  app.use(createPayloadErrorHandler());

  expressApp.get('/metrics', (_request: Request, response: Response) => {
    response.type('text/plain; version=0.0.4').send(metrics.renderPrometheus());
  });

  app.enableShutdownHooks();

  await app.listen(port);
  app.get(ChatRealtimeGateway).registerHttpServer(app.getHttpServer());
  app.get(TasksRealtimeProxyGateway).registerHttpServer(app.getHttpServer());
}

void bootstrap();
