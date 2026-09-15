import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ChunkerService } from './chunker.service';
import { VectorStoreService } from './vector-store.service';
import { KnowledgeService } from './knowledge.service';

@Module({
  providers: [
    EmbeddingService,
    ChunkerService,
    VectorStoreService,
    KnowledgeService,
  ],
  exports: [
    EmbeddingService,
    ChunkerService,
    VectorStoreService,
    KnowledgeService,
  ],
})
export class RagModule {}
