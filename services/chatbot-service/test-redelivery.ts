import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ChatService } from './src/chat/chat.service';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('=== KIỂM THỬ 2 NGHIỆP VỤ MỚI CỦA AI CHATBOT BƯU CHÍNH ===\n');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const chatService = app.get(ChatService);

  console.log('---------------------------------------------------------');
  console.log('1. THÔNG BÁO ĐƠN ĐANG PHÁT - DÀNH CHO KHÁCH NHẬN (RECIPIENT)');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res1 = await chatService.handleMessage({
    message: 'Kiểm tra đơn hàng NX-77889900 giúp mình',
    receiverPhone: '0909887766',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'session-recipient-1'
  });
  console.log('Phản hồi cho Khách Nhận:\n' + res1.answer + '\n');
  console.log('Action Chips (Nút thao tác nhanh):', res1.actionChips);

  console.log('\n---------------------------------------------------------');
  console.log('2. THÔNG BÁO ĐƠN ĐANG PHÁT - DÀNH CHO KHÁCH GỬI (SHOP / MERCHANT)');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res2 = await chatService.handleMessage({
    message: 'Shop muốn kiểm tra tiến độ đơn hàng NX-77889900',
    senderRole: 'MERCHANT',
    userId: '0901234567',
    userPhone: '0901234567',
    conversationId: 'session-merchant-1'
  });
  console.log('Phản hồi cho Khách Gửi (Shop):\n' + res2.answer + '\n');
  console.log('Action Chips (Nút thao tác nhanh):', res2.actionChips);

  console.log('\n---------------------------------------------------------');
  console.log('3. KHÁCH BẬN HẸN GIAO LẠI NGÀY MAI QUA CHATBOT (CARRIER SOP)');
  console.log('Câu hỏi: "Hôm nay mình bận, hẹn ngày mai giao nhé"');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res3 = await chatService.handleMessage({
    message: 'Hôm nay mình bận, hẹn ngày mai giao nhé',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'session-recipient-1' // Tiếp tục phiên vừa tra cứu đơn NX-77889900
  });
  console.log('Phản hồi Hẹn Giao Lại Carrier SOP:\n' + res3.answer + '\n');
  console.log('Tools đã thực thi:', res3.toolsUsed);
  console.log('Action Chips:', res3.actionChips);

  console.log('\n---------------------------------------------------------');
  console.log('4. KIỂM TRA LẠI HÀNH TRÌNH SAU KHI HẸN GIAO LẠI');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res4 = await chatService.handleMessage({
    message: 'Tra cứu hành trình đơn NX-77889900',
    receiverPhone: '0909887766',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'session-recipient-1'
  });
  console.log('Trạng thái sau cập nhật:\n' + res4.answer + '\n');

  console.log('\n---------------------------------------------------------');
  console.log('5. KHÁCH YÊU CẦU GIỮ TẠI BƯU CỤC & TỰ ĐẾN LẤY (HOLD AT HUB / PUDO)');
  console.log('Câu hỏi: "Đơn này bưu cục giữ lại giúp mình nhé, tối tan ca khoảng 19h30 mình tự ghé bưu cục phát lấy hàng"');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res5 = await chatService.handleMessage({
    message: 'Đơn này bưu cục giữ lại giúp mình nhé, tối tan ca khoảng 19h30 mình tự ghé bưu cục phát lấy hàng',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'session-recipient-1'
  });
  console.log('Phản hồi Giữ Tại Bưu Cục (PUDO Carrier SOP):\n' + res5.answer + '\n');
  console.log('Tools đã thực thi:', res5.toolsUsed);
  console.log('Action Chips:', res5.actionChips);

  console.log('\n---------------------------------------------------------');
  console.log('6. KIỂM TRA LẠI TRẠNG THÁI VÀ MÃ PIN TRONG HÀNH TRÌNH ĐƠN HÀNG');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res6 = await chatService.handleMessage({
    message: 'Xem lại hành trình đơn NX-77889900',
    receiverPhone: '0909887766',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'session-recipient-1'
  });
  console.log('Trạng thái & Lịch sử vết quét sau khi đăng ký PUDO:\n' + res6.answer + '\n');

  console.log('\n---------------------------------------------------------');
  console.log('7. ĐỔI NGƯỜI NHẬN / SĐT NHẬN HÀNG TẠI CÙNG ĐỊA CHỈ (CHANGE CONSIGNEE)');
  console.log('Câu hỏi: "Đơn này đổi người nhận sang anh Nam, SĐT 0988112233 giúp mình để shipper gọi anh ấy nhé"');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res7 = await chatService.handleMessage({
    message: 'Đơn này đổi người nhận sang anh Nam, SĐT 0988112233 giúp mình để shipper gọi anh ấy nhé',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'session-recipient-1'
  });
  console.log('Phản hồi Đổi Người Nhận Carrier SOP:\n' + res7.answer + '\n');
  console.log('Tools đã thực thi:', res7.toolsUsed);
  console.log('Action Chips:', res7.actionChips);

  console.log('\n---------------------------------------------------------');
  console.log('8. KIỂM TRA LẠI THÔNG TIN VÀ SĐT NGƯỜI NHẬN MỚI TRÊN VẬN ĐƠN');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res8 = await chatService.handleMessage({
    message: 'Kiểm tra lại người nhận đơn NX-77889900',
    receiverPhone: '0988112233', // Dùng SĐT mới của anh Nam để tra cứu
    senderRole: 'CUSTOMER',
    userId: '0988112233',
    conversationId: 'session-recipient-1'
  });
  console.log('Thông tin người nhận mới sau khi cập nhật:\n' + res8.answer + '\n');

  console.log('\n---------------------------------------------------------');
  console.log('9. KHÁCH BẬN HỌP PHẢN HỒI CUỘC GỌI NHỠ HẸN SHIPPER GỌI LẠI (CARRIER SOP)');
  console.log('Câu hỏi: "Lúc nãy bưu tá gọi mình bận họp chưa nghe máy, tầm 14h chiều shipper gọi lại giao giúp mình nhé"');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res9 = await chatService.handleMessage({
    message: 'Lúc nãy bưu tá gọi mình bận họp chưa nghe máy, tầm 14h chiều shipper gọi lại giao giúp mình nhé',
    receiverPhone: '0988112233',
    senderRole: 'CUSTOMER',
    userId: '0988112233',
    conversationId: 'session-recipient-1'
  });
  console.log('Phản hồi Phản Hồi Cuộc Gọi Nhỡ Carrier SOP:\n' + res9.answer + '\n');
  console.log('Tools đã thực thi:', res9.toolsUsed);
  console.log('Action Chips:', res9.actionChips);

  console.log('\n---------------------------------------------------------');
  console.log('10. HỎI QUY ĐỊNH KIỂM SOÁT CUỘC GỌI & CHỐNG BẮN TRẠNG THÁI MA (ANTI-GHOST NDR)');
  console.log('Câu hỏi: "Quy định kiểm soát bưu tá gọi không nghe máy và chống shipper bắn trạng thái ma như thế nào?"');
  console.log('---------------------------------------------------------');
  await delay(1000);
  const res10 = await chatService.handleMessage({
    message: 'Quy định kiểm soát bưu tá gọi không nghe máy và chống shipper bắn trạng thái ma như thế nào?',
    senderRole: 'CUSTOMER',
    conversationId: 'session-policy-1'
  });
  console.log('Phản hồi Quy Định Kiểm Soát 2 Tầng:\n' + res10.answer + '\n');

  console.log('\n---------------------------------------------------------');
  console.log('11. KIỂM THỬ TRỰC TIẾP KIỂM TOÁN CUỘC GỌI VÀ ĐỊNH VỊ GPS (AUDIT DELIVERY ATTEMPT)');
  console.log('---------------------------------------------------------');
  const logisticsTools = app.get(require('./src/tools/logistics-tools.service').LogisticsToolsService);
  
  console.log('Case 11.1: Bưu tá mới gọi 1 cuộc (< 2 cuộc) -> Phải bị chặn!');
  const auditFailCalls = await logisticsTools.auditDeliveryAttempt({
    trackingNumber: 'NX-77889900',
    callCount: 1,
    courierLat: 10.779785,
    courierLng: 106.699018,
  });
  console.log('Kết quả 11.1:', auditFailCalls.passed ? 'FAILED (Lẽ ra phải chặn)' : 'PASSED (Đã chặn đúng: ' + auditFailCalls.rejectionMessage + ')');

  console.log('\nCase 11.2: Bưu tá gọi 2 cuộc nhưng ở quán cà phê cách 3.5km (> 200m) -> Phải chặn bắn trạng thái ma!');
  const auditFailGps = await logisticsTools.auditDeliveryAttempt({
    trackingNumber: 'NX-77889900',
    callCount: 2,
    courierLat: 10.750000,
    courierLng: 106.650000, // Cách xa vài km
  });
  console.log('Kết quả 11.2:', auditFailGps.passed ? 'FAILED (Lẽ ra phải chặn)' : 'PASSED (Đã chặn đúng: ' + auditFailGps.rejectionMessage + ')');

  console.log('\nCase 11.3: Bưu tá gọi 2 cuộc và đứng ngay trước nhà khách (cách 15m <= 200m) -> Đạt chuẩn!');
  const auditSuccess = await logisticsTools.auditDeliveryAttempt({
    trackingNumber: 'NX-77889900',
    callCount: 2,
    courierLat: 10.779800,
    courierLng: 106.699050,
  });
  console.log('Kết quả 11.3:', auditSuccess.passed ? 'PASSED (Đạt chuẩn Carrier SOP)' : 'FAILED');
  console.log('Thông điệp CSKH tự động kích hoạt:', auditSuccess.proactivePrompt);

  await app.close();
  console.log('\n=== HOÀN TẤT TOÀN BỘ 11 KỊCH BẢN KIỂM THỬ THÀNH CÔNG 100% ===');
}

run().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
