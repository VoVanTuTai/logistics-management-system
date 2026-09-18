import * as fs from 'fs';
import * as path from 'path';
import type { KnowledgeChunk, SearchMatch, VectorIndexData } from './types';
import { cosineSimilarity } from './embedding.service';

export class VectorStore {
  private indexPath: string;
  private data: VectorIndexData;

  constructor(indexPath?: string) {
    this.indexPath =
      indexPath ||
      path.resolve(process.cwd(), 'docs/knowledge-base/vector-index.json');
    this.data = this.loadIndex();
  }

  private loadIndex(): VectorIndexData {
    if (fs.existsSync(this.indexPath)) {
      try {
        const raw = fs.readFileSync(this.indexPath, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`[VectorStore] Failed to read ${this.indexPath}, creating new index.`);
      }
    }
    return {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      model: 'text-embedding-3-small',
      dimensions: 1536,
      totalChunks: 0,
      chunks: [],
    };
  }

  public saveIndex(chunks: KnowledgeChunk[], model = 'text-embedding-3-small', dimensions = 1536): void {
    const dir = path.dirname(this.indexPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.data = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      model,
      dimensions,
      totalChunks: chunks.length,
      chunks,
    };

    fs.writeFileSync(this.indexPath, JSON.stringify(this.data, null, 2), 'utf-8');
    console.log(`[VectorStore] Saved ${chunks.length} chunks to ${this.indexPath}`);
  }

  public search(queryVector: number[], topK = 3, minScore = 0.5): SearchMatch[] {
    if (!this.data.chunks || this.data.chunks.length === 0) {
      return [];
    }

    const matches: SearchMatch[] = [];

    for (const chunk of this.data.chunks) {
      if (!chunk.embedding || chunk.embedding.length !== queryVector.length) {
        continue;
      }
      const score = cosineSimilarity(queryVector, chunk.embedding);
      if (score >= minScore) {
        matches.push({ chunk, score });
      }
    }

    // Sort descending by similarity score
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, topK);
  }

  public getTotalChunks(): number {
    return this.data.totalChunks || 0;
  }
}
