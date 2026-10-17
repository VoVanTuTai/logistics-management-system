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
    let shipmentCards: ShipmentCardDto[] | undefined;
    let actionChips: ActionChipDto[] | undefined;

    const isGuest = !dto.userId || dto.senderRole === 'GUEST';

    // 1. Phân tích ý định & gọi Tool nếu cần (Function Calling / Intent Routing)
    let toolAugmentedContext = '';

    // Regex tìm mã đơn hàng: NX-XXXX hoặc mã số vận đơn (10-15 chữ số, ví dụ 101000000001, 333801334740)
    const trackingMatch =
      question.match(/\b(NX[-_]?[A-Z0-9]{4,16}|SPX[A-Z0-9]+|VN\d+[A-Z0-9]*|DH\d+)\b/i) ||
      question.match(/\b(101\d{9}|111\d{9}|333\d{9}|222\d{9}|\d{10,15})\b/);

    if (trackingMatch) {
      const trackingCode = trackingMatch[1] ? trackingMatch[1].toUpperCase() : trackingMatch[0];
      toolsUsed.push(`trackShipment(${trackingCode}, isGuest=${isGuest})`);
      const trackRes = await this.toolsService.trackShipment(trackingCode, isGuest);

      if (!trackRes.found) {
        toolAugmentedContext += `\n[KẾT QUẢ TRA CỨU]: ${trackRes.notFoundMessage || `Không tìm thấy mã vận đơn ${trackingCode} trên hệ thống.`}\n`;
      } else {
        shipmentCards = [
          {
            code: trackRes.trackingNumber,
            status: trackRes.status,
            statusText: trackRes.statusText,
            itemName: trackRes.itemName,
            receiverCity: trackRes.receiverCity || trackRes.receiverAddress,
            receiverName: trackRes.receiverName,
            codAmount: trackRes.codAmount,
            createdAt: trackRes.createdAt,
          },
        ];

        toolAugmentedContext += `\n[THÔNG TIN TRA CỨU ĐƠN HÀNG MÃ ${trackingCode}${isGuest ? ' (CHẾ ĐỘ KHÁCH VÃNG LAI - ĐÃ MÃ HÓA THÔNG TIN CÁ NHÂN PII)' : ''}]:\n` +
          `- Mã vận đơn: ${trackRes.trackingNumber}\n` +
          `- Trạng thái: ${trackRes.statusText} (${trackRes.status})\n` +
          (trackRes.itemName ? `- Tên hàng hóa: ${trackRes.itemName}\n` : '') +
          (trackRes.senderName ? `- Người gửi: ${trackRes.senderName} (${trackRes.senderCity || trackRes.senderAddress || ''})\n` : '') +
          (trackRes.receiverName ? `- Người nhận: ${trackRes.receiverName} (${trackRes.receiverCity || trackRes.receiverAddress || ''})\n` : '') +
          (trackRes.receiverPhone ? `- Số điện thoại người nhận: ${trackRes.receiverPhone}\n` : '') +
          (trackRes.codAmount !== undefined ? `- Tiền thu hộ COD: ${trackRes.codAmount.toLocaleString('vi-VN')} VNĐ\n` : '') +
          `- Vị trí hiện tại: ${trackRes.currentLocation}\n` +
          `- Thời gian dự kiến giao: ${trackRes.estimatedDelivery}\n` +
          `- Lịch sử vận chuyển:\n` +
          trackRes.timeline.map((t) => `  * ${t.time}: ${t.description}`).join('\n') +
          (isGuest ? `\n- LƯU Ý BẢO MẬT: Người dùng tra cứu dạng khách vãng lai (GUEST), thông tin tên họ và địa chỉ đã được che bớt theo tiêu chuẩn an toàn PII. Hãy nhắc khách đăng nhập tài khoản nếu muốn xem toàn bộ chi tiết.\n` : '\n');
      }
    } else {
      // 1. Kiểm tra nếu người dùng hỏi tra cứu đơn hoặc hỏi về đơn của họ (Tracking / Query Intent)
      const isGeneralTrackingQuery =
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
        normalizedQ.includes('don da tao') ||
        (normalizedQ.includes('don') && (
          normalizedQ.includes('sao roi') ||
          normalizedQ.includes('o dau') ||
          normalizedQ.includes('den dau') ||
          normalizedQ.includes('chua') ||
          normalizedQ.includes('di dau') ||
          normalizedQ.includes('the nao') ||
          normalizedQ.includes('trang thai')
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

        shipmentCards = [
          {
            code: created.trackingNumber,
            itemName: 'Kiện hàng quà tặng người thân',
            status: 'TASK_ASSIGNED',
            statusText: 'Đã phân công bưu tá lấy hàng',
            receiverCity: 'Quận Hoàn Kiếm, TP. Hà Nội',
            receiverName: 'Anh Nguyễn Văn An',
            codAmount: 0,
            createdAt: 'Hôm nay',
          },
        ];

        actionChips = [
          { label: '🔍 Tra cứu hành trình đơn này', query: `Tra cứu hành trình đơn ${created.trackingNumber}` },
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
          `- HƯỚNG DẪN AI: Đóng vai Giao dịch viên bưu cục Nexus chúc mừng khách hàng đã hoàn tất tạo đơn. Thông báo rõ mã vận đơn và số điện thoại bưu tá phụ trách sắp qua lấy hàng. Dặn khách bọc xốp chống sốc theo chuẩn SOP để bảo đảm an toàn cho món quà gửi người thân.\n`;
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
          `- SỐ TIỀN QUÝ KHÁCH CẦN THANH TOÁN KHI GỬI: ${senderPayNow.toLocaleString('vi-VN')} VNĐ (${payer === 'SENDER' ? 'Quý khách quét mã VietQR thanh toán cước ngay hoặc đưa tiền mặt cho bưu tá khi lấy hàng' : 'Người nhận sẽ thanh toán 32.000 VNĐ khi nhận hàng'})\n` +
          `- HƯỚNG DẪN AI: Đóng vai Giao dịch viên bưu cục gửi lại bảng tóm tắt phiếu tiếp nhận chi tiết và báo giá rõ ràng cho khách. Nêu rõ số tiền khách cần thanh toán ngay (nếu Người gửi thanh toán thì 32.000đ, nếu Người nhận thanh toán thì 0đ). Yêu cầu khách bấm [Xác nhận tạo đơn] hoặc [Thanh toán cước ngay] để hệ thống chính thức cấp mã vận đơn và điều phối bưu tá qua lấy hàng.\n`;
      } else if (isGeneralTrackingQuery) {
        if (isGuest) {
          toolAugmentedContext += `\n[CẢNH BÁO BẢO MẬT - NGƯỜI DÙNG CHƯA ĐĂNG NHẬP]: Khách hàng chưa đăng nhập tài khoản và chưa cung cấp mã vận đơn cụ thể. Hãy thông báo lịch sự cho khách hàng rằng để bảo vệ quyền riêng tư và dữ liệu cá nhân (PII) theo Luật Bưu chính, khách hàng vui lòng: 1) Đăng nhập tài khoản để hệ thống tự động hiển thị danh sách đơn hàng của mình; hoặc 2) Cung cấp Mã vận đơn cụ thể (ví dụ: 333... hoặc NX-...) để tra cứu hành trình.\n`;
        } else {
          toolsUsed.push(`getUserShipments(User:${dto.userId})`);
          const userShipments = await this.toolsService.getUserShipments(dto.userId, 5);

          if (!userShipments.found || userShipments.items.length === 0) {
            toolAugmentedContext += `\n[KẾT QUẢ TRA CỨU]: Tài khoản ${dto.userId} hiện chưa có đơn hàng nào được ghi nhận trên hệ thống Nexus Logistics. Hãy thông báo lịch sự cho khách hàng rằng tài khoản chưa phát sinh đơn gửi và mời khách hàng gửi mã vận đơn cụ thể nếu muốn tra cứu đơn nhận.\n`;
          } else {
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
                ).join('\n') + '\n';
            }
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
          `- Lời chào: Niềm nở, chu đáo, sẵn sàng hỗ trợ khách tạo đơn gửi quà/bưu phẩm cho người thân ngay trên hệ thống.\n` +
          `- CÁC CÂU HỎI THU THẬP THÔNG TIN CƠ BẢN (TRÌNH BÀY GỌN GÀNG, RÕ RÀNG BẰNG GẠCH ĐẦU DÒNG):\n` +
          `  1. 📍 Địa chỉ lấy hàng: Hỏi khách muốn bưu tá đến lấy tại [Địa chỉ mặc định đã lưu của tài khoản: 128 Phan Đăng Lưu, P.3, Q.Phú Nhuận, TP.HCM] hay lấy tại [Địa chỉ mới] để giảm bớt bước nhập liệu.\n` +
          `  2. 👤 Thông tin người nhận: Họ tên, Số điện thoại và Địa chỉ giao hàng chi tiết (Tỉnh/Thành, Quận/Huyện).\n` +
          `  3. 📦 Thông tin hàng hóa & Cân nặng: Tên mặt hàng, khối lượng ước tính (kg), và có thu COD không (quà tặng người thân thì COD: 0 VNĐ).\n` +
          `  4. 💳 Hình thức thanh toán cước: Hỏi rõ đơn hàng sẽ do [Người gửi thanh toán (SENDER_PAYS)] hay [Người nhận thanh toán (RECEIVER_PAYS)].\n` +
          `- Nêu rõ sau khi có đủ thông tin, giao dịch viên sẽ gửi bảng tóm tắt chi tiết đơn hàng và báo giá cước, nếu khách đồng ý hoặc thanh toán ngay thì đơn hàng mới chính thức được tạo trên hệ thống.\n` +
          `- Mời khách bấm chọn nhanh các nút gợi ý bên dưới hoặc phản hồi trực tiếp.\n`;
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

    // Kiểm tra ý định hỏi về hàng hỏng, hàng hư, bể vỡ, móp méo, đền bù sự cố
    const isDamageOrBrokenQuery =
      normalizedQ.includes('hang hong') ||
      normalizedQ.includes('hang hu') ||
      normalizedQ.includes('be vo') ||
      normalizedQ.includes('mop meo') ||
      normalizedQ.includes('hu hai') ||
      normalizedQ.includes('thiet hai') ||
      (normalizedQ.includes('hong') && (normalizedQ.includes('thi sao') || normalizedQ.includes('den') || normalizedQ.includes('xu ly') || normalizedQ.includes('lam sao')));

    if (isDamageOrBrokenQuery) {
      toolsUsed.push('getDamageAndClaimPolicy(Fragile Goods & Damage Settlement)');
      toolAugmentedContext += `\n[QUY TRÌNH NGHIỆP VỤ XỬ LÝ HÀNG HƯ HỎNG / BỂ VỠ (DAMAGE SETTLEMENT SOP)]:\n` +
        `- Bước 1 (Khi nhận hàng): Người nhận đồng kiểm phát hiện hàng bị nứt vỡ, móp méo, rò rỉ dung dịch -> Yêu cầu bưu tá lập Biên bản bất thường (Irregularity Report) tại chỗ có chữ ký cả hai bên và chụp ảnh sắc nét 4 góc. Người nhận từ chối nhận hàng và KHÔNG phải thanh toán bất kỳ khoản tiền nào (kể cả COD và cước phí).\n` +
        `- Bước 2 (Hạn mức bồi thường):\n` +
        `  * Gói Tiêu chuẩn (không mua bảo hiểm): Bồi thường tối đa 04 lần cước vận chuyển thực tế, không vượt quá 1.000.000 VNĐ/đơn hàng (Khoản 3 Điều 25 Luật Bưu chính).\n` +
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
        `- HƯỚNG DẪN AI: Nếu khách hàng chưa nêu rõ tuyến đường, hãy báo rõ cả 2 trường hợp (Gửi Nội thành từ ${intraPricing?.totalFee ? intraPricing.totalFee.toLocaleString('vi-VN') + 'đ' : '21.500đ'} và Gửi Liên tỉnh từ ${stdPricing.totalFee.toLocaleString('vi-VN')}đ) để thông tin minh bạch và khớp chính xác với app khi khách tạo đơn. Nêu rõ cân nặng tính cước và cước chuyển hoàn dự kiến.\n`;
    }

    // 2. Truy xuất RAG từ Vector Store với Hybrid Search (Dense Semantic + Keyword Scoring)
    const qEmbed = await this.embeddingService.getEmbedding(question);
    const matches = this.vectorStore.hybridSearch(qEmbed.embedding, question, 5, 0.15);

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

    // 4. Sinh câu trả lời qua LLM (Google Gemini / OpenAI)
    const answer = await this.executeLlm(question, contextText, citations);

    const isPureTracking = toolsUsed.some((t) => t.includes('trackShipment') || t.includes('getUserShipments')) &&
      !/(khiếu nại|bồi thường|bể|vỡ|hỏng|bảo hiểm|lưu kho|cước hoàn|chuyển hoàn|đồng kiểm|phí)/i.test(question);
    const finalCitations = isPureTracking ? [] : citations;

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
  + Gói tiêu chuẩn (mặc định): Đền tối đa 04 lần cước vận chuyển, trần tối đa không quá 1.000.000 VNĐ/đơn (Khoản 3 Điều 25 Luật Bưu chính).
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
- Quản lý COD & Tài chính: Trần giữ tiền mặt bưu tá 15 triệu (cảnh báo đỏ, phải nộp SePay VietQR hoặc nộp két bưu cục), sau 23:59 tự động khóa tài khoản courier nếu nợ qua ngày, đối soát shop Thứ 2-4-6, trần nợ ví shop -500.000đ.
- Lưu kho & Bưu gửi vô chủ: Hub trung chuyển tối đa 24h, bưu cục phát 5 ngày, hàng vô chủ lưu kho bảo quản bắt buộc 6 tháng (Điều 18 & 28 Luật Bưu chính) trước khi bán đấu giá thanh lý cấn trừ nợ cước.

3. PHONG CÁCH DIỄN ĐẠT & VAI TRÒ GIAO DỊCH VIÊN BƯU CỤC:
- Tự nhiên, thông minh, ân cần, giải thích cặn kẽ và mạch lạc như chuyên viên con người nhiều năm kinh nghiệm trong ngành logistics.
- Khi người dùng muốn gửi hàng: Đóng vai Giao dịch viên tiếp nhận tại quầy Bưu cục Nexus Logistics, hướng dẫn thu thập thông tin qua 4 bước cơ bản (Địa chỉ lấy hàng mặc định vs mới, Người nhận, Bưu phẩm & Cân nặng & COD, Người gửi trả vs Người nhận trả). Sau đó gửi Phiếu tạm tính & Báo giá cước và yêu cầu xác nhận/thanh toán ngay trước khi tạo đơn.
- Khi người dùng xác nhận tạo đơn hoặc thanh toán ngay: Chúc mừng, thông báo mã vận đơn chính thức và bưu tá sắp qua lấy hàng.
- Chủ động kết nối các thông tin nghiệp vụ liên quan để tư vấn giải pháp thấu đáo, KHÔNG trả lời cụt ngủn hay rập khuôn máy móc.
- Sử dụng emoji trực quan (📦, 📍, 🛡️, 💰, 🚚, ⏰, 🏬, ⚖️, ⚠️) để câu trả lời sinh động, chuyên nghiệp.
- Trình bày định dạng sạch đẹp: không dùng dấu nháy đơn ngược (backtick), không dùng ba dấu sao liên tiếp (***), dấu gạch đầu dòng và nội dung nằm cùng một dòng.
- CHUẨN MỰC GIAO TIẾP VỚI KHÁCH HÀNG: TUYỆT ĐỐI KHÔNG xuất ra tên file nội bộ (ví dụ .md), không nói "theo tài liệu tham chiếu đoạn 1 đoạn 2", không để lộ thuật ngữ kỹ thuật (như Gateway, BFF, Port, Vector). Khi tư vấn chính sách bồi thường, bảo hiểm, đồng kiểm, giao lại hay chuyển hoàn, hãy diễn đạt tự nhiên: "Theo Quy chuẩn & Chính sách dịch vụ của Nexus Logistics..." và hướng dẫn người dùng có thể xem chi tiết tại mục Điều khoản & Chính sách dịch vụ của chúng tôi.`;

    const userPrompt = `DỮ LIỆU NGỮ CẢNH HỆ THỐNG CUNG CẤP:
${context || '(Không tìm thấy tài liệu phù hợp trực tiếp)'}

CÂU HỎI CỦA NGƯỜI DÙNG:
${question}

HÃY ĐƯA RA CÂU TRẢ LỜI ĐẦY ĐỦ VÀ CHÍNH XÁC:`;

    // 1. Ưu tiên sử dụng Google Gemini API nếu có cấu hình GEMINI_API_KEY
    if (this.geminiApiKey) {
      const candidateModels = Array.from(
        new Set([
          'gemini-3.5-flash-lite',
          'gemini-3-flash-preview',
          'gemini-3.8-flash',
          this.geminiModel,
        ].filter(Boolean))
      );

      for (const model of candidateModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;
          const generationConfig: any = {
            temperature: this.temperature,
          };

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
            signal: AbortSignal.timeout(4000),
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
        .replace(/- HÃY BÁO GIÁ[\s\S]*?\n/g, '')
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

      return `Dạ chào bạn, Trung tâm Điều phối Nexus Logistics đã kiểm tra thông tin:\n\n` +
        `${cleanSection}${citationNote}`;
    }

    if (!context || citations.length === 0) {
      return `Dạ chào bạn, Trung tâm Điều phối Bưu chính Nexus đã ghi nhận câu hỏi: "${question}". Hiện tài liệu hệ thống chưa có dữ liệu chi tiết về câu hỏi này, bạn vui lòng liên hệ tổng đài 1900 6868 để được nhân viên trực ban hỗ trợ trực tiếp ạ.`;
    }

    const topCitation = citations[0];
    return `Dạ theo Quy chuẩn Vận hành của Nexus Logistics:\n\n` +
      `• ${topCitation.snippet}\n\n` +
      `Nếu bạn cần hỗ trợ chi tiết hơn cho từng đơn hàng cụ thể, vui lòng gửi kèm mã vận đơn để hệ thống điều phối tra cứu nhé!`;
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
