export interface KnowledgeChunk {
  id: string;
  sourceFile: string;
  sectionTitle: string;
  level: number;
  content: string;
  charCount: number;
  tokenEstimate: number;
  embedding?: number[];
}

export interface SearchMatch {
  chunk: KnowledgeChunk;
  score: number;
}

export interface VectorIndexData {
  version: string;
  updatedAt: string;
  model: string;
  dimensions: number;
  totalChunks: number;
  chunks: KnowledgeChunk[];
}

export interface Citation {
  file: string;
  title: string;
  score: number;
  snippet: string;
}

export interface ChatResponseDto {
  conversationId: string;
  question: string;
  answer: string;
  citations: Citation[];
  toolsUsed: string[];
  latencyMs: number;
}
