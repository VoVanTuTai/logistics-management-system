import { Annotation } from '@langchain/langgraph';
import { ActionChipDto, Citation, ShipmentCardDto } from '../../rag/rag.types';
import {
  ChatSessionContext,
  GuardrailEvaluation,
  StructuredIntentResult,
} from '../chat.types';
import { ChatRequestDto, OrderDataDto } from '../dto/chat-request.dto';

export type AgentRouteTarget =
  | 'OPERATION_AGENT'
  | 'KNOWLEDGE_AGENT'
  | 'SUPERVISOR_AGENT';

export interface SupervisorExecutionPlan {
  primaryAgent: AgentRouteTarget;
  handoffToKnowledge: boolean;
  requiresValidationReflection: boolean;
  routingReason: string;
}

export interface ValidationCritique {
  approved: boolean;
  issues: string[];
  modelUsed: string;
  safetyReason?: string;
}

export interface GraphStepTrace {
  node: string;
  next: string;
  latencyMs: number;
  hop: number;
}

/**
 * Shared state passed across autonomous agents inside the HMAS StateGraph.
 */
export type HmasAgentState = typeof HmasStateAnnotation.State;
export type HmasAgentStateUpdate = Partial<HmasAgentState>;

/**
 * Formal LangGraph State Annotation Schema for Heterogeneous Multi-Agent System (HMAS).
 * Provides strongly-typed channels and deterministic state reducers compliant with LangGraph runtime.
 */
export const HmasStateAnnotation = Annotation.Root({
  conversationId: Annotation<string>(),
  dto: Annotation<ChatRequestDto>(),
  question: Annotation<string>(),
  isGuest: Annotation<boolean>(),
  userDisplayName: Annotation<string>(),
  session: Annotation<ChatSessionContext>(),

  // Stage 0 Safety Guardrails
  guardrail: Annotation<GuardrailEvaluation | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),

  // Supervisor Planning & Intent Routing
  routedIntent: Annotation<StructuredIntentResult | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  plan: Annotation<SupervisorExecutionPlan | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),

  // Worker Contexts
  operationContext: Annotation<string>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => '',
  }),
  knowledgeContext: Annotation<string>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => '',
  }),
  rewrittenQuery: Annotation<string | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  citations: Annotation<Citation[]>({
    reducer: (curr, update) => {
      const combined = [...(curr || []), ...(update || [])];
      const seen = new Set<string>();
      return combined.filter((c) => {
        const key = `${c.title}-${c.file || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    default: () => [],
  }),
  toolsUsed: Annotation<string[]>({
    reducer: (curr, update) => Array.from(new Set([...(curr || []), ...(update || [])])),
    default: () => [],
  }),
  shipmentCards: Annotation<ShipmentCardDto[] | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  actionChips: Annotation<ActionChipDto[] | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  orderFormRequested: Annotation<boolean | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  orderConfirmation: Annotation<OrderDataDto | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  claimFormRequested: Annotation<boolean | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  claimFormData: Annotation<any | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  sessionPatch: Annotation<Partial<ChatSessionContext>>({
    reducer: (curr, update) => ({ ...(curr || {}), ...(update || {}) }),
    default: () => ({}),
  }),

  // Draft Generation & Reflexion Self-Correction Loop
  draftAnswer: Annotation<string>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => '',
  }),
  agentModelUsed: Annotation<string>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 'HMAS-LangGraph',
  }),
  llmStatusNote: Annotation<string>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 'Pending',
  }),
  validation: Annotation<ValidationCritique | undefined>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => undefined,
  }),
  reflectionCount: Annotation<number>({
    reducer: (curr, update) => (update !== undefined ? update : curr),
    default: () => 0,
  }),

  // Graph Execution Telemetry
  handoffs: Annotation<string[]>({
    reducer: (curr, update) => {
      const combined = [...(curr || []), ...(update || [])];
      return combined.filter((v, idx) => combined.indexOf(v) === idx);
    },
    default: () => [],
  }),
  graphTrace: Annotation<GraphStepTrace[]>({
    reducer: (curr, update) => [...(curr || []), ...(update || [])],
    default: () => [],
  }),
});
