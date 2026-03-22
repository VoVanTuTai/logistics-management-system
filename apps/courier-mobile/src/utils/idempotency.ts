export function createIdempotencyKey(prefix: string): string {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `${prefix}:${Date.now()}:${randomSuffix}`;
}
