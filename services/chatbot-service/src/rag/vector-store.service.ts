import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { KnowledgeChunk, SearchMatch, VectorIndexData } from './rag.types';
import { cosineSimilarity } from './embedding.service';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private indexPath: string = '';
  private indexData: VectorIndexData = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    model: 'text-embedding-3-small',
    dimensions: 1536,
    totalChunks: 0,
    chunks: [],
  };

  onModuleInit() {
    this.resolveIndexPath();
    this.loadIndex();
  }

  private resolveIndexPath(): void {
    const customPath = process.env.VECTOR_INDEX_FILE;
    if (customPath) {
      this.indexPath = path.isAbsolute(customPath)
        ? customPath
        : path.resolve(process.cwd(), customPath);
      return;
    }

    // Try finding in standard locations
    const candidates = [
      path.resolve(process.cwd(), '../../docs/knowledge-base/vector-index.json'),
      path.resolve(process.cwd(), 'docs/knowledge-base/vector-index.json'),
      path.resolve(__dirname, '../../../../docs/knowledge-base/vector-index.json'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        this.indexPath = p;
        return;
      }
    }

    this.indexPath = candidates[0];
  }

  public loadIndex(): void {
    if (fs.existsSync(this.indexPath)) {
      try {
        const raw = fs.readFileSync(this.indexPath, 'utf-8');
        this.indexData = JSON.parse(raw);
        this.logger.log(`Loaded ${this.indexData.totalChunks} chunks from ${this.indexPath}`);
        return;
      } catch (err: any) {
        this.logger.warn(`Failed reading index file ${this.indexPath}: ${err.message}`);
      }
    }
    this.logger.warn(`Index file not found at ${this.indexPath}. Operating with empty store.`);
  }

  public saveIndex(chunks: KnowledgeChunk[], model = 'text-embedding-3-small', dimensions = 1536): void {
    const dir = path.dirname(this.indexPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.indexData = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      model,
      dimensions,
      totalChunks: chunks.length,
      chunks,
    };

    fs.writeFileSync(this.indexPath, JSON.stringify(this.indexData, null, 2), 'utf-8');
    this.logger.log(`Persisted ${chunks.length} chunks to ${this.indexPath}`);
  }

  public search(queryVector: number[], topK = 5, minScore = 0.18): SearchMatch[] {
    if (!this.indexData.chunks || this.indexData.chunks.length === 0) {
      return [];
    }

    const matches: SearchMatch[] = [];

    for (const chunk of this.indexData.chunks) {
      if (!chunk.embedding || chunk.embedding.length !== queryVector.length) {
        continue;
      }
      const score = cosineSimilarity(queryVector, chunk.embedding);
      if (score >= minScore) {
        matches.push({ chunk, score });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  public hybridSearch(queryVector: number[], queryText: string, topK = 5, minScore = 0.15): SearchMatch[] {
    if (!this.indexData.chunks || this.indexData.chunks.length === 0) {
      return [];
    }

    const normalizedQuery = queryText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');

    const rawTerms = normalizedQuery
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 2 && !['cho', 'cua', 'nay', 'voi', 'khi', 'duoc', 'trong', 'thi', 'sao', 'la', 'nhu'].includes(w));

    // Mở rộng từ điển đồng nghĩa Logistics (Thesaurus Expansion)
    const SYNONYMS: Record<string, string[]> = {
      hong: ['hu hong', 'be vo', 'mop meo', 'thiet hai', 'boi thuong', 'den bu', 'dong kiem', 'bien ban bat thuong', 'bao hiem', 'irregularity'],
      hu: ['hu hong', 'be vo', 'mop meo', 'thiet hai', 'boi thuong', 'den bu'],
      vo: ['be vo', 'hu hong', 'hang de vo', 'fragile', 'dong goi', 'xop hoi', '5cm', 'boi thuong', 'bien ban'],
      be: ['be vo', 'hu hong', 'dong kiem', 'boi thuong', 'bien ban'],
      mop: ['mop meo', 'be vo', 'hu hong', 'bien ban bat thuong'],
      mat: ['that lac', 'mat hang', 'lost', 'mat tich', 'den bu 100%'],
      lac: ['that lac', 'mat hang', 'lost'],
      bom: ['tu choi nhan', 'chuyen hoan', 'cuoc hoan', 'bom hang', 'ndr'],
      den: ['boi thuong', 'den bu', 'han muc', '100%', '30 trieu', '4 lan cuoc', 'clm'],
      cuoc: ['cuoc phi', 'bang gia', 'tinh cuoc', 'du toan', 'iata'],
      kho: ['luu kho', 'ton kho', 'qua han', 'vo chu', 'dieu 18', 'dieu 28'],
      cod: ['tien thu ho', 'doi soat', 'tran no', '15 trieu', 'khoa app'],
      bao: ['bao hiem', 'khai gia', 'toan dien', '0.5%', '1.0%', '30 trieu'],
    };

    const expandedTerms = new Set<string>(rawTerms);
    for (const t of rawTerms) {
      if (SYNONYMS[t]) {
        for (const syn of SYNONYMS[t]) {
          expandedTerms.add(syn);
        }
      }
    }

    const keyTerms = Array.from(expandedTerms);
    const matches: SearchMatch[] = [];

    for (const chunk of this.indexData.chunks) {
      if (!chunk.embedding || chunk.embedding.length !== queryVector.length) {
        continue;
      }
      const vectorScore = cosineSimilarity(queryVector, chunk.embedding);

      // Keyword & Synonym term matching boost
      let keywordBonus = 0;
      const chunkNorm = (chunk.content + ' ' + chunk.sectionTitle + ' ' + chunk.sourceFile)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');

      let termHits = 0;
      for (const term of keyTerms) {
        if (chunkNorm.includes(term)) {
          termHits++;
        }
      }
      if (keyTerms.length > 0) {
        keywordBonus = Math.min(0.35, (termHits / keyTerms.length) * 0.35);
      }

      const totalScore = vectorScore * 0.7 + keywordBonus;
      if (totalScore >= minScore) {
        matches.push({ chunk, score: totalScore });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  public getStats() {
    return {
      indexPath: this.indexPath,
      totalChunks: this.indexData.totalChunks || 0,
      updatedAt: this.indexData.updatedAt,
      model: this.indexData.model,
      dimensions: this.indexData.dimensions,
    };
  }

  public getChunks(): KnowledgeChunk[] {
    return this.indexData.chunks || [];
  }
}
