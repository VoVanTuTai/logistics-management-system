import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ChatService } from './src/chat/chat.service';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('--- KHỞI TẠO TEST SUITE ĐA TÁC TỬ (HMAS TEST SUITE) ---');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const chatService = app.get(ChatService);

  console.log('\n======================================================');
  console.log('1. KIỂM TRA SỨC KHỎE 4 TÁC TỬ (MULTI-AGENT HEALTH CHECK)');
  console.log('======================================================');
  const health = await chatService.checkMultiAgentHealth();
  console.log('Kết quả Health Check:\n', JSON.stringify(health, null, 2));

  console.log('\n======================================================');
  console.log('2. TEST KNOWLEDGE WORKER (Alibaba Qwen 27B / Groq LPU)');
  console.log('Câu hỏi: "Theo quy chuẩn Điều 25 Nghị định 47 và quy chế bồi thường hàng dễ vỡ thì bưu cục bồi thường thế nào?"');
  console.log('======================================================');
  await delay(1000);
  const res1 = await chatService.handleMessage({
    message: 'Theo quy chuẩn Điều 25 Nghị định 47 và quy chế bồi thường hàng dễ vỡ thì bưu cục bồi thường thế nào?',
    senderRole: 'CUSTOMER',
    userId: 'test-user-01'
  });
  console.log('Phản hồi từ Knowledge Worker:\n', res1.answer.slice(0, 300) + '...\n');

  console.log('\n======================================================');
  console.log('3. TEST OPERATION WORKER (OpenAI GPT-OSS 120B / Groq LPU)');
  console.log('Câu hỏi: "Tôi muốn tính cước từ Hà Nội đi Đà Nẵng nặng 5kg kích thước 30x20x10cm"');
  console.log('======================================================');
  await delay(1000);
  const res2 = await chatService.handleMessage({
    message: 'Tôi muốn tính cước từ Hà Nội đi Đà Nẵng nặng 5kg kích thước 30x20x10cm',
    senderRole: 'CUSTOMER',
    userId: 'test-user-02'
  });
  console.log('Phản hồi từ Operation Worker:\n', res2.answer.slice(0, 300) + '...\n');

  console.log('\n======================================================');
  console.log('4. TEST SUPERVISOR AGENT (Google Gemini Flash / Google AI Studio)');
  console.log('Câu hỏi: "Xin chào em, em là ai và em có thể giúp anh những gì trong hệ thống Nexus Logistics?"');
  console.log('======================================================');
  await delay(1000);
  const res3 = await chatService.handleMessage({
    message: 'Xin chào em, em là ai và em có thể giúp anh những gì trong hệ thống Nexus Logistics?',
    senderRole: 'CUSTOMER',
    userId: 'test-user-03'
  });
  console.log('Phản hồi từ Supervisor Agent:\n', res3.answer.slice(0, 300) + '...\n');

  console.log('\n======================================================');
  console.log('5. TEST SAFETY GATEKEEPER (NVIDIA Nemotron 3.5 / OpenRouter)');
  console.log('Câu hỏi: "Tôi muốn hủy đơn hàng NX12345678"');
  console.log('======================================================');
  await delay(1000);
  const res4 = await chatService.handleMessage({
    message: 'Tôi muốn hủy đơn hàng NX12345678',
    senderRole: 'CUSTOMER',
    userId: 'test-user-04'
  });
  console.log('Phản hồi từ Safety Gatekeeper / Flow:\n', res4.answer.slice(0, 300) + '...\n');

  console.log('\n======================================================');
  console.log('6. TEST NGHIỆP VỤ BÁO ĐƠN ĐANG PHÁT CHO KHÁCH NHẬN & KHÁCH GỬI');
  console.log('======================================================');
  console.log('[6A. KHÁCH NHẬN] Tra cứu đơn NX-77889900 kèm SĐT người nhận:');
  await delay(1000);
  const res6A = await chatService.handleMessage({
    message: 'Tra cứu đơn hàng NX-77889900 người nhận 0909887766',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'conv-delivery-recipient'
  });
  console.log('Phản hồi cho Khách Nhận:\n', res6A.answer + '\n');
  console.log('Action Chips gợi ý:', res6A.actionChips);

  console.log('\n[6B. KHÁCH GỬI / SHOP] Tra cứu đơn NX-77889900 với tài khoản Người gửi:');
  await delay(1000);
  const res6B = await chatService.handleMessage({
    message: 'Shop kiểm tra đơn hàng NX-77889900',
    senderRole: 'MERCHANT',
    userId: '0901234567',
    userPhone: '0901234567',
    conversationId: 'conv-delivery-sender'
  });
  console.log('Phản hồi cho Khách Gửi (Shop):\n', res6B.answer + '\n');

  console.log('\n======================================================');
  console.log('7. TEST KHÁCH BẬN HẸN GIAO LẠI NGÀY MAI QUA CHATBOT (CARRIER SOP)');
  console.log('Câu hỏi: "Hôm nay mình bận, hẹn ngày mai giao nhé"');
  console.log('======================================================');
  await delay(1000);
  const res7 = await chatService.handleMessage({
    message: 'Hôm nay mình bận, hẹn ngày mai giao nhé',
    senderRole: 'CUSTOMER',
    userId: '0909887766',
    conversationId: 'conv-delivery-recipient' // Tiếp tục phiên vừa tra cứu đơn NX-77889900
  });
  console.log('Phản hồi Hẹn Giao Lại Carrier SOP:\n', res7.answer + '\n');
  console.log('Tools đã dùng:', res7.toolsUsed);
  console.log('Action Chips:', res7.actionChips);

  await app.close();
  console.log('\n--- TOÀN BỘ CÁC TÁC TỬ & NGHIỆP VỤ MỚI ĐÃ HOÀN THÀNH KIỂM THỬ THỰC TẾ ---');
}

run().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
