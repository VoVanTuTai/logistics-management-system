export class ChatRequestDto {
  message!: string;
  conversationId?: string;
  selectedShipmentCode?: string;
  senderRole?: 'CUSTOMER' | 'MERCHANT' | 'GUEST';
  userId?: string;
  userName?: string;
}

export class IngestTriggerDto {
  secretKey?: string;
}
