if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  isMock: boolean;
}

/**
 * Tính khoảng cách Cosine Similarity giữa 2 vector:
 * Score = 1.0 (trùng khớp hoàn toàn), 0.0 (không liên quan)
 */
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

/**
 * Fallback Semantic Vector Generator:
 * Dùng khi chưa có OPENAI_API_KEY để hệ thống vẫn có thể test chạy cục bộ (In-Memory/Offline).
 */
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

  // Chuẩn hóa L2 norm
  let norm = 0;
  for (let v of vector) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vector.map((v) => v / norm);
}

export class EmbeddingService {
  private apiKey: string;
  private model: string;
  private dimensions: number;

  constructor(model = 'text-embedding-3-small', dimensions = 1536) {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = model;
    this.dimensions = dimensions;
  }

  public async getEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      // Offline fallback
      return {
        embedding: generateFallbackEmbedding(text, 512),
        model: 'offline-semantic-hash',
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
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[OpenAI Embedding Error]: ${response.status} - Falling back to offline embedding. ${errorText}`);
        return {
          embedding: generateFallbackEmbedding(text, 512),
          model: 'offline-fallback',
          isMock: true,
        };
      }

      const data = (await response.json()) as any;
      return {
        embedding: data.data[0].embedding,
        model: this.model,
        isMock: false,
      };
    } catch (err: any) {
      console.warn(`[OpenAI Embedding Connection Failed]: ${err.message} - Using offline embedding.`);
      return {
        embedding: generateFallbackEmbedding(text, 512),
        model: 'offline-fallback',
        isMock: true,
      };
    }
  }
}
