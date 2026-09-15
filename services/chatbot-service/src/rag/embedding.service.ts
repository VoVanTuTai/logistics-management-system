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

function generateFallbackEmbedding(text: string, dimensions = 512): number[] {
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

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  public isApiKeyConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getModelName(): string {
    return this.model;
  }

  public async getEmbedding(text: string): Promise<{ embedding: number[]; isMock: boolean }> {
    if (!this.apiKey) {
      return {
        embedding: generateFallbackEmbedding(text, 512),
        isMock: true,
      };
    }

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

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`OpenAI Embedding API error (${response.status}): ${errorText}. Falling back to offline hash.`);
        return {
          embedding: generateFallbackEmbedding(text, 512),
          isMock: true,
        };
      }

      const data = (await response.json()) as any;
      return {
        embedding: data.data[0].embedding,
        isMock: false,
      };
    } catch (err: any) {
      this.logger.warn(`Failed to connect to OpenAI Embedding API: ${err.message}. Using offline fallback.`);
      return {
        embedding: generateFallbackEmbedding(text, 512),
        isMock: true,
      };
    }
  }
}
