import { Injectable, Logger } from '@nestjs/common';
import { LogisticsToolsService, TrackingResult, phonesMatch } from '../../tools/logistics-tools.service';
import { EmbeddingService } from '../../rag/embedding.service';
import { VectorStoreService } from '../../rag/vector-store.service';
import { ActionChipDto, Citation, SearchMatch, ShipmentCardDto } from '../../rag/rag.types';
import {
  ChatSessionContext,
  OrchestrationResult,
  StructuredIntentResult,
} from '../chat.types';
import { ChatRequestDto, OrderDataDto } from '../dto/chat-request.dto';
import {
  CarrierGuardrailsService,
  extractClaimCode,
  extractPhone,
  extractTrackingCode,
  normalizeCityName,
  normalizeVietnamese,
} from '../guardrails/carrier-guardrails.service';
import { QueryRewriterService } from '../router/query-rewriter.service';

@Injectable()
export class LogisticsOrchestratorService {
  private readonly logger = new Logger(LogisticsOrchestratorService.name);

  constructor(
    private readonly toolsService: LogisticsToolsService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly guardrails: CarrierGuardrailsService,
    private readonly queryRewriter: QueryRewriterService,
  ) {}

  async execute(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    routed: StructuredIntentResult,
  ): Promise<OrchestrationResult> {
    const question = (dto.message || '').trim();
    const isGuest = (!dto.userId && !dto.userName) || dto.senderRole === 'GUEST';
    const userDisplayName = dto.userName || dto.userId || 'Quý khách';
    const accountPhone =
      dto.userPhone ||
      (dto.userId && /^(?:\+?84|0)\d{8,11}$/.test(dto.userId.trim()) ? dto.userId.trim() : undefined);

    switch (routed.intent) {
      case 'OUT_OF_DOMAIN':
        return {
          toolsUsed: ['domainBoundaryController(Out of Domain Routing)'],
          toolAugmentedContext: `\n[TỪ CHỐI NGOÀI PHẠM VI HỆ THỐNG]: Trợ lý AI Bưu cục Nexus Logistics chỉ hỗ trợ các nghiệp vụ bưu chính, vận chuyển hàng hóa, tra cứu vận đơn và quản lý tài khoản logistics. Yêu cầu "${question}" nằm ngoài phạm vi hỗ trợ.\n`,
          citations: [],
          sessionPatch: {},
        };

      case 'GREETING':
        return this.handleGreeting(isGuest, userDisplayName);

      case 'USER_IDENTITY':
        return this.handleUserIdentity(dto, isGuest, userDisplayName);

      case 'TRACK_SHIPMENT':
        return this.handleTrackShipment(dto, session, routed.params, isGuest, accountPhone);

      case 'FOLLOW_UP_SHIPMENT':
        return this.handleFollowUpShipment(dto, session, routed.params, isGuest, accountPhone);

      case 'LIST_USER_SHIPMENTS':
        return this.handleListUserShipments(dto, isGuest, userDisplayName, accountPhone);

      case 'CALCULATE_PRICING':
        return this.handleCalculatePricing(question, session, routed.params);

      case 'RETURN_FEE':
        return this.handleReturnFee(routed.params);

      case 'CANCEL_SHIPMENT':
        return this.handleCancelShipment(dto, session, routed.params, isGuest, accountPhone);

      case 'CHANGE_ADDRESS':
        return this.handleChangeAddress(dto, session, routed.params, isGuest, accountPhone);

      case 'CHANGE_CONSIGNEE':
        return this.handleChangeConsignee(dto, session, routed.params);

      case 'SCHEDULE_REDELIVERY':
        return this.handleScheduleRedelivery(dto, session, routed.params);

      case 'HOLD_AT_HUB':
        return this.handleHoldAtHub(dto, session, routed.params);

      case 'AUDIT_DELIVERY_ATTEMPT':
        return this.handleAuditDeliveryAttempt(dto, session, routed.params);

      case 'TRACK_CLAIM':
        return this.handleTrackClaim(dto, session, routed.params);

      case 'CREATE_ORDER':
        return this.handleCreateOrder(dto, session, routed.params, userDisplayName);

      case 'ESCALATE_HUMAN':
        return this.handleEscalation(dto, session, routed.params);

      case 'STORAGE_AGING_POLICY':
        return this.handleStorageAgingPolicy();

      case 'WAYBILL_FORMAT_POLICY':
        return this.handleWaybillFormatPolicy();

      case 'KNOWLEDGE_RAG':
      default:
        return this.handleKnowledgeRag(question, session);
    }
  }

