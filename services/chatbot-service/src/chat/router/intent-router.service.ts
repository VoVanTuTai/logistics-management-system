import { Injectable, Logger } from '@nestjs/common';
import {
  ChatSessionContext,
  LlmToolDefinition,
  StructuredIntentName,
  StructuredIntentResult,
} from '../chat.types';
import { ChatRequestDto } from '../dto/chat-request.dto';
import {
  extractClaimCode,
  extractPhone,
  extractTrackingCode,
  normalizeCityName,
  normalizeVietnamese,
} from '../guardrails/carrier-guardrails.service';
import { LlmClientService } from '../llm/llm-client.service';

/**
 * Tool / Function definitions for LLM Structured Intent Routing (Mức 2).
 * Replaces giant brittle regex/if-else chains with semantic Function Calling over multi-turn history.
 */
const ROUTER_TOOLS: LlmToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'track_shipment',
      description:
        'Tra cứu trạng thái, vị trí, lịch sử hành trình của một mã vận đơn cụ thể, HOẶC khi người dùng cung cấp số điện thoại người nhận để mở khóa mã vận đơn đã hỏi trước đó trong hội thoại.',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string', description: 'Mã vận đơn (VD: 333..., 101..., NX-77889900, SPX...)' },
          receiverPhone: { type: 'string', description: 'Số điện thoại người nhận (hoặc 4 số cuối) dùng để xác thực PII' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'follow_up_shipment',
      description:
        'Người dùng hỏi nối tiếp về đơn hàng đang nói đến trong lịch sử chat (VD: "Nó nặng bao nhiêu?", "Tiền COD bao nhiêu?", "Người gửi là ai?", "Giao đến quận nào?", "Khi nào giao?", "Ai phát đơn đó?").',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string', description: 'Mã vận đơn nếu được nhắc lại, hoặc để trống để lấy từ ngữ cảnh phiên' },
          attribute: {
            type: 'string',
            enum: ['weight', 'cod', 'location', 'eta', 'sender', 'receiver', 'address', 'courier', 'timeline', 'general'],
            description: 'Thuộc tính khách đang hỏi về đơn hàng',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_user_shipments',
      description:
        'Khách hàng đã đăng nhập muốn xem danh sách các đơn hàng của họ (VD: "kiểm tra các đơn của tôi", "đơn hàng gần đây", "xem danh sách đơn"). KHÔNG dùng nếu khách hỏi chính sách chung.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_pricing',
      description:
        'Dự toán / báo giá cước vận chuyển cho một lô hàng cụ thể (có tuyến đường hoặc cân nặng/kích thước, hoặc đang trả lời tiếp cho luồng hỏi giá).',
      parameters: {
        type: 'object',
        properties: {
          fromCity: { type: 'string', description: 'Tỉnh/thành gửi (VD: HO CHI MINH, HA NOI, DA NANG)' },
          toCity: { type: 'string', description: 'Tỉnh/thành nhận' },
          weightKg: { type: 'number', description: 'Cân nặng quy đổi ra kg' },
          lengthCm: { type: 'number' },
          widthCm: { type: 'number' },
          heightCm: { type: 'number' },
          needsClarification: { type: 'boolean', description: 'true nếu khách chỉ hỏi giá chung chung chưa nêu tuyến và cân nặng' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_return_fee',
      description: 'Hỏi hoặc tính phí chuyển hoàn / cước hoàn hàng khi giao thất bại hoặc trả hàng về cho shop.',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' },
          fromCity: { type: 'string' },
          weightKg: { type: 'number' },
          shippingFee: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_shipment',
      description:
        'Khách yêu cầu hủy đơn hàng, hoặc đang xác nhận/từ chối hủy đơn trong bước HITL trước đó (VD: "hủy đơn đó đi", "đồng ý hủy", "thôi giữ lại đừng hủy").',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' },
          confirmed: { type: 'boolean', description: 'true nếu khách xác nhận đồng ý hủy sau khi hệ thống hỏi lại' },
          keepOrder: { type: 'boolean', description: 'true nếu khách đổi ý muốn giữ lại đơn, không hủy nữa' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_delivery_address',
      description: 'Khách yêu cầu đổi địa chỉ giao hàng hoặc đang xác nhận đổi địa chỉ trong bước HITL.',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' },
          newAddress: { type: 'string', description: 'Địa chỉ giao hàng mới chi tiết' },
          confirmed: { type: 'boolean', description: 'true nếu khách xác nhận thay đổi sau bước HITL' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_consignee',
      description: 'Khách yêu cầu đổi người nhận hàng hộ / đổi SĐT người nhận tại cùng địa chỉ giao hàng.',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' },
          newReceiverName: { type: 'string' },
          newReceiverPhone: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_redelivery',
      description: 'Khách hẹn lại lịch/khung giờ/ngày giao hàng hoặc báo bận/cuộc gọi nhỡ muốn bưu tá gọi lại phát lại.',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' },
          preferredTime: { type: 'string', description: 'Thời gian khách hẹn nhận lại (VD: Ngày mai, 14:00 Chiều nay, Sáng mai...)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hold_at_hub',
      description: 'Khách muốn giữ hàng tại bưu cục phát (PUDO) để tự ghé qua quầy nhận hàng.',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' },
          pickupTime: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'audit_delivery_attempt',
      description: 'Kiểm toán cuộc gọi/GPS của shipper chống bắn trạng thái ma, hoặc hỏi chính sách chống shipper gian lận cuộc gọi.',
      parameters: {
        type: 'object',
        properties: {
          trackingCode: { type: 'string' },
          isPolicyQuestion: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'track_claim',
      description: 'Tra cứu hồ sơ khiếu nại/bồi thường (CLM-...) hoặc báo cáo kiện hàng thực tế bị hư hỏng/móp méo/bể vỡ/thất lạc.',
      parameters: {
        type: 'object',
        properties: {
          claimCode: { type: 'string' },
          trackingCode: { type: 'string' },
          isDamageReport: { type: 'boolean', description: 'true nếu khách đang phản ánh đơn hàng của chính họ bị vỡ/hư hỏng/mất hàng' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_order_flow',
      description: 'Khách muốn tạo đơn / gửi hàng mới, hỏi về cách tạo đơn, hoặc hủy biểu mẫu đang tạo đơn.',
      parameters: {
        type: 'object',
        properties: {
          stepAction: {
            type: 'string',
            enum: ['OPEN_FORM', 'INQUIRY', 'CANCEL_FORM'],
            description: 'OPEN_FORM nếu muốn mở form tạo đơn ngay; INQUIRY nếu mới hỏi tham khảo; CANCEL_FORM nếu hủy form',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description: 'Khách yêu cầu gặp nhân viên thật / CSKH / tổng đài viên / khiếu nại khẩn cấp.',
      parameters: {
        type: 'object',
        properties: { reason: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'storage_aging_policy',
      description: 'Hỏi quy định thời hạn lưu kho miễn phí, phí lưu kho, hoặc xử lý hàng tồn kho quá hạn / vô chủ.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'waybill_format_policy',
      description: 'Hỏi quy chuẩn cấu trúc dải mã vận đơn và mã định tuyến 3 đoạn.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'user_identity',
      description: 'Khách hỏi thông tin tài khoản hiện tại của chính họ ("tôi là ai", "tên tôi là gì", "kiểm tra tài khoản").',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'greeting',
      description: 'Câu chào hỏi xã giao đơn thuần ("xin chào", "hello", "em ơi") không kèm yêu cầu nghiệp vụ khác.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'out_of_domain',
      description: 'Câu hỏi hoàn toàn ngoài lĩnh vực bưu chính/logistics (chứng khoán, crypto, nấu ăn, thời tiết, bóng đá, chính trị...).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'answer_policy_rag',
      description:
        'Mọi câu hỏi về chính sách chung, SOP đóng gói, phân loại 5 nhóm mặt hàng, quy định COD, bảo hiểm, bồi thường Luật Bưu chính Điều 25 / NĐ47, cước nấc cơ sở chung, hạ tầng giao thông, câu hỏi tham khảo cách tra cứu đơn hàng.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
        },
      },
    },
  },
];

const TOOL_NAME_TO_INTENT: Record<string, StructuredIntentName> = {
  track_shipment: 'TRACK_SHIPMENT',
  follow_up_shipment: 'FOLLOW_UP_SHIPMENT',
  list_user_shipments: 'LIST_USER_SHIPMENTS',
  calculate_pricing: 'CALCULATE_PRICING',
  calculate_return_fee: 'RETURN_FEE',
  cancel_shipment: 'CANCEL_SHIPMENT',
  change_delivery_address: 'CHANGE_ADDRESS',
  change_consignee: 'CHANGE_CONSIGNEE',
  schedule_redelivery: 'SCHEDULE_REDELIVERY',
  hold_at_hub: 'HOLD_AT_HUB',
  audit_delivery_attempt: 'AUDIT_DELIVERY_ATTEMPT',
  track_claim: 'TRACK_CLAIM',
  create_order_flow: 'CREATE_ORDER',
  escalate_to_human: 'ESCALATE_HUMAN',
  storage_aging_policy: 'STORAGE_AGING_POLICY',
  waybill_format_policy: 'WAYBILL_FORMAT_POLICY',
  user_identity: 'USER_IDENTITY',
  greeting: 'GREETING',
  out_of_domain: 'OUT_OF_DOMAIN',
  answer_policy_rag: 'KNOWLEDGE_RAG',
};

/**
 * Semantic Intent Router powered by LLM Function Calling over full multi-turn conversation history,
 * with clean deterministic fallback for key-free / offline execution.
 */
@Injectable()
export class IntentRouterService {
  private readonly logger = new Logger(IntentRouterService.name);

  constructor(private readonly llmClient: LlmClientService) {}

  async route(dto: ChatRequestDto, session: ChatSessionContext): Promise<StructuredIntentResult> {
    // 1. Explicit UI action buttons always bypass LLM routing for 0ms precision
    if (dto.action === 'OPEN_ORDER_FORM' || dto.action === 'SUBMIT_ORDER_FORM' || dto.action === 'CONFIRM_ORDER' || dto.action === 'CANCEL_ORDER') {
      return {
        intent: 'CREATE_ORDER',
        confidence: 1.0,
        params: { uiAction: dto.action },
        source: 'explicit-action',
      };
    }

    const question = (dto.message || '').trim();
    const extractedCode = extractTrackingCode(question);
    const extractedPhone = dto.receiverPhone || extractPhone(question);
    const extractedClaim = extractClaimCode(question);

    // 2. Pending HITL confirmation / multi-turn slot continuation fast check before calling router
    const normalizedQ = normalizeVietnamese(question);
    const isShortConfirmation =
      normalizedQ.length <= 60 &&
      /\b(?:dong y|xac nhan|chac chan|ok huy|huy di|tien hanh huy|co huy|doi di|ok doi|chot)\b/i.test(normalizedQ);
    const isKeepOrder =
      normalizedQ.length <= 80 &&
      (/\b(?:khong huy|dung huy|thoi huy|giu lai|khong muon huy)\b/i.test(normalizedQ) ||
        (session.pendingIntent === 'CANCEL' && /\b(?:khong|thoi|huy yeu cau)\b/i.test(normalizedQ)));

    if (session.pendingIntent === 'CANCEL' && (isShortConfirmation || isKeepOrder)) {
      return {
        intent: 'CANCEL_SHIPMENT',
        confidence: 0.99,
        params: {
          trackingCode: extractedCode || session.selectedCode,
          confirmed: isShortConfirmation && !isKeepOrder,
          keepOrder: isKeepOrder,
        },
        source: 'deterministic-fallback',
      };
    }

    if (session.pendingIntent === 'CHANGE_ADDRESS' && isShortConfirmation) {
      return {
        intent: 'CHANGE_ADDRESS',
        confidence: 0.99,
        params: {
          trackingCode: extractedCode || session.selectedCode,
          newAddress: session.pendingData?.newAddress,
          confirmed: true,
        },
        source: 'deterministic-fallback',
      };
    }

    // 3. LLM Native Function Calling / Structured Router with Full History
    if (this.llmClient.hasAnyLlmKey()) {
      const sessionHint = [
        `selectedCode=${session.selectedCode || dto.selectedShipmentCode || 'NONE'}`,
        `receiverPhone=${session.receiverPhone || dto.receiverPhone || 'NONE'}`,
        `pendingIntent=${session.pendingIntent || 'NONE'}`,
        `senderRole=${dto.senderRole || 'GUEST'}`,
        `userId=${dto.userId || 'GUEST'}`,
        session.pendingData ? `pendingData=${JSON.stringify(session.pendingData)}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const routerSystemPrompt =
        `Bạn là Intent Router thông minh của Nexus Logistics. Hãy chọn CHÍNH XÁC 1 function tool phù hợp nhất với ý định thực sự của người dùng dựa trên TOÀN BỘ LỊCH SỬ HỘI THOẠI.\n` +
        `Ngữ cảnh phiên hiện tại: [${sessionHint}]\n` +
        `Nguyên tắc chọn tool:\n` +
        `1. Nếu khách hỏi nối tiếp thông số đơn đang nói ("nó nặng bao nhiêu", "của ai", "khi nào giao", "đến đâu rồi") và đã có selectedCode -> gọi follow_up_shipment.\n` +
        `2. Nếu khách hỏi giả định hoặc chính sách nối tiếp gắn với đơn hàng ("thế nếu vỡ thì sao?", "lỡ bom hàng mất phí không?", "bồi thường thế nào?") -> gọi answer_policy_rag (hệ thống sẽ tự viết lại câu hỏi kèm ngữ cảnh đơn).\n` +
        `3. Nếu trước đó bot vừa yêu cầu SĐT người nhận cho đơn selectedCode và giờ khách gửi SĐT -> gọi track_shipment với trackingCode=selectedCode và receiverPhone.\n` +
        `4. Nếu khách hỏi chính sách chung (COD có mất phí không, Luật Bưu chính Điều 25, cách tra cứu đơn hàng cho khách vãng lai...) -> gọi answer_policy_rag.\n` +
        `5. Nếu khách viết sai chính tả, nói lóng, đảo ngữ ("ship giùm tui 3 kí từ sg ra huế nhiu xèng") -> bóc tham số vào calculate_pricing; nếu đang pendingIntent=PRICING thì gộp thêm thông tin mới.\n` +
        `6. Nếu khách yêu cầu hủy đơn lần đầu chưa xác nhận rõ -> confirmed=false.`;

      const decision = await this.llmClient.callToolRouter(
        routerSystemPrompt,
        question,
        session.history,
        ROUTER_TOOLS,
      );

      if (decision && TOOL_NAME_TO_INTENT[decision.toolName]) {
        const mappedIntent = TOOL_NAME_TO_INTENT[decision.toolName];
        const params = { ...decision.args };

        // Enrich with deterministic regex safety-nets for IDs & phones so LLM never hallucinates a tracking code digit
        if (extractedCode && !params.trackingCode) params.trackingCode = extractedCode;
        if (extractedPhone && !params.receiverPhone && mappedIntent === 'TRACK_SHIPMENT') {
          params.receiverPhone = extractedPhone;
        }
        if (extractedClaim && !params.claimCode) params.claimCode = extractedClaim;
        if (params.fromCity) params.fromCity = normalizeCityName(String(params.fromCity));
        if (params.toCity) params.toCity = normalizeCityName(String(params.toCity));

        this.logger.log(
          `LLM Router [${decision.provider}:${decision.modelUsed}] -> ${mappedIntent} ${JSON.stringify(params)}`,
        );

        return {
          intent: mappedIntent,
          confidence: 0.95,
          params,
          source: 'llm-tool-calling',
        };
      }
    }

    // 4. Graceful Deterministic Fallback (when offline / no LLM keys / router timeout)
    return this.fallbackDeterministicRoute(dto, session);
  }

  /**
   * Compact fallback intent detector when no LLM key is configured or provider times out.
   */
  fallbackDeterministicRoute(dto: ChatRequestDto, session: ChatSessionContext): StructuredIntentResult {
    const q = (dto.message || '').trim();
    const nq = normalizeVietnamese(q);
    const trackingCode = extractTrackingCode(q);
    const phone = dto.receiverPhone || extractPhone(q);
    const claimCode = extractClaimCode(q);

    const wrap = (intent: StructuredIntentName, params: Record<string, any> = {}): StructuredIntentResult => ({
      intent,
      confidence: 0.75,
      params,
      source: 'deterministic-fallback',
    });

    if (/\b(?:chung khoan|vn-index|gia vang|co phieu|bitcoin|crypto|thoi tiet|bong da|chinh tri|pho bo|nau an|cong thuc nau)\b/i.test(nq)) {
      return wrap('OUT_OF_DOMAIN');
    }

    if (/^(?:xin chao|chao|chao em|chao shop|hi|hello|hey|alo|good morning|good afternoon|chao ad|chao buu cuc)(?:\s+.*)?$/i.test(nq) && nq.length <= 45) {
      return wrap('GREETING');
    }

    if (/\b(?:toi la ai|ten toi la gi|thong tin tai khoan|tai khoan cua toi|ho so cua toi|profile cua toi|dang nhap chua|toi dang dang nhap)\b/i.test(nq) && !nq.includes('huy')) {
      return wrap('USER_IDENTITY');
    }

    if (/\b(?:gap nhan vien|nhan vien that|tu van vien|nguoi that|tong dai|chuyen cho nhan vien|ho tro truc tiep)\b/i.test(nq)) {
      return wrap('ESCALATE_HUMAN');
    }

    if (/\b(?:khong huy|dung huy|thoi huy|giu lai|khong muon huy)\b/i.test(nq)) {
      return wrap('CANCEL_SHIPMENT', { keepOrder: true, trackingCode: trackingCode || session.selectedCode });
    }

    if (/\b(?:huy don|huy van don|khong gui nua|cancel order|huy giup|muon huy|huy don hang|huy ma)\b/i.test(nq) || (session.pendingIntent === 'CANCEL' && /\b(?:dong y|xac nhan|huy di)\b/i.test(nq))) {
      return wrap('CANCEL_SHIPMENT', {
        trackingCode: trackingCode || session.selectedCode,
        confirmed: /\b(?:dong y|xac nhan|chac chan|ok huy|huy di)\b/i.test(nq),
      });
    }

    if (/\b(?:doi nguoi nhan|nhan ho|uy quyen nhan|chuyen nguoi nhan|thay nguoi nhan|nho.*nhan ho)\b/i.test(nq) && !nq.includes('cod')) {
      return wrap('CHANGE_CONSIGNEE', {
        trackingCode: trackingCode || session.selectedCode,
        newReceiverPhone: phone,
      });
    }

    if (/\b(?:doi dia chi|chuyen dia chi|sua dia chi|giao sang dia chi|giao qua dia chi|cap nhat dia chi|thay doi dia chi)\b/i.test(nq) || session.pendingIntent === 'CHANGE_ADDRESS') {
      return wrap('CHANGE_ADDRESS', {
        trackingCode: trackingCode || session.selectedCode,
        confirmed: /\b(?:dong y|xac nhan)\b/i.test(nq),
      });
    }

    if (/\b(?:giu tai buu cuc|ra buu cuc lay|tu den lay|ghe buu cuc|pudo|hold at hub|tu qua buu cuc)\b/i.test(nq) || (nq.includes('gui tai quầy') || nq.includes('gui tai quay'))) {
      return wrap('HOLD_AT_HUB', { trackingCode: trackingCode || session.selectedCode });
    }

    if (/\b(?:ban trang thai ma|kiem toan cuoc goi|chong gia mao|audit|khong lien lac duoc|shipper bao khong nghe)\b/i.test(nq)) {
      return wrap('AUDIT_DELIVERY_ATTEMPT', {
        trackingCode: trackingCode || session.selectedCode,
        isPolicyQuestion: !trackingCode && (nq.includes('quy chuan') || nq.includes('lam sao') || nq.includes('nhu the nao')),
      });
    }

    if (/\b(?:hen giao lai|giao lai|ngay mai giao|chieu giao|doi lich giao|cuoc goi nho|goi nho|luc nay ban|hop khong nghe|goi lai giao)\b/i.test(nq)) {
      return wrap('SCHEDULE_REDELIVERY', { trackingCode: trackingCode || session.selectedCode });
    }

    if (claimCode || /\b(?:ho so boi thuong|tien do boi thuong|clm-|vo nat|be vo|mop meo|hu hong|thieu hang|mat hang|lap ho so boi thuong)\b/i.test(nq)) {
      const isPolicyOrHypothetical =
        /\b(?:chinh sach|quy dinh|quy trinh|ty le boi thuong|bao nhieu|nhu the nao|neu|the neu|thi sao)\b/i.test(nq) &&
        !claimCode &&
        !nq.includes('da bi') &&
        !nq.includes('vua mo') &&
        !nq.includes('gui anh');
      if (!isPolicyOrHypothetical) {
        return wrap('TRACK_CLAIM', { claimCode, trackingCode: trackingCode || session.selectedCode, isDamageReport: !claimCode });
      }
      return wrap('KNOWLEDGE_RAG');
    }

    if (/\b(?:tao don|dat don|gui hang moi|gui don moi|huy tao don|khong tao don nua)\b/i.test(nq)) {
      const cancelForm = nq.includes('huy tao don') || nq.includes('khong tao don') || nq.includes('thoi khong gui');
      const openForm = nq === 'tao don' || nq === 'tao don ngay' || nq === 'toi muon tao don' || nq === 'toi muon tao don hang' || nq === 'toi muon gui hang moi' || nq.includes('mo bieu mau');
      return wrap('CREATE_ORDER', { stepAction: cancelForm ? 'CANCEL_FORM' : openForm ? 'OPEN_FORM' : 'INQUIRY' });
    }

    if (/\b(?:phi hoan|cuoc hoan|chuyen hoàn|chuyen hoan|hoan ve|hoan hang|tra ve nguoi gui|giao 3 lan that bai)\b/i.test(nq) && (nq.includes('phi') || nq.includes('cuoc') || nq.includes('bao nhieu') || nq.includes('tinh'))) {
      return wrap('RETURN_FEE', { trackingCode: trackingCode || session.selectedCode });
    }

    if ((nq.includes('luu kho') || nq.includes('qua han') || nq.includes('vo chu')) && (nq.includes('bao lau') || nq.includes('ngay') || nq.includes('quy dinh') || nq.includes('phi') || nq.includes('xu ly'))) {
      return wrap('STORAGE_AGING_POLICY');
    }

    if ((nq.includes('ma van don') || nq.includes('dai ma') || nq.includes('dinh tuyen')) && (nq.includes('cau truc') || nq.includes('quy hoach') || nq.includes('y nghia') || nq.includes('3 doan'))) {
      return wrap('WAYBILL_FORMAT_POLICY');
    }

    // Track specific code OR unlock session code with receiver phone
    if (trackingCode || (phone && session.selectedCode && !nq.includes('tao don'))) {
      return wrap('TRACK_SHIPMENT', { trackingCode: trackingCode || session.selectedCode, receiverPhone: phone });
    }

    // Follow-up about previously tracked order
    if (
      session.selectedCode &&
      (/\b(?:don nay|don do|no|kien do|van don do|kien nay|don vua roi|don tren)\b/i.test(nq) ||
        /\b(?:nang bao nhieu|khoi luong|cod|thu ho|o dau|den dau|bao gio|khi nao|nguoi nhan|nguoi gui|dia chi|quan nao|sdt|buu ta|shipper|hanh trinh)\b/i.test(nq)) &&
      !/\b(?:chinh sach|quy dinh|dieu 25|luat buu chinh)\b/i.test(nq)
    ) {
      return wrap('FOLLOW_UP_SHIPMENT', { trackingCode: session.selectedCode, attribute: 'general' });
    }

    if (/\b(?:don cua toi|don hang cua toi|cac don|danh sach don|don gan day|don moi|toi co nhung don)\b/i.test(nq)) {
      return wrap('LIST_USER_SHIPMENTS');
    }

    const hasPricingKeywords =
      /\b(?:cuoc|phi van chuyen|phi ship|cuoc phi|du toan|uoc tinh|tinh phi|tinh cuoc|bao gia|gia cuoc)\b/i.test(nq) ||
      (/\b(?:kg|kilogram|gram|g|x)\b/i.test(nq) && /\b(?:ha noi|hcm|sai gon|da nang|tu|den|di)\b/i.test(nq));
    const isSopPolicyQuestion = /\b(?:chinh sach|quy dinh|luat buu chinh|dieu 25|ty le boi thuong|co mat phi|mien phi|gia co so|nac co so)\b/i.test(nq);

    if ((hasPricingKeywords && !isSopPolicyQuestion) || session.pendingIntent === 'PRICING') {
      return wrap('CALCULATE_PRICING', this.extractPricingParamsFallback(q, nq));
    }

    return wrap('KNOWLEDGE_RAG');
  }

  private extractPricingParamsFallback(q: string, nq: string): Record<string, any> {
    const params: Record<string, any> = {};
    const weightMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(kg|kí|ki|kilogram|g|gram)(?![a-zA-ZÀ-ỹ0-9_])/i);
    if (weightMatch) {
      let val = parseFloat(weightMatch[1].replace(',', '.'));
      if (weightMatch[2].toLowerCase().startsWith('g')) val /= 1000;
      params.weightKg = Math.max(0.1, val);
    }

    const dimMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:x|\*)\s*(\d+(?:[.,]\d+)?)\s*(?:x|\*)\s*(\d+(?:[.,]\d+)?)/i);
    if (dimMatch) {
      params.lengthCm = parseFloat(dimMatch[1].replace(',', '.'));
      params.widthCm = parseFloat(dimMatch[2].replace(',', '.'));
      params.heightCm = parseFloat(dimMatch[3].replace(',', '.'));
    }

    const routeMatch = q.match(/từ\s+([^,–\->\n]+?)\s+(?:ra|đến|đi|tới|sang|vào)\s+([^,–\->\n\?\.]+?)(?:\s+(?:cước|giá|phí|nặng|gửi|với|thế|bao nhiêu)|$)/i);
    if (routeMatch) {
      params.fromCity = normalizeCityName(routeMatch[1]);
      params.toCity = normalizeCityName(routeMatch[2]);
    } else {
      const hasHcm = nq.includes('hcm') || nq.includes('sai gon') || nq.includes('ho chi minh');
      const hasHn = nq.includes('ha noi');
      if (hasHcm && hasHn) {
        const hcmIdx = Math.max(nq.indexOf('hcm'), nq.indexOf('sai gon'), nq.indexOf('ho chi minh'));
        const hnIdx = nq.indexOf('ha noi');
        params.fromCity = hnIdx < hcmIdx ? 'HA NOI' : 'HO CHI MINH';
        params.toCity = hnIdx < hcmIdx ? 'HO CHI MINH' : 'HA NOI';
      } else if (hasHn) {
        params.fromCity = 'HA NOI';
      } else if (hasHcm) {
        params.fromCity = 'HO CHI MINH';
      } else if (nq.includes('da nang')) {
        params.fromCity = 'DA NANG';
      }
    }

    return params;
  }
}
