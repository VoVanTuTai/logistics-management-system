import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../rag/embedding.service';
import { VectorStoreService } from '../rag/vector-store.service';
import { LogisticsToolsService } from '../tools/logistics-tools.service';
import type { ChatResponseDto, Citation } from '../rag/rag.types';
import type { ChatRequestDto } from './dto/chat-request.dto';

function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private apiKey: string;
  private chatModel: string;
  private temperature: number;
  private geminiApiKey: string;
  private geminiModel: string;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly toolsService: LogisticsToolsService
  ) {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
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
    const normalizedQ = normalizeVietnamese(question);
    const toolsUsed: string[] = [];

    // 1. Phân tích ý định & gọi Tool nếu cần (Function Calling / Intent Routing)
    let toolAugmentedContext = '';

    // Regex tìm mã đơn hàng: NX-XXXX hoặc mã số vận đơn (10-15 chữ số, ví dụ 333423979726)
    const trackingMatch =
      question.match(/\b(NX[-_]?[A-Z0-9]{4,14})\b/i) ||
      question.match(/\b(333\d{7,10}|\d{10,14})\b/);

    if (trackingMatch) {
      const trackingCode = trackingMatch[1] ? trackingMatch[1].toUpperCase() : trackingMatch[0];
      toolsUsed.push(`trackShipment(${trackingCode})`);
      const trackRes = await this.toolsService.trackShipment(trackingCode);
      toolAugmentedContext += `\n[THÔNG TIN TRA CỨU ĐƠN HÀNG THỰC TẾ CHO MÃ ${trackingCode}]:\n` +
        `- Mã vận đơn: ${trackRes.trackingNumber}\n` +
        `- Trạng thái: ${trackRes.statusText} (${trackRes.status})\n` +
        (trackRes.itemName ? `- Tên hàng hóa: ${trackRes.itemName}\n` : '') +
        (trackRes.senderName ? `- Người gửi: ${trackRes.senderName} (${trackRes.senderCity || trackRes.senderAddress || ''})\n` : '') +
        (trackRes.receiverName ? `- Người nhận: ${trackRes.receiverName} (${trackRes.receiverCity || trackRes.receiverAddress || ''})\n` : '') +
        (trackRes.codAmount !== undefined ? `- Tiền thu hộ COD: ${trackRes.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
        `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
        `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery}\n` +
        `- Lịch sử vận chuyển:\n` +
        trackRes.timeline.map((t) => `  * ${t.time}: ${t.description}`).join('\n') + '\n';
    } else {
      // Nếu không có mã cụ thể, kiểm tra nếu người dùng hỏi tra cứu đơn hoặc hỏi về đơn của họ
      const isGeneralTrackingQuery =
        normalizedQ.includes('tra cuu') ||
        normalizedQ.includes('kiem tra') ||
        normalizedQ.includes('xem don') ||
        normalizedQ.includes('don hang') ||
        normalizedQ.includes('tinh trang don') ||
        normalizedQ.includes('hanh trinh') ||
        normalizedQ.includes('van don') ||
        normalizedQ.includes('don moi') ||
        normalizedQ.includes('don gan day') ||
        normalizedQ.includes('don cua toi') ||
        (normalizedQ.includes('don') && (normalizedQ.includes('o dau') || normalizedQ.includes('sao roi') || normalizedQ.includes('chua')));

      if (isGeneralTrackingQuery) {
        const latestRes = await this.toolsService.getLatestShipment(dto.userId);
        if (latestRes.found && latestRes.tracking) {
          const t = latestRes.tracking;
          toolsUsed.push(`getLatestShipment(${latestRes.isUserSpecific ? `User:${dto.userId}` : 'SystemLatest'})`);
          toolAugmentedContext += `\n[THÔNG TIN ĐƠN HÀNG MỚI TẠO GẦN NHẤT CỦA BẠN (Tài khoản: ${dto.userId})]:\n` +
            `- Mã vận đơn: ${t.trackingNumber}\n` +
            `- Trạng thái hiện tại: ${t.statusText} (${t.status})\n` +
            (t.itemName ? `- Tên hàng hóa: ${t.itemName}\n` : '') +
            (t.senderName ? `- Người gửi: ${t.senderName} (${t.senderCity || t.senderAddress || ''})\n` : '') +
            (t.receiverName ? `- Người nhận: ${t.receiverName} (${t.receiverCity || t.receiverAddress || ''})\n` : '') +
            (t.codAmount !== undefined ? `- Tiền thu hộ COD: ${t.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
            `- Vị trí hiện tại: ${t.currentLocation}\n` +
            `- Thời gian tạo đơn: ${t.createdAt || 'Gần đây'}\n` +
            `- Lịch sử vận chuyển:\n` +
            t.timeline.map((item) => `  * ${item.time}: ${item.description}`).join('\n') + '\n';
        } else if (latestRes.isUserSpecific) {
          toolAugmentedContext += `\n[KẾT QUẢ TRA CỨU]: Tài khoản ${dto.userId} hiện chưa có đơn hàng nào được tạo trên hệ thống Nexus Logistics. Hãy thông báo lịch sự cho khách hàng rằng tài khoản chưa phát sinh đơn gửi và mời khách hàng gửi mã vận đơn cụ thể để hỗ trợ tra cứu.\n`;
        } else {
          toolAugmentedContext += `\n[KẾT QUẢ TRA CỨU]: Bạn chưa đăng nhập tài khoản và chưa cung cấp mã vận đơn. Vui lòng đăng nhập hoặc nhập mã vận đơn (dạng NX-XXXX hoặc dãy số) để hệ thống tra cứu.\n`;
        }
      }
    }

    // Regex tìm mã hồ sơ khiếu nại bồi thường: CLM-XXXX hoặc CLM-202609-001
    const claimMatch = question.match(/\b(CLM[-_]?[A-Z0-9]+(?:[-_][A-Z0-9]+)*)\b/i);
    const hasClaimKeywords = /khiếu nại|bồi thường|đền bù|bể vỡ/i.test(question);

    if (claimMatch) {
      const claimCode = claimMatch[1].toUpperCase();
      toolsUsed.push(`trackClaimStatus(${claimCode})`);
      const claimRes = await this.toolsService.trackClaimStatus(claimCode);
      toolAugmentedContext += `\n[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ ${claimCode}]:\n` +
        `- Mã hồ sơ khiếu nại: ${claimRes.claimCode}\n` +
        `- Mã vận đơn liên quan: ${claimRes.shipmentCode}\n` +
        `- Trạng thái duyệt: ${claimRes.statusText} (${claimRes.status})\n` +
        `- Số tiền bồi thường duyệt chi: ${claimRes.approvedAmount?.toLocaleString('vi-VN') || 0} VNĐ\n` +
        `- Đơn vị chịu trách nhiệm: ${claimRes.responsibleParty}\n` +
        `- Hình thức chi trả: ${claimRes.settlementMethod}\n` +
        `- Ngày hoàn tất phán quyết: ${claimRes.adjudicatedAt || '15/09/2026'}\n`;
    } else if (hasClaimKeywords && (question.includes('duyệt') || question.includes('trạng thái') || question.includes('tiến độ') || question.includes('tiền'))) {
      const demoClaimCode = 'CLM-202609-001';
      toolsUsed.push(`trackClaimStatus(${demoClaimCode})`);
      const claimRes = await this.toolsService.trackClaimStatus(demoClaimCode);
      toolAugmentedContext += `\n[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ ${demoClaimCode}]:\n` +
        `- Mã hồ sơ khiếu nại: ${claimRes.claimCode}\n` +
        `- Mã vận đơn liên quan: ${claimRes.shipmentCode}\n` +
        `- Trạng thái duyệt: ${claimRes.statusText} (${claimRes.status})\n` +
        `- Số tiền bồi thường duyệt chi: ${claimRes.approvedAmount?.toLocaleString('vi-VN') || 0} VNĐ\n` +
        `- Đơn vị chịu trách nhiệm: ${claimRes.responsibleParty}\n` +
        `- Hình thức chi trả: ${claimRes.settlementMethod}\n` +
        `- Ngày hoàn tất phán quyết: ${claimRes.adjudicatedAt || '15/09/2026'}\n`;
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

    // Kiểm tra ý định tính cước / hỏi giá cước / bưu gửi có trọng lượng, kích thước, hoặc tuyến đường
    const explicitPricingWords = /\b(?:cuoc|gia|phi|bao nhieu tien|bang gia|du toan|uoc tinh|tinh phi|tinh cuoc|bao gia)\b/i.test(normalizedQ);

    const hasWeightOrDimensions =
      /(\d+(\.\d+)?)\s*(kg|kí|kilogram|g|gram)/i.test(question) ||
      /\b(?:dai|rong|cao|kich thuoc|kich co|cm)\b/i.test(normalizedQ) ||
      /\d+\s*(?:x|\*)\s*\d+\s*(?:x|\*)\s*\d+/i.test(question);

    const hasRouteKeyword = /\b(?:tu|den|ra|vao|di|toi|sang)\b/i.test(normalizedQ);
    const hasMajorCity = /\b(?:ha noi|hcm|sai gon|ho chi minh|da nang|hai phong|can tho)\b/i.test(normalizedQ);
    const hasRoute = hasMajorCity || (hasRouteKeyword && (hasWeightOrDimensions || explicitPricingWords));

    const hasPackageSpecs = /\b(?:kien|goi|thung|buu kien|kien hang)\b/i.test(normalizedQ);

    // Khi đã có mã vận đơn (trackingMatch), TUYỆT ĐỐI KHÔNG tính cước trừ khi khách hỏi giá cụ thể
    const isPricingQuery = !trackingMatch
      ? (explicitPricingWords || (hasWeightOrDimensions && (hasRoute || hasPackageSpecs)))
      : explicitPricingWords;

    if (isPricingQuery && !isReturnFeeQuery) {
      // 1. Trích xuất cân nặng nếu có (ví dụ 10kg, 500g)
      const weightMatch = question.match(/(\d+(\.\d+)?)\s*(kg|kí|kilogram|g|gram)/i);
      let weight = 1;
      let hasExplicitWeight = false;

      if (weightMatch) {
        hasExplicitWeight = true;
        let val = parseFloat(weightMatch[1]);
        if (weightMatch[3].toLowerCase().startsWith('g') && !weightMatch[3].toLowerCase().startsWith('kg')) {
          val = val / 1000;
        }
        weight = Math.max(0.1, val);
      }

      // Trích xuất kích thước ba chiều (Dài x Rộng x Cao) nếu có
      let length = 0;
      let width = 0;
      let height = 0;

      const lengthMatch = question.match(/(?:dài|dai|length)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
      const widthMatch = question.match(/(?:rộng|rong|width)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
      const heightMatch = question.match(/(?:cao|height)\s*[:=]?\s*(\d+(?:\.\d+)?)/i);

      if (lengthMatch) length = parseFloat(lengthMatch[1]);
      if (widthMatch) width = parseFloat(widthMatch[1]);
      if (heightMatch) height = parseFloat(heightMatch[1]);

      if (!length && !width && !height) {
        const dimMatch = question.match(/(\d+(?:\.\d+)?)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)/i);
        if (dimMatch) {
          length = parseFloat(dimMatch[1]);
          width = parseFloat(dimMatch[2]);
          height = parseFloat(dimMatch[3]);
        }
      }

      const dimensionsCm = length > 0 && width > 0 && height > 0 ? { length, width, height } : undefined;

      // 2. Trích xuất tuyến vận chuyển (Hà Nội, Hồ Chí Minh, Đà Nẵng,...)
      let fromCity = 'HO CHI MINH';
      let toCity = 'HA NOI';
      let hasExplicitRoute = false;

      const routeRegex = /từ\s+([^,–\->\n]+?)\s+(?:ra|đến|đi|tới|sang|vào)\s+([^,–\->\n\?]+)/i;
      const routeMatch = question.match(routeRegex);

      if (routeMatch) {
        hasExplicitRoute = true;
        fromCity = this.normalizeCityName(routeMatch[1].trim());
        toCity = this.normalizeCityName(routeMatch[2].trim());
      } else if (normalizedQ.includes('ha noi') && (normalizedQ.includes('hcm') || normalizedQ.includes('sai gon') || normalizedQ.includes('ho chi minh'))) {
        hasExplicitRoute = true;
        const hnIdx = normalizedQ.indexOf('ha noi');
        const hcmIdx = Math.max(normalizedQ.indexOf('hcm'), normalizedQ.indexOf('sai gon'), normalizedQ.indexOf('ho chi minh'));
        if (hnIdx < hcmIdx) {
          fromCity = 'HA NOI';
          toCity = 'HO CHI MINH';
        } else {
          fromCity = 'HO CHI MINH';
          toCity = 'HA NOI';
        }
      } else if (normalizedQ.includes('ha noi')) {
        hasExplicitRoute = true;
        fromCity = 'HA NOI';
        toCity = 'HO CHI MINH';
      } else if (normalizedQ.includes('hcm') || normalizedQ.includes('sai gon') || normalizedQ.includes('ho chi minh')) {
        hasExplicitRoute = true;
        fromCity = 'HO CHI MINH';
        toCity = 'HA NOI';
      }

      toolsUsed.push(`calculatePricing(${fromCity}->${toCity}:${weight}kg${dimensionsCm ? `:${length}x${width}x${height}cm` : ''})`);
      const stdPricing = await this.toolsService.calculatePricing(weight, 'STANDARD', fromCity, toCity, 'GUEST', dimensionsCm);
      const expPricing = await this.toolsService.calculatePricing(weight, 'EXPRESS', fromCity, toCity, 'GUEST', dimensionsCm);

      const volumetricWeight = dimensionsCm ? ((length * width * height) / 6000).toFixed(2) : '0';
      const chargeableWeight = dimensionsCm ? Math.max(weight, parseFloat(volumetricWeight)).toFixed(2) : weight.toString();

      toolAugmentedContext += `\n[BẢNG BÁO GIÁ CƯỚC THỜI GIAN THỰC TỪ MICROSERVICE PRICING-SERVICE]:\n` +
        `- Tuyến đường: ${fromCity} ➔ ${toCity} ${hasExplicitRoute ? '' : '(Mặc định ước tính theo trục chính Metro HCM - Hà Nội do khách chưa chỉ định tuyến)'}\n` +
        `- Cân nặng thực tế: ${weight}kg\n` +
        (dimensionsCm ? `- Kích thước bưu kiện: Dài ${length}cm x Rộng ${width}cm x Cao ${height}cm\n- Thể tích quy đổi IATA = (${length}x${width}x${height})/6000 = ${volumetricWeight}kg\n- Cân nặng tính cước (Chargeable Weight) = max(Cân thực tế, Thể tích quy đổi) = ${chargeableWeight}kg\n` : '') +
        `- GÓI TIÊU CHUẨN (Standard Delivery): ${stdPricing.breakdown}\n` +
        `- GÓI NHANH (Express Delivery): ${expPricing.breakdown}\n` +
        `- Công thức tính: Cước cơ sở (0.5kg đầu: 18.000đ) + Cước vượt nấc (mỗi 0.5kg tiếp theo +3.500đ với gói chuẩn, +5.000đ với gói nhanh) + Phụ phí vùng miền Metro (+7.000đ).\n` +
        `- Cước chuyển hoàn bưu gửi: Thu 50% cước chiều đi khi giao không thành công (khách bom hàng).\n`;
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
    const systemPrompt = `Bạn là Trợ lý AI CSKH thông minh của hệ sinh thái Nexus Logistics.
Nhiệm vụ của bạn là hỗ trợ khách hàng và chủ hàng (merchant) tra cứu cước phí, hành trình bưu kiện và giải đáp quy chuẩn bưu chính.
Quy tắc trả lời:
1. Ngôn ngữ: Tiếng Việt chuẩn mực, lịch sự, thân thiện, rõ ràng.
2. Căn cứ: Trả lời DỰA TRÊN NGỮ CẢNH (Context) được cung cấp. Tuyệt đối không tự bịa đặt thông tin.
3. Khi trả lời về cước phí hoặc đền bù, hãy nêu rõ căn cứ chính sách hoặc công thức bồi thường. Nếu có bảng dự toán cước, hãy báo giá đầy đủ cả gói Tiêu chuẩn và Nhanh cùng cước hoàn dự kiến.
4. Nếu ngữ cảnh không có thông tin, hãy thẳng thắn thông báo và hướng dẫn khách gọi tổng đài 1900 0000.
5. QUY TẮC ĐỊNH DẠNG THẨM MỸ (RẤT QUAN TRỌNG):
- TUYỆT ĐỐI KHÔNG dùng dấu nháy đơn ngược (backtick \`) bao quanh bất kỳ từ ngữ nào (ví dụ KHÔNG viết \`PICKED_UP\` hay \`30002004\`). Hãy viết thẳng hoặc đặt trong ngoặc đơn thông thường.
- TUYỆT ĐỐI KHÔNG dùng ba dấu sao (***).
- TUYỆT ĐỐI KHÔNG xuống dòng lẻ loi ngay sau dấu đầu dòng (không bao giờ để một dòng chỉ có • hoặc - hoặc *). Dấu gạch đầu dòng và nội dung PHẢI nằm trên cùng một dòng: ví dụ "• Mã vận đơn: 333423979726".
- Sử dụng các icon emoji trực quan (📦, 📍, 👤, 💰, 🚚, ⏰,...) để câu trả lời sinh động, chuyên nghiệp và thân thiện.`;

    const userPrompt = `DỮ LIỆU NGỮ CẢNH HỆ THỐNG CUNG CẤP:
${context || '(Không tìm thấy tài liệu phù hợp trực tiếp)'}

CÂU HỎI CỦA NGƯỜI DÙNG:
${question}

HÃY ĐƯA RA CÂU TRẢ LỜI ĐẦY ĐỦ VÀ CHÍNH XÁC:`;

    // 1. Ưu tiên sử dụng Google Gemini API nếu có cấu hình GEMINI_API_KEY
    if (this.geminiApiKey) {
      const candidateModels = Array.from(
        new Set([
          'gemini-3-flash-preview',
          'gemini-flash-latest',
          'gemini-flash-lite-latest',
          'gemini-3.1-flash-lite-preview',
          this.geminiModel,
        ].filter(Boolean))
      );

      for (const model of candidateModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;
          const generationConfig: any = {
            temperature: this.temperature,
          };
          if (model.includes('3.6') || model.includes('3.7') || model.includes('3.1')) {
            generationConfig.thinkingConfig = { thinkingBudget: 0 };
          }

          const resp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  parts: [{ text: userPrompt }],
                },
              ],
              generationConfig,
            }),
            signal: AbortSignal.timeout(15000),
          });

          if (resp.ok) {
            const data = (await resp.json()) as any;
            const answerText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answerText) {
              this.logger.log(`Google Gemini (${model}) generated answer successfully.`);
              return this.cleanBotFormatting(answerText);
            }
          } else {
            const errText = await resp.text();
            this.logger.warn(`Google Gemini API error with model ${model} (${resp.status}): ${errText}`);
          }
        } catch (err: any) {
          this.logger.warn(`Google Gemini fetch failed for model ${model}: ${err.message}`);
        }
      }
    }

    // 2. Dự phòng OpenAI API nếu có cấu hình OPENAI_API_KEY
    if (this.apiKey) {
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

        if (resp.ok) {
          const data = (await resp.json()) as any;
          return this.cleanBotFormatting(data.choices[0].message.content);
        } else {
          const errText = await resp.text();
          this.logger.warn(`OpenAI LLM error ${resp.status}: ${errText}`);
        }
      } catch (err: any) {
        this.logger.warn(`OpenAI LLM fetch failed: ${err.message}`);
      }
    }

    // 3. Chế độ Fallback Offline Semantic Demo nếu không có key hoặc lỗi mạng
    return this.cleanBotFormatting(this.generateOfflineDemoAnswer(question, context, citations));
  }

  /**
   * Tối ưu hóa văn bản định dạng: loại bỏ backtick, dấu sao thừa, gộp bullet rớt dòng
   */
  private cleanBotFormatting(text: string): string {
    if (!text) return '';
    let cleaned = text;

    // 1. Loại bỏ hoàn toàn dấu backtick (`) bọc quanh các từ hoặc mã
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    cleaned = cleaned.replace(/`/g, '');

    // 2. Thay thế ba dấu sao trở lên (***) thành chuẩn ** hoặc loại bỏ
    cleaned = cleaned.replace(/\*{3,}/g, '**');

    // 3. Khắc phục lỗi bullet bị rớt dòng đơn độc (ví dụ dòng chỉ có "•" hoặc "-" rồi xuống dòng mới ghi text)
    cleaned = cleaned.replace(/(^|\n)\s*([•\-\*])\s*\n+(\s*)/g, '$1• ');

    // 4. Chuẩn hóa ký tự đầu dòng * hoặc - thành bullet tròn •
    cleaned = cleaned.replace(/^(\s*)[\*\-]\s+/gm, '$1• ');

    // 5. Chuẩn hóa khoảng trống nhiều dòng trống liên tiếp thành tối đa 1 dòng trống
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  }

  private generateOfflineDemoAnswer(question: string, context: string, citations: Citation[]): string {
    const hasRealtimeData = context.includes('=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===');
    let realtimeSection = '';

    if (hasRealtimeData) {
      const match = context.match(
        /=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===\n([\s\S]*?)(=== TÀI LIỆU QUY CHUẨN|$)/
      );
      if (match) {
        realtimeSection = match[1].trim();
      }
    }

    if (realtimeSection) {
      // Làm sạch các chỉ dẫn nội bộ / prompt không để lộ ra giao diện người dùng
      const cleanSection = realtimeSection
        .replace(/- Ghi chú quan trọng cho AI:[\s\S]*?\n/g, '')
        .replace(/- HÃY BÁO GIÁ[\s\S]*?\n/g, '')
        .replace(/\[THÔNG TIN TRA CỨU ĐƠN HÀNG THỰC TẾ CHO MÃ (.*?)\]:/g, '📦 **Chi tiết hành trình vận đơn $1**:')
        .replace(/\[THÔNG TIN ĐƠN HÀNG MỚI TẠO GẦN NHẤT CỦA BẠN(.*?)\]:/g, '📦 **Đơn hàng mới tạo gần nhất của bạn**:')
        .replace(/\[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ (.*?)\]:/g, '🛡️ **Hồ sơ khiếu nại bồi thường $1**:')
        .replace(/\[BẢNG BÁO GIÁ CƯỚC THỜI GIAN THỰC TỪ MICROSERVICE PRICING-SERVICE\]:/g, '💰 **Dự toán cước phí vận chuyển**:')
        .replace(/\[KẾT QUẢ TRA CỨU\]:\s*/g, 'ℹ️ ')
        .trim();

      let citationNote = '';
      if (citations.length > 0) {
        citationNote = `\n\n📖 Căn cứ quy định đối soát [${citations[0].file}]:\n"${citations[0].snippet}"`;
      }

      return `Dạ chào bạn, Nexus Logistics đã hỗ trợ kiểm tra thông tin cho bạn:\n\n` +
        `${cleanSection}${citationNote}`;
    }

    if (!context || citations.length === 0) {
      return `Dạ chào bạn, Nexus Logistics đã ghi nhận câu hỏi: "${question}". Hiện tài liệu hệ thống chưa có dữ liệu chi tiết về câu hỏi này, bạn vui lòng liên hệ tổng đài 1900 0000 để được điện thoại viên hỗ trợ trực tiếp ạ.`;
    }

    const topCitation = citations[0];
    return `Dạ theo quy chuẩn vận hành của Nexus Logistics [${topCitation.file} - ${topCitation.title}]:\n\n` +
      `• ${topCitation.snippet}\n\n` +
      `Nếu bạn cần hỗ trợ chi tiết hơn cho từng đơn hàng cụ thể, vui lòng gửi kèm mã vận đơn để hệ thống tra cứu nhé!`;
  }

  private normalizeCityName(raw: string): string {
    const n = normalizeVietnamese(raw).toLowerCase();
    if (n.includes('ha noi') || n.includes('hn')) return 'HA NOI';
    if (n.includes('hcm') || n.includes('sai gon') || n.includes('ho chi minh')) return 'HO CHI MINH';
    if (n.includes('da nang') || n.includes('dn')) return 'DA NANG';
    if (n.includes('hai phong')) return 'HAI PHONG';
    if (n.includes('can tho')) return 'CAN THO';
    return raw.trim().toUpperCase();
  }
}
