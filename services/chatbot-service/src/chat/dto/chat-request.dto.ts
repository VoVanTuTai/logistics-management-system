export class OrderDataDto {
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderCity?: string;
  senderDistrict?: string;
  senderWard?: string;
  senderHubCode?: string;
  senderHubName?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  receiverCity?: string;
  receiverDistrict?: string;
  receiverWard?: string;
  receiverHubCode?: string;
  receiverHubName?: string;
  itemName?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  codAmount?: number;
  payer?: 'SENDER' | 'RECEIVER';
  shippingFee?: number;
  notes?: string;
}

export class ChatHistoryTurnDto {
  role!: 'user' | 'assistant';
  content!: string;
  timestamp?: number;
}

export class ClaimDataDto {
  shipmentCode!: string;
  customerName?: string;
  customerPhone?: string;
  category?: string;
  priority?: string;
  title?: string;
  description!: string;
  assignedHubCode?: string;
  assignedHubName?: string;
  images?: Array<{
    fileName?: string;
    url?: string;
    fileSizeBytes?: number;
    type?: string;
  }>;
}

export class ChatRequestDto {
  message!: string;
  conversationId?: string;
  selectedShipmentCode?: string;
  receiverPhone?: string;
  userPhone?: string;
  senderRole?: 'CUSTOMER' | 'MERCHANT' | 'GUEST';
  userId?: string;
  userName?: string;
  action?:
    | 'OPEN_ORDER_FORM'
    | 'SUBMIT_ORDER_FORM'
    | 'CONFIRM_ORDER'
    | 'CANCEL_ORDER'
    | 'OPEN_CLAIM_FORM'
    | 'SUBMIT_CLAIM_TICKET';
  orderData?: OrderDataDto;
  claimData?: ClaimDataDto;
  /** Optional fallback history from UI client if server session restarted */
  history?: ChatHistoryTurnDto[];
}

export class IngestTriggerDto {
  secretKey?: string;
}

