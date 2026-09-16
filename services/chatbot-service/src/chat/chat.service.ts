import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../rag/embedding.service';
import { VectorStoreService } from '../rag/vector-store.service';
import { LogisticsToolsService } from '../tools/logistics-tools.service';
import type { ChatResponseDto, Citation } from '../rag/rag.types';
import type { ChatRequestDto } from './dto/chat-request.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private apiKey: string;
  private chatModel: string;
  private temperature: number;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly toolsService: LogisticsToolsService
  ) {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
    this.temperature = Number(process.env.OPENAI_TEMPERATURE || 0.2);
  }

  /**
   * Xử lý câu hỏi hoàn chỉnh (Non-streaming REST API)
   */
  public async handleMessage(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const startTime = Date.now();
    const conversationId = dto.conversationId || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const question = dto.message.trim();
    const toolsUsed: string[] = [];

    // 1. Phân tích ý định & gọi Tool nếu cần (Function Calling / Intent Routing)
    let toolAugmentedContext = '';

    // Regex tìm mã đơn hàng: NX-XXXX hoặc NX12345
    const trackingMatch = question.match(/\b(NX[-_]?[A-Z0-9]{4,12})\b/i);
    if (trackingMatch) {
      const trackingCode = trackingMatch[1].toUpperCase();
      toolsUsed.push(`trackShipment(${trackingCode})`);
      const trackRes = await this.toolsService.trackShipment(trackingCode);
      toolAugmentedContext += `\n[THÔNG TIN TRA CỨU ĐƠN HÀNG THỰC TẾ CHO MÃ ${trackingCode}]:\n` +
        `- Trạng thái: ${trackRes.statusText} (${trackRes.status})\n` +
        `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
        `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery}\n` +
        `- Lịch sử vận chuyển:\n` +
        trackRes.timeline.map((t) => `  * ${t.time}: ${t.description}`).join('\n') + '\n';
    }

    // Regex tìm mã hồ sơ khiếu nại bồi thường: CLM-XXXX
    const claimMatch = question.match(/\b(CLM[-_]?[A-Z0-9]{4,15})\b/i);
    if (claimMatch) {
      const claimCode = claimMatch[1].toUpperCase();
      toolsUsed.push(`trackClaimStatus(${claimCode})`);
      const claimRes = await this.toolsService.trackClaimStatus(claimCode);
      toolAugmentedContext += `\n[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ ${claimCode}]:\n` +
        `- Trạng thái duyệt: ${claimRes.statusText} (${claimRes.status})\n` +
        `- Số tiền bồi thường duyệt chi: ${claimRes.approvedAmount.toLocaleString('vi-VN')} VNĐ\n` +
        `- Đơn vị chịu trách nhiệm: ${claimRes.responsibleParty}\n` +
        `- Hình thức chi trả: ${claimRes.settlementMethod}\n` +
        `- Ngày hoàn tất phán quyết: ${claimRes.adjudicatedAt}\n`;
    }

    // Kiểm tra ý định tính cước chuyển hoàn (Return Fee)
    const isReturnFeeQuery =
      (question.includes('hoàn') || question.includes('bom')) &&
      (question.includes('cước') || question.includes('phí') || question.includes('tiền') || question.includes('ai chịu'));
    if (isReturnFeeQuery) {
      toolsUsed.push(`calculateReturnFee(Rule-based Policy)`);
      const standardRes = this.toolsService.calculateReturnFee(30000, 'STANDARD');
      const vipRes = this.toolsService.calculateReturnFee(30000, 'VIP_ENTERPRISE');
      toolAugmentedContext += `\n[CHÍNH SÁCH CƯỚC CHUYỂN HOÀN RULE-BASED POLICY]:\n` +
        `- ${standardRes.explanation}\n` +
        `- ${vipRes.explanation}\n`;
    }

    // Kiểm tra ý định tính cước phí bưu gửi
    const weightMatch = question.match(/(\d+(\.\d+)?)\s*(kg|kí|kilogram)/i);
    if (weightMatch && (question.includes('cước') || question.includes('phí') || question.includes('tiền'))) {
      const weight = parseFloat(weightMatch[1]);
      toolsUsed.push(`calculatePricing(${weight}kg)`);
      const pricingRes = this.toolsService.calculatePricing(weight, 'STANDARD');
      toolAugmentedContext += `\n[KẾT QUẢ TÍNH CƯỚC TỰ ĐỘNG CHO TRỌNG LƯỢNG ${weight}KG]:\n` +
        `- ${pricingRes.breakdown}\n`;
    }

    // 2. Truy xuất RAG từ Vector Store (Dense Semantic Retrieval)
    const qEmbed = await this.embeddingService.getEmbedding(question);
    const matches = this.vectorStore.search(qEmbed.embedding, 3, 0.2);

    const citations: Citation[] = matches.map((m) => ({
      file: m.chunk.sourceFile,
      title: m.chunk.sectionTitle,
      score: Math.round(m.score * 1000) / 10,
      snippet: m.chunk.content.slice(0, 180).replace(/\n+/g, ' ') + '...',
    }));

    // 3. Ghép nối Ngữ cảnh Grounded Context
    let contextText = '';
    if (toolAugmentedContext) {
      contextText += `=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===\n${toolAugmentedContext}\n`;
    }
    if (matches.length > 0) {
      contextText += `=== TÀI LIỆU QUY CHUẨN ĐƯỢC TRÍCH XUẤT TỪ HỆ THỐNG ===\n` +
        matches
          .map(
            (m, i) =>
              `[Đoạn ${i + 1} - Nguồn: ${m.chunk.sourceFile} | Mục: ${m.chunk.sectionTitle}]:\n${m.chunk.content}`
          )
          .join('\n---\n');
    }

    // 4. Sinh câu trả lời qua LLM (gpt-4o-mini)
    const answer = await this.executeLlm(question, contextText, citations);

    const latencyMs = Date.now() - startTime;
    return {
      conversationId,
      question,
      answer,
      citations,
      toolsUsed,
      latencyMs,
    };
  }

  /**
   * Sinh token dạng luồng (Server-Sent Events streaming)
   */
  public async *streamMessage(dto: ChatRequestDto): AsyncGenerator<{ event: string; data: any }> {
    const res = await this.handleMessage(dto);

    // Bắn event đầu tiên: metadata (citations & tools used)
    yield {
      event: 'metadata',
      data: {
        conversationId: res.conversationId,
        citations: res.citations,
        toolsUsed: res.toolsUsed,
      },
    };

    // Streaming từng chunk từ ngữ câu trả lời để tạo hiệu ứng gõ phím mượt mà
    const words = res.answer.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield {
        event: 'token',
        data: { token: (i === 0 ? '' : ' ') + words[i] },
      };
      // Delay giả lập nhịp gõ 25ms
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    // Bắn event kết thúc
    yield {
      event: 'done',
      data: {
        latencyMs: res.latencyMs,
      },
    };
  }

  private async executeLlm(question: string, context: string, citations: Citation[]): Promise<string> {
    if (!this.apiKey) {
      return this.generateOfflineDemoAnswer(question, context, citations);
    }

    const systemPrompt = `Bạn là Trợ lý AI CSKH thông minh của hệ sinh thái Nexus Logistics.
Nhiệm vụ của bạn là hỗ trợ khách hàng và chủ hàng (merchant) tra cứu cước phí, hành trình bưu kiện và giải đáp quy chuẩn bưu chính.
Quy tắc trả lời:
1. Ngôn ngữ: Tiếng Việt chuẩn mực, lịch sự, thân thiện, rõ ràng.
2. Căn cứ: Trả lời DỰA TRÊN NGỮ CẢNH (Context) được cung cấp. Tuyệt đối không tự bịa đặt thông tin.
3. Khi trả lời về cước phí hoặc đền bù, hãy nêu rõ căn cứ chính sách hoặc công thức bồi thường.
4. Nếu ngữ cảnh không có thông tin, hãy thẳng thắn thông báo và hướng dẫn khách gọi tổng đài 1900 0000.`;

    const userPrompt = `DỮ LIỆU NGỮ CẢNH HỆ THỐNG CUNG CẤP:
${context || '(Không tìm thấy tài liệu phù hợp trực tiếp)'}

CÂU HỎI CỦA NGƯỜI DÙNG:
${question}

HÃY ĐƯA RA CÂU TRẢ LỜI ĐẦY ĐỦ VÀ CHÍNH XÁC:`;

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.chatModel,
          temperature: this.temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        this.logger.warn(`OpenAI LLM error ${resp.status}: ${errText}`);
        return this.generateOfflineDemoAnswer(question, context, citations);
      }

      const data = (await resp.json()) as any;
      return data.choices[0].message.content;
    } catch (err: any) {
      this.logger.warn(`OpenAI LLM fetch failed: ${err.message}`);
      return this.generateOfflineDemoAnswer(question, context, citations);
    }
  }

  private generateOfflineDemoAnswer(question: string, context: string, citations: Citation[]): string {
    if (!context || citations.length === 0) {
      return `Dạ chào bạn, Nexus Logistics đã ghi nhận câu hỏi: "${question}". Hiện tài liệu hệ thống chưa có dữ liệu chi tiết về câu hỏi này, bạn vui lòng liên hệ tổng đài 1900 0000 để được điện thoại viên hỗ trợ trực tiếp ạ.`;
    }

    const topCitation = citations[0];
    return `[Chế độ Demo Tự động - Nexus Logistics AI]:\n` +
      `Dạ câu hỏi "${question}" của bạn đã được đối soát với tài liệu quy chuẩn [${topCitation.file} - ${topCitation.title}].\n\n` +
      `Theo quy định hiện hành của hệ thống:\n` +
      `- Hệ thống đã trích xuất thành công căn cứ từ tài liệu với độ tương đồng ngữ nghĩa đạt ${topCitation.score}%.\n` +
      `- Chi tiết trích dẫn:\n"${topCitation.snippet}"\n\n` +
      `💡 Bạn có thể nạp OPENAI_API_KEY vào .env để kích hoạt mô hình ${this.chatModel} sinh lời văn tự nhiên hoàn chỉnh.`;
  }
}
