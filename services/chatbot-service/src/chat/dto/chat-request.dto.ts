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

export class ChatRequestDto {
  message!: string;
  conversationId?: string;
  selectedShipmentCode?: string;
  receiverPhone?: string;
  userPhone?: string;
  senderRole?: 'CUSTOMER' | 'MERCHANT' | 'GUEST';
  userId?: string;
  userName?: string;
  action?: 'OPEN_ORDER_FORM' | 'SUBMIT_ORDER_FORM' | 'CONFIRM_ORDER' | 'CANCEL_ORDER';
  orderData?: OrderDataDto;
}

export class IngestTriggerDto {
  secretKey?: string;
}

