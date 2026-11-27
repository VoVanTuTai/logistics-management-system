import { Injectable, Logger } from '@nestjs/common';
import { StructuredIntentName } from '../chat.types';
import { normalizeVietnamese } from '../guardrails/carrier-guardrails.service';
import { LlmClientService } from '../llm/llm-client.service';
import { IntentRouterService } from '../router/intent-router.service';
import { AgentRouteTarget, HmasAgentState, SupervisorExecutionPlan } from './hmas.state';

const OPERATION_INTENTS = new Set<StructuredIntentName>([
  'TRACK_SHIPMENT',
  'FOLLOW_UP_SHIPMENT',
  'LIST_USER_SHIPMENTS',
  'CALCULATE_PRICING',
  'RETURN_FEE',
  'CANCEL_SHIPMENT',
  'CHANGE_ADDRESS',
  'CHANGE_CONSIGNEE',
  'SCHEDULE_REDELIVERY',
  'HOLD_AT_HUB',
  'AUDIT_DELIVERY_ATTEMPT',
  'TRACK_CLAIM',
  'CREATE_ORDER',
  'ESCALATE_HUMAN',
  'STORAGE_AGING_POLICY',
  'WAYBILL_FORMAT_POLICY',
]);

const SUPERVISOR_DIRECT_INTENTS = new Set<StructuredIntentName>([
  'GREETING',
  'OUT_OF_DOMAIN',
  'USER_IDENTITY',
]);

/**
 * Autonomous Supervisor Agent (powered by Google Gemini).
 * Node 1 (plan): Uses LLM Function Calling router + domain heuristics to decide the agent execution plan.
 * Node 2 (synthesize): Merges multi-worker outputs (Operation + Knowledge), handles direct supervisor turns,
 *                      and performs Reflection self-correction when ValidationAgent rejects a draft.
 */
@Injectable()
export class SupervisorAgent {
  private readonly logger = new Logger(SupervisorAgent.name);

  constructor(
    private readonly intentRouter: IntentRouterService,
    private readonly llmClient: LlmClientService,
  ) {}

  async planNode(state: HmasAgentState): Promise<Partial<HmasAgentState>> {
    const routed = await this.intentRouter.route(state.dto, state.session);
    const nq = normalizeVietnamese(state.question);

    let primaryAgent: AgentRouteTarget = 'KNOWLEDGE_AGENT';
    let handoffToKnowledge = false;

    if (SUPERVISOR_DIRECT_INTENTS.has(routed.intent)) {
      primaryAgent = 'SUPERVISOR_AGENT';
    } else if (OPERATION_INTENTS.has(routed.intent)) {
      primaryAgent = 'OPERATION_AGENT';
      // Multi-agent collaboration: e.g., pricing/tracking + fragile packaging or compensation question
      handoffToKnowledge =
        (routed.intent === 'CALCULATE_PRICING' || routed.intent === 'TRACK_SHIPMENT') &&
        /\b(?:dong goi|de vo|bao hiem|boi thuong|quy dinh|luat)\b/i.test(nq);
    } else {
      primaryAgent = 'KNOWLEDGE_AGENT';
    }

    const plan: SupervisorExecutionPlan = {
      primaryAgent,
      handoffToKnowledge,
      requiresValidationReflection: true,
      routingReason: `intent=${routed.intent} (${routed.source}) -> ${primaryAgent}${handoffToKnowledge ? ' + KNOWLEDGE_HANDOFF' : ''}`,
    };

    const handoffEntry = `SUPERVISOR_PLAN -> ${primaryAgent}`;
    this.logger.log(`Supervisor plan [${state.conversationId}]: ${plan.routingReason}`);

    return {
      routedIntent: routed,
      plan,
      handoffs: [...state.handoffs, handoffEntry],
    };
  }

