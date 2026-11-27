import { Injectable, Logger } from '@nestjs/common';
import { ChatSessionContext } from '../chat.types';
import { extractTrackingCode, normalizeVietnamese } from '../guardrails/carrier-guardrails.service';
import { LlmClientService } from '../llm/llm-client.service';

export interface QueryRewriteResult {
  originalQuery: string;
  rewrittenQuery: string;
  wasRewritten: boolean;
  source: 'llm-rewriter' | 'contextual-fallback' | 'unchanged';
}

/**
 * Rewrites short, elliptical, or pronoun-heavy follow-up questions (e.g., "Thế nếu vỡ thì sao?",
 * "Thế bao giờ nó giao?") into standalone context-rich queries BEFORE RAG vector search
 * so embeddings & BM25/keyword retrieval never suffer Query Drift.
 */
@Injectable()
export class QueryRewriterService {
  private readonly logger = new Logger(QueryRewriterService.name);

  constructor(private readonly llmClient: LlmClientService) {}

  needsRewrite(question: string, session: ChatSessionContext): boolean {
    const trimmed = question.trim();
    if (!trimmed) return false;

    const hasPriorContext =
      (session.history && session.history.length > 0) ||
      Boolean(session.selectedCode) ||
      Boolean(session.pendingIntent);
    if (!hasPriorContext) return false;

    // If question already explicitly states a tracking code and is long/self-contained, skip rewrite
    const hasExplicitCode = Boolean(extractTrackingCode(trimmed));
    const wordCount = trimmed.split(/\s+/).length;
    if (hasExplicitCode && wordCount >= 8) return false;

    const nq = normalizeVietnamese(trimmed);
    const hasContextualMarkers =
      /^(?:the |vay |con |nhung |ma |neu |roi |sao |ua |the thi |vay thi )/i.test(nq) ||
      /\b(?:no|don do|don nay|don tren|kien do|kien nay|cai do|hang nay|hang do|bao gio|khi nao|o dau|den dau|mat phi khong|the nao|ra sao|vo|hu hong|be vo|den bu|boi thuong|phi hoan)\b/i.test(
        nq,
      );

    return wordCount <= 12 || hasContextualMarkers;
  }

  async rewriteForRetrieval(question: string, session: ChatSessionContext): Promise<QueryRewriteResult> {
    const originalQuery = question.trim();
    if (!this.needsRewrite(originalQuery, session)) {
      return { originalQuery, rewrittenQuery: originalQuery, wasRewritten: false, source: 'unchanged' };
    }

    // 1. Try fast LLM Query Rewriter when API keys are available
    if (this.llmClient.hasAnyLlmKey()) {
      const llmRewritten = await this.rewriteWithLlm(originalQuery, session);
      if (llmRewritten && llmRewritten.length >= 6) {
        this.logger.log(`Query Rewriter [LLM]: "${originalQuery}" -> "${llmRewritten}"`);
        return {
          originalQuery,
          rewrittenQuery: llmRewritten,
          wasRewritten: llmRewritten.toLowerCase() !== originalQuery.toLowerCase(),
          source: 'llm-rewriter',
        };
      }
    }

    // 2. Clean deterministic fallback rewriter (for offline/test/timeout resilience)
    const fallback = this.rewriteDeterministically(originalQuery, session);
    if (fallback !== originalQuery) {
      this.logger.log(`Query Rewriter [Fallback]: "${originalQuery}" -> "${fallback}"`);
      return {
        originalQuery,
        rewrittenQuery: fallback,
        wasRewritten: true,
        source: 'contextual-fallback',
      };
    }

    return { originalQuery, rewrittenQuery: originalQuery, wasRewritten: false, source: 'unchanged' };
  }

