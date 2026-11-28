import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../../rag/embedding.service';
import { VectorStoreService } from '../../rag/vector-store.service';
import { Citation, SearchMatch } from '../../rag/rag.types';
import { LlmClientService } from '../llm/llm-client.service';
import { QueryRewriterService } from '../router/query-rewriter.service';
import { normalizeVietnamese } from '../guardrails/carrier-guardrails.service';
import { HmasAgentState } from './hmas.state';

/**
 * Autonomous Knowledge Agent (powered by Groq Qwen / RAG Engine).
 * Performs Contextual Query Rewriting + Hybrid Vector/Keyword RAG over 59+ SOP chunks,
 * enriches active shipment context when handed off from OperationAgent, and drafts SOP answers.
 */
@Injectable()
export class KnowledgeAgent {
  private readonly logger = new Logger(KnowledgeAgent.name);

  constructor(
    private readonly queryRewriter: QueryRewriterService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly llmClient: LlmClientService,
  ) {}

  async execute(state: HmasAgentState): Promise<Partial<HmasAgentState>> {
    // Include any freshly fetched shipment summary from OperationAgent if present in sessionPatch
    const effectiveSession = {
      ...state.session,
      ...(state.sessionPatch || {}),
    };

    const rewrite = await this.queryRewriter.rewriteForRetrieval(state.question, effectiveSession);
    const searchQuery = rewrite.rewrittenQuery;
    const toolsUsed = [...state.toolsUsed];
    const handoffs = [...state.handoffs];

    if (rewrite.wasRewritten) {
      toolsUsed.push(`queryRewrite(${rewrite.source}: "${searchQuery}")`);
    }

    let matches: SearchMatch[] = [];
    try {
      const embRes = await this.embeddingService.getEmbedding(searchQuery);
      const minScore = embRes.isMock ? 0.08 : 0.15;
      matches = this.vectorStore.hybridSearch(embRes.embedding, searchQuery, 4, minScore);
    } catch (err: any) {
      this.logger.warn(`KnowledgeAgent hybridSearch fallback (${err?.message})`);
    }

    if (matches.length === 0) {
      matches = this.keywordFallbackSearch(searchQuery, 4);
    }

    const citations: Citation[] = matches.map((m: SearchMatch) => ({
      file: m.chunk.sourceFile,
      title: m.chunk.sectionTitle,
      snippet: m.chunk.content.slice(0, 320).replace(/\n/g, ' ') + (m.chunk.content.length > 320 ? '...' : ''),
      score: Math.round(m.score * 100) / 100,
    }));

    if (citations.length > 0) {
      toolsUsed.push('hybridSearchRAG');
    }

    const ragContext = matches
      .map(
        (m: SearchMatch, i: number) =>
          `[Tài liệu ${i + 1}: ${m.chunk.sourceFile} - Mục "${m.chunk.sectionTitle}" | Score: ${m.score.toFixed(2)}]\n${m.chunk.content}`,
      )
      .join('\n\n');

    // Attach verified active shipment context when KnowledgeAgent runs standalone after tracking in earlier turn
    let activeShipmentHint = '';
    if (!state.operationContext && effectiveSession.lastShipmentSummary?.isVerified) {
      const s = effectiveSession.lastShipmentSummary;
      activeShipmentHint =
        `\n[NGỮ CẢNH ĐƠN HÀNG ĐANG TRAO ĐỔI TRONG PHIÊN]:\n` +
        `- Mã vận đơn: ${s.code}\n` +
        (s.itemName ? `- Mặt hàng: ${s.itemName}\n` : '') +
        (s.statusText ? `- Trạng thái hiện tại: ${s.statusText}\n` : '') +
        (s.codAmount !== undefined ? `- Giá trị thu hộ COD: ${s.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
        (s.weightKg ? `- Khối lượng: ${s.weightKg} kg\n` : '') +
        (rewrite.wasRewritten ? `- Câu hỏi đã làm rõ ngữ cảnh: ${searchQuery}\n` : '');
    }

    const isMultiAgentCollaborative = Boolean(state.operationContext);
    if (isMultiAgentCollaborative) {
      // Handoff to SupervisorAgent to merge Operation + Knowledge outputs cleanly
      handoffs.push('KNOWLEDGE_AGENT -> SUPERVISOR_SYNTHESIS');
      return {
        knowledgeContext: ragContext,
        rewrittenQuery: searchQuery,
        citations: [...state.citations, ...citations],
        toolsUsed,
        handoffs,
      };
    }

    // Standalone KnowledgeAgent synthesizes answer using Knowledge LLM (Qwen / Groq) + history
    const systemPrompt = this.buildAgentPrompt(state, activeShipmentHint, ragContext);
    const synth = await this.llmClient.synthesizeAnswer({
      systemPrompt,
      userPrompt: state.question,
      rawUserQuestion: state.question,
      history: state.session.history,
      conversationSummary: state.session.conversationSummary,
      hasOperationalTools: false,
      hasKnowledgeRag: true,
    });

    handoffs.push('KNOWLEDGE_AGENT -> VALIDATION_AGENT');

    return {
      operationContext: activeShipmentHint || state.operationContext,
      knowledgeContext: ragContext,
      rewrittenQuery: searchQuery,
      citations: [...state.citations, ...citations],
      toolsUsed,
      draftAnswer: synth.answer,
      agentModelUsed: synth.agentModelUsed,
      llmStatusNote: synth.llmStatusNote,
      handoffs,
    };
  }

  private buildAgentPrompt(state: HmasAgentState, shipmentHint: string, ragContext: string): string {
    const userLabel = state.isGuest
      ? 'Khách vãng lai'
      : `${state.userDisplayName} (${state.dto.senderRole === 'MERCHANT' ? 'Shop' : 'Khách hàng'})`;

    return (
      `Bạn là Knowledge Agent (Chuyên gia Quy chuẩn Bưu chính & Pháp lý) của Nexus Logistics.\n` +
      `Khách đang chat: ${userLabel}.\n` +
      `Phong cách: Trả lời tự nhiên, dễ hiểu (xưng "em", gọi "anh/chị"), gắn sát tài liệu quy chuẩn và ngữ cảnh hội thoại, văn bản thuần không emoji/LaTeX.\n` +
      (shipmentHint ? `\n=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===\n${shipmentHint}` : '') +
      (ragContext ? `\n=== TÀI LIỆU QUY CHUẨN NGHIỆP VỤ (KNOWLEDGE BASE) ===\n${ragContext}` : '')
    );
  }

  private keywordFallbackSearch(queryText: string, topK = 4): SearchMatch[] {
    const chunks = this.vectorStore.getChunks();
    if (!chunks.length) return [];

    const terms = normalizeVietnamese(queryText)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 2 && !['cho', 'cua', 'nay', 'voi', 'khi', 'duoc', 'trong', 'thi', 'sao', 'la', 'nhu', 'the', 'neu'].includes(t));
    if (!terms.length) return [];

    const scored: SearchMatch[] = [];
    for (const chunk of chunks) {
      const hay = normalizeVietnamese(`${chunk.sectionTitle} ${chunk.sourceFile} ${chunk.content}`);
      let hits = 0;
      for (const term of terms) {
        if (hay.includes(term)) hits++;
      }
      if (hits > 0) {
        scored.push({ chunk, score: Number((hits / terms.length).toFixed(3)) });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}
