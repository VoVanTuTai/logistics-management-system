export class ChatRequestDto {
  message!: string;
  conversationId?: string;
  senderRole?: 'CUSTOMER' | 'MERCHANT' | 'GUEST';
  userId?: string;
}

export class IngestTriggerDto {
  secretKey?: string;
}