  private async rewriteWithLlm(question: string, session: ChatSessionContext): Promise<string | null> {
    const recentTurns = (session.history || []).slice(-6);
    const shipmentHint = session.lastShipmentSummary?.isVerified
      ? `Đơn hàng đang trao đổi: Mã ${session.lastShipmentSummary.code}` +
        (session.lastShipmentSummary.itemName ? `, mặt hàng "${session.lastShipmentSummary.itemName}"` : '') +
        (session.lastShipmentSummary.codAmount !== undefined
          ? `, COD ${session.lastShipmentSummary.codAmount.toLocaleString('vi-VN')}đ`
          : '') +
        (session.lastShipmentSummary.statusText ? `, trạng thái "${session.lastShipmentSummary.statusText}"` : '')
      : session.selectedCode
        ? `Mã đơn đang nhắc tới: ${session.selectedCode}`
        : '';

    const systemPrompt =
      `Nhiệm vụ: Viết lại câu hỏi nối tiếp ngắn gọn của khách hàng thành MỘT câu hỏi tiếng Việt đầy đủ, độc lập để tìm kiếm tài liệu quy chuẩn / tra cứu đơn hàng.\n` +
      `Quy tắc:\n` +
      `- Giải nghĩa các đại từ ("nó", "đơn đó", "nếu vỡ", "bao giờ giao", "mất phí không") dựa vào lịch sử chat.\n` +
      `- Giữ nguyên mã vận đơn, loại hàng hóa, mức COD nếu có liên quan.\n` +
      `- Chỉ trả về DUY NHẤT câu hỏi đã viết lại, không giải thích thêm.` +
      (session.conversationSummary ? `\nBộ nhớ tóm tắt hội thoại tích lũy: ${session.conversationSummary}` : '') +
      (shipmentHint ? `\nNgữ cảnh đơn hàng: ${shipmentHint}` : '');

    const userPrompt = `Câu hỏi hiện tại cần viết lại: "${question}"`;

    try {
      let raw = '';
      if (this.llmClient.groqApiKey) {
        raw = await this.llmClient.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.llmClient.groqApiKey,
          this.llmClient.groqKnowledgeModel,
          systemPrompt,
          userPrompt,
          recentTurns,
          2500,
          { temperature: 0.0, maxTokens: 120 },
        );
      } else if (this.llmClient.geminiApiKey) {
        raw = await this.llmClient.callGemini(
          this.llmClient.geminiModel,
          systemPrompt,
          userPrompt,
          recentTurns,
          2500,
          { temperature: 0.0, maxTokens: 120 },
        );
      } else if (this.llmClient.openaiApiKey) {
        raw = await this.llmClient.callOpenAiCompatible(
          'https://api.openai.com/v1/chat/completions',
          this.llmClient.openaiApiKey,
          this.llmClient.openaiModel,
          systemPrompt,
          userPrompt,
          recentTurns,
          2500,
          { temperature: 0.0, maxTokens: 120 },
        );
      }

      const cleaned = raw.replace(/^["'\s]+|["'\s]+$/g, '').replace(/\n+/g, ' ').trim();
      return cleaned || null;
    } catch (err: any) {
      this.logger.warn(`LLM Query Rewriter failed (${err?.message}), using deterministic fallback.`);
      return null;
    }
  }

  private rewriteDeterministically(question: string, session: ChatSessionContext): string {
    const nq = normalizeVietnamese(question);
    const summary = session.lastShipmentSummary;
    const code = summary?.code || session.selectedCode;
    const lastUserTurn = [...(session.history || [])].reverse().find((m) => m.role === 'user')?.content;

    const itemHint = summary?.isVerified && summary.itemName ? summary.itemName : '';

    // Damage / broken follow-up: "Thế nếu vỡ thì sao?" -> concise SOP query focused on damage/fragile compensation
    if (/\b(?:vo|be vo|hu hong|mop meo|thiet hai|rach|uot|hong hang)\b/i.test(nq)) {
      return `Bồi thường hư hỏng bể vỡ ${itemHint} đồng kiểm bảo hiểm`.replace(/\s+/g, ' ').trim();
    }

    // Packaging / Fragile items follow-up: "có cần bọc/đóng gói gì không?", "cốc thủy tinh", "hàng dễ vỡ"
    if (/\b(?:dong goi|boc|chong soc|bubble|xop|thuy tinh|gom su|de vo|chai lo|bat trang)\b/i.test(nq)) {
      return `Quy chuẩn đóng gói hàng dễ vỡ thủy tinh gốm sứ bọc bubble wrap xốp hơi`;
    }

    // Delivery ETA / status follow-up: "Thế bao giờ nó giao?"
    if (code && /\b(?:no|don do|don nay|kien do)\b/i.test(nq)) {
      return question.replace(/\b(?:nó|đơn đó|đơn này|kiện đó)\b/gi, `đơn hàng ${code}${itemHint ? ` (${itemHint})` : ''}`);
    }

    if (code && /\b(?:bao gio|khi nao|o dau|den dau|phi hoan|boi thuong|hoan cuoc)\b/i.test(nq)) {
      return `${question} ${itemHint || `đơn hàng ${code}`}`.trim();
    }

    if (lastUserTurn) {
      return `${question} ${lastUserTurn.slice(0, 80)}`.trim();
    }

    return question;
  }
}
