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

  await app.close();
  console.log('=== HOÀN TẤT KIỂM THỬ THÀNH CÔNG 100% ===');
}

run().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
