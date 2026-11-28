import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { ChatResponseDto } from '../../rag/rag.types';
import { ChatSessionContext } from '../chat.types';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ResponseFormatterService } from '../formatting/response-formatter.service';
import { CarrierGuardrailsService } from '../guardrails/carrier-guardrails.service';
import {
  GraphStepTrace,
  HmasAgentState,
  HmasAgentStateUpdate,
  HmasStateAnnotation,
} from './hmas.state';
import { KnowledgeAgent } from './knowledge.agent';
import { OperationAgent } from './operation.agent';
import { SupervisorAgent } from './supervisor.agent';
import { ValidationAgent } from './validation.agent';

export interface GraphExecutionOutput {
  response: ChatResponseDto;
  sessionPatch: Partial<ChatSessionContext>;
  modelSummary: string;
  handoffs: string[];
  graphTrace: GraphStepTrace[];
}

/**
 * Genuine LangGraph StateGraph Orchestrator for Heterogeneous Multi-Agent System (HMAS).
 * Backed by LangGraph cyclic computational graph with formal State Annotation, Reducers,
 * MemorySaver checkpointer, and Reflexion self-correction loop (Shinn et al., NeurIPS 2023).
 *
 * Graph Topology:
 *   START ─▶ stage0_guardrail ─(violated)─────────────────────────▶ supervisor_synthesize ─▶ validation_gate
 *                             └(safe)─▶ supervisor_plan
 *                                          ├─(OPERATION)──▶ operation_agent
 *                                          │                    ├─(handoff)──▶ knowledge_agent ─▶ supervisor_synthesize
 *                                          │                    └─(direct)───────────────────────▶ validation_gate
 *                                          ├─(KNOWLEDGE)──▶ knowledge_agent ─────────────────────▶ validation_gate
 *                                          └─(SUPERVISOR)─▶ supervisor_synthesize ───────────────▶ validation_gate
 *                                                                                                     │ (rejected & reflection <= 1)
 *                                                                                                     └─▶ supervisor_synthesize
 */
@Injectable()
export class HmasGraphOrchestrator {
  private readonly logger = new Logger(HmasGraphOrchestrator.name);
  private readonly compiledGraph: any;

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

  private wrapNode(
    name: string,
    fn: (state: HmasAgentState) => Promise<Partial<HmasAgentState>> | Partial<HmasAgentState>,
  ) {
    return async (state: HmasAgentState): Promise<Partial<HmasAgentStateUpdate>> => {
      const startTime = Date.now();
      const patch = await fn(state);
      const latencyMs = Date.now() - startTime;
      const hop = (state.graphTrace || []).length + 1;
      const step: GraphStepTrace = {
        node: name,
        next: '',
        latencyMs,
        hop,
      };
      return {
        ...(patch || {}),
        graphTrace: [step],
      };
    };
  }

  private buildGraph() {
    const checkpointer = new MemorySaver();

    return new StateGraph(HmasStateAnnotation)
      .addNode(
        'stage0_guardrail',
        this.wrapNode('stage0_guardrail', async (state) => {
          const guardrail = this.guardrails.evaluateStage0(state.question);
          return {
            guardrail,
            toolsUsed: guardrail.toolsUsed,
            operationContext: guardrail.toolContext,
            actionChips: guardrail.actionChips,
            handoffs: guardrail.violated
              ? [`STAGE0_GUARDRAIL(${guardrail.category}) -> SUPERVISOR_SYNTHESIS`]
              : ['STAGE0_GUARDRAIL(PASS) -> SUPERVISOR_PLAN'],
          };
        }),
      )
      .addNode(
        'supervisor_plan',
        this.wrapNode('supervisor_plan', (state) => this.supervisorAgent.planNode(state)),
      )
      .addNode(
        'operation_agent',
        this.wrapNode('operation_agent', (state) => this.operationAgent.execute(state)),
      )
      .addNode(
        'knowledge_agent',
        this.wrapNode('knowledge_agent', (state) => this.knowledgeAgent.execute(state)),
      )
      .addNode(
        'supervisor_synthesize',
        this.wrapNode('supervisor_synthesize', (state) =>
          this.supervisorAgent.synthesizeNode(state),
        ),
      )
      .addNode(
        'validation_gate',
        this.wrapNode('validation_gate', (state) => this.validationAgent.execute(state)),
      )
      .addEdge(START, 'stage0_guardrail')
      .addConditionalEdges('stage0_guardrail', (state: HmasAgentState) =>
        state.guardrail?.violated ? 'supervisor_synthesize' : 'supervisor_plan',
      )
      .addConditionalEdges('supervisor_plan', (state: HmasAgentState) => {
        switch (state.plan?.primaryAgent) {
          case 'OPERATION_AGENT':
            return 'operation_agent';
          case 'KNOWLEDGE_AGENT':
            return 'knowledge_agent';
          default:
            return 'supervisor_synthesize';
        }
      })
      .addConditionalEdges('operation_agent', (state: HmasAgentState) =>
        state.plan?.handoffToKnowledge ? 'knowledge_agent' : 'validation_gate',
      )
      .addConditionalEdges('knowledge_agent', (state: HmasAgentState) =>
        state.operationContext && !state.draftAnswer ? 'supervisor_synthesize' : 'validation_gate',
      )
      .addEdge('supervisor_synthesize', 'validation_gate')
      .addConditionalEdges('validation_gate', (state: HmasAgentState) => {
        if (state.validation && !state.validation.approved && state.reflectionCount <= 1) {
          return 'supervisor_synthesize';
        }
        return END;
      })
      .compile({ checkpointer });
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

    const initialUpdate: HmasAgentStateUpdate = {
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
      agentModelUsed: 'HMAS-LangGraph',
      llmStatusNote: 'Pending',
      reflectionCount: 0,
      handoffs: [],
      graphTrace: [],
    };

    const finalState = (await this.compiledGraph.invoke(initialUpdate, {
      configurable: { thread_id: conversationId },
      recursionLimit: 12,
    })) as HmasAgentState;

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
      `HMAS LangGraph [${conversationId}] path=[${pathSummary}] handoffs=[${finalState.handoffs.join(' | ')}] model=${finalState.agentModelUsed} latency=${Date.now() - startTime}ms`,
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
        claimFormRequested: finalState.claimFormRequested,
        claimFormData: finalState.claimFormData,
        latencyMs: Date.now() - startTime,
      },
      sessionPatch: finalState.sessionPatch,
      modelSummary: `${finalState.agentModelUsed} (${finalState.llmStatusNote})`,
      handoffs: finalState.handoffs,
      graphTrace: finalState.graphTrace || [],
    };
  }
}
