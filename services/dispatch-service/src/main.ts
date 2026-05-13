import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { Server as HttpServer } from 'http';

import { AppModule } from './app.module';
import { TasksRealtimeGateway } from './realtime/tasks-realtime.gateway';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3004);

  app.enableShutdownHooks();
  await app.init();

  const tasksRealtimeGateway = app.get(TasksRealtimeGateway);
  tasksRealtimeGateway.attach(app.getHttpServer() as HttpServer);

  await app.listen(port);
}

void bootstrap();
