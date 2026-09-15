import { Body, Controller, Header, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { KnowledgeService } from '../rag/knowledge.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('api/v1/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly knowledgeService: KnowledgeService
  ) {}

  /**
   * Endpoint hỏi đáp chuẩn REST (JSON response)
   */
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async handleMessage(@Body() dto: ChatRequestDto) {
    if (!dto.message || dto.message.trim().length === 0) {
      return {
        error: 'Message is required and cannot be empty.',
      };
    }
    return this.chatService.handleMessage(dto);
  }

  /**
   * Endpoint Server-Sent Events (SSE) Streaming
   */
  @Post('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async streamMessage(@Body() dto: ChatRequestDto, @Res() res: Response) {
    if (!dto.message || dto.message.trim().length === 0) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Message is required' });
      return;
    }

    try {
      for await (const chunk of this.chatService.streamMessage(dto)) {
        res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk.data)}\n\n`);
      }
      res.end();
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    }
  }

  /**
   * Endpoint đồng bộ lại tài liệu tri thức (Admin / Ingestion Trigger)
   */
  @Post('ingest')
  @HttpCode(HttpStatus.OK)
  async triggerIngest() {
    const result = await this.knowledgeService.reindexAll();
    return {
      success: true,
      message: 'Knowledge base successfully reindexed and saved to vector store.',
      ...result,
    };
  }
}
