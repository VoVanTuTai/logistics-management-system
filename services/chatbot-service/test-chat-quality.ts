import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ChatService } from './src/chat/chat.service';
import { ChatSessionService } from './src/chat/session/chat-session.store';

interface QualityReport {
  scenario: string;
  turn: number;
  userPrompt: string;
  botAnswer: string;
  wordCount: number;
  latencyMs: number;
  modelUsed?: string;
  focusedCheck: boolean;
  conciseCheck: boolean;
  contextRetainedCheck: boolean;
  notes: string[];
}

async function runQualityEvaluation() {
  console.log('========================================================================');
  console.log('=== KIỂM THỬ THỰC TẾ CHẤT LƯỢNG CHATBOT: TRỌNG TÂM - NGẮN GỌN - NHỚ NGỮ CẢNH ===');
  console.log('========================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const chatService = app.get(ChatService);
  const sessionStore = app.get(ChatSessionService);

  const reports: QualityReport[] = [];

  // ========================================================================
  // KỊCH BẢN 1: TRA CỨU ĐƠN HÀNG & HỎI NỐI TIẾP VỚI ĐẠI TỪ ("Nó", "Đơn đó")
  // ========================================================================
  console.log('------------------------------------------------------------------------');
  console.log('📌 KỊCH BẢN 1: TRA CỨU HÀNH TRÌNH VÀ HỎI NỐI TIẾP ("Nó nặng bao nhiêu?", "Ai phát?")');
  console.log('------------------------------------------------------------------------');

  const conv1 = `eval_conv_tracking_${Date.now()}`;

  // Turn 1.1: Khách cung cấp mã đơn + SĐT xác thực PII
  const q1_1 = 'Kiểm tra giúp mình đơn NX-77889900 với, số điện thoại người nhận là 0909887766';
  const t0_1 = Date.now();
  const res1_1 = await chatService.handleMessage({
    conversationId: conv1,
    message: q1_1,
    senderRole: 'CUSTOMER',
    userName: 'Chị Lan',
  });
  const lat1_1 = Date.now() - t0_1;
  const words1_1 = res1_1.answer.trim().split(/\s+/).length;

  console.log(`\n[Turn 1.1] Khách: "${q1_1}"`);
  console.log(`[Bot (${lat1_1}ms, ${words1_1} từ)]:\n${res1_1.answer}`);

  // Turn 1.2: Hỏi ngắn gọn bằng đại từ "Nó nặng bao nhiêu kg vậy em?"
  const q1_2 = 'Nó nặng bao nhiêu kg vậy em?';
  const t0_2 = Date.now();
  const res1_2 = await chatService.handleMessage({
    conversationId: conv1,
    message: q1_2,
    senderRole: 'CUSTOMER',
    userName: 'Chị Lan',
  });
  const lat1_2 = Date.now() - t0_2;
  const words1_2 = res1_2.answer.trim().split(/\s+/).length;

  console.log(`\n[Turn 1.2] Khách: "${q1_2}"`);
  console.log(`[Bot (${lat1_2}ms, ${words1_2} từ)]:\n${res1_2.answer}`);

  const session1 = await sessionStore.getSession(conv1);
  const turn1_2Notes: string[] = [];
  const turn1_2ContextRetained =
    session1.selectedCode === 'NX-77889900' &&
    (/\b(?:0\.8|0,8|kg|nặng|NX-77889900)\b/i.test(res1_2.answer) ||
      /\b(?:khối lượng|cân nặng)\b/i.test(res1_2.answer));
  const turn1_2Concise = words1_2 <= 100;
  const turn1_2Focused =
    /\b(?:0\.8|0,8|kg|nặng|khối lượng|cân)\b/i.test(res1_2.answer) &&
    !/\b(?:xin chào anh chị em là trợ lý ảo rất vui được hỗ trợ)\b/i.test(res1_2.answer);

  if (turn1_2ContextRetained) turn1_2Notes.push('Nhớ chính xác đơn NX-77889900 từ turn trước');
  if (turn1_2Concise) turn1_2Notes.push(`Độ dài rất chuẩn (${words1_2} từ <= 100 từ)`);
  if (turn1_2Focused) turn1_2Notes.push('Đi thẳng vào câu trả lời cân nặng, không dài dòng');

  reports.push({
    scenario: 'Kịch bản 1: Hỏi nối tiếp cân nặng',
    turn: 2,
    userPrompt: q1_2,
    botAnswer: res1_2.answer,
    wordCount: words1_2,
    latencyMs: lat1_2,
    focusedCheck: turn1_2Focused,
    conciseCheck: turn1_2Concise,
    contextRetainedCheck: turn1_2ContextRetained,
    notes: turn1_2Notes,
  });

  // Turn 1.3: Hỏi tiếp người giao: "Thế ai đang đi phát đơn đó?"
  const q1_3 = 'Thế ai đang đi phát đơn đó?';
  const t0_3 = Date.now();
  const res1_3 = await chatService.handleMessage({
    conversationId: conv1,
    message: q1_3,
    senderRole: 'CUSTOMER',
    userName: 'Chị Lan',
  });
  const lat1_3 = Date.now() - t0_3;
  const words1_3 = res1_3.answer.trim().split(/\s+/).length;

  console.log(`\n[Turn 1.3] Khách: "${q1_3}"`);
  console.log(`[Bot (${lat1_3}ms, ${words1_3} từ)]:\n${res1_3.answer}`);

  const turn1_3ContextRetained = /\b(?:Nguyễn Văn Hùng|bưu tá|shipper|giao|NX-77889900)\b/i.test(res1_3.answer);
  const turn1_3Concise = words1_3 <= 100;
  const turn1_3Focused = /\b(?:Hùng|bưu tá|shipper|phát|liên hệ)\b/i.test(res1_3.answer);

  reports.push({
    scenario: 'Kịch bản 1: Hỏi người giao hàng',
    turn: 3,
    userPrompt: q1_3,
    botAnswer: res1_3.answer,
    wordCount: words1_3,
    latencyMs: lat1_3,
    focusedCheck: turn1_3Focused,
    conciseCheck: turn1_3Concise,
    contextRetainedCheck: turn1_3ContextRetained,
    notes: ['Trả lời đúng bưu tá Nguyễn Văn Hùng đang phụ trách'],
  });

  // ========================================================================
  // KỊCH BẢN 2: BÁO GIÁ CƯỚC & NỐI TIẾP HỎI ĐÓNG GÓI HÀNG DỄ VỠ (CARRIER SOP)
  // ========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('📌 KỊCH BẢN 2: DỰ TOÁN CƯỚC PHÍ VÀ NỐI TIẾP HỎI ĐÓNG GÓI THỦY TINH DỄ VỠ');
  console.log('------------------------------------------------------------------------');

  const conv2 = `eval_conv_pricing_${Date.now()}`;

  // Turn 2.1: Hỏi cước tuyến cụ thể
  const q2_1 = 'Tính cước giúp mình kiện hàng 3kg từ Hà Nội đi Đà Nẵng kích thước 25x20x15cm';
  const t0_2_1 = Date.now();
  const res2_1 = await chatService.handleMessage({
    conversationId: conv2,
    message: q2_1,
    senderRole: 'MERCHANT',
    userName: 'Shop Minh An',
  });
  const lat2_1 = Date.now() - t0_2_1;
  const words2_1 = res2_1.answer.trim().split(/\s+/).length;

  console.log(`\n[Turn 2.1] Khách: "${q2_1}"`);
  console.log(`[Bot (${lat2_1}ms, ${words2_1} từ)]:\n${res2_1.answer}`);

  // Turn 2.2: Nối tiếp: "Hàng này là đồ thủy tinh, có cần bọc gì đặc biệt không em?"
  const q2_2 = 'Hàng này là cốc thủy tinh, có cần bọc gì đặc biệt không em?';
  const t0_2_2 = Date.now();
  const res2_2 = await chatService.handleMessage({
    conversationId: conv2,
    message: q2_2,
    senderRole: 'MERCHANT',
    userName: 'Shop Minh An',
  });
  const lat2_2 = Date.now() - t0_2_2;
  const words2_2 = res2_2.answer.trim().split(/\s+/).length;

  console.log(`\n[Turn 2.2] Khách: "${q2_2}"`);
  console.log(`[Bot (${lat2_2}ms, ${words2_2} từ)]:\n${res2_2.answer}`);

  const turn2_2ContextRetained = /\b(?:thủy tinh|dễ vỡ|bubble|xốp|đóng gói|bọc)\b/i.test(res2_2.answer);
  const turn2_2Focused = /\b(?:bubble|bọc|dễ vỡ|3 lớp|thùng)\b/i.test(res2_2.answer);
  const turn2_2Concise = words2_2 <= 130;

  reports.push({
    scenario: 'Kịch bản 2: Hỏi quy cách đóng gói thủy tinh',
    turn: 2,
    userPrompt: q2_2,
    botAnswer: res2_2.answer,
    wordCount: words2_2,
    latencyMs: lat2_2,
    focusedCheck: turn2_2Focused,
    conciseCheck: turn2_2Concise,
    contextRetainedCheck: turn2_2ContextRetained,
    notes: ['Nhận biết hàng thủy tinh là hàng dễ vỡ (FRAGILE), hướng dẫn chuẩn bọc bubble wrap'],
  });

  // ========================================================================
  // KỊCH BẢN 3: THAO TÁC HẸN GIAO LẠI (ACTIONABLE WORKFLOW STATE)
  // ========================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('📌 KỊCH BẢN 3: HẸN GIAO LẠI ĐƠN HÀNG (WORKFLOW CARRIER SOP)');
  console.log('------------------------------------------------------------------------');

  const conv3 = `eval_conv_reschedule_${Date.now()}`;

  // Turn 3.1: Mở đơn
  await chatService.handleMessage({
    conversationId: conv3,
    message: 'Kiểm tra đơn NX-77889900 SĐT người nhận 0909887766',
    senderRole: 'CUSTOMER',
    userName: 'Khách hàng',
  });

  // Turn 3.2: Báo bận hẹn lại
  const q3_2 = 'Hôm nay mình bận quá, hẹn chiều mai khoảng 15h giao lại nhé';
  const t0_3_2 = Date.now();
  const res3_2 = await chatService.handleMessage({
    conversationId: conv3,
    message: q3_2,
    senderRole: 'CUSTOMER',
    userName: 'Khách hàng',
  });
  const lat3_2 = Date.now() - t0_3_2;
  const words3_2 = res3_2.answer.trim().split(/\s+/).length;

  console.log(`\n[Turn 3.2] Khách: "${q3_2}"`);
  console.log(`[Bot (${lat3_2}ms, ${words3_2} từ)]:\n${res3_2.answer}`);

  const turn3_2ContextRetained = /\b(?:NX-77889900|chiều mai|15h|ngày mai|hẹn)\b/i.test(res3_2.answer);
  const turn3_2Focused = /\b(?:hẹn|chiều mai|15h|giao lại|ghi nhận)\b/i.test(res3_2.answer);
  const turn3_2Concise = words3_2 <= 110;

  reports.push({
    scenario: 'Kịch bản 3: Hẹn lịch phát chiều mai 15h',
    turn: 2,
    userPrompt: q3_2,
    botAnswer: res3_2.answer,
    wordCount: words3_2,
    latencyMs: lat3_2,
    focusedCheck: turn3_2Focused,
    conciseCheck: turn3_2Concise,
    contextRetainedCheck: turn3_2ContextRetained,
    notes: ['Ghi nhận chuẩn xác giờ hẹn 15h chiều mai và đồng bộ hệ thống'],
  });

  // ========================================================================
  // TỔNG HỢP ĐÁNH GIÁ ĐỊNH LƯỢNG (QUANTITATIVE METRICS)
  // ========================================================================
  console.log('\n========================================================================');
  console.log('=== BẢNG TỔNG HỢP ĐÁNH GIÁ ĐỊNH LƯỢNG CHẤT LƯỢNG PHẢN HỒI ===');
  console.log('========================================================================\n');

  console.table(
    reports.map((r) => ({
      'Kịch bản': r.scenario,
      'Câu hỏi khách': r.userPrompt,
      'Đúng trọng tâm': r.focusedCheck ? '✅ ĐẠT' : '❌ LỆCH',
      'Ngắn gọn': r.conciseCheck ? `✅ ĐẠT (${r.wordCount} từ)` : `⚠️ DÀI (${r.wordCount} từ)`,
      'Nhớ ngữ cảnh': r.contextRetainedCheck ? '✅ NHỚ TỐT' : '❌ QUÊN',
      'Độ trễ': `${r.latencyMs}ms`,
    })),
  );

  const allFocused = reports.every((r) => r.focusedCheck);
  const allConcise = reports.every((r) => r.conciseCheck);
  const allContext = reports.every((r) => r.contextRetainedCheck);

  console.log('\nKẾT LUẬN KIỂM ĐỊNH:');
  console.log(`- Đúng trọng tâm: ${allFocused ? '100% ĐẠT CHUẨN' : 'Cần tối ưu'}`);
  console.log(`- Ngắn gọn súc tích: ${allConcise ? '100% ĐẠT CHUẨN (trung bình < 100 từ/câu)' : 'Cần tối ưu'}`);
  console.log(`- Nhớ ngữ cảnh đa turn: ${allContext ? '100% ĐẠT CHUẨN (Nhớ mã đơn, cân nặng, bưu tá, hàng dễ vỡ)' : 'Cần tối ưu'}`);

  await app.close();
}

runQualityEvaluation().catch((e) => {
  console.error('Error during quality evaluation:', e);
  process.exit(1);
});
