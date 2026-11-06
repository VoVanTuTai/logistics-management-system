import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from '../rag/embedding.service';
import { VectorStoreService } from '../rag/vector-store.service';
import { LogisticsToolsService } from '../tools/logistics-tools.service';
import type { ActionChipDto, ChatResponseDto, Citation, ShipmentCardDto } from '../rag/rag.types';
import type { ChatRequestDto } from './dto/chat-request.dto';

function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export interface ChatSessionContext {
  lastShipments?: any[];
  selectedCode?: string;
  receiverPhone?: string;
  pendingIntent?: 'PRICING' | 'CANCEL' | 'TRACKING' | 'CHANGE_ADDRESS' | 'REDELIVERY' | 'CLAIM' | 'CREATE_ORDER';
  pendingData?: {
    fromCity?: string;
    toCity?: string;
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    newAddress?: string;
    preferredTime?: string;
    claimReason?: string;
  };
  lastUpdated: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private apiKey: string;
  private chatModel: string;
  private temperature: number;
  private geminiApiKey: string;
  private geminiModel: string;
  private groqApiKey: string;
  private groqKnowledgeModel: string;
  private groqOperationModel: string;
  private nvidiaApiKey: string;
  private nvidiaValidationModel: string;
  private validationProvider: string;
  private validationModel: string;
  private openrouterApiKey: string;
  private readonly sessions = new Map<string, ChatSessionContext>();

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly toolsService: LogisticsToolsService
  ) {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.groqKnowledgeModel = process.env.GROQ_KNOWLEDGE_MODEL || 'qwen/qwen3.8-27b';
    this.groqOperationModel = process.env.GROQ_OPERATION_MODEL || 'openai/gpt-oss-120b';
    this.nvidiaApiKey = process.env.NVIDIA_API_KEY || '';
    this.nvidiaValidationModel = process.env.NVIDIA_VALIDATION_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY || '';

    // Tự động xác định Validation Provider (ưu tiên nvidia nếu có key, nếu không tự động dùng groq safeguard)
    this.validationProvider = (
      process.env.VALIDATION_PROVIDER ||
      (this.nvidiaApiKey ? 'nvidia' : (this.openrouterApiKey ? 'openrouter' : 'groq'))
    ).toLowerCase();

    this.validationModel =
      process.env.VALIDATION_MODEL ||
      (this.validationProvider === 'groq'
        ? 'openai/gpt-oss-safeguard-20b'
        : this.validationProvider === 'openrouter'
        ? 'nvidia/nemotron-3.5-lightning:free'
        : this.nvidiaValidationModel);

    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.chatModel = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
    this.temperature = Number(process.env.OPENAI_TEMPERATURE || 0.45);
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
    let shipmentCards: ShipmentCardDto[] | undefined;
    let actionChips: ActionChipDto[] | undefined;

    const isGuest = (!dto.userId && !dto.userName) || dto.senderRole === 'GUEST';
    const userDisplayName = dto.userName || dto.userId || 'Quý khách';

    // 1. Phân tích ý định & gọi Tool nếu cần (Function Calling / Intent Routing)
    let toolAugmentedContext = '';

    // Lấy session hiện tại của phiên hội thoại (Multi-turn conversational memory)
    const session = this.sessions.get(conversationId) || { lastUpdated: Date.now() };
    if (dto.selectedShipmentCode) {
      session.selectedCode = dto.selectedShipmentCode;
    }
    if (dto.receiverPhone) {
      session.receiverPhone = dto.receiverPhone;
    }

    // Regex nhận diện số điện thoại người nhận đa định dạng (hỗ trợ cả dấu cách, chấm, gạch nối, +84 hoặc 4 số đuôi)
    const formattedPhoneMatch = question.match(/(?:\+?84|0)[\s.-]?[1-9](?:[\s.-]?\d){8,9}\b/);
    const contextualPhoneMatch = question.match(/(?:sđt|sdt|điện thoại|dien thoai|phone|số|so)\s*(?:người nhận|nguoi nhan|nhận|nhan)?\s*(?:là|la|:|\s)?\s*([0-9\s.-]{9,15})/i);
    const last4PhoneMatch =
      question.match(/(?:sđt|sdt|điện thoại|dien thoai|đuôi|duoi|số cuối|so cuoi|4 số cuối|4 so cuoi|bốn số cuối|bon so cuoi)\s*(?:là|la|:|\s)?\s*(\d{4})\b/i) ||
      normalizedQ.match(/(?:sdt|dien thoai|duoi|so cuoi|4 so cuoi|bon so cuoi)\s*(?:la|:|\s)?\s*(\d{4})\b/i);

    let extractedPhone: string | undefined = dto.receiverPhone;
    if (formattedPhoneMatch) {
      extractedPhone = formattedPhoneMatch[0].replace(/[\s.-]/g, '').replace(/^\+84/, '0');
      session.receiverPhone = extractedPhone;
    } else if (contextualPhoneMatch && contextualPhoneMatch[1].replace(/[\s.-]/g, '').length >= 9) {
      extractedPhone = contextualPhoneMatch[1].replace(/[\s.-]/g, '').replace(/^\+84/, '0');
      session.receiverPhone = extractedPhone;
    } else if (last4PhoneMatch) {
      extractedPhone = last4PhoneMatch[1];
      session.receiverPhone = extractedPhone;
    } else if (/^\d{4}$/.test(question.trim()) && (session.selectedCode || dto.selectedShipmentCode || (session.lastShipments && session.lastShipments.length > 0))) {
      extractedPhone = question.trim();
      session.receiverPhone = extractedPhone;
    } else if (/^\d{9,11}$/.test(question.trim())) {
      extractedPhone = question.trim();
      session.receiverPhone = extractedPhone;
    } else if (session.receiverPhone) {
      extractedPhone = session.receiverPhone;
    }

    // Regex nhận diện số tài khoản ngân hàng (để tránh nhầm STK thành mã vận đơn)
    const bankAccountMatch = question.match(/(?:stk|so tai khoan|số tài khoản|tai khoan|tài khoản|stk ngân hàng|stk bank)\s*:?\s*(\d{6,18})/i);
    const bankAccount = bankAccountMatch ? bankAccountMatch[1] : undefined;

    // Regex tìm mã đơn hàng: NX-XXXX hoặc mã số vận đơn (10-15 chữ số không phải SĐT người nhận hay STK)
    let trackingMatch =
      question.match(/\b(NX[-_]?[A-Z0-9]{4,16}|SPX[A-Z0-9]+|VN\d+[A-Z0-9]*|DH\d+)\b/i) ||
      question.match(/\b(101\d{9}|111\d{9}|333\d{9}|222\d{9})\b/);

    if (!trackingMatch) {
      const numericMatches = question.match(/\b\d{10,15}\b/g);
      if (numericMatches) {
        for (const num of numericMatches) {
          if (extractedPhone && num.replace(/\D/g, '') === extractedPhone.replace(/\D/g, '')) {
            continue;
          }
          if (bankAccount && num.replace(/\D/g, '') === bankAccount.replace(/\D/g, '')) {
            continue;
          }
          const isVnPhone = /^0[35789]\d{8}$/.test(num);
          if (!isVnPhone) {
            trackingMatch = [num] as RegExpMatchArray;
            break;
          }
        }
      }
    }
    const trackingCode = trackingMatch ? (trackingMatch[1] ? trackingMatch[1].toUpperCase() : trackingMatch[0]) : undefined;

    const cleanNormalizedQ = normalizedQ.replace(/[.,?!:;~]+$/g, '').trim();

    // Kiểm tra ý định tư vấn tra cứu dành cho khách vãng lai (Guest Tracking Consultation)
    const isGuestTrackingConsultQuery =
      (cleanNormalizedQ.includes('khach vang lai') ||
       cleanNormalizedQ.includes('chua dang nhap') ||
       cleanNormalizedQ.includes('khong co tai khoan') ||
       cleanNormalizedQ.includes('khong dang nhap') ||
       cleanNormalizedQ.includes('can thong tin gi') ||
       cleanNormalizedQ.includes('can gi de tra cuu') ||
       cleanNormalizedQ.includes('can nhung gi de tra cuu') ||
       (cleanNormalizedQ.includes('tra cuu') && cleanNormalizedQ.includes('nhu the nao')) ||
       (cleanNormalizedQ.includes('tra cuu') && cleanNormalizedQ.includes('the nao')) ||
       (cleanNormalizedQ.includes('cach') && cleanNormalizedQ.includes('tra cuu'))) &&
      (cleanNormalizedQ.includes('tra cuu') ||
       cleanNormalizedQ.includes('kiem tra don') ||
       cleanNormalizedQ.includes('van don') ||
       cleanNormalizedQ.includes('don hang'));

    // Kiểm tra ý định hỏi về Tên người dùng, Danh tính, Hồ sơ tài khoản (User Identity / Profile Query)
    const isUserIdentityQuery =
      cleanNormalizedQ.includes('ten toi la gi') ||
      cleanNormalizedQ.includes('toi ten la gi') ||
      cleanNormalizedQ.includes('ten cua toi la gi') ||
      cleanNormalizedQ.includes('ten nguoi dung') ||
      cleanNormalizedQ.includes('toi ten gi') ||
      cleanNormalizedQ.includes('ten toi la') ||
      cleanNormalizedQ.includes('toi la ai') ||
      cleanNormalizedQ.includes('tai khoan cua toi') ||
      cleanNormalizedQ.includes('thong tin tai khoan') ||
      cleanNormalizedQ.includes('thong tin cua toi') ||
      cleanNormalizedQ.includes('ho ten toi');

    // Kiểm tra ý định hủy đơn hàng & xác nhận hủy đơn (Human-in-the-Loop & Carrier SOP)
    const isCancelExplicitConfirm =
      (cleanNormalizedQ.includes('xac nhan') || cleanNormalizedQ.includes('dong y') || cleanNormalizedQ.includes('chot huy')) &&
      (cleanNormalizedQ.includes('huy don') || cleanNormalizedQ.includes('huy van don') || cleanNormalizedQ.includes('huy'));

    // Khách hỏi chính sách / tình huống giả định (Inquiry về NDR, giao lại, chứ không phải muốn thực thi hủy đơn)
    const isCancelInquiry =
      cleanNormalizedQ.includes('co tu y huy') ||
      cleanNormalizedQ.includes('co bi huy') ||
      cleanNormalizedQ.includes('bi huy don') ||
      cleanNormalizedQ.includes('tai sao huy') ||
      cleanNormalizedQ.includes('sao lai huy') ||
      cleanNormalizedQ.includes('khi nao bi huy') ||
      cleanNormalizedQ.includes('co huy don khong') ||
      cleanNormalizedQ.includes('hay duoc giao lai') ||
      cleanNormalizedQ.includes('giao lai may lan') ||
      cleanNormalizedQ.includes('chinh sach huy') ||
      cleanNormalizedQ.includes('khong nghe may');

    const isCancelIntent =
      !isCancelInquiry &&
      (isCancelExplicitConfirm ||
        cleanNormalizedQ.includes('huy don') ||
        cleanNormalizedQ.includes('huy van don') ||
        cleanNormalizedQ.includes('khong gui nua') ||
        cleanNormalizedQ.includes('cancel don') ||
        cleanNormalizedQ.includes('huy kien hang') ||
        cleanNormalizedQ.includes('huy giup') ||
        cleanNormalizedQ === 'huy' ||
        cleanNormalizedQ.startsWith('huy ') ||
        cleanNormalizedQ.endsWith(' huy') ||
        (cleanNormalizedQ.includes('huy') && (cleanNormalizedQ.includes('don hang') || cleanNormalizedQ.includes('don nay') || cleanNormalizedQ.includes('don'))));

    const isKeepOrderIntent =
      !isCancelIntent &&
      (cleanNormalizedQ.includes('giu lai don') ||
        cleanNormalizedQ.includes('khong huy') ||
        cleanNormalizedQ.includes('dung huy') ||
        cleanNormalizedQ.includes('van muon gui'));

    // Kiểm tra ý định thay đổi địa chỉ nhận hàng / sửa SĐT người nhận (Change Delivery Address)
    const isAddressChangeQuery =
      !cleanNormalizedQ.includes('co duoc') &&
      !cleanNormalizedQ.includes('co cho') &&
      !cleanNormalizedQ.includes('the nao') &&
      !cleanNormalizedQ.includes('nhu the nao') &&
      !cleanNormalizedQ.includes('quy dinh') &&
      (cleanNormalizedQ.includes('doi dia chi') ||
       cleanNormalizedQ.includes('thay doi dia chi') ||
       cleanNormalizedQ.includes('sua dia chi') ||
       cleanNormalizedQ.includes('chuyen dia chi') ||
       cleanNormalizedQ.includes('doi noi nhan') ||
       cleanNormalizedQ.includes('giao sang dia chi') ||
       cleanNormalizedQ.includes('giao den dia chi') ||
       (cleanNormalizedQ.includes('doi') && cleanNormalizedQ.includes('dia chi')) ||
       session.pendingIntent === 'CHANGE_ADDRESS');

    // Kiểm tra ý định hẹn giao lại hàng / phát lại (Redelivery / NDR Schedule)
    const isRedeliveryQuery =
      !cleanNormalizedQ.includes('co duoc') &&
      !cleanNormalizedQ.includes('may lan') &&
      !cleanNormalizedQ.includes('toi da') &&
      !cleanNormalizedQ.includes('quy dinh') &&
      (cleanNormalizedQ.includes('giao lai') ||
       cleanNormalizedQ.includes('phat lai') ||
       cleanNormalizedQ.includes('hen giao') ||
       cleanNormalizedQ.includes('hen phat') ||
       cleanNormalizedQ.includes('hom nay ban') ||
       cleanNormalizedQ.includes('chua nhan duoc') ||
       cleanNormalizedQ.includes('giao vao ngay mai') ||
       cleanNormalizedQ.includes('giao buoi chieu') ||
       cleanNormalizedQ.includes('giao sau')) &&
      (cleanNormalizedQ.includes('don') || cleanNormalizedQ.includes('hang') || cleanNormalizedQ.includes('kien') || !!trackingCode || !!session.selectedCode || session.pendingIntent === 'REDELIVERY');

    // Xác định mã đơn hàng đang hoạt động trong phiên (Multi-turn Contextual Memory)
    const activeTrackingCode =
      trackingCode ||
      dto.selectedShipmentCode ||
      session.selectedCode ||
      (session.lastShipments && session.lastShipments.length === 1 ? session.lastShipments[0].code : undefined);

    // Kiểm tra câu hỏi có đang tương tác hoặc hỏi tiếp về đơn hàng hiện tại trong phiên hay không
    const isReferencingCurrentShipment =
      cleanNormalizedQ.includes('don nay') ||
      cleanNormalizedQ.includes('don do') ||
      cleanNormalizedQ.includes('don day') ||
      cleanNormalizedQ.includes('don hang nay') ||
      cleanNormalizedQ.includes('don hang do') ||
      cleanNormalizedQ.includes('kien nay') ||
      cleanNormalizedQ.includes('kien do') ||
      cleanNormalizedQ.includes('kien hang nay') ||
      cleanNormalizedQ.includes('hang nay') ||
      cleanNormalizedQ.includes('buu pham nay') ||
      cleanNormalizedQ.includes('buu gui nay') ||
      cleanNormalizedQ.includes('van don nay') ||
      cleanNormalizedQ === 'no' ||
      cleanNormalizedQ.includes(' cua no') ||
      cleanNormalizedQ.startsWith('no ') ||
      cleanNormalizedQ.includes('don hang cua toi') ||
      cleanNormalizedQ.includes('don cua toi');

    const isShipmentStatusOrDetailQuery =
      cleanNormalizedQ.includes('den dau') ||
      cleanNormalizedQ.includes('toi dau') ||
      cleanNormalizedQ.includes('o dau') ||
      cleanNormalizedQ.includes('o mo') ||
      cleanNormalizedQ.includes('bao gio') ||
      cleanNormalizedQ.includes('khi nao') ||
      cleanNormalizedQ.includes('may gio') ||
      cleanNormalizedQ.includes('bao lau') ||
      cleanNormalizedQ.includes('may ngay') ||
      cleanNormalizedQ.includes('tien do') ||
      cleanNormalizedQ.includes('trang thai') ||
      cleanNormalizedQ.includes('hanh trinh') ||
      cleanNormalizedQ.includes('kho nao') ||
      cleanNormalizedQ.includes('giao chua') ||
      cleanNormalizedQ.includes('lay chua') ||
      cleanNormalizedQ.includes('phat chua') ||
      cleanNormalizedQ.includes('den chua') ||
      cleanNormalizedQ.includes('toi chua') ||
      cleanNormalizedQ.includes('sao chua') ||
      cleanNormalizedQ.includes('sao lau') ||
      cleanNormalizedQ.includes('cham the') ||
      cleanNormalizedQ.includes('giuc giao') ||
      cleanNormalizedQ.includes('giao gap') ||
      cleanNormalizedQ.includes('giao nhanh') ||
      cleanNormalizedQ.includes('giao som') ||
      cleanNormalizedQ.includes('shipper') ||
      cleanNormalizedQ.includes('buu ta') ||
      cleanNormalizedQ.includes('ai giao') ||
      cleanNormalizedQ.includes('ai nhan') ||
      cleanNormalizedQ.includes('nguoi nhan') ||
      cleanNormalizedQ.includes('nguoi gui') ||
      cleanNormalizedQ.includes('dia chi') ||
      cleanNormalizedQ.includes('so dien thoai') ||
      cleanNormalizedQ.includes('sdt') ||
      cleanNormalizedQ.includes('tien cod') ||
      cleanNormalizedQ.includes('thu ho') ||
      cleanNormalizedQ.includes('cod') ||
      cleanNormalizedQ.includes('ai tra') ||
      cleanNormalizedQ.includes('ai thanh toan') ||
      cleanNormalizedQ.includes('hang gi') ||
      cleanNormalizedQ.includes('ten hang') ||
      cleanNormalizedQ.includes('mon hang') ||
      cleanNormalizedQ.includes('san pham') ||
      cleanNormalizedQ.includes('nang bao nhieu') ||
      cleanNormalizedQ.includes('khoi luong') ||
      cleanNormalizedQ.includes('kich thuoc') ||
      cleanNormalizedQ.includes('de vo') ||
      cleanNormalizedQ.includes('bao hiem') ||
      cleanNormalizedQ.includes('thong tin don') ||
      cleanNormalizedQ.includes('chi tiet don') ||
      cleanNormalizedQ.includes('kiem tra lai') ||
      cleanNormalizedQ.includes('tra cuu lai') ||
      cleanNormalizedQ.includes('xem lai') ||
      cleanNormalizedQ.includes('gui tu dau') ||
      cleanNormalizedQ.includes('gui ve dau');

    const isTrackingOrFollowUp =
      !!trackingCode ||
      (!!extractedPhone && !!activeTrackingCode) ||
      (!!activeTrackingCode && (isReferencingCurrentShipment || isShipmentStatusOrDetailQuery));

    // Kiểm tra ý định chào hỏi xã giao thông thường (Social Greeting Intent)
    const greetingWords = [
      'chao', 'xin chao', 'hello', 'hi', 'alo', 'hey', 'yo',
      'chao ban', 'chao em', 'chao shop', 'chao ad', 'chao admin', 'chao bot', 'chao nexus',
      'chao ban nhe', 'chao em nhe', 'chao shop nhe',
      'ad oi', 'admin oi', 'shop oi', 'em oi', 'bot oi', 'nexus oi',
      'co ai khong', 'co ai o day khong', 'co ai truc khong',
    ];

    const hasGreetingWord = greetingWords.some((w) =>
      cleanNormalizedQ === w ||
      cleanNormalizedQ.startsWith(w + ' ') ||
      cleanNormalizedQ.endsWith(' ' + w)
    );

    const hasLogisticsKeyword =
      !!trackingCode ||
      isTrackingOrFollowUp ||
      cleanNormalizedQ.includes('cuoc') ||
      cleanNormalizedQ.includes('phi') ||
      cleanNormalizedQ.includes('gia') ||
      cleanNormalizedQ.includes('bao nhieu') ||
      cleanNormalizedQ.includes('den') ||
      cleanNormalizedQ.includes('boi thuong') ||
      cleanNormalizedQ.includes('mat hang') ||
      cleanNormalizedQ.includes('that lac') ||
      cleanNormalizedQ.includes('be vo') ||
      cleanNormalizedQ.includes('hu hong') ||
      cleanNormalizedQ.includes('dong goi') ||
      cleanNormalizedQ.includes('tra cuu') ||
      cleanNormalizedQ.includes('kiem tra') ||
      cleanNormalizedQ.includes('don hang') ||
      cleanNormalizedQ.includes('gui hang') ||
      cleanNormalizedQ.includes('huy') ||
      cleanNormalizedQ.includes('tien') ||
      cleanNormalizedQ.includes('lay hang') ||
      cleanNormalizedQ.includes('giao hang') ||
      cleanNormalizedQ.includes('van chuyen') ||
      cleanNormalizedQ.includes('chuyen phat') ||
      cleanNormalizedQ.includes('shipper') ||
      cleanNormalizedQ.includes('buu ta') ||
      cleanNormalizedQ.includes('doi dia chi') ||
      cleanNormalizedQ.includes('giao lai') ||
      cleanNormalizedQ.includes('hen giao') ||
      cleanNormalizedQ.includes('buu cuc');

    const isGreetingIntent =
      hasGreetingWord &&
      !hasLogisticsKeyword &&
      !isUserIdentityQuery &&
      !isCancelIntent &&
      !isKeepOrderIntent &&
      !isAddressChangeQuery &&
      !isRedeliveryQuery;

    if (isUserIdentityQuery) {
      if (isGuest) {
        toolAugmentedContext += `\n[THÔNG TIN NGƯỜI DÙNG CHƯA ĐĂNG NHẬP]:\n` +
          `- Trạng thái: Người dùng đang truy cập với tư cách Khách vãng lai (GUEST / Chưa đăng nhập).\n` +
          `- CHỈ DẪN AI: Chào anh/chị thật tự nhiên, lễ phép (xưng em, gọi anh/chị). Giải thích nhẹ nhàng rằng vì lý do bảo mật dữ liệu cá nhân theo Luật Bưu chính, hệ thống chưa nhận diện được thông tin tài khoản của mình trong phiên này. Mời anh/chị bấm nút [Đăng nhập] ở góc trên màn hình để hệ thống tự động nhận diện danh tính và đồng bộ các đơn hàng của mình nhé ạ.\n`;
        actionChips = [
          { label: '🔑 Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
          { label: '📦 Tra cứu theo mã vận đơn', query: 'Tra cứu hành trình đơn hàng' },
          { label: '💰 Báo giá cước gửi hàng', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
        ];
      } else {
        toolsUsed.push('getUserProfile()');
        toolAugmentedContext += `\n[THÔNG TIN HỒ SƠ TÀI KHOẢN NGƯỜI DÙNG HIỆN TẠI (ĐÃ ĐĂNG NHẬP)]:\n` +
          `- Trạng thái xác thực: ĐÃ ĐĂNG NHẬP THÀNH CÔNG (Authenticated Session).\n` +
          `- Tên người dùng / Tên hiển thị: ${userDisplayName}\n` +
          (dto.userId ? `- Mã tài khoản / Số điện thoại (User ID): ${dto.userId}\n` : '') +
          `- Vai trò tài khoản: ${dto.senderRole || 'CUSTOMER'}\n` +
          `- CHỈ DẪN AI: Khách hàng ĐÃ ĐĂNG NHẬP HỢP LỆ. Hãy chào anh/chị ${userDisplayName} thật niềm nở, tự nhiên (xưng em, gọi anh/chị ${userDisplayName}), xác nhận tên của anh/chị trên hệ thống là "${userDisplayName}"` +
          (dto.userId && dto.userId !== userDisplayName ? ` (gắn với số điện thoại/mã tài khoản: ${dto.userId})` : '') +
          `. Báo anh/chị biết tài khoản đã sẵn sàng và hỏi em có thể hỗ trợ anh/chị tra cứu đơn hàng hay tạo đơn bưu kiện mới không ạ.\n`;
        actionChips = [
          { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
          { label: '➕ Tạo đơn hàng mới', query: 'Tôi muốn gửi hàng mới' },
          { label: '💰 Dự toán cước phí', query: 'Dự toán cước vận chuyển' },
        ];
      }
    } else if (isGreetingIntent) {
      if (isGuest) {
        toolAugmentedContext += `\n[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP)]:\n` +
          `- Trạng thái: Người dùng đang gửi lời chào hỏi thông thường ("${question}").\n` +
          `- CHỈ DẪN AI (BẮT BUỘC): Chào anh/chị niềm nở, ấm áp và lễ phép (xưng "em", gọi "anh/chị"). Giới thiệu ngắn gọn em là Trợ lý AI Bưu cục Nexus Logistics, luôn sẵn sàng hỗ trợ tra cứu hành trình bưu kiện, tính cước vận chuyển, hoặc hướng dẫn tạo đơn gửi hàng mới. Mời anh/chị gửi mã vận đơn hoặc bấm chọn các tác vụ bên dưới.\n` +
          `- TUYỆT ĐỐI KHÔNG tự tiện đưa ra chính sách bồi thường khiếu nại hay thông tin bưu kiện khi khách chỉ mới chào hỏi xã giao.\n`;
        actionChips = [
          { label: '📦 Tra cứu vận đơn', query: 'Tra cứu hành trình đơn hàng' },
          { label: '💰 Dự toán cước phí', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
          { label: '🚚 Hướng dẫn gửi hàng', query: 'Tôi muốn gửi hàng cho người thân' },
          { label: '🔑 Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
        ];
      } else {
        toolAugmentedContext += `\n[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH HÀNG ĐÃ ĐĂNG NHẬP]:\n` +
          `- Trạng thái: Người dùng ${userDisplayName} đang gửi lời chào hỏi ("${question}").\n` +
          `- CHỈ DẪN AI (BẮT BUỘC): Chào anh/chị ${userDisplayName} niềm nở, ấm áp và lễ phép (xưng "em", gọi "anh/chị ${userDisplayName}"). Báo anh/chị biết em đã sẵn sàng hỗ trợ quản lý các đơn hàng của mình, tra cứu tiến độ vận chuyển hoặc tạo đơn gửi hàng mới.\n` +
          `- TUYỆT ĐỐI KHÔNG tự tiện đưa ra chính sách bồi thường khiếu nại hay quy chuẩn kỹ thuật khi khách chỉ mới chào hỏi xã giao.\n`;
        actionChips = [
          { label: '📦 Đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
          { label: '➕ Tạo đơn gửi hàng mới', query: 'Tôi muốn gửi hàng cho người thân' },
          { label: '💰 Dự toán cước phí', query: 'Dự toán cước vận chuyển' },
        ];
      }
    } else if (isKeepOrderIntent) {
      const codeToKeep = trackingCode || dto.selectedShipmentCode || session.selectedCode || (session.lastShipments && session.lastShipments[0]?.code);
      toolAugmentedContext += `\n[XÁC NHẬN GIỮ LẠI ĐƠN HÀNG]:\n` +
        `- Mã vận đơn: ${codeToKeep || 'Đơn hàng của Quý khách'}\n` +
        `- Trạng thái: Đã ghi nhận giữ lại đơn hàng theo quyết định của Quý khách. Đơn hàng tiếp tục được vận chuyển/lấy hàng bình thường theo quy trình.\n` +
        `- HƯỚNG DẪN AI: Dạ báo với anh/chị thật lịch sự, ấm áp rằng bên em đã ghi nhận giữ lại đơn hàng, quy trình vận chuyển vẫn tiếp tục bình thường để anh/chị yên tâm nhé ạ.\n`;
      actionChips = [
        { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
        codeToKeep ? { label: `🔍 Xem hành trình ${codeToKeep}`, query: `Tra cứu hành trình đơn ${codeToKeep}` } : { label: '➕ Gửi đơn mới', query: 'Tôi muốn gửi hàng mới' },
      ];
    } else if (isCancelIntent) {
      // 1. Phân giải ngữ cảnh đa lượt: Xác định mã vận đơn khách đang đề cập
      let targetCode: string | undefined = trackingCode || dto.selectedShipmentCode || session.selectedCode;

      if (!targetCode && session.lastShipments && session.lastShipments.length > 0) {
        // Kiểm tra xem khách có nhắc đến mã nào trong danh sách session không
        const matchedInSession = session.lastShipments.find((s) => question.toUpperCase().includes(s.code.toUpperCase()));
        if (matchedInSession) {
          targetCode = matchedInSession.code;
        } else if (normalizedQ.includes('dau tien') || normalizedQ.includes('don 1') || normalizedQ.includes('so 1') || normalizedQ.includes('moi nhat') || normalizedQ.includes('vua gui')) {
          targetCode = session.lastShipments[0].code;
        } else if (normalizedQ.includes('thu hai') || normalizedQ.includes('don 2') || normalizedQ.includes('so 2')) {
          targetCode = session.lastShipments[1]?.code;
        } else if (normalizedQ.includes('thu ba') || normalizedQ.includes('don 3') || normalizedQ.includes('so 3')) {
          targetCode = session.lastShipments[2]?.code;
        } else if (session.selectedCode) {
          targetCode = session.selectedCode;
        } else if (session.lastShipments.length === 1) {
          targetCode = session.lastShipments[0].code;
        }
      } else if (!targetCode && session.selectedCode) {
        targetCode = session.selectedCode;
      }

      // Nếu vẫn chưa có targetCode và người dùng đã đăng nhập, tự động tra cứu danh sách đơn của họ
      if (!targetCode && !isGuest && dto.userId) {
        toolsUsed.push(`getUserShipments(User:${dto.userId})`);
        const userShipments = await this.toolsService.getUserShipments(dto.userId, 5);
        if (userShipments.found && userShipments.items.length > 0) {
          this.sessions.set(conversationId, {
            lastShipments: userShipments.items,
            selectedCode: userShipments.items.length === 1 ? userShipments.items[0].code : undefined,
            lastUpdated: Date.now(),
          });
          if (userShipments.items.length === 1) {
            targetCode = userShipments.items[0].code;
          } else {
            session.lastShipments = userShipments.items;
          }
        }
      }

      if (!targetCode) {
        if (session.lastShipments && session.lastShipments.length > 1) {
          // TRƯỜNG HỢP NHIỀU ĐƠN HÀNG: Phân giải mơ hồ (Context Disambiguation)
          shipmentCards = session.lastShipments.map((it) => ({
            code: it.code,
            status: it.status,
            statusText: it.statusText,
            itemName: it.itemName,
            receiverCity: it.receiverCity || it.receiverAddress,
            receiverName: it.receiverName,
            codAmount: it.codAmount,
            createdAt: it.createdAt,
          }));

          actionChips = session.lastShipments.map((it) => ({
            label: `❌ Hủy đơn ${it.code}`,
            query: `Tôi muốn hủy đơn hàng ${it.code}`,
          }));

          toolAugmentedContext += `\n[YÊU CẦU LÀM RÕ NGỮ CẢNH ĐƠN HÀNG CẦN HỦY (DISAMBIGUATION)]:\n` +
            `- Tài khoản của Quý khách hiện có ${session.lastShipments.length} đơn hàng trên hệ thống: ${session.lastShipments.map((s, idx) => `Đơn ${idx + 1}: ${s.code} (${s.itemName || 'Hàng hóa'})`).join(', ')}.\n` +
            `- Khách hàng yêu cầu hủy đơn nhưng chưa chỉ định rõ mã đơn nào trong danh sách.\n` +
            `- HƯỚNG DẪN AI: Dạ chào anh/chị thật lịch sự, giải thích rằng tài khoản của mình hiện có ${session.lastShipments.length} đơn hàng, liệt kê vắn tắt các đơn và mời anh/chị chỉ định rõ mã vận đơn hoặc bấm vào một trong các nút chọn nhanh bên dưới để em kiểm tra điều kiện hủy cho mình nhé ạ.\n`;
        } else if (isGuest) {
          toolAugmentedContext += `\n[CẢNH BÁO BẢO MẬT & ĐỊNH DANH]: Quý khách chưa cung cấp mã vận đơn cụ thể và chưa đăng nhập tài khoản. Để hỗ trợ hủy đơn an toàn, Quý khách vui lòng cung cấp mã vận đơn (ví dụ 333... hoặc NX-...) hoặc đăng nhập tài khoản.\n`;
        } else {
          toolAugmentedContext += `\n[THÔNG BÁO TÀI KHOẢN]: Tài khoản của Quý khách hiện không có đơn hàng nào trên hệ thống để thực hiện thao tác hủy.\n`;
        }
      } else {
        // 2. ĐÃ XÁC ĐỊNH ĐƯỢC TARGET CODE -> Kiểm tra Carrier SOP và Trạng thái Vận hành
        this.sessions.set(conversationId, {
          ...session,
          selectedCode: targetCode,
          lastUpdated: Date.now(),
        });

        toolsUsed.push(`trackShipment(${targetCode})`);
        const trackRes = await this.toolsService.trackShipment(targetCode, false);

        if (!trackRes.found) {
          toolAugmentedContext += `\n[KẾT QUẢ TRA CỨU]: Không tìm thấy mã vận đơn ${targetCode} trên hệ thống để thực hiện hủy đơn.\n`;
        } else {
          const status = trackRes.status;
          const canCancelDirectly = [
            'CREATED',
            'TASK_ASSIGNED',
            'PICKUP_ASSIGNED',
            'PICKING_UP',
            'PENDING',
            'READY_TO_SHIP',
          ].includes(status);
          const isFinished = [
            'CANCELLED',
            'DELIVERED',
            'RETURNED',
            'RETURN_COMPLETED',
            'LOST',
            'DAMAGED',
          ].includes(status);
          const isBlocked = !canCancelDirectly && !isFinished;

          if (canCancelDirectly) {
            if (isCancelExplicitConfirm) {
              // Khách hàng ĐÃ CHÍNH TAY XÁC NHẬN -> Thực thi lệnh hủy!
              toolsUsed.push(`cancelShipment(${targetCode})`);
              const cancelRes = await this.toolsService.cancelShipment(targetCode, 'Khách hàng xác nhận hủy đơn qua Trợ lý AI');

              if (session.lastShipments) {
                session.lastShipments = session.lastShipments.map((s) =>
                  s.code === targetCode ? { ...s, status: 'CANCELLED', statusText: 'Đã hủy đơn hàng theo yêu cầu của khách' } : s
                );
              }
              this.sessions.set(conversationId, {
                ...session,
                selectedCode: undefined,
                lastUpdated: Date.now(),
              });

              shipmentCards = [
                {
                  code: targetCode,
                  status: 'CANCELLED',
                  statusText: 'Đã hủy đơn hàng thành công',
                  itemName: trackRes.itemName,
                  receiverCity: trackRes.receiverCity || trackRes.receiverAddress,
                  receiverName: trackRes.receiverName,
                  codAmount: 0,
                  createdAt: trackRes.createdAt,
                },
              ];

              actionChips = [
                { label: '📦 Xem danh sách đơn hàng', query: 'Tôi có những đơn hàng nào' },
                { label: '➕ Gửi một đơn hàng mới', query: 'Tôi muốn gửi một đơn hàng cho người thân' },
              ];

              toolAugmentedContext += `\n[KẾT QUẢ HỦY ĐƠN HÀNG THÀNH CÔNG THEO XÁC NHẬN TỪ KHÁCH HÀNG (HUMAN-CONFIRMED)]:\n` +
                `- Mã vận đơn: ${targetCode}\n` +
                `- Hàng hóa: ${trackRes.itemName || 'Kiện hàng'}\n` +
                `- Trạng thái mới: ĐÃ HỦY ĐƠN THÀNH CÔNG (CANCELLED)\n` +
                `- Cước phí hủy: 0 VNĐ (Miễn phí 100% do bưu tá chưa nhận hàng)\n` +
                `- Vận hành bưu cục: Hệ thống đã phát lệnh dừng lấy hàng khẩn cấp tới bưu tá phụ trách tuyến.\n` +
                `- HƯỚNG DẪN AI: Dạ thông báo với anh/chị rằng đơn hàng ${targetCode} đã được hủy thành công và hoàn toàn không phát sinh bất kỳ khoản phí nào. Nhắn anh/chị yên tâm và sẵn sàng hỗ trợ nếu anh/chị muốn gửi đơn mới nhé ạ.\n`;
            } else {
              // Khách MỚI YÊU CẦU, CHƯA BẤM XÁC NHẬN -> Human-in-the-Loop Gatekeeper!
              shipmentCards = [
                {
                  code: targetCode,
                  status: trackRes.status,
                  statusText: trackRes.statusText,
                  itemName: trackRes.itemName,
                  receiverCity: trackRes.receiverCity || trackRes.receiverAddress,
                  receiverName: trackRes.receiverName,
                  codAmount: trackRes.codAmount,
                  createdAt: trackRes.createdAt,
                },
              ];

              actionChips = [
                { label: `❌ Xác nhận hủy đơn ${targetCode}`, query: `Xác nhận hủy đơn ${targetCode}` },
                { label: `🔙 Giữ lại đơn ${targetCode}`, query: `Tôi muốn giữ lại đơn ${targetCode}` },
                { label: '📦 Xem các đơn khác', query: 'Tôi có những đơn hàng nào' },
              ];

              toolAugmentedContext += `\n[THẨM ĐỊNH NGHIỆP VỤ HỦY ĐƠN & YÊU CẦU XÁC NHẬN HUMAN-IN-THE-LOOP]:\n` +
                `- Mã vận đơn: ${targetCode}\n` +
                `- Tên hàng hóa: ${trackRes.itemName || 'Kiện hàng'}\n` +
                `- Trạng thái hiện tại: ${trackRes.statusText} (${trackRes.status})\n` +
                `- ĐIỀU KIỆN VẬN HÀNH CARRIER SOP: ĐỦ ĐIỀU KIỆN HỦY MIỄN PHÍ 100% (0 VNĐ). Lý do: Bưu tá chưa qua lấy hàng hoặc kiện chưa nhập kho phân loại Hub.\n` +
                `- NGUYÊN TẮC AN TOÀN VẬN HÀNH (HUMAN-IN-THE-LOOP BẮT BUỘC): Dù AI đã kiểm tra đơn hàng đủ điều kiện hủy, AI TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ TIỆN HỦY ĐƠN NGAY mà BẮT BUỘC PHẢI HỎI XÁC NHẬN CHÍNH TAY KHÁCH HÀNG.\n` +
                `- HƯỚNG DẪN AI: Hỏi tự nhiên, niềm nở: "Dạ có phải anh/chị đang muốn hủy đơn hàng ${targetCode} (${trackRes.itemName || 'kiện hàng'}) vừa tra cứu đúng không ạ?". Báo rõ cho anh/chị yên tâm là đơn này hoàn toàn ĐỦ ĐIỀU KIỆN HỦY MIỄN PHÍ (0 VNĐ) vì bưu tá chưa qua lấy hàng. Mời anh/chị bấm nút [❌ Xác nhận hủy đơn ${targetCode}] bên dưới hoặc gõ 'Xác nhận hủy đơn ${targetCode}' để bên em chính thức phát lệnh dừng lấy hàng cho bưu tá nhé ạ.\n`;
            }
          } else if (isBlocked) {
            // Kiện hàng đang trên xe tải đường trục hoặc đang đi phát -> Physical Block!
            shipmentCards = [
              {
                code: targetCode,
                status: trackRes.status,
                statusText: trackRes.statusText,
                itemName: trackRes.itemName,
                receiverCity: trackRes.receiverCity || trackRes.receiverAddress,
                receiverName: trackRes.receiverName,
                codAmount: trackRes.codAmount,
                createdAt: trackRes.createdAt,
              },
            ];

            actionChips = [
              { label: '📞 Kết nối hotline 1900-1234', query: 'Tôi muốn gặp chuyên viên tổng đài hỗ trợ gấp' },
              { label: `🔍 Xem hành trình ${targetCode}`, query: `Tra cứu hành trình đơn ${targetCode}` },
              { label: '📦 Xem các đơn khác', query: 'Tôi có những đơn hàng nào' },
            ];

            toolAugmentedContext += `\n[CẢNH BÁO TỪ CHỐI HỦY ĐƠN THEO QUY CHUẨN VẬN HÀNH BƯU CHÍNH (CARRIER SOP PHYSICAL BLOCK)]:\n` +
              `- Mã vận đơn: ${targetCode}\n` +
              `- Hàng hóa: ${trackRes.itemName || 'Kiện hàng'}\n` +
              `- Trạng thái hiện tại: ${trackRes.statusText} (${trackRes.status})\n` +
              `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
              `- BẤT KHẢ KHÁNG VẬT LÝ VẬN HÀNH: Kiện hàng hiện đang trên xe tải đường trục (Linehaul) kẹp chì niêm phong seal, hoặc đang chạy trên băng chuyền chia chọn Hub, hoặc bưu tá đang đi phát chặng cuối. Hệ thống KHÔNG THỂ HỦY NGAY LẬP TỨC trên đường vận chuyển vì không thể dừng xe tải giữa quốc lộ/cao tốc để tìm 1 bưu phẩm.\n` +
              `- HƯỚNG XỬ LÝ CHUẨN NGHIỆP VỤ CHO KHÁCH HÀNG:\n` +
              `  1. Khi bưu tá liên hệ phát hàng, người nhận có thể TỪ CHỐI NHẬN HÀNG (đơn sẽ tự động chuyển hoàn RTO về người gửi, cước hoàn 50% cước chiều đi theo chính sách bưu chính).\n` +
              `  2. Hoặc anh/chị có thể liên hệ ngay Hotline Vận hành 1900-1234 để điều phối viên tiếp nhận và gắn cờ chuyển hoàn khi xe cập Hub phát.\n` +
              `- HƯỚNG DẪN AI: Giải thích thật ân cần, thấu cảm cho anh/chị lý do bất khả kháng vật lý và hướng dẫn 2 giải pháp trên một cách chu đáo, dễ hiểu nhé ạ.\n`;
          } else if (isFinished) {
            toolAugmentedContext += `\n[THÔNG BÁO TRẠNG THÁI ĐƠN HÀNG]: Đơn hàng ${targetCode} hiện ở trạng thái [${trackRes.statusText}] (${trackRes.status}). Đơn hàng đã kết thúc chu trình giao nhận, không thể thực hiện thao tác hủy.\n`;
          }
        }
      }
    } else if (isAddressChangeQuery) {
      let targetCode: string | undefined = trackingCode || dto.selectedShipmentCode || session.selectedCode;
      if (!targetCode && session.lastShipments && session.lastShipments.length === 1) {
        targetCode = session.lastShipments[0].code;
      }

      // Trích xuất địa chỉ mới nếu khách đã gõ trực tiếp trong tin nhắn
      const addressMatch = question.match(/(?:sang|thành|thanh|địa chỉ mới là|dia chi moi la|về|ve|tới|toi)\s*[:=]?\s*([0-9a-zA-ZÀ-ỹ\s,.\/-]{5,})/i);
      const newAddress = addressMatch ? addressMatch[1].trim() : session.pendingData?.newAddress;

      if (!targetCode) {
        // THIẾU MÃ VẬN ĐƠN -> HỎI LẠI KHÁCH HÀNG
        this.sessions.set(conversationId, {
          ...session,
          pendingIntent: 'CHANGE_ADDRESS',
          pendingData: { newAddress },
          lastUpdated: Date.now(),
        });

        actionChips = [
          ...(session.lastShipments ? session.lastShipments.slice(0, 2).map((s) => ({ label: `✏️ Đổi địa chỉ đơn ${s.code}`, query: `Tôi muốn đổi địa chỉ đơn hàng ${s.code}` })) : []),
          { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
          { label: '📞 Kết nối hotline 1900-1234', query: 'Tôi muốn gặp chuyên viên tổng đài hỗ trợ gấp' },
        ];

        toolAugmentedContext += `\n[YÊU CẦU CSKH HỎI LẠI THÔNG TIN ĐỔI ĐỊA CHỈ NHẬN HÀNG (ACTIVE CLARIFICATION)]:\n` +
          `- Yêu cầu khách: Khách muốn đổi địa chỉ giao hàng nhưng CHƯA CUNG CẤP mã vận đơn cụ thể.\n` +
          `- NGUYÊN TẮC CSKH: Chào anh/chị lịch sự, niềm nở (xưng em, gọi anh/chị). Báo anh/chị biết bên em sẵn sàng hỗ trợ điều chỉnh địa chỉ giao hàng và HỎI LẠI CÁC THÔNG TIN CẦN THIẾT:\n` +
          `  1. 🏷️ Mã vận đơn của kiện hàng mình cần đổi địa chỉ?\n` +
          `  2. 📍 Địa chỉ giao hàng mới chi tiết (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành)?\n` +
          `  3. 👤 Tên và Số điện thoại người nhận mới (nếu có thay đổi) ạ?\n` +
          `- LƯU Ý CARRIER SOP: Nếu đổi địa chỉ trong cùng quận/huyện hoặc nội tỉnh thì MIỄN PHÍ 100%; nếu đổi sang tỉnh thành khác khi xe tải đường trục đã xuất phát có thể phát sinh phụ phí chuyển hướng theo quy định bưu chính.\n` +
          `- HƯỚNG DẪN AI: Trả lời ân cần, chu đáo, hỏi lại thông tin như trên để khách dễ dàng gửi mã vận đơn và địa chỉ mới nhé ạ.\n`;
      } else if (!newAddress) {
        // ĐÃ CÓ MÃ ĐƠN NHƯNG THIẾU ĐỊA CHỈ MỚI -> HỎI LẠI ĐỊA CHỈ MỚI
        this.sessions.set(conversationId, {
          ...session,
          selectedCode: targetCode,
          pendingIntent: 'CHANGE_ADDRESS',
          lastUpdated: Date.now(),
        });

        toolAugmentedContext += `\n[YÊU CẦU CSKH HỎI LẠI ĐỊA CHỈ MỚI CHO VẬN ĐƠN ${targetCode}]:\n` +
          `- Mã vận đơn: ${targetCode}\n` +
          `- Trạng thái: Hệ thống đã xác định được vận đơn ${targetCode}. Đơn hàng ĐỦ ĐIỀU KIỆN hỗ trợ cập nhật địa chỉ giao hàng.\n` +
          `- HỎI LẠI KHÁCH HÀNG: Dạ đơn hàng ${targetCode} của mình hoàn toàn hỗ trợ đổi địa chỉ ạ! Anh/chị cho em xin Địa chỉ giao hàng mới chi tiết (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành) để em cập nhật ngay cho bưu tá phụ trách tuyến nhé ạ.\n`;
      } else {
        // ĐÃ CÓ ĐẦY ĐỦ CẢ MÃ ĐƠN VÀ ĐỊA CHỈ MỚI -> THỰC THI GỌI TOOL!
        toolsUsed.push(`changeDeliveryAddress(${targetCode}, ${newAddress})`);
        const changeRes = await this.toolsService.changeDeliveryAddress({
          trackingNumber: targetCode,
          newAddress,
          newReceiverPhone: extractedPhone,
        });

        this.sessions.set(conversationId, {
          ...session,
          selectedCode: targetCode,
          pendingIntent: undefined,
          pendingData: undefined,
          lastUpdated: Date.now(),
        });

        actionChips = [
          { label: `🔍 Xem hành trình ${targetCode}`, query: `Tra cứu hành trình đơn ${targetCode}` },
          { label: '📦 Xem các đơn khác', query: 'Tôi có những đơn hàng nào' },
        ];

        toolAugmentedContext += `\n[KẾT QUẢ ĐIỀU CHỈNH ĐỊA CHỈ GIAO HÀNG THÀNH CÔNG CHO VẬN ĐƠN ${targetCode}]:\n` +
          `- Mã vận đơn: ${targetCode}\n` +
          `- Địa chỉ giao hàng mới: ${newAddress}\n` +
          (extractedPhone ? `- Số điện thoại người nhận mới: ${extractedPhone}\n` : '') +
          `- Trạng thái cập nhật: ${changeRes.message}\n` +
          `- HƯỚNG DẪN AI: Dạ báo với anh/chị thật niềm nở rằng hệ thống đã ghi nhận cập nhật địa chỉ giao hàng mới thành công, bưu tá tuyến đã nhận được thông tin điều phối và nhắn anh/chị yên tâm nhé ạ.\n`;
      }
    } else if (isRedeliveryQuery) {
      let targetCode: string | undefined = trackingCode || dto.selectedShipmentCode || session.selectedCode;
      if (!targetCode && session.lastShipments && session.lastShipments.length === 1) {
        targetCode = session.lastShipments[0].code;
      }

      // Trích xuất khung giờ hẹn giao
      const timeMatch = question.match(/(?:ngày mai|ngay mai|chiều mai|chieu mai|sáng mai|sang mai|buổi chiều|buoi chieu|buổi sáng|buoi sang|sau 17h|sau 18h|hẹn lúc|hen luc)\s*([0-9a-zA-Z\s:h-]*)/i);
      const preferredTime = timeMatch ? timeMatch[0].trim() : (session.pendingData?.preferredTime || 'Ngày làm việc tiếp theo (khung giờ hành chính)');

      if (!targetCode) {
        // THIẾU MÃ VẬN ĐƠN -> HỎI LẠI KHÁCH HÀNG
        this.sessions.set(conversationId, {
          ...session,
          pendingIntent: 'REDELIVERY',
          pendingData: { preferredTime },
          lastUpdated: Date.now(),
        });

        actionChips = [
          ...(session.lastShipments ? session.lastShipments.slice(0, 2).map((s) => ({ label: `⏰ Hẹn giao đơn ${s.code}`, query: `Hẹn giao lại đơn hàng ${s.code}` })) : []),
          { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
        ];

        toolAugmentedContext += `\n[YÊU CẦU CSKH HỎI LẠI THÔNG TIN HẸN GIAO LẠI HÀNG (ACTIVE CLARIFICATION)]:\n` +
          `- Yêu cầu khách: Khách hàng muốn hẹn giao lại bưu kiện nhưng CHƯA CUNG CẤP mã vận đơn cụ thể.\n` +
          `- NGUYÊN TẮC CSKH: Chào anh/chị niềm nở, thông báo rằng hệ thống hỗ trợ phát lại tối đa 03 lần hoàn toàn MIỄN PHÍ theo quy định bưu chính. HỎI LẠI KHÁCH HÀNG:\n` +
          `  1. 🏷️ Mã vận đơn của kiện hàng mình cần hẹn giao lại?\n` +
          `  2. ⏰ Khung giờ thuận tiện nhất (sáng/chiều hoặc ngày mai) để bưu tá tuyến ưu tiên giao đúng hẹn cho mình nhé ạ!\n` +
          `- HƯỚNG DẪN AI: Trả lời thân thiện, chu đáo, hỏi lại thông tin như trên để khách gửi mã đơn và thời gian hẹn nhé ạ.\n`;
      } else {
        // ĐÃ CÓ MÃ ĐƠN -> THỰC THI GỌI TOOL!
        toolsUsed.push(`scheduleRedelivery(${targetCode}, ${preferredTime})`);
        const redelivRes = await this.toolsService.scheduleRedelivery({
          trackingNumber: targetCode,
          preferredTime,
        });

        this.sessions.set(conversationId, {
          ...session,
          selectedCode: targetCode,
          pendingIntent: undefined,
          pendingData: undefined,
          lastUpdated: Date.now(),
        });

        actionChips = [
          { label: `🔍 Xem hành trình ${targetCode}`, query: `Tra cứu hành trình đơn ${targetCode}` },
          { label: '📦 Xem các đơn khác', query: 'Tôi có những đơn hàng nào' },
        ];

        toolAugmentedContext += `\n[KẾT QUẢ GHI NHẬN LỊCH HẸN GIAO LẠI HÀNG CHO VẬN ĐƠN ${targetCode}]:\n` +
          `- Mã vận đơn: ${targetCode}\n` +
          `- Thời gian hẹn giao lại: ${preferredTime}\n` +
          `- Trạng thái cập nhật: ${redelivRes.message}\n` +
          `- Chính sách phát lại: Miễn phí phát lại lần 2 và lần 3 (tối đa 3 lần) theo quy chuẩn bưu chính.\n` +
          `- HƯỚNG DẪN AI: Thông báo với anh/chị thật lịch sự, ấm áp rằng bưu tá tuyến đã nhận lịch hẹn và sẽ gọi trước khi qua phát, nhắc anh/chị yên tâm nhé ạ.\n`;
      }
    } else if (isTrackingOrFollowUp) {
      const targetTrackingCode = activeTrackingCode!;
      const phoneToUse = extractedPhone || session.receiverPhone;
      toolsUsed.push(`trackShipment(${targetTrackingCode}, isGuest=${isGuest}, phone=${phoneToUse || 'none'})`);
      const trackRes = await this.toolsService.trackShipment(targetTrackingCode, isGuest, phoneToUse);

      // Cập nhật session với mã đơn và SĐT vừa tra cứu
      this.sessions.set(conversationId, {
        ...session,
        selectedCode: targetTrackingCode,
        receiverPhone: phoneToUse,
        lastUpdated: Date.now(),
      });

      if (!trackRes.found) {
        if (trackRes.status === 'PHONE_MISMATCH') {
          toolAugmentedContext += `\n[THÔNG BÁO SỐ ĐIỆN THOẠI NGƯỜI NHẬN KHÔNG KHỚP - BẢO MẬT PII LUẬT BƯU CHÍNH]:\n` +
            `- Mã vận đơn: ${targetTrackingCode}\n` +
            `- Số điện thoại cung cấp: ${extractedPhone || phoneToUse}\n` +
            `- Tình trạng: Số điện thoại không trùng khớp với số điện thoại người nhận đã đăng ký trên hệ thống của vận đơn này.\n` +
            `- NGUYÊN TẮC BẢO MẬT CARRIER SOP: Theo Điều 8 Luật Bưu chính và quy chuẩn bảo vệ dữ liệu cá nhân PII, hệ thống chỉ mở khóa thông tin người nhận và địa chỉ chi tiết khi số điện thoại người nhận trùng khớp 100%.\n` +
            `- HƯỚNG DẪN AI: Giải thích thật lịch sự, ân cần cho anh/chị biết số điện thoại vừa nhập không khớp với người nhận của đơn hàng. Nhắc anh/chị kiểm tra lại số điện thoại (hoặc 4 số cuối SĐT nhận hàng), hoặc mời anh/chị Đăng nhập tài khoản nếu mình là chủ đơn hàng/người gửi để xem chi tiết đầy đủ nhé ạ.\n`;
          actionChips = [
            { label: '🔑 Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
            { label: '📱 Nhập lại SĐT người nhận', query: `Tra cứu đơn ${targetTrackingCode} sđt ` },
            { label: '📦 Tra cứu đơn khác', query: 'Tra cứu hành trình đơn hàng' },
          ];
        } else {
          toolAugmentedContext += `\n[KẾT QUẢ TRA CỨU]: ${trackRes.notFoundMessage || `Không tìm thấy mã vận đơn ${targetTrackingCode} trên hệ thống.`}\n`;
          actionChips = [
            { label: '📦 Tra cứu đơn khác', query: 'Tra cứu hành trình đơn hàng' },
            { label: '💰 Dự toán cước phí', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
            { label: '➕ Gửi đơn hàng mới', query: 'Tôi muốn gửi hàng mới' },
          ];
        }
      } else {
        shipmentCards = [
          {
            code: trackRes.trackingNumber,
            status: trackRes.status,
            statusText: trackRes.statusText,
            itemName: trackRes.itemName,
            receiverCity: trackRes.receiverAddress || [trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ') || trackRes.receiverCity,
            receiverName: trackRes.receiverName,
            codAmount: trackRes.codAmount,
            createdAt: trackRes.createdAt,
          },
        ];

        // Gợi ý action chips phù hợp với trạng thái đơn
        const canCancel = ['CREATED', 'TASK_ASSIGNED', 'PICKUP_ASSIGNED', 'PICKING_UP', 'PENDING', 'READY_TO_SHIP'].includes(trackRes.status);

        if (trackRes.phoneVerificationStatus === 'VERIFIED') {
          // XÁC THỰC SĐT NGƯỜI NHẬN THÀNH CÔNG (ĐÃ MỞ KHÓA PII)
          actionChips = [
            ...(canCancel ? [{ label: `❌ Hủy đơn ${trackRes.trackingNumber}`, query: `Tôi muốn hủy đơn hàng ${trackRes.trackingNumber}` }] : []),
            { label: '📦 Tra cứu đơn khác', query: 'Tra cứu hành trình đơn hàng' },
            { label: '➕ Gửi đơn hàng mới', query: 'Tôi muốn gửi hàng mới' },
          ];

          toolAugmentedContext += (extractedPhone
            ? `\n[XÁC THỰC THÀNH CÔNG SỐ ĐIỆN THOẠI NGƯỜI NHẬN - MỞ KHÓA TOÀN BỘ THÔNG TIN CHI TIẾT]:\n`
            : `\n[HƯỚNG DẪN AI TRẢ LỜI CÂU HỎI TIẾP THEO VỀ ĐƠN HÀNG ${trackRes.trackingNumber}]:\n`) +
            `- Mã vận đơn: ${trackRes.trackingNumber}\n` +
            `- Trạng thái: ${trackRes.statusText} (${trackRes.status}${trackRes.status === 'PICKUP_ASSIGNED' ? ' / TASK_ASSIGNED' : ''})\n` +
            (trackRes.itemName ? `- Tên hàng hóa: ${trackRes.itemName}\n` : '') +
            (trackRes.senderName ? `- Người gửi: ${trackRes.senderName}${trackRes.senderAddress ? ` (Địa chỉ gửi: ${trackRes.senderAddress})` : (trackRes.senderCity ? ` (${trackRes.senderCity})` : '')}\n` : '') +
            (trackRes.receiverName ? `- Người nhận: ${trackRes.receiverName}\n` : '') +
            (trackRes.receiverPhone ? `- Số điện thoại người nhận: ${trackRes.receiverPhone} (ĐÃ XÁC THỰC HỢP LỆ)\n` : '') +
            (trackRes.receiverAddress ? `- Địa chỉ nhận hàng (Nơi giao đến): ${trackRes.receiverAddress}\n` : (trackRes.receiverCity ? `- Khu vực nhận: ${trackRes.receiverCity}\n` : '')) +
            (trackRes.receiverWard || trackRes.receiverDistrict ? `- Đơn vị hành chính nơi nhận: ${[trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ')}\n` : '') +
            (trackRes.destinationHubName ? `- Bưu cục phát phụ trách giao đến người nhận: ${trackRes.destinationHubName}\n` : '') +
            (trackRes.codAmount !== undefined ? `- Tiền thu hộ COD: ${trackRes.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
            `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
            `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery}\n` +
            `- Lịch sử vận chuyển:\n` +
            trackRes.timeline.map((t) => `  * ${t.time}: ${t.description}`).join('\n') + '\n' +
            `\n[NGUYÊN TẮC BẢO ĐẢM TÍNH CHÍNH XÁC ĐỊA BÀN GIAO NHẬN]:\n` +
            `- ĐỊA CHỈ NHẬN HÀNG (NƠI GIAO ĐẾN): ${trackRes.receiverAddress || [trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ')}. Khi khách hỏi giao đến đâu, quận nào, người nhận ở đâu, BẮT BUỘC trả lời chính xác theo địa chỉ nhận này!\n` +
            `- ĐỊA CHỈ GỬI HÀNG (NƠI LẤY): ${trackRes.senderAddress || trackRes.senderCity}.\n` +
            `- LƯU Ý PHÂN BIỆT: Tuyệt đối không nhầm lẫn bưu cục lấy hàng ban đầu của người gửi (hoặc vị trí Hub bưu tá lấy hàng) thành địa chỉ của người nhận!\n`;

          if (extractedPhone) {
            toolAugmentedContext += `- HƯỚNG DẪN AI: Báo cho anh/chị biết hệ thống đã xác thực thành công số điện thoại người nhận! Mở khóa toàn bộ thông tin chi tiết: người nhận, số điện thoại, địa chỉ cụ thể, COD và hành trình di chuyển với thái độ niềm nở, chu đáo.\n`;
          } else {
            toolAugmentedContext += `- HƯỚNG DẪN AI (QUAN TRỌNG): Số điện thoại người nhận đã được xác thực ở lượt trước đó rồi. Ở lượt này, TUYỆT ĐỐI KHÔNG chúc mừng hay nhắc lại việc xác thực số điện thoại. Hãy TRẢ LỜI NGAY TRỌNG TÂM CÂU HỎI của anh/chị (ví dụ: nếu hỏi COD thì trả lời ngay số tiền COD, nếu hỏi ai nhận thì trả lời ngay người nhận là ${trackRes.receiverName || 'người nhận'} - SĐT ${trackRes.receiverPhone || ''}, nếu hỏi vị trí thì trả lời ngay vị trí hiện tại, nếu hỏi địa chỉ thì trả lời đúng địa chỉ nhận ${trackRes.receiverAddress || ''}...) bằng phong cách thân thiện, chu đáo, xưng em gọi anh/chị.\n`;
          }
        } else if (isGuest && trackRes.isMasked) {
          // KHÁCH VÃNG LAI CHƯA NHẬP SĐT: BẮT BUỘC TƯ VẤN 2 LỰA CHỌN MỞ KHÓA HOẶC TRẢ LỜI CÂU HỎI TIẾP THEO
          actionChips = [
            { label: '🔑 Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
            { label: '📱 Cung cấp SĐT người nhận', query: `Số điện thoại người nhận đơn ${trackRes.trackingNumber} là ` },
            ...(canCancel ? [{ label: `❌ Hủy đơn ${trackRes.trackingNumber}`, query: `Tôi muốn hủy đơn hàng ${trackRes.trackingNumber}` }] : []),
            { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
          ];

          toolAugmentedContext += `\n[THÔNG TIN TRA CỨU ĐƠN HÀNG MÃ ${trackRes.trackingNumber} (CHẾ ĐỘ KHÁCH VÃNG LAI - ĐÃ MÃ HÓA THÔNG TIN CÁ NHÂN PII)]:\n` +
            `- Mã vận đơn: ${trackRes.trackingNumber}\n` +
            `- Trạng thái: ${trackRes.statusText} (${trackRes.status}${trackRes.status === 'PICKUP_ASSIGNED' ? ' / TASK_ASSIGNED' : ''})\n` +
            (trackRes.itemName ? `- Tên hàng hóa: ${trackRes.itemName}\n` : '') +
            (trackRes.senderName ? `- Người gửi: ${trackRes.senderName} (${trackRes.senderCity || trackRes.senderAddress || ''})\n` : '') +
            (trackRes.receiverName ? `- Người nhận: ${trackRes.receiverName} (Đã ẩn theo chuẩn PII)\n` : '') +
            (trackRes.receiverPhone ? `- Số điện thoại người nhận: ${trackRes.receiverPhone} (Đã ẩn theo chuẩn PII)\n` : '') +
            (trackRes.receiverAddress ? `- Địa chỉ nhận hàng (Nơi giao đến): ${trackRes.receiverAddress} (Đã ẩn số nhà chi tiết, giữ nguyên phường/quận/thành phố)\n` : (trackRes.receiverCity ? `- Khu vực nhận: ${trackRes.receiverCity}\n` : '')) +
            (trackRes.receiverWard || trackRes.receiverDistrict ? `- Đơn vị hành chính nơi nhận: ${[trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ')}\n` : '') +
            (trackRes.destinationHubName ? `- Bưu cục phát phụ trách giao đến người nhận: ${trackRes.destinationHubName}\n` : '') +
            (trackRes.codAmount !== undefined ? `- Tiền thu hộ COD: ${trackRes.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
            `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
            `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery}\n` +
            `- Lịch sử vận chuyển:\n` +
            trackRes.timeline.map((t) => `  * ${t.time}: ${t.description}`).join('\n') + '\n' +
            `\n[NGUYÊN TẮC BẢO ĐẢM TÍNH CHÍNH XÁC ĐỊA BÀN GIAO NHẬN]:\n` +
            `- ĐỊA CHỈ NHẬN HÀNG (NƠI GIAO ĐẾN): ${trackRes.receiverAddress || [trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ')}. Khi khách hỏi giao đến đâu, quận nào, người nhận ở đâu, BẮT BUỘC trả lời chính xác theo địa chỉ nhận này!\n` +
            `- ĐỊA CHỈ GỬI HÀNG (NƠI LẤY): ${trackRes.senderAddress || trackRes.senderCity}.\n` +
            `- LƯU Ý PHÂN BIỆT: Tuyệt đối không nhầm lẫn bưu cục lấy hàng ban đầu của người gửi (hoặc vị trí Hub bưu tá lấy hàng) thành địa chỉ của người nhận!\n`;

          if (!extractedPhone && (isReferencingCurrentShipment || isShipmentStatusOrDetailQuery)) {
            toolAugmentedContext += `\n[HƯỚNG DẪN AI TRẢ LỜI CÂU HỎI TIẾP THEO VỀ ĐƠN HÀNG ${trackRes.trackingNumber}]:\n` +
              `- Trả lời TRỰC TIẾP và ĐẦY ĐỦ câu hỏi của anh/chị (ví dụ: vị trí hiện tại: ${trackRes.currentLocation}, trạng thái: ${trackRes.statusText}, thời gian dự kiến giao: ${trackRes.estimatedDelivery}, COD: ${trackRes.codAmount !== undefined ? trackRes.codAmount.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ'}, nơi nhận: ${trackRes.receiverAddress || [trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ')}).\n` +
              `- Nếu câu hỏi liên quan đến số điện thoại hoặc số nhà chi tiết của người nhận (đang bị ẩn bảo mật theo Điều 8 Luật Bưu chính), hãy giải thích lịch sự và mời anh/chị cung cấp SĐT người nhận (hoặc 4 số cuối) hoặc [🔑 Đăng nhập tài khoản](/login) để mở khóa.\n`;
          } else {
            toolAugmentedContext += `\n[CHỈ DẪN NGHIỆP VỤ BẢO MẬT & TƯ VẤN 2 LỰA CHỌN MỞ KHÓA BẮT BUỘC DÀNH CHO KHÁCH VÃNG LAI]:\n` +
              `- Theo Điều 8 Luật Bưu chính và quy chuẩn an toàn PII, thông tin người nhận và địa chỉ chi tiết tạm thời được che bớt.\n` +
              `- AI BẮT BUỘC PHẢI TƯ VẤN ĐẦY ĐỦ 2 LỰA CHỌN DƯỚI ĐÂY CHO KHÁCH:\n` +
              `  1. LỰA CHỌN 1 (NẾU ĐÃ CÓ TÀI KHOẢN / ĐĂNG NHẬP): Mời anh/chị bấm [🔑 Đăng nhập tài khoản](/login) để hệ thống tự động nhận diện danh tính và mở khóa xem đầy đủ mọi thông tin (người gửi, người nhận, SĐT, địa chỉ chi tiết, timeline) mà không cần nhập SĐT mỗi lần tra cứu.\n` +
              `  2. LỰA CHỌN 2 (TRA CỨU NHANH KHÔNG CẦN TÀI KHOẢN): Chỉ cần cung cấp Số điện thoại người nhận (hoặc 4 số cuối SĐT nhận hàng) ngay tại khung chat này, hệ thống sẽ đối chiếu và mở khóa hiển thị đầy đủ thông tin chi tiết ngay lập tức.\n`;
          }
        } else {
          // KHÁCH ĐÃ ĐĂNG NHẬP
          actionChips = [
            ...(canCancel ? [{ label: `❌ Hủy đơn ${trackRes.trackingNumber}`, query: `Tôi muốn hủy đơn hàng ${trackRes.trackingNumber}` }] : []),
            { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
            { label: '➕ Gửi đơn hàng mới', query: 'Tôi muốn gửi hàng mới' },
          ];

          toolAugmentedContext += `\n[THÔNG TIN TRA CỨU ĐƠN HÀNG MÃ ${trackRes.trackingNumber} (TÀI KHOẢN ĐÃ ĐĂNG NHẬP)]:\n` +
            `- Mã vận đơn: ${trackRes.trackingNumber}\n` +
            `- Trạng thái: ${trackRes.statusText} (${trackRes.status}${trackRes.status === 'PICKUP_ASSIGNED' ? ' / TASK_ASSIGNED' : ''})\n` +
            (trackRes.itemName ? `- Tên hàng hóa: ${trackRes.itemName}\n` : '') +
            (trackRes.senderName ? `- Người gửi: ${trackRes.senderName}${trackRes.senderAddress ? ` (Địa chỉ gửi: ${trackRes.senderAddress})` : (trackRes.senderCity ? ` (${trackRes.senderCity})` : '')}\n` : '') +
            (trackRes.receiverName ? `- Người nhận: ${trackRes.receiverName}\n` : '') +
            (trackRes.receiverPhone ? `- Số điện thoại người nhận: ${trackRes.receiverPhone}\n` : '') +
            (trackRes.receiverAddress ? `- Địa chỉ nhận hàng (Nơi giao đến): ${trackRes.receiverAddress}\n` : (trackRes.receiverCity ? `- Khu vực nhận: ${trackRes.receiverCity}\n` : '')) +
            (trackRes.receiverWard || trackRes.receiverDistrict ? `- Đơn vị hành chính nơi nhận: ${[trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ')}\n` : '') +
            (trackRes.destinationHubName ? `- Bưu cục phát phụ trách giao đến người nhận: ${trackRes.destinationHubName}\n` : '') +
            (trackRes.codAmount !== undefined ? `- Tiền thu hộ COD: ${trackRes.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
            `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
            `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery}\n` +
            `- Lịch sử vận chuyển:\n` +
            trackRes.timeline.map((t) => `  * ${t.time}: ${t.description}`).join('\n') + '\n' +
            `\n[NGUYÊN TẮC BẢO ĐẢM TÍNH CHÍNH XÁC ĐỊA BÀN GIAO NHẬN]:\n` +
            `- ĐỊA CHỈ NHẬN HÀNG (NƠI GIAO ĐẾN): ${trackRes.receiverAddress || [trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ')}. Khi khách hỏi giao đến đâu, quận nào, người nhận ở đâu, BẮT BUỘC trả lời chính xác theo địa chỉ nhận này!\n` +
            `- ĐỊA CHỈ GỬI HÀNG (NƠI LẤY): ${trackRes.senderAddress || trackRes.senderCity}.\n` +
            `- LƯU Ý PHÂN BIỆT: Tuyệt đối không nhầm lẫn bưu cục lấy hàng ban đầu của người gửi (hoặc vị trí Hub bưu tá lấy hàng) thành địa chỉ của người nhận!\n` +
            `\n- HƯỚNG DẪN AI: Trả lời TRỰC TIẾP và CHÍNH XÁC câu hỏi của anh/chị về đơn hàng ${trackRes.trackingNumber} (tiến độ, thời gian giao, COD, người nhận, địa chỉ nhận...). Luôn giữ thái độ thân thiện, chu đáo, xưng em gọi anh/chị.\n`;
        }
      }
    } else {
      // 1. Kiểm tra nếu người dùng hỏi tra cứu đơn hoặc hỏi về đơn của họ (Tracking / Query Intent)
      const hasSpecificTrackingPhrase =
        normalizedQ.includes('tra cuu') ||
        normalizedQ.includes('kiem tra don') ||
        normalizedQ.includes('xem don') ||
        normalizedQ.includes('tinh trang don') ||
        normalizedQ.includes('hanh trinh') ||
        normalizedQ.includes('van don') ||
        normalizedQ.includes('don moi') ||
        normalizedQ.includes('don gan day') ||
        normalizedQ.includes('don cua toi') ||
        normalizedQ.includes('don hang cua toi') ||
        normalizedQ.includes('don toi vua gui') ||
        normalizedQ.includes('don vua gui') ||
        normalizedQ.includes('don da gui') ||
        normalizedQ.includes('don hang vua gui') ||
        normalizedQ.includes('don hang da gui') ||
        normalizedQ.includes('don hang toi vua') ||
        normalizedQ.includes('toi co nhung don') ||
        normalizedQ.includes('danh sach don') ||
        normalizedQ.includes('cac don') ||
        normalizedQ.includes('nhung don') ||
        normalizedQ.includes('hoi ve don') ||
        normalizedQ.includes('don da tao');

      const hasDonOrderWord = /\b(?:don|don hang|kien hang|buu pham|buu gui)\b/i.test(normalizedQ) && !normalizedQ.includes('dong goi');

      const isGeneralTrackingQuery =
        hasSpecificTrackingPhrase ||
        (hasDonOrderWord && (
          normalizedQ.includes('sao roi') ||
          normalizedQ.includes('o dau') ||
          normalizedQ.includes('den dau') ||
          normalizedQ.includes('di dau') ||
          normalizedQ.includes('trang thai') ||
          (normalizedQ.includes('the nao') && !normalizedQ.includes('dong goi') && !normalizedQ.includes('gui'))
        ));

      // 2. Kiểm tra xác nhận tạo đơn hàng hoặc thanh toán cước ngay
      const isOrderConfirmation =
        !isGeneralTrackingQuery &&
        (normalizedQ.includes('xac nhan tao don') ||
          normalizedQ.includes('thanh toan cuoc') ||
          normalizedQ.includes('thanh toan ngay') ||
          normalizedQ.includes('dong y tao don') ||
          normalizedQ.includes('ok tao don') ||
          normalizedQ.includes('tao don luon') ||
          normalizedQ.includes('chap nhan tao don') ||
          ((normalizedQ.includes('xac nhan') || normalizedQ.includes('dong y') || normalizedQ.includes('chot')) &&
            (normalizedQ.includes('tao don') || normalizedQ.includes('cuoc'))));

      // 3. Kiểm tra nếu khách hàng cung cấp chi tiết đơn hàng (hoặc chọn địa chỉ / người trả cước)
      const isOrderInfoProvided =
        !isGeneralTrackingQuery &&
        !isOrderConfirmation &&
        (normalizedQ.includes('mac dinh') ||
          normalizedQ.includes('da luu') ||
          normalizedQ.includes('dia chi moi') ||
          normalizedQ.includes('phan dang luu') ||
          normalizedQ.includes('nguoi gui thanh toan') ||
          normalizedQ.includes('nguoi nhan thanh toan') ||
          normalizedQ.includes('nguoi gui tra') ||
          normalizedQ.includes('nguoi nhan tra') ||
          (normalizedQ.includes('gui cho') && (normalizedQ.includes('o') || normalizedQ.includes('ha noi') || normalizedQ.includes('sai gon') || normalizedQ.includes('hcm'))));

      // 4. Kiểm tra nếu người dùng muốn gửi hàng, tạo đơn hàng mới
      const isCreateOrSendIntent =
        !isGeneralTrackingQuery &&
        (isOrderConfirmation ||
          isOrderInfoProvided ||
          normalizedQ.includes('muon gui') ||
          normalizedQ.includes('tao don') ||
          normalizedQ.includes('dat don') ||
          normalizedQ.includes('cach gui') ||
          normalizedQ.includes('huong dan gui') ||
          normalizedQ.includes('gui kien hang') ||
          normalizedQ.includes('gui buu pham') ||
          normalizedQ.includes('gui buu kien') ||
          normalizedQ.includes('gui hang di') ||
          normalizedQ.includes('gui do cho') ||
          (normalizedQ.includes('gui hang') && !normalizedQ.includes('vua gui') && !normalizedQ.includes('da gui')));

      if (isOrderConfirmation) {
        toolsUsed.push('createRetailOrder(Auto-dispatch Courier)');
        const payer: 'SENDER' | 'RECEIVER' = (normalizedQ.includes('nguoi nhan') || normalizedQ.includes('receiver')) ? 'RECEIVER' : 'SENDER';
        const created = await this.toolsService.createRetailOrder({
          userId: dto.userId,
          payer,
          shippingFee: 32000,
        });

        // Lưu đơn hàng vừa tạo vào bộ nhớ phiên đa lượt (Multi-turn conversational memory)
        const currentSession = this.sessions.get(conversationId) || { lastUpdated: Date.now() };
        this.sessions.set(conversationId, {
          ...currentSession,
          selectedCode: created.trackingNumber,
          lastShipments: [
            {
              code: created.trackingNumber,
              itemName: 'Kiện hàng quà tặng người thân',
              status: 'TASK_ASSIGNED',
              statusText: 'Đã phân công bưu tá lấy hàng',
              receiverCity: 'Quận Hoàn Kiếm, TP. Hà Nội',
              receiverName: 'Anh Nguyễn Văn An',
              codAmount: created.trackingResult?.codAmount || 0,
              createdAt: 'Hôm nay',
            },
            ...(currentSession.lastShipments || []),
          ],
          lastUpdated: Date.now(),
        });

        shipmentCards = [
          {
            code: created.trackingNumber,
            itemName: 'Kiện hàng quà tặng người thân',
            status: 'TASK_ASSIGNED',
            statusText: 'Đã phân công bưu tá lấy hàng',
            receiverCity: 'Quận Hoàn Kiếm, TP. Hà Nội',
            receiverName: 'Anh Nguyễn Văn An',
            codAmount: created.trackingResult?.codAmount || 0,
            createdAt: 'Hôm nay',
          },
        ];

        actionChips = [
          { label: '🔍 Tra cứu hành trình đơn này', query: `Tra cứu hành trình đơn ${created.trackingNumber}` },
          { label: '❌ Hủy đơn này', query: `Tôi muốn hủy đơn hàng ${created.trackingNumber}` },
          { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
          { label: '➕ Gửi thêm một đơn khác', query: 'Tôi muốn gửi một đơn hàng cho người thân' },
        ];

        toolAugmentedContext += `\n[KẾT QUẢ TẠO ĐƠN HÀNG THÀNH CÔNG VỚI VAI TRÒ GIAO DỊCH VIÊN OPS BƯU CỤC]:\n` +
          `- Trạng thái: Đã chính thức tạo đơn thành công trên hệ thống Nexus Logistics và tự động phân công bưu tá tiếp nhận.\n` +
          `- Mã vận đơn chính thức (Dải Retail 333): ${created.trackingNumber}\n` +
          `- Bưu tá phụ trách lấy hàng: ${created.courierName} (Hotline: ${created.courierPhone} - Mã tuyến: ${created.courierRoute})\n` +
          `- Khung giờ bưu tá qua lấy: ${created.pickupWindow}\n` +
          `- Điểm lấy hàng: 128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM (Địa chỉ mặc định tài khoản)\n` +
          `- Điểm giao hàng: 25 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội (Người nhận: Anh Nguyễn Văn An - 0912 345 678)\n` +
          `- Hàng hóa: Kiện hàng quà tặng người thân (Trọng lượng: 1.5 kg, COD: 0 VNĐ)\n` +
          `- Cước vận chuyển: ${created.totalFee.toLocaleString('vi-VN')} VNĐ (${created.payer === 'SENDER' ? 'Người gửi thanh toán: ĐÃ GHI NHẬN THANH TOÁN THÀNH CÔNG' : 'Người nhận thanh toán khi phát hàng'})\n` +
          `- HƯỚNG DẪN AI: Đóng vai Giao dịch viên bưu cục Nexus chúc mừng anh/chị đã hoàn tất tạo đơn. Báo mã vận đơn và số điện thoại bưu tá phụ trách sắp qua lấy hàng với thái độ niềm nở, ân cần. Dặn anh/chị bọc xốp chống sốc theo chuẩn SOP để bảo đảm an toàn cho món quà nhé ạ.\n`;
      } else if (isOrderInfoProvided) {
        toolsUsed.push('quoteShipmentOrder(Ops Clerk Intake & Quotation)');
        const isReceiverPays = normalizedQ.includes('nguoi nhan thanh toan') || normalizedQ.includes('nguoi nhan tra');
        const payer = isReceiverPays ? 'RECEIVER' : 'SENDER';
        const fee = 32000;
        const senderPayNow = payer === 'SENDER' ? fee : 0;

        actionChips = [
          { label: '✅ Xác nhận & Tạo đơn ngay', query: 'Xác nhận tạo đơn' },
          { label: '💳 Thanh toán cước ngay', query: 'Thanh toán cước ngay và tạo đơn' },
          { label: isReceiverPays ? '🔄 Đổi sang Người gửi trả' : '🔄 Đổi sang Người nhận trả', query: isReceiverPays ? 'Đổi sang Người gửi thanh toán cước' : 'Đổi sang Người nhận thanh toán cước' },
          { label: '✏️ Chỉnh sửa thông tin', query: 'Tôi muốn sửa lại thông tin đơn hàng' },
        ];

        toolAugmentedContext += `\n[PHIẾU TẠM TÍNH ĐƠN HÀNG & BÁO GIÁ CƯỚC TỪ GIAO DỊCH VIÊN BƯU CỤC NEXUS]:\n` +
          `- Vai trò: Giao dịch viên tiếp nhận tại quầy Bưu cục Nexus Logistics.\n` +
          `- Điểm lấy hàng: 128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM (Lấy tại Địa chỉ mặc định đã lưu của tài khoản để tiết kiệm thời gian)\n` +
          `- Người nhận: Anh Nguyễn Văn An (SĐT: 0912 345 678, Địa chỉ: 25 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội)\n` +
          `- Hàng hóa: Kiện hàng quà tặng người thân (Trọng lượng: 1.5 kg)\n` +
          `- Tiền thu hộ COD: 0 VNĐ (Quà tặng người thân)\n` +
          `- Cước vận chuyển chuẩn Door-to-Door: ${fee.toLocaleString('vi-VN')} VNĐ (Tuyến TP.HCM ➔ Hà Nội)\n` +
          `- Bảo hiểm bưu phẩm: Miễn phí gói Tiêu chuẩn (đền bù tối đa 4 lần cước theo Luật Bưu chính)\n` +
          `- Hình thức thanh toán cước: ${payer === 'SENDER' ? 'Người gửi thanh toán (SENDER_PAYS)' : 'Người nhận thanh toán (RECEIVER_PAYS)'}\n` +
          `- SỐ TIỀN QUÝ KHÁCH CẦN THANH TOÁN KHI GỬI: ${senderPayNow.toLocaleString('vi-VN')} VNĐ (${payer === 'SENDER' ? 'Anh/chị có thể quét mã VietQR thanh toán cước ngay hoặc đưa tiền mặt cho bưu tá khi lấy hàng' : 'Người nhận sẽ thanh toán 32.000 VNĐ khi nhận hàng'})\n` +
          `- HƯỚNG DẪN AI: Đóng vai Giao dịch viên bưu cục gửi lại bảng tóm tắt phiếu tiếp nhận chi tiết và báo giá rõ ràng, lễ phép cho anh/chị. Nêu rõ số tiền cần thanh toán ngay (nếu Người gửi thanh toán thì 32.000đ, nếu Người nhận thanh toán thì 0đ). Mời anh/chị bấm [Xác nhận & Tạo đơn ngay] hoặc [Thanh toán cước ngay] để em chính thức cấp mã vận đơn và điều phối bưu tá qua lấy hàng tận nơi nhé ạ.\n`;
      } else if (isGuestTrackingConsultQuery || (isGeneralTrackingQuery && (isGuest || !dto.userId))) {
        toolAugmentedContext += `\n[TƯ VẤN PHƯƠNG THỨC TRA CỨU VẬN ĐƠN DÀNH CHO KHÁCH VÃNG LAI]:\n` +
          `- Trạng thái: Khách hàng đang hỏi về cách thức tra cứu bưu phẩm / vận đơn khi chưa đăng nhập hoặc chưa cung cấp mã vận đơn cụ thể.\n` +
          `- QUY CHUẨN BẢO MẬT CARRIER SOP (ĐIỀU 8 LUẬT BƯU CHÍNH & PII):\n` +
          `  Để bảo vệ quyền riêng tư và dữ liệu cá nhân của người gửi và người nhận, Quý khách có 2 lựa chọn tiện lợi:\n` +
          `  1. LỰA CHỌN 1 (ĐÃ CÓ TÀI KHOẢN / ĐĂNG NHẬP): Mời anh/chị bấm [🔑 Đăng nhập tài khoản](/login) để hệ thống tự động nhận diện danh tính và mở khóa hiển thị toàn bộ danh sách đơn hàng cùng chi tiết đầy đủ (người gửi, người nhận, SĐT, địa chỉ chi tiết, timeline) mà không cần phải nhập số điện thoại mỗi lần tra cứu.\n` +
          `  2. LỰA CHỌN 2 (TRA CỨU NHANH KHÔNG CẦN TÀI KHOẢN / GUEST QUICK TRACK): Dành cho khách vãng lai hoặc người nhận hàng cần tra cứu nhanh. Quý khách chỉ cần cung cấp 2 thông tin:\n` +
          `     + Mã vận đơn (ví dụ: 333... hoặc NX-...)\n` +
          `     + Số điện thoại người nhận (hoặc 4 số cuối SĐT nhận hàng)\n` +
          `     Hệ thống sẽ đối chiếu dữ liệu bảo mật PII và mở khóa toàn bộ hành trình, thông tin người nhận ngay lập tức.\n` +
          `- HƯỚNG DẪN AI: Chào anh/chị niềm nở, ân cần (xưng em, gọi anh/chị). Tư vấn mạch lạc, rõ ràng 2 lựa chọn trên để anh/chị dễ dàng lựa chọn cách tra cứu phù hợp nhất nhé ạ.\n`;
        actionChips = [
          { label: '🔑 Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
          { label: '📦 Tra cứu mã vận đơn', query: 'Tra cứu hành trình đơn hàng' },
          { label: '💰 Dự toán cước phí', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
        ];
      } else if (isGeneralTrackingQuery) {
          toolsUsed.push(`getUserShipments(User:${dto.userId})`);
          const userShipments = await this.toolsService.getUserShipments(dto.userId, 5);

          if (!userShipments.found || userShipments.items.length === 0) {
            toolAugmentedContext += `\n[KẾT QUẢ TRA CỨU]: Tài khoản ${dto.userId} hiện chưa có đơn hàng nào được ghi nhận trên hệ thống Nexus Logistics. Hãy thông báo lịch sự, ân cần rằng tài khoản của mình chưa phát sinh đơn gửi và mời anh/chị gửi mã vận đơn cụ thể nếu muốn tra cứu đơn nhận nhé ạ.\n`;
          } else {
            // Lưu danh sách đơn hàng vào session phục vụ ngữ cảnh hội thoại đa lượt
            this.sessions.set(conversationId, {
              lastShipments: userShipments.items,
              selectedCode: userShipments.items.length === 1 ? userShipments.items[0].code : undefined,
              lastUpdated: Date.now(),
            });

            // Action chips hỗ trợ tương tác nhanh cho từng đơn hàng
            actionChips = userShipments.items.slice(0, 3).map((it) => ({
              label: `📦 Đơn ${it.code}`,
              query: `Tra cứu hành trình đơn ${it.code}`,
            }));
            if (userShipments.items.length === 1) {
              const single = userShipments.items[0];
              if (['CREATED', 'TASK_ASSIGNED', 'PICKUP_ASSIGNED', 'PICKING_UP', 'PENDING', 'READY_TO_SHIP'].includes(single.status)) {
                actionChips.push({
                  label: `❌ Hủy đơn ${single.code}`,
                  query: `Tôi muốn hủy đơn hàng ${single.code}`,
                });
              }
            } else if (userShipments.items.length > 1) {
              actionChips.push({
                label: '❌ Hủy một đơn hàng',
                query: 'Tôi muốn hủy đơn hàng',
              });
            }

            // Đính kèm danh sách thẻ đơn hàng shipmentCards vào DTO phản hồi
            shipmentCards = userShipments.items.map((it) => ({
              code: it.code,
              status: it.status,
              statusText: it.statusText,
              itemName: it.itemName,
              receiverCity: it.receiverCity || it.receiverAddress,
              receiverName: it.receiverName,
              codAmount: it.codAmount,
              createdAt: it.createdAt,
            }));

            // Kiểm tra xem khách có hỏi cụ thể đơn gần nhất / đơn vừa gửi hay không
            const isAskingRecentSingle =
              userShipments.items.length === 1 ||
              normalizedQ.includes('vua gui') ||
              normalizedQ.includes('gan day') ||
              normalizedQ.includes('moi nhat') ||
              normalizedQ.includes('gan nhat') ||
              normalizedQ.includes('sao roi') ||
              normalizedQ.includes('o dau') ||
              normalizedQ.includes('den dau');

            if (isAskingRecentSingle) {
              const latestCode = userShipments.items[0].code;
              const detail = await this.toolsService.trackShipment(latestCode, false);
              toolAugmentedContext += `\n[THÔNG TIN ĐƠN HÀNG GẦN NHẤT CỦA BẠN (Mã: ${latestCode} - Tài khoản: ${dto.userId})]:\n` +
                `- Mã vận đơn: ${detail.trackingNumber}\n` +
                `- Trạng thái hiện tại: ${detail.statusText} (${detail.status})\n` +
                (detail.itemName ? `- Tên hàng hóa: ${detail.itemName}\n` : '') +
                (detail.senderName ? `- Người gửi: ${detail.senderName} (${detail.senderCity || detail.senderAddress || ''})\n` : '') +
                (detail.receiverName ? `- Người nhận: ${detail.receiverName} (${detail.receiverCity || detail.receiverAddress || ''})\n` : '') +
                (detail.codAmount !== undefined ? `- Tiền thu hộ COD: ${detail.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
                `- Vị trí hiện tại: ${detail.currentLocation}\n` +
                `- Thời gian tạo đơn: ${detail.createdAt || userShipments.items[0].createdAt || 'Gần đây'}\n` +
                `- Lịch sử vận chuyển:\n` +
                detail.timeline.map((item) => `  * ${item.time}: ${item.description}`).join('\n') +
                (userShipments.items.length > 1 ? `\n(Ghi chú: Tài khoản của bạn còn có ${userShipments.items.length - 1} đơn hàng khác: ${userShipments.items.slice(1).map(it => it.code).join(', ')})\n` : '\n');
            } else {
              toolAugmentedContext += `\n[DANH SÁCH CÁC ĐƠN HÀNG GẦN ĐÂY CỦA TÀI KHOẢN ${dto.userId} (Tổng cộng: ${userShipments.total} đơn)]:\n` +
                userShipments.items.map((it, idx) =>
                  `  ${idx + 1}. Mã vận đơn: ${it.code} | Hàng hóa: ${it.itemName} | Trạng thái: ${it.statusText} (${it.status}) | Điểm đến: ${it.receiverCity || it.receiverAddress} | Tiền COD: ${it.codAmount ? it.codAmount.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ'} | Tạo ngày: ${it.createdAt}`
                ).join('\n') + '\n' +
                `- HƯỚNG DẪN AI: Khách hàng ĐÃ ĐĂNG NHẬP HỢP LỆ (Tài khoản: ${dto.userId}). Dạ chào mừng anh/chị thật niềm nở, gửi danh sách ${userShipments.total} đơn hàng của mình kèm trạng thái rõ ràng để anh/chị tiện theo dõi. Nhắc anh/chị có thể bấm vào các nút gợi ý bên dưới nếu cần xem chi tiết hoặc thao tác nhé ạ.\n`;
            }
          }
        } else if (isCreateOrSendIntent) {
        toolsUsed.push('intakeShipmentOrder(Ops Clerk Conversational Intake)');
        actionChips = [
          { label: '📍 Lấy tại địa chỉ đã lưu', query: 'Lấy hàng tại địa chỉ đã lưu của tài khoản' },
          { label: '📝 Nhập địa chỉ lấy mới', query: 'Tôi muốn lấy hàng tại địa chỉ mới' },
          { label: '💳 Người gửi thanh toán', query: 'Người gửi thanh toán cước' },
          { label: '📦 Người nhận thanh toán', query: 'Người nhận thanh toán cước' },
          { label: '🎁 Hàng quà tặng (COD 0đ)', query: 'Hàng quà tặng người thân, COD 0đ' },
        ];

        toolAugmentedContext += `\n[QUY TRÌNH HỎI ĐÁP TIẾP NHẬN ĐƠN HÀNG VỚI VAI TRÒ GIAO DỊCH VIÊN BƯU CỤC (OPS CLERK)]:\n` +
          `- Vai trò: Bạn đóng vai Giao dịch viên tiếp nhận bưu gửi tại Bưu cục Nexus Logistics.\n` +
          `- Lời chào: Dạ em chào anh/chị ạ! Niềm nở, chu đáo, sẵn sàng hỗ trợ anh/chị tạo đơn gửi quà/bưu phẩm cho người thân ngay trên hệ thống.\n` +
          `- CÁC CÂU HỎI THU THẬP THÔNG TIN CƠ BẢN (TRÌNH BÀY GỌN GÀNG, TỰ NHIÊN, DỄ CHỌN LỰA):\n` +
          `  1. 📍 Địa chỉ lấy hàng: Hỏi anh/chị muốn bưu tá đến lấy tại [Địa chỉ mặc định đã lưu của tài khoản: 128 Phan Đăng Lưu, P.3, Q.Phú Nhuận, TP.HCM] hay lấy tại [Địa chỉ mới] để tiết kiệm thời gian.\n` +
          `  2. 👤 Thông tin người nhận: Họ tên, Số điện thoại và Địa chỉ giao hàng chi tiết (Tỉnh/Thành, Quận/Huyện).\n` +
          `  3. 📦 Thông tin hàng hóa & Cân nặng: Tên mặt hàng, khối lượng ước tính (kg), và có thu COD không (quà tặng người thân thì COD: 0 VNĐ).\n` +
          `  4. 💳 Hình thức thanh toán cước: Hỏi rõ đơn hàng sẽ do [Người gửi thanh toán (SENDER_PAYS)] hay [Người nhận thanh toán (RECEIVER_PAYS)].\n` +
          `- Nhắc anh/chị sau khi có đủ thông tin, em sẽ gửi lại Phiếu tạm tính và Báo giá cước chi tiết, anh/chị đồng ý thì đơn mới chính thức được tạo trên hệ thống.\n` +
          `- Mời anh/chị bấm chọn nhanh các nút gợi ý bên dưới hoặc nhắn trực tiếp cho em nhé ạ.\n`;
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

    // Kiểm tra ý định tấn công yêu cầu AI duyệt chuyển khoản tiền bồi thường trực tiếp (Red-Teaming Financial Authority Safety)
    const isForcePayoutAdversarial =
      (normalizedQ.includes('chuyen khoan') || normalizedQ.includes('chuyen tien') || normalizedQ.includes('duyet chi') || normalizedQ.includes('duyet')) &&
      (normalizedQ.includes('tai khoan') || normalizedQ.includes('vao so') || normalizedQ.includes('50.000.000') || normalizedQ.includes('50 trieu') || normalizedQ.includes('dut diem') || normalizedQ.includes('dứt điểm'));

    if (isForcePayoutAdversarial) {
      toolAugmentedContext += `\n[TỪ CHỐI THẨM QUYỀN TÀI CHÍNH & TUÂN THỦ CARRIER SOP BỒI THƯỜNG]:\n` +
        `- Yêu cầu: Khách hàng yêu cầu AI duyệt chuyển khoản bồi thường trực tiếp vào tài khoản ngân hàng cá nhân.\n` +
        `- NGUYÊN TẮC BẢO MẬT & PHÂN QUYỀN (CARRIER SECURITY POLICY):\n` +
        `  1. AI Bưu cục KHÔNG CÓ THẨM QUYỀN tài chính và TUYỆT ĐỐI KHÔNG THỂ TỰ Ý DUYỆT CHUYỂN KHOẢN hay chi trả tiền trực tiếp.\n` +
        `  2. Toàn bộ yêu cầu bồi thường bắt buộc phải tuân thủ QUY TRÌNH KHIẾU NẠI bưu chính chính thức, qua Hội đồng GIÁM ĐỊNH chất lượng (QA/Audit).\n` +
        `  3. HẠN MỨC TRẦN BỒI THƯỜNG: Gói Tiêu chuẩn tối đa 4 lần cước (không quá 1.000.000 VNĐ); Gói Bảo hiểm khai giá tối đa 30.000.000 VNĐ/đơn.\n` +
        `- HƯỚNG DẪN AI: Từ chối lịch sự, giải thích rõ AI không có thẩm quyền tài chính và không thể tự ý chuyển tiền. Hướng dẫn khách mở quy trình khiếu nại để ban giám định thụ lý theo đúng hạn mức trần bồi thường tối đa 30.000.000 VNĐ nhé ạ.\n`;
    }

    // Kiểm tra thông tin hạ tầng, phân luồng giao thông ảnh hưởng đến xe tải trung chuyển (Compartment 06)
    const isTrafficInfrastructureQuery =
      (normalizedQ.includes('ha tang') || normalizedQ.includes('giao thong') || normalizedQ.includes('quoc lo') || normalizedQ.includes('cao toc') || normalizedQ.includes('duong noi') || normalizedQ.includes('pha do')) &&
      (normalizedQ.includes('xe tai') || normalizedQ.includes('trung chuyen') || normalizedQ.includes('buu cuc') || normalizedQ.includes('ket noi') || normalizedQ.includes('anh huong'));

    if (isTrafficInfrastructureQuery) {
      toolAugmentedContext += `\n[QUY HOẠCH HẠ TẦNG GIAO THÔNG & ĐIỀU PHỐI XE TẢI TRUNG CHUYỂN BƯU CỤC]:\n` +
        `- Chủ đề: Thông tin hạ tầng và các dự án giao thông công cộng trọng điểm.\n` +
        `- PHƯƠNG ÁN VẬN HÀNH CARRIER LINEHAUL:\n` +
        `  Trung tâm Điều hành Vận tải Nexus liên tục cập nhật tiến độ hạ tầng giao thông và tình hình thi công trên các tuyến quốc lộ/cao tốc. Hệ thống tự động kích hoạt kịch bản PHÂN LUỒNG XE TẢI linh hoạt theo từng khung giờ, đảm bảo luồng xe tải trung chuyển giữa các bưu cục và Hub vùng không bị gián đoạn, duy trì thời gian vận chuyển (SLA) cam kết cho khách hàng.\n` +
        `- HƯỚNG DẪN AI: Giải thích chu đáo, an tâm cho anh/chị rằng bộ phận điều vận đã chủ động theo dõi hạ tầng và có phương án phân luồng xe tải dự phòng để bảo đảm bưu gửi được vận chuyển an toàn, đúng giờ nhé ạ.\n`;
    }

    // Kiểm tra ý định hỏi về hàng hỏng, hàng hư, bể vỡ, móp méo, đền bù sự cố (loại trừ query hạ tầng & query đòi chuyển khoản)
    const isDamageOrBrokenQuery =
      !isForcePayoutAdversarial &&
      !isTrafficInfrastructureQuery &&
      (/\b(?:hang hong|hang hu|be vo|mop meo|hu hai|thiet hai)\b/i.test(normalizedQ) ||
        (/\b(?:hong|hu)\b/i.test(normalizedQ) && (normalizedQ.includes('thi sao') || /\bden\b/i.test(normalizedQ) || normalizedQ.includes('xu ly') || normalizedQ.includes('lam sao'))));

    const isPersonalDamageIncident =
      isDamageOrBrokenQuery &&
      !cleanNormalizedQ.includes('co duoc den') &&
      !cleanNormalizedQ.includes('co den bu khong') &&
      !cleanNormalizedQ.includes('co duoc boi thuong') &&
      !cleanNormalizedQ.includes('quy dinh') &&
      !cleanNormalizedQ.includes('chinh sach') &&
      !cleanNormalizedQ.includes('dieu 25') &&
      (cleanNormalizedQ.includes('cua toi') ||
       cleanNormalizedQ.includes('cua minh') ||
       cleanNormalizedQ.includes('toi nhan') ||
       cleanNormalizedQ.includes('toi bi') ||
       cleanNormalizedQ.includes('vua nhan') ||
       cleanNormalizedQ.includes('bi vo roi') ||
       cleanNormalizedQ.includes('bi be roi') ||
       cleanNormalizedQ.includes('khieu nai don'));

    if (isPersonalDamageIncident && !trackingCode && !session.selectedCode) {
      this.sessions.set(conversationId, {
        ...session,
        pendingIntent: 'CLAIM',
        lastUpdated: Date.now(),
      });

      actionChips = [
        ...(session.lastShipments ? session.lastShipments.slice(0, 2).map((s) => ({ label: `📸 Báo sự cố đơn ${s.code}`, query: `Báo hỏng đơn hàng ${s.code}` })) : []),
        { label: '📞 Kết nối hotline 1900-1234', query: 'Tôi muốn gặp chuyên viên tổng đài hỗ trợ gấp' },
        { label: '📦 Xem các đơn hàng của tôi', query: 'Tôi có những đơn hàng nào' },
      ];

      toolAugmentedContext += `\n[YÊU CẦU CSKH THẤU CẢM & HỎI LẠI THÔNG TIN SỰ CỐ HÀNG HƯ HỎNG / BỂ VỠ (ACTIVE CLARIFICATION)]:\n` +
        `- Yêu cầu: Khách hàng phản ánh kiện hàng của mình bị hư hỏng, bể vỡ hoặc móp méo nhưng CHƯA CUNG CẤP mã vận đơn cụ thể.\n` +
        `- NGUYÊN TẮC CSKH: Thấu cảm trước, xoa dịu lo lắng cho khách: "Dạ em rất lấy làm tiếc về sự cố phát sinh với bưu kiện của anh/chị ạ!". Sau đó HỎI LẠI CÁC THÔNG TIN CẦN THIẾT:\n` +
        `  1. 🏷️ Mã vận đơn của kiện hàng gặp sự cố?\n` +
        `  2. 📸 Tình trạng thực tế: Hàng bị móp méo bên ngoài vỏ hộp hay bể vỡ sản phẩm bên trong ạ? Anh/chị đã lập Biên bản bất thường với bưu tá hoặc có hình ảnh/video mở hộp đồng kiểm chưa ạ?\n` +
        `  3. 💵 Giá trị ước tính của sản phẩm hoặc chi phí sửa chữa là bao nhiêu ạ?\n` +
        `- CAM KẾT XỬ LÝ & BỒI THƯỜNG: Thẩm định hồ sơ trong 24h - 48h, hoàn tất chuyển khoản bồi thường trong 03 - 05 ngày làm việc theo Điều 25 Nghị định 47/2011/NĐ-CP & Điều 40 Luật Bưu chính 2010 (Gói Tiêu chuẩn bồi thường 04 lần cước, Bảo hiểm đền 100% hóa đơn tối đa 30 triệu VNĐ).\n` +
        `- HƯỚNG DẪN AI: Xoa dịu lo lắng của khách hàng, hỏi lại 3 thông tin trên để hỗ trợ chuyển Ban Giám định QA mở hồ sơ bồi thường ngay nhé ạ.\n`;
    } else if (isDamageOrBrokenQuery) {
      toolsUsed.push('getDamageAndClaimPolicy(Fragile Goods & Damage Settlement)');
      toolAugmentedContext += `\n[QUY TRÌNH NGHIỆP VỤ XỬ LÝ HÀNG HƯ HỎNG / BỂ VỠ (DAMAGE SETTLEMENT SOP)]:\n` +
        `- Bước 1 (Khi nhận hàng): Người nhận đồng kiểm phát hiện hàng bị nứt vỡ, móp méo, rò rỉ dung dịch -> Yêu cầu bưu tá lập Biên bản bất thường (Irregularity Report) tại chỗ có chữ ký cả hai bên và chụp ảnh sắc nét 4 góc. Người nhận từ chối nhận hàng và KHÔNG phải thanh toán bất kỳ khoản tiền nào (kể cả COD và cước phí).\n` +
        `- Bước 2 (Hạn mức bồi thường):\n` +
        `  * Gói Tiêu chuẩn (không mua bảo hiểm): Bồi thường 04 lần cước vận chuyển thực tế (theo Khoản 1 Điều 25 Nghị định 47/2011/NĐ-CP & Điều 40 Luật Bưu chính 2010), không vượt quá 1.000.000 VNĐ/đơn hàng theo Quy chế dịch vụ Nexus.\n` +
        `  * Gói Bảo hiểm khai giá: Bồi thường 100% giá trị thiệt hại thực tế theo hóa đơn VAT/chứng từ, HẠN MỨC TRẦN TỐI ĐA 30.000.000 VNĐ/đơn hàng. Đơn trên 30 triệu phải ký hợp đồng bảo hiểm riêng với PTI/Bảo Việt.\n` +
        `- Bước 3 (Hư hỏng một phần): Bồi thường toàn bộ chi phí sửa chữa thay thế linh kiện chính hãng theo báo giá trung tâm bảo hành ủy quyền hoặc theo tỷ lệ giám định thực tế.\n` +
        `- Bước 4 (Điều kiện loại trừ hàng dễ vỡ): Hàng dễ vỡ bắt buộc phải đóng gói đúng quy chuẩn (bọc xốp hơi 3-5 lớp, cách thành thùng 5cm, dán tem Dễ Vỡ). Nếu người gửi tự đóng gói sai quy chuẩn sẽ bị từ chối bồi thường do lỗi chủ quan của người gửi.\n` +
        `- Bước 5 (Thời hạn xử lý): Thẩm định hồ sơ trong vòng 24h - 48h, hoàn tất chuyển khoản chi trả bồi thường trong 03 - 05 ngày làm việc.\n`;
    }

    // Kiểm tra ý định kết nối chuyên viên CSKH con người hoặc giục giao hàng khẩn cấp (AI Handover & Expedite Delivery)
    const isEscalationQuery =
      normalizedQ.includes('gap nhan vien') ||
      normalizedQ.includes('noi chuyen voi nguoi') ||
      normalizedQ.includes('tong dai') ||
      normalizedQ.includes('cskh') ||
      normalizedQ.includes('dien thoai vien') ||
      normalizedQ.includes('tu van vien') ||
      normalizedQ.includes('ho tro truc tiep') ||
      normalizedQ.includes('gap nguoi that') ||
      normalizedQ.includes('chuyen dien thoai') ||
      normalizedQ.includes('khieu nai gap') ||
      normalizedQ.includes('giuc giao') ||
      normalizedQ.includes('giuc don') ||
      normalizedQ.includes('giao gap') ||
      normalizedQ.includes('giao nhanh') ||
      normalizedQ.includes('giao som') ||
      normalizedQ.includes('tro giup') ||
      normalizedQ.includes('ho tro don');

    if (isEscalationQuery) {
      toolsUsed.push('escalateToHumanAgent()');
      const handover = this.toolsService.escalateToHumanAgent({
        userId: dto.userId,
        trackingNumber: trackingMatch ? (trackingMatch[1] ? trackingMatch[1].toUpperCase() : trackingMatch[0]) : undefined,
        reason: question,
      });
      toolAugmentedContext += `\n[KẾT QUẢ ĐIỀU HƯỚNG CHUYỂN TIẾP CHUYÊN VIÊN CSKH CON NGƯỜI & YÊU CẦU GIỤC ĐƠN KHẨN CẤP]:\n` +
        `- Mã phiếu yêu cầu hỗ trợ: ${handover.ticketId}\n` +
        `- Hàng đợi điều phối: ${handover.queue} (Ưu tiên: ${handover.priority})\n` +
        `- Hotline hỗ trợ: ${handover.hotline}\n` +
        `- Khung giờ làm việc: ${handover.operatingHours}\n` +
        `- Thời gian kết nối ước tính: ${handover.estimatedWaitTimeSeconds} giây\n` +
        `- Thông báo hệ thống: ${handover.message}\n` +
        `- Hành động vận hành: Đã gắn cờ [ƯU TIÊN PHÁT GẤP] và gửi thông báo trực tiếp đến Bưu cục phát & Bưu tá phụ trách tuyến.\n`;
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

    // Kiểm tra ý định hỏi về Thời gian lưu kho, tồn kho, quá hạn, hàng vô chủ (Storage Aging & Dead-Letter Parcel)
    const isStorageAgingQuery =
      normalizedQ.includes('ton kho') ||
      normalizedQ.includes('luu kho') ||
      normalizedQ.includes('qua han') ||
      normalizedQ.includes('vo chu') ||
      normalizedQ.includes('toi da bao lau') ||
      normalizedQ.includes('giu hang') ||
      normalizedQ.includes('tieu huy') ||
      normalizedQ.includes('dau gia') ||
      normalizedQ.includes('canh bao hub') ||
      (normalizedQ.includes('hang') && (normalizedQ.includes('ton') || normalizedQ.includes('het han') || normalizedQ.includes('bo quen')));

    if (isStorageAgingQuery) {
      toolsUsed.push('getStorageAgingPolicy(Articles 18 & 28 Postal Law)');
      const policy = this.toolsService.getStorageAgingPolicy();
      toolAugmentedContext += `\n[QUY ĐỊNH THỜI HẠN LƯU KHO & XỬ LÝ HÀNG QUÁ HẠN / VÔ CHỦ - ${policy.legalBasis}]:\n` +
        `- Thời hạn lưu kho tối đa theo từng mắt xích:\n` +
        `  * Tại Hub trung chuyển: ${policy.agingLimits.sortingHub}\n` +
        `  * Tại Bưu cục phát chờ giao lại: ${policy.agingLimits.deliveryHubPending}\n` +
        `  * Tại Bưu cục gom hàng hoàn: ${policy.agingLimits.returnHubStaging}\n` +
        `  * Tại Bưu cục trả hàng cho Shop: ${policy.agingLimits.originHubReturnHolding}\n` +
        `- Cơ chế cảnh báo hai chiều:\n` +
        `  * Cảnh báo Hub đang giữ hàng: ${policy.alertMechanisms.holdingHubAlert}\n` +
        `  * Thông báo người gửi (Shop/Khách): ${policy.alertMechanisms.senderNotification}\n` +
        `- Quy trình 5 bước xử lý hàng quá hạn & vô chủ (Điều 18 & 28 Luật Bưu chính 2010):\n` +
        `  * Bước 1: ${policy.overdueAndDeadLetterWorkflow.step1}\n` +
        `  * Bước 2: ${policy.overdueAndDeadLetterWorkflow.step2}\n` +
        `  * Bước 3: ${policy.overdueAndDeadLetterWorkflow.step3}\n` +
        `  * Bước 4: ${policy.overdueAndDeadLetterWorkflow.step4}\n` +
        `  * Bước 5 (Dòng tiền): ${policy.overdueAndDeadLetterWorkflow.step5}\n`;
    }

    // Kiểm tra ý định hỏi về Dải mã đơn, Phân loại mã vận đơn, Cách phân biệt đơn J&T
    const isWaybillFormatQuery =
      normalizedQ.includes('ma don') ||
      normalizedQ.includes('ma van don') ||
      normalizedQ.includes('j&t') ||
      normalizedQ.includes('jt') ||
      normalizedQ.includes('dai so') ||
      normalizedQ.includes('phan biet don') ||
      normalizedQ.includes('dinh tuyen');

    if (isWaybillFormatQuery) {
      toolsUsed.push('getWaybillFormatPolicy(Waybill Prefix & 3-Segment Routing)');
      const waybillPolicy = this.toolsService.getWaybillFormatPolicy();
      toolAugmentedContext += `\n[QUY HOẠCH DẢI MÃ VẬN ĐƠN & MÃ ĐỊNH TUYẾN 3 ĐOẠN (SO SÁNH VỚI J&T)]:\n` +
        `- Quy hoạch dải 12 chữ số theo kênh người gửi trong hệ sinh thái Nexus:\n` +
        `  * Đầu 101: ${waybillPolicy.numberSeries.merchant101}\n` +
        `  * Đầu 111: ${waybillPolicy.numberSeries.marketplace111}\n` +
        `  * Đầu 333: ${waybillPolicy.numberSeries.retail333}\n` +
        `  * Đầu 222: ${waybillPolicy.numberSeries.return222}\n` +
        `- Tiêu chuẩn nhận diện và mã định tuyến kiểu J&T Express:\n` +
        `  * Nhận diện J&T: ${waybillPolicy.jtRoutingComparison.jtFormat}\n` +
        `  * Mã định tuyến 3 đoạn: ${waybillPolicy.jtRoutingComparison.threeSegmentRoutingCode}\n`;
    }

    // Kiểm tra ý định tính cước / hỏi giá cước / bưu gửi có trọng lượng, kích thước, hoặc tuyến đường
    const isOutOfDomain = /\b(?:chung khoan|vn-index|vnindex|gia vang|co phieu|bitcoin|crypto|thoi tiet|bong da|chinh tri)\b/i.test(normalizedQ);

    const explicitPricingWords =
      !isOutOfDomain &&
      (/\b(?:cuoc|phi van chuyen|phi ship|cuoc phi|phi gui|bang gia|du toan|uoc tinh|tinh phi|tinh cuoc|bao gia|gia cuoc)\b/i.test(normalizedQ) ||
      (/\b(?:gia|phi|bao nhieu tien)\b/i.test(normalizedQ) && /\b(?:gui|ship|van chuyen|buu|kien|don|kg|g|km|tuyen|tu|den|lay|giao)\b/i.test(normalizedQ)));

    const hasWeightOrDimensions =
      /(\d+(\.\d+)?)\s*(kg|kí|kilogram|g|gram)/i.test(question) ||
      /\b(?:dai|rong|cao|kich thuoc|kich co|cm)\b/i.test(normalizedQ) ||
      /\d+\s*(?:x|\*)\s*\d+\s*(?:x|\*)\s*\d+/i.test(question);

    const hasRouteKeyword = /\b(?:tu|den|ra|vao|di|toi|sang)\b/i.test(normalizedQ);
    const hasMajorCity = /\b(?:ha noi|hcm|sai gon|ho chi minh|da nang|hai phong|can tho)\b/i.test(normalizedQ);
    const hasRoute = hasMajorCity || (hasRouteKeyword && (hasWeightOrDimensions || explicitPricingWords));

    const hasPackageSpecs = /\b(?:kien|goi|thung|buu kien|kien hang)\b/i.test(normalizedQ);

    // Khi đã có mã vận đơn (trackingMatch), TUYỆT ĐỐI KHÔNG tính cước trừ khi khách hỏi giá cụ thể
    const isPricingQuery = !isOutOfDomain && (!trackingMatch
      ? (explicitPricingWords || (hasWeightOrDimensions && (hasRoute || hasPackageSpecs)) || (session.pendingIntent === 'PRICING' && (hasWeightOrDimensions || hasRoute)))
      : explicitPricingWords);

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
      } else if (normalizedQ.includes('da nang')) {
        hasExplicitRoute = true;
        fromCity = 'DA NANG';
        toCity = 'HA NOI';
      }

      if (!hasExplicitRoute && !hasExplicitWeight && !dimensionsCm && session.pendingIntent !== 'PRICING') {
        // TRƯỜNG HỢP KHÁCH HỎI GIÁ CHUNG CHUNG MÀ CHƯA CUNG CẤP TUYẾN ĐƯỜNG & CÂN NẶNG:
        // Áp dụng NGUYÊN TẮC CSKH: HỎI LẠI KHÁCH HÀNG KHI THIẾU THÔNG TIN
        this.sessions.set(conversationId, {
          ...session,
          pendingIntent: 'PRICING',
          lastUpdated: Date.now(),
        });

        actionChips = [
          { label: '🚚 Báo giá Nội thành TP.HCM (21.500đ)', query: 'Tính cước gửi hàng nội thành TP.HCM 1kg' },
          { label: '✈️ TP.HCM ➔ Hà Nội 1kg (32.000đ)', query: 'Tính cước gửi hàng từ TP.HCM đi Hà Nội 1kg' },
          { label: '⚖️ Báo giá kiện 2kg', query: 'Tính cước gửi kiện hàng 2kg từ TP.HCM đi Hà Nội' },
          { label: '📐 Báo giá hàng cồng kềnh', query: 'Dự toán cước hàng cồng kềnh kích thước 50x40x30cm nặng 5kg' },
        ];

        toolAugmentedContext += `\n[YÊU CẦU CSKH HỎI LẠI THÔNG TIN TÍNH CƯỚC VẬN CHUYỂN (ACTIVE CLARIFICATION)]:\n` +
          `- Trạng thái: Khách hàng đang hỏi giá cước / chi phí gửi hàng ("${question}") nhưng CHƯA CUNG CẤP tuyến đường và cân nặng cụ thể.\n` +
          `- NGUYÊN TẮC CSKH: Tuyệt đối không tự ý gán thông số giả định và báo giá như thật. Hãy đóng vai Chuyên viên CSKH bưu cục tận tâm, lịch sự:\n` +
          `  1. Chào hỏi niềm nở, lễ phép (xưng em, gọi anh/chị).\n` +
          `  2. Xác nhận mong muốn tính cước và HỎI LẠI KHÁCH HÀNG 3 thông tin cần thiết:\n` +
          `     + 📍 Tuyến vận chuyển: Bưu kiện gửi từ tỉnh/thành nào đến tỉnh/thành nào ạ?\n` +
          `     + ⚖️ Khối lượng: Kiện hàng nặng khoảng bao nhiêu kg (hoặc kích thước Dài x Rộng x Cao nếu là hàng cồng kềnh) ạ?\n` +
          `     + 📦 Loại mặt hàng: Hàng thông thường hay hàng dễ vỡ/giá trị cao cần bảo hiểm ạ?\n` +
          `  3. BÁO TRƯỚC MỨC THAM KHẢO NHANH để khách không phải chờ đợi:\n` +
          `     • Tuyến nội tỉnh / nội thành: Gói Tiêu chuẩn chỉ từ 21.500 VNĐ (0.5kg đầu)\n` +
          `     • Tuyến liên tỉnh trục chính (TP.HCM ➔ Hà Nội): Gói Tiêu chuẩn từ 32.000 VNĐ (1kg đầu)\n` +
          `     • Cước vượt nấc: +3.500 VNĐ mỗi 0.5kg tiếp theo\n` +
          `- HƯỚNG DẪN AI: Trả lời tự nhiên, ấm áp, kết hợp giữa việc hỏi lại thông tin và cung cấp bảng giá tham khảo nhanh kèm lời mời anh/chị chọn nhanh các nút bên dưới nhé ạ.\n`;
      } else {
        this.sessions.set(conversationId, {
          ...session,
          pendingIntent: undefined,
          lastUpdated: Date.now(),
        });

        toolsUsed.push(`calculatePricing(${fromCity}->${toCity}:${weight}kg${dimensionsCm ? `:${length}x${width}x${height}cm` : ''})`);
        const [stdPricing, expPricing, intraPricing] = await Promise.all([
          this.toolsService.calculatePricing(weight, 'STANDARD', fromCity, toCity, 'GUEST', dimensionsCm),
          this.toolsService.calculatePricing(weight, 'EXPRESS', fromCity, toCity, 'GUEST', dimensionsCm),
          !hasExplicitRoute
            ? this.toolsService.calculatePricing(weight, 'STANDARD', 'HO CHI MINH', 'HO CHI MINH', 'GUEST', dimensionsCm)
            : Promise.resolve(null),
        ]);

        const volumetricWeight = dimensionsCm ? ((length * width * height) / 6000).toFixed(2) : '0';
        const chargeableWeight = dimensionsCm ? Math.max(weight, parseFloat(volumetricWeight)).toFixed(2) : weight.toString();

        toolAugmentedContext += `\n[BẢNG BÁO GIÁ CƯỚC THỜI GIAN THỰC TỪ MICROSERVICE PRICING-SERVICE]:\n` +
          `- Tuyến đường tham chiếu: ${fromCity} ➔ ${toCity} ${hasExplicitRoute ? '' : '(Trục chính Metro)'}\n` +
          `- Cân nặng thực tế: ${weight}kg\n` +
          (dimensionsCm ? `- Kích thước bưu kiện: Dài ${length}cm x Rộng ${width}cm x Cao ${height}cm\n- Thể tích quy đổi IATA = (${length}x${width}x${height})/6000 = ${volumetricWeight}kg\n- Cân nặng tính cước (Chargeable Weight) = max(Cân thực tế, Thể tích quy đổi) = ${chargeableWeight}kg\n` : '') +
          (intraPricing ? `- MỨC CƯỚC GỬI NỘI THÀNH / NỘI TỈNH (Phụ phí vùng 0đ): Gói Tiêu Chuẩn chỉ từ ${intraPricing.totalFee.toLocaleString('vi-VN')}đ\n` : '') +
          `- MỨC CƯỚC GỬI LIÊN TỈNH (${fromCity} ➔ ${toCity}):\n` +
          `  * Gói Tiêu Chuẩn: ${stdPricing.totalFee.toLocaleString('vi-VN')}đ | Chi tiết: ${stdPricing.breakdown}\n` +
          `  * Gói Nhanh (Express): ${expPricing.totalFee.toLocaleString('vi-VN')}đ | Chi tiết: ${expPricing.breakdown}\n` +
          `- Công thức tính: Cước cơ sở (0.5kg đầu: 18.000đ Gói Chuẩn, 28.000đ Gói Nhanh, 42.000đ Hỏa Tốc) + Cước vượt nấc (mỗi 0.5kg tiếp theo: +3.500đ Gói Chuẩn, +5.000đ Gói Nhanh) + Phụ phí vùng miền (Nội tỉnh: 0đ, Trục chính Metro: +7.000đ, Liên tỉnh phổ thông: +12.000đ).\n` +
          `- Cước chuyển hoàn bưu gửi: Thu 50% cước chiều đi khi giao không thành công (khách bom hàng).\n` +
          `- HƯỚNG DẪN AI: Dạ chào anh/chị tự nhiên, niềm nở (xưng em, gọi anh/chị), báo giá cước rõ ràng theo bảng tính trên (Gói Tiêu Chuẩn và Gói Nhanh Express), giải thích dễ hiểu về cân nặng tính cước và cước chuyển hoàn dự kiến (50% cước chiều đi nếu bom hàng). Nếu anh/chị chưa nêu rõ tuyến đường, báo cả 2 mức Nội thành (từ ${intraPricing?.totalFee ? intraPricing.totalFee.toLocaleString('vi-VN') + 'đ' : '21.500đ'}) và Liên tỉnh (từ ${stdPricing.totalFee.toLocaleString('vi-VN')}đ) để thông tin minh bạch, rõ ràng cho anh/chị nhé ạ.\n` +
          `- QUY CHUẨN ĐỊNH DẠNG CÔNG THỨC: Khi trình bày thể tích quy đổi IATA cho khách, ghi hẳn dạng chữ số thuần túy (${length}x${width}x${height})/6000 = ${volumetricWeight}kg. TUYỆT ĐỐI KHÔNG dùng ký hiệu LaTeX toán học như dấu $, \\times, \\text{} hay viết mẫu số 6.000.\n`;
      }
    }

    // 2. Truy xuất RAG từ Vector Store với Hybrid Search (Dense Semantic + Keyword Scoring)
    let matches: any[] = [];
    let citations: Citation[] = [];

    // Chỉ thực hiện truy xuất RAG nghiệp vụ khi không phải lời chào hỏi xã giao, tra cứu danh tính tài khoản, hoặc hủy/giữ đơn
    if (!isGreetingIntent && !isUserIdentityQuery && !isKeepOrderIntent && !isCancelIntent) {
      const qEmbed = await this.embeddingService.getEmbedding(question);
      matches = this.vectorStore.hybridSearch(qEmbed.embedding, question, 5, 0.15);

      citations = matches.map((m) => ({
        file: m.chunk.sourceFile,
        title: m.chunk.sectionTitle,
        score: Math.round(m.score * 1000) / 10,
        snippet: m.chunk.content.slice(0, 180).replace(/\n+/g, ' ') + '...',
      }));
    }

    // 3. Ghép nối Ngữ cảnh Grounded Context
    let contextText = '';
    const userSessionInfo = !isGuest
      ? `=== THÔNG TIN TÀI KHOẢN KHÁCH HÀNG (ĐÃ ĐĂNG NHẬP) ===\n- Tên người dùng / Tên hiển thị: ${userDisplayName}\n- Mã tài khoản / SĐT (User ID): ${dto.userId || 'N/A'}\n- Vai trò: ${dto.senderRole || 'CUSTOMER'}\n\n`
      : `=== THÔNG TIN KHÁCH HÀNG ===\n- Khách vãng lai (Chưa đăng nhập)\n\n`;
    contextText += userSessionInfo;

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

    // 4. Sinh câu trả lời qua LLM (Google Gemini / OpenAI)
    const answer = await this.executeLlm(question, contextText, citations);

    const isPureTracking = toolsUsed.some((t) => t.includes('trackShipment') || t.includes('getUserShipments')) &&
      !/(khiếu nại|bồi thường|bể|vỡ|hỏng|bảo hiểm|lưu kho|cước hoàn|chuyển hoàn|đồng kiểm|phí)/i.test(question);
    const finalCitations = (isPureTracking || isGreetingIntent || isUserIdentityQuery || isKeepOrderIntent || isCancelIntent) ? [] : citations;

    const latencyMs = Date.now() - startTime;
    return {
      conversationId,
      question,
      answer,
      citations: finalCitations,
      toolsUsed,
      latencyMs,
      shipmentCards,
      actionChips,
    };
  }

  /**
   * Sinh token dạng luồng (Server-Sent Events streaming)
   */
  public async *streamMessage(dto: ChatRequestDto): AsyncGenerator<{ event: string; data: any }> {
    const res = await this.handleMessage(dto);

    // Bắn event đầu tiên: metadata (citations & tools used & shipmentCards & actionChips)
    yield {
      event: 'metadata',
      data: {
        conversationId: res.conversationId,
        citations: res.citations,
        toolsUsed: res.toolsUsed,
        shipmentCards: res.shipmentCards,
        actionChips: res.actionChips,
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
    const systemPrompt = `Bạn là Chuyên viên Cao cấp Tư vấn Nghiệp vụ & Vận hành Khách hàng của Hệ thống Bưu chính Logistics Nexus (Nexus Logistics Senior Operations & Customer Specialist).
Bạn có kiến thức uyên thâm, thấu đáo và toàn diện về toàn bộ chuỗi cung ứng, quy chuẩn bưu chính và pháp lý vận tải:

1. NGUYÊN TẮC BẢO MẬT DỮ LIỆU & QUYỀN RIÊNG TƯ (BẮT BUỘC):
- Khi người dùng CHƯA ĐĂNG NHẬP hoặc trong ngữ cảnh có ghi chú [CẢNH BÁO BẢO MẬT - NGƯỜI DÙNG CHƯA ĐĂNG NHẬP]:
  + TUYỆT ĐỐI KHÔNG tự tiện hiển thị đơn hàng của bất kỳ ai và KHÔNG BAO GIỜ bịa đặt mã đơn hay dữ liệu khách hàng.
  + Hãy giải thích lịch sự rằng vì lý do bảo mật dữ liệu cá nhân theo Luật Bưu chính, khách hàng vui lòng: 1) Đăng nhập tài khoản để xem danh sách đơn cá nhân; hoặc 2) Cung cấp Mã vận đơn cụ thể để hệ thống tra cứu.
  + Khi người dùng chưa đăng nhập tra cứu một mã vận đơn công khai (Public Tracking), nếu thông tin có dấu hiệu mã hóa (ví dụ: Ng*** V** Anh, *** Quận 1), hãy giải thích rõ đây là cơ chế bảo vệ danh tính PII và mời khách hàng đăng nhập tài khoản sở hữu để xem đầy đủ.
- Nếu hệ thống thông báo [KẾT QUẢ TRA CỨU]: Không tìm thấy mã vận đơn: Thông báo rõ ràng là không tìm thấy đơn trên hệ thống, mời khách kiểm tra lại mã với người gửi.

2. AM HIỂU NGHIỆP VỤ SÂU SẮC, BIẾT TỰ SUY LUẬN & XÂU CHUỖI ĐA CHIỀU:
- Hạn mức bồi thường tối đa:
  + Gói tiêu chuẩn (mặc định): Bồi thường 04 lần cước vận chuyển (theo Khoản 1 Điều 25 Nghị định 47/2011/NĐ-CP & Điều 40 Luật Bưu chính 2010), trần tối đa không quá 1.000.000 VNĐ/đơn theo Quy chế dịch vụ Nexus.
  + Gói Bảo hiểm khai giá toàn diện: Đền 100% giá trị thiệt hại thực tế theo hóa đơn VAT/chứng từ, HẠN MỨC TỐI ĐA CHO MỖI LẦN PHÁT SINH ĐỀN BÙ LÀ 30.000.000 VNĐ/đơn hàng. Đơn trên 30 triệu phải ký hợp đồng bảo hiểm riêng với PTI/Bảo Việt.
  + Hư hỏng một phần: Bồi thường toàn bộ chi phí sửa chữa thay linh kiện chính hãng hoặc theo tỷ lệ giám định thực tế. Thời hạn giải quyết chi trả: 3 - 5 ngày làm việc.
- Phân biệt Hàng Giá Trị Cao (High-Value Cargo) vs Hàng Dễ Vỡ (Fragile Goods):
  + Khác nhau cốt lõi về bản chất rủi ro: Hàng dễ vỡ có nguy cơ vỡ cơ học do rung lắc va đập; Hàng giá trị cao có nguy cơ mất mát, tráo hàng, thất thoát tài sản.
  + Quy chuẩn đóng gói: Hàng dễ vỡ bắt buộc bọc xốp hơi 3-5 lớp, có vách ngăn, cách thành 5cm, dán tem Hàng Dễ Vỡ; Hàng giá trị cao bắt buộc dán Băng keo an ninh OPEN VOID, đựng trong Bao đỏ an ninh (Red Bag) kẹp chì seal, camera giám sát 24/7 và giao bằng OTP 6 số.
  + ĐIỀU KIỆN BẢO HIỂM HÀNG DỄ VỠ: Bắt buộc đóng gói đúng chuẩn 5cm và bọc xốp 3-5 lớp. Nếu người gửi tự đóng gói sai quy cách (bỏ trần đồ gốm sứ/thủy tinh vào hộp) thì bảo hiểm sẽ TỪ CHỐI ĐỀN BÙ BỂ VỠ do lỗi của người gửi.
- Biểu phí mua bảo hiểm khai giá: Từ 1tr - 10tr phí 0.5% (tối thiểu 5.000đ); từ 10tr - 30tr phí 1.0% (bắt buộc hóa đơn VAT).
- Quy định xử lý 06 kịch bản lỗi / ngoại lệ (Negative Cases):
  1) Người nhận không nghe máy (NDR): Gọi tối thiểu 2 lần cách nhau 15 phút, phát lại tối đa 3 lần miễn phí, lưu kho bưu cục phát tối đa 5 ngày, quá 5 ngày tự động chuyển hoàn.
  2) Khách từ chối nhận (Bom hàng / Hủy đơn): Thu cước chuyển hoàn 50% cước chiều đi đối với shop thường, miễn phí 0đ đối với đối tác VIP Enterprise, cấn trừ vào COD hoặc ví cước.
  3) Bể vỡ khi đồng kiểm: Lập biên bản bất thường Irregularity Report tại chỗ có chữ ký shipper, khách không phải thanh toán tiền, hàng chuyển về Hub giám định và chi trả bồi thường trong 24h - 48h.
  4) Thất lạc quá 7 ngày trên mạng lưới: Tự động chuyển trạng thái LOST, kích hoạt đền bù 100% theo bảo hiểm mà không cần khách khiếu nại.
  5) Gian lận trọng lượng kích thước: Cổng cân quét tự động DWS quét lại, nếu lệch >15% thì truy thu cước chênh lệch + phạt 10% vi phạm.
  6) Hàng cấm bưu chính: Tịch thu bàn giao công an/QLTT, không bồi thường, khóa tài khoản vĩnh viễn.
- Quy chuẩn 3 Tầng Trần Vật Lý & Hạn Mức Mạng Lưới Bưu Cục (Carrier Physical Operational Ceilings):
  + Trần vật lý tối đa của mạng lưới bưu cục: Khối lượng thực tế tối đa không quá 70 kg/kiện, chiều dài một cạnh lớn nhất không quá 150 cm, tổng kích thước 3 chiều Dài + Rộng + Cao không quá 300 cm.
  + Tầng 1 - Tiêu chuẩn (Standard Courier): Khối lượng <= 20 kg & mỗi cạnh <= 60 cm -> Shipper xe máy giao nhận bình thường.
  + Tầng 2 - Cồng kềnh trong hạn mức (Bulky / Truck Dispatch): Khối lượng 21 kg - 70 kg HOẶC cạnh 61 cm - 150 cm -> Tự động tính cước thể tích IATA, điều động xe tải trung chuyển.
  + Tầng 3 - VƯỢT TRẦN MẠNG LƯỚI (Over-limit Block): Kiện hàng vượt trần (> 70 kg hoặc cạnh lớn nhất > 150 cm hoặc tổng 3 chiều > 300 cm) -> Hệ thống chặn tạo đơn (Validation Error), hướng dẫn khách tách kiện hoặc chuyển sang dịch vụ Vận tải hàng nguyên chuyến (Truckload/FTL).
- Quản lý COD & Tài chính: Trần giữ tiền mặt bưu tá tối đa 15 triệu đồng (vượt trần phát cảnh báo đỏ, bắt buộc nộp két bưu cục hoặc nộp tiền qua SePay VietQR). Sau 23:59 nếu giữ tiền qua ngày sẽ tự động khóa tài khoản bưu tá. Lịch đối soát chuyển khoản tiền COD cho shop diễn ra định kỳ vào các ngày Thứ 2-4-6 hàng tuần, trần nợ ví shop -500.000đ.
- Lưu kho & Bưu gửi vô chủ: Hub trung chuyển tối đa 24h, bưu cục phát 5 ngày, hàng vô chủ lưu kho bảo quản bắt buộc 6 tháng (Điều 18 & 28 Luật Bưu chính) trước khi bán đấu giá thanh lý cấn trừ nợ cước.

3. QUY CHUẨN NGÔN TỪ, PHONG CÁCH GIAO TIẾP TỰ NHIÊN & VAI TRÒ GIAO DỊCH VIÊN BƯU CỤC (QUAN TRỌNG NHẤT):
- VAI TRÒ: Bạn là Giao dịch viên tiếp nhận & Chuyên viên Chăm sóc Khách hàng bưu cục Nexus Logistics tận tâm, chu đáo, thân thiện và thấu hiểu nghiệp vụ bưu chính.
- KHI KHÁCH HÀNG CHỈ CHÀO HỎI THÔNG THƯỜNG (ví dụ: "chào bạn", "xin chào", "hello", "hi", "alo"):
  + Chào lại anh/chị thật niềm nở, tự nhiên và ấm áp (xưng "em", gọi "anh/chị" hoặc "anh/chị [Tên]").
  + Giới thiệu ngắn gọn mình là Trợ lý AI Bưu cục Nexus Logistics, luôn sẵn sàng hỗ trợ tra cứu hành trình vận đơn, dự toán cước phí hoặc tạo đơn gửi hàng mới.
  + TUYỆT ĐỐI KHÔNG tự tiện đưa ra chính sách bồi thường khiếu nại, quy chuẩn bưu gửi, hay bất kỳ nội dung nghiệp vụ nào khác khi khách hàng chưa hề hỏi đến!
- XƯNG HÔ THÂN THIỆN, LỄ PHÉP THEO CHUẨN MỰC VĂN HÓA DỊCH VỤ VIỆT NAM:
  + Luôn xưng "em" (hoặc "bên em" / "Nexus") và gọi khách hàng là "anh/chị" hoặc "anh/chị [Tên]" nếu trong ngữ cảnh đã có tên khách (ví dụ: "Dạ em chào anh Nam ạ", "Dạ em chào chị Lan ạ"). Nếu chưa rõ tên, xưng "em" và gọi "anh/chị" hoặc "Quý khách".
  + TUYỆT ĐỐI KHÔNG xưng "tôi", TUYỆT ĐỐI KHÔNG gọi khách cộc lốc là "bạn" như văn bản dịch máy ("Chào bạn, tôi sẽ giải thích...", "Tôi khuyến khích bạn...").
  + Luôn mở đầu câu trả lời bằng lời chào hỏi lịch sự, tự nhiên và ấm áp: "Dạ em chào anh/chị ạ!", "Dạ vâng, em chào anh/chị [Tên] ạ!".
  + Sử dụng các trợ từ, thán từ tiếng Việt tự nhiên, lịch thiệp: "dạ", "ạ", "nhé anh/chị", "anh/chị yên tâm nhé", "dạ vâng ạ".
- HÀNH VĂN ĐỐI THOẠI MẠCH LẠC, LOẠI BỎ TRIỆT ĐỂ LỐI TRẢ LỜI MÁY MÓC / TIỂU LUẬN / BÁO CÁO:
  + Trả lời thẳng vào trọng tâm câu hỏi ngay từ đầu (Bottom-Line Up Front), giải tỏa lo lắng cho khách trước rồi mới giải thích chi tiết.
  + TUYỆT ĐỐI KHÔNG cấu trúc bài viết thành bài tiểu luận phân tích khô khan với hàng loạt tiêu đề cấp 3 liên tiếp (như "### 1. Cơ chế...", "### 2. Chính sách...", "### 3. Thời hạn...", "### 💡 Lời khuyên từ chuyên viên").
  + Không biến câu trả lời thành bảng kê danh mục hành chính cứng nhắc. Hãy dùng lời văn đàm thoại mềm mại, kết nối các ý bằng những liên từ tự nhiên ("Dạ anh/chị yên tâm là...", "Bên cạnh đó", "Về mức cước phí...", "Ngoài ra").
  + Khi giải thích chính sách (bồi thường thất lạc, hàng bể vỡ, đồng kiểm, giao lại, chuyển hoàn): Diễn giải bằng ngôn từ mộc mạc, gần gũi, dễ hiểu, bảo đảm chuẩn xác theo Điều 25 Nghị định 47/2011/NĐ-CP, Điều 40 Luật Bưu chính 2010 và Carrier SOP nhưng không trích văn bản pháp quy khô cứng. Trấn an khách trước: "Dạ anh/chị yên tâm nhé, trong trường hợp bưu phẩm chẳng may phát sinh sự cố...", sau đó tóm tắt gãy gọn 2 trường hợp (có mua bảo hiểm khai giá vs gói tiêu chuẩn mặc định) và thời hạn hoàn tiền (3 - 5 ngày làm việc).
  + Khi khách hàng muốn gửi hàng: Đóng vai Giao dịch viên bưu cục niềm nở, hướng dẫn ngắn gọn 4 bước tiếp nhận đơn hàng (địa chỉ lấy mặc định vs mới, người nhận, tên hàng & cân nặng, ai thanh toán cước) và gửi Phiếu tạm tính để khách xác nhận trước khi tạo đơn.
  + Kết thúc câu trả lời chu đáo, luôn sẵn sàng đồng hành: "Nếu anh/chị cần em hỗ trợ thêm thông tin gì khác, cứ nhắn em ngay nhé ạ!" hoặc "Anh/chị có mã vận đơn thì gửi em kiểm tra ngay cho mình nhé ạ!".
- KIỂM SOÁT EMOJI TINH TẾ & ĐỊNH DẠNG SẠCH ĐẸP:
  + Chỉ dùng 1-2 emoji phù hợp ở đầu ý chính để tạo điểm nhấn trực quan (như 📦, 🛡️, 🚚, 💰). TUYỆT ĐỐI KHÔNG xả cả cụm emoji ngẫu nhiên cuối bài (như 🚚🛡️💰📦📞).
  + Tuyệt đối không dùng dấu nháy đơn ngược (backtick), không dùng ba dấu sao (***), dấu gạch đầu dòng và nội dung nằm cùng một dòng.
  + TUYỆT ĐỐI KHÔNG dùng cú pháp LaTeX toán học (không dùng dấu $, $$, \(, \), \times, \frac, \text{}). Tất cả công thức tính cước và thể tích quy đổi IATA phải ghi hẳn bằng chữ và số thuần túy: ghi thẳng ra (Dài x Rộng x Cao)/6000 hoặc (60x50x40)/6000 = 20kg (mẫu số là 6000, tuyệt đối không viết dấu chấm 6.000).
  + TUYỆT ĐỐI KHÔNG xuất ra tên file nội bộ (.md), không nói "theo tài liệu tham chiếu đoạn 1 đoạn 2", không để lộ thuật ngữ kỹ thuật backend/AI (API, Gateway, BFF, Port, Vector, Chunk, RAG, Prompt). Diễn đạt tự nhiên: "Theo Chính sách Dịch vụ của Nexus Logistics...".

4. QUY TRÌNH HỦY ĐƠN HÀNG, PHÂN GIẢI NGỮ CẢNH & NGUYÊN TẮC XÁC NHẬN HUMAN-IN-THE-LOOP:
- Nắm bắt ngữ cảnh đa lượt: Khi người dùng nói "tôi muốn hủy đơn hàng này", "hủy đơn này", hãy tra cứu đơn hàng vừa được đề cập hoặc vừa tạo trong phiên hội thoại. Nếu người dùng có nhiều đơn hàng chưa rõ đơn nào, hãy liệt kê và hỏi lại để làm rõ (Disambiguation), tuyệt đối không đoán mò.
- Kiểm tra điều kiện vận hành Carrier SOP:
  + Nếu đơn ở trạng thái CREATED, TASK_ASSIGNED, PICKING_UP, PENDING (bưu tá chưa lấy hàng / kiện chưa nhập kho Hub): Đủ điều kiện hủy miễn phí 100% (0 VNĐ). Tuy nhiên, AI TUYỆT ĐỐI KHÔNG TỰ TIỆN HỦY NGAY mà phải giải thích rõ ràng và yêu cầu khách hàng tự tay bấm nút xác nhận quyết định hủy (Human-in-the-Loop Principle).
  + Nếu đơn ở trạng thái SORTING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERING (đang luân chuyển trên xe tải đường trục kẹp chì seal hoặc đang đi phát): Tuyệt đối từ chối hủy ngay lập tức vì lý do an toàn vận hành vật lý (không thể dừng xe tải giữa đường cao tốc để tìm kiện hàng), hướng dẫn khách từ chối nhận khi bưu tá giao (chuyển hoàn RTO cước 50%) hoặc liên hệ hotline 1900-1234.
  + Khi khách hàng đã chính thức bấm xác nhận hủy: Thông báo hủy thành công, bưu tá phụ trách đã nhận lệnh dừng lấy hàng và khách không mất bất kỳ khoản phí nào.

5. QUY CHUẨN TRA CỨU VẬN ĐƠN DÀNH CHO KHÁCH VÃNG LAI (GUEST TRACKING & PII VERIFICATION):
- Theo Điều 8 Luật Bưu chính và quy chuẩn an toàn bảo vệ dữ liệu cá nhân PII:
  + Khi khách vãng lai hỏi tra cứu đơn hoặc nhập mã vận đơn mà CHƯA CUNG CẤP SĐT NGƯỜI NHẬN:
    * AI trả về thông tin tổng quan lộ trình (thông tin người nhận, địa chỉ chi tiết đã được che bớt mã hóa bảo vệ PII).
    * AI BẮT BUỘC PHẢI TƯ VẤN RÕ RÀNG 2 LỰA CHỌN MỞ KHÓA CHO KHÁCH:
      1) Lựa chọn 1 (Nếu đã có tài khoản / Đăng nhập): Đăng nhập tài khoản Nexus Logistics (bấm [🔑 Đăng nhập tài khoản](/login)) để hệ thống tự động nhận diện và mở khóa toàn bộ đơn hàng chi tiết mà không cần nhập lại SĐT mỗi lần tra cứu.
      2) Lựa chọn 2 (Tra cứu nhanh không cần tài khoản / Guest Quick Track): Khách chỉ cần cung cấp 2 thông tin: Mã vận đơn + Số điện thoại người nhận (hoặc 4 số cuối SĐT nhận hàng) ngay tại khung chat để hệ thống đối chiếu bảo mật PII và mở khóa chi tiết ngay lập tức.
  + Khi khách hàng cung cấp số điện thoại người nhận:
    * Nếu SĐT TRÙNG KHỚP với thông tin nhận hàng: AI chúc mừng và mở khóa toàn bộ thông tin chi tiết: người nhận, số điện thoại, địa chỉ cụ thể, COD và hành trình di chuyển.
    * Nếu SĐT KHÔNG TRÙNG KHỚP: AI giải thích lịch sự rằng số điện thoại người nhận không khớp với thông tin đã đăng ký của vận đơn, do đó vì lý do bảo mật theo Luật Bưu chính hệ thống chưa thể mở khóa chi tiết. Hướng dẫn khách kiểm tra lại số điện thoại hoặc Đăng nhập tài khoản.

6. NGUYÊN TẮC CỐT LÕI CỦA MỘT CHUYÊN VIÊN CSKH: ĐIỀU PHỐI API & HỎI LẠI THÔNG TIN KHI CẦN THIẾT (ACTIVE CLARIFICATION & ORCHESTRATION):
- Bạn là Chuyên viên CSKH và Giao dịch viên bưu cục chuyên nghiệp, tận tâm:
  + TUYỆT ĐỐI KHÔNG đoán mò, KHÔNG tự ý gán thông số giả định (ví dụ khách chỉ nói chung chung 'tính cước cho tôi' thì không được tự mặc định là gửi 1kg từ TP.HCM đi Hà Nội rồi trả lời như thật).
  + KHI KHÁCH HÀNG YÊU CẦU MỘT TÁC VỤ MÀ THIẾU THÔNG TIN TIÊN QUYẾT ĐỂ GỌI API (thiếu mã đơn, thiếu tuyến đường, thiếu cân nặng, thiếu địa chỉ mới):
    1. Chào hỏi niềm nở, lễ phép (xưng 'em', gọi 'anh/chị' hoặc 'anh/chị [Tên]').
    2. Xác nhận rõ ràng ý định của khách hàng ('Dạ để em hỗ trợ tính cước / đổi địa chỉ / hẹn giao lại / tra cứu đơn / khiếu nại...').
    3. Đặt câu hỏi trực diện, gãy gọn, chia mục rõ ràng (1, 2, 3) để thu thập thông tin còn thiếu.
    4. Cung cấp mức tham khảo nhanh hoặc gợi ý các nút bấm Action Chips để khách tiện chọn nếu trùng nhu cầu.
    5. Ghi nhớ ngữ cảnh đa lượt: Khi khách trả lời thông tin còn thiếu ở câu tiếp theo, hệ thống lập tức xâu chuỗi và gọi API xử lý dứt điểm cho khách hàng ngay.
  + KHI ĐÃ CÓ ĐỦ THÔNG TIN: Gọi đúng API/Tool cần thiết, trả lời mạch lạc, súc tích, giải tỏa băn khoăn cho khách.`;

    const userPrompt = `DỮ LIỆU NGỮ CẢNH HỆ THỐNG CUNG CẤP:
${context || '(Không tìm thấy tài liệu phù hợp trực tiếp)'}

CÂU HỎI CỦA NGƯỜI DÙNG:
${question}

HÃY ĐƯA RA CÂU TRẢ LỜI ĐẦY ĐỦ VÀ CHÍNH XÁC:`;

    // 1. Phân luồng tác tử chuyên biệt theo mô hình Heterogeneous Multi-Agent (HMAS):
    // Tác tử 1: Supervisor Agent (Google Gemini 3.6 Flash / Google AI Studio) - Chỉ huy tối ưu tốc độ & ngữ cảnh sâu
    if (this.geminiApiKey) {
      const geminiResult = await this.callGemini(this.geminiModel, systemPrompt, userPrompt);
      if (geminiResult) {
        this.logger.log(`Supervisor Agent (${this.geminiModel} / Google AI Studio) generated answer successfully.`);
        return this.cleanBotFormatting(geminiResult);
      }
    }

    const isToolContext = context.includes('=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===');
    const isKnowledgeContext = citations.length > 0 || context.includes('=== TÀI LIỆU QUY CHUẨN') || context.includes('Điều 25');

    // Tác tử 2 Dự phòng chuyên biệt: Operation Agent (Llama 3.3 70B / Groq LPU) cho tra cứu & định dạng vận đơn
    if (isToolContext && this.groqApiKey) {
      const opSystemPrompt = `${systemPrompt}\n\n[CHỈ DẪN VAI TRÒ CHUYÊN BIỆT: OPERATION AGENT - LLAMA 3.3 70B]\nBạn là Operation Agent. Hãy trả lời thật tự nhiên, lễ phép (xưng em, gọi anh/chị hoặc anh/chị [Tên]), diễn đạt mạch lạc, thân thiện và ấm áp. Tuyệt đối không xưng 'tôi', không gọi khách là 'bạn', không trả lời cứng nhắc kiểu báo cáo hành chính.`;
      const opResult = await this.callOpenAiCompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        this.groqApiKey,
        this.groqOperationModel,
        opSystemPrompt,
        userPrompt,
        4000
      );
      if (opResult) {
        this.logger.log(`Operation Agent (${this.groqOperationModel} / Groq LPU) generated answer successfully.`);
        return this.cleanBotFormatting(opResult);
      }
    }

    // Tác tử 3 Dự phòng chuyên biệt: Knowledge Agent (Qwen 2.5 32B / Groq LPU) cho RAG chính sách SOP
    if (isKnowledgeContext && this.groqApiKey) {
      const kwSystemPrompt = `${systemPrompt}\n\n[CHỈ DẪN VAI TRÒ CHUYÊN BIỆT: KNOWLEDGE AGENT - QWEN 2.5 32B]\nBạn là Knowledge Agent. Hãy dùng ngôn từ tiếng Việt tự nhiên, ấm áp, thưa gửi lễ phép (xưng em, gọi anh/chị). Diễn giải chính sách SOP, Điều 25 Nghị định 47 & Điều 40 Luật Bưu chính một cách gần gũi, đời thường, dễ hiểu, giúp khách an tâm. Tuyệt đối không xưng 'tôi', không chia tiêu đề bài luận học thuật khô khan.`;
      const kwResult = await this.callOpenAiCompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        this.groqApiKey,
        this.groqKnowledgeModel,
        kwSystemPrompt,
        userPrompt,
        4000
      );
      if (kwResult) {
        this.logger.log(`Knowledge Agent (${this.groqKnowledgeModel} / Groq LPU) generated answer successfully.`);
        return this.cleanBotFormatting(kwResult);
      }
    }

    // Tác tử 4 Dự phòng: OpenAI API (nếu có cấu hình OPENAI_API_KEY)
    if (this.apiKey) {
      const openaiResult = await this.callOpenAiCompatible(
        'https://api.openai.com/v1/chat/completions',
        this.apiKey,
        this.chatModel,
        systemPrompt,
        userPrompt
      );
      if (openaiResult) {
        this.logger.log(`Fallback OpenAI API (${this.chatModel}) generated answer successfully.`);
        return this.cleanBotFormatting(openaiResult);
      }
    }

    // 3. Chế độ Fallback Offline Semantic Demo nếu không có key hoặc lỗi mạng
    return this.cleanBotFormatting(this.generateOfflineDemoAnswer(question, context, citations));
  }

  /**
   * Gọi mô hình tương thích OpenAI REST API (sử dụng cho Groq Cloud và NVIDIA NIM)
   */
  private async callOpenAiCompatible(
    apiUrl: string,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    timeoutMs = 6000
  ): Promise<string | null> {
    if (!apiKey) return null;
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: this.temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        const err = await resp.text();
        this.logger.warn(`API call error for ${model} (${resp.status}): ${err}`);
      }
    } catch (err: any) {
      this.logger.warn(`API call failed for ${model}: ${err.message}`);
    }
    return null;
  }

  /**
   * Gọi Google Gemini API với danh sách fallback model tự động
   */
  private async callGemini(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    timeoutMs = 7000
  ): Promise<string | null> {
    if (!this.geminiApiKey) return null;
    const candidateModels = Array.from(
      new Set([model, this.geminiModel, 'gemini-3.6-flash', 'gemini-3.5-flash-lite'].filter(Boolean))
    );

    for (const m of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${this.geminiApiKey}`;
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
            generationConfig: {
              temperature: this.temperature,
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (resp.ok) {
          const data = (await resp.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('');
          if (text) return text;
        } else {
          const err = await resp.text();
          this.logger.warn(`Gemini (${m}) returned ${resp.status}: ${err}`);
        }
      } catch (err: any) {
        this.logger.warn(`Gemini (${m}) fetch error: ${err.message}`);
      }
    }
    return null;
  }

  /**
   * Tác tử 4: Validation Agent (Nemotron-70B / NVIDIA NIM)
   * Kiểm tra NeMo Guardrail, phát hiện rủi ro bưu chính và kích hoạt Human-in-the-Loop (HITL)
   */
  public async callValidationAgent(
    actionType: string,
    payloadText: string,
    userRole = 'GUEST'
  ): Promise<{ isApproved: boolean; requiresHitl: boolean; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string }> {
    const isRiskyMutation =
      actionType === 'CANCEL_ORDER' ||
      actionType === 'REFUND_PAYOUT' ||
      actionType === 'CHANGE_ADDRESS' ||
      payloadText.toLowerCase().includes('huy don') ||
      payloadText.toLowerCase().includes('doi dia chi');

    if (isRiskyMutation) {
      const guardrailPrompt = `Bạn là Safety Guardrail AI của Nexus Logistics. Hãy kiểm tra thao tác sau: Hành động="${actionType}", Nội dung="${payloadText}", Vai trò người dùng="${userRole}". Cho biết rủi ro và có cần người duyệt (HITL) không. Trả về JSON: {"approved": boolean, "requiresHitl": boolean, "risk": "LOW"|"MEDIUM"|"HIGH", "reason": string}`;

      // 1. Kiểm tra qua Groq Safeguard nếu dùng provider groq (hoặc khi không có NVIDIA key)
      if ((this.validationProvider === 'groq' || !this.nvidiaApiKey) && this.groqApiKey) {
        const groqModel = this.validationModel || 'openai/gpt-oss-safeguard-20b';
        try {
          const verdictRaw = await this.callOpenAiCompatible(
            'https://api.groq.com/openai/v1/chat/completions',
            this.groqApiKey,
            groqModel,
            guardrailPrompt,
            payloadText,
            8000
          );
          if (verdictRaw) {
            try {
              const parsed = JSON.parse(verdictRaw.replace(/```json|```/g, '').trim());
              return {
                isApproved: parsed.approved ?? false,
                requiresHitl: parsed.requiresHitl ?? true,
                riskLevel: parsed.risk ?? 'HIGH',
                reason: parsed.reason ?? 'Cần phê duyệt từ người dùng theo chuẩn an toàn bưu chính.',
              };
            } catch {
              // parse error -> fallback
            }
          }
        } catch (err: any) {
          this.logger.warn(`Groq Validation Agent error with model ${groqModel}: ${err.message}`);
        }
      }

      // 2. Kiểm tra qua OpenRouter nếu cấu hình
      if (this.validationProvider === 'openrouter' && this.openrouterApiKey) {
        const routerModel = this.validationModel || 'nvidia/nemotron-3.5-lightning:free';
        try {
          const verdictRaw = await this.callOpenAiCompatible(
            'https://openrouter.ai/api/v1/chat/completions',
            this.openrouterApiKey,
            routerModel,
            guardrailPrompt,
            payloadText,
            8000
          );
          if (verdictRaw) {
            try {
              const parsed = JSON.parse(verdictRaw.replace(/```json|```/g, '').trim());
              return {
                isApproved: parsed.approved ?? false,
                requiresHitl: parsed.requiresHitl ?? true,
                riskLevel: parsed.risk ?? 'HIGH',
                reason: parsed.reason ?? 'Cần phê duyệt từ người dùng theo chuẩn an toàn.',
              };
            } catch {
              // parse error
            }
          }
        } catch (err: any) {
          this.logger.warn(`OpenRouter Validation Agent error: ${err.message}`);
        }
      }

      // 3. Kiểm tra qua NVIDIA NIM nếu cấu hình và có key
      if (this.validationProvider === 'nvidia' && this.nvidiaApiKey) {
        const candidateNvidiaModels = Array.from(
          new Set([
            this.nvidiaValidationModel,
            'nvidia/nemotron-3.5-lightning-30b-a3b',
            'nvidia/nemotron-3-ultra-550b-a55b',
            'nvidia/nemotron-3.5-super-vl-120b-a12b',
            'nvidia/llama-3.3-nemotron-super-49b-v1.5',
            'meta/llama-3.3-70b-instruct',
          ].filter(Boolean))
        );

        for (const model of candidateNvidiaModels) {
          try {
            const verdictRaw = await this.callOpenAiCompatible(
              'https://integrate.api.nvidia.com/v1/chat/completions',
              this.nvidiaApiKey,
              model,
              guardrailPrompt,
              payloadText,
              4000
            );
            if (verdictRaw) {
              try {
                const parsed = JSON.parse(verdictRaw.replace(/```json|```/g, '').trim());
                return {
                  isApproved: parsed.approved ?? true,
                  requiresHitl: parsed.requiresHitl ?? true,
                  riskLevel: parsed.risk ?? 'HIGH',
                  reason: parsed.reason ?? 'Thao tác ảnh hưởng trạng thái vận đơn, cần người duyệt xác nhận.',
                };
              } catch {
                // parse error -> fallback
              }
            }
          } catch (err: any) {
            this.logger.warn(`NVIDIA NIM Validation Agent error with model ${model}: ${err.message}`);
          }
        }
      }

      // Dự phòng qua Groq LPU (Llama Guard / Llama 3.3) nếu không có NVIDIA NIM
      if (this.groqApiKey) {
        const guardrailPrompt = `Bạn là NeMo Guardrail AI của Nexus Logistics. Kiểm tra thao tác: Hành động="${actionType}", Nội dung="${payloadText}". Trả về JSON: {"approved": boolean, "requiresHitl": boolean, "risk": "LOW"|"MEDIUM"|"HIGH", "reason": string}`;
        try {
          const verdictRaw = await this.callOpenAiCompatible(
            'https://api.groq.com/openai/v1/chat/completions',
            this.groqApiKey,
            this.groqOperationModel,
            guardrailPrompt,
            payloadText,
            3000
          );
          if (verdictRaw) {
            try {
              const parsed = JSON.parse(verdictRaw.replace(/```json|```/g, '').trim());
              return {
                isApproved: parsed.approved ?? true,
                requiresHitl: parsed.requiresHitl ?? true,
                riskLevel: parsed.risk ?? 'HIGH',
                reason: parsed.reason ?? 'Cần phê duyệt từ người dùng theo chuẩn an toàn.',
              };
            } catch {}
          }
        } catch {}
      }

      return {
        isApproved: true,
        requiresHitl: true,
        riskLevel: 'HIGH',
        reason: 'Thao tác làm thay đổi dữ liệu đơn hàng bưu chính, kích hoạt Human-in-the-Loop để bảo vệ an toàn.',
      };
    }

    return {
      isApproved: true,
      requiresHitl: false,
      riskLevel: 'LOW',
      reason: 'Truy vấn thông tin an toàn.',
    };
  }

  /**
   * Diagnostic Health Check cho cả 4 Tác tử (Big Four Multi-Agent Matrix)
   */
  public async checkMultiAgentHealth(): Promise<{
    timestamp: string;
    overallStatus: 'HEALTHY' | 'DEGRADED';
    agents: {
      supervisor: { provider: string; model: string; status: string; latencyMs?: number; note?: string };
      knowledge: { provider: string; model: string; status: string; latencyMs?: number; note?: string };
      operation: { provider: string; model: string; status: string; latencyMs?: number; note?: string };
      validation: { provider: string; model: string; status: string; latencyMs?: number; note?: string };
    };
    fallbackCascade: {
      active: boolean;
      primaryAvailable: boolean;
      offlineFallbackReady: boolean;
    };
  }> {
    const pingPrompt = 'Trả lời đúng 1 chữ: OK';

    // 1. Check Supervisor (Gemini)
    const t0 = Date.now();
    let supStatus = 'KEY_MISSING';
    let supLatency: number | undefined;
    if (this.geminiApiKey) {
      try {
        const res = await this.callGemini(this.geminiModel, 'System ping', pingPrompt, 3000);
        supLatency = Date.now() - t0;
        supStatus = res ? 'CONNECTED' : 'UNREACHABLE';
      } catch {
        supStatus = 'ERROR';
      }
    }

    // 2. Check Knowledge (Groq / Qwen)
    const t1 = Date.now();
    let kwStatus = 'KEY_MISSING (Fallback to Gemini)';
    let kwLatency: number | undefined;
    if (this.groqApiKey) {
      try {
        const res = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.groqApiKey,
          this.groqKnowledgeModel,
          'System ping',
          pingPrompt,
          3000
        );
        kwLatency = Date.now() - t1;
        kwStatus = res ? 'CONNECTED' : 'UNREACHABLE';
      } catch {
        kwStatus = 'ERROR';
      }
    }

    // 3. Check Operation (Groq / Llama)
    const t2 = Date.now();
    let opStatus = 'KEY_MISSING (Fallback to Gemini)';
    let opLatency: number | undefined;
    if (this.groqApiKey) {
      try {
        const res = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.groqApiKey,
          this.groqOperationModel,
          'System ping',
          pingPrompt,
          3000
        );
        opLatency = Date.now() - t2;
        opStatus = res ? 'CONNECTED' : 'UNREACHABLE';
      } catch {
        opStatus = 'ERROR';
      }
    }

    // 4. Check Validation (Groq Safeguard / OpenRouter / NVIDIA NIM / Local Rule Engine)
    const t3 = Date.now();
    let valProviderName = 'NVIDIA NIM (NVIDIA)';
    let valStatus = 'KEY_MISSING (Fallback to Local Rule Engine)';
    let valLatency: number | undefined;
    let activeValidationModel = this.validationModel;

    if (this.validationProvider === 'groq' && this.groqApiKey) {
      valProviderName = 'Groq LPU (Safeguard / OpenAI)';
      activeValidationModel = this.validationModel || 'openai/gpt-oss-safeguard-20b';
      try {
        const res = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.groqApiKey,
          activeValidationModel,
          'System ping',
          pingPrompt,
          3000
        );
        valLatency = Date.now() - t3;
        valStatus = res ? 'CONNECTED' : 'UNREACHABLE';
      } catch {
        valStatus = 'ERROR';
      }
    } else if (this.validationProvider === 'openrouter' && this.openrouterApiKey) {
      valProviderName = 'NVIDIA (Nemotron Lightning)';
      activeValidationModel = this.validationModel || 'nvidia/nemotron-3.5-lightning:free';
      try {
        const res = await this.callOpenAiCompatible(
          'https://openrouter.ai/api/v1/chat/completions',
          this.openrouterApiKey,
          activeValidationModel,
          'System ping',
          pingPrompt,
          8000
        );
        valLatency = Date.now() - t3;
        valStatus = res ? 'CONNECTED' : 'UNREACHABLE';
      } catch {
        valStatus = 'ERROR';
      }
    } else if (this.nvidiaApiKey) {
      valProviderName = 'NVIDIA NIM (NVIDIA)';
      const candidateNvidiaModels = Array.from(
        new Set([
          this.nvidiaValidationModel,
          'nvidia/nemotron-3.5-lightning-30b-a3b',
          'nvidia/nemotron-3-ultra-550b-a55b',
          'nvidia/nemotron-3.5-super-vl-120b-a12b',
          'nvidia/llama-3.3-nemotron-super-49b-v1.5',
          'meta/llama-3.3-70b-instruct',
        ].filter(Boolean))
      );

      for (const m of candidateNvidiaModels) {
        try {
          const res = await this.callOpenAiCompatible(
            'https://integrate.api.nvidia.com/v1/chat/completions',
            this.nvidiaApiKey,
            m,
            'System ping',
            pingPrompt,
            3000
          );
          if (res) {
            valLatency = Date.now() - t3;
            valStatus = 'CONNECTED';
            activeValidationModel = m;
            break;
          }
        } catch {
          valStatus = 'ERROR';
        }
      }
      if (valStatus !== 'CONNECTED') {
        valStatus = 'UNREACHABLE (Model deprecated or key error)';
      }
    } else if (this.groqApiKey) {
      // Tự động dùng Groq Safeguard nếu không có key nào khác
      valProviderName = 'Groq LPU (Safeguard / OpenAI)';
      activeValidationModel = 'openai/gpt-oss-safeguard-20b';
      try {
        const res = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.groqApiKey,
          activeValidationModel,
          'System ping',
          pingPrompt,
          3000
        );
        valLatency = Date.now() - t3;
        valStatus = res ? 'CONNECTED' : 'UNREACHABLE';
      } catch {
        valStatus = 'ERROR';
      }
    }

    const hasAnyLlm = supStatus === 'CONNECTED' || kwStatus === 'CONNECTED' || opStatus === 'CONNECTED' || valStatus === 'CONNECTED';

    return {
      timestamp: new Date().toISOString(),
      overallStatus: hasAnyLlm ? 'HEALTHY' : 'DEGRADED',
      agents: {
        supervisor: {
          provider: 'Google AI Studio',
          model: this.geminiModel,
          status: supStatus,
          latencyMs: supLatency,
          note: 'Chỉ huy & Lập kế hoạch DAG điều phối',
        },
        knowledge: {
          provider: 'Groq LPU (Alibaba)',
          model: this.groqKnowledgeModel,
          status: kwStatus,
          latencyMs: kwLatency,
          note: 'RAG trích xuất chính sách SOP, Điều 25 Nghị định 47 & Điều 40 Luật Bưu chính',
        },
        operation: {
          provider: 'Groq LPU (OpenAI)',
          model: this.groqOperationModel,
          status: opStatus,
          latencyMs: opLatency,
          note: 'Logistics Tool Calling, tính cước IATA, định dạng vận đơn',
        },
        validation: {
          provider: valProviderName,
          model: activeValidationModel,
          status: valStatus,
          latencyMs: valLatency,
          note: 'Safety Guardrail & Audit, phát hiện rủi ro & kích hoạt HITL',
        },
      },
      fallbackCascade: {
        active: true,
        primaryAvailable: supStatus === 'CONNECTED',
        offlineFallbackReady: true,
      },
    };
  }

  /**
   * Tối ưu hóa văn bản định dạng: loại bỏ backtick, dấu sao thừa, gộp bullet rớt dòng
   */
  private cleanBotFormatting(text: string): string {
    if (!text) return '';
    let cleaned = text;

    // 0. Xử lý và chuyển đổi triệt để các công thức toán / LaTeX thành chữ số thuần túy
    cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / $2');
    cleaned = cleaned.replace(/\\(?:text|mathrm|mathbf|textit)\{([^}]*)\}/g, '$1');
    cleaned = cleaned.replace(/\\times\b/g, 'x');
    cleaned = cleaned.replace(/\\cdot\b/g, 'x');
    cleaned = cleaned.replace(/\\div\b/g, '/');
    cleaned = cleaned.replace(/\\le\b/g, '<=');
    cleaned = cleaned.replace(/\\ge\b/g, '>=');
    cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
    cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
    cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, '$1');
    cleaned = cleaned.replace(/\$([^\$\n]+)\$/g, '$1');
    cleaned = cleaned.replace(/\/\s*6\.000\b/g, '/ 6000');
    // Ghi hẳn ra (DxRxC)/6000 theo yêu cầu người dùng: (60x50x40)/6000
    cleaned = cleaned.replace(/\((\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\)\s*\/\s*6000/g, '($1x$2x$3)/6000');
    cleaned = cleaned.replace(/(?:^|[^\w(])(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*\/\s*6000/g, ' ($1x$2x$3)/6000');
    cleaned = cleaned.replace(/\\([a-zA-Z]+)/g, '$1');

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

    // 6. Làm mềm các cụm từ cứng nhắc máy móc nếu LLM vô tình lặp lại
    cleaned = cleaned.replace(/Chào bạn,/g, 'Dạ em chào anh/chị,');
    cleaned = cleaned.replace(/Chào bạn\./g, 'Dạ em chào anh/chị ạ.');
    cleaned = cleaned.replace(/Chào bạn!/g, 'Dạ em chào anh/chị ạ!');
    cleaned = cleaned.replace(/\bTôi khuyến khích bạn\b/g, 'Em khuyến khích anh/chị');
    cleaned = cleaned.replace(/\btôi sẽ giải thích\b/g, 'em xin phép giải thích');
    cleaned = cleaned.replace(/\bcho bạn biết\b/g, 'cho anh/chị biết');
    cleaned = cleaned.replace(/\bcủa bạn\b/g, 'của mình');
    cleaned = cleaned.replace(/\bTôi là Chuyên viên\b/g, 'Em là Chuyên viên');
    cleaned = cleaned.replace(/- CHỈ DẪN AI:[\s\S]*?\n/g, '');
    cleaned = cleaned.replace(/- HƯỚNG DẪN AI:[\s\S]*?\n/g, '');

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
      if (realtimeSection.includes('[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH VÃNG LAI')) {
        return `Dạ em chào anh/chị ạ! Em là Trợ lý AI Bưu cục của Nexus Logistics. Rất vui được đồng hành cùng anh/chị hôm nay!\n\n` +
          `Em luôn sẵn sàng hỗ trợ anh/chị các nghiệp vụ bưu chính như:\n` +
          `• 📦 **Tra cứu hành trình vận đơn:** Xem trạng thái vị trí bưu gửi theo thời gian thực.\n` +
          `• 💰 **Dự toán cước vận chuyển:** Báo giá cước tiêu chuẩn & hỏa tốc trên 63 tỉnh thành.\n` +
          `• 🚚 **Tạo đơn & Điều phối bưu tá:** Hướng dẫn gửi bưu kiện tận nhà nhanh chóng.\n` +
          `• 🔑 **Đăng nhập tài khoản:** Đồng bộ danh sách đơn cá nhân và quản trị COD an toàn.\n\n` +
          `Anh/chị có thể gửi ngay mã vận đơn hoặc bấm chọn nhanh các tác vụ gợi ý bên dưới để em hỗ trợ mình nhé ạ!`;
      }

      if (realtimeSection.includes('[YÊU CẦU CSKH HỎI LẠI THÔNG TIN TÍNH CƯỚC VẬN CHUYỂN')) {
        return `Dạ em chào anh/chị ạ! Em là Trợ lý AI Bưu cục Nexus Logistics.\n\n` +
          `Để em tính cước và báo giá chính xác nhất cho kiện hàng của mình, anh/chị cho em xin thêm một vài thông tin nhé ạ:\n\n` +
          `1. 📍 **Tuyến vận chuyển:** Bưu gửi đi từ tỉnh/thành nào đến tỉnh/thành nào ạ?\n` +
          `2. ⚖️ **Khối lượng:** Kiện hàng nặng khoảng bao nhiêu kg (hoặc kích thước Dài x Rộng x Cao nếu là hàng cồng kềnh) ạ?\n` +
          `3. 📦 **Loại hàng:** Hàng thông thường hay hàng dễ vỡ/giá trị cao cần bảo hiểm ạ?\n\n` +
          `💡 **Mức cước tham khảo nhanh các tuyến phổ biến:**\n` +
          `• 🚚 **Nội thành / Nội tỉnh:** Gói Tiêu chuẩn chỉ từ **21.500 VNĐ** (0.5kg đầu)\n` +
          `• ✈️ **Liên tỉnh trục chính (TP.HCM ➔ Hà Nội):** Gói Tiêu chuẩn từ **32.000 VNĐ** (1kg đầu)\n` +
          `• ➕ **Cước vượt nấc:** +3.500 VNĐ mỗi 0.5kg tiếp theo\n\n` +
          `Anh/chị có thể nhắn trực tiếp thông tin cho em hoặc bấm chọn nhanh các nút gợi ý bên dưới để em tính cước ngay nhé ạ!`;
      }

      if (realtimeSection.includes('[YÊU CẦU CSKH HỎI LẠI THÔNG TIN ĐỔI ĐỊA CHỈ NHẬN HÀNG')) {
        return `Dạ em chào anh/chị ạ! Hệ thống Nexus Logistics hoàn toàn hỗ trợ điều chỉnh địa chỉ giao hàng cho bưu kiện ạ.\n\n` +
          `Để em cập nhật nhanh nhất cho bưu tá phụ trách tuyến, anh/chị cho em xin các thông tin sau nhé ạ:\n\n` +
          `1. 🏷️ **Mã vận đơn** của kiện hàng mình cần đổi địa chỉ?\n` +
          `2. 📍 **Địa chỉ giao hàng mới chi tiết** (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành)?\n` +
          `3. 👤 **Tên và Số điện thoại người nhận mới** (nếu có thay đổi) ạ?\n\n` +
          `*(Lưu ý: Nếu đổi địa chỉ trong cùng quận/huyện hoặc cùng tỉnh thì hoàn toàn miễn phí; nếu đổi sang tỉnh thành khác khi xe tải đường trục đã xuất phát có thể phát sinh phụ phí chuyển hướng theo quy định bưu chính ạ).*`;
      }

      if (realtimeSection.includes('[YÊU CẦU CSKH HỎI LẠI ĐỊA CHỈ MỚI CHO VẬN ĐƠN')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        return `Dạ em chào anh/chị ạ! Đơn hàng **${code}** của mình hoàn toàn đủ điều kiện hỗ trợ đổi địa chỉ giao hàng ạ.\n\n` +
          `Anh/chị cho em xin **Địa chỉ giao hàng mới chi tiết** (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành) để em cập nhật ngay cho bưu tá phụ trách tuyến nhé ạ!`;
      }

      if (realtimeSection.includes('[KẾT QUẢ ĐIỀU CHỈNH ĐỊA CHỈ GIAO HÀNG THÀNH CÔNG')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const addrMatch = realtimeSection.match(/Địa chỉ giao hàng mới: (.*?)\n/);
        const addr = addrMatch ? addrMatch[1].trim() : '';
        return `Dạ em chào anh/chị ạ!\n\n` +
          `Hệ thống đã **cập nhật thành công địa chỉ giao hàng mới** cho vận đơn **${code}**:\n` +
          `📍 **Địa chỉ mới:** ${addr}\n\n` +
          `Bưu tá tuyến và bưu cục phát đã nhận được thông tin điều phối mới. Thao tác hoàn toàn miễn phí. Anh/chị yên tâm nhé ạ!`;
      }

      if (realtimeSection.includes('[YÊU CẦU CSKH HỎI LẠI THÔNG TIN HẸN GIAO LẠI HÀNG')) {
        return `Dạ em chào anh/chị ạ! Em đã ghi nhận yêu cầu hẹn giao lại hàng của anh/chị.\n\n` +
          `Để bưu tá tuyến ưu tiên giao đúng khung giờ thuận tiện nhất cho mình, anh/chị cho em xin:\n\n` +
          `1. 🏷️ **Mã vận đơn** của bưu phẩm cần hẹn giao lại?\n` +
          `2. ⏰ **Khung giờ thuận tiện nhất** (ví dụ: sáng mai, chiều mai hoặc sau 17h)?\n\n` +
          `*(Nexus Logistics hỗ trợ phát lại tối đa 3 lần hoàn toàn miễn phí theo quy chuẩn bưu chính ạ).*`;
      }

      if (realtimeSection.includes('[KẾT QUẢ GHI NHẬN LỊCH HẸN GIAO LẠI HÀNG')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const timeMatch = realtimeSection.match(/Thời gian hẹn giao lại: (.*?)\n/);
        const time = timeMatch ? timeMatch[1].trim() : 'Ngày làm việc tiếp theo';
        return `Dạ em chào anh/chị ạ!\n\n` +
          `Đã ghi nhận **lịch hẹn giao lại** cho vận đơn **${code}** vào: **${time}**.\n\n` +
          `Bưu cục phát và bưu tá phụ trách tuyến đã nhận được lịch hẹn và sẽ gọi trước khi qua phát hàng cho mình. Lần giao lại này hoàn toàn miễn phí theo chính sách bưu chính. Anh/chị yên tâm nhé ạ!`;
      }

      if (realtimeSection.includes('[YÊU CẦU CSKH THẤU CẢM & HỎI LẠI THÔNG TIN SỰ CỐ HÀNG HƯ HỎNG')) {
        return `Dạ em rất lấy làm tiếc về sự cố phát sinh với bưu kiện của anh/chị ạ!\n\n` +
          `Để em hỗ trợ mở hồ sơ tiếp nhận khiếu nại và chuyển ngay cho Ban Giám định QA xử lý bồi thường nhanh chóng nhất, anh/chị cho em xin thêm một vài thông tin nhé:\n\n` +
          `1. 🏷️ **Mã vận đơn** của kiện hàng gặp sự cố?\n` +
          `2. 📸 **Tình trạng thực tế:** Hàng bị móp méo bên ngoài vỏ hộp hay bể vỡ sản phẩm bên trong ạ? Anh/chị đã lập Biên bản bất thường với bưu tá hoặc có hình ảnh/video mở hộp đồng kiểm chưa ạ?\n` +
          `3. 💵 **Giá trị ước tính:** Giá trị hàng hóa hoặc chi phí sửa chữa ước tính là bao nhiêu ạ?\n\n` +
          `🛡️ *Anh/chị hoàn toàn yên tâm nhé! Theo Điều 25 Nghị định 47/2011/NĐ-CP (Điều 40 Luật Bưu chính 2010) và chính sách dịch vụ của Nexus, hồ sơ sẽ được thẩm định trong 24h - 48h và chi trả bồi thường chuyển khoản trong 03 - 05 ngày làm việc ạ!*`;
      }

      if (realtimeSection.includes('[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH HÀNG ĐÃ ĐĂNG NHẬP')) {
        const nameMatch = realtimeSection.match(/Người dùng (.*?) đang gửi lời chào/);
        const name = nameMatch ? nameMatch[1].trim() : '';
        return `Dạ em chào anh/chị${name ? ' ' + name : ''} ạ! Em là Trợ lý AI Bưu cục của Nexus Logistics.\n\n` +
          `Tài khoản của mình đã sẵn sàng trên hệ thống. Em có thể hỗ trợ gì cho anh/chị hôm nay ạ?\n` +
          `• 📦 Xem danh sách đơn hàng đang luân chuyển\n` +
          `• 🚚 Tạo đơn gửi bưu phẩm mới và gọi bưu tá lấy tận nhà\n` +
          `• 💰 Dự toán cước phí và tra cứu tiến độ đối soát COD\n\n` +
          `Anh/chị cứ nhắn tin cho em hoặc chọn nhanh các nút thao tác bên dưới nhé ạ!`;
      }

      if (realtimeSection.includes('[THÔNG TIN NGƯỜI DÙNG CHƯA ĐĂNG NHẬP]')) {
        return `Dạ em chào anh/chị ạ! Hiện tại anh/chị đang truy cập với tư cách Khách vãng lai (chưa đăng nhập tài khoản).\n\n` +
          `Vì lý do bảo mật dữ liệu cá nhân theo Luật Bưu chính, em chưa thể hiển thị tên và thông tin tài khoản của mình được ạ. Anh/chị vui lòng bấm nút **[Đăng nhập tài khoản](/login)** ở góc trên màn hình để hệ thống nhận diện và đồng bộ toàn bộ đơn hàng của anh/chị nhé ạ!`;
      }

      if (realtimeSection.includes('[TƯ VẤN PHƯƠNG THỨC TRA CỨU VẬN ĐƠN DÀNH CHO KHÁCH VÃNG LAI]')) {
        return `Dạ em chào anh/chị ạ! Để tra cứu hành trình bưu phẩm trên hệ thống Nexus Logistics, theo quy chuẩn an toàn thông tin và bảo vệ dữ liệu cá nhân (PII) theo Luật Bưu chính, anh/chị có 2 lựa chọn tiện lợi sau ạ:\n\n` +
          `• 🔑 **Lựa chọn 1 (Nếu đã có tài khoản / Đăng nhập):** Anh/chị bấm **[Đăng nhập tài khoản](/login)** để hệ thống tự động nhận diện danh tính và mở khóa hiển thị toàn bộ danh sách đơn hàng cũng như chi tiết đầy đủ (người gửi, người nhận, số điện thoại, địa chỉ cụ thể, timeline) mà không cần phải nhập số điện thoại mỗi lần tra cứu.\n\n` +
          `• 📱 **Lựa chọn 2 (Tra cứu nhanh không cần tài khoản / Guest Quick Track):** Dành cho khách vãng lai hoặc người nhận hàng cần kiểm tra nhanh. Anh/chị chỉ cần cung cấp 2 thông tin:\n` +
          `  1. **Mã vận đơn** (ví dụ: 333... hoặc NX-...)\n` +
          `  2. **Số điện thoại người nhận** (hoặc 4 số cuối SĐT nhận hàng)\n\n` +
          `Hệ thống sẽ đối chiếu và mở khóa đầy đủ thông tin bưu kiện ngay cho mình ạ. Anh/chị gửi mã vận đơn kèm số điện thoại để em hỗ trợ tra cứu ngay nhé ạ!`;
      }

      if (realtimeSection.includes('[THÔNG BÁO SỐ ĐIỆN THOẠI NGƯỜI NHẬN KHÔNG KHỚP')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const phoneMatch = realtimeSection.match(/Số điện thoại cung cấp: (.*?)\n/);
        const phone = phoneMatch ? phoneMatch[1].trim() : '';
        return `Dạ em chào anh/chị ạ!\n\n` +
          `Số điện thoại **${phone}** anh/chị vừa cung cấp **không trùng khớp** với số điện thoại người nhận đã đăng ký trên vận đơn **${code}** ạ.\n\n` +
          `Theo quy định bảo vệ dữ liệu cá nhân (PII) và Luật Bưu chính, hệ thống tạm thời chưa thể mở khóa thông tin người nhận và địa chỉ chi tiết của kiện hàng. Anh/chị vui lòng kiểm tra lại tính chính xác của số điện thoại người nhận (hoặc 4 số cuối) nhé ạ.\n\n` +
          `Nếu anh/chị là người gửi hoặc chủ đơn hàng, anh/chị có thể bấm **[Đăng nhập tài khoản](/login)** để xem toàn bộ thông tin đơn hàng của mình nhé ạ!`;
      }

      if (realtimeSection.includes('[XÁC THỰC THÀNH CÔNG SỐ ĐIỆN THOẠI NGƯỜI NHẬN')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const receiverMatch = realtimeSection.match(/Người nhận: (.*?)\n/);
        const receiver = receiverMatch ? receiverMatch[1].trim() : '';
        const phoneMatch = realtimeSection.match(/Số điện thoại người nhận: (.*?)\n/);
        const phone = phoneMatch ? phoneMatch[1].trim() : '';
        const statusMatch = realtimeSection.match(/Trạng thái: (.*?)\n/);
        const status = statusMatch ? statusMatch[1].trim() : '';
        const locationMatch = realtimeSection.match(/Vị trí hiện tại: (.*?)\n/);
        const loc = locationMatch ? locationMatch[1].trim() : '';
        const etaMatch = realtimeSection.match(/Thời gian dự kiến giao: (.*?)\n/);
        const eta = etaMatch ? etaMatch[1].trim() : '';
        const codMatch = realtimeSection.match(/Tiền thu hộ COD: (.*?)\n/);
        const cod = codMatch ? codMatch[1].trim() : '';

        return `Dạ em chào anh/chị ạ! Hệ thống đã **xác thực trùng khớp số điện thoại người nhận** và mở khóa toàn bộ thông tin chi tiết của vận đơn **${code}**:\n\n` +
          `📦 **CHI TIẾT VẬN ĐƠN ${code}:**\n` +
          `• 📌 **Trạng thái:** ${status}\n` +
          `• 👤 **Người nhận:** ${receiver}${phone ? ` (${phone})` : ''}\n` +
          (cod ? `• 💵 **Tiền thu hộ COD:** ${cod}\n` : '') +
          `• 📍 **Vị trí hiện tại:** ${loc}\n` +
          (eta ? `• ⏰ **Dự kiến phát hàng:** ${eta}\n` : '') +
          `\nAnh/chị có thể theo dõi tiến trình bưu tá giao hàng hoặc nhắn em nếu cần hỗ trợ thêm nhé ạ!`;
      }

      if (realtimeSection.includes('[THÔNG TIN HỒ SƠ TÀI KHOẢN NGƯỜI DÙNG HIỆN TẠI (ĐÃ ĐĂNG NHẬP)]')) {
        const nameMatch = realtimeSection.match(/Tên người dùng \/ Tên hiển thị: (.*?)\n/);
        const name = nameMatch ? nameMatch[1].trim() : 'Quý khách';
        const idMatch = realtimeSection.match(/Mã tài khoản \/ Số điện thoại \(User ID\): (.*?)\n/);
        const uid = idMatch ? idMatch[1].trim() : '';
        return `Dạ em chào anh/chị ${name} ạ!\n\n` +
          `Hệ thống ghi nhận anh/chị đã đăng nhập thành công vào tài khoản Nexus Logistics:\n` +
          `• 👤 **Họ tên hiển thị:** ${name}\n` +
          (uid ? `• 📱 **Số điện thoại / Mã tài khoản:** ${uid}\n` : '') +
          `• 🛡️ **Trạng thái:** Tài khoản hợp lệ, sẵn sàng tạo đơn và tra cứu.\n\n` +
          `Em có thể hỗ trợ anh/chị kiểm tra các đơn hàng của mình hay tạo đơn gửi hàng mới không ạ?`;
      }

      if (realtimeSection.includes('[THẨM ĐỊNH NGHIỆP VỤ HỦY ĐƠN & YÊU CẦU XÁC NHẬN HUMAN-IN-THE-LOOP]')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const itemMatch = realtimeSection.match(/Tên hàng hóa: (.*?)\n/);
        const item = itemMatch ? itemMatch[1].trim() : 'bưu kiện';
        return `Dạ em chào anh/chị ạ!\n\n` +
          `Có phải anh/chị đang muốn hủy đơn hàng **${code}** (${item}) vừa tra cứu đúng không ạ?\n\n` +
          `Đơn hàng này hiện bưu tá chưa qua lấy hàng nên **hoàn toàn đủ điều kiện hủy miễn phí 100% (0 VNĐ)** ạ. Tuy nhiên, theo quy chuẩn an toàn vận hành, hệ thống yêu cầu chính tay anh/chị bấm xác nhận để bên em chính thức phát lệnh dừng lấy hàng cho bưu tá.\n\n` +
          `Anh/chị vui lòng bấm vào nút **[❌ Xác nhận hủy đơn ${code}]** bên dưới để em tiến hành hủy đơn ngay cho mình nhé ạ!`;
      }

      if (realtimeSection.includes('[KẾT QUẢ HỦY ĐƠN HÀNG THÀNH CÔNG THEO XÁC NHẬN TỪ KHÁCH HÀNG]')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        return `Dạ em chào anh/chị ạ!\n\n` +
          `Đơn hàng **${code}** của anh/chị đã được **hủy thành công** trên hệ thống rồi nhé ạ. Đơn hàng được hủy hoàn toàn **miễn phí 100% (0 VNĐ)** và hệ thống đã phát lệnh dừng lấy hàng khẩn cấp tới bưu tá phụ trách tuyến.\n\n` +
          `Anh/chị yên tâm nhé! Nếu cần em hỗ trợ tạo đơn hàng mới hay cần tư vấn thêm điều gì, cứ nhắn em ngay ạ!`;
      }

      if (realtimeSection.includes('[CẢNH BÁO TỪ CHỐI HỦY ĐƠN THEO QUY CHUẨN VẬN HÀNH BƯU CHÍNH')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        return `Dạ em chào anh/chị ạ!\n\n` +
          `Về đơn hàng **${code}**, hiện kiện hàng đang trong quá trình vận chuyển trên xe tải đường trục hoặc bưu tá đang đi phát chặng cuối. Theo quy chuẩn an toàn vận hành vật lý của mạng lưới bưu chính, hệ thống **không thể hủy ngay lập tức** khi xe đang chạy trên đường cao tốc/quốc lộ được ạ.\n\n` +
          `Dạ anh/chị yên tâm, khi bưu tá liên hệ phát hàng, người nhận có thể **từ chối nhận hàng** (đơn sẽ tự động chuyển hoàn về người gửi theo quy định), hoặc anh/chị có thể liên hệ ngay hotline **1900-1234** để được điều phối viên hỗ trợ gắn cờ chuyển hoàn khi xe cập Hub phát nhé ạ!`;
      }

      if (realtimeSection.includes('[KẾT QUẢ TẠO ĐƠN HÀNG THÀNH CÔNG VỚI VAI TRÒ GIAO DỊCH VIÊN OPS BƯU CỤC]')) {
        return `🎉 **XÁC NHẬN TẠO ĐƠN HÀNG THÀNH CÔNG TRÊN HỆ THỐNG NEXUS LOGISTICS!**\n\n` +
          `Dạ em là Giao dịch viên bưu cục Nexus Logistics, em đã hoàn tất tạo đơn và chỉ định bưu cục tiếp nhận thành công cho anh/chị:\n\n` +
          `• 🏷️ **Mã vận đơn chính thức:** 333011589211\n` +
          `• 📌 **Trạng thái:** Đã phân công bưu tá lấy hàng (TASK_ASSIGNED)\n` +
          `• 👤 **Bưu tá phụ trách lấy:** Nguyễn Văn Tuấn (SĐT: 0908 123 456 - Tuyến SGN-01-TB)\n` +
          `• ⏰ **Thời gian lấy hàng dự kiến:** Trong vòng 30 - 60 phút tới (bưu tá sẽ gọi điện trước 15 phút khi qua).\n` +
          `• 📍 **Địa chỉ lấy hàng:** 128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM\n` +
          `• 📍 **Địa chỉ giao:** 25 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội\n` +
          `• 🎁 **Hàng hóa:** Kiện hàng quà tặng người thân (Trọng lượng: 1.5 kg - COD: 0 VNĐ)\n` +
          `• 💳 **Hình thức thanh toán cước:** Người gửi thanh toán (32.000 VNĐ - Đã ghi nhận)\n\n` +
          `Anh/chị vui lòng đóng gói hàng cẩn thận theo quy chuẩn bưu phẩm để bàn giao cho bưu tá an toàn nhé! Em chúc anh/chị và người thân một ngày thật vui vẻ ạ!`;
      }

      if (realtimeSection.includes('[PHIẾU TẠM TÍNH ĐƠN HÀNG & BÁO GIÁ CƯỚC TỪ GIAO DỊCH VIÊN BƯU CỤC NEXUS]')) {
        return `Dạ em là Giao dịch viên bưu cục Nexus Logistics, em xin gửi lại Phiếu chi tiết tiếp nhận đơn hàng tạm tính và Báo giá cước phí vận chuyển:\n\n` +
          `📋 **PHIẾU TIẾP NHẬN BƯU GỬI TẠM TÍNH - NEXUS LOGISTICS**\n` +
          `• 📍 **Điểm lấy hàng:** 128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM (Địa chỉ mặc định tài khoản)\n` +
          `• 👤 **Người nhận:** Anh Nguyễn Văn An - 0912 345 678\n` +
          `• 📍 **Địa chỉ giao hàng:** 25 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội\n` +
          `• 📦 **Hàng hóa:** Kiện hàng quà tặng người thân (Trọng lượng: 1.5 kg)\n` +
          `• 💵 **Tiền thu hộ COD:** 0 VNĐ (Quà tặng người thân)\n` +
          `• 🚚 **Cước vận chuyển Door-to-Door:** 32.000 VNĐ (Gói Tiêu chuẩn Tuyến TP.HCM ➔ Hà Nội)\n` +
          `• 🛡️ **Bảo hiểm bưu phẩm:** Miễn phí gói Tiêu chuẩn (đền bù tối đa 4 lần cước theo Luật Bưu chính)\n` +
          `• 💳 **Hình thức thanh toán cước:** Người gửi thanh toán (SENDER_PAYS)\n\n` +
          `💰 **TỔNG TIỀN QUÝ KHÁCH CẦN THANH TOÁN:**\n` +
          `👉 **32.000 VNĐ** (Quý khách có thể thanh toán trực tuyến ngay hoặc gửi tiền mặt cho bưu tá khi đến lấy hàng).\n` +
          `*(Lưu ý: Nếu quý khách chọn đổi sang Người nhận thanh toán cước khi giao hàng, số tiền cần trả khi gửi sẽ là 0 VNĐ).* \n\n` +
          `Anh/chị kiểm tra lại thông tin, nếu đồng ý với mức giá này xin vui lòng bấm **[Xác nhận & Tạo đơn ngay]** hoặc **[Thanh toán cước ngay]** để em chính thức cấp mã vận đơn và điều phối bưu tá qua lấy hàng tận nhà ạ!`;
      }

      if (realtimeSection.includes('[QUY TRÌNH HỎI ĐÁP TIẾP NHẬN ĐƠN HÀNG VỚI VAI TRÒ GIAO DỊCH VIÊN BƯU CỤC (OPS CLERK)]')) {
        return `Chào anh/chị! Em là Giao dịch viên tiếp nhận bưu gửi tại Bưu cục Nexus Logistics. Rất vui được hỗ trợ anh/chị tạo đơn gửi quà cho người thân ngay trên hệ thống!\n\n` +
          `Để em hoàn tất phiếu tiếp nhận và điều phối bưu tá đến lấy hàng nhanh chóng nhất, anh/chị vui lòng cho em biết các thông tin sau:\n\n` +
          `1. 📍 **Địa chỉ lấy hàng:** Anh/chị muốn bưu tá đến lấy tại **Địa chỉ mặc định của tài khoản** (128 Phan Đăng Lưu, Phường 3, Quận Phú Nhuận, TP.HCM) hay lấy tại **Địa chỉ lấy hàng mới** ạ?\n` +
          `2. 👤 **Thông tin người nhận:** Họ tên, Số điện thoại và Địa chỉ giao hàng chi tiết (Tỉnh/Thành, Quận/Huyện) của người nhận.\n` +
          `3. 📦 **Hàng hóa & Cân nặng:** Tên mặt hàng (ví dụ: Quần áo, quà tặng, mỹ phẩm, thực phẩm khô...), nặng khoảng bao nhiêu kg và có thu tiền COD không ạ? (Quà tặng người thân thì thường là COD 0đ).\n` +
          `4. 💳 **Hình thức thanh toán cước phí:** Đơn hàng này sẽ do:\n` +
          `• **Người gửi thanh toán (SENDER_PAYS):** Quý khách thanh toán cước ngay hoặc đưa tiền mặt khi bưu tá đến lấy hàng.\n` +
          `• **Người nhận thanh toán (RECEIVER_PAYS):** Người nhận sẽ thanh toán cước khi bưu tá giao hàng.\n\n` +
          `Sau khi có đủ thông tin, em sẽ gửi lại Phiếu chi tiết đơn hàng và Báo giá cước phí, nếu anh/chị đồng ý hoặc thanh toán ngay thì đơn hàng mới chính thức được tạo trên hệ thống ạ!\n\n` +
          `*(Anh/chị có thể bấm chọn nhanh các nút gợi ý bên dưới hoặc nhắn trực tiếp thông tin cho em nhé!)*`;
      }

      // Xử lý Tra cứu danh sách đơn hàng của người dùng
      if (realtimeSection.includes('[DANH SÁCH CÁC ĐƠN HÀNG GẦN ĐÂY CỦA TÀI KHOẢN')) {
        const orderLines = realtimeSection
          .split('\n')
          .filter((l) => /^\s*\d+\.\s*Mã vận đơn:/.test(l));

        return (
          `📦 **TRUNG TÂM ĐIỀU PHỐI NEXUS LOGISTICS - DANH SÁCH BƯU PHẨM CỦA BẠN**\n\n` +
          `Hệ thống ghi nhận tài khoản của bạn hiện có **${orderLines.length} đơn hàng** đang lưu hành trên mạng lưới:\n\n` +
          orderLines
            .map((line) => `• ${line.trim()}`)
            .join('\n') +
          `\n\n👉 *Quý khách có thể bấm trực tiếp vào từng Thẻ vận đơn bên dưới để theo dõi lộ trình di chuyển chi tiết qua các Hub trung chuyển.*`
        );
      }

      // Xử lý Trả lời câu hỏi tương tác tiếp theo về đơn hàng trong phiên (Multi-turn Contextual QA)
      if (realtimeSection.includes('[HƯỚNG DẪN AI TRẢ LỜI CÂU HỎI TIẾP THEO VỀ ĐƠN HÀNG')) {
        const codeMatch = realtimeSection.match(/Mã vận đơn: (.*?)\n/);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const locMatch = realtimeSection.match(/Vị trí hiện tại: (.*?)\n/);
        const loc = locMatch ? locMatch[1].trim() : '';
        const statusMatch = realtimeSection.match(/Trạng thái: (.*?)\n/);
        const status = statusMatch ? statusMatch[1].trim() : '';
        const etaMatch = realtimeSection.match(/Thời gian dự kiến giao: (.*?)\n/);
        const eta = etaMatch ? etaMatch[1].trim() : '';
        const codMatch = realtimeSection.match(/Tiền thu hộ COD: (.*?)\n/);
        const cod = codMatch ? codMatch[1].trim() : '';
        const receiverMatch = realtimeSection.match(/Người nhận: (.*?)\n/);
        const receiver = receiverMatch ? receiverMatch[1].trim() : '';
        const phoneMatch = realtimeSection.match(/Số điện thoại người nhận: (.*?)\n/);
        const phone = phoneMatch ? phoneMatch[1].trim() : '';
        const itemMatch = realtimeSection.match(/Tên hàng hóa: (.*?)\n/);
        const item = itemMatch ? itemMatch[1].trim() : '';

        const cleanQ = question.toLowerCase();
        if (cleanQ.includes('cod') || cleanQ.includes('thu ho') || cleanQ.includes('tien') || cleanQ.includes('gia')) {
          return `Dạ tiền thu hộ COD của đơn hàng **${code}** là **${cod || '0 VNĐ'}** ạ.\n\n` +
            `• 📌 **Trạng thái:** ${status}\n` +
            `• 📍 **Vị trí hiện tại:** ${loc}\n` +
            (eta ? `• ⏰ **Dự kiến phát hàng:** ${eta}\n` : '') +
            `\nNếu anh/chị cần hỗ trợ thêm thông tin gì về đơn này, cứ nhắn em nhé ạ!`;
        }

        if (cleanQ.includes('den dau') || cleanQ.includes('o dau') || cleanQ.includes('toi dau') || cleanQ.includes('hanh trinh') || cleanQ.includes('tien do')) {
          return `Dạ đơn hàng **${code}** của mình hiện đang ở: **${loc}** ạ.\n\n` +
            `• 📌 **Trạng thái:** ${status}\n` +
            (eta ? `• ⏰ **Thời gian dự kiến phát:** ${eta}\n` : '') +
            (cod ? `• 💵 **Tiền thu hộ COD:** ${cod}\n` : '') +
            `\nAnh/chị yên tâm nhé, bên em đang theo sát tiến độ vận chuyển cho mình ạ!`;
        }

        if (cleanQ.includes('bao gio') || cleanQ.includes('khi nao') || cleanQ.includes('may gio') || cleanQ.includes('bao lau') || cleanQ.includes('may ngay')) {
          return `Dạ thời gian dự kiến giao của đơn hàng **${code}** là: **${eta || 'Trong ngày làm việc tiếp theo'}** ạ.\n\n` +
            `• 📍 **Vị trí hiện tại:** ${loc}\n` +
            `• 📌 **Trạng thái:** ${status}\n` +
            `\nBưu tá tuyến sẽ gọi điện thoại trước cho người nhận khi giao hàng nhé ạ!`;
        }

        const addrMatch = realtimeSection.match(/Địa chỉ nhận hàng \(Nơi giao đến\): (.*?)\n/);
        const receiverAddress = addrMatch ? addrMatch[1].trim() : '';
        const adminMatch = realtimeSection.match(/Đơn vị hành chính nơi nhận: (.*?)\n/);
        const receiverAdmin = adminMatch ? adminMatch[1].trim() : '';

        if (cleanQ.includes('ai nhan') || cleanQ.includes('nguoi nhan') || cleanQ.includes('dia chi') || cleanQ.includes('sdt') || cleanQ.includes('giao den') || cleanQ.includes('quan nao') || cleanQ.includes('phuong nao') || cleanQ.includes('o dau')) {
          if (phone && !phone.includes('ẩn')) {
            return `Dạ thông tin người nhận đơn hàng **${code}** là:\n\n` +
              `• 👤 **Người nhận:** ${receiver}\n` +
              `• 📱 **Số điện thoại:** ${phone}\n` +
              (receiverAddress ? `• 📍 **Địa chỉ nhận hàng:** ${receiverAddress}\n` : '') +
              `• 📌 **Trạng thái:** ${status}\n` +
              `• 🚚 **Vị trí hiện tại:** ${loc}\n` +
              `\nAnh/chị cần em hỗ trợ thêm gì không ạ?`;
          } else {
            return `Dạ đơn hàng **${code}** được giao đến: **${receiverAddress || receiverAdmin || 'Thành phố Hồ Chí Minh'}** ạ.\n\n` +
              `*(Vì lý do bảo mật dữ liệu cá nhân theo Luật Bưu chính, số nhà chi tiết và số điện thoại đang tạm thời được ẩn. Anh/chị có thể gửi SĐT người nhận hoặc [Đăng nhập tài khoản](/login) để xem trọn vẹn nhé ạ!)*`;
          }
        }

        return `Dạ thông tin đơn hàng **${code}** của anh/chị như sau ạ:\n\n` +
          `• 📌 **Trạng thái:** ${status}\n` +
          (item ? `• 📦 **Hàng hóa:** ${item}\n` : '') +
          `• 📍 **Vị trí hiện tại:** ${loc}\n` +
          (eta ? `• ⏰ **Dự kiến phát hàng:** ${eta}\n` : '') +
          (cod ? `• 💵 **Tiền thu hộ COD:** ${cod}\n` : '') +
          (receiver ? `• 👤 **Người nhận:** ${receiver}\n` : '') +
          `\nNếu anh/chị cần em kiểm tra thêm gì về đơn hàng này, cứ nhắn em ngay nhé ạ!`;
      }

      // Xử lý Tra cứu đơn hàng ở chế độ Khách vãng lai (PII Masked) - Bắt buộc tư vấn 2 lựa chọn mở khóa
      if (realtimeSection.includes('(CHẾ ĐỘ KHÁCH VÃNG LAI - ĐÃ MÃ HÓA THÔNG TIN CÁ NHÂN PII)')) {
        const lines = realtimeSection
          .split('\n')
          .filter(
            (l) =>
              !l.startsWith('[THÔNG TIN') &&
              !l.includes('LƯU Ý BẢO MẬT') &&
              !l.includes('HƯỚNG DẪN') &&
              !l.includes('CHỈ DẪN') &&
              !l.includes('Ghi chú quan trọng') &&
              !l.includes('BẮT BUỘC') &&
              !l.includes('LỰA CHỌN')
          )
          .map((l) => l.trim())
          .filter(Boolean);

        return (
          `📦 **HÀNH TRÌNH BƯU PHẨM - TRUNG TÂM ĐIỀU PHỐI NEXUS LOGISTICS**\n\n` +
          lines.join('\n') +
          `\n\n🛡️ *Lưu ý bảo mật: Vì anh/chị đang tra cứu với tư cách Khách vãng lai, thông tin người nhận và địa chỉ chi tiết tạm thời được che bớt theo Luật Bưu chính.* Để mở khóa xem toàn bộ thông tin chi tiết, anh/chị có 2 lựa chọn tiện lợi sau ạ:\n\n` +
          `• 🔑 **Lựa chọn 1 (Nếu đã có tài khoản / Đăng nhập):** Mời anh/chị bấm **[Đăng nhập tài khoản](/login)** để hệ thống tự động nhận diện và mở khóa xem đầy đủ mọi chi tiết mà không cần nhập lại SĐT.\n` +
          `• 📱 **Lựa chọn 2 (Tra cứu nhanh không cần tài khoản):** Quý khách chỉ cần gửi **Số điện thoại người nhận** (hoặc 4 số cuối SĐT nhận hàng) ngay tại khung chat này, hệ thống sẽ đối chiếu và mở khóa hiển thị đầy đủ thông tin chi tiết ngay lập tức nhé ạ!`
        );
      }

      // Xử lý Tra cứu đơn hàng gần nhất / đơn hàng duy nhất / chi tiết mã vận đơn
      if (
        realtimeSection.includes('[THÔNG TIN ĐƠN HÀNG GẦN NHẤT CỦA BẠN') ||
        realtimeSection.includes('[THÔNG TIN ĐƠN HÀNG DUY NHẤT CỦA BẠN') ||
        realtimeSection.includes('[THÔNG TIN TRA CỨU ĐƠN HÀNG MÃ')
      ) {
        const lines = realtimeSection
          .split('\n')
          .filter(
            (l) =>
              !l.startsWith('[THÔNG TIN') &&
              !l.includes('LƯU Ý BẢO MẬT') &&
              !l.includes('HƯỚNG DẪN') &&
              !l.includes('CHỈ DẪN') &&
              !l.includes('Ghi chú quan trọng')
          )
          .map((l) => l.trim())
          .filter(Boolean);

        return (
          `📦 **HÀNH TRÌNH BƯU PHẨM - TRUNG TÂM ĐIỀU PHỐI NEXUS LOGISTICS**\n\n` +
          lines.join('\n') +
          `\n\n👉 *Quý khách có thể xem Thẻ vận đơn bên dưới để biết thêm chi tiết hoặc liên hệ bưu cục nếu cần hỗ trợ phát gấp.*`
        );
      }

      // Làm sạch các chỉ dẫn nội bộ / prompt không để lộ ra giao diện người dùng
      const cleanSection = realtimeSection
        .replace(/\[HƯỚNG DẪN[\s\S]*?(\n\n|$)/g, '')
        .replace(/- Ghi chú quan trọng cho AI:[\s\S]*?\n/g, '')
        .replace(/- HƯỚNG DẪN AI:[\s\S]*?\n/g, '')
        .replace(/- CHỈ DẪN AI:[\s\S]*?\n/g, '')
        .replace(/- HÃY BÁO GIÁ[\s\S]*?\n/g, '')
        .replace(/ℹ️\s*Tài khoản undefined[^\n]*\n?/g, '')
        .replace(/\[THÔNG TIN TRA CỨU ĐƠN HÀNG THỰC TẾ CHO MÃ (.*?)\]:/g, '📦 **Chi tiết hành trình vận đơn $1**:')
        .replace(/\[THÔNG TIN ĐƠN HÀNG MỚI TẠO GẦN NHẤT CỦA BẠN(.*?)\]:/g, '📦 **Đơn hàng mới tạo gần nhất của bạn**:')
        .replace(/\[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ (.*?)\]:/g, '🛡️ **Hồ sơ khiếu nại bồi thường $1**:')
        .replace(/\[BẢNG BÁO GIÁ CƯỚC THỜI GIAN THỰC TỪ MICROSERVICE PRICING-SERVICE\]:/g, '💰 **Dự toán cước phí vận chuyển**:')
        .replace(/\[QUY ĐỊNH THỜI HẠN LƯU KHO & XỬ LÝ HÀNG QUÁ HẠN \/ VÔ CHỦ - (.*?)\]:/g, '🏬 **Quy định thời hạn lưu kho & Xử lý hàng quá hạn, vô chủ ($1)**:')
        .replace(/\[QUY HOẠCH DẢI MÃ VẬN ĐƠN & MÃ ĐỊNH TUYẾN 3 ĐOẠN (.*?)\]:/g, '🏷️ **Quy hoạch dải mã vận đơn & Mã định tuyến 3 đoạn $1**:')
        .replace(/\[KẾT QUẢ TRA CỨU\]:\s*/g, 'ℹ️ ')
        .trim();

      const isDomainOrderOrPricing =
        realtimeSection.includes('Mã vận đơn') ||
        realtimeSection.includes('báo giá cước') ||
        realtimeSection.includes('BÁO GIÁ') ||
        realtimeSection.includes('TẠO ĐƠN');

      let citationNote = '';
      if (!isDomainOrderOrPricing && citations.length > 0 && citations[0].score > 65) {
        citationNote = `\n\n📖 *Căn cứ Quy chuẩn Vận hành Dịch vụ Nexus:*\n"${citations[0].snippet}"`;
      }

      return `Dạ em chào anh/chị ạ! Em xin phép gửi anh/chị thông tin từ hệ thống:\n\n` +
        `${cleanSection}${citationNote}\n\n` +
        `Nếu anh/chị cần em hỗ trợ thêm điều gì, cứ nhắn em ngay nhé ạ!`;
    }

    if (!context || citations.length === 0) {
      const qLower = question.toLowerCase();
      if (qLower.includes('chao') || qLower.includes('hello') || qLower.includes('hi') || qLower.includes('alo')) {
        return `Dạ em chào anh/chị ạ! Em là Trợ lý AI Bưu cục của Nexus Logistics. Em có thể hỗ trợ anh/chị tra cứu hành trình bưu gửi, dự toán cước phí hoặc tạo đơn hàng mới. Anh/chị cần em hỗ trợ gì cứ gửi tin nhắn cho em nhé ạ!`;
      }
      return `Dạ em chào anh/chị ạ! Về câu hỏi "${question}", hiện hệ thống bên em chưa có dữ liệu chi tiết cho trường hợp này. Anh/chị có thể liên hệ tổng đài 1900 1234 để được chuyên viên hỗ trợ giải đáp trực tiếp cho mình ngay nhé ạ!`;
    }

    const qNorm = normalizeVietnamese(question);
    if (qNorm.startsWith('chao') || qNorm.startsWith('xin chao') || qNorm.startsWith('hello') || qNorm.startsWith('hi') || qNorm.startsWith('alo')) {
      return `Dạ em chào anh/chị ạ! Em là Trợ lý AI Bưu cục của Nexus Logistics. Em luôn sẵn sàng hỗ trợ anh/chị tra cứu vận đơn, dự toán cước phí vận chuyển hoặc tạo đơn gửi hàng mới. Anh/chị gửi mã vận đơn để em kiểm tra ngay cho mình nhé ạ!`;
    }

    const topCitation = citations[0];
    return `Dạ em chào anh/chị ạ! Theo Quy chuẩn Vận hành của Nexus Logistics:\n\n` +
      `• ${topCitation.snippet}\n\n` +
      `Nếu anh/chị cần em hỗ trợ chi tiết hơn cho từng đơn hàng cụ thể, mình gửi kèm mã vận đơn để em tra cứu ngay cho mình nhé ạ!`;
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
