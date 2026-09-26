import { Injectable, Logger } from '@nestjs/common';

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function generateFallbackEmbedding(text: string, dimensions = 768): number[] {
  const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = clean.split(/[^a-z0-9]+/);
  const vector = new Array(dimensions).fill(0);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  }

  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vector.map((v) => v / norm);
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private apiKey: string;
  private model: string;
  private geminiApiKey: string;
  private geminiEmbeddingModel: string;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'models/gemini-embedding-001';
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  public isApiKeyConfigured(): boolean {
    return Boolean(this.geminiApiKey || this.apiKey);
  }

  public getModelName(): string {
    if (this.geminiApiKey) return this.geminiEmbeddingModel;
    if (this.apiKey) return this.model;
    return 'offline-semantic-hash';
  }

  public async getEmbedding(text: string): Promise<{ embedding: number[]; isMock: boolean }> {
    // 1. Ưu tiên Google Gemini Embedding API
    if (this.geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${this.geminiEmbeddingModel}:embedContent?key=${this.geminiApiKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.geminiEmbeddingModel,
            content: { parts: [{ text }] },
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (resp.ok) {
          const data = (await resp.json()) as any;
          if (data.embedding?.values) {
            return {
              embedding: data.embedding.values,
              isMock: false,
            };
          }
        } else {
          const errText = await resp.text();
          this.logger.warn(`Google Gemini Embedding API error (${resp.status}): ${errText}`);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to connect to Google Gemini Embedding API: ${err.message}`);
      }
    }

    // 2. Dự phòng OpenAI Embedding API
    if (this.apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: text,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          return {
            embedding: data.data[0].embedding,
            isMock: false,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to connect to OpenAI Embedding API: ${err.message}`);
      }
    }

    // 3. Fallback
    return {
      embedding: generateFallbackEmbedding(text, 768),
      isMock: true,
    };
  }

  /**
   * Tính toán embedding hàng loạt (Batch Embeddings) qua Gemini API để Reindex siêu tốc
   */
  public async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (this.geminiApiKey && texts.length > 0) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${this.geminiEmbeddingModel}:batchEmbedContents?key=${this.geminiApiKey}`;
        const requests = texts.map((t) => ({
          model: this.geminiEmbeddingModel,
          content: { parts: [{ text: t }] },
        }));

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
          signal: AbortSignal.timeout(30000),
        });

        if (resp.ok) {
          const data = (await resp.json()) as any;
          if (data.embeddings && Array.isArray(data.embeddings)) {
            return data.embeddings.map((e: any) => e.values);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Batch embedding via Gemini failed: ${err.message}. Processing individually.`);
      }
    }

    // Fallback xử lý từng phần
    const results: number[][] = [];
    for (const t of texts) {
      const res = await this.getEmbedding(t);
      results.push(res.embedding);
    }
    return results;
  }
}
