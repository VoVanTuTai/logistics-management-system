import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ChunkerService } from './chunker.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import type { KnowledgeChunk } from './rag.types';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly chunker: ChunkerService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStoreService
  ) {}

  private resolveDocsDir(): string {
    const custom = process.env.KNOWLEDGE_BASE_DIR;
    if (custom) {
      return path.isAbsolute(custom) ? custom : path.resolve(process.cwd(), custom);
    }

    const candidates = [
      path.resolve(process.cwd(), '../../docs/knowledge-base'),
      path.resolve(process.cwd(), 'docs/knowledge-base'),
      path.resolve(__dirname, '../../../../docs/knowledge-base'),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return candidates[0];
  }

  public async reindexAll(): Promise<{ filesProcessed: number; totalChunks: number; timeMs: number }> {
    const startTime = Date.now();
    const docsDir = this.resolveDocsDir();

    if (!fs.existsSync(docsDir)) {
      throw new Error(`Directory not found: ${docsDir}`);
    }

    const files = fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith('.md') && !f.toLowerCase().startsWith('readme'));

    this.logger.log(`Starting re-index of ${files.length} markdown documents from ${docsDir}`);

    const allChunks: KnowledgeChunk[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
      const chunks = this.chunker.chunkMarkdown(file, content);

      for (const chunk of chunks) {
        const embedRes = await this.embeddingService.getEmbedding(
          `${chunk.sectionTitle}\n${chunk.content}`
        );
        chunk.embedding = embedRes.embedding;
        allChunks.push(chunk);
      }
    }

    this.vectorStore.saveIndex(allChunks, this.embeddingService.getModelName());

    const duration = Date.now() - startTime;
    this.logger.log(`Re-indexing completed: ${allChunks.length} chunks generated in ${duration}ms`);

    return {
      filesProcessed: files.length,
      totalChunks: allChunks.length,
      timeMs: duration,
    };
  }

  public getStatus() {
    const docsDir = this.resolveDocsDir();
    const files = fs.existsSync(docsDir)
      ? fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'))
      : [];

    return {
      docsDir,
      totalMarkdownFiles: files.length,
      files,
      vectorStore: this.vectorStore.getStats(),
      apiKeyConfigured: this.embeddingService.isApiKeyConfigured(),
    };
  }
}
