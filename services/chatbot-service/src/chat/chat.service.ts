import { Injectable } from '@nestjs/common';
import { ChatResponseDto } from '../rag/rag.types';
import { HmasGraphOrchestrator } from './agents/hmas-graph.orchestrator';
import { ChatRequestDto } from './dto/chat-request.dto';
import { CarrierGuardrailsService } from './guardrails/carrier-guardrails.service';
import { LlmClientService } from './llm/llm-client.service';
import { ChatSessionService } from './session/chat-session.store';
import { LogisticsToolsService } from '../tools/logistics-tools.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly sessionStore: ChatSessionService,
    private readonly guardrails: CarrierGuardrailsService,
    private readonly llmClient: LlmClientService,
    private readonly hmasGraph: HmasGraphOrchestrator,
    private readonly toolsService: LogisticsToolsService,
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

    // 3. Tier 3 Recursive Conversation Summary Memory (MemGPT-style Episodic Memory)
    let updatedSummary = session.conversationSummary;
    const historyLength = (session.history || []).length;
    if (historyLength >= 4) {
      try {
        updatedSummary = await this.llmClient.generateConversationSummary(
          session.conversationSummary,
          [
            ...(session.history || []).slice(-6),
            { role: 'user', content: question },
            { role: 'assistant', content: graphOut.response.answer },
          ],
        );
      } catch {
        // preserve current summary
      }
    }

    // 4. Commit User + Assistant turn & state updates to Persistent Session Store
    await this.sessionStore.commitTurn(
      conversationId,
      session,
      question,
      graphOut.response.answer,
      {
        ...graphOut.sessionPatch,
        conversationSummary: updatedSummary,
      },
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
        claimFormRequested: result.claimFormRequested,
        claimFormData: result.claimFormData,
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

  async listTickets(phone?: string, shipmentCode?: string) {
    return this.toolsService.listUserTickets(phone, shipmentCode);
  }

  async callValidationAgent(userPrompt: string, actionType: string, targetCode?: string) {
    return this.guardrails.callValidationAgent(userPrompt, actionType, targetCode);
  }

  async checkMultiAgentHealth() {
    return this.llmClient.checkMultiAgentHealth(this.sessionStore.getHealthInfo());
  }
}
