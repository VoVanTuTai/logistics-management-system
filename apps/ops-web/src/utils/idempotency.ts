export function createIdempotencyKey(prefix: string): string {
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now()}-${random}`;
}

