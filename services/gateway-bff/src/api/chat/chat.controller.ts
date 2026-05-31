import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { ChatRealtimeGateway } from './chat-realtime.gateway';
import { ChatMetricsService } from './chat.metrics';
import { ChatService } from './chat.service';
import type {
  ChatConversationDto,
  ChatMessageDto,
  ChatMessagePageDto,
  ChatWebSocketTicketDto,
} from './chat.types';

interface CreateChatMessageBody {
  courierId?: string;
  text?: string;
}

interface MarkChatReadBody {
  conversationId?: string;
  courierId?: string;
}

interface ClaimChatBody {
  conversationId?: string;
  courierId?: string;
}

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatRealtimeGateway: ChatRealtimeGateway,
    private readonly chatMetricsService: ChatMetricsService,
  ) {}

  @Get('conversations')
  async listConversations(
    @Req() request: Request,
    @Query('clientRole') clientRole?: string,
    @Query('courierId') courierId?: string,
  ): Promise<ChatConversationDto[]> {
    const actor = await this.chatService.resolveActor({
      authorizationHeader: request.headers.authorization,
      roleHint: clientRole,
      courierIdHint: courierId,
    });

    return this.chatService.listConversations(actor);
  }

  @Get('messages')
  async listMessages(
    @Req() request: Request,
    @Query('clientRole') clientRole?: string,
    @Query('conversationId') conversationId?: string,
    @Query('courierId') courierId?: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ): Promise<ChatMessagePageDto> {
    const actor = await this.chatService.resolveActor({
      authorizationHeader: request.headers.authorization,
      roleHint: clientRole,
      courierIdHint: courierId,
    });

    return this.chatService.listMessages(actor, {
      conversationId,
      courierId,
      before,
      limit,
    });
  }

  @Post('messages')
  async createMessage(
    @Req() request: Request,
    @Body() body: CreateChatMessageBody,
    @Query('clientRole') clientRole?: string,
  ): Promise<ChatMessageDto> {
    const actor = await this.chatService.resolveActor({
      authorizationHeader: request.headers.authorization,
      roleHint: clientRole,
      courierIdHint: body.courierId,
    });
    const result = await this.chatService.createMessage(actor, body);

    await this.chatRealtimeGateway.publish({
      type: 'chat.message',
      message: result.message,
      conversation: result.conversation,
    });

    return result.message;
  }

  @Post('read')
  async markRead(
    @Req() request: Request,
    @Body() body: MarkChatReadBody,
    @Query('clientRole') clientRole?: string,
  ): Promise<ChatConversationDto> {
    const actor = await this.chatService.resolveActor({
      authorizationHeader: request.headers.authorization,
      roleHint: clientRole,
      courierIdHint: body.courierId,
    });
    const conversation = await this.chatService.markRead(actor, body);

    await this.chatRealtimeGateway.publish({
      type: 'chat.read',
      conversation,
    });

    return conversation;
  }

  @Post('claim')
  async claimConversation(
    @Req() request: Request,
    @Body() body: ClaimChatBody,
    @Query('clientRole') clientRole?: string,
  ): Promise<ChatConversationDto> {
    const actor = await this.chatService.resolveActor({
      authorizationHeader: request.headers.authorization,
      roleHint: clientRole,
      courierIdHint: body.courierId,
    });
    const conversation = await this.chatService.claimConversation(actor, body);

    await this.chatRealtimeGateway.publish({
      type: 'chat.claim',
      conversation,
    });

    return conversation;
  }

  @Post('ws-ticket')
  async issueWebSocketTicket(
    @Req() request: Request,
    @Body() body: MarkChatReadBody,
    @Query('clientRole') clientRole?: string,
  ): Promise<ChatWebSocketTicketDto> {
    const actor = await this.chatService.resolveActor({
      authorizationHeader: request.headers.authorization,
      roleHint: clientRole,
      courierIdHint: body.courierId,
    });

    return this.chatService.issueWebSocketTicket(actor);
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  getMetrics(): string {
    return this.chatMetricsService.renderPrometheus();
  }
}