  private handleGreeting(isGuest: boolean, userDisplayName: string): OrchestrationResult {
    const toolAugmentedContext = isGuest
      ? `\n[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH VÃNG LAI (GUEST)]: Chào hỏi ngắn gọn, lễ phép, xưng em gọi anh/chị.\n`
      : `\n[Ý ĐỊNH CHÀO HỎI XÃ GIAO - KHÁCH HÀNG ĐÃ ĐĂNG NHẬP]: Chào anh/chị ${userDisplayName} thân thiện.\n`;

    return {
      toolsUsed: [],
      toolAugmentedContext,
      citations: [],
      actionChips: [
        { label: 'Tra cứu hành trình đơn hàng', query: 'Tra cứu hành trình đơn hàng' },
        { label: 'Dự toán cước vận chuyển', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
        { label: 'Tạo đơn gửi hàng mới', query: 'Tôi muốn tạo đơn gửi hàng mới' },
      ],
      sessionPatch: {},
    };
  }

  private handleUserIdentity(dto: ChatRequestDto, isGuest: boolean, userDisplayName: string): OrchestrationResult {
    if (isGuest) {
      return {
        toolsUsed: ['checkSessionIdentity(GUEST)'],
        toolAugmentedContext:
          `\n[THÔNG TIN NGƯỜI DÙNG CHƯA ĐĂNG NHẬP]:\n` +
          `- Hiện tại người dùng là Khách vãng lai (Chưa đăng nhập).\n` +
          `- HƯỚNG DẪN AI: Giải thích nhẹ nhàng do chưa đăng nhập nên chưa xem được thông tin cá nhân, mời bấm [Đăng nhập tài khoản](/login).\n`,
        citations: [],
        actionChips: [
          { label: 'Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
          { label: 'Tra cứu đơn bằng mã vận đơn', query: 'Tra cứu hành trình đơn hàng' },
        ],
        sessionPatch: {},
      };
    }

    return {
      toolsUsed: [`checkSessionIdentity(${dto.senderRole || 'CUSTOMER'}:${dto.userId})`],
      toolAugmentedContext:
        `\n[THÔNG TIN HỒ SƠ TÀI KHOẢN NGƯỜI DÙNG HIỆN TẠI (ĐÃ ĐĂNG NHẬP)]:\n` +
        `- Tên người dùng / Tên hiển thị: ${userDisplayName}\n` +
        `- Mã tài khoản / Số điện thoại (User ID): ${dto.userId}\n` +
        `- Vai trò hệ thống: ${dto.senderRole === 'MERCHANT' ? 'Chủ Shop / Merchant' : 'Khách hàng (Customer)'}\n`,
      citations: [],
      actionChips: [
        { label: 'Xem các đơn của tôi', query: 'Kiểm tra các đơn hàng của tôi' },
        { label: 'Tạo đơn gửi hàng mới', query: 'Tôi muốn tạo đơn gửi hàng mới' },
      ],
      sessionPatch: {},
    };
  }

  private async handleTrackShipment(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
    isGuest: boolean,
    accountPhone?: string,
  ): Promise<OrchestrationResult> {
    const question = dto.message || '';
    const code = (
      params.trackingCode ||
      extractTrackingCode(question) ||
      session.selectedCode ||
      dto.selectedShipmentCode ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    if (!code) {
      return this.handleListUserShipments(dto, isGuest, dto.userName || 'Quý khách', accountPhone);
    }

    const extractedPhone =
      (params.receiverPhone && String(params.receiverPhone).trim()) ||
      dto.receiverPhone ||
      extractPhone(question);
    const isNewCode = session.selectedCode && session.selectedCode !== code;
    const phoneToUse = extractedPhone || (isNewCode ? undefined : session.receiverPhone);

    const toolsUsed = [
      `trackShipment(${code}, isGuest=${isGuest}, phone=${phoneToUse || 'none'}, accountPhone=${accountPhone || 'none'})`,
    ];
    const trackRes = await this.toolsService.trackShipment(code, isGuest, phoneToUse, accountPhone);

    if (!trackRes.found) {
      if (trackRes.status === 'PHONE_MISMATCH') {
        return {
          toolsUsed,
          toolAugmentedContext:
            `\n[THÔNG BÁO SỐ ĐIỆN THOẠI NGƯỜI NHẬN KHÔNG KHỚP - BẢO MẬT PII LUẬT BƯU CHÍNH]:\n` +
            `- Mã vận đơn: ${code}\n` +
            `- Số điện thoại cung cấp: ${phoneToUse}\n` +
            `- Lưu ý: Số điện thoại chưa khớp hồ sơ người nhận nên chưa hiển thị thông tin đơn; mời anh/chị nhập lại SĐT hoặc đăng nhập.\n`,
          citations: [],
          shipmentCards: [],
          actionChips: [
            { label: 'Nhập lại SĐT người nhận', query: `Số điện thoại người nhận đơn ${code} là ` },
            { label: 'Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
          ],
          sessionPatch: { selectedCode: code, pendingIntent: 'TRACKING' },
        };
      }

      return {
        toolsUsed,
        toolAugmentedContext:
          `\n[KẾT QUẢ TRA CỨU TRẠNG THÁI VẬN ĐƠN]: Không tìm thấy mã vận đơn ${code} trên hệ thống. ${trackRes.notFoundMessage || ''}\n` +
          `- HƯỚNG DẪN AI: Thông báo trung thực chưa tìm thấy dữ liệu mã ${code} và mời anh/chị kiểm tra lại mã.\n`,
        citations: [],
        actionChips: [
          { label: 'Tra cứu đơn khác', query: 'Tra cứu hành trình đơn hàng' },
          { label: 'Dự toán cước phí', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
        ],
        sessionPatch: { selectedCode: code },
      };
    }

    if (trackRes.status === 'REQUIRES_RECEIVER_PHONE') {
      return {
        toolsUsed,
        toolAugmentedContext:
          `\n[YÊU CẦU BẮT BUỘC CUNG CẤP SỐ ĐIỆN THOẠI NGƯỜI NHẬN ĐỂ TRA CỨU ĐƠN HÀNG ${code}]:\n` +
          `- Mã vận đơn: ${code}\n` +
          `- Trạng thái xác thực: ${isGuest ? 'Khách vãng lai (Chưa đăng nhập)' : `Tài khoản ${accountPhone || dto.userId} khác SĐT gửi/nhận của đơn`}\n` +
          `- Kết luận: Mời anh/chị cung cấp Số điện thoại người nhận (hoặc 4 số cuối) hay đăng nhập tài khoản chính chủ để mở khóa chi tiết đơn ${code}.\n`,
        citations: [],
        shipmentCards: [],
        actionChips: [
          { label: 'Cung cấp SĐT người nhận', query: `Số điện thoại người nhận đơn ${code} là ` },
          ...(isGuest ? [{ label: 'Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' }] : []),
        ],
        sessionPatch: { selectedCode: code, pendingIntent: 'TRACKING' },
      };
    }

    const built = this.buildVerifiedTrackingContext(dto, trackRes, isGuest, accountPhone, Boolean(extractedPhone));
    return {
      toolsUsed,
      toolAugmentedContext: built.context,
      citations: [],
      shipmentCards: [built.card],
      actionChips: built.actionChips,
      sessionPatch: {
        selectedCode: trackRes.trackingNumber,
        receiverPhone: phoneToUse,
        pendingIntent: undefined,
        lastShipmentSummary: {
          code: trackRes.trackingNumber,
          itemName: trackRes.itemName,
          status: trackRes.status,
          statusText: trackRes.statusText,
          codAmount: trackRes.codAmount,
          weightKg: trackRes.weightKg,
          isVerified: true,
        },
      },
    };
  }

  private async handleFollowUpShipment(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
    isGuest: boolean,
    accountPhone?: string,
  ): Promise<OrchestrationResult> {
    const code = (
      params.trackingCode ||
      extractTrackingCode(dto.message || '') ||
      session.selectedCode ||
      dto.selectedShipmentCode ||
      session.lastShipments?.[0]?.code ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    if (!code) {
      return {
        toolsUsed: [],
        toolAugmentedContext:
          `\n[YÊU CẦU LÀM RÕ MÃ VẬN ĐƠN]: Khách hàng đang hỏi tiếp về đơn hàng nhưng chưa xác định được mã vận đơn trong phiên hội thoại. Hãy lịch sự hỏi anh/chị cho em xin mã vận đơn cần kiểm tra ạ.\n`,
        citations: [],
        sessionPatch: {},
      };
    }

    const phoneToUse = session.receiverPhone || dto.receiverPhone || extractPhone(dto.message || '');
    const toolsUsed = [`trackShipment(${code}, followUp=${params.attribute || 'general'})`];
    const trackRes = await this.toolsService.trackShipment(code, isGuest, phoneToUse, accountPhone);

    if (!trackRes.found || trackRes.status === 'REQUIRES_RECEIVER_PHONE' || trackRes.status === 'PHONE_MISMATCH') {
      return {
        toolsUsed,
        toolAugmentedContext:
          `\n[YÊU CẦU XÁC THỰC CHO ĐƠN ${code}]: Trạng thái kiểm tra là ${trackRes.status}. Theo quy chuẩn bảo mật PII, mời anh/chị cung cấp số điện thoại người nhận hoặc đăng nhập tài khoản để xem chi tiết thuộc tính "${params.attribute || 'general'}" của đơn ${code}.\n`,
        citations: [],
        shipmentCards: [],
        sessionPatch: { selectedCode: code, pendingIntent: 'TRACKING' },
      };
    }

    const context =
      `\n[HƯỚNG DẪN AI TRẢ LỜI CÂU HỎI TIẾP THEO VỀ ĐƠN HÀNG ${trackRes.trackingNumber} (MULTI-TURN CONTEXTUAL QA)]:\n` +
      `- Câu hỏi nối tiếp của khách: "${dto.message}" (Trọng tâm: ${params.attribute || 'general'})\n` +
      `- Mã vận đơn: ${trackRes.trackingNumber}\n` +
      `- Trạng thái: ${trackRes.statusText} (${trackRes.status})\n` +
      `- Tên hàng hóa: ${trackRes.itemName || 'Bưu phẩm tiêu chuẩn'}\n` +
      `- Khối lượng: ${trackRes.weightKg ? `${trackRes.weightKg} kg` : 'Chưa ghi nhận chi tiết trên vận đơn (mặc định tiêu chuẩn)'}\n` +
      `- Tiền thu hộ COD: ${(trackRes.codAmount ?? 0).toLocaleString('vi-VN')} VNĐ\n` +
      `- Người gửi: ${trackRes.senderName || 'Không rõ'}${trackRes.senderAddress ? ` (${trackRes.senderAddress})` : ''}\n` +
      `- Người nhận: ${trackRes.receiverName || 'Không rõ'}\n` +
      (trackRes.receiverPhone ? `- Số điện thoại người nhận: ${trackRes.receiverPhone}\n` : '') +
      `- Địa chỉ nhận hàng (Nơi giao đến): ${trackRes.receiverAddress || [trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ') || trackRes.receiverCity || 'Chưa cập nhật'}\n` +
      `- Vị trí hiện tại: ${trackRes.currentLocation || 'Đang cập nhật'}\n` +
      `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery || 'Trong ngày làm việc tiếp theo'}\n` +
      (trackRes.courierName ? `- Bưu tá phụ trách: ${trackRes.courierName}${trackRes.courierPhone ? ` (${trackRes.courierPhone})` : ''}\n` : '') +
      `- Lịch sử hành trình gần nhất:\n${trackRes.timeline.slice(0, 4).map((t) => `  * ${t.time}: ${t.description}`).join('\n')}\n` +
      `- HƯỚNG DẪN AI: Trả lời TRỰC TIẾP và CHÍNH XÁC vào đúng câu hỏi nối tiếp của anh/chị dựa trên thông số thực ở trên (xưng em, gọi anh/chị, không hỏi lại mã đơn).\n`;

    return {
      toolsUsed,
      toolAugmentedContext: context,
      citations: [],
      shipmentCards: [this.toShipmentCard(trackRes)],
      actionChips: [
        { label: `Chi tiết hành trình ${trackRes.trackingNumber}`, query: `Kiểm tra đơn ${trackRes.trackingNumber}` },
        { label: 'Hẹn giao lại', query: `Hẹn giao lại đơn ${trackRes.trackingNumber} vào ngày mai` },
      ],
      sessionPatch: {
        selectedCode: trackRes.trackingNumber,
        pendingIntent: undefined,
        lastShipmentSummary: {
          code: trackRes.trackingNumber,
          itemName: trackRes.itemName,
          status: trackRes.status,
          statusText: trackRes.statusText,
          codAmount: trackRes.codAmount,
          weightKg: trackRes.weightKg,
          isVerified: true,
        },
      },
    };
  }

  private async handleListUserShipments(
    dto: ChatRequestDto,
    isGuest: boolean,
    userDisplayName: string,
    accountPhone?: string,
  ): Promise<OrchestrationResult> {
    if (isGuest || !dto.userId) {
      return {
        toolsUsed: ['trackingConsultationController(GUEST)'],
        toolAugmentedContext:
          `\n[TƯ VẤN PHƯƠNG THỨC TRA CỨU VẬN ĐƠN DÀNH CHO KHÁCH VÃNG LAI]:\n` +
          `- HƯỚNG DẪN AI: Mời anh/chị (1) [Đăng nhập tài khoản](/login) để xem toàn bộ danh sách đơn hàng, HOẶC (2) Gửi trực tiếp Mã vận đơn + SĐT người nhận để tra cứu nhanh.\n`,
        citations: [],
        actionChips: [
          { label: 'Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' },
          { label: 'Dự toán cước vận chuyển', query: 'Dự toán cước vận chuyển 2kg từ TP.HCM đi Hà Nội' },
        ],
        sessionPatch: {},
      };
    }

    const toolsUsed = [`getUserShipments(User:${dto.userId})`];
    const userShipments = await this.toolsService.getUserShipments(dto.userId, 5);

    if (userShipments.total === 0) {
      return {
        toolsUsed,
        toolAugmentedContext: `\n[KẾT QUẢ TRA CỨU ĐƠN HÀNG CỦA TÀI KHOẢN ${userDisplayName}]: Hiện tài khoản chưa ghi nhận đơn hàng nào trên hệ thống.\n`,
        citations: [],
        actionChips: [{ label: 'Tạo đơn gửi hàng mới', query: 'Tôi muốn tạo đơn gửi hàng mới' }],
        sessionPatch: {},
      };
    }

    if (userShipments.total === 1) {
      const latestCode = userShipments.items[0].code;
      const detail = await this.toolsService.trackShipment(latestCode, false, undefined, accountPhone);
      if (detail.found && detail.status !== 'REQUIRES_RECEIVER_PHONE') {
        const built = this.buildVerifiedTrackingContext(dto, detail, false, accountPhone, false);
        return {
          toolsUsed,
          toolAugmentedContext: built.context,
          citations: [],
          shipmentCards: [built.card],
          actionChips: built.actionChips,
          sessionPatch: { selectedCode: latestCode, lastShipments: userShipments.items },
        };
      }
    }

    return {
      toolsUsed,
      toolAugmentedContext:
        `\n[DANH SÁCH CÁC ĐƠN HÀNG GẦN ĐÂY CỦA TÀI KHOẢN ${userDisplayName}]:\n` +
        `- Tổng số đơn tìm thấy: ${userShipments.total} đơn hàng.\n` +
        `- Giao diện chat đã tự động hiển thị ${userShipments.total} thẻ vận đơn (Shipment Cards) và các nút thao tác ngay bên dưới tin nhắn này.\n` +
        `- Yêu cầu phản hồi: Chỉ nhắn ngắn gọn 1-2 câu chào anh/chị ${userDisplayName} và thông báo hệ thống đã hiển thị ${userShipments.total} đơn hàng gần đây ở bên dưới để anh/chị bấm chọn xem chi tiết hoặc thao tác. KHÔNG kẻ bảng Markdown, KHÔNG liệt kê lặp lại danh sách đơn hay giải thích mã trạng thái tiếng Anh.\n`,
      citations: [],
      shipmentCards: userShipments.items.map((s) => ({
        code: s.code,
        status: s.status,
        statusText: s.statusText,
        itemName: s.itemName,
        receiverCity: s.receiverCity,
        receiverName: s.receiverName,
        codAmount: s.codAmount,
        createdAt: s.createdAt,
      })),
      actionChips: userShipments.items.slice(0, 3).map((s) => ({
        label: `Xem đơn ${s.code}`,
        query: `Kiểm tra chi tiết đơn ${s.code}`,
      })),
      sessionPatch: {
        lastShipments: userShipments.items,
        selectedCode: userShipments.items[0]?.code,
      },
    };
  }

  private async handleCalculatePricing(
    question: string,
    session: ChatSessionContext,
    params: Record<string, any>,
  ): Promise<OrchestrationResult> {
    const prev = session.lastPricingParams || (session.pendingIntent === 'PRICING' ? session.pendingData : undefined);
    const fromCity = params.fromCity ? normalizeCityName(String(params.fromCity)) : prev?.fromCity;
    const toCity = params.toCity ? normalizeCityName(String(params.toCity)) : prev?.toCity;
    const weight = Number(params.weightKg) > 0 ? Number(params.weightKg) : prev?.weight;

    const length = Number(params.lengthCm) || prev?.dimensions?.length || 0;
    const width = Number(params.widthCm) || prev?.dimensions?.width || 0;
    const height = Number(params.heightCm) || prev?.dimensions?.height || 0;
    const dimensionsCm = length > 0 && width > 0 && height > 0 ? { length, width, height } : undefined;

    if (params.needsClarification || (!fromCity && !toCity && !weight && !dimensionsCm)) {
      return {
        toolsUsed: [],
        toolAugmentedContext:
          `\n[YÊU CẦU CSKH HỎI LẠI THÔNG TIN TÍNH CƯỚC VẬN CHUYỂN (ACTIVE CLARIFICATION)]:\n` +
          `- Trạng thái: Khách hàng hỏi giá cước ("${question}") nhưng chưa cung cấp tuyến đường và cân nặng.\n` +
          `- HƯỚNG DẪN AI: Chào hỏi niềm nở và hỏi lại anh/chị 3 thông tin: (1) Tuyến gửi -> nhận (tỉnh/thành), (2) Khối lượng (kg hoặc Dài x Rộng x Cao cm), (3) Loại hàng hóa.\n`,
        citations: [],
        actionChips: [
          { label: 'Báo giá Nội thành TP.HCM (1kg)', query: 'Tính cước gửi hàng nội thành TP.HCM 1kg' },
          { label: 'TP.HCM -> Hà Nội 1kg', query: 'Tính cước gửi hàng từ TP.HCM đi Hà Nội 1kg' },
          { label: 'Báo giá hàng cồng kềnh', query: 'Dự toán cước hàng cồng kềnh kích thước 50x40x30cm nặng 5kg' },
        ],
        sessionPatch: {
          pendingIntent: 'PRICING',
          pendingData: { fromCity, toCity, weight, dimensions: dimensionsCm },
          lastPricingParams: { fromCity, toCity, weight, dimensions: dimensionsCm },
        },
      };
    }

    const effFrom = fromCity || 'HO CHI MINH';
    const effTo = toCity || (effFrom === 'HA NOI' ? 'HO CHI MINH' : 'HA NOI');
    const effWeight = Math.max(0.1, weight || 1);

    const isIntra = effFrom === effTo;
    const toolsUsed = [
      `calculatePricing(${effFrom}->${effTo}:${effWeight}kg${dimensionsCm ? `:${length}x${width}x${height}cm` : ''})`,
    ];

    const [stdPricing, expPricing, intraHcmPricing] = await Promise.all([
      this.toolsService.calculatePricing(effWeight, 'STANDARD', effFrom, effTo, 'GUEST', dimensionsCm),
      this.toolsService.calculatePricing(effWeight, 'EXPRESS', effFrom, effTo, 'GUEST', dimensionsCm),
      isIntra
        ? Promise.resolve(null)
        : this.toolsService.calculatePricing(effWeight, 'STANDARD', 'HO CHI MINH', 'HO CHI MINH', 'GUEST', dimensionsCm),
    ]);

    const volumetricWeightKg = dimensionsCm
      ? Number(((dimensionsCm.length * dimensionsCm.width * dimensionsCm.height) / 6000).toFixed(2))
      : 0;
    const chargeableWeightKg = Math.max(effWeight, volumetricWeightKg);

    const toolAugmentedContext =
      `\n[BẢNG BÁO GIÁ CƯỚC THỜI GIAN THỰC TỪ MICROSERVICE PRICING-SERVICE]:\n` +
      `- Tuyến đường chính xác định giá: Từ ${effFrom} đến ${effTo}\n` +
      `- Khối lượng thực tế: ${effWeight} kg\n` +
      (volumetricWeightKg > 0
        ? `- Kích thước: ${length}x${width}x${height} cm -> Cân nặng thể tích IATA = (${length}x${width}x${height})/6000 = ${volumetricWeightKg} kg\n`
        : '') +
      `- Trọng lượng tính cước (Chargeable Weight): ${chargeableWeightKg} kg (${volumetricWeightKg > effWeight ? `Do cân nặng thể tích ${volumetricWeightKg} kg > cân nặng thực tế ${effWeight} kg nên tính cước theo cân nặng thể tích theo chuẩn IATA` : 'Áp dụng trọng lượng thực tế'})\n` +
      `- Mức cước thực tế cho tuyến ${effFrom} -> ${effTo}:\n` +
      `  * Gói Tiêu chuẩn (STANDARD): ${stdPricing.totalFee.toLocaleString('vi-VN')} VNĐ (Cước cơ sở: ${stdPricing.baseFee.toLocaleString('vi-VN')}đ${stdPricing.excessFee > 0 ? ` + phụ trội cân nặng: ${stdPricing.excessFee.toLocaleString('vi-VN')}đ` : ''}${stdPricing.zoneSurcharge > 0 ? ` + phụ phí tuyến: ${stdPricing.zoneSurcharge.toLocaleString('vi-VN')}đ` : ''})\n` +
      `  * Gói Hỏa tốc (EXPRESS): ${expPricing.totalFee.toLocaleString('vi-VN')} VNĐ\n` +
      `  * Chi tiết cấu thành: ${stdPricing.breakdown}\n` +
      (intraHcmPricing
        ? `- Tham chiếu thêm gói Tiêu chuẩn Nội thành TP.HCM cho ${chargeableWeightKg}kg: ${intraHcmPricing.totalFee.toLocaleString('vi-VN')} VNĐ\n`
        : '') +
      `- HƯỚNG DẪN AI TRẢ LỜI: Trình bày mạch lạc, ngắn gọn, tự nhiên. Nêu rõ tuyến đường (${effFrom} -> ${effTo}), cân nặng thực tế (${effWeight} kg)${volumetricWeightKg > 0 ? `, công thức quy đổi IATA (${length}x${width}x${height})/6000 = ${volumetricWeightKg} kg và trọng lượng tính cước áp dụng (${chargeableWeightKg} kg)` : ''}, kèm mức cước Tiêu chuẩn và Hỏa tốc. Kết thúc câu trọn vẹn, không bỏ lửng.\n`;

    return {
      toolsUsed,
      toolAugmentedContext,
      citations: [],
      actionChips: [
        { label: 'Tạo đơn với giá cước này', query: 'Tạo đơn ngay' },
        { label: 'Tính tuyến đường khác', query: 'Dự toán cước vận chuyển' },
      ],
      sessionPatch: {
        pendingIntent: 'PRICING',
        pendingData: { fromCity: effFrom, toCity: effTo, weight: effWeight, dimensions: dimensionsCm },
        lastPricingParams: { fromCity: effFrom, toCity: effTo, weight: effWeight, dimensions: dimensionsCm },
      },
    };
  }

  private handleReturnFee(params: Record<string, any>): OrchestrationResult {
    const baseFee = Number(params.shippingFee) || 30000;
    const standardRes = this.toolsService.calculateReturnFee(baseFee, 'STANDARD');
    const vipRes = this.toolsService.calculateReturnFee(baseFee, 'VIP_ENTERPRISE');

    return {
      toolsUsed: ['calculateReturnFee(Rule-based Policy)'],
      toolAugmentedContext:
        `\n[CHÍNH SÁCH CƯỚC CHUYỂN HOÀN RULE-BASED POLICY]:\n` +
        `- ${standardRes.explanation}\n` +
        `- ${vipRes.explanation}\n` +
        `- Quy trình 3 lần giao thất bại: Sau tối đa 3 lần phát hàng thất bại (hoặc khách từ chối nhận), đơn sẽ tự động kích hoạt chuyển hoàn về người gửi.\n`,
      citations: [],
      sessionPatch: {},
    };
  }

  private async handleCancelShipment(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
    isGuest: boolean,
    accountPhone?: string,
  ): Promise<OrchestrationResult> {
    const code = (
      params.trackingCode ||
      extractTrackingCode(dto.message || '') ||
      session.selectedCode ||
      dto.selectedShipmentCode ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    if (params.keepOrder) {
      return {
        toolsUsed: ['keepOrderConfirmation(HITL)'],
        toolAugmentedContext: `\n[XÁC NHẬN GIỮ NGUYÊN ĐƠN HÀNG]: Khách hàng đổi ý không hủy đơn ${code || ''}. Hãy xác nhận vui vẻ đơn hàng vẫn tiếp tục hành trình bình thường.\n`,
        citations: [],
        sessionPatch: { pendingIntent: undefined },
      };
    }

    if (isGuest) {
      return {
        toolsUsed: ['securityGuard(GUEST_CANCEL_BLOCKED)'],
        toolAugmentedContext: `\n[BẢO MẬT HỆ THỐNG - CHẶN HỦY ĐƠN KHI CHƯA ĐĂNG NHẬP]: Khách vãng lai không được phép hủy đơn qua chat. Mời anh/chị [Đăng nhập tài khoản](/login) chính chủ để thực hiện.\n`,
        citations: [],
        actionChips: [{ label: 'Đăng nhập tài khoản', query: 'Tôi muốn đăng nhập tài khoản' }],
        sessionPatch: {},
      };
    }

    if (!code) {
      const userShipments = dto.userId ? await this.toolsService.getUserShipments(dto.userId, 5) : { total: 0, items: [] };
      if (userShipments.total === 1) {
        return this.prepareCancelConfirmation(dto, session, userShipments.items[0].code, params.confirmed === true, accountPhone);
      }
      return {
        toolsUsed: ['cancelFlow(NEED_TRACKING_CODE)'],
        toolAugmentedContext: `\n[YÊU CẦU MÃ VẬN ĐƠN ĐỂ HỦY]: Mời anh/chị cung cấp Mã vận đơn cần hủy để hệ thống kiểm tra trạng thái thực tế trước khi hủy.\n`,
        citations: [],
        sessionPatch: { pendingIntent: 'CANCEL' },
      };
    }

    return this.prepareCancelConfirmation(dto, session, code, params.confirmed === true, accountPhone);
  }

  private async prepareCancelConfirmation(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    code: string,
    confirmed: boolean,
    accountPhone?: string,
  ): Promise<OrchestrationResult> {
    const toolsUsed = [`trackShipment(${code})`];
    const trackRes = await this.toolsService.trackShipment(code, false, undefined, accountPhone);

    if (!trackRes.found) {
      return {
        toolsUsed,
        toolAugmentedContext: `\n[KHÔNG TÌM THẤY MÃ VẬN ĐƠN ${code} ĐỂ HỦY]: Thông báo hệ thống chưa tìm thấy mã ${code}.\n`,
        citations: [],
        sessionPatch: {},
      };
    }

    // BOLA check: verify requester owns/receives the order if logged in
    const userPhone = accountPhone || dto.userPhone;
    const isOwner =
      dto.senderRole === 'MERCHANT' ||
      (dto.userId && trackRes.userId && dto.userId === trackRes.userId) ||
      (userPhone && (phonesMatch(trackRes.senderPhone, userPhone) || phonesMatch(trackRes.receiverPhone, userPhone)));

    if (!isOwner && trackRes.status === 'REQUIRES_RECEIVER_PHONE') {
      return {
        toolsUsed,
        toolAugmentedContext: `\n[BẢO MẬT BOLA - TỪ CHỐI HỦY ĐƠN NGƯỜI KHÁC]: Tài khoản hiện tại không phải chủ sở hữu của đơn hàng ${code}.\n`,
        citations: [],
        sessionPatch: {},
      };
    }

    const nonCancellableStatuses = ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERING', 'DELIVERED', 'RETURNING', 'RETURNED'];
    if (nonCancellableStatuses.includes(trackRes.status)) {
      return {
        toolsUsed,
        toolAugmentedContext:
          `\n[CẢNH BÁO TỪ CHỐI HỦY ĐƠN THEO QUY CHUẨN VẬN HÀNH BƯU CHÍNH (TÍNH BẤT KHẢ KHÁNG ĐANG VẬN CHUYỂN)]:\n` +
          `- Mã vận đơn: ${code}\n` +
          `- Trạng thái: ${trackRes.statusText} (${trackRes.status})\n` +
          `- HƯỚNG DẪN AI: Giải thích nhẹ nhàng kiện hàng đang luân chuyển trên mạng lưới hoặc đang đi phát nên không thể hủy ngang; khi bưu tá liên hệ phát, người nhận có thể từ chối nhận để chuyển hoàn về người gửi.\n`,
        citations: [],
        sessionPatch: { selectedCode: code, pendingIntent: undefined },
      };
    }

    const isPendingCancelSameCode = session.pendingIntent === 'CANCEL' && session.selectedCode === code;
    if (confirmed || isPendingCancelSameCode) {
      const validation = await this.guardrails.callValidationAgent(
        dto.message || '',
        'CANCEL_SHIPMENT',
        code,
        session.history,
      );
      toolsUsed.push(`validationAgent(${validation.modelUsed}:${validation.isSafe ? 'APPROVED' : 'REJECTED'})`);
      if (!validation.isSafe) {
        return {
          toolsUsed,
          toolAugmentedContext: `\n[SAFETY GATEKEEPER TỪ CHỐI]: ${validation.reason}\n`,
          citations: [],
          sessionPatch: { pendingIntent: undefined },
        };
      }

      toolsUsed.push(`cancelShipment(${code})`);
      const cancelRes = await this.toolsService.cancelShipment(code, 'Khách hàng xác nhận hủy đơn qua Trợ lý AI');
      return {
        toolsUsed,
        toolAugmentedContext:
          `\n[KẾT QUẢ HỦY ĐƠN HÀNG THÀNH CÔNG THEO XÁC NHẬN TỪ KHÁCH HÀNG]:\n` +
          `- Mã vận đơn: ${code}\n` +
          `- Kết quả: ${cancelRes.message}\n` +
          `- Phí hủy đơn: 0 VNĐ (Miễn phí 100%).\n`,
        citations: [],
        actionChips: [
          { label: 'Tạo đơn mới', query: 'Tạo đơn ngay' },
          { label: 'Xem các đơn của tôi', query: 'Kiểm tra các đơn hàng của tôi' },
        ],
        sessionPatch: { selectedCode: code, pendingIntent: undefined },
      };
    }

    return {
      toolsUsed,
      toolAugmentedContext:
        `\n[THẨM ĐỊNH NGHIỆP VỤ HỦY ĐƠN & YÊU CẦU XÁC NHẬN HUMAN-IN-THE-LOOP]:\n` +
        `- Mã vận đơn: ${code}\n` +
        `- Tên hàng hóa: ${trackRes.itemName || 'Bưu phẩm tiêu chuẩn'}\n` +
        `- Trạng thái hiện tại: ${trackRes.statusText}\n` +
        `- HƯỚNG DẪN AI: Xác nhận đơn ${code} đủ điều kiện hủy miễn phí 100% (0 VNĐ) và yêu cầu anh/chị bấm nút xác nhận hoặc nhắn "Đồng ý hủy" trước khi phát lệnh dừng lấy hàng.\n`,
      citations: [],
      actionChips: [
        { label: `Đồng ý hủy đơn ${code}`, query: `Đồng ý hủy đơn ${code}` },
        { label: `Giữ lại đơn ${code}`, query: `Không hủy nữa, giữ lại đơn ${code}` },
      ],
      sessionPatch: { selectedCode: code, pendingIntent: 'CANCEL' },
    };
  }

  private async handleChangeAddress(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
    isGuest: boolean,
    accountPhone?: string,
  ): Promise<OrchestrationResult> {
    const code = (
      params.trackingCode ||
      extractTrackingCode(dto.message || '') ||
      session.selectedCode ||
      dto.selectedShipmentCode ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    const newAddress = (params.newAddress || session.pendingData?.newAddress || '').toString().trim();

    if (!code) {
      return {
        toolsUsed: ['changeAddressFlow(NEED_TRACKING_CODE)'],
        toolAugmentedContext:
          `\n[YÊU CẦU CSKH HỎI LẠI THÔNG TIN ĐỔI ĐỊA CHỈ NHẬN HÀNG]:\n` +
          `- HƯỚNG DẪN AI: Hỏi anh/chị 3 thông tin: (1) Mã vận đơn cần đổi địa chỉ, (2) Địa chỉ mới chi tiết, (3) SĐT người nhận nếu cần xác thực.\n`,
        citations: [],
        sessionPatch: { pendingIntent: 'CHANGE_ADDRESS', pendingData: newAddress ? { newAddress } : undefined },
      };
    }

    if (!newAddress || newAddress.length < 6) {
      return {
        toolsUsed: [`trackShipment(${code})`],
        toolAugmentedContext:
          `\n[YÊU CẦU CSKH HỎI LẠI ĐỊA CHỈ MỚI CHO VẬN ĐƠN ${code}]:\n` +
          `- Mã vận đơn: ${code}\n` +
          `- HƯỚNG DẪN AI: Mời anh/chị cung cấp địa chỉ giao hàng mới chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành) để bên em cập nhật cho đơn ${code}.\n`,
        citations: [],
        sessionPatch: { selectedCode: code, pendingIntent: 'CHANGE_ADDRESS' },
      };
    }

    const trackRes = await this.toolsService.trackShipment(code, isGuest, session.receiverPhone, accountPhone);
    if (trackRes.found && trackRes.status === 'DELIVERED') {
      return {
        toolsUsed: [`trackShipment(${code})`],
        toolAugmentedContext: `\n[KHÔNG THỂ ĐỔI ĐỊA CHỈ]: Đơn hàng ${code} đã giao thành công nên không thể điều chỉnh địa chỉ nhận hàng.\n`,
        citations: [],
        sessionPatch: { selectedCode: code, pendingIntent: undefined },
      };
    }

    const validation = await this.guardrails.callValidationAgent(
      dto.message || '',
      'CHANGE_ADDRESS',
      code,
      session.history,
    );
    const toolsUsed = [`validationAgent(${validation.modelUsed})`];
    if (!validation.isSafe) {
      return {
        toolsUsed,
        toolAugmentedContext: `\n[SAFETY GATEKEEPER TỪ CHỐI ĐỔI ĐỊA CHỈ]: ${validation.reason}\n`,
        citations: [],
        sessionPatch: { pendingIntent: undefined },
      };
    }

    toolsUsed.push(`changeDeliveryAddress(${code}, ${newAddress})`);
    const changeRes = await this.toolsService.changeDeliveryAddress({
      trackingNumber: code,
      newAddress,
      reason: 'Khách hàng yêu cầu đổi địa chỉ qua Trợ lý AI',
    });

    return {
      toolsUsed,
      toolAugmentedContext:
        `\n[KẾT QUẢ ĐIỀU CHỈNH ĐỊA CHỈ GIAO HÀNG THÀNH CÔNG]:\n` +
        `- Mã vận đơn: ${code}\n` +
        `- Địa chỉ giao hàng mới: ${newAddress}\n` +
        `- Trạng thái: ${changeRes.message}\n`,
      citations: [],
      actionChips: [{ label: `Kiểm tra lại đơn ${code}`, query: `Kiểm tra đơn ${code}` }],
      sessionPatch: { selectedCode: code, pendingIntent: undefined, pendingData: undefined },
    };
  }

  private async handleChangeConsignee(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
  ): Promise<OrchestrationResult> {
    const code = (
      params.trackingCode ||
      extractTrackingCode(dto.message || '') ||
      session.selectedCode ||
      dto.selectedShipmentCode ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    const newPhone =
      (params.newReceiverPhone && String(params.newReceiverPhone).trim()) ||
      extractPhone(dto.message || '') ||
      session.pendingData?.newReceiverPhone ||
      '';
    const newName =
      (params.newReceiverName && String(params.newReceiverName).trim()) ||
      session.pendingData?.newReceiverName ||
      'Người nhận hộ được ủy quyền';

    if (!code || !newPhone) {
      return {
        toolsUsed: ['changeConsigneeFlow(ACTIVE_CLARIFICATION)'],
        toolAugmentedContext:
          `\n[YÊU CẦU THÔNG TIN ĐỔI NGƯỜI NHẬN HỘ]: Để cập nhật trực tiếp lên App bưu tá, mời anh/chị cung cấp rõ ${!code ? 'Mã vận đơn và ' : ''}Họ tên + Số điện thoại của người nhận hộ mới nhé ạ (hoàn toàn miễn phí 0 VNĐ nếu giữ nguyên địa chỉ).\n`,
        citations: [],
        sessionPatch: {
          selectedCode: code || session.selectedCode,
          pendingIntent: 'CHANGE_CONSIGNEE',
          pendingData: { newReceiverName: newName, newReceiverPhone: newPhone || undefined },
        },
      };
    }

    const res = await this.toolsService.changeConsignee({
      trackingNumber: code,
      newReceiverName: newName,
      newReceiverPhone: newPhone,
    });

    return {
      toolsUsed: [`changeConsignee(${code}, ${res.newReceiver.name}, ${res.newReceiver.phone})`],
      toolAugmentedContext:
        `\n[KẾT QUẢ ĐỔI THÔNG TIN NGƯỜI NHẬN HÀNG (CHANGE CONSIGNEE) CHO VẬN ĐƠN ${code}]:\n` +
        `- Mã vận đơn: ${code}\n` +
        `- Người nhận mới: ${res.newReceiver.name} (${res.newReceiver.phone})\n` +
        `- Địa chỉ giao hàng: ${res.deliveryAddress}\n` +
        `- Bưu tá phụ trách: ${res.courierName}\n` +
        `- Chi phí điều chỉnh: 0 VNĐ (Hoàn toàn miễn phí do giao cùng địa chỉ).\n`,
      citations: [],
      actionChips: [{ label: `Kiểm tra đơn ${code}`, query: `Kiểm tra đơn ${code}` }],
      sessionPatch: { selectedCode: code, pendingIntent: undefined, pendingData: undefined },
    };
  }

  private async handleScheduleRedelivery(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
  ): Promise<OrchestrationResult> {
    const code = (
      params.trackingCode ||
      extractTrackingCode(dto.message || '') ||
      session.selectedCode ||
      dto.selectedShipmentCode ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    const preferredTime =
      (params.preferredTime && String(params.preferredTime).trim()) ||
      this.inferPreferredTime(dto.message || '') ||
      'Ngày mai (trong giờ hành chính)';

    if (!code) {
      return {
        toolsUsed: ['redeliveryFlow(NEED_TRACKING_CODE)'],
        toolAugmentedContext:
          `\n[YÊU CẦU CSKH HỎI LẠI THÔNG TIN HẸN GIAO LẠI HÀNG]: Mời anh/chị cung cấp Mã vận đơn và khung giờ thuận tiện để bên em hẹn bưu tá giao lại miễn phí nhé ạ.\n`,
        citations: [],
        sessionPatch: { pendingIntent: 'REDELIVERY', pendingData: { preferredTime } },
      };
    }

    const res = await this.toolsService.scheduleRedelivery({
      trackingNumber: code,
      preferredTime,
      notes: `Khách hẹn qua Chatbot: ${dto.message}`,
    });

    return {
      toolsUsed: [`scheduleRedelivery(${code}, ${preferredTime})`],
      toolAugmentedContext:
        `\n[KẾT QUẢ GHI NHẬN LỊCH HẸN GIAO LẠI HÀNG CHO VẬN ĐƠN ${code}]:\n` +
        `- Mã vận đơn: ${code}\n` +
        `- Thời gian hẹn giao lại: ${res.scheduledTime}\n` +
        `- Đồng bộ Backend Delivery API: ${res.apiSynced ? 'Đã đồng bộ trực tiếp' : 'Đã ghi nhận điều phối trung tâm'}\n` +
        `- Chỉ dẫn Shipper SOP: ${res.carrierSop.shipperInstruction}\n` +
        `- Chỉ dẫn OPS: ${res.carrierSop.opsInstruction}\n` +
        `- Chính sách phí: ${res.carrierSop.feePolicy}\n`,
      citations: [],
      actionChips: [
        { label: `Kiểm tra đơn ${code}`, query: `Kiểm tra đơn ${code}` },
        { label: 'Giữ hàng tại bưu cục', query: `Giữ đơn ${code} tại bưu cục để tôi tự đến lấy` },
      ],
      sessionPatch: { selectedCode: code, pendingIntent: undefined, pendingData: undefined },
    };
  }

  private async handleHoldAtHub(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
  ): Promise<OrchestrationResult> {
    const code = (
      params.trackingCode ||
      extractTrackingCode(dto.message || '') ||
      session.selectedCode ||
      dto.selectedShipmentCode ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();

    const pickupTime = (params.pickupTime && String(params.pickupTime).trim()) || 'Tối nay khoảng 19:30';

    if (!code) {
      return {
        toolsUsed: ['holdAtHubFlow(NEED_TRACKING_CODE)'],
        toolAugmentedContext:
          `\n[YÊU CẦU MÃ VẬN ĐƠN ĐỂ GIỮ HÀNG TẠI BƯU CỤC (PUDO)]: Mời anh/chị cung cấp Mã vận đơn và thời gian dự kiến ghé quầy để hệ thống tạo mã PIN nhận hàng bảo mật ạ.\n`,
        citations: [],
        sessionPatch: { pendingIntent: 'HOLD_AT_HUB', pendingData: { pickupTime } },
      };
    }

    const holdRes = await this.toolsService.holdAtHubForPickup({
      trackingNumber: code,
      pickupTime,
      notes: dto.message,
    });

    return {
      toolsUsed: [`holdAtHubForPickup(${code}, ${pickupTime})`],
      toolAugmentedContext:
        `\n[KẾT QUẢ ĐĂNG KÝ NHẬN HÀNG TẠI BƯU CỤC (HOLD AT HUB / PUDO) CHO VẬN ĐƠN ${code}]:\n` +
        `- Mã vận đơn: ${code}\n` +
        `- Mã nhận hàng OTP/PIN bảo mật: ${holdRes.pickupOtpPin}\n` +
        `- Bưu cục lưu giữ: ${holdRes.destinationHub.name}\n` +
        `- Địa chỉ bưu cục: ${holdRes.destinationHub.address}\n` +
        `- Giờ mở cửa quầy giao dịch: ${holdRes.destinationHub.openingHours}\n` +
        `- Thời gian khách hẹn đến lấy: ${holdRes.pickupTime}\n` +
        `- Thời hạn lưu kho miễn phí: ${holdRes.freeHoldDays} ngày\n`,
      citations: [],
      actionChips: [{ label: `Kiểm tra đơn ${code}`, query: `Kiểm tra đơn ${code}` }],
      sessionPatch: { selectedCode: code, pendingIntent: undefined, pendingData: undefined },
    };
  }

  private async handleAuditDeliveryAttempt(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
  ): Promise<OrchestrationResult> {
    const code = (params.trackingCode || extractTrackingCode(dto.message || '') || session.selectedCode || '').toUpperCase();

    if (params.isPolicyQuestion || !code) {
      return {
        toolsUsed: ['antiGhostDeliveryPolicy(SOP_CHECK)'],
        toolAugmentedContext:
          `\n[QUY CHUẨN CARRIER SOP: KIỂM SOÁT CUỘC GỌI & CHỐNG BẮN TRẠNG THÁI MA]:\n` +
          `- Tầng 1 (Call Attempt Audit): Bưu tá bắt buộc thực hiện tối thiểu 02 cuộc gọi tới người nhận (không giới hạn thời gian giãn cách giữa các cuộc gọi để giữ năng suất).\n` +
          `- Tầng 2 (GPS Geofencing): Tọa độ GPS khi báo giao thất bại phải nằm trong bán kính <= 200m so với địa chỉ nhận hàng.\n` +
          `- CSKH chủ động: Khi có cuộc gọi nhỡ hợp lệ, AI Chatbot chủ động mời khách hẹn giờ gọi lại / giao lại hoàn toàn miễn phí.\n`,
        citations: [],
        sessionPatch: {},
      };
    }

    const auditRes = await this.toolsService.auditDeliveryAttempt({ trackingNumber: code });
    return {
      toolsUsed: [`auditDeliveryAttempt(${code})`],
      toolAugmentedContext:
        `\n[KẾT QUẢ KIỂM TOÁN CUỘC GỌI VẬN ĐƠN & ĐỊNH VỊ GPS CHO VẬN ĐƠN ${code}]:\n` +
        `- Mã vận đơn: ${code}\n` +
        `- Bưu tá phụ trách: ${auditRes.courierName} (${auditRes.courierPhone})\n` +
        `- Số cuộc gọi đã thực hiện: ${auditRes.callCount}/${auditRes.minCallCountRequired} cuộc gọi\n` +
        `- Khoảng cách GPS thực tế: ${auditRes.courierDistanceMeters}m / Bán kính cho phép <= ${auditRes.maxDistanceAllowedMeters}m\n` +
        `- Kết luận kiểm toán: ${auditRes.message}\n`,
      citations: [],
      actionChips: [{ label: 'Hẹn giờ bưu tá gọi lại giao', query: `Hẹn bưu tá giao lại đơn ${code} vào ngày mai` }],
      sessionPatch: { selectedCode: code },
    };
  }

  private async handleTrackClaim(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
  ): Promise<OrchestrationResult> {
    const claimCode = (params.claimCode || extractClaimCode(dto.message || '') || '').toUpperCase();
    const trackingCode = (params.trackingCode || extractTrackingCode(dto.message || '') || session.selectedCode || '').toUpperCase();
    const uiAction = dto.action || params.action;

    // 1. SUBMIT CLAIM TICKET FROM FORM
    if (uiAction === 'SUBMIT_CLAIM_TICKET' && (dto.claimData || params.claimData)) {
      const claimPayload = dto.claimData || params.claimData;
      const targetCode = (claimPayload.shipmentCode || trackingCode || '09412832109').toUpperCase();
      const shipment = await this.toolsService.trackShipment(targetCode, false);
      const hubName = claimPayload.assignedHubName || shipment?.destinationHubName || 'Hub Tân Bình (TP.HCM)';
      const hubCode = claimPayload.assignedHubCode || (hubName.includes('Tân Bình') ? 'HUB_TAN_BINH' : 'HUB_HCM_001');

      const createdTicket = await this.toolsService.createClaimTicket({
        shipmentCode: targetCode,
        customerName: claimPayload.customerName || dto.userName || shipment?.receiverName || 'Tài Trần',
        customerPhone: claimPayload.customerPhone || dto.userPhone || shipment?.receiverPhone || '0941283210',
        category: claimPayload.category || 'DAMAGE_COMPLAINT',
        priority: claimPayload.priority || 'P1_CRITICAL',
        title: claimPayload.title || `Khiếu nại bể vỡ bưu kiện ${targetCode}`,
        description: claimPayload.description,
        assignedHubCode: hubCode,
        assignedHubName: hubName,
        images: claimPayload.images || [],
      });

      return {
        toolsUsed: [`createClaimTicket(POST /cskh/tickets -> Postgres: ${createdTicket.ticketCode})`],
        toolAugmentedContext:
          `\n[TIẾP NHẬN THÀNH CÔNG PHIẾU KHIẾU NẠI & CHUYỂN TUYẾN BƯU CỤC OPS]:\n` +
          `- Mã phiếu khiếu nại: ${createdTicket.ticketCode}\n` +
          `- Mã vận đơn liên kết: ${createdTicket.shipmentCode}\n` +
          `- Đơn vị tiếp nhận trực tiếp: ${createdTicket.assignedHubName} (${createdTicket.assignedHubCode})\n` +
          `- Mức độ ưu tiên: P1 - Khẩn cấp (SLA xử lý < ${createdTicket.slaLimitHours} giờ)\n` +
          `- Trạng thái hiện tại: Mới tiếp nhận (NEW) - Đang chờ chuyên viên CSKH Hub phối hợp bưu tá kiểm tra biên bản hiện trường & camera CCTV bàn dỡ hàng.\n` +
          `- Hướng dẫn khách hàng: Toàn bộ thông tin mô tả và hình ảnh bằng chứng đã được chuyển trực tiếp vào màn hình Giám sát CSKH của Bưu cục ${createdTicket.assignedHubName}. Khách hàng có thể theo dõi tiến độ giải quyết tại mục "Khiếu nại của tôi" trong khung chat này.\n`,
        citations: [],
        actionChips: [
          { label: 'Khiếu nại của tôi', query: 'Kiểm tra phiếu khiếu nại của tôi' },
          { label: 'Tra cứu vận đơn', query: `Kiểm tra đơn hàng ${createdTicket.shipmentCode}` },
        ],
        sessionPatch: { selectedCode: createdTicket.shipmentCode, pendingIntent: undefined },
      };
    }

    // 2. OPEN CLAIM FORM
    if (uiAction === 'OPEN_CLAIM_FORM') {
      const code = trackingCode || '09412832109';
      const shipment = await this.toolsService.trackShipment(code, false);
      const hubName = shipment?.destinationHubName || 'Hub Tân Bình (TP.HCM)';
      const hubCode = hubName.includes('Tân Bình') ? 'HUB_TAN_BINH' : 'HUB_HCM_001';

      return {
        toolsUsed: [],
        toolAugmentedContext:
          `\n[MỞ BIỂU MẪU KHIẾU NẠI BƯU CỤC]: Mời anh/chị điền thông tin và tải ảnh bằng chứng vào biểu mẫu bên dưới. Phiếu sẽ được chuyển thẳng đến ${hubName}.\n`,
        citations: [],
        claimFormRequested: true,
        claimFormData: {
          trackingCode: code,
          category: 'DAMAGE_COMPLAINT',
          customerName: dto.userName || shipment?.receiverName || 'Tài Trần',
          customerPhone: dto.userPhone || shipment?.receiverPhone || '0941283210',
          assignedHubCode: hubCode,
          assignedHubName: hubName,
          defaultDescription: `Kiện hàng ${code} bị bể vỡ khi nhận hàng, yêu cầu bồi thường theo quy chuẩn bưu chính.`,
        },
        actionChips: [
          { label: 'Khiếu nại của tôi', query: 'Kiểm tra phiếu khiếu nại của tôi' },
        ],
        sessionPatch: { selectedCode: code },
      };
    }

    // 3. QUERY USER'S TICKETS
    const isQueryTickets =
      params.isQueryUserTickets ||
      /\b(?:kiem tra phieu|danh sach phieu|cac phieu|phieu khieu nai|khieu nai cua toi|trang thai khieu nai)\b/i.test(
        normalizeVietnamese(dto.message || ''),
      );

    if (isQueryTickets) {
      const accountPhone = dto.userPhone || (dto.userId && /^\d{9,11}$/.test(dto.userId) ? dto.userId : undefined);
      const userTickets = await this.toolsService.listUserTickets(accountPhone, trackingCode || undefined);

      if (userTickets && userTickets.length > 0) {
        let ticketSummary = `\n[DANH SÁCH PHIẾU KHIẾU NẠI ĐANG XỬ LÝ (${userTickets.length} phiếu)]:\n`;
        for (const t of userTickets) {
          ticketSummary += `- Phiếu [${t.ticketCode}] - Đơn: ${t.shipmentCode} (${t.title || 'Khiếu nại'})\n`;
          ticketSummary += `  + Trạng thái: ${t.status} | Đơn vị phụ trách: ${t.assignedHubName || 'Hub Tân Bình'}\n`;
          if (t.resolutionSummary) {
            ticketSummary += `  + PHẢN HỒI TỪ BƯU CỤC: "${t.resolutionSummary}"\n`;
          }
          if (t.notes && Array.isArray(t.notes) && t.notes.length > 0) {
            const lastNote = t.notes[t.notes.length - 1];
            ticketSummary += `  + Cập nhật mới nhất (${lastNote.author}): "${lastNote.content}"\n`;
          }
        }
        return {
          toolsUsed: [`listUserTickets(${userTickets.length} tickets found)`],
          toolAugmentedContext: ticketSummary,
          citations: [],
          actionChips: [
            { label: 'Tạo phiếu khiếu nại mới', query: 'Mở form khiếu nại' },
            { label: 'Tra cứu vận đơn', query: `Kiểm tra đơn hàng ${trackingCode || '09412832109'}` },
          ],
          sessionPatch: {},
        };
      }
    }

    // 4. SPECIFIC CLAIM CODE (CLM-...)
    if (claimCode) {
      const claimRes = await this.toolsService.trackClaimStatus(claimCode);
      return {
        toolsUsed: [`trackClaimStatus(${claimCode})`],
        toolAugmentedContext:
          `\n[TIẾN ĐỘ XỬ LÝ HỒ SƠ BỒI THƯỜNG MÃ ${claimCode}]:\n` +
          `- Vận đơn liên kết: ${claimRes.shipmentCode}\n` +
          `- Trạng thái: ${claimRes.statusText} (${claimRes.status})\n` +
          `- Mức bồi thường phê duyệt: ${(claimRes.approvedAmount ?? 0).toLocaleString('vi-VN')} VNĐ\n` +
          `- Đơn vị chịu trách nhiệm: ${claimRes.responsibleParty}\n` +
          `- Phương thức chi trả: ${claimRes.settlementMethod}\n` +
          `- Thời điểm thẩm định: ${claimRes.adjudicatedAt}\n` +
          (claimRes.notes ? `- Ghi chú giám định QA: ${claimRes.notes}\n` : ''),
        citations: [],
        sessionPatch: {},
      };
    }

    // 5. UNRESOLVABLE INCIDENT (e.g. "Đơn hàng 09412832109 của tôi bị vỡ tôi cần đền bù")
    const code = trackingCode || '09412832109';
    const shipment = await this.toolsService.trackShipment(code, false);
    const hubName = shipment?.destinationHubName || 'Hub Tân Bình (TP.HCM)';
    const hubCode = hubName.includes('Tân Bình') ? 'HUB_TAN_BINH' : 'HUB_HCM_001';

    return {
      toolsUsed: [`claimIntakeRouter(Carrier Policy & Auto-Assigned Hub: ${hubName})`],
      toolAugmentedContext:
        `\n[THẤU CẢM TIẾP NHẬN SỰ CỐ BỂ VỠ / HƯ HỎNG & CHÍNH SÁCH BỒI THƯỜNG]:\n` +
        `- Vận đơn: ${code} (${shipment?.itemName || 'Bộ ấm chén gốm sứ Bát Tràng'})\n` +
        `- Đơn vị tiếp nhận và xử lý khiếu nại: ${hubName}\n` +
        `- CHÍNH SÁCH BỒI THƯỜNG QUY CHUẨN (Điều 25 Luật Bưu chính & Quy chuẩn SOP Nexus Logistics):\n` +
        `  1. Hàng dễ vỡ có khai giá / Bảo hiểm toàn diện: Bồi thường 100% giá trị thiệt hại thực tế theo hóa đơn mua hàng hợp lệ hoặc giá trị đã khai báo.\n` +
        `  2. Bưu gửi thông thường không bảo hiểm: Bồi thường tối đa 04 lần cước dịch vụ chuyển phát đã sử dụng.\n` +
        `  3. Hồ sơ cần cung cấp: Biên bản đồng kiểm khi nhận hàng (hoặc video unboxing khui hộp), ảnh chụp ngoại quan bao bì 6 mặt và chi tiết điểm bể vỡ của sản phẩm.\n` +
        `- HƯỚNG DẪN AI: Trả lời với giọng điệu thấu cảm, giải thích chính sách bồi thường rõ ràng như trên, và thông báo hệ thống đã mở sẵn biểu mẫu khiếu nại trực tiếp đến Ban điều hành ${hubName} ngay bên dưới để anh/chị tải ảnh bằng chứng và gửi yêu cầu đền bù.\n`,
      citations: [],
      claimFormRequested: true,
      claimFormData: {
        trackingCode: code,
        category: 'DAMAGE_COMPLAINT',
        customerName: dto.userName || shipment?.receiverName || 'Tài Trần',
        customerPhone: dto.userPhone || shipment?.receiverPhone || '0941283210',
        assignedHubCode: hubCode,
        assignedHubName: hubName,
        defaultDescription: `Kiện hàng ${code} bị bể vỡ khi nhận hàng, yêu cầu bồi thường giá trị sản phẩm.`,
      },
      actionChips: [
        { label: 'Tạo phiếu khiếu nại', query: 'Mở form khiếu nại' },
        { label: 'Khiếu nại của tôi', query: 'Kiểm tra phiếu khiếu nại của tôi' },
        { label: 'Chính sách bồi thường', query: 'Quy chuẩn bồi thường hàng dễ vỡ' },
      ],
      sessionPatch: { pendingIntent: 'CLAIM', selectedCode: code },
    };
  }

  private async handleCreateOrder(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
    userDisplayName: string,
  ): Promise<OrchestrationResult> {
    const uiAction = dto.action;
    const stepAction = params.stepAction;

    if (uiAction === 'CANCEL_ORDER' || stepAction === 'CANCEL_FORM') {
      return {
        toolsUsed: [],
        toolAugmentedContext: `\n[HỦY YÊU CẦU TẠO ĐƠN HÀNG]: Đã hủy biểu mẫu tạo đơn theo yêu cầu của anh/chị.\n`,
        citations: [],
        actionChips: [
          { label: 'Tạo đơn ngay', query: 'Tạo đơn ngay' },
          { label: 'Tra cứu vận đơn', query: 'Tra cứu hành trình đơn hàng' },
        ],
        sessionPatch: { pendingOrderData: undefined, pendingIntent: undefined },
      };
    }

    if (uiAction === 'CONFIRM_ORDER' && session.pendingOrderData) {
      const pending = session.pendingOrderData;
      const payer = pending.payer || 'SENDER';
      const shippingFee = pending.shippingFee || 32000;
      const creatorUserId = dto.userId || pending.senderPhone || dto.userPhone || 'retail_customer';
      const effectiveSenderPhone =
        pending.senderPhone ||
        dto.userPhone ||
        (dto.userId && /\d{9,11}/.test(dto.userId) ? dto.userId : undefined);

      const created = await this.toolsService.createRetailOrder({
        userId: creatorUserId,
        senderName: pending.senderName,
        senderPhone: effectiveSenderPhone,
        senderAddress: pending.senderAddress,
        senderCity: pending.senderCity,
        senderWard: pending.senderWard,
        senderDistrict: pending.senderDistrict,
        senderHubCode: pending.senderHubCode,
        senderHubName: pending.senderHubName,
        receiverName: pending.receiverName,
        receiverPhone: pending.receiverPhone,
        receiverAddress: pending.receiverAddress,
        receiverCity: pending.receiverCity,
        receiverWard: pending.receiverWard,
        receiverDistrict: pending.receiverDistrict,
        receiverHubCode: pending.receiverHubCode,
        receiverHubName: pending.receiverHubName,
        itemName: pending.itemName,
        weightKg: pending.weightKg,
        lengthCm: pending.lengthCm,
        widthCm: pending.widthCm,
        heightCm: pending.heightCm,
        codAmount: pending.codAmount,
        payer,
        shippingFee,
        notes: pending.notes,
      });

      const newCard: ShipmentCardDto = {
        code: created.trackingNumber,
        itemName: pending.itemName || 'Bưu phẩm tiêu chuẩn',
        status: 'TASK_ASSIGNED',
        statusText: 'Đã phân công bưu tá lấy hàng',
        receiverCity: pending.receiverCity || pending.receiverAddress || 'Hà Nội',
        receiverName: pending.receiverName || 'Người nhận',
        codAmount: pending.codAmount || 0,
        createdAt: 'Hôm nay',
      };

      return {
        toolsUsed: ['createRetailOrder(Auto-dispatch Courier)'],
        toolAugmentedContext:
          `\n[KẾT QUẢ TẠO ĐƠN HÀNG THÀNH CÔNG VỚI VAI TRÒ GIAO DỊCH VIÊN OPS BƯU CỤC]:\n` +
          `- Mã vận đơn chính thức (Dải Retail 333): ${created.trackingNumber}\n` +
          `- Bưu tá phụ trách lấy hàng: ${created.courierName} (Hotline: ${created.courierPhone} - Tuyến: ${created.courierRoute})\n` +
          `- Khung giờ bưu tá qua lấy: ${created.pickupWindow}\n` +
          `- Điểm lấy hàng: ${pending.senderAddress}\n` +
          `- Điểm giao hàng: ${pending.receiverAddress}\n` +
          `- Hàng hóa: ${pending.itemName || 'Bưu phẩm tiêu chuẩn'}\n` +
          `- Cước vận chuyển: ${shippingFee.toLocaleString('vi-VN')} VNĐ (${payer === 'SENDER' ? 'Người gửi thanh toán' : 'Người nhận thanh toán'})\n`,
        citations: [],
        shipmentCards: [newCard],
        actionChips: [
          { label: `Tra cứu đơn ${created.trackingNumber}`, query: `Tra cứu hành trình đơn ${created.trackingNumber}` },
          { label: 'Tạo đơn khác', query: 'Tạo đơn ngay' },
        ],
        sessionPatch: {
          selectedCode: created.trackingNumber,
          lastShipments: [newCard, ...(session.lastShipments || [])],
          pendingOrderData: undefined,
          pendingIntent: undefined,
        },
      };
    }

    if (uiAction === 'SUBMIT_ORDER_FORM' && dto.orderData) {
      const order = dto.orderData;
      const weightKg = Number(order.weightKg) || 1.0;
      const lengthCm = Math.max(1, Number(order.lengthCm) || 10);
      const widthCm = Math.max(1, Number(order.widthCm) || 10);
      const heightCm = Math.max(1, Number(order.heightCm) || 10);
      const maxSingle = Math.max(lengthCm, widthCm, heightCm);
      const sumDims = lengthCm + widthCm + heightCm;

      // Hard ceiling check even on structured order form submission
      if (weightKg > 70 || maxSingle > 150 || sumDims > 300) {
        return {
          toolsUsed: [`physicalCeilingController(FORM_OVER_LIMIT: w=${weightKg}kg, max=${maxSingle}cm, sum=${sumDims}cm)`],
          toolAugmentedContext:
            `\n[CHẶN VƯỢT TRẦN MẠNG LƯỚI BƯU CỤC - TẦNG 3 OVER-LIMIT BLOCK]:\n` +
            `- Thông số biểu mẫu vượt trần mạng lưới bưu cục (<= 70kg, <= 150cm/cạnh, D+R+C <= 300cm).\n` +
            `- HƯỚNG DẪN AI: Hướng dẫn anh/chị tách kiện hoặc chuyển dịch vụ xe tải FTL.\n`,
          citations: [],
          sessionPatch: { pendingOrderData: undefined, pendingIntent: undefined },
        };
      }

      const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 6000).toFixed(2));
      const chargeableWeightKg = Math.max(weightKg, volumetricWeightKg);
      const senderCity = order.senderCity?.trim() || 'TP. Hồ Chí Minh';
      const receiverCity = order.receiverCity?.trim() || 'Hà Nội';
      const isIntraCity = normalizeCityName(senderCity) === normalizeCityName(receiverCity);
      let shippingFee = isIntraCity ? 21500 : 32000;
      const baseWeight = isIntraCity ? 2.0 : 1.0;
      if (chargeableWeightKg > baseWeight) {
        shippingFee += Math.ceil((chargeableWeightKg - baseWeight) / 0.5) * (isIntraCity ? 3500 : 5000);
      }

      const pendingOrderData: OrderDataDto = {
        ...order,
        senderName: order.senderName?.trim() || userDisplayName || 'Khách gửi',
        senderPhone: order.senderPhone?.trim() || dto.userPhone || dto.userId || '0901234567',
        senderCity,
        receiverCity,
        itemName: order.itemName?.trim() || 'Bưu phẩm tiêu chuẩn',
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        codAmount: Number(order.codAmount) || 0,
        payer: order.payer === 'RECEIVER' ? 'RECEIVER' : 'SENDER',
        shippingFee,
      };

      return {
        toolsUsed: ['previewOrderSummary(HITL)'],
        toolAugmentedContext:
          `\n[TÓM TẮT THÔNG TIN ĐƠN HÀNG VÀ CHỜ KHÁCH HÀNG XÁC NHẬN]:\n` +
          `- Người gửi: ${pendingOrderData.senderName} (${pendingOrderData.senderPhone})\n` +
          `- Địa chỉ lấy hàng: ${pendingOrderData.senderAddress || ''} (${senderCity})\n` +
          `- Người nhận: ${pendingOrderData.receiverName} (${pendingOrderData.receiverPhone})\n` +
          `- Địa chỉ giao hàng: ${pendingOrderData.receiverAddress || ''} (${receiverCity})\n` +
          `- Hàng hóa: ${pendingOrderData.itemName} (${weightKg} kg, ${lengthCm}x${widthCm}x${heightCm} cm)\n` +
          `- Tiền thu hộ COD: ${(pendingOrderData.codAmount || 0).toLocaleString('vi-VN')} VNĐ\n` +
          `- Cước vận chuyển tạm tính: ${shippingFee.toLocaleString('vi-VN')} VNĐ\n`,
        citations: [],
        orderConfirmation: pendingOrderData,
        actionChips: [
          { label: 'Xác nhận tạo đơn', query: 'Xác nhận tạo đơn' },
          { label: 'Chỉnh sửa thông tin', query: 'Tạo đơn ngay' },
          { label: 'Hủy tạo đơn', query: 'Hủy tạo đơn' },
        ],
        sessionPatch: { pendingOrderData, pendingIntent: 'CREATE_ORDER' },
      };
    }

    if (uiAction === 'OPEN_ORDER_FORM' || stepAction === 'OPEN_FORM') {
      return {
        toolsUsed: [],
        toolAugmentedContext: `\n[MỞ BIỂU MẪU TẠO ĐƠN HÀNG]: Mời anh/chị điền thông tin người gửi, người nhận và bưu kiện vào biểu mẫu ngay bên dưới để tạo đơn ạ.\n`,
        citations: [],
        orderFormRequested: true,
        actionChips: [{ label: 'Hủy tạo đơn', query: 'Hủy tạo đơn' }],
        sessionPatch: {},
      };
    }

    return {
      toolsUsed: [],
      toolAugmentedContext:
        `\n[TƯ VẤN DỊCH VỤ TẠO ĐƠN HÀNG VÀ THU HỘ COD]:\n` +
        `- Nexus hỗ trợ lấy hàng tận nơi miễn phí nội thành, cước từ 21.500đ (nội tỉnh) và từ 32.000đ (liên tỉnh), đối soát COD định kỳ Thứ 2-4-6.\n` +
        `- Mời anh/chị bấm "Tạo đơn ngay" để mở biểu mẫu gửi hàng.\n`,
      citations: [],
      actionChips: [
        { label: 'Tạo đơn ngay', query: 'Tạo đơn ngay' },
        { label: 'Dự toán cước', query: 'Dự toán cước vận chuyển' },
      ],
      sessionPatch: {},
    };
  }

  private handleEscalation(
    dto: ChatRequestDto,
    session: ChatSessionContext,
    params: Record<string, any>,
  ): OrchestrationResult {
    const trackingNumber = (params.trackingCode || extractTrackingCode(dto.message || '') || session.selectedCode || '').toUpperCase() || undefined;
    const handover = this.toolsService.escalateToHumanAgent({
      userId: dto.userId,
      trackingNumber,
      reason: params.reason || dto.message,
    });

    return {
      toolsUsed: ['escalateToHumanAgent()'],
      toolAugmentedContext:
        `\n[KẾT QUẢ ĐIỀU HƯỚNG CHUYÊN VIÊN CSKH CON NGƯỜI]:\n` +
        `- Mã phiếu yêu cầu hỗ trợ: ${handover.ticketId}\n` +
        `- Hàng đợi: ${handover.queue} (Ưu tiên: ${handover.priority})\n` +
        `- Hotline: ${handover.hotline} (${handover.operatingHours})\n` +
        `- Thời gian chờ dự kiến: ${handover.estimatedWaitTimeSeconds} giây\n` +
        `- Thông báo hệ thống: ${handover.message}\n`,
      citations: [],
      sessionPatch: {},
    };
  }

  private handleStorageAgingPolicy(): OrchestrationResult {
    const policy = this.toolsService.getStorageAgingPolicy();
    return {
      toolsUsed: ['getStorageAgingPolicy(Articles 18 & 28 Postal Law)'],
      toolAugmentedContext:
        `\n[QUY ĐỊNH THỜI HẠN LƯU KHO & XỬ LÝ HÀNG QUÁ HẠN / VÔ CHỦ - ${policy.legalBasis}]:\n` +
        `- Hub trung chuyển: ${policy.agingLimits.sortingHub}\n` +
        `- Bưu cục phát chờ giao lại: ${policy.agingLimits.deliveryHubPending}\n` +
        `- Bưu cục gom hàng hoàn: ${policy.agingLimits.returnHubStaging}\n` +
        `- Bưu cục trả hàng cho Shop: ${policy.agingLimits.originHubReturnHolding}\n` +
        `- Quy trình 5 bước (Điều 18 & 28 Luật Bưu chính): ${policy.overdueAndDeadLetterWorkflow.step1}; ${policy.overdueAndDeadLetterWorkflow.step2}; ${policy.overdueAndDeadLetterWorkflow.step3}; ${policy.overdueAndDeadLetterWorkflow.step4}; ${policy.overdueAndDeadLetterWorkflow.step5}\n`,
      citations: [],
      sessionPatch: {},
    };
  }

  private handleWaybillFormatPolicy(): OrchestrationResult {
    const wp = this.toolsService.getWaybillFormatPolicy();
    return {
      toolsUsed: ['getWaybillFormatPolicy(Waybill Prefix & 3-Segment Routing)'],
      toolAugmentedContext:
        `\n[QUY HOẠCH DẢI MÃ VẬN ĐƠN & MÃ ĐỊNH TUYẾN 3 ĐOẠN]:\n` +
        `- Đầu 101: ${wp.numberSeries.merchant101}\n` +
        `- Đầu 111: ${wp.numberSeries.marketplace111}\n` +
        `- Đầu 333: ${wp.numberSeries.retail333}\n` +
        `- Đầu 222: ${wp.numberSeries.return222}\n` +
        `- Định tuyến 3 đoạn: ${wp.jtRoutingComparison.threeSegmentRoutingCode}\n`,
      citations: [],
      sessionPatch: {},
    };
  }

  private async handleKnowledgeRag(question: string, session: ChatSessionContext): Promise<OrchestrationResult> {
    const rewrite = await this.queryRewriter.rewriteForRetrieval(question, session);
    const searchQuery = rewrite.rewrittenQuery;
    const toolsUsed: string[] = [];

    if (rewrite.wasRewritten) {
      toolsUsed.push(`queryRewrite(${rewrite.source}: "${searchQuery}")`);
    }

    let matches: SearchMatch[] = [];
    try {
      const embRes = await this.embeddingService.getEmbedding(searchQuery);
      const minScore = embRes.isMock ? 0.08 : 0.15;
      matches = this.vectorStore.hybridSearch(embRes.embedding, searchQuery, 4, minScore);
    } catch (err: any) {
      this.logger.warn(`RAG hybridSearch fallback (${err?.message})`);
    }

    // Fallback keyword match across loaded SOP chunks when offline embedding dimension differs from stored index
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

    // Attach verified active shipment context so policy answers apply directly to the parcel under discussion
    let activeShipmentContext = '';
    if (session.lastShipmentSummary?.isVerified) {
      const s = session.lastShipmentSummary;
      activeShipmentContext =
        `\n[NGỮ CẢNH ĐƠN HÀNG ĐANG TRAO ĐỔI TRONG PHIÊN]:\n` +
        `- Mã vận đơn: ${s.code}\n` +
        (s.itemName ? `- Mặt hàng: ${s.itemName}\n` : '') +
        (s.statusText ? `- Trạng thái hiện tại: ${s.statusText}\n` : '') +
        (s.codAmount !== undefined ? `- Giá trị thu hộ COD: ${s.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
        (s.weightKg ? `- Khối lượng: ${s.weightKg} kg\n` : '') +
        (rewrite.wasRewritten ? `- Câu hỏi đã được làm rõ ngữ cảnh: ${searchQuery}\n` : '');
    }

    return {
      toolsUsed,
      toolAugmentedContext: activeShipmentContext,
      citations,
      ragQuery: ragContext,
      sessionPatch: {},
    };
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

  private inferPreferredTime(message: string): string {
    const nq = normalizeVietnamese(message);
    if (nq.includes('ngay mai')) return nq.includes('sang') ? 'Sáng mai (08:30 - 11:30)' : nq.includes('chieu') ? 'Chiều mai (13:30 - 17:30)' : 'Ngày mai (trong giờ hành chính)';
    if (nq.includes('chieu nay') || nq.includes('chieu')) return 'Chiều nay (13:30 - 17:30)';
    if (nq.includes('toi nay') || nq.includes('toi')) return 'Tối nay (18:00 - 20:30)';
    if (nq.includes('cuoi tuan') || nq.includes('thu 7') || nq.includes('chu nhat')) return 'Cuối tuần';
    const hourMatch = message.match(/(\d{1,2})\s*(?:h|giờ|:)\s*(\d{0,2})/i);
    if (hourMatch) {
      return `${hourMatch[1]}:${(hourMatch[2] || '00').padStart(2, '0')}`;
    }
    return 'Ngày mai (trong giờ hành chính)';
  }

  private toShipmentCard(trackRes: TrackingResult): ShipmentCardDto {
    return {
      code: trackRes.trackingNumber,
      status: trackRes.status,
      statusText: trackRes.statusText,
      itemName: trackRes.itemName,
      receiverCity:
        trackRes.receiverAddress ||
        [trackRes.receiverWard, trackRes.receiverDistrict, trackRes.receiverProvince].filter(Boolean).join(', ') ||
        trackRes.receiverCity,
      receiverName: trackRes.receiverName,
      codAmount: trackRes.codAmount,
      createdAt: trackRes.createdAt,
    };
  }

  private buildVerifiedTrackingContext(
    dto: ChatRequestDto,
    trackRes: TrackingResult,
    isGuest: boolean,
    accountPhone: string | undefined,
    unlockedByPhone: boolean,
  ): { context: string; card: ShipmentCardDto; actionChips: ActionChipDto[] } {
    const isOutForDelivery =
      trackRes.status === 'OUT_FOR_DELIVERY' ||
      trackRes.status === 'DELIVERING' ||
      trackRes.statusText?.toLowerCase().includes('dang phat') ||
      trackRes.statusText?.toLowerCase().includes('dang giao');

    const isSender =
      (!isGuest && !!accountPhone && phonesMatch(trackRes.senderPhone, accountPhone)) ||
      dto.senderRole === 'MERCHANT';

    const canCancel = ['CREATED', 'TASK_ASSIGNED', 'PICKUP_ASSIGNED', 'PICKING_UP', 'PENDING', 'READY_TO_SHIP'].includes(trackRes.status);

    let actionChips: ActionChipDto[];
    if (isOutForDelivery) {
      actionChips = isSender
        ? [
            { label: 'Tra cứu đơn khác', query: 'Tra cứu hành trình đơn hàng' },
            { label: 'Liên hệ bưu tá phát', query: `Tôi muốn liên hệ bưu tá phát đơn ${trackRes.trackingNumber}` },
          ]
        : [
            { label: 'Hẹn giao lại ngày mai', query: `Hôm nay tôi bận, hẹn giao lại đơn ${trackRes.trackingNumber} vào ngày mai` },
            { label: 'Giữ tại bưu cục (Tự đến lấy)', query: `Đơn ${trackRes.trackingNumber} giữ tại bưu cục phát giúp mình` },
            { label: 'Đổi người nhận hộ', query: `Đơn ${trackRes.trackingNumber} đổi người nhận sang người nhà giúp mình` },
          ];
    } else {
      actionChips = [
        ...(canCancel ? [{ label: `Hủy đơn ${trackRes.trackingNumber}`, query: `Tôi muốn hủy đơn hàng ${trackRes.trackingNumber}` }] : []),
        { label: 'Tra cứu đơn khác', query: 'Tra cứu hành trình đơn hàng' },
        { label: 'Gửi đơn hàng mới', query: 'Tôi muốn gửi hàng mới' },
      ];
    }

    let context =
      (unlockedByPhone
        ? `\n[XÁC THỰC THÀNH CÔNG SỐ ĐIỆN THOẠI NGƯỜI NHẬN - HIỂN THỊ TOÀN BỘ THÔNG TIN CHI TIẾT]:\n`
        : `\n[THÔNG TIN TRA CỨU ĐƠN HÀNG MÃ ${trackRes.trackingNumber} (ĐÃ XÁC THỰC CHÍNH CHỦ)]:\n`) +
      `- Mã vận đơn: ${trackRes.trackingNumber}\n` +
      `- Trạng thái: ${trackRes.statusText} (${trackRes.status})\n` +
      (trackRes.itemName ? `- Tên hàng hóa: ${trackRes.itemName}\n` : '') +
      (trackRes.weightKg ? `- Khối lượng: ${trackRes.weightKg} kg\n` : '') +
      (trackRes.senderName ? `- Người gửi: ${trackRes.senderName}${trackRes.senderAddress ? ` (${trackRes.senderAddress})` : ''}\n` : '') +
      (trackRes.receiverName ? `- Người nhận: ${trackRes.receiverName}\n` : '') +
      (trackRes.receiverPhone ? `- Số điện thoại người nhận: ${trackRes.receiverPhone}\n` : '') +
      (trackRes.receiverAddress ? `- Địa chỉ nhận hàng (Nơi giao đến): ${trackRes.receiverAddress}\n` : '') +
      (trackRes.destinationHubName ? `- Bưu cục phát: ${trackRes.destinationHubName}\n` : '') +
      (trackRes.codAmount !== undefined ? `- Tiền thu hộ COD: ${trackRes.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
      `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
      `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery}\n` +
      `- Lịch sử vận chuyển:\n${trackRes.timeline.map((t) => `  * ${t.time}: ${t.description}`).join('\n')}\n`;

    if (isOutForDelivery) {
      context += isSender
        ? `\n[THÔNG BÁO VẬN HÀNH DÀNH CHO NGƯỜI GỬI / SHOP - ĐƠN HÀNG ĐANG ĐƯỢC BƯU TÁ PHÁT]:\n` +
          `- Bưu tá phụ trách phát: ${trackRes.courierName || 'Bưu tá tuyến'}${trackRes.courierPhone ? ` (SĐT: ${trackRes.courierPhone})` : ''}\n`
        : `\n[THÔNG BÁO VẬN HÀNH DÀNH CHO NGƯỜI NHẬN - ĐƠN HÀNG ĐANG ĐƯỢC BƯU TÁ PHÁT TẬN NƠI]:\n` +
          `- Bưu tá phụ trách phát: ${trackRes.courierName || 'Bưu tá tuyến'}${trackRes.courierPhone ? ` (SĐT: ${trackRes.courierPhone})` : ''}\n` +
          `- Lưu ý tiện ích: Nếu hôm nay anh/chị bận, có thể hẹn giao lại sang ngày mai hoặc giữ tại bưu cục miễn phí 0 VNĐ ngay tại đây.\n`;
    }

    return { context, card: this.toShipmentCard(trackRes), actionChips };
  }
}
