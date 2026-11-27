import { OrderDataDto } from './dto/chat-request.dto';
import { ActionChipDto, Citation, ShipmentCardDto } from '../rag/rag.types';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export type PendingIntentType =
  | 'PRICING'
  | 'CANCEL'
  | 'TRACKING'
  | 'CHANGE_ADDRESS'
  | 'REDELIVERY'
  | 'CLAIM'
  | 'CREATE_ORDER'
  | 'HOLD_AT_HUB'
  | 'CHANGE_CONSIGNEE';

export interface ChatPendingData {
  fromCity?: string;
  toCity?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  newAddress?: string;
  preferredTime?: string;
  pickupTime?: string;
  newReceiverName?: string;
  newReceiverPhone?: string;
  claimReason?: string;
}

export interface ShipmentContextSummary {
  code: string;
  itemName?: string;
  status?: string;
  statusText?: string;
  codAmount?: number;
  weightKg?: number;
  isVerified: boolean;
}

export interface ChatSessionContext {
  history: ChatHistoryMessage[];
  lastShipments?: any[];
  selectedCode?: string;
  lastShipmentSummary?: ShipmentContextSummary;
  receiverPhone?: string;
  pendingIntent?: PendingIntentType;
  pendingData?: ChatPendingData;
  pendingOrderData?: OrderDataDto;
  lastUpdated: number;
}

export type StructuredIntentName =
  | 'TRACK_SHIPMENT'
  | 'FOLLOW_UP_SHIPMENT'
  | 'LIST_USER_SHIPMENTS'
  | 'CALCULATE_PRICING'
  | 'RETURN_FEE'
  | 'CANCEL_SHIPMENT'
  | 'CHANGE_ADDRESS'
  | 'CHANGE_CONSIGNEE'
  | 'SCHEDULE_REDELIVERY'
  | 'HOLD_AT_HUB'
  | 'AUDIT_DELIVERY_ATTEMPT'
  | 'TRACK_CLAIM'
  | 'CREATE_ORDER'
  | 'ESCALATE_HUMAN'
  | 'STORAGE_AGING_POLICY'
  | 'WAYBILL_FORMAT_POLICY'
  | 'USER_IDENTITY'
  | 'GREETING'
  | 'OUT_OF_DOMAIN'
  | 'KNOWLEDGE_RAG';

export interface StructuredIntentResult {
  intent: StructuredIntentName;
  confidence: number;
  params: Record<string, any>;
  source: 'explicit-action' | 'llm-tool-calling' | 'llm-json-router' | 'deterministic-fallback';
  reasoning?: string;
}

export interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface GuardrailEvaluation {
  violated: boolean;
  category?:
    | 'PROHIBITED_GOODS'
    | 'OVER_PHYSICAL_CEILING'
    | 'TIER2_CEILING_INQUIRY'
    | 'FORCE_PAYOUT'
    | 'SECURITY_OWASP';
  toolsUsed: string[];
  toolContext: string;
  actionChips?: ActionChipDto[];
  normalizedQ: string;
  cleanNormalizedQ: string;
  maxWeightKg: number;
  maxSingleDimCm: number;
  maxSumDimsCm: number;
}

export interface OrchestrationResult {
  toolsUsed: string[];
  toolAugmentedContext: string;
  citations: Citation[];
  shipmentCards?: ShipmentCardDto[];
  actionChips?: ActionChipDto[];
  orderFormRequested?: boolean;
  orderConfirmation?: OrderDataDto;
  sessionPatch: Partial<ChatSessionContext>;
  skipRag?: boolean;
  /** Used when intent is purely informational and RAG should run in parallel/sequence */
  shouldRunRag?: boolean;
  ragQuery?: string;
}

export interface OrderCreationState {
  action?: 'OPEN_ORDER_FORM' | 'SUBMIT_ORDER_FORM' | 'CONFIRM_ORDER' | 'CANCEL_ORDER';
}
