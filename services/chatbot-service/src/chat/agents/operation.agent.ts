import { Injectable, Logger } from '@nestjs/common';
import { LogisticsOrchestratorService } from '../handlers/logistics-orchestrator.service';
import { LlmClientService } from '../llm/llm-client.service';
import { normalizeVietnamese } from '../guardrails/carrier-guardrails.service';
import { HmasAgentState } from './hmas.state';

/**
 * Autonomous Operation Agent (powered by Groq GPT-OSS 120B).
 * Executes domain API tools (tracking, pricing, order creation, redelivery, PUDO, claims)
 * and decides dynamically whether to hand off to KnowledgeAgent for SOP/policy enrichment.
 */
@Injectable()
export class OperationAgent {
  private readonly logger = new Logger(OperationAgent.name);

  constructor(
    private readonly orchestrator: LogisticsOrchestratorService,
    private readonly llmClient: LlmClientService,
  ) {}

  async execute(state: HmasAgentState): Promise<Partial<HmasAgentState>> {
    const routed = state.routedIntent;
    if (!routed) return {};

    const execResult = await this.orchestrator.execute(state.dto, state.session, routed);
    const updatedTools = [...state.toolsUsed, ...execResult.toolsUsed];
    const updatedHandoffs = [...state.handoffs];

    // Evaluate dynamic handoff condition: does the operational outcome also need SOP / policy knowledge?
    const nq = normalizeVietnamese(state.question);
    const shouldHandoffToKnowledge =
      Boolean(state.plan?.handoffToKnowledge) ||
      (routed.intent === 'CALCULATE_PRICING' &&
        /\b(?:de vo|boc|dong goi|bao hiem|quy dinh|luu y|boi thuong)\b/i.test(nq)) ||
      ((routed.intent === 'TRACK_SHIPMENT' || routed.intent === 'FOLLOW_UP_SHIPMENT') &&
        /\b(?:quy dinh|luat|boi thuong|vo|hu hong|dong kiem)\b/i.test(nq));

    if (shouldHandoffToKnowledge) {
      updatedHandoffs.push('OPERATION_AGENT -> KNOWLEDGE_AGENT');
      this.logger.log(`OperationAgent executing tool & handing off to KnowledgeAgent (conv=${state.conversationId})`);
      return {
        operationContext: execResult.toolAugmentedContext,
        citations: [...state.citations, ...execResult.citations],
        toolsUsed: updatedTools,
        shipmentCards: execResult.shipmentCards,
        actionChips: execResult.actionChips,
        orderFormRequested: execResult.orderFormRequested,
        orderConfirmation: execResult.orderConfirmation,
        sessionPatch: { ...state.sessionPatch, ...execResult.sessionPatch },
        plan: state.plan ? { ...state.plan, handoffToKnowledge: true } : undefined,
        handoffs: updatedHandoffs,
      };
    }

    // Single-worker path: OperationAgent synthesizes the operational response directly with full history
    const systemPrompt = this.buildAgentPrompt(state, execResult.toolAugmentedContext);
    const synth = await this.llmClient.synthesizeAnswer({
      systemPrompt,
      userPrompt: state.question,
      rawUserQuestion: state.question,
      history: state.session.history,
      hasOperationalTools: true,
      hasKnowledgeRag: false,
    });

    updatedHandoffs.push('OPERATION_AGENT -> VALIDATION_AGENT');

    return {
      operationContext: execResult.toolAugmentedContext,
      citations: [...state.citations, ...execResult.citations],
      toolsUsed: updatedTools,
      shipmentCards: execResult.shipmentCards,
      actionChips: execResult.actionChips,
      orderFormRequested: execResult.orderFormRequested,
      orderConfirmation: execResult.orderConfirmation,
      sessionPatch: { ...state.sessionPatch, ...execResult.sessionPatch },
      draftAnswer: synth.answer,
      agentModelUsed: synth.agentModelUsed,
      llmStatusNote: synth.llmStatusNote,
      handoffs: updatedHandoffs,
    };
  }

  private buildAgentPrompt(state: HmasAgentState, toolContext: string): string {
    const userLabel = state.isGuest
      ? 'Khách vãng lai'
      : `${state.userDisplayName} (${state.dto.senderRole === 'MERCHANT' ? 'Shop' : 'Khách hàng'})`;

    return (
      `Bạn là Operation Agent (Chuyên viên Điều phối Vận đơn & Cước phí) của Nexus Logistics.\n` +
      `Khách đang chat: ${userLabel}.\n` +
      `Phong cách: Tự nhiên, thân thiện, ngắn gọn (xưng "em", gọi "anh/chị"), dựa trên lịch sử hội thoại và dữ liệu thời gian thực dưới đây, văn bản thuần không emoji/LaTeX.\n` +
      (toolContext ? `\n=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===\n${toolContext}` : '')
    );
  }
}
