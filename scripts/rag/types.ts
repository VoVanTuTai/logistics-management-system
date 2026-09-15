export interface KnowledgeChunk {
  id: string;
  sourceFile: string;
  sectionTitle: string;
  content: string;
  wordCount: number;
  embedding?: number[];
}

export interface SearchMatch {
  chunk: KnowledgeChunk;
  score: number; // Cosine similarity: 0.0 -> 1.0
}

export interface VectorIndexData {
  version: string;
  updatedAt: string;
  model: string;
  dimensions: number;
  totalChunks: number;
  chunks: KnowledgeChunk[];
}

export interface RagResponse {
  question: string;
  answer: string;
  citations: {
    sourceFile: string;
    sectionTitle: string;
    score: number;
  }[];
  contextChunksUsed: number;
}
