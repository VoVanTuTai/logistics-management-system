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
        provider: process.env.GEMINI_API_KEY
          ? 'Google Gemini'
          : this.embeddingService.isApiKeyConfigured()
          ? 'OpenAI'
          : 'Offline Semantic Engine',
        chatModel: process.env.GEMINI_API_KEY
          ? process.env.GEMINI_MODEL || 'gemini-3.6-flash'
          : process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        embeddingModel: this.embeddingService.getModelName(),
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        openAiKeyConfigured: this.embeddingService.isApiKeyConfigured(),
        mode: process.env.GEMINI_API_KEY
          ? 'ONLINE_GOOGLE_GEMINI'
          : this.embeddingService.isApiKeyConfigured()
          ? 'ONLINE_OPENAI'
          : 'OFFLINE_SEMANTIC_HASH',
      },
    };
  }
}
