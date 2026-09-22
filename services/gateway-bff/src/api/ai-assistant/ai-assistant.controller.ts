import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ServiceRegistryClient } from '../../infrastructure/clients/service-registry.client';

@Controller('api/v1/ai-assistant')
export class AiAssistantController {
  private readonly logger = new Logger(AiAssistantController.name);

  constructor(private readonly serviceRegistryClient: ServiceRegistryClient) {}

  private getChatbotBaseUrl(): string {
    try {
      return this.serviceRegistryClient.resolveServiceUrl('chatbot');
    } catch {
      return process.env.CHATBOT_SERVICE_URL || 'http://localhost:3013';
    }
  }

  @Get('health')
  async getHealth(): Promise<any> {
    const baseUrl = this.getChatbotBaseUrl();
    try {
      const resp = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!resp.ok) {
        throw new HttpException('Chatbot service unhealthy', HttpStatus.BAD_GATEWAY);
      }
      return await resp.json();
    } catch (err: any) {
      this.logger.error(`Health check failed for chatbot at ${baseUrl}: ${err.message}`);
      throw new HttpException(
        `Chatbot service unavailable: ${err.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Post('message')
  async sendMessage(@Body() body: any): Promise<any> {
    const baseUrl = this.getChatbotBaseUrl();
    this.logger.log(`Proxying chat message to ${baseUrl}/api/v1/chat/message`);

    try {
      const resp = await fetch(`${baseUrl}/api/v1/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new HttpException(
          `Chatbot error (${resp.status}): ${errorText}`,
          resp.status
        );
      }

      return await resp.json();
    } catch (err: any) {
      this.logger.error(`Failed to proxy chat message: ${err.message}`);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to reach AI Chatbot service: ${err.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  @Post('stream')
  async streamMessage(@Body() body: any, @Res() res: Response): Promise<void> {
    const baseUrl = this.getChatbotBaseUrl();
    this.logger.log(`Proxying SSE chat stream to ${baseUrl}/api/v1/chat/stream`);

    try {
      const upstream = await fetch(`${baseUrl}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!upstream.ok) {
        res.status(upstream.status).send(await upstream.text());
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      if (upstream.body) {
        const reader = upstream.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch (err: any) {
      this.logger.error(`Failed to stream chat message: ${err.message}`);
      if (!res.headersSent) {
        res.status(HttpStatus.BAD_GATEWAY).json({
          message: `Failed to stream AI Chatbot service: ${err.message}`,
        });
      } else {
        res.end();
      }
    }
  }

  @Post('ingest')
  async ingestKnowledge(): Promise<any> {
    const baseUrl = this.getChatbotBaseUrl();
    const resp = await fetch(`${baseUrl}/api/v1/chat/ingest`, { method: 'POST' });
    if (!resp.ok) {
      throw new HttpException('Failed to ingest knowledge', resp.status);
    }
    return await resp.json();
  }
}
