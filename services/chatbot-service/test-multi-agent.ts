import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ChatService } from './src/chat/chat.service';

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
  const res4 = await chatService.handleMessage({
    message: 'Tôi muốn hủy đơn hàng NX12345678',
    senderRole: 'CUSTOMER',
    userId: 'test-user-04'
  });
  console.log('Phản hồi từ Safety Gatekeeper / Flow:\n', res4.answer.slice(0, 300) + '...\n');

  await app.close();
  console.log('\n--- TOÀN BỘ CÁC TÁC TỬ ĐÃ HOÀN THÀNH KIỂM THỬ THỰC TẾ ---');
}

run().catch((err) => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
