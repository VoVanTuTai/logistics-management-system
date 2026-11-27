import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RagModule } from '../rag/rag.module';
import { ToolsModule } from '../tools/tools.module';
import { ChatSessionService } from './session/chat-session.store';
import { CarrierGuardrailsService } from './guardrails/carrier-guardrails.service';
import { LlmClientService } from './llm/llm-client.service';
import { IntentRouterService } from './router/intent-router.service';
import { QueryRewriterService } from './router/query-rewriter.service';
import { LogisticsOrchestratorService } from './handlers/logistics-orchestrator.service';
import { ResponseFormatterService } from './formatting/response-formatter.service';
import { SupervisorAgent } from './agents/supervisor.agent';
import { OperationAgent } from './agents/operation.agent';
import { KnowledgeAgent } from './agents/knowledge.agent';
import { ValidationAgent } from './agents/validation.agent';
import { HmasGraphOrchestrator } from './agents/hmas-graph.orchestrator';

@Module({
  imports: [RagModule, ToolsModule],
  controllers: [ChatController],
  providers: [
    ChatSessionService,
    CarrierGuardrailsService,
    LlmClientService,
    QueryRewriterService,
    IntentRouterService,
    LogisticsOrchestratorService,
    ResponseFormatterService,
    SupervisorAgent,
    OperationAgent,
    KnowledgeAgent,
    ValidationAgent,
    HmasGraphOrchestrator,
    ChatService,
  ],
  exports: [ChatService, ChatSessionService, HmasGraphOrchestrator],
})
export class ChatModule {}
