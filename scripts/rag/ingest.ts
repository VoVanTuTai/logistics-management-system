import * as fs from 'fs';
import * as path from 'path';
import { chunkMarkdownDocument } from './chunker';
import { EmbeddingService } from './embedding.service';
import { VectorStore } from './vector-store';
import type { KnowledgeChunk } from './types';

async function runIngestion() {
  console.log('===========================================================');
  console.log('🚀 NEXUS LOGISTICS AI - KNOWLEDGE BASE INGESTION PIPELINE');
  console.log('===========================================================');

  const kbDir = path.resolve(process.cwd(), 'docs/knowledge-base');
  if (!fs.existsSync(kbDir)) {
    console.error(`❌ Không tìm thấy thư mục: ${kbDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(kbDir)
    .filter((f) => f.endsWith('.md') && !f.toLowerCase().startsWith('readme'));

  if (files.length === 0) {
    console.warn('⚠️ Không tìm thấy file markdown nào trong docs/knowledge-base');
    process.exit(0);
  }

  console.log(`📂 Tìm thấy ${files.length} tài liệu quy chuẩn:\n` + files.map((f) => `   - ${f}`).join('\n'));

  const embeddingService = new EmbeddingService();
  const allChunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const filePath = path.join(kbDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkMarkdownDocument(file, content);
    console.log(`\n📄 Xử lý [${file}]: ${chunks.length} chunks (Trung bình ~${Math.round(content.split(/\s+/).length / chunks.length)} từ/chunk)`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      process.stdout.write(`   Embedding chunk ${i + 1}/${chunks.length} [${chunk.sectionTitle.slice(0, 35)}...] `);
      const res = await embeddingService.getEmbedding(
        `${chunk.sectionTitle}\n${chunk.content}`
      );
      chunk.embedding = res.embedding;
      process.stdout.write(res.isMock ? `(Offline hash)\n` : `(OpenAI 1536d)\n`);
      allChunks.push(chunk);
    }
  }

  console.log('\n💾 Đang ghi chỉ mục vào Vector Store...');
  const vectorStore = new VectorStore();
  vectorStore.saveIndex(allChunks);

  console.log('===========================================================');
  console.log(`✅ HOÀN TẤT NẠP TRI THỨC: Tổng cộng ${allChunks.length} chunks đã sẵn sàng!`);
  console.log('💡 Mỗi khi bạn thêm file .md mới, chỉ cần chạy lại script này.');
  console.log('===========================================================');
}

runIngestion().catch((err) => {
  console.error('❌ Ingestion thất bại:', err);
  process.exit(1);
});
