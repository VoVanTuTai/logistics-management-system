import { Controller, Get } from '@nestjs/common';
import { KnowledgeService } from '../rag/knowledge.service';
import { EmbeddingService } from '../rag/embedding.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly embeddingService: EmbeddingService
  ) {}

  @Get()
  getHealth() {
    const kbStatus = this.knowledgeService.getStatus();
    return {
      status: 'ok',
      service: 'chatbot-service',
      port: process.env.PORT || 3013,
      timestamp: new Date().toISOString(),
      knowledgeBase: {
        totalChunks: kbStatus.vectorStore.totalChunks,
        totalFiles: kbStatus.totalMarkdownFiles,
        updatedAt: kbStatus.vectorStore.updatedAt,
        model: kbStatus.vectorStore.model,
      },
      aiEngine: {
        chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        embeddingModel: this.embeddingService.getModelName(),
        openAiKeyConfigured: this.embeddingService.isApiKeyConfigured(),
        mode: this.embeddingService.isApiKeyConfigured() ? 'ONLINE_OPENAI' : 'OFFLINE_SEMANTIC_HASH',
      },
    };
  }
}
