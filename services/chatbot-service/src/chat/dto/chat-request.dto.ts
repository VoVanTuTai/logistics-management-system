export class ChatRequestDto {
  message!: string;
  conversationId?: string;
  selectedShipmentCode?: string;
  receiverPhone?: string;
  senderRole?: 'CUSTOMER' | 'MERCHANT' | 'GUEST';
  userId?: string;
  userName?: string;
}

export class IngestTriggerDto {
  secretKey?: string;
}
