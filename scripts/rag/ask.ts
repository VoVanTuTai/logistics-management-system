if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

import { EmbeddingService } from './embedding.service';
import { VectorStore } from './vector-store';
import type { RagResponse } from './types';

async function generateAnswerWithLLM(question: string, context: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return (
      `[OFFLINE DEMO - Chưa cung cấp OPENAI_API_KEY]:\n` +
      `Dựa vào tài liệu tìm kiếm được bên dưới, câu hỏi "${question}" có thể trả lời theo các căn cứ:\n` +
      context
        .split('\n---\n')
        .map((c, i) => `(Trích đoạn ${i + 1}): ${c.slice(0, 180)}...`)
        .join('\n')
    );
  }

  const systemPrompt = `Bạn là Trợ lý AI CSKH thông minh của hệ thống bưu chính Nexus Logistics.
Nhiệm vụ của bạn là giải đáp thắc mắc của khách hàng dựa HOÀN TOÀN vào tài liệu ngữ cảnh (Context) dưới đây.
Quy tắc bắt buộc:
1. Trả lời thân thiện, chuyên nghiệp, chính xác và súc tích bằng tiếng Việt.
2. Tuyệt đối không tự bịa đặt thông tin nếu tài liệu ngữ cảnh không đề cập đến.
3. Nếu tài liệu không đủ thông tin, hãy nói rõ: "Dạ hiện quy định của Nexus Logistics chưa có thông tin chi tiết về phần này, bạn vui lòng liên hệ hotline 1900 0000 để được hỗ trợ viên giải đáp trực tiếp ạ."
4. Nêu rõ căn cứ điều khoản/chính sách khi báo giá cước hoặc giải thích mức đền bù.`;

  const userPrompt = `TÀI LIỆU NGỮ CẢNH:
${context}

CÂU HỎI CỦA KHÁCH HÀNG:
${question}

HÃY TRẢ LỜI:`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2, // Thấp để tránh ảo giác
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return `[Lỗi gọi OpenAI LLM (${resp.status})]: ${err}`;
    }

    const data = (await resp.json()) as any;
    return data.choices[0].message.content;
  } catch (err: any) {
    return `[Lỗi kết nối OpenAI]: ${err.message}`;
  }
}

async function queryRag(question: string): Promise<RagResponse> {
  const vectorStore = new VectorStore();
  const totalChunks = vectorStore.getTotalChunks();

  if (totalChunks === 0) {
    console.warn('⚠️ Vector store trống! Đang tự động chạy ingest trước...');
    require('./ingest');
    return {
      question,
      answer: 'Hệ thống vừa cập nhật chỉ mục, vui lòng thử lại.',
      citations: [],
      contextChunksUsed: 0,
    };
  }

  const embeddingService = new EmbeddingService();
  const qEmbed = await embeddingService.getEmbedding(question);

  // Ngưỡng tương đồng cosine: 0.20 để bao quát tốt cả chế độ offline hash lẫn OpenAI embedding
  const matches = vectorStore.search(qEmbed.embedding, 3, 0.2);

  if (matches.length === 0) {
    return {
      question,
      answer: 'Xin lỗi, tôi không tìm thấy tài liệu nào trong hệ thống Nexus Logistics liên quan đến câu hỏi này.',
      citations: [],
      contextChunksUsed: 0,
    };
  }

  const contextText = matches
    .map(
      (m, idx) =>
        `[Đoạn ${idx + 1} - Nguồn: ${m.chunk.sourceFile} | Mục: ${m.chunk.sectionTitle}]\n${m.chunk.content}`
    )
    .join('\n\n---\n\n');

  const answer = await generateAnswerWithLLM(question, contextText);

  return {
    question,
    answer,
    citations: matches.map((m) => ({
      sourceFile: m.chunk.sourceFile,
      sectionTitle: m.chunk.sectionTitle,
      score: Number((m.score * 100).toFixed(1)),
    })),
    contextChunksUsed: matches.length,
  };
}

// CLI Execution
const inputQuestion = process.argv.slice(2).join(' ') || 'Hàng của tôi bị vỡ thì được bồi thường thế nào?';

console.log('===========================================================');
console.log('🔍 NEXUS LOGISTICS RAG - TRUY XUẤT & TRẢ LỜI CÂU HỎI');
console.log('===========================================================');
console.log(`❓ Câu hỏi: "${inputQuestion}"\n`);

queryRag(inputQuestion).then((res) => {
  console.log('📖 CÁC ĐOẠN TÀI LIỆU TRÍCH XUẤT (CITATIONS):');
  res.citations.forEach((c, idx) => {
    console.log(`   [${idx + 1}] ${c.sectionTitle} (${c.sourceFile}) - Độ khớp: ${c.score}%`);
  });

  console.log('\n🤖 CÂU TRẢ LỜI TỪ AI (GPT-4o-mini):');
  console.log('-----------------------------------------------------------');
  console.log(res.answer);
  console.log('-----------------------------------------------------------');
});