  async synthesizeNode(state: HmasAgentState): Promise<Partial<HmasAgentState>> {
    // Handle direct supervisor intents (Greeting, Out-of-Domain, Identity) when not already populated by Guardrail
    let opContext = state.operationContext;
    let actionChips = state.actionChips;
    let toolsUsed = [...state.toolsUsed];

    if (!state.guardrail?.violated && !opContext && state.routedIntent) {
      if (state.routedIntent.intent === 'GREETING') {
        opContext = state.isGuest
          ? `\n[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH VÃNG LAI (GUEST)]: Chào hỏi ngắn gọn, lịch sự (xưng em, gọi anh/chị).\n`
          : `\n[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH HÀNG ĐÃ ĐĂNG NHẬP]: Chào anh/chị ${state.userDisplayName} thân thiện.\n`;
        actionChips = [
          { label: 'Tra cứu hành trình đơn hàng', query: 'Tra cứu hành trình đơn hàng' },
          { label: 'Dự toán cước vận chuyển', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
          { label: 'Tạo đơn gửi hàng mới', query: 'Tôi muốn tạo đơn gửi hàng mới' },
        ];
      } else if (state.routedIntent.intent === 'OUT_OF_DOMAIN') {
        toolsUsed.push('domainBoundaryController(Out of Domain Routing)');
        opContext = `\n[TỪ CHỐI NGOÀI PHẠM VI HỆ THỐNG]: Nexus Logistics chỉ hỗ trợ nghiệp vụ bưu chính, vận chuyển và tra cứu vận đơn.\n`;
      } else if (state.routedIntent.intent === 'USER_IDENTITY') {
        toolsUsed.push(`checkSessionIdentity(${state.isGuest ? 'GUEST' : `${state.dto.senderRole || 'CUSTOMER'}:${state.dto.userId}`})`);
        opContext = state.isGuest
          ? `\n[THÔNG TIN NGƯỜI DÙNG CHƯA ĐĂNG NHẬP]: Khách đang là khách vãng lai, mời đăng nhập [Đăng nhập tài khoản](/login) để xem thông tin cá nhân.\n`
          : `\n[THÔNG TIN HỒ SƠ TÀI KHOẢN NGƯỜI DÙNG HIỆN TẠI (ĐÃ ĐĂNG NHẬP)]: Tên ${state.userDisplayName}, User ID: ${state.dto.userId}.\n`;
      }
    }

    const reflectionFeedback =
      state.validation && !state.validation.approved && state.validation.issues.length > 0
        ? `\n[YÊU CẦU CHỈNH SỬA TỪ VALIDATION GATEKEEPER - LẦN ${state.reflectionCount}]:\n` +
          `- Bản nháp trước bị từ chối vì: ${state.validation.issues.join('; ')}\n` +
          `- Hãy viết lại câu trả lời khắc phục triệt để lỗi trên, bảo đảm tuân thủ PII/BOLA và trần vật lý 70kg/150cm/300cm.\n`
        : '';

    const fullContext = [
      opContext ? `=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===\n${opContext}` : '',
      state.knowledgeContext ? `=== TÀI LIỆU QUY CHUẨN NGHIỆP VỤ (KNOWLEDGE BASE) ===\n${state.knowledgeContext}` : '',
      reflectionFeedback,
    ]
      .filter(Boolean)
      .join('\n\n');

    const userLabel = state.isGuest
      ? 'Khách vãng lai'
      : `${state.userDisplayName} (${state.dto.senderRole === 'MERCHANT' ? 'Shop' : 'Khách hàng'})`;

    const systemPrompt =
      `Bạn là Supervisor Agent (Điều phối viên & Tổng hợp CSKH cấp cao) của Nexus Logistics.\n` +
      `Khách đang chat: ${userLabel}.\n` +
      `Phong cách: Trò chuyện tự nhiên, ngắn gọn, thân thiện (xưng "em", gọi "anh/chị"), tổng hợp mạch lạc thông tin từ các Agent chuyên trách dưới đây, văn bản thuần không emoji/LaTeX.\n` +
      (fullContext ? `\n${fullContext}` : '');

    // Route directly to Supervisor LLM (Gemini / fallback) when merging multi-agent work or Supervisor-direct turns
    const synth = await this.llmClient.synthesizeAnswer({
      systemPrompt,
      userPrompt: state.question,
      rawUserQuestion: state.question,
      history: state.session.history,
      hasOperationalTools: false,
      hasKnowledgeRag: false,
    });

    return {
      operationContext: opContext,
      actionChips,
      toolsUsed,
      draftAnswer: synth.answer,
      agentModelUsed: synth.agentModelUsed,
      llmStatusNote: synth.llmStatusNote,
      handoffs: [...state.handoffs, 'SUPERVISOR_SYNTHESIS -> VALIDATION_AGENT'],
    };
  }
}
