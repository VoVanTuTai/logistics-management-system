import { ActionChipDto, Citation, ShipmentCardDto } from '../../rag/rag.types';
import {
  ChatSessionContext,
  GuardrailEvaluation,
  StructuredIntentResult,
} from '../chat.types';
import { ChatRequestDto, OrderDataDto } from '../dto/chat-request.dto';
import { GraphStepTrace } from './state-graph.engine';

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

/**
 * Shared state passed across autonomous agents inside the HMAS StateGraph.
 */
export interface HmasAgentState {
  conversationId: string;
  dto: ChatRequestDto;
  question: string;
  isGuest: boolean;
  userDisplayName: string;
  session: ChatSessionContext;

  // Stage 0 Safety Guardrails
  guardrail?: GuardrailEvaluation;

  // Supervisor Planning & Intent Routing
  routedIntent?: StructuredIntentResult;
  plan?: SupervisorExecutionPlan;

  // Worker Outputs
  operationContext: string;
  knowledgeContext: string;
  rewrittenQuery?: string;
  citations: Citation[];
  toolsUsed: string[];
  shipmentCards?: ShipmentCardDto[];
  actionChips?: ActionChipDto[];
  orderFormRequested?: boolean;
  orderConfirmation?: OrderDataDto;
  sessionPatch: Partial<ChatSessionContext>;

  // Draft & Validation Reflection Loop
  draftAnswer: string;
  agentModelUsed: string;
  llmStatusNote: string;
  validation?: ValidationCritique;
  reflectionCount: number;

  // Graph Telemetry
  handoffs: string[];
  graphTrace?: GraphStepTrace[];
}
