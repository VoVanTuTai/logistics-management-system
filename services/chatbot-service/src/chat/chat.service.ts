import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../rag/rag.types';
import { HmasGraphOrchestrator } from './agents/hmas-graph.orchestrator';
import { ChatRequestDto } from './dto/chat-request.dto';
import { CarrierGuardrailsService } from './guardrails/carrier-guardrails.service';
import { LlmClientService } from './llm/llm-client.service';
import { ChatSessionService } from './session/chat-session.store';

@Injectable()
export class ChatService {
  constructor(
    private readonly sessionStore: ChatSessionService,
    private readonly guardrails: CarrierGuardrailsService,
    private readonly llmClient: LlmClientService,
    private readonly hmasGraph: HmasGraphOrchestrator,
  ) {}

  async handleMessage(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const startTime = Date.now();
    const conversationId = dto.conversationId || `conv_${Date.now()}`;
    const question = (dto.message || '').trim();

    // 1. Load persistent session + conversation history (with optional UI client hydration)
    const session = await this.sessionStore.getSession(
      conversationId,
      dto.history,
      dto.selectedShipmentCode,
    );

    if (!question) {
      return {
        conversationId,
        question,
        answer: 'Dạ anh/chị vui lòng nhập câu hỏi hoặc mã vận đơn để em có thể kiểm tra và hỗ trợ ạ.',
        citations: [],
        toolsUsed: [],
        latencyMs: Date.now() - startTime,
      };
    }

    // 2. Execute Heterogeneous Multi-Agent StateGraph (Supervisor, Operation, Knowledge, Validation)
    const graphOut = await this.hmasGraph.run(dto, conversationId, session);

    // 3. Commit User + Assistant turn & state updates to Persistent Session Store
    await this.sessionStore.commitTurn(
      conversationId,
      session,
      question,
      graphOut.response.answer,
      graphOut.sessionPatch,
    );

    return graphOut.response;
  }

  async *streamMessage(dto: ChatRequestDto): AsyncGenerator<{ event: string; data: any }> {
    const result = await this.handleMessage(dto);

    yield {
      event: 'metadata',
      data: {
        conversationId: result.conversationId,
        citations: result.citations,
        toolsUsed: result.toolsUsed,
        shipmentCards: result.shipmentCards,
        actionChips: result.actionChips,
        orderFormRequested: result.orderFormRequested,
        orderConfirmation: result.orderConfirmation,
      },
    };

    const tokens = result.answer.split(/(?<=\s+)/);
    for (const token of tokens) {
      yield {
        event: 'token',
        data: { content: token },
      };
      await new Promise((r) => setTimeout(r, 12));
    }

    yield {
      event: 'done',
      data: { latencyMs: result.latencyMs },
    };
  }

  async callValidationAgent(userPrompt: string, actionType: string, targetCode?: string) {
    return this.guardrails.callValidationAgent(userPrompt, actionType, targetCode);
  }

  async checkMultiAgentHealth() {
    return this.llmClient.checkMultiAgentHealth(this.sessionStore.getHealthInfo());
  }
}
