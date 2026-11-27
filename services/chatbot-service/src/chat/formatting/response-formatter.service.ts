import { Injectable } from '@nestjs/common';
import { Citation } from '../../rag/rag.types';

/**
 * Normalizes LLM / fallback text to comply with Carrier tone & formatting policy:
 * - No emojis / icons / LaTeX / backticks
 * - Always "(60x50x40)/6000" instead of "/6.000" or LaTeX "\times"
 * - Polite CSKH pronoun pair ("em" / "anh/chị")
 */
@Injectable()
export class ResponseFormatterService {
  cleanBotFormatting(text: string): string {
    let cleaned = text.trim();

    // 1. Remove emojis / icon unicode blocks
    cleaned = cleaned.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu,
      '',
    );

    // Strip LaTeX math symbols & standardize volumetric formula
    cleaned = cleaned.replace(/\\times/g, 'x');
    cleaned = cleaned.replace(/\\text\{([^}]*)\}/g, '$1');
    cleaned = cleaned.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/$2');
    cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
    cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, '$1');
    cleaned = cleaned.replace(/\$([^\$\n]+)\$/g, '$1');
    cleaned = cleaned.replace(/\/\s*6\.000\b/g, '/ 6000');
    cleaned = cleaned.replace(/\((\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\)\s*\/\s*6000/g, '($1x$2x$3)/6000');
    cleaned = cleaned.replace(/(?:^|[^\w(])(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*\/\s*6000/g, ' ($1x$2x$3)/6000');
    cleaned = cleaned.replace(/\\([a-zA-Z]+)/g, '$1');

    // 2. Remove backticks & excessive asterisks
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1').replace(/`/g, '');
    cleaned = cleaned.replace(/\*{3,}/g, '**');

    // 3. Fix orphan bullets & normalize list markers to '• '
    cleaned = cleaned.replace(/(^|\n)\s*([•\-\*])\s*\n+(\s*)/g, '$1• ');
    cleaned = cleaned.replace(/^(\s*)[\*\-]\s+/gm, '$1• ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 4. Enforce consistent CSKH tone & strip accidental prompt markers
    cleaned = cleaned
      .replace(/Chào bạn,/g, 'Dạ em chào anh/chị,')
      .replace(/Chào bạn\./g, 'Dạ em chào anh/chị ạ.')
      .replace(/Chào bạn!/g, 'Dạ em chào anh/chị ạ!')
      .replace(/\bTôi khuyến khích bạn\b/g, 'Em khuyến khích anh/chị')
      .replace(/\btôi sẽ giải thích\b/g, 'em xin phép giải thích')
      .replace(/\bcho bạn biết\b/g, 'cho anh/chị biết')
      .replace(/\bcủa bạn\b/g, 'của mình')
      .replace(/\bTôi là Chuyên viên\b/g, 'Em là Chuyên viên')
      .replace(/- CHỈ DẪN AI:[\s\S]*?\n/g, '')
      .replace(/- HƯỚNG DẪN AI:[\s\S]*?\n/g, '');

    return cleaned.trim();
  }

  generateOfflineDemoAnswer(question: string, context: string, citations: Citation[]): string {
    const match = context.match(
      /=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===\n([\s\S]*?)(=== TÀI LIỆU QUY CHUẨN|$)/,
    );
    const realtimeSection = match ? match[1].trim() : '';

    if (realtimeSection) {
      const handlerOutput = this.matchOfflineRealtimeTemplate(question, realtimeSection);
      if (handlerOutput) return handlerOutput;

      const cleanSection = realtimeSection
        .replace(/\[HƯỚNG DẪN[\s\S]*?(\n\n|$)/g, '')
        .replace(/- Ghi chú quan trọng cho AI:[\s\S]*?\n/g, '')
        .replace(/- HƯỚNG DẪN AI:[\s\S]*?\n/g, '')
        .replace(/- CHỈ DẪN AI:[\s\S]*?\n/g, '')
        .replace(/- HÃY BÁO GIÁ[\s\S]*?\n/g, '')
        .replace(/ℹ️\s*Tài khoản undefined[^\n]*\n?/g, '')
        .replace(/\[THÔNG TIN TRA CỨU ĐƠN HÀNG THỰC TẾ CHO MÃ (.*?)\]:/g, '**Chi tiết hành trình vận đơn $1**:')
        .replace(/\[BẢNG BÁO GIÁ CƯỚC THỜI GIAN THỰC TỪ MICROSERVICE PRICING-SERVICE\]:/g, '**Dự toán cước phí vận chuyển**:')
        .replace(/\[KẾT QUẢ TRA CỨU\]:\s*/g, '')
        .trim();

      const isDomainOrderOrPricing =
        realtimeSection.includes('Mã vận đơn') ||
        realtimeSection.includes('báo giá cước') ||
        realtimeSection.includes('BÁO GIÁ') ||
        realtimeSection.includes('TẠO ĐƠN');

      const citationNote =
        !isDomainOrderOrPricing && citations.length > 0 && citations[0].score > 65
          ? `\n\n*Căn cứ Quy chuẩn Vận hành Dịch vụ Nexus:*\n"${citations[0].snippet}"`
          : '';

      return `Chào anh/chị. Em xin gửi thông tin từ hệ thống:\n\n${cleanSection}${citationNote}\n\nNếu cần hỗ trợ thêm thông tin gì, anh/chị cứ nhắn em nhé.`;
    }

    if (citations.length > 0 && citations[0].score > 0.3) {
      const top = citations[0];
      return `Chào anh/chị. Em đã tìm thấy thông tin từ tài liệu **${top.file}** (${top.title}):\n\n${top.snippet}\n\nNếu cần hỗ trợ thêm, anh/chị nhắn lại để em tư vấn chi tiết hơn ạ.`;
    }

    return `Dạ em chào anh/chị. Hiện hệ thống AI đang chạy ở chế độ hỗ trợ ngoại tuyến nhưng em vẫn tra cứu đơn hàng, tính cước, hẹn giao lại và giải đáp quy chuẩn bưu chính đầy đủ cho anh/chị. Anh/chị cần em kiểm tra nội dung nào ạ?`;
  }

  private extractLineValue(section: string, labelPrefix: string, fallback = ''): string {
    const escaped = labelPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = section.match(new RegExp(`${escaped}:\\s*(.*?)\\n`));
    return m ? m[1].trim() : fallback;
  }

  private matchOfflineRealtimeTemplate(question: string, section: string): string | null {
    if (section.includes('[CẢNH BÁO AN TOÀN VÀ PHÁP LÝ BƯU CHÍNH - TỪ CHỐI HÀNG CẤM')) {
      return `Dạ em chào anh/chị ạ!\n\nTheo Luật Bưu chính và Quy định An toàn Vận chuyển của Nexus Logistics, hệ thống **từ chối tiếp nhận vận chuyển hoàn toàn** đối với bưu gửi chứa hàng cấm hoặc hàng hóa nguy hiểm dễ cháy nổ theo quy định pháp luật và an toàn hàng không IATA ạ.`;
    }

    if (section.includes('[CHẶN VƯỢT TRẦN MẠNG LƯỚI BƯU CỤC - TẦNG 3 OVER-LIMIT BLOCK]')) {
      const reason = this.extractLineValue(section, '- Phát hiện vi phạm giới hạn vật lý', 'Vượt ngưỡng 70kg / 150cm / D+R+C > 300cm');
      return `Dạ em chào anh/chị ạ!\n\nKiện hàng này hiện đã **vượt trần vật lý** cho phép của mạng lưới bưu cục tiêu chuẩn (**${reason}**). Quy chuẩn tối đa 1 kiện là <= **70 kg**, 1 cạnh dài nhất <= **150 cm** và tổng 3 chiều D+R+C <= **300 cm**.\n\nHệ thống xin phép chặn tạo đơn bưu phẩm tiêu chuẩn và hướng dẫn anh/chị tách nhỏ kiện hàng hoặc sử dụng dịch vụ **Vận tải hàng nguyên chuyến (FTL/Truckload)** nhé ạ.`;
    }

    if (section.includes('[XÁC NHẬN ĐẠT NGƯỠNG TẦNG 2 - CỒNG KỀNH TRONG HẠN MỨC')) {
      return `Dạ em chào anh/chị ạ!\n\nKiện hàng **70 kg**, cạnh **150 cm** nằm đúng ngưỡng tối đa của **Tầng 2 - Hàng cồng kềnh trong hạn mức** nên hệ thống **vẫn nhận gửi** bình thường (điều kiện tổng D+R+C <= 300 cm). Hệ thống sẽ điều phối **xe tải** chuyên dụng và tính cước theo max(Cân thực tế, (DxRxC)/6000) ạ.`;
    }

    if (section.includes('[BẢO MẬT TÀI CHÍNH & QUY TRÌNH BỒI THƯỜNG CARRIER SOP - KHÔNG THỂ DUYỆT CHI TRỰC TIẾP]')) {
      return `Dạ em chào anh/chị ạ!\n\nChatbot không có thẩm quyền tự ý duyệt chi hay chuyển khoản bồi thường trực tiếp ạ. Mọi khoản bồi thường đều được xử lý minh bạch qua 3 bước: (1) Lập hồ sơ Claims kèm ảnh/video đồng kiểm, (2) Ban Giám định QA thẩm định, (3) Kế toán giải ngân tự động qua lịch đối soát ạ.`;
    }

    if (section.includes('[CẢNH BÁO BẢO MẬT HỆ THỐNG - OWASP')) {
      return `Dạ em chào anh/chị ạ. Yêu cầu này vi phạm quy chuẩn bảo mật dữ liệu và phân quyền hệ thống của Nexus Logistics nên em xin phép **từ chối thực hiện** theo quy định an toàn thông tin ạ.`;
    }

    if (section.includes('[TỪ CHỐI NGOÀI PHẠM VI HỆ THỐNG]')) {
      return `Dạ em chào anh/chị ạ! Em là Trợ lý AI Bưu cục của Nexus Logistics, chỉ chuyên hỗ trợ nghiệp vụ bưu chính, vận chuyển hàng hóa và tra cứu vận đơn. Yêu cầu này nằm ngoài phạm vi hỗ trợ của hệ thống bên em ạ.`;
    }

    if (section.includes('[Ý ĐỊNH CHÀO HỎI XÃ GIAO')) {
      const nameMatch = section.match(/Người dùng (.*?) đang gửi lời chào/);
      const name = nameMatch ? nameMatch[1].trim() : '';
      return `Dạ em chào anh/chị${name ? ' ' + name : ''} ạ. Em là Trợ lý AI Bưu cục Nexus Logistics. Em có thể hỗ trợ gì cho anh/chị hôm nay ạ?`;
    }

    if (section.includes('[KẾT QUẢ GHI NHẬN LỊCH HẸN GIAO LẠI HÀNG CHO VẬN ĐƠN')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const time = this.extractLineValue(section, 'Thời gian hẹn giao lại', 'Ngày mai (trong giờ hành chính)');
      return `Dạ em chào anh/chị ạ!\n\nHệ thống điều phối trung tâm của Nexus Logistics đã **tự động ghi nhận lịch hẹn phát lại** cho vận đơn **${code}** vào: **${time}** rồi nhé ạ.\n\n• Thông tin hẹn giao lại đã đồng bộ sang hệ thống điều phối & ứng dụng bưu tá. Bưu tá không cần lập kiện vấn đề trên app.\n• Lần phát lại này **hoàn toàn miễn phí (0 VNĐ)** theo chính sách giao lại 03 lần của Nexus Logistics ạ.`;
    }

    if (section.includes('[KẾT QUẢ ĐĂNG KÝ NHẬN HÀNG TẠI BƯU CỤC (HOLD AT HUB / PUDO) CHO VẬN ĐƠN')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const pin = this.extractLineValue(section, 'Mã nhận hàng OTP/PIN bảo mật');
      const hub = this.extractLineValue(section, 'Bưu cục lưu giữ', 'Bưu cục phát');
      const time = this.extractLineValue(section, 'Thời gian khách hẹn đến lấy', 'Hôm nay');
      return `Dạ em chào anh/chị ạ!\n\nHệ thống đã ghi nhận yêu cầu giữ hàng tại bưu cục (**PUDO**) cho vận đơn **${code}**:\n• Mã PIN nhận hàng bảo mật: **${pin}**\n• Bưu cục lưu giữ: **${hub}**\n• Thời gian dự kiến ghé lấy: **${time}**\n• Thời hạn lưu kho miễn phí: **05 ngày**.\n\nKhi đến quầy, anh/chị chỉ cần đọc SĐT và Mã PIN **${pin}** cho giao dịch viên ạ.`;
    }

    if (section.includes('[KẾT QUẢ ĐỔI THÔNG TIN NGƯỜI NHẬN HÀNG (CHANGE CONSIGNEE) CHO VẬN ĐƠN')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const newReceiver = this.extractLineValue(section, 'Người nhận mới');
      const courier = this.extractLineValue(section, 'Bưu tá phụ trách', 'Bưu tá tuyến');
      return `Dạ em chào anh/chị ạ!\n\nHệ thống đã cập nhật người nhận mới cho vận đơn **${code}**: **${newReceiver}** (hoàn toàn miễn phí 0 VNĐ do giữ nguyên địa chỉ giao). Bưu tá **${courier}** đã nhận đồng bộ trên Courier Mobile để bấm gọi đúng người nhận mới ạ.`;
    }

    if (section.includes('[KẾT QUẢ GHI NHẬN HẸN GỌI LẠI SAU CUỘC GỌI NHỠ CHO VẬN ĐƠN')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const time = this.extractLineValue(section, 'Khung giờ khách hẹn bưu tá gọi lại & giao hàng', 'Chiều nay');
      const courier = this.extractLineValue(section, 'Bưu tá phụ trách', 'Nguyễn Văn Hùng');
      return `Dạ em chào anh/chị ạ! Em đã ghi nhận lịch hẹn bưu tá **${courier}** gọi lại và giao vận đơn **${code}** vào khung giờ **${time}** (hoàn toàn miễn phí 0 VNĐ) rồi nhé ạ!`;
    }

    if (section.includes('[KẾT QUẢ KIỂM TOÁN CUỘC GỌI VẬN ĐƠN & ĐỊNH VỊ GPS CHO VẬN ĐƠN')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const courier = this.extractLineValue(section, 'Bưu tá phụ trách', 'Nguyễn Văn Hùng');
      const calls = this.extractLineValue(section, 'Số cuộc gọi đã thực hiện', '2/2 cuộc gọi');
      const dist = this.extractLineValue(section, 'Khoảng cách GPS thực tế', '45m / <= 200m');
      return `Dạ em chào anh/chị ạ!\n\nKết quả kiểm toán thực địa cho vận đơn **${code}** (Bưu tá **${courier}**): Cuộc gọi **${calls}**, tọa độ GPS thực tế **${dist}**. Hệ thống đã kích hoạt CSKH chủ động để anh/chị hẹn lại khung giờ nhận hàng thuận tiện nhất ạ.`;
    }

    if (section.includes('[QUY CHUẨN CARRIER SOP: KIỂM SOÁT CUỘC GỌI & CHỐNG BẮN TRẠNG THÁI MA')) {
      return `Dạ em chào anh/chị ạ! Để chống tình trạng bưu tá tự ý báo không liên lạc được, Nexus Logistics kiểm soát 2 tầng bắt buộc: (1) Tối thiểu **02 cuộc gọi** thực tế (không giới hạn thời gian chờ giữa các cuộc gọi), (2) GPS thiết bị phải nằm trong bán kính **<= 200m** tại địa chỉ người nhận, đồng thời kích hoạt CSKH chủ động hẹn giờ gọi lại miễn phí ạ.`;
    }

    if (section.includes('[THẨM ĐỊNH NGHIỆP VỤ HỦY ĐƠN & YÊU CẦU XÁC NHẬN HUMAN-IN-THE-LOOP]')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const item = this.extractLineValue(section, 'Tên hàng hóa', 'bưu kiện');
      return `Dạ em chào anh/chị ạ. Có phải anh/chị đang muốn hủy đơn hàng **${code}** (${item}) đúng không ạ? Đơn đủ điều kiện hủy miễn phí 100% (0 VNĐ). Anh/chị vui lòng bấm nút xác nhận hoặc nhắn **"Đồng ý hủy"** để em thực thi nhé ạ.`;
    }

    if (section.includes('[KẾT QUẢ HỦY ĐƠN HÀNG THÀNH CÔNG')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      return `Dạ em chào anh/chị ạ. Đơn hàng **${code}** đã được hủy thành công hoàn toàn miễn phí (0 VNĐ) và hệ thống đã dừng lệnh lấy hàng tới bưu tá tuyến ạ.`;
    }

    if (section.includes('[THÔNG BÁO SỐ ĐIỆN THOẠI NGƯỜI NHẬN KHÔNG KHỚP')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const phone = this.extractLineValue(section, 'Số điện thoại cung cấp');
      return `Dạ em chào anh/chị ạ. Số điện thoại **${phone}** chưa trùng khớp với số người nhận trên vận đơn **${code}**. Để bảo vệ dữ liệu cá nhân theo Luật Bưu chính, anh/chị vui lòng kiểm tra lại SĐT người nhận hoặc đăng nhập tài khoản chính chủ nhé ạ.`;
    }

    if (section.includes('[YÊU CẦU BẮT BUỘC CUNG CẤP SỐ ĐIỆN THOẠI NGƯỜI NHẬN')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      return `Dạ em chào anh/chị ạ. Để bảo mật thông tin bưu gửi cho đơn hàng **${code}**, anh/chị vui lòng cung cấp **Số điện thoại người nhận** (hoặc đăng nhập tài khoản chính chủ) để hệ thống đối chiếu và hiển thị chi tiết hành trình nhé ạ.`;
    }

    if (section.includes('[HƯỚNG DẪN AI TRẢ LỜI CÂU HỎI TIẾP THEO VỀ ĐƠN HÀNG')) {
      const code = this.extractLineValue(section, 'Mã vận đơn');
      const loc = this.extractLineValue(section, 'Vị trí hiện tại');
      const status = this.extractLineValue(section, 'Trạng thái');
      const eta = this.extractLineValue(section, 'Thời gian dự kiến giao');
      const cod = this.extractLineValue(section, 'Tiền thu hộ COD');
      const weight = this.extractLineValue(section, 'Khối lượng');
      const cleanQ = question.toLowerCase();
      if (cleanQ.includes('nang') || cleanQ.includes('kg') || cleanQ.includes('khoi luong')) {
        return `Dạ đơn hàng **${code}** có khối lượng **${weight || 'đang cập nhật'}** ạ. Trạng thái hiện tại: ${status}, vị trí: ${loc}.`;
      }
      if (cleanQ.includes('cod') || cleanQ.includes('thu ho')) {
        return `Dạ tiền thu hộ COD của đơn hàng **${code}** là **${cod || '0 VNĐ'}** ạ. Trạng thái: ${status}.`;
      }
      return `Dạ thông tin đơn hàng **${code}**: Trạng thái **${status}**, vị trí **${loc}**${weight ? `, khối lượng **${weight}**` : ''}${cod ? `, COD **${cod}**` : ''}${eta ? `, dự kiến giao: ${eta}` : ''} ạ.`;
    }

    if (section.includes('[DANH SÁCH CÁC ĐƠN HÀNG GẦN ĐÂY CỦA TÀI KHOẢN')) {
      const total = this.extractLineValue(section, '- Tổng số đơn tìm thấy', '').replace(/\.$/, '');
      return `Dạ em chào anh/chị ạ. Hệ thống đã hiển thị ${total || 'các đơn hàng gần đây'} ở các thẻ vận đơn ngay bên dưới, anh/chị bấm chọn đơn cần kiểm tra chi tiết hoặc thao tác nhé ạ.`;
    }

    if (section.includes('[THÔNG TIN TRA CỨU ĐƠN HÀNG MÃ') || section.includes('[XÁC THỰC THÀNH CÔNG SỐ ĐIỆN THOẠI NGƯỜI NHẬN')) {
      const lines = section
        .split('\n')
        .filter((l) => !l.startsWith('[') && !l.includes('HƯỚNG DẪN') && !l.includes('NGUYÊN TẮC'))
        .map((l) => l.trim())
        .filter(Boolean);
      return `Dạ thông tin hành trình vận đơn của anh/chị đây ạ:\n\n${lines.join('\n')}`;
    }

    return null;
  }
}
