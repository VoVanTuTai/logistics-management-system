export interface AuthConfig {
  port: number;
  databaseUrl: string;
  domainEventsExchange: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
}

export function getAuthConfig(): AuthConfig {
  return {
    port: Number(process.env.PORT ?? 3010),
    databaseUrl: process.env.DATABASE_URL ?? '',
    domainEventsExchange: process.env.DOMAIN_EVENTS_EXCHANGE ?? 'domain.events',
    accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900),
    refreshTokenTtlSeconds: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 2_592_000),
  };
}
