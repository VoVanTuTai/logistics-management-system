import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3013);
  await app.listen(port);

  console.log(`===========================================================`);
  console.log(`🤖 NEXUS LOGISTICS AI ASSISTANT SERVICE`);
  console.log(`🚀 Service is running on http://localhost:${port}`);
  console.log(`🩺 Healthcheck: http://localhost:${port}/health`);
  console.log(`💬 Chat API: POST http://localhost:${port}/api/v1/chat/message`);
  console.log(`🌊 Stream SSE: POST http://localhost:${port}/api/v1/chat/stream`);
  console.log(`📚 Ingest API: POST http://localhost:${port}/api/v1/chat/ingest`);
  console.log(`===========================================================`);
}

void bootstrap();
