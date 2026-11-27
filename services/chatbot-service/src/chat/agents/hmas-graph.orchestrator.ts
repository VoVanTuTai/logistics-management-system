import { Injectable, Logger } from '@nestjs/common';
import { ChatResponseDto } from '../../rag/rag.types';
import { ChatSessionContext } from '../chat.types';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ResponseFormatterService } from '../formatting/response-formatter.service';
import { CarrierGuardrailsService } from '../guardrails/carrier-guardrails.service';
import { HmasAgentState } from './hmas.state';
import { KnowledgeAgent } from './knowledge.agent';
import { OperationAgent } from './operation.agent';
import { GRAPH_END, StateGraph, CompiledStateGraph } from './state-graph.engine';
import { SupervisorAgent } from './supervisor.agent';
import { ValidationAgent } from './validation.agent';

export interface GraphExecutionOutput {
  response: ChatResponseDto;
  sessionPatch: Partial<ChatSessionContext>;
  modelSummary: string;
  handoffs: string[];
  graphTrace: NonNullable<HmasAgentState['graphTrace']>;
}

/**
 * Compiles and executes the genuine Heterogeneous Multi-Agent StateGraph (HMAS):
 *   stage0_guardrail ─(violated)─────────────────────────▶ supervisor_synthesize ─▶ validation_gate
 *                    └(safe)─▶ supervisor_plan
 *                                 ├─(OPERATION)──▶ operation_agent
 *                                 │                    ├─(handoff)──▶ knowledge_agent ─▶ supervisor_synthesize
 *                                 │                    └─(direct)───────────────────────▶ validation_gate
 *                                 ├─(KNOWLEDGE)──▶ knowledge_agent ─────────────────────▶ validation_gate
 *                                 └─(SUPERVISOR)─▶ supervisor_synthesize ───────────────▶ validation_gate
 *                                                                                            │ (rejected & reflectionCount <= 1)
 *                                                                                            └─▶ supervisor_synthesize
 */
@Injectable()
export class HmasGraphOrchestrator {
  private readonly logger = new Logger(HmasGraphOrchestrator.name);
  private readonly compiledGraph: CompiledStateGraph<HmasAgentState>;

  constructor(
    private readonly guardrails: CarrierGuardrailsService,
    private readonly supervisorAgent: SupervisorAgent,
    private readonly operationAgent: OperationAgent,
    private readonly knowledgeAgent: KnowledgeAgent,
    private readonly validationAgent: ValidationAgent,
    private readonly formatter: ResponseFormatterService,
  ) {
    this.compiledGraph = this.buildGraph();
  }

  private buildGraph(): CompiledStateGraph<HmasAgentState> {
    const graph = new StateGraph<HmasAgentState>();

    graph.addNode('stage0_guardrail', async (state) => {
      const guardrail = this.guardrails.evaluateStage0(state.question);
      return {
        guardrail,
        toolsUsed: [...state.toolsUsed, ...guardrail.toolsUsed],
        operationContext: guardrail.toolContext,
        actionChips: guardrail.actionChips,
        handoffs: guardrail.violated
          ? [...state.handoffs, `STAGE0_GUARDRAIL(${guardrail.category}) -> SUPERVISOR_SYNTHESIS`]
          : [...state.handoffs, 'STAGE0_GUARDRAIL(PASS) -> SUPERVISOR_PLAN'],
      };
    });

    graph.addNode('supervisor_plan', (state) => this.supervisorAgent.planNode(state));
    graph.addNode('operation_agent', (state) => this.operationAgent.execute(state));
    graph.addNode('knowledge_agent', (state) => this.knowledgeAgent.execute(state));
    graph.addNode('supervisor_synthesize', (state) => this.supervisorAgent.synthesizeNode(state));
    graph.addNode('validation_gate', (state) => this.validationAgent.execute(state));

    graph.setEntryPoint('stage0_guardrail');

    graph.addConditionalEdges('stage0_guardrail', (state) =>
      state.guardrail?.violated ? 'supervisor_synthesize' : 'supervisor_plan',
    );

    graph.addConditionalEdges('supervisor_plan', (state) => {
      switch (state.plan?.primaryAgent) {
        case 'OPERATION_AGENT':
          return 'operation_agent';
        case 'KNOWLEDGE_AGENT':
          return 'knowledge_agent';
        default:
          return 'supervisor_synthesize';
      }
    });

    graph.addConditionalEdges('operation_agent', (state) =>
      state.plan?.handoffToKnowledge ? 'knowledge_agent' : 'validation_gate',
    );

    graph.addConditionalEdges('knowledge_agent', (state) =>
      state.operationContext && !state.draftAnswer ? 'supervisor_synthesize' : 'validation_gate',
    );

    graph.addEdge('supervisor_synthesize', 'validation_gate');

    // Validation Gatekeeper with bounded 1-hop Reflection Self-Correction Loop
    graph.addConditionalEdges('validation_gate', (state) => {
      if (state.validation && !state.validation.approved && state.reflectionCount <= 1) {
        return 'supervisor_synthesize';
      }
      return GRAPH_END;
    });

    return graph.compile(10);
  }

  async run(
    dto: ChatRequestDto,
    conversationId: string,
    session: ChatSessionContext,
  ): Promise<GraphExecutionOutput> {
    const startTime = Date.now();
    const question = (dto.message || '').trim();
    const isGuest = (!dto.userId && !dto.userName) || dto.senderRole === 'GUEST';
    const userDisplayName = dto.userName || dto.userId || 'Quý khách';

    const initialState: HmasAgentState = {
      conversationId,
      dto,
      question,
      isGuest,
      userDisplayName,
      session,
      operationContext: '',
      knowledgeContext: '',
      citations: [],
      toolsUsed: [],
      sessionPatch: {},
      draftAnswer: '',
      agentModelUsed: 'HMAS-StateGraph',
      llmStatusNote: 'Pending',
      reflectionCount: 0,
      handoffs: [],
      graphTrace: [],
    };

    const finalState = await this.compiledGraph.invoke(initialState);

    const fullContext = [
      finalState.operationContext
        ? `=== DỮ LIỆU THỜI GIAN THỰC TỪ HỆ THỐNG LOGISTICS ===\n${finalState.operationContext}`
        : '',
      finalState.knowledgeContext
        ? `=== TÀI LIỆU QUY CHUẨN NGHIỆP VỤ (KNOWLEDGE BASE) ===\n${finalState.knowledgeContext}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    let answer = finalState.draftAnswer;
    if (!answer) {
      answer = this.formatter.generateOfflineDemoAnswer(question, fullContext, finalState.citations);
    }
    answer = this.formatter.cleanBotFormatting(answer);

    const pathSummary = (finalState.graphTrace || []).map((t) => t.node).join(' -> ');
    this.logger.log(
      `HMAS StateGraph [${conversationId}] path=[${pathSummary}] handoffs=[${finalState.handoffs.join(' | ')}] model=${finalState.agentModelUsed} latency=${Date.now() - startTime}ms`,
    );

    return {
      response: {
        conversationId,
        question,
        answer,
        citations: finalState.citations,
        toolsUsed: finalState.toolsUsed,
        shipmentCards: finalState.shipmentCards,
        actionChips: finalState.actionChips,
        orderFormRequested: finalState.orderFormRequested,
        orderConfirmation: finalState.orderConfirmation,
        latencyMs: Date.now() - startTime,
      },
      sessionPatch: finalState.sessionPatch,
      modelSummary: `${finalState.agentModelUsed} (${finalState.llmStatusNote})`,
      handoffs: finalState.handoffs,
      graphTrace: finalState.graphTrace || [],
    };
  }
}
